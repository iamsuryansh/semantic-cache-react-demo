export default function Hero() {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-6 py-16 text-center">
      <div className="max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 text-sm text-indigo-200 font-medium mb-6">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          Live demo · Redis + OpenAI
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight mb-4">
          Stop paying for the{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
            same answer
          </span>{' '}
          twice
        </h1>

        <p className="text-slate-300 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto">
          Semantic caching stores LLM responses and returns them instantly when a
          similar question is asked — even if the wording is different.
        </p>

        {/* How it works */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          {[
            { icon: '🔢', step: '1. Embed', desc: 'Query → 1536-dim vector via OpenAI' },
            { icon: '🔍', step: '2. Search', desc: 'Redis finds nearest cached vector' },
            { icon: '✅', step: 'HIT ≥ 0.90', desc: 'Instant response, zero LLM cost', green: true },
            { icon: '❌', step: 'MISS < 0.90', desc: 'GPT-4o-mini called, result cached', amber: true },
          ].map((item) => (
            <div
              key={item.step}
              className={`rounded-xl p-5 border text-left ${
                item.green
                  ? 'bg-emerald-500/10 border-emerald-500/30'
                  : item.amber
                  ? 'bg-amber-500/10 border-amber-500/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="text-2xl mb-2">{item.icon}</div>
              <div
                className={`text-sm font-bold mb-1.5 ${
                  item.green ? 'text-emerald-400' : item.amber ? 'text-amber-400' : 'text-white'
                }`}
              >
                {item.step}
              </div>
              <div className="text-sm text-slate-400 leading-snug">{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
