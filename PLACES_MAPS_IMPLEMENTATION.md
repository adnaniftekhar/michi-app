# Google Places Photos + Maps Implementation

## Overview
This document describes the implementation of Google Places Photos and Maps integration for learning pathway activities.

## Environment Variables Required

### Server-side (never exposed to client):
- `PLACES_API_KEY` - Server key for Places API (New) - "Michi – Places Server Key"

### Client-side (safe to expose):
- `NEXT_PUBLIC_MAPS_BROWSER_KEY` - Browser key for Maps JavaScript API - "Maps Platform API Key"

## Architecture

### Backend API Endpoints

1. **POST /api/places/resolve**
   - Resolves a location query to a Google Place
   - Returns: `placeId`, `displayName`, `formattedAddress`, `location` (lat/lng), `placeType`
   - Privacy: Downgrades specific addresses to city-level coordinates

2. **GET /api/places/:placeId/details**
   - Gets place details including photos
   - Query params: `fields` (comma-separated list)
   - Returns: Place details with photos array (max 3 photos)

3. **GET /api/places/photo**
   - Streams place photos server-side (no API key exposure)
   - Query params: `photoName` (required), `maxHeightPx` (default: 400), `maxWidthPx` (optional)
   - Returns: Image bytes with proper Content-Type
   - Caching: In-memory cache with 24h TTL

### Data Model Updates

`ScheduleBlock` now includes:
- `placeId?: string` - Google Places placeId
- `placeName?: string` - Display name from Places API
- `approxLat?: number` - City-level approximate latitude
- `approxLng?: number` - City-level approximate longitude
- `imageMode?: 'google' | 'ai' | 'off'` - Image source mode
- `photoName?: string` - Google Places photo name (if imageMode=google)
- `photoAttribution?: { displayName: string; uri: string }` - Photo attribution
- `aiImageAssetId?: string` - AI-generated image asset ID (if imageMode=ai)
- `aiImageUrl?: string` - AI-generated image URL (if imageMode=ai)
- `coordinates?: { lat: number; lng: number }` - For map display

### Generation Pipeline

1. **AI Pathway Generation** (`/api/ai/plan`)
   - Generates learning pathway as before
   - If `generationOptions.imageMode === 'google'` or `generationOptions.includeMaps === true`:
     - Calls `enrichActivitiesWithPlaces()` to enrich activities with Places data
     - For each activity with a field experience:
       - Resolves location to Google Place
       - Gets place details and photos (if imageMode=google)
       - Generates AI image (if imageMode=ai)
       - Adds coordinates for maps (if includeMaps=true)

2. **Enrichment Service** (`lib/enrich-activities-with-places.ts`)
   - Server-side only
   - Calls Places API directly (not through Next.js API routes)
   - Adds place data, photos, and coordinates to activities

### Frontend UI

1. **Learning Pathway Options Modal**
   - **Image Mode**: Radio buttons for "Off" / "Google place photos" / "AI illustrations"
   - **Maps**: Toggle for "Include maps"
   - Options are passed to generation pipeline

2. **Activity Cards**
   - Display images based on `imageMode`:
     - `google`: Shows Google Places photo with attribution link
     - `ai`: Shows AI-generated illustration
     - `off`: No images
   - Map icon appears if coordinates are available
   - Clicking map icon opens interactive Google Maps modal

3. **Map Modal** (`components/trips/MapModal.tsx`)
   - Uses Google Maps JavaScript API
   - Displays marker at activity location
   - Keyboard accessible with focus trap
   - ARIA labels for screen readers

## Privacy & Safety

1. **Location Privacy**:
   - Specific addresses are downgraded to city-level coordinates
   - Only approximate locations stored (city/town level)
   - No precise addresses unless explicit parental consent

2. **API Key Security**:
   - `PLACES_API_KEY` is server-side only, never exposed to client
   - `MAPS_BROWSER_KEY` is safe for client-side use (restricted by domain)

3. **Image Safety**:
   - Google Places photos: Curated by Google, attribution required
   - AI images: Generated with safe prompts (no faces, no children, generic)
   - Fallback: Generic icons if images unavailable

## Error Handling

- Places API failures: Graceful fallback to default icons
- Map loading failures: Shows "Map unavailable" message
- Photo fetch failures: Falls back to SVG icons
- All errors logged server-side, user-friendly messages client-side

## Testing Requirements

### Backend Tests (TODO):
- Contract tests for `/api/places/resolve`
- Contract tests for `/api/places/:placeId/details`
- Contract tests for `/api/places/photo`
- Negative tests: missing params, invalid placeId/photoName, quota errors
- Verify `PLACES_API_KEY` never appears in responses

### Frontend Tests (TODO):
- E2E: Options screen selections persist into generated pathway
- Visual toggles: switching images/maps off removes UI elements
- Accessibility: keyboard navigation for modal, tooltips, map open/close
- Image display: Google photos show with attribution
- Map display: Interactive map shows correct location

## Next Steps

1. Add environment variables to deployment configuration
2. Enable Places API (New) in Google Cloud Console
3. Enable Maps JavaScript API in Google Cloud Console
4. Configure API key restrictions (domain restrictions for browser key)
5. Add comprehensive tests
6. Implement AI image generation (currently placeholder)
