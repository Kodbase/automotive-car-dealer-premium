'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import Button from '@/components/ui/Button'
import styles from '@/styles/sections/Hero.module.css'

const STATUS_LABELS = {
  WAITING:     { tr: 'Bekliyor',    color: '#f59e0b' },
  ACCEPTED:    { tr: 'Onaylandı',   color: '#3b82f6' },
  IN_PROGRESS: { tr: 'İşlemde',     color: '#f97316' },
  DONE:        { tr: 'Tamamlandı',  color: '#10b981' },
  CANCELLED:   { tr: 'İptal',       color: '#ef4444' },
}

function ActiveBookingCard({ lang }) {
  const { user } = useAuth()
  const [booking, setBooking] = useState(null)
  const [loaded, setLoaded]   = useState(false)

  useEffect(() => {
    if (!user) { setLoaded(true); return }

    fetch('/api/user/status')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.booking) setBooking(data.booking)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [user])

  // Giriş yoksa veya aktif booking yoksa — dekoratif kart
  if (!loaded || !booking) {
    return (
      <div className={styles.visualCard}>
        <div className={styles.visualCardHeader}>
          <span className={styles.visualDot} style={{ background: '#ef4444' }} />
          <span className={styles.visualDot} style={{ background: '#f59e0b' }} />
          <span className={styles.visualDot} style={{ background: '#22c55e' }} />
          <span className={styles.visualCardTitle}>Aktif Randevu</span>
        </div>
        <div className={styles.visualCardBody}>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Paket</span>
            <span className={styles.visualValue}>Premium Detay</span>
          </div>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Plaka</span>
            <span className={styles.visualValue}>16 ABC 123</span>
          </div>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Saat</span>
            <span className={styles.visualValue}>14:30</span>
          </div>
          <div className={styles.visualStatus}>
            <span className={styles.visualStatusDot} />
            <span>İşlemde</span>
          </div>
        </div>
        <div className={styles.visualProgress}>
          <div className={styles.visualProgressBar} />
        </div>
      </div>
    )
  }

  // Gerçek aktif booking
  const statusMeta = STATUS_LABELS[booking.status] || STATUS_LABELS.ACCEPTED
  const slotTime   = new Date(booking.slot_time)
  const timeStr    = slotTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr    = slotTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })

  return (
    <Link href={`/${lang}/tracking`} className={styles.visualCardLink}>
      <div className={`${styles.visualCard} ${styles.visualCardLive}`}>
        <div className={styles.visualCardHeader}>
          <span className={styles.visualDot} style={{ background: '#ef4444' }} />
          <span className={styles.visualDot} style={{ background: '#f59e0b' }} />
          <span className={styles.visualDot} style={{ background: '#22c55e' }} />
          <span className={styles.visualCardTitle}>Aktif Randevu</span>
          <span className={styles.visualLiveDot} />
        </div>
        <div className={styles.visualCardBody}>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Paket</span>
            <span className={styles.visualValue}>
              {booking.packages?.name || '—'}
            </span>
          </div>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Plaka</span>
            <span className={styles.visualValue}>{booking.plate}</span>
          </div>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Tarih</span>
            <span className={styles.visualValue}>{dateStr}</span>
          </div>
          <div className={styles.visualRow}>
            <span className={styles.visualLabel}>Saat</span>
            <span className={styles.visualValue}>{timeStr}</span>
          </div>
          <div className={styles.visualStatus}>
            <span
              className={styles.visualStatusDot}
              style={{ background: statusMeta.color }}
            />
            <span style={{ color: statusMeta.color }}>{statusMeta.tr}</span>
          </div>
        </div>
        <div className={styles.visualProgress}>
          <div className={styles.visualProgressBar} />
        </div>
        <div className={styles.visualCardFooter}>
          <span>Randevuyu görüntüle →</span>
        </div>
      </div>
    </Link>
  )
}

export default function Hero() {
  const { lang, t } = useLanguage()
  const { mounted }  = useTheme()

  if (!mounted) return null

  return (
    <section className={styles.hero}>
      <div className={styles.grid} aria-hidden="true">
        {Array.from({ length: 64 }).map((_, i) => (
          <span key={i} className={styles.gridCell} />
        ))}
      </div>
      <div className={styles.orbOrange} aria-hidden="true" />
      <div className={styles.orbWhite}  aria-hidden="true" />
      <div className={styles.stripeAccent} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          <span className={styles.badgeText}>Premium Araç Bakım</span>
        </div>

        <h1 className={styles.title}>
          <span className={styles.titleLine1}>{t.hero?.title?.split(' ').slice(0, 2).join(' ') || 'Aracınız'}</span>
          <span className={styles.titleLine2}>
            <span className={styles.titleAccent}>{t.hero?.title?.split(' ').slice(2, 4).join(' ') || 'Hak Ettiği'}</span>
          </span>
          <span className={styles.titleLine3}>{t.hero?.title?.split(' ').slice(4).join(' ') || 'Bakımı Alıyor'}</span>
        </h1>

        <p className={styles.subtitle}>
          {t.hero?.subtitle || 'Profesyonel ekibimizle araç yıkama ve bakım randevunuzu kolayca oluşturun.'}
        </p>

        <div className={styles.actions}>
          <Link href={ROUTES.booking(lang)}>
            <Button variant="primary" size="xl">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8"  y1="2" x2="8"  y2="6" />
                <line x1="3"  y1="10" x2="21" y2="10" />
              </svg>
              {t.hero?.cta || 'Randevu Al'}
            </Button>
          </Link>
          <Link href={ROUTES.services(lang)}>
            <Button variant="outline" size="xl">
              {t.hero?.ctaSecondary || 'Hizmetleri Gör'}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Button>
          </Link>
        </div>

        <div className={styles.stats}>
          {[
            { value: '2.400+', label: 'Mutlu Müşteri' },
            { value: '98%',    label: 'Memnuniyet'    },
            { value: '15dk',   label: 'Ortalama Süre' },
            { value: '7/24',   label: 'Online Randevu' },
          ].map((stat) => (
            <div key={stat.label} className={styles.stat}>
              <span className={styles.statValue}>{stat.value}</span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.visual} aria-hidden="false">
        <ActiveBookingCard lang={lang} />
        <div className={styles.visualBadge}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span>Güvenli & Sigortalı</span>
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <div className={styles.scrollLine} />
      </div>
    </section>
  )
}