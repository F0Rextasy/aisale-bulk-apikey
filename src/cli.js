#!/usr/bin/env node
'use strict';

/**
 * aisale-bulk-apikey CLI — mint aisale.best ("Best AI", a Go + Vue gateway)
 * accounts, one API key per account, and keep only the keys that survived a live
 * chat call + a tool call.
 *
 * The whole panel is protocol-side — no browser, no captcha. Its public settings
 * answer `turnstile_enabled:false`, `aliyun_captcha_enabled:false` and an e-mail
 * suffix allow-list, and the sign-up flow is two requests:
 *
 *   1. mailbox    Emailnator `POST /api/generate-email` → a fresh @gmail.com
 *                 (registered in the dot-free plain form; the panel's own
 *                 allow-list is qq/gmail/163/126/yeah/foxmail/sina/sohu/aliyun/
 *                 icloud/yahoo/proton, so a gmail is the easy rail)
 *   2. send code  `POST /api/v1/auth/send-verify-code` {email} — 6-digit code,
 *                 60 s resend countdown
 *   3. code       poll Emailnator (`/api/message-list` → `/api/message/<id>`)
 *   4. register   `POST /api/v1/auth/register` {email,password,verify_code}
 *                 (the field is literally `verify_code`; the browser view that
 *                 sends it is assets/EmailVerifyView-*.js) → {access_token,…}
 *   5. key        `GET /api/v1/groups/available` → first group id, then
 *                 `POST /api/v1/keys` {name,group_id,status:'active'} → `sk-…`
 *   6. gate       two different prompts on a FREE model (both 200, non-empty,
 *                 different) and a `get_time` tool call
 *
 * A key is appended to `keys.txt` only after step 6 passes; a key that never
 * passes is recorded in `accounts.json` and retried on the next run.
 *
 * Options:
 *   --count N        accounts (= keys) to mint                                [5]
 *   --conc N         accounts in flight at once, max 8                        [1]
 *   --gap MS         pause between accounts                                   [1500]
 *   --model <id>     model used for the live gate              [codex-auto-review]
 *   --group <id>     group id for the key (default: first from /groups/available)
 *   --pool <file>    proxy list, one exit per line (env AISALE_PROXIES)  [optional]
 *   --proxy <url>    a single exit for everything                         [optional]
 *   --tries N        exits tried per account before giving up                   [2]
 *   --timeout MS     per-request timeout                                     [60000]
 *   --verify-only    re-run every key in keys.txt through the gate
 *   --screen         only test the proxy list against aisale.best
 *   --help
 *
 * Zero dependencies. Node.js >= 18. Your proxy list is OPTIONAL: pass --pool
 * (or the AISALE_PROXIES env) and every request goes through an exit from it;
 * without a pool the tool connects directly.
 */

const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');
const http = require('http');
const crypto = require('crypto');

const ROOT = path.basename(__dirname) === 'src' ? path.resolve(__dirname, '..') : __dirname;
const KEYS_FILE = path.join(ROOT, 'keys.txt');
const ACCOUNTS_FILE = path.join(ROOT, 'accounts.json');
const OUT_DIR = path.join(ROOT, 'out');

const BASE = process.env['AISALE_BASE'] || 'https://aisale.best';
const API = `${BASE}/api/v1`;
const EMAILNATOR = 'https://www.emailnator.com';
const TEMPTF = 'https://temp.tf';
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';

// ------------------------------------------------------------------- options
const argv = process.argv.slice(2);
function arg(name, dflt) {
  const eq = argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = argv.indexOf(`--${name}`);
  if (i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('--')) return argv[i + 1];
  return dflt;
}
const has = (name) => argv.includes(`--${name}`) || argv.includes(`-${name}`);

if (has('help') || has('h')) {
  console.log(`aisale-bulk-apikey — mint aisale.best accounts, one key each, verified by a live chat + tool call.

  node src/cli.js --count 5          mint (a key is kept only after the gate passes)
  node src/cli.js --verify-only      re-check every key in keys.txt
  node src/cli.js --screen           test your proxy list against aisale.best
  node src/cli.js --help

  --count N      accounts to mint                                         [5]
  --conc N       accounts in flight (max 8)                               [1]
  --model <id>   model used for the live gate               [codex-auto-review]
  --group <id>   group id for the key (default: first available group)
  --pool <file>  proxy list, one exit per line (env AISALE_PROXIES)  [optional]

Requests go through your proxy list when one is provided (--pool / env).
Without a pool the tool connects directly.`);
  process.exit(0);
}

