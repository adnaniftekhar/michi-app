'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

// Common IANA timezones
const IANA_TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Honolulu',
  'America/Toronto',
  'America/Vancouver',
  'America/Mexico_City',
  'America/Sao_Paulo',
  'America/Buenos_Aires',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Amsterdam',
  'Europe/Stockholm',
  'Europe/Athens',
  'Europe/Moscow',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Bangkok',
  'Asia/Seoul',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu',
]

interface TimezoneComboboxProps {
  value: string
  onChange: (timezone: string) => void
  detectedTimezone?: string
}

export function TimezoneCombobox({ value, onChange, detectedTimezone }: TimezoneComboboxProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredTimezones = useMemo(() => {
    if (!searchQuery.trim()) return IANA_TIMEZONES
    const query = searchQuery.toLowerCase()
    return IANA_TIMEZONES.filter(tz => 
      tz.toLowerCase().includes(query) ||
      tz.split('/').some(part => part.toLowerCase().includes(query))
    )
  }, [searchQuery])

  const handleSelect = (timezone: string) => {
    onChange(timezone)
    setIsOpen(false)
    setSearchQuery('')
  }

  return (
    <div className="relative">
      <Input
        label="Timezone"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder={detectedTimezone ? `Detected: ${detectedTimezone}` : 'Select timezone'}
        helperText="IANA timezone identifier (e.g., America/New_York)"
      />
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <Card
            className="absolute z-20 mt-2 w-full max-h-[300px] overflow-hidden"
            style={{
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="p-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search timezones..."
                className="w-full p-2 rounded"
                style={{
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
                autoFocus
              />
            </div>
            <div className="max-h-[250px] overflow-y-auto">
              {filteredTimezones.length === 0 ? (
                <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No timezones found
                </div>
              ) : (
                filteredTimezones.map((tz) => (
                  <button
                    key={tz}
                    type="button"
                    onClick={() => handleSelect(tz)}
                    className="w-full text-left px-4 py-2 hover:bg-opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                    style={{
                      backgroundColor: value === tz ? 'var(--color-michi-green)' : 'transparent',
                      color: value === tz ? 'var(--color-background)' : 'var(--color-text-primary)',
                      outlineColor: 'var(--color-focus-ring)',
                    }}
                  >
                    {tz}
                  </button>
                ))
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

