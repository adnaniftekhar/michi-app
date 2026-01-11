'use client'

import { useState, useEffect, useRef } from 'react'
import type { Trip } from '@/types'
import { Input } from './ui/Input'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

interface CreateTripFormProps {
  onSubmit: (trip: Omit<Trip, 'id' | 'createdAt'>) => void
  onCancel: () => void
  initialTrip?: Trip // Optional: if provided, form is in edit mode
}

interface CitySuggestion {
  id: string
  name: string
  fullAddress: string
  location?: { lat: number; lng: number }
}

export function CreateTripForm({ onSubmit, onCancel, initialTrip }: CreateTripFormProps) {
  const [title, setTitle] = useState('')
  const [numberOfDays, setNumberOfDays] = useState('')
  const [baseLocation, setBaseLocation] = useState('')
  const [locationQuery, setLocationQuery] = useState('')
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null)
  const locationInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Initialize form with trip data if editing
  useEffect(() => {
    if (initialTrip) {
      setTitle(initialTrip.title)
      setBaseLocation(initialTrip.baseLocation)
      setLocationQuery(initialTrip.baseLocation)
      
      // Calculate number of days from dates
      const start = new Date(initialTrip.startDate)
      const end = new Date(initialTrip.endDate)
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
      setNumberOfDays(days.toString())
    }
  }, [initialTrip])

  // Fetch city suggestions
  useEffect(() => {
    if (!locationQuery || locationQuery.trim().length < 2) {
      setCitySuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/cities?query=${encodeURIComponent(locationQuery)}`)
        if (response.ok) {
          const data = await response.json()
          setCitySuggestions(data.cities || [])
          setShowSuggestions(true)
        }
      } catch (error) {
        console.error('Failed to fetch city suggestions:', error)
        setCitySuggestions([])
      }
    }, 300) // Debounce 300ms

    return () => clearTimeout(timeoutId)
  }, [locationQuery])

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        locationInputRef.current &&
        !locationInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCitySelect = (city: CitySuggestion) => {
    setSelectedCity(city)
    setBaseLocation(city.name)
    setLocationQuery(city.name)
    setShowSuggestions(false)
  }

  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocationQuery(value)
    setBaseLocation(value)
    setSelectedCity(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title || !numberOfDays || !baseLocation) {
      return
    }

    const days = parseInt(numberOfDays, 10)
    if (isNaN(days) || days < 1) {
      return
    }

    // Calculate start and end dates from number of days
    // Start date is today, end date is start date + (numberOfDays - 1)
    const startDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    
    const endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + (days - 1))

    const startDateString = startDate.toISOString().split('T')[0]
    const endDateString = endDate.toISOString().split('T')[0]

    onSubmit({ 
      title, 
      startDate: startDateString, 
      endDate: endDateString, 
      baseLocation 
    })
    
    if (!initialTrip) {
      // Only clear if creating new trip
      setTitle('')
      setNumberOfDays('')
      setBaseLocation('')
      setLocationQuery('')
      setSelectedCity(null)
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
        <Input
          label="Number of Days"
          type="number"
          name="numberOfDays"
          value={numberOfDays}
          onChange={(e) => setNumberOfDays(e.target.value)}
          min="1"
          max="365"
          required
          helperText="Trip duration in days"
        />
        <div className="relative">
          <Input
            ref={locationInputRef}
            label="Base Location"
            type="text"
            name="baseLocation"
            value={locationQuery}
            onChange={handleLocationChange}
            onFocus={() => {
              if (citySuggestions.length > 0) {
                setShowSuggestions(true)
              }
            }}
            required
            placeholder="Start typing a city name..."
            helperText="City autocomplete - start typing to see suggestions"
          />
          {showSuggestions && citySuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-md shadow-lg max-h-60 overflow-auto"
              style={{
                backgroundColor: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
              }}
            >
              {citySuggestions.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleCitySelect(city)}
                  className="w-full text-left px-4 py-2 hover:bg-surface-hover transition-colors"
                  style={{
                    color: 'var(--color-text-primary)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--color-surface-hover)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div className="font-medium">{city.name}</div>
                  {city.fullAddress && city.fullAddress !== city.name && (
                    <div className="text-sm opacity-70">{city.fullAddress}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
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
