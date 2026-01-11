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
      const requestBody = {
        ...tripData,
        learningTarget: tripData.learningTarget || {
          track: '15min',
        },
      }
      
      console.log('[handleCreateTrip] Creating trip:', requestBody)
      console.log('[handleCreateTrip] Request body stringified:', JSON.stringify(requestBody))
      
      const response = await fetch('/api/trips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log('[handleCreateTrip] Response status:', response.status, response.statusText)

      if (!response.ok) {
        // Read response as text first to avoid losing details if JSON parsing fails
        const responseText = await response.text()
        let errorData: any
        try {
          errorData = JSON.parse(responseText)
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}`, rawResponse: responseText }
        }
        
        // Log FULL error details for debugging
        console.group('🚨 TRIP CREATION FAILED - Full Error Details')
        console.error('Status:', response.status, response.statusText)
        console.error('Error:', errorData.error)
        console.error('Details:', errorData.details)
        console.error('Validation Errors:', errorData.validationErrors)
        console.error('Request ID:', errorData.requestId)
        console.error('Full Error Object:', errorData)
        console.error('Raw Response Text:', responseText)
        console.error('Response Headers:', Object.fromEntries(response.headers.entries()))
        console.groupEnd()
        
        // Show detailed error in console for debugging
        if (errorData.requestId) {
          console.error(`[handleCreateTrip] 🔍 Request ID: ${errorData.requestId} - Use this to find logs in production`)
        }
        
        // Create a more detailed error message
        let errorMsg = errorData.details || errorData.error || 'Failed to create trip'
        
        // If there are validation errors, include them in the message
        if (errorData.validationErrors && Array.isArray(errorData.validationErrors) && errorData.validationErrors.length > 0) {
          errorMsg = `Validation failed: ${errorData.validationErrors.join('; ')}`
        }
        
        const detailedError = new Error(errorMsg)
        // Attach full error data to the error object for inspection
        ;(detailedError as any).errorData = errorData
        ;(detailedError as any).status = response.status
        ;(detailedError as any).requestId = errorData.requestId
        ;(detailedError as any).validationErrors = errorData.validationErrors
        
        throw detailedError
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
