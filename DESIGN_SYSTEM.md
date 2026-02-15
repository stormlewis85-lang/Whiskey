# MyWhiskeyPedia Design System Overhaul
## Codename: "Speakeasy Refined"

> **IMPORTANT**: This is an AESTHETIC-ONLY update. Do NOT modify any functionality, routes, API calls, state management, or feature logic. Only update styling, colors, fonts, shadows, and visual presentation.

---

## DESIGN PHILOSOPHY

Transform MyWhiskeyPedia from a functional whiskey tracker into an immersive, premium experience that evokes the warmth of a well-appointed whiskey bar. Dark, warm, tactile—the digital equivalent of leather, oak, and amber liquid catching candlelight.

**Core Principles:**
1. **Warmth over coldness** — Every surface should feel like it has texture and depth
2. **Confident restraint** — Premium means knowing when NOT to add more
3. **Purposeful animation** — Motion should feel like liquid pouring, not UI bouncing
4. **Typography with character** — Headlines that feel hand-lettered, body text that's effortlessly readable
5. **Amber as the hero** — Let the whiskey color palette do the heavy lifting

---

## 1. TYPOGRAPHY SYSTEM

### Font Stack

**Display/Branding Font**: Playfair Display (Google Fonts)
- Use for: Logo "WhiskeyPedia", page titles, bottle names on detail view
- Weight: 600-700
- Character: Elegant serif with high contrast, whiskey label feel

**Heading Font**: DM Serif Display (Google Fonts)
- Use for: Section headings, card titles, modal headers
- Weight: 400
- Character: Modern serif, readable at medium sizes

**Body/UI Font**: DM Sans (Google Fonts)
- Use for: All body text, buttons, labels, metadata
- Weights: 400, 500, 600
- Character: Clean geometric sans, pairs beautifully with DM Serif

### Implementation

Add to index.html `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=DM+Serif+Display&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
```

Add CSS variables to globals.css:
```css
:root {
  --font-display: 'Playfair Display', Georgia, serif;
  --font-heading: 'DM Serif Display', Georgia, serif;
  --font-body: 'DM Sans', system-ui, sans-serif;
}
```

Tailwind config fontFamily extend:
```js
fontFamily: {
  display: ['Playfair Display', 'Georgia', 'serif'],
  heading: ['DM Serif Display', 'Georgia', 'serif'],
  sans: ['DM Sans', 'system-ui', 'sans-serif'],
}
```

### Type Scale Usage

| Element | Font | Size | Weight | Extra |
|---------|------|------|--------|-------|
| Logo "WhiskeyPedia" | font-display | text-2xl | font-bold | tracking-wide |
| Page titles | font-display | text-3xl | font-semibold | - |
| Section headings | font-heading | text-xl | font-normal | - |
| Card titles (bottle names) | font-heading | text-lg | font-normal | - |
| Body text | font-sans | text-sm | font-normal | - |
| Labels/metadata | font-sans | text-xs | font-medium | tracking-wide uppercase |
| Buttons | font-sans | text-sm | font-medium | - |
| Stats/numbers | font-sans | text-2xl | font-semibold | tabular-nums |

---

## 2. COLOR SYSTEM

### Dark Theme (.dark) — PRIMARY

Replace current values in globals.css:

```css
.dark {
  /* Backgrounds - deeper, richer browns */
  --background: 15 20% 6%;
  --foreground: 38 25% 90%;
  
  /* Cards - subtle elevation through warmth */
  --card: 18 18% 10%;
  --card-foreground: 38 25% 90%;
  
  /* Popovers */
  --popover: 18 18% 12%;
  --popover-foreground: 38 25% 90%;
  
  /* Primary - rich liquid amber */
  --primary: 32 85% 52%;
  --primary-foreground: 15 20% 6%;
  
  /* Secondary - muted copper */
  --secondary: 25 15% 18%;
  --secondary-foreground: 38 20% 85%;
  
  /* Muted */
  --muted: 20 12% 16%;
  --muted-foreground: 30 12% 55%;
  
  /* Accent */
  --accent: 28 25% 20%;
  --accent-foreground: 36 80% 65%;
  
  /* Status colors */
  --destructive: 0 65% 50%;
  --destructive-foreground: 0 0% 100%;
  --success: 145 50% 40%;
  --success-foreground: 0 0% 100%;
  --warning: 38 90% 55%;
  --warning-foreground: 15 20% 6%;
  
  /* Borders */
  --border: 25 15% 18%;
  --input: 25 15% 20%;
  --ring: 32 85% 52%;
  
  /* Chart colors - amber/copper gradient */
  --chart-1: 32 85% 52%;
  --chart-2: 22 70% 45%;
  --chart-3: 42 80% 60%;
  --chart-4: 15 60% 40%;
  --chart-5: 28 50% 50%;
  
  /* Sidebar */
  --sidebar-background: 15 18% 8%;
  --sidebar-foreground: 38 25% 90%;
  --sidebar-primary: 32 85% 52%;
  --sidebar-primary-foreground: 15 20% 6%;
  --sidebar-accent: 28 25% 18%;
  --sidebar-accent-foreground: 36 80% 65%;
  --sidebar-border: 25 15% 16%;
  --sidebar-ring: 32 85% 52%;
}
```

