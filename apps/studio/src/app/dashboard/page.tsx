import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-goo-600 flex items-center justify-center text-white font-bold">
              G
            </div>
            <span className="font-semibold text-slate-900">GooOS Studio</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="/dashboard" className="text-goo-600">Dashboard</Link>
            <Link href="/content" className="hover:text-slate-900">Content</Link>
            <Link href="/calendar" className="hover:text-slate-900">Calendar</Link>
            <Link href="/assets" className="hover:text-slate-900">Assets</Link>
            <Link href="/analytics" className="hover:text-slate-900">Analytics</Link>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-goo-100 text-goo-700 flex items-center justify-center text-sm font-bold">
              J
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-6">Dashboard</h1>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Content" value="24" change="+12%" />
          <StatCard label="In Review" value="5" change="-2" />
          <StatCard label="Scheduled" value="8" change="+3" />
          <StatCard label="Published (30d)" value="11" change="+18%" />
        </div>

        {/* Workspaces */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Workspaces</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <WorkspaceCard name="GOOCANAN 3D" slug="goocanan-3d" color="#8B1E3F" />
          <WorkspaceCard name="Personal Content" slug="personal-content" color="#7c3aed" />
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, change }: { label: string; value: string; change: string }) {
  const isPositive = change.startsWith("+");
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900">{value}</span>
        <span className={`text-xs font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
          {change}
        </span>
      </div>
    </div>
  );
}

function WorkspaceCard({ name, slug, color }: { name: string; slug: string; color: string }) {
  return (
    <Link
      href={`/w/${slug}`}
      className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow"
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
        style={{ backgroundColor: color }}
      >
        {name.charAt(0)}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{name}</p>
        <p className="text-xs text-slate-500">/{slug}</p>
      </div>
    </Link>
  );
}
