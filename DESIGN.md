# DESIGN.md — MyWhiskeyPedia Design System

> **Single source of truth for all visual decisions.** Read this before any UI/frontend work.
> DESIGN.md wins over agent judgment, Stitch output, and developer preference.
> Update deliberately through UI/UX Agent, not by accepting drift.
>
> **Status:** Active | **Version:** 2.0 — March 2026

---

## Brand Identity

**Personality:** Premium, warm, knowledgeable. Like a dimly-lit whiskey bar with leather seats and a bartender who knows your name. Not flashy, not minimal — *restrained luxury.*

**Inspirations:** Glenfiddich packaging, The Macallan brand, Linear app UI depth.

---

## Design Principles

1. **Restraint is luxury.** The premium feel comes from what you leave out, not what you add. White space is not wasted space.
2. **Gold is precious.** Every gold element must earn its place. When everything is gold, nothing is.
3. **Warmth over sterility.** This is a whiskey app, not a fintech dashboard. Serif headings, warm tones, tonal depth.
4. **The bartender, not the bouncer.** Features should feel available, not imposed. Suggestions over commands. Quiet presence over loud prompts.
5. **Mobile is the product.** Desktop is a courtesy. Every design decision starts at 375px.

---

## Color System

### Dark Mode — Primary (The Real App)

All colors defined as HSL custom properties in `client/src/index.css`.

| Token | HSL | Approx Hex | Role |
|-------|-----|-----------|------|
| `--background` | `0 0% 4%` | `#0A0A0A` | Page background — deepest black |
| `--foreground` | `40 20% 92%` | `#EDE9E3` | Primary text — warm cream white |
| `--card` | `0 0% 7%` | `#121212` | Card surfaces — elevated layer |
| `--popover` | `0 0% 9%` | `#171717` | Modals, dropdowns — highest elevation |
| `--primary` | `38 80% 50%` | `#D4A44C` | **The Gold** — see Gold Rules below |
| `--primary-foreground` | `0 0% 4%` | `#0A0A0A` | Text on gold backgrounds |
| `--secondary` | `30 5% 12%` | `#1F1D1B` | Secondary surfaces |
| `--muted` | `30 5% 15%` | `#272422` | Tertiary surfaces |
| `--muted-foreground` | `35 10% 50%` | `#8A8078` | Secondary text, timestamps |
| `--accent` | `30 8% 14%` | `#252220` | Hover/active surface tint |
| `--accent-foreground` | `38 70% 60%` | — | Text on accent surfaces |
| `--border` | `30 5% 15%` | — | Subtle dividers, Linear-style |
| `--input` | `30 5% 18%` | — | Form input borders |
| `--ring` | `38 80% 50%` | `#D4A44C` | Focus rings (matches gold) |
| `--destructive` | `0 60% 50%` | — | Errors, delete actions |
| `--success` | `150 50% 40%` | — | Confirmations |
| `--warning` | `38 90% 55%` | — | Warnings (gold-adjacent) |

### Light Mode (Warm Parchment)

| Token | HSL | Role |
|-------|-----|------|
| `--background` | `40 30% 96%` | Warm cream page |
| `--foreground` | `25 30% 12%` | Near-black text |
| `--card` | `40 40% 98%` | White card surfaces |
| `--primary` | `32 70% 35%` | Deeper gold for contrast on light |
| `--border` | `35 20% 85%` | Subtle warm borders |

### Extended Palette

**Amber scale** (`amber-50` through `amber-950`) — whiskey-specific UI: tasting wheels, flavor maps, chart accents.

**Copper scale** (`copper-50` through `copper-900`) — secondary warmth for data visualization.

**Chart colors** (`--chart-1` through `--chart-5`) — five warm-palette tokens cycling gold, copper, amber, bronze.

All values defined in `tailwind.config.ts`.

---

## The Gold Rule — Cardinal Design Law

> **Gold is precious. Overuse dilutes the premium feel. Treat it like actual gold — the less you use, the more it's worth.**

### ALLOWED Gold Usage (`--primary` / `#D4A44C`)

