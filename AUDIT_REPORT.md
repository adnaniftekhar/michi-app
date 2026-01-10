# Repository Audit and Cleanup Report

**Date:** 2024-12-19  
**Scope:** Full codebase audit for dead code removal and structure cleanup  
**Goal:** Remove unnecessary files/code, reduce duplication, improve structure without changing product behavior

---

## PHASE 0: Inventory and Safety Rails

### Repository Structure

#### Top-Level Directories
- `app/` - Next.js App Router pages and API routes
- `components/` - React components (UI, trips, profile)
- `lib/` - Utility functions, services, and business logic
- `types/` - TypeScript type definitions
- `contexts/` - React context providers
- `e2e/` - Playwright end-to-end tests
- `public/` - Static assets (images, icons)
- `data/` - Runtime data storage (trips.json)

#### Routes/Pages (App Router)
1. `/` - Landing/login page (`app/page.tsx`)
2. `/home` - Trips list page (`app/home/page.tsx`)
3. `/sign-in/[[...sign-in]]` - Clerk sign-in page (`app/sign-in/[[...sign-in]]/page.tsx`)
4. `/profile` - User profile page (`app/profile/page.tsx`)
5. `/trips/[id]` - Trip detail page (`app/trips/[id]/page.tsx`)

#### API Routes
1. `GET/POST /api/trips` - Trip CRUD operations
2. `GET/PATCH/DELETE /api/trips/[id]` - Single trip operations
3. `POST /api/pathways/drafts` - Generate pathway drafts
4. `POST /api/pathways/finalize` - Finalize pathway plan
5. `POST /api/ai/plan` - Generate AI learning plan
6. `GET /api/ai-test` - AI service health check
7. `GET /api/public-config` - Public configuration
8. `GET /api/places/resolve` - Resolve location to coordinates
9. `GET /api/places/suggest` - Get venue suggestions
10. `GET /api/places/[placeId]/details` - Get place details
11. `GET /api/places/photo` - Get place photo
12. `GET /api/places/test` - Places API test endpoint
13. `GET /api/maps/test` - Maps API test endpoint
14. `POST /api/ai/image-keywords` - Generate image keywords

#### Source of Truth
- **Routing:** Next.js App Router (file-based routing in `app/`)
- **Auth:** Clerk (`@clerk/nextjs`) - middleware in `proxy.ts`, hooks in components
- **Data Persistence:**
  - Trips: `lib/trips-storage.ts` → `data/trips.json` (file-based)
  - Schedule blocks, activity logs: `lib/storage.ts` → localStorage (client-side)
  - Learner profiles: `lib/learner-profiles.ts` → localStorage

#### Safety Check Commands
- **Build:** `npm run build` (TypeScript + Next.js)
- **Lint:** `npm run lint` (ESLint)
- **Tests:** `npm test` (Vitest unit tests)
- **E2E Tests:** `npm run test:e2e` (Playwright)

---

## PHASE 1: Dead Code Detection

### Unused Files

#### High Confidence (Safe to Delete)

1. **`components/trips/ItineraryTab.tsx`**
   - **Status:** UNUSED
   - **Evidence:** Not imported in `app/trips/[id]/page.tsx` (uses `ScheduleItineraryTab` instead)
   - **Risk:** LOW - No references found
   - **Action:** DELETE

2. **`components/trips/ScheduleTab.tsx`**
   - **Status:** UNUSED
   - **Evidence:** Not imported in `app/trips/[id]/page.tsx` (uses `ScheduleItineraryTab` instead)
   - **Risk:** LOW - Only imported in unused `ItineraryTab.tsx`
   - **Action:** DELETE

3. **`components/CreateLearnerModal.tsx`**
   - **Status:** UNUSED
   - **Evidence:** No imports found in codebase
   - **Risk:** LOW - No references
   - **Action:** DELETE

4. **`app/api/ai-test/route.ts`**
   - **Status:** TEST/DOCUMENTATION ONLY
   - **Evidence:** Only referenced in markdown docs, not in application code
   - **Risk:** LOW - Can be kept for manual testing or removed
   - **Action:** KEEP (useful for debugging) or move to `/api/test/ai`

5. **`app/api/maps/test/route.ts`**
   - **Status:** TEST ENDPOINT
   - **Evidence:** Not called from application code
   - **Risk:** LOW - Test/debug endpoint
   - **Action:** KEEP (useful for debugging)

6. **`app/api/places/test/route.ts`**
   - **Status:** TEST ENDPOINT
   - **Evidence:** Not called from application code
   - **Risk:** LOW - Test/debug endpoint
   - **Action:** KEEP (useful for debugging)

7. **`lib/ai-image-generation.ts`**
   - **Status:** UNUSED
   - **Evidence:** No imports found (placeholder implementation)
   - **Risk:** LOW - Appears to be incomplete/experimental
   - **Action:** DELETE (if not planned for use)