### Light Theme (:root)

```css
:root {
  /* Backgrounds - warm parchment/cream */
  --background: 40 40% 96%;
  --foreground: 20 35% 12%;
  
  /* Cards */
  --card: 42 50% 98%;
  --card-foreground: 20 35% 12%;
  
  --popover: 42 50% 98%;
  --popover-foreground: 20 35% 12%;
  
  /* Primary - deeper amber for light backgrounds */
  --primary: 28 75% 38%;
  --primary-foreground: 42 50% 98%;
  
  --secondary: 35 30% 90%;
  --secondary-foreground: 20 30% 20%;
  
  --muted: 38 25% 92%;
  --muted-foreground: 20 15% 40%;
  
  --accent: 38 40% 88%;
  --accent-foreground: 20 35% 15%;
  
  --destructive: 0 72% 51%;
  --destructive-foreground: 0 0% 100%;
  --success: 145 55% 35%;
  --success-foreground: 0 0% 100%;
  --warning: 38 90% 50%;
  --warning-foreground: 20 35% 12%;
  
  --border: 35 25% 85%;
  --input: 35 25% 85%;
  --ring: 28 75% 38%;
  
  --chart-1: 28 75% 38%;
  --chart-2: 18 60% 35%;
  --chart-3: 38 70% 50%;
  --chart-4: 22 50% 45%;
  --chart-5: 30 45% 42%;
  
  --sidebar-background: 38 35% 94%;
  --sidebar-foreground: 20 35% 12%;
  --sidebar-primary: 28 75% 38%;
  --sidebar-primary-foreground: 42 50% 98%;
  --sidebar-accent: 38 40% 88%;
  --sidebar-accent-foreground: 20 35% 15%;
  --sidebar-border: 35 25% 85%;
  --sidebar-ring: 28 75% 38%;
}
```

---

## 3. CUSTOM CSS UTILITIES

Add these to globals.css (replace existing shadow-warm classes):