- Star ratings and score displays
- Primary CTA buttons (one per screen maximum)
- Prices and premium indicators
- The logo and brand mark
- Active navigation indicators (bottom tab active icon + label)
- The center FAB button background + glow
- Focus rings on interactive elements
- `.text-gradient-brand` for hero moments only
- Subtle border accents at `opacity: 0.1–0.3`

### FORBIDDEN Gold Usage

- Body text or headings (use `--foreground`)
- Backgrounds larger than a button or badge (exception: FAB)
- Multiple gold CTAs competing on the same screen
- Decorative borders on every card (use `--border` instead)
- Section headers or nav labels in default/inactive state
- Loading spinners or skeleton states (use `--muted` tones)
- Icons that aren't ratings, active nav, or logo elements

### Gold Opacity Scale

| Opacity | Use Case |
|---------|----------|
| `0.08–0.10` | Ambient glow outer edge, card hover border tint |
| `0.15–0.20` | Whiskey fill in Glencairn glass, selected card accent |
| `0.30` | Hover border glow, `.card-interactive` top line |
| `0.35–0.50` | FAB shadow, Rick atmosphere glow |
| `1.0` | Stars, CTA fills, active nav indicators only |

### The Test

If you remove a gold element and nothing feels lost, it shouldn't have been gold. Gold marks things that *matter*.

---

## Typography

### Font Stack

| Token | Family | Fallback | Role |
|-------|--------|----------|------|
| `font-display` | Playfair Display | Georgia, serif | Logo, hero text, brand moments |
| `font-heading` | DM Serif Display | Georgia, serif | Whiskey names, section titles |
| `font-sans` | DM Sans | system-ui, sans-serif | All body text, labels, UI |

Defined in `tailwind.config.ts` as `fontFamily` extensions and in `index.css` as CSS variables (`--font-display`, `--font-heading`, `--font-body`).

### Type Scale

| Class | Size | Weight | Use |
|-------|------|--------|-----|
| `.text-display-hero` | `clamp(2.5rem, 8vw, 5rem)` | 600 | Splash/hero screens only |
| `.text-display-section` | `clamp(1.75rem, 4vw, 2.5rem)` | 600 | Section headers |
| `.text-whiskey-name` | `1.25rem` | 400 | Bottle names in cards/detail |
| `.text-label-caps` | `0.75rem` / tracking `0.1em` | 500, uppercase | Category labels, section markers |
| `h1` | `text-4xl` → `md:text-5xl` | semibold | Page titles |
| `h2` | `text-2xl` → `md:text-3xl` | semibold | Section titles |
| `h3` | `text-xl` → `md:text-2xl` | semibold | Subsection titles |
| `h4` | `text-lg` → `md:text-xl` | semibold | Card headers |

### Typography Rules

- All headings: `tracking-tight` — modern, premium feel
- Playfair Display is **reserved** for branding/hero moments. Never for body or UI labels.
- DM Serif Display for whiskey names — it has the right gravitas.
- DM Sans everywhere else — clean, legible, modern.
- Minimum font size: `12px` (`text-xs`) — enforced post-AUDIT-004 for WCAG AA.

---

## Spacing & Layout

### Base

`--radius: 0.625rem` (10px) — foundation for the radius scale:
- `rounded-lg`: 10px
- `rounded-md`: 8px
- `rounded-sm`: 6px
- Cards: `rounded-xl` (12px) — standard for all card components
- FAB/avatars: `rounded-full`

### Spacing Patterns (from codebase)

| Context | Value |
|---------|-------|
| Page horizontal padding | `px-5` (20px) mobile |
| Card internal padding | `p-4` (16px) |
| Between cards in a list | `space-y-3` (12px) |
| Section vertical spacing | `pt-12 pb-10` (atmosphere), `mt-8` (zone gaps) |
| Bottom nav clearance | `pb-28` (112px) — clears 84px nav + breathing room |
| Tiny screen (≤375px) | `px-3`, gap-4 → 0.75rem, gap-6 → 1rem |

### Container

- Mobile: full-width with `px-5` (content), `px-4` (container default)
- No max-width on mobile — content fills viewport
- `overflow-x: hidden` on html + body

---

## Elevation & Depth

Depth is created through **background lightness**, not shadows (Linear-inspired).

