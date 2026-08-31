import {
  getMotivationQuoteById,
  MOTIVATION_QUOTES,
  type MotivationQuote,
} from '../content/motivationQuotes'

const STORAGE_KEY = 'mi-gym-daily-motivation-v1'

interface DailyMotivationState {
  /** Fecha ISO (YYYY-MM-DD) → id de frase asignada ese día */
  assignments: Record<string, string>
  /** Ids pendientes; cuando se vacía se rellena mezclando todo el banco */
  queue: string[]
  /** Última frase usada (evita repetirla como primera del nuevo ciclo) */
  lastQuoteId: string | null
}

function loadState(): DailyMotivationState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return { assignments: {}, queue: [], lastQuoteId: null }
    }
    const parsed = JSON.parse(raw) as Partial<DailyMotivationState>
    return {
      assignments:
        parsed.assignments && typeof parsed.assignments === 'object'
          ? parsed.assignments
          : {},
      queue: Array.isArray(parsed.queue) ? parsed.queue.filter(Boolean) : [],
      lastQuoteId:
        typeof parsed.lastQuoteId === 'string' ? parsed.lastQuoteId : null,
    }
  } catch {
    return { assignments: {}, queue: [], lastQuoteId: null }
  }
}

function saveState(state: DailyMotivationState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* ignore quota */
  }
}

function shuffleIds(ids: string[]): string[] {
  const arr = [...ids]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function allQuoteIds(): string[] {
  return MOTIVATION_QUOTES.map((q) => q.id)
}

function refillQueue(excludeId: string | null): string[] {
  let ids = shuffleIds(allQuoteIds())
  if (excludeId && ids.length > 1 && ids[0] === excludeId) {
    ;[ids[0], ids[1]] = [ids[1], ids[0]]
  }
  return ids
}

function pickNextQuoteId(state: DailyMotivationState): string {
  let queue = state.queue.filter((id) => getMotivationQuoteById(id))
  if (queue.length === 0) {
    queue = refillQueue(state.lastQuoteId)
  }
  const next = queue[0]
  state.queue = queue.slice(1)
  state.lastQuoteId = next
  return next
}

/**
 * Una frase por día calendario (YYYY-MM-DD). Misma frase todo el día;
 * no se repite hasta agotar el banco (~100 días de entreno).
 */
export function getDailyMotivationQuote(dateIso: string): MotivationQuote {
  const state = loadState()
  const existingId = state.assignments[dateIso]
  if (existingId) {
    const existing = getMotivationQuoteById(existingId)
    if (existing) return existing
  }

  const quoteId = pickNextQuoteId(state)
  state.assignments[dateIso] = quoteId

  // Limpiar asignaciones muy antiguas (mantener ~400 días)
  const keys = Object.keys(state.assignments).sort()
  if (keys.length > 400) {
    for (const key of keys.slice(0, keys.length - 400)) {
      delete state.assignments[key]
    }
  }

  saveState(state)
  const quote = getMotivationQuoteById(quoteId)
  if (!quote) {
    return MOTIVATION_QUOTES[0]
  }
  return quote
}

/** Fecha local YYYY-MM-DD */
export function todayIsoDateLocal(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
