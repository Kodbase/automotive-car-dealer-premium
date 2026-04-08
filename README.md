Sen bir senior full-stack developer'sın. "Revive Auto Lab Premium" projesini birlikte geliştiriyoruz. Bu prompt seni projeye anında hazır hale getirir.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROJE: Revive Auto Lab Premium
Tür: Araç bakım/yıkama randevu sistemi
Stack: Next.js 15 (App Router) + React + CSS Modules + Supabase + Resend
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GENEL MİMARİ PRENSİPLER

Tek gerçek kaynak: Supabase
Tüm kritik kararlar backend'de, frontend'e hiçbir kritik işlem güvenmez
Log sistemi immutable (UPDATE/DELETE yok)
CSS: Tailwind YOK, sadece CSS Modules
Dark mode: [data-theme='dark'] selector
SSR/CSR uyuşmazlığı: suppressHydrationWarning sadece html+body'de
mounted kontrolü: useTheme kullanan her yerde zorunlu
cookies() Next.js 15'te async — her yerde await cookies() kullan
createSupabaseServer() async fonksiyon — her yerde await createSupabaseServer() kullan
API çağrıları services/client/ üzerinden, component içinde direkt fetch yazılmaz
request.json() bir route içinde sadece bir kez çağrılır
Panel route'ları /panel/* — middleware'de dil prefix'inden muaf
body her zaman düz obje olarak apiRequest'e geçilir, JSON.stringify yapılmaz — api.js halleder
Log yazma her zaman try/catch içinde — başarısız log ana işlemi durdurmamalı


TAMAMLANAN KISIMLAR
✅ DATABASE (Supabase)
users:          id, email, phone, name, role, is_verified, created_at
bookings:       id, user_id, plate, package_id, location_id, slot_time, status, created_at
                status default: 'ACCEPTED'
slots:          id, slot_time, capacity, reserved_count, created_at
packages:       id, name, price, duration, description, is_active, created_at
locations:      id, name, address, is_active, created_at
logs:           id, type, actor_id, target_id, reason, metadata(json), created_at
blocked_plates: id, plate, blocked_until, reason, created_at
settings:       id, key, value(json), updated_at
Foreign key constraint'ler:
sqlbookings_user_id_fkey     → users(id)
bookings_package_id_fkey  → packages(id)   ← sonradan eklendi
bookings_location_id_fkey → locations(id)  ← sonradan eklendi
Settings default değerleri:
jsonworking_hours:        { "start": "09:00", "end": "18:00" }
working_days:         [1, 2, 3, 4, 5]
slot_duration:        30
capacity_default:     3
cancel_limit_hours:   2
max_booking_per_user: 1
Booking status enum: WAITING | ACCEPTED | IN_PROGRESS | DONE | CANCELLED
Default status: ACCEPTED (otomatik onay)
Status flow:
ACCEPTED → IN_PROGRESS → DONE
Her aşamadan → CANCELLED (reason zorunlu)
Log types: booking_created | booking_cancelled | status_changed | admin_action | staff_action | slot_reassigned
Roller: user | staff | admin
Özel kurallar:

logs tablosu IMMUTABLE (update/delete rule ile kapatıldı)
Cancel trigger: plakayı 2 gün bloklar + slot sayacını düşürür
Atomic booking: book_slot() PostgreSQL function
RLS policies tüm tablolarda aktif
Aktif booking kontrolü: plaka bazlı (kullanıcı bazlı değil) — aynı plaka için birden fazla aktif rezervasyon oluşturulamaz, farklı araçlar için olabilir


✅ BACKEND API
Public:
GET  /api/packages
GET  /api/locations
GET  /api/slots/available?date=YYYY-MM-DD

Auth gerekli (Supabase session):
POST /api/book
POST /api/cancel
GET  /api/user/status
GET  /api/book/check

