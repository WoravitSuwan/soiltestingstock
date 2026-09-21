import { PackagePlus, Truck, Warehouse, ClipboardList, TrendingUp, Pencil } from 'lucide-react'

export function StockInIcon() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg shadow-orange-900/40">
      <PackagePlus size={34} className="text-white" strokeWidth={2.2} />
    </div>
  )
}

export function StockOutIcon() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-lg shadow-blue-900/40">
      <Truck size={34} className="text-white" strokeWidth={2.2} />
    </div>
  )
}

export function StockIcon() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-emerald-500 to-blue-500 shadow-lg shadow-black/40">
      <Warehouse size={34} className="text-white" strokeWidth={2.2} />
    </div>
  )
}

export function ReportsIcon() {
  return (
    <div className="relative flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-slate-500 to-slate-700 shadow-lg shadow-black/40">
      <ClipboardList size={32} className="text-white" strokeWidth={2.2} />
      <div className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-orange-500 ring-2 ring-[#0d1220]">
        <Pencil size={12} className="text-white" />
      </div>
      <TrendingUp size={16} className="absolute bottom-2.5 left-2.5 text-emerald-300" />
    </div>
  )
}
