# 🚀 Starter Fullstack Template

Bu template, **profesyonel full-stack projeler** için hazırlanmıştır.
Amaç: Her projeye **5–10 dakika içinde temiz, ölçeklenebilir ve standart bir yapı ile başlamak**.

İçerik:

* ⚛️ React (Vite) frontend
* 🌐 Node.js / Express backend
* 📱 React Native / Expo mobile
* 🔁 Shared utils (constants, strings, helpers)
* 📚 Dokümantasyon ve script altyapısı

---

## 📦 1. Template Version & Changelog

**Version:** v1.0.0
**Tarih:** 23.03.2026

### Changelog

* Frontend: React 18 + Vite + Router
* Backend: Express + Nodemon + temel yapı
* Mobile: Expo başlangıç setup
* Shared: constants / strings ayrımı
* README: detaylı kullanım ve sistem rehberi

> 🔁 Kural: Her güncellemede version artır ve buraya ekle.

---

## 📁 2. Proje Yapısı

```
starter-fullstack/
│
├─ frontend/      # React web uygulaması
├─ backend/       # Node.js / Express API
├─ mobile/        # React Native / Expo
├─ shared/        # Ortak constants, helpers, strings
├─ docs/          # Projeye özel dokümantasyon
├─ scripts/       # Build / deploy scriptleri
├─ .gitignore
└─ README.md
```

---

## ⚙️ 3. Kurulum ve Çalıştırma

### 3.1 Frontend

```bash
cd frontend
npm install
npm run dev
```

* URL: http://localhost:5173

---

### 3.2 Backend

```bash
cd backend
npm install
npm run dev
```

* API: http://localhost:5000

---

### 3.3 Mobile (Opsiyonel)

```bash
cd mobile
npm install
npm start
```

---

## 🔐 4. .env Kullanımı

### Backend `.env`

```
PORT=5000
DB_URI=mongodb://localhost:27017/mydb
JWT_SECRET=secretkey
```

### Frontend (Vite)

```
VITE_API_BASE_URL=http://localhost:5000/api
```

> ⚠️ `.env` dosyası asla repo’ya pushlanmaz.

---

## 🧠 5. Constants vs Strings

### constants.js

* Sistemsel sabitler
* Kod içinde kullanılan değerler

```js
export const APP_NAME = "StarterApp";
export const MAX_UPLOAD = 10;
```

---

### strings.js

* Kullanıcıya görünen metinler

```js
export const STRINGS = {
  welcome: "Hoş Geldiniz",
  login: "Giriş Yap"
};
```

---

### Mantık:

* constants → sistem
* strings → kullanıcı

---

## 📦 6. Paket Güncelliği Kontrolü

### Kontrol:

```bash
npm outdated
```

### Güncelle:

```bash
npm update
```

### Güvenlik:

```bash
npm audit
npm audit fix
```

---

### ⚠️ Kural:

* Minor/Patch → direkt güncelle
* Major → test etmeden güncelleme

---

## 🌿 7. Branch & Commit Disiplini

### Branch yapısı:

* `main` → stabil
* `feature-*` → yeni özellik
* `fix-*` → hata düzeltme

---

### Commit örnekleri:

```
feat: login page eklendi
fix: navbar bug düzeltildi
chore: dependencies güncellendi
```

---

## 🔁 8. Template Kullanımı

1. GitHub → **Use this template**
2. Yeni repo oluştur
3. Clone et:

```bash
git clone https://github.com/<org-name>/<project>.git
```

---

## 🔄 9. Template Güncellik Kontrolü

* README’de version kontrol et
* Changelog’u incele
* Eski template kullanıyorsan → manuel güncelle

---

## 🧹 10. .gitignore

```
node_modules/
dist/
build/
.env
npm-debug.log*
yarn-error.log*
.DS_Store
.vscode/
.expo/
.expo-shared/
coverage/
*.tmp
*.swp
Thumbs.db
```

---

## ⚠️ 11. Kritik Kurallar

* ❌ node_modules pushlama
* ❌ .env pushlama
* ❌ main branch’e direkt kod yazma
* ✅ feature branch kullan
* ✅ README güncel tut
* ✅ paketleri kontrol et

---

## 🎯 12. Kullanım Akışı

1. Template’ten repo oluştur
2. `npm install` (frontend/backend/mobile)
3. `.env` oluştur
4. Feature branch aç
5. Geliştir → commit → PR → merge

---

## 💥 Sert Gerçek

* Template düzenli değilse → projeler çöker
* README yoksa → kimse projeyi anlayamaz
* Paketler eskiyse → bug ve güvenlik açığı kaçınılmaz

---

## ✅ Sonuç

Bu template ile:

* Her projeye **standart başlangıç**
* Temiz mimari
* Ölçeklenebilir yapı
* Profesyonel geliştirme süreci

---

> Bu repo bir başlangıçtır. Disiplinsiz kullanırsan hiçbir değeri yok.
