'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { ROUTES } from '@/constants/routes'
import { CONFIG } from '@/constants/config'
import Button from '@/components/ui/Button'
import styles from '@/styles/pages/FAQ.module.css'



/* ── Kategoriler ── */
const CATEGORIES = [
  { key: 'all',      label: 'Tümü'      },
  { key: 'booking',  label: 'Randevu'   },
  { key: 'service',  label: 'Hizmet'    },
  { key: 'payment',  label: 'Ödeme'     },
  { key: 'other',    label: 'Diğer'     },
]

/* ── Fallback sorular (i18n yoksa) ── */
const FALLBACK_QUESTIONS = [
  {
    q: 'Randevu almak için ne gerekiyor?',
    a: 'Araç plakası, ad-soyad ve telefon numaranız yeterli. Sisteme kayıt gerektirmez, anında randevu oluşturabilirsiniz.',
    cat: 'booking',
  },
  {
    q: 'Randevumu iptal edebilir miyim?',
    a: 'Evet, randevu saatinizden en az 1 saat önce sisteme girerek veya telefonla arayarak iptal işlemi yapabilirsiniz.',
    cat: 'booking',
  },
  {
    q: 'Aynı anda birden fazla randevu alabilir miyim?',
    a: 'Hayır, sistemimiz her plaka için aynı anda yalnızca bir aktif randevuya izin vermektedir. Mevcut randevunuzu tamamladıktan sonra yeni randevu alabilirsiniz.',
    cat: 'booking',
  },
  {
    q: 'İşlem ne kadar sürer?',
    a: 'Seçtiğiniz pakete bağlı olarak 20 ila 90 dakika arasında değişmektedir. Temel Yıkama ~20 dk, Kristal Kaplama ~90 dk sürmektedir.',
    cat: 'service',
  },
  {
    q: 'Hangi araç tipleri için hizmet veriyorsunuz?',
    a: 'Binek araçlar, SUV, hafif ticari araçlar ve minibüsler için hizmet veriyoruz. Ağır vasıtalar için lütfen telefonla bilgi alın.',
    cat: 'service',
  },
  {
    q: 'Aracım güvende mi, sigortalı mı?',
    a: 'Evet, tüm araçlarımız kapalı alanda, ekibimizin gözetiminde işleme alınmaktadır. İşlem süresince aracınız güvencemiz altındadır.',
    cat: 'service',
  },
  {
    q: 'Ödeme nasıl yapılıyor?',
    a: 'Ödeme işlem tamamlandıktan sonra nakit veya kredi/banka kartı ile yapılmaktadır. Online ön ödeme şu an için aktif değildir.',
    cat: 'payment',
  },
  {
    q: 'Faturada gizli ücret var mı?',
    a: 'Hayır, seçtiğiniz paketin fiyatı dışında herhangi bir ek ücret alınmamaktadır. Şeffaf fiyatlandırma politikamız gereği tüm ücretler önceden belirtilir.',
    cat: 'payment',
  },
  {
    q: 'Plakam bloke edildiyse ne yapmalıyım?',
    a: 'Plaka engellemesi genellikle art arda iptal veya kurallara aykırı kullanım nedeniyle oluşur. Detaylı bilgi için bizimle iletişime geçin.',
    cat: 'other',
  },
  {
    q: 'Randevu bildirimi alacak mıyım?',
    a: 'Evet, randevu oluşturulduğunda SMS ile bildirim gönderilmektedir. Ayrıca randevunuzdan 1 saat önce hatırlatma mesajı alırsınız.',
    cat: 'other',
  },
]






export default function FAQPage() {
  const { lang, t } = useLanguage()

  const [activeCategory, setActiveCategory] = useState('all')
  const [openIndex, setOpenIndex]           = useState(null)

  /* i18n sorularını kullan, yoksa fallback */
  const rawQuestions = useMemo(() => {
    if (t.faq?.questions?.length) {
      return t.faq.questions.map((item, i) => ({
        ...item,
        cat: FALLBACK_QUESTIONS[i]?.cat || 'other',
      }))
    }
    return FALLBACK_QUESTIONS
  }, [t.faq?.questions])


  /* Kategoriye göre filtrele */
  const questions = useMemo(() => {
    if (activeCategory === 'all') return rawQuestions
    return rawQuestions.filter(q => q.cat === activeCategory)
  }, [rawQuestions, activeCategory])

  const toggle = (i) => setOpenIndex(prev => prev === i ? null : i)


  /* Kategori değişince accordionu kapat */
  const handleCategoryChange = (key) => {
    setActiveCategory(key)
    setOpenIndex(null)
  }


  return (
    <main className={styles.page}>

      {/* ── Hero strip ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Yardım merkezi</span>
          <h1 className={styles.heroTitle}>
            {t.faq?.title || 'Sık Sorulan Sorular'}
          </h1>
          <p className={styles.heroDesc}>
            {t.faq?.subtitle || 'Aklınızdaki soruların cevabını burada bulabilirsiniz.'}
          </p>
        </div>
      </section>

      {/* ── Accordion content ── */}
      <section className={styles.contentSection}>
        <div className={styles.decor} aria-hidden="true" />
        <div className={styles.inner}>

          {/* Kategori tabs */}
          <div className={styles.tabs}>
            {CATEGORIES.map(cat => (
              <button
                key={cat.key}
                className={`${styles.tab} ${activeCategory === cat.key ? styles.tabActive : ''}`}
                onClick={() => handleCategoryChange(cat.key)}
                type="button"
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Accordion */}
          <div className={styles.accordion}>
            {questions.map((item, i) => (
              <div
                key={i}
                className={`${styles.item} ${openIndex === i ? styles.itemOpen : ''}`}
                style={{ '--delay': `${i * 0.04}s` }}
              >
                <button
                  className={styles.question}
                  onClick={() => toggle(i)}
                  aria-expanded={openIndex === i}
                  type="button"
                >
                  <span className={styles.questionNum}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={styles.questionText}>{item.q}</span>
                  <span className={styles.chevron} aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 9l6 6 6-6"/>
                    </svg>
                  </span>
                </button>

                <div className={styles.answerWrap}>
                  <p className={styles.answer}>{item.a}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Hâlâ sorunuz var mı? */}
          <div className={styles.ctaBox}>
            <div className={styles.ctaText}>
              <span className={styles.ctaTitle}>Aradığınızı bulamadınız mı?</span>
              <span className={styles.ctaDesc}>
                Ekibimiz size yardımcı olmaktan memnuniyet duyar.
              </span>
            </div>
            <div className={styles.ctaActions}>
              <a href={`tel:${CONFIG.phone}`}>
                <Button variant="outline" size="md">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.08 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.29 7.7a16 16 0 006 6l1.06-1.06a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/>
                  </svg>
                  Bizi Ara
                </Button>
              </a>
              <Link href={ROUTES.contact(lang)}>
                <Button variant="primary" size="md">
                  Mesaj Gönder
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

    </main>
  )
}