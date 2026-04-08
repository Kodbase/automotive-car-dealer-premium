'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { getPanelMe } from '@/services/client/panel.service'
import styles from '@/styles/panel/Login.module.css'

export default function PanelLoginPage() {
  const router = useRouter()
  const { signIn, loading: authLoading } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  // Zaten giriş yapılmışsa yönlendir
  useEffect(() => {
    getPanelMe()
      .then(() => router.replace('/panel/dashboard'))
      .catch(() => setChecking(false))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error: signInError } = await signIn(email, password)

    if (signInError) {
      setError('Email veya şifre hatalı')
      setLoading(false)
      return
    }

    // Rol kontrolü
    try {
      await getPanelMe()
      router.replace('/panel/dashboard')
    } catch {
      setError('Panel erişim yetkiniz bulunmuyor')
      setLoading(false)
    }
  }

  if (checking || authLoading) {
    return (
      <div className={styles.loadingScreen}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <span className={styles.logoMark}>R</span>
          <span className={styles.logoText}>Revive Auto Lab</span>
        </div>

        <h1 className={styles.title}>Panel Girişi</h1>
        <p className={styles.subtitle}>Staff veya admin hesabıyla giriş yapın</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="email" className={styles.label}>Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.input}
              placeholder="ornek@reviveautolab.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>Şifre</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className={styles.error}>{error}</div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  )
}