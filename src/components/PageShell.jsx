import TopBar from './TopBar'

export default function PageShell({ title, children }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] pb-16">
      <TopBar showBack pageTitle={title} />
      <div className="mx-auto max-w-6xl px-6 sm:px-10">
        <h1 className="mb-6 text-2xl font-bold text-white">{title}</h1>
        {children}
      </div>
    </div>
  )
}
