import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Pencil, Trash2, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import Modal from './Modal'
import { inputClass } from './FormField'
import { useStore } from '../store/useStore'
import { ddmmyyyyToSortable } from '../utils/date'
import { formatMoney, formatNumber } from '../utils/format'

export default function TransactionSearchModal({ open, onClose }) {
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)
  const deleteStockIn = useStore((s) => s.deleteStockIn)
  const deleteStockOut = useStore((s) => s.deleteStockOut)
  const navigate = useNavigate()

  const [query, setQuery] = useState('')
  const [type, setType] = useState('all') // all | in | out

  const combined = useMemo(() => {
    const ins = stockIns.map((t) => ({
      type: 'in',
      id: t.id,
      date: t.date,
      productCode: t.productCode,
      productName: t.productName,
      docNo: t.po,
      party: t.supplier,
      qty: t.qty,
      price: t.price,
      total: t.total,
    }))
    const outs = stockOuts.map((t) => ({
      type: 'out',
      id: t.id,
      date: t.date,
      productCode: t.productCode,
      productName: t.productName,
      docNo: t.invoice || t.so,
      party: t.customer,
      qty: t.qty,
      price: t.price,
      total: t.total,
    }))
    return [...ins, ...outs].sort(
      (a, b) => (ddmmyyyyToSortable(b.date) ?? 0) - (ddmmyyyyToSortable(a.date) ?? 0),
    )
  }, [stockIns, stockOuts])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return combined.filter((r) => {
      if (type !== 'all' && r.type !== type) return false
      if (!q) return true
      return (
        r.productCode?.toLowerCase().includes(q) ||
        r.productName?.toLowerCase().includes(q) ||
        r.docNo?.toLowerCase().includes(q) ||
        r.party?.toLowerCase().includes(q)
      )
    })
  }, [combined, query, type])

  function handleEdit(row) {
    onClose()
    navigate(row.type === 'in' ? `/stock-in?edit=${row.id}` : `/stock-out?edit=${row.id}`)
  }

  function handleDelete(row) {
    if (!confirm('ลบรายการนี้ใช่หรือไม่? รายงานทั้งหมดจะอัปเดตทันที')) return
    if (row.type === 'in') deleteStockIn(row.id)
    else deleteStockOut(row.id)
  }

  return (
    <Modal open={open} onClose={onClose} title="ค้นหา / แก้ไข / ลบ รายการเข้า-ออก" wide>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารหัสสินค้า / ชื่อสินค้า / เลขเอกสาร / ผู้ขาย-ลูกค้า"
            className={inputClass('pl-9')}
          />
        </div>
        <div className="flex gap-2">
          {[
            { key: 'all', label: 'ทั้งหมด' },
            { key: 'in', label: 'รับเข้า' },
            { key: 'out', label: 'จ่ายออก' },
          ].map((opt) => (
            <button
              key={opt.key}
              onClick={() => setType(opt.key)}
              className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                type === opt.key
                  ? 'border-blue-500/50 bg-blue-500/15 text-blue-300'
                  : 'border-white/10 text-white/50 hover:bg-white/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-h-[55vh] overflow-y-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="sticky top-0 bg-[#171f31] text-left text-white/60">
              <th className="px-3 py-3 font-medium">ประเภท</th>
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-3 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-3 py-3 font-medium">เลขเอกสาร</th>
              <th className="px-3 py-3 text-right font-medium">จำนวน</th>
              <th className="px-3 py-3 text-right font-medium">มูลค่า</th>
              <th className="px-3 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={`${r.type}-${r.id}`} className="border-t border-white/5 text-white/85 hover:bg-white/5">
                <td className="px-3 py-3">
                  {r.type === 'in' ? (
                    <span className="flex items-center gap-1 text-orange-400">
                      <ArrowDownCircle size={14} /> รับเข้า
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-sky-400">
                      <ArrowUpCircle size={14} /> จ่ายออก
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 whitespace-nowrap">{r.date}</td>
                <td className="px-3 py-3 font-mono text-blue-300">{r.productCode}</td>
                <td className="px-3 py-3">{r.productName}</td>
                <td className="px-3 py-3 text-white/60">{r.docNo || '-'}</td>
                <td className="px-3 py-3 text-right">{formatNumber(r.qty)}</td>
                <td className="px-3 py-3 text-right font-semibold">{formatMoney(r.total)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button onClick={() => handleEdit(r)} className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
                      <Pencil size={15} />
                    </button>
                    <button onClick={() => handleDelete(r)} className="rounded-md p-1.5 text-white/50 hover:bg-red-500/20 hover:text-red-400">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-white/30">
                  ไม่พบรายการ
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Modal>
  )
}
