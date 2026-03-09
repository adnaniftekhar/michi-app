'use client'

import { useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { HuntDefinition } from '@/lib/scavenger/types'
import { decodeHuntShareCode } from '@/lib/scavenger/share'
import { createInitialSession, recordAnswer } from '@/lib/scavenger/session'
import { upsertPlaySession } from '@/lib/scavenger/storage'

export default function PlayHuntPage() {
  const params = useParams<{ code: string }>()
  const router = useRouter()
  const [variantSeed, setVariantSeed] = useState(1)

  const initial: { hunt: HuntDefinition | null; error: string | null } =
    useMemo(() => {
      try {
        const code = Array.isArray(params.code) ? params.code[0] : params.code
        if (!code) {
          return { hunt: null, error: 'Missing hunt code in the URL.' }
        }
        const hunt = decodeHuntShareCode(code)
        return { hunt, error: null }
      } catch (error) {
        console.error('Failed to decode hunt share code', error)
        return {
          hunt: null,
          error:
            'This hunt link looks invalid or has been copied incorrectly.',
        }
      }
    }, [params.code])

  const [hunt] = useState<HuntDefinition | null>(initial.hunt)
  const [displayHunt, setDisplayHunt] = useState<HuntDefinition | null>(
    initial.hunt
  )
  const [session, setSession] = useState(
    () => (hunt ? createInitialSession(hunt.id) : null)
  )
  const [answer, setAnswer] = useState('')
  const [showHints, setShowHints] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)

  if (initial.error) {
    return (
      <div>
        <PageHeader
          title="Play scavenger hunt"
          subtitle="We could not load this hunt."
        />
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-danger)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          {initial.error}
        </p>
        <Button onClick={() => router.push('/hunts')}>Back to hunts</Button>
      </div>
    )
  }

  if (!hunt || !displayHunt || !session) {
    return null
  }

  const totalStops = displayHunt.stops.length
  const isComplete = session.status === 'completed'
  const currentStop = displayHunt.stops[session.currentStopIndex]

  const handleCheckAnswer = () => {
    if (!currentStop) return
    if (!answer.trim()) {
      setFeedback('Add a short answer or use “I reached this spot”.')
      return
    }

    const { session: updated, result } = recordAnswer(
      session,
      currentStop,
      answer,
      totalStops
    )
    setSession(updated)
    upsertPlaySession(updated)

    if (result.isCorrect) {
      setFeedback('Nice work! Moving to the next clue.')
      setAnswer('')
      setShowHints(false)
    } else {
      setFeedback('That does not quite match. Try again or reveal a hint.')
    }
  }

  const handleConfirmArrival = () => {
    if (!currentStop) return
    const { session: updated } = recordAnswer(
      session,
      currentStop,
      answer || 'confirmed-arrival',
      totalStops
    )
    setSession(updated)
    upsertPlaySession(updated)
    setFeedback('Great, on to the next stop.')
    setAnswer('')
    setShowHints(false)
  }

  const handleReplay = () => {
    // For MVP replay we simply restart the same encoded hunt and
    // create a fresh session so users can walk it again.
    // Simple replay variant: rotate the order of stops so players
    // can experience the same places in a different sequence.
    const stops = hunt.stops
    const offset = variantSeed % stops.length
    const rotatedStops = [
      ...stops.slice(offset),
      ...stops.slice(0, offset),
    ].map((stop, index) => ({
      ...stop,
      order: index + 1,
    }))

    setDisplayHunt({
      ...hunt,
      stops: rotatedStops,
    })

    const newSession = createInitialSession(
      hunt.id + `-variant-${variantSeed}`
    )
    setVariantSeed((prev) => prev + 1)
    setSession(newSession)
    setAnswer('')
    setFeedback(null)
    setShowHints(false)
  }

  if (isComplete) {
    return (
      <div>
        <PageHeader
        title="Hunt complete!"
          subtitle="You have reached all of the stops in this route."
        />
        <Card>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-3)',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              You visited {totalStops} public places around{' '}
              {displayHunt.config.areaLabel} in {displayHunt.config.city}. You can replay this
              hunt to walk the same route again or share it with a friend.
            </p>
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
              <Button onClick={handleReplay}>Play again</Button>
              <Button
                variant="secondary"
                onClick={() => router.push('/hunts')}
              >
                Back to hunts
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title={displayHunt.config.title}
        subtitle={`${displayHunt.config.city} • ${displayHunt.config.areaLabel}`}
      />

      <Card>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--spacing-3)',
          }}
        >
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Step {session.currentStopIndex + 1} of {totalStops}. You will see
            only one clue at a time. Stay on public streets and do not enter
            private buildings or restricted areas.
          </p>

          <div
            style={{
              padding: 'var(--spacing-4)',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-surface-alt, rgba(255,255,255,0.04))',
            }}
          >
            <p
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-medium)',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--spacing-2)',
              }}
            >
              Clue
            </p>
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {currentStop.clueText}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={() => setShowHints((prev) => !prev)}
            >
              {showHints ? 'Hide hints' : 'Show a hint'}
            </Button>
          </div>

          {showHints && (
            <ul
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                paddingLeft: 'var(--spacing-5)',
              }}
            >
              {currentStop.hints.map((hint) => (
                <li key={hint}>{hint}</li>
              ))}
            </ul>
          )}

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--spacing-2)',
            }}
          >
            <Input
              label="Answer or description (optional)"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="e.g. a hidden mural on a side wall"
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 'var(--spacing-2)',
              }}
            >
              <Button size="sm" type="button" onClick={handleCheckAnswer}>
                Check answer
              </Button>
              <Button
                size="sm"
                type="button"
                variant="secondary"
                onClick={handleConfirmArrival}
              >
                I reached this spot
              </Button>
            </div>
            {feedback && (
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: feedback.startsWith('Nice') || feedback.startsWith('Great')
                    ? 'var(--color-michi-green)'
                    : 'var(--color-text-secondary)',
                }}
              >
                {feedback}
              </p>
            )}
          </div>
        </div>
      </Card>
    </div>
  )
}

