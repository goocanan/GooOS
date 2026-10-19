import Link from "next/link";
import { notFound } from "next/navigation";

const workspaces: Record<string, { name: string; color: string; accent: string }> = {
  "goocanan-3d": { name: "GOOCANAN 3D", color: "#8B1E3F", accent: "#D4AF37" },
  "personal-content": { name: "Personal Content", color: "#7c3aed", accent: "#c084fc" },
  "goocanan": { name: "GOOCANAN", color: "#8B1E3F", accent: "#D4AF37" },
};

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ws = workspaces[slug] || { name: slug.toUpperCase(), color: "#8B1E3F", accent: "#D4AF37" };

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
              className="w-7 h-7 rounded-md flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0)}
            </div>
            <span className="font-semibold text-slate-900">{ws.name}</span>
            <span className="text-[10px] font-semibold bg-goo-100 text-goo-700 px-2 py-0.5 rounded-full">
              Unified OS
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href={`/w/${slug}`} className="text-goo-600 font-semibold">Overview</Link>
            <Link href={`/w/${slug}/content`} className="hover:text-slate-900">Content</Link>
            <Link href={`/w/${slug}/projects`} className="hover:text-slate-900">3D Projects</Link>
            <Link href={`/w/${slug}/inventory`} className="hover:text-slate-900">Inventory</Link>
            <Link href={`/w/${slug}/printers`} className="hover:text-slate-900">Printers</Link>
            <Link href={`/w/${slug}/cad`} className="hover:text-slate-900">CAD Studio</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{ws.name} Operating System</h1>
          <p className="text-slate-500 mt-1">
            Integrated command center combining 3D Printing Operations (Flow) and Content Marketing Pipeline.
          </p>
        </div>

        {/* 3D Production Highlights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🖨️</span> 3D Workshop &amp; Operations (Flow)
            </h2>
            <Link
              href={`/w/${slug}/projects`}
              className="text-xs font-semibold text-goo-600 hover:text-goo-700"
            >
              Open 3D Studio &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <QuickModuleCard
              href={`/w/${slug}/projects`}
              title="3D Projects"
              desc="14 Projects &bull; 265 Parts"
              icon="📦"
            />
            <QuickModuleCard
              href={`/w/${slug}/batching`}
              title="Smart Batching"
              desc="7 Bed Plates Ready"
              icon="🧩"
            />
            <QuickModuleCard
              href={`/w/${slug}/inventory`}
              title="Spool Inventory"
              desc="128 Filaments Stocked"
              icon="🧵"
            />
            <QuickModuleCard
              href={`/w/${slug}/printers`}
              title="3D Farm Fleet"
              desc="3 Connected Printers"
              icon="🖨️"
            />
            <QuickModuleCard
              href={`/w/${slug}/orders`}
              title="Print Orders"
              desc="69 Total Orders"
              icon="📋"
            />
            <QuickModuleCard
              href={`/w/${slug}/calculator`}
              title="Pricing Calc"
              desc="COGS &amp; Quote Engine"
              icon="🧮"
            />
          </div>
        </div>

        {/* Content Pipeline Highlights */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🎬</span> Content Studio &amp; Social Pipeline
            </h2>
            <Link
              href={`/w/${slug}/content`}
              className="text-xs font-semibold text-goo-600 hover:text-goo-700"
            >
              Open Content Studio &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <QuickModuleCard
              href={`/w/${slug}/content`}
              title="Content Pipeline"
              desc="Ideas, Scripts &amp; Videos"
              icon="📝"
            />
            <QuickModuleCard
              href={`/w/${slug}/kanban`}
              title="Kanban Board"
              desc="Workflow Stage Tracking"
              icon="📋"
            />
            <QuickModuleCard
              href={`/w/${slug}/calendar`}
              title="Post Calendar"
              desc="Social Media Schedule"
              icon="🗓️"
            />
            <QuickModuleCard
              href={`/w/${slug}/ai`}
              title="AI Script Assistant"
              desc="Hook, Intro &amp; Caption Gen"
              icon="🤖"
            />
          </div>
        </div>

        {/* GooPrint Banner */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold">
              ✨ Next-Gen CAD Engine
            </div>
            <h3 className="text-lg font-bold">GooPrint AI &bull; Parametric 3D CAD Studio</h3>
            <p className="text-xs text-slate-300 max-w-xl">
              Design parametric Gridfinity organizers, text-to-CAD models, and topography landscape meshes directly in your browser.
            </p>
          </div>
          <Link
            href={`/w/${slug}/cad`}
            className="px-5 py-2.5 rounded-xl bg-white text-slate-900 font-semibold text-xs hover:bg-slate-100 transition-colors shadow-sm flex-shrink-0"
          >
            Launch GooPrint CAD &rarr;
          </Link>
        </div>
      </main>
    </div>
  );
}

function QuickModuleCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-goo-400 hover:shadow-md transition-all text-left block"
    >
      <div className="text-2xl mb-1.5">{icon}</div>
      <p className="font-bold text-slate-900 text-xs truncate">{title}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">{desc}</p>
    </Link>
  );
}
