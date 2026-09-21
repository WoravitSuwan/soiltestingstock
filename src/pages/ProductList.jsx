import { useMemo, useState } from 'react'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import PageShell from '../components/PageShell'
import Modal from '../components/Modal'
import FormField, { inputClass } from '../components/FormField'
import { useStore } from '../store/useStore'
import { thaiCompare, formatMoney, formatNumber } from '../utils/format'

const emptyForm = { code: '', name: '', category: '', unit: '', unitPrice: '', openingQty: '' }

export default function ProductList() {
  const products = useStore((s) => s.products)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)

  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? products.filter(
          (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
        )
      : products
    return [...list].sort((a, b) => thaiCompare(a.code, b.code))
  }, [products, query])

  function openCreate() {
    setEditingCode(null)
    setForm(emptyForm)
    setModalOpen(true)
  }

  function openEdit(p) {
    setEditingCode(p.code)
    setForm({ ...p, unitPrice: String(p.unitPrice), openingQty: String(p.openingQty) })
    setModalOpen(true)
  }

  function handleSave() {
    if (!form.code.trim() || !form.name.trim()) return
    const payload = {
      code: form.code.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      unit: form.unit.trim(),
      unitPrice: Number(form.unitPrice) || 0,
      openingQty: Number(form.openingQty) || 0,
    }
    if (editingCode) {
      updateProduct(editingCode, payload)
    } else {
      if (products.some((p) => p.code.toLowerCase() === payload.code.toLowerCase())) {
        alert('รหัสสินค้านี้มีอยู่แล้ว')
        return
      }
      addProduct(payload)
    }
    setModalOpen(false)
  }

  function handleDelete(code) {
    if (confirm(`ลบสินค้ารหัส ${code} ใช่หรือไม่?`)) deleteProduct(code)
  }

  return (
    <PageShell title="รายการสินค้า (Product List)">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ค้นหารหัส / ชื่อสินค้า"
            className={inputClass('pl-9')}
          />
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={16} /> เพิ่มสินค้า
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-white/60">
              <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-4 py-3 font-medium">หมวดหมู่</th>
              <th className="px-4 py-3 font-medium">หน่วย</th>
              <th className="px-4 py-3 text-right font-medium">ราคา/หน่วย</th>
              <th className="px-4 py-3 text-right font-medium">ยอดยกมา</th>
              <th className="px-4 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.code} className="border-t border-white/5 text-white/85 hover:bg-white/5">
                <td className="px-4 py-3 font-mono text-blue-300">{p.code}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-white/60">{p.category}</td>
                <td className="px-4 py-3 text-white/60">{p.unit}</td>
                <td className="px-4 py-3 text-right">{formatMoney(p.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{formatNumber(p.openingQty)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.code)}
                      className="rounded-md p-1.5 text-white/50 hover:bg-red-500/20 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/30">
                  ไม่พบสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCode ? 'แก้ไขสินค้า' : 'เพิ่มสินค้าใหม่'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="รหัสสินค้า" required>
            <input
              value={form.code}
              disabled={!!editingCode}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className={inputClass(editingCode ? 'opacity-50' : '')}
            />
          </FormField>
          <FormField label="ชื่อสินค้า" required>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="หมวดหมู่">
            <input
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="หน่วย">
            <input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคา / หน่วย">
            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ยอดยกมา (จำนวน)">
            <input
              type="number"
              value={form.openingQty}
              onChange={(e) => setForm((f) => ({ ...f, openingQty: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            บันทึก
          </button>
        </div>
      </Modal>
    </PageShell>
  )
}
