'use client'

import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'
import { CONFIG } from '@/constants/config'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import styles from '@/styles/pages/Contact.module.css'


 


/* ── Info items config ── */
function getInfoItems(t) {
  return [
    {
      label: t.contact?.phone || 'Telefon',
      value: CONFIG.phone,
      href: `tel:${CONFIG.phone}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.1 1.18 2 2 0 012.08 0h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L6.29 7.7a16 16 0 006 6l1.06-1.06a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 14v2.92z"/>
        </svg>
      ),
    },
    {
      label: t.contact?.whatsapp || 'WhatsApp',
      value: CONFIG.whatsapp,
      href: `https://wa.me/${(CONFIG.whatsapp || '').replace(/\D/g, '')}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      ),
    },
    {
      label: t.contact?.email || 'E-posta',
      value: CONFIG.email,
      href: `mailto:${CONFIG.email}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
          <path d="M22 6l-10 7L2 6"/>
        </svg>
      ),
    },
    {
      label: t.contact?.address || 'Adres',
      value: CONFIG.address,
      href: null,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      ),
    },
  ]
}

export default function ContactPage() {
  const { t } = useLanguage()

  const [form, setForm]       = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState(null)

  const handleChange = (e) => {
    setError(null)
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSending(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu.')
        return
      }

      setSent(true)
    } catch {
      setError('Bağlantı hatası. Lütfen tekrar deneyin.')
    } finally {
      setSending(false)
    }
  }

  const handleReset = () => {
    setSent(false)
    setError(null)
    setForm({ name: '', email: '', message: '' })
  }

  const infoItems = getInfoItems(t)

  return (
    <main className={styles.page}>

      {/* ── Hero strip ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <span className={styles.eyebrow}>Bize ulaşın</span>
          <h1 className={styles.heroTitle}>
            {t.contact?.title || 'İletişim'}
          </h1>
          <p className={styles.heroDesc}>
            Sorularınız ve randevu talepleriniz için her zaman buradayız.
          </p>
        </div>
      </section>

      {/* ── Content ── */}
      <section className={styles.contentSection}>
        <div className={styles.inner}>

          {/* Sol: iletişim bilgileri */}
          <div className={styles.infoCol}>
            <h2 className={styles.infoTitle}>İletişim Bilgileri</h2>
            <p className={styles.infoSubtitle}>
              Aşağıdaki kanallardan bize ulaşabilir ya da formu doldurup mesaj gönderebilirsiniz.
            </p>

            {infoItems.map((item) => {
              const content = (
                <>
                  <div className={styles.infoIconWrap}>{item.icon}</div>
                  <div className={styles.infoContent}>
                    <span className={styles.infoLabel}>{item.label}</span>
                    <span className={styles.infoValue}>{item.value}</span>
                  </div>
                </>
              )

              return item.href ? (
                <a
                  key={item.label}
                  href={item.href}
                  className={styles.infoCard}
                  target={item.href.startsWith('http') ? '_blank' : undefined}
                  rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                >
                  {content}
                </a>
              ) : (
                <div key={item.label} className={styles.infoCard}>
                  {content}
                </div>
              )
            })}

            {CONFIG.social?.instagram && (
              <a
                href={`https://instagram.com/${CONFIG.social.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.instagramCard}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                @{CONFIG.social.instagram}
              </a>
            )}
          </div>

          {/* Sağ: form */}
          <div className={styles.formCol}>
            {sent ? (
              <div className={styles.successState}>
                <div className={styles.successIcon}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                </div>
                <h3 className={styles.successTitle}>Mesajınız iletildi!</h3>
                <p className={styles.successDesc}>
                  En kısa sürede size dönüş yapacağız.
                </p>
                <button className={styles.resetBtn} onClick={handleReset}>
                  Yeni mesaj gönder
                </button>
              </div>
            ) : (
              <>
                <h2 className={styles.formTitle}>
                  {t.contact?.sendMessage || 'Mesaj Gönder'}
                </h2>
                <form className={styles.form} onSubmit={handleSubmit} noValidate>
                  <Input
                    label={t.contact?.name || 'Adınız'}
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Ahmet Yılmaz"
                    required
                  />
                  <Input
                    label={t.contact?.email || 'E-posta'}
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="ornek@mail.com"
                    required
                  />
                  <div className={styles.textareaWrap}>
                    <label className={styles.textareaLabel}>
                      {t.contact?.message || 'Mesajınız'}
                    </label>
                    <textarea
                      name="message"
                      value={form.message}
                      onChange={handleChange}
                      placeholder="Merhaba, size bir sorum olacaktı..."
                      className={styles.textarea}
                      rows={5}
                      required
                    />
                  </div>

                  {error && (
                    <p style={{ color: '#ef4444', fontSize: '14px', margin: '0 0 8px' }}>
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={sending}
                  >
                    {t.contact?.sendMessage || 'Gönder'}
                  </Button>
                </form>
              </>
            )}
          </div>

        </div>
      </section>

    </main>
  )
}