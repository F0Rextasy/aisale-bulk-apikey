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

**Massenhaft aisale.best-Konten mit API-Schlüsseln erstellen — OpenAI-kompatible Inferenz + 9Router-Connector.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Schnellstart](#-quick-start) · [🎁 Kostenlose Stufe](#-free-tier--how-much-you-get) · [🤖 Modelle](#-models--all-29-of-them) · [🧪 Die API verwenden](#-how-to-use-the-api) · [✅ Verifiziert](#-verified-working--every-key-is-tested) · [🧭 So funktioniert es](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Optionen](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Probleme](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Warum es das gibt

`aisale.best` ist ein Go + Vue-Gateway (mit eigenem Panel, intern `site_name: Sub2API`) vor einem gemischten Upstream-Pool. Der Grund, warum es eine Mint-Lane wert ist, ist die Registrierungsoberfläche: Die öffentlichen Einstellungen antworten mit `turnstile_enabled: false` und `aliyun_captcha_enabled: false`, die Registrierung erfolgt per **E-Mail + Passwort hinter einem 6-stelligen Code**, und die ganze Kette ist reines HTTP — kein Browser, kein Captcha-Solver, kein OAuth. Das eigene Bundle des Panels (`assets/EmailVerifyView-*.js`) nennt genau das Feld, das der Register-Aufruf erwartet (`verify_code`), und genau das sendet diese CLI.

## 🎁 Kostenlose Stufe — wie viel du bekommst

Das Panel gewährt einem frischen Konto ein Registrierungsguthaben (`register_balance: 0.5` auf dem Konto, das diese Lane am 2026-10-18 geprägt hat), und der Schlüssel erbt die Gruppe des Kontos. Auf diesem Panel gibt es keinen täglichen Check-in; die Einheit, die skaliert, ist das Konto, weshalb das Tool **ein Konto pro Schlüssel** erstellt.

> 💡 Die kostenlose Stufe wird von aisale.best (Best AI) festgelegt und kann sich ändern. Prüfe die aktuellen Zahlen auf [aisale.best](https://aisale.best) — und lass das Gate des Tools selbst entscheiden:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelle — alle 29 davon

`GET https://aisale.best/v1/models` mit einem frischen Schlüssel antwortete mit **29 IDs** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), alle als Relay-Zeilen im Stil `owned_by: openai` bereitgestellt — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … Das Gate-Modell ist `codex-auto-review`, die günstigste Zeile, die die Triage gemessen hat.

## 🧪 So verwendest du die API

* der Schlüssel ist `sk-` + 64 Hex-Zeichen; er reist als `Authorization: Bearer <key>` auf `/v1/*`
* eine Anfrage pro Schlüssel reicht, um ihn zu beweisen: `POST /v1/chat/completions`, `max_tokens: 16`
* das Relay antwortet sowohl mit reinem JSON als auch mit `text/event-stream`; die CLI parst beides
* ein frisches Konto antwortet auf jedem Modell seiner Gruppe — das Gate wählt das günstigste

## 🛠 Schnellstart

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

### 🖱️ Der Launcher

`src/launcher.js` (gleiches Banner wie diese README) startet den Connector: Er liest `keys.txt`, behält nur die Schlüssel, die auf ein Live-`/v1/models` antworten, und übergibt die überlebenden an den 9Router-Connector mit `https://aisale.best/v1` als Basis-URL. `src/connect-9router.js` registriert den Provider unter dem Präfix `aisale` mit `codex-auto-review` als Standardmodell.

## ✅ Verifiziert funktionierend — jeder Schlüssel wird getestet

Mint-Zeit-Nachweis, 2026-10-23: Ein von dieser CLI geprägter Schlüssel antwortete mit einem **Live-Chat-200** mit `chat=200 tools=get_time` (`node public-cli.js --verify-only` bewies jede Zeile von `keys.txt` erneut), und derselbe Schlüssel wurde durch einen gepinnten Exit erneut bewiesen. Belege: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (Modelle 29 · p1 `pong` · p2 `Red, blue, green` · Tools `get_time` · Urteil READY-TO-ADD) und `providers/aisale.best/out/mint-lane*.log`.

> **Qualitätsgates.** Jeder Schlüssel hier hat ein Live-`chat-200` bestanden, bevor er in `keys.txt`
> geschrieben wurde (tote Schlüssel werden nie ausgeliefert). Router-Kombinationen folgen derselben Regel
> auf Modellebene: Ein Eintrag wird nur hinzugefügt, **wenn das Modell `chat-200` antwortet und Tools
> aufrufen kann** — ein Modell ohne Tool-Unterstützung, ein toter Schlüssel oder ein toter Provider wird
> verworfen statt hinzugefügt. Führe den Verifizierungsschritt jederzeit erneut aus;
> Fehler werden gemeldet, niemals versteckt.

## 🧭 So funktioniert es

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Registrierung, pro Konto (alles über einen gepinnten Exit):

1. **Mailbox** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` liefert einen Plus-Alias auf einem seiner Pool echter Gmail-Konten zurück. Das Panel erzwingt eine Suffix-Allow-List (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), also ist ein Gmail-Alias die einfache Schiene; die öffentlichen Gmails von Emailnator sind geteilt und mit Spam überflutet, daher sind sie nur der `--mail emailnator`-Fallback.
2. **Code senden** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` und eine 6-stellige Mail.
3. **Code** — `POST temp.tf/api/check` abfragen (Emailnator `/api/message-list` auf der Fallback-Schiene). Die Mailbox wird *vor* dem Senden geschnappt, damit eine bereits vorhandene Nachricht niemals für den Code gehalten werden kann, und jeder 6-stellige Kandidat wird dem Register-Aufruf angeboten, bis das Panel einen akzeptiert.
4. **Registrieren** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` im Antwort-Body. Falsche Feldnamen antworten mit `EMAIL_VERIFY_REQUIRED`; ein veralteter Code antwortet mit `INVALID_VERIFY_CODE`.
5. **Schlüssel** — `GET /api/v1/groups/available` → die erste Gruppen-ID, dann `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **Gate** — `POST /v1/chat/completions` zweimal mit unterschiedlichen Prompts (beide 200, nicht leer, unterschiedlich) plus ein `get_time`-Tool-Aufruf; nur ein Schlüssel, der alle drei besteht, wird an `keys.txt` angehängt.

## ⚙️ CLI-Optionen

| Flag | Bedeutung |
| --- | --- |
| `--count N` | Konten (= Schlüssel); jedes wird geprüft, bevor es behalten wird |
| `--conc N` | Konten gleichzeitig in Bearbeitung (max. 8) |
| `--model <id>` | Gate-Modell (Standard `codex-auto-review`) |
| `--group <id>` | Gruppen-ID für den Schlüssel (Standard: erste aus `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | Exits, eine pro Zeile / ein einzelner Exit für alles |
| `--tries N` | pro Konto versuchte Exits, bevor aufgegeben wird |
| `--verify-only` | jeden Schlüssel in `keys.txt` mit einem Live-Chat-Aufruf erneut prüfen |
| `--screen` | nur die Exit-Liste gegen das Panel testen |

## 🛰️ Hinter einem Proxy

Jede Panel-Anfrage (und der Mailbox-Aufruf) geht durch **einen gepinnten Exit pro Konto** — dieselbe Adresse für die Code-Anfrage, den Register-Aufruf, das Key-Minting und das Gate. Die Exit-Liste ist eine einfache Datei, eine `http://host:port` oder `socks5://host:port` pro Zeile, übergeben mit `--pool` oder der Umgebungsvariable `AISALE_PROXIES`; ohne sie verbindet sich das Tool direkt.

## 📄 Dateien

| Datei | Was |
| --- | --- |
| `keys.txt` | verifizierte Schlüssel, einer pro Zeile |
| `accounts.json` | Konto ↔ Exit ↔ Gate-Datensatz |
| `repo-spec.json` | diese Packaging-Spezifikation |
| `public-cli.js` | Mint / Verify / Screen (nur Node-Stdlib) |
| `out/triage-*.json` | unabhängige Schlüssel-Triage (Modelle, zwei Prompts, Tools) |
| `out/mint-lane*.log` | rohe Mint-Läufe |

## 🔌 Mit 9Router verbinden

Als benutzerdefinierten OpenAI-kompatiblen Provider zu 9Router hinzufügen:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Mit OmniRoute verbinden

Als benutzerdefinierten OpenAI-kompatiblen Provider zu OmniRoute hinzufügen:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 Was ein Schlüssel dir bringt

| | |
| --- | --- |
| 🏢 Anbieter | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 Was der Anbieter gibt | ein Konto pro Schlüssel — E-Mail-Code-Registrierung ohne Captcha, jeder Schlüssel vor dem Schreiben chat-verifiziert |
| 🔑 Was ein Schlüssel dir bringt | einen API-Schlüssel, der auf sein eigenes Konto beschränkt ist: die 29 Modell-IDs am untenstehenden Endpunkt, im Rahmen deines Tarifs. Das Kontingent liegt beim **Konto**, weshalb dieses Tool genau ein Konto pro Schlüssel erstellt |
| 🌐 API-Form | OpenAI-kompatibel: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Deine Daten | nur aisale.best und das von dir konfigurierte Inbox-Backend werden kontaktiert; Schlüssel bleiben auf deinem Rechner |

## 🐞 Probleme

* **Die E-Mail-Suffix-Allow-List wird erzwungen.** `@hotmail.com` / `@outlook.com` / Wegwerf-Domains werden mit `EMAIL_SUFFIX_NOT_ALLOWED` und der Liste der 12 erlaubten Suffixe abgelehnt; verwende eine Adresse der Gmail-Klasse.
* **`EMAIL_VERIFY_REQUIRED` bedeutet, dass der Feldname falsch ist**, nicht dass ein Code fehlt — der Register-Body erwartet `verify_code` (aus dem eigenen Bundle des Panels ausgelesen), und ein veralteter/falscher Code antwortet stattdessen mit `INVALID_VERIFY_CODE`.
* **Emailnator-Inboxen sind geteilt.** Ein Code, den du nicht angefordert hast, gehört jemand anderem; die CLI akzeptiert nur Nachrichten, die nach ihrem eigenen Senden eintreffen, und das Live-Gate entscheidet, ob ein Schlüssel ausgeliefert wird.
* Das eigene Frontend des Panels ist eine SPA, deren API-Basis `/api/v1` ist; jeder oben genannte Endpunkt wurde aus seinem Bundle ausgelesen und dann gegen die Live-API bestätigt.

## 📄 Lizenz

MIT © 2026 — siehe [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>