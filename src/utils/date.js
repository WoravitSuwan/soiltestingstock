// Date helpers for the DD/MM/YYYY text-input format used throughout the app.

const DATE_RE = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/

export function isValidDDMMYYYY(value) {
  if (!value) return false
  const m = DATE_RE.exec(value.trim())
  if (!m) return false
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12) return false
  const daysInMonth = new Date(year, month, 0).getDate()
  if (day < 1 || day > daysInMonth) return false
  return true
}

// Returns a sortable/comparable value (YYYYMMDD as number) or null if invalid.
export function ddmmyyyyToSortable(value) {
  if (!isValidDDMMYYYY(value)) return null
  const m = DATE_RE.exec(value.trim())
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  return year * 10000 + month * 100 + day
}

export function ddmmyyyyToDate(value) {
  if (!isValidDDMMYYYY(value)) return null
  const m = DATE_RE.exec(value.trim())
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]))
}

export function todayDDMMYYYY() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

// ---------- Buddhist Era (พ.ศ.) display ----------
// Dates are stored as DD/MM/YYYY in the Christian Era (ค.ศ.) so sorting and range
// filtering keep working. Everything shown to the user is converted to พ.ศ. (+543).
const BE_OFFSET = 543
// A typed year at or above this is assumed to already be พ.ศ.
const BE_THRESHOLD = 2400

function pad2(n) {
  return String(n).padStart(2, '0')
}

// Stored (ค.ศ.) date -> display (พ.ศ.) date. Non-dates are returned untouched.
export function toThaiDate(value) {
  if (!isValidDDMMYYYY(value)) return value ?? ''
  const m = DATE_RE.exec(value.trim())
  return `${pad2(m[1])}/${pad2(m[2])}/${Number(m[3]) + BE_OFFSET}`
}

// Typed date (พ.ศ., or ค.ศ. when the year is below 2400) -> stored (ค.ศ.) date.
// Returns null when the text isn't a complete valid date.
export function fromThaiDate(value) {
  const m = DATE_RE.exec(String(value ?? '').trim())
  if (!m) return null
  const year = Number(m[3])
  const ce = `${pad2(m[1])}/${pad2(m[2])}/${year >= BE_THRESHOLD ? year - BE_OFFSET : year}`
  return isValidDDMMYYYY(ce) ? ce : null
}
