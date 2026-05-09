import { useState, type KeyboardEvent } from 'react'

interface Props {
  onSubmit: (query: string) => void
  loading: boolean
  status: string
}

const SUGGESTIONS = [
  'What is the speed of light?',
  'Explain quantum entanglement simply',
  'Who invented the internet?',
  'What is the capital of Japan?',
]

export default function QueryInput({ onSubmit, loading, status }: Props) {
  const [value, setValue] = useState('')

  const submit = () => {
    const q = value.trim()
    if (!q || loading) return
    onSubmit(q)
  }

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      <textarea
        className="w-full px-6 pt-5 pb-2 text-slate-800 text-base placeholder-slate-400 resize-none outline-none font-sans leading-relaxed"
        rows={2}
        placeholder="Ask anything… e.g. &quot;What is the speed of light?&quot;"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKey}
        disabled={loading}
      />
      <div className="flex items-center justify-between px-6 pb-4 pt-1 gap-4">
        <div className="flex flex-wrap gap-2 min-w-0">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => { setValue(s); onSubmit(s) }}
              disabled={loading}
              className="text-sm text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 font-medium"
            >
              {s.length > 32 ? s.slice(0, 32) + '…' : s}
            </button>
          ))}
        </div>
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm px-6 py-2.5 rounded-xl transition-colors shrink-0"
        >
          {loading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              {status || 'Working…'}
            </>
          ) : (
            <>Ask →</>
          )}
        </button>
      </div>
    </div>
  )
}
