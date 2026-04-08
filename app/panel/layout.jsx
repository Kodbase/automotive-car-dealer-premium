'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { getPanelMe } from '@/services/client/panel.service'
import styles from '@/styles/panel/PanelLayout.module.css'

const MENU_ITEMS = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    href: '/panel/dashboard',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    roles: ['staff', 'admin']
  },
  {
    key: 'bookings',
    label: 'Rezervasyonlar',
    href: '/panel/bookings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    roles: ['staff', 'admin']
  },
  {
    key: 'slots',
    label: 'Slot Takibi',
    href: '/panel/slots',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    roles: ['admin']
  },
  {
    key: 'packages',
    label: 'Paketler',
    href: '/panel/packages',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
        <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
        <line x1="12" y1="22.08" x2="12" y2="12"/>
      </svg>
    ),
    roles: ['admin']
  },
  {
    key: 'users',
    label: 'Kullanıcılar',
    href: '/panel/users',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    roles: ['admin']
  },
  {
    key: 'locations',
    label: 'Şubeler',
    href: '/panel/locations',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
        <circle cx="12" cy="10" r="3"/>
      </svg>
    ),
    roles: ['admin']
  },
  {
    key: 'settings',
    label: 'Ayarlar',
    href: '/panel/settings',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M12 2v2M12 20v2M2 12h2M20 12h2"/>
      </svg>
    ),
    roles: ['admin']
  },
  {
    key: 'logs',
    label: 'Loglar',
    href: '/panel/logs',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    roles: ['admin']
  }
]

export default function PanelLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const { signOut } = useAuth()

  const [panelUser, setPanelUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    // Login sayfasındaysa kontrol etme
    if (pathname === '/panel/login') {
      setLoading(false)
      return
    }
  
    getPanelMe()
      .then(({ user }) => {
        setPanelUser(user)
        setLoading(false)
      })
      .catch(() => {
        router.replace('/panel/login')
      })
  }, [pathname])

  const handleSignOut = async () => {
    await signOut()
    router.replace('/panel/login')
  }

  if (loading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    )
  }

  const visibleMenu = MENU_ITEMS.filter(item =>
    item.roles.includes(panelUser?.role)
  )

  const roleLabel = panelUser?.role === 'admin' ? 'Admin' : 'Staff'

  return (
    <div className={styles.root}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className={styles.overlay}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>

        {/* Logo */}
        <div className={styles.sidebarLogo}>
          <span className={styles.logoMark}>R</span>
          <div className={styles.logoTexts}>
            <span className={styles.logoName}>Revive Auto Lab</span>
            <span className={styles.logoSub}>Panel</span>
          </div>
        </div>

        {/* Nav */}
        <nav className={styles.nav}>
          {visibleMenu.map(item => {
            const isActive = pathname === item.href ||
              (item.href !== '/panel/dashboard' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.key}
                href={item.href}
                className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {isActive && <span className={styles.navActiveDot} />}
              </Link>
            )
          })}
        </nav>

        {/* User info + sign out */}
        <div className={styles.sidebarFooter}>
          <div className={styles.userInfo}>
            <div className={styles.userAvatar}>
              {panelUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className={styles.userTexts}>
              <span className={styles.userName}>{panelUser?.name}</span>
              <span className={styles.userRole}>{roleLabel}</span>
            </div>
          </div>
          <button
            className={styles.signOutBtn}
            onClick={handleSignOut}
            title="Çıkış Yap"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className={styles.main}>

        {/* Topbar (mobile) */}
        <header className={styles.topbar}>
          <button
            className={styles.hamburger}
            onClick={() => setSidebarOpen(prev => !prev)}
            aria-label="Menüyü aç"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <span className={styles.topbarTitle}>
            {visibleMenu.find(m =>
              pathname === m.href ||
              (m.href !== '/panel/dashboard' && pathname.startsWith(m.href))
            )?.label || 'Panel'}
          </span>

          <div className={styles.topbarUser}>
            <div className={styles.topbarAvatar}>
              {panelUser?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  )
}