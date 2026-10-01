import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { thaiCompare } from '../utils/format'
import { genId } from '../utils/id'

// The system starts empty; products come from PRODUCT LIST (Add product / Import Excel).
const seedProducts = []

// localStorage holds ~5M characters per site; ~10k products take about 1M. If a save
// ever fails (quota, private mode) tell the user instead of silently losing data.
let warnedSaveFailure = false
const safeLocalStorage = {
  getItem: (name) => localStorage.getItem(name),
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value)
    } catch {
      if (!warnedSaveFailure) {
        warnedSaveFailure = true
        alert('บันทึกข้อมูลลงเครื่องไม่สำเร็จ (พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็ม) — ข้อมูลล่าสุดอาจหายเมื่อรีเฟรชหน้า')
      }
    }
  },
  removeItem: (name) => localStorage.removeItem(name),
}

// A movement "belongs" to a product by productId when linked, falling back to its
// stored productCode for legacy rows created before products had ids.
function belongsToProduct(t, product) {
  return t.productId ? t.productId === product.id : t.productCode === product.code
}

export const useStore = create(
  persist(
    (set, get) => ({
      products: seedProducts,
      stockIns: [],
      stockOuts: [],
      importBatches: [],

      // Wipes products and every Stock In / Stock Out row (login accounts are untouched).
      clearAllData: () => set({ products: [], stockIns: [], stockOuts: [], importBatches: [] }),

      // ---------- Products ----------
      // รหัสสินค้า is the human-facing business key and must stay unique, but every
      // product also gets a permanent internal id — Stock In/Out rows link to that id,
      // so renaming or (after a merge) reusing a code never confuses which product a
      // historical movement belongs to.
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, { ...product, id: product.id ?? genId('PROD') }].sort((a, b) =>
            thaiCompare(a.code, b.code),
          ),
        })),

      updateProduct: (id, updates) =>
        set((state) => {
          const current = state.products.find((p) => p.id === id)
          if (!current) return state
          const patch = {}
          if (updates.name !== undefined) patch.productName = updates.name
          if (updates.code !== undefined) patch.productCode = updates.code
          const syncMovement = (t) => {
            if (!belongsToProduct(t, current)) return t
            return { ...t, ...patch, productId: id }
          }
          return {
            products: state.products
              .map((p) => (p.id === id ? { ...p, ...updates } : p))
              .sort((a, b) => thaiCompare(a.code, b.code)),
            stockIns: state.stockIns.map(syncMovement),
            stockOuts: state.stockOuts.map(syncMovement),
          }
        }),

      deleteProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
        })),

      // Folds every record in `mergeIds` into `keepId`: their Stock In/Out history is
      // repointed to the kept product (by productId when linked, otherwise by matching
      // the merged records' code — safe here because we already know exactly which
      // records are being merged) and the duplicate product records are removed.
      mergeProducts: (keepId, mergeIds) =>
        set((state) => {
          const mergeSet = new Set(mergeIds)
          const keep = state.products.find((p) => p.id === keepId)
          if (!keep) return state
          const merged = state.products.filter((p) => mergeSet.has(p.id))
          const repoint = (t) => {
            const belongsToMerged = t.productId
              ? mergeSet.has(t.productId)
              : merged.some((p) => p.code === t.productCode)
            if (!belongsToMerged) return t
            return { ...t, productId: keepId, productCode: keep.code, productName: keep.name }
          }
          return {
            products: state.products.filter((p) => !mergeSet.has(p.id)),
            stockIns: state.stockIns.map(repoint),
            stockOuts: state.stockOuts.map(repoint),
          }
        }),

      // Applies a plan from planProductImport in one go: adds new codes, overwrites changed
      // ones with the file's data, optionally removes codes missing from the file, and keeps
      // the product name copied onto existing Stock In / Stock Out rows in sync.
      applyProductImport: (plan) =>
        set((state) => {
          const updatesByCode = new Map(plan.updated.map((u) => [u.code, u.updates]))
          const removedCodes = new Set(plan.removed.map((p) => p.code))
          const idsByCode = new Map(state.products.map((p) => [p.code, p.id]))
          const addedWithIds = plan.added.map((p) => ({ ...p, id: p.id ?? genId('PROD') }))
          const products = [
            ...state.products
              .filter((p) => !removedCodes.has(p.code))
              .map((p) => (updatesByCode.has(p.code) ? { ...p, ...updatesByCode.get(p.code) } : p)),
            ...addedWithIds,
          ].sort((a, b) => thaiCompare(a.code, b.code))

          const renamed = new Map(
            plan.updated.filter((u) => u.updates.name !== undefined).map((u) => [u.code, u.updates.name]),
          )
          const syncName = (t) => {
            if (!renamed.has(t.productCode)) return t
            return { ...t, productName: renamed.get(t.productCode), productId: t.productId ?? idsByCode.get(t.productCode) }
          }

          return {
            products,
            stockIns: renamed.size ? state.stockIns.map(syncName) : state.stockIns,
            stockOuts: renamed.size ? state.stockOuts.map(syncName) : state.stockOuts,
          }
        }),

      getProduct: (id) => get().products.find((p) => p.id === id),

      // ---------- Stock In ----------
      addStockIn: (entry) =>
        set((state) => ({
          stockIns: [...state.stockIns, { ...entry, id: genId('IN') }],
        })),

      updateStockIn: (id, updates) =>
        set((state) => ({
          stockIns: state.stockIns.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteStockIn: (id) =>
        set((state) => ({
          stockIns: state.stockIns.filter((t) => t.id !== id),
        })),

      // ---------- Stock Out ----------
      addStockOut: (entry) =>
        set((state) => ({
          stockOuts: [...state.stockOuts, { ...entry, id: genId('OUT') }],
        })),

      updateStockOut: (id, updates) =>
        set((state) => ({
          stockOuts: state.stockOuts.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        })),

      deleteStockOut: (id) =>
        set((state) => ({
          stockOuts: state.stockOuts.filter((t) => t.id !== id),
        })),

      // ---------- Stock import (ยอดยกมา / ซื้อ / ออก, by year) ----------
      // Products in `newProducts` are created if their code doesn't already exist;
      // existing products are never modified. `stockRows` are always appended as new
      // Stock In / Stock Out rows (each already carrying productId + movementType from
      // planStockImport) — importing a year never overwrites or removes anything from a
      // previously-imported year.
      applyStockImport: ({ type, year, fileName, newProducts, stockRows }) =>
        set((state) => {
          const existingCodes = new Set(state.products.map((p) => p.code))
          const products = [
            ...state.products,
            ...newProducts.filter((p) => !existingCodes.has(p.code)),
          ].sort((a, b) => thaiCompare(a.code, b.code))

          const key = type === 'out' ? 'stockOuts' : 'stockIns'
          const idPrefix = type === 'out' ? 'OUT' : 'IN'
          const newRows = stockRows.map((r) => ({
            ...r,
            id: genId(idPrefix),
            source: 'import',
            importBatchId: null, // filled in below once the batch id is known
          }))
          const batch = {
            id: genId('BATCH'),
            type,
            year,
            fileName,
            rowCount: newRows.length,
            newProductCount: newProducts.length,
            importedAt: new Date().toISOString(),
          }
          newRows.forEach((r) => { r.importBatchId = batch.id })

          return {
            products,
            [key]: [...state[key], ...newRows],
            importBatches: [...state.importBatches, batch],
          }
        }),

      hasImportedYear: (type, year) =>
        get().importBatches.some((b) => b.type === type && b.year === year),
    }),
    {
      name: 'sts-stock-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      // v1: one-time reset so the client starts testing from an empty system; data saved
      // by the earlier (v0) builds is discarded the first time v1 loads.
      // v2: products gain a permanent `id` (backfilled here for anyone already on v1);
      // Stock In/Out rows get `productId` opportunistically backfilled wherever their
      // productCode matches exactly one product (an ambiguous code — a pre-existing
      // duplicate — is left for the Duplicate Code tool to resolve, not guessed here).
      version: 2,
      migrate: (persisted, version) => {
        if (version < 1) return { products: [], stockIns: [], stockOuts: [], importBatches: [] }
        const products = (persisted.products ?? []).map((p) => (p.id ? p : { ...p, id: genId('PROD') }))
        const idsByCode = new Map()
        products.forEach((p) => {
          const list = idsByCode.get(p.code)
          if (list) list.push(p.id)
          else idsByCode.set(p.code, [p.id])
        })
        const backfillMovement = (t) => {
          if (t.productId) return t
          const ids = idsByCode.get(t.productCode)
          return ids && ids.length === 1 ? { ...t, productId: ids[0] } : t
        }
        return {
          ...persisted,
          products,
          stockIns: (persisted.stockIns ?? []).map(backfillMovement),
          stockOuts: (persisted.stockOuts ?? []).map(backfillMovement),
        }
      },
    },
  ),
)

export default useStore
