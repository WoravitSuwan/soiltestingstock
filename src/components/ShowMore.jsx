import { useEffect, useState } from 'react'

// Renders long lists in chunks so ~10k products don't freeze the page.
export function useShowMore(items, step = 100, resetKey) {
  const [limit, setLimit] = useState(step)
  useEffect(() => setLimit(step), [resetKey, step])
  return {
    visible: items.length > limit ? items.slice(0, limit) : items,
    hasMore: items.length > limit,
    remaining: Math.max(items.length - limit, 0),
    showMore: () => setLimit((l) => l + step),
    showAll: () => setLimit(Infinity),
  }
}

export default function ShowMoreButton({ shown, total, remaining, onMore, onAll, step = 100 }) {
  if (remaining <= 0) return null
  return (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs text-[var(--text-muted)]">
      <span>
        แสดง {shown.toLocaleString('th-TH')} จาก {total.toLocaleString('th-TH')} รายการ
      </span>
      <button
        type="button"
        onClick={onMore}
        className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-surface-soft)] px-3 py-1.5 font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-hover-strong)]"
      >
        แสดงเพิ่มอีก {Math.min(step, remaining).toLocaleString('th-TH')}
      </button>
      {onAll && (
        <button
          type="button"
          onClick={onAll}
          className="rounded-lg px-3 py-1.5 font-medium text-[var(--text-faint)] hover:text-[var(--text-secondary)]"
        >
          แสดงทั้งหมด (อาจช้า)
        </button>
      )}
    </div>
  )
}
