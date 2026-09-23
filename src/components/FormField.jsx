export default function FormField({ label, required, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      {children}
      {hint && <span className="text-xs text-[var(--text-faint)]">{hint}</span>}
    </label>
  )
}

export function inputClass(extra = '') {
  return `w-full rounded-lg border border-[var(--border-color)] bg-[var(--bg-input)] px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder-[var(--text-faint)] outline-none transition focus:border-blue-500/60 focus:ring-1 focus:ring-blue-500/40 ${extra}`
}

// One line of the Stock In / Stock Out sheet: numbered label on the left, input on the right
// (stacks on phones), matching the client's spec layout.
export function FormRow({ label, required, children, hint }) {
  return (
    <div className="grid grid-cols-1 gap-1.5 border-b border-[var(--border-color-soft)] py-2.5 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:items-center sm:gap-4">
      <span className="text-sm font-medium text-[var(--text-secondary)]">
        {label}
        {required && <span className="ml-1 text-red-400">*</span>}
      </span>
      <div>
        {children}
        {hint && <div className="mt-1 text-xs text-[var(--text-faint)]">{hint}</div>}
      </div>
    </div>
  )
}
