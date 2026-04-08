'use client'

import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import styles from '@/styles/panel/Locations.module.css'

const EMPTY_FORM = { name: '', address: '', is_active: true }

export default function LocationsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editTarget, setEditTarget] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/locations')
      const data = await res.json()
      setLocations(data.locations ?? [])
    } catch {
      setLocations([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLocations() }, [])

  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setError('')
    setModalOpen(true)
  }

  const openEdit = (loc) => {
    setEditTarget(loc)
    setForm({ name: loc.name, address: loc.address, is_active: loc.is_active })
    setError('')
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.name.trim() || !form.address.trim()) {
      setError('İsim ve adres zorunludur')
      return
    }

    setSaving(true)
    setError('')

    try {
      const method = editTarget ? 'PATCH' : 'POST'
      const body = editTarget
        ? { id: editTarget.id, ...form }
        : form

      const res = await fetch('/api/admin/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Bir hata oluştu')
        return
      }

      setModalOpen(false)
      fetchLocations()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (loc) => {
    try {
      await fetch('/api/admin/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: loc.id, is_active: !loc.is_active })
      })
      fetchLocations()
    } catch { /* silent */ }
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Şubeler</h1>
          <p className={styles.subtitle}>
            {locations.length} şube kayıtlı
          </p>
        </div>
        <Button variant="primary" size="md" onClick={openCreate}>
          + Yeni Şube
        </Button>
      </div>

      {/* Grid */}
      <div className={styles.grid}>
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))
        ) : locations.length === 0 ? (
          <div className={styles.empty}>
            <svg className={styles.emptyIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p>Henüz şube eklenmedi</p>
            <Button variant="outline" size="sm" onClick={openCreate}>
              İlk Şubeyi Ekle
            </Button>
          </div>
        ) : (
          locations.map(loc => (
            <div key={loc.id} className={styles.card}>
              <div className={`${styles.cardAccent} ${!loc.is_active ? styles.cardAccentInactive : ''}`} />

              <div className={styles.cardHead}>
                <div className={styles.cardIcon}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <h3 className={styles.cardName}>{loc.name}</h3>
                  <p className={styles.cardAddress}>{loc.address}</p>
                </div>
              </div>

              <div className={styles.cardFoot}>
                <span className={`${styles.badge} ${loc.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                  <span style={{
                    width: '0.375rem', height: '0.375rem',
                    borderRadius: '50%',
                    background: loc.is_active ? '#16a34a' : 'var(--text-tertiary)',
                    display: 'inline-block'
                  }} />
                  {loc.is_active ? 'Aktif' : 'Pasif'}
                </span>

                <div className={styles.actions}>
                  <button
                    className={styles.iconBtn}
                    onClick={() => openEdit(loc)}
                    title="Düzenle"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    className={styles.iconBtn}
                    onClick={() => handleToggle(loc)}
                    title={loc.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                  >
                    {loc.is_active ? (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? 'Şubeyi Düzenle' : 'Yeni Şube Ekle'}
        size="md"
      >
        <div className={styles.formGrid}>
          <Input
            label="Şube Adı"
            name="name"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Merkez Şube"
            required
          />
          <Input
            label="Adres"
            name="address"
            value={form.address}
            onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
            placeholder="Atatürk Cad. No:1, Bursa"
            required
          />

          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>Aktif</span>
            <button
              type="button"
              className={`${styles.toggle} ${form.is_active ? styles.toggleOn : ''}`}
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            />
          </div>

          {error && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setModalOpen(false)}>
              İptal
            </Button>
            <Button variant="primary" size="md" loading={saving} onClick={handleSave}>
              {editTarget ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}