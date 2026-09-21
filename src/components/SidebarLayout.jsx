import { useState } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

export default function SidebarLayout({ title, children }) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3 border-b border-[var(--border-color)] px-4 py-4 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
            aria-label="เปิดเมนู"
          >
            <Menu size={18} />
          </button>
          <span className="truncate text-sm font-semibold text-[var(--text-primary)]">{title}</span>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
          <h1 className="mb-6 hidden text-2xl font-bold text-[var(--text-primary)] md:block">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
