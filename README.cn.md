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

**批量创建 aisale.best 账户并附带 API 密钥 — 兼容 OpenAI 的推理 + 9Router 连接器。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 快速开始](#-quick-start) · [🎁 免费额度](#-free-tier--how-much-you-get) · [🤖 模型](#-models--all-29-of-them) · [🧪 使用 API](#-how-to-use-the-api) · [✅ 已验证](#-verified-working--every-key-is-tested) · [🧭 工作原理](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 选项](#️-cli-options) · [🛰️ 代理](#️-behind-a-proxy) · [🐞 问题](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 为什么会有这个项目

`aisale.best` 是一个 Go + Vue 网关（自带面板，内部 `site_name: Sub2API`），位于一个混合上游池的前面。它值得开辟一条铸造通道的原因在于其注册入口：它的公开设置返回 `turnstile_enabled: false` 和 `aliyun_captcha_enabled: false`，注册方式是**邮箱 + 密码，配合 6 位验证码**，整条链路都是纯 HTTP —— 无需浏览器、无需验证码破解、无需 OAuth。面板自带的打包文件（`assets/EmailVerifyView-*.js`）明确指出了注册调用所需的字段名（`verify_code`），这正是本 CLI 所发送的内容。

## 🎁 免费额度 —— 你能获得多少

面板会向新账户发放注册余额（本通道在 2026-10-18 铸造的账户上为 `register_balance: 0.5`），密钥继承账户所属的分组。该面板没有每日签到；可扩展的单位是账户，这就是为什么该工具**每个密钥创建一个账户**。

> 💡 免费额度由 aisale.best（Best AI）设定，可能会变化。请在 [aisale.best](https://aisale.best) 查看实时数字 —— 并让工具自身的门禁来决定：

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 模型 —— 全部 29 个

使用新密钥请求 `GET https://aisale.best/v1/models` 返回了 **29 个 id**（`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`），全部以 `owned_by: openai` 风格的中转行提供 —— `codex-auto-review`、`gpt-5.6-sol`、`gpt-5.6-luna`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-4`……门禁模型是 `codex-auto-review`，即分诊测量出的最便宜的一行。

## 🧪 如何使用 API

* 密钥格式为 `sk-` + 64 个十六进制字符；在 `/v1/*` 上通过 `Authorization: Bearer <key>` 传递
* 每个密钥只需一次请求即可证明其有效：`POST /v1/chat/completions`，`max_tokens: 16`
* 中继同时返回纯 JSON 和 `text/event-stream`；CLI 两者都能解析
* 新账户在其分组的所有模型上都能响应 —— 门禁会选择最便宜的那个

## 🛠 快速开始

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

### 🖱️ 启动器

`src/launcher.js`（与本 README 相同的横幅）会启动连接器：它读取 `keys.txt`，仅保留能对实时 `/v1/models` 做出响应的密钥，并将存活的密钥交给 9Router 连接器，以 `https://aisale.best/v1` 作为基础 URL。`src/connect-9router.js` 会将该提供商注册在前缀 `aisale` 下，并以 `codex-auto-review` 作为默认模型。

## ✅ 已验证可用 —— 每个密钥都经过测试

铸造时证明，2026-10-23：由本 CLI 铸造的一个密钥对**实时 chat-200** 做出了响应，结果为 `chat=200 tools=get_time`（`node public-cli.js --verify-only` 重新证明了 `keys.txt` 的每一行），并且同一密钥通过固定出口再次得到证明。证据：`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`（models 29 · p1 `pong` · p2 `Red, blue, green` · tools `get_time` · verdict READY-TO-ADD）以及 `providers/aisale.best/out/mint-lane*.log`。

> **质量门禁。** 这里的每个密钥在写入 `keys.txt` 之前都通过了实时 `chat-200`
> （失效的密钥绝不会被交付）。路由组合在模型层面遵循同样的规则：一个条目
> **只有在模型能响应 `chat-200` 且能调用工具时**才会被添加 —— 不支持工具的模型、
> 失效的密钥或失效的提供商会直接被丢弃而非添加。随时重新运行验证步骤；
> 失败会被报告，绝不会被隐藏。

## 🧭 工作原理

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

注册，每个账户（全部通过一个固定出口）：

1. **邮箱** —— `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` 从其真实 gmail 账户池中返回一个 plus 别名。面板强制实施后缀允许列表（`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`），因此 gmail 别名是最便捷的通道；Emailnator 的公开 gmail 是共享的且被垃圾邮件淹没，因此它们仅作为 `--mail emailnator` 回退方案。
2. **发送验证码** —— `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` 以及一封 6 位验证码邮件。
3. **验证码** —— 轮询 `POST temp.tf/api/check`（回退通道上使用 Emailnator `/api/message-list`）。邮箱在发送*之前*被快照，因此预先存在的邮件绝不会被误认为验证码，并且每个 6 位候选码都会被提交给注册调用，直到面板接受其中一个。
4. **注册** —— `POST /api/v1/auth/register {email,password,verify_code}` → 响应体中的 `access_token`。字段名错误会返回 `EMAIL_VERIFY_REQUIRED`；过期的验证码会返回 `INVALID_VERIFY_CODE`。
5. **密钥** —— `GET /api/v1/groups/available` → 第一个分组 id，然后 `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`。
6. **门禁** —— 用两个不同的提示词调用 `POST /v1/chat/completions` 两次（均为 200、非空、内容不同），外加一次 `get_time` 工具调用；只有通过全部三项的密钥才会被追加到 `keys.txt`。

## ⚙️ CLI 选项

| 标志 | 含义 |
| --- | --- |
| `--count N` | 账户数（= 密钥数）；每个在被保留前都会经过门禁 |
| `--conc N` | 并发处理的账户数（最大 8） |
| `--model <id>` | 门禁模型（默认 `codex-auto-review`） |
| `--group <id>` | 密钥的分组 id（默认：来自 `/groups/available` 的第一个） |
| `--pool <file>` / `--proxy <url>` | 出口，每行一个 / 为所有请求使用单一出口 |
| `--tries N` | 每个账户在放弃前尝试的出口数 |
| `--verify-only` | 用实时聊天调用重新检查 `keys.txt` 中的每个密钥 |
| `--screen` | 仅针对面板测试出口列表 |

## 🛰️ 代理之后

每个面板请求（以及邮箱调用）都通过**每个账户一个固定出口** —— 验证码请求、注册调用、密钥铸造和门禁都使用同一地址。出口列表是一个纯文本文件，每行一个 `http://host:port` 或 `socks5://host:port`，通过 `--pool` 或 `AISALE_PROXIES` 环境变量传入；没有它时工具会直接连接。

## 📄 文件

| 文件 | 内容 |
| --- | --- |
| `keys.txt` | 已验证的密钥，每行一个 |
| `accounts.json` | 账户 ↔ 出口 ↔ 门禁记录 |
| `repo-spec.json` | 本打包规范 |
| `public-cli.js` | 铸造 / 验证 / 筛选（仅使用 node 标准库） |
| `out/triage-*.json` | 独立的密钥分诊（模型、两个提示词、工具） |
| `out/mint-lane*.log` | 原始铸造运行日志 |

## 🔌 连接到 9Router

作为自定义的兼容 OpenAI 的提供商添加到 9Router：

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 连接到 OmniRoute

作为自定义的兼容 OpenAI 的提供商添加到 OmniRoute：

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 一个密钥能给你带来什么

| | |
| --- | --- |
| 🏢 提供商 | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 提供商提供什么 | 每个密钥一个账户 —— 邮箱验证码注册，无验证码，每个密钥在写入前都经过聊天验证 |
| 🔑 一个密钥能给你带来什么 | 一个限定于其自身账户的 API 密钥：下方端点上的 29 个模型 id，受你套餐的限制。配额存在于**账户**上，这正是本工具为每个密钥创建一个账户的原因 |
| 🌐 API 形态 | 兼容 OpenAI：`POST https://aisale.best/v1/chat/completions` |
| 🔒 你的数据 | 仅联系 aisale.best 和你配置的邮箱后端；密钥保留在你的机器上 |

## 🐞 问题

* **邮箱后缀允许列表会被强制执行。** `@hotmail.com` / `@outlook.com` / 一次性域名会被拒绝，返回 `EMAIL_SUFFIX_NOT_ALLOWED` 以及 12 个允许后缀的列表；请使用 gmail 类地址。
* **`EMAIL_VERIFY_REQUIRED` 意味着字段名错误**，而不是缺少验证码 —— 注册请求体需要 `verify_code`（从面板自带的打包文件中读出），而过期/错误的验证码会返回 `INVALID_VERIFY_CODE`。
* **Emailnator 收件箱是共享的。** 你没有请求过的验证码是别人的；CLI 只接受在其自身发送之后到达的邮件，而实时门禁才是决定密钥是否交付的关键。
* 面板自身的前端是一个 SPA，其 API 基础路径为 `/api/v1`；上述每个端点都是从其打包文件中读取，然后针对实时 API 进行确认的。

## 📄 许可证

MIT © 2026 — 参见 [LICENSE](LICENSE)。

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>