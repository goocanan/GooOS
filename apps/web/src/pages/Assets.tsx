import { useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Upload,
  Folder,
  FolderOpen,
  Grid3x3,
  List as ListIcon,
  Trash2,
  Search,
  HardDrive,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Box,
  Download,
  X,
  Copy,
  Move,
} from 'lucide-react'
import { useStore, reportErrorHelper } from '@/lib/store'
import { PageBody, PageHeader, FilterChip } from '@/components/page'
import {
  Badge,
  Button,
  Card,
  Dropdown,
  EmptyState,
  Input,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  Modal,
  Progress,
  useDebounced,
} from '@/components/ui'
import type { Asset } from '@/lib/types'
import { bytes, cn, duration, fmtDate, relTime } from '@/lib/utils'

const KIND_ICON = {
  video: Video,
  image: ImageIcon,
  audio: Music,
  document: FileText,
  model: Box,
} as const

const ACCEPT = '.jpg,.jpeg,.png,.webp,.gif,.mp4,.mov,.pdf,.stl,.3mf,.zip,.wav,.mp3'

export default function Assets() {
  const { state, workspaceAssets } = useStore()
  const [params, setParams] = useSearchParams()
  const [folder, setFolder] = useState<string>('all')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q, 200)
  const [kind, setKind] = useState<Asset['kind'] | 'all'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [preview, setPreview] = useState<Asset | null>(null)

  const folders = useMemo(() => {
    const map = new Map<string, number>()
    workspaceAssets.forEach((a) => map.set(a.folder, (map.get(a.folder) ?? 0) + 1))
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([name, count], i) => ({
        name,
        count,
        color: ['#e3bf5f', '#38bdf8', '#34d399', '#f472b6', '#a78bfa', '#f59e0b', '#94a3b8', '#d23a67'][i % 8]!,
      }))
  }, [workspaceAssets])

  const filtered = useMemo(() => {
    let list = workspaceAssets
    if (folder !== 'all') list = list.filter((a) => a.folder === folder)
    if (kind !== 'all') list = list.filter((a) => a.kind === kind)
    if (debouncedQ) {
      const term = debouncedQ.toLowerCase()
      list = list.filter((a) => `${a.name} ${a.folder} ${a.tags.join(' ')}`.toLowerCase().includes(term))
    }
    return list
  }, [workspaceAssets, folder, kind, debouncedQ])

  const selectedId = preview?.id ?? params.get('asset')
  const selected = workspaceAssets.find((a) => a.id === selectedId)

  const totalKb = workspaceAssets.reduce((a, b) => a + b.sizeKb, 0)

  return (
    <>
      <PageHeader
        title="Asset Library"
        description={`${workspaceAssets.length} file - ${bytes(totalKb)} - folder ${folders.length}`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>
        }
      />

      <PageBody>
        <div className="grid gap-5 lg:grid-cols-[212px_minmax(0,1fr)]">
          {/* Folder sidebar */}
          <div className="space-y-4">
            <Card className="overflow-hidden">
              <div className="border-b border-ink-800 px-3 py-2.5">
                <h3 className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">Folders</h3>
              </div>
              <nav className="p-1.5">
                <button
                  onClick={() => setFolder('all')}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors',
                    folder === 'all' ? 'bg-ink-750 text-ink-100' : 'text-ink-400 hover:bg-ink-850',
                  )}
                >
                  <HardDrive className="h-3.5 w-3.5 shrink-0" />
                  <span className="flex-1 truncate">Semua file</span>
                  <span className="text-[10px] tabular-nums text-ink-600">{workspaceAssets.length}</span>
                </button>
                {folders.map((f) => (
                  <button
                    key={f.name}
                    onClick={() => setFolder(f.name)}
                    className={cn(
                      'mt-0.5 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[12px] transition-colors',
                      folder === f.name ? 'bg-ink-750 text-ink-100' : 'text-ink-400 hover:bg-ink-850',
                    )}
                  >
                    {folder === f.name ? (
                      <FolderOpen className="h-3.5 w-3.5 shrink-0" style={{ color: f.color }} />
                    ) : (
                      <Folder className="h-3.5 w-3.5 shrink-0" style={{ color: f.color }} />
                    )}
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-[10px] tabular-nums text-ink-600">{f.count}</span>
                  </button>
                ))}
              </nav>
            </Card>

            <Card className="p-3">
              <div className="flex items-center gap-2 text-[11px] text-ink-400">
                <HardDrive className="h-3.5 w-3.5" />
                Storage
              </div>
              <Progress
                value={(workspaceAssets.reduce((a, b) => a + b.sizeKb, 0) / (50 * 1024 * 1024)) * 100}
                height={4}
                color="#d4af37"
                className="mt-2"
              />
              <div className="mt-1.5 text-[10px] text-ink-600">{bytes(totalKb)} dari 50 GB</div>
            </Card>
          </div>

          {/* Main */}
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-0 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search files..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {(['all', 'image', 'video', 'document', 'model', 'audio'] as const).map((k) => (
                  <FilterChip
                    key={k}
                    active={kind === k}
                    onClick={() => setKind(k)}
                    count={k === 'all' ? workspaceAssets.length : workspaceAssets.filter((a) => a.kind === k).length}
                  >
                    {k === 'all' ? 'Semua' : k}
                  </FilterChip>
                ))}
              </div>
              <div className="ml-auto flex items-center rounded-lg border border-ink-700 bg-ink-900 p-0.5">
                <button
                  onClick={() => setView('grid')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md',
                    view === 'grid' ? 'bg-ink-750 text-ink-100' : 'text-ink-400',
                  )}
                >
                  <Grid3x3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setView('list')}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-md',
                    view === 'list' ? 'bg-ink-750 text-ink-100' : 'text-ink-400',
                  )}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {filtered.length === 0 ? (
              <Card>
                <EmptyState
                  icon={<Upload className="h-5 w-5" />}
                  title="Belum ada file"
                  description="Upload JPG, PNG, WEBP, GIF, MP4, MOV, PDF, STL, atau 3MF."
                  action={
                    <Button size="sm" variant="primary" onClick={() => setUploadOpen(true)}>
                      <Upload className="h-3.5 w-3.5" />
                      Upload file
                    </Button>
                  }
                />
              </Card>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                {filtered.map((a) => (
                  <AssetTile key={a.id} asset={a} onOpen={() => setPreview(a)} />
                ))}
              </div>
            ) : (
              <Card className="divide-y divide-ink-800">
                {filtered.map((a) => {
                  const uploader = state.users.find((u) => u.id === a.uploaderId)
                  const Icon = KIND_ICON[a.kind]
                  return (
                    <button
                      key={a.id}
                      onClick={() => setPreview(a)}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-ink-850"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                        style={{ background: `color-mix(in oklab, ${a.color} 20%, transparent)`, color: a.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12px] font-medium text-ink-100">{a.name}</span>
                        <span className="text-[10px] text-ink-500">
                          {a.ext.toUpperCase()} - {bytes(a.sizeKb)}
                          {a.resolution ? ` - ${a.resolution}` : ''}
                          {a.durationSec ? ` - ${duration(a.durationSec)}` : ''}
                        </span>
                      </span>
                      <span className="hidden shrink-0 sm:block">
                        <Badge color="#6b6b85" size="xs">
                          {a.folder}
                        </Badge>
                      </span>
                      <span className="hidden shrink-0 text-[10px] text-ink-600 md:block">{uploader?.name}</span>
                      <span className="shrink-0 text-[10px] text-ink-600">{relTime(a.uploadedAt)}</span>
                    </button>
                  )
                })}
              </Card>
            )}
          </div>
        </div>
      </PageBody>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} folders={folders.map((f) => f.name)} />

      <Modal
        open={Boolean(selected)}
        onClose={() => {
          setPreview(null)
          setParams({})
        }}
        size="lg"
        title={selected?.name}
        subtitle={selected ? `${selected.ext.toUpperCase()} - ${bytes(selected.sizeKb)}` : ''}
      >
        {selected && <AssetDetail asset={selected} />}
      </Modal>
    </>
  )
}

