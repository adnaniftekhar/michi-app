'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  location: string
  activityTitle?: string
}

/**
 * Gets approximate coordinates for a location (city/town level only)
 * Privacy-focused: only returns city-level coordinates
 */
async function getLocationCoordinates(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use a geocoding service that supports privacy controls
    // For now, return null to show placeholder
    // In production, use a service like OpenStreetMap Nominatim with city-level accuracy
    return null
  } catch (error) {
    console.error('Failed to geocode location:', error)
    return null
  }
}

/**
 * Gets a static map image URL
 * Privacy-focused: uses city-level coordinates only
 */
function getStaticMapUrl(lat: number, lng: number, location: string): string {
  // Using OpenStreetMap static map (no API key required, privacy-friendly)
  // Format: https://staticmap.openstreetmap.de/staticmap.php?center=lat,lng&zoom=12&size=600x400&markers=lat,lng
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=12&size=600x400&markers=${lat},${lng},red`
}

export function MapModal({ isOpen, onClose, location, activityTitle }: MapModalProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (isOpen && location) {
      setIsLoading(true)
      setHasError(false)
      
      // Try to get coordinates
      getLocationCoordinates(location)
        .then((coords) => {
          if (coords) {
            setCoordinates(coords)
            const url = getStaticMapUrl(coords.lat, coords.lng, location)
            setMapUrl(url)
            setIsLoading(false)
          } else {
            // No coordinates available - show placeholder
            setHasError(true)
            setIsLoading(false)
          }
        })
        .catch(() => {
          setHasError(true)
          setIsLoading(false)
        })
    } else {
      // Reset when modal closes
      setMapUrl(null)
      setCoordinates(null)
      setIsLoading(true)
      setHasError(false)
    }
  }, [isOpen, location])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: 'var(--color-surface)',
          borderRadius: 'var(--radius-card)',
          maxHeight: '90vh',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: 'var(--spacing-6)',
            borderBottom: '1px solid var(--color-border-subtle)',
          }}
        >
          <div>
            <h2
              style={{
                fontSize: 'var(--font-size-xl)',
                lineHeight: 'var(--line-height-tight)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--color-text-primary)',
                marginBottom: activityTitle ? 'var(--spacing-1)' : '0',
              }}
            >
              Map View
            </h2>
            {activityTitle && (
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  marginTop: 'var(--spacing-1)',
                }}
              >
                {activityTitle}
              </p>
            )}
            <p
              style={{
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
                marginTop: 'var(--spacing-1)',
              }}
            >
              {location}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl leading-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-opacity"
            style={{
              outlineColor: 'var(--color-focus-ring)',
              color: 'var(--color-text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.7'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
            aria-label="Close map"
          >
            ×
          </button>
        </div>

        {/* Map Content */}
        <div
          style={{
            padding: 'var(--spacing-6)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
            backgroundColor: 'var(--color-background)',
          }}
          role="img"
          aria-label={`Map showing location: ${location}`}
        >
          {isLoading && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Loading map...
            </div>
          )}
          
          {hasError && !isLoading && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                padding: 'var(--spacing-8)',
              }}
            >
              <div
                style={{
                  fontSize: 'var(--font-size-lg)',
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                🗺️
              </div>
              <p style={{ marginBottom: 'var(--spacing-2)' }}>
                Map unavailable
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Location: {location}
              </p>
            </div>
          )}

          {mapUrl && !isLoading && !hasError && (
            <img
              src={mapUrl}
              alt={`Map showing ${location}`}
              style={{
                width: '100%',
                height: 'auto',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
              }}
              onError={() => {
                setHasError(true)
                setMapUrl(null)
              }}
            />
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3"
          style={{
            padding: 'var(--spacing-6)',
            borderTop: '1px solid var(--color-border-subtle)',
          }}
        >
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}
