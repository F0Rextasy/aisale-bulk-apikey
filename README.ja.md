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

**APIキー付きのaisale.bestアカウントを一括作成 — OpenAI互換の推論 + 9Routerコネクタ。**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 クイックスタート](#-quick-start) · [🎁 無料枠](#-free-tier--how-much-you-get) · [🤖 モデル](#-models--all-29-of-them) · [🧪 APIを使う](#-how-to-use-the-api) · [✅ 検証済み](#-verified-working--every-key-is-tested) · [🧭 仕組み](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ オプション](#️-cli-options) · [🛰️ プロキシ](#️-behind-a-proxy) · [🐞 問題](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ これが存在する理由

`aisale.best` は、混在した上流プールの前に位置する Go + Vue のゲートウェイです（独自のパネルを持ち、内部的には `site_name: Sub2API`）。これが一攫千金のレーンに値する理由は、サインアップの表面にあります。その公開設定は `turnstile_enabled: false` と `aliyun_captcha_enabled: false` を返し、登録は **6桁のコードを伴うメールアドレス + パスワード** で、チェーン全体がプレーンな HTTP です — ブラウザも、キャプチャソルバーも、OAuth も不要です。パネル自身のバンドル（`assets/EmailVerifyView-*.js`）は、register 呼び出しが要求する正確なフィールド名（`verify_code`）を明示しており、これがこの CLI が送信するものです。

## 🎁 無料枠 — どれだけ得られるか

パネルは新規アカウントにサインアップ残高を付与し（このレーンが 2026-10-18 に作成したアカウントでは `register_balance: 0.5`）、キーはアカウントのグループを継承します。このパネルには毎日のチェックインはありません。スケールする単位はアカウントであり、だからこそこのツールは **キーごとに1つのアカウント** を作成します。

> 💡 無料枠は aisale.best（Best AI）によって設定され、変更される可能性があります。最新の数値は [aisale.best](https://aisale.best) で確認してください — そしてツール自身のゲートに判断を委ねてください:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 モデル — 全29個

新しいキーで `GET https://aisale.best/v1/models` を実行すると **29個のID** が返され（`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`）、すべて `owned_by: openai` 形式のリレー行として提供されます — `codex-auto-review`、`gpt-5.6-sol`、`gpt-5.6-luna`、`gpt-5.6-terra`、`gpt-6-astra`、`gpt-4`、… ゲートモデルは `codex-auto-review` で、トリアージが測定した中で最も安価な行です。

## 🧪 APIの使い方

* キーは `sk-` + 64桁の16進文字です。`/v1/*` 上で `Authorization: Bearer <key>` を伴います
* キーごとに1回のリクエストで証明するのに十分です: `POST /v1/chat/completions`、`max_tokens: 16`
* リレーはプレーンな JSON と `text/event-stream` の両方に応答します。CLI は両方を解析します
* 新しいアカウントはそのグループのすべてのモデルに応答します — ゲートは最も安価なものを選びます

## 🛠 クイックスタート

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

### 🖱️ ランチャー

`src/launcher.js`（この README と同じバナー）はコネクタを起動します: `keys.txt` を読み込み、ライブの `/v1/models` に応答するキーだけを保持し、生き残ったものを `https://aisale.best/v1` をベース URL として 9Router コネクタに渡します。`src/connect-9router.js` はプロバイダをプレフィックス `aisale` で登録し、デフォルトモデルとして `codex-auto-review` を使用します。

## ✅ 動作検証済み — すべてのキーがテストされます

作成時の証明、2026-10-23: この CLI が作成したキーが **ライブ chat-200** に `chat=200 tools=get_time` で応答し（`node public-cli.js --verify-only` が `keys.txt` のすべての行を再証明しました）、同じキーが固定された出口を通じて再証明されました。証拠: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`（models 29 · p1 `pong` · p2 `Red, blue, green` · tools `get_time` · verdict READY-TO-ADD）および `providers/aisale.best/out/mint-lane*.log`。

> **品質ゲート。** ここにあるすべてのキーは、`keys.txt` に書き込まれる前にライブの `chat-200` を通過しています
> （死んだキーは決して出荷されません）。ルーターのコンボもモデルレベルで同じルールに従います: エントリは
> **モデルが `chat-200` に応答し、ツールを呼び出せる場合にのみ** 追加されます — ツールサポートのないモデル、
> 死んだキー、死んだプロバイダは追加されるのではなく削除されます。検証ステップはいつでも再実行できます。
> 失敗は報告され、決して隠されません。

## 🧭 仕組み

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

サインアップ、アカウントごと（すべてが1つの固定された出口を通ります）:

1. **メールボックス** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1` が、実在する gmail アカウントのプールの1つに対するプラスエイリアスを返します。パネルはサフィックスの許可リスト（`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`）を強制するため、gmail エイリアスが簡単なレールです。Emailnator の公開 gmail は共有されておりスパムで溢れているため、`--mail emailnator` のフォールバックにすぎません。
2. **コード送信** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` と6桁のメール。
3. **コード** — `POST temp.tf/api/check` をポーリングします（フォールバックレールでは Emailnator の `/api/message-list`）。メールボックスは送信の*前に*スナップショットされるため、既存のメッセージがコードと誤認されることは決してなく、すべての6桁の候補がパネルが受け入れるまで register 呼び出しに提供されます。
4. **登録** — `POST /api/v1/auth/register {email,password,verify_code}` → レスポンスボディに `access_token`。間違ったフィールド名は `EMAIL_VERIFY_REQUIRED` を返します。古いコードは `INVALID_VERIFY_CODE` を返します。
5. **キー** — `GET /api/v1/groups/available` → 最初のグループ ID、次に `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`。
6. **ゲート** — 異なるプロンプトで `POST /v1/chat/completions` を2回（両方とも 200、非空、異なる）に加えて `get_time` ツール呼び出し。3つすべてを通過したキーのみが `keys.txt` に追加されます。

## ⚙️ CLIオプション

| フラグ | 意味 |
| --- | --- |
| `--count N` | アカウント（= キー）。それぞれが保持される前にゲートされます |
| `--conc N` | 同時進行のアカウント数（最大8） |
| `--model <id>` | ゲートモデル（デフォルト `codex-auto-review`） |
| `--group <id>` | キーのグループ ID（デフォルト: `/groups/available` から最初のもの） |
| `--pool <file>` / `--proxy <url>` | 出口、1行に1つ / すべてに対して単一の出口 |
| `--tries N` | 諦める前にアカウントごとに試行する出口 |
| `--verify-only` | `keys.txt` のすべてのキーをライブチャット呼び出しで再確認 |
| `--screen` | 出口リストをパネルに対してのみテスト |

## 🛰️ プロキシの背後で

すべてのパネルリクエスト（およびメールボックス呼び出し）は **アカウントごとに1つの固定された出口** を通ります — コードリクエスト、register 呼び出し、キー作成、ゲートに対して同じアドレスです。出口リストはプレーンなファイルで、1行に1つの `http://host:port` または `socks5://host:port` で、`--pool` または `AISALE_PROXIES` 環境変数で渡します。これがなければツールは直接接続します。

## 📄 ファイル

| ファイル | 内容 |
| --- | --- |
| `keys.txt` | 検証済みのキー、1行に1つ |
| `accounts.json` | アカウント ↔ 出口 ↔ ゲートの記録 |
| `repo-spec.json` | このパッケージング仕様 |
| `public-cli.js` | 作成 / 検証 / スクリーニング（node 標準ライブラリのみ） |
| `out/triage-*.json` | 独立したキートリアージ（モデル、2つのプロンプト、ツール） |
| `out/mint-lane*.log` | 生の作成実行 |

## 🔌 9Routerへの接続

カスタムの OpenAI 互換プロバイダとして 9Router に追加します:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 OmniRouteへの接続

カスタムの OpenAI 互換プロバイダとして OmniRoute に追加します:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 1つのキーで得られるもの

| | |
| --- | --- |
| 🏢 プロバイダ | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 プロバイダが提供するもの | キーごとに1つのアカウント — キャプチャなしのメールコードサインアップ、すべてのキーが書き込まれる前にチャット検証済み |
| 🔑 1つのキーで得られるもの | 独自のアカウントにスコープされた1つの API キー: 以下のエンドポイントの29個のモデル ID を、プランの制限で。クォータは **アカウント** に存在し、だからこそこのツールはキーごとに1つのアカウントを作成します |
| 🌐 API の形式 | OpenAI 互換: `POST https://aisale.best/v1/chat/completions` |
| 🔒 あなたのデータ | 連絡されるのは aisale.best と設定した受信トレイバックエンドのみです。キーはあなたのマシンに留まります |

## 🐞 問題

* **メールサフィックスの許可リストが強制されます。** `@hotmail.com` / `@outlook.com` / 使い捨てドメインは `EMAIL_SUFFIX_NOT_ALLOWED` と許可された12のサフィックスのリストとともに拒否されます。gmail クラスのアドレスを使用してください。
* **`EMAIL_VERIFY_REQUIRED` はフィールド名が間違っていることを意味します** — コードが欠けているのではありません。register ボディは `verify_code` を要求し（パネル自身のバンドルから読み取ったもの）、古い/間違ったコードは代わりに `INVALID_VERIFY_CODE` を返します。
* **Emailnator の受信トレイは共有されています。** あなたが要求していないコードは他人のものです。CLI は自身の送信後に到着したメッセージのみを受け入れ、キーが出荷されるかどうかを決めるのはライブゲートです。
* パネル自身のフロントエンドは API ベースが `/api/v1` の SPA です。上記のすべてのエンドポイントはそのバンドルから読み取られ、その後ライブ API に対して確認されました。

## 📄 ライセンス

MIT © 2026 — [LICENSE](LICENSE) を参照してください。

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey contributors

</div>