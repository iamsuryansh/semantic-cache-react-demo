import type { CacheEntry } from '../types'

interface Props {
  entries: CacheEntry[]
  loading: boolean
}

export default function CacheGallery({ entries, loading }: Props) {
  return (
    <div className="w-full max-w-3xl mx-auto px-6 mt-8">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          What's in the Cache
        </h2>
        <span className="bg-indigo-100 text-indigo-600 text-xs font-bold px-2 py-0.5 rounded-full">
          {loading ? '…' : entries.length}
        </span>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-full mb-1" />
              <div className="h-3 bg-slate-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-300 rounded-xl p-8 text-center">
          <div className="text-2xl mb-2">🗄️</div>
          <p className="text-sm text-slate-400 font-medium">Cache is empty</p>
          <p className="text-xs text-slate-400 mt-1">Ask a question to populate it</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:border-indigo-300 hover:shadow-md transition-all group animate-fade-in"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <span className="text-[10px] text-slate-400 font-mono truncate">{entry.id.split(':')[1]?.slice(0, 12)}…</span>
              </div>
              <p className="text-slate-600 text-xs leading-relaxed line-clamp-3 group-hover:text-slate-800 transition-colors">
                {entry.response}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