Admin/Staff:
POST   /api/admin/status
GET    /api/admin/settings
POST   /api/admin/settings
GET    /api/admin/packages
POST   /api/admin/packages
PATCH  /api/admin/packages
GET    /api/admin/logs
GET    /api/admin/slots?date=YYYY-MM-DD
POST   /api/admin/slots
DELETE /api/admin/slots

Panel:
GET  /api/panel/me
GET  /api/panel/users
POST /api/panel/users/role
GET  /api/panel/dashboard
GET  /api/panel/bookings

✅ SLOT SİSTEMİ (KRİTİK)
Slotlar dinamik olarak üretilir — admin her gün için ayrı slot oluşturmak zorunda değil.
Akış:

Kullanıcı tarih seçer
GET /api/slots/available?date= çağrılır
slot-engine.js → getAvailableSlots(dateStr):

DB'de o gün için slot varsa onları döndür
DB'de slot yoksa settings'ten working_hours, working_days, slot_duration, capacity_default okuyarak dinamik slot listesi üret
Çalışma günü değilse boş dizi döndür
Geçmiş saatleri filtrele


Kullanıcı slot seçip rezervasyon yaparken booking-engine.js:

O slot_time için DB'de slot var mı kontrol et
Yoksa slots tablosuna insert et
Sonra book_slot() RPC'yi çalıştır



Timezone: Tüm slot sorguları +03:00 offset ile yapılır:
jsconst startOfDay = `${dateStr}T00:00:00+03:00`
const endOfDay   = `${dateStr}T23:59:59+03:00`
Panel Slots sayfası: Sadece görüntüleme — slot oluşturma formu yok. Çalışma saatlerindeki tüm slotları (DB'de olanlar + dinamik) gösterir. is_dynamic: true flag'i olan slotlar "Otomatik" etiketi ile gösterilir.

✅ FRONTEND ALTYAPISI
CSS Değişkenleri (styles/variables.css):
css--brand: #f97316
--brand-dark: #ea580c
--brand-light: #fed7aa
--brand-subtle: #fff7ed
--bg, --bg-secondary, --bg-tertiary
--text, --text-secondary, --text-tertiary
--border, --border-dark
--radius-sm(8px) --radius-md(12px) --radius-lg(16px) --radius-xl(24px)
--shadow-sm --shadow-md --shadow-lg --shadow-brand
--transition(200ms) --transition-slow(400ms)
--nav-height(68px) --max-width(1152px)
--section-padding(5rem) --section-padding-x(1.5rem)
[data-theme='dark'] tüm değerleri override eder.

✅ HOOKS
jsimport { useLanguage } from '@/hooks/useLanguage'
const { lang, t, switchLanguage } = useLanguage()

import { useTheme } from '@/hooks/useTheme'
const { theme, toggleTheme, mounted } = useTheme()
// mounted false iken render etme — if (!mounted) return null

import { useBooking } from '@/hooks/useBooking'
const { state, slots, alternativeSlots, loading, error, success,
  setPackage, setLocation, setSlot, setFormData,
  fetchSlots, submitBooking, reset } = useBooking()
// submitBooking() her zaman result return eder:
// Başarı: { success: true, bookingId, package, location, slotTime, plate }
// Hata:   { success: false, reason: 'SLOT_FULL' | 'PLATE_BLOCKED' | 'ACTIVE_BOOKING_EXISTS' | ... }

import { useAuth } from '@/hooks/useAuth'
const { user, loading, signIn, signUp, signOut } = useAuth()

✅ i18n
t.nav: { home, services, about, contact, faq, booking }
t.hero: { title, subtitle, cta, ctaSecondary }
t.services: { title, subtitle, duration, bookNow, allServices }
t.pricing: { title, subtitle, currency, bookNow }
t.faq: { title, subtitle, questions: [{q, a}] }
t.contact: { title, subtitle, phone, whatsapp, email, address, sendMessage, name, message }
t.about: { title, subtitle, description, values: {quality, trust, speed} }
t.booking: { title, steps, selectPackage, selectLocation, selectSlot,
             selectDate, plate, platePlaceholder, name, phone,
             next, back, confirm, success, successDesc,
             slotFull, plateBanned, plateBannedUntil,
             activeBooking, noSlots, available, remaining,
             newBooking, viewBooking }
t.common: { loading, error, retry, close, save, cancel, yes, no, or }
t.footer: { rights, privacy, terms }

✅ CONSTANTS & CONFIG
jsimport { ROUTES } from '@/constants/routes'
ROUTES.home(lang), ROUTES.services(lang), ROUTES.booking(lang)
ROUTES.about(lang), ROUTES.contact(lang), ROUTES.faq(lang)

import { CONFIG } from '@/constants/config'
CONFIG.siteName → 'Revive Auto Lab'
CONFIG.phone, CONFIG.whatsapp, CONFIG.email, CONFIG.address
CONFIG.social.instagram, CONFIG.social.facebook

✅ UI COMPONENTS
jsximport Button from '@/components/ui/Button'
// variant: primary|secondary|outline|ghost|danger
// size: sm|md|lg|xl  props: loading, fullWidth, disabled

import Card from '@/components/ui/Card'
// padding: none|sm|md|lg  props: hover, selected, onClick

import Input from '@/components/ui/Input'
// props: label, name, value, onChange, placeholder, error, required, disabled, hint

import Select from '@/components/ui/Select'
// options: [{value, label}]  props: label, name, value, onChange, placeholder, error, required

import Modal from '@/components/ui/Modal'
// size: sm|md|lg|xl|full  props: isOpen, onClose, title, showClose

✅ LIB DOSYALARI
js// lib/client/supabase-client.js
import { createBrowserClient } from '@supabase/ssr'
export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// lib/server/supabase-server.js — ASYNC
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export async function createSupabaseServer() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(s) { try { s.forEach(({name,value,options}) => cookieStore.set(name,value,options)) } catch {} }
      }
    }
  )
}

