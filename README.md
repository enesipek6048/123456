# Ezel — Private Space

Basit, tek kişilik bir giriş ekranı ve arkasındaki özel sayfalar. Saf HTML / CSS / JavaScript; derleme adımı yok.

## Sayfalar

| Dosya | Açıklama |
|---|---|
| `index.html` | Giriş ekranı (cam efektli kart + arka planda YouTube videosu) |
| `home.html` | Girişten sonra açılan akordeon galeri |
| `gallery.html` | Yerel görsellerden ızgara galeri + lightbox |
| `letter.html` | Tek sütun mektup sayfası |
| `timeline.html` | Dikey zaman çizelgesi / anılar |

## Giriş bilgileri

Kullanıcı adı `ezel`, şifre `123456` — [`script.js`](script.js) içinde tanımlı.

> Not: Doğrulama tamamen istemci tarafındadır, gerçek güvenlik sağlamaz. Sayfa kaynağına bakan herkes şifreyi görebilir.

## Yerel çalıştırma

Herhangi bir statik sunucu yeterli:

```bash
npx serve .
```

sonra tarayıcıda `http://localhost:3000` (veya sunucunun verdiği port).
