import Link from "next/link";
import { notFound } from "next/navigation";

const workspaces: Record<string, { name: string; color: string; accent: string }> = {
  "goocanan-3d": { name: "GOOCANAN 3D", color: "#8B1E3F", accent: "#D4AF37" },
  "personal-content": { name: "Personal Content", color: "#7c3aed", accent: "#c084fc" },
  "goocanan": { name: "GOOCANAN", color: "#8B1E3F", accent: "#D4AF37" },
};

interface NavGroup {
  title: string;
  items: { label: string; href: string; icon: string; badge?: string }[];
}

const navGroups: NavGroup[] = [
  {
    title: "3D Flow Operations",
    items: [
      { label: "Flow Hub", href: "/flow", icon: "⚡" },
      { label: "3D Projects", href: "/projects", icon: "📦" },
      { label: "Smart Batching", href: "/batching", icon: "🧩" },
      { label: "Inventory (Spools & Assets)", href: "/inventory", icon: "🧵" },
      { label: "3D Farm Fleet", href: "/printers", icon: "🖨️" },
      { label: "Print Orders", href: "/orders", icon: "📋" },
      { label: "Product Catalog", href: "/products", icon: "🏷️" },
      { label: "Financial Ledger", href: "/transactions", icon: "💳" },
      { label: "Pricing Calculator", href: "/calculator", icon: "🧮" },
      { label: "GooPrint CAD Studio", href: "/cad", icon: "📐" },
    ],
  },
  {
    title: "Content & Marketing",
    items: [
      { label: "Overview", href: "", icon: "🏠" },
      { label: "Content Pipeline", href: "/content", icon: "📝" },
      { label: "Kanban Board", href: "/kanban", icon: "📋" },
      { label: "Post Calendar", href: "/calendar", icon: "🗓️" },
      { label: "Asset Library", href: "/assets", icon: "📁" },
      { label: "AI Script Assistant", href: "/ai", icon: "🤖" },
      { label: "Publishing Queue", href: "/publishing", icon: "📤" },
      { label: "Analytics", href: "/analytics", icon: "📈" },
    ],
  },
  {
    title: "Workspace & Team",
    items: [
      { label: "Brands", href: "/brands", icon: "✨" },
      { label: "Team Members", href: "/members", icon: "👥" },
      { label: "Activity Logs", href: "/activity", icon: "📊" },
      { label: "Settings", href: "/settings", icon: "⚙️" },
    ],
  },
];

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const ws = workspaces[slug] || { name: slug.toUpperCase(), color: "#8B1E3F", accent: "#D4AF37" };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden lg:flex flex-col">
        <div className="p-4 border-b border-slate-200">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs font-medium"
          >
            ← Back to Dashboard
          </Link>
          <div className="mt-3 flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-sm"
              style={{ backgroundColor: ws.color }}
            >
              {ws.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-sm text-slate-900 leading-tight">{ws.name}</p>
              <p className="text-[11px] text-slate-400 font-mono">/{slug}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                {group.title}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={`/w/${slug}${item.href}`}
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 rounded-lg bg-goo-50 text-goo-700 text-xs font-medium flex items-center justify-between">
            <span>GooOS Platform</span>
            <span className="text-[10px] bg-goo-200/60 px-1.5 py-0.5 rounded font-mono">Unified</span>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <header className="lg:hidden sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-200">
          <div className="px-4 h-14 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Link href="/dashboard" className="text-slate-500 text-sm">←</Link>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                style={{ backgroundColor: ws.color }}
              >
                {ws.name.charAt(0)}
              </div>
              <span className="font-bold text-sm text-slate-900">{ws.name}</span>
            </div>
            <span className="text-[10px] font-semibold bg-goo-100 text-goo-700 px-2 py-0.5 rounded-full">
              Flow 3D
            </span>
          </div>
        </header>

        {children}
      </main>
    </div>
  );
}
