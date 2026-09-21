import { useNavigate } from 'react-router-dom'

export default function NavCard({ to, icon, title, subtitle, description, glow }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      style={{
        backgroundImage: glow
          ? `radial-gradient(circle at 50% 0%, ${glow}, transparent 65%)`
          : undefined,
      }}
      className="group flex w-full flex-col items-center gap-4 rounded-2xl border border-[var(--border-color)] bg-[var(--bg-card)] px-5 py-8 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:border-[var(--border-color-strong)] sm:gap-5 sm:px-6 sm:py-10"
    >
      <div className="flex h-28 items-center justify-center transition duration-200 group-hover:scale-105 sm:h-32 lg:h-40">
        {icon}
      </div>
      <div>
        <div className="text-lg font-bold text-[var(--text-primary)] sm:text-xl">{title}</div>
        <div className="mt-1 text-sm font-medium text-[var(--text-muted)]">{subtitle}</div>
        <div className="mt-2 text-xs text-[var(--text-faint)]">{description}</div>
      </div>
    </button>
  )
}