```css
/* ===== GRADIENTS ===== */

.text-gradient-brand {
  background: linear-gradient(
    135deg,
    hsl(32 85% 52%) 0%,
    hsl(42 90% 60%) 50%,
    hsl(28 80% 48%) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== SHADOWS ===== */

.shadow-warm-xs {
  box-shadow: 0 1px 2px hsl(25 50% 20% / 0.08);
}

.shadow-warm-sm {
  box-shadow: 
    0 1px 3px hsl(25 50% 20% / 0.1),
    0 1px 2px hsl(25 50% 20% / 0.06);
}

.shadow-warm {
  box-shadow: 
    0 4px 6px -1px hsl(25 50% 20% / 0.12),
    0 2px 4px -2px hsl(25 50% 20% / 0.08);
}

.shadow-warm-md {
  box-shadow: 
    0 10px 15px -3px hsl(25 50% 20% / 0.12),
    0 4px 6px -4px hsl(25 50% 20% / 0.08);
}

.shadow-warm-lg {
  box-shadow: 
    0 20px 25px -5px hsl(25 50% 20% / 0.15),
    0 8px 10px -6px hsl(25 50% 20% / 0.1);
}

.shadow-glow-amber {
  box-shadow: 
    0 0 20px hsl(32 85% 52% / 0.25),
    0 0 40px hsl(32 85% 52% / 0.1);
}

/* ===== GLASS EFFECT ===== */

.glass-warm {
  background: hsl(var(--card) / 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid hsl(var(--border) / 0.5);
}

/* ===== ANIMATIONS ===== */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.4s ease-out forwards;
}

.stagger-children > * {
  opacity: 0;
  animation: fade-up 0.4s ease-out forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 50ms; }
.stagger-children > *:nth-child(3) { animation-delay: 100ms; }
.stagger-children > *:nth-child(4) { animation-delay: 150ms; }
.stagger-children > *:nth-child(5) { animation-delay: 200ms; }
.stagger-children > *:nth-child(6) { animation-delay: 250ms; }
.stagger-children > *:nth-child(7) { animation-delay: 300ms; }
.stagger-children > *:nth-child(8) { animation-delay: 350ms; }

/* ===== HOVER EFFECTS ===== */

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
}

/* ===== FOCUS STATES ===== */

.focus-ring-amber:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--primary));
}

/* ===== SCROLLBAR ===== */

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: hsl(var(--muted) / 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--primary) / 0.4);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--primary) / 0.6);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--primary) / 0.4) hsl(var(--muted) / 0.3);
}

/* ===== REDUCED MOTION ===== */

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 4. COMPONENT STYLING UPDATES

### 4.1 Navbar

Update the navbar styling (DO NOT change navigation logic or routes):

- Apply `glass-warm` class to nav container for subtle blur effect
- Update logo to use `font-display text-2xl font-bold text-gradient-brand tracking-wide`
- Active nav item: add `after:absolute after:bottom-0 after:left-2 after:right-2 after:h-0.5 after:bg-primary after:rounded-full`
- Add mobile hamburger menu for `md:hidden` using Sheet component (styling only, nav items stay the same)

### 4.2 Bottle Cards

Update card styling (DO NOT change click handlers, data display logic, or actions):

- Add `overflow-hidden rounded-xl hover-lift shadow-warm-sm hover:shadow-warm-md transition-all duration-300`
- Image container: `aspect-[3/4]` for consistent sizing
- Add gradient overlay on image: `bg-gradient-to-t from-black/80 via-black/20 to-transparent`
- Bottle name: `font-heading text-lg`
- Type badge: `bg-black/60 backdrop-blur-sm text-white/90`
- Action buttons: reveal on hover with `translate-y-full group-hover:translate-y-0 transition-transform`

### 4.3 Page Headers

Update header styling:

- Title: `font-display text-3xl sm:text-4xl font-semibold`
- Add subtle gradient background: `bg-gradient-to-r from-primary/5 via-transparent to-primary/5`
- CTA buttons: add `shadow-warm-sm`

### 4.4 Collection Summary Stats

Update stat cards:

- Container: `rounded-xl bg-card border border-border/40 shadow-warm-xs`
- Icon container: `w-10 h-10 rounded-lg bg-primary/10`
- Value: `font-sans text-2xl font-semibold tabular-nums`
- Label: `text-xs font-medium tracking-wide uppercase text-muted-foreground`
- Add subtle corner glow: `absolute -top-10 -right-10 w-24 h-24 bg-primary/5 rounded-full blur-2xl`

### 4.5 Empty States

Update empty state styling:

- Add warm glow behind icon: `bg-primary/10 rounded-full blur-3xl`
- Icon container: `rounded-full bg-card border border-border/40 shadow-warm`
- Title: `font-heading text-xl`
- CTA: add `shadow-warm-sm`

### 4.6 Review Wizard Progress

Update progress bar (DO NOT change step logic):

- Step circles: `w-8 h-8 rounded-full` with states:
  - Complete: `bg-primary text-primary-foreground` with checkmark icon
  - Current: `bg-primary text-primary-foreground ring-4 ring-primary/20`
  - Upcoming: `bg-muted text-muted-foreground`
- Connector lines between steps
- Step label: `font-heading text-xl`

### 4.7 Modals/Dialogs

Update dialog styling:

- Add `shadow-warm-lg` to dialog content
- Headers: `font-heading text-xl`
- Improve spacing and padding consistency

---

## 5. RESPONSIVE UPDATES

### Grid Layouts

Bottle card grid:
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6
```

Stats grid:
```
grid grid-cols-2 md:grid-cols-4 gap-4
```

### Max Width Containers

Wrap page content in:
```
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
```

### Mobile Navigation

Add hamburger menu for screens below `md` breakpoint using existing Sheet component.

---

## 6. IMPLEMENTATION PHASES

### Phase 1: Foundation
1. Add Google Fonts to index.html
2. Update globals.css with new color tokens
3. Add fontFamily to tailwind.config.js
4. Add all new CSS utilities

### Phase 2: Core Components
1. Navbar styling + mobile menu
2. Bottle card styling
3. Page header styling
4. Collection summary stats styling

### Phase 3: Polish
1. Empty states
2. Review wizard progress
3. Modal/dialog styling
4. Micro-interactions (hover states, transitions)

### Phase 4: Testing
1. Test both light and dark themes
2. Verify all breakpoints
3. Check reduced motion support
4. Verify no functionality was broken

---

## 7. FILES TO MODIFY

| File | Changes |
|------|---------|
| `index.html` | Add Google Fonts links |
| `tailwind.config.js` | Add fontFamily extend |
| `src/styles/globals.css` | Replace color tokens, add utilities |
| `src/components/Navbar.tsx` | Styling only |
| `src/components/BottleCard.tsx` | Styling only |
| `src/components/PageHeader.tsx` or equivalent | Styling only |
| `src/components/CollectionSummary.tsx` | Styling only |
| `src/components/EmptyState.tsx` | Styling only |
| Review wizard progress component | Styling only |
| Modal/dialog components | Styling only |

---

## CRITICAL REMINDERS

1. **DO NOT** modify any onClick handlers, form submissions, or event logic
2. **DO NOT** change any API calls or data fetching
3. **DO NOT** alter routing or navigation logic
4. **DO NOT** modify state management or data flow
5. **DO NOT** remove or rename any existing CSS classes that other components depend on (add new ones, update values)
6. **PRESERVE** all existing functionality - this is purely visual
7. **TEST** after each phase to ensure nothing broke

The goal is to make the app LOOK premium without changing HOW it works.
