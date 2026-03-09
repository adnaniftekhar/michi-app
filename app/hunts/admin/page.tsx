'use client'

import { useEffect, useMemo, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { showToast } from '@/components/ui/Toast'
import type { HuntConfig, HuntDefinition, AgeRange } from '@/lib/scavenger/types'
import { generateHunt } from '@/lib/scavenger/generation'
import { encodeHuntShareCode } from '@/lib/scavenger/share'
import {
  getAdminHunts,
  upsertAdminHunt,
} from '@/lib/scavenger/storage'

interface FormState {
  title: string
  city: string
  areaLabel: string
  ageRange: AgeRange
  durationMinutes: string
  interests: string
}

const DEFAULT_FORM: FormState = {
  title: '',
  city: '',
  areaLabel: '',
  ageRange: 'family',
  durationMinutes: '60',
  interests: '',
}

export default function HuntsAdminPage() {
  const { isLoaded, isSignedIn, user } = useUser()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [hunts, setHunts] = useState<HuntDefinition[]>([])
  const [previewHunt, setPreviewHunt] = useState<HuntDefinition | null>(null)
  const [shareCode, setShareCode] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !user) return
    const stored = getAdminHunts(user.id)
    setHunts(stored)
  }, [isLoaded, isSignedIn, user])

  const canSubmit = useMemo(() => {
    if (!form.title.trim()) return false
    if (!form.city.trim()) return false
    if (!form.areaLabel.trim()) return false
    const duration = Number(form.durationMinutes)
    return Number.isFinite(duration) && duration >= 20
  }, [form])

  const handleChange = (
    field: keyof FormState,
    value: string
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleGenerate = () => {
    if (!user) return
    if (!canSubmit) {
      showToast('Please fill in all required fields.', 'error')
      return
    }

    setIsGenerating(true)
    try {
      const duration = Number(form.durationMinutes)
      const interests = form.interests
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

      const config: HuntConfig = {
        id: `admin-${user.id}-${Date.now()}`,
        title: form.title.trim(),
        city: form.city.trim(),
        areaLabel: form.areaLabel.trim(),
        ageRange: form.ageRange,
        durationMinutes: duration,
        interests: interests.length ? interests : ['history'],
        walkingPace: 'normal',
      }

      const hunt = generateHunt(config, { variantSeed: 1 })
      setPreviewHunt(hunt)
      setShareCode(null)
      showToast('Draft hunt generated. Review the clues below.', 'success')
    } catch (error) {
      console.error('Failed to generate hunt', error)
      showToast('Could not generate hunt with the given settings.', 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePublish = () => {
    if (!user || !previewHunt) return
    const encoded = encodeHuntShareCode(previewHunt)
    setShareCode(encoded)

    const published: HuntDefinition = {
      ...previewHunt,
      status: 'published',
      updatedAt: new Date().toISOString(),
    }

    const all = upsertAdminHunt(user.id, published)
    setHunts(all)
    showToast('Hunt published. Share the link with players.', 'success')
  }

  const currentShareUrl =
    typeof window !== 'undefined' && shareCode
      ? `${window.location.origin}/hunts/play/${shareCode}`
      : null

  const handleCopyShareLink = (code: string) => {
    if (typeof window === 'undefined') return
    const url = `${window.location.origin}/hunts/play/${code}`
    navigator.clipboard
      .writeText(url)
      .then(() => showToast('Share link copied to clipboard.', 'success'))
      .catch(() =>
        showToast('Could not copy link. You can copy it manually.', 'error')
      )
  }

  if (!isLoaded) {
    return (
      <p
        style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Loading…
      </p>
    )
  }

  if (!isSignedIn || !user) {
    return (
      <div>
        <PageHeader
          title="Scavenger Hunts Admin"
          subtitle="Sign in to create and manage hunts."
        />
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--spacing-4)',
          }}
        >
          Anyone can play a hunt without signing in, but creating and publishing
          hunts requires an admin account.
        </p>
        <Link href="/sign-in">
          <Button>Sign in</Button>
        </Link>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Scavenger Hunts Admin"
        subtitle="Define simple, safe hunts that anyone can play via a shareable link."
      />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1.3fr) minmax(0, 1fr)',
          gap: 'var(--spacing-6)',
          alignItems: 'flex-start',
          marginBottom: 'var(--spacing-8)',
        }}
      >
        {/* Configuration form */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <h2
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              New hunt configuration
            </h2>
            <Input
              label="Title"
              required
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Gothic Quarter Side-Streets"
            />
            <Input
              label="City"
              required
              value={form.city}
              onChange={(e) => handleChange('city', e.target.value)}
              placeholder="Barcelona"
            />
            <Input
              label="Neighborhood / area"
              required
              value={form.areaLabel}
              onChange={(e) => handleChange('areaLabel', e.target.value)}
              placeholder="Gothic Quarter"
            />
            <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
              <div style={{ flex: 1 }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 'var(--spacing-1)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  Age range
                </label>
                <select
                  value={form.ageRange}
                  onChange={(e) =>
                    handleChange('ageRange', e.target.value as AgeRange)
                  }
                  className="w-full"
                  style={{
                    padding: 'var(--spacing-2) var(--spacing-3)',
                    fontSize: 'var(--font-size-sm)',
                    borderRadius: 'var(--radius-input)',
                    border: '1px solid var(--color-border)',
                    backgroundColor: 'var(--color-surface)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <option value="kids">Kids 6–9</option>
                  <option value="family">Family (mixed ages)</option>
                  <option value="teens">Teens</option>
                  <option value="adults">Adults</option>
                </select>
              </div>
              <Input
                label="Approx. play time (minutes)"
                required
                type="number"
                min={20}
                value={form.durationMinutes}
                onChange={(e) => handleChange('durationMinutes', e.target.value)}
                helperText="Includes walking and clue-solving."
              />
            </div>
            <Input
              label="Interests (comma separated)"
              value={form.interests}
              onChange={(e) => handleChange('interests', e.target.value)}
              placeholder="history, street-art, markets"
              helperText="Used to choose which public places to include."
            />
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                marginTop: 'var(--spacing-2)',
              }}
            >
              <Button
                onClick={handleGenerate}
                disabled={!canSubmit || isGenerating}
                isLoading={isGenerating}
              >
                Generate draft hunt
              </Button>
            </div>
          </div>
        </Card>

        {/* Preview + share link */}
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-3)' }}>
            <h2
              style={{
                fontSize: 'var(--font-size-md)',
                fontWeight: 'var(--font-weight-semibold)',
                marginBottom: 'var(--spacing-1)',
              }}
            >
              Preview & share
            </h2>
            {!previewHunt ? (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Fill in the form and generate a draft hunt to see clues and stops
                here before you publish.
              </p>
            ) : (
              <>
                <p
                  style={{
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {previewHunt.summary}
                </p>
                <ol
                  style={{
                    paddingLeft: 'var(--spacing-4)',
                    fontSize: 'var(--font-size-sm)',
                    color: 'var(--color-text-secondary)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-2)',
                    maxHeight: '220px',
                    overflowY: 'auto',
                  }}
                >
                  {previewHunt.stops.map((stop) => (
                    <li key={stop.id}>
                      <strong style={{ color: 'var(--color-text-primary)' }}>
                        {stop.order}. {stop.place.name}
                      </strong>
                      <br />
                      <span>{stop.clueText}</span>
                    </li>
                  ))}
                </ol>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--spacing-2)',
                    marginTop: 'var(--spacing-2)',
                  }}
                >
                  <div style={{ display: 'flex', gap: 'var(--spacing-3)' }}>
                    <Button onClick={handlePublish} size="sm">
                      Publish & save
                    </Button>
                    {shareCode && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopyShareLink(shareCode)}
                      >
                        Copy share link
                      </Button>
                    )}
                  </div>
                  {currentShareUrl && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-muted)',
                        wordBreak: 'break-all',
                      }}
                    >
                      Share URL:{' '}
                      <span style={{ color: 'var(--color-text-secondary)' }}>
                        {currentShareUrl}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
      </div>

      {/* Existing hunts list */}
      <section aria-label="Existing hunts">
        <h2
          style={{
            fontSize: 'var(--font-size-md)',
            fontWeight: 'var(--font-weight-semibold)',
            marginBottom: 'var(--spacing-3)',
          }}
        >
          Your saved hunts
        </h2>
        {hunts.length === 0 ? (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-secondary)',
            }}
          >
            No hunts saved yet. Create one above to get started.
          </p>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2"
            style={{ gap: 'var(--spacing-4)' }}
          >
            {hunts.map((hunt) => {
              const code = encodeHuntShareCode(hunt)
              return (
                <Card key={hunt.id}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 'var(--spacing-2)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <h3
                          style={{
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 'var(--font-weight-semibold)',
                            margin: 0,
                            color: 'var(--color-text-primary)',
                          }}
                        >
                          {hunt.config.title}
                        </h3>
                        <p
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            marginTop: 'var(--spacing-1)',
                          }}
                        >
                          {hunt.config.city} • {hunt.config.areaLabel} •{' '}
                          {hunt.stops.length} stops
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {hunt.status}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                      }}
                    >
                      {hunt.summary}
                    </p>
                    <div
                      style={{
                        display: 'flex',
                        gap: 'var(--spacing-2)',
                        marginTop: 'var(--spacing-1)',
                      }}
                    >
                      <Link href={`/hunts/play/${code}`}>
                        <Button size="sm">Open as player</Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="secondary"
                        type="button"
                        onClick={() => handleCopyShareLink(code)}
                      >
                        Copy link
                      </Button>
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}

