import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ListFilter, AlertTriangle, PackageSearch, Settings2 } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import { inputClass } from '../components/FormField'
import TransactionSearchModal from '../components/TransactionSearchModal'
import { useStore } from '../store/useStore'
import { currentBalance, sumStockIn, sumStockOut } from '../utils/stockCalc'
import { thaiCompare, formatNumber } from '../utils/format'

const LOW_STOCK_THRESHOLD = 5

export default function Stock() {
  const products = useStore((s) => s.products)
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const computed = [...products]
      .filter((p) => !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .sort((a, b) => thaiCompare(a.code, b.code))
      .map((p) => {
        const inSum = sumStockIn(stockIns, p.code)
        const outSum = sumStockOut(stockOuts, p.code)
        const bal = currentBalance(p, stockIns, stockOuts)
        return { ...p, inQty: inSum.qty, outQty: outSum.qty, qty: bal.qty }
      })

    // low-stock items pinned to top; each group otherwise stays A-Z
    return computed.sort((a, b) => {
      const aLow = a.qty <= LOW_STOCK_THRESHOLD ? 0 : 1
      const bLow = b.qty <= LOW_STOCK_THRESHOLD ? 0 : 1
      if (aLow !== bLow) return aLow - bLow
      return thaiCompare(a.code, b.code)
    })
  }, [products, stockIns, stockOuts, query])

  const lowStockCount = rows.filter((r) => r.qty <= LOW_STOCK_THRESHOLD).length

  return (
    <SidebarLayout title="สต๊อกสินค้า (Stock Management)">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SummaryCard icon={<PackageSearch size={18} />} label="จำนวนรายการสินค้า" value={formatNumber(rows.length)} color="text-[var(--text-accent)]" />
        <SummaryCard icon={<AlertTriangle size={18} />} label={`สินค้าใกล้หมด (≤ ${LOW_STOCK_THRESHOLD})`} value={formatNumber(lowStockCount)} color="text-amber-300" />
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารหัส / ชื่อสินค้า"
            className={inputClass('pl-9')}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/products')}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
          >
            <Settings2 size={16} /> จัดการรายการสินค้า
          </button>
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
          >
            <ListFilter size={16} /> ค้นหา / แก้ไข / ลบ รายการเข้า-ออก
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-[var(--bg-surface-soft)] text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-4 py-3 font-medium">ชื่อผลิตภัณฑ์</th>
              <th className="px-4 py-3 text-right font-medium">เข้า</th>
              <th className="px-4 py-3 text-right font-medium">ออก</th>
              <th className="px-4 py-3 text-right font-medium">คงเหลือ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = r.qty <= LOW_STOCK_THRESHOLD
              return (
                <tr
                  key={r.code}
                  className={`border-t border-[var(--border-color-soft)] hover:bg-[var(--bg-hover)] ${
                    low ? 'text-red-400' : 'text-[var(--text-primary)]'
                  }`}
                >
                  <td className={`px-4 py-3 font-mono ${low ? 'text-red-400' : 'text-[var(--text-accent)]'}`}>{r.code}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(r.inQty)}</td>
                  <td className="px-4 py-3 text-right">{formatNumber(r.outQty)}</td>
                  <td className="px-4 py-3 text-right font-bold">{formatNumber(r.qty)}</td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-faint)]">
                  ไม่พบสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <TransactionSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SidebarLayout>
  )
}

function SummaryCard({ icon, label, value, color }) {
  return (
    <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-5">
      <div className={`mb-2 flex items-center gap-2 text-xs font-medium ${color}`}>
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)]">{value}</div>
    </div>
  )
}