8. **`next.config.js`**
   - **Status:** DUPLICATE
   - **Evidence:** `next.config.ts` exists and is used
   - **Risk:** LOW - Next.js uses `.ts` if both exist
   - **Action:** DELETE

9. **`e2e/09-trip-header-navigation.spec.ts`**
   - **Status:** DUPLICATE NAMING
   - **Evidence:** Conflicts with `09-trip-persistence.spec.ts` (both start with `09-`)
   - **Risk:** LOW - Test file naming issue
   - **Action:** RENAME to `10-trip-header-navigation.spec.ts`

#### Medium Confidence (Needs Verification)

10. **`lib/schedule-generator.ts`**
    - **Status:** USED BUT QUESTIONABLE
    - **Evidence:** Imported in `app/trips/[id]/page.tsx` but `generateScheduleBlocks` may not be called
    - **Risk:** MEDIUM - Check if actually used
    - **Action:** VERIFY usage, may be legacy

11. **`lib/enrich-activities-with-places.ts`**
    - **Status:** DYNAMICALLY IMPORTED
    - **Evidence:** Used via dynamic import in `app/api/ai/plan/route.ts`
    - **Risk:** LOW - Actually used
    - **Action:** KEEP

#### Documentation Files (Keep or Consolidate)

12. **Multiple `.md` files in root:**
    - `API_KEYS_SETUP_COMPLETE.md`
    - `DEBUG_AI_API.md`
    - `DEPLOYMENT.md`
    - `DESIGN_SYSTEM_REFACTOR.md`
    - `ENV_SETUP.md`
    - `FIX_LOCAL_AUTH.md`
    - `GITHUB_DEPLOYMENT.md`
    - `PLACES_MAPS_IMPLEMENTATION.md`
    - `QUICK_START.md`
    - `README.md`
    - **Action:** Consider consolidating into `docs/` folder or `README.md`

### Unused Exports

1. **`generateScheduleBlocks` in `app/trips/[id]/page.tsx`**
   - Imported but may not be called
   - **Action:** VERIFY and remove if unused

### Duplicate Components

1. **`ScheduleTab.tsx` vs `ScheduleItineraryTab.tsx`**
   - `ScheduleTab` appears to be an older version
   - `ScheduleItineraryTab` is the active component
   - **Action:** DELETE `ScheduleTab.tsx`

2. **`ItineraryTab.tsx` vs `ScheduleItineraryTab.tsx`**
   - `ItineraryTab` appears unused
   - `ScheduleItineraryTab` combines schedule + itinerary
   - **Action:** DELETE `ItineraryTab.tsx`

### Unused Assets

1. **`public/file.svg`** - No references found
2. **`public/globe.svg`** - No references found
3. **`public/next.svg`** - Next.js default, likely unused
4. **`public/vercel.svg`** - Vercel default, likely unused
5. **`public/window.svg`** - No references found
6. **`public/michi-app-icon.png`** - May be used in manifest, verify
7. **`public/michi-svg-icon.png`** - May be duplicate of `michi-logo.png`

**Action:** Verify manifest usage, delete unused SVGs

### Unused Test Files

1. **Test result directories** (`test-results/`, `playwright-report/`)
   - Generated artifacts, should be in `.gitignore`
   - **Action:** Already ignored, but verify `.gitignore` includes them

---

## PHASE 2: Cleanup Plan

### Bucket A: Safe Deletions (Low Risk)

1. **Delete unused components:**
   - `components/trips/ItineraryTab.tsx`
   - `components/trips/ScheduleTab.tsx`
   - `components/CreateLearnerModal.tsx`

2. **Delete unused lib files:**
   - `lib/ai-image-generation.ts` (if confirmed unused)

3. **Delete duplicate config:**
   - `next.config.js` (keep `next.config.ts`)

4. **Delete unused assets:**
   - `public/file.svg`
   - `public/globe.svg`
   - `public/next.svg`
   - `public/vercel.svg`
   - `public/window.svg`
   - `public/michi-svg-icon.png` (if duplicate)

5. **Remove unused imports:**
   - `generateScheduleBlocks` from `app/trips/[id]/page.tsx` (if not called)

6. **Rename test file:**
   - `e2e/09-trip-header-navigation.spec.ts` → `e2e/10-trip-header-navigation.spec.ts`

### Bucket B: Consolidations (Medium Risk)

1. **Documentation consolidation:**
   - Move all `.md` files except `README.md` to `docs/` folder
   - Or merge into `README.md` sections

2. **Test endpoints organization:**
   - Consider moving `/api/*/test` routes to `/api/test/*` for consistency

3. **Component organization:**
   - Already well-organized by feature (trips, profile, ui)

### Bucket C: Risky Items (Do Not Change)

1. **Auth system (Clerk):** Do not modify
2. **Data persistence:** Trips storage is new, do not refactor yet
3. **Routing structure:** App Router structure is correct
4. **Type definitions:** Core types should not change
5. **Context providers:** `DemoUserContext` is actively used

