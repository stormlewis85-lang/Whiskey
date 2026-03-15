# MyWhiskeyPedia UI Redesign — Context File
## Design System & Component Specifications

**Purpose:** This file contains all design specs the UI agent needs. Read this before starting any task.

---

## Design Philosophy

We're keeping the **Black & Gold** aesthetic but changing the **layout structure** to feel like a modern mobile-first social app (Drammer, Untappd pattern).

**Key principles:**
1. Mobile-first — Design for 375px viewport, scale up
2. Bottom navigation — Thumb-friendly, always visible
3. Card-based content — Rounded corners, subtle borders, clear hierarchy
4. Social patterns — Activity feeds, avatars, engagement actions
5. Gold is precious — Use gold sparingly: stars, primary CTAs, active states, prices, logo

---

## Color Tokens

Use CSS variables, not hardcoded values:

```css
--gold: #D4A44C;
--gold-dim: rgba(212, 164, 76, 0.6);
--gold-glow: rgba(212, 164, 76, 0.15);
--black: #0A0A0A;
--black-card: #111111;
--black-elevated: #161616;
--black-input: #1a1a1a;
--gray-100: #F5F2ED;
--gray-200: #E8E4DD;
--gray-400: #888888;
--gray-500: #666666;
--gray-600: #444444;
--gray-700: #333333;
--gray-800: #222222;
--red-alert: #E74C3C;
--green-success: #2ECC71;
```

---

## Typography

**Font families:**
- `Playfair Display` — Brand name, bottle names, large headings
- `DM Serif Display` — Section headings, stats
- `DM Sans` — Body text, labels, UI elements

**Scale:**
- Brand title: `1.1rem`, Playfair, weight 500, gold
- Page title: `1.8rem`, Playfair, weight 500
- Section title: `1.2rem`, Playfair, weight 500
- Bottle name (card): `0.9rem`, Playfair
- Bottle name (detail): `1.6rem`, Playfair
- Body: `0.8rem`, DM Sans, weight 400
- Label: `0.65-0.7rem`, DM Sans, uppercase, letter-spacing 0.08em
- Small: `0.6rem`, DM Sans

---

## Spacing

- Page padding: `20px` horizontal, `16px` vertical
- Card padding: `16px`
- Card border-radius: `12-16px`
- Card border: `1px solid rgba(255,255,255,0.04)`
- Section gap: `20px`
- Component gap: `12px`
- Bottom nav clearance: `100px` padding-bottom on scrollable content

---

## Component Specifications

### BottomNav

```
┌─────────────────────────────────────────────┐
│  Home    Search   [SCAN]   Drops   Profile  │
│   🏠       🔍       ⬡        🔔       👤     │
└─────────────────────────────────────────────┘
```

- Height: `84px`
- Background: `linear-gradient(to top, var(--black) 70%, transparent)`
- Position: fixed bottom
- 5 items equally spaced
- Center item (Scan): raised FAB, `56px` circle, gold background, `-20px` margin-top
- Active state: gold icon color, gold label
- Inactive: `opacity: 0.4`
- Icon size: `24px`
- Label: `0.6rem`, weight 500

### ActivityCard

```
┌─────────────────────────────────────────────┐
│ [Avatar]  Username                          │
│           reviewed Bottle Name              │
│           25 minutes ago                    │
│                                             │
│    ┌─────────────────────────────────┐      │
│    │ [Img]  Bottle Name              │      │
│    │        Distillery               │      │
│    │        ⭐ 92                     │      │
│    └─────────────────────────────────┘      │
│                                             │
│    "Tasting note text here..."              │
│                                             │
│    ❤️ 12    💬 4                             │
└─────────────────────────────────────────────┘
```

