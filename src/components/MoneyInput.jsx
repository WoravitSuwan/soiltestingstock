import { useRef } from 'react'
import { inputClass } from './FormField'

// Adds thousand separators while typing (1000 -> 1,000) but reports a clean, comma-free
// numeric string via onChange so callers can keep using Number(value) as before.
function formatDisplay(raw) {
  if (raw === '' || raw === undefined || raw === null) return ''
  const [intPart, decPart] = String(raw).split('.')
  const negative = intPart.startsWith('-')
  const digits = negative ? intPart.slice(1) : intPart
  const withCommas = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  const withSign = negative ? `-${withCommas}` : withCommas
  return decPart !== undefined ? `${withSign}.${decPart}` : withSign
}

export default function MoneyInput({ value, onChange, className = '', placeholder, disabled, ...props }) {
  const ref = useRef(null)

  function handleChange(e) {
    const input = e.target
    const raw = input.value.replace(/,/g, '')
    if (raw !== '' && raw !== '-' && !/^-?\d*\.?\d*$/.test(raw)) return

    const digitsBeforeCursor = input.value.slice(0, input.selectionStart).replace(/[^0-9]/g, '').length
    onChange(raw)

    requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return
      const formatted = el.value
      let count = 0
      let pos = formatted.length
      for (let i = 0; i < formatted.length; i++) {
        if (/[0-9]/.test(formatted[i])) count++
        if (count === digitsBeforeCursor) {
          pos = i + 1
          break
        }
      }
      el.setSelectionRange(pos, pos)
    })
  }

  return (
    <input
      ref={ref}
      type="text"
      inputMode="decimal"
      value={formatDisplay(value)}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={inputClass(className)}
      {...props}
    />
  )
}
