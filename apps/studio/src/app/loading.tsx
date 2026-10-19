export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm w-full px-6 text-center space-y-5">
        {/* Animated Icon Ring */}
        <div className="relative w-16 h-16 flex items-center justify-center">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-rose-500/20 to-violet-500/20 blur-md animate-pulse" />
          <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl flex items-center justify-center">
            <span className="text-2xl font-black bg-gradient-to-br from-white via-rose-300 to-violet-400 bg-clip-text text-transparent">
              G
            </span>
          </div>
          {/* Subtle spinning accent */}
          <div className="absolute -inset-1.5 rounded-2xl border border-rose-500/30 border-t-transparent animate-spin [animation-duration:1.5s]" />
        </div>

        {/* Text Details */}
        <div className="space-y-1">
          <h2 className="text-sm font-bold text-white tracking-wide">
            Memuat Goo<span className="text-rose-400">OS</span>...
          </h2>
          <p className="text-xs text-slate-500 font-mono">
            Sinkronisasi data workspace &amp; modul produksi
          </p>
        </div>

        {/* Pulse bar */}
        <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div className="h-full bg-gradient-to-r from-rose-500 via-violet-500 to-rose-400 w-1/2 rounded-full animate-pulse mx-auto" />
        </div>
      </div>
    </div>
  );
}
