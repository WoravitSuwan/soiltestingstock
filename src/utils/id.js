export function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// A real UUID, for rows going into Supabase tables whose primary key is `uuid` — needed
// whenever the client must know a row's id before it's inserted (e.g. a stock-import
// batch that creates a product and its movement rows together, client-side, before any
// of it has touched the database).
export function genUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
