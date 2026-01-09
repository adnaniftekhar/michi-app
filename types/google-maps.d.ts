/**
 * Type declarations for Google Maps JavaScript API
 * These types are available when the Google Maps script is loaded
 */

declare namespace google {
  namespace maps {
    class Map {
      constructor(mapDiv: HTMLElement | null, opts?: MapOptions)
      setCenter(latlng: LatLng | LatLngLiteral): void
      setZoom(zoom: number): void
    }

    class Marker {
      constructor(opts?: MarkerOptions)
      setMap(map: Map | null): void
      setPosition(position: LatLng | LatLngLiteral): void
    }

    interface MapOptions {
      center?: LatLng | LatLngLiteral
      zoom?: number
      disableDefaultUI?: boolean
      zoomControl?: boolean
      mapTypeControl?: boolean
      streetViewControl?: boolean
      fullscreenControl?: boolean
      styles?: MapTypeStyle[]
    }

    interface MarkerOptions {
      position?: LatLng | LatLngLiteral
      map?: Map | null
      title?: string
      ariaLabel?: string
    }

    interface LatLng {
      lat(): number
      lng(): number
    }

    interface LatLngLiteral {
      lat: number
      lng: number
    }

    interface MapTypeStyle {
      featureType?: string
      elementType?: string
      stylers?: Array<{ [key: string]: any }>
    }
  }
}
