'use client'

import { useState } from 'react'
import type { Trip, LearningTarget } from '@/types'
import { Section } from '../ui/Section'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { EmptyState } from '../ui/EmptyState'
import { showToast } from '../ui/Toast'

interface TargetsTabProps {
  trip: Trip
  onUpdate: (trip: Trip) => void
}

export function TargetsTab({ trip, onUpdate }: TargetsTabProps) {
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string>('')

  const handleSetTarget = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const track = formData.get('track') as LearningTarget['track']
    const weeklyHours = formData.get('weeklyHours')
      ? Number(formData.get('weeklyHours'))
      : undefined

    if (track === 'weekly' && (!weeklyHours || weeklyHours <= 0)) {
      setError('Weekly hours must be greater than 0')
      return
    }

    const updatedTrip: Trip = {
      ...trip,
      learningTarget: { track, weeklyHours },
    }
    onUpdate(updatedTrip)
    setShowForm(false)
    showToast('Learning target updated', 'success')
  }

  const getTargetDisplay = () => {
    if (!trip.learningTarget) return null
    const { track, weeklyHours } = trip.learningTarget
    if (track === '15min') return '15 min/day'
    if (track === '60min') return '60 min/day'
    if (track === '4hrs') return '4 hrs/day'
    if (track === 'weekly') return `${weeklyHours} hrs/week`
    return null
  }

  return (
    <Section
      title="Learning Target"
      description="Set your daily or weekly learning goal"
      action={
        !showForm && (
          <Button onClick={() => setShowForm(true)} variant={trip.learningTarget ? 'secondary' : 'primary'}>
            {trip.learningTarget ? 'Edit' : 'Set Target'}
          </Button>
        )
      }
      emptyState={{
        message: 'No learning target set. Set a target to generate your schedule.',
        action: !showForm && (
          <Button onClick={() => setShowForm(true)}>Set Target</Button>
        ),
      }}
      isEmpty={!showForm && !trip.learningTarget}
    >
      {showForm && (
        <Card className="mb-6">
          <form onSubmit={handleSetTarget} className="space-y-4">
            <Select
              label="Track"
              name="track"
              options={[
                { value: '15min', label: '15 min/day' },
                { value: '60min', label: '60 min/day' },
                { value: '4hrs', label: '4 hrs/day' },
                { value: 'weekly', label: 'Weekly hours' },
              ]}
              required
              defaultValue={trip.learningTarget?.track || '15min'}
            />
            <Input
              label="Weekly Hours (if weekly track)"
              type="number"
              name="weeklyHours"
              min="0.1"
              step="0.1"
              helperText="Required if weekly track is selected. Must be greater than 0."
              error={error}
              defaultValue={trip.learningTarget?.weeklyHours?.toString() || ''}
            />
            <div className="flex gap-2 pt-2">
              <Button type="submit">Save</Button>
              <Button type="button" variant="secondary" onClick={() => {
                setShowForm(false)
                setError('')
              }}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      )}
      {trip.learningTarget && !showForm && (
        <Card>
          <div
            className="text-lg font-semibold"
            style={{
              color: 'var(--color-text-primary)',
              lineHeight: 'var(--line-height-tight)',
            }}
          >
            {getTargetDisplay()}
          </div>
        </Card>
      )}
    </Section>
  )
}

