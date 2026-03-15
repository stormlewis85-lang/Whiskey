# Missing Features Audit — Post UI Redesign

**Created:** February 28, 2026
**Issue:** After the mobile-first UI redesign, several features became inaccessible on mobile devices.

---

## Root Cause

The redesign replaced the desktop `Header` (top navbar with hamburger menu) with a `BottomNav` (5-tab bar). The Header is `hidden md:block` — completely invisible below 768px. The BottomNav only exposes 5 routes: Home, Search, Scan, Drops, Profile. **All other pages and actions that lived in the Header are now unreachable on mobile.**

---

## Severity Legend

- 🔴 **Critical** — Core functionality completely inaccessible on mobile
- 🟡 **Moderate** — Feature exists but has no navigation path on mobile
- 🟢 **Minor** — Cosmetic or low-impact gap

---

## Missing Navigation (Mobile)

The desktop Header `NavLinks` provides access to 6 pages. The mobile BottomNav only covers 2 of them (Home, Search/Community). **4 pages have no mobile navigation path:**

| Page | Desktop Route | In BottomNav? | Status |
|------|--------------|---------------|--------|
| Collection (Home) | `/` | Yes (Home tab) | ✅ OK |
| Dashboard (Charts) | `/dashboard` | **NO** | 🔴 Critical |
| Community | `/community` | Yes (Search tab → `/search`) | ✅ OK |
| Flights | `/flights` | **NO** | 🟡 Moderate |
| Blind Tastings | `/blind-tastings` | **NO** | 🟡 Moderate |
| Rick House | `/rick-house` | **NO** | 🟡 Moderate |

---

## Missing Actions (Mobile)

The desktop Header also provides these actions via the user dropdown menu and Sheet sidebar. **None of these are accessible on mobile:**

| Action | Was In | Mobile Replacement? | Status |
|--------|--------|-------------------|--------|
| Logout | Header dropdown + Sheet sidebar | **NONE** | 🔴 Critical |
| Profile Settings | Header dropdown + Sheet sidebar | **NONE** | 🔴 Critical |
| Theme Toggle (Light/Dark) | Header bar | **NONE** | 🟡 Moderate |
| View Profile link | Header dropdown + Sheet sidebar | BottomNav Profile tab | ✅ OK |

---

## Missing Visualizations & Stats

### Dashboard Page (`/dashboard`) — 🔴 Unreachable on mobile

The Dashboard contains ALL analytics/charting features. Since it has no mobile nav link, users can't access any of these:

1. **Quick Stats Grid** — Total Whiskeys, Reviews Written, Average Rating, Collection Value
2. **Collection by Type** — PieChart (recharts) showing bourbon/scotch/rye/etc distribution
3. **Collection by Region** — PieChart showing Kentucky/Scotland/Japan/etc distribution
4. **Price Distribution** — BarChart showing bottles by price range ($0-30 through $200+)
5. **Reviews Over Time** — BarChart showing monthly review count trend
6. **Rating Distribution** — BarChart showing rating frequency (1.0 to 5.0 in 0.5 steps)
7. **Top Rated Whiskeys** — Table with rank badges (gold/silver/bronze for top 3)

**Note:** The Dashboard page itself is intact — no components were deleted. It just has no navigation link on mobile.

### RadarChart Component — 🟢 Orphaned (pre-existing)

- **File:** `client/src/components/RadarChart.tsx`
- **Status:** Exists but is **not imported anywhere** in the codebase
- Custom Canvas-based 6-axis flavor profile chart (Fruit/Floral, Sweet, Spice, Herbal, Grain, Oak)
- Was never integrated into any page — this predates the redesign

---

## Features That ARE Present (Verified)

These features survived the redesign correctly:

- ✅ Collection Grid (bottles display on mobile)
- ✅ CollectionStats (4 stat cards on Home page)
- ✅ FilterBar (search, sort, type/rating filters)
- ✅ Add Whiskey modal
- ✅ Edit Whiskey modal
- ✅ Review modal (with weighted scoring)
- ✅ Whiskey Detail modal
- ✅ Tasting Mode / Rick House AI (accessible from detail modal)
- ✅ Import / Export collection
- ✅ Barcode Scanner (via BottomNav Scan button + Home page)
- ✅ User Profile page (`/u/:slug`)
- ✅ Community / Search page
- ✅ Auth page (login/register) — works on mobile

---

## Recommended Fixes

### Priority 1 — Critical (must fix)

1. **Add a "More" menu or hamburger to mobile navigation**
   - Options: Replace one BottomNav tab with "More", add a slide-out drawer to MobileHomeHeader, or add a settings gear icon to the header
   - Must expose: Dashboard, Flights, Blind Tastings, Rick House, Profile Settings, Logout, Theme Toggle

2. **Or: Add missing links to an existing mobile surface**
   - MobileHomeHeader could get a hamburger menu (drawer)
   - Profile page could host Settings and Logout
   - Dashboard link could appear on Home page (e.g. a "View Analytics" card/button)

### Priority 2 — Moderate

3. **Ensure Drops page connects to real data** — Currently shows hardcoded mock data only. This is a new feature from the redesign and was always mock, so not a regression.

### Priority 3 — Minor

4. **Integrate RadarChart** — Orphaned component that could enhance review display. Not a regression (was never used).

---

## Summary

| Category | Count |
|----------|-------|
| 🔴 Critical (inaccessible on mobile) | 3 (Dashboard, Logout, Profile Settings) |
| 🟡 Moderate (no mobile nav path) | 4 (Flights, Blind Tastings, Rick House, Theme Toggle) |
| 🟢 Minor / Pre-existing | 1 (RadarChart orphaned) |
| ✅ Working correctly | 13+ features verified |

**No components or pages were deleted.** The issue is purely **navigation** — the BottomNav doesn't provide paths to all the pages the Header did. The fix is to add a "More" menu, hamburger drawer, or additional navigation surface on mobile.

---

*Last updated: February 28, 2026*