// lib/server/supabase-admin.js — service role, sadece backend
import { createClient } from '@supabase/supabase-js'
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)
export default supabaseAdmin

// lib/server/log-service.js
export async function writeLog({ type, actorId, targetId, reason, metadata }) { ... }
export async function getLogs({ type, actorId, targetId, limit, offset }) { ... }
export async function getBookingLogs(bookingId) { ... }
export async function getLogStats() { ... }

// lib/server/email-service.js — Resend
// FROM: 'Revive Auto Lab <noreply@reviveautolab.com>'
export async function sendBookingConfirmation({ to, name, plate, packageName, locationName, slotTime, bookingId })
export async function sendCancellationEmail({ to, name, plate, slotTime, reason })
export async function sendStatusUpdateEmail({ to, name, plate, newStatus, slotTime })
export async function sendOtpEmail({ to, code, expiresInMinutes })  // ← YAZILACAK

// lib/engines/booking-engine.js — processBooking()
// Kritik: slot yoksa önce DB'ye yaz, sonra book_slot() RPC çalıştır
// Kritik: email gönderme try/catch içinde
// Kritik: log yazma try/catch içinde

// lib/engines/rule-engine.js — validateBookingRequest()
// Kontroller: USER_NOT_FOUND, PLATE_BLOCKED, ACTIVE_BOOKING_EXISTS (plaka bazlı), SLOT_TIME_PASSED
// is_verified kontrolü mail sistemi kurulunca aktif edilecek (şu an kapalı)

// lib/engines/slot-engine.js
// getAvailableSlots(dateStr) — dinamik slot üretimi
// findAlternativeSlots(slotTime, count) — slot dolu olunca alternatif
// generateDailySlots(dateStr) — (artık kullanılmıyor)

✅ SERVICES (client-side)
js// services/client/api.js
export async function apiRequest(url, options = {}) {
  const { method = 'GET', body } = options
  const config = { method, headers: { 'Content-Type': 'application/json' } }
  if (body !== undefined && body !== null) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body)
  }
  const response = await fetch(url, config)
  const data = await response.json()
  if (!response.ok) throw new Error(data.error || 'Bir hata oluştu')
  return data
}

