import type { HistoryEntry } from '../types'

interface Props {
  history: HistoryEntry[]
}

export default function HistoryTable({ history }: Props) {
  if (history.length === 0) return null

  return (
    <div className="w-full max-w-3xl mx-auto px-6 mt-8 mb-16">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
        Session History
      </h2>
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                Query
              </th>
              <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-20">
                Result
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-24">
                Latency
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">
                Similarity
              </th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide w-28">
                Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {history.map((row) => (
              <tr
                key={row.id}
                className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors animate-fade-in"
              >
                <td className="px-4 py-3 text-slate-700 font-medium truncate max-w-[200px]">
                  {row.query}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                      row.result === 'HIT'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {row.result === 'HIT' ? '✅' : '❌'} {row.result}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                  {row.latency_ms} ms
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                  {row.similarity != null ? row.similarity.toFixed(4) : '—'}
                </td>
                <td className="px-4 py-3 text-right font-mono text-xs text-slate-500">
                  ${row.cost.toFixed(6)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
