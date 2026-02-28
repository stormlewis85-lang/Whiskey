# MyWhiskeyPedia UI Redesign — Task Plan
## Codename: "Drammer-Style Mobile-First Refresh"

**Created:** February 28, 2026  
**Status:** All Phases Complete
**Goal:** Transform layout from desktop-first generic dark app to mobile-first premium social app (Drammer/Untappd inspired) while preserving Black & Gold aesthetic

---

## Overview

This redesign focuses on **layout and structure**, not aesthetic overhaul. The Black & Gold design system stays. We're changing:
- Navigation pattern (top nav → bottom tab bar)
- Page layouts (desktop-first → mobile-first)
- Component patterns (generic cards → social activity cards)
- Information architecture (utility app → social app feel)

**Reference:** See `UI_REDESIGN_CONTEXT.md` for design specs and component details.

---

## Task Status Legend

- ⬜ Not started
- 🔄 In progress
- ✅ Complete
- ❌ Blocked (note reason)
- ⏭️ Skipped (note reason)

---

## Phase 1: Navigation Shell (Tasks U001-U008)

**Goal:** Replace top navbar with bottom tab bar, establish mobile-first viewport

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U001 | Create BottomNav component | New component at `/client/src/components/BottomNav.tsx`. 5 tabs: Home, Search, Scan (center FAB), Drops, Profile. Uses design tokens from context file. | ✅ |
| U002 | Style BottomNav for mobile | Fixed to bottom, 84px height, gradient fade at top, center scan button raised with gold background and shadow. Active tab shows gold icon + label. | ✅ |
| U003 | Add tab routing | Each tab navigates to correct route: `/` (Home), `/search`, `/scan`, `/drops`, `/profile`. Scan opens barcode scanner modal/page. | ✅ |
| U004 | Create MobileShell layout wrapper | New layout component that wraps page content with BottomNav. Content area has `padding-bottom: 100px` to clear nav. | ✅ |
| U005 | Hide existing top navbar on mobile | Existing navbar hidden at `md` breakpoint and below. Show BottomNav instead. Desktop keeps top nav for now. | ✅ |
| U006 | Update App.tsx to use MobileShell | Wrap routes in MobileShell. Ensure navigation state syncs with current route (active tab highlights correctly). | ✅ |
| U007 | Add safe area handling | On iOS, respect safe area insets for bottom nav (notch devices). Use `env(safe-area-inset-bottom)`. | ✅ |
| U008 | Test navigation flow | All 5 tabs navigate correctly. Active states work. Back navigation preserves tab state. No layout shift on route change. | ✅ |

---

## Phase 2: Core Component Reskin (Tasks U009-U020)

**Goal:** Update key components to match new mobile-first card patterns

### Activity Feed Components

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U009 | Create ActivityCard component | New component for social feed items. Shows: avatar, username, action text, timestamp, bottle card, note, like/comment counts. See context file for spec. | ✅ |
| U010 | Create ActivityBottleCard sub-component | Embedded bottle preview: image placeholder, name (Playfair), distillery, rating badge. Horizontal layout, 70px image, rounded corners. | ✅ |
| U011 | Create ActivityActions sub-component | Like button (heart icon, gold when liked), comment button, counts. Horizontal layout with proper spacing. | ✅ |
| U012 | Create mock activity data | Temporary mock data array for testing feed. 5-10 items with varied actions (reviewed, added to collection, wishlisted). | ✅ |

### Drop Alert Components

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U013 | Create DropAlertCard component | Prominent alert card: gold left border, gradient background, store name, bottle name, time ago, distance, wishlist match indicator. | ✅ |
| U014 | Create StoreDropCard component | Full drop card for Drops page: store header (logo, name, distance, time), bottle row, wishlist match badge, action buttons (Get Directions, View Store). | ✅ |
| U015 | Create DropFilters component | Horizontal scrolling filter chips: All Drops, Wishlist Matches, Bourbon, Scotch, Allocated. Active state styling. | ✅ |

