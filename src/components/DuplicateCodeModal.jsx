import { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Merge, Pencil } from 'lucide-react'
import Modal from './Modal'
import { inputClass } from './FormField'
import { useStore } from '../store/useStore'
import { filterForProduct } from '../utils/stockCalc'
import { formatMoney, formatNumber } from '../utils/format'

// Lists every รหัสสินค้า that's shared by more than one product record and lets the user
// resolve each group: merge the duplicates' Stock In/Out history into one kept record
// (recommended — nothing is lost), or keep both and give one of them a new, unique code.
export default function DuplicateCodeModal({ open, onClose }) {
  const products = useStore((s) => s.products)
  const stockIns = useStore((s) => s.stockIns)
  const stockOuts = useStore((s) => s.stockOuts)
  const mergeProducts = useStore((s) => s.mergeProducts)
  const updateProduct = useStore((s) => s.updateProduct)

  const groups = useMemo(() => {
    const byCode = new Map()
    products.forEach((p) => {
      const list = byCode.get(p.code)
      if (list) list.push(p)
      else byCode.set(p.code, [p])
    })
    return [...byCode.values()].filter((g) => g.length > 1)
  }, [products])

  function movementCount(p) {
    return filterForProduct(stockIns, p).length + filterForProduct(stockOuts, p).length
  }

  function resolveGroup(group, keepId, actions) {
    const mergeIds = group.filter((p) => p.id !== keepId && actions[p.id]?.mode !== 'rename').map((p) => p.id)
    if (mergeIds.length) mergeProducts(keepId, mergeIds)

    for (const p of group) {
      if (p.id === keepId) continue
      const action = actions[p.id]
      if (action?.mode === 'rename') {
        const newCode = action.newCode.trim()
        if (!newCode) {
          alert(`กรุณากรอกรหัสใหม่สำหรับ "${p.name}"`)
          return false
        }
        if (products.some((other) => other.id !== p.id && other.code === newCode)) {
          alert(`รหัส "${newCode}" ถูกใช้งานแล้ว กรุณาเลือกรหัสอื่น`)
          return false
        }
        updateProduct(p.id, { code: newCode })
      }
    }
    return true
  }

  return (
    <Modal open={open} onClose={onClose} title="จัดการรหัสสินค้าซ้ำ" wide>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        สินค้าที่ใช้รหัสเดียวกันมากกว่า 1 รายการทำให้ค้นหา/แก้ไข/รายงานอ้างอิงผิดรายการได้ —
        เลือก "รวมเป็นรายการเดียว" (แนะนำ ประวัติรับ-จ่ายของทุกรายการจะถูกย้ายมารวมกัน ไม่มีข้อมูลหาย)
        หรือ "เปลี่ยนรหัส" ถ้ามั่นใจว่าเป็นสินค้าคนละตัวกันจริง ๆ
      </p>

      {groups.length === 0 ? (
        <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 size={18} /> ไม่พบรหัสสินค้าซ้ำในระบบ
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <DuplicateGroup key={group[0].code} group={group} movementCount={movementCount} onResolve={resolveGroup} />
          ))}
        </div>
      )}
    </Modal>
  )
}

function DuplicateGroup({ group, movementCount, onResolve }) {
  const [keepId, setKeepId] = useState(group[0].id)
  const [actions, setActions] = useState(() => Object.fromEntries(group.map((p) => [p.id, { mode: 'merge', newCode: '' }])))
  const [done, setDone] = useState(false)

  function setAction(id, patch) {
    setActions((a) => ({ ...a, [id]: { ...a[id], ...patch } }))
  }

  function handleApply() {
    if (onResolve(group, keepId, actions) !== false) setDone(true)
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
        <CheckCircle2 size={16} /> จัดการรหัส <span className="font-mono">{group[0].code}</span> เรียบร้อยแล้ว
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-amber-300">
        <AlertTriangle size={16} /> รหัส <span className="font-mono">{group[0].code}</span> ซ้ำกัน {group.length} รายการ
      </div>

      <div className="flex flex-col gap-2">
        {group.map((p) => (
          <div key={p.id} className="flex flex-col gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="flex min-w-0 flex-1 items-start gap-2">
              <input
                type="radio"
                className="mt-1"
                checked={keepId === p.id}
                onChange={() => setKeepId(p.id)}
              />
              <span className="min-w-0">
                <div className="truncate text-sm font-medium text-[var(--text-primary)]">{p.name}</div>
                <div className="text-xs text-[var(--text-muted)]">
                  {p.unit} · {formatMoney(p.unitPrice)} · {formatNumber(movementCount(p))} รายการเคลื่อนไหว
                </div>
              </span>
            </label>

            {keepId !== p.id && (
              <div className="flex flex-shrink-0 items-center gap-2 sm:ml-4">
                <div className="flex rounded-lg border border-[var(--border-color)] p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setAction(p.id, { mode: 'merge' })}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium ${
                      actions[p.id]?.mode === 'merge' ? 'bg-emerald-600 text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <Merge size={13} /> รวมเข้าด้วยกัน
                  </button>
                  <button
                    type="button"
                    onClick={() => setAction(p.id, { mode: 'rename' })}
                    className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 font-medium ${
                      actions[p.id]?.mode === 'rename' ? 'bg-sky-600 text-white' : 'text-[var(--text-secondary)]'
                    }`}
                  >
                    <Pencil size={13} /> เปลี่ยนรหัส
                  </button>
                </div>
                {actions[p.id]?.mode === 'rename' && (
                  <input
                    value={actions[p.id]?.newCode ?? ''}
                    onChange={(e) => setAction(p.id, { newCode: e.target.value })}
                    placeholder="รหัสใหม่"
                    className={inputClass('w-32 py-1.5 text-xs')}
                  />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={handleApply}
          className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-500"
        >
          ดำเนินการ
        </button>
      </div>
    </div>
  )
}
