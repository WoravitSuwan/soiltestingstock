import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Pencil, Trash2, Truck, Bookmark, BadgeCheck } from 'lucide-react'
import PageShell from '../components/PageShell'
import FormField, { inputClass } from '../components/FormField'
import DateTextInput from '../components/DateTextInput'
import ProductCodeField from '../components/ProductCodeField'
import { useStore } from '../store/useStore'
import { todayDDMMYYYY, ddmmyyyyToSortable } from '../utils/date'
import { formatMoney, formatNumber } from '../utils/format'

const emptyForm = {
  date: todayDDMMYYYY(),
  productCode: '',
  productName: '',
  customer: '',
  invoice: '',
  so: '',
  qty: '',
  price: '',
  note: '',
}

export default function StockOut() {
  const stockOuts = useStore((s) => s.stockOuts)
  const addStockOut = useStore((s) => s.addStockOut)
  const updateStockOut = useStore((s) => s.updateStockOut)
  const deleteStockOut = useStore((s) => s.deleteStockOut)

  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const editId = searchParams.get('edit')
    if (editId) {
      const row = stockOuts.find((t) => t.id === editId)
      if (row) handleEdit(row)
      setSearchParams({}, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = (Number(form.qty) || 0) * (Number(form.price) || 0)
  const isReservation = !!form.so.trim() && !form.invoice.trim()

  const rows = useMemo(
    () =>
      [...stockOuts].sort((a, b) => (ddmmyyyyToSortable(b.date) ?? 0) - (ddmmyyyyToSortable(a.date) ?? 0)),
    [stockOuts],
  )

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
    const payload = { ...form, qty: Number(form.qty) || 0, price: Number(form.price) || 0, total }
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
      note: row.note,
    })
  }

  function handleDelete(id) {
    if (confirm('ลบรายการนี้ใช่หรือไม่?')) {
      deleteStockOut(id)
      if (editingId === id) resetForm()
    }
  }

  return (
    <PageShell title="บันทึกสินค้าออก (Stock Out)">
      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-xl border border-white/10 bg-[#121828] p-6 shadow-card"
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
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคา / หน่วย">
            <input
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคารวม">
            <input value={formatMoney(total)} readOnly className={inputClass('cursor-not-allowed opacity-70')} />
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
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
            >
              ยกเลิกการแก้ไข
            </button>
          )}
          <button
            type="submit"
            className="rounded-lg bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
          >
            {editingId ? 'บันทึกการแก้ไข' : 'บันทึกสินค้าออก'}
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full min-w-[1020px] text-sm">
          <thead>
            <tr className="bg-white/5 text-left text-white/60">
              <th className="px-3 py-3 font-medium">วันที่</th>
              <th className="px-3 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-3 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-3 py-3 font-medium">ลูกค้า/หน่วยงาน</th>
              <th className="px-3 py-3 font-medium">INVOICE</th>
              <th className="px-3 py-3 font-medium">SO</th>
              <th className="px-3 py-3 text-right font-medium">จำนวน</th>
              <th className="px-3 py-3 text-right font-medium">ราคา/หน่วย</th>
              <th className="px-3 py-3 text-right font-medium">ราคารวม</th>
              <th className="px-3 py-3 text-center font-medium">สถานะ</th>
              <th className="px-3 py-3 text-center font-medium">จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const reserved = !!r.so && !r.invoice
              return (
                <tr key={r.id} className="border-t border-white/5 text-white/85 hover:bg-white/5">
                  <td className="px-3 py-3 whitespace-nowrap">{r.date}</td>
                  <td className="px-3 py-3 font-mono text-blue-300">{r.productCode}</td>
                  <td className="px-3 py-3">{r.productName}</td>
                  <td className="px-3 py-3 text-white/60">{r.customer}</td>
                  <td className="px-3 py-3 text-white/60">{r.invoice}</td>
                  <td className="px-3 py-3 text-white/60">{r.so}</td>
                  <td className="px-3 py-3 text-right">{formatNumber(r.qty)}</td>
                  <td className="px-3 py-3 text-right">{formatMoney(r.price)}</td>
                  <td className="px-3 py-3 text-right font-semibold">{formatMoney(r.total)}</td>
                  <td className="px-3 py-3 text-center">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                        reserved ? 'bg-amber-500/10 text-amber-300' : 'bg-emerald-500/10 text-emerald-300'
                      }`}
                    >
                      {reserved ? 'จอง' : 'ออกแล้ว'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => handleEdit(r)} className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => handleDelete(r.id)} className="rounded-md p-1.5 text-white/50 hover:bg-red-500/20 hover:text-red-400">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-white/30">
                  ยังไม่มีรายการสินค้าออก
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </PageShell>
  )
}
