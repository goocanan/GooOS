import { useMemo } from 'react'
import { cn, clamp, toLocalInput } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Line / area chart (dependency free)
// ---------------------------------------------------------------------------

export interface Series {
  key: string
  label: string
  color: string
  points: { x: number; y: number }[]
  area?: boolean
  dashed?: boolean
  /** Plot against the right-hand axis instead of the left one. */
  axis?: 'left' | 'right'
}

export function LineChart({
  series,
  height = 180,
  yFormat = (v) => String(Math.round(v)),
  y2Format,
  xLabels,
  yTicks = 4,
  className,
  tooltipFormatter,
}: {
  series: Series[]
  height?: number
  yFormat?: (v: number) => string
  y2Format?: (v: number) => string
  xLabels?: string[]
  yTicks?: number
  className?: string
  tooltipFormatter?: (s: Series, v: number) => string
}) {
  const W = 700
  const H = height
  const hasRight = series.some((s) => s.axis === 'right')
  const padL = 44
  const padR = hasRight ? 52 : 12
  const padT = 12
  const padB = 24

  const left = series.filter((s) => s.axis !== 'right')
  const right = series.filter((s) => s.axis === 'right')
  const primary = left.length ? left : series

  const all = series.flatMap((s) => s.points)
  const xs = all.map((p) => p.x)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)

  const bounds = (list: Series[]) => {
    const ys = list.flatMap((s) => s.points.map((p) => p.y))
    if (!ys.length) return { min: 0, max: 1 }
    const max = Math.max(...ys)
    const min = Math.min(0, ...ys)
    return { min: min * 0.9, max: (max * 1.1) || 1 }
  }

  const L = bounds(primary)
  const R = bounds(right)

  const sx = (x: number) => padL + ((x - minX) / (maxX - minX || 1)) * (W - padL - padR)
  const makeSy = (b: { min: number; max: number }) => (y: number) =>
    padT + (1 - (y - b.min) / (b.max - b.min || 1)) * (H - padT - padB)

  const sy = makeSy(L)
  const sy2 = makeSy(R)

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => L.min + ((L.max - L.min) * i) / yTicks)
  const ticks2 = hasRight
    ? Array.from({ length: yTicks + 1 }, (_, i) => R.min + ((R.max - R.min) * i) / yTicks)
    : []

  return (
    <div className={cn('relative w-full', className)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height }} preserveAspectRatio="none">
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={s.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={sy(t)}
              y2={sy(t)}
              stroke="var(--color-ink-700)"
              strokeWidth="1"
              strokeDasharray={i === 0 ? undefined : '3 5'}
              opacity={0.7}
            />
            <text x={padL - 8} y={sy(t) + 3.5} textAnchor="end" className="fill-ink-500" style={{ fontSize: 9.5 }}>
              {yFormat(t)}
            </text>
          </g>
        ))}

        {ticks2.map((t, i) => (
          <text key={`r${i}`} x={W - padR + 8} y={sy2(t) + 3.5} textAnchor="start" className="fill-ink-500" style={{ fontSize: 9.5 }}>
            {(y2Format ?? ((v: number) => String(Math.round(v))))(t)}
          </text>
        ))}

        {series.map((s) => {
          const project = s.axis === 'right' ? sy2 : sy
          const base = s.axis === 'right' ? R.min : L.min
          const line = s.points.map((p, i) => `${i === 0 ? 'M' : 'L'}${sx(p.x)},${project(p.y)}`).join(' ')
          const areaPath = `${line} L${sx(maxX)},${project(base)} L${sx(minX)},${project(base)} Z`
          return (
            <g key={s.key}>
              {s.area && <path d={areaPath} fill={`url(#grad-${s.key})`} />}
              <path
                d={line}
                fill="none"
                stroke={s.color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray={s.dashed ? '5 5' : undefined}
              />
              {s.points.length <= 32 &&
                s.points.map((p, i) => (
                  <circle key={i} cx={sx(p.x)} cy={project(p.y)} r="2.6" fill="var(--color-ink-900)" stroke={s.color} strokeWidth="1.6" />
                ))}
            </g>
          )
        })}
      </svg>

      {xLabels && (
        <div className="mt-1 flex justify-between px-1 text-[10px] text-ink-500">
          {xLabels.map((l, i) => (
            <span key={i}>{l}</span>
          ))}
        </div>
      )}

      <div className="absolute right-2 top-0 flex gap-3">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5 text-[10px] text-ink-400">
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
            {s.label}
            {tooltipFormatter && (
              <span className="tabular-nums text-ink-600">
                {tooltipFormatter(s, s.points[s.points.length - 1]?.y ?? 0)}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bar chart
// ---------------------------------------------------------------------------

export function BarChart({
  data,
  height = 180,
  format = (v: number) => String(Math.round(v)),
  className,
  colorFor,
}: {
  data: { label: string; value: number; color?: string; sublabel?: string }[]
  height?: number
  format?: (v: number) => string
  className?: string
  colorFor?: (d: { label: string }, i: number) => string
}) {
  const max = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className={cn('flex w-full items-end gap-2', className)} style={{ height }}>
      {data.map((d, i) => (
        <div key={d.label + i} className="group relative flex h-full flex-1 flex-col justify-end gap-1.5">
          <span className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md border border-ink-700 bg-ink-800 px-1.5 py-0.5 text-[10px] font-medium text-ink-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {format(d.value)}
          </span>
          <div
            className="w-full rounded-t-md transition-all duration-500 ease-out group-hover:brightness-125"
            style={{
              height: `${clamp((d.value / max) * 100, 2, 100)}%`,
              background:
                d.color ??
                colorFor?.(d, i) ??
                `linear-gradient(180deg, var(--color-brand-400), var(--color-brand-700))`,
            }}
          />
          <span className="truncate text-center text-[10px] text-ink-500">{d.label}</span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Donut chart
// ---------------------------------------------------------------------------

export function DonutChart({
  data,
  size = 180,
  thickness = 22,
  centerLabel,
  centerValue,
  format = (v: number) => String(Math.round(v)),
}: {
  data: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  centerLabel?: string
  centerValue?: string
  format?: (v: number) => string
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r

  // Precompute each arc's length and dash offset so nothing is mutated during render.
  const arcs = data.reduce<
    { label: string; color: string; len: number; offset: number }[]
  >((acc, d) => {
    const len = (d.value / total) * c
    const offset = acc.length ? acc[acc.length - 1]!.offset + acc[acc.length - 1]!.len : 0
    acc.push({ label: d.label, color: d.color, len, offset })
    return acc
  }, [])

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--color-ink-800)"
          strokeWidth={thickness}
        />
        {arcs.map((a) => (
          <circle
            key={a.label}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={a.color}
            strokeWidth={thickness}
            strokeDasharray={`${Math.max(0, a.len - 2)} ${c - a.len + 2}`}
            strokeDashoffset={-a.offset}
            strokeLinecap="round"
            className="transition-all duration-700"
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-bold tabular-nums tracking-tight text-ink-100">
          {centerValue ?? format(total)}
        </span>
        {centerLabel && <span className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-500">{centerLabel}</span>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sparkline
// ---------------------------------------------------------------------------

export function Sparkline({
  values,
  color = 'var(--color-brand-400)',
  className,
  height = 32,
}: {
  values: number[]
  color?: string
  className?: string
  height?: number
}) {
  const path = useMemo(() => {
    if (values.length < 2) return ''
    const max = Math.max(...values)
    const min = Math.min(...values)
    return values
      .map((v, i) => {
        const x = (i / (values.length - 1)) * 100
        const y = 28 - ((v - min) / (max - min || 1)) * 24 - 2
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }, [values])

  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn('w-full', className)} style={{ height }}>
      <path d={path} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Radial gauge (AI score / campaign progress)
// ---------------------------------------------------------------------------

export function RadialGauge({
  value,
  size = 56,
  color = 'var(--color-brand-500)',
  track = 'var(--color-ink-800)',
  thickness = 5,
  children,
}: {
  value: number
  size?: number
  color?: string
  track?: string
  thickness?: number
  children?: React.ReactNode
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  const v = clamp(value, 0, 100) / 100
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={thickness} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={`${v * c} ${c}`}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Funnel (production pipeline)
// ---------------------------------------------------------------------------

export function Funnel({ steps }: { steps: { label: string; value: number; color: string }[] }) {
  const max = Math.max(...steps.map((s) => s.value), 1)
  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.label} className="flex items-center gap-3">
          <span className="w-24 shrink-0 truncate text-[11px] text-ink-400">{s.label}</span>
          <div className="h-6 flex-1 overflow-hidden rounded-md bg-ink-800">
            <div
              className="flex h-full items-center justify-end rounded-md px-2 transition-all duration-500"
              style={{
                width: `${Math.max(6, (s.value / max) * 100)}%`,
                background: `linear-gradient(90deg, color-mix(in oklab, ${s.color} 35%, transparent), ${s.color})`,
              }}
            >
              <span className="text-[10px] font-semibold tabular-nums text-ink-950">{s.value}</span>
            </div>
          </div>
          <span className="w-8 shrink-0 text-right text-[10px] tabular-nums text-ink-500">
            {Math.round((s.value / max) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Heatmap (posting time performance)
// ---------------------------------------------------------------------------

export function Heatmap({
  rows,
  cols,
  values,
  className,
}: {
  rows: string[]
  cols: string[]
  values: number[][]
  className?: string
}) {
  const max = Math.max(...values.flat(), 1)
  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="min-w-[520px]">
        <div className="flex gap-1 pl-16">
          {cols.map((c) => (
            <span key={c} className="flex-1 text-center text-[10px] text-ink-500">
              {c}
            </span>
          ))}
        </div>
        {rows.map((r, ri) => (
          <div key={r} className="mt-1 flex items-center gap-1">
            <span className="w-16 shrink-0 text-[10px] text-ink-500">{r}</span>
            {cols.map((c, ci) => {
              const v = values[ri]?.[ci] ?? 0
              const t = v / max
              return (
                <div
                  key={c}
                  title={`${r} ${c}: ${v}% engagement`}
                  className="h-7 flex-1 rounded transition-colors"
                  style={{
                    background: `color-mix(in oklab, var(--color-brand-500) ${Math.round(t * 85 + 6)}%, var(--color-ink-800))`,
                  }}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Horizontal bar with label (top performing content)
// ---------------------------------------------------------------------------

export function RankedBar({
  items,
  format = (v) => String(v),
  className,
}: {
  items: { label: string; value: number; color?: string; meta?: React.ReactNode }[]
  format?: (v: number) => string
  className?: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className={cn('space-y-2.5', className)}>
      {items.map((it, i) => (
        <div key={it.label + i} className="group">
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <span className="min-w-0 flex-1 truncate text-[12px] text-ink-200">{it.label}</span>
            <span className="shrink-0 text-[11px] font-semibold tabular-nums text-ink-100">
              {format(it.value)}
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.max(3, (it.value / max) * 100)}%`,
                background: it.color ?? 'var(--color-brand-500)',
              }}
            />
          </div>
          {it.meta && <div className="mt-1 text-[10px] text-ink-500">{it.meta}</div>}
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat tile used on dashboards
// ---------------------------------------------------------------------------

export function SparklineCard({
  label,
  value,
  delta,
  series,
  color,
  icon,
  footnote,
}: {
  label: string
  value: string
  delta?: number
  series: number[]
  color: string
  icon?: React.ReactNode
  footnote?: string
}) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-ink-700/70 bg-ink-900 p-4 transition-colors hover:border-ink-600">
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-ink-400">
          {icon}
          {label}
        </span>
        {delta != null && (
          <span
            className={cn(
              'rounded px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
              delta >= 0
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-red-500/15 text-red-300',
            )}
          >
            {delta >= 0 ? '+' : ''}
            {delta.toFixed(1)}%
          </span>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums tracking-tight text-ink-100">{value}</div>
      {footnote && <div className="mt-0.5 text-[11px] text-ink-500">{footnote}</div>}
      <div className="mt-3 -mb-1 opacity-70 transition-opacity group-hover:opacity-100">
        <Sparkline values={series} color={color} />
      </div>
    </div>
  )
}

export { toLocalInput }