### Profile Components

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U016 | Create ProfileHeader component | Centered layout: avatar (gold gradient), name (Playfair), handle, tier badge. Subtle gold gradient background at top. | ✅ |
| U017 | Create ProfileStats component | Horizontal stat row in card: Bottles, Reviews, Following, Followers. Gold numbers, uppercase labels. | ✅ |
| U018 | Create ProfileTabs component | Tab bar: Collection, Reviews, Wishlist. Underline indicator on active tab. Switches content below. | ✅ |
| U019 | Create CollectionGrid component | 3-column grid of bottle thumbnails. Square aspect ratio, rounded corners, name overlay at bottom. | ✅ |
| U020 | Integrate profile components | Assemble ProfileHeader + ProfileStats + ProfileTabs + CollectionGrid into Profile page. Mobile-first layout. | ✅ |

---

## Phase 3: Page Layouts (Tasks U021-U028)

**Goal:** Restructure main pages with new layout patterns

### Home Page

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U021 | Create Home page header | Compact header: logo (28px), brand name, notification bell (with dot), search icon. No full navbar, just essential actions. | ✅ |
| U022 | Add DropAlertCard to Home | If user has pending drop alerts, show featured DropAlertCard at top of home feed. Dismissible or tappable. | ✅ |
| U023 | Create Activity section | Section header ("Activity" + "All Friends" link), followed by ActivityCard list. Mock data for now. | ✅ |
| U024 | Assemble Home page | Combine: compact header + drop alert (optional) + activity section. Scrollable, padding for bottom nav. | ✅ |

### Drops Page

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U025 | Create Drops page header | Large title "Store Drops", subtitle "Alerts from stores you follow". Playfair typography. | ✅ |
| U026 | Add DropFilters to Drops page | Horizontal scrolling filters below header. Filters are non-functional for now (UI only). | ✅ |
| U027 | Create Drops list | Vertical list of StoreDropCard components. Mock data: 3-5 stores with bottle drops. | ✅ |
| U028 | Assemble Drops page | Combine: header + filters + drops list. Empty state if no drops ("No drops yet. Follow stores to get alerts."). | ✅ |

---

## Phase 4: Bottle Detail Refresh (Tasks U029-U036)

**Goal:** Update bottle detail view with hero layout and Rick House integration

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U029 | Create BottleHero component | Full-width hero area: gradient background, large bottle image centered, back button, share/favorite actions. 320px height. | ✅ |
| U030 | Create BottleInfo component | Centered below hero: distillery label (gold, uppercase), bottle name (Playfair, large), subtitle (type + ABV), rating badge with count. | ✅ |
| U031 | Create BottleQuickStats component | Horizontal card: MSRP, Proof, Age. Three columns, centered values, uppercase labels. | ✅ |
| U032 | Create BottleActions component | Two buttons side-by-side: "Add to Collection" (primary, gold), "Review" (secondary, outline). Full width on mobile. | ✅ |
| U033 | Create RickHouseCard component | Prominent CTA card: gradient border, Rick House icon, "Guided Tasting Available" header, description text, "Start Tasting Session →" link. | ✅ |
| U034 | Refactor bottle detail modal/page | Replace current layout with: BottleHero + BottleInfo + BottleQuickStats + BottleActions + RickHouseCard. | ✅ |
| U035 | Add scroll behavior | Hero image scales slightly on scroll (parallax lite). Content scrolls under hero naturally. | ⏭️ Deferred — parallax adds complexity with minimal visual gain on mobile |
| U036 | Test bottle detail flow | Open from collection, from search, from activity feed. All paths work. Actions functional. | ✅ |

---

## Phase 5: Polish & Responsive (Tasks U037-U044)

**Goal:** Ensure everything works across viewports and feels polished