// services/client/booking.service.js
export async function getAvailableSlots(date) { ... }
export async function createBooking({ packageId, locationId, slotTime, plate, name, phone }) { ... }
export async function cancelBooking(bookingId, reason) { ... }
export async function getUserBookingStatus() { ... }

// services/client/panel.service.js
export async function getPanelMe() { ... }
export async function getDashboardStats() { ... }
export async function getPanelBookings({ page, limit, status, date, search }) { ... }
export async function getPanelUsers({ page, limit, role, search }) { ... }
export async function updateUserRole(userId, role) { ... }
export async function getSlots(date) { ... }
export async function createSlots(slots, capacity) { ... }  // artık kullanılmıyor
export async function deleteSlot(slotId) { ... }           // artık kullanılmıyor

✅ MIDDLEWARE
js// middleware.js
if (
  pathname.startsWith('/api') ||
  pathname.startsWith('/_next') ||
  pathname.startsWith('/favicon') ||
  pathname.startsWith('/panel') ||  // ← KRİTİK: panel dil prefix'inden muaf
  pathname.includes('.')
) {
  return NextResponse.next()
}

✅ TAMAMLANAN SAYFALAR
app/[lang]/layout.jsx                ✅
app/[lang]/page.jsx                  ✅ (Hero + Services + Pricing + FAQ + Contact)
app/[lang]/services/page.jsx         ✅
app/[lang]/booking/page.jsx          ✅ (5 adımlı flow)
app/[lang]/about/page.jsx            ✅
app/[lang]/contact/page.jsx          ✅
app/[lang]/faq/page.jsx              ✅

components/layout/Navbar.jsx         ✅
components/layout/Footer.jsx         ✅
components/sections/Hero.jsx         ✅
components/sections/Services.jsx     ✅
components/sections/Pricing.jsx      ✅
components/sections/FAQ.jsx          ✅
components/sections/Contact.jsx      ✅
✅ TAMAMLANAN PANEL DOSYALARI
app/panel/login/page.jsx             ✅
app/panel/layout.jsx                 ✅ (sidebar, auth guard, rol bazlı menü)
app/panel/page.jsx                   ✅ (→ /panel/dashboard redirect)
app/panel/dashboard/page.jsx         ✅
app/panel/bookings/page.jsx          ✅ (filtre, tablo, status güncelle, iptal modal)
app/panel/slots/page.jsx             ✅ (sadece görüntüleme — slot oluşturma yok)
app/panel/packages/page.jsx          ✅ (listeleme, oluşturma, güncelleme, aktif/pasif toggle)
app/panel/users/page.jsx             ✅ (listeleme, rol güncelleme, arama, sayfalama)
app/panel/settings/page.jsx          ✅ (working_hours, slot_duration, capacity_default, cancel_limit_hours, max_booking_per_user)
app/panel/logs/page.jsx              ✅ (listeleme, filtre, metadata detay)
Panel sidebar menu (app/panel/layout.jsx):
Dashboard    → /panel/dashboard   roles: ['staff', 'admin']
Rezervasyonlar → /panel/bookings  roles: ['staff', 'admin']
Slot Takibi  → /panel/slots       roles: ['admin']
Paketler     → /panel/packages    roles: ['admin']
Kullanıcılar → /panel/users       roles: ['admin']
Ayarlar      → /panel/settings    roles: ['admin']
Loglar       → /panel/logs        roles: ['admin']

✅ ÖNEMLİ KURALLAR

