import { useMemo, useRef, useState } from 'react'
import { FileSpreadsheet, FileDown, PackageSearch, CalendarRange } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import ProductPickerModal from '../components/ProductPickerModal'
import DateTextInput from '../components/DateTextInput'
import { useStore } from '../store/useStore'
import { buildItemLedger, buildAllStockSummary } from '../utils/stockCalc'
import { ddmmyyyyToSortable, todayDDMMYYYY } from '../utils/date'
import { formatMoney, formatNumber, thaiCompare } from '../utils/format'
import { exportAoaToExcel, exportElementToPdf } from '../utils/export'

const TABS = [
  { key: 'item', label: 'รายงานรายตัว', hint: 'รายงานสินค้าและวัตถุดิบ - รายตัว' },
  { key: 'summary', label: 'รายงานสรุปทั้งหมด', hint: 'รายงานสินค้าคงเหลือรวมทุกคลัง' },
]

export default function Reports() {
  const [tab, setTab] = useState('item')

  return (
    <SidebarLayout title="รายงาน (Reports)">
      <div className="mb-6 flex gap-2 border-b border-[var(--border-color)]">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-3 text-sm font-semibold transition ${
              tab === t.key ? 'border-blue-500 text-[var(--text-primary)]' : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'item' ? <ItemLedgerReport /> : <AllStockSummaryReport />}
    </SidebarLayout>
  )
}

function ItemLedgerReport() {
  const products = useStore((s) => s.products)
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [selected, setSelected] = useState(null)
  const printRef = useRef(null)

  const ledger = useMemo(() => {
    if (!selected) return null
    return buildItemLedger(selected, stockIns, stockOuts)
  }, [selected, stockIns, stockOuts])

  function handleExportExcel() {
    if (!selected || !ledger) return
    const aoa = [
      [`รายงานสินค้ารายตัว: ${selected.code} - ${selected.name}`],
      [],
      ['วันที่', 'เลขเอกสาร', 'รับ-จำนวน', 'รับ-ราคา', 'รับ-มูลค่า', 'จ่าย-จำนวน', 'จ่าย-ราคา', 'จ่าย-มูลค่า', 'คงเหลือ-จำนวน', 'คงเหลือ-มูลค่า', 'ผู้ขาย/ลูกค้า', 'หมายเหตุ'],
      ['ยอดยกมา', '', '', '', '', '', '', '', ledger.opening.qty, ledger.opening.value, '', ''],
      ...ledger.rows.map((r) => [
        r.date,
        r.docNo,
        r.kind === 'in' ? r.qty : '',
        r.kind === 'in' ? r.price : '',
        r.kind === 'in' ? r.value : '',
        r.kind === 'out' ? r.qty : '',
        r.kind === 'out' ? r.price : '',
        r.kind === 'out' ? r.value : '',
        r.balanceQty,
        r.balanceValue,
        r.party,
        r.kind === 'out' && r.isReservation ? `${r.note} (จองสินค้า)` : r.note,
      ]),
      ['รวมคงเหลือ', '', '', '', '', '', '', '', ledger.closing.qty, ledger.closing.value, '', ''],
    ]
    exportAoaToExcel(aoa, `item-ledger-${selected.code}.xlsx`, 'ItemLedger')
  }

  function handleExportPdf() {
    if (!selected) return
    exportElementToPdf(printRef.current, `item-ledger-${selected.code}.pdf`)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
        >
          <PackageSearch size={16} />
          {selected ? `${selected.code} — ${selected.name}` : 'เลือกสินค้า (Product Code)'}
        </button>

        {selected && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
            >
              <FileSpreadsheet size={14} /> Export Excel
            </button>
            <button
              onClick={handleExportPdf}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
            >
              <FileDown size={14} /> Export PDF
            </button>
          </div>
        )}
      </div>

      {!selected && (
        <div className="rounded-xl border border-dashed border-[var(--border-color)] bg-[var(--bg-card)] py-16 text-center text-sm text-[var(--text-faint)]">
          กรุณาเลือกสินค้าเพื่อดูรายงานรายตัว
        </div>
      )}

      {selected && ledger && (
        <div ref={printRef} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
          <div className="mb-4">
            <div className="text-lg font-bold text-[var(--text-primary)]">{selected.code} — {selected.name}</div>
            <div className="text-xs text-[var(--text-muted)]">หมวดหมู่: {selected.category || '-'} • หน่วย: {selected.unit || '-'}</div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
            <table className="w-full min-w-[1100px] text-xs">
              <thead>
                <tr className="bg-[var(--bg-surface-soft)] text-left text-[var(--text-secondary)]">
                  <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">วันที่</th>
                  <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">เลขเอกสาร</th>
                  <th colSpan={3} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-orange-300">รายการรับ</th>
                  <th colSpan={3} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-sky-300">รายการจ่าย</th>
                  <th colSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-emerald-300">คงเหลือ</th>
                  <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">ผู้ขาย/ลูกค้า</th>
                  <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">รายละเอียด/หมายเหตุ</th>
                </tr>
                <tr className="bg-[var(--bg-surface-soft)] text-right text-[var(--text-muted)]">
                  <th className="px-2 py-1.5">จำนวน</th>
                  <th className="px-2 py-1.5">ราคา</th>
                  <th className="px-2 py-1.5">มูลค่า</th>
                  <th className="px-2 py-1.5">จำนวน</th>
                  <th className="px-2 py-1.5">ราคา</th>
                  <th className="px-2 py-1.5">มูลค่า</th>
                  <th className="px-2 py-1.5">จำนวน</th>
                  <th className="px-2 py-1.5">มูลค่า</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[var(--border-color)] bg-[var(--bg-surface-soft)] text-[var(--text-secondary)]">
                  <td className="px-2 py-2 font-semibold" colSpan={8}>ยอดยกมา</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatNumber(ledger.opening.qty)}</td>
                  <td className="px-2 py-2 text-right font-semibold">{formatMoney(ledger.opening.value)}</td>
                  <td colSpan={2}></td>
                </tr>
                {ledger.rows.map((r, idx) => (
                  <tr key={idx} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                    <td className="whitespace-nowrap px-2 py-2">{r.date}</td>
                    <td className="px-2 py-2">{r.docNo}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'in' ? formatNumber(r.qty) : ''}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'in' ? formatMoney(r.price) : ''}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'in' ? formatMoney(r.value) : ''}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'out' ? formatNumber(r.qty) : ''}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'out' ? formatMoney(r.price) : ''}</td>
                    <td className="px-2 py-2 text-right">{r.kind === 'out' ? formatMoney(r.value) : ''}</td>
                    <td className="px-2 py-2 text-right font-medium">{formatNumber(r.balanceQty)}</td>
                    <td className="px-2 py-2 text-right font-medium">{formatMoney(r.balanceValue)}</td>
                    <td className="px-2 py-2 text-[var(--text-secondary)]">{r.party}</td>
                    <td className="px-2 py-2 text-[var(--text-muted)]">
                      {r.note}
                      {r.kind === 'out' && r.isReservation && (
                        <span className="ml-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-medium text-amber-300">
                          จองสินค้า (SO)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-color)] bg-[var(--bg-surface-soft)] text-[var(--text-primary)]">
                  <td className="px-2 py-2.5 font-bold" colSpan={8}>รวมคงเหลือ</td>
                  <td className="px-2 py-2.5 text-right font-bold">{formatNumber(ledger.closing.qty)}</td>
                  <td className="px-2 py-2.5 text-right font-bold">{formatMoney(ledger.closing.value)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <ProductPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={setSelected} />
    </div>
  )
}

