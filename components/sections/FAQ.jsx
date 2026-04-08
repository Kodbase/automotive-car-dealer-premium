'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import styles from '@/styles/sections/FAQ.module.css'

export default function FAQ() {
  const { t } = useLanguage()
  const [openIndex, setOpenIndex] = useState(null)

  const questions = t.faq?.questions || [
    { q: 'Randevu almak için ne gerekiyor?', a: 'Araç plakası, ad-soyad ve telefon numaranız yeterli. Kayıt gerektirmez.' },
    { q: 'Randevumu iptal edebilir miyim?', a: 'Evet, randevu saatinden en az 1 saat önce iptal edebilirsiniz.' },
    { q: 'İşlem ne kadar sürer?', a: 'Seçtiğiniz pakete göre 20 ila 90 dakika arasında değişmektedir.' },
    { q: 'Aracım güvende mi?', a: 'Tüm araçlarımız ekibimiz tarafından korunan kapalı alanda işleme alınmaktadır.' },
    { q: 'Ödeme nasıl yapılıyor?', a: 'Ödeme işlem tamamlandıktan sonra nakit veya kart ile yapılmaktadır.' },
    { q: 'Birden fazla randevu alabilir miyim?', a: 'Aynı anda yalnızca bir aktif randevunuz olabilir.' },
  ]

  const toggle = (i) => setOpenIndex(openIndex === i ? null : i)

  return (
    <section className={styles.section} id="faq">
      <div className={styles.inner}>

        {/* Header */}
        <div className={styles.header}>
          <span className={styles.eyebrow}>
            {t.faq?.subtitle || 'Merak ettikleriniz'}
          </span>
          <h2 className={styles.title}>
            {t.faq?.title || 'Sık Sorulan Sorular'}
          </h2>
          <div className={styles.titleBar} />
        </div>

        {/* Accordion */}
        <div className={styles.accordion}>
          {questions.map((item, i) => (
            <div
              key={i}
              className={`${styles.item} ${openIndex === i ? styles.itemOpen : ''}`}
            >
              <button
                className={styles.question}
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
              >
                <span className={styles.questionNum}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={styles.questionText}>{item.q}</span>
                <span className={styles.chevron} aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

      </div>

      {/* Decorative */}
      <div className={styles.decor} aria-hidden="true" />
    </section>
  )
}