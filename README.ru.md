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

**Массовое создание аккаунтов aisale.best с API-ключами — OpenAI-совместимый инференс + коннектор 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Быстрый старт](#-quick-start) · [🎁 Бесплатный тариф](#-free-tier--how-much-you-get) · [🤖 Модели](#-models--all-29-of-them) · [🧪 Использование API](#-how-to-use-the-api) · [✅ Проверено](#-verified-working--every-key-is-tested) · [🧭 Как это работает](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Опции](#️-cli-options) · [🛰️ Прокси](#️-behind-a-proxy) · [🐞 Проблемы](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Зачем это нужно

`aisale.best` — это шлюз на Go + Vue (со своей панелью, внутри `site_name: Sub2API`), стоящий перед смешанным пулом апстримов. Причина, по которой он заслуживает отдельного канала добычи, — это поверхность регистрации: его публичные настройки отвечают `turnstile_enabled: false` и `aliyun_captcha_enabled: false`, регистрация — это **e-mail + пароль с 6-значным кодом**, и вся цепочка работает по обычному HTTP — без браузера, без решателя капчи, без OAuth. Собственный бандл панели (`assets/EmailVerifyView-*.js`) называет точное поле, которое ожидает вызов регистрации (`verify_code`), — именно его и отправляет этот CLI.

## 🎁 Бесплатный тариф — сколько вы получаете

Панель начисляет приветственный баланс новому аккаунту (`register_balance: 0.5` на аккаунте, который этот канал создал 2026-10-18), и ключ наследует группу аккаунта. На этой панели нет ежедневной отметки; единица, которая масштабируется, — это аккаунт, поэтому инструмент создаёт **один аккаунт на ключ**.

> 💡 Бесплатный тариф устанавливается aisale.best (Best AI) и может меняться. Проверяйте актуальные цифры на [aisale.best](https://aisale.best) — и пусть решение принимает собственный гейт инструмента:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Модели — все 29

`GET https://aisale.best/v1/models` со свежим ключом вернул **29 id** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), все в виде релейных строк в стиле `owned_by: openai` — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … Гейт-модель — `codex-auto-review`, самая дешёвая строка, которую измерил триаж.

## 🧪 Как использовать API

* ключ — это `sk-` + 64 шестнадцатеричных символа; он передаётся в `Authorization: Bearer <key>` на `/v1/*`
* одного запроса на ключ достаточно, чтобы его подтвердить: `POST /v1/chat/completions`, `max_tokens: 16`
* релей отвечает как обычным JSON, так и `text/event-stream`; CLI разбирает оба
* свежий аккаунт отвечает на каждой модели своей группы — гейт выбирает самую дешёвую

## 🛠 Быстрый старт

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

### 🖱️ Лаунчер

`src/launcher.js` (с тем же баннером, что и в этом README) запускает коннектор: он читает `keys.txt`, оставляет только те ключи, которые отвечают на живой `/v1/models`, и передаёт выжившие коннектору 9Router с `https://aisale.best/v1` в качестве базового URL. `src/connect-9router.js` регистрирует провайдера под префиксом `aisale` с `codex-auto-review` в качестве модели по умолчанию.

## ✅ Проверено в работе — каждый ключ протестирован

Доказательство на момент создания, 2026-10-23: ключ, созданный этим CLI, ответил **живым chat-200** с `chat=200 tools=get_time` (`node public-cli.js --verify-only` повторно подтвердил каждую строку `keys.txt`), и тот же ключ был повторно подтверждён через закреплённый выход. Свидетельства: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (модели 29 · p1 `pong` · p2 `Red, blue, green` · инструменты `get_time` · вердикт READY-TO-ADD) и `providers/aisale.best/out/mint-lane*.log`.

> **Контроль качества.** Каждый ключ здесь прошёл живой `chat-200` прежде чем был записан в `keys.txt`
> (мёртвые ключи никогда не поставляются). Комбинации роутера следуют тому же правилу на уровне модели: запись
> добавляется **только если модель отвечает `chat-200` и умеет вызывать инструменты** — модель без поддержки инструментов,
> мёртвый ключ или мёртвый провайдер отбрасывается, а не добавляется. Перезапускайте шаг проверки в любое время;
> сбои сообщаются, а не скрываются.

## 🧭 Как это работает

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Регистрация, для каждого аккаунта (всё через один закреплённый выход):

1. **почтовый ящик** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` возвращает plus-алиас на одном из своего пула реальных gmail-аккаунтов. Панель применяет белый список суффиксов (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), поэтому gmail-алиас — это простой путь; публичные gmail от Emailnator общие и засыпаны спамом, поэтому они — лишь запасной вариант `--mail emailnator`.
2. **отправка кода** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` и 6-значное письмо.
3. **код** — опрос `POST temp.tf/api/check` (Emailnator `/api/message-list` на запасном пути). Почтовый ящик снимается как снимок *до* отправки, чтобы уже существующее сообщение никогда не было принято за код, и каждый 6-значный кандидат предлагается вызову регистрации, пока панель не примет один из них.
4. **регистрация** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` в теле ответа. Неверные имена полей отвечают `EMAIL_VERIFY_REQUIRED`; устаревший код отвечает `INVALID_VERIFY_CODE`.
5. **ключ** — `GET /api/v1/groups/available` → первый id группы, затем `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **гейт** — `POST /v1/chat/completions` дважды с разными промптами (оба 200, непустые, разные) плюс вызов инструмента `get_time`; только ключ, прошедший все три, добавляется в `keys.txt`.

## ⚙️ Опции CLI

| флаг | значение |
| --- | --- |
| `--count N` | аккаунты (= ключи); каждый проходит гейт прежде чем быть сохранённым |
| `--conc N` | аккаунтов в работе (максимум 8) |
| `--model <id>` | гейт-модель (по умолчанию `codex-auto-review`) |
| `--group <id>` | id группы для ключа (по умолчанию: первый из `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | выходы, по одному в строке / один выход для всего |
| `--tries N` | выходов, испробованных на аккаунт, прежде чем сдаться |
| `--verify-only` | перепроверить каждый ключ в `keys.txt` живым вызовом чата |
| `--screen` | только протестировать список выходов против панели |

## 🛰️ За прокси

Каждый запрос к панели (и вызов почтового ящика) идёт через **один закреплённый выход на аккаунт** — тот же адрес для запроса кода, вызова регистрации, создания ключа и гейта. Список выходов — это обычный файл, по одному `http://host:port` или `socks5://host:port` в строке, передаваемый через `--pool` или переменную окружения `AISALE_PROXIES`; без него инструмент подключается напрямую.

## 📄 Файлы

| файл | что |
| --- | --- |
| `keys.txt` | проверенные ключи, по одному в строке |
| `accounts.json` | запись аккаунт ↔ выход ↔ гейт |
| `repo-spec.json` | эта спецификация упаковки |
| `public-cli.js` | создание / проверка / скрининг (только стандартная библиотека node) |
| `out/triage-*.json` | независимый триаж ключей (модели, два промпта, инструменты) |
| `out/mint-lane*.log` | сырые запуски создания |

## 🔌 Подключение к 9Router

Добавьте в 9Router как пользовательского OpenAI-совместимого провайдера:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Подключение к OmniRoute

Добавьте в OmniRoute как пользовательского OpenAI-совместимого провайдера:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 Что даёт один ключ

| | |
| --- | --- |
| 🏢 Провайдер | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 Что даёт провайдер | один аккаунт на ключ — регистрация по e-mail-коду без капчи, каждый ключ проверяется чатом прежде чем быть записанным |
| 🔑 Что даёт один ключ | один API-ключ, привязанный к своему аккаунту: 29 id моделей на указанном ниже эндпоинте, в пределах лимитов вашего тарифа. Квота живёт на **аккаунте**, именно поэтому этот инструмент создаёт один аккаунт на ключ |
| 🌐 Форма API | OpenAI-совместимая: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Ваши данные | связь происходит только с aisale.best и настроенным вами бэкендом почтового ящика; ключи остаются на вашей машине |

## 🐞 Проблемы

* **Белый список суффиксов e-mail применяется.** `@hotmail.com` / `@outlook.com` / одноразовые домены отклоняются с `EMAIL_SUFFIX_NOT_ALLOWED` и списком из 12 разрешённых суффиксов; используйте адрес класса gmail.
* **`EMAIL_VERIFY_REQUIRED` означает, что имя поля неверно**, а не что код отсутствует — тело регистрации ожидает `verify_code` (прочитано из собственного бандла панели), а устаревший/неверный код отвечает `INVALID_VERIFY_CODE`.
* **Почтовые ящики Emailnator общие.** Код, который вы не запрашивали, — чужой; CLI принимает только сообщения, пришедшие после его собственной отправки, и именно живой гейт решает, будет ли ключ поставлен.
* Собственный фронтенд панели — это SPA, чей базовый API — `/api/v1`; каждый эндпоинт выше был прочитан из его бандла и затем подтверждён против живого API.

## 📄 Лицензия

MIT © 2026 — см. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>