import { ddmmyyyyToSortable } from './date'

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

// Current on-hand balance for a product: opening + all stock-in - all stock-out.
export function currentBalance(product, stockIns, stockOuts) {
  const inSum = sumStockIn(stockIns, product.code)
  const outSum = sumStockOut(stockOuts, product.code)
  const qty = (Number(product.openingQty) || 0) + inSum.qty - outSum.qty
  const openingValue = (Number(product.openingQty) || 0) * (Number(product.unitPrice) || 0)
  const value = openingValue + inSum.value - outSum.value
  return { qty, value }
}

// Builds the chronological ledger rows for a single product (Report 1).
export function buildItemLedger(product, stockIns, stockOuts) {
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

  let balQty = Number(product.openingQty) || 0
  let balValue = balQty * (Number(product.unitPrice) || 0)

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

  return {
    opening: { qty: Number(product.openingQty) || 0, value: (Number(product.openingQty) || 0) * (Number(product.unitPrice) || 0) },
    rows: ledger,
    closing: { qty: balQty, value: balValue },
  }
}

// Builds the "all stock summary" report rows (Report 2) for a date range.
export function buildAllStockSummary(products, stockIns, stockOuts, fromSortable, toSortable) {
  return products.map((p) => {
    const before = {
      in: sumStockIn(stockIns, p.code, { toSortable: fromSortable != null ? fromSortable - 1 : undefined }),
      out: sumStockOut(stockOuts, p.code, { toSortable: fromSortable != null ? fromSortable - 1 : undefined }),
    }
    const openingQty = (Number(p.openingQty) || 0) + before.in.qty - before.out.qty
    const openingValue =
      (Number(p.openingQty) || 0) * (Number(p.unitPrice) || 0) + before.in.value - before.out.value

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
