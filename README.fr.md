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

**Créez en masse des comptes aisale.best avec des clés API — inférence compatible OpenAI + connecteur 9Router.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Démarrage rapide](#-quick-start) · [🎁 Offre gratuite](#-free-tier--how-much-you-get) · [🤖 Modèles](#-models--all-29-of-them) · [🧪 Utiliser l'API](#-how-to-use-the-api) · [✅ Vérifié](#-verified-working--every-key-is-tested) · [🧭 Comment ça marche](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Options](#️-cli-options) · [🛰️ Proxys](#️-behind-a-proxy) · [🐞 Problèmes](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Pourquoi ce projet existe

`aisale.best` est une passerelle Go + Vue (son propre panneau, `site_name: Sub2API` en interne) placée devant un pool amont mixte. Ce qui en fait une voie intéressante, c'est la surface d'inscription : ses paramètres publics répondent `turnstile_enabled: false` et `aliyun_captcha_enabled: false`, l'inscription se fait par **e-mail + mot de passe derrière un code à 6 chiffres**, et toute la chaîne est du HTTP simple — pas de navigateur, pas de solveur de captcha, pas d'OAuth. Le propre bundle du panneau (`assets/EmailVerifyView-*.js`) nomme le champ exact attendu par l'appel d'inscription (`verify_code`), et c'est ce que cette CLI envoie.

## 🎁 Offre gratuite — ce que vous obtenez

Le panneau accorde un solde d'inscription à un nouveau compte (`register_balance: 0.5` sur le compte que cette voie a créé le 2026-10-18), et la clé hérite du groupe du compte. Il n'y a pas de check-in quotidien sur ce panneau ; l'unité qui s'accumule est le compte, c'est pourquoi l'outil crée **un compte par clé**.

> 💡 L'offre gratuite est définie par aisale.best (Best AI) et peut changer. Consultez les chiffres en direct sur [aisale.best](https://aisale.best) — et laissez le propre contrôle de l'outil décider :

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modèles — les 29 au complet

`GET https://aisale.best/v1/models` avec une clé fraîche a répondu **29 ids** (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), tous servis comme des lignes de relais de style `owned_by: openai` — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … Le modèle de contrôle est `codex-auto-review`, la ligne la moins chère mesurée par le triage.

## 🧪 Comment utiliser l'API

* la clé est `sk-` + 64 caractères hexadécimaux ; elle passe par `Authorization: Bearer <key>` sur `/v1/*`
* une requête par clé suffit pour la prouver : `POST /v1/chat/completions`, `max_tokens: 16`
* le relais répond à la fois en JSON simple et en `text/event-stream` ; la CLI analyse les deux
* un compte frais répond sur chaque modèle de son groupe — le contrôle choisit le moins cher

## 🛠 Démarrage rapide

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

### 🖱️ Le lanceur

`src/launcher.js` (même bannière que ce README) démarre le connecteur : il lit `keys.txt`, ne garde que les clés qui répondent à un `/v1/models` en direct, et transmet celles qui survivent au connecteur 9Router avec `https://aisale.best/v1` comme URL de base. `src/connect-9router.js` enregistre le fournisseur sous le préfixe `aisale` avec `codex-auto-review` comme modèle par défaut.

## ✅ Vérifié fonctionnel — chaque clé est testée

Preuve au moment de la création, 2026-10-23 : une clé créée par cette CLI a répondu à un **chat-200 en direct** avec `chat=200 tools=get_time` (`node public-cli.js --verify-only` a re-prouvé chaque ligne de `keys.txt`), et la même clé a été re-prouvée via une sortie épinglée. Preuves : `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (models 29 · p1 `pong` · p2 `Red, blue, green` · tools `get_time` · verdict READY-TO-ADD) et `providers/aisale.best/out/mint-lane*.log`.

> **Contrôles de qualité.** Chaque clé ici a passé un `chat-200` en direct avant d'être écrite dans `keys.txt`
> (les clés mortes ne sont jamais livrées). Les combinaisons de routeur suivent la même règle au niveau du modèle : une entrée n'est
> ajoutée **que si le modèle répond `chat-200` et peut appeler des outils** — un modèle sans support des outils,
> une clé morte ou un fournisseur mort est écarté plutôt qu'ajouté. Relancez l'étape de vérification à tout moment ;
> les échecs sont signalés, jamais cachés.

## 🧭 Comment ça marche

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Inscription, par compte (le tout via une seule sortie épinglée) :

1. **boîte mail** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` renvoie un alias plus sur l'un de ses comptes gmail réels. Le panneau applique une liste blanche de suffixes (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), donc un alias gmail est la voie facile ; les gmails publics d'Emailnator sont partagés et inondés de spam, ils ne sont donc que le repli `--mail emailnator`.
2. **envoi du code** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` et un mail à 6 chiffres.
3. **code** — interroger `POST temp.tf/api/check` (Emailnator `/api/message-list` sur la voie de repli). La boîte mail est capturée *avant* l'envoi pour qu'un message préexistant ne puisse jamais être pris pour le code, et chaque candidat à 6 chiffres est proposé à l'appel d'inscription jusqu'à ce que le panneau en accepte un.
4. **inscription** — `POST /api/v1/auth/register {email,password,verify_code}` → `access_token` dans le corps de la réponse. De mauvais noms de champs répondent `EMAIL_VERIFY_REQUIRED` ; un code périmé répond `INVALID_VERIFY_CODE`.
5. **clé** — `GET /api/v1/groups/available` → le premier id de groupe, puis `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **contrôle** — `POST /v1/chat/completions` deux fois avec des prompts différents (les deux 200, non vides, différents) plus un appel d'outil `get_time` ; seule une clé qui passe les trois est ajoutée à `keys.txt`.

## ⚙️ Options de la CLI

| option | signification |
| --- | --- |
| `--count N` | comptes (= clés) ; chacun est contrôlé avant d'être conservé |
| `--conc N` | comptes en cours (max 8) |
| `--model <id>` | modèle de contrôle (par défaut `codex-auto-review`) |
| `--group <id>` | id de groupe pour la clé (par défaut : le premier de `/groups/available`) |
| `--pool <file>` / `--proxy <url>` | sorties, une par ligne / une seule sortie pour tout |
| `--tries N` | sorties essayées par compte avant d'abandonner |
| `--verify-only` | revérifier chaque clé de `keys.txt` avec un appel de chat en direct |
| `--screen` | tester uniquement la liste des sorties contre le panneau |

## 🛰️ Derrière un proxy

Chaque requête au panneau (et l'appel à la boîte mail) passe par **une sortie épinglée par compte** — la même adresse pour la demande de code, l'appel d'inscription, la création de clé et le contrôle. La liste des sorties est un simple fichier, un `http://host:port` ou `socks5://host:port` par ligne, passé avec `--pool` ou la variable d'environnement `AISALE_PROXIES` ; sans cela, l'outil se connecte directement.

## 📄 Fichiers

| fichier | quoi |
| --- | --- |
| `keys.txt` | clés vérifiées, une par ligne |
| `accounts.json` | enregistrement compte ↔ sortie ↔ contrôle |
| `repo-spec.json` | cette spécification d'empaquetage |
| `public-cli.js` | création / vérification / filtrage (stdlib node uniquement) |
| `out/triage-*.json` | triage indépendant des clés (modèles, deux prompts, outils) |
| `out/mint-lane*.log` | exécutions de création brutes |

## 🔌 Connexion à 9Router

Ajoutez à 9Router comme fournisseur personnalisé compatible OpenAI :

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 Connexion à OmniRoute

Ajoutez à OmniRoute comme fournisseur personnalisé compatible OpenAI :

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 Ce qu'une clé vous donne

| | |
| --- | --- |
| 🏢 Fournisseur | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 Ce que le fournisseur donne | un compte par clé — inscription par code e-mail sans captcha, chaque clé vérifiée par chat avant d'être écrite |
| 🔑 Ce qu'une clé vous donne | une clé API limitée à son propre compte : les 29 ids de modèles sur le point de terminaison ci-dessous, aux limites de votre forfait. Le quota réside sur le **compte**, c'est exactement pourquoi cet outil crée un compte par clé |
| 🌐 Forme de l'API | Compatible OpenAI : `POST https://aisale.best/v1/chat/completions` |
| 🔒 Vos données | seuls aisale.best et le backend de boîte mail que vous configurez sont contactés ; les clés restent sur votre machine |

## 🐞 Problèmes

* **La liste blanche des suffixes e-mail est appliquée.** `@hotmail.com` / `@outlook.com` / les domaines jetables sont refusés avec `EMAIL_SUFFIX_NOT_ALLOWED` et la liste des 12 suffixes autorisés ; utilisez une adresse de la classe gmail.
* **`EMAIL_VERIFY_REQUIRED` signifie que le nom du champ est incorrect**, pas qu'un code manque — le corps d'inscription attend `verify_code` (lu dans le propre bundle du panneau), et un code périmé/incorrect répond `INVALID_VERIFY_CODE` à la place.
* **Les boîtes Emailnator sont partagées.** Un code que vous n'avez pas demandé appartient à quelqu'un d'autre ; la CLI n'accepte que les messages arrivant après son propre envoi, et c'est le contrôle en direct qui décide si une clé est livrée.
* Le propre front-end du panneau est une SPA dont la base d'API est `/api/v1` ; chaque point de terminaison ci-dessus a été lu dans son bundle puis confirmé contre l'API en direct.

## 📄 Licence

MIT © 2026 — voir [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>