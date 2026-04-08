'use client'

import { useEffect, useState, useCallback } from 'react' 
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { useBooking } from '@/hooks/useBooking'
import { ROUTES } from '@/constants/routes'
import { apiRequest } from '@/services/client/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from '@/styles/pages/Booking.module.css'



/* ════════════════════════════════════════════════
   CONSTANTS
════════════════════════════════════════════════ */

const TOTAL_STEPS = 6

const LOCATIONS_FALLBACK = [
  { id: 1, name: 'Merkez Şube',   address: 'Atatürk Cad. No:12, Bursa Merkez' },
  { id: 2, name: 'Organize Şube', address: 'Organize San. Bölgesi, 16. Sok. Bursa' },
]

const PKG_ICONS = ['🚿', '✨', '💎', '🏆', '🔧', '🛡️']

const FALLBACK_PACKAGES = [
  { id: 1, name: 'Temel Yıkama',    price: 150, duration: 20 },
  { id: 2, name: 'Konfor Paket',    price: 280, duration: 35 },
  { id: 3, name: 'Premium Detay',   price: 490, duration: 60 },
  { id: 4, name: 'Kristal Kaplama', price: 890, duration: 90 },
]

/* ════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════ */

function getDatesAhead(n = 14) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

function fmtTime(iso) {
  return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function fmtDate(iso) {
  return new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long', day: 'numeric', month: 'long',
  }).format(new Date(iso))
}

/* ════════════════════════════════════════════════
   SUB-COMPONENTS (değişmeyen kısımlar)
════════════════════════════════════════════════ */

