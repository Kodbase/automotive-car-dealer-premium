'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useLanguage } from '@/hooks/useLanguage'
import { useTheme } from '@/hooks/useTheme'
import { ROUTES } from '@/constants/routes'
import styles from '@/styles/layout/Navbar.module.css'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { lang, t, switchLanguage } = useLanguage()
  const { theme, toggleTheme, mounted } = useTheme()
  const pathname = usePathname()

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (menuOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const navLinks = [
    { label: t.nav.home,     href: ROUTES.home(lang) },
    { label: t.nav.services, href: ROUTES.services(lang) },
    { label: t.nav.about,    href: ROUTES.about(lang) },
    { label: t.nav.faq,      href: ROUTES.faq(lang) },
    { label: t.nav.contact,  href: ROUTES.contact(lang) },
    // Randevu takip linki
    {
      label: lang === 'tr' ? 'Randevu Takip' : 'Track Booking',
      href: `/${lang}/tracking`
    },
  ]

  const isActive = (href) => pathname === href

  return (
    <>
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : styles.navTransparent}`}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link href={ROUTES.home(lang)} className={styles.logo}>
            <div className={styles.logoIcon}>
              <div className={styles.logoIconAccent} />
              <div className={styles.logoIconMain}>
                <span className={styles.logoText}>RA</span>
              </div>
            </div>
            <div className={styles.logoName}>
              <span className={styles.logoTitle}>REVIVE</span>
              <span className={styles.logoSub}>Auto Lab</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className={styles.links}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${styles.link} ${isActive(link.href) ? styles.linkActive : ''}`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right — tek tema butonu burada */}
          <div className={styles.right}>
            {mounted && (
              <button
                className={styles.iconBtn}
                onClick={toggleTheme}
                aria-label="Tema değiştir"
              >
                {theme === 'dark' ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}

            <button
              className={styles.langBtn}
              onClick={() => switchLanguage(lang === 'tr' ? 'en' : 'tr')}
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>

            <Link href={ROUTES.booking(lang)} className={styles.ctaBtn}>
              <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {t.nav.booking}
            </Link>
          </div>

          {/* Mobile sağ — sadece hamburger */}
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menü"
          >
            {menuOpen ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className={styles.mobileMenu}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`${styles.mobileLink} ${isActive(link.href) ? styles.mobileLinkActive : ''}`}
            >
              {link.label}
            </Link>
          ))}
          <div className={styles.mobileBottom}>
            {mounted && (
              <button className={styles.iconBtn} onClick={toggleTheme} aria-label="Tema değiştir">
                {theme === 'dark' ? (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
            )}
            <button
              className={styles.mobileLangBtn}
              onClick={() => {
                switchLanguage(lang === 'tr' ? 'en' : 'tr')
                setMenuOpen(false)
              }}
            >
              {lang === 'tr' ? 'EN' : 'TR'}
            </button>
            <Link
              href={ROUTES.booking(lang)}
              className={styles.mobileCtaBtn}
              onClick={() => setMenuOpen(false)}
            >
              {t.nav.booking}
            </Link>
          </div>
        </div>
      )}
    </>
  )
}