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

**Crie contas em massa no aisale.best com chaves de API — inferência compatível com OpenAI + conector 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Início rápido](#-quick-start) · [🎁 Plano gratuito](#-free-tier--how-much-you-get) · [🤖 Modelos](#-models--all-29-of-them) · [🧪 Use a API](#-how-to-use-the-api) · [✅ Verificado](#-verified-working--every-key-is-tested) · [🧭 Como funciona](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Opções](#️-cli-options) · [🛰️ Proxies](#️-behind-a-proxy) · [🐞 Problemas](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Por que isto existe

`aisale.best` é um gateway Go + Vue (com painel próprio, `site_name: Sub2API` internamente) que fica na frente de um pool misto de upstreams. O motivo de valer uma rota de criação é a superfície de cadastro: suas configurações públicas respondem `turnstile_enabled: false` e `aliyun_captcha_enabled: false`, o registro é **e-mail + senha atrás de um código de 6 dígitos**, e toda a cadeia é HTTP puro — sem navegador, sem solucionador de captcha, sem OAuth. O próprio bundle do painel (`assets/EmailVerifyView-*.js`) nomeia o campo exato que a chamada de registro espera (`verify_code`), que é o que esta CLI envia.

## 🎁 Plano gratuito — quanto você recebe

O painel concede um saldo de cadastro a uma conta nova (`register_balance: 0.5` na conta que esta rota criou em 2026-10-18), e a chave herda o grupo da conta. Não há check-in diário neste painel; a unidade que escala é a conta, e é por isso que a ferramenta cria **uma conta por chave**.

> 💡 O plano gratuito é definido pelo aisale.best (Best AI) e pode mudar. Confira os números ao vivo em [aisale.best](https://aisale.best) — e deixe o próprio gate da ferramenta decidir:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modelos — todos os 29

`GET https://aisale.best/v1/models` com uma chave nova respondeu **29 ids** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), todos servidos como linhas de relay no estilo `owned_by: openai` — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … O modelo do gate é `codex-auto-review`, a linha mais barata que a triagem mediu.

## 🧪 Como usar a API

* a chave é `sk-` + 64 caracteres hexadecimais; ela usa `Authorization: Bearer <key>` em `/v1/*`
* uma requisição por chave basta para prová-la: `POST /v1/chat/completions`, `max_tokens: 16`
* o relay responde tanto JSON simples quanto `text/event-stream`; a CLI analisa ambos
* uma conta nova responde em todos os modelos do seu grupo — o gate escolhe o mais barato

## 🛠 Início rápido

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

### 🖱️ O launcher

`src/launcher.js` (mesmo banner deste README) inicializa o conector: ele lê `keys.txt`, mantém apenas as chaves que respondem a um `/v1/models` ao vivo, e entrega as sobreviventes ao conector 9Router com `https://aisale.best/v1` como URL base. `src/connect-9router.js` registra o provedor sob o prefixo `aisale` com `codex-auto-review` como modelo padrão.

## ✅ Verificado e funcionando — toda chave é testada

Prova no momento da criação, 2026-10-23: uma chave criada por esta CLI respondeu a um **chat-200 ao vivo** com `chat=200 tools=get_time` (`node public-cli.js --verify-only` reprovou cada linha de `keys.txt`), e a mesma chave foi reprovada através de uma saída fixada. Evidências: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (modelos 29 · p1 `pong` · p2 `Red, blue, green` · ferramentas `get_time` · veredito READY-TO-ADD) e `providers/aisale.best/out/mint-lane*.log`.

> **Portões de qualidade.** Toda chave aqui passou por um `chat-200` ao vivo antes de ser escrita em `keys.txt`
> (chaves mortas nunca são entregues). As combinações do roteador seguem a mesma regra no nível do modelo: uma entrada é
> adicionada **somente se o modelo responder `chat-200` e conseguir chamar ferramentas** — um modelo sem suporte a ferramentas,
> uma chave morta ou um provedor morto é descartado em vez de adicionado. Reexecute a etapa de verificação a qualquer momento;
> as falhas são relatadas, nunca escondidas.

## 🧭 Como funciona

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Cadastro, por conta (tudo através de uma única saída fixada):

1. **caixa de correio** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` devolve um alias com plus em uma de seu pool de contas gmail reais. O painel impõe uma lista de permissão de sufixos (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), então um alias gmail é o caminho fácil; os gmails públicos do Emailnator são compartilhados e inundados de spam, então são apenas o fallback `--mail emailnator`.
2. **enviar código** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` e um e-mail de 6 dígitos.
3. **código** — faça polling em `POST temp.tf/api/check` (Emailnator `/api/message-list` na rota de fallback). A caixa de correio é fotografada *antes* do envio para que uma mensagem pré-existente nunca possa ser confundida com o código, e cada candidato de 6 dígitos é oferecido à chamada de registro até que o painel aceite um.
4. **registro** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` no corpo da resposta. Nomes de campo errados respondem `EMAIL_VERIFY_REQUIRED`; um código obsoleto responde `INVALID_VERIFY_CODE`.
5. **chave** — `GET /api/v1/groups/available` → o primeiro id de grupo, depois `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **gate** — `POST /v1/chat/completions` duas vezes com prompts diferentes (ambos 200, não vazios, diferentes) mais uma chamada de ferramenta `get_time`; apenas uma chave que passa nos três é anexada a `keys.txt`.

## ⚙️ Opções da CLI

| flag | significado |
| --- | --- |
| `--count N` | contas (= chaves); cada uma passa pelo gate antes de ser mantida |
| `--conc N` | contas em andamento (máx. 8) |
| `--model <id>` | modelo do gate (padrão `codex-auto-review`) |
| `--group <id>` | id do grupo para a chave (padrão: primeiro de `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | saídas, uma por linha / uma única saída para tudo |
| `--tries N` | saídas tentadas por conta antes de desistir |
| `--verify-only` | reverifica cada chave em `keys.txt` com uma chamada de chat ao vivo |
| `--screen` | apenas testa a lista de saídas contra o painel |

## 🛰️ Atrás de um proxy

Toda requisição ao painel (e a chamada à caixa de correio) passa por **uma saída fixada por conta** — o mesmo endereço para a requisição de código, a chamada de registro, a criação da chave e o gate. A lista de saídas é um arquivo simples, um `http://host:port` ou `socks5://host:port` por linha, passado com `--pool` ou a variável de ambiente `AISALE_PROXIES`; sem ela, a ferramenta se conecta diretamente.

## 📄 Arquivos

| arquivo | o quê |
| --- | --- |
| `keys.txt` | chaves verificadas, uma por linha |
| `accounts.json` | registro de conta ↔ saída ↔ gate |
| `repo-spec.json` | esta especificação de empacotamento |
| `public-cli.js` | criar / verificar / triar (apenas stdlib do node) |
| `out/triage-*.json` | triagem independente de chaves (modelos, dois prompts, ferramentas) |
| `out/mint-lane*.log` | execuções brutas de criação |

## 🔌 Conectar ao 9Router

Adicione ao 9Router como um provedor personalizado compatível com OpenAI:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Conectar ao OmniRoute

Adicione ao OmniRoute como um provedor personalizado compatível com OpenAI:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 O que uma chave lhe dá

| | |
| --- | --- |
| 🏢 Provedor | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 O que o provedor dá | uma conta por chave — cadastro por código de e-mail sem captcha, toda chave verificada por chat antes de ser escrita |
| 🔑 O que uma chave lhe dá | uma chave de API limitada à sua própria conta: os 29 ids de modelo no endpoint abaixo, nos limites do seu plano. A cota fica na **conta**, e é exatamente por isso que esta ferramenta cria uma conta por chave |
| 🌐 Formato da API | Compatível com OpenAI: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Seus dados | apenas aisale.best e o backend de caixa de correio que você configurar são contatados; as chaves ficam na sua máquina |

## 🐞 Problemas

* **A lista de permissão de sufixos de e-mail é aplicada.** `@hotmail.com` / `@outlook.com` / domínios descartáveis são recusados com `EMAIL_SUFFIX_NOT_ALLOWED` e a lista dos 12 sufixos permitidos; use um endereço da classe gmail.
* **`EMAIL_VERIFY_REQUIRED` significa que o nome do campo está errado**, não que falta um código — o corpo do registro quer `verify_code` (lido do próprio bundle do painel), e um código obsoleto/errado responde `INVALID_VERIFY_CODE` em vez disso.
* **As caixas de entrada do Emailnator são compartilhadas.** Um código que você não pediu é de outra pessoa; a CLI só aceita mensagens que chegam após o seu próprio envio, e o gate ao vivo é o que decide se uma chave é entregue.
* O próprio front end do painel é uma SPA cuja base da API é `/api/v1`; cada endpoint acima foi lido do seu bundle e depois confirmado contra a API ao vivo.

## 📄 Licença

MIT © 2026 — veja [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>