'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import styles from '@/styles/panel/Users.module.css'

const ROLES = [
  { value: 'user', label: 'Kullanıcı' },
  { value: 'staff', label: 'Staff' },
  { value: 'admin', label: 'Admin' },
]

const ROLE_COLORS = {
  user: { bg: '#eff6ff', text: '#1d4ed8' },
  staff: { bg: '#fef3c7', text: '#b45309' },
  admin: { bg: '#fce7f3', text: '#be185d' },
}

const EMPTY_STAFF_FORM = { email: '', password: '', name: '', phone: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [currentUser, setCurrentUser] = useState(null)
  const LIMIT = 20

  // Role modal
  const [roleModal, setRoleModal] = useState(false)
  const [roleTarget, setRoleTarget] = useState(null)
  const [selectedRole, setSelectedRole] = useState('')
  const [roleSaving, setRoleSaving] = useState(false)

  // Staff create modal
  const [staffModal, setStaffModal] = useState(false)
  const [staffForm, setStaffForm] = useState(EMPTY_STAFF_FORM)
  const [staffSaving, setStaffSaving] = useState(false)
  const [staffError, setStaffError] = useState('')

  // Delete modal
  const [deleteModal, setDeleteModal] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState('')

  const fetchMe = async () => {
    try {
      const res = await fetch('/api/panel/me')
      const data = await res.json()
      setCurrentUser(data.user)
    } catch { /* silent */ }
  }

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page,
        limit: LIMIT,
        ...(search && { search }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
      })
      const res = await fetch(`/api/panel/users?${params}`)
      const data = await res.json()
      setUsers(data.users ?? [])
      setTotal(data.total ?? 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, search, roleFilter])

  useEffect(() => { fetchMe() }, [])
  useEffect(() => { fetchUsers() }, [fetchUsers])

  // Role güncelle
  const openRoleModal = (user) => {
    setRoleTarget(user)
    setSelectedRole(user.role)
    setError('')
    setRoleModal(true)
  }

  const handleRoleUpdate = async () => {
    if (!roleTarget || selectedRole === roleTarget.role) {
      setRoleModal(false)
      return
    }
    setRoleSaving(true)
    try {
      const res = await fetch('/api/panel/users/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: roleTarget.id, role: selectedRole })
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Hata'); return }
      setRoleModal(false)
      fetchUsers()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setRoleSaving(false)
    }
  }

  // Staff oluştur
  const openStaffModal = () => {
    setStaffForm(EMPTY_STAFF_FORM)
    setStaffError('')
    setStaffModal(true)
  }

  const handleStaffCreate = async () => {
    const { email, password, name } = staffForm
    if (!email || !password || !name) {
      setStaffError('Email, şifre ve isim zorunludur')
      return
    }
    if (password.length < 8) {
      setStaffError('Şifre en az 8 karakter olmalıdır')
      return
    }

    setStaffSaving(true)
    setStaffError('')
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(staffForm)
      })
      const data = await res.json()
      if (!res.ok) { setStaffError(data.error ?? 'Hata'); return }
      setStaffModal(false)
      fetchUsers()
    } catch {
      setStaffError('Bağlantı hatası')
    } finally {
      setStaffSaving(false)
    }
  }

  // Kullanıcı sil
  const openDeleteModal = (user) => {
    setDeleteTarget(user)
    setDeleteModal(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/staff?userId=${deleteTarget.id}`, {
        method: 'DELETE'
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Hata'); return }
      setDeleteModal(false)
      fetchUsers()
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setDeleting(false)
    }
  }

  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Kullanıcılar</h1>
          <p className={styles.subtitle}>{total} kullanıcı kayıtlı</p>
        </div>
        <Button variant="primary" size="md" onClick={openStaffModal}>
          + Yeni Staff Ekle
        </Button>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <Input
          name="search"
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1) }}
          placeholder="İsim veya email ara..."
          className={styles.searchInput}
        />
        <div className={styles.roleFilters}>
          {['all', 'user', 'staff', 'admin'].map(r => (
            <button
              key={r}
              className={`${styles.filterBtn} ${roleFilter === r ? styles.filterBtnActive : ''}`}
              onClick={() => { setRoleFilter(r); setPage(1) }}
            >
              {r === 'all' ? 'Tümü' : ROLES.find(x => x.value === r)?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Kullanıcı</th>
              <th>Telefon</th>
              <th>Rol</th>
              <th>Kayıt Tarihi</th>
              <th>İşlem</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <td key={j}>
                      <div className={styles.skeleton} style={{ width: j === 0 ? '180px' : '80px' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.empty}>
                  Kullanıcı bulunamadı
                </td>
              </tr>
            ) : (
              users.map(u => {
                const roleColor = ROLE_COLORS[u.role] ?? ROLE_COLORS.user
                const isSelf = currentUser?.id === u.id
                const isAdmin = u.role === 'admin'

                return (
                  <tr key={u.id} className={styles.row}>
                    <td>
                      <div className={styles.userCell}>
                        <div className={styles.avatar}>
                          {(u.name ?? u.email)[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={styles.userName}>{u.name ?? '—'}</p>
                          <p className={styles.userEmail}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className={styles.cellMuted}>{u.phone ?? '—'}</td>
                    <td>
                      <span
                        className={styles.roleBadge}
                        style={{ background: roleColor.bg, color: roleColor.text }}
                      >
                        {ROLES.find(r => r.value === u.role)?.label ?? u.role}
                      </span>
                    </td>
                    <td className={styles.cellMuted}>
                      {new Date(u.created_at).toLocaleDateString('tr-TR')}
                    </td>
                    <td>
                      <div className={styles.rowActions}>
                        <button
                          className={styles.actionBtn}
                          onClick={() => openRoleModal(u)}
                          disabled={isSelf}
                          title="Rol Değiştir"
                        >
                          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {!isSelf && !isAdmin && (
                          <button
                            className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                            onClick={() => openDeleteModal(u)}
                            title="Sil"
                          >
                            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(p - 1, 1))}
            disabled={page === 1}
          >
            ← Önceki
          </button>
          <span className={styles.pageInfo}>{page} / {totalPages}</span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(p + 1, totalPages))}
            disabled={page === totalPages}
          >
            Sonraki →
          </button>
        </div>
      )}

      {/* Role Modal */}
      <Modal
        isOpen={roleModal}
        onClose={() => setRoleModal(false)}
        title="Rol Değiştir"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text)' }}>{roleTarget?.name ?? roleTarget?.email}</strong> kullanıcısının rolünü değiştir.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setSelectedRole(r.value)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: `1.5px solid ${selectedRole === r.value ? 'var(--brand)' : 'var(--border)'}`,
                  background: selectedRole === r.value ? 'var(--brand-subtle)' : 'var(--bg)',
                  cursor: 'pointer', transition: 'all var(--transition)',
                  textAlign: 'left', width: '100%'
                }}
              >
                <span style={{
                  width: '1rem', height: '1rem',
                  borderRadius: '50%',
                  border: `2px solid ${selectedRole === r.value ? 'var(--brand)' : 'var(--border-dark)'}`,
                  background: selectedRole === r.value ? 'var(--brand)' : 'transparent',
                  flexShrink: 0, transition: 'all var(--transition)'
                }} />
                <span style={{ fontSize: '0.9375rem', fontWeight: 500, color: 'var(--text)' }}>
                  {r.label}
                </span>
              </button>
            ))}
          </div>

          {error && <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setRoleModal(false)}>İptal</Button>
            <Button variant="primary" size="md" loading={roleSaving} onClick={handleRoleUpdate}>
              Kaydet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Staff Create Modal */}
      <Modal
        isOpen={staffModal}
        onClose={() => setStaffModal(false)}
        title="Yeni Staff Ekle"
        size="md"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Input
            label="Ad Soyad"
            name="name"
            value={staffForm.name}
            onChange={e => setStaffForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Ahmet Yılmaz"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={staffForm.email}
            onChange={e => setStaffForm(f => ({ ...f, email: e.target.value }))}
            placeholder="ahmet@reviveautolab.com"
            required
          />
          <Input
            label="Şifre"
            name="password"
            type="password"
            value={staffForm.password}
            onChange={e => setStaffForm(f => ({ ...f, password: e.target.value }))}
            placeholder="En az 8 karakter"
            required
            hint="Staff bu şifreyle panel'e giriş yapacak"
          />
          <Input
            label="Telefon (opsiyonel)"
            name="phone"
            value={staffForm.phone}
            onChange={e => setStaffForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="05XX XXX XX XX"
          />

          {staffError && (
            <p style={{ color: '#ef4444', fontSize: '0.875rem' }}>{staffError}</p>
          )}

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setStaffModal(false)}>İptal</Button>
            <Button variant="primary" size="md" loading={staffSaving} onClick={handleStaffCreate}>
              Staff Oluştur
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Kullanıcıyı Sil"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <p style={{ fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
            <strong style={{ color: 'var(--text)' }}>{deleteTarget?.name ?? deleteTarget?.email}</strong> kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
          </p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setDeleteModal(false)}>İptal</Button>
            <Button variant="danger" size="md" loading={deleting} onClick={handleDelete}>
              Evet, Sil
            </Button>
          </div>
        </div>
      </Modal>

    </div>
  )
}