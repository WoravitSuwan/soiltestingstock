import * as XLSX from 'xlsx'

const HEADER_MAP = {
  code: ['รหัสสินค้า', 'รหัส', 'code', 'productcode'],
  name: ['ชื่อสินค้า', 'ชื่อ', 'name', 'productname'],
  unit: ['หน่วย', 'unit'],
  unitPrice: ['ราคา/หน่วยละ', 'ราคา/หน่วย', 'ราคาต่อหน่วย', 'ราคา', 'unitprice', 'price'],
  openingQty: ['จำนวน', 'ยอดยกมา', 'ยอดยกมา(จำนวน)', 'openingqty', 'openingbalance', 'opening', 'qty'],
}

function normalizeKey(k) {
  return String(k ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

const FIELDS = Object.keys(HEADER_MAP)
const HEADER_SCAN_ROWS = 20

// Maps each known field to the column index it lives in for a given header row.
function mapHeaderRow(cells) {
  const normalized = cells.map(normalizeKey)
  const columns = {}
  FIELDS.forEach((field) => {
    for (const candidate of HEADER_MAP[field]) {
      const idx = normalized.indexOf(normalizeKey(candidate))
      if (idx !== -1) {
        columns[field] = idx
        break
      }
    }
  })
  return columns
}

function toNumber(v) {
  if (typeof v === 'number') return v
  const n = Number(String(v ?? '').replace(/,/g, '').trim())
  return Number.isFinite(n) ? n : 0
}

// Parses an uploaded workbook's first sheet into normalized product rows.
// The header row doesn't have to be the first row (title rows above it are skipped),
// and only the columns found in the file are returned per row, so re-importing a file
// with e.g. just code + name leaves the other product fields untouched.
// Rows without a code are dropped; if a code repeats, the last row wins.
export function parseProductWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true })

  let headerIdx = -1
  let columns = {}
  for (let i = 0; i < Math.min(grid.length, HEADER_SCAN_ROWS); i += 1) {
    const mapped = mapHeaderRow(grid[i])
    if (mapped.code !== undefined) {
      headerIdx = i
      columns = mapped
      break
    }
  }
  if (headerIdx === -1) return { rows: [], fields: [] }

  const fields = FIELDS.filter((f) => columns[f] !== undefined)
  const byCode = new Map()
  grid.slice(headerIdx + 1).forEach((cells) => {
    const code = String(cells[columns.code] ?? '').trim()
    if (!code) return
    const row = { code }
    fields.forEach((field) => {
      if (field === 'code') return
      const v = cells[columns[field]]
      row[field] = field === 'unitPrice' || field === 'openingQty' ? toNumber(v) : String(v ?? '').trim()
    })
    byCode.set(code.toLowerCase(), row)
  })
  return { rows: [...byCode.values()], fields }
}

export function buildProductTemplateAoa() {
  return [
    ['รหัสสินค้า', 'ชื่อสินค้า', 'จำนวน', 'หน่วย', 'ราคา/หน่วยละ'],
    ['RM-0003', 'ตัวอย่างสินค้า', 1, 'EA', 100],
  ]
}

export function buildProductExportAoa(products) {
  return [
    ['รหัสสินค้า', 'ชื่อสินค้า', 'จำนวน', 'หน่วย', 'ราคา/หน่วยละ'],
    ...products.map((p) => [p.code, p.name, p.openingQty, p.unit, p.unitPrice]),
  ]
}

const EDITABLE_FIELDS = ['name', 'unit', 'unitPrice', 'openingQty']

// Compares imported rows with the current product list (codes match case-insensitively).
// - added:     codes not in the system yet (need a name; ones without are skipped)
// - updated:   existing codes where at least one imported field differs -> replaced with file data
// - unchanged: existing codes identical to the file
// - removed:   (replaceAll only) products in the system but missing from the file
export function planProductImport(products, rows, { replaceAll = false } = {}) {
  const existing = new Map(products.map((p) => [p.code.toLowerCase(), p]))
  const seen = new Set()
  const plan = { added: [], updated: [], unchanged: [], skipped: [], removed: [] }

  rows.forEach((row) => {
    const key = row.code.toLowerCase()
    seen.add(key)
    const current = existing.get(key)
    if (!current) {
      if (!row.name) {
        plan.skipped.push(row)
        return
      }
      plan.added.push({ code: row.code, name: row.name, unit: row.unit ?? '', unitPrice: row.unitPrice ?? 0, openingQty: row.openingQty ?? 0 })
      return
    }
    const updates = {}
    EDITABLE_FIELDS.forEach((field) => {
      if (row[field] === undefined) return
      // an empty name cell never wipes the existing name
      if (field === 'name' && !row.name) return
      if (row[field] !== current[field]) updates[field] = row[field]
    })
    if (Object.keys(updates).length > 0) plan.updated.push({ code: current.code, before: current, updates })
    else plan.unchanged.push(current)
  })

  if (replaceAll) plan.removed = products.filter((p) => !seen.has(p.code.toLowerCase()))
  return plan
}