- Full width, `border-bottom: 1px solid rgba(255,255,255,0.04)`
- Padding: `16px 20px`
- Avatar: `40px` circle, gray gradient background, initials centered
- Username: `0.85rem`, weight 500
- Action text: `0.75rem`, gray-500, bottle name in gray-100
- Timestamp: `0.65rem`, gray-600
- Embedded bottle card: `background: var(--black-elevated)`, `border-radius: 12px`
- Bottle image area: `70px × 90px`
- Note text: `0.8rem`, gray-400, italic
- Actions row: `margin-top: 12px`, `gap: 20px`

### DropAlertCard

```
┌─────────────────────────────────────────────┐
│▌ 🕐 DROP ALERT                    2 min ago │
│▌                                            │
│▌ Bottle King — Troy, MI                     │
│▌ Blanton's Single Barrel                    │
│▌ 📍 2.4 mi away   ❤️ On your wishlist       │
└─────────────────────────────────────────────┘
```

- `margin: 0 16px`
- Background: `linear-gradient(135deg, rgba(212,164,76,0.12), rgba(212,164,76,0.04))`
- Border: `1px solid rgba(212,164,76,0.2)`
- Border-radius: `16px`
- Left accent: `4px` solid gold bar (use `::before` pseudo-element)
- Padding: `16px`
- Badge: gold background at 15% opacity, gold text, uppercase, `0.65rem`
- Store name: `0.8rem`, weight 500
- Bottle name: `1rem`, Playfair, gold
- Meta: `0.7rem`, gray-500, icons inline

### StoreDropCard

```
┌─────────────────────────────────────────────┐
│ [Logo]  Store Name                   2 min  │
│         Troy, MI · 2.4 mi                   │
├─────────────────────────────────────────────┤
│ [Bottle]  Blanton's Single Barrel          │
│           Kentucky Straight Bourbon         │
│           ✓ On your wishlist                │
├─────────────────────────────────────────────┤
│  [Get Directions]    [View Store]           │
└─────────────────────────────────────────────┘
```

- Background: `var(--black-card)`
- Border: `1px solid rgba(255,255,255,0.04)`
- Border-radius: `16px`
- Margin-bottom: `12px`
- Header: `padding: 14px 16px`, border-bottom
- Store logo: `40px` square, `border-radius: 10px`
- Time badge: gold text, gold/15% background, `border-radius: 12px`
- Content: `padding: 16px`
- Bottle image: `50px × 70px`
- Wishlist match: green-success color, checkmark icon
- Footer buttons: `flex: 1`, `border-radius: 10px`, `padding: 10px`

### ProfileHeader

```
        ┌──────┐
        │  S   │  ← Gold gradient avatar
        └──────┘
      
       Storm
     @storm_pours
    ⭐ Connoisseur
```

- Center aligned
- Padding: `40px 20px 24px`
- Background: subtle gold gradient at top fading to transparent
- Avatar: `80px` circle, gold gradient, Playfair initials, shadow
- Name: `1.4rem`, Playfair, weight 500
- Handle: `0.8rem`, gray-500
- Badge: inline-flex, gold/12% background, gold text, `0.65rem`, uppercase

### ProfileStats

```
┌─────────────────────────────────────────────┐
│    47        31        156        89        │
│  Bottles   Reviews  Following  Followers    │
└─────────────────────────────────────────────┘
```

- Background: `var(--black-card)`
- Border: `1px solid rgba(255,255,255,0.04)`
- Border-radius: `16px`
- Margin: `0 20px`
- Padding: `20px`
- Flex, `justify-content: center`, `gap: 32px`
- Value: `1.5rem`, Playfair, weight 600, gold
- Label: `0.65rem`, gray-500, uppercase, `letter-spacing: 0.08em`

### ProfileTabs

```
   Collection    Reviews    Wishlist
   ──────────
```

- Flex row, equal width tabs
- Margin: `20px 20px 0`
- Border-bottom: `1px solid rgba(255,255,255,0.06)`
- Tab: `padding: 12px 0`, `0.75rem`, weight 500, uppercase, gray-500
- Active: gold text, gold underline `2px` using `::after`

