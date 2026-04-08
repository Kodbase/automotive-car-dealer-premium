'use client'

import { useLanguage } from '@/hooks/useLanguage'
import { CONFIG } from '@/constants/config'
import styles from '@/styles/pages/About.module.css'



const STATS = [
  { value: '2.400+', label: 'Mutlu Müşteri'     },
  { value: '98%',    label: 'Memnuniyet Oranı'  },
  { value: '5+',     label: 'Yıllık Deneyim'    },
  { value: '7/24',   label: 'Online Randevu'     },
]

const VALUES = (t) => [
  {
    key: 'quality',
    label: t.about?.values?.quality || 'Kalite',
    desc: 'Her araç, sanki kendi aracımızmış gibi özenle işleme alınır. Kullandığımız ürünler sektörün en iyileridir.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
      </svg>
    ),
  },
  {
    key: 'trust',
    label: t.about?.values?.trust || 'Güven',
    desc: 'Şeffaf fiyatlandırma, gizli ücret yok. Söylediğimizi yaparız, yaptığımızı söyleriz.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    key: 'speed',
    label: t.about?.values?.speed || 'Hız',
    desc: 'Online randevu sistemiyle bekleme yok. Zamanınız değerli, biz bunu biliyoruz.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
      </svg>
    ),
  },
]

export default function AboutPage() {
  const { t } = useLanguage()
  const values = VALUES(t)

  return (
    <main className={styles.page}>

      {/* ── Hero strip ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Biz kimiz?</span>
          <h1 className={styles.heroTitle}>
            {t.about?.title || 'Hakkımızda'}
          </h1>
          <p className={styles.heroDesc}>
            {t.about?.subtitle || 'Aracınıza premium bakım sunan profesyonel ekibimizle tanışın.'}
          </p>
        </div>
      </section>

      {/* ── Story + Stats ── */}
      <section className={styles.storySection}>
        <div className={styles.inner}>
          <div className={styles.storyGrid}>

            {/* Left: hikaye metni */}
            <div className={styles.storyText}>
              <h2 className={styles.sectionTitle}>Hikayemiz</h2>
              <div className={styles.titleBar} />
              <p>
                {t.about?.description ||
                  `${CONFIG.siteName}, araç sahiplerine premium bakım deneyimi sunmak amacıyla kurulmuştur. Yılların biriktirdiği deneyim ve uzman kadromuzla binlerce araca hizmet verdik.`
                }
              </p>
              <p>
                Misyonumuz her müşteriye zamanında, şeffaf ve kaliteli hizmet sunmak.
                Online randevu sistemimiz sayesinde artık kuyrukta beklemenize gerek yok —
                birkaç tıkla randevunuzu oluşturun, gerisini bize bırakın.
              </p>
              <p>
                Kullandığımız ürünler ve ekipmanlar sektörün en güncel standartlarını
                karşılar. Her işlem sonrası aracınız kontrol edilir ve teslim edilmeden
                önce son kalite denetiminden geçirilir.
              </p>
            </div>

            {/* Right: istatistikler */}
            <div className={styles.statsGrid}>
              {STATS.map((s) => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statVal}>{s.value}</span>
                  <span className={styles.statLbl}>{s.label}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* ── Values ── */}
      <section className={styles.valuesSection}>
        <div className={styles.valuesDecor} aria-hidden="true" />
        <div className={styles.valuesInner}>

          <div className={styles.valuesHeader}>
            <span className={styles.eyebrow}>Ne önemsiyoruz?</span>
            <h2 className={styles.sectionTitle}>Değerlerimiz</h2>
            <div className={styles.titleBar} />
          </div>

          <div className={styles.valuesGrid}>
            {values.map((v, i) => (
              <div
                key={v.key}
                className={styles.valueCard}
                style={{ '--delay': `${i * 0.1}s` }}
              >
                <div className={styles.valueIcon}>{v.icon}</div>
                <h3 className={styles.valueName}>{v.label}</h3>
                <p className={styles.valueDesc}>{v.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

    </main>
  )
}