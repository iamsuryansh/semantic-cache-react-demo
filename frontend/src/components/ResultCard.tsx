import type { QueryResult } from '../types'

interface Props {
  result: QueryResult | null
  streaming: string
  query: string
}

export default function ResultCard({ result, streaming, query }: Props) {
  if (!result && !streaming) return null

  const isHit = result?.type === 'hit'
  const isMiss = result?.type === 'miss'
  const isStreaming = !result && !!streaming

  return (
    <div className="animate-slide-up w-full max-w-3xl mx-auto px-6 mt-6">
      <div
        className={`rounded-2xl border overflow-hidden shadow-sm ${
          isHit
            ? 'border-emerald-200 bg-emerald-50'
            : isMiss
            ? 'border-amber-200 bg-amber-50'
            : 'border-slate-200 bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isHit
              ? 'border-emerald-200 bg-emerald-100/60'
              : isMiss
              ? 'border-amber-200 bg-amber-100/60'
              : 'border-slate-100 bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="text-xl">
              {isHit ? '✅' : isMiss ? '❌' : '⏳'}
            </span>
            <div>
              <p
                className={`font-bold text-sm ${
                  isHit ? 'text-emerald-800' : isMiss ? 'text-amber-800' : 'text-slate-600'
                }`}
              >
                {isHit
                  ? 'Cache HIT'
                  : isMiss
                  ? 'Cache MISS'
                  : 'Calling GPT-4o-mini…'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate max-w-xs">
                {query}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-3">
            {isHit && (
              <>
                <Pill label="Similarity" value={(result as any).similarity.toFixed(4)} color="emerald" mono />
                <Pill label="Latency" value={`${(result as any).latency_ms} ms`} color="emerald" />
                <Pill label="Cost" value={`$${(result as any).cost.toFixed(6)}`} color="slate" />
                <div className="hidden sm:flex items-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  🚀 No LLM call
                </div>
              </>
            )}
            {isMiss && (
              <>
                <Pill label="Latency" value={`${(result as any).latency_ms} ms`} color="amber" />
                <Pill label="Cost" value={`$${(result as any).cost.toFixed(6)}`} color="slate" />
                <div className="hidden sm:flex items-center gap-1.5 bg-slate-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
                  💾 Cached
                </div>
              </>
            )}
            {isStreaming && (
              <span className="text-xs text-slate-400 font-mono animate-pulse">streaming…</span>
            )}
          </div>
        </div>

        {/* Response */}
        <div className="px-6 py-5">
          <p className="text-slate-700 leading-relaxed text-[0.95rem]">
            {result ? result.response : streaming}
            {isStreaming && <span className="cursor" />}
          </p>
        </div>
      </div>
    </div>
  )
}

function Pill({
  label,
  value,
  color,
  mono,
}: {
  label: string
  value: string
  color: 'emerald' | 'amber' | 'slate'
  mono?: boolean
}) {
  const colors = {
    emerald: 'bg-emerald-100 text-emerald-800',
    amber: 'bg-amber-100 text-amber-800',
    slate: 'bg-slate-100 text-slate-600',
  }
  return (
    <div className={`hidden md:flex flex-col items-center px-3 py-1.5 rounded-lg ${colors[color]}`}>
      <span className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{label}</span>
      <span className={`text-xs font-bold mt-0.5 ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}
