import Link from "next/link";
import { notFound } from "next/navigation";

const workspaces: Record<string, { name: string; color: string; accent: string }> = {
  "goocanan-3d": { name: "GOOCANAN 3D", color: "#8B1E3F", accent: "#D4AF37" },
  "personal-content": { name: "Personal Content", color: "#7c3aed", accent: "#c084fc" },
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ws = workspaces[slug];
  if (!ws) return notFound();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 hover:text-slate-900 text-sm">
              ← Dashboard
            </Link>
            <span className="text-slate-300">|</span>
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0)}
            </div>
            <span className="font-semibold text-slate-900">{ws.name}</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <span className="text-goo-600">Overview</span>
            <span className="hover:text-slate-900 cursor-pointer">Content</span>
            <span className="hover:text-slate-900 cursor-pointer">Kanban</span>
            <span className="hover:text-slate-900 cursor-pointer">Calendar</span>
            <span className="hover:text-slate-900 cursor-pointer">Assets</span>
            <span className="hover:text-slate-900 cursor-pointer">Team</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">{ws.name}</h1>
          <p className="text-slate-500 mt-1">Workspace overview and quick actions</p>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <ActionCard label="New Content" icon="+" />
          <ActionCard label="New Idea" icon="💡" />
          <ActionCard label="Upload Asset" icon="📁" />
          <ActionCard label="Schedule Post" icon="🗓" />
        </div>

        {/* Content pipeline */}
        <h2 className="text-lg font-semibold text-slate-900 mb-4">Content Pipeline</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <PipelineColumn title="Idea" count={3} color="bg-slate-100" />
          <PipelineColumn title="In Production" count={5} color="bg-amber-50" />
          <PipelineColumn title="Review" count={2} color="bg-blue-50" />
          <PipelineColumn title="Approved" count={4} color="bg-emerald-50" />
        </div>
      </main>
    </div>
  );
}

function ActionCard({ label, icon }: { label: string; icon: string }) {
  return (
    <button className="rounded-xl border border-slate-200 bg-white p-5 text-left hover:shadow-md transition-shadow">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-medium text-slate-900">{label}</p>
    </button>
  );
}

function PipelineColumn({ title, count, color }: { title: string; count: number; color: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 ${color} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="text-xs font-medium bg-white px-2 py-0.5 rounded-full border border-slate-200">
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white border border-slate-200 p-3">
            <div className="h-3 w-3/4 bg-slate-100 rounded mb-2" />
            <div className="h-2 w-1/2 bg-slate-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
