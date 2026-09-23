import { useMemo, useState } from 'react'
import { Search, Layers } from 'lucide-react'
import Modal from './Modal'
import { inputClass } from './FormField'
import { useStore } from '../store/useStore'
import { thaiCompare } from '../utils/format'

const PICKER_LIMIT = 100

export default function ProductPickerModal({ open, onClose, onPick }) {
  const products = useStore((s) => s.products)
  const [query, setQuery] = useState('')

  const isWildcard = query.trim() === '*'

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q && !isWildcard
      ? products.filter((p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q))
      : products
    return [...list].sort((a, b) => thaiCompare(a.code, b.code))
  }, [products, query, isWildcard])

  const shown = filtered.slice(0, PICKER_LIMIT)

  function pickAll() {
    onPick('ALL')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="เลือกสินค้า (Product Code)">
      <div className="relative mb-4">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ค้นหารหัส / ชื่อสินค้า หรือพิมพ์ * เพื่อดูทั้งหมด"
          className={inputClass('pl-9')}
        />
      </div>

      <button
        onClick={pickAll}
        className="mb-3 flex w-full items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/10 px-4 py-3 text-left transition hover:bg-blue-500/20"
      >
        <Layers size={16} className="text-blue-300" />
        <div>
          <div className="font-mono text-sm text-blue-300">*</div>
          <div className="text-sm text-[var(--text-secondary)]">สินค้าทั้งหมด (All Products)</div>
        </div>
      </button>

      {!isWildcard && (
        <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--border-color)]">
          {shown.map((p) => (
            <button
              key={p.code}
              onClick={() => {
                onPick(p)
                onClose()
              }}
              className="flex w-full items-center justify-between border-b border-[var(--border-color-soft)] px-4 py-3 text-left transition last:border-b-0 hover:bg-[var(--bg-hover)]"
            >
              <div>
                <div className="font-mono text-sm text-[var(--text-accent)]">{p.code}</div>
                <div className="text-sm text-[var(--text-secondary)]">{p.name}</div>
              </div>
              <div className="text-xs text-[var(--text-muted)]">{p.unit}</div>
            </button>
          ))}
          {filtered.length > PICKER_LIMIT && (
            <div className="px-4 py-3 text-center text-xs text-[var(--text-faint)]">
              แสดง {PICKER_LIMIT} จาก {filtered.length.toLocaleString('th-TH')} รายการ — พิมพ์รหัสหรือชื่อเพื่อค้นหาให้แคบลง
            </div>
          )}
          {filtered.length === 0 && <div className="px-4 py-8 text-center text-sm text-[var(--text-faint)]">ไม่พบสินค้า</div>}
        </div>
      )}
    </Modal>
  )
}
