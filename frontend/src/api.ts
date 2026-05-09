import type { CacheEntry, Stats } from './types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

export async function fetchEntries(): Promise<CacheEntry[]> {
  const res = await fetch(`${BASE}/api/entries`)
  const data = await res.json()
  return data.entries ?? []
}

export async function fetchStats(): Promise<Stats> {
  const res = await fetch(`${BASE}/api/stats`)
  return res.json()
}

export async function resetStats(): Promise<void> {
  await fetch(`${BASE}/api/reset`, { method: 'DELETE' })
}

export function streamQuery(
  query: string,
  onStatus: (msg: string) => void,
  onToken: (token: string) => void,
  onHit: (data: import('./types').HitResult) => void,
  onMiss: (data: import('./types').MissResult) => void,
  onDone: () => void,
  onError: (msg: string) => void,
): AbortController {
  const controller = new AbortController()

  fetch(`${BASE}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
    signal: controller.signal,
  })
    .then(async (res) => {
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''

        for (const part of parts) {
          const line = part.trim()
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            if (event.type === 'status') onStatus(event.message)
            else if (event.type === 'token') onToken(event.token)
            else if (event.type === 'hit') onHit(event)
            else if (event.type === 'miss') onMiss(event)
            else if (event.type === 'done') onDone()
            else if (event.type === 'error') onError(event.message)
          } catch {
            // ignore malformed chunks
          }
        }
      }
    })
    .catch((err) => {
      if (err.name !== 'AbortError') onError(String(err))
    })

  return controller
}
