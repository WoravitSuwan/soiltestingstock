import { Settings, LogOut, UserCircle2, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SealLogo from './SealLogo'

export default function TopBar({ showBack = false, pageTitle }) {
  const navigate = useNavigate()

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
          {showBack && (
            <button
              onClick={() => navigate('/')}
              className="mr-1 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
              aria-label="กลับหน้าหลัก"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <SealLogo size={52} />
          <div>
            <div className="text-2xl font-extrabold tracking-wide text-white">
              STS
            </div>
            <div className="-mt-1 text-[11px] font-medium tracking-[0.2em] text-blue-300/70">
              {pageTitle ? pageTitle.toUpperCase() : 'SOIL TESTING SIAM'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2">
            <UserCircle2 size={30} className="text-white/70" />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">Jansogood1436</div>
              <div className="text-[11px] text-white/40">user profile</div>
            </div>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10"
            aria-label="ตั้งค่า"
          >
            <Settings size={18} />
          </button>
          <button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  )
}
