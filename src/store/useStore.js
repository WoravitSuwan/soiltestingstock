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

export const useStore = create(
  persist(
    (set, get) => ({
      products: seedProducts,
      stockIns: [],
      stockOuts: [],

      // Wipes products and every Stock In / Stock Out row (login accounts are untouched).
      clearAllData: () => set({ products: [], stockIns: [], stockOuts: [] }),

      // ---------- Products ----------
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product].sort((a, b) => thaiCompare(a.code, b.code)),
        })),

      updateProduct: (code, updates) =>
        set((state) => {
          const syncName = (t) =>
            updates.name !== undefined && t.productCode === code ? { ...t, productName: updates.name } : t
          return {
            products: state.products
              .map((p) => (p.code === code ? { ...p, ...updates } : p))
              .sort((a, b) => thaiCompare(a.code, b.code)),
            stockIns: state.stockIns.map(syncName),
            stockOuts: state.stockOuts.map(syncName),
          }
        }),

      deleteProduct: (code) =>
        set((state) => ({
          products: state.products.filter((p) => p.code !== code),
        })),

      // Applies a plan from planProductImport in one go: adds new codes, overwrites changed
      // ones with the file's data, optionally removes codes missing from the file, and keeps
      // the product name copied onto existing Stock In / Stock Out rows in sync.
      applyProductImport: (plan) =>
        set((state) => {
          const updatesByCode = new Map(plan.updated.map((u) => [u.code, u.updates]))
          const removedCodes = new Set(plan.removed.map((p) => p.code))
          const products = [
            ...state.products
              .filter((p) => !removedCodes.has(p.code))
              .map((p) => (updatesByCode.has(p.code) ? { ...p, ...updatesByCode.get(p.code) } : p)),
            ...plan.added,
          ].sort((a, b) => thaiCompare(a.code, b.code))

          const renamed = new Map(
            plan.updated.filter((u) => u.updates.name !== undefined).map((u) => [u.code, u.updates.name]),
          )
          const syncName = (t) => (renamed.has(t.productCode) ? { ...t, productName: renamed.get(t.productCode) } : t)

          return {
            products,
            stockIns: renamed.size ? state.stockIns.map(syncName) : state.stockIns,
            stockOuts: renamed.size ? state.stockOuts.map(syncName) : state.stockOuts,
          }
        }),

      getProduct: (code) => get().products.find((p) => p.code === code),

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
    }),
    {
      name: 'sts-stock-storage',
      storage: createJSONStorage(() => safeLocalStorage),
      // v1: one-time reset so the client starts testing from an empty system; data saved
      // by the earlier (v0) builds is discarded the first time v1 loads.
      version: 1,
      migrate: (persisted, version) =>
        version < 1 ? { products: [], stockIns: [], stockOuts: [] } : persisted,
    },
  ),
)

export default useStore
