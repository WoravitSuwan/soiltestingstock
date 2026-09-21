import TopBar from '../components/TopBar'
import NavCard from '../components/NavCard'
import {
  WarehouseIllustration,
  TruckIllustration,
  ShelfIllustration,
  ReportIllustration,
} from '../components/DashboardIllustrations'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <TopBar />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
          <NavCard
            to="/stock-in"
            icon={<WarehouseIllustration />}
            title="Stock In"
            subtitle="Incoming Goods"
            description="Record and track incoming goods"
            glow="rgba(16,185,129,0.22)"
          />
          <NavCard
            to="/stock-out"
            icon={<TruckIllustration />}
            title="Stock Out"
            subtitle="Outgoing Goods"
            description="Record outgoing goods and issues"
            glow="rgba(180,83,9,0.24)"
          />
          <NavCard
            to="/stock"
            icon={<ShelfIllustration />}
            title="Stock"
            subtitle="Stock Management"
            description="Check stock balances and status"
            glow="rgba(37,99,235,0.24)"
          />
          <NavCard
            to="/reports"
            icon={<ReportIllustration />}
            title="Reports"
            subtitle="Reports"
            description="Summary reports and analytics"
            glow="rgba(147,51,234,0.24)"
          />
        </div>
      </div>
    </div>
  )
}
