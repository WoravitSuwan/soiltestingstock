export default function FormField({ label, required, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-white/70">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-white/30">{hint}</span>}
    </label>
  )
}

export function inputClass(extra = '') {
  return `w-full rounded-lg border border-white/10 bg-[#0d1220] px-3.5 py-2.5 text-sm text-white placeholder-white/25 outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 ${extra}`
}
