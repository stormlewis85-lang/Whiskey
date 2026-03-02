# AUDIT-004/005: Mobile UI & Desktop Regression — Findings

> **Date:** 2026-03-02
> **Scope:** Mobile UI at 375px, Desktop regression at 1280px+

---

## Summary

| Area | Issues |
|------|--------|
| Mobile (375px) | 3 high, 5 medium, 3 low |
| Desktop (1280px) | 0 high, 0 medium, 3 low |

---

## AUDIT-004: Mobile UI (375px)

### HIGH

#### 1. WhiskeyDetailModal Too Wide for Mobile
- **File:** `client/src/components/modals/WhiskeyDetailModal.tsx:345`
- **Issue:** `max-w-3xl` (768px) exceeds 375px viewport. No mobile-specific width constraint.
- **Fix:** Add `max-w-[calc(100vw-32px)] sm:max-w-3xl`

#### 2. Dialog Grid Gap Too Large
- **File:** `client/src/components/modals/WhiskeyDetailModal.tsx:403`
- **Issue:** `gap-6` (24px) on 335px available width causes cramping.
- **Fix:** Change to `gap-3 sm:gap-6`

#### 3. Detail Label Text Below Accessibility Minimum
- **File:** `client/src/components/modals/WhiskeyDetailModal.tsx:~470`
- **Issue:** `text-[10px]` is below WCAG AA 12px minimum for readability.
- **Fix:** Change to `text-xs sm:text-sm` (12px minimum)

### MEDIUM

#### 4. FilterBar Sheet Width (300px on 375px = 80% of screen)
- **File:** `client/src/components/FilterBar.tsx:315`
- **Fix:** `w-[calc(100vw-48px)] sm:w-[300px]`

#### 5. BottomNav Missing safe-area-inset-bottom
- **File:** `client/src/components/BottomNav.tsx:25`
- **Fix:** Add `pb-[env(safe-area-inset-bottom)]`

#### 6. Flights Modal Overflows Behind BottomNav
- **File:** `client/src/pages/Flights.tsx:296`
- **Fix:** `max-h-[calc(100vh-120px)] sm:max-h-[90vh]`

#### 7. CollectionStats Text Too Large for 2-Col Mobile
- **File:** `client/src/components/CollectionStats.tsx:55`
- **Fix:** `text-lg sm:text-2xl md:text-3xl`

#### 8. Drops Page Uses Inline Styles Instead of Tailwind
- **File:** `client/src/pages/Drops.tsx:38-54`
- **Fix:** Refactor to responsive Tailwind classes

---

## AUDIT-005: Desktop Regression (1280px+)

### PASS — No Regressions Found

- Header visible on `md:block`
- BottomNav hidden with `md:hidden`
- Dashboard grids: `grid-cols-2 md:grid-cols-4` and `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- CollectionGrid: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`
- All using `max-w-7xl mx-auto` containers
- No fixed positioning conflicts

### LOW — Optimization Opportunities

#### 1. Modal Widths Could Scale Up on Large Screens
- Add `lg:max-w-4xl` for better use of space at 1600px+

#### 2. Community Grid Capped at 3 Columns
- Could add `xl:grid-cols-4` for wider screens

#### 3. Chart Gaps Don't Scale
- `gap-6` constant; could be `gap-4 sm:gap-6`
