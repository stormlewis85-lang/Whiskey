# MyWhiskeyPedia Design System V2
## Codename: "Black & Gold"

> **CRITICAL**: This is an AESTHETIC-ONLY update. Do NOT modify any functionality, routes, API calls, state management, or feature logic. Only update styling, colors, fonts, shadows, and visual presentation.

---

## DESIGN PHILOSOPHY

Inspired by Glenfiddich's dramatic black + gold palette, Linear's disciplined dark UI, and The Macallan's editorial elegance. The goal: make every user's collection feel like a curated gallery in an exclusive whiskey bar.

**Core Principles:**
1. **Near-black canvas** — Deep, rich black (#0C0C0E) as the foundation
2. **Gold is precious** — Use amber/gold sparingly (2% of the UI) so it has impact
3. **Massive darkspace** — Let everything breathe; space IS the luxury
4. **Typography at scale** — Headlines should be confident and oversized
5. **Depth through layers** — Cards use tonal elevation, not drop shadows
6. **Editorial bottles** — Every bottle image treated like a magazine photo

---

## 1. COLOR SYSTEM — THE GLENFIDDICH APPROACH

### Dark Theme (.dark) — PRIMARY

```css
.dark {
  /* ===== BACKGROUNDS - LAYERED BLACKS ===== */
  --background: 0 0% 4%;              /* #0A0A0A - deepest black */
  --foreground: 40 20% 92%;           /* #EDE9E3 - warm cream white */
  
  /* Cards use slightly elevated tones for depth */
  --card: 0 0% 7%;                    /* #121212 - elevated surface */
  --card-foreground: 40 20% 92%;
  
  --popover: 0 0% 9%;                 /* #171717 - highest elevation */
  --popover-foreground: 40 20% 92%;
  
  /* ===== PRIMARY - THE PRECIOUS GOLD ===== */
  /* Use this SPARINGLY - stars, key CTAs, premium badges only */
  --primary: 38 80% 50%;              /* #D4A44C - rich whiskey gold */
  --primary-foreground: 0 0% 4%;
  
  /* ===== SECONDARY - DARK WARM GRAY ===== */
  --secondary: 30 5% 12%;             /* #1F1D1B - warm dark gray */
  --secondary-foreground: 40 15% 75%;
  
  /* ===== MUTED - FOR TERTIARY INFO ===== */
  --muted: 30 5% 15%;                 /* #272422 */
  --muted-foreground: 35 10% 50%;     /* #8A8078 - muted but readable */
  
  /* ===== ACCENT - SUBTLE WARM HIGHLIGHT ===== */
  --accent: 30 8% 14%;                /* #252220 */
  --accent-foreground: 38 70% 60%;    /* Light gold for accent text */
  
  /* ===== STATUS COLORS ===== */
  --destructive: 0 60% 50%;
  --destructive-foreground: 0 0% 100%;
  --success: 150 50% 40%;
  --success-foreground: 0 0% 100%;
  --warning: 38 90% 55%;
  --warning-foreground: 0 0% 4%;
  
  /* ===== BORDERS - SUBTLE, LINEAR-STYLE ===== */
  --border: 30 5% 15%;                /* Subtle 1px borders like Linear */
  --input: 30 5% 18%;
  --ring: 38 80% 50%;
  
  /* ===== CHARTS - GOLD GRADIENT ===== */
  --chart-1: 38 80% 50%;              /* Primary gold */
  --chart-2: 28 60% 40%;              /* Deep amber */
  --chart-3: 45 70% 55%;              /* Light gold */
  --chart-4: 20 50% 35%;              /* Copper */
  --chart-5: 35 40% 45%;              /* Muted amber */
  
  /* ===== SIDEBAR ===== */
  --sidebar-background: 0 0% 5%;
  --sidebar-foreground: 40 20% 92%;
  --sidebar-primary: 38 80% 50%;
  --sidebar-primary-foreground: 0 0% 4%;
  --sidebar-accent: 30 8% 14%;
  --sidebar-accent-foreground: 38 70% 60%;
  --sidebar-border: 30 5% 12%;
  --sidebar-ring: 38 80% 50%;
}
```

### Light Theme (:root) — Warm Parchment

```css
:root {
  /* Warm cream/parchment backgrounds */
  --background: 40 30% 96%;           /* #F7F4F0 */
  --foreground: 25 30% 12%;           /* #1F1810 - warm near-black */
  
  --card: 40 40% 98%;                 /* #FAF8F5 */
  --card-foreground: 25 30% 12%;
  
  --popover: 40 40% 98%;
  --popover-foreground: 25 30% 12%;
  
  /* Deeper, richer gold for light mode */
  --primary: 32 70% 35%;              /* #96692E - aged gold */
  --primary-foreground: 40 40% 98%;
  
  --secondary: 35 20% 90%;
  --secondary-foreground: 25 25% 20%;
  
  --muted: 38 20% 92%;
  --muted-foreground: 25 15% 40%;
  
  --accent: 38 30% 88%;
  --accent-foreground: 25 30% 15%;
  
  --destructive: 0 70% 50%;
  --destructive-foreground: 0 0% 100%;
  --success: 150 55% 35%;
  --success-foreground: 0 0% 100%;
  --warning: 38 85% 50%;
  --warning-foreground: 25 30% 12%;
  
  --border: 35 20% 85%;
  --input: 35 20% 85%;
  --ring: 32 70% 35%;
  
  --chart-1: 32 70% 35%;
  --chart-2: 22 55% 30%;
  --chart-3: 42 65% 45%;
  --chart-4: 18 45% 40%;
  --chart-5: 30 35% 38%;
  
  --sidebar-background: 38 25% 94%;
  --sidebar-foreground: 25 30% 12%;
  --sidebar-primary: 32 70% 35%;
  --sidebar-primary-foreground: 40 40% 98%;
  --sidebar-accent: 38 30% 88%;
  --sidebar-accent-foreground: 25 30% 15%;
  --sidebar-border: 35 20% 85%;
  --sidebar-ring: 32 70% 35%;
}
```

---

## 2. TYPOGRAPHY — EDITORIAL LUXURY

### Font Stack

**Display Font**: Playfair Display (already added)
- Use for: "WhiskeyPedia" logo, whiskey names in detail view, page titles
- This is your luxury signal - use it confidently at large scale

**Heading Font**: DM Serif Display (already added)
- Use for: Card titles (bottle names), section headers, modal titles

**Body Font**: DM Sans (already added)
- Use for: Everything else - UI, labels, body text, buttons

### Scale Changes — GO BIGGER

| Element | Current | New | Notes |
|---------|---------|-----|-------|
| Logo | text-2xl | text-3xl md:text-4xl | Make it a statement |
| Page titles | text-3xl | text-4xl md:text-5xl | Fill the viewport like Glenfiddich |
| Section headings | text-xl | text-2xl | More presence |
| Card titles | text-lg | text-xl | Whiskey names deserve prominence |
| Body text | text-sm | text-base | More readable |
| Labels/metadata | text-xs | text-sm | Less squinting |

### Typography Classes

```css
/* Hero-scale display text - Glenfiddich inspired */
.text-display-hero {
  font-family: var(--font-display);
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
}

/* Section titles */
.text-display-section {
  font-family: var(--font-display);
  font-size: clamp(1.75rem, 4vw, 2.5rem);
  font-weight: 600;
  line-height: 1.2;
}

/* Whiskey names - elegant serif */
.text-whiskey-name {
  font-family: var(--font-heading);
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.3;
}

/* Small caps labels - The Macallan style */
.text-label-caps {
  font-family: var(--font-sans);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}
```

---

## 3. THE GOLD RULE — SPARING USAGE

Gold (#D4A44C) should appear in ONLY these places:

1. **Star ratings** — filled stars only
2. **Primary CTA buttons** — "Add Whiskey", "Review", "Save"
3. **Logo gradient** — the WhiskeyPedia wordmark
4. **Price display** — money values
5. **Premium badges** — if you add any special bottle designations
6. **Active nav indicator** — the underline on current page
7. **Focus rings** — when elements are focused

**NEVER** use gold for:
- Backgrounds (except tiny badges)
- Large fills
- Multiple elements in close proximity
- Body text
- Icons (except rating stars)

The discipline makes the gold precious.

---

## 4. CARD SYSTEM — LINEAR-INSPIRED DEPTH

### The Layered Approach

Instead of shadows, use **tonal elevation**:

```
Level 0 (page):     #0A0A0A (--background)
Level 1 (cards):    #121212 (--card)
Level 2 (popovers): #171717 (--popover)
Level 3 (dropdowns):#1C1C1C
```

### Card Styling

```css
/* Base card - Linear style */
.card-elevated {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: 12px;
  transition: all 0.2s ease;
}

/* Hover state - subtle glow, not lift */
.card-elevated:hover {
  border-color: hsl(var(--primary) / 0.3);
  background: hsl(0 0% 8%);
}

/* Interactive card with gold accent line */
.card-interactive {
  position: relative;
  overflow: hidden;
}

.card-interactive::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, hsl(var(--primary)), transparent);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.card-interactive:hover::before {
  opacity: 1;
}
```

---

## 5. BOTTLE CARD REDESIGN

### Layout: Editorial Photo Treatment

```jsx
// BottleCard.tsx - new structure

<article className="group relative card-elevated card-interactive p-0 overflow-hidden">
  
  {/* Image container - LARGE, editorial aspect ratio */}
  <div className="relative aspect-[4/5] bg-gradient-to-b from-muted/30 to-background overflow-hidden">
    
    {/* Ambient glow behind bottle - editorial lighting */}
    <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    
    {hasImage ? (
      <img 
        src={imageUrl} 
        alt={name}
        className="absolute inset-0 w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
      />
    ) : (
      /* Elegant placeholder - bottle silhouette */
      <div className="absolute inset-0 flex items-center justify-center">
        <BottleSilhouette className="w-20 h-32 text-muted-foreground/20" />
      </div>
    )}
    
    {/* Type badge - top left, minimal */}
    <span className="absolute top-4 left-4 px-2 py-1 text-label-caps bg-background/80 backdrop-blur-sm rounded">
      {type}
    </span>
    
    {/* Status dot - top right, just a colored dot */}
    <div className={cn(
      "absolute top-4 right-4 w-2.5 h-2.5 rounded-full",
      status === 'Open' && "bg-success",
      status === 'Sealed' && "bg-primary",
      status === 'Finished' && "bg-muted-foreground"
    )} />
  </div>
  
  {/* Content - generous padding */}
  <div className="p-5 space-y-3">
    {/* Whiskey name - serif, prominent */}
    <h3 className="text-whiskey-name text-foreground line-clamp-2">
      {name}
    </h3>
    
    {/* Distillery - muted */}
    <p className="text-sm text-muted-foreground">
      {distillery}
    </p>
    
    {/* Rating and price row */}
    <div className="flex items-center justify-between pt-2 border-t border-border/50">
      {/* Rating - gold stars */}
      <div className="flex items-center gap-1.5">
        <Star className="w-4 h-4 fill-primary text-primary" />
        <span className="text-sm font-medium text-foreground">{rating}</span>
      </div>
      
      {/* Price - gold text */}
      <span className="text-sm font-semibold text-primary">${price}</span>
    </div>
  </div>
  
  {/* Hover actions - slide up from bottom */}
  <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-card via-card to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-300">
    <div className="flex gap-2">
      <Button variant="outline" size="sm" className="flex-1 border-border/50">
        Details
      </Button>
      <Button size="sm" className="flex-1 bg-primary hover:bg-primary/90">
        Review
      </Button>
    </div>
  </div>
</article>
```

### Grid Layout — MORE SPACE

```jsx
// Collection grid - 2-3 columns max, generous gaps
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
  {bottles.map((bottle) => (
    <BottleCard key={bottle.id} bottle={bottle} />
  ))}
</div>
```

---

## 6. PAGE HEADERS — GLENFIDDICH SCALE

```jsx
// PageHeader.tsx - dramatic, confident

<header className="relative py-16 md:py-24">
  {/* Subtle gradient accent */}
  <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent" />
  
  <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    {/* Small caps label - The Macallan style */}
    <p className="text-label-caps text-primary mb-4">
      Your Collection
    </p>
    
    {/* Hero title - massive */}
    <h1 className="text-display-hero text-foreground max-w-3xl">
      {title}
    </h1>
    
    {/* Subtitle - muted, generous spacing */}
    <p className="mt-6 text-lg text-muted-foreground max-w-xl">
      {subtitle}
    </p>
    
    {/* CTA - gold, standalone */}
    {action && (
      <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90 text-primary-foreground">
        <Plus className="w-5 h-5 mr-2" />
        {action.label}
      </Button>
    )}
  </div>
</header>
```

---

## 7. NAVBAR — GLASS + MINIMAL

```jsx
// Navbar.tsx styling

<nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex items-center justify-between h-16">
      
      {/* Logo - gold gradient, display font */}
      <a href="/" className="font-display text-2xl font-bold text-gradient-brand tracking-wide">
        WhiskeyPedia
      </a>
      
      {/* Nav links - minimal, spaced */}
      <div className="hidden md:flex items-center gap-8">
        {navItems.map((item) => (
          <a
            key={item.href}
            href={item.href}
            className={cn(
              "relative text-sm font-medium transition-colors",
              "text-muted-foreground hover:text-foreground",
              isActive && "text-foreground"
            )}
          >
            {item.label}
            {/* Active indicator - gold underline */}
            {isActive && (
              <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </a>
        ))}
      </div>
      
      {/* Right side */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <UserMenu />
      </div>
    </div>
  </div>
</nav>
```

---

## 8. COLLECTION STATS — REFINED

```jsx
// CollectionSummary.tsx

<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  {stats.map((stat) => (
    <div 
      key={stat.label}
      className="card-elevated p-6"
    >
      {/* Label first - The Macallan style hierarchy */}
      <p className="text-label-caps mb-2">
        {stat.label}
      </p>
      
      {/* Value - large, prominent */}
      <p className="text-3xl font-semibold tabular-nums text-foreground">
        {stat.value}
      </p>
      
      {/* Optional trend/context */}
      {stat.context && (
        <p className="text-sm text-muted-foreground mt-1">
          {stat.context}
        </p>
      )}
    </div>
  ))}
</div>
```

---

## 9. EMPTY STATES — BRAND MOMENTS

Like Glenfiddich's age gate - make empty states memorable.

```jsx
// EmptyState.tsx

<div className="flex flex-col items-center justify-center py-24 px-4">
  {/* Dramatic icon with gold glow */}
  <div className="relative mb-8">
    <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
    <div className="relative w-24 h-24 rounded-full bg-card border border-primary/20 flex items-center justify-center">
      <Icon className="w-10 h-10 text-primary" />
    </div>
  </div>
  
  {/* Headline - display font */}
  <h3 className="font-display text-2xl md:text-3xl text-foreground text-center">
    {title}
  </h3>
  
  {/* Description - generous width */}
  <p className="mt-4 text-muted-foreground text-center max-w-md text-lg">
    {description}
  </p>
  
  {/* CTA - gold */}
  <Button size="lg" className="mt-8 bg-primary hover:bg-primary/90">
    {actionLabel}
  </Button>
</div>
```

---

## 10. CSS UTILITIES UPDATE

Replace the previous utilities with these:

```css
/* ===== BRAND GRADIENT - GOLD ===== */

.text-gradient-brand {
  background: linear-gradient(
    135deg,
    hsl(38 80% 50%) 0%,
    hsl(45 85% 60%) 50%,
    hsl(32 75% 45%) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

/* ===== RADIAL GRADIENT FOR BOTTLE GLOW ===== */

.bg-gradient-radial {
  background: radial-gradient(ellipse at center, var(--tw-gradient-stops));
}

/* ===== GLASS EFFECT ===== */

.glass-dark {
  background: hsl(var(--background) / 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

/* ===== GOLD GLOW - USE SPARINGLY ===== */

.glow-gold {
  box-shadow: 0 0 40px hsl(38 80% 50% / 0.15);
}

.glow-gold-sm {
  box-shadow: 0 0 20px hsl(38 80% 50% / 0.1);
}

/* ===== ANIMATIONS ===== */

@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-up {
  animation: fade-up 0.5s ease-out forwards;
}

/* Stagger - longer delays for more drama */
.stagger-children > * {
  opacity: 0;
  animation: fade-up 0.5s ease-out forwards;
}

.stagger-children > *:nth-child(1) { animation-delay: 0ms; }
.stagger-children > *:nth-child(2) { animation-delay: 75ms; }
.stagger-children > *:nth-child(3) { animation-delay: 150ms; }
.stagger-children > *:nth-child(4) { animation-delay: 225ms; }
.stagger-children > *:nth-child(5) { animation-delay: 300ms; }
.stagger-children > *:nth-child(6) { animation-delay: 375ms; }

/* Bottle hover - subtle scale */
@keyframes bottle-hover {
  from { transform: scale(1); }
  to { transform: scale(1.03); }
}

/* ===== SCROLLBAR - NEAR INVISIBLE ===== */

::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: hsl(var(--border));
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.5);
}

/* ===== FOCUS RING ===== */

.focus-ring:focus-visible {
  outline: none;
  box-shadow: 
    0 0 0 2px hsl(var(--background)),
    0 0 0 4px hsl(var(--primary));
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

## 11. IMPLEMENTATION CHECKLIST

### Phase 1: Foundation (MUST DO FIRST)
- [ ] Update globals.css with new color tokens (copy Section 2 exactly)
- [ ] Add new typography classes (Section 2 - typography classes)
- [ ] Update/add CSS utilities (Section 10)
- [ ] Commit: `style: implement black & gold color system`

### Phase 2: Navbar & Headers
- [ ] Update Navbar with glass effect and minimal styling
- [ ] Update PageHeader with dramatic scale
- [ ] Increase logo size and apply gradient
- [ ] Commit: `style: update navigation and headers`

### Phase 3: Cards
- [ ] Redesign BottleCard with editorial treatment
- [ ] Update grid to 3-column max with larger gaps
- [ ] Add hover states with gold accent line
- [ ] Commit: `style: redesign bottle cards`

### Phase 4: Stats & Empty States
- [ ] Update CollectionSummary with refined layout
- [ ] Update all empty states with gold glow treatment
- [ ] Commit: `style: refine stats and empty states`

### Phase 5: Polish
- [ ] Review all modals/dialogs for consistency
- [ ] Verify gold is used sparingly (check THE GOLD RULE)
- [ ] Test both light and dark themes
- [ ] Commit: `style: final polish pass`

---

## KEY DIFFERENCES FROM V1

| Aspect | V1 | V2 |
|--------|-----|-----|
| Background | hsl(15 20% 6%) warm brown | hsl(0 0% 4%) near-black |
| Gold usage | Throughout amber accents | Sparse, precious |
| Card borders | Warm shadows | 1px subtle borders (Linear) |
| Typography scale | Conservative | Dramatically larger |
| Whitespace | Standard | Generous (2x) |
| Card grid | 4 columns | 3 columns max |
| Overall feel | Warm whiskey bar | Luxury magazine |

---

## INSPIRATION SUMMARY

- **Glenfiddich**: Black + gold palette, dramatic typography scale
- **Linear**: Card depth through tones not shadows, monochrome discipline
- **The Macallan**: Small-caps labels, editorial photography, massive whitespace
- **The Dalmore**: Warm cream accents on dark, lifestyle feeling

The result should feel like opening a premium whiskey magazine, not using a database.
