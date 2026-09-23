import { ddmmyyyyToSortable } from './date'

// Groups transactions by product code so per-product sums don't rescan every transaction
// (matters with ~10k products).
export function groupByCode(transactions) {
  const map = new Map()
  transactions.forEach((t) => {
    const list = map.get(t.productCode)
    if (list) list.push(t)
    else map.set(t.productCode, [t])
  })
  return map
}

const EMPTY = []

// Sum stock-in quantity/value for a given product code (optionally within a date range).
export function sumStockIn(stockIns, code, { fromSortable, toSortable } = {}) {
  return stockIns
    .filter((t) => t.productCode === code)
    .filter((t) => inRange(t.date, fromSortable, toSortable))
    .reduce(
      (acc, t) => {
        acc.qty += Number(t.qty) || 0
        acc.value += Number(t.total) || 0
        return acc
      },
      { qty: 0, value: 0 },
    )
}

export function sumStockOut(stockOuts, code, { fromSortable, toSortable } = {}) {
  return stockOuts
    .filter((t) => t.productCode === code)
    .filter((t) => inRange(t.date, fromSortable, toSortable))
    .reduce(
      (acc, t) => {
        acc.qty += Number(t.qty) || 0
        acc.value += Number(t.total) || 0
        return acc
      },
      { qty: 0, value: 0 },
    )
}

function inRange(dateStr, fromSortable, toSortable) {
  const s = ddmmyyyyToSortable(dateStr)
  if (s === null) return false
  if (fromSortable != null && s < fromSortable) return false
  if (toSortable != null && s > toSortable) return false
  return true
}

// Current on-hand balance for a product: all stock-in minus all stock-out.
// Stock comes only from Stock In / Stock Out rows. The product list's จำนวน is the
// quantity its unit price refers to (always 1 unit), not stock on hand.
export function currentBalance(product, stockIns, stockOuts) {
  const inSum = sumStockIn(stockIns, product.code)
  const outSum = sumStockOut(stockOuts, product.code)
  return { qty: inSum.qty - outSum.qty, value: inSum.value - outSum.value }
}

// Builds the chronological ledger rows for a single product (Report 1).
// With a date range, movements before `fromSortable` roll up into the ยอดยกมา (opening)
// balance and only movements inside the range are listed.
export function buildItemLedger(product, stockIns, stockOuts, { fromSortable, toSortable } = {}) {
  const rows = []
  stockIns
    .filter((t) => t.productCode === product.code)
    .forEach((t) =>
      rows.push({
        kind: 'in',
        date: t.date,
        sortable: ddmmyyyyToSortable(t.date) ?? 0,
        docNo: t.po || '-',
        qty: Number(t.qty) || 0,
        price: Number(t.price) || 0,
        value: Number(t.total) || 0,
        party: t.supplier || '-',
        note: t.note || '',
        ref: t,
      }),
    )
  stockOuts
    .filter((t) => t.productCode === product.code)
    .forEach((t) =>
      rows.push({
        kind: 'out',
        date: t.date,
        sortable: ddmmyyyyToSortable(t.date) ?? 0,
        docNo: t.invoice || t.so || '-',
        qty: Number(t.qty) || 0,
        price: Number(t.price) || 0,
        value: Number(t.total) || 0,
        party: t.customer || '-',
        note: t.note || '',
        isReservation: !!t.so && !t.invoice,
        ref: t,
      }),
    )

  rows.sort((a, b) => a.sortable - b.sortable)

  const opening = { qty: 0, value: 0 }
  const inRangeRows = []
  rows.forEach((r) => {
    if (fromSortable != null && r.sortable < fromSortable) {
      const sign = r.kind === 'in' ? 1 : -1
      opening.qty += sign * r.qty
      opening.value += sign * r.value
    } else if (toSortable == null || r.sortable <= toSortable) {
      inRangeRows.push(r)
    }
  })

  let balQty = opening.qty
  let balValue = opening.value

  const ledger = inRangeRows.map((r) => {
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

  const totalIn = inRangeRows
    .filter((r) => r.kind === 'in')
    .reduce((acc, r) => ({ qty: acc.qty + r.qty, value: acc.value + r.value }), { qty: 0, value: 0 })
  const totalOut = inRangeRows
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

// Builds the "all stock summary" report rows (Report 2) for a date range.
export function buildAllStockSummary(products, allStockIns, allStockOuts, fromSortable, toSortable) {
  const insByCode = groupByCode(allStockIns)
  const outsByCode = groupByCode(allStockOuts)
  return products.map((p) => {
    const stockIns = insByCode.get(p.code) ?? EMPTY
    const stockOuts = outsByCode.get(p.code) ?? EMPTY
    const before = {
      in: sumStockIn(stockIns, p.code, { toSortable: fromSortable != null ? fromSortable - 1 : undefined }),
      out: sumStockOut(stockOuts, p.code, { toSortable: fromSortable != null ? fromSortable - 1 : undefined }),
    }
    // ยอดยกมา = stock carried over from movements before the start date (e.g. earlier years)
    const openingQty = before.in.qty - before.out.qty
    const openingValue = before.in.value - before.out.value

    const inRangeSum = sumStockIn(stockIns, p.code, { fromSortable, toSortable })
    const outRangeSum = sumStockOut(stockOuts, p.code, { fromSortable, toSortable })

    const closingQty = openingQty + inRangeSum.qty - outRangeSum.qty
    const closingValue = openingValue + inRangeSum.value - outRangeSum.value

    return {
      code: p.code,
      name: p.name,
      unit: p.unit,
      opening: { qty: openingQty, value: openingValue },
      in: inRangeSum,
      out: outRangeSum,
      closing: { qty: closingQty, value: closingValue },
    }
  })
}
