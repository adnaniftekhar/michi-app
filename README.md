# Travel Learner - Phase 1 MVP

A simple travel learning app that helps you track trips, manage itineraries, set learning targets, generate study schedules, and log learning activities.

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Minimal styling** (Tailwind CSS - minimal usage)
- **Testing**: Playwright (E2E) + Vitest (unit)
- **Storage**: localStorage (Phase 1 only - no backend, no APIs)

## Phase 1 Features

### Demo Profile Switcher
- Switch between 3 demo users: Alice (America/New_York), Bob (Europe/London), Sam (Asia/Tokyo)
- Data is scoped per user in localStorage
- Selection persists across page reloads

### Trips Management
- **Trips List Page**: View all trips, create new trips
- **Trip Detail Page**: Full trip management with:
  - Learning target selection
  - Schedule block generation
  - Itinerary management
  - Activity logging

### Itinerary
- Add items with date/time (local), title, location, and notes
- Items are automatically sorted by date/time
- Display shows local time clearly

### Learning Targets
- Select from 4 tracks:
  - 15 min/day
  - 60 min/day
  - 4 hrs/day
  - Weekly hours (requires >0 hours)

### Schedule Blocks
- **Generate Schedule** button creates learning blocks
- Rule: One block per trip day at 10:00 local time
- Duration based on selected learning track
- Regenerating replaces only previously generated blocks (preserves manual blocks)

### Activity Logs
- Add entries with date/time (local), title, notes, and tags
- Attach artifacts:
  - **LINK**: URL artifact
  - **NOTE**: Text artifact
- Logs displayed in reverse chronological order (newest first)

## Setup Instructions

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers (first time only):**
   ```bash
   npx playwright install
   ```

### Running the Application

**Start the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app will work immediately - all data is stored in your browser's localStorage.

### Running Tests

**Run unit tests (Vitest):**
```bash
npm run test
```

**Run unit tests in watch mode:**
```bash
npm run test:watch
```

**Run E2E tests (Playwright):**
```bash
npm run test:e2e
```

**Run E2E tests with UI:**
```bash
npm run test:e2e:ui
```

**Note**: E2E tests will automatically start the dev server if it's not running.

## Test Coverage

### Unit Tests (Vitest)
- Storage module (get/set/clear, user scoping, error handling)
- Schedule generator (all tracks, duration calculation, block generation rules)

### E2E Tests (Playwright)
- **E2E-01**: Switch demo user
- **E2E-02**: Create trip
- **E2E-03**: Add itinerary item
- **E2E-04**: Set learning target
- **E2E-05**: Generate schedule blocks and verify count/duration
- **E2E-06**: Add activity log + artifact

## Project Structure

```
v1/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Trips list page
│   └── trips/[id]/        # Trip detail page
├── components/            # React components
│   ├── Header.tsx         # Header with demo user switcher
│   └── CreateTripForm.tsx # Trip creation form
├── contexts/              # React contexts
│   └── DemoUserContext.tsx # Demo user state management
├── lib/                   # Core logic
│   ├── storage.ts         # localStorage wrapper
│   ├── demo-users.ts      # Demo user definitions
│   ├── schedule-generator.ts # Schedule block generation
│   └── __tests__/         # Unit tests
├── types/                 # TypeScript type definitions
│   └── index.ts
├── e2e/                   # Playwright E2E tests
│   ├── 01-switch-demo-user.spec.ts
│   ├── 02-create-trip.spec.ts
│   ├── 03-add-itinerary-item.spec.ts
│   ├── 04-set-learning-target.spec.ts
│   ├── 05-generate-schedule.spec.ts
│   └── 06-activity-log.spec.ts
└── vitest.config.ts       # Vitest configuration
```

## Data Storage

All data is stored in browser localStorage with keys scoped by demo user ID:
- `travel_learner_alice`
- `travel_learner_bob`
- `travel_learner_sam`

Data structure:
```typescript
{
  trips: Trip[],
  itinerary: Record<string, ItineraryItem[]>,  // tripId -> items
  scheduleBlocks: Record<string, ScheduleBlock[]>,  // tripId -> blocks
  activityLogs: Record<string, ActivityLog[]>  // tripId -> logs
}
```

## Important Notes

- **No backend**: This is Phase 1 only - all data is client-side
- **No API routes**: Everything runs in the browser
- **No authentication**: Demo user switcher is just for data isolation
- **No database**: localStorage only
- **Phase 2** (Postgres/Prisma) is NOT implemented - will be added only when explicitly requested

## Troubleshooting

**Tests failing?**
- Make sure the dev server is running or let Playwright start it automatically
- Clear browser localStorage: `localStorage.clear()` in browser console
- Run `npx playwright install` if browsers are missing

**Data not persisting?**
- Check browser console for errors
- Ensure localStorage is enabled in your browser
- Try switching demo users to see if data is scoped correctly

**Schedule not generating?**
- Make sure you've set a learning target first
- For weekly track, ensure hours > 0

## Next Steps (Phase 2 - NOT IMPLEMENTED)

When ready for Phase 2:
- Add Postgres database
- Add Prisma ORM
- Migrate storage to database (keep same interface)
- Still no API routes unless explicitly requested
- Still no real auth unless explicitly requested

---

**Status**: Phase 1 Complete ✅
All tests passing, app fully functional in browser.
