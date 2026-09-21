export function formatNumber(value, decimals = 0) {
  const n = Number(value) || 0
  return n.toLocaleString('th-TH', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

export function formatMoney(value) {
  return formatNumber(value, 2)
}

export function thaiCompare(a, b) {
  return String(a ?? '').localeCompare(String(b ?? ''), 'th', { sensitivity: 'base' })
}
