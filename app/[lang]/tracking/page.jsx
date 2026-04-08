'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { apiRequest } from '@/services/client/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '@/styles/pages/Tracking.module.css'

const STATUS_LABELS = {
  WAITING:     { tr: 'Bekliyor',     en: 'Waiting'    },
  ACCEPTED:    { tr: 'Onaylandı',    en: 'Accepted'   },
  IN_PROGRESS: { tr: 'İşlemde',      en: 'In Progress'},
  DONE:        { tr: 'Tamamlandı',   en: 'Completed'  },
  CANCELLED:   { tr: 'İptal Edildi', en: 'Cancelled'  },
}

const STATUS_COLOR = {
  WAITING:     'gray',
  ACCEPTED:    'blue',
  IN_PROGRESS: 'orange',
  DONE:        'green',
  CANCELLED:   'red',
}

const CANCEL_REASONS = [
  'Randevuma gelemeyeceğim',
  'Yanlış tarih/saat seçtim',
  'Plan değişikliği',
  'Diğer',
]

const STEP = { EMAIL: 'email', OTP: 'otp', LIST: 'list' }

// ─── Session yönetimi (48 saat) ───────────────────────────────────────────
const SESSION_KEY = 'tracking_session_v2'

function saveSession(email, sessionToken, expiresAt) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ email, sessionToken, expiresAt }))
  } catch {}
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw)
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    return session // { email, sessionToken, expiresAt }
  } catch {
    return null
  }
}

function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem('tracking_session') // eski format temizle
  } catch {}
}
// ─────────────────────────────────────────────────────────────────────────

