import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ListFilter, Truck, Bookmark, BadgeCheck } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import FormField, { inputClass } from '../components/FormField'
import DateTextInput from '../components/DateTextInput'
import ProductCodeField from '../components/ProductCodeField'
import { useStore } from '../store/useStore'
import { isValidDDMMYYYY, todayDDMMYYYY } from '../utils/date'

const emptyForm = {
  date: todayDDMMYYYY(),
  productCode: '',
  productName: '',
  customer: '',
  invoice: '',
  so: '',
  qty: '',
  price: '',
  total: '',
  note: '',
}

export default function StockOut() {
  const stockOuts = useStore((s) => s.stockOuts)
  const addStockOut = useStore((s) => s.addStockOut)
  const updateStockOut = useStore((s) => s.updateStockOut)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const [returnToRecords, setReturnToRecords] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const row = stockOuts.find((t) => t.id === editId)
      if (row) handleEdit(row)
      setReturnToRecords(searchParams.get('from') === 'records')
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isReservation = !!form.so.trim() && !form.invoice.trim()

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
    if (returnToRecords) navigate('/records?type=out')
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.productCode.trim() || !form.qty) return
    if (!isValidDDMMYYYY(form.date)) {
      alert('กรุณากรอกวันที่ให้ถูกต้อง (วว/ดด/ปปปป เป็น พ.ศ.)')
      return
    }
    const payload = {
      ...form,
      qty: Number(form.qty) || 0,
      price: Number(form.price) || 0,
      total: Number(form.total) || 0,
    }
    if (editingId) {
      updateStockOut(editingId, payload)
    } else {
      addStockOut(payload)
    }
    resetForm()
  }

  function handleEdit(row) {
    setEditingId(row.id)
    setForm({
      date: row.date,
      productCode: row.productCode,
      productName: row.productName,
      customer: row.customer,
      invoice: row.invoice,
      so: row.so,
      qty: String(row.qty),
      price: String(row.price),
      total: String(row.total),
      note: row.note,
    })
  }

  return (
    <SidebarLayout title="บันทึกสินค้าออก (Stock Out)">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => navigate('/records?type=out')}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
        >
          <ListFilter size={16} /> ค้นหา / แก้ไข / ลบ รายการที่บันทึกแล้ว
        </button>
      </div>
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-card"
      >
        <div className="mb-4 flex items-center gap-2 text-sky-400">
          <Truck size={18} />
          <span className="text-sm font-semibold">{editingId ? 'แก้ไขรายการสินค้าออก' : 'เพิ่มรายการสินค้าออกใหม่'}</span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FormField label="วันที่" required>
            <DateTextInput value={form.date} onChange={(v) => setForm((f) => ({ ...f, date: v }))} />
          </FormField>
          <FormField label="รหัสสินค้า" required>
            <ProductCodeField value={form.productCode} onSelect={handleProductSelect} listId="out-product-codes" />
          </FormField>
          <FormField label="ชื่อสินค้า">
            <input value={form.productName} readOnly className={inputClass('cursor-not-allowed opacity-70')} />
          </FormField>
          <FormField label="ลูกค้า / หน่วยงาน">
            <input
              value={form.customer}
              onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="INVOICE" hint="เช่น IV-256900300">
            <input
              value={form.invoice}
              onChange={(e) => setForm((f) => ({ ...f, invoice: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="SO" hint="เช่น SO-256900175 (มี SO = จองสินค้า)">
            <input
              value={form.so}
              onChange={(e) => setForm((f) => ({ ...f, so: e.target.value }))}
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
          <FormField label="หมายเหตุ">
            <input
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
        </div>

        {(form.so.trim() || form.invoice.trim()) && (
          <div
            className={`mt-4 flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-medium ${
              isReservation ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
            }`}
          >
            {isReservation ? <Bookmark size={14} /> : <BadgeCheck size={14} />}
            {isReservation
              ? 'สถานะ: การจองสินค้า (Reservation) — ยังไม่มี INVOICE'
              : 'สถานะ: ออกสินค้าแล้ว (Invoiced)'}
          </div>
        )}

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
            className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-sky-500"
          >
            {editingId ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าออก'}
          </button>
        </div>
      </form>
    </SidebarLayout>
  )
}