function AssetTile({ asset, onOpen }: { asset: Asset; onOpen: () => void }) {
  const { actions, toast } = useStore()
  const Icon = KIND_ICON[asset.kind]
  const color = asset.color

  return (
    <div className="group relative">
      <button onClick={onOpen} className="block w-full text-left">
        <div
          className="relative aspect-square overflow-hidden rounded-xl border border-ink-700/70 transition-colors group-hover:border-ink-600"
          style={{ background: `linear-gradient(145deg, ${color}33, ${color}12)` }}
        >
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '18px 18px',
            }}
          />
          <span
            className="absolute inset-0 flex items-center justify-center"
            style={{ color }}
          >
            <Icon className="h-8 w-8" strokeWidth={1.4} />
          </span>
          <span className="absolute left-1.5 top-1.5 rounded bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold uppercase text-white/80 backdrop-blur-sm">
            {asset.ext}
          </span>
          {asset.durationSec && (
            <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[9px] text-white/90">
              {duration(asset.durationSec)}
            </span>
          )}
        </div>
        <div className="mt-2">
          <div className="truncate text-[11px] font-medium text-ink-100">{asset.name}</div>
          <div className="text-[10px] text-ink-500">
            {bytes(asset.sizeKb)} - {relTime(asset.uploadedAt)}
          </div>
        </div>
      </button>
      <div className="absolute right-1.5 top-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <Dropdown
          width={190}
          trigger={({ toggle }) => (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggle()
              }}
              className="flex h-6 w-6 items-center justify-center rounded-md bg-black/55 text-white/85 backdrop-blur-sm hover:bg-black/75"
            >
              ⋮
            </button>
          )}
        >
          {(close) => (
            <>
              <MenuLabel>{asset.name}</MenuLabel>
              <MenuItem
                icon={<Copy className="h-3.5 w-3.5" />}
                onClick={() => {
                  navigator.clipboard?.writeText(asset.name)
                  toast('Nama file disalin')
                  close()
                }}
              >
                Copy nama file
              </MenuItem>
              <MenuItem
                icon={<Download className="h-3.5 w-3.5" />}
                onClick={() => {
                  toast('Download dimulai (simulasi)', 'info')
                  close()
                }}
              >
                Download
              </MenuItem>
              <MenuItem
                icon={<Move className="h-3.5 w-3.5" />}
                onClick={() => {
                  const target = asset.folder === 'Video' ? 'Thumbnail' : 'Video'
                  void actions.updateAsset(asset.id, { folder: target })
                  toast(`Dipindahkan ke ${target}`)
                  close()
                }}
              >
                Pindahkan folder
              </MenuItem>
              <MenuSeparator />
              <MenuItem
                danger
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={() => {
                  void actions.deleteAsset(asset.id)
                  toast('Asset dihapus', 'warn')
                  close()
                }}
              >
                Hapus asset
              </MenuItem>
            </>
          )}
        </Dropdown>
      </div>
    </div>
  )
}

