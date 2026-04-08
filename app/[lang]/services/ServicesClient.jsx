'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { ROUTES } from '@/constants/routes'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import styles from '@/styles/pages/Services.module.css'



const FALLBACK_PACKAGES = [
  { id: 1, name: 'Temel Yıkama',    price: 150, duration: 20, description: 'Dış yıkama, cam temizliği ve lastik parlatma.', is_active: true },
  { id: 2, name: 'Konfor Paket',    price: 280, duration: 35, description: 'Temel yıkama + iç temizlik ve cam koruma.', is_active: true },
  { id: 3, name: 'Premium Detay',   price: 490, duration: 60, description: 'Tam detaylı yıkama, koltuk temizliği ve koku giderme.', is_active: true },
  { id: 4, name: 'Kristal Kaplama', price: 890, duration: 90, description: 'Seramik kaplama + tam detay + motor temizliği ve 6 ay koruma garantisi.', is_active: true },
]

const ICONS = ['🚿', '✨', '💎', '🏆', '🔧', '🛡️']

export default function ServicesPage() {
  const { lang, t } = useLanguage()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const active = (d.packages || []).filter(p => p.is_active)
        setPackages(active.length ? active : FALLBACK_PACKAGES)
      })
      .catch(() => setPackages(FALLBACK_PACKAGES))
      .finally(() => setLoading(false))
  }, [])

  return (
    <main className={styles.page}>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>
            {t.services?.subtitle || 'Ne sunuyoruz?'}
          </span>
          <h1 className={styles.heroTitle}>
            {t.services?.title || 'Hizmetlerimiz'}
          </h1>
          <p className={styles.heroDesc}>
            Aracınız için ihtiyaç duyduğunuz tüm bakım paketleri tek çatı altında.
          </p>
        </div>
      </section>

      {/* Packages */}
      <section className={styles.gridSection}>
        <div className={styles.inner}>
          {loading ? (
            <div className={styles.grid}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.skeleton} />
              ))}
            </div>
          ) : (
            <div className={styles.grid}>
              {packages.map((pkg, idx) => (
                <Card key={pkg.id} padding="lg" hover>
                  <div className={styles.cardAccent} />

                  <div className={styles.cardHead}>
                    <span className={styles.icon}>{pkg.icon || ICONS[idx % ICONS.length]}</span>
                    <div className={styles.priceWrap}>
                      <span className={styles.priceCurr}>{t.pricing?.currency || '₺'}</span>
                      <span className={styles.priceVal}>{pkg.price}</span>
                    </div>
                  </div>

                  <h2 className={styles.cardName}>{pkg.name}</h2>
                  <p className={styles.cardDesc}>{pkg.description}</p>

                  {pkg.features?.length > 0 && (
                    <ul className={styles.features}>
                      {pkg.features.map(f => (
                        <li key={f} className={styles.feature}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className={styles.cardFoot}>
                    <span className={styles.duration}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                      </svg>
                      {pkg.duration} dakika
                    </span>
                    <Link href={ROUTES.booking(lang)}>
                      <Button variant="primary" size="sm">
                        {t.services?.bookNow || 'Randevu Al'}
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

    </main>
  )
}