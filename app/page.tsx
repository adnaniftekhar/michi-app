'use client'

import { useDemoUser } from '@/contexts/DemoUserContext'
import { getData, setData } from '@/lib/storage'
import { useEffect, useState } from 'react'
import type { Trip } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateTripForm } from '@/components/CreateTripForm'
import { showToast } from '@/components/ui/Toast'

export default function Home() {
  const { currentUserId } = useDemoUser()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    const data = getData(currentUserId)
    setTrips(data.trips)
  }, [currentUserId])

  const handleCreateTrip = (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      ...tripData,
      learningTarget: {
        track: '15min',
      },
      createdAt: new Date().toISOString(),
    }

    const data = getData(currentUserId)
    data.trips.push(newTrip)
    setData(currentUserId, data)
    setTrips([...data.trips])
    setShowForm(false)
    showToast('Trip created successfully', 'success')
  }

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const endDate = new Date(end).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    return `${startDate} - ${endDate}`
  }

  return (
    <>
      <PageHeader
        title="Trips"
        subtitle="Plan and manage your learning journeys"
        action={
          !showForm && (
            <Button onClick={() => setShowForm(true)}>Create trip</Button>
          )
        }
      />

      {showForm && (
        <div style={{ marginBottom: 'var(--spacing-8)' }}>
          <CreateTripForm
            onSubmit={handleCreateTrip}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {trips.length === 0 ? (
        <EmptyState
          message="No trips yet. Create your first trip to get started."
          action={
            !showForm && (
              <Button onClick={() => setShowForm(true)}>Create trip</Button>
            )
          }
        />
      ) : (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
          style={{
            gap: 'var(--spacing-6)',
          }}
        >
          {trips.map((trip) => (
            <Card key={trip.id} href={`/trips/${trip.id}`}>
              <h2
                style={{
                  fontSize: 'var(--font-size-lg)',
                  lineHeight: 'var(--line-height-tight)',
                  fontWeight: 'var(--font-weight-semibold)',
                  color: 'var(--color-text-primary)',
                  marginBottom: 'var(--spacing-3)',
                }}
              >
                {trip.title}
              </h2>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  lineHeight: 'var(--line-height-normal)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                {formatDateRange(trip.startDate, trip.endDate)}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 'var(--line-height-normal)',
                }}
              >
                {trip.baseLocation}
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
