import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { thaiCompare } from '../utils/format'
import { genId } from '../utils/id'

const seedProducts = [
  {
    code: 'RM-0001',
    name: 'ทรายมาตรฐาน (Standard Sand)',
    category: 'วัตถุดิบ',
    unit: 'กก.',
    unitPrice: 25,
    openingQty: 500,
  },
  {
    code: 'RM-0002',
    name: 'ปูนซีเมนต์ปอร์ตแลนด์',
    category: 'วัตถุดิบ',
    unit: 'กระสอบ',
    unitPrice: 180,
    openingQty: 120,
  },
  {
    code: 'EQ-0001',
    name: 'ชุดตรวจสอบดิน Proctor Test',
    category: 'อุปกรณ์',
    unit: 'ชุด',
    unitPrice: 4500,
    openingQty: 10,
  },
]

export const useStore = create(
  persist(
    (set, get) => ({
      products: seedProducts,
      stockIns: [],
      stockOuts: [],

      // ---------- Products ----------
      addProduct: (product) =>
        set((state) => ({
          products: [...state.products, product].sort((a, b) => thaiCompare(a.code, b.code)),
        })),

      updateProduct: (code, updates) =>
        set((state) => ({
          products: state.products
            .map((p) => (p.code === code ? { ...p, ...updates } : p))
            .sort((a, b) => thaiCompare(a.code, b.code)),
        })),

      deleteProduct: (code) =>
        set((state) => ({
          products: state.products.filter((p) => p.code !== code),
        })),

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
    },
  ),
)

export default useStore
