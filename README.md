<div align="center">

```
 █████╗ ██╗███████╗ █████╗ ██╗     ███████╗
██╔══██╗██║██╔════╝██╔══██╗██║     ██╔════╝
███████║██║███████╗███████║██║     █████╗
██╔══██║██║╚════██║██╔══██║██║     ██╔══╝
██║  ██║██║███████║██║  ██║███████╗███████╗
╚═╝  ╚═╝╚═╝╚══════╝╚═╝  ╚═╝╚══════╝╚══════╝
```

# aisale-bulk-apikey

**Bulk-create aisale.best accounts with API keys — OpenAI-compatible inference + 9Router connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Quick start](#-quick-start) · [🎁 Free tier](#-free-tier--how-much-you-get) · [🤖 Models](#-models--all-29-of-them) · [🧪 Use the API](#-how-to-use-the-api) · [✅ Verified](#-verified-working--every-key-is-tested) · [🧭 How it works](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Issues](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Why this exists

`aisale.best` is a Go + Vue gateway (its own panel, `site_name: Sub2API` internally) sitting in front of a mixed upstream pool. The reason it is worth a mint lane is the signup surface: its public settings answer `turnstile_enabled: false` and `aliyun_captcha_enabled: false`, registration is **e-mail + password behind a 6-digit code**, and the whole chain is plain HTTP — no browser, no captcha solver, no OAuth. The panel's own bundle (`assets/EmailVerifyView-*.js`) names the exact field the register call wants (`verify_code`), which is what this CLI sends.

## 🎁 Free tier — how much you get

The panel grants a signup balance to a fresh account (`register_balance: 0.5` on the account this lane minted on 2026-10-18), and the key inherits the account's group. There is no daily check-in on this panel; the unit that scales is the account, which is why the tool creates **one account per key**.

> 💡 The free tier is set by aisale.best (Best AI) and can change. Check the live numbers at [aisale.best](https://aisale.best) — and let the tool's own gate decide:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Models — all 29 of them

`GET https://aisale.best/v1/models` with a fresh key answered **29 ids** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), all served as `owned_by: openai`-style relay rows — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … The gate model is `codex-auto-review`, the cheapest row the triage measured.

## 🧪 How to use the API

* the key is `sk-` + 64 hex characters; it rides `Authorization: Bearer <key>` on `/v1/*`
* one request per key is enough to prove it: `POST /v1/chat/completions`, `max_tokens: 16`
* the relay answers both plain JSON and `text/event-stream`; the CLI parses both
* a fresh account answers on every model of its group — the gate picks the cheapest

## 🛠 Quick start

```bash
# 1) one account + one verified key (e-mail code only — no browser, no captcha)
node public-cli.js --count 1

# 2) prove an existing key
node public-cli.js --verify-only

# 3) talk to it
curl https://aisale.best/v1/chat/completions \
  -H "Authorization: Bearer $AISALE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"model":"codex-auto-review","messages":[{"role":"user","content":"say ok"}],"max_tokens":8}'
```

### 🖱️ The launcher

`src/launcher.js` (same banner as this README) boots the connector: it reads `keys.txt`, keeps only the keys that answer a live `/v1/models`, and hands the surviving ones to the 9Router connector with `https://aisale.best/v1` as the base URL. `src/connect-9router.js` registers the provider under prefix `aisale` with `codex-auto-review` as the default model.

## ✅ Verified working — every key is tested

Mint-time proof, 2026-10-23: a key minted by this CLI answered a **live chat-200** with `chat=200 tools=get_time` (`node public-cli.js --verify-only` re-proved every line of `keys.txt`), and the same key was re-proved through a pinned exit. Evidence: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (models 29 · p1 `pong` · p2 `Red, blue, green` · tools `get_time` · verdict READY-TO-ADD) and `providers/aisale.best/out/mint-lane*.log`.

> **Quality gates.** Every key here passed a live `chat-200` before it was written to `keys.txt`
> (dead keys are never shipped). Router combos follow the same rule at the model level: an entry is
> added **only if the model answers `chat-200` and can call tools** — a model without tool support,
> a dead key or a dead provider is dropped instead of added. Re-run the verify step any time;
> failures are reported, never hidden.

## 🧭 How it works

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Sign-up, per account (all of it through one pinned exit):

1. **mailbox** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` hands back a plus-alias on one of its pool of real gmail accounts. The panel enforces a suffix allow-list (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), so a gmail alias is the easy rail; Emailnator's public gmails are shared and spam-flooded, so they are only the `--mail emailnator` fallback.
2. **send code** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` and a 6-digit mail.
3. **code** — poll `POST temp.tf/api/check` (Emailnator `/api/message-list` on the fallback rail). The mailbox is snapshotted *before* the send so a pre-existing message can never be mistaken for the code, and every 6-digit candidate is offered to the register call until the panel accepts one.
4. **register** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` in the response body. Wrong field names answer `EMAIL_VERIFY_REQUIRED`; a stale code answers `INVALID_VERIFY_CODE`.
5. **key** — `GET /api/v1/groups/available` → the first group id, then `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **gate** — `POST /v1/chat/completions` twice with different prompts (both 200, non-empty, different) plus a `get_time` tool call; only a key that passes all three is appended to `keys.txt`.

## ⚙️ CLI options

| flag | meaning |
| --- | --- |
| `--count N` | accounts (= keys); each one is gated before it is kept |
| `--conc N` | accounts in flight (max 8) |
| `--model <id>` | gate model (default `codex-auto-review`) |
| `--group <id>` | group id for the key (default: first from `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | exits, one per line / a single exit for everything |
| `--tries N` | exits tried per account before giving up |
| `--verify-only` | re-check every key in `keys.txt` with a live chat call |
| `--screen` | only test the exit list against the panel |

## 🛰️ Behind a proxy

Every panel request (and the mailbox call) goes through **one pinned exit per account** — the same address for the code request, the register call, the key mint and the gate. The exit list is a plain file, one `http://host:port` or `socks5://host:port` per line, passed with `--pool` or the `AISALE_PROXIES` env; without it the tool connects directly.

## 📄 Files

| file | what |
| --- | --- |
| `keys.txt` | verified keys, one per line |
| `accounts.json` | account ↔ exit ↔ gate record |
| `repo-spec.json` | this packaging spec |
| `public-cli.js` | mint / verify / screen (node stdlib only) |
| `out/triage-*.json` | independent key triage (models, two prompts, tools) |
| `out/mint-lane*.log` | raw mint runs |

## 🔌 Connect to 9Router

Add to 9Router as a custom OpenAI-compatible provider:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Connect to OmniRoute

Add to OmniRoute as a custom OpenAI-compatible provider:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 What one key gets you

| | |
| --- | --- |
| 🏢 Provider | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 What the provider gives | one account per key — e-mail-code signup with no captcha, every key chat-verified before it is written |
| 🔑 What one key gets you | one API key scoped to its own account: the 29 model ids on the endpoint below, at your plan's limits. The quota lives on the **account**, which is exactly why this tool creates one account per key |
| 🌐 API shape | OpenAI-compatible: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Your data | only aisale.best and the inbox backend you configure are contacted; keys stay on your machine |

## 🐞 Issues

* **The e-mail suffix allow-list is enforced.** `@hotmail.com` / `@outlook.com` / disposable domains are refused with `EMAIL_SUFFIX_NOT_ALLOWED` and the list of the 12 allowed suffixes; use a gmail-class address.
* **`EMAIL_VERIFY_REQUIRED` means the field name is wrong**, not that a code is missing — the register body wants `verify_code` (read out of the panel's own bundle), and a stale/wrong code answers `INVALID_VERIFY_CODE` instead.
* **Emailnator inboxes are shared.** A code you did not ask for is somebody else's; the CLI only accepts messages that arrive after its own send, and the live gate is what decides whether a key ships.
* The panel's own front end is a SPA whose API base is `/api/v1`; every endpoint above was read from its bundle and then confirmed against the live API.

## 📄 License

MIT © 2026 — see [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>
