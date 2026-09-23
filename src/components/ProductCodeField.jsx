import { memo } from 'react'
import { useStore } from '../store/useStore'
import { inputClass } from './FormField'

// Product-code input with datalist autocomplete; auto-fills product name on selection.
// Codes are case-sensitive (e.g. "S301M" and "S301m" are different products); an exact
// match wins, otherwise a unique case-insensitive match is accepted.
export default function ProductCodeField({ value, onSelect, listId = 'product-codes' }) {
  const products = useStore((s) => s.products)

  function handleChange(code) {
    const trimmed = code.trim()
    let match = products.find((p) => p.code === trimmed)
    if (!match) {
      const lower = trimmed.toLowerCase()
      const loose = products.filter((p) => p.code.toLowerCase() === lower)
      if (loose.length === 1) match = loose[0]
    }
    onSelect(match ? match.code : code, match || null)
  }

  return (
    <>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="เช่น RM-0001"
        className={inputClass()}
      />
      <ProductDatalist id={listId} products={products} />
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
