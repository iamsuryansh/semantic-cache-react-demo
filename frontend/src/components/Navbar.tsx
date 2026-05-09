export default function Navbar() {
  return (
    <nav className="w-full bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-xl">🧠</span>
        <span className="text-white font-bold text-sm tracking-tight">
          Semantic Cache Demo
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-500/30">
          semantic-cache-lib
        </span>
      </div>
      <div className="flex items-center gap-5">
        <a
          href="https://pypi.org/project/semantic-cache-lib/"
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          📦 PyPI
        </a>
        <a
          href="https://github.com/iamsuryansh/semantic-cache-lib"
          target="_blank"
          rel="noreferrer"
          className="text-slate-400 hover:text-white text-xs font-medium transition-colors"
        >
          GitHub ↗
        </a>
      </div>
    </nav>
  )
}
