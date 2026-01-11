'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import type { Trip } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateTripForm } from '@/components/CreateTripForm'
import { showToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export default function Home() {
  const { isSignedIn, isLoaded } = useUser()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch trips from API
  const fetchTrips = async () => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const response = await fetch('/api/trips')
      if (!response.ok) {
        throw new Error('Failed to fetch trips')
      }
      const data = await response.json()
      setTrips(data.trips || [])
    } catch (error) {
      console.error('Failed to fetch trips:', error)
      showToast('Failed to load trips', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrips()
  }, [isLoaded, isSignedIn])

  const handleCreateTrip = async (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    try {
      console.log('[handleCreateTrip] Creating trip:', tripData)
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...tripData,
          learningTarget: tripData.learningTarget || {
            track: '15min',
          },
        }),
      })

      console.log('[handleCreateTrip] Response status:', response.status, response.statusText)

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('[handleCreateTrip] ❌ API ERROR:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData.error,
          details: errorData.details,
          requestId: errorData.requestId,
          debug: errorData.debug,
          fullError: errorData,
        })
        
        // Show detailed error in console for debugging
        if (errorData.requestId) {
          console.error(`[handleCreateTrip] Request ID: ${errorData.requestId} - Use this to find logs in production`)
        }
        
        throw new Error(errorData.error || errorData.details || 'Failed to create trip')
      }

      const data = await response.json()
      console.log('[handleCreateTrip] ✅ Trip created:', data.trip)
      // Refresh trips list
      await fetchTrips()
      setShowForm(false)
      showToast('Trip created successfully', 'success')
    } catch (error) {
      console.error('[handleCreateTrip] ❌ Failed to create trip:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create trip'
      console.error('[handleCreateTrip] Error message:', errorMessage)
      showToast(errorMessage, 'error')
    }
  }

  const calculateNumberOfDays = (start: string, end: string): number => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
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

      {isLoading ? (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 'var(--spacing-16)',
          }}
        >
          <LoadingSpinner size="lg" />
        </div>
      ) : trips.length === 0 ? (
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
                }}
              >
                {trip.baseLocation}
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-muted)',
                  lineHeight: 'var(--line-height-normal)',
                  marginTop: 'var(--spacing-2)',
                }}
              >
                {calculateNumberOfDays(trip.startDate, trip.endDate)} days
              </p>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
