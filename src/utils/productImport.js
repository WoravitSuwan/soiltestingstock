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

function pickField(normalizedRow, field) {
  for (const candidate of HEADER_MAP[field]) {
    const key = normalizeKey(candidate)
    if (normalizedRow[key] !== undefined && normalizedRow[key] !== '') return normalizedRow[key]
  }
  return ''
}

// Parses an uploaded workbook's first sheet into normalized product rows.
// Returns only rows that have both a code and a name.
export function parseProductWorkbook(arrayBuffer) {
  const wb = XLSX.read(arrayBuffer, { type: 'array' })
  const sheet = wb.Sheets[wb.SheetNames[0]]
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

  return rawRows
    .map((row) => {
      const normalizedRow = {}
      Object.entries(row).forEach(([k, v]) => {
        normalizedRow[normalizeKey(k)] = v
      })
      return {
        code: String(pickField(normalizedRow, 'code')).trim(),
        name: String(pickField(normalizedRow, 'name')).trim(),
        unit: String(pickField(normalizedRow, 'unit')).trim(),
        unitPrice: Number(pickField(normalizedRow, 'unitPrice')) || 0,
        openingQty: Number(pickField(normalizedRow, 'openingQty')) || 0,
      }
    })
    .filter((r) => r.code && r.name)
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
