import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, ListFilter, AlertTriangle, PackageSearch, Settings2 } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import { inputClass } from '../components/FormField'
import TransactionSearchModal from '../components/TransactionSearchModal'
import { useStore } from '../store/useStore'
import { currentBalance } from '../utils/stockCalc'
import { thaiCompare, formatMoney, formatNumber } from '../utils/format'

const LOW_STOCK_THRESHOLD = 10

export default function Stock() {
  const products = useStore((s) => s.products)
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)

  const [query, setQuery] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return [...products]
      .filter((p) => !q || p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      .sort((a, b) => thaiCompare(a.code, b.code))
      .map((p) => {
        const bal = currentBalance(p, stockIns, stockOuts)
        return { ...p, ...bal }
      })
  }, [products, stockIns, stockOuts, query])

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0)
  const lowStockCount = rows.filter((r) => r.qty <= LOW_STOCK_THRESHOLD).length

  return (
    <SidebarLayout title="สต๊อกสินค้า (Stock Management)">
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard icon={<PackageSearch size={18} />} label="จำนวนรายการสินค้า" value={formatNumber(rows.length)} color="text-[var(--text-accent)]" />
        <SummaryCard icon={<AlertTriangle size={18} />} label="สินค้าใกล้หมด (≤ 10)" value={formatNumber(lowStockCount)} color="text-amber-300" />
        <SummaryCard icon={<ListFilter size={18} />} label="มูลค่าสต๊อกรวม" value={`฿ ${formatMoney(totalValue)}`} color="text-emerald-300" />
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
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-[var(--bg-surface-soft)] text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-4 py-3 font-medium">หน่วย</th>
              <th className="px-4 py-3 text-right font-medium">คงเหลือ (จำนวน)</th>
              <th className="px-4 py-3 text-right font-medium">มูลค่าคงเหลือ</th>
              <th className="px-4 py-3 text-center font-medium">สถานะ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const low = r.qty <= LOW_STOCK_THRESHOLD
              const out = r.qty <= 0
              return (
                <tr key={r.code} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                  <td className="px-4 py-3 font-mono text-[var(--text-accent)]">{r.code}</td>
                  <td className="px-4 py-3">{r.name}</td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">{r.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatNumber(r.qty)}</td>
                  <td className="px-4 py-3 text-right">{formatMoney(r.value)}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        out
                          ? 'bg-red-500/15 text-red-400'
                          : low
                          ? 'bg-amber-500/15 text-amber-300'
                          : 'bg-emerald-500/15 text-emerald-300'
                      }`}
                    >
                      {out ? 'หมดสต๊อก' : low ? 'ใกล้หมด' : 'ปกติ'}
                    </span>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-faint)]">
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
