import Sidebar from './Sidebar'

export default function SidebarLayout({ title, children }) {
  return (
    <div className="flex min-h-screen bg-[var(--bg-page)]">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8 sm:px-10">
          <h1 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  )
}
