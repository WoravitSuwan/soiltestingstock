import * as XLSX from 'xlsx'
import { codeText, cleanText, toNumber } from './productImport'
import { fromThaiDate, isValidDDMMYYYY, todayDDMMYYYY } from './date'
import { lineTotal } from './format'
import { genUuid } from './id'

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

// "ยอดยกมา DD/MM/YYYY" (พ.ศ.) -> { day, month, beYear }, only when the note actually
// starts with ยอดยกมา (not just any date-like text elsewhere in the cell).
const OPENING_NOTE_RE = /^ยอดยกมา\D*(\d{1,2})\/(\d{1,2})\/(\d{4})/
function parseOpeningNote(note) {
  const m = OPENING_NOTE_RE.exec(String(note ?? '').trim())
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
// - A row whose หมายเหตุ starts with "ยอดยกมา DD/MM/YYYY" is flagged `isOpeningNote` with
//   its own carried-forward date; `openingNoteCount < rows.length` (or no note column at
//   all) means the file's movement type is ambiguous and the caller should ask the user.
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
  if (headerIdx === -1) {
    return { rows: [], errors: [], detectedYear: null, totalRowsRead: 0, hasNoteColumn: false, openingNoteCount: 0 }
  }

  const origin = XLSX.utils.decode_range(sheet['!ref'] || 'A1').s
  const firstRow = origin.r + 1
  const hasNoteColumn = columns.note !== undefined

  const rows = []
  const errors = []
  const yearCounts = new Map()
  let openingNoteCount = 0

  for (let i = headerIdx + 1; i < grid.length; i += 1) {
    const cells = grid[i]
    const code = codeText(sheet[XLSX.utils.encode_cell({ r: origin.r + i, c: origin.c + columns.code })])
    if (!code) continue // also skips the trailing "รวม" row (blank รหัส)

    const excelRow = firstRow + i
    const name = columns.name !== undefined ? cleanText(cells[columns.name]) : ''
    const qtyRaw = columns.qty !== undefined ? cells[columns.qty] : ''
    const priceRaw = columns.unitPrice !== undefined ? cells[columns.unitPrice] : ''
    const note = hasNoteColumn ? cleanText(cells[columns.note]) : ''

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

    const openingNote = parseOpeningNote(note)
    if (openingNote) {
      openingNoteCount += 1
      yearCounts.set(openingNote.beYear, (yearCounts.get(openingNote.beYear) ?? 0) + 1)
    }

    const totalRaw = columns.total !== undefined ? cells[columns.total] : ''
    const total = totalRaw !== '' ? toNumber(totalRaw) : Number(lineTotal(qty, unitPrice))

    rows.push({ excelRow, code, name, qty, unitPrice, total, note, openingNote, isOpeningNote: !!openingNote })
  }

  let detectedYear = null
  let bestCount = 0
  for (const [year, count] of yearCounts) {
    if (count > bestCount) {
      bestCount = count
      detectedYear = year
    }
  }

  return { rows, errors, detectedYear, totalRowsRead: rows.length + errors.length, hasNoteColumn, openingNoteCount }
}

// CE-stored date for a parsed row: its own "ยอดยกมา" date if it had one. Failing that, a
// row classified as opening_balance (by the whole-file fallback) uses 1 Jan of the
// confirmed import year — but an ordinary ซื้อ/ออก fallback row uses today's date instead,
// since "1 Jan" would make the report's own pre-range roll-up silently fold it back into
// ยอดยกมา, defeating the point of tagging it as an ordinary movement.
function resolveDate(row, beYear, movementType) {
  if (row.openingNote) {
    const candidate = `${String(row.openingNote.day).padStart(2, '0')}/${String(row.openingNote.month).padStart(2, '0')}/${row.openingNote.beYear}`
    const ce = fromThaiDate(candidate)
    if (ce) return ce
  }
  if (movementType !== 'opening_balance') return todayDDMMYYYY()
  const fallback = `01/01/${beYear}`
  return isValidDDMMYYYY(fromThaiDate(fallback) ?? '') ? fromThaiDate(fallback) : fromThaiDate('01/01/2500')
}

// Builds the plan for applyStockImport: which products need to be created, and the
// stock-in/out rows to add. Existing products are never modified — codes already in the
// system only get a new movement row, never overwritten.
//
// Each row's movementType is 'opening_balance' when its own note said so; otherwise it
// falls back to `fallbackMovementType` ('opening_balance' | 'in' | 'out'), which the UI
// must ask the user for whenever the file didn't unambiguously mark every row ยอดยกมา.
export function planStockImport(products, rows, { year, fallbackMovementType = 'opening_balance' }) {
  const existingByCode = new Map(products.map((p) => [p.code, p]))
  const newIdByCode = new Map()
  const newProducts = []
  const stockRows = []

  rows.forEach((row) => {
    let productId = existingByCode.get(row.code)?.id
    if (!productId) {
      if (!newIdByCode.has(row.code)) {
        const id = genUuid()
        newIdByCode.set(row.code, id)
        newProducts.push({ id, code: row.code, name: row.name || row.code, unit: 'EA', unitPrice: row.unitPrice, openingQty: 1 })
      }
      productId = newIdByCode.get(row.code)
    }
    const movementType = row.isOpeningNote ? 'opening_balance' : fallbackMovementType
    stockRows.push({
      productId,
      productCode: row.code,
      productName: row.name || row.code,
      qty: row.qty,
      price: row.unitPrice,
      total: row.total,
      date: resolveDate(row, year, movementType),
      note: row.note,
      year,
      movementType,
    })
  })

  return { newProducts, stockRows }
}
