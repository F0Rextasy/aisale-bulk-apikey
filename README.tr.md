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

**API anahtarlarıyla toplu aisale.best hesabı oluşturun — OpenAI uyumlu çıkarım + 9Router bağlayıcısı.**

[![Node](https://img.shields.io/badge/Node-%E2%89%A518-3DA639?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Dependencies](https://img.shields.io/badge/dependencies-0-blue?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-6ea8fe?style=for-the-badge)](LICENSE)
[![Models](https://img.shields.io/badge/models-29%20served-412991?style=for-the-badge)](https://aisale.best)
[![9Router](https://img.shields.io/badge/9Router-connector-8B5CF6?style=for-the-badge)](#-connect-to-9router)
[![OmniRoute](https://img.shields.io/badge/OmniRoute-connector-8B5CF6?style=for-the-badge)](#-connect-to-omniroute)
[![X](https://img.shields.io/badge/X-%40bigbullapp-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/bigbullapp)

[🛠 Hızlı başlangıç](#-quick-start) · [🎁 Ücretsiz katman](#-free-tier--how-much-you-get) · [🤖 Modeller](#-models--all-29-of-them) · [🧪 API'yi kullanın](#-how-to-use-the-api) · [✅ Doğrulandı](#-verified-working--every-key-is-tested) · [🧭 Nasıl çalışır](#-how-it-works) · [🔌 9Router](#-connect-to-9router) · [🔌 OmniRoute](#-connect-to-omniroute) · [⚙️ Seçenekler](#️-cli-options) · [🛰️ Proxy'ler](#️-behind-a-proxy) · [🐞 Sorunlar](#-issues)

</div>

<div align="center">

**English** · [Türkçe](README.tr.md) · [中文](README.cn.md) · [日本語](README.ja.md) · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md) · [Deutsch](README.de.md) · [Русский](README.ru.md) · [Português](README.pt.md)

</div>

---

## ✨ Bu neden var

`aisale.best`, karma bir üst kaynak havuzunun önünde oturan bir Go + Vue ağ geçididir (kendi paneli, dahili olarak `site_name: Sub2API`). Bunu kayda değer kılan şey kayıt yüzeyidir: genel ayarları `turnstile_enabled: false` ve `aliyun_captcha_enabled: false` yanıtını verir, kayıt **6 haneli kod arkasında e-posta + parola** şeklindedir ve tüm zincir düz HTTP'dir — tarayıcı yok, captcha çözücü yok, OAuth yok. Panelin kendi paketi (`assets/EmailVerifyView-*.js`), kayıt çağrısının istediği tam alan adını (`verify_code`) belirtir; bu CLI'ın gönderdiği de budur.

## 🎁 Ücretsiz katman — ne kadar alırsınız

Panel yeni bir hesaba kayıt bakiyesi verir (bu hattın 2026-10-18'de oluşturduğu hesapta `register_balance: 0.5`) ve anahtar hesabın grubunu devralır. Bu panelde günlük giriş yoktur; ölçeklenen birim hesaptır, bu yüzden araç **her anahtar için bir hesap** oluşturur.

> 💡 Ücretsiz katman aisale.best (Best AI) tarafından belirlenir ve değişebilir. Güncel sayıları [aisale.best](https://aisale.best) adresinden kontrol edin — ve kararı aracın kendi kapısına bırakın:

```bash
node src/cli.js --verify-only     # every key in keys.txt is re-tested with a real chat call
```

## 🤖 Modeller — 29'unun tamamı

Yeni bir anahtarla `GET https://aisale.best/v1/models` **29 id** yanıtı verdi (`providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json`), hepsi `owned_by: openai` tarzı aktarma satırları olarak sunuluyor — `codex-auto-review`, `gpt-5.6-sol`, `gpt-5.6-luna`, `gpt-5.6-terra`, `gpt-6-astra`, `gpt-4`, … Kapı modeli `codex-auto-review`'dur, triyajın ölçtüğü en ucuz satır.

## 🧪 API nasıl kullanılır

* anahtar `sk-` + 64 hex karakterdir; `/v1/*` üzerinde `Authorization: Bearer <key>` ile taşınır
* anahtar başına bir istek kanıtlamaya yeter: `POST /v1/chat/completions`, `max_tokens: 16`
* aktarma hem düz JSON hem de `text/event-stream` yanıtlar; CLI her ikisini de ayrıştırır
* yeni bir hesap grubunun her modelinde yanıt verir — kapı en ucuzunu seçer

## 🛠 Hızlı başlangıç

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

### 🖱️ Başlatıcı

`src/launcher.js` (bu README ile aynı banner) bağlayıcıyı başlatır: `keys.txt` dosyasını okur, yalnızca canlı bir `/v1/models` yanıtı veren anahtarları tutar ve hayatta kalanları temel URL olarak `https://aisale.best/v1` ile 9Router bağlayıcısına teslim eder. `src/connect-9router.js`, sağlayıcıyı `aisale` önekiyle ve varsayılan model olarak `codex-auto-review` ile kaydeder.

## ✅ Çalıştığı doğrulandı — her anahtar test edilir

Oluşturma anı kanıtı, 2026-10-23: bu CLI tarafından oluşturulan bir anahtar **canlı chat-200** yanıtı verdi: `chat=200 tools=get_time` (`node public-cli.js --verify-only`, `keys.txt` dosyasının her satırını yeniden kanıtladı) ve aynı anahtar sabitlenmiş bir çıkış üzerinden yeniden kanıtlandı. Kanıt: `providers/aisale.best/out/triage-2026-10-22T21-53-14Z.json` (modeller 29 · p1 `pong` · p2 `Red, blue, green` · araçlar `get_time` · karar READY-TO-ADD) ve `providers/aisale.best/out/mint-lane*.log`.

> **Kalite kapıları.** Buradaki her anahtar `keys.txt` dosyasına yazılmadan önce canlı bir `chat-200` testini geçti
> (ölü anahtarlar asla gönderilmez). Yönlendirici kombinasyonları model düzeyinde aynı kuralı izler: bir giriş
> **yalnızca model `chat-200` yanıtı veriyorsa ve araçları çağırabiliyorsa** eklenir — araç desteği olmayan bir model,
> ölü bir anahtar veya ölü bir sağlayıcı eklenmek yerine çıkarılır. Doğrulama adımını istediğiniz zaman yeniden çalıştırın;
> hatalar bildirilir, asla gizlenmez.

## 🧭 Nasıl çalışır

```
inbox (one address per account)                                  a fresh address per account
   │
   ├─▶ sign-up: aisale.best (Best AI) page → e-mail address → code / link from the inbox
   ├─▶ session: the account's cookies or access token in hand
   ├─▶ key mint: the account's key endpoint → plaintext key returned once (written to disk immediately)
   └─▶ live proof: POST https://aisale.best/v1/chat/completions → real content = the key is live
```

Hesap başına kayıt (tamamı tek bir sabitlenmiş çıkış üzerinden):

1. **posta kutusu** — `temp.tf GET /api/account?providers=gmail&dot=0&plus=1`, gerçek gmail hesaplarından oluşan havuzundan bir plus takma adı döndürür. Panel bir sonek izin listesi uygular (`qq, gmail, 163, 126, yeah, foxmail, sina, sohu, aliyun, icloud, yahoo, proton`), bu yüzden bir gmail takma adı en kolay yoldur; Emailnator'ın genel gmail'leri paylaşımlı ve spam doludur, bu yüzden yalnızca `--mail emailnator` yedek yoludur.
2. **kod gönder** — `POST /api/v1/auth/send-verify-code {email}` → `{"code":0,"message":"success"}` ve 6 haneli bir e-posta.
3. **kod** — `POST temp.tf/api/check` yokla (yedek yolda Emailnator `/api/message-list`). Posta kutusu gönderimden *önce* anlık görüntülenir, böylece önceden var olan bir mesaj asla kodla karıştırılamaz ve her 6 haneli aday, panel birini kabul edene kadar kayıt çağrısına sunulur.
4. **kayıt** — `POST /api/v1/auth/register {email,password,verify_code}` → yanıt gövdesinde `access_token`. Yanlış alan adları `EMAIL_VERIFY_REQUIRED` yanıtı verir; eski bir kod `INVALID_VERIFY_CODE` yanıtı verir.
5. **anahtar** — `GET /api/v1/groups/available` → ilk grup id'si, ardından `POST /api/v1/keys {name,group_id,status:'active'}` → `sk-…`.
6. **kapı** — farklı istemlerle iki kez `POST /v1/chat/completions` (her ikisi de 200, boş değil, farklı) artı bir `get_time` araç çağrısı; yalnızca üçünü de geçen bir anahtar `keys.txt` dosyasına eklenir.

## ⚙️ CLI seçenekleri

| bayrak | anlamı |
| --- | --- |
| `--count N` | hesap (= anahtar); her biri tutulmadan önce kapıdan geçirilir |
| `--conc N` | eşzamanlı hesap (en fazla 8) |
| `--model <id>` | kapı modeli (varsayılan `codex-auto-review`) |
| `--group <id>` | anahtar için grup id'si (varsayılan: `/groups/available` içinden ilki) |
| `--pool <file>` / `--proxy <url>` | çıkışlar, her satırda bir tane / her şey için tek çıkış |
| `--tries N` | vazgeçmeden önce hesap başına denenen çıkış sayısı |
| `--verify-only` | `keys.txt` içindeki her anahtarı canlı bir sohbet çağrısıyla yeniden kontrol et |
| `--screen` | yalnızca çıkış listesini panele karşı test et |

## 🛰️ Proxy arkasında

Her panel isteği (ve posta kutusu çağrısı) **hesap başına tek bir sabitlenmiş çıkış** üzerinden gider — kod isteği, kayıt çağrısı, anahtar oluşturma ve kapı için aynı adres. Çıkış listesi düz bir dosyadır, her satırda bir `http://host:port` veya `socks5://host:port`, `--pool` veya `AISALE_PROXIES` ortam değişkeniyle geçirilir; o olmadan araç doğrudan bağlanır.

## 📄 Dosyalar

| dosya | ne |
| --- | --- |
| `keys.txt` | doğrulanmış anahtarlar, her satırda bir tane |
| `accounts.json` | hesap ↔ çıkış ↔ kapı kaydı |
| `repo-spec.json` | bu paketleme spesifikasyonu |
| `public-cli.js` | oluştur / doğrula / tara (yalnızca node stdlib) |
| `out/triage-*.json` | bağımsız anahtar triyajı (modeller, iki istem, araçlar) |
| `out/mint-lane*.log` | ham oluşturma çalıştırmaları |

## 🔌 9Router'a bağlan

9Router'a özel bir OpenAI uyumlu sağlayıcı olarak ekleyin:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔌 OmniRoute'a bağlan

OmniRoute'a özel bir OpenAI uyumlu sağlayıcı olarak ekleyin:

```json
{
  "name": "aisale.best",
  "prefix": "aisale",
  "baseUrl": "https://aisale.best/v1",
  "apiKeyEnv": "AISALE_KEY",
  "defaultModel": "codex-auto-review"
}
```

## 🔑 Bir anahtar size ne kazandırır

| | |
| --- | --- |
| 🏢 Sağlayıcı | **aisale.best (Best AI)** — [aisale.best](https://aisale.best) |
| 🎁 Sağlayıcının verdikleri | anahtar başına bir hesap — captcha'sız e-posta kodu kaydı, her anahtar yazılmadan önce sohbetle doğrulanır |
| 🔑 Bir anahtar size ne kazandırır | kendi hesabına kapsanmış bir API anahtarı: aşağıdaki uç noktadaki 29 model id'si, planınızın limitlerinde. Kota **hesapta** yaşar, bu aracın anahtar başına bir hesap oluşturmasının nedeni tam da budur |
| 🌐 API şekli | OpenAI uyumlu: `POST https://aisale.best/v1/chat/completions` |
| 🔒 Verileriniz | yalnızca aisale.best ve yapılandırdığınız posta kutusu arka ucuyla iletişim kurulur; anahtarlar makinenizde kalır |

## 🐞 Sorunlar

* **E-posta sonek izin listesi uygulanır.** `@hotmail.com` / `@outlook.com` / tek kullanımlık alan adları `EMAIL_SUFFIX_NOT_ALLOWED` ve izin verilen 12 sonekin listesiyle reddedilir; gmail sınıfı bir adres kullanın.
* **`EMAIL_VERIFY_REQUIRED`, kod eksik olduğu anlamına değil, alan adının yanlış olduğu anlamına gelir** — kayıt gövdesi `verify_code` ister (panelin kendi paketinden okunmuştur) ve eski/yanlış bir kod bunun yerine `INVALID_VERIFY_CODE` yanıtı verir.
* **Emailnator gelen kutuları paylaşımlıdır.** İstemediğiniz bir kod başkasına aittir; CLI yalnızca kendi gönderiminden sonra gelen mesajları kabul eder ve bir anahtarın gönderilip gönderilmeyeceğine karar veren şey canlı kapıdır.
* Panelin kendi ön ucu, API temeli `/api/v1` olan bir SPA'dır; yukarıdaki her uç nokta paketinden okunmuş ve ardından canlı API'ye karşı doğrulanmıştır.

## 📄 Lisans

MIT © 2026 — bkz. [LICENSE](LICENSE).

<div align="center">

**[MIT](LICENSE)** © 2026 aisale-bulk-apikey katkıda bulunanlar

</div>