'use client' directive: hook kullanan tüm component'lerde zorunlu
mounted kontrolü: useTheme kullanan her yerde zorunlu (if (!mounted) return null)
suppressHydrationWarning: sadece html ve body'de
cookies() ve createSupabaseServer() her zaman await ile
request.json() bir route'da sadece BİR KEZ — helper fonksiyona taşı
body apiRequest'e her zaman düz obje geçilir, JSON.stringify yapılmaz
Panel route'ları: /panel/* middleware'den muaf
CSS: Tailwind class'ı kesinlikle kullanılmaz
Dark mode: var(--bg), var(--text) gibi CSS değişkenleri kullan
Cancel reason zorunlu: 'müşteri gelmedi' | 'araç sorunlu' | 'yanlış rezervasyon'
Log yazma her zaman try/catch içinde
Reschedule'da plaka bloğu UYGULANMAZ
Aktif booking kontrolü plaka bazlı — aynı kullanıcı farklı araçlar için rezervasyon alabilir


YAPILACAKLAR
AŞAMA 1 — Database Güncellemeleri
1.1 — package_features tablosu:
sqlCREATE TABLE public.package_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id uuid NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  feature text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.package_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_features: herkes aktif paket özelliklerini görür"
  ON public.package_features FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.packages WHERE id = package_id AND is_active = true
  ));

CREATE POLICY "package_features: admin yönetir"
  ON public.package_features FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  ));
1.2 — verification_codes tablosu:
sqlCREATE TABLE public.verification_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "verification_codes: sadece sistem yönetir"
  ON public.verification_codes FOR ALL
  USING (auth.role() = 'service_role');
1.3 — bookings tablosuna alan ekle:
sqlALTER TABLE public.bookings
ADD COLUMN email text,
ADD COLUMN reschedule_count int NOT NULL DEFAULT 0;
1.4 — settings'e working_days ekle:
sqlINSERT INTO public.settings (key, value) VALUES
  ('working_days', '[1,2,3,4,5]')
ON CONFLICT (key) DO NOTHING;
1.5 — Reschedule trigger:
sqlCREATE OR REPLACE FUNCTION handle_booking_reschedule()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.slot_time != OLD.slot_time AND NEW.status != 'CANCELLED' THEN
    UPDATE public.slots
    SET reserved_count = GREATEST(reserved_count - 1, 0)
    WHERE slot_time = OLD.slot_time;

    UPDATE public.slots
    SET reserved_count = reserved_count + 1
    WHERE slot_time = NEW.slot_time;

    NEW.reschedule_count = OLD.reschedule_count + 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_booking_rescheduled
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION handle_booking_reschedule();

AŞAMA 2 — Mail Sistemi
2.1 — sendOtpEmail ekle (lib/server/email-service.js)
Mevcut Resend kurulumuna eklenecek:
jsexport async function sendOtpEmail({ to, code, expiresInMinutes = 10 }) {
  // 6 haneli OTP kodunu HTML mail ile gönder
  // Konu: "Doğrulama Kodunuz — Revive Auto Lab"
  // İçerik: Kod büyük ve belirgin şekilde gösterilmeli
  // expiresInMinutes sonra geçersiz olacağı belirtilmeli
}
2.2 — app/api/verify/send/route.js
POST /api/verify/send
Body: { email }
- Aynı email'e 1 dakika içinde tekrar gönderilemez (rate limit)
- 6 haneli rastgele kod üret
- verification_codes tablosuna yaz (expires_at: now + 10 dakika)
- sendOtpEmail() ile gönder
- Response: { success: true }
2.3 — app/api/verify/check/route.js
POST /api/verify/check
Body: { email, code }
- verification_codes tablosunda eşleşme ara
- Süresi dolmamış ve used=false olmalı
- Eşleşirse used=true yap
- Response: { success: true, email } veya { error: 'Geçersiz kod' }
2.4 — app/api/booking/reschedule/route.js
POST /api/booking/reschedule
Body: { bookingId, newSlotTime, email, otpCode }
Auth: email + OTP doğrulaması
- OTP doğrula
- Booking'in o email'e ait olduğunu kontrol et
- cancel_limit_hours kontrolü yap
- Yeni slot müsait mi kontrol et
- Booking'i güncelle (slot_time, reschedule_count++)
- Trigger otomatik slot sayaçlarını günceller
- Log: booking_rescheduled (plaka bloğu YOK)
- Response: { success: true, booking }

