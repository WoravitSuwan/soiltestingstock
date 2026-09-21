import { useState } from 'react'
import { Settings, LogOut, UserCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SealLogo from './SealLogo'
import SettingsModal from './SettingsModal'
import { useAuthStore, useCurrentUser } from '../store/useAuthStore'

export default function TopBar() {
  const navigate = useNavigate()
  const currentUser = useCurrentUser()
  const logout = useAuthStore((s) => s.logout)
  const [settingsOpen, setSettingsOpen] = useState(false)

  function handleSignOut() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="relative">
      {/* faint gold accent line behind the header content */}
      <div
        className="pointer-events-none absolute left-24 right-0 top-10 h-px opacity-40"
        style={{
          background: 'linear-gradient(90deg, rgba(212,175,55,0.9) 0%, rgba(212,175,55,0.15) 70%, transparent 100%)',
        }}
      />

      <div className="relative flex items-center justify-between px-6 py-5 sm:px-10">
        <div className="flex items-center gap-4">
          <SealLogo size={52} />
          <div>
            <div className="text-2xl font-extrabold tracking-wide text-[var(--text-primary)]">
              STS
            </div>
            <div className="-mt-1 text-[11px] font-medium tracking-[0.2em] text-[var(--text-accent)]">
              SOIL TESTING SIAM
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2">
            <UserCircle2 size={30} className="text-[var(--text-secondary)]" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-[var(--text-primary)]">
                {currentUser?.username ?? '-'}
              </div>
              <div className="text-[11px] text-[var(--text-faint)]">
                {currentUser?.role === 'Admin' ? 'administrator' : 'user profile'}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-color)] bg-[var(--bg-surface-soft)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
            aria-label="ตั้งค่า"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-full border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  )
}