export default function TrackingPage() {
  const { lang } = useLanguage()

  const [step, setStep]                     = useState(STEP.EMAIL)
  const [email, setEmail]                   = useState('')
  const [otp, setOtp]                       = useState('')
  const [sessionToken, setSessionToken]     = useState('')
  const [authLoading, setAuthLoading]       = useState(false)
  const [authError, setAuthError]           = useState('')
  const [sessionChecked, setSessionChecked] = useState(false)

  const [bookings, setBookings]       = useState([])
  const [listLoading, setListLoading] = useState(false)

  const [cancelTarget, setCancelTarget]   = useState(null)
  const [cancelReason, setCancelReason]   = useState('')
  const [cancelLoading, setCancelLoading] = useState(false)
  const [cancelError, setCancelError]     = useState('')

  const [rescheduleTarget, setRescheduleTarget]   = useState(null)
  const [rescheduleDate, setRescheduleDate]       = useState('')
  const [slots, setSlots]                         = useState([])
  const [slotsLoading, setSlotsLoading]           = useState(false)
  const [selectedSlot, setSelectedSlot]           = useState('')
  const [rescheduleLoading, setRescheduleLoading] = useState(false)
  const [rescheduleError, setRescheduleError]     = useState('')

  // ── Sayfa açılınca session kontrol ─────────────────────────────────────
  useEffect(() => {
    const session = loadSession()

    if (session?.email && session?.sessionToken) {
      // Geçerli 48 saatlik session var → direkt listeye git
      setEmail(session.email)
      setSessionToken(session.sessionToken)
      setStep(STEP.LIST)
      fetchBookingsWithToken(session.email, session.sessionToken)
      setSessionChecked(true)
      return
    }

    // Booking sayfasından email prefill
    try {
      const prefill = localStorage.getItem('tracking_prefill_email')
      if (prefill) {
        setEmail(prefill)
        localStorage.removeItem('tracking_prefill_email')
      }
    } catch {}

    setSessionChecked(true)
  }, [])

  // ── Booking çekme — session token ile ──────────────────────────────────
  async function fetchBookingsWithToken(emailParam, tokenParam) {
    setListLoading(true)
    try {
      const params = new URLSearchParams({
        email:        emailParam.trim().toLowerCase(),
        sessionToken: tokenParam,
      })
      const data = await apiRequest(`/api/tracking/bookings?${params}`)
      setBookings(data.bookings || [])
    } catch (err) {
      if (err.message?.includes('401') || err.message?.includes('Geçersiz')) {
        clearSession()
        setStep(STEP.EMAIL)
        setEmail('')
        setSessionToken('')
        setOtp('')
      }
      console.error(err)
    } finally {
      setListLoading(false)
    }
  }

  const fetchBookings = useCallback(async () => {
    await fetchBookingsWithToken(email, sessionToken)
  }, [email, sessionToken])

  // ── OTP gönder ─────────────────────────────────────────────────────────
  async function handleSendOtp() {
    setAuthError('')
    if (!email.trim() || !email.includes('@')) {
      setAuthError('Geçerli bir e-posta adresi giriniz.')
      return
    }
    setAuthLoading(true)
    try {
      await apiRequest('/api/verify/send', {
        method: 'POST',
        body: { email: email.trim().toLowerCase() },
      })
      setStep(STEP.OTP)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // ── OTP doğrula → 48h session token al ─────────────────────────────────
  async function handleVerifyOtp() {
    setAuthError('')
    if (otp.trim().length !== 6) {
      setAuthError('6 haneli kodu eksiksiz giriniz.')
      return
    }
    setAuthLoading(true)
    try {
      const result = await apiRequest('/api/verify/check', {
        method: 'POST',
        body: { email: email.trim().toLowerCase(), code: otp.trim() },
      })

      const token     = result.sessionToken
      const expiresAt = result.expiresAt
      setSessionToken(token)
      saveSession(email.trim().toLowerCase(), token, expiresAt)

      await fetchBookingsWithToken(email.trim().toLowerCase(), token)
      setStep(STEP.LIST)
    } catch (err) {
      setAuthError(err.message)
    } finally {
      setAuthLoading(false)
    }
  }

  // ── Çıkış ──────────────────────────────────────────────────────────────
  function handleLogout() {
    clearSession()
    setStep(STEP.EMAIL)
    setEmail('')
    setOtp('')
    setSessionToken('')
    setBookings([])
    setAuthError('')
  }

  // ── İptal ──────────────────────────────────────────────────────────────
  async function handleCancel() {
    setCancelError('')
    if (!cancelReason) {
      setCancelError('Lütfen bir iptal sebebi seçiniz.')
      return
    }
    setCancelLoading(true)
    try {
      await apiRequest('/api/cancel', {
        method: 'POST',
        body: { bookingId: cancelTarget.id, reason: cancelReason },
      })
      setCancelTarget(null)
      setCancelReason('')
      await fetchBookings()
    } catch (err) {
      setCancelError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  // ── Reschedule ─────────────────────────────────────────────────────────
  async function handleDateChange(date) {
    setRescheduleDate(date)
    setSelectedSlot('')
    setSlots([])
    if (!date) return
    setSlotsLoading(true)
    try {
      const data = await apiRequest(`/api/slots/available?date=${date}`)
      setSlots(data.slots || [])
    } catch (err) {
      console.error(err)
    } finally {
      setSlotsLoading(false)
    }
  }

  async function handleReschedule() {
    setRescheduleError('')
    if (!selectedSlot) {
      setRescheduleError('Lütfen bir slot seçiniz.')
      return
    }
    setRescheduleLoading(true)
    try {
      await apiRequest('/api/booking/reschedule', {
        method: 'POST',
        body: {
          bookingId:    rescheduleTarget.id,
          newSlotTime:  selectedSlot,
          email:        email.trim().toLowerCase(),
          sessionToken: sessionToken,
        },
      })
      setRescheduleTarget(null)
      setRescheduleDate('')
      setSlots([])
      setSelectedSlot('')
      await fetchBookings()
    } catch (err) {
      setRescheduleError(err.message)
    } finally {
      setRescheduleLoading(false)
    }
  }

  // ── Yardımcılar ────────────────────────────────────────────────────────
  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function formatDateShort(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function getNext14Days() {
    const days  = []
    const today = new Date()
    for (let i = 0; i < 14; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      days.push(d.toISOString().slice(0, 10))
    }
    return days
  }

  if (!sessionChecked) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <h1 className={styles.title}>Rezervasyon Takibi</h1>
          <p className={styles.subtitle}>
            E-posta adresinizi doğrulayarak rezervasyonlarınızı görüntüleyin,
            değiştirin veya iptal edin.
          </p>
        </div>

        {/* ── EMAIL ── */}
        {step === STEP.EMAIL && (
          <div className={styles.authCard}>
            <div className={styles.authIcon}>✉</div>
            <h2 className={styles.authTitle}>E-posta ile Doğrulama</h2>
            <p className={styles.authDesc}>
              Rezervasyon yaparken kullandığınız e-posta adresini girin.
            </p>
            <div className={styles.authField}>
              <label className={styles.label}>E-posta Adresi</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                placeholder="ornek@email.com"
                className={styles.input}
                autoFocus
              />
            </div>
            {authError && <p className={styles.authError}>{authError}</p>}
            <Button
              variant="primary" size="lg" fullWidth
              onClick={handleSendOtp} loading={authLoading}
            >
              Doğrulama Kodu Gönder
            </Button>
          </div>
        )}

        {/* ── OTP ── */}
        {step === STEP.OTP && (
          <div className={styles.authCard}>
            <div className={styles.authIcon}>🔑</div>
            <h2 className={styles.authTitle}>Kodu Girin</h2>
            <p className={styles.authDesc}>
              <strong>{email}</strong> adresine gönderilen 6 haneli kodu girin.
              Kod 10 dakika geçerlidir.
            </p>
            <div className={styles.authField}>
              <label className={styles.label}>Doğrulama Kodu</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                placeholder="000000"
                className={`${styles.input} ${styles.otpInput}`}
                maxLength={6}
                autoFocus
              />
            </div>
            {authError && <p className={styles.authError}>{authError}</p>}
            <Button
              variant="primary" size="lg" fullWidth
              onClick={handleVerifyOtp} loading={authLoading}
            >
              Doğrula ve Rezervasyonları Gör
            </Button>
            <button
              className={styles.backLink}
              onClick={() => { setStep(STEP.EMAIL); setAuthError(''); setOtp('') }}
            >
              ← Farklı e-posta kullan
            </button>
          </div>
        )}

        {/* ── LIST ── */}
        {step === STEP.LIST && (
          <div className={styles.listSection}>
            <div className={styles.listHeader}>
              <div>
                <p className={styles.listEmail}>{email}</p>
                <p className={styles.listCount}>
                  {bookings.length} rezervasyon bulundu
                </p>
              </div>
              <button className={styles.backLink} onClick={handleLogout}>
                Çıkış
              </button>
            </div>

            {listLoading ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Yükleniyor...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className={styles.emptyState}>
                <p>Bu e-posta adresine ait rezervasyon bulunamadı.</p>
                <Button
                  variant="primary"
                  onClick={() => window.location.href = `/${lang}/booking`}
                >
                  Rezervasyon Yap
                </Button>
              </div>
            ) : (
              <div className={styles.bookingList}>
                {bookings.map((b) => {
                  const accentColors = {
                    ACCEPTED:    '#3b82f6',
                    IN_PROGRESS: '#f97316',
                    DONE:        '#10b981',
                    CANCELLED:   '#ef4444',
                    WAITING:     '#f59e0b',
                  }

                  return (
                    <div key={b.id} className={styles.bookingCard}>
                      <div
                        className={styles.bookingCardAccent}
                        style={{ background: accentColors[b.status] || '#e5e7eb' }}
                      />
                      <div className={styles.bookingCardInner}>
                        <div className={styles.bookingCardTop}>
                          <div className={styles.bookingMeta}>
                            <span
                              className={`${styles.statusBadge} ${styles[`status_${STATUS_COLOR[b.status]}`]}`}
                            >
                              <span
                                className={styles.statusBadgeDot}
                                style={{ background: accentColors[b.status] }}
                              />
                              {STATUS_LABELS[b.status]?.tr || b.status}
                            </span>
                            <span className={styles.plateTag}>{b.plate}</span>
                          </div>
                          <span className={styles.bookingDate}>{formatDate(b.slot_time)}</span>
                        </div>

                        <div className={styles.bookingDetails}>
                          <div className={styles.detailItem}>
                            <span className={styles.detailIcon}>📦</span>
                            <span>{b.packages?.name || '—'}</span>
                          </div>
                          <div className={styles.detailItem}>
                            <span className={styles.detailIcon}>📍</span>
                            <span>{b.locations?.name || '—'}</span>
                          </div>
                          {b.packages?.duration && (
                            <div className={styles.detailItem}>
                              <span className={styles.detailIcon}>⏱</span>
                              <span>{b.packages.duration} dakika</span>
                            </div>
                          )}
                        </div>

                        {(b.is_cancellable || b.is_reschedulable) && (
                          <div className={styles.bookingActions}>
                            {b.is_reschedulable && (
                              <Button
                                variant="outline" size="sm"
                                onClick={() => { setRescheduleTarget(b); setRescheduleError('') }}
                              >
                                Randevuyu Değiştir
                              </Button>
                            )}
                            {b.is_cancellable && (
                              <Button
                                variant="danger" size="sm"
                                onClick={() => { setCancelTarget(b); setCancelReason(''); setCancelError('') }}
                              >
                                İptal Et
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── İPTAL MODAL ── */}
      <Modal
        isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)}
        title="Rezervasyonu İptal Et" size="sm" showClose
      >
        {cancelTarget && (
          <div className={styles.modalBody}>
            <p className={styles.modalDesc}>
              <strong>{cancelTarget.plate}</strong> plakalı araç için{' '}
              <strong>{formatDateShort(cancelTarget.slot_time)}</strong> tarihindeki
              rezervasyonu iptal etmek istediğinize emin misiniz?
            </p>
            <div className={styles.reasonList}>
              <label className={styles.label}>İptal Sebebi</label>
              {CANCEL_REASONS.map((reason) => (
                <label key={reason} className={styles.radioRow}>
                  <input
                    type="radio" name="cancelReason" value={reason}
                    checked={cancelReason === reason}
                    onChange={() => setCancelReason(reason)}
                    className={styles.radio}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>
            {cancelError && <p className={styles.formError}>{cancelError}</p>}
            <div className={styles.modalActions}>
              <Button variant="outline" onClick={() => setCancelTarget(null)} disabled={cancelLoading}>
                Vazgeç
              </Button>
              <Button variant="danger" onClick={handleCancel} loading={cancelLoading}>
                İptal Et
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── RESCHEDULE MODAL ── */}
      <Modal
        isOpen={!!rescheduleTarget}
        onClose={() => { setRescheduleTarget(null); setRescheduleDate(''); setSlots([]); setSelectedSlot('') }}
        title="Randevuyu Değiştir" size="md" showClose
      >
        {rescheduleTarget && (
          <div className={styles.modalBody}>
            <p className={styles.modalDesc}>
              <strong>{rescheduleTarget.plate}</strong> — mevcut randevu:{' '}
              <strong>{formatDateShort(rescheduleTarget.slot_time)}</strong>
            </p>

            <div className={styles.fieldGroup}>
              <label className={styles.label}>Yeni Tarih Seçin</label>
              <select
                value={rescheduleDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className={styles.select}
              >
                <option value="">Tarih seçin...</option>
                {getNext14Days().map((d) => (
                  <option key={d} value={d}>
                    {new Date(d + 'T12:00:00').toLocaleDateString('tr-TR', {
                      weekday: 'long', day: 'numeric', month: 'long',
                    })}
                  </option>
                ))}
              </select>
            </div>

            {rescheduleDate && (
              <div className={styles.fieldGroup}>
                <label className={styles.label}>Müsait Slotlar</label>
                {slotsLoading ? (
                  <div className={styles.slotsLoading}>
                    <div className={styles.spinnerSm} /> Slotlar yükleniyor...
                  </div>
                ) : slots.length === 0 ? (
                  <p className={styles.noSlots}>Bu tarih için müsait slot bulunamadı.</p>
                ) : (
                  <div className={styles.slotsGrid}>
                    {slots.map((slot) => {
                      const time = new Date(slot.slot_time).toLocaleTimeString('tr-TR', {
                        hour: '2-digit', minute: '2-digit',
                      })
                      const full = !slot.is_available
                      return (
                        <button
                          key={slot.id || slot.slot_time}
                          disabled={full}
                          onClick={() => !full && setSelectedSlot(slot.slot_time)}
                          className={`${styles.slotBtn}
                            ${full ? styles.slotFull : ''}
                            ${selectedSlot === slot.slot_time ? styles.slotSelected : ''}
                          `}
                        >
                          <span className={styles.slotTime}>{time}</span>
                          {!full
                            ? <span className={styles.slotRemaining}>{slot.remaining} kalan</span>
                            : <span className={styles.slotFullLabel}>Dolu</span>
                          }
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {rescheduleError && <p className={styles.formError}>{rescheduleError}</p>}

            <div className={styles.modalActions}>
              <Button
                variant="outline"
                onClick={() => { setRescheduleTarget(null); setRescheduleDate(''); setSlots([]); setSelectedSlot('') }}
                disabled={rescheduleLoading}
              >
                Vazgeç
              </Button>
              <Button
                variant="primary"
                onClick={handleReschedule}
                loading={rescheduleLoading}
                disabled={!selectedSlot}
              >
                Randevuyu Değiştir
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </main>
  )
}