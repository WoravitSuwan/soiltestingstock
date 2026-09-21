import TopBar from '../components/TopBar'
import NavCard from '../components/NavCard'
import { StockInIcon, StockOutIcon, StockIcon, ReportsIcon } from '../components/DashboardIcons'

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      <TopBar />

      <div className="mx-auto max-w-5xl px-6 pb-16 pt-6 sm:px-10">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <NavCard
            to="/stock-in"
            icon={<StockInIcon />}
            title="Stock In"
            subtitle="Incoming Goods"
            description="Record and track incoming goods"
          />
          <NavCard
            to="/stock-out"
            icon={<StockOutIcon />}
            title="Stock Out"
            subtitle="Outgoing Goods"
            description="Record outgoing goods and issues"
          />
          <NavCard
            to="/stock"
            icon={<StockIcon />}
            title="Stock"
            subtitle="Stock Management"
            description="Check stock balances and status"
          />
          <NavCard
            to="/reports"
            icon={<ReportsIcon />}
            title="Reports"
            subtitle="Reports"
            description="Summary reports and analytics"
          />
        </div>
      </div>
    </div>
  )
}