function AssetDetail({ asset }: { asset: Asset }) {
  const { state, actions, toast } = useStore()
  const uploader = state.users.find((u) => u.id === asset.uploaderId)
  const usedBy = state.contents.filter((c) => c.assetIds.includes(asset.id))
  const Icon = KIND_ICON[asset.kind]

  return (
    <div className="grid gap-5 sm:grid-cols-[200px_minmax(0,1fr)]">
      <div
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-ink-700"
        style={{ background: `linear-gradient(145deg, ${asset.color}33, ${asset.color}10)` }}
      >
        <Icon className="h-12 w-12" style={{ color: asset.color }} strokeWidth={1.2} />
        <span className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-semibold uppercase text-white/80">
          {asset.ext}
        </span>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-ink-700 bg-ink-700 sm:grid-cols-3">
          {[
            { label: 'Size', value: bytes(asset.sizeKb) },
            { label: 'Resolution', value: asset.resolution ?? '-' },
            { label: 'Duration', value: duration(asset.durationSec) },
            { label: 'Folder', value: asset.folder },
            { label: 'Uploaded', value: fmtDate(asset.uploadedAt) },
            { label: 'Uploader', value: uploader?.name.split(' ')[0] ?? '-' },
          ].map((s) => (
            <div key={s.label} className="bg-ink-900 px-3 py-2.5">
              <div className="text-[9px] uppercase tracking-wider text-ink-500">{s.label}</div>
              <div className="mt-0.5 truncate text-[12px] font-medium text-ink-100">{s.value}</div>
            </div>
          ))}
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">Tags</div>
          <div className="flex flex-wrap gap-1">
            {asset.tags.map((t) => (
              <Badge key={t} color="#6b6b85" size="xs">
                #{t}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink-500">
            Used by ({usedBy.length})
          </div>
          {usedBy.length === 0 ? (
            <p className="text-[11px] text-ink-600">Asset ini belum dipakai di konten manapun.</p>
          ) : (
            <div className="space-y-1">
              {usedBy.map((c) => (
                <Link
                  key={c.id}
                  to={`/content/${c.id}`}
                  className="flex items-center gap-2 rounded-lg border border-ink-800 bg-ink-850/60 px-2.5 py-2 transition-colors hover:border-ink-600"
                >
                  <span className="h-6 w-1 shrink-0 rounded-full" style={{ background: c.thumbnailColor }} />
                  <span className="min-w-0 flex-1 truncate text-[11px] text-ink-200">{c.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-ink-600">#{c.ref}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              void actions.deleteAsset(asset.id)
              toast('Asset dihapus', 'warn')
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </Button>
        </div>
      </div>
    </div>
  )
}

function UploadModal({
  open,
  onClose,
  folders,
}: {
  open: boolean
  onClose: () => void
  folders: string[]
}) {
  const { actions, toast } = useStore()
  const report = reportErrorHelper(toast)
  const inputRef = useRef<HTMLInputElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [folder, setFolder] = useState(folders[0] ?? 'Video')
  const [tags, setTags] = useState('')
  const [dragging, setDragging] = useState(false)

  const addFiles = (list: FileList | null) => {
    if (!list) return
    setFiles((prev) => [...prev, ...Array.from(list)])
  }

  /** Real multipart upload: the API stores the bytes and derives kind/size. */
  const [busy, setBusy] = useState(false)

  const upload = async () => {
    if (files.length === 0) return
    setBusy(true)
    try {
      await actions.uploadAssets(files, { folder, tags })
      toast(`${files.length} file diupload ke folder ${folder}`)
      setFiles([])
      setTags('')
      onClose()
    } catch (err) {
      report(err, 'Upload gagal')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
      title="Upload asset"
      subtitle="Mendukung JPG, PNG, WEBP, GIF, MP4, MOV, PDF, STL, 3MF, ZIP."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Batal
          </Button>
          <Button variant="primary" onClick={upload} disabled={files.length === 0} loading={busy}>
            <Upload className="h-3.5 w-3.5" />
            Upload {files.length > 0 && `${files.length} file`}
          </Button>
        </>
      }
    >
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragging ? 'border-brand-500 bg-brand-950/30' : 'border-ink-700 hover:border-ink-600',
        )}
      >
        <Upload className="mx-auto h-6 w-6 text-ink-500" />
        <p className="mt-2 text-[13px] text-ink-300">Drag file ke sini atau klik untuk memilih</p>
        <p className="mt-1 text-[11px] text-ink-600">Maksimum 2 GB per file pada plan Pro</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-2.5 rounded-lg border border-ink-800 bg-ink-850/60 px-3 py-2">
              <FileText className="h-3.5 w-3.5 shrink-0 text-ink-500" />
              <span className="min-w-0 flex-1 truncate text-[11px] text-ink-200">{f.name}</span>
              <span className="shrink-0 text-[10px] text-ink-600">{bytes(Math.round(f.size / 1024))}</span>
              <button
                onClick={() => setFiles((prev) => prev.filter((_, idx) => idx !== i))}
                className="shrink-0 text-ink-600 hover:text-red-400"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">Folder</span>
          <div className="flex flex-wrap gap-1.5">
            {folders.map((f) => (
              <button
                key={f}
                onClick={() => setFolder(f)}
                className={cn(
                  'rounded-md border px-2 py-1 text-[11px] transition-colors',
                  folder === f
                    ? 'border-brand-500/50 bg-brand-600/15 text-brand-100'
                    : 'border-ink-700 text-ink-400 hover:border-ink-600',
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-ink-400">Tags</span>
          <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="product, b-roll" />
        </div>
      </div>
    </Modal>
  )
}