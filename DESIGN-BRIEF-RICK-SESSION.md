# Design Brief — Rick Session Surface Redesign (RICK-UX Batch)

> Input for one focused Claude Design (Figma) session. Source: [RICK-UX] live review 2026-07-22 (TASKS.md).
> Batch: RICK-UX-02, -03, -04, -07, -08, -09, -10. Everything else is out of scope here.
> Status: TRIAGED 2026-07-22 — Storm answered all §7 questions (decisions inlined below, logged as D-013). Ready for the Claude Design session. Nothing in this brief authorizes code changes.

---

## 1. The design problem in one paragraph

The guided tasting flow ("Taste with Rick") nails the room but not the conversation or the seams. Rick talks *at* the user with no way to talk back (02); finishing a tasting hands the user to a 7-step granular form that speaks a different product language (03); the session borrows the user's old review score as if it were its own output (04); and the session screen drifts visually from the room it lives in — warm gradient band, decorative gold, sub-legible stepper (07/09) — while the completion moment half-promises a share that doesn't exist (10). The Figma session's job: make the session surface feel like the same room, give depth a designed doorway, and make every score on screen mean something.

## 2. Verified architecture (code-checked 2026-07-22, not assumed)

Three overlapping structured flows exist. The redesign must make them read as one product:

| Flow | Component | Structure | Scoring | Where it lives |
|---|---|---|---|---|
| Guided tasting (reviewed live) | `TastingSession.tsx` | 5 phases: Visual → Nose → Palate → Finish → Rick's Take | none | Rick House room |
| Rick-guided review | `RickReviewSession.tsx` | Phase stepper w/ scoring gates ("Score Required"), pill stepper, Glencairn loading | 6-component | Review flow (`ReviewModal` mode `'rick'`) |
| Regular review composer | `modals/ReviewModal.tsx` | **7 steps** (Visual, Nose, Mouthfeel, Taste, Finish, Value, Summary), 20-chip color matrix | 6-component + summary | New AND edit — one component, `existingReview` optional |
| Review display | `ReviewDetailPage.tsx` | Editorial masthead, circular score (d1ab120 "premium uplift") | display only | `/whiskey/:id/review/:reviewId` |

**RICK-UX-03 caveat RESOLVED:** the 7-step modal is the composer for *both* new and edit reviews — there is no 3-step prose-first composer anywhere in the codebase. The "rework" (commit `d1ab120`) modernized `ReviewDetailPage` (display) and `RickReviewSession`, not the composer. The finding applies to every composer entry point, including the tasting completion's "Write Review" bridge.

## 3. Locked constraints (not up for redesign)

From DESIGN.md v2.0, D-001, D-011, D-012, CONTEXT_PROJECT key constraints:

- **Black & Gold V2.** App bg `#0A0A0A`; Rick House room darker (`#050505`). Gold `#D4A44C` is EARNED only: stars, primary CTAs, prices, active nav/states. No decorative gold. No warm gradients (BETA-002 precedent).
- **Type:** Playfair Display (branding/display), DM Serif Display (headings), DM Sans (body). 12px floor (AUDIT-004).
- **Rick House room language:** 3-zone architecture (Atmosphere / Shelf / Journal — D-012), chrome unmounted not restyled, "Step out" as the only exit, in-world voice ("Pull up a chair", "Opening the cellar…"). Keep all of it — it passed review.
- **No emoji anywhere in the flow.** (Currently clean — keep it that way.)
- **6-component weighted scoring system is CORE IP** — untouchable. Redesign may re-*present* scores, never restructure them.
- **Mobile-first, 375px reference viewport.** Desktop secondary.

## 4. Current-state evidence

15 screenshots from the 2026-07-22 live pass (375×812, production, signed in) in session scratchpad — key frames: `review-06` (session screen: gradient band, stepper, phase card, audio player), `review-11` (completion), `review-12` (room post-session + journal), `review-15` (7-step composer). Re-shoot via Playwright junction setup if scratchpad has been purged (see lessons/tooling.md).

## 5. Per-finding design intent

### RICK-UX-02 (HIGH) — Design the doorway to depth
**Now:** Zero input affordance in all 5 phases. Mic icons promise voice that doesn't exist.
**Intent:** A per-phase "talk back" affordance that preserves non-intrusiveness — Rick never demands input, but the door is always visible. Explore: 2–3 contextual prompt chips per phase ("What am I smelling if it's sharper than caramel?", "Compare it to the Weller") + a free-form ask (text first; voice later behind the existing ElevenLabs stack). Depth must be *optional and bounded* — the user can ignore it entirely and the flow is unchanged.
**Acceptance:** Every phase offers at least one visible way to ask Rick something; ignoring it costs zero taps; mic iconography only appears where voice input actually exists.
**Non-goal:** Free-roaming chat UI. This is a guided tasting with depth on demand, not a chatbot.
**DECIDED (Storm, 2026-07-22):** Text-first; voice input is next phase. Mock text-input depth only; remove mic iconography from surfaces until voice actually ships (no promised-but-absent affordances).