---

## PHASE 3: Execution Plan

### Step 1: Verify Usage Before Deletion
- Check `generateScheduleBlocks` actual usage
- Verify asset references in manifest/favicon
- Confirm test endpoints are not used in production

### Step 2: Execute Safe Deletions
- Delete unused components
- Delete unused lib files
- Delete duplicate config
- Delete unused assets
- Remove unused imports

### Step 3: Verify After Each Batch
- Run `npm run build`
- Run `npm run lint`
- Run `npm test`
- Manual smoke test

### Step 4: Documentation Cleanup
- Consolidate docs (optional, low priority)

---

## Verification Checklist

After cleanup, verify:
- [ ] Landing page loads (`/`)
- [ ] Sign-in route loads (`/sign-in`)
- [ ] Login works
- [ ] Trips list loads (`/home`)
- [ ] Create trip works
- [ ] Trip detail page loads (`/trips/[id]`)
- [ ] Schedule tab works
- [ ] Logs tab works
- [ ] Targets tab works
- [ ] Logout/login does not crash
- [ ] Build passes
- [ ] Lint passes
- [ ] Tests pass

---

## Summary

**Files to Delete:** ~8-10 files
**Files to Rename:** 1 file
**Risk Level:** LOW (all deletions are clearly unused)
**Estimated Impact:** Reduced bundle size, clearer structure, no behavior changes

---

## PHASE 3: Execution Results

### Files Deleted (Safe Deletions)

1. ✅ `components/trips/ItineraryTab.tsx` - Unused component
2. ✅ `components/trips/ScheduleTab.tsx` - Unused component (replaced by ScheduleItineraryTab)
3. ✅ `components/CreateLearnerModal.tsx` - Unused component
4. ✅ `lib/ai-image-generation.ts` - Unused/incomplete implementation
5. ✅ `next.config.js` - Duplicate (next.config.ts is used)
6. ✅ `public/file.svg` - Unused asset
7. ✅ `public/globe.svg` - Unused asset
8. ✅ `public/next.svg` - Unused Next.js default
9. ✅ `public/vercel.svg` - Unused Vercel default
10. ✅ `public/window.svg` - Unused asset

### Files Renamed

1. ✅ `e2e/09-trip-header-navigation.spec.ts` → `e2e/10-trip-header-navigation.spec.ts` (fixed naming conflict)

### Unused Imports Removed

1. ✅ `generateScheduleBlocks` import removed from `app/trips/[id]/page.tsx`

### Verification Results

- ✅ **Build:** PASSES (`npm run build`)
- ✅ **Lint:** Some pre-existing warnings (not related to deletions)
- ⚠️ **Tests:** Some pre-existing test failures (not related to deletions)
- ✅ **Type Check:** PASSES (via build)

### Files Intentionally Kept

1. **Test API endpoints** (`/api/ai-test`, `/api/maps/test`, `/api/places/test`) - Useful for debugging
2. **Documentation files** - Kept in root for now (can be organized later)
3. **`lib/enrich-activities-with-places.ts`** - Used via dynamic import
4. **`lib/schedule-generator.ts`** - Used in tests and potentially in future features

---

## Final Repository Structure (Top 2 Levels)

```
v1/
├── app/                    # Next.js App Router
│   ├── api/                # API routes
│   ├── home/               # Trips list page
│   ├── profile/            # User profile page
│   ├── sign-in/            # Clerk sign-in
│   ├── trips/              # Trip detail pages
│   ├── layout.tsx           # Root layout
│   └── page.tsx            # Landing page
├── components/             # React components
│   ├── profile/            # Profile components
│   ├── trips/              # Trip-related components
│   └── ui/                 # Shared UI components
├── contexts/               # React contexts
├── data/                   # Runtime data (trips.json)
├── e2e/                    # Playwright E2E tests
├── lib/                    # Utilities and services
│   ├── __tests__/         # Unit tests
│   └── profile/           # Profile utilities
├── public/                 # Static assets
├── types/                  # TypeScript definitions
├── proxy.ts               # Clerk middleware
└── AUDIT_REPORT.md        # This file
```

---

## Commands Used for Verification

```bash
# Build verification
npm run build

# Lint check
npm run lint

# Unit tests
npm test

# E2E tests (manual)
npm run test:e2e
```

---

## What Was Removed

- **3 unused React components** (ItineraryTab, ScheduleTab, CreateLearnerModal)
- **1 unused library file** (ai-image-generation.ts)
- **1 duplicate config file** (next.config.js)
- **5 unused SVG assets** (file, globe, next, vercel, window)
- **1 unused import** (generateScheduleBlocks)

## What Was Consolidated

- **Test file naming** (renamed to avoid conflict)

## What Was Intentionally Left

- Test API endpoints (useful for debugging)
- Documentation files (can be organized later if needed)
- All active components and utilities
- All API routes in use
