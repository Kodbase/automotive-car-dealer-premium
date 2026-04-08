'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/services/client/api'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import styles from '@/styles/panel/Settings.module.css'

// Bizim sistemde: 1=Pazartesi … 7=Pazar
// JS getDay(): 0=Pazar, 1=Paz → biz 7 olarak tutuyoruz
const DAYS = [
  { value: 1, label: 'Pazartesi' },
  { value: 2, label: 'Salı' },
  { value: 3, label: 'Çarşamba' },
  { value: 4, label: 'Perşembe' },
  { value: 5, label: 'Cuma' },
  { value: 6, label: 'Cumartesi' },
  { value: 7, label: 'Pazar' },
]

const DEFAULT_SETTINGS = {
  working_hours: { start: '09:00', end: '18:00' },
  working_days: [1, 2, 3, 4, 5],
  slot_duration: 30,
  capacity_default: 3,
  cancel_limit_hours: 2,
  max_booking_per_user: 1,
}

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchSettings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest('/api/admin/settings')
      setSettings({
        working_hours: data.working_hours ?? DEFAULT_SETTINGS.working_hours,
        working_days: data.working_days ?? DEFAULT_SETTINGS.working_days,
        slot_duration: data.slot_duration ?? DEFAULT_SETTINGS.slot_duration,
        capacity_default: data.capacity_default ?? DEFAULT_SETTINGS.capacity_default,
        cancel_limit_hours: data.cancel_limit_hours ?? DEFAULT_SETTINGS.cancel_limit_hours,
        max_booking_per_user: data.max_booking_per_user ?? DEFAULT_SETTINGS.max_booking_per_user,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  // Çalışma saati değişimi
  function handleHourChange(e) {
    const { name, value } = e.target
    setSettings((prev) => ({
      ...prev,
      working_hours: { ...prev.working_hours, [name]: value },
    }))
  }

  // Sayısal alan değişimi
  function handleNumberChange(e) {
    const { name, value } = e.target
    setSettings((prev) => ({ ...prev, [name]: value }))
  }

  // Çalışma günü toggle
  function toggleDay(dayValue) {
    setSettings((prev) => {
      const current = prev.working_days || []
      const exists = current.includes(dayValue)
      const updated = exists
        ? current.filter((d) => d !== dayValue)
        : [...current, dayValue].sort((a, b) => a - b)
      return { ...prev, working_days: updated }
    })
  }

  async function handleSave() {
    setError('')
    setSuccessMsg('')

    // Validasyon
    const startH = settings.working_hours.start
    const endH = settings.working_hours.end
    if (startH >= endH) {
      setError('Bitiş saati başlangıç saatinden sonra olmalıdır.')
      return
    }
    if (!settings.working_days || settings.working_days.length === 0) {
      setError('En az bir çalışma günü seçilmelidir.')
      return
    }
    if (Number(settings.slot_duration) < 5) {
      setError('Slot süresi en az 5 dakika olmalıdır.')
      return
    }
    if (Number(settings.capacity_default) < 1) {
      setError('Kapasite en az 1 olmalıdır.')
      return
    }

    setSaving(true)
    try {
      await apiRequest('/api/admin/settings', {
        method: 'POST',
        body: {
          working_hours: settings.working_hours,
          working_days: settings.working_days,
          slot_duration: Number(settings.slot_duration),
          capacity_default: Number(settings.capacity_default),
          cancel_limit_hours: Number(settings.cancel_limit_hours),
          max_booking_per_user: Number(settings.max_booking_per_user),
        },
      })
      setSuccessMsg('Ayarlar başarıyla kaydedildi.')
      setTimeout(() => setSuccessMsg(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingState}>
        <div className={styles.spinner} />
        <p>Ayarlar yükleniyor...</p>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Sistem Ayarları</h1>
        <p className={styles.subtitle}>Rezervasyon ve slot parametrelerini yönetin</p>
      </div>

      <div className={styles.sections}>

        {/* ── Çalışma Günleri ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Çalışma Günleri</h2>
          <p className={styles.sectionDesc}>
            Rezervasyon alınabilecek günleri seçin.
          </p>
          <div className={styles.daysGrid}>
            {DAYS.map((day) => {
              const checked = (settings.working_days || []).includes(day.value)
              return (
                <label
                  key={day.value}
                  className={`${styles.dayCard} ${checked ? styles.dayCardActive : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDay(day.value)}
                    className={styles.dayCheckbox}
                  />
                  <span className={styles.dayLabel}>{day.label}</span>
                  <span className={styles.dayIndicator} />
                </label>
              )
            })}
          </div>
        </section>

        {/* ── Çalışma Saatleri ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Çalışma Saatleri</h2>
          <p className={styles.sectionDesc}>
            Slotların oluşturulacağı zaman aralığı.
          </p>
          <div className={styles.hoursRow}>
            <div className={styles.timeField}>
              <label className={styles.label}>Açılış Saati</label>
              <input
                type="time"
                name="start"
                value={settings.working_hours.start}
                onChange={handleHourChange}
                className={styles.timeInput}
              />
            </div>
            <span className={styles.timeSeparator}>—</span>
            <div className={styles.timeField}>
              <label className={styles.label}>Kapanış Saati</label>
              <input
                type="time"
                name="end"
                value={settings.working_hours.end}
                onChange={handleHourChange}
                className={styles.timeInput}
              />
            </div>
          </div>
        </section>

        {/* ── Slot Ayarları ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Slot Ayarları</h2>
          <p className={styles.sectionDesc}>
            Her slotun süresi ve varsayılan kapasitesi.
          </p>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <Input
                label="Slot Süresi (dakika)"
                name="slot_duration"
                value={String(settings.slot_duration)}
                onChange={handleNumberChange}
                hint="Her randevu slotunun uzunluğu"
              />
            </div>
            <div className={styles.fieldGroup}>
              <Input
                label="Varsayılan Kapasite"
                name="capacity_default"
                value={String(settings.capacity_default)}
                onChange={handleNumberChange}
                hint="Slot başına maksimum araç sayısı"
              />
            </div>
          </div>
        </section>

        {/* ── Rezervasyon Kuralları ── */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Rezervasyon Kuralları</h2>
          <p className={styles.sectionDesc}>
            İptal ve rezervasyon limitleri.
          </p>
          <div className={styles.fieldRow}>
            <div className={styles.fieldGroup}>
              <Input
                label="İptal Limiti (saat)"
                name="cancel_limit_hours"
                value={String(settings.cancel_limit_hours)}
                onChange={handleNumberChange}
                hint="Randevudan bu kadar saat öncesine kadar iptal edilebilir"
              />
            </div>
            <div className={styles.fieldGroup}>
              <Input
                label="Kullanıcı Başına Maks. Rezervasyon"
                name="max_booking_per_user"
                value={String(settings.max_booking_per_user)}
                onChange={handleNumberChange}
                hint="Aynı anda aktif olabilecek rezervasyon sayısı"
              />
            </div>
          </div>
        </section>

      </div>

      {/* ── Mesajlar & Kaydet ── */}
      {error && (
        <div className={styles.errorBanner}>
          <span>⚠</span> {error}
        </div>
      )}
      {successMsg && (
        <div className={styles.successBanner}>
          <span>✓</span> {successMsg}
        </div>
      )}

      <div className={styles.saveRow}>
        <Button variant="primary" size="lg" onClick={handleSave} loading={saving}>
          Ayarları Kaydet
        </Button>
      </div>
    </div>
  )
}