### RICK-UX-03 (HIGH) — One review language at the seam
**Now:** Completion → "Write Review" → 7-step granular modal ("Visual 1/7", 20 color chips). Verified: same modal for new reviews.
**Intent:** Design the *bridge*, not a composer rebuild (composer scope is its own future project): a post-tasting review entry that pre-seeds from the session (Rick's phase notes as editable prose scaffolding, per CORE-IP scoring preserved) and visually belongs to the completion screen's language. The session already produced Visual/Nose/Palate/Finish prose — the user should refine, not restart.
**Acceptance:** From completion, the user reaches a review surface that references what the tasting just produced; no cold-start into step 1-of-7; typography/spacing continuous with the completion card.
**Non-goal:** Redesigning the full ReviewModal for non-tasting entry points (flag as follow-on if the Figma session produces a pattern worth generalizing).
**DECIDED (Storm, 2026-07-22):** Bridge-only confirmed. Composer rework stays out of this batch.

### RICK-UX-04 (MED) — Score provenance
**Now:** Completion card, journal rows, and shelf all show the old review's 4.3 stars as if the session produced it.
**Intent:** Define what a session outputs and mark provenance. Sessions output *Rick's take + the user's notes*, never a star score of their own; anywhere a review score appears near session content it is labeled as such ("Your review · Feb 2026") in quiet metadata type. Stars remain gold (earned) but only on actual reviews.
**DECIDED (Storm, 2026-07-22):** Sessions DO prompt a re-score at completion — design the "Palates evolve — update your 4.3?" moment as part of the completion screen (natural pairing with the -03 bridge: re-score feeds the pre-seeded review). Prompt is skippable; skipping leaves the review untouched.
**Acceptance:** A viewer can tell, on every surface, whether a number came from their review or from a tasting session; no unlabeled scores on session artifacts; completion offers a clearly optional re-score path.

### RICK-UX-07 (MED) — Session screen rejoins the room
**Now:** Saturated warm-brown gradient header band; decorative gold (header mic glyph, italic gold stage directions, gold text links, gold journal book icons).
**Intent:** Header band returns to room-black with tonal depth (elevation via lightness steps, not hue); one gold accent per screen doing real work (active step OR primary CTA). Stage-direction microcopy stays — it's good — but in off-white italic, not gold.
**Acceptance:** No gradient with hue shift; gold instances on the session screen enumerable on one hand and all functional per the Gold Rule allowed-list.

### RICK-UX-08 (LOW-MED) — Mode sheet state model
**Now:** Neither mode preselected, Start Tasting disabled unexplained, hover == selected (gold border both).
**Intent:** "Guide Me" preselected (first-time default; remember last choice after), selected state distinct from hover (fill/weight vs border), CTA enabled from open.
**Acceptance:** Sheet is one-tap startable; selected state unambiguous at a glance in a static screenshot.

### RICK-UX-09 (LOW) — Stepper legibility
**Now:** 5-dot stepper with ~10px low-contrast caps labels; tight at 375px.
**Intent:** Either enforce the 12px floor with contrast-passing inactive states, or simplify to "2 of 5 · Nose" current-phase text with a minimal progress element. Must survive the darker band from -07.
**Acceptance:** WCAG AA at 375px; phase position readable without zooming.

### RICK-UX-10 (LOW) — Completion moment honesty
**Now:** Rick quote duplicated (hero + card); card styled shareable (wordmark, date) but no share action.
**Intent:** Quote appears once (recommend: in-card only, hero shows the check + a short line). Card identity: shareable.
**DECIDED (Storm, 2026-07-22):** Shareable confirmed — add the share action (share-as-image infra exists: `ReviewShare.tsx`); wordmark/date framing stays and now earns its keep.
**Acceptance:** No repeated copy on one screen; card has a working share action; every affordance the card's styling implies actually exists.

## 6. Out of scope for the Figma session

- **RICK-UX-01** (journal replay duplicates session) and **RICK-UX-06** (stale shelf suggestion) — Developer logic fixes; no design dependency. Note: journal *detail view* design (what tapping an entry should show — the session record) may fall out of -04's provenance work; if so, hand Developer the pattern.
- **RICK-UX-05** (TTS auto-play default) — Storm product call; the mode sheet from -08 is the natural home for the voice on/off choice if approved.
- **RICK-UX-11** ("Select a bottle…" dropdown) — parked until collection size makes it real.
- Full ReviewModal composer redesign; anything touching the 6-component scoring math; desktop Rick House immersion (BETA-003 watch item).

## 7. Triage decisions (Storm, 2026-07-22 — logged as D-013)

1. RICK-UX-03: **Bridge-only.** Composer rework excluded from batch.
2. RICK-UX-04: **Prompt.** Completion offers a skippable re-score moment; feeds the -03 bridge's pre-seeded review.
3. RICK-UX-10: **Shareable.** Completion card gets a real share action.
4. RICK-UX-02 voice: **Next phase.** Design text-first depth; strip mic iconography until voice ships.
