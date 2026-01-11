'use client'

import { useUser } from '@clerk/nextjs'
import { getData, setData } from '@/lib/storage'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import type {
  Trip,
  ScheduleBlock,
  ActivityLog,
} from '@/types'
import { PageHeader } from '@/components/ui/PageHeader'
import { Tabs } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { showToast } from '@/components/ui/Toast'
import { ScheduleItineraryTab } from '@/components/trips/ScheduleItineraryTab'
import { LogsTab } from '@/components/trips/LogsTab'
import { TargetsTab } from '@/components/trips/TargetsTab'
import { CreateTripForm } from '@/components/CreateTripForm'
import { TripHeader } from '@/components/trips/TripHeader'

// localStorage key for trips (same as home page)
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

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { isSignedIn, isLoaded, user } = useUser()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isEditingTrip, setIsEditingTrip] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const tripId = params.id as string

  // Load trip from localStorage
  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      router.push('/')
      return
    }

    // Load trip from localStorage
    const storedTrips = getStoredTrips(user.id)
    const foundTrip = storedTrips.find(t => t.id === tripId)
    
    if (!foundTrip) {
      showToast('Trip not found', 'error')
      router.push('/home')
      return
    }
    
    setTrip(foundTrip)

    // Load schedule blocks and activity logs from lib/storage
    const localData = getData('current')
    setScheduleBlocks(localData.scheduleBlocks[tripId] || [])
    setActivityLogs(localData.activityLogs[tripId] || [])
    
    setIsLoading(false)
  }, [isLoaded, isSignedIn, user, tripId, router])

  const saveData = (updatedBlocks?: ScheduleBlock[], updatedLogs?: ActivityLog[], updatedTripData?: Trip) => {
    // Save schedule blocks and logs to localStorage
    const localData = getData('current')
    if (updatedBlocks !== undefined) {
      localData.scheduleBlocks[tripId] = updatedBlocks
    }
    if (updatedLogs !== undefined) {
      localData.activityLogs[tripId] = updatedLogs
    }
    setData('current', localData)

    // Save trip updates to localStorage
    if (updatedTripData && user) {
      const storedTrips = getStoredTrips(user.id)
      const tripIndex = storedTrips.findIndex(t => t.id === tripId)
      if (tripIndex >= 0) {
        storedTrips[tripIndex] = updatedTripData
        saveTripsToStorage(user.id, storedTrips)
      }
    }
  }

  const calculateNumberOfDays = (start: string, end: string): number => {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
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
    saveData(undefined, undefined, updatedTrip)
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
            subtitle={`${calculateNumberOfDays(trip.startDate, trip.endDate)} days • ${trip.baseLocation} • ${timezoneLabel}`}
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
