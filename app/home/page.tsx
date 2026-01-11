'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState, useRef } from 'react'
import type { Trip } from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateTripForm } from '@/components/CreateTripForm'
import { showToast } from '@/components/ui/Toast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { getTripImageUrl, getTripImageAlt } from '@/lib/trip-images'
import Link from 'next/link'

// localStorage key for trips
const TRIPS_STORAGE_KEY = 'michi_user_trips'

// Helper to get trips from localStorage
function getStoredTrips(userId: string): Trip[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(`${TRIPS_STORAGE_KEY}_${userId}`)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (e) {
    console.error('Error reading trips from localStorage:', e)
  }
  return []
}

// Helper to save trips to localStorage
function saveTripsToStorage(userId: string, trips: Trip[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${TRIPS_STORAGE_KEY}_${userId}`, JSON.stringify(trips))
  } catch (e) {
    console.error('Error saving trips to localStorage:', e)
  }
}

export default function Home() {
  const { isSignedIn, isLoaded, user } = useUser()
  const [trips, setTrips] = useState<Trip[]>([])
  const [showForm, setShowForm] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load trips from localStorage (primary storage now)
  const loadTrips = () => {
    if (!isLoaded || !isSignedIn || !user) {
      setIsLoading(false)
      return
    }

    const storedTrips = getStoredTrips(user.id)
    setTrips(storedTrips)
    setIsLoading(false)
  }

  useEffect(() => {
    loadTrips()
  }, [isLoaded, isSignedIn, user])

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
      
      // Save to localStorage (primary storage)
      if (user) {
        const currentTrips = getStoredTrips(user.id)
        const updatedTrips = [...currentTrips, data.trip]
        saveTripsToStorage(user.id, updatedTrips)
        setTrips(updatedTrips)
      }
      
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

  // Drag and drop state
  const [draggedTripId, setDraggedTripId] = useState<string | null>(null)
  const [dragOverTripId, setDragOverTripId] = useState<string | null>(null)
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleDragStart = (e: React.DragEvent, tripId: string) => {
    setDraggedTripId(tripId)
    e.dataTransfer.effectAllowed = 'move'
    // Add a slight delay to allow the drag ghost to render
    setTimeout(() => {
      const el = document.getElementById(`trip-${tripId}`)
      if (el) el.style.opacity = '0.5'
    }, 0)
  }

  const handleDragEnd = () => {
    // Reset all opacity
    trips.forEach(trip => {
      const el = document.getElementById(`trip-${trip.id}`)
      if (el) el.style.opacity = '1'
    })
    setDraggedTripId(null)
    setDragOverTripId(null)
    if (dragTimeoutRef.current) {
      clearTimeout(dragTimeoutRef.current)
    }
  }

  const handleDragOver = (e: React.DragEvent, tripId: string) => {
    e.preventDefault()
    if (tripId !== draggedTripId) {
      setDragOverTripId(tripId)
    }
  }

  const handleDragLeave = () => {
    // Use timeout to prevent flickering
    dragTimeoutRef.current = setTimeout(() => {
      setDragOverTripId(null)
    }, 50)
  }

  const handleDrop = (e: React.DragEvent, targetTripId: string) => {
    e.preventDefault()
    if (!draggedTripId || draggedTripId === targetTripId) return

    const draggedIndex = trips.findIndex(t => t.id === draggedTripId)
    const targetIndex = trips.findIndex(t => t.id === targetTripId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Reorder trips
    const newTrips = [...trips]
    const [draggedTrip] = newTrips.splice(draggedIndex, 1)
    newTrips.splice(targetIndex, 0, draggedTrip)

    setTrips(newTrips)
    
    // Save new order to localStorage
    if (user) {
      saveTripsToStorage(user.id, newTrips)
    }

    setDraggedTripId(null)
    setDragOverTripId(null)
    showToast('Trip order updated', 'success')
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
        <>
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: 'var(--color-text-muted)',
              marginBottom: 'var(--spacing-4)',
              fontStyle: 'italic',
            }}
          >
            💡 Drag trips to reorder them
          </p>
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            style={{
              gap: 'var(--spacing-6)',
            }}
          >
            {trips.map((trip, index) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                id={`trip-${trip.id}`}
                draggable
                onDragStart={(e) => handleDragStart(e, trip.id)}
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, trip.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, trip.id)}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  borderRadius: 'var(--radius-lg)',
                  overflow: 'hidden',
                  backgroundColor: 'var(--color-surface)',
                  border: dragOverTripId === trip.id 
                    ? '2px solid var(--color-primary)' 
                    : '1px solid var(--color-border)',
                  boxShadow: dragOverTripId === trip.id 
                    ? '0 4px 12px rgba(0,0,0,0.15)' 
                    : 'var(--shadow-sm)',
                  transition: 'all 0.2s ease',
                  cursor: 'grab',
                  transform: dragOverTripId === trip.id ? 'scale(1.02)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  if (!draggedTripId) {
                    e.currentTarget.style.boxShadow = 'var(--shadow-md)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!draggedTripId && dragOverTripId !== trip.id) {
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }
                }}
              >
                {/* Trip Image */}
                <div
                  style={{
                    width: '100%',
                    height: '160px',
                    backgroundImage: `url(${getTripImageUrl(trip.baseLocation, index)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    position: 'relative',
                  }}
                >
                  {/* Gradient overlay for better text readability */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: 0,
                      right: 0,
                      height: '60%',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
                    }}
                  />
                  {/* Days badge */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 'var(--spacing-3)',
                      right: 'var(--spacing-3)',
                      backgroundColor: 'rgba(0,0,0,0.6)',
                      color: 'white',
                      padding: 'var(--spacing-1) var(--spacing-3)',
                      borderRadius: 'var(--radius-full)',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 'var(--font-weight-medium)',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {calculateNumberOfDays(trip.startDate, trip.endDate)} days
                  </div>
                  {/* Drag handle indicator */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 'var(--spacing-3)',
                      left: 'var(--spacing-3)',
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      color: 'white',
                      padding: 'var(--spacing-1)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: 'var(--font-size-xs)',
                      backdropFilter: 'blur(4px)',
                      display: 'flex',
                      gap: '2px',
                    }}
                    title="Drag to reorder"
                  >
                    <span style={{ opacity: 0.8 }}>⋮⋮</span>
                  </div>
                </div>
                
                {/* Trip Info */}
                <div style={{ padding: 'var(--spacing-4)' }}>
                  <h2
                    style={{
                      fontSize: 'var(--font-size-lg)',
                      lineHeight: 'var(--line-height-tight)',
                      fontWeight: 'var(--font-weight-semibold)',
                      color: 'var(--color-text-primary)',
                      marginBottom: 'var(--spacing-2)',
                    }}
                  >
                    {trip.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-secondary)',
                      lineHeight: 'var(--line-height-normal)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-1)',
                    }}
                  >
                    <span style={{ opacity: 0.7 }}>📍</span>
                    {trip.baseLocation}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </>
  )
}
