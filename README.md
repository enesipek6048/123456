# Ezel — Private Space

Basit, tek kişilik bir giriş ekranı ve arkasındaki özel sayfalar. Saf HTML / CSS / JavaScript; derleme adımı yok.

## Sayfalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Giriş ekranı (cam efektli kart + arka planda YouTube videosu) |
| `home.html` | Girişten sonra açılan akordeon galeri |
| `gallery.html` | Izgara galeri + lightbox |
| `letter.html` | Tek sütun mektup sayfası |
| `papatya.html` | Papatya falı (seviyor / sevmiyor) mini oyunu |

## Giriş bilgileri

Kullanıcı adı `ezel`, şifre `123456` — [`script.js`](script.js) içinde tanımlı.

> Not: Doğrulama tamamen istemci tarafındadır, gerçek güvenlik sağlamaz. Sayfa kaynağına bakan herkes şifreyi görebilir.

## Galeri foto yükleme (Vercel Blob)

`gallery.html` üzerindeki **+ Fotoğraf ekle** butonu, seçilen görseli tarayıcıda
küçültüp `POST /api/upload`'a gönderir; sunucu onu Vercel Blob'a koyar ve herkese
açık URL döner. `GET /api/photos` yüklenmiş fotoğrafları listeler.

`letter.html` de aynı Blob store'u kullanır: metin alanı `GET /api/letter` ile,
altındaki küçük çizim tuvali `GET /api/drawing` ile yüklenir. **Kaydet** (veya
Ctrl/Cmd+S) ikisini birden yazar — `letter/current.txt` ve `drawing/current.png`
blob'larını üzerine yazarak.

Çalışması için Vercel projesine bir **Blob store** bağlanmalı:

1. Vercel panosu → proje → **Storage** → **Create Database** → **Blob** → projeye bağla.
2. Bu, `BLOB_READ_WRITE_TOKEN` ortam değişkenini otomatik ekler.
3. Yeniden deploy et (`git push` yeterli).

Store bağlı değilken `/api/upload` 500 döner; site geri kalanı normal çalışır.
Yerel statik sunucuda `/api/*` yoktur, yükleme sadece yayında çalışır.

## Yerel çalıştırma

Herhangi bir statik sunucu yeterli:

```bash
npx serve .
```

sonra tarayıcıda `http://localhost:3000` (veya sunucunun verdiği port).
