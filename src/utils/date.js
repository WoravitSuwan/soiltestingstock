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
