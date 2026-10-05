import Link from "next/link";
import { notFound } from "next/navigation";

const workspaces: Record<string, { name: string; color: string; accent: string }> = {
  "goocanan-3d": { name: "GOOCANAN 3D", color: "#8B1E3F", accent: "#D4AF37" },
  "personal-content": { name: "Personal Content", color: "#7c3aed", accent: "#c084fc" },
};

const navItems = [
  { label: "Overview", href: "", icon: "🏠" },
  { label: "Content", href: "/content", icon: "📝" },
  { label: "Kanban", href: "/kanban", icon: "📋" },
  { label: "Calendar", href: "/calendar", icon: "🗓️" },
  { label: "Assets", href: "/assets", icon: "📁" },
  { label: "Brands", href: "/brands", icon: "✨" },
  { label: "AI Assistant", href: "/ai", icon: "🤖" },
  { label: "Analytics", href: "/analytics", icon: "📈" },
  { label: "Publishing", href: "/publishing", icon: "📤" },
  { label: "Settings", href: "/settings", icon: "⚙️" },
  { label: "Members", href: "/members", icon: "👥" },
  { label: "Activity", href: "/activity", icon: "📊" },
] as const;

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ws = workspaces[slug];
  if (!ws) return notFound();

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-slate-200 bg-white hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs"
          >
            ← Back to Dashboard
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-900 leading-tight">{ws.name}</p>
              <p className="text-[11px] text-slate-400">/{slug}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={`/w/${slug}${item.href}`}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 rounded-lg bg-goo-50 text-goo-700 text-xs font-medium">
            GooOS Studio v0.1
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="px-4 h-14 flex items-center gap-3">
            <Link href="/dashboard" className="text-slate-500 text-sm">←</Link>
            <div
              className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0)}
            </div>
            <span className="font-semibold text-sm text-slate-900">{ws.name}</span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
