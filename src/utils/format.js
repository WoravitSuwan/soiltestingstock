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