| Layer | Background | Token |
|-------|-----------|-------|
| 0 — Canvas | `#0A0A0A` (4%) | `--background` |
| 1 — Card | `#121212` (7%) | `--card` |
| 2 — Popover | `#171717` (9%) | `--popover` |
| 3 — Glass | `card/80 + backdrop-blur` | `.glass-dark`, `.glass-warm` |

### Shadow System

Warm-tinted shadows defined in `tailwind.config.ts`:

| Class | Use |
|-------|-----|
| `shadow-warm-sm` | Cards at rest |
| `shadow-warm` / `shadow-warm-md` | Elevated cards, hover |
| `shadow-warm-lg` / `shadow-warm-xl` | Modals, hero elements |
| `glow-gold-sm` | `0 0 20px gold/0.1` — subtle ambient |
| `glow-gold` | `0 0 40px gold/0.15` — Rick House elements |
| `glow-amber` | Combined 20px + 40px primary glow |

---

## Borders

| Pattern | Usage |
|---------|-------|
| `border-border` | Default dividers — barely visible |
| `border-border/50` | Card borders — cards float, not boxed |
| `border-primary/30` | Hover gold tint on cards |
| `border-l-[3px] border-l-amber-500/60` | Left accent — completed journal entries |
| `.divider` | `h-px` gradient: transparent → border → transparent |

---

## Card System

### Classes (defined in `index.css`)

```
.card-elevated       — bg-card + 1px border + 12px radius
                       hover: gold border tint + bg-accent
.card-interactive     — adds gold gradient line at top on hover (::before)
.card-hover          — translateY(-1px) on hover, 300ms ease
```

### Standard Card Recipe

```
bg-card border border-border/50 rounded-xl p-4
hover:border-primary/30 hover:shadow-warm-sm
active:scale-[0.98]
transition-all duration-200
```

### Glass Effects

```
.glass-dark    — bg-background/80 + blur(20px)
.glass-warm    — bg-card/80 + blur(12px) + border
.glass         — bg-card/80 + blur(md) + border/50
```

---

## Components

### Buttons

| Type | Recipe |
|------|--------|
| `.btn-primary` | `bg-primary text-primary-foreground hover:bg-primary/90` |
| `.btn-ghost` | Transparent, `hover:bg-accent hover:text-accent-foreground` |
| Destructive | `bg-destructive text-white` |
| Touch target | `min-h-[44px] min-w-[44px]` on mobile (≤640px, enforced globally) |

### Form Inputs

- Border: `border-input`
- Focus: `.input-focus` → `ring-2 ring-primary/30 border-primary`
- Background: `bg-card`

### Star Ratings

Stars use `--primary` (gold) filled, `--muted` for empty. This is a **permitted** gold usage. 16px inline, 20px detail views.

### Badges / Tags

- Default: `bg-accent text-muted-foreground text-xs px-2 py-1 rounded-md`
- Premium: `bg-primary/10 text-primary border border-primary/20`

### Modals

- `bg-card border-border`, max-height `85vh`, scrollable content `70vh`
- Width: responsive (AUDIT-004 fix applied)

### Scrollbars

- 6px width, transparent track, `--border` color thumb
- `.scrollbar-hide` utility available

---

## Navigation

### Bottom Tab Bar (Mobile)

5-tab layout with center FAB:

```
[ Home ]  [ Search ]  [ ★ FAB ★ ]  [ Drops ]  [ Profile ]
```

- **Bar:** `fixed bottom-0`, `minHeight: 84px`, gradient fade `linear-gradient(to top, background 70%, transparent)`
- **Tab icons:** 24px (`w-6 h-6`), outlined (Lucide React), `text-foreground` at `opacity: 0.4` inactive, full opacity + `text-primary` active
- **Tab labels:** `0.6rem`, `tracking-[0.02em]`, `font-medium`
- **Touch targets:** `minHeight: 44px, minWidth: 44px, padding: 4px 8px`
- **Center FAB:** `58×58px`, `rounded-full`, `bg-primary`, elevated `-22px` above nav line
- **FAB glow:** `.rick-fab` — 3s ambient gold shadow pulse (see Rick House section)
- **FAB press:** `scale(0.93)` on `:active`
- **Notification badge:** 16px gold circle on Drops icon, `0.55rem` font

