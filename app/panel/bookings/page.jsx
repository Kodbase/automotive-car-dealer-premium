'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPanelBookings } from '@/services/client/panel.service'
import { apiRequest } from '@/services/client/api'
import styles from '@/styles/panel/Bookings.module.css'

const STATUS_META = {
  WAITING:     { label: 'Bekliyor',    color: '#f59e0b', bg: '#fef3c7' },
  ACCEPTED:    { label: 'Onaylandı',   color: '#3b82f6', bg: '#dbeafe' },
  IN_PROGRESS: { label: 'İşlemde',     color: '#8b5cf6', bg: '#ede9fe' },
  DONE:        { label: 'Tamamlandı',  color: '#10b981', bg: '#d1fae5' },
  CANCELLED:   { label: 'İptal',       color: '#ef4444', bg: '#fee2e2' },
}

const NEXT_STATUSES = {
  WAITING:     ['IN_PROGRESS', 'CANCELLED'],
  ACCEPTED:    ['IN_PROGRESS', 'CANCELLED'],
  IN_PROGRESS: ['DONE', 'CANCELLED'],
  DONE:        [],
  CANCELLED:   [],
}

const CANCEL_REASONS = [
  'müşteri gelmedi',
  'araç sorunlu',
  'yanlış rezervasyon',
]

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, color: '#6b7280', bg: '#f3f4f6' }
  return (
    <span
      className={styles.badge}
      style={{ color: meta.color, background: meta.bg }}
    >
      {meta.label}
    </span>
  )
}

function CancelReasonModal({ onConfirm, onClose }) {
  const [reason, setReason] = useState(CANCEL_REASONS[0])
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modal}>
        <h3 className={styles.modalTitle}>İptal Sebebi</h3>
        <p className={styles.modalSub}>Lütfen iptal sebebini seçin</p>
        <div className={styles.reasonList}>
          {CANCEL_REASONS.map(r => (
            <label key={r} className={styles.reasonOption}>
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
              />
              <span>{r}</span>
            </label>
          ))}
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalCancelBtn} onClick={onClose}>
            Vazgeç
          </button>
          <button
            className={styles.modalConfirmBtn}
            onClick={() => onConfirm(reason)}
          >
            İptal Et
          </button>
        </div>
      </div>
    </div>
  )
}

export default function BookingsPage() {
  const [bookings, setBookings]       = useState([])
  const [pagination, setPagination]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')

  // Filtreler
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFilter, setDateFilter]     = useState('')
  const [search, setSearch]             = useState('')
  const [searchInput, setSearchInput]   = useState('')
  const [page, setPage]                 = useState(1)

  // Status güncelleme
  const [updatingId, setUpdatingId]     = useState(null)
  const [cancelTarget, setCancelTarget] = useState(null)

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getPanelBookings({
        page,
        limit: 20,
        status: statusFilter || undefined,
        date: dateFilter || undefined,
        search: search || undefined,
      })
      setBookings(data.bookings)
      setPagination(data.pagination)
    } catch {
      setError('Rezervasyonlar yüklenemedi')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, dateFilter, search])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Arama — 400ms debounce
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const handleStatusChange = async (bookingId, newStatus) => {
    if (newStatus === 'CANCELLED') {
      setCancelTarget(bookingId)
      return
    }
    await applyStatusChange(bookingId, newStatus, null)
  }

  const applyStatusChange = async (bookingId, newStatus, reason) => {
    setUpdatingId(bookingId)
    try {
      await apiRequest('/api/admin/status', {
        method: 'POST',
        body: { bookingId, status: newStatus, reason },
      })
      await fetchBookings()
    } catch {
      setError('Durum güncellenemedi')
    } finally {
      setUpdatingId(null)
      setCancelTarget(null)
    }
  }

  const handleFilterChange = (setter) => (e) => {
    setter(e.target.value)
    setPage(1)
  }

  return (
    <div className={styles.page}>

      {/* Başlık */}
      <div className={styles.header}>
        <h1 className={styles.title}>Rezervasyonlar</h1>
      </div>

      {/* Filtreler */}
      <div className={styles.filters}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder="Plaka ara..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <select
          className={styles.filterSelect}
          value={statusFilter}
          onChange={handleFilterChange(setStatusFilter)}
        >
          <option value="">Tüm Durumlar</option>
          {Object.entries(STATUS_META).map(([key, meta]) => (
            <option key={key} value={key}>{meta.label}</option>
          ))}
        </select>

        <input
          type="date"
          className={styles.filterSelect}
          value={dateFilter}
          onChange={handleFilterChange(setDateFilter)}
        />

        {(statusFilter || dateFilter || search) && (
          <button
            className={styles.clearBtn}
            onClick={() => {
              setStatusFilter('')
              setDateFilter('')
              setSearchInput('')
              setSearch('')
              setPage(1)
            }}
          >
            Temizle
          </button>
        )}
      </div>

      {/* Hata */}
      {error && <div className={styles.errorMsg}>{error}</div>}

      {/* Tablo */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
          </div>
        ) : bookings.length === 0 ? (
          <div className={styles.emptyMsg}>Rezervasyon bulunamadı</div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Plaka</th>
                <th>Müşteri</th>
                <th>Paket</th>
                <th>Lokasyon</th>
                <th>Tarih / Saat</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => {
                const nextStatuses = NEXT_STATUSES[booking.status] || []
                const isUpdating = updatingId === booking.id

                return (
                  <tr key={booking.id} className={isUpdating ? styles.rowUpdating : ''}>
                    <td>
                      <span className={styles.plate}>{booking.plate}</span>
                    </td>
                    <td>
                      <div className={styles.customerInfo}>
                        <span className={styles.customerName}>
                          {booking.user?.name || '—'}
                        </span>
                        <span className={styles.customerPhone}>
                          {booking.user?.phone || ''}
                        </span>
                      </div>
                    </td>
                    <td className={styles.packageName}>
                      {booking.package?.name || '—'}
                    </td>
                    <td className={styles.locationName}>
                      {booking.location?.name || '—'}
                    </td>
                    <td>
                      <div className={styles.dateInfo}>
                        <span className={styles.dateDay}>
                          {new Date(booking.slot_time).toLocaleDateString('tr-TR', {
                            day: '2-digit', month: '2-digit', year: 'numeric'
                          })}
                        </span>
                        <span className={styles.dateTime}>
                          {new Date(booking.slot_time).toLocaleTimeString('tr-TR', {
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </td>
                    <td>
                      <StatusBadge status={booking.status} />
                    </td>
                    <td>
                      {nextStatuses.length > 0 ? (
                        <div className={styles.actionBtns}>
                          {nextStatuses.map(ns => (
                            <button
                              key={ns}
                              className={`${styles.actionBtn} ${ns === 'CANCELLED' ? styles.actionBtnDanger : styles.actionBtnPrimary}`}
                              onClick={() => handleStatusChange(booking.id, ns)}
                              disabled={isUpdating}
                            >
                              {isUpdating ? '...' : STATUS_META[ns]?.label || ns}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className={styles.noAction}>—</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Önceki
          </button>
          <span className={styles.pageInfo}>
            {page} / {pagination.pages}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
          >
            Sonraki →
          </button>
        </div>
      )}

      {/* İptal modal */}
      {cancelTarget && (
        <CancelReasonModal
          onConfirm={(reason) => applyStatusChange(cancelTarget, 'CANCELLED', reason)}
          onClose={() => setCancelTarget(null)}
        />
      )}

    </div>
  )
}