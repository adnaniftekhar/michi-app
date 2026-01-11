'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/Button'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'

interface MapModalProps {
  isOpen: boolean
  onClose: () => void
  location: string
  activityTitle?: string
  coordinates?: { lat: number; lng: number }
}

/**
 * Gets a static map image URL using Google Static Maps API
 * Falls back to OpenStreetMap if no API key is available
 */
function getStaticMapUrl(lat: number, lng: number, location: string, mapsKey?: string | null): string {
  if (mapsKey) {
    // Use Google Static Maps API
    const size = '600x400'
    const zoom = 12
    const marker = `${lat},${lng}`
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:0x6FBF9A|${marker}&key=${mapsKey}`
  }
  // Fallback to OpenStreetMap if no API key
  return `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=12&size=600x400&markers=${lat},${lng},red`
}

export function MapModal({ isOpen, onClose, location, activityTitle, coordinates: providedCoordinates }: MapModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)
  
  // Coordinate state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(providedCoordinates || null)
  const [resolveStatus, setResolveStatus] = useState<'idle' | 'loading' | 'success' | 'failed'>('idle')
  
  // Maps key and status
  const [mapsKey, setMapsKey] = useState<string | null>(null)
  const [mapsStatus, setMapsStatus] = useState<'idle' | 'loading' | 'ready' | 'failed'>('idle')

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMap(null)
      setMarker(null)
      setCoords(providedCoordinates || null)
      setResolveStatus('idle')
      setMapsKey(null)
      setMapsStatus('idle')
      return
    }
  }, [isOpen, providedCoordinates])

  // Resolve coordinates server-side if missing
  useEffect(() => {
    if (!isOpen) return

    // If coordinates are provided, use them
    if (providedCoordinates) {
      setCoords(providedCoordinates)
      setResolveStatus('success')
      return
    }

    // If no location string, can't resolve
    if (!location || location.trim().length === 0) {
      setResolveStatus('failed')
      return
    }

    // If we already have coords from previous resolution, use them
    if (coords) {
      setResolveStatus('success')
      return
    }

    // Resolve location server-side
    let isCancelled = false

    const resolveLocation = async () => {
      try {
        setResolveStatus('loading')

        const response = await fetch('/api/places/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: location }),
        })

        if (isCancelled) return

        if (!response.ok) {
          if (response.status === 404) {
            setResolveStatus('failed')
            return
          }
          setResolveStatus('failed')
          return
        }

        const data = await response.json()
        if (data.location && data.location.lat && data.location.lng) {
          setCoords({
            lat: data.location.lat,
            lng: data.location.lng,
          })
          setResolveStatus('success')
        } else {
          setResolveStatus('failed')
        }
      } catch (error) {
        if (isCancelled) return
        console.error('Failed to resolve location:', error)
        setResolveStatus('failed')
      }
    }

    resolveLocation()

    return () => {
      isCancelled = true
    }
  }, [isOpen, location, providedCoordinates, coords])

  // Fetch Maps browser key at runtime (even if coords missing - we'll try geocoding)
  useEffect(() => {
    if (!isOpen) return

    const fetchMapsKey = async () => {
      console.log('[MapModal] 🔍 Starting Maps API key fetch...')
      try {
        console.log('[MapModal] 📡 Fetching /api/public-config...')
        const response = await fetch('/api/public-config')
        console.log('[MapModal] 📥 Response status:', response.status, response.statusText)
        
        if (!response.ok) {
          console.error('[MapModal] ❌ public-config API returned error:', response.status, response.statusText)
          setMapsStatus('failed')
          return
        }

        const data = await response.json()
        console.log('[MapModal] 📦 Response data:', {
          hasMapsBrowserKey: !!data.mapsBrowserKey,
          keyLength: data.mapsBrowserKey?.length || 0,
          keyPrefix: data.mapsBrowserKey ? data.mapsBrowserKey.substring(0, 8) + '...' : 'empty',
          fullData: data
        })
        
        const key = data.mapsBrowserKey || ''

        if (!key || key.trim().length === 0) {
          console.error('[MapModal] ❌ Maps API key is empty or missing')
          console.error('[MapModal] 💡 Solution: Add NEXT_PUBLIC_MAPS_BROWSER_KEY to .env.local and restart server')
          setMapsStatus('failed')
          return
        }

        console.log('[MapModal] ✅ Maps API key received, length:', key.length)
        setMapsKey(key)
        setMapsStatus('loading')

        // Load Google Maps using @googlemaps/js-api-loader functional API
        try {
          console.log('[MapModal] ⚙️  Configuring Maps API loader...')
          setOptions({
            key: key,
            v: 'weekly',
          })
          console.log('[MapModal] ✅ Maps API options set')
          
          console.log('[MapModal] 📚 Importing maps library...')
          await importLibrary('maps')
          console.log('[MapModal] ✅ Maps library imported')
          
          console.log('[MapModal] 📚 Importing geocoding library...')
          await importLibrary('geocoding')
          console.log('[MapModal] ✅ Geocoding library imported')
          
          console.log('[MapModal] 📚 Importing places library...')
          await importLibrary('places')
          console.log('[MapModal] ✅ Places library imported')
          
          // Verify Maps API is ready
          console.log('[MapModal] 🔍 Verifying Maps API is ready...')
          console.log('[MapModal] window.google exists:', !!window.google)
          console.log('[MapModal] window.google.maps exists:', !!window.google?.maps)
          console.log('[MapModal] window.google.maps.Map exists:', !!window.google?.maps?.Map)
          
          if (window.google?.maps?.Map) {
            console.log('[MapModal] ✅ Maps API is ready!')
            setMapsStatus('ready')
          } else {
            console.error('[MapModal] ❌ Maps API not ready - window.google.maps.Map is missing')
            console.error('[MapModal] Available:', {
              hasGoogle: !!window.google,
              hasMaps: !!window.google?.maps,
              mapsKeys: window.google?.maps ? Object.keys(window.google.maps) : []
            })
            setMapsStatus('failed')
          }
        } catch (loadError) {
          console.error('[MapModal] ❌ Failed to load Maps libraries:', loadError)
          console.error('[MapModal] Error details:', {
            name: loadError instanceof Error ? loadError.name : 'Unknown',
            message: loadError instanceof Error ? loadError.message : String(loadError),
            stack: loadError instanceof Error ? loadError.stack : undefined
          })
          setMapsStatus('failed')
        }
      } catch (error) {
        console.error('[MapModal] ❌ Failed to load Maps API:', error)
        console.error('[MapModal] Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        setMapsStatus('failed')
      }
    }

    fetchMapsKey()
  }, [isOpen])

  // Initialize interactive map when Maps API is ready
  // Includes robust fallback: server coords -> client-side geocoding -> static map
  useEffect(() => {
    if (!isOpen) {
      setMap(null)
      setMarker(null)
      return
    }

    if (mapsStatus !== 'ready' || !mapContainerRef.current) {
      return
    }

    if (!window.google?.maps?.Map) {
      return
    }

    const mapContainer = mapContainerRef.current
    if (!mapContainer) return

    // Helper to setup map instance
    const setupMap = (lat: number, lng: number) => {
      try {
        const newMap = new window.google.maps.Map(mapContainer, {
          center: { lat, lng },
          zoom: 13,
          disableDefaultUI: false,
          fullscreenControl: true,
          styles: [
            { featureType: 'all', elementType: 'geometry', stylers: [{ color: '#1d1d1d' }] },
            { featureType: 'all', elementType: 'labels.text.fill', stylers: [{ color: '#ffffff' }] },
            { featureType: 'all', elementType: 'labels.text.stroke', stylers: [{ visibility: 'off' }] },
          ],
        })

        const newMarker = new window.google.maps.Marker({
          position: { lat, lng },
          map: newMap,
          title: activityTitle || location,
          ariaLabel: `Location: ${location}`,
        })

        setMap(newMap)
        setMarker(newMarker)
      } catch (e) {
        console.error('Error creating map:', e)
        // Keep static map visible if interactive init fails
      }
    }

    // LOGIC: Use provided coordinates OR resolved coords OR fallback to client-side Geocoding
    const finalCoords = providedCoordinates || coords

    if (finalCoords && finalCoords.lat && finalCoords.lng) {
      // 1. We have coordinates (from server or previous resolution) - use them
      setupMap(finalCoords.lat, finalCoords.lng)
    } else if (location && window.google?.maps?.Geocoder) {
      // 2. No coordinates? Try client-side geocoding as fallback!
      console.log('No coordinates provided, attempting client-side geocoding for:', location)
      const geocoder = new window.google.maps.Geocoder()

      geocoder.geocode({ address: location }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const lat = results[0].geometry.location.lat()
          const lng = results[0].geometry.location.lng()
          // Update coords state so static map can use them too
          setCoords({ lat, lng })
          setResolveStatus('success')
          setupMap(lat, lng)
        } else {
          console.error('Client-side geocoding failed:', status)
          // Keep static map visible if geocoding fails
        }
      })
    }

    return () => {
      // Cleanup: marker is captured in closure, no need to add to deps
      if (marker) {
        marker.setMap(null)
      }
    }
  }, [
    isOpen,
    mapsStatus,
    providedCoordinates?.lat ?? null,
    providedCoordinates?.lng ?? null,
    coords?.lat ?? null,
    coords?.lng ?? null,
    location,
    activityTitle,
  ])

  if (!isOpen) return null

  // Determine what to render
  const hasCoordinates = !!coords && !isNaN(coords.lat) && !isNaN(coords.lng)
  const canShowInteractiveMap = hasCoordinates && mapsStatus === 'ready' && window.google?.maps?.Map
  // Static map is ALWAYS shown if coords exist (baseline), interactive map is enhancement
  const canShowStaticMap = hasCoordinates && !canShowInteractiveMap
  const isResolving = resolveStatus === 'loading'

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
          {/* Loading state: resolving coordinates */}
          {isResolving && (
            <div style={{ color: 'var(--color-text-secondary)' }}>
              Resolving location...
            </div>
          )}

          {/* Error state: no coordinates could be resolved */}
          {!isResolving && !hasCoordinates && (
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
                Map unavailable for this location
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-tertiary)',
                  marginTop: 'var(--spacing-2)',
                }}
              >
                {location}
              </p>
            </div>
          )}

          {/* Warning: Maps API key not configured */}
          {mapsStatus === 'failed' && hasCoordinates && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--color-text-secondary)',
                padding: 'var(--spacing-4)',
                backgroundColor: 'var(--color-background)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--color-border)',
                marginBottom: 'var(--spacing-4)',
              }}
            >
              <p style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--spacing-2)' }}>
                ⚠️ Interactive maps require a Google Maps API key
              </p>
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-tertiary)',
                }}
              >
                Add NEXT_PUBLIC_MAPS_BROWSER_KEY to .env.local and restart the server
              </p>
            </div>
          )}

          {/* Interactive Google Map (preferred, shown when ready) */}
          {!isResolving && canShowInteractiveMap && (
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

          {/* Static map fallback (ALWAYS shown if coords exist and interactive map is not ready) */}
          {!isResolving && canShowStaticMap && coords && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 'var(--spacing-4)',
              }}
            >
              <img
                src={getStaticMapUrl(coords.lat, coords.lng, location, mapsKey)}
                alt={`Map showing ${location}`}
                style={{
                  width: '100%',
                  maxWidth: '600px',
                  height: '400px',
                  objectFit: 'cover',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--color-border)',
                }}
                onError={(e) => {
                  // If static map fails to load, show placeholder
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const parent = target.parentElement
                  if (parent && !parent.querySelector('.map-placeholder')) {
                    const placeholder = document.createElement('div')
                    placeholder.className = 'map-placeholder'
                    placeholder.style.cssText = 'width: 100%; max-width: 600px; height: 400px; display: flex; align-items: center; justify-content: center; background: var(--color-surface); border-radius: var(--radius-sm); color: var(--color-text-secondary); flex-direction: column; gap: var(--spacing-2);'
                    placeholder.innerHTML = '<div style="font-size: 2rem;">🗺️</div><div>Map preview unavailable</div>'
                    parent.appendChild(placeholder)
                  }
                }}
              />
            </div>
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