### Header

- `MobilePageHeader` on mobile, full `Header` on desktop
- Transparent or `bg-background` — no heavy chrome
- Page title in `font-heading`

---

## Breakpoints

**Mobile-first.** Design for 375px, scale up.

| Breakpoint | Width | Usage |
|------------|-------|-------|
| Default | 375px+ | Mobile — single column, bottom nav, full-width cards |
| `md:` | 768px | Tablet — desktop header replaces bottom nav |
| `lg:` | 1024px | Desktop |

### Tiny Screen (≤375px)

- Base font: `14px` (down from 16px)
- Container: `px-3`
- Gaps compressed: `gap-4` → `0.75rem`, `gap-6` → `1rem`
- `.hide-on-tiny` utility

### Safe Areas

- `.safe-area-top` / `.safe-area-bottom` for notched devices
- Body: `padding-bottom: env(safe-area-inset-bottom)` on mobile

---

## Brand Mark — Glencairn-on-Book Logo

### The SVG

A **Glencairn tasting glass sitting on an open book**, enclosed in a circle. Component: `client/src/components/Logo.tsx`.

| Size | Pixels | Stroke | Use |
|------|--------|--------|-----|
| `full` | 280px | 2–2.5px | Splash, auth page |
| `nav` | 30px | 3–4px | Header navbar |
| `small` | 32px | 5–6px | Compact contexts |
| `favicon` | 20px | 7–9px | Browser tab |

### Construction

- **ViewBox:** `0 0 200 200`
- **Circle:** gold stroke border
- **Book:** Two open pages with gold fill at `0.06–0.18` opacity. Faint text lines at `0.2` opacity.
- **Glencairn glass:** Tulip bowl, stem, elliptical base. Whiskey fill at `0.16` opacity. Glass body fills `#0A0A0A` to mask the book behind it.
- **Scaling:** As size decreases, stroke width increases for legibility. Fine details removed in smaller variants.

### Usage Rules

1. **Always gold on dark.** `#D4A44C` strokes on `#0A0A0A`. Never invert.
2. **No recoloring.** The gold is the brand color — don't tint, gradient, or swap.
3. **Clear space.** Minimum 1/4 logo diameter as padding on all sides.
4. **Don't animate the logo itself.** Ambient glow behind it is acceptable (Rick House atmosphere).
5. **Glencairn silhouette** (without book) is the only approved standalone extraction — used in bottom nav FAB and Rick House atmosphere.

---

## Rick House Design Language

Rick House has its own sub-design language — warmer, more atmospheric, and slightly more permissive with gold than the rest of the app.

### Atmosphere Glow

`.rick-atmosphere-glow` — 360px radial gradient, 8s breathing animation:

```css
radial-gradient(
  ellipse at center,
  rgba(212, 164, 76, 0.18) 0%,
  rgba(212, 164, 76, 0.08) 35%,
  rgba(212, 164, 76, 0.02) 60%,
  transparent 80%
)
animation: rick-atmosphere 8s ease-in-out infinite;
```

### FAB Glow

`.rick-fab` — 3s ambient shadow pulse between `0.35` and `0.5` opacity gold shadow, with a 6px expanding ring at `0.08` opacity.

```css
@keyframes rick-glow {
  0%, 100% { box-shadow: 0 4px 20px rgba(212,164,76,0.35), 0 0 0 0 rgba(212,164,76,0); }
  50%      { box-shadow: 0 4px 24px rgba(212,164,76,0.5), 0 0 0 6px rgba(212,164,76,0.08); }
}
```

### Completion Animations

- `.rick-check-enter` — bouncy scale(0 → 1.15 → 1) with spring easing
- `.rick-fade-up` — staggered content entrance (delays: 0.3s, 0.5s, 0.7s, 0.9s)

### Voice & Tone

Rick's UI copy is **calm, knowledgeable, never pushy:**
- Greetings rotate by time of day, session history, user name
- Suggestion prompts are conversational, not commanding
- CTA text: "Taste with Rick" — not "START SESSION"
- Empty states are inviting: "Your first guided tasting awaits"

