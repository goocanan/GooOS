import { useState, type FormEvent } from 'react'
import { Sparkles, AlertTriangle, LogIn, UserPlus, ArrowLeft } from 'lucide-react'
import { useStore } from '@/lib/store'
import { Button, Field, Input, Card } from '@/components/ui'

/**
 * Sign-in / sign-up gate.
 *
 * Shown whenever /api/session returns 401. The seeded demo account is offered
 * as a one-click fill so the app can be explored immediately.
 */
export default function Login() {
  const { signIn, signUp, state, toast } = useStore()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('james@goocanan3d.com')
  const [password, setPassword] = useState('gooos123')
  const [name, setName] = useState('')
  const [workspaceName, setWorkspaceName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'signin') {
        await signIn(email, password)
        toast('Selamat datang kembali')
      } else {
        await signUp({
          name,
          email,
          password,
          workspaceName: workspaceName || undefined,
        })
        toast('Workspace dibuat. Selamat datang!')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setBusy(false)
    }
  }

  if (state.status === 'error') {
    return (
      <div className="flex min-h-dvh items-center justify-center p-6">
        <Card className="max-w-md p-6">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <h1 className="text-[15px] font-semibold">API tidak bisa dihubungi</h1>
          </div>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-400">{state.bootError}</p>
          <div className="mt-4 rounded-lg border border-ink-700 bg-ink-850 p-3 font-mono text-[11px] text-ink-400">
            <p>Jalankan API server di terminal lain:</p>
            <p className="mt-1 text-brand-300">npm run dev:api</p>
          </div>
          <Button variant="secondary" size="sm" className="mt-4 w-full" onClick={() => window.location.reload()}>
            <ArrowLeft className="h-3.5 w-3.5" />
            Coba lagi
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink-950 p-6">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="relative mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 shadow-lg shadow-brand-900/40">
            <span className="text-sm font-extrabold tracking-tight text-white">CF</span>
          </div>
          <h1 className="text-[18px] font-semibold tracking-tight text-ink-100">GooOS</h1>
          <p className="mt-1 text-[12px] text-ink-400">
            {mode === 'signin'
              ? 'Masuk untuk melanjutkan produksi konten.'
              : 'Buat akun dan workspace pertama Anda.'}
          </p>
        </div>

        <Card className="p-5">
          <form onSubmit={submit} className="space-y-3.5">
            {mode === 'signup' && (
              <>
                <Field label="Nama">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama Anda" required />
                </Field>
                <Field label="Nama workspace" hint="Opsional, bisa diubah nanti">
                  <Input
                    value={workspaceName}
                    onChange={(e) => setWorkspaceName(e.target.value)}
                    placeholder="Contoh: GOOCANAN 3D"
                  />
                </Field>
              </>
            )}

            <Field label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@perusahaan.com"
                required
                autoComplete="email"
              />
            </Field>

            <Field label="Password" hint={mode === 'signup' ? 'Minimal 8 karakter' : undefined}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
              />
            </Field>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <p className="text-[12px] leading-relaxed text-red-300">{error}</p>
              </div>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" loading={busy}>
              {mode === 'signin' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {mode === 'signin' ? 'Masuk' : 'Buat akun'}
            </Button>
          </form>

          <div className="mt-4 border-t border-ink-800 pt-4 text-center">
            <button
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin')
                setError(null)
              }}
              className="text-[12px] text-ink-400 transition-colors hover:text-ink-200"
            >
              {mode === 'signin' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
            </button>
          </div>
        </Card>

        <div className="mt-4 flex items-start gap-2 rounded-lg border border-ink-800 bg-ink-900/60 px-3 py-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold-400" />
          <p className="text-[11px] leading-relaxed text-ink-400">
            Akun demo sudah terisi di atas: <span className="font-medium text-ink-200">james@goocanan3d.com</span> /
            <span className="font-medium text-ink-200">gooos123</span>. Jalankan <span className="font-mono text-[10px] text-brand-300">npm run seed</span>
            untuk membuat ulang.
          </p>
        </div>
      </div>
    </div>
  )
}