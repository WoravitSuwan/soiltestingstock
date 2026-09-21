import { useNavigate } from 'react-router-dom'

export default function NavCard({ to, icon, title, subtitle, description }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="group flex w-full flex-col items-center gap-5 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-6 py-10 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:border-[var(--border-color-strong)] hover:bg-[var(--bg-card-hover)]"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[var(--bg-input)] shadow-inner ring-1 ring-[var(--border-color-soft)] transition group-hover:ring-[var(--border-color)]">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-[var(--text-primary)]">{title}</div>
        <div className="mt-1 text-sm font-medium text-[var(--text-muted)]">{subtitle}</div>
        <div className="mt-2 text-xs text-[var(--text-faint)]">{description}</div>
      </div>
    </button>
  )
}
