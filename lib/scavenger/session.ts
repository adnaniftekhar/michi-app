import type { HuntStop, PlayAnswer, PlaySession } from './types'

export interface AnswerValidationResult {
  isCorrect: boolean
  normalizedAnswer: string
}

export function normalizeAnswer(raw: string): string {
  return raw.trim().toLowerCase()
}

export function validateAnswer(
  stop: HuntStop,
  rawAnswer: string
): AnswerValidationResult {
  const normalized = normalizeAnswer(rawAnswer)
  if (!normalized) {
    return { isCorrect: false, normalizedAnswer: normalized }
  }

  const keywords = stop.answerKeywords.map((k) => k.trim().toLowerCase())

  const isExact = keywords.includes(normalized)
  if (isExact) {
    return { isCorrect: true, normalizedAnswer: normalized }
  }

  const isKeywordMatch = keywords.some(
    (keyword) =>
      keyword.length > 0 &&
      (normalized.includes(keyword) || keyword.includes(normalized))
  )

  return {
    isCorrect: isKeywordMatch,
    normalizedAnswer: normalized,
  }
}

export function createInitialSession(huntId: string): PlaySession {
  const nowIso = new Date().toISOString()
  return {
    id: `session-${huntId}-${nowIso}`,
    huntId,
    startedAt: nowIso,
    status: 'in-progress',
    currentStopIndex: 0,
    answers: [],
  }
}

export function recordAnswer(
  session: PlaySession,
  stop: HuntStop,
  rawAnswer: string,
  totalStops: number
): { session: PlaySession; result: AnswerValidationResult } {
  const result = validateAnswer(stop, rawAnswer)
  const nowIso = new Date().toISOString()

  const answer: PlayAnswer = {
    stopId: stop.id,
    rawAnswer,
    normalizedAnswer: result.normalizedAnswer,
    isCorrect: result.isCorrect,
    answeredAt: nowIso,
  }

  const answers = [...session.answers, answer]

  let currentStopIndex = session.currentStopIndex
  let status = session.status
  let completedAt = session.completedAt

  if (result.isCorrect) {
    currentStopIndex = session.currentStopIndex + 1
  }

  if (currentStopIndex >= totalStops) {
    status = 'completed'
    completedAt = nowIso
  }

  return {
    session: {
      ...session,
      answers,
      currentStopIndex,
      status,
      completedAt,
    },
    result,
  }
}

