import { useStore } from '../store/useStore'
import { inputClass } from './FormField'

// Product-code input with datalist autocomplete; auto-fills product name on selection.
export default function ProductCodeField({ value, onSelect, listId = 'product-codes' }) {
  const products = useStore((s) => s.products)

  function handleChange(code) {
    const match = products.find((p) => p.code.toLowerCase() === code.toLowerCase())
    onSelect(code, match || null)
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
      <datalist id={listId}>
        {products.map((p) => (
          <option key={p.code} value={p.code}>
            {p.name}
          </option>
        ))}
      </datalist>
    </>
  )
}
