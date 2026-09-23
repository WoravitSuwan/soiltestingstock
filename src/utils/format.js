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

// One shared collator: far cheaper than localeCompare() when sorting ~10k product codes.
const thaiCollator = new Intl.Collator('th', { sensitivity: 'base' })

export function thaiCompare(a, b) {
  return thaiCollator.compare(String(a ?? ''), String(b ?? ''))
}

// qty × unit price as a form string, rounded to satang so 0.1 × 3 doesn't show 0.30000000000000004.
export function lineTotal(qty, price) {
  const total = (Number(qty) || 0) * (Number(price) || 0)
  return String(Math.round(total * 100) / 100)
}
