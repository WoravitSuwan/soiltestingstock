import { useNavigate } from 'react-router-dom'

export default function NavCard({ to, icon, title, subtitle, description }) {
  const navigate = useNavigate()
  return (
    <button
      onClick={() => navigate(to)}
      className="group flex w-full flex-col items-center gap-5 rounded-2xl border border-white/10 bg-[#121828] px-6 py-10 text-center shadow-card transition duration-200 hover:-translate-y-1 hover:border-white/20 hover:bg-[#161d31]"
    >
      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#0d1220] shadow-inner ring-1 ring-white/5 transition group-hover:ring-white/10">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white">{title}</div>
        <div className="mt-1 text-sm font-medium text-white/50">{subtitle}</div>
        <div className="mt-2 text-xs text-white/35">{description}</div>
      </div>
    </button>
  )
}
