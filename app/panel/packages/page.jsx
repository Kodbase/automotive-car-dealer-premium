'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/services/client/api'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import styles from '@/styles/panel/Packages.module.css'

const EMPTY_FORM = {
  name: '',
  price: '',
  duration: '',
  description: '',
  is_active: true,
  features: [], // string[]
}

export default function PackagesPage() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingPkg, setEditingPkg] = useState(null) // null = create
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  // Features yönetimi
  const [featureInput, setFeatureInput] = useState('')

  const fetchPackages = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/packages')
      setPackages(data.packages || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPackages()
  }, [fetchPackages])

  function openCreate() {
    setEditingPkg(null)
    setForm(EMPTY_FORM)
    setFeatureInput('')
    setFormError('')
    setModalOpen(true)
  }

  function openEdit(pkg) {
    setEditingPkg(pkg)
    setForm({
      name: pkg.name,
      price: String(pkg.price),
      duration: String(pkg.duration),
      description: pkg.description || '',
      is_active: pkg.is_active,
      features: (pkg.features || []).map((f) => f.feature || f),
    })
    setFeatureInput('')
    setFormError('')
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingPkg(null)
    setForm(EMPTY_FORM)
    setFeatureInput('')
    setFormError('')
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  // Feature ekleme
  function addFeature() {
    const trimmed = featureInput.trim()
    if (!trimmed) return
    if (form.features.includes(trimmed)) {
      setFeatureInput('')
      return
    }
    setForm((prev) => ({ ...prev, features: [...prev.features, trimmed] }))
    setFeatureInput('')
  }

  function handleFeatureKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      addFeature()
    }
  }

  function removeFeature(index) {
    setForm((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }))
  }

  async function handleSave() {
    setFormError('')
    if (!form.name.trim() || !form.price || !form.duration) {
      setFormError('Ad, fiyat ve süre zorunludur.')
      return
    }

    setSaving(true)
    try {
      if (editingPkg) {
        await apiRequest('/api/admin/packages', {
          method: 'PATCH',
          body: {
            id: editingPkg.id,
            name: form.name.trim(),
            price: form.price,
            duration: form.duration,
            description: form.description.trim(),
            is_active: form.is_active,
            features: form.features,
          },
        })
      } else {
        await apiRequest('/api/admin/packages', {
          method: 'POST',
          body: {
            name: form.name.trim(),
            price: form.price,
            duration: form.duration,
            description: form.description.trim(),
            is_active: form.is_active,
            features: form.features,
          },
        })
      }
      closeModal()
      await fetchPackages()
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(pkg) {
    try {
      await apiRequest('/api/admin/packages', {
        method: 'PATCH',
        body: { id: pkg.id, is_active: !pkg.is_active },
      })
      await fetchPackages()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Paketler</h1>
          <p className={styles.subtitle}>Hizmet paketlerini yönetin</p>
        </div>
        <Button variant="primary" onClick={openCreate}>
          + Yeni Paket
        </Button>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Paketler yükleniyor...</p>
        </div>
      ) : packages.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Henüz paket oluşturulmamış.</p>
          <Button variant="primary" onClick={openCreate}>
            İlk paketi oluştur
          </Button>
        </div>
      ) : (
        <div className={styles.grid}>
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`${styles.packageCard} ${!pkg.is_active ? styles.inactive : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.cardMeta}>
                  <span className={`${styles.badge} ${pkg.is_active ? styles.badgeActive : styles.badgeInactive}`}>
                    {pkg.is_active ? 'Aktif' : 'Pasif'}
                  </span>
                  <span className={styles.duration}>{pkg.duration} dk</span>
                </div>
                <h3 className={styles.packageName}>{pkg.name}</h3>
                <p className={styles.packagePrice}>
                  {Number(pkg.price).toLocaleString('tr-TR')} ₺
                </p>
              </div>

              {pkg.description && (
                <p className={styles.packageDesc}>{pkg.description}</p>
              )}

              {pkg.features && pkg.features.length > 0 && (
                <ul className={styles.featureList}>
                  {pkg.features.map((f, i) => (
                    <li key={i} className={styles.featureItem}>
                      <span className={styles.featureIcon}>✓</span>
                      {f.feature || f}
                    </li>
                  ))}
                </ul>
              )}

              <div className={styles.cardActions}>
                <Button variant="outline" size="sm" onClick={() => openEdit(pkg)}>
                  Düzenle
                </Button>
                <Button
                  variant={pkg.is_active ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => toggleActive(pkg)}
                >
                  {pkg.is_active ? 'Pasif Yap' : 'Aktif Yap'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingPkg ? 'Paketi Düzenle' : 'Yeni Paket Oluştur'}
        size="lg"
        showClose
      >
        <div className={styles.modalBody}>
          <div className={styles.formGrid}>
            <Input
              label="Paket Adı"
              name="name"
              value={form.name}
              onChange={handleFormChange}
              placeholder="Örn: Tam Detaylı Yıkama"
              required
            />

            <div className={styles.formRow}>
              <Input
                label="Fiyat (₺)"
                name="price"
                value={form.price}
                onChange={handleFormChange}
                placeholder="0"
                required
              />
              <Input
                label="Süre (dk)"
                name="duration"
                value={form.duration}
                onChange={handleFormChange}
                placeholder="30"
                required
              />
            </div>

            <div className={styles.textareaWrapper}>
              <label className={styles.label}>Açıklama</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleFormChange}
                placeholder="Paket hakkında kısa açıklama..."
                className={styles.textarea}
                rows={3}
              />
            </div>

            <div className={styles.checkboxRow}>
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                checked={form.is_active}
                onChange={handleFormChange}
                className={styles.checkbox}
              />
              <label htmlFor="is_active" className={styles.checkboxLabel}>
                Aktif (kullanıcılara görünür)
              </label>
            </div>
          </div>

          {/* Paket İçerikleri */}
          <div className={styles.featuresSection}>
            <h4 className={styles.featuresSectionTitle}>Paket İçerikleri</h4>
            <p className={styles.featuresSectionHint}>
              Paketin içerdiği hizmetleri ekleyin. Boş bırakabilirsiniz.
            </p>

            <div className={styles.featureInputRow}>
              <input
                type="text"
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={handleFeatureKeyDown}
                placeholder="Özellik ekle (Enter ile ekle)"
                className={styles.featureInput}
              />
              <button
                type="button"
                onClick={addFeature}
                className={styles.featureAddBtn}
                disabled={!featureInput.trim()}
              >
                Ekle
              </button>
            </div>

            {form.features.length > 0 ? (
              <ul className={styles.featureEditList}>
                {form.features.map((feat, index) => (
                  <li key={index} className={styles.featureEditItem}>
                    <span className={styles.featureEditIcon}>✓</span>
                    <span className={styles.featureEditText}>{feat}</span>
                    <button
                      type="button"
                      onClick={() => removeFeature(index)}
                      className={styles.featureRemoveBtn}
                      aria-label="Özelliği kaldır"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.featuresEmpty}>Henüz içerik eklenmedi.</p>
            )}
          </div>

          {formError && <p className={styles.formError}>{formError}</p>}

          <div className={styles.modalActions}>
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              İptal
            </Button>
            <Button variant="primary" onClick={handleSave} loading={saving}>
              {editingPkg ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}