'use client'

import { useState, useEffect } from 'react'
import type { Trip } from '@/types'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface CreateTripFormProps {
  onSubmit: (trip: Omit<Trip, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initialTrip?: Trip // Optional: if provided, form is in edit mode
}

export function CreateTripForm({ onSubmit, onCancel, initialTrip }: CreateTripFormProps) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [baseLocation, setBaseLocation] = useState('')

  // Initialize form with trip data if editing
  useEffect(() => {
    if (initialTrip) {
      setTitle(initialTrip.title)
      setStartDate(initialTrip.startDate)
      setEndDate(initialTrip.endDate)
      setBaseLocation(initialTrip.baseLocation)
    }
  }, [initialTrip])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title && startDate && endDate && baseLocation) {
      onSubmit({ title, startDate, endDate, baseLocation })
      if (!initialTrip) {
        // Only clear if creating new trip
        setTitle('')
        setStartDate('')
        setEndDate('')
        setBaseLocation('')
      }
    }
  }

  return (
    <Card>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          type="text"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            name="startDate"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            label="End Date"
            type="date"
            name="endDate"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <Input
          label="Base Location"
          type="text"
          name="baseLocation"
          value={baseLocation}
          onChange={(e) => setBaseLocation(e.target.value)}
          required
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit">{initialTrip ? 'Save' : 'Create'}</Button>
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Card>
  )
}