AŞAMA 3 — Panel Güncellemeleri
3.1 — app/panel/locations/page.jsx + styles/panel/Locations.module.css
Şube yönetimi:

Şube listesi (kart grid — Packages sayfasıyla aynı yapı)
Yeni şube oluşturma modal: name, address, is_active
Şube güncelleme modal
Aktif/pasif toggle
API: GET/POST/PATCH /api/admin/locations

app/api/admin/locations/route.js yazılacak:
GET:   tüm lokasyonları listele (admin: hepsi, public: sadece is_active=true)
POST:  yeni lokasyon oluştur { name, address, is_active }
PATCH: güncelle { id, ...updates }
Sidebar'a ekle: Şubeler → /panel/locations, roles: ['admin']
3.2 — app/panel/users/page.jsx güncelle
Mevcut Users sayfasına staff oluşturma ekle:

"Yeni Staff Ekle" butonu
Modal: email + şifre + isim alanları
Supabase Admin Auth API ile kullanıcı oluştur:

jsconst { data, error } = await supabaseAdmin.auth.admin.createUser({
  email,
  password,
  email_confirm: true
})
// Sonra public.users'a ekle: role: 'staff', is_verified: true

Staff/admin silme: auth'dan + public.users'dan sil
Kendi rolünü değiştiremez, kendini silemez

app/api/admin/staff/route.js yazılacak:
POST:   email + şifre + isim ile staff oluştur
DELETE: userId ile staff sil (auth + public.users)
3.3 — app/panel/packages/page.jsx güncelle
Paket oluşturma/düzenleme modalına "Paket İçerikleri" bölümü ekle:

Dinamik liste: her satır bir özellik (iç yıkama, dış yıkama, cila vs.)
Ekle/sil butonları, sıralama yok
0 özellik de geçerli
Kayıt: packages tablosuna yaz + package_features tablosuna ayrıca insert
Düzenleme: mevcut features'ları çek, değişiklikleri upsert/delete ile yönet
API: GET /api/admin/packages response'una features dizisi ekle

3.4 — app/panel/settings/page.jsx güncelle
working_days için checkbox grubu ekle:
[ ] Pazartesi (1)  [ ] Salı (2)  [ ] Çarşamba (3)
[ ] Perşembe (4)   [ ] Cuma (5)  [ ] Cumartesi (6)  [ ] Pazar (7)
JS'de getDay(): 0=Pazar, 1=Pazartesi. Bizim sistemde 1=Pazartesi, 7=Pazar.
3.5 — app/panel/logs/page.jsx güncelle
Metadata'yı ham JSON yerine Türkçe anlamlı cümleye çevir:
jsconst LOG_MESSAGES = {
  booking_created:     (m) => `${m.plate} plakalı araç için ${m.packageName} paketi rezerve edildi`,
  booking_cancelled:   (m) => `${m.plate} plakalı araç rezervasyonu iptal edildi. Sebep: ${m.reason || '—'}`,
  booking_rescheduled: (m) => `${m.plate} plakalı araç rezervasyonu yeni saate taşındı`,
  status_changed:      (m) => `Rezervasyon durumu ${m.oldStatus} → ${m.newStatus} olarak güncellendi`,
  admin_action:        (m) => m.reason || 'Admin işlemi gerçekleştirildi',
  staff_action:        (m) => m.reason || 'Staff işlemi gerçekleştirildi',
  slot_reassigned:     (m) => 'Slot yeniden atandı',
}

AŞAMA 4 — Kullanıcı Takip Sayfası
4.1 — app/[lang]/tracking/page.jsx + styles/pages/Tracking.module.css
Akış:
1. Kullanıcı email girer
2. POST /api/verify/send → OTP maile gider
3. Kullanıcı 6 haneli kodu girer
4. POST /api/verify/check → doğrulama
5. O email'e ait tüm rezervasyonlar listelenir (GET /api/tracking/bookings?email=&code=)
6. Her rezervasyon kartında:
   - Durum badge (ACCEPTED/IN_PROGRESS/DONE/CANCELLED)
   - Paket, lokasyon, tarih/saat, plaka
   - "Randevuyu Değiştir" butonu — cancel_limit_hours geçmemişse aktif
   - "İptal Et" butonu — cancel_limit_hours geçmemişse aktif, onay modalı
