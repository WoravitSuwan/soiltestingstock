import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PackagePlus } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import FormField, { inputClass } from '../components/FormField'
import DateTextInput from '../components/DateTextInput'
import ProductCodeField from '../components/ProductCodeField'
import { useStore } from '../store/useStore'
import { todayDDMMYYYY } from '../utils/date'

const emptyForm = {
  date: todayDDMMYYYY(),
  productCode: '',
  productName: '',
  supplier: '',
  po: '',
  qty: '',
  price: '',
  total: '',
  soLot: '',
  customer: '',
  note: '',
}

export default function StockIn() {
  const stockIns = useStore((s) => s.stockIns)
  const addStockIn = useStore((s) => s.addStockIn)
  const updateStockIn = useStore((s) => s.updateStockIn)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const row = stockIns.find((t) => t.id === editId)
      if (row) handleEdit(row)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleQtyChange(qty) {
    setForm((f) => ({ ...f, qty, total: String((Number(qty) || 0) * (Number(f.price) || 0)) }))
  }

  function handlePriceChange(price) {
    setForm((f) => ({ ...f, price, total: String((Number(f.qty) || 0) * (Number(price) || 0)) }))
  }

  function handleProductSelect(code, match) {
    setForm((f) => ({ ...f, productCode: code, productName: match ? match.name : f.productName }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.productCode.trim() || !form.qty) return
    const payload = {
      ...form,
      qty: Number(form.qty) || 0,
      price: Number(form.price) || 0,
      total: Number(form.total) || 0,
    }
    if (editingId) {
      updateStockIn(editingId, payload)
    } else {
      addStockIn(payload)
    }
    resetForm()
  }

  function handleEdit(row) {
    setEditingId(row.id)
    setForm({
      date: row.date,
      productCode: row.productCode,
      productName: row.productName,
      supplier: row.supplier,
      po: row.po,
      qty: String(row.qty),
      price: String(row.price),
      total: String(row.total),
      soLot: row.soLot,
      customer: row.customer,
      note: row.note,
    })
  }

  return (
    <SidebarLayout title="บันทึกรับสินค้าเข้า (Stock In)">
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-card"
      >
        <div className="mb-4 flex items-center gap-2 text-orange-400">
          <PackagePlus size={18} />
          <span className="text-sm font-semibold">{editingId ? 'แก้ไขรายการรับสินค้า' : 'เพิ่มรายการรับสินค้าใหม่'}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="วันที่" required>
            <DateTextInput value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          </FormField>
          <FormField label="รหัสสินค้า" required>
            <ProductCodeField value={form.productCode} onSelect={handleProductSelect} listId="in-product-codes" />
          </FormField>
          <FormField label="ชื่อสินค้า">
            <input value={form.productName} readOnly className={inputClass('cursor-not-allowed opacity-70')} />
          </FormField>
          <FormField label="ผู้ผลิต / ผู้ขาย">
            <input
              value={form.supplier}
              onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="PO" hint="เช่น PO-256900202">
            <input
              value={form.po}
              onChange={(e) => setForm((f) => ({ ...f, po: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="จำนวน" required>
            <input
              type="number"
              value={form.qty}
              onChange={(e) => handleQtyChange(e.target.value)}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคา / หน่วย">
            <input
              type="number"
              value={form.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคารวม" hint="คำนวณอัตโนมัติ แต่แก้ไขเองได้">
            <input
              type="number"
              value={form.total}
              onChange={(e) => setForm((f) => ({ ...f, total: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="SO / LOT">
            <input
              value={form.soLot}
              onChange={(e) => setForm((f) => ({ ...f, soLot: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ลูกค้า / หน่วยงาน">
            <input
              value={form.customer}
              onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="หมายเหตุ" hint="">
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
            >
              ยกเลิกการแก้ไข
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-orange-600 px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-orange-500"
          >
            {editingId ? 'บันทึกการแก้ไข' : 'บันทึกรับสินค้า'}
          </button>
        </div>
      </form>
    </SidebarLayout>
  )
}
