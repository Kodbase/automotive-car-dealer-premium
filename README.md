# 🚗 Revive Auto Lab

> Full-stack araç bakım randevu sistemi — Next.js 15, Supabase, Resend

Gerçek bir işletme için tasarlanmış, production-ready randevu ve yönetim sistemi. Aynı zamanda **SaaS template** olarak kullanıma uygun — paket adları, lokasyonlar, renkler ve içerikler tamamen özelleştirilebilir.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=flat-square&logo=supabase)
![Resend](https://img.shields.io/badge/Resend-Email-000000?style=flat-square)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel)

---

## Ne Bu?

Randevu sistemine ihtiyaç duyan herhangi bir küçük işletmeye uyarlanabilecek bir full-stack uygulama. Berber, klinik, araç bakım, spor salonu — slot tabanlı çalışan her sektör için temel alınabilir.

**Demo:** `automotive-car-dealer-premium.vercel.app`

---

## Öne Çıkan Özellikler

### Müşteri Deneyimi
- 5 adımlı randevu akışı — paket, şube, tarih, bilgiler, onay
- E-posta OTP doğrulaması — şifresiz, kayıtsız erişim
- Randevu takip sayfası — link olmadan, sadece e-posta ile
- Randevu iptal ve yeniden zamanlama
- Gerçek zamanlı slot doluluk kontrolü
- Plaka bazlı çakışma önleme
- TR / EN tam dil desteği
- Dark / Light tema

### Yönetim Paneli
- Rol bazlı erişim — `admin` ve `staff`
- Rezervasyon yönetimi ve durum takibi
- Paket ve şube yönetimi
- Dinamik çalışma saati ve slot ayarları
- İmmutable log sistemi — her işlem kayıt altında
- Staff hesabı oluşturma

### Teknik Detaylar
- Dinamik slot üretimi — admin her gün slot oluşturmak zorunda değil
- Atomic rezervasyon — PostgreSQL function ile race condition'a karşı korumalı
- Transactional e-postalar — onay, iptal, durum değişikliği, OTP
- Schema.org JSON-LD — LocalBusiness, FAQPage, Service
- Dinamik sitemap ve robots
- SEO-ready metadata — TR/EN, OpenGraph

---

## Stack

```
Frontend  →  Next.js 15 (App Router) + React + CSS Modules
Backend   →  Next.js API Routes + Supabase PostgreSQL
Auth      →  Supabase Auth + custom OTP (e-posta bazlı)
E-posta   →  Resend
Deploy    →  Vercel
```

Tailwind yok. Tüm stiller CSS Modules ve CSS variables ile yazıldı — tam kontrol, sıfır bağımlılık.

---

## Hızlı Başlangıç

```bash
git clone git@github.com:Kodbase/automotive-car-dealer-premium.git
cd automotive-car-dealer-premium
npm install
```

`.env.local` oluştur:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CONTACT_RECEIVER_EMAIL=info@example.com
```

Supabase SQL Editor'da `supabase/migrations/` altındaki dosyaları sırayla çalıştır, ardından `functions.sql`, `triggers.sql`, `rls-policies.sql`. 
Not: Bazı SQL kodları eksik olabilir.

```bash
npm run dev
```

---

## Template Olarak Kullanmak

Kendi işletmen veya müştering için uyarlamak istiyorsan değiştirmen gereken tek dosya:

**`constants/config.js`** — işletme adı, telefon, e-posta, adres, sosyal medya

**`i18n/tr.js` + `i18n/en.js`** — tüm sayfa metinleri ve SSS soruları

**`styles/variables.css`** — `--brand` renk değişkeni ile tüm marka rengi tek satırdan değişir

**`app/layout.jsx`** — Schema.org içindeki işletme bilgileri

Veritabanındaki paketler ve lokasyonlar panel üzerinden yönetildiği için kod değişikliği gerektirmez.

---

## Proje Yapısı

```
├── app/
│   ├── [lang]/          # Herkese açık sayfalar (TR/EN)
│   ├── api/             # Tüm API route'ları
│   ├── panel/           # Yönetim paneli
│   ├── sitemap.js       # Dinamik sitemap
│   └── robots.js
├── components/
│   ├── layout/          # Navbar, Footer
│   ├── sections/        # Hero, Pricing, FAQ, Contact
│   └── ui/              # Button, Card, Input, Modal, Select
├── lib/
│   ├── engines/         # Booking, slot, rule, capacity logic
│   ├── server/          # Supabase, email, log servisleri
│   └── client/          # Browser-side Supabase client
├── hooks/               # useAuth, useBooking, useLanguage, useTheme
├── i18n/                # Dil dosyaları
├── styles/              # CSS Modules
└── supabase/            # Migration, trigger, RLS, seed dosyaları
```

---

## Ekran Görüntüleri

> _yakında_

---

## Lisans

MIT — kişisel ve ticari projelerde serbestçe kullanılabilir.