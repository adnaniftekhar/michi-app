# Michi Design System v1.0 - UI Refactor Guide

## Redesign Goals (Michi-Specific)

Transform the functional MVP into a polished, production-ready product that embodies:
- **Calm confidence**: Interface feels intentional, not rushed
- **Intelligent clarity**: Information hierarchy guides without overwhelming
- **Warm professionalism**: Approachable but never casual
- **Transparent AI**: Co-planner model where AI supports, never replaces, user intent

---

## 1. UI Principles Derived from Brand

### Spacing
- **Generous rhythm**: Minimum 24px between major sections, 16px between related items
- **Consistent scale**: Use 4px base unit (4, 8, 12, 16, 24, 32, 48, 64)
- **Breathing room**: Cards have 16px internal padding, 24px external gaps
- **Vertical flow**: Clear separation between content groups

### Hierarchy
- **One primary action per screen**: Only one Michi Green button visible at a time
- **Clear content structure**: Page title → Subtitle → Primary action → Content
- **Reduced visual noise**: Remove unnecessary borders, badges, and decorative elements
- **Information density**: Balance detail with clarity—prefer progressive disclosure

### Color Usage
- **Michi Green (#6FBF9A)**: Primary actions only, never decorative
- **Near-black backgrounds**: #0F1419 (background), #161C22 (surface)
- **Muted borders**: #242C33 (subtle separation, not heavy lines)
- **Text hierarchy**: #E6EDF3 (primary), #9AA4AE (secondary)
- **No accent colors**: Avoid introducing blues, purples, or other brand colors

### Copy Tone
- **Sentence case**: Always, everywhere
- **Direct and clear**: "Generate learning pathway" not "Let's create your pathway!"
- **No exclamation marks**: Calm, confident statements
- **Action-oriented**: Verbs in buttons ("Create trip" not "New trip")
- **AI transparency**: "AI-generated draft" not "AI magic" or "Smart suggestions"

### Component Behavior
- **Consistent states**: Loading, disabled, error, success handled uniformly
- **Subtle transitions**: 200ms ease for state changes, no bouncy animations
- **Keyboard-first**: All interactions accessible via keyboard
- **Progressive disclosure**: Advanced options hidden by default, revealed on demand

---

## 2. Navigation & Information Hierarchy

### Global Navigation Structure
```
[Logo] [Breadcrumb: Trips > Trip Name]                    [Reset] [Profile] [+ New Learner] [User: Name ▼]
```

**Refinements:**
- **Logo**: 40px height (reduced from 48px), subtle hover state
- **Breadcrumb**: Only visible on trip detail pages, subtle secondary text
- **Right actions**: Grouped logically, "Reset Demo Data" moved to secondary position
- **User selector**: Simplified label ("Learner" instead of "User"), cleaner dropdown

### Page Structure (Consistent Template)
```
[PageHeader]
  - Title (32px, semibold)
  - Subtitle (15px, secondary text, optional)
  - Primary action (Michi Green button, right-aligned)

[Content Area]
  - Sections with clear spacing (24px between)
  - One primary action per section
  - Empty states with clear CTAs
```

### Information Priority
1. **Primary**: What the user is looking at (trip name, schedule item)
2. **Secondary**: Contextual details (dates, location, timezone)
3. **Tertiary**: Metadata (tags, badges, timestamps)
4. **Actions**: Primary action prominent, secondary actions subtle

---

## 3. Visual Design System

### Color Palette (Expanded)
```css
/* Backgrounds */
--color-background: #0F1419;        /* Main app background */
--color-surface: #161C22;          /* Cards, modals, elevated surfaces */
--color-surface-hover: #1C2329;    /* Interactive surface hover */

/* Borders & Dividers */
--color-border: #242C33;            /* Subtle borders, dividers */
--color-border-subtle: #1A2026;     /* Very subtle separators */

/* Text */
--color-text-primary: #E6EDF3;      /* Headings, body text */
--color-text-secondary: #9AA4AE;   /* Labels, metadata, hints */
--color-text-tertiary: #6B7280;     /* Disabled, very subtle */

/* Primary (Michi Green) */
--color-michi-green: #6FBF9A;      /* Primary actions only */
--color-michi-green-hover: #5FA889; /* Hover state */
--color-michi-green-light: rgba(111, 191, 154, 0.1); /* Subtle backgrounds */

/* Semantic */
--color-danger: #DC2626;            /* Destructive actions */
--color-danger-hover: #B91C1C;
--color-success: #10B981;           /* Success states (subtle) */
```

### Typography Scale
```css
/* Headings */
--font-size-h1: 32px;    /* Page titles */
--font-size-h2: 24px;    /* Section titles */
--font-size-h3: 18px;    /* Card titles, subsections */
--font-size-h4: 16px;    /* Small headings */

/* Body */
--font-size-base: 15px;  /* Primary body text */
--font-size-sm: 14px;    /* Secondary text, labels */
--font-size-xs: 12px;    /* Metadata, badges */

/* Line heights */
--line-height-tight: 1.4;    /* Headings */
--line-height-normal: 1.5;   /* Body text */
--line-height-relaxed: 1.6;  /* Long-form content */

/* Weights */
--font-weight-normal: 400;
--font-weight-medium: 500;   /* Labels, emphasis */
--font-weight-semibold: 600; /* Headings, buttons */
```

### Spacing Scale
```css
--spacing-1: 4px;   /* Tight spacing, badges */
--spacing-2: 8px;   /* Compact spacing */
--spacing-3: 12px;  /* Default spacing */
--spacing-4: 16px;  /* Standard spacing */
--spacing-6: 24px;  /* Section spacing */
--spacing-8: 32px;  /* Large section spacing */
--spacing-12: 48px; /* Page-level spacing */
```

### Elevation & Borders
- **No heavy borders**: Use 1px solid borders, color `--color-border`
- **Subtle elevation**: Cards use background color difference, not shadows
- **Layered surfaces**: Background → Surface → Surface-hover hierarchy
- **Dividers**: 1px solid `--color-border-subtle` for section separation

### Radius
```css
--radius-sm: 6px;      /* Badges, small elements */
--radius-button: 8px;  /* Buttons */
--radius-input: 10px;  /* Inputs, selects */
--radius-card: 12px;   /* Cards, modals */
```

---

## 4. Core Components & States

### Button Component

**Variants:**
- **Primary**: Michi Green background, dark text, semibold
- **Secondary**: Transparent, border, normal weight
- **Tertiary**: Text-only, no border (for subtle actions)
- **Danger**: Red background (use sparingly)

**Sizes:**
- **sm**: 32px height, 14px text
- **md**: 40px height, 15px text (default)
- **lg**: 48px height, 18px text (hero actions)

**States:**
- **Default**: Full opacity
- **Hover**: Slight color shift (5FA889 for primary)
- **Active**: Slight scale (0.98) or darker shade
- **Disabled**: 40% opacity, cursor not-allowed
- **Loading**: Spinner replaces text, maintain button size

**Usage Rules:**
- One primary button per screen/section
- Secondary buttons for alternative actions
- Tertiary for "Cancel", "Skip", "Dismiss"
- Danger only for destructive actions (delete, remove)

### Card Component

**Variants:**
- **Default**: Surface background, subtle border
- **Interactive**: Hover state (surface-hover background)
- **Elevated**: Slightly lighter surface (for modals, popovers)

**Structure:**
- Padding: 16px (standard), 24px (spacious)
- Border: 1px solid `--color-border`
- Border-radius: 12px
- No shadows (use background color for elevation)

**Content Patterns:**
- Title (18px, semibold) + metadata (14px, secondary)
- Clear visual separation between sections
- Actions grouped at bottom or top-right

### Input Component

**States:**
- **Default**: Border `--color-border`, background `--color-surface`
- **Focus**: Border `--color-michi-green`, 2px outline ring
- **Error**: Border `--color-danger`, error message below
- **Disabled**: 40% opacity, cursor not-allowed

**Structure:**
- Label above input (14px, medium weight)
- Helper text below (12px, secondary color)
- Padding: 12px 16px
- Border-radius: 10px

### Badge Component

**Variants:**
- **Default**: Surface background, secondary text
- **Draft**: Transparent, Michi Green border and text (for AI-generated)
- **Subtle**: Very muted, minimal contrast

**Usage:**
- Small, unobtrusive labels
- Never more than 2-3 badges per item
- Prefer text over badges when possible

### Modal/Dialog Component

**Structure:**
- Backdrop: rgba(0, 0, 0, 0.6) - dark but not black
- Container: Surface background, 12px radius
- Max width: 640px (standard), 896px (wide)
- Padding: 24px (standard), 32px (spacious)

**Header:**
- Title: 24px, semibold
- Subtitle: 14px, secondary (optional)
- Close button: Subtle, top-right

**Footer:**
- Actions: Right-aligned, primary action last
- Spacing: 16px between buttons

### Empty State Component

**Structure:**
- Centered content, generous padding (48px vertical)
- Message: 15px, secondary text
- Action: Primary button (if applicable)
- Subtle border (dashed) for visual definition

### Loading States

**Spinner:**
- Michi Green color
- Sizes: sm (16px), md (24px), lg (32px)
- Smooth rotation, no bounce

**Skeleton:**
- Surface background with subtle shimmer
- Match content structure
- Use for initial loads only

---

## 5. AI Interaction Patterns (Co-Planner Model)

### AI Generation Flow

**1. Trigger State**
- Button: "Generate learning pathway" (not "AI Magic" or "Smart Generate")
- Disabled state: Clear reason ("Set learning target first")
- Loading state: Spinner + "Generating pathway..." (not "AI is thinking")

**2. Draft Review**
- Modal title: "Draft learning pathway" (not "AI Suggestions")
- Clear indication: "AI-generated draft" badge
- Summary section: Brief, factual overview
- Verification note: "Review and adjust as needed" (if present)

**3. Draft Content**
- Each day clearly labeled with date (not "Day 1", "Day 2")
- Expandable sections for details
- PBL elements clearly separated
- Schedule blocks show time, duration, title

**4. Apply Action**
- Button: "Apply to schedule" (not "Accept AI Suggestions")
- Secondary: "Cancel" or "Close"
- On apply: Toast "Pathway applied" (not "AI suggestions saved")

### AI-Generated Content Indicators

**Visual:**
- Badge: "Draft" variant (Michi Green border, subtle)
- Never use "AI" or "Smart" in labels
- Content feels editable, not final

**Copy:**
- "AI-generated draft" (factual)
- "Review and adjust" (actionable)
- Never "AI recommends" or "Smart AI suggests"

### Editable AI Output

**Rules:**
- All AI-generated content is immediately editable
- No "lock" or "AI-only" states
- User changes override AI suggestions
- Regeneration replaces only previously generated items

---

## 6. Key Screen Redesigns

### Trips Overview (`app/page.tsx`)

**Layout:**
```
[PageHeader]
  Title: "Trips"
  Subtitle: "Plan and manage your learning journeys"
  Action: [Create trip] (primary, Michi Green)

[Content]
  - Empty state OR
  - Grid: 3 columns (desktop), 2 (tablet), 1 (mobile)
  - Card spacing: 24px gap
```

**Trip Card:**
- Title: 18px, semibold, primary text
- Metadata: 14px, secondary text (dates, location)
- No chevron arrow (card is clickable, hover state sufficient)
- Hover: Surface-hover background, subtle transition

**Empty State:**
- Message: "No trips yet. Create your first trip to get started."
- Action: Primary button "Create trip"

### Trip Detail (`app/trips/[id]/page.tsx`)

**Layout:**
```
[PageHeader]
  Title: Trip name
  Subtitle: Date range • Location • Timezone
  Action: [Edit trip] (secondary)

[Tabs]
  - Schedule (default)
  - Activity logs
  - Learning targets
```

**Tab Design:**
- Underline indicator: Michi Green, 2px
- Active: Primary text, semibold
- Inactive: Secondary text, normal weight
- Spacing: 16px horizontal padding

**Schedule Tab:**
- Section header with "Generate learning pathway" button
- List of schedule blocks (cards)
- Each block: Expandable, shows title, date, time, duration
- AI-generated blocks: "Draft" badge

### Learner Profile (`app/profile/page.tsx`)

**Layout:**
```
[PageHeader]
  Title: "Learner profile"
  Subtitle: Profile name
  Action: [Edit profile] (secondary)

[Content]
  - Cards for each section (Basics, Rhythm, Curiosity, etc.)
  - Read-only view, clear hierarchy
  - Edit opens modal wizard
```

**Profile Cards:**
- Section title: 18px, semibold
- Grid layout: 2 columns (desktop) for key-value pairs
- Labels: 14px, secondary
- Values: 15px, primary
- Tags: Badge component

### AI Pathway Modal (`components/trips/AIPathwayModal.tsx`)

**Layout:**
```
[Header]
  Title: "Draft learning pathway"
  Close button

[Content]
  - Summary (if present)
  - Days list (expandable)
  - Each day shows: Date, driving question, schedule blocks

[Footer]
  [Cancel] [Apply to schedule]
```

**Day Cards:**
- Date prominent (not "Day 1")
- Driving question: 16px, primary text
- Schedule blocks: Compact list
- Expandable for full details

### Edit Schedule Block Modal (`components/trips/EditScheduleBlockModal.tsx`)

**Current Issues:**
- Too much white/gray in core details
- PBL sections feel disconnected
- Visual hierarchy unclear

**Redesign:**
- Core details: Subtle surface background, not white
- PBL sections: Accordion with Michi Green accent when expanded
- Clear separation: Logistics vs Learning Design
- Typography: Larger section titles, clearer labels

---

## 7. MVP → Polished Transformation Checklist

### Spacing & Alignment
- [ ] Increase section spacing to 24px minimum
- [ ] Standardize card padding (16px internal)
- [ ] Align all elements to 4px grid
- [ ] Remove inconsistent margins/padding

### Typography
- [ ] Ensure all headings use semibold (600)
- [ ] Standardize body text to 15px
- [ ] Reduce font size variations
- [ ] Improve line-height consistency

### Buttons
- [ ] Reduce button clutter (one primary per screen)
- [ ] Standardize button heights (40px default)
- [ ] Improve disabled states (40% opacity)
- [ ] Add loading states consistently

### Color Usage
- [ ] Remove unnecessary color accents
- [ ] Use Michi Green only for primary actions
- [ ] Mute secondary actions (borders, not backgrounds)
- [ ] Ensure WCAG AA contrast everywhere

### Visual Noise Reduction
- [ ] Remove decorative borders
- [ ] Reduce badge usage (only when necessary)
- [ ] Simplify card designs
- [ ] Remove unnecessary icons/arrows

### Copy Tone
- [ ] Convert all text to sentence case
- [ ] Remove exclamation marks
- [ ] Simplify button labels
- [ ] Make AI language factual, not magical

### Component Consistency
- [ ] Standardize all card variants
- [ ] Ensure consistent input styling
- [ ] Unify modal/dialog patterns
- [ ] Standardize empty states

### AI Transparency
- [ ] Add "Draft" badges to AI-generated content
- [ ] Make all AI output editable
- [ ] Remove "magic" language
- [ ] Add clear apply/cancel actions

---

## 8. Engineering Handoff Notes

### Implementation Order

1. **Design tokens** (`app/globals.css`)
   - Update CSS variables with expanded palette
   - Add missing spacing/typography tokens
   - Ensure all components reference tokens

2. **Core components** (`components/ui/`)
   - Button: Add tertiary variant, improve states
   - Card: Refine hover states, remove shadows
   - Input: Standardize focus states
   - Badge: Simplify variants
   - Modal: Standardize structure

3. **Layout components**
   - PageHeader: Refine spacing, typography
   - Section: Improve hierarchy
   - Tabs: Refine active state

4. **Screen refactors** (in order)
   - Trips overview
   - Trip detail
   - Learner profile
   - AI modals

5. **Polish pass**
   - Spacing audit
   - Typography audit
   - Color usage audit
   - Copy tone audit

### Code Patterns

**Consistent spacing:**
```tsx
// Use spacing tokens
<div style={{ marginBottom: 'var(--spacing-6)' }}>
<div className="space-y-4"> // 16px gap
```

**Consistent typography:**
```tsx
// Use typography tokens
<h2 style={{
  fontSize: 'var(--font-size-xl)',
  fontWeight: 'var(--font-weight-semibold)',
  lineHeight: 'var(--line-height-tight)',
}}>
```

**Consistent colors:**
```tsx
// Always use CSS variables
style={{ color: 'var(--color-text-primary)' }}
style={{ backgroundColor: 'var(--color-michi-green)' }}
```

### Testing Checklist

- [ ] All screens render correctly
- [ ] Spacing is consistent (4px grid)
- [ ] Typography hierarchy is clear
- [ ] Buttons have proper states
- [ ] AI interactions are clear
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] WCAG AA contrast met
- [ ] Mobile responsive

---

## Verification Limits

### Quality Bar (Must Pass)

✅ Interface feels calm, confident, intentional
✅ Primary actions are obvious but not loud
✅ AI feels supportive, transparent, and secondary
✅ Visual consistency across all screens
✅ Nothing contradicts "What NOT to build (yet)"
✅ No generic SaaS feel

### Stop Conditions

❌ Do not ask questions
❌ Do not propose alternate styles
❌ Do not add features
❌ Do not reference external products or trends

---

**End of Design System Refactor Guide**