### CollectionGrid

```
┌─────┐ ┌─────┐ ┌─────┐
│     │ │     │ │     │
│ 🥃  │ │ 🥃  │ │ 🥃  │
│name │ │name │ │name │
└─────┘ └─────┘ └─────┘
```

- `display: grid`
- `grid-template-columns: repeat(3, 1fr)`
- `gap: 2px`
- Padding: `2px 20px 100px` (bottom nav clearance)
- Item: `aspect-ratio: 1`, `border-radius: 8px`, `background: var(--black-elevated)`
- Name overlay: absolute bottom, gradient fade, `0.55rem`, white text

### BottleHero

- Height: `320px`
- Background: `linear-gradient(180deg, rgba(212,164,76,0.06) 0%, transparent 60%)`
- Bottle image: centered, `100px × 200px` placeholder
- Back button: absolute `top: 48px`, `left: 20px`, `36px` circle, blur background
- Action buttons: absolute `top: 48px`, `right: 20px`, row of circles

### RickHouseCard

```
┌─────────────────────────────────────────────┐
│ [🥃]  RICK HOUSE AI                         │
│       Guided Tasting Available              │
│                                             │
│ Let Rick House walk you through this pour...│
│                                             │
│ Start Tasting Session →                     │
└─────────────────────────────────────────────┘
```

- Background: `linear-gradient(135deg, rgba(212,164,76,0.08), rgba(212,164,76,0.02))`
- Border: `1px solid rgba(212,164,76,0.15)`
- Border-radius: `16px`
- Padding: `16px`
- Icon container: `36px` square, gold background, `border-radius: 10px`
- Label: `0.65rem`, gold, uppercase, `letter-spacing: 0.1em`
- Title: `0.95rem`, Playfair
- Description: `0.8rem`, gray-400
- CTA: `0.75rem`, gold, weight 500, arrow icon

---

## Responsive Breakpoints

```css
/* Mobile first - default styles are for 375px */

/* Tablet */
@media (min-width: 768px) {
  /* Collection grid: 4 columns */
  /* Activity cards: more padding */
  /* Consider side margins */
}

/* Desktop */
@media (min-width: 1024px) {
  /* Show top nav, hide bottom nav */
  /* Max-width container: 1200px */
  /* Collection grid: 5-6 columns */
}
```

---

## File Locations

New components go in: `/client/src/components/`

Suggested structure:
```
/client/src/components/
  /navigation/
    BottomNav.tsx
  /activity/
    ActivityCard.tsx
    ActivityBottleCard.tsx
    ActivityActions.tsx
  /drops/
    DropAlertCard.tsx
    StoreDropCard.tsx
    DropFilters.tsx
  /profile/
    ProfileHeader.tsx
    ProfileStats.tsx
    ProfileTabs.tsx
    CollectionGrid.tsx
  /bottle/
    BottleHero.tsx
    BottleInfo.tsx
    BottleQuickStats.tsx
    BottleActions.tsx
    RickHouseCard.tsx
  /layout/
    MobileShell.tsx
```

---

## Mockup Reference

The HTML mockup `mywhiskeypedia-mobile-ui.html` shows:
1. Home/Activity Feed screen
2. Profile/Collection screen
3. Bottle Detail screen
4. Store Drops screen

Use this as visual reference. The mockup is the source of truth for visual design. These specs are the implementation guide.

---

## Rules

1. **Use existing shadcn/ui primitives** where possible (Button, Card, etc.)
2. **Don't break existing functionality** — this is aesthetic only
3. **Mobile-first** — write base styles for 375px, add breakpoints for larger
4. **CSS variables** — no hardcoded colors, use the tokens above
5. **Gold is precious** — only use gold for: stars, primary CTAs, active nav, prices, logo, badges
6. **Test on mobile viewport** — Chrome DevTools, 375px width minimum

---

*Last updated: February 28, 2026*
