'use client'

import { useDemoUser } from '@/contexts/DemoUserContext'
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

export default function TripDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { currentUserId, currentUser } = useDemoUser()
  const [trip, setTrip] = useState<Trip | null>(null)
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [isEditingTrip, setIsEditingTrip] = useState(false)

  const tripId = params.id as string

  useEffect(() => {
    const data = getData(currentUserId)
    const foundTrip = data.trips.find((t) => t.id === tripId)
    if (!foundTrip) {
      router.push('/')
      return
    }
    setTrip(foundTrip)
    setScheduleBlocks(data.scheduleBlocks[tripId] || [])
    setActivityLogs(data.activityLogs[tripId] || [])
  }, [currentUserId, tripId, router])

  const saveData = (updatedBlocks?: ScheduleBlock[], updatedLogs?: ActivityLog[], updatedTripData?: Trip) => {
    const data = getData(currentUserId)
    const tripToSave = updatedTripData || trip
    if (tripToSave) {
      const index = data.trips.findIndex((t) => t.id === tripId)
      if (index >= 0) {
        data.trips[index] = tripToSave
      }
      data.scheduleBlocks[tripId] = updatedBlocks !== undefined ? updatedBlocks : scheduleBlocks
      data.activityLogs[tripId] = updatedLogs !== undefined ? updatedLogs : activityLogs
      setData(currentUserId, data)
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

  const updateTrip = (updatedTrip: Trip) => {
    setTrip(updatedTrip)
    saveData(undefined, undefined, updatedTrip)
  }

  const handleEditTrip = (tripData: Omit<Trip, 'id' | 'createdAt'>) => {
    if (trip) {
      const updatedTrip: Trip = {
        ...trip,
        ...tripData,
      }
      updateTrip(updatedTrip)
      setIsEditingTrip(false)
      showToast('Trip updated successfully', 'success')
    }
  }

  if (!trip) {
    return (
      <div
        className="text-center py-12"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Loading...
      </div>
    )
  }

  const timezoneLabel = `Local time: ${currentUser.timezone}`

  return (
    <>
      {isEditingTrip ? (
        <div className="mb-8">
          <PageHeader
            title="Edit Trip"
            subtitle="Update trip details"
            breadcrumb={[
              { label: 'Trips', href: '/' },
              { label: trip.title, href: `/trips/${trip.id}` },
            ]}
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
            breadcrumb={[
              { label: 'Trips', href: '/' },
              { label: trip.title, href: `/trips/${trip.id}` },
            ]}
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
                timezone={currentUser.timezone}
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
                timezone={currentUser.timezone}
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
