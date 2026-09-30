import * as XLSX from 'xlsx'
import { codeText, cleanText, toNumber } from './productImport'
import { fromThaiDate, isValidDDMMYYYY } from './date'
import { lineTotal } from './format'

const HEADER_MAP = {
  code: ['รหัส', 'รหัสสินค้า', 'code'],
  name: ['ชื่อสินค้า', 'ชื่อ', 'name'],
  qty: ['จำนวน', 'qty'],
  unitPrice: ['ราคาต่อหน่วย', 'ราคา/หน่วย', 'ราคาต่อหน่วยละ', 'ราคา', 'unitprice', 'price'],
  total: ['เป็นเงิน', 'มูลค่า', 'total', 'amount'],
  note: ['หมายเหตุ', 'note', 'remark'],
}
const FIELDS = Object.keys(HEADER_MAP)
const HEADER_SCAN_ROWS = 20

function normalizeKey(k) {
  return String(k ?? '').trim().toLowerCase().replace(/\s+/g, '')
}

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

// Pulls "ยอดยกมา DD/MM/YYYY" (พ.ศ.) out of a note cell -> { day, month, beYear } or null.
const NOTE_DATE_RE = /(\d{1,2})\/(\d{1,2})\/(\d{4})/
function extractNoteDate(note) {
  const m = NOTE_DATE_RE.exec(String(note ?? ''))
  if (!m) return null
  return { day: Number(m[1]), month: Number(m[2]), beYear: Number(m[3]) }
}

// Reads an uploaded workbook's first sheet into normalized stock-movement rows.
// - Header row is located by scanning (title rows above it are skipped) and columns are
//   mapped by name, not fixed position.
// - Rows with no product code are dropped — this is also how the file's trailing
//   "รวม" (total) row is skipped, since its code column is blank.
// - Rows where จำนวน or ราคาต่อหน่วย aren't valid numbers are reported in `errors` and
//   excluded from `rows` rather than imported with garbage values.
export function parseStockWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const grid = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: true })

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
  if (headerIdx === -1) return { rows: [], errors: [], detectedYear: null, totalRowsRead: 0 }

  const origin = XLSX.utils.decode_range(sheet['!ref'] || 'A1').s
  const firstRow = origin.r + 1

  const rows = []
  const errors = []
  const yearCounts = new Map()

  for (let i = headerIdx + 1; i < grid.length; i += 1) {
    const cells = grid[i]
    const code = codeText(sheet[XLSX.utils.encode_cell({ r: origin.r + i, c: origin.c + columns.code })])
    if (!code) continue // also skips the trailing "รวม" row (blank รหัส)

    const excelRow = firstRow + i
    const name = columns.name !== undefined ? cleanText(cells[columns.name]) : ''
    const qtyRaw = columns.qty !== undefined ? cells[columns.qty] : ''
    const priceRaw = columns.unitPrice !== undefined ? cells[columns.unitPrice] : ''
    const note = columns.note !== undefined ? cleanText(cells[columns.note]) : ''

    const qty = toNumber(qtyRaw)
    const unitPrice = toNumber(priceRaw)
    const qtyLooksBad = qtyRaw !== '' && !(Number(String(qtyRaw).replace(/,/g, '')) >= 0)
    const priceLooksBad = priceRaw !== '' && !(Number(String(priceRaw).replace(/,/g, '')) >= 0)
    if (qtyLooksBad || priceLooksBad || !(qty > 0)) {
      errors.push({
        excelRow,
        code,
        reason: !(qty > 0) ? 'จำนวนต้องมากกว่า 0' : qtyLooksBad ? 'จำนวนไม่ใช่ตัวเลข' : 'ราคาต่อหน่วยไม่ใช่ตัวเลข',
      })
      continue
    }

    const noteDate = extractNoteDate(note)
    if (noteDate) yearCounts.set(noteDate.beYear, (yearCounts.get(noteDate.beYear) ?? 0) + 1)

    const totalRaw = columns.total !== undefined ? cells[columns.total] : ''
    const total = totalRaw !== '' ? toNumber(totalRaw) : Number(lineTotal(qty, unitPrice))

    rows.push({ excelRow, code, name, qty, unitPrice, total, note, noteDate })
  }

  let detectedYear = null
  let bestCount = 0
  for (const [year, count] of yearCounts) {
    if (count > bestCount) {
      bestCount = count
      detectedYear = year
    }
  }

  return { rows, errors, detectedYear, totalRowsRead: rows.length + errors.length }
}

// CE-stored date for a parsed row: the row's own "ยอดยกมา" date if it had one, otherwise
// 1 Jan of the confirmed import year (beYear, พ.ศ.).
function resolveDate(row, beYear) {
  if (row.noteDate) {
    const candidate = `${String(row.noteDate.day).padStart(2, '0')}/${String(row.noteDate.month).padStart(2, '0')}/${row.noteDate.beYear}`
    const ce = fromThaiDate(candidate)
    if (ce) return ce
  }
  const fallback = `01/01/${beYear}`
  return isValidDDMMYYYY(fromThaiDate(fallback) ?? '') ? fromThaiDate(fallback) : fromThaiDate('01/01/2500')
}

// Builds the plan for applyStockImport: which products need to be created, and the
// stock-in/out rows to add. Existing products are never modified — codes already in the
// system only get a new movement row, never overwritten.
export function planStockImport(products, rows, { year }) {
  const existing = new Set(products.map((p) => p.code))
  const seenNew = new Map()
  const newProducts = []
  const stockRows = []

  rows.forEach((row) => {
    if (!existing.has(row.code) && !seenNew.has(row.code)) {
      seenNew.set(row.code, true)
      newProducts.push({ code: row.code, name: row.name || row.code, unit: 'EA', unitPrice: row.unitPrice, openingQty: 1 })
    }
    stockRows.push({
      productCode: row.code,
      productName: row.name || row.code,
      qty: row.qty,
      price: row.unitPrice,
      total: row.total,
      date: resolveDate(row, year),
      note: row.note,
      year,
    })
  })

  return { newProducts, stockRows }
}
