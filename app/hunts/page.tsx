'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import type { HuntConfig, HuntDefinition } from '@/lib/scavenger/types'
import { generateHunt } from '@/lib/scavenger/generation'
import { encodeHuntShareCode } from '@/lib/scavenger/share'

interface FeaturedHunt {
  config: HuntConfig
  hunt: HuntDefinition
  shareCode: string
}

function createFeaturedHunt(config: HuntConfig, variantSeed: number): FeaturedHunt {
  const hunt = generateHunt(config, { variantSeed })
  const shareCode = encodeHuntShareCode(hunt)
  return { config, hunt, shareCode }
}

export default function HuntsLanding() {
  const featuredHunts = useMemo(() => {
    const base: HuntConfig[] = [
      {
        id: 'sample-bcn-family',
        title: 'Gothic Quarter Side-Streets (Family)',
        city: 'Barcelona',
        areaLabel: 'Gothic Quarter',
        ageRange: 'family',
        durationMinutes: 60,
        interests: ['history', 'street-art'],
        walkingPace: 'normal',
      },
      {
        id: 'sample-ldn-family',
        title: 'Covent Garden Courtyards (Family)',
        city: 'London',
        areaLabel: 'Covent Garden',
        ageRange: 'family',
        durationMinutes: 45,
        interests: ['markets', 'architecture'],
        walkingPace: 'slow',
      },
    ]

    return base.map((config, index) =>
      createFeaturedHunt(config, index + 1)
    )
  }, [])

  return (
    <div>
      <PageHeader
        title="Scavenger Hunts (MVP)"
        subtitle="Lightweight, replayable scavenger hunts in overlooked corners of popular neighborhoods."
      />

      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
          marginBottom: 'var(--spacing-6)',
          maxWidth: '720px',
        }}
      >
        Anyone can play these hunts in a mobile browser without creating an account.
        You&apos;ll see one clue at a time, with simple hints and a short route that
        avoids private or unsafe locations.
      </p>

      <div
        className="grid grid-cols-1 md:grid-cols-2"
        style={{ gap: 'var(--spacing-5)' }}
      >
        {featuredHunts.map(({ config, hunt, shareCode }) => (
          <Card key={config.id}>
            <div style={{ padding: 'var(--spacing-4)' }}>
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  marginBottom: 'var(--spacing-2)',
                  color: 'var(--color-text-primary)',
                }}
              >
                {config.title}
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                {config.city} • {config.areaLabel} • ~
                {config.durationMinutes} minutes •{' '}
                {hunt.stops.length} stops
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginBottom: 'var(--spacing-4)',
                }}
              >
                {hunt.summary}
              </p>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 'var(--spacing-3)',
                }}
              >
                <Link href={`/hunts/play/${shareCode}`}>
                  <Button size="sm">
                    Play now
                  </Button>
                </Link>
                <span
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  One clue at a time • Replay for a new route
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div
        style={{
          marginTop: 'var(--spacing-8)',
          padding: 'var(--spacing-4)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--color-border-subtle)',
          backgroundColor: 'var(--color-surface)',
        }}
      >
        <h3
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-2)',
          }}
        >
          Run your own hunts
        </h3>
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-3)',
          }}
        >
          If you&apos;re signed in as an admin, you can create and publish
          your own hunts for any city from the admin panel.
        </p>
        <Link href="/hunts/admin">
          <Button variant="secondary" size="sm">
            Open admin hunts panel
          </Button>
        </Link>
      </div>
    </div>
  )
}

