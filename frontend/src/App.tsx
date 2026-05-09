import { useCallback, useEffect, useRef, useState } from 'react'
import { fetchEntries, fetchStats, resetStats, streamQuery } from './api'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import QueryInput from './components/QueryInput'
import ResultCard from './components/ResultCard'
import StatsGrid from './components/StatsGrid'
import CacheGallery from './components/CacheGallery'
import HistoryTable from './components/HistoryTable'
import type { CacheEntry, HistoryEntry, QueryResult, Stats } from './types'

const EMPTY_STATS: Stats = {
  total: 0, hits: 0, misses: 0, hit_rate: 0, latency_saved_ms: 0, cost_saved: 0,
}

export default function App() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState('')
  const [streaming, setStreaming] = useState('')
  const [result, setResult] = useState<QueryResult | null>(null)
  const [stats, setStats] = useState<Stats>(EMPTY_STATS)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [entries, setEntries] = useState<CacheEntry[]>([])
  const [entriesLoading, setEntriesLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  // Load cache entries and stats on mount
  useEffect(() => {
    fetchEntries()
      .then(setEntries)
      .finally(() => setEntriesLoading(false))
    fetchStats().then(setStats)
  }, [])

  const refreshStats = useCallback(() => {
    fetchStats().then(setStats)
  }, [])

  const handleQuery = useCallback((q: string) => {
    if (loading) abortRef.current?.abort()

    setQuery(q)
    setLoading(true)
    setStatus('Embedding…')
    setStreaming('')
    setResult(null)

    abortRef.current = streamQuery(
      q,
      (msg) => setStatus(msg),
      (token) => setStreaming((prev) => prev + token),
      (hit) => {
        setResult(hit)
        setLoading(false)
        setStreaming('')
        setHistory((h) => [
          { id: crypto.randomUUID(), query: q, result: 'HIT', latency_ms: hit.latency_ms, similarity: hit.similarity, cost: hit.cost },
          ...h.slice(0, 19),
        ])
        fetchEntries().then(setEntries)
        refreshStats()
      },
      (miss) => {
        setResult(miss)
        setLoading(false)
        setStreaming('')
        setHistory((h) => [
          { id: crypto.randomUUID(), query: q, result: 'MISS', latency_ms: miss.latency_ms, similarity: null, cost: miss.cost },
          ...h.slice(0, 19),
        ])
        fetchEntries().then(setEntries)
        refreshStats()
      },
      () => {
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
        setStatus('Error — check console')
      },
    )
  }, [loading, refreshStats])

  const handleReset = useCallback(async () => {
    await resetStats()
    setStats(EMPTY_STATS)
    setHistory([])
    setResult(null)
    setStreaming('')
    setQuery('')
  }, [])

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Hero />
      <QueryInput onSubmit={handleQuery} loading={loading} status={status} />
      <ResultCard result={result} streaming={streaming} query={query} />
      <StatsGrid stats={stats} onReset={handleReset} />
      <CacheGallery entries={entries} loading={entriesLoading} />
      <HistoryTable history={history} />
    </div>
  )
}
