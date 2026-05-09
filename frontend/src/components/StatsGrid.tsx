import type { Stats } from '../types'

interface Props {
  stats: Stats
  onReset: () => void
}

export default function StatsGrid({ stats, onReset }: Props) {
  const cards = [
    { label: 'Total Requests', value: stats.total, color: 'text-slate-800' },
    { label: 'Cache Hits', value: stats.hits, color: 'text-emerald-600' },
    { label: 'Cache Misses', value: stats.misses, color: 'text-rose-500' },
    {
      label: 'Hit Rate',
      value: stats.total ? `${(stats.hit_rate * 100).toFixed(0)}%` : '—',
      color: 'text-indigo-600',
    },
    {
      label: 'Latency Saved',
      value: stats.latency_saved_ms ? `${stats.latency_saved_ms.toLocaleString()} ms` : '—',
      color: 'text-violet-600',
    },
    {
      label: 'Cost Saved',
      value: stats.cost_saved ? `$${stats.cost_saved.toFixed(5)}` : '—',
      color: 'text-sky-600',
    },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-widest">
          Live Stats
        </h2>
        <button
          onClick={onReset}
          className="text-sm text-slate-400 hover:text-rose-500 transition-colors font-medium"
        >
          ↺ Reset
        </button>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm"
          >
            <div className={`text-2xl font-extrabold tabular-nums ${c.color}`}>
              {c.value}
            </div>
            <div className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wide leading-tight">
              {c.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
