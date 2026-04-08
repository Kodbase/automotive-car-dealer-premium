'use client'

import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/services/client/api'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import styles from '@/styles/panel/Logs.module.css'

// ── Metadata → Türkçe mesaj ──────────────────────────────────────────────────
const LOG_MESSAGES = {
  booking_created: (m) =>
    `${m?.plate || '?'} plakalı araç için ${m?.packageName || 'bilinmeyen'} paketi rezerve edildi`,
  booking_cancelled: (m) =>
    `${m?.plate || '?'} plakalı araç rezervasyonu iptal edildi. Sebep: ${m?.reason || '—'}`,
  booking_rescheduled: (m) =>
    `${m?.plate || '?'} plakalı araç rezervasyonu yeni saate taşındı`,
  status_changed: (m) =>
    `Rezervasyon durumu ${m?.oldStatus || '?'} → ${m?.newStatus || '?'} olarak güncellendi`,
  admin_action: (m) =>
    m?.reason || 'Admin işlemi gerçekleştirildi',
  staff_action: (m) =>
    m?.reason || 'Staff işlemi gerçekleştirildi',
  slot_reassigned: (m) =>
    'Slot yeniden atandı',
}

function formatLogMessage(type, metadata) {
  const fn = LOG_MESSAGES[type]
  if (!fn) return type
  try {
    return fn(metadata || {})
  } catch {
    return type
  }
}

// ── Sabit listeler ───────────────────────────────────────────────────────────
const LOG_TYPE_LABELS = {
  booking_created:     'Rezervasyon Oluşturuldu',
  booking_cancelled:   'Rezervasyon İptal',
  booking_rescheduled: 'Rezervasyon Taşındı',
  status_changed:      'Durum Değişikliği',
  admin_action:        'Admin İşlemi',
  staff_action:        'Staff İşlemi',
  slot_reassigned:     'Slot Atandı',
}

const LOG_TYPE_COLORS = {
  booking_created:     'green',
  booking_cancelled:   'red',
  booking_rescheduled: 'blue',
  status_changed:      'orange',
  admin_action:        'purple',
  staff_action:        'purple',
  slot_reassigned:     'gray',
}

const PAGE_LIMIT = 20

export default function LogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filtreler
  const [filterType, setFilterType] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)

  // Detay modal
  const [detailLog, setDetailLog] = useState(null)

  const fetchLogs = useCallback(async (resetPage = false) => {
    setLoading(true)
    setError('')
    const currentPage = resetPage ? 1 : page
    if (resetPage) setPage(1)

    const params = new URLSearchParams({
      limit: PAGE_LIMIT,
      offset: (currentPage - 1) * PAGE_LIMIT,
    })
    if (filterType) params.set('type', filterType)
    if (filterSearch) params.set('search', filterSearch)

    try {
      const data = await apiRequest(`/api/admin/logs?${params}`)
      setLogs(data.logs || [])
      setHasMore((data.logs || []).length === PAGE_LIMIT)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filterType, filterSearch, page])

  useEffect(() => {
    fetchLogs()
  }, [page]) // eslint-disable-line

  // Filtre değişince sayfa sıfırla
  function applyFilters() {
    fetchLogs(true)
  }

  function clearFilters() {
    setFilterType('')
    setFilterSearch('')
    setPage(1)
    setTimeout(() => fetchLogs(true), 0)
  }

  function formatDate(iso) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString('tr-TR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Sistem Logları</h1>
          <p className={styles.subtitle}>Tüm işlem kayıtları</p>
        </div>
      </div>

      {/* ── Filtreler ── */}
      <div className={styles.filterBar}>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="">Tüm Türler</option>
          {Object.entries(LOG_TYPE_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
          placeholder="Actor ID veya Target ID ara..."
          className={styles.filterInput}
        />

        <Button variant="primary" size="sm" onClick={applyFilters}>
          Filtrele
        </Button>
        {(filterType || filterSearch) && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Temizle
          </Button>
        )}
      </div>

      {/* ── Hata ── */}
      {error && <div className={styles.errorBanner}>{error}</div>}

      {/* ── Tablo ── */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <p>Loglar yükleniyor...</p>
        </div>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Kayıt bulunamadı.</p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Tür</th>
                <th>Mesaj</th>
                <th>Tarih</th>
                <th>Detay</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>
                    <span className={`${styles.typeBadge} ${styles[`type_${LOG_TYPE_COLORS[log.type] || 'gray'}`]}`}>
                      {LOG_TYPE_LABELS[log.type] || log.type}
                    </span>
                  </td>
                  <td className={styles.messageCell}>
                    {formatLogMessage(log.type, log.metadata)}
                  </td>
                  <td className={styles.dateCell}>
                    {formatDate(log.created_at)}
                  </td>
                  <td>
                    <button
                      className={styles.detailBtn}
                      onClick={() => setDetailLog(log)}
                    >
                      Görüntüle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Sayfalama ── */}
      {!loading && logs.length > 0 && (
        <div className={styles.pagination}>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            ← Önceki
          </Button>
          <span className={styles.pageInfo}>Sayfa {page}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
          >
            Sonraki →
          </Button>
        </div>
      )}

      {/* ── Detay Modal ── */}
      <Modal
        isOpen={!!detailLog}
        onClose={() => setDetailLog(null)}
        title="Log Detayı"
        size="md"
        showClose
      >
        {detailLog && (
          <div className={styles.detailBody}>
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tür</span>
              <span className={`${styles.typeBadge} ${styles[`type_${LOG_TYPE_COLORS[detailLog.type] || 'gray'}`]}`}>
                {LOG_TYPE_LABELS[detailLog.type] || detailLog.type}
              </span>
            </div>

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Mesaj</span>
              <span className={styles.detailValue}>
                {formatLogMessage(detailLog.type, detailLog.metadata)}
              </span>
            </div>

            {detailLog.actor_id && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Actor ID</span>
                <code className={styles.detailCode}>{detailLog.actor_id}</code>
              </div>
            )}

            {detailLog.target_id && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Target ID</span>
                <code className={styles.detailCode}>{detailLog.target_id}</code>
              </div>
            )}

            {detailLog.reason && (
              <div className={styles.detailRow}>
                <span className={styles.detailLabel}>Sebep</span>
                <span className={styles.detailValue}>{detailLog.reason}</span>
              </div>
            )}

            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Tarih</span>
              <span className={styles.detailValue}>{formatDate(detailLog.created_at)}</span>
            </div>

            {detailLog.metadata && Object.keys(detailLog.metadata).length > 0 && (
              <div className={styles.detailMetadata}>
                <span className={styles.detailLabel}>Ham Metadata</span>
                <pre className={styles.metadataPre}>
                  {JSON.stringify(detailLog.metadata, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}