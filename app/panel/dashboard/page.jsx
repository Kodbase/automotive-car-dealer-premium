'use client'

import { useEffect, useState } from 'react'
import { getDashboardStats } from '@/services/client/panel.service'
import styles from '@/styles/panel/Dashboard.module.css'

const STATUS_META = {
  WAITING:     { label: 'Bekliyor',   color: '#f59e0b' },
  ACCEPTED:    { label: 'Onaylandı',  color: '#3b82f6' },
  IN_PROGRESS: { label: 'İşlemde',    color: '#8b5cf6' },
  DONE:        { label: 'Tamamlandı', color: '#10b981' },
  CANCELLED:   { label: 'İptal',      color: '#ef4444' },
}

const LOG_TYPE_META = {
  booking_created:   { label: 'Rezervasyon oluşturuldu', color: '#10b981' },
  booking_cancelled: { label: 'Rezervasyon iptal edildi', color: '#ef4444' },
  status_changed:    { label: 'Durum değiştirildi',       color: '#3b82f6' },
  admin_action:      { label: 'Admin işlemi',             color: '#f59e0b' },
  staff_action:      { label: 'Staff işlemi',             color: '#8b5cf6' },
  slot_reassigned:   { label: 'Slot yeniden atandı',      color: '#6b7280' },
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statAccent} style={{ background: accent }} />
      <div className={styles.statBody}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
        {sub && <span className={styles.statSub}>{sub}</span>}
      </div>
    </div>
  )
}

function OccupancyBar({ rate }) {
  return (
    <div className={styles.occupancyBar}>
      <div
        className={styles.occupancyFill}
        style={{ width: `${rate}%` }}
      />
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getDashboardStats()
      .then(data => {
        setStats(data)
        setLoading(false)
      })
      .catch(() => {
        setError('Veriler yüklenemedi')
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className={styles.loadingWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  if (error) {
    return <div className={styles.errorMsg}>{error}</div>
  }

  const { today, occupancy, week, recentLogs } = stats

  return (
    <div className={styles.page}>

      {/* Başlık */}
      <div className={styles.header}>
        <h1 className={styles.title}>Dashboard</h1>
        <span className={styles.date}>
          {new Date().toLocaleDateString('tr-TR', {
            weekday: 'long', day: 'numeric', month: 'long'
          })}
        </span>
      </div>

      {/* Stat kartları */}
      <div className={styles.statsGrid}>
        <StatCard
          label="Bugünkü Rezervasyon"
          value={today.total}
          sub="toplam"
          accent="var(--brand)"
        />
        <StatCard
          label="Doluluk Oranı"
          value={`%${occupancy.rate}`}
          sub={`${occupancy.reserved} / ${occupancy.capacity} slot`}
          accent="#3b82f6"
        />
        <StatCard
          label="Bu Hafta Toplam"
          value={week.total}
          sub="rezervasyon"
          accent="#10b981"
        />
        <StatCard
          label="Bu Hafta Gelir"
          value={`₺${week.revenue.toLocaleString('tr-TR')}`}
          sub="tamamlanan işlemler"
          accent="#8b5cf6"
        />
      </div>

      {/* Alt grid */}
      <div className={styles.bottomGrid}>

        {/* Bugünkü durum dağılımı */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Bugün Durum Dağılımı</h2>
          <div className={styles.statusList}>
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const count = today.statusCounts[key] || 0
              const total = today.total || 1
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key} className={styles.statusRow}>
                  <div className={styles.statusLeft}>
                    <span
                      className={styles.statusDot}
                      style={{ background: meta.color }}
                    />
                    <span className={styles.statusLabel}>{meta.label}</span>
                  </div>
                  <div className={styles.statusRight}>
                    <div className={styles.statusBarWrap}>
                      <div
                        className={styles.statusBarFill}
                        style={{
                          width: `${pct}%`,
                          background: meta.color
                        }}
                      />
                    </div>
                    <span className={styles.statusCount}>{count}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Slot doluluk */}
        <div className={styles.card}>
          <h2 className={styles.cardTitle}>Bugün Slot Doluluk</h2>
          <div className={styles.occupancyWrap}>
            <div className={styles.occupancyCircle}>
              <svg viewBox="0 0 80 80" className={styles.occupancySvg}>
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="var(--border)"
                  strokeWidth="8"
                />
                <circle
                  cx="40" cy="40" r="32"
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${occupancy.rate * 2.01} 201`}
                  strokeDashoffset="50"
                  transform="rotate(-90 40 40)"
                />
              </svg>
              <div className={styles.occupancyInner}>
                <span className={styles.occupancyPct}>%{occupancy.rate}</span>
                <span className={styles.occupancyLbl}>dolu</span>
              </div>
            </div>
            <div className={styles.occupancyStats}>
              <div className={styles.occStatRow}>
                <span className={styles.occStatLabel}>Rezerve</span>
                <span className={styles.occStatValue}>{occupancy.reserved}</span>
              </div>
              <div className={styles.occStatRow}>
                <span className={styles.occStatLabel}>Kapasite</span>
                <span className={styles.occStatValue}>{occupancy.capacity}</span>
              </div>
              <div className={styles.occStatRow}>
                <span className={styles.occStatLabel}>Boş</span>
                <span className={styles.occStatValue}>
                  {occupancy.capacity - occupancy.reserved}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Son loglar */}
        <div className={`${styles.card} ${styles.cardWide}`}>
          <h2 className={styles.cardTitle}>Son İşlemler</h2>
          {recentLogs.length === 0 ? (
            <p className={styles.emptyMsg}>Henüz log kaydı yok</p>
          ) : (
            <div className={styles.logList}>
              {recentLogs.map(log => {
                const meta = LOG_TYPE_META[log.type] || { label: log.type, color: '#6b7280' }
                return (
                  <div key={log.id} className={styles.logRow}>
                    <span
                      className={styles.logDot}
                      style={{ background: meta.color }}
                    />
                    <div className={styles.logInfo}>
                      <span className={styles.logType}>{meta.label}</span>
                      {log.reason && (
                        <span className={styles.logReason}>{log.reason}</span>
                      )}
                    </div>
                    <div className={styles.logMeta}>
                      {log.users?.name && (
                        <span className={styles.logActor}>{log.users.name}</span>
                      )}
                      <span className={styles.logTime}>
                        {new Date(log.created_at).toLocaleString('tr-TR', {
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}