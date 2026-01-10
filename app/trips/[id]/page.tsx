'use client'

import { useUser } from '@clerk/nextjs'
import { getData, setData } from '@/lib/storage'
import { generateScheduleBlocks } from '@/lib/schedule-generator'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type {
  Trip,
  ScheduleBlock,
  ActivityLog,
  LearningTarget,
  Artifact,
} from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Section } from '@/components/ui/Section'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { showToast } from '@/components/ui/Toast'
import { ScheduleItineraryTab } from '@/components/trips/ScheduleItineraryTab'
import { LogsTab } from '@/components/trips/LogsTab'
import { TargetsTab } from '@/components/trips/TargetsTab'
import { CreateTripForm } from '@/components/CreateTripForm'
import { TripHeader } from '@/components/trips/TripHeader'

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, isLoaded } = useUser()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isEditingTrip, setIsEditingTrip] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const tripId = params.id as string

  // Fetch trip from API
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn) {
      router.push('/')
      return
    }

    const fetchTrip = async () => {
      try {
        setIsLoading(true)
        const response = await fetch(`/api/trips/${tripId}`)
        if (!response.ok) {
          if (response.status === 404) {
            router.push('/home')
            return
          }
          throw new Error('Failed to fetch trip')
        }
        const data = await response.json()
        setTrip(data.trip)

        // Schedule blocks and activity logs are still stored in localStorage
        // TODO: Move these to API routes as well
        const localData = getData('current') // Use a placeholder key for now
        setScheduleBlocks(localData.scheduleBlocks[tripId] || [])
        setActivityLogs(localData.activityLogs[tripId] || [])
      } catch (error) {
        console.error('Failed to fetch trip:', error)
        showToast('Failed to load trip', 'error')
        router.push('/home')
      } finally {
        setIsLoading(false)
      }
    }

    fetchTrip()
  }, [isLoaded, isSignedIn, tripId, router])

  const saveData = async (updatedBlocks?: ScheduleBlock[], updatedLogs?: ActivityLog[], updatedTripData?: Trip) => {
    // Save schedule blocks and logs to localStorage (for now)
    const localData = getData('current')
    if (updatedBlocks !== undefined) {
      localData.scheduleBlocks[tripId] = updatedBlocks
    }
    if (updatedLogs !== undefined) {
      localData.activityLogs[tripId] = updatedLogs
    }
    setData('current', localData)

    // Save trip to API if updated
    if (updatedTripData && trip) {
      try {
        const response = await fetch(`/api/trips/${tripId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedTripData),
        })
        if (!response.ok) {
          throw new Error('Failed to update trip')
        }
        const data = await response.json()
        setTrip(data.trip)
      } catch (error) {
        console.error('Failed to update trip:', error)
        showToast('Failed to update trip', 'error')
      }
    }
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

  const updateScheduleBlocks = (newBlocks: ScheduleBlock[]) => {
    setScheduleBlocks(newBlocks)
    saveData(newBlocks)
  }

  const updateActivityLogs = (newLogs: ActivityLog[]) => {
    setActivityLogs(newLogs)
    saveData(undefined, newLogs)
  }

  const updateTrip = async (updatedTrip: Trip) => {
    setTrip(updatedTrip)
    await saveData(undefined, undefined, updatedTrip)
  }

  const handleEditTrip = async (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    if (trip) {
      const updatedTrip: Trip = {
        ...trip,
        ...tripData,
      }
      await updateTrip(updatedTrip)
      setIsEditingTrip(false)
      showToast('Trip updated successfully', 'success')
    }
  }

  if (isLoading || !trip) {
    return (
      <div
        className="text-center py-12"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Loading...
      </div>
    )
  }

  // Get timezone from user settings or default
  const timezone = 'America/New_York' // TODO: Get from user settings
  const timezoneLabel = `Local time: ${timezone}`

  return (
    <>
      <TripHeader tripName={trip.title} />
      {isEditingTrip ? (
        <div className="mb-8">
          <PageHeader
            title="Edit Trip"
            subtitle="Update trip details"
          />
          <CreateTripForm
            initialTrip={trip}
            onSubmit={handleEditTrip}
            onCancel={() => setIsEditingTrip(false)}
          />
        </div>
      ) : (
        <>
          <PageHeader
            title={trip.title}
            subtitle={`${formatDateRange(trip.startDate, trip.endDate)} • ${trip.baseLocation} • ${timezoneLabel}`}
            action={
              <Button variant="secondary" onClick={() => setIsEditingTrip(true)}>
                Edit Trip
              </Button>
            }
          />

          <Tabs
        tabs={[
          {
            id: 'schedule',
            label: 'Schedule',
            content: (
              <ScheduleItineraryTab
                trip={trip}
                scheduleBlocks={scheduleBlocks}
                onScheduleUpdate={updateScheduleBlocks}
                onTripUpdate={updateTrip}
                timezone={timezone}
              />
            ),
          },
          {
            id: 'logs',
            label: 'Activity Logs',
            content: (
              <LogsTab
                activityLogs={activityLogs}
                onUpdate={updateActivityLogs}
                timezone={timezone}
              />
            ),
          },
          {
            id: 'targets',
            label: 'Learning Targets',
            content: (
              <TargetsTab
                trip={trip}
                onUpdate={updateTrip}
              />
            ),
          },
          ]}
          defaultTab="schedule"
        />
        </>
      )}
    </>
  )
}