| ID | Task | Success Criteria | Status |
|----|------|------------------|--------|
| U037 | Audit mobile viewport (375px) | All pages render correctly on iPhone SE / small Android. No horizontal scroll. Touch targets 44px minimum. | ✅ |
| U038 | Audit tablet viewport (768px) | Layouts adapt gracefully. Collection grid expands to 4 columns. Activity cards have more breathing room. | ✅ |
| U039 | Audit desktop viewport (1280px+) | Consider keeping top nav on desktop. Content max-width contained. Not awkwardly stretched. | ✅ |
| U040 | Add loading skeletons | Skeleton states for: ActivityCard, StoreDropCard, CollectionGrid items, ProfileStats. Pulse animation. | ✅ |
| U041 | Add empty states | Empty states for: no activity ("Follow friends to see their activity"), no drops, empty collection, no reviews. | ✅ |
| U042 | Add micro-interactions | Subtle hover/tap states on cards. Like button animation. Tab transitions. Nothing jarring. | ✅ |
| U043 | Verify dark mode consistency | All new components use CSS variables correctly. No hardcoded colors. Gold usage follows "precious" rule. | ✅ |
| U044 | Final visual QA | Side-by-side with mockup HTML. Flag any deviations. Document intentional differences. | ✅ |

---

## Completion Criteria

**Phase 1 Complete When:**
- Bottom nav renders on mobile
- All 5 tabs navigate correctly
- Existing functionality unbroken

**Phase 2 Complete When:**
- All new components exist and render with mock data
- Components match specs in context file
- No TypeScript errors

**Phase 3 Complete When:**
- Home and Drops pages use new layouts
- Pages scroll correctly with bottom nav
- Mock data populates feeds

**Phase 4 Complete When:**
- Bottle detail uses hero layout
- Rick House card integrated
- All bottle detail paths work

**Phase 5 Complete When:**
- No responsive bugs
- Loading/empty states in place
- Visual parity with mockup

---

## Notes

- **Do NOT modify:** API routes, database schema, auth logic, existing feature functionality
- **Do NOT remove:** Any existing features or pages
- **Mock data is temporary:** Will be replaced with real data when backend social features are built
- **Reference the mockup:** `mywhiskeypedia-mobile-ui.html` in project root (or Claude project folder)

---

*Last updated: February 28, 2026*

---

## Visual QA Notes (U044)

### Mockup vs Implementation Deviations

**Fixed:**
- Notification dot: changed from gold (`bg-primary`) to red (`hsl(var(--destructive))`) with 2px border per mockup spec

**Intentional Deviations:**
1. **BottleHero buttons: 44px instead of 36px** — Increased from mockup's 36px to meet 44px touch target minimum (accessibility requirement)
2. **ProfileStats: `justify-between` instead of `gap: 32px`** — Changed from centered with 32px gap to space-between for reliable 375px viewport fit
3. **MobileCollectionGrid: `auto-fill` instead of `repeat(3, 1fr)`** — Changed from fixed 3 columns to responsive auto-fill for tablet adaptation
4. **ProfileHeader avatar gradient: `hsl(var(--primary) / 0.7)` instead of `#B8933F`** — Replaced hardcoded hex with CSS variable for dark mode consistency
5. **ActivityActions gap: reduced from 20px to 8px** — Buttons now have 44px touch targets with 12px padding, so visual gap is maintained by button padding

**Matches Mockup:**
- Tab bar: 84px, gradient, scan FAB 56px with gold glow
- Header: padding 8px 20px 16px, icon sizes 22px, opacity 0.7
- Drop alert: gold left bar, gradient bg, badge styling
- Activity cards: avatar 40px, gap 12px, embedded bottle card with 70x90px image
- Profile: avatar 80px gradient, Playfair 1.4rem name, stats card, tab underline
- Collection grid: square aspect ratio, 2px gap, name overlay with gradient
- Bottle detail: 320px hero, gradient bg, centered info, quick stats card
