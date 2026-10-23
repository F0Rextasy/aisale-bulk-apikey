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

**Crea cuentas de aisale.best en masa con claves API — inferencia compatible con OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Inicio rápido](#-quick-start) · [🎁 Nivel gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-29-of-them) · [🧪 Usa la API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Cómo funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opciones](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por qué existe esto

`aisale.best` es una pasarela Go + Vue (con su propio panel, `site_name: Sub2API` internamente) situada delante de un grupo heterogéneo de upstreams. La razón por la que merece la pena una vía de acuñación es la superficie de registro: su configuración pública responde `turnstile_enabled: false` y `aliyun_captcha_enabled: false`, el registro es **correo electrónico + contraseña tras un código de 6 dígitos**, y toda la cadena es HTTP simple — sin navegador, sin solucionador de captchas, sin OAuth. El propio bundle del panel (`assets/EmailVerifyView-*.js`) nombra el campo exacto que la llamada de registro espera (`verify_code`), que es lo que envía este CLI.

## 🎁 Nivel gratuito — cuánto obtienes

El panel otorga un saldo de registro a una cuenta nueva (`register_balance: 0.5` en la cuenta que esta vía acuñó el 2026-10-18), y la clave hereda el grupo de la cuenta. No hay check-in diario en este panel; la unidad que escala es la cuenta, por lo que la herramienta crea **una cuenta por clave**.

> 💡 El nivel gratuito lo establece aisale.best (Best AI) y puede cambiar. Consulta las cifras en vivo en [aisale.best](https://aisale.best) — y deja que la propia puerta de la herramienta decida:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — los 29

`GET https://aisale.best/v1/models` con una clave nueva respondió **29 ids** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), todos servidos como filas de retransmisión al estilo `owned_by: openai` — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … El modelo de puerta es `codex-auto-review`, la fila más barata que midió el triaje.

## 🧪 Cómo usar la API

* la clave es `sk-` + 64 caracteres hexadecimales; viaja en `Authorization: Bearer <key>` sobre `/v1/*`
* una petición por clave basta para demostrarlo: `POST /v1/chat/completions`, `max_tokens: 16`
* el relé responde tanto JSON simple como `text/event-stream`; el CLI analiza ambos
* una cuenta nueva responde en todos los modelos de su grupo — la puerta elige el más barato

## 🛠 Inicio rápido

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

### 🖱️ El lanzador

`src/launcher.js` (el mismo banner que este README) arranca el conector: lee `keys.txt`, conserva solo las claves que responden a un `/v1/models` en vivo, y entrega las supervivientes al conector 9Router con `https://aisale.best/v1` como URL base. `src/connect-9router.js` registra el proveedor bajo el prefijo `aisale` con `codex-auto-review` como modelo predeterminado.

## ✅ Verificado y funcionando — cada clave se prueba

Prueba en el momento de la acuñación, 2026-10-23: una clave acuñada por este CLI respondió a un **chat-200 en vivo** con `chat=200 tools=get_time` (`node public-cli.js --verify-only` volvió a probar cada línea de `keys.txt`), y la misma clave se volvió a probar a través de una salida fijada. Evidencia: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (modelos 29 · p1 `pong` · p2 `Red, blue, green` · herramientas `get_time` · veredicto READY-TO-ADD) y `providers/aisale.best/out/mint-lane*.log`.

> **Puertas de calidad.** Cada clave aquí pasó un `chat-200` en vivo antes de escribirse en `keys.txt`
> (las claves muertas nunca se envían). Las combinaciones del router siguen la misma regla a nivel de modelo: una entrada se
> añade **solo si el modelo responde `chat-200` y puede llamar a herramientas** — un modelo sin soporte de herramientas,
> una clave muerta o un proveedor muerto se descarta en lugar de añadirse. Vuelve a ejecutar el paso de verificación en cualquier momento;
> los fallos se reportan, nunca se ocultan.

## 🧭 Cómo funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Registro, por cuenta (todo a través de una única salida fijada):

1. **buzón** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` devuelve un alias con signo más en una de su grupo de cuentas de gmail reales. El panel aplica una lista de sufijos permitidos (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), así que un alias de gmail es la vía fácil; los gmails públicos de Emailnator son compartidos y están inundados de spam, por lo que solo son el respaldo `--mail emailnator`.
2. **enviar código** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` y un correo de 6 dígitos.
3. **código** — sondea `POST temp.tf/api/check` (Emailnator `/api/message-list` en la vía de respaldo). El buzón se captura *antes* del envío para que un mensaje preexistente nunca pueda confundirse con el código, y cada candidato de 6 dígitos se ofrece a la llamada de registro hasta que el panel acepta uno.
4. **registro** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` en el cuerpo de la respuesta. Nombres de campo incorrectos responden `EMAIL_VERIFY_REQUIRED`; un código obsoleto responde `INVALID_VERIFY_CODE`.
5. **clave** — `GET /api/v1/groups/available` → el primer id de grupo, luego `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **puerta** — `POST /v1/chat/completions` dos veces con prompts diferentes (ambos 200, no vacíos, diferentes) más una llamada a la herramienta `get_time`; solo una clave que pasa las tres se añade a `keys.txt`.

## ⚙️ Opciones del CLI

| flag | significado |
| --- | --- |
| `--count N` | cuentas (= claves); cada una pasa por la puerta antes de conservarse |
| `--conc N` | cuentas en vuelo (máx. 8) |
| `--model <id>` | modelo de puerta (predeterminado `codex-auto-review`) |
| `--group <id>` | id de grupo para la clave (predeterminado: el primero de `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | salidas, una por línea / una única salida para todo |
| `--tries N` | salidas probadas por cuenta antes de rendirse |
| `--verify-only` | vuelve a comprobar cada clave en `keys.txt` con una llamada de chat en vivo |
| `--screen` | solo prueba la lista de salidas contra el panel |

## 🛰️ Detrás de un proxy

Cada petición al panel (y la llamada al buzón) pasa por **una salida fijada por cuenta** — la misma dirección para la solicitud del código, la llamada de registro, la acuñación de la clave y la puerta. La lista de salidas es un archivo simple, un `http://host:port` o `socks5://host:port` por línea, pasado con `--pool` o la variable de entorno `AISALE_PROXIES`; sin ella, la herramienta se conecta directamente.

## 📄 Archivos

| archivo | qué |
| --- | --- |
| `keys.txt` | claves verificadas, una por línea |
| `accounts.json` | registro de cuenta ↔ salida ↔ puerta |
| `repo-spec.json` | esta especificación de empaquetado |
| `public-cli.js` | acuñar / verificar / cribar (solo stdlib de node) |
| `out/triage-*.json` | triaje independiente de claves (modelos, dos prompts, herramientas) |
| `out/mint-lane*.log` | ejecuciones de acuñación sin procesar |

## 🔌 Conectar con 9Router

Añade a 9Router como proveedor personalizado compatible con OpenAI:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Conectar con OmniRoute

Añade a OmniRoute como proveedor personalizado compatible con OpenAI:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 Qué te da una clave

| | |
| --- | --- |
| 🏢 Proveedor | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 Qué da el proveedor | una cuenta por clave — registro con código de correo sin captcha, cada clave verificada por chat antes de escribirse |
| 🔑 Qué te da una clave | una clave API limitada a su propia cuenta: los 29 ids de modelo en el endpoint de abajo, con los límites de tu plan. La cuota vive en la **cuenta**, que es exactamente por lo que esta herramienta crea una cuenta por clave |
| 🌐 Forma de la API | Compatible con OpenAI: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Tus datos | solo se contacta con aisale.best y el backend de buzón que configures; las claves permanecen en tu máquina |

## 🐞 Problemas

* **La lista de sufijos de correo permitidos se aplica.** `@hotmail.com` / `@outlook.com` / dominios desechables se rechazan con `EMAIL_SUFFIX_NOT_ALLOWED` y la lista de los 12 sufijos permitidos; usa una dirección de la clase gmail.
* **`EMAIL_VERIFY_REQUIRED` significa que el nombre del campo es incorrecto**, no que falte un código — el cuerpo de registro quiere `verify_code` (leído del propio bundle del panel), y un código obsoleto/incorrecto responde `INVALID_VERIFY_CODE` en su lugar.
* **Los buzones de Emailnator son compartidos.** Un código que no solicitaste es de otra persona; el CLI solo acepta mensajes que llegan después de su propio envío, y la puerta en vivo es lo que decide si una clave se envía.
* El propio front end del panel es una SPA cuya base de API es `/api/v1`; cada endpoint anterior se leyó de su bundle y luego se confirmó contra la API en vivo.

## 📄 Licencia

MIT © 2026 — consulta [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>