/* ── Step 1: Package ── */
function StepPackage({ packages, loading, selected, onSelect }) {
  if (loading) return (
    <div className={styles.skeletonList}>
      {[80, 80, 80, 80].map((h, i) => (
        <div key={i} className={`${styles.skeleton} ${styles.skeletonPkg}`} />
      ))}
    </div>
  )

  return (
    <div className={styles.packageList}>
      {packages.map((pkg, idx) => (
        <button
          key={pkg.id}
          type="button"
          className={`${styles.packageCard} ${selected?.id === pkg.id ? styles.packageCardSelected : ''}`}
          onClick={() => onSelect(pkg)}
        >
          <span className={styles.pkgIcon}>
            {pkg.icon || PKG_ICONS[idx % PKG_ICONS.length]}
          </span>
          <div className={styles.pkgInfo}>
            <span className={styles.pkgName}>{pkg.name}</span>
            <span className={styles.pkgDuration}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {pkg.duration} dakika
            </span>
          </div>
          <div className={styles.pkgPrice}>
            <span className={styles.pkgCurr}>₺</span>
            <span className={styles.pkgPriceVal}>{pkg.price}</span>
          </div>
          {selected?.id === pkg.id && (
            <span className={styles.checkMark}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Step 2: Location ── */
function StepLocation({ locations, selected, onSelect }) {
  return (
    <div className={styles.locationList}>
      {locations.map(loc => (
        <button
          key={loc.id}
          type="button"
          className={`${styles.locationCard} ${selected?.id === loc.id ? styles.locationCardSelected : ''}`}
          onClick={() => onSelect(loc)}
        >
          <div className={styles.locIconWrap}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className={styles.locInfo}>
            <span className={styles.locName}>{loc.name}</span>
            <span className={styles.locAddr}>{loc.address}</span>
          </div>
          {selected?.id === loc.id && (
            <span className={styles.checkMark}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </span>
          )}
        </button>
      ))}
    </div>
  )
}

/* ── Step 3: Date + Slot ── */
function StepDateTime({ slots, loading, selectedDate, onDateChange, selectedSlot, onSlotSelect, alternativeSlots, t }) {
  const dates = getDatesAhead(14)

  return (
    <div className={styles.dateTimeWrap}>
      <div className={styles.dateScrollWrap}>
        <span className={styles.dateScrollLabel}>
          {t.booking?.selectDate || 'Tarih seçin'}
        </span>
        <div className={styles.dateScroll}>
          {dates.map(d => {
            const obj   = new Date(d + 'T00:00:00')
            const day   = obj.toLocaleDateString('tr-TR', { weekday: 'short' })
            const num   = obj.getDate()
            const month = obj.toLocaleDateString('tr-TR', { month: 'short' })
            return (
              <button
                key={d}
                type="button"
                className={`${styles.datePill} ${selectedDate === d ? styles.datePillActive : ''}`}
                onClick={() => onDateChange(d)}
              >
                <span className={styles.datePillDay}>{day}</span>
                <span className={styles.datePillNum}>{num}</span>
                <span className={styles.datePillMonth}>{month}</span>
              </button>
            )
          })}
        </div>
      </div>

      {!selectedDate ? (
        <p className={styles.hintText}>Lütfen önce bir tarih seçin.</p>
      ) : loading ? (
        <div className={styles.slotGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={`${styles.skeleton} ${styles.skeletonSlot}`} />
          ))}
        </div>
      ) : (
        <div className={styles.slotSection}>
          <span className={styles.slotLabel}>
            {t.booking?.selectSlot || 'Saat seçin'}
          </span>

          {slots.length === 0 ? (
            <div className={styles.noSlots}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 8v4m0 4h.01"/>
              </svg>
              <span>{t.booking?.noSlots || 'Bu tarihte müsait slot bulunamadı.'}</span>
            </div>
          ) : (
            <div className={styles.slotGrid}>
              {slots.map(slot => (
                <button
                  key={slot.id}
                  type="button"
                  disabled={!slot.is_available}
                  className={`
                    ${styles.slotBtn}
                    ${selectedSlot?.id === slot.id ? styles.slotBtnActive : ''}
                    ${!slot.is_available ? styles.slotBtnFull : ''}
                  `}
                  onClick={() => slot.is_available && onSlotSelect(slot)}
                >
                  <span className={styles.slotTime}>{fmtTime(slot.slot_time)}</span>
                  {slot.is_available
                    ? <span className={styles.slotRemain}>{slot.remaining} {t.booking?.remaining || 'kalan'}</span>
                    : <span className={styles.slotFull}>Dolu</span>
                  }
                </button>
              ))}
            </div>
          )}

          {alternativeSlots?.length > 0 && (
            <div className={styles.altSlotsWrap}>
              <span className={styles.altSlotsLabel}>Alternatif saatler:</span>
              <div className={styles.slotGrid}>
                {alternativeSlots.map(slot => (
                  <button
                    key={slot.id}
                    type="button"
                    className={`${styles.slotBtn} ${selectedSlot?.id === slot.id ? styles.slotBtnActive : ''}`}
                    onClick={() => onSlotSelect(slot)}
                  >
                    <span className={styles.slotTime}>{fmtTime(slot.slot_time)}</span>
                    <span className={styles.slotRemain}>{slot.remaining} kalan</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── Step 4: Form (email eklendi) ── */
function StepForm({ formData, onChange, t, otpSending, otpError }) {
  return (
    <div className={styles.formFields}>
      <Input
        label={t.booking?.plate || 'Araç Plakası'}
        name="plate"
        value={formData.plate || ''}
        onChange={e => onChange('plate', e.target.value.toUpperCase())}
        placeholder={t.booking?.platePlaceholder || '16 ABC 123'}
        required
      />
      <Input
        label={t.booking?.name || 'Ad Soyad'}
        name="name"
        value={formData.name || ''}
        onChange={e => onChange('name', e.target.value)}
        placeholder="Ahmet Yılmaz"
        required
      />
      <Input
        label={t.booking?.phone || 'Telefon'}
        name="phone"
        value={formData.phone || ''}
        onChange={e => onChange('phone', e.target.value)}
        placeholder="05XX XXX XX XX"
        required
      />
      <Input
        label="E-posta Adresi"
        name="email"
        value={formData.email || ''}
        onChange={e => onChange('email', e.target.value.toLowerCase())}
        placeholder="ornek@email.com"
        hint="Randevu onayı ve takip için kullanılacak"
        required
      />
      {otpError && (
        <p className={styles.otpError}>{otpError}</p>
      )}
    </div>
  )
}

/* ── Step 5: OTP (YENİ) ── */
function StepOtp({ email, otp, onOtpChange, onResend, resending, t }) {
  return (
    <div className={styles.otpWrap}>
      <div className={styles.otpIcon}>✉️</div>
      <p className={styles.otpDesc}>
        <strong>{email}</strong> adresine 6 haneli bir doğrulama kodu gönderdik.
        Kodu aşağıya girin. Kod 10 dakika geçerlidir.
      </p>

      <div className={styles.otpFieldWrap}>
        <label className={styles.otpLabel}>Doğrulama Kodu</label>
        <input
          type="text"
          value={otp}
          onChange={e => onOtpChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          className={styles.otpField}
          maxLength={6}
          autoFocus
        />
      </div>

      <button
        type="button"
        className={styles.resendBtn}
        onClick={onResend}
        disabled={resending}
      >
        {resending ? 'Gönderiliyor...' : 'Kodu tekrar gönder'}
      </button>
    </div>
  )
}

/* ── Step 6: Confirm ── */
function StepConfirm({ pkg, location, slot, formData, t }) {
  const rows = [
    { label: 'Paket',        value: pkg?.name },
    { label: 'Lokasyon',     value: location?.name },
    { label: 'Tarih',        value: slot ? fmtDate(slot.slot_time) : '—' },
    { label: 'Saat',         value: slot ? fmtTime(slot.slot_time) : '—' },
    { label: 'Plaka',        value: formData?.plate },
    { label: 'Ad Soyad',     value: formData?.name },
    { label: 'Telefon',      value: formData?.phone },
    { label: 'E-posta',      value: formData?.email },
  ]

  return (
    <div className={styles.confirmWrap}>
      <div className={styles.confirmCard}>
        {rows.map(r => (
          <div key={r.label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{r.label}</span>
            <span className={styles.confirmValue}>{r.value || '—'}</span>
          </div>
        ))}
        <div className={`${styles.confirmRow} ${styles.confirmTotal}`}>
          <span className={styles.confirmLabel}>Toplam Ücret</span>
          <span className={styles.confirmValue}>
            {pkg ? `₺${pkg.price}` : '—'}
          </span>
        </div>
      </div>
      <p className={styles.confirmNote}>
        Bilgilerinizi kontrol edin. Onayladıktan sonra randevunuz oluşturulacak
        ve e-posta ile bildirilecektir.
      </p>
    </div>
  )
}

/* ── Success screen ── */
function SuccessScreen({ result, pkg, location, onNew, lang, t }) {
  const rows = [
    { label: 'Rezervasyon No', value: `#${(result.bookingId || '').slice(0, 8).toUpperCase()}` },
    { label: 'Paket',          value: (result.package || pkg)?.name },
    { label: 'Lokasyon',       value: (result.location || location)?.name },
    { label: 'Tarih / Saat',   value: result.slotTime ? `${fmtDate(result.slotTime)} – ${fmtTime(result.slotTime)}` : '—' },
    { label: 'Plaka',          value: result.plate },
  ]

  return (
    <div className={styles.successWrap}>
      <div className={styles.successCircle}>
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5"/>
        </svg>
      </div>
      <h2 className={styles.successTitle}>
        {t.booking?.success || 'Randevunuz Oluşturuldu!'}
      </h2>
      <p className={styles.successDesc}>
        {t.booking?.successDesc || 'Randevu detayları aşağıda. E-posta ile de bildirim gönderilecektir.'}
      </p>
      <div className={styles.successCard}>
        {rows.map(r => (
          <div key={r.label} className={styles.confirmRow}>
            <span className={styles.confirmLabel}>{r.label}</span>
            <span className={styles.confirmValue}>{r.value || '—'}</span>
          </div>
        ))}
      </div>
      <div className={styles.successActions}>
        <Button variant="outline" size="md" onClick={onNew}>
          {t.booking?.newBooking || 'Yeni Randevu Al'}
        </Button>
        <Link href={ROUTES.home(lang)}>
          <Button variant="ghost" size="md">Ana Sayfaya Dön</Button>
        </Link>
      </div>
    </div>
  )
}

/* ── Error box ── */
function ErrorBox({ error, alternativeSlots, onSlotSelect, onBack, t }) {
  const configs = {
    SLOT_FULL: {
      title: '⚠️ Seçtiğiniz slot doldu.',
      desc:  'Aşağıdan alternatif bir saat seçebilirsiniz.',
    },
    PLATE_BLOCKED: {
      title: '🚫 Araç plakası engellenmiş.',
      desc:  t.booking?.plateBannedUntil || 'Bu plaka geçici olarak sistemden kısıtlanmıştır. Detay için bizi arayın.',
    },
    ACTIVE_BOOKING_EXISTS: {
      title: '📋 Aktif bir randevunuz mevcut.',
      desc:  t.booking?.activeBooking || 'Bu plakaya ait aktif bir randevu bulunuyor. Takip sayfasından görüntüleyebilirsiniz.',
    },
  }

  const cfg = configs[error] || { title: 'Bir hata oluştu.', desc: 'Lütfen tekrar deneyin.' }

  return (
    <div className={styles.errorBox}>
      <p className={styles.errorTitle}>{cfg.title}</p>
      <p className={styles.errorDesc}>{cfg.desc}</p>

      {error === 'SLOT_FULL' && alternativeSlots?.length > 0 && (
        <div className={styles.slotGrid} style={{ marginTop: '1rem' }}>
          {alternativeSlots.map(s => (
            <button
              key={s.id}
              type="button"
              className={styles.slotBtn}
              onClick={() => onSlotSelect(s)}
            >
              <span className={styles.slotTime}>{fmtTime(s.slot_time)}</span>
              <span className={styles.slotRemain}>{s.remaining} kalan</span>
            </button>
          ))}
        </div>
      )}

      <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <Button variant="outline" size="sm" onClick={onBack}>
          ← Geri Dön
        </Button>
        {error === 'ACTIVE_BOOKING_EXISTS' && (
          <Link href={ROUTES.tracking?.('tr') || '/tr/tracking'}>
            <Button variant="primary" size="sm">
              Randevumu Görüntüle →
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════
   MAIN PAGE
════════════════════════════════════════════════ */

export default function BookingPage() {
  const { lang, t } = useLanguage()
  const router = useRouter()

  const {
    state, slots, alternativeSlots,
    loading, error, success,
    setPackage, setLocation, setSlot, setFormData,
    fetchSlots, submitBooking, reset,
  } = useBooking()

  const [step, setStep]             = useState(1)
  const [packages, setPackages]     = useState([])
  const [pkgLoading, setPkgLoading] = useState(true)
  const [selectedDate, setDate]     = useState('')
  const [slotsLoading, setSlotsLoading] = useState(false)
  const [bookingResult, setResult]  = useState(null)
  const [showError, setShowError]   = useState(false)
  const [locations, setLocations]   = useState([])
  const [locLoading, setLocLoading] = useState(true)
  const [localError, setLocalError] = useState('')

  // OTP state
  const [otp, setOtp]               = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [otpResending, setOtpResending] = useState(false)
  const [otpError, setOtpError]     = useState('')
  const [otpVerified, setOtpVerified] = useState(false)

  /* ── Fetch packages + locations on mount ── */
  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const active = (d.packages || []).filter(p => p.is_active)
        setPackages(active.length ? active : FALLBACK_PACKAGES)
      })
      .catch(() => setPackages(FALLBACK_PACKAGES))
      .finally(() => setPkgLoading(false))

    fetch('/api/locations')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const active = (d.locations || []).filter(l => l.is_active)
        setLocations(active.length ? active : LOCATIONS_FALLBACK)
      })
      .catch(() => setLocations(LOCATIONS_FALLBACK))
      .finally(() => setLocLoading(false))
  }, [])

  /* ── Fetch slots when date changes ── */
  const handleDateChange = useCallback(async (date) => {
    setDate(date)
    setSlotsLoading(true)
    await fetchSlots(date, state.selectedLocation?.id) 
    setSlotsLoading(false)
  }, [fetchSlots, state.selectedLocation])

  /* ── OTP gönder ── */
  async function sendOtp() {
    const email = state.formData?.email?.trim()
    if (!email) return false
    setOtpSending(true)
    setOtpError('')
    try {
      await apiRequest('/api/verify/send', {
        method: 'POST',
        body: { email: email.toLowerCase() },
      })
      return true
    } catch (err) {
      setOtpError(err.message)
      return false
    } finally {
      setOtpSending(false)
    }
  }

  /* ── OTP doğrula ── */
  async function verifyOtp() {
    const email = state.formData?.email?.trim().toLowerCase()
    if (!email || otp.length !== 6) {
      setOtpError('6 haneli kodu eksiksiz giriniz.')
      return false
    }
    try {
      await apiRequest('/api/verify/check', {
        method: 'POST',
        body: { email, code: otp },
      })
      setOtpVerified(true)
      setOtpError('')
      return true
    } catch (err) {
      setOtpError(err.message || 'Geçersiz veya süresi dolmuş kod.')
      return false
    }
  }

  /* ── Navigation guards ── */
  const canProceed = () => {
    if (step === 1) return !!state.selectedPackage
    if (step === 2) return !!state.selectedLocation
    if (step === 3) return !!state.selectedSlot
    if (step === 4) {
      const f = state.formData || {}
      return !!(f.plate && f.name && f.phone && f.email?.includes('@'))
    }
    if (step === 5) return otp.length === 6
    return true
  }

  /* ── Next butonuna basıldı ── */
  const goNext = async () => {
    if (!canProceed()) return
    setShowError(false)

    // Step 4 → plaka kontrolü → OTP veya tracking'e yönlendir
    if (step === 4) {
      const plate = state.formData?.plate?.trim().toUpperCase()
      const email = state.formData?.email?.trim().toLowerCase()

      if (!plate || !email) return

      // Plaka kontrolü — OTP'den ÖNCE
      try {
        const checkData = await apiRequest(`/api/book/check?plate=${plate}`)

        if (checkData.hasActiveBooking) {
          // OTP gönderme — tracking sayfasında kullanıcı kendisi gönderecek
          try {
            localStorage.setItem('tracking_prefill_email', email)
          } catch {}
          router.push(`/${lang}/tracking`)
          return
        }

        if (checkData.isBlocked) {
          setLocalError('PLATE_BLOCKED')
          setShowError(true)
          return
        }
      } catch {
        // Check başarısız olursa devam et — booking engine zaten kontrol eder
      }

      // Kontrol geçti — OTP gönder
      setOtpSending(true)
      const sent = await sendOtp()
      setOtpSending(false)
      if (!sent) return
      setStep(5)
      return
    }

    // Step 5 → OTP doğrula
    if (step === 5) {
      const verified = await verifyOtp()
      if (!verified) return
      setStep(6)
      return
    }

    setStep(s => Math.min(s + 1, TOTAL_STEPS))
  }

  const goBack = () => {
    setShowError(false)
    // Step 5'ten geri dönünce OTP sıfırla
    if (step === 5) {
      setOtp('')
      setOtpError('')
      setOtpVerified(false)
    }
    setStep(s => Math.max(s - 1, 1))
  }

  /* ── Submit ── */
  const handleSubmit = async () => {
    const result = await submitBooking()
    if (result?.success) {
      setResult(result)
    } else {
      setShowError(true)
    }
  }

  /* ── Reset ── */
  const handleReset = () => {
    reset()
    setStep(1)
    setDate('')
    setResult(null)
    setShowError(false)
    setOtp('')
    setOtpError('')
    setOtpVerified(false)
  }

  /* ── Stepper labels ── */
  const STEP_LABELS = [
    t.booking?.steps?.[0] || 'Paket',
    t.booking?.steps?.[1] || 'Lokasyon',
    t.booking?.steps?.[2] || 'Tarih & Saat',
    t.booking?.steps?.[3] || 'Bilgiler',
    'Doğrulama',
    t.booking?.steps?.[4] || 'Onay',
  ]

  const STEP_TITLES = [
    t.booking?.selectPackage  || 'Paket Seçin',
    t.booking?.selectLocation || 'Lokasyon Seçin',
    t.booking?.selectSlot     || 'Tarih & Saat Seçin',
    t.booking?.plate          || 'Araç Bilgileriniz',
    'E-posta Doğrulama',
    'Randevuyu Onaylayın',
  ]

  /* ── Next buton label ── */
  const getNextLabel = () => {
    if (step === 4) return otpSending ? 'Kod Gönderiliyor...' : 'Kodu Gönder →'
    if (step === 5) return 'Doğrula →'
    return `${t.booking?.next || 'İleri'} →`
  }

  /* ════════ SUCCESS SCREEN ════════ */
  if (bookingResult) {
    return (
      <main className={styles.page}>
        <div className={styles.pageInner}>
          <SuccessScreen
            result={bookingResult}
            pkg={state.selectedPackage}
            location={state.selectedLocation}
            onNew={handleReset}
            lang={lang}
            t={t}
          />
        </div>
      </main>
    )
  }

  /* ════════ MAIN FLOW ════════ */
  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>

        {/* Page header */}
        <div className={styles.pageHeader}>
          <span className={styles.eyebrow}>Online Randevu</span>
          <h1 className={styles.pageTitle}>
            {t.booking?.title || 'Randevu Al'}
          </h1>
        </div>

        {/* Stepper */}
        <div className={styles.stepper}>
          {STEP_LABELS.map((label, i) => {
            const n    = i + 1
            const done = n < step
            const curr = n === step
            return (
              <div
                key={n}
                className={`
                  ${styles.stepItem}
                  ${curr ? styles.stepActive : ''}
                  ${done ? styles.stepDone : ''}
                `}
              >
                <div className={styles.stepCircle}>
                  {done
                    ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
                    : n
                  }
                </div>
                <span className={styles.stepLabel}>{label}</span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`${styles.stepLine} ${done ? styles.stepLineDone : ''}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Step card */}
        <div className={styles.card}>

          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{STEP_TITLES[step - 1]}</h2>
            <span className={styles.stepBadge}>{step} / {TOTAL_STEPS}</span>
          </div>

          <div className={styles.cardBody}>
            {showError ? (
            <ErrorBox
              error={localError || error}  
              alternativeSlots={alternativeSlots}
              onSlotSelect={(s) => { setSlot(s); setShowError(false); setStep(6) }}
              onBack={() => {
                setShowError(false)
                setLocalError('')
                if ((localError || error) === 'SLOT_FULL') setStep(3)
                else if ((localError || error) === 'PLATE_BLOCKED') setStep(4)
                else goBack()
              }}
              t={t}
            />
            ) : (
              <>
                {step === 1 && (
                  <StepPackage
                    packages={packages}
                    loading={pkgLoading}
                    selected={state.selectedPackage}
                    onSelect={setPackage}
                  />
                )}
                {step === 2 && (
                  <StepLocation
                    locations={locations}
                    selected={state.selectedLocation}
                    onSelect={setLocation}
                  />
                )}
                {step === 3 && (
                  <StepDateTime
                    slots={slots}
                    loading={slotsLoading}
                    selectedDate={selectedDate}
                    onDateChange={handleDateChange}
                    selectedSlot={state.selectedSlot}
                    onSlotSelect={setSlot}
                    alternativeSlots={alternativeSlots}
                    t={t}
                  />
                )}
                {step === 4 && (
                  <StepForm
                    formData={state.formData || {}}
                    onChange={(key, val) =>
                      setFormData({ ...(state.formData || {}), [key]: val })
                    }
                    otpSending={otpSending}
                    otpError={otpError}
                    t={t}
                  />
                )}
                {step === 5 && (
                  <StepOtp
                    email={state.formData?.email || ''}
                    otp={otp}
                    onOtpChange={(val) => { setOtp(val); setOtpError('') }}
                    onResend={async () => {
                      setOtpResending(true)
                      await sendOtp()
                      setOtpResending(false)
                    }}
                    resending={otpResending}
                    t={t}
                  />
                )}
                {step === 6 && (
                  <StepConfirm
                    pkg={state.selectedPackage}
                    location={state.selectedLocation}
                    slot={state.selectedSlot}
                    formData={state.formData}
                    t={t}
                  />
                )}
              </>
            )}
          </div>

          {/* Navigation footer */}
          {!showError && (
            <div className={styles.cardFooter}>
              {step > 1
                ? <Button variant="outline" size="md" onClick={goBack} disabled={otpSending}>
                    ← {t.booking?.back || 'Geri'}
                  </Button>
                : <div />
              }

              {step < TOTAL_STEPS ? (
                <Button
                  variant="primary"
                  size="md"
                  onClick={goNext}
                  disabled={!canProceed() || otpSending}
                  loading={otpSending}
                >
                  {getNextLabel()}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  loading={loading}
                  onClick={handleSubmit}
                >
                  {t.booking?.confirm || 'Randevuyu Onayla'}
                </Button>
              )}
            </div>
          )}

        </div>

      </div>
    </main>
  )
}