function AllStockSummaryReport() {
  const products = useStore((s) => s.products)
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)
  const printRef = useRef(null)

  const [from, setFrom] = useState('01/01/' + new Date().getFullYear())
  const [to, setTo] = useState(todayDDMMYYYY())

  const fromSortable = ddmmyyyyToSortable(from)
  const toSortable = ddmmyyyyToSortable(to)

  const rows = useMemo(() => {
    const sortedProducts = [...products].sort((a, b) => thaiCompare(a.code, b.code))
    return buildAllStockSummary(
      sortedProducts,
      stockIns,
      stockOuts,
      fromSortable ?? undefined,
      toSortable ?? undefined,
    )
  }, [products, stockIns, stockOuts, fromSortable, toSortable])

  const totals = rows.reduce(
    (acc, r) => {
      acc.openingValue += r.opening.value
      acc.inValue += r.in.value
      acc.outValue += r.out.value
      acc.closingValue += r.closing.value
      return acc
    },
    { openingValue: 0, inValue: 0, outValue: 0, closingValue: 0 },
  )

  function handleExportExcel() {
    const aoa = [
      [`รายงานสินค้าคงเหลือรวมทุกคลัง (${from} - ${to})`],
      [],
      ['รหัส', 'ชื่อสินค้า', 'ยอดยกมา-จำนวน', 'ยอดยกมา-เป็นเงิน', 'ซื้อ/รับเข้า-จำนวน', 'ซื้อ/รับเข้า-เป็นเงิน', 'ออก/จ่ายออก-จำนวน', 'ออก/จ่ายออก-เป็นเงิน', 'คงเหลือ-จำนวน', 'คงเหลือ-เป็นเงิน'],
      ...rows.map((r) => [
        r.code,
        r.name,
        r.opening.qty,
        r.opening.value,
        r.in.qty,
        r.in.value,
        r.out.qty,
        r.out.value,
        r.closing.qty,
        r.closing.value,
      ]),
      ['', 'รวมเงิน', '', totals.openingValue, '', totals.inValue, '', totals.outValue, '', totals.closingValue],
    ]
    exportAoaToExcel(aoa, `all-stock-summary.xlsx`, 'Summary')
  }

  function handleExportPdf() {
    exportElementToPdf(printRef.current, `all-stock-summary.pdf`)
  }

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex items-center gap-2 text-[var(--text-muted)]">
            <CalendarRange size={16} />
            <span className="text-xs">ช่วงวันที่</span>
          </div>
          <div className="w-40">
            <DateTextInput value={from} onChange={setFrom} />
          </div>
          <span className="pb-2 text-[var(--text-faint)]">—</span>
          <div className="w-40">
            <DateTextInput value={to} onChange={setTo} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/20"
          >
            <FileSpreadsheet size={14} /> Export Excel
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2 text-xs font-semibold text-red-300 hover:bg-red-500/20"
          >
            <FileDown size={14} /> Export PDF
          </button>
        </div>
      </div>

      <div ref={printRef} className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
        <div className="mb-4 text-sm text-[var(--text-muted)]">
          รายงานสินค้าคงเหลือรวมทุกคลัง: {from} - {to} (เรียงตาม รหัส/ชื่อสินค้า A-Z / ก-ฮ)
        </div>
        <div className="overflow-x-auto rounded-lg border border-[var(--border-color)]">
          <table className="w-full min-w-[980px] text-xs">
            <thead>
              <tr className="bg-[var(--bg-surface-soft)] text-left text-[var(--text-secondary)]">
                <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">รหัส</th>
                <th rowSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 align-bottom">ชื่อสินค้า</th>
                <th colSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 text-center">ยอดยกมา</th>
                <th colSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-orange-300">ซื้อ/รับเข้า</th>
                <th colSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-sky-300">ออก/จ่ายออก</th>
                <th colSpan={2} className="border-b border-[var(--border-color)] px-2 py-2 text-center text-emerald-300">คงเหลือ</th>
              </tr>
              <tr className="bg-[var(--bg-surface-soft)] text-right text-[var(--text-muted)]">
                <th className="px-2 py-1.5">จำนวน</th>
                <th className="px-2 py-1.5">เป็นเงิน</th>
                <th className="px-2 py-1.5">จำนวน</th>
                <th className="px-2 py-1.5">เป็นเงิน</th>
                <th className="px-2 py-1.5">จำนวน</th>
                <th className="px-2 py-1.5">เป็นเงิน</th>
                <th className="px-2 py-1.5">จำนวน</th>
                <th className="px-2 py-1.5">เป็นเงิน</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.code} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  <td className="px-2 py-2 font-mono text-[var(--text-accent)]">{r.code}</td>
                  <td className="px-2 py-2">{r.name}</td>
                  <td className="px-2 py-2 text-right">{formatNumber(r.opening.qty)}</td>
                  <td className="px-2 py-2 text-right">{formatMoney(r.opening.value)}</td>
                  <td className="px-2 py-2 text-right">{formatNumber(r.in.qty)}</td>
                  <td className="px-2 py-2 text-right">{formatMoney(r.in.value)}</td>
                  <td className="px-2 py-2 text-right">{formatNumber(r.out.qty)}</td>
                  <td className="px-2 py-2 text-right">{formatMoney(r.out.value)}</td>
                  <td className="px-2 py-2 text-right font-medium">{formatNumber(r.closing.qty)}</td>
                  <td className="px-2 py-2 text-right font-medium">{formatMoney(r.closing.value)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center text-[var(--text-faint)]">ไม่มีข้อมูลสินค้า</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t border-[var(--border-color)] bg-[var(--bg-surface-soft)] text-[var(--text-primary)]">
                <td className="px-2 py-2.5 font-bold" colSpan={3}>รวมเงิน</td>
                <td className="px-2 py-2.5 text-right font-bold">{formatMoney(totals.openingValue)}</td>
                <td></td>
                <td className="px-2 py-2.5 text-right font-bold">{formatMoney(totals.inValue)}</td>
                <td></td>
                <td className="px-2 py-2.5 text-right font-bold">{formatMoney(totals.outValue)}</td>
                <td></td>
                <td className="px-2 py-2.5 text-right font-bold">{formatMoney(totals.closingValue)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
