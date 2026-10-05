import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <section className="relative flex-1 flex flex-col items-center justify-center px-6 py-24 bg-gradient-to-br from-goo-50 via-white to-goo-100">
        <div className="max-w-3xl text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-goo-100 text-goo-700 text-sm font-medium">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-goo-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-goo-600" />
            </span>
            Beta v0.1
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900">
            GooOS{" "}
            <span className="text-goo-600">Studio</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Operating System for Your Content &amp; Production Workflow.
            Manage workspaces, brands, content pipeline, and analytics — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-goo-600 text-white font-semibold hover:bg-goo-700 transition-colors shadow-lg shadow-goo-200"
            >
              Open Studio
            </Link>
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white text-slate-700 font-semibold border border-slate-200 hover:bg-slate-50 transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Workspaces preview */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Your Workspaces</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <WorkspaceCard
              name="GOOCANAN 3D"
              slug="goocanan-3d"
              color="#8B1E3F"
              accent="#D4AF37"
              description="Precision in Every Layer — 3D Printing & Content"
            />
            <WorkspaceCard
              name="KOPER SI MAMI"
              slug="koper-si-mami"
              color="#FFB6C1"
              accent="#B76E79"
              description="Fashion brand — pastel pink & rose gold"
            />
            <WorkspaceCard
              name="Personal Content"
              slug="personal-content"
              color="#7c3aed"
              accent="#c084fc"
              description="Personal content creation workspace"
            />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 border-t border-slate-100 text-center text-sm text-slate-500">
        © 2026 GOOCANAN · GooOS Studio · Precision in Every Workflow
      </footer>
    </main>
  );
}

function WorkspaceCard({
  name,
  slug,
  color,
  accent,
  description,
}: {
  name: string;
  slug: string;
  color: string;
  accent: string;
  description: string;
}) {
  return (
    <Link
      href={`/w/${slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-6 hover:shadow-lg hover:border-goo-200 transition-all"
    >
      <div className="flex items-center gap-4 mb-4">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
          style={{ backgroundColor: color }}
        >
          {name.charAt(0)}
        </div>
        <div>
          <h3 className="font-semibold text-slate-900">{name}</h3>
          <p className="text-xs text-slate-500">/{slug}</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      <div
        className="mt-4 h-1 w-12 rounded-full"
        style={{ backgroundColor: accent }}
      />
    </Link>
  );
}