Randevu değiştirme akışı (tracking sayfasında):
1. "Randevuyu Değiştir" tıkla
2. Tarih seçici aç (önümüzdeki 14 gün)
3. GET /api/slots/available?date= ile slot listesi çek
4. Slot seç
5. POST /api/booking/reschedule → { bookingId, newSlotTime, email, otpCode }
6. Başarıda liste güncellenir
app/api/tracking/bookings/route.js yazılacak:
GET /api/tracking/bookings?email=&code=
- OTP doğrula (used=true yapmadan kontrol et — tracking session için)
- O email'e ait bookingları getir (tüm statuslar)
- booking + package + location join
- cancel_limit_hours'a göre is_cancellable, is_reschedulable flag'leri ekle
4.2 — app/[lang]/booking/page.jsx güncelle

Step 4 (form) içine email alanı ekle
Form submit öncesi POST /api/verify/send ile OTP gönder
OTP giriş adımı ekle (Step 4 ile Step 5 arasına — stepper'da 6. adım olur veya modal olarak)
OTP doğrulandıktan sonra booking tamamlansın
Eğer o email'e ait aktif booking varsa → tracking sayfasına yönlendir


AŞAMA 5 — SEO & Deploy
5.1 — generateMetadata her app/[lang]/*/page.jsx'e:
jsexport async function generateMetadata({ params }) {
  const { lang } = params
  const isTr = lang === 'tr'
  return {
    title: isTr ? '...' : '...',
    description: isTr ? '...' : '...',
    keywords: [...],
    openGraph: { title, description, locale, type: 'website' }
  }
}
Sayfa başlıkları:

Home: "Bursa Oto Yıkama & Detaylı Temizlik | Revive Auto Lab"
Services: "Oto Yıkama Paketleri & Fiyatlar | Revive Auto Lab Bursa"
Booking: "Online Randevu Al | Revive Auto Lab Bursa"
FAQ: "Sık Sorulan Sorular | Oto Yıkama Bursa"
About: "Hakkımızda | Revive Auto Lab"
Contact: "İletişim | Revive Auto Lab Bursa"

NOT: generateMetadata server component'te çalışır — 'use client' ile aynı dosyada olamaz. Metadata'yı server wrapper'da tut, section'ları client component olarak import et.
5.2 — Schema.org JSON-LD:
js// app/layout.jsx → LocalBusiness (AutoWash type)
// app/[lang]/faq/page.jsx → FAQPage
// app/[lang]/services/page.jsx → Service (her paket için)
// dangerouslySetInnerHTML ile ekle, panel'de kullanma
5.3 — app/sitemap.js:
jsexport default function sitemap() {
  return [
    { url: 'https://reviveautolab.com/tr', lastModified: new Date() },
    { url: 'https://reviveautolab.com/en', lastModified: new Date() },
    // + tüm sayfalar için tr ve en
  ]
}
5.4 — app/robots.js:
jsexport default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: '/panel' },
    sitemap: 'https://reviveautolab.com/sitemap.xml',
  }
}
5.5 — Environment variables (Vercel):
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
RESEND_API_KEY
NEXT_PUBLIC_APP_URL

BAŞLANGIÇ NOKTASI
AŞAMA 5 den başla. Her aşamayı tamamlayıp onay bekle, sonra bir sonrakine geç.



NOT: tracking sayfası için bir uzantı yok aynı zamanda randevu oluşturma kısmınan 2ciye randevu oluşturmaya çalışırsak bize uyarı verip o sayfaya yönlendiryior faka o sayfada da hata alıyoruz