const COUNT = Math.max(1, parseInt(arg('count', '5'), 10) || 5);
const CONC = Math.min(8, Math.max(1, parseInt(arg('conc', '1'), 10) || 1));
const GAP_MS = Math.max(0, parseInt(arg('gap', '1500'), 10) || 0);
const TRIES = Math.max(1, parseInt(arg('tries', '2'), 10) || 2);
const TIMEOUT_MS = Math.max(5000, parseInt(arg('timeout', '60000'), 10) || 60000);
const MODEL = arg('model', 'codex-auto-review');
const GROUP = arg('group', '');
const FIXED = arg('proxy', '');
const VERIFY_ONLY = has('verify-only');
const SCREEN = has('screen');
const MAIL = String(arg('mail', 'temptf')).toLowerCase();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(OUT_DIR, { recursive: true });
const log = (...a) => console.log(`[${new Date().toISOString().slice(11, 19)}]`, ...a);
const randPass = () => `As${crypto.randomBytes(6).toString('base64url')}9!`;

// ------------------------------------------------------------------- proxy
function parseProxy(line) {
  const s = String(line || '').trim().split(/\s+/)[0];
  if (!s || s.startsWith('#')) return null;
  let m = s.match(/^(https?|socks5h?|socks4):\/\/(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)/i);
  if (!m) m = s.match(/^(?:([^:@/]+):([^@/]+)@)?([^:/]+):(\d+)$/);
  if (!m) return null;
  if (m.length === 6) {
    const raw = m[1].toLowerCase();
    if (raw === 'socks4') return null;
    const protocol = raw.startsWith('socks') ? 'socks5' : 'http';
    return { protocol, host: m[4], port: Number(m[5]), auth: m[2] ? `${m[2]}:${m[3]}` : null, line: s };
  }
  return { protocol: 'http', host: m[3], port: Number(m[4]), auth: m[1] ? `${m[1]}:${m[2]}` : null, line: s };
}

function directConnect(host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host, port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`connect timeout (${host}:${port})`)); }, timeoutMs);
    sock.once('error', (e) => { clearTimeout(t); try { sock.destroy(); } catch {} reject(new Error(`connect failed: ${e.message}`)); });
    sock.once('connect', () => { clearTimeout(t); resolve(sock); });
  });
}

function connectThrough(proxy, host, port, timeoutMs) {
  return new Promise((resolve, reject) => {
    const sock = net.connect({ host: proxy.host, port: proxy.port });
    const t = setTimeout(() => { sock.destroy(); reject(new Error(`proxy timeout (${proxy.host}:${proxy.port})`)); }, timeoutMs);
    const done = (err, s) => { clearTimeout(t); if (err) { try { sock.destroy(); } catch {} reject(err); } else resolve(s); };
    sock.once('error', (e) => done(new Error(`proxy connect failed: ${e.message}`)));
    sock.once('connect', () => {
      if (proxy.protocol === 'socks5') {
        sock.write(proxy.auth ? Buffer.from([5, 2, 0, 2]) : Buffer.from([5, 1, 0]));
        let stage = 0;
        let buf = Buffer.alloc(0);
        const sendConnect = () => {
          const hb = Buffer.from(host);
          sock.write(Buffer.concat([Buffer.from([5, 1, 0, 3, hb.length]), hb, Buffer.from([port >> 8, port & 0xff])]));
        };
        const onData = (d) => {
          try {
            buf = Buffer.concat([buf, d]);
            for (;;) {
              if (stage === 0) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[0] !== 5) return done(new Error('SOCKS5 bad version'));
                if (v[1] === 2) {
                  if (!proxy.auth) return done(new Error('SOCKS5 auth required'));
                  const [u, p] = proxy.auth.split(':');
                  sock.write(Buffer.concat([Buffer.from([1, u.length]), Buffer.from(u), Buffer.from([p.length]), Buffer.from(p)]));
                  stage = 1;
                  continue;
                }
                if (v[1] !== 0) return done(new Error('SOCKS5 no acceptable method'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 1) {
                if (buf.length < 2) return;
                const v = buf; buf = buf.slice(2);
                if (v[1] !== 0) return done(new Error('SOCKS5 auth failed'));
                stage = 2; sendConnect(); continue;
              }
              if (stage === 2) {
                if (buf.length < 5) return;
                const atyp = buf[3];
                const need = 4 + (atyp === 1 ? 4 : atyp === 3 ? 1 + buf[4] : 16) + 2;
                if (buf.length < need) return;
                const rep = buf[1]; buf = buf.slice(need);
                if (rep !== 0) return done(new Error(`SOCKS5 connect failed (code ${rep})`));
                sock.off('data', onData);
                return done(null, sock);
              }
            }
          } catch (e) { done(e); }
        };
        sock.on('data', onData);
        return;
      }
      const auth = proxy.auth ? `Proxy-Authorization: Basic ${Buffer.from(proxy.auth).toString('base64')}\r\n` : '';
      sock.write(`CONNECT ${host}:${port} HTTP/1.1\r\nHost: ${host}:${port}\r\n${auth}\r\n`);
      let buf = '';
      const onData = (d) => {
        buf += d;
        if (!buf.includes('\r\n\r\n')) return;
        sock.off('data', onData);
        if (!/^HTTP\/\d(\.\d)? 200/.test(buf)) return done(new Error(`proxy CONNECT refused: ${buf.split('\r\n')[0]}`));
        done(null, sock);
      };
      sock.on('data', onData);
    });
  });
}

