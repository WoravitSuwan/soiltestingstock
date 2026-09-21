import { useState } from 'react'
import { isValidDDMMYYYY } from '../utils/date'
import { inputClass } from './FormField'

// Plain text input for DD/MM/YYYY dates. Deliberately NOT a native <input type="date">
// per spec: no calendar dropdown picker.
export default function DateTextInput({ value, onChange, placeholder = 'DD/MM/YYYY', ...props }) {
  const [touched, setTouched] = useState(false)
  const invalid = touched && value && !isValidDDMMYYYY(value)

  return (
    <div>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        className={inputClass(invalid ? 'border-red-500/60' : '')}
        {...props}
      />
      {invalid && <p className="mt-1 text-xs text-red-400">รูปแบบวันที่ไม่ถูกต้อง (DD/MM/YYYY)</p>}
    </div>
  )
}
