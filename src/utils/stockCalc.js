import { ddmmyyyyToSortable } from './date'

const EMPTY = []

// A movement belongs to a product by its productId when present (the reliable link,
// set on every row created after product ids were introduced); legacy rows created
// before that only carry productCode, which is matched as a fallback. Once duplicate
// codes are merged/renamed via the Duplicate Code tool, code-matching is unambiguous too.
function movementKey(t) {
  return t.productId ? `id:${t.productId}` : `code:${t.productCode}`
}
function productKeys(product) {
  return [`id:${product.id}`, `code:${product.code}`]
}

// Groups transactions by product (id when linked, code otherwise) so per-product sums
// don't rescan every transaction (matters with ~10k products).
export function groupByProduct(transactions) {
  const map = new Map()
  transactions.forEach((t) => {
    const key = movementKey(t)
    const list = map.get(key)
    if (list) list.push(t)
    else map.set(key, [t])
  })
  return map
}

// Looks up a product's movements in a groupByProduct() map. A row is filed under either
// "id:<id>" or "code:<code>" (never both), so this never double-counts.
export function movementsForProduct(map, product) {
  const [byId, byCode] = productKeys(product)
  const a = map.get(byId)
  const b = map.get(byCode)
  if (!a) return b ?? EMPTY
  if (!b) return a
  return [...a, ...b]
}

// Filters a flat list down to one product's movements (for a single lookup where
// building a groupByProduct map first isn't worth it).
export function filterForProduct(list, product) {
  return list.filter((t) => (t.productId ? t.productId === product.id : t.productCode === product.code))
}

function inRange(dateStr, fromSortable, toSortable) {
  const s = ddmmyyyyToSortable(dateStr)
  if (s === null) return false
  if (fromSortable != null && s < fromSortable) return false
  if (toSortable != null && s > toSortable) return false
  return true
}

// Sums a list of movements already filtered to one product (optionally within a date
// range). Used for both Stock In and Stock Out rows — same shape, same math.
export function sumMovements(rows, { fromSortable, toSortable } = {}) {
  return rows.filter((t) => inRange(t.date, fromSortable, toSortable)).reduce(
    (acc, t) => {
      acc.qty += Number(t.qty) || 0
      acc.value += Number(t.total) || 0
      return acc
    },
    { qty: 0, value: 0 },
  )
}

// Current on-hand balance for a product: all stock-in minus all stock-out.
// Stock comes only from Stock In / Stock Out rows. The product list's จำนวน is the
// quantity its unit price refers to (always 1 unit), not stock on hand.
export function currentBalance(product, stockIns, stockOuts) {
  const inSum = sumMovements(filterForProduct(stockIns, product))
  const outSum = sumMovements(filterForProduct(stockOuts, product))
  return { qty: inSum.qty - outSum.qty, value: inSum.value - outSum.value }
}

// Builds the chronological ledger for a single product (Report 1). `stockIns`/`stockOuts`
// must already be filtered to this one product (via filterForProduct or
// movementsForProduct) — this function does not match by code/id itself.
//
// "ยอดยกมา" (opening) is made of two things, both excluded from the itemized rows:
//   - every movement tagged movementType: 'opening_balance' (imported ยอดยกมา rows),
//     regardless of its own date — it's a carried-forward balance, not a dated movement
//   - ordinary ('in' / 'out') movements dated before `fromSortable`, rolled up the same
//     way a paper ledger folds prior pages into a starting balance
// Only ordinary movements inside [fromSortable, toSortable] appear as line items and
// count toward "ซื้อ"/"ออก" for the period.
export function buildItemLedger(product, stockIns, stockOuts, { fromSortable, toSortable } = {}) {
  const rows = []
  const opening = { qty: 0, value: 0 }

  function consume(list, kind) {
    list.forEach((t) => {
      const qty = Number(t.qty) || 0
      const value = Number(t.total) || 0
      const sign = kind === 'in' ? 1 : -1
      if (t.movementType === 'opening_balance') {
        opening.qty += sign * qty
        opening.value += sign * value
        return
      }
      const sortable = ddmmyyyyToSortable(t.date) ?? 0
      if (fromSortable != null && sortable < fromSortable) {
        opening.qty += sign * qty
        opening.value += sign * value
        return
      }
      if (toSortable != null && sortable > toSortable) return
      rows.push({
        kind,
        date: t.date,
        sortable,
        docNo: kind === 'in' ? t.po || '-' : t.invoice || t.so || '-',
        qty,
        price: Number(t.price) || 0,
        value,
        party: kind === 'in' ? t.supplier || '-' : t.customer || '-',
        note: t.note || '',
        isReservation: kind === 'out' && !!t.so && !t.invoice,
      })
    })
  }
  consume(stockIns, 'in')
  consume(stockOuts, 'out')

  rows.sort((a, b) => a.sortable - b.sortable)

  let balQty = opening.qty
  let balValue = opening.value
  const ledger = rows.map((r) => {
    if (r.kind === 'in') {
      balQty += r.qty
      balValue += r.value
    } else {
      balQty -= r.qty
      balValue -= r.value
    }
    return {
      ...r,
      balanceQty: balQty,
      balanceValue: balValue,
      balancePrice: balQty !== 0 ? balValue / balQty : 0,
    }
  })

  const totalIn = rows
    .filter((r) => r.kind === 'in')
    .reduce((acc, r) => ({ qty: acc.qty + r.qty, value: acc.value + r.value }), { qty: 0, value: 0 })
  const totalOut = rows
    .filter((r) => r.kind === 'out')
    .reduce((acc, r) => ({ qty: acc.qty + r.qty, value: acc.value + r.value }), { qty: 0, value: 0 })

  return {
    opening,
    rows: ledger,
    closing: { qty: balQty, value: balValue },
    totalIn,
    totalOut,
  }
}

// Builds the "all stock summary" report rows (Report 2) for a date range. Reuses
// buildItemLedger per product so both reports agree on what counts as ยอดยกมา/ซื้อ/ออก.
export function buildAllStockSummary(products, allStockIns, allStockOuts, fromSortable, toSortable) {
  const insMap = groupByProduct(allStockIns)
  const outsMap = groupByProduct(allStockOuts)
  return products.map((p) => {
    const ins = movementsForProduct(insMap, p)
    const outs = movementsForProduct(outsMap, p)
    const ledger = buildItemLedger(p, ins, outs, { fromSortable, toSortable })
    return {
      id: p.id,
      code: p.code,
      name: p.name,
      unit: p.unit,
      opening: ledger.opening,
      in: ledger.totalIn,
      out: ledger.totalOut,
      closing: ledger.closing,
    }
  })
}
