import { useMemo, useState } from 'react'
import { Search, Layers } from 'lucide-react'
import Modal from './Modal'
import { inputClass } from './FormField'
import { useStore } from '../store/useStore'
import { thaiCompare } from '../utils/format'

const PICKER_LIMIT = 100

// "รหัสสินค้า" popup for the item report: type a code and press ค้นหา / Enter to open that
// product's report, or type * and Enter for every product. Partial text lists matches.
export default function ProductPickerModal({ open, onClose, onPick }) {
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')
  const [notFound, setNotFound] = useState(false)

  const q = query.trim()
  const isWildcard = q === '*'

  const filtered = useMemo(() => {
    if (!q || isWildcard) return []
    const lower = q.toLowerCase()
    return products
      .filter((p) => p.code.toLowerCase().includes(lower) || p.name.toLowerCase().includes(lower))
      .sort((a, b) => thaiCompare(a.code, b.code))
  }, [products, q, isWildcard])

  const shown = filtered.slice(0, PICKER_LIMIT)

  function pick(value) {
    onPick(value)
    setQuery('')
    setNotFound(false)
    onClose()
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!q) return
    if (isWildcard) return pick('ALL')
    const exact =
      products.find((p) => p.code === q) ??
      (() => {
        const loose = products.filter((p) => p.code.toLowerCase() === q.toLowerCase())
        return loose.length === 1 ? loose[0] : null
      })()
    if (exact) return pick(exact)
    if (filtered.length === 1) return pick(filtered[0])
    setNotFound(filtered.length === 0)
  }

  return (
    <Modal open={open} onClose={onClose} title="รหัสสินค้า">
      <form onSubmit={handleSearch}>
        <p className="mb-2 text-sm text-[var(--text-muted)]">
          กรอกรหัสสินค้าลงไป ข้อมูลจะเด้งเป็นรายงานสินค้าและวัตถุดิบของรหัสนั้น
        </p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setNotFound(false)
              }}
              placeholder="รหัสสินค้า หรือ * เพื่อดูทั้งหมด"
              className={inputClass('pl-9')}
            />
          </div>
          <button type="submit" className="rounded-lg bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-500">
            ค้นหา
          </button>
        </div>
        <p className="mt-2 text-xs text-[var(--text-faint)]">
          ถ้าไม่ทราบรหัสสินค้า ให้ใส่ * (ดอกจัน) แล้ว Enter เพื่อแสดงข้อมูลรหัสสินค้าทุกรายการ
        </p>
      </form>

      {notFound && <p className="mt-3 text-sm text-amber-300">ไม่พบรหัสสินค้า "{q}"</p>}

      {isWildcard && (
        <button
          onClick={() => pick('ALL')}
          className="mt-4 flex w-full items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-left transition hover:bg-blue-500/20"
        >
          <Layers size={16} className="text-blue-300" />
          <span className="text-sm text-[var(--text-secondary)]">สินค้าทั้งหมด (All Products)</span>
        </button>
      )}

      {shown.length > 0 && (
        <div className="mt-4 max-h-80 overflow-y-auto rounded-lg border border-[var(--border-color)]">
          {shown.map((p) => (
            <button
              key={p.code}
              onClick={() => pick(p)}
              className="flex w-full items-center justify-between gap-3 border-b border-[var(--border-color-soft)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--bg-hover)]"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm text-[var(--text-accent)]">{p.code}</div>
                <div className="text-sm text-[var(--text-secondary)]">{p.name}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">{p.unit}</div>
            </button>
          ))}
          {filtered.length > PICKER_LIMIT && (
            <div className="px-4 py-3 text-center text-xs text-[var(--text-faint)]">
              แสดง {PICKER_LIMIT} จาก {filtered.length.toLocaleString('th-TH')} รายการ — พิมพ์ให้ละเอียดขึ้นเพื่อค้นหาให้แคบลง
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
