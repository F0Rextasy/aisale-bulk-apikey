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

**API 키와 함께 aisale.best 계정을 대량 생성 — OpenAI 호환 추론 + 9Router 커넥터.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 빠른 시작](#-quick-start) · [🎁 무료 티어](#-free-tier--how-much-you-get) · [🤖 모델](#-models--all-29-of-them) · [🧪 API 사용하기](#-how-to-use-the-api) · [✅ 검증됨](#-verified-working--every-key-is-tested) · [🧭 작동 방식](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ 옵션](#️-cli-options) · [🛰️ 프록시](#️-behind-a-proxy) · [🐞 이슈](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ 왜 이게 존재하는가

`aisale.best`는 혼합된 업스트림 풀 앞에 위치한 Go + Vue 게이트웨이(자체 패널, 내부적으로 `site_name: Sub2API`)입니다. 이것이 가치 있는 경로인 이유는 가입 표면에 있습니다: 공개 설정이 `turnstile_enabled: false`와 `aliyun_captcha_enabled: false`를 응답하고, 등록은 **6자리 코드 뒤의 이메일 + 비밀번호**이며, 전체 체인이 평범한 HTTP입니다 — 브라우저도, 캡차 솔버도, OAuth도 없습니다. 패널 자체의 번들(`assets/EmailVerifyView-*.js`)이 register 호출이 원하는 정확한 필드명(`verify_code`)을 명시하며, 이것이 이 CLI가 전송하는 것입니다.

## 🎁 무료 티어 — 얼마나 받는가

패널은 새 계정에 가입 잔액을 부여하며(이 경로가 2026-10-18에 생성한 계정에서 `register_balance: 0.5`), 키는 계정의 그룹을 상속합니다. 이 패널에는 일일 체크인이 없습니다; 확장되는 단위는 계정이며, 이것이 이 도구가 **키당 하나의 계정**을 생성하는 이유입니다.

> 💡 무료 티어는 aisale.best (Best AI)가 설정하며 변경될 수 있습니다. 실시간 수치는 [aisale.best](https://aisale.best)에서 확인하세요 — 그리고 도구 자체의 게이트가 결정하게 하세요:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 모델 — 29개 전부

`GET https://aisale.best/v1/models`를 새 키로 호출하면 **29개의 id**가 응답되었으며(`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), 모두 `owned_by: openai` 스타일의 릴레이 행으로 제공됩니다 — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … 게이트 모델은 `codex-auto-review`이며, 트리아지가 측정한 가장 저렴한 행입니다.

## 🧪 API 사용 방법

* 키는 `sk-` + 64개의 16진수 문자입니다; `/v1/*`에서 `Authorization: Bearer <key>`로 전달됩니다
* 키당 한 번의 요청이면 증명하기에 충분합니다: `POST /v1/chat/completions`, `max_tokens: 16`
* 릴레이는 일반 JSON과 `text/event-stream` 모두 응답합니다; CLI는 둘 다 파싱합니다
* 새 계정은 자신의 그룹에 속한 모든 모델에서 응답합니다 — 게이트는 가장 저렴한 것을 선택합니다

## 🛠 빠른 시작

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

### 🖱️ 런처

`src/launcher.js`(이 README와 동일한 배너)는 커넥터를 부팅합니다: `keys.txt`를 읽고, 라이브 `/v1/models`에 응답하는 키만 유지하며, 살아남은 키들을 `https://aisale.best/v1`을 베이스 URL로 하여 9Router 커넥터에 넘깁니다. `src/connect-9router.js`는 `codex-auto-review`를 기본 모델로 하여 `aisale` 접두사 아래에 프로바이더를 등록합니다.

## ✅ 검증됨 — 모든 키가 테스트됨

생성 시점 증명, 2026-10-23: 이 CLI가 생성한 키가 **라이브 chat-200**을 `chat=200 tools=get_time`으로 응답했으며(`node public-cli.js --verify-only`가 `keys.txt`의 모든 줄을 재증명), 동일한 키가 고정된 출구를 통해 재증명되었습니다. 증거: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (models 29 · p1 `pong` · p2 `Red, blue, green` · tools `get_time` · verdict READY-TO-ADD) 및 `providers/aisale.best/out/mint-lane*.log`.

> **품질 게이트.** 여기의 모든 키는 `keys.txt`에 기록되기 전에 라이브 `chat-200`을 통과했습니다
> (죽은 키는 절대 배포되지 않습니다). 라우터 콤보는 모델 수준에서 동일한 규칙을 따릅니다: 항목은
> **모델이 `chat-200`을 응답하고 도구를 호출할 수 있는 경우에만** 추가됩니다 — 도구 지원이 없는 모델,
> 죽은 키 또는 죽은 프로바이더는 추가되지 않고 제거됩니다. 언제든지 검증 단계를 다시 실행하세요;
> 실패는 보고되며, 절대 숨겨지지 않습니다.

## 🧭 작동 방식

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

계정당 가입 (전부 하나의 고정된 출구를 통해):

1. **mailbox** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1`가 실제 gmail 계정 풀 중 하나에 대한 플러스 별칭을 반환합니다. 패널은 접미사 허용 목록(`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`)을 강제하므로, gmail 별칭이 쉬운 경로입니다; Emailnator의 공개 gmail은 공유되고 스팸이 넘치므로 `--mail emailnator` 폴백일 뿐입니다.
2. **send code** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` 그리고 6자리 메일.
3. **code** — `POST temp.tf/api/check`를 폴링합니다(폴백 경로에서는 Emailnator `/api/message-list`). 메일박스는 전송 *전에* 스냅샷되므로 기존 메시지가 코드로 오인될 수 없으며, 모든 6자리 후보가 패널이 하나를 수락할 때까지 register 호출에 제공됩니다.
4. **register** — `POST /api/v1/auth/register {email,password,verify_code}` → 응답 본문에 `access_token`. 잘못된 필드명은 `EMAIL_VERIFY_REQUIRED`를 응답합니다; 오래된 코드는 `INVALID_VERIFY_CODE`를 응답합니다.
5. **key** — `GET /api/v1/groups/available` → 첫 번째 그룹 id, 그런 다음 `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **gate** — 서로 다른 프롬프트로 `POST /v1/chat/completions`를 두 번(둘 다 200, 비어 있지 않음, 서로 다름) 그리고 `get_time` 도구 호출; 세 가지를 모두 통과한 키만 `keys.txt`에 추가됩니다.

## ⚙️ CLI 옵션

| 플래그 | 의미 |
| --- | --- |
| `--count N` | 계정 (= 키); 각각은 유지되기 전에 게이트를 통과합니다 |
| `--conc N` | 동시 진행 계정 (최대 8) |
| `--model <id>` | 게이트 모델 (기본값 `codex-auto-review`) |
| `--group <id>` | 키의 그룹 id (기본값: `/groups/available`의 첫 번째) |
| `--pool <file>` / `--proxy <url>` | 출구, 한 줄에 하나 / 모든 것에 대한 단일 출구 |
| `--tries N` | 포기하기 전에 계정당 시도하는 출구 수 |
| `--verify-only` | `keys.txt`의 모든 키를 라이브 채팅 호출로 재확인 |
| `--screen` | 출구 목록을 패널에 대해서만 테스트 |

## 🛰️ 프록시 뒤에서

모든 패널 요청(그리고 메일박스 호출)은 **계정당 하나의 고정된 출구**를 통해 갑니다 — 코드 요청, register 호출, 키 생성 및 게이트에 대해 동일한 주소. 출구 목록은 평범한 파일이며, 한 줄에 하나의 `http://host:port` 또는 `socks5://host:port`이고, `--pool` 또는 `AISALE_PROXIES` 환경 변수로 전달됩니다; 없으면 도구는 직접 연결합니다.

## 📄 파일

| 파일 | 내용 |
| --- | --- |
| `keys.txt` | 검증된 키, 한 줄에 하나 |
| `accounts.json` | 계정 ↔ 출구 ↔ 게이트 기록 |
| `repo-spec.json` | 이 패키징 명세 |
| `public-cli.js` | 생성 / 검증 / 스크린 (node 표준 라이브러리만) |
| `out/triage-*.json` | 독립적 키 트리아지 (모델, 두 프롬프트, 도구) |
| `out/mint-lane*.log` | 원시 생성 실행 |

## 🔌 9Router에 연결

9Router에 커스텀 OpenAI 호환 프로바이더로 추가:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 OmniRoute에 연결

OmniRoute에 커스텀 OpenAI 호환 프로바이더로 추가:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 키 하나로 얻는 것

| | |
| --- | --- |
| 🏢 프로바이더 | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 프로바이더가 주는 것 | 키당 하나의 계정 — 캡차 없는 이메일 코드 가입, 기록되기 전에 모든 키가 채팅 검증됨 |
| 🔑 키 하나로 얻는 것 | 자체 계정에 범위가 지정된 하나의 API 키: 아래 엔드포인트의 29개 모델 id, 플랜 한도 내에서. 할당량은 **계정**에 있으므로, 이것이 이 도구가 키당 하나의 계정을 생성하는 정확한 이유입니다 |
| 🌐 API 형태 | OpenAI 호환: `POST https://aisale.best/v1/chat/completions` |
| 🔒 데이터 | aisale.best와 구성한 인박스 백엔드만 접촉됩니다; 키는 사용자 컴퓨터에 남습니다 |

## 🐞 이슈

* **이메일 접미사 허용 목록이 강제됩니다.** `@hotmail.com` / `@outlook.com` / 일회용 도메인은 `EMAIL_SUFFIX_NOT_ALLOWED`와 12개 허용 접미사 목록과 함께 거부됩니다; gmail급 주소를 사용하세요.
* **`EMAIL_VERIFY_REQUIRED`는 필드명이 잘못되었다는 의미**이지, 코드가 없다는 의미가 아닙니다 — register 본문은 `verify_code`를 원하며(패널 자체 번들에서 읽음), 오래된/잘못된 코드는 대신 `INVALID_VERIFY_CODE`를 응답합니다.
* **Emailnator 인박스는 공유됩니다.** 요청하지 않은 코드는 다른 사람의 것입니다; CLI는 자체 전송 이후에 도착한 메시지만 수락하며, 키가 배포될지 여부를 결정하는 것은 라이브 게이트입니다.
* 패널 자체의 프론트 엔드는 API 베이스가 `/api/v1`인 SPA입니다; 위의 모든 엔드포인트는 그 번들에서 읽은 다음 라이브 API에 대해 확인되었습니다.

## 📄 라이선스

MIT © 2026 — [LICENSE](LICENSE) 참조.

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>