---

## Motion & Animation

### Timing

| Duration | Use |
|----------|-----|
| `150–200ms` | Micro-interactions: button press, opacity, color |
| `300ms` | Card hover lift, state transitions |
| `400–500ms` | Content entrance (fade-up), stagger children |
| `3s` | Rick FAB ambient pulse |
| `8s` | Rick atmosphere breathing |

### Keyframes (defined in `tailwind.config.ts` + `index.css`)

| Name | Description |
|------|-------------|
| `fade-in` / `fade-out` | Opacity 0 ↔ 1 |
| `fade-up` | translateY(16px) + opacity → visible |
| `slide-in-from-top/bottom` | 10px slide + fade |
| `shimmer` | Skeleton loading (200% bg sweep) |
| `rick-glow` | FAB gold shadow pulse (3s) |
| `rick-atmosphere` | Radial gradient breathe (8s) |
| `rick-check-in` | Bouncy completion checkmark |
| `rick-fade-up` | Staggered session detail lines |
| `slide-left/right` | Swipe/carousel transitions |
| `accordion-down/up` | Radix accordion content |

### Stagger Pattern

`.stagger-children > *` — children fade-up with 75ms delay increments (up to 6).

### Reduced Motion

All animations → `0.01ms` duration for `prefers-reduced-motion: reduce`.

---

## Iconography

- **Library:** Lucide React
- **Style:** Outlined / stroke, consistent weight
- **Default size:** 20px inline, 24px navigation, 28–32px FAB interior
- **Color:** `text-muted-foreground` default, `text-foreground` emphasized, `text-primary` active (gold — permitted)

---

## Image Treatment

- **Bottle images:** Dark backgrounds, `object-cover` in thumbnails, `object-contain` in detail
- **Thumbnails:** `rounded-lg`, `w-11 h-11` in lists (with `bg-accent/30` fallback)
- **Hero images:** Full-bleed with gradient overlay
- **No-image placeholder:** `Wine` icon (Lucide) at `text-muted-foreground/40`

---

## Accessibility

- **Focus:** `ring-2 ring-ring ring-offset-2 ring-offset-background` on `:focus-visible`
- **Touch targets:** 44×44px minimum on mobile (enforced globally ≤640px)
- **Text minimum:** 12px (`text-xs`) — WCAG AA
- **Contrast (dark mode):**
  - `#EDE9E3` on `#0A0A0A` → ~14:1 (passes AAA)
  - `#D4A44C` on `#0A0A0A` → ~6.5:1 (passes AA)
  - `#8A8078` on `#0A0A0A` → ~4.8:1 (passes AA body)
- **Selection:** `bg-primary/20 text-foreground`
- **Reduced motion:** Respected globally

---

## Gradient Recipes

| Name | CSS | Use |
|------|-----|-----|
| Brand gold text | `linear-gradient(135deg, gold 0%, light-gold 50%, deep-gold 100%)` | `.text-gradient-brand` |
| Radial bottle glow | `radial-gradient(ellipse at center, ...)` | `.bg-gradient-radial` |
| Nav fade | `linear-gradient(to top, background 70%, transparent)` | Bottom nav bg |
| Section divider | `transparent → border → transparent` | `.divider` |
| Card interactive line | `linear-gradient(90deg, transparent, gold, transparent)` | `.card-interactive::before` |
| Rick atmosphere | Radial gold gradient, 4-stop fade | `.rick-atmosphere-glow` |

---

## File Sources

| What | Where |
|------|-------|
| CSS custom properties | `client/src/index.css` |
| Tailwind config | `tailwind.config.ts` |
| Logo SVG | `client/src/components/Logo.tsx` |
| Bottom nav | `client/src/components/BottomNav.tsx` |
| Rick House animations | `client/src/index.css` (lines 434–498) |
| Rick House components | `client/src/components/rick/` |
| Rick suggestions logic | `client/src/lib/rick-suggestions.ts` |

---

*Version: 2.0 — March 2026*
*Supersedes: DESIGN_SYSTEM.md, DESIGN_SYSTEM_V2.md (legacy — can be deleted)*
