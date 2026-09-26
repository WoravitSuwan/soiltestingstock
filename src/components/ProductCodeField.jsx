import { memo, useState } from 'react'
import { ScanLine } from 'lucide-react'
import { useStore } from '../store/useStore'
import { inputClass } from './FormField'
import QrScannerModal from './QrScannerModal'

// Product-code input with datalist autocomplete and a QR scan button; reports the
// matching product so the form can auto-fill name / price.
// Codes are case-sensitive (e.g. "S301M" and "S301m" are different products); an exact
// match wins, otherwise a unique case-insensitive match is accepted.
export default function ProductCodeField({ value, onSelect, listId = 'product-codes' }) {
  const products = useStore((s) => s.products)
  const [scanOpen, setScanOpen] = useState(false)

  function findProduct(code) {
    const trimmed = code.trim()
    const exact = products.find((p) => p.code === trimmed)
    if (exact) return exact
    const loose = products.filter((p) => p.code.toLowerCase() === trimmed.toLowerCase())
    return loose.length === 1 ? loose[0] : null
  }

  function handleChange(code) {
    const match = findProduct(code)
    onSelect(match ? match.code : code, match)
  }

  function handleScan(code) {
    handleChange(code)
    if (!findProduct(code)) alert(`สแกนได้รหัส "${code}" แต่ไม่พบใน PRODUCT LIST`)
  }

  return (
    <>
      <div className="flex gap-2">
        <input
          type="text"
          list={listId}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="กรอกรหัสสินค้า เช่น STS-S202"
          className={inputClass()}
        />
        <button
          type="button"
          onClick={() => setScanOpen(true)}
          title="สแกนคิวอาร์"
          aria-label="สแกนคิวอาร์"
          className="flex flex-shrink-0 items-center justify-center rounded-lg bg-violet-600 px-3 text-white transition hover:bg-violet-500"
        >
          <ScanLine size={17} />
        </button>
      </div>
      <ProductDatalist id={listId} products={products} />
      <QrScannerModal open={scanOpen} onClose={() => setScanOpen(false)} onResult={handleScan} />
    </>
  )
}

// Memoized so typing in any form field doesn't re-render ~10k <option>s.
const ProductDatalist = memo(function ProductDatalist({ id, products }) {
  return (
    <datalist id={id}>
      {products.map((p) => (
        <option key={p.code} value={p.code}>
          {p.name}
        </option>
      ))}
    </datalist>
  )
})
