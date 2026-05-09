export interface HitResult {
  type: 'hit'
  response: string
  similarity: number
  latency_ms: number
  cost: number
  cost_avoided: number
}

export interface MissResult {
  type: 'miss'
  response: string
  latency_ms: number
  cost: number
}

export type QueryResult = HitResult | MissResult

export interface HistoryEntry {
  id: string
  query: string
  result: 'HIT' | 'MISS'
  latency_ms: number
  similarity: number | null
  cost: number
}

export interface CacheEntry {
  id: string
  response: string
}

export interface Stats {
  total: number
  hits: number
  misses: number
  hit_rate: number
  latency_saved_ms: number
  cost_saved: number
}
