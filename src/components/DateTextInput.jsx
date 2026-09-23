import { useEffect, useState } from 'react'
import { fromThaiDate, toThaiDate } from '../utils/date'
import { inputClass } from './FormField'

// Plain text input for DD/MM/YYYY dates. Deliberately NOT a native <input type="date">
// per spec: no calendar dropdown picker.
// The user sees and types the year in พ.ศ.; `value`/`onChange` stay in ค.ศ. (storage format).
export default function DateTextInput({ value, onChange, placeholder = 'วว/ดด/ปปปป (พ.ศ.)', ...props }) {
  const [text, setText] = useState(() => toThaiDate(value))
  const [touched, setTouched] = useState(false)

  // Follow external changes (form reset, loading a row to edit) without clobbering typing.
  useEffect(() => {
    if (fromThaiDate(text) !== value && text !== value) setText(toThaiDate(value))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  function handleChange(raw) {
    setText(raw)
    onChange(fromThaiDate(raw) ?? raw)
  }

  const invalid = touched && text && !fromThaiDate(text)

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={text}
        placeholder={placeholder}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={inputClass(invalid ? 'border-red-500/60' : '')}
        {...props}
      />
      {invalid && <p className="mt-1 text-xs text-red-400">รูปแบบวันที่ไม่ถูกต้อง (วว/ดด/ปปปป เป็น พ.ศ.)</p>}
    </div>
  )
}
