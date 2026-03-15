# MyWhiskeyPedia — Mobile Responsiveness Audit

**Generated:** 2026-02-16
**Tested viewports:** 375px (iPhone SE), 390px (iPhone 14)
**Method:** Static code analysis of all responsive patterns, breakpoints, and mobile-specific CSS

---

## Table of Contents

1. [Navigation](#1-navigation)
2. [Collection Page (Bottle Cards & Grid)](#2-collection-page)
3. [Page Headers](#3-page-headers)
4. [Filters / Search Bar](#4-filters--search-bar)
5. [Collection Stats](#5-collection-stats)
6. [Modals / Dialogs](#6-modals--dialogs)
7. [Global Mobile Utilities](#7-global-mobile-utilities)
8. [Issue Summary & Priority Matrix](#8-issue-summary--priority-matrix)

---

## 1. Navigation

**File:** `client/src/components/Header.tsx`

### Hamburger Menu
- **YES** — Uses a `Sheet` component (slide-from-left drawer) triggered by a `Menu` icon
- Hamburger button: `variant="ghost" size="icon"` with `Menu` icon at `h-5 w-5`
- Only renders when `user && isMobile` (breakpoint: **768px** via `useIsMobile()` hook)

### Nav Collapse Behavior
| Viewport | Layout |
|----------|--------|
| < 768px | Hamburger → Sheet drawer (left side) |
| >= 768px | Horizontal nav bar with `flex items-center gap-6` |

- Sheet width: `w-[280px]` on mobile, `sm:w-[320px]` at ≥640px
- Slide animation: 500ms open, 300ms close
- Overlay: `bg-background/80 backdrop-blur-sm`

### Logo Sizing
- Mobile: `text-3xl` (30px) with `font-display` (Playfair Display)
- Desktop: `md:text-4xl` (36px)
- Uses `text-gradient-brand` for gold gradient

**Verdict at 375px:** Logo "MyWhiskeyPedia" at 30px in Playfair Display is ~280px wide. With `px-4` (16px) margins plus hamburger button (~40px), total ~336px. **Fits at 375px but tight.**

**Verdict at 390px:** Comfortable fit with ~15px breathing room.

### All Nav Items Accessible?
**YES** — All 5 navigation items appear in the mobile Sheet drawer as a vertical list:

1. Collection (Home icon)
2. Dashboard (BarChart3 icon)
3. Community (Users icon)
4. Flights (Wine icon)
5. Blind Tastings (Eye icon)

Plus a footer section (`mt-auto`) with:
- View Profile (conditional)
- Profile Settings
- Log out (destructive styling)

Each item has `onClick={() => setIsSheetOpen(false)}` to dismiss after tapping.

### Mobile Nav Issues

| Issue | Severity | Details |
|-------|----------|---------|
| Theme toggle always visible | **INFO** | ThemeToggle renders outside the Sheet, always in the header bar. Works fine. |
| No swipe-to-close | **LOW** | Sheet uses tap-to-close and overlay click. No explicit swipe gesture, though Radix Dialog may handle this. |

**Overall Navigation Grade: A-** — Well-implemented mobile nav with proper Sheet drawer pattern.

---

## 2. Collection Page

### Grid Layout

**File:** `client/src/components/CollectionGrid.tsx` (line 112)

```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8
```

| Viewport | Columns | Gap |
|----------|---------|-----|
| < 640px | 1 column | 24px (gap-6) |
| 640–1023px | 2 columns | 24px |
| ≥ 1024px | 3 columns | 32px (gap-8) |

**At 375px:** Single-column cards at full width (~343px with `px-4`). **Correct.**

**At 390px:** Same single-column at ~358px. **Correct.**

### Bottle Card Layout

**File:** `client/src/components/WhiskeyCard.tsx`

**Structure:**
- Card container: `card-elevated card-interactive p-0 overflow-hidden`
- Image: `aspect-[4/5]` with `object-contain` and `p-6` internal padding
- Content: `p-5 space-y-3`
- Name: `text-whiskey-name line-clamp-2` (2-line max)
- Metadata row: `flex items-center justify-between` (rating left, price right)

**Card Height:** Auto-sized, not fixed. Image aspect-[4/5] + content padding = consistent proportions.

**Text Readability:**
- Whiskey name: `text-whiskey-name` → DM Serif Display, fluid-sized
- Distillery: `text-sm` (14px)
- Type badge: `text-label-caps` (12px, uppercase, tracked)
- Rating: `text-sm` (14px)
- Price: `text-lg font-semibold` (18px)

**At 375px:** All text sizes are readable without zooming. `line-clamp-2` prevents name overflow.

### CRITICAL: Hover-Only Actions

**File:** `client/src/components/WhiskeyCard.tsx` (lines 121–154)

```tsx
<div className="absolute bottom-0 left-0 right-0 p-4
  bg-gradient-to-t from-card via-card to-transparent
  translate-y-full group-hover:translate-y-0
  transition-transform duration-300">
```

| Interaction | Mobile Impact | Severity |
|-------------|---------------|----------|
| `group-hover:scale-105` on image (line 48) | Decorative zoom — no touch equivalent | **LOW** |
| `group-hover:opacity-100` glow effect (line 40) | Decorative — no functional impact | **LOW** |
| **`group-hover:translate-y-0` action buttons (line 122)** | **Buttons HIDDEN on touch devices** | **HIGH** |

The action overlay (Edit, Details, Review buttons) is **completely hidden on mobile** — it only appears on hover. Mobile users must tap the entire card to navigate, which likely triggers the card's click handler. However, the individual Edit and Review shortcut buttons are **inaccessible on touch**.

**Recommendation:** Show action buttons permanently on mobile, or provide them in the WhiskeyDetailModal.

### Touch Target Compliance

Global CSS enforces `min-height: 44px` on all interactive elements below 640px (index.css line 610–613). Card content area is large enough to be a tap target.

**Overall Collection Page Grade: B-** — Grid layout is excellent, but hover-only action buttons are a significant mobile UX gap.

---

## 3. Page Headers

### Hero Text Sizing

**File:** `client/src/index.css` (lines 191–197)

```css
.text-display-hero {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 5rem);
  line-height: 1.1;
}
```

| Viewport | Computed Size | Result |
|----------|--------------|--------|
| 375px | 8vw = 30px → clamps to **40px** | Readable, large but appropriate |
| 390px | 8vw = 31.2px → clamps to **40px** | Same — clamped minimum |
| 768px | 8vw = 61.4px | Scaled between min/max |
| 1024px | 8vw = 81.9px → clamps to **80px** | Max size |

**Verdict:** Hero text at 40px (2.5rem) on mobile is large but fits single words like "Dashboard" or "Community". Long dynamic names like `{user.displayName}'s Collection` could wrap to 2 lines, which is acceptable with `line-height: 1.1`.

### Section Title Sizing

```css
.text-display-section {
  font-size: clamp(1.75rem, 4vw, 2.5rem);
}
```

At 375px: 4vw = 15px → clamps to **28px** (1.75rem). Good.

### CTA Button Fit

**File:** `client/src/pages/Home.tsx` (lines 145–162)

```tsx
<div className="flex items-center gap-2">
  <Button size="icon" className="h-10 w-10">  <!-- Scan button -->
  <Button>
    <span className="hidden sm:inline">Add Whiskey</span>
    <span className="sm:hidden">Add</span>
  </Button>
</div>
```

- Scan button: fixed 40×40px icon button
- Add button: text shortens to "Add" below 640px
- `flex` layout with `gap-2` (8px)

**At 375px:** Logo (~280px) + gap + buttons (~40 + 8 + ~70px) = ~398px. This exceeds 375px.

**Potential issue:** Header uses `flex justify-between`, so the logo and buttons may compress, but the logo text won't truncate. This could cause the header to feel very cramped at 375px.

### Padding Consistency

All page headers use the same pattern:
```tsx
<header className="relative py-12 md:py-16">
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
```

| Viewport | Vertical Padding | Horizontal Padding |
|----------|-----------------|-------------------|
| < 640px | 48px (py-12) | 16px (px-4) |
| 640–767px | 48px | 24px (px-6) |
| 768–1023px | 64px (md:py-16) | 24px |
| ≥ 1024px | 64px | 32px (px-8) |

**Verdict:** Appropriate padding progression. Mobile gets adequate 16px margins.

### Page-Specific Header Notes

| Page | Mobile Notes |
|------|-------------|
| **Home** | Subtitle `hidden sm:block` — hidden on mobile. Good. |
| **Dashboard** | `flex flex-col sm:flex-row` — "Back to Collection" button stacks below title on mobile. Good. |
| **Community** | Simple stack, no issues. |
| **Profile** | `flex flex-col sm:flex-row items-center` — Avatar centers above name on mobile. Stats use `flex-wrap`. |

**Overall Page Headers Grade: A-** — Fluid typography works well. Minor cramping risk at 375px in the Collection header between logo and buttons.

---

## 4. Filters / Search Bar

**File:** `client/src/components/FilterBar.tsx`

### Mobile vs Desktop Strategy
The FilterBar uses `useIsMobile()` to render **completely different layouts**:

| Viewport | Layout |
|----------|--------|
| < 768px | Inline search input + filter icon → opens Sheet overlay |
| ≥ 768px | Horizontal bar with dropdowns |

### Mobile Filter Layout (lines 276–389)

```tsx
<div className="flex items-center gap-2">
  <div className="relative flex-1">
    <Input placeholder="Search..." className="pl-9 h-10 bg-card border-border/50" />
  </div>
  <Button size="sm" className="h-10 relative">
    <SlidersHorizontal className="h-4 w-4" />
  </Button>
</div>
```

- Search input: `flex-1` (fills available width) with `h-10` (40px)
- Filter button: `h-10` with icon
- **At 375px:** Search ~295px wide + 8px gap + ~40px button = ~343px. **Fits.**

### Filter Sheet (line 310)

```tsx
<SheetContent side="right" className="w-[300px] sm:w-[380px] bg-card">
  <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
```

- Width: 300px on tiny screens, 380px at ≥640px
- Content: scrollable with calculated max-height
- Filters arranged vertically in the sheet

### Active Filter Tags (lines 343–387)

```tsx
<div className="flex items-center gap-2 flex-wrap">
  <Badge className="bg-muted text-muted-foreground border-border">
```

- `flex-wrap` allows tags to wrap to multiple lines
- Tags use `text-xs` sizing

### Horizontal Overflow?
- **Search bar:** No — uses `flex-1` to fill remaining space
- **Filter sheet:** Uses fixed widths (300/380px) but renders as overlay, not inline
- **Active filter tags:** `flex-wrap` prevents overflow

**No horizontal overflow detected.**

### Desktop Filter Dropdowns (Not shown on mobile, but noted)
The desktop layout has fixed-width dropdowns (`w-[130px]`, `w-[140px]`, etc.) that would overflow on mobile. However, since the component uses `useIsMobile()` to switch layouts entirely, this is **not an issue**.

**Overall Filters Grade: A** — Smart dual-layout strategy. Mobile filter Sheet is well-sized and scrollable.

---

## 5. Collection Stats

**File:** `client/src/components/CollectionStats.tsx`

### Grid Layout

```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
```

| Viewport | Columns | Gap |
|----------|---------|-----|
| < 1024px | 2 columns | 16px (gap-4) |
| ≥ 1024px | 4 columns | 16px |

**At 375px:** Available width = 343px (with `px-4`). Two columns: (343 - 16) / 2 = **163.5px per card**.

**At 390px:** Available width = 358px. Two columns: (358 - 16) / 2 = **171px per card**.

Note: At ≤375px, the global CSS reduces `gap-4` to `0.75rem` (12px), so cards get (343 - 12) / 2 = **165.5px per card**.

### Card Internal Spacing

```tsx
<div className="card-elevated p-6">
  <p className="text-label-caps mb-2">{stat.label}</p>
  <p className="text-3xl font-semibold tabular-nums text-foreground">{stat.value}</p>
</div>
```

- Padding: `p-6` (24px all sides)
- Available content width: 163.5 - 48 = **115.5px**

### Text Truncation Analysis

| Stat | Example Value | Width at 30px (text-3xl) | Fits in 115px? |
|------|--------------|-------------------------|----------------|
| Total Bottles | "12" | ~36px | YES |
| Total Bottles | "150" | ~54px | YES |
| Avg. Rating | "4.2" | ~42px | YES |
| Total Value | "$45,678" | ~108px | BARELY |
| Total Value | "$145,678" | ~126px | **NO — OVERFLOWS** |
| Wishlist | "8" | ~18px | YES |

### Issues Found

| Issue | Severity | Details |
|-------|----------|---------|
| `text-3xl` (30px) values in 115px width | **MEDIUM** | Large dollar amounts overflow. "$100,000+" breaks card. |
| `p-6` too generous for mobile | **MEDIUM** | 24px padding on 163px card wastes 29% of width. Dashboard uses `p-4` and `text-2xl` — much better. |
| No `truncate` or `line-clamp` on values | **LOW** | Values can push card height if they wrap. |
| Label text wrapping | **LOW** | "Total Bottles" at text-label-caps (12px) may wrap to 2 lines on the narrowest cards. |

### Comparison: Dashboard Stats vs CollectionStats

| Property | CollectionStats | Dashboard Stats |
|----------|----------------|-----------------|
| Grid | `grid-cols-2 lg:grid-cols-4` | `grid-cols-2 md:grid-cols-4` |
| Padding | `p-6` (24px) | `p-4` (16px) |
| Value Size | `text-3xl` (30px) | `text-2xl` (24px) |
| Icon | None | 40×40px icon box |
| **Mobile Fit** | **Tight** | **Better** |

**Overall Collection Stats Grade: C+** — 2-column grid works, but `p-6` + `text-3xl` is too generous for 163px cards. Dashboard stats handle mobile better.

---

## 6. Modals / Dialogs

### Base Dialog Component

**File:** `client/src/components/ui/dialog.tsx`

Default dialog behavior:
- Position: `fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]`
- Width: `w-full max-w-lg` (full width, capped at 512px)
- Rounded corners: `sm:rounded-xl` (no rounding below 640px — fills screen edge-to-edge)
- Footer buttons: `flex flex-col-reverse sm:flex-row` (stacked on mobile, inline on desktop)
- Header text: `text-center sm:text-left` (centered on mobile)

### Modal-by-Modal Breakdown

#### Add Whiskey Modal
**File:** `client/src/components/modals/AddWhiskeyModal.tsx`

- Size: `sm:max-w-lg` (full width on mobile, 512px on sm+)
- Height: `max-h-[85vh]`
- Form scroll: `max-h-[calc(85vh-120px)] overflow-y-auto`
- Form grid: `grid-cols-1 md:grid-cols-2` (single column on mobile)
- **At 375px:** Form fills screen width, single-column layout. **GOOD.**

#### Review Modal — FULL-SCREEN MOBILE
**File:** `client/src/components/modals/ReviewModal.tsx`

```tsx
isMobile
  ? "w-screen h-screen max-w-none max-h-none rounded-none border-0 translate-x-0 translate-y-0 left-0 top-0"
  : "max-w-2xl max-h-[90vh]"
```

- **Mobile:** Takes entire viewport (w-screen h-screen)
- Removes all borders, rounding, and transform positioning
- Sticky header + sticky footer with scrollable content (`flex-1`)
- **At 375px:** Full-screen experience, no overflow issues. **EXCELLENT.**

#### Whiskey Detail Modal
**File:** `client/src/components/modals/WhiskeyDetailModal.tsx`

- Size: `max-w-3xl max-h-[90vh]`
- Title: `text-xl md:text-2xl` (20px mobile, 24px desktop)
- Action buttons: `flex-wrap` with text hidden on mobile (`hidden sm:inline`)
- Content: `grid-cols-1 md:grid-cols-2` (stacks on mobile)
- Image: `aspect-[4/3] sm:aspect-square` (wider on mobile for better use of horizontal space)
- Detail cards: `grid-cols-2 gap-2` with `text-[10px] sm:text-xs` labels and `p-2 sm:p-3` padding
- **At 375px:** Single-column, scrollable, compressed detail cards. **GOOD.**

#### Profile Settings Modal
**File:** `client/src/components/modals/ProfileSettingsModal.tsx`

- Size: `sm:max-w-[500px] max-h-[90vh] overflow-y-auto`
- Buttons: `flex justify-end gap-3` with `flex-1` on each (equal width)
- **At 375px:** Full-width, scrollable. Buttons share space equally. **OK.**

#### Export Collection Modal
**File:** `client/src/components/modals/ExportCollectionModal.tsx`

- Size: `sm:max-w-[450px]`
- Option cards: `p-4` with toggle switches
- Buttons: `flex gap-3` with `flex-1`
- **At 375px:** Full-width, compact layout. **GOOD.**

#### Share as Image Modal
**File:** `client/src/components/modals/ShareAsImageModal.tsx`

- Size: `sm:max-w-[500px] max-h-[90vh] overflow-y-auto`
- Preview area: centered with `bg-muted/50 rounded-lg border`
- Buttons: `flex gap-3` with `flex-1`
- **At 375px:** Full-width, scrollable. Preview may be small but functional. **OK.**

### Modal Summary Table

| Modal | Mobile Width | Mobile Height | Scroll | Mobile Layout |
|-------|-------------|---------------|--------|---------------|
| Add Whiskey | Full | 85vh | Form scrolls | Single column |
| Review | Full screen | Full screen | flex-1 | Full screen takeover |
| Whiskey Detail | Full | 90vh | Content scrolls | Single column, 4:3 image |
| Profile Settings | Full | 90vh | Entire modal | Single column |
| Export Collection | Full | Auto | No (short content) | Single column |
| Share as Image | Full | 90vh | Entire modal | Single column |

**Overall Modals Grade: A** — Review modal's full-screen mobile takeover is best-in-class. All modals properly fill width and handle scrolling.

---

## 7. Global Mobile Utilities

**File:** `client/src/index.css` (lines 573–640)

### Touch Targets
```css
.touch-target {
  @apply min-h-[44px] min-w-[44px];
}

@media (max-width: 640px) {
  button, a, input, select, textarea {
    min-height: 44px;
  }
}
```
All interactive elements get 44px minimum height on mobile (Apple HIG compliant).

### 375px Special Handling
```css
@media (max-width: 375px) {
  html { font-size: 14px; }        /* Base font shrinks from 16→14px */
  .container { @apply px-3; }       /* Tighter padding */
  .gap-4 { gap: 0.75rem; }          /* Gap-4: 16→12px */
  .gap-6 { gap: 1rem; }             /* Gap-6: 24→16px */
}
```

**Issue:** The `px-3` only applies to `.container` class. Most pages use `max-w-7xl mx-auto px-4` which does **not** get the tighter padding at 375px.

### Utility Classes Available
| Class | Purpose | Used? |
|-------|---------|-------|
| `.safe-area-top` | iPhone notch padding | Available but not applied globally |
| `.safe-area-bottom` | Home indicator padding | Available but not applied globally |
| `.touch-target` | 44×44px minimum | Available, enforced globally on `<640px` |
| `.text-mobile-sm` | `text-sm` → `text-xs` at 375px | Available but not widely used |
| `.mobile-full` | Full-screen utility | Available, used by ReviewModal pattern |
| `.hide-on-tiny` | Hidden at ≤375px | Available but not widely used |

### Mobile Breakpoint Hook

**File:** `client/src/hooks/use-mobile.tsx`

```typescript
const MOBILE_BREAKPOINT = 768;
```

Used by: Header, FilterBar, ReviewModal, and potentially other components for JavaScript-level responsive behavior.

---

## 8. Issue Summary & Priority Matrix

### HIGH Severity

| # | Issue | Component | Impact |
|---|-------|-----------|--------|
| 1 | **Hover-only action buttons on WhiskeyCard** | WhiskeyCard.tsx:121–154 | Edit/Review/Details overlay buttons are completely hidden on touch devices. Only visible on `:hover`. |
| 2 | **CollectionStats `text-3xl` + `p-6` overflow** | CollectionStats.tsx:52–56 | Dollar values >$99,999 overflow 115px content width at 375px. Dashboard stats use better sizing (`text-2xl` + `p-4`). |

### MEDIUM Severity

| # | Issue | Component | Impact |
|---|-------|-----------|--------|
| 3 | **Header cramped at 375px** | Header.tsx:187–191 | Logo text "MyWhiskeyPedia" (30px Playfair) + buttons may leave <10px gap at 375px. |
| 4 | **`px-4` not reduced at 375px** | Global (all pages) | Pages use `max-w-7xl mx-auto px-4` instead of `.container`, so they miss the 375px `px-3` override. |
| 5 | **Dashboard chart negative margins** | Dashboard.tsx:414,447,477 | `margin={{ left: -20 }}` on Recharts with only `px-2` padding on mobile could clip axis labels. |
| 6 | **Safe area insets not applied** | Global | `.safe-area-top` / `.safe-area-bottom` exist but aren't applied to the sticky header or bottom nav. iPhone notch/home indicator may overlap content. |

### LOW Severity

| # | Issue | Component | Impact |
|---|-------|-----------|--------|
| 7 | **No swipe-to-close on nav Sheet** | Header.tsx | Users may expect swipe gesture to dismiss the mobile nav drawer. |
| 8 | **CollectionStats label wrapping** | CollectionStats.tsx:54 | "Total Bottles" in `text-label-caps` (12px) may wrap on the narrowest cards. |
| 9 | **Profile Follow button unconstrained** | Profile.tsx:230–234 | No max-width on Follow button — could be awkwardly wide on mobile portrait. |
| 10 | **WhiskeyCard image hover zoom** | WhiskeyCard.tsx:48 | `group-hover:scale-105` is decorative but gives no feedback on touch. |

### Recommended Fixes (Prioritized)

1. **WhiskeyCard touch actions** — Add `@media (hover: none)` to show action overlay permanently, OR ensure all actions are available in WhiskeyDetailModal
2. **CollectionStats mobile sizing** — Change `p-6` → `p-4` and `text-3xl` → `text-2xl` to match Dashboard pattern
3. **Apply safe-area-inset** — Add `safe-area-top` to sticky header, `safe-area-bottom` to any bottom-anchored content
4. **Consistent 375px padding** — Either use `.container` class everywhere or extend the 375px `px-3` override to `[class*="px-4"]`

---

*Audit generated by static code analysis. For pixel-perfect validation, test on physical devices or browser DevTools device emulation.*
