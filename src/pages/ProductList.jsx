import { useMemo, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Search, Upload, Download, QrCode } from 'lucide-react'
import SidebarLayout from '../components/SidebarLayout'
import Modal from '../components/Modal'
import ProductQrModal from '../components/ProductQrModal'
import ShowMoreButton, { useShowMore } from '../components/ShowMore'
import FormField, { inputClass } from '../components/FormField'
import { useStore } from '../store/useStore'
import { thaiCompare, formatMoney, formatNumber } from '../utils/format'
import { exportAoaToExcel } from '../utils/export'
import { parseProductWorkbook, planProductImport, buildProductExportAoa } from '../utils/productImport'

const emptyForm = { code: '', name: '', unit: 'EA', unitPrice: '', openingQty: '1' }

export default function ProductList() {
  const products = useStore((s) => s.products)
  const addProduct = useStore((s) => s.addProduct)
  const updateProduct = useStore((s) => s.updateProduct)
  const deleteProduct = useStore((s) => s.deleteProduct)
  const applyProductImport = useStore((s) => s.applyProductImport)

  const [query, setQuery] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCode, setEditingCode] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [importSummary, setImportSummary] = useState(null)
  const [pendingImport, setPendingImport] = useState(null) // { fileName, rows, fields, duplicates }
  const [replaceAll, setReplaceAll] = useState(false)
  const [qrProduct, setQrProduct] = useState(null)
  const fileInputRef = useRef(null)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? products.filter(
          (p) => p.code.toLowerCase().includes(q) || p.name.toLowerCase().includes(q),
        )
      : products
    return [...list].sort((a, b) => thaiCompare(a.code, b.code))
  }, [products, query])
  const page = useShowMore(filtered, 100, query)

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
      unit: form.unit.trim(),
      unitPrice: Number(form.unitPrice) || 0,
      openingQty: Number(form.openingQty) || 0,
    }
    if (editingCode) {
      updateProduct(editingCode, payload)
    } else {
      if (products.some((p) => p.code === payload.code)) {
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

  function handleExportExcel() {
    const sorted = [...products].sort((a, b) => thaiCompare(a.code, b.code))
    exportAoaToExcel(buildProductExportAoa(sorted), 'product-list.xlsx', 'Products')
  }

  function handleImportClick() {
    fileInputRef.current?.click()
  }

  function handleImportFile(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const { rows, fields, duplicates } = parseProductWorkbook(evt.target.result)
        if (rows.length === 0) {
          setImportSummary({
            type: 'error',
            message: 'ไม่พบข้อมูลสินค้าในไฟล์ — ต้องมีหัวคอลัมน์ "รหัสสินค้า" (ดาวน์โหลดเทมเพลตเพื่อดูรูปแบบ)',
          })
          return
        }
        setImportSummary(null)
        setReplaceAll(false)
        setPendingImport({ fileName: file.name, rows, fields, duplicates })
      } catch {
        setImportSummary({ type: 'error', message: 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์' })
      }
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  const importPlan = useMemo(
    () => (pendingImport ? planProductImport(products, pendingImport.rows, { replaceAll }) : null),
    [pendingImport, products, replaceAll],
  )

  function handleConfirmImport() {
    if (!importPlan) return
    if (
      importPlan.removed.length > 0 &&
      !confirm(`ยืนยันลบสินค้า ${importPlan.removed.length} รายการที่ไม่มีในไฟล์ออกจากระบบ?`)
    )
      return
    applyProductImport(importPlan)
    const parts = [
      `เพิ่มใหม่ ${importPlan.added.length}`,
      `อัปเดตเป็นข้อมูลใหม่ ${importPlan.updated.length}`,
      `ไม่เปลี่ยนแปลง ${importPlan.unchanged.length}`,
    ]
    if (importPlan.removed.length) parts.push(`ลบ ${importPlan.removed.length}`)
    if (importPlan.skipped.length) parts.push(`ข้าม ${importPlan.skipped.length} (สินค้าใหม่ที่ไม่มีชื่อ)`)
    setImportSummary({ type: 'success', message: `นำเข้าสำเร็จ: ${parts.join(', ')} รายการ` })
    setPendingImport(null)
  }

  return (
    <SidebarLayout
      title="PRODUCT LIST"
      backTo="/"
      heading={
        <span className="flex flex-col leading-tight">
          <span className="text-3xl font-extrabold tracking-wide">PRODUCT LIST</span>
          <span className="text-base font-semibold text-[var(--text-secondary)]">รายการสินค้า</span>
        </span>
      }
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md sm:flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by SKU or product name..."
            className={inputClass('pl-9')}
          />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleImportFile}
          />
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-400"
          >
            <Plus size={16} /> Add product
          </button>
          <button
            onClick={handleImportClick}
            title="นำเข้า / อัปเดตรหัสสินค้าจากไฟล์ Excel (หัวคอลัมน์เหมือนไฟล์ Export Excel)"
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-hover-strong)]"
          >
            <Upload size={16} /> Import Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center justify-center gap-2 rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] transition hover:bg-[var(--bg-hover-strong)]"
          >
            <Download size={16} /> Export Excel
          </button>
        </div>
      </div>

      {importSummary && (
        <div
          className={`mb-4 rounded-lg px-4 py-2.5 text-sm ${
            importSummary.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300'
              : 'bg-red-500/10 text-red-400'
          }`}
        >
          {importSummary.message}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-[var(--border-color)]">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="bg-[var(--bg-surface-soft)] text-left text-[var(--text-secondary)]">
              <th className="px-4 py-3 font-medium">รหัสสินค้า</th>
              <th className="px-4 py-3 font-medium">ชื่อสินค้า</th>
              <th className="px-4 py-3 text-right font-medium">จำนวน</th>
              <th className="px-4 py-3 font-medium">หน่วย</th>
              <th className="px-4 py-3 text-right font-medium">ราคาหน่วยละ</th>
              <th className="px-4 py-3 text-center font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {page.visible.map((p) => (
              <tr key={p.code} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)] hover:bg-[var(--bg-hover)]">
                <td className="px-4 py-3 font-mono text-[var(--text-accent)]">{p.code}</td>
                <td className="px-4 py-3">{p.name}</td>
                <td className="px-4 py-3 text-right">{formatNumber(p.openingQty)}</td>
                <td className="px-4 py-3 text-[var(--text-secondary)]">{p.unit}</td>
                <td className="px-4 py-3 text-right">{formatMoney(p.unitPrice)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => setQrProduct(p)}
                      title="QR Code"
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)]"
                    >
                      <QrCode size={15} />
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      title="แก้ไข"
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-hover-strong)] hover:text-[var(--text-primary)]"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(p.code)}
                      title="ลบ"
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-faint)]">
                  ไม่พบสินค้า
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <ShowMoreButton
        shown={page.visible.length}
        total={filtered.length}
        remaining={page.remaining}
        onMore={page.showMore}
      />

      <ProductQrModal product={qrProduct} onClose={() => setQrProduct(null)} />

      <ImportPreviewModal
        pending={pendingImport}
        plan={importPlan}
        replaceAll={replaceAll}
        onReplaceAllChange={setReplaceAll}
        onCancel={() => setPendingImport(null)}
        onConfirm={handleConfirmImport}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCode ? 'Edit product' : 'Add product'}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="รหัสสินค้า" required>
            <input
              value={form.code}
              disabled={!!editingCode}
              placeholder="e.g. STS-E045"
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
          <FormField label="จำนวน" hint="1 หน่วย (ราคาต่อ 1 ตัว)">
            <input
              type="number"
              value={form.openingQty}
              onChange={(e) => setForm((f) => ({ ...f, openingQty: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="หน่วย" hint="เช่น EA">
            <input
              value={form.unit}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
          <FormField label="ราคาหน่วยละ" hint="ราคาต้นทุนไม่รวม VAT">
            <input
              type="number"
              value={form.unitPrice}
              onChange={(e) => setForm((f) => ({ ...f, unitPrice: e.target.value }))}
              className={inputClass()}
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setModalOpen(false)}
            className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-[var(--text-primary)] hover:bg-blue-500"
          >
            Save
          </button>
        </div>
      </Modal>
    </SidebarLayout>
  )
}

const PREVIEW_LIMIT = 200

const FIELD_LABELS = {
  code: 'รหัสสินค้า',
  name: 'ชื่อสินค้า',
  unit: 'หน่วย',
  unitPrice: 'ราคาหน่วยละ',
  openingQty: 'จำนวน',
}

function formatField(field, value) {
  if (field === 'unitPrice') return formatMoney(value)
  if (field === 'openingQty') return formatNumber(value)
  return value || '-'
}

function ImportPreviewModal({ pending, plan, replaceAll, onReplaceAllChange, onCancel, onConfirm }) {
  if (!pending || !plan) return null
  const missingFields = Object.keys(FIELD_LABELS).filter((f) => !pending.fields.includes(f))
  const nothingToDo = plan.added.length + plan.updated.length + plan.removed.length === 0
  // listing all ~10k rows of a first import would freeze the dialog
  const changes = [
    ...plan.updated.map((u) => ({ kind: 'updated', ...u })),
    ...plan.removed.map((p) => ({ kind: 'removed', code: p.code, name: p.name })),
    ...plan.added.map((p) => ({ kind: 'added', code: p.code, name: p.name })),
  ]
  const shownChanges = changes.slice(0, PREVIEW_LIMIT)

  const stats = [
    { label: 'เพิ่มใหม่', value: plan.added.length, color: 'text-emerald-300' },
    { label: 'อัปเดตเป็นข้อมูลใหม่', value: plan.updated.length, color: 'text-sky-300' },
    { label: 'ไม่เปลี่ยนแปลง', value: plan.unchanged.length, color: 'text-[var(--text-muted)]' },
    { label: 'จะถูกลบ', value: plan.removed.length, color: 'text-red-400' },
  ]

  return (
    <Modal open onClose={onCancel} title="ตรวจสอบก่อนนำเข้ารายการสินค้า" wide>
      <div className="mb-4 text-sm text-[var(--text-secondary)]">
        ไฟล์: <span className="font-semibold text-[var(--text-primary)]">{pending.fileName}</span> — พบ{' '}
        {formatNumber(pending.rows.length)} รหัสสินค้า
        {missingFields.length > 0 && (
          <div className="mt-1 text-xs text-[var(--text-muted)]">
            ไม่มีคอลัมน์ {missingFields.map((f) => FIELD_LABELS[f]).join(', ')} ในไฟล์ — ข้อมูลส่วนนี้ของสินค้าเดิมจะไม่ถูกแก้ไข
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((st) => (
          <div key={st.label} className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] p-3">
            <div className={`text-xs font-medium ${st.color}`}>{st.label}</div>
            <div className="text-xl font-bold text-[var(--text-primary)]">{formatNumber(st.value)}</div>
          </div>
        ))}
      </div>

      {pending.duplicates.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
          <div className="mb-1 font-semibold">
            พบรหัสสินค้าซ้ำในไฟล์ {pending.duplicates.length} รหัส — ระบบจะใช้แถวล่างสุดของแต่ละรหัส
            (ถ้าเป็นสินค้าคนละตัว กรุณาแก้รหัสในไฟล์ให้ไม่ซ้ำแล้วนำเข้าใหม่)
          </div>
          <div className="max-h-24 overflow-y-auto">
            {pending.duplicates.map((d) => (
              <div key={d.code}>
                <span className="font-mono">{d.code}</span> — แถว {d.rows.join(', ')}
              </div>
            ))}
          </div>
        </div>
      )}

      {plan.skipped.length > 0 && (
        <div className="mb-4 rounded-lg bg-amber-500/10 px-4 py-2.5 text-xs text-amber-300">
          ข้าม {plan.skipped.length} รายการ เพราะเป็นรหัสใหม่แต่ไม่มีชื่อสินค้า: {plan.skipped.slice(0, 50).map((r) => r.code).join(', ')}
          {plan.skipped.length > 50 && ' …'}
        </div>
      )}

      <div className="mb-4 max-h-[40vh] overflow-auto rounded-lg border border-[var(--border-color)]">
        <table className="w-full min-w-[640px] text-xs [&_td]:whitespace-nowrap [&_th]:whitespace-nowrap">
          <thead>
            <tr className="sticky top-0 bg-[var(--bg-card-alt)] text-left text-[var(--text-secondary)]">
              <th className="px-3 py-2 font-medium">สถานะ</th>
              <th className="px-3 py-2 font-medium">รหัสสินค้า</th>
              <th className="px-3 py-2 font-medium">รายละเอียด</th>
            </tr>
          </thead>
          <tbody>
            {shownChanges.map((c) =>
              c.kind === 'updated' ? (
                <tr key={`u-${c.code}`} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)]">
                  <td className="px-3 py-2 text-sky-300">อัปเดต</td>
                  <td className="px-3 py-2 font-mono text-[var(--text-accent)]">{c.code}</td>
                  <td className="!whitespace-normal px-3 py-2">
                    {Object.entries(c.updates).map(([field, value]) => (
                      <div key={field}>
                        {FIELD_LABELS[field]}:{' '}
                        <span className="text-[var(--text-faint)] line-through">{formatField(field, c.before[field])}</span>
                        {' → '}
                        <span className="font-semibold">{formatField(field, value)}</span>
                      </div>
                    ))}
                  </td>
                </tr>
              ) : (
                <tr key={`${c.kind}-${c.code}`} className="border-t border-[var(--border-color-soft)] text-[var(--text-primary)]">
                  <td className={`px-3 py-2 ${c.kind === 'added' ? 'text-emerald-300' : 'text-red-400'}`}>
                    {c.kind === 'added' ? 'เพิ่มใหม่' : 'ลบ'}
                  </td>
                  <td className="px-3 py-2 font-mono text-[var(--text-accent)]">{c.code}</td>
                  <td className="!whitespace-normal px-3 py-2">{c.name}</td>
                </tr>
              ),
            )}
            {changes.length > PREVIEW_LIMIT && (
              <tr className="border-t border-[var(--border-color-soft)]">
                <td colSpan={3} className="px-3 py-2 text-center text-[var(--text-faint)]">
                  … และอีก {formatNumber(changes.length - PREVIEW_LIMIT)} รายการ
                </td>
              </tr>
            )}
            {nothingToDo && (
              <tr>
                <td colSpan={3} className="px-3 py-6 text-center text-[var(--text-faint)]">
                  ข้อมูลในไฟล์ตรงกับข้อมูลในระบบแล้ว ไม่มีอะไรต้องเปลี่ยน
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <label className="mb-2 flex items-start gap-2 text-sm text-[var(--text-secondary)]">
        <input
          type="checkbox"
          checked={replaceAll}
          onChange={(e) => onReplaceAllChange(e.target.checked)}
          className="mt-1"
        />
        <span>
          แทนที่รายการสินค้าทั้งหมดด้วยไฟล์นี้ (ลบสินค้าที่ไม่มีในไฟล์)
          <span className="block text-xs text-[var(--text-faint)]">
            ประวัติรับเข้า-จ่ายออกของสินค้าที่ถูกลบจะยังอยู่ แต่จะไม่แสดงในรายงาน
          </span>
        </span>
      </label>

      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="rounded-lg border border-[var(--border-color)] px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        >
          ยกเลิก
        </button>
        <button
          onClick={onConfirm}
          disabled={nothingToDo}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          ยืนยันนำเข้า
        </button>
      </div>
    </Modal>
  )
}
