'use client'

import { useEffect, useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { ROUTES } from '@/constants/routes'
import Button from '@/components/ui/Button'
import Link from 'next/link'
import styles from '@/styles/sections/Pricing.module.css'

const FALLBACK_PACKAGES = [
  { id: 1, name: 'Konfor Paket',  price: 280, duration: 35, description: 'Temel yıkama + iç temizlik, cam koruma ve koltuk fırçalama.', features: ['Dış yıkama', 'İç temizlik', 'Cam koruma', 'Koltuk fırçalama'] },
  { id: 2, name: 'Premium Detay', price: 490, duration: 60, description: 'Tam detaylı yıkama, koltuk temizliği, koku giderme ve motor bölgesi.', features: ['Tam dış + iç yıkama', 'Koltuk derin temizlik', 'Koku giderme', 'Motor bölgesi', 'Boya koruma'] },
  { id: 3, name: 'Kristal Kaplama', price: 890, duration: 90, description: 'Seramik kaplama, tam detay, motor temizliği ve 6 ay koruma.', features: ['Seramik kaplama', 'Tam detay yıkama', 'Motor temizliği', '6 ay koruma', 'Öncelikli randevu'] },
]

export default function Pricing() {
  const { lang, t } = useLanguage()
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/packages')
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        const active = (d.packages || []).filter(p => p.is_active)
        // Max 3, ortadaki popular
        const top3 = active.slice(0, 3).map((pkg, idx) => ({
          ...pkg,
          popular: idx === 1
        }))
        setPackages(top3.length ? top3 : FALLBACK_PACKAGES)
      })
      .catch(() => setPackages(FALLBACK_PACKAGES))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className={styles.section} id="pricing">
      <div className={styles.topDecor} aria-hidden="true" />

      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>
            {t.pricing?.subtitle || 'Şeffaf fiyatlandırma'}
          </span>
          <h2 className={styles.title}>
            {t.pricing?.title || 'Fiyatlarımız'}
          </h2>
          <div className={styles.titleBar} />
          <p className={styles.desc}>Gizli ücret yok. İhtiyacınıza uygun paketi seçin.</p>
        </div>

        {/* Grid */}
        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.skeleton} />
            ))}
          </div>
        ) : (
          <div className={styles.grid}>
            {packages.map((pkg, idx) => (
              <div
                key={pkg.id}
                className={`${styles.card} ${pkg.popular ? styles.cardPopular : ''}`}
                style={{ '--delay': `${idx * 0.08}s` }}
              >
                {pkg.popular && (
                  <div className={styles.popularBadge}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    En Çok Satan
                  </div>
                )}

                <div className={styles.cardTop}>
                  <h3 className={styles.cardName}>{pkg.name}</h3>
                  <p className={styles.cardDesc}>{pkg.description}</p>
                  <div className={styles.priceRow}>
                    <span className={styles.currency}>{t.pricing?.currency || '₺'}</span>
                    <span className={styles.price}>{pkg.price}</span>
                  </div>
                  <span className={styles.duration}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                    {pkg.duration} dakika
                  </span>
                </div>

                {pkg.features?.length > 0 && (
                  <ul className={styles.features}>
                    {pkg.features.map(f => (
                      <li key={f} className={styles.feature}>
                        <span className={styles.featureCheck}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5"/>
                          </svg>
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                )}

                <div className={styles.cardBottom}>
                  <Link href={ROUTES.booking(lang)} style={{ width: '100%' }}>
                    <Button
                      variant={pkg.popular ? 'primary' : 'outline'}
                      size="md"
                      fullWidth
                    >
                      {t.pricing?.bookNow || 'Randevu Al'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <div className={styles.bottomDecor} aria-hidden="true" />
    </section>
  )
}