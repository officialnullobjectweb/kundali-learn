# Kundali Learn — Architecture

Single-page interactive Vedic astrology learning + chart-analysis app.
Deterministic calculation only. The LLM (if ever attached) may rephrase
interpretation text — it must never compute positions, yogas, or scores.

## Dataflow (one direction, memoised per node)

```
UI (SVG chart, editors, topic tabs, Why? panel)
  -> Zustand store (birth frozen | explore draft, view, topic, hover)
  -> Astronomy Engine (ISO date + lat/lon -> sidereal longitudes, Lahiri)
  -> Chart Engine (longitudes + view -> planets, houses, dignities)
  -> Planet / Aspect / Yoga / Varga engines (parallel, pure)
  -> Dasha Engine (Moon nakshatra -> Vimshottari sequence)
  -> Transit Engine (explicit dateISO -> natal overlays)
  -> Evidence Engine (ONLY bridge to claims: every claim = Evidence record)
  -> Scoring Engine (evidence -> 0-100 per topic)
  -> Interpretation Engine (templates evidence -> simple language + Why? refs)
```

Recalculation is free: every user gesture (drag planet/rashi, degree edit,
view switch) writes one longitude to the store; selectors re-run the pure
pipeline synchronously. No debouncing, no API calls.

## Module map

| Path | Contains | Must NOT contain |
|---|---|---|
| `src/domain/types.ts` | canonical types | logic, React |
| `src/domain/constants.ts` | classical tables (lords, exaltation, aspects, dasha years) | derived values (e.g. debilitation rashi is derived, not tabled) |
| `src/domain/engines.ts` | engine function-type contracts | implementations (one file per engine under `src/domain/<name>-engine.ts` when implemented) |
| `src/state/chart-store.ts` | state + actions + `selectActiveChart` | astrology math |
| `src/components/*` | rendering + dispatch only | dignity/aspect/yoga/score math |
| `src/components/chart/*` | SVG kundali, dnd-kit drag, hover cards | — |
| `src/components/panels/*` | topic tabs, interpretation list, Why? evidence drawer, degree editor | claim strings not backed by `Evidence.id` |

## View model

- `Varga`: `D1` (birth) | `D9` (navamsha) | `D10` (dashamsha). Pure function of D1 longitude.
- `LagnaMode`: `Janma` (house 1 = ascendant) | `Chandra` (house 1 = Moon rashi). A view
  rebase, not a new chart — computed in Chart Engine, never stored.
- Combined `ChartView = { varga, lagna }` gives the D1 / Chandra / D9 / D10 switcher.

## What-if (Explore) rule

1. `birth` is written once by `loadBirth` and never mutated.
2. `enterExplore()` deep-copies `birth` -> `draft`; all edits hit `draft`.
3. `exitExplore(keep=false)` discards `draft`; `keep=true` keeps it as a named
   comparison but never overwrites `birth`.
4. Selectors read `selectActiveChart`, so birth vs explore is a one-line switch.

## Evidence rule (Why? panel)

- Every interpretation line carries `evidenceIds: string[]`.
- Every `Evidence` carries `ruleId`, exact `inputs`, and `strength -1…+1`.
- If a claim cannot point at an `Evidence.id`, it cannot ship. No exceptions.

## UI stack (declared in package.json, install on user approval)

Next.js 14 + TypeScript + Tailwind + shadcn/ui + Framer Motion + Zustand +
dnd-kit + SVG chart. No chart images; the kundali is SVG so houses are
droppable/draggable/hoverable nodes. shadcn/ui to be added via `shadcn init`
when UI work starts — no duplicate hand-rolled button/card/dialog components.

## Build order (later steps, not this step)

1. `src/domain/*-engine.ts` implementations + unit tests (pure, no UI).
2. Zustand store implementation + `selectActiveChart` memoised pipeline.
3. SVG kundali + dnd-kit drag + hover glossary.
4. Topic tabs + interpretation + Why? drawer + Explore fork UI.

## Profiles, AI layer & MCP (shipped)

- Native profiles are CONTAINERS: one profile holds many NATIVES (people),
  each with name, gender, birth inputs + computed chart. First native saved
  becomes Self automatically; exactly one Self per profile.
- Website CRUD is scoped by a per-browser anonymous account id
  (`x-account-id`); lists never go global. Legacy flat docs read-wrap
  into single-native profiles, never lost.
- Each profile has ONE API secret (SHA-256 stored, shown once, revocable).
  MCP connects per profile: `/api/mcp/<profileId>?access_token=<secret>`
  with zero-arg tools `list_natives` (names only) / `get_native` /
  `get_native_varga`. One native per call — mixing is impossible by shape.
- Rate limits (in-memory, per instance): 60/min per secret, 180/min per IP
  on MCP; 240/min per IP on REST. `uses`/`lastUsedAt` counted per profile.
- Copy-paste prompt (`src/lib/ai-prompt.ts`) stays the universal fallback
  for chat apps without custom MCP support (ChatGPT/Perplexity/Kimi web).
- Varga math source of truth: `src/domain/varga-engine.ts`
  (D4 kendra / D6 parity / D7 parity / D9 / D10 / D60 Aries-Libra).
  Website, prompt, and MCP all compute from it — context cannot drift.
