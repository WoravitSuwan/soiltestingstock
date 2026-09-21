import { useState } from 'react'
import { Moon, Sun, Users, Eye, EyeOff, Copy, Check, Plus, Trash2, ShieldCheck } from 'lucide-react'
import Modal from './Modal'
import { inputClass } from './FormField'
import { useThemeStore } from '../store/useThemeStore'
import { useAuthStore, useCurrentUser } from '../store/useAuthStore'

export default function SettingsModal({ open, onClose }) {
  const currentUser = useCurrentUser()
  const isAdmin = currentUser?.role === 'Admin'
  const [tab, setTab] = useState('theme')

  return (
    <Modal open={open} onClose={onClose} title="ตั้งค่า (Settings)" wide={isAdmin}>
      <div className="mb-5 flex gap-2 border-b border-[var(--border-color)]">
        <button
          onClick={() => setTab('theme')}
          className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
            tab === 'theme'
              ? 'border-blue-500 text-[var(--text-primary)]'
              : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sun size={15} /> ธีม
        </button>
        {isAdmin && (
          <button
            onClick={() => setTab('users')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
              tab === 'users'
                ? 'border-blue-500 text-[var(--text-primary)]'
                : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Users size={15} /> ผู้ใช้งาน
          </button>
        )}
      </div>

      {tab === 'theme' ? <ThemeTab /> : <UsersTab currentUser={currentUser} />}
    </Modal>
  )
}

function ThemeTab() {
  const theme = useThemeStore((s) => s.theme)
  const setTheme = useThemeStore((s) => s.setTheme)

  return (
    <div>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">เลือกโหมดการแสดงผลของระบบ</p>
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => setTheme('dark')}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition ${
            theme === 'dark'
              ? 'border-blue-500 bg-[var(--bg-hover)]'
              : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#0B0F19] ring-1 ring-white/10">
            <Moon size={22} className="text-blue-300" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Dark Mode</span>
          <span className="text-xs text-[var(--text-faint)]">โทนน้ำเงินเข้ม (ค่าเริ่มต้น)</span>
        </button>

        <button
          onClick={() => setTheme('light')}
          className={`flex flex-col items-center gap-3 rounded-xl border-2 p-6 transition ${
            theme === 'light'
              ? 'border-blue-500 bg-[var(--bg-hover)]'
              : 'border-[var(--border-color)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white ring-1 ring-black/10">
            <Sun size={22} className="text-amber-500" />
          </div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Light Mode</span>
          <span className="text-xs text-[var(--text-faint)]">โทนสว่าง คอนทราสต์สูง</span>
        </button>
      </div>
    </div>
  )
}

const emptyUserForm = { username: '', password: '', role: 'User' }

function UsersTab({ currentUser }) {
  const users = useAuthStore((s) => s.users)
  const addUser = useAuthStore((s) => s.addUser)
  const updateUser = useAuthStore((s) => s.updateUser)
  const deleteUser = useAuthStore((s) => s.deleteUser)

  const [revealed, setRevealed] = useState({})
  const [copiedId, setCopiedId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyUserForm)
  const [formError, setFormError] = useState('')

  const adminCount = users.filter((u) => u.role === 'Admin').length

  function toggleReveal(id) {
    setRevealed((r) => ({ ...r, [id]: !r[id] }))
  }

  async function handleCopy(id, password) {
    try {
      await navigator.clipboard.writeText(password)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    } catch {
      // clipboard unavailable — silently ignore
    }
  }

  function handleAddUser(e) {
    e.preventDefault()
    setFormError('')
    const uname = form.username.trim()
    if (!uname || !form.password) {
      setFormError('กรุณากรอกข้อมูลให้ครบถ้วน')
      return
    }
    if (users.some((u) => u.username.toLowerCase() === uname.toLowerCase())) {
      setFormError('ชื่อผู้ใช้งานนี้ถูกใช้งานแล้ว')
      return
    }
    addUser({ username: uname, password: form.password, role: form.role })
    setForm(emptyUserForm)
    setShowForm(false)
  }

  function handleRoleChange(user, role) {
    if (user.role === 'Admin' && role !== 'Admin' && adminCount <= 1) {
      alert('ไม่สามารถเปลี่ยนสิทธิ์ได้ ระบบต้องมีผู้ดูแลระบบ (Admin) อย่างน้อย 1 คน')
      return
    }
    updateUser(user.id, { role })
  }

  function handleDelete(user) {
    if (user.id === currentUser?.id) {
      alert('ไม่สามารถลบบัญชีของตนเองได้')
      return
    }
    if (user.role === 'Admin' && adminCount <= 1) {
      alert('ไม่สามารถลบได้ ระบบต้องมีผู้ดูแลระบบ (Admin) อย่างน้อย 1 คน')
      return
    }
    if (confirm(`ลบผู้ใช้งาน "${user.username}" ใช่หรือไม่?`)) deleteUser(user.id)
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-[var(--text-secondary)]">
          จัดการบัญชีผู้ใช้งานทั้งหมดในระบบ ({users.length} บัญชี)
        </p>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-500"
        >
          <Plus size={14} /> เพิ่มผู้ใช้งาน
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleAddUser}
          className="mb-4 grid grid-cols-1 gap-3 rounded-lg border border-[var(--border-color)] bg-[var(--bg-hover)] p-4 sm:grid-cols-4"
        >
          <input
            value={form.username}
            onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            placeholder="ชื่อผู้ใช้งาน"
            className={inputClass()}
          />
          <input
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            placeholder="รหัสผ่าน"
            className={inputClass()}
          />
          <select
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
            className={inputClass()}
          >
            <option value="User">User</option>
            <option value="Admin">Admin</option>
          </select>
          <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-500">
            บันทึก
          </button>
          {formError && <p className="col-span-full text-xs text-red-400">{formError}</p>}
        </form>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full min-w-[680px] text-sm">
          <thead>
            <tr className="bg-[var(--bg-card-alt)] text-left text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">ชื่อผู้ใช้งาน</th>
              <th className="px-4 py-3 font-medium">สิทธิ์</th>
              <th className="px-4 py-3 font-medium">วันที่สร้าง</th>
              <th className="px-4 py-3 font-medium">รหัสผ่าน</th>
              <th className="px-4 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    {u.username}
                    {u.id === currentUser?.id && (
                      <span className="rounded-full bg-blue-500/15 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">คุณ</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => handleRoleChange(u, e.target.value)}
                    className="rounded-md border border-[var(--border-color)] bg-[var(--bg-input)] px-2 py-1 text-xs text-[var(--text-primary)]"
                  >
                    <option value="User">User</option>
                    <option value="Admin">Admin</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">
                  {new Date(u.createdAt).toLocaleDateString('th-TH')}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 font-mono text-xs">
                    <span className="min-w-[100px]">{revealed[u.id] ? u.password : '••••••••'}</span>
                    <button
                      onClick={() => toggleReveal(u.id)}
                      className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)]"
                    >
                      {revealed[u.id] ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button
                      onClick={() => handleCopy(u.id, u.password)}
                      className="rounded-md p-1 text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)]"
                    >
                      {copiedId === u.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    {u.role === 'Admin' && <ShieldCheck size={15} className="text-emerald-400" />}
                    <button
                      onClick={() => handleDelete(u)}
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
