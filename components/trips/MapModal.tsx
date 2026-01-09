'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  location: string
  activityTitle?: string
  coordinates?: { lat: number; lng: number }
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

export function MapModal({ isOpen, onClose, location, activityTitle, coordinates: providedCoordinates }: MapModalProps) {
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [mapsLoaded, setMapsLoaded] = useState(false)

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Check if script is already loaded and API is ready
    if (window.google?.maps && window.google.maps.Map) {
      console.log('Google Maps API already loaded')
      setMapsLoaded(true)
      return
    }

    const script = document.createElement('script')
    // Next.js exposes env vars prefixed with NEXT_PUBLIC_ to the client
    const apiKey = process.env.NEXT_PUBLIC_MAPS_BROWSER_KEY || ''
    
    console.log('Maps API Key check:', {
      hasKey: !!apiKey,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...',
    })
    
    if (!apiKey) {
      console.error('NEXT_PUBLIC_MAPS_BROWSER_KEY is not set. Please add it to your .env.local file.')
      setHasError(true)
      setIsLoading(false)
      return
    }
    
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&loading=async&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => {
      // Wait a bit to ensure the API is fully initialized
      setTimeout(() => {
        if (window.google?.maps && window.google.maps.Map) {
          console.log('Google Maps API loaded and ready')
          setMapsLoaded(true)
        } else {
          console.error('Google Maps API loaded but Map constructor not available')
          setHasError(true)
          setIsLoading(false)
        }
      }, 100)
    }
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error)
      setHasError(true)
      setIsLoading(false)
    }
    document.head.appendChild(script)

    return () => {
      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript) {
        // Don't remove - might be used by other components
      }
    }
  }, [])

  // Initialize map when modal opens and Maps API is loaded
  useEffect(() => {
    if (!isOpen) {
      // Reset state when modal closes
      setMap(null)
      setMarker(null)
      setIsLoading(true)
      setHasError(false)
      return
    }
    
    if (!mapsLoaded) {
      console.log('Waiting for Maps API to load...')
      setIsLoading(true)
      return
    }
    
    const mapContainer = mapContainerRef.current
    if (!mapContainer) {
      console.warn('Map container ref not set')
      setIsLoading(true)
      return
    }

    const coords = providedCoordinates || null

    if (!coords) {
      console.warn('No coordinates provided for map:', { 
        location, 
        providedCoordinates,
        hasCoordinates: !!providedCoordinates,
        coordinatesValue: providedCoordinates
      })
      setHasError(true)
      setIsLoading(false)
      return
    }
    
    if (!coords.lat || !coords.lng || isNaN(coords.lat) || isNaN(coords.lng)) {
      console.error('Invalid coordinates provided:', coords)
      setHasError(true)
      setIsLoading(false)
      return
    }
    
    console.log('Initializing map with coordinates:', coords)

    // Check if Google Maps API is actually loaded
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.error('Google Maps API not loaded yet', {
        hasGoogle: !!window.google,
        hasMaps: !!(window.google && window.google.maps),
        hasMapConstructor: !!(window.google && window.google.maps && window.google.maps.Map),
      })
      setHasError(true)
      setIsLoading(false)
      return
    }

    try {
      // Initialize map
      const newMap = new window.google.maps.Map(mapContainer, {
        center: { lat: coords.lat, lng: coords.lng },
        zoom: 12,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
          {
            featureType: 'all',
            elementType: 'geometry',
            stylers: [{ color: '#1d1d1d' }],
          },
          {
            featureType: 'all',
            elementType: 'labels.text.fill',
            stylers: [{ color: '#ffffff' }],
          },
        ],
      })

      // Add marker
      const newMarker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: newMap,
        title: activityTitle || location,
        ariaLabel: `Location: ${location}`,
      })

      setMap(newMap)
      setMarker(newMarker)
      setIsLoading(false)
      setHasError(false)
    } catch (error) {
      console.error('Error initializing map:', error)
      setHasError(true)
      setIsLoading(false)
    }

    return () => {
      if (marker) {
        marker.setMap(null)
      }
      if (map) {
        // Map will be cleaned up by Google Maps API
      }
    }
  }, [isOpen, mapsLoaded, providedCoordinates, location, activityTitle])

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
            position: 'relative',
          }}
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
                  marginBottom: 'var(--spacing-2)',
                }}
              >
                Location: {location}
              </p>
              {!providedCoordinates && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--spacing-2)',
                  }}
                >
                  No coordinates available. Maps require location data from Places API.
                </p>
              )}
              {providedCoordinates && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-tertiary)',
                    marginTop: 'var(--spacing-2)',
                  }}
                >
                  Coordinates: {providedCoordinates.lat.toFixed(4)}, {providedCoordinates.lng.toFixed(4)}
                </p>
              )}
            </div>
          )}

          {!hasError && (
            <div
              ref={mapContainerRef}
              style={{
                width: '100%',
                height: '400px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                overflow: 'hidden',
              }}
              role="application"
              aria-label={`Interactive map showing location: ${location}`}
              tabIndex={0}
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
