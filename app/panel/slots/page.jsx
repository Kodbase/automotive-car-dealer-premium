'use client'

import { useEffect, useState, useCallback } from 'react'
import { getSlots } from '@/services/client/panel.service'
import styles from '@/styles/panel/Slots.module.css'

function todayString() {
  return new Date().toISOString().split('T')[0]
}

function SlotCard({ slot }) {
  const time  = new Date(slot.slot_time)
  const isFull    = slot.reserved_count >= slot.capacity
  const isDynamic = slot.is_dynamic

  return (
    <div className={`
      ${styles.slotCard}
      ${isFull ? styles.slotFull : ''}
      ${isDynamic ? styles.slotDynamic : ''}
    `}>
      <div className={styles.slotTime}>
        {time.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className={styles.slotCapRow}>
        <div className={styles.slotBar}>
          <div
            className={styles.slotBarFill}
            style={{
              width: `${Math.min(100, (slot.reserved_count / slot.capacity) * 100)}%`,
              background: isFull ? '#ef4444' : 'var(--brand)',
            }}
          />
        </div>
        <span className={styles.slotCount}>
          {slot.reserved_count}/{slot.capacity}
        </span>
      </div>
      {isDynamic && (
        <span className={styles.dynamicTag}>Otomatik</span>
      )}
    </div>
  )
}

export default function SlotsPage() {
  const [date, setDate]   = useState(todayString())
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getSlots(date)
      setSlots(data.slots || [])
    } catch {
      setError('Slotlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  const totalSlots  = slots.length
  const fullSlots   = slots.filter(s => s.reserved_count >= s.capacity).length
  const activeSlots = slots.filter(s => s.reserved_count > 0).length

  return (
    <div className={styles.page}>

      {/* Başlık */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Slot Yönetimi</h1>
          <p className={styles.subtitle}>
            Slotlar çalışma saatlerine göre otomatik oluşturulur.
            Çalışma saatlerini <a href="/panel/settings" className={styles.settingsLink}>Ayarlar</a> sayfasından değiştirebilirsiniz.
          </p>
        </div>
      </div>

      {/* Tarih seçici */}
      <div className={styles.datePicker}>
        <button
          className={styles.dateNavBtn}
          onClick={() => {
            const d = new Date(date)
            d.setDate(d.getDate() - 1)
            setDate(d.toISOString().split('T')[0])
          }}
        >←</button>
        <input
          type="date"
          className={styles.dateInput}
          value={date}
          onChange={e => setDate(e.target.value)}
        />
        <button
          className={styles.dateNavBtn}
          onClick={() => {
            const d = new Date(date)
            d.setDate(d.getDate() + 1)
            setDate(d.toISOString().split('T')[0])
          }}
        >→</button>
      </div>

      {/* İstatistikler */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{totalSlots}</span>
          <span className={styles.statLabel}>Toplam Slot</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum}>{activeSlots}</span>
          <span className={styles.statLabel}>Rezerveli</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: fullSlots > 0 ? '#ef4444' : 'inherit' }}>
            {fullSlots}
          </span>
          <span className={styles.statLabel}>Dolu</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statNum} style={{ color: '#10b981' }}>
            {totalSlots - fullSlots}
          </span>
          <span className={styles.statLabel}>Müsait</span>
        </div>
      </div>

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: 'var(--brand)' }} />
          Otomatik slot
        </span>
        <span className={styles.legendItem}>
          <span className={styles.legendDot} style={{ background: '#ef4444' }} />
          Dolu
        </span>
      </div>

      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Slot ızgarası */}
      {loading ? (
        <div className={styles.loadingWrap}>
          <div className={styles.spinner} />
        </div>
      ) : slots.length === 0 ? (
        <div className={styles.emptyMsg}>
          Bu gün çalışma günü değil veya henüz slot oluşturulmadı.
        </div>
      ) : (
        <div className={styles.slotsGrid}>
          {slots.map(slot => (
            <SlotCard key={slot.id} slot={slot} />
          ))}
        </div>
      )}

    </div>
  )
}