/** One HTTPS request through one exit. Returns { status, headers, body }. */
async function exitFetch(proxy, url, { method = 'GET', headers = {}, body = null, timeoutMs = TIMEOUT_MS } = {}) {
  const u = new URL(url);
  const raw = proxy ? await connectThrough(proxy, u.hostname, u.port || 443, timeoutMs) : await directConnect(u.hostname, u.port || 443, timeoutMs);
  const sock = tls.connect({ socket: raw, servername: u.hostname });
  await new Promise((res, rej) => { sock.once('secureConnect', res); sock.once('error', rej); });
  const chunks = [];
  let resolve, reject;
  const p = new Promise((res, rej) => { resolve = res; reject = rej; });
  const req = http.request({
    method,
    path: u.pathname + u.search,
    createConnection: () => sock,
    headers: { host: u.host, 'user-agent': UA, accept: '*/*', ...headers },
  });
  const t = setTimeout(() => { try { req.destroy(); } catch {} reject(new Error('request timeout')); }, timeoutMs);
  req.on('response', (res) => {
    res.on('data', (c) => chunks.push(c));
    res.on('end', () => {
      clearTimeout(t);
      resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') });
    });
  });
  req.on('error', (e) => { clearTimeout(t); reject(e); });
  if (body != null) req.write(Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body)));
  req.end();
  return p;
}

// JSON or SSE (`text/event-stream`): the relay answers stream-shaped even with stream:false.
const J = (t) => {
  try { return JSON.parse(t); } catch {}
  const events = String(t).split(/\r?\n/).filter((l) => l.startsWith('data:'));
  if (!events.length) return null;
  let content = '', reasoning = '', finish = null, id = null, model = null;
  const toolCalls = [];
  for (const line of events) {
    const payload = line.slice(5).trim();
    if (!payload || payload === '[DONE]') continue;
    let j; try { j = JSON.parse(payload); } catch { continue; }
    id = id || j.id; model = model || j.model;
    const c = j.choices && j.choices[0];
    if (!c) continue;
    const d = c.delta || c.message || {};
    if (d.content) content += d.content;
    if (d.reasoning_content) reasoning += d.reasoning_content;
    else if (d.reasoning) reasoning += d.reasoning;
    for (const tc of d.tool_calls || []) {
      const i = tc.index || 0;
      toolCalls[i] = toolCalls[i] || { id: tc.id, function: { name: '', arguments: '' } };
      if (tc.function && tc.function.name) toolCalls[i].function.name = tc.function.name;
      if (tc.function && tc.function.arguments) toolCalls[i].function.arguments += tc.function.arguments;
    }
    if (c.finish_reason) finish = c.finish_reason;
  }
  const message = { content, reasoning_content: reasoning };
  if (toolCalls.length) message.tool_calls = toolCalls.filter(Boolean);
  return { id, model, choices: [{ message, finish_reason: finish }] };
};

async function exitJson(proxy, url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const body = opts.body;
  if (body != null && !Buffer.isBuffer(body)) headers['content-type'] = 'application/json';
  const r = await exitFetch(proxy, url, { ...opts, headers });
  return { status: r.status, json: J(r.body), text: r.body };
}

// ------------------------------------------------------------------- pool
function loadExits() {
  if (FIXED) return [parseProxy(FIXED)].filter(Boolean);
  const poolArg = arg('pool', process.env['AISALE_PROXIES'] || 'proxies.txt');
  const poolFile = fs.existsSync(path.resolve(poolArg)) ? path.resolve(poolArg) : path.resolve(ROOT, poolArg);
  if (!fs.existsSync(poolFile)) {
    console.log(`no proxy list at ${poolFile} — running WITHOUT a proxy (direct). Put exits there (or pass --pool) to route through them.`);
    return [null];
  }
  const exits = fs.readFileSync(poolFile, 'utf8').split(/\r?\n/).filter((l) => !l.trim().startsWith('#')).map(parseProxy).filter(Boolean);
  if (!exits.length) {
    console.log(`${poolFile} has no usable exits — running WITHOUT a proxy (direct).`);
    return [null];
  }
  return exits;
}

async function screen(exits) {
  let ok = 0;
  for (const e of exits.slice(0, 64)) {
    try {
      const t0 = Date.now();
      const r = await exitFetch(e, `${BASE}/setup/status`, { timeoutMs: 20000 });
      const good = r.status === 200 && /needs_setup/.test(r.body);
      if (good) ok++;
      console.log(`  ${good ? '✔' : '✘'} ${e ? `${e.host}:${e.port}` : 'direct'} status=${r.status} ${Date.now() - t0}ms`);
    } catch (err) {
      console.log(`  ✘ ${e ? `${e.host}:${e.port}` : 'direct'} ${String(err.message).slice(0, 80)}`);
    }
  }
  console.log(`screened ${Math.min(exits.length, 64)} exit(s): ${ok} reach ${BASE}`);
  return ok;
}

// ------------------------------------------------------------------- mail
// The panel normalises `+tag` **and** dots into the same address, so a dotted or
// plus-aliased gmail can only ever register one account (`409 EMAIL_EXISTS`).
// Emailnator hands out gmails whose **local part is genuinely different**, which
// the panel does see as separate addresses — so that is the default rail, and an
// address ledger (`out/used-gmail.txt`) is kept read-merged so a box is used once.
// temp.tf stays available (`--mail temptf`) for panels that refuse public boxes.
const LEDGER = path.join(OUT_DIR, 'used-gmail.txt');
function loadLedger() {
  try { return new Set(fs.readFileSync(LEDGER, 'utf8').split(/\r?\n/).map((s) => s.trim().toLowerCase()).filter(Boolean)); } catch { return new Set(); }
}
function noteUsed(address) {
  try { fs.appendFileSync(LEDGER, String(address).toLowerCase() + '\n'); } catch (e) { /* non-fatal */ }
}

async function newMailbox(exit) {
  const used = loadLedger();
  if (MAIL === 'temptf') {
    // The mailbox *base* is the identity that matters: the panel takes a plus
    // alias as its own address (that is how the first six keys registered), but a
    // base that already holds an account answers `409 EMAIL_EXISTS` for every one
    // of its aliases — so the base is what the ledger dedupes, and temp.tf is
    // asked again until it hands out one that has not been spent.
    for (let attempt = 0; attempt < 8; attempt++) {
      const r = await exitJson(exit, `${TEMPTF}/api/account?providers=gmail&dot=0&plus=1`);
      const address = String((r.json && r.json.email) || '').trim();
      if (!/@/.test(address)) throw new Error(`temp.tf account ${r.status}: ${String(r.text).slice(0, 120)}`);
      const base = address.split('@')[0].split('+')[0].toLowerCase();
      if (used.has(base)) continue;
      noteUsed(base);
      return { rail: 'temptf', plain: address };
    }
    throw new Error('temp.tf handed back only bases already spent (see out/used-gmail.txt)');
  }
  // The panel folds dots before it mails, so the code lands in the *stripped*
  // box, never the dotted one it was handed: measured 2026-10-23 through one
 // pinned exit (out probe, a plain gmail mailbox got the code on the plain
  // box while the dotted box held 0 panel mails for 90 s). So the stripped form
  // is what the panel is given and what Emailnator is polled for; the ledger
  // dedupes on the same stripped local because that is the panel's identity.
  for (let attempt = 0; attempt < 6; attempt++) {
    const r = await exitJson(exit, `${EMAILNATOR}/api/generate-email`, {
      method: 'POST',
      body: { ids: [3] },
      headers: { origin: EMAILNATOR, referer: `${EMAILNATOR}/` },
    });
    const dotted = r.json && r.json.email;
    if (!dotted || !/@gmail\.com$/i.test(dotted)) throw new Error(`emailnator generate ${r.status}: ${String(r.text).slice(0, 120)}`);
    const domain = dotted.split('@')[1].toLowerCase();
    const local = dotted.split('@')[0].replace(/\./g, '').toLowerCase();
    if (used.has(local)) continue;
    noteUsed(local);
    return { rail: 'emailnator', plain: `${local}@${domain}` };
  }
  throw new Error('emailnator handed back only already-used addresses (see out/used-gmail.txt)');
}

/** One inbox snapshot: [{id, from, subject, text}] — newest first as the rail returns it. */
async function inbox(exit, box) {
  try {
    const r = box.rail === 'temptf'
      ? await exitJson(exit, `${TEMPTF}/api/check`, { method: 'POST', body: { email: box.plain, wait: false } })
      : await exitJson(exit, `${EMAILNATOR}/api/message-list`, { method: 'POST', body: { email: box.plain, limit: 20 } });
    const rows = (r.json && (r.json.data || r.json.messages)) || [];
    const out = [];
    for (const m of rows) {
      const ts = Number(m.timestamp || m.ts || 0) || 0;
      const from = m.from || '', subject = m.subject || '';
      if (box.rail === 'temptf') {
        out.push({ id: String(m.id), ts, from, subject, text: `${subject} ${m.text || m.html || m.body || ''}` });
      } else if (!PANEL_MAIL.test(`${from} ${subject}`)) {
        // A public inbox carries other people's mail; one body fetch per row costs a round
        // trip each, so only the panel's own rows are pulled.
        out.push({ id: String(m.id), ts, from, subject, text: '' });
      } else {
        const full = await exitJson(exit, `${EMAILNATOR}/api/message/${encodeURIComponent(m.id)}`).catch(() => null);
        // The rail answers { id, from, subject, date, content }: only `content` is
        // the mail. The raw payload is that JSON envelope, and its `"date":<epoch>`
        // sat between the word "code" and a 6-digit run, so the loose code regex
        // read the epoch prefix as the code (179276 for a 288685 mail, measured
        // 2026-10-23) and every register burned itself on INVALID_VERIFY_CODE.
        out.push({ id: String(m.id), ts, from, subject, text: String((full && full.json && (full.json.content || full.json.body || full.json.html)) || '') });
      }
    }
    return out;
  } catch (e) { return []; }
}

// Emailnator's gmail pool is public and spam-flooded: a "code" mail that is not
// the panel's own (Massmutual, Vivakard, …) would be submitted as ours and the
// register call burns its attempt budget on it (`VERIFY_CODE_MAX_ATTEMPTS`,
// measured 2026-10-23). Only the panel's own mail counts — measured shape:
 // `Best AI <sender@panel>` / `[Best AI] Email verification code`.
const PANEL_MAIL = /aisale\.best|best\s*ai/i;
async function pollCode(exit, box, ignore, attempt, { timeoutMs = 180000, pollMs = 5000, since = 0 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let tried = 0;
  while (Date.now() < deadline) {
    // Emailnator re-issues message ids on every call, so an id baseline is no fence:
    // an old panel mail in a shared box comes back looking new and its stale code
    // burns a register attempt (VERIFY_CODE_MAX_ATTEMPTS). Fence on send time, newest first.
    const fresh = (await inbox(exit, box))
      .filter((m) => (since && m.ts ? m.ts >= since : !ignore.has(m.id)))
      .sort((a, b) => (b.ts || 0) - (a.ts || 0));
    for (const m of fresh) {
      if (ignore.has(m.id)) continue;
      const code = String(m.text).replace(/<[^>]+>/g, ' ').match(/(?:code|verification|验证码)[^\d]{0,30}(\d{6})/i);
      if (!code) continue;
      tried++;
      if (await attempt(code[1])) return { code: code[1], subject: m.subject, tried };
    }
    await sleep(pollMs);
  }
  throw new Error(`no verification code inside the window (offered ${tried} candidate(s))`);
}

// ------------------------------------------------------------------- flows
function readKeys() {
  try { return fs.readFileSync(KEYS_FILE, 'utf8').split(/\r?\n/).map((s) => s.trim()).filter(Boolean); } catch { return []; }
}
function appendKey(key) { fs.appendFileSync(KEYS_FILE, (fs.existsSync(KEYS_FILE) && fs.statSync(KEYS_FILE).size ? '\n' : '') + key + '\n'); }
function loadAccounts() { try { return JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8')); } catch { return []; } }
function saveAccounts(list) { fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(list, null, 2) + '\n'); }

async function signUp(exit) {
  const password = randPass();
  const box = await newMailbox(exit);
  const baseline = new Set((await inbox(exit, box)).map((m) => m.id));
  const since = Math.floor(Date.now() / 1000) - 45;
  const sc = await exitJson(exit, `${API}/auth/send-verify-code`, { method: 'POST', body: { email: box.plain } });
  if (!(sc.json && sc.json.code === 0)) throw new Error(`send-verify-code HTTP ${sc.status}: ${String(sc.text).slice(0, 140)}`);
  let reg = null;
  const { code, subject } = await pollCode(exit, box, baseline, async (candidate) => {
    const r = await exitJson(exit, `${API}/auth/register`, {
      method: 'POST',
      body: { email: box.plain, password, verify_code: candidate, turnstile: '' },
    });
    const d = (r.json && r.json.data) || r.json || {};
    if (d.access_token) { reg = r; return true; }
    if (r.json && r.json.reason === 'INVALID_VERIFY_CODE') return false;
    throw new Error(`register HTTP ${r.status}: ${String(r.text).slice(0, 140)}`);
  }, { since });
  const data = (reg.json && reg.json.data) || reg.json || {};
  const token = data.access_token;
  if (!token) throw new Error(`register HTTP ${reg.status}: ${String(reg.text).slice(0, 140)}`);
  const auth = { authorization: `Bearer ${token}` };

  let groupId = GROUP ? Number(GROUP) : null;
  if (groupId == null) {
    const g = await exitJson(exit, `${API}/groups/available`, { headers: auth });
    const list = (g.json && g.json.data) || [];
    groupId = (list.find((x) => x && x.id) || {}).id ?? null;
    if (groupId == null) throw new Error(`no group id from /groups/available: ${String(g.text).slice(0, 140)}`);
  }
  const created = await exitJson(exit, `${API}/keys`, {
    method: 'POST',
    headers: auth,
    body: { name: `k1${crypto.randomBytes(3).toString('hex')}`, group_id: groupId, status: 'active' },
  });
  const kd = (created.json && created.json.data) || {};
  const key = kd.key || kd.api_key || null;
  if (!key || !/^sk-/.test(String(key))) throw new Error(`key not readable: ${String(created.text).slice(0, 160)}`);
  return { email: box.plain, password, code, subject, token, groupId, key, balance: kd.quota ?? null };
}

const P1 = 'Reply with the single word: pong';
const P2 = 'Name three colours, comma separated.';
const TOOLS = [{ type: 'function', function: { name: 'get_time', description: 'Returns the current time', parameters: { type: 'object', properties: {} } } }];

async function chatGate(exit, key, model = MODEL) {
  const H = { authorization: `Bearer ${key}` };
  const call = (body) => exitJson(exit, `${BASE}/v1/chat/completions`, { method: 'POST', headers: H, body });
  const a = await call({ model, messages: [{ role: 'user', content: P1 }], max_tokens: 32 });
  const ta = textOf(a.json) || (a.text || '').trim();
  const b = await call({ model, messages: [{ role: 'user', content: P2 }], max_tokens: 64 });
  const tb = textOf(b.json) || (b.text || '').trim();
  const sanity = a.status === 200 && b.status === 200 && !!ta && !!tb && ta !== tb;
  let tools = null;
  if (sanity) {
    const c = await call({ model, messages: [{ role: 'user', content: 'What time is it right now? Use the get_time tool.' }], tools: TOOLS, tool_choice: 'auto', max_tokens: 256 });
    const mc = msgOf(c.json);
    const calls = mc.tool_calls || [];
    tools = { status: c.status, present: calls.length > 0, names: calls.map((x) => x && x.function && x.function.name).filter(Boolean) };
  }
  return { ok: sanity, status: a.status || b.status, sanity, tools, sample: String(ta).slice(0, 120) };
}

const msgOf = (j) => (j && j.choices && j.choices[0] && j.choices[0].message) || {};
function textOf(j) {
  const m = msgOf(j);
  return String(m.content || m.reasoning_content || m.reasoning || '').trim();
}

async function mint() {
  const exits = loadExits();
  if (SCREEN) return void (await screen(exits));
  const accounts = loadAccounts();
  log(`aisale.best · ${COUNT} key(s) · conc ${CONC} · exits ${exits.filter(Boolean).length || 'direct'} · keys land in keys.txt`);
  let made = 0;
  for (let round = 0; round < COUNT; round += CONC) {
    const jobs = [];
    for (let k = 0; k < CONC && round + k < COUNT; k++) {
      const i = round + k;
      jobs.push((async () => {
        let lastErr = null;
        for (let t2 = 0; t2 < TRIES; t2++) {
          const exit = exits[(i + t2) % exits.length];
          try {
            const rec = await signUp(exit);
            const g = await chatGate(exit, rec.key);
            if (!g.ok) {
              lastErr = new Error(`gate ${g.status}: ${g.sample}`);
              accounts.push({ at: new Date().toISOString(), email: rec.email, group: rec.groupId, exit: exit ? `${exit.host}:${exit.port}` : 'direct', gate: g.status });
              saveAccounts(accounts);
              continue;
            }
            appendKey(rec.key);
            accounts.push({ at: new Date().toISOString(), email: rec.email, password: rec.password, group: rec.groupId, exit: exit ? `${exit.host}:${exit.port}` : 'direct', key_masked: `${rec.key.slice(0, 10)}…`, gate: 200, tools: g.tools ? g.tools.names.join('+') : null });
            saveAccounts(accounts);
            made++;
            log(`account ${i + 1} ✔ chat-200 ${MODEL} · group=${rec.groupId} · tools=${g.tools ? (g.tools.present ? g.tools.names.join('+') : 'none') : '-'} · ${rec.key.slice(0, 10)}…`);
            return;
          } catch (e) { lastErr = e; }
        }
        log(`account ${i + 1}: ${lastErr ? String(lastErr.message).slice(0, 160) : 'failed'}`);
      })());
    }
    await Promise.all(jobs);
    if (GAP_MS) await sleep(GAP_MS);
  }
  log(`done — ${made}/${COUNT} key(s) written to ${KEYS_FILE}`);
}

async function verifyOnly() {
  const exits = loadExits();
  const keys = readKeys();
  if (!keys.length) { console.log(`no keys in ${KEYS_FILE}`); process.exit(0); }
  let live = 0;
  for (let i = 0; i < keys.length; i++) {
    const exit = exits[i % exits.length];
    try {
      const g = await chatGate(exit, keys[i]);
      if (g.ok) live++;
      console.log(`  ${g.ok ? '✔' : '✘'} ${keys[i].slice(0, 10)}… chat=${g.status} tools=${g.tools ? (g.tools.present ? g.tools.names.join('+') : 'none') : '-'}`);
    } catch (e) {
      console.log(`  ✘ ${keys[i].slice(0, 10)}… ${String(e.message).slice(0, 90)}`);
    }
  }
  console.log(`verify: ${live}/${keys.length} keys live`);
  process.exit(live === keys.length ? 0 : 1);
}

(VERIFY_ONLY ? verifyOnly() : mint()).catch((e) => { console.error('[fatal]', e.message); process.exit(1); });
