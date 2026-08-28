# Design

Read this before adding or restyling UI in scrapbook. Kit tokens are the visual system. Cosmos is a craft reference only.

## Intent

An editorial scrapbook: photographs and writing are the magazine; chrome is the paper. Sharing is finite (Today is a pack, not a feed). Connect by QR. Place on a phone. Sit with scraps on a desktop.

The visual system lives in the portfolio kit (`portfolio-website` `theme.css` and `components/ui`). Scrapbook product UI lives in this repo’s `components/`. Do not fork the kit look. Do not paint the app like Cosmos (white paper, black chrome).

## Heuristics

1. **Photographs are the magazine; UI is the paper.** Cream paper, gray type, orange accent. Color lives in media. Do not add extra UI hues. Do not wash photographs with accent.
2. **Print scale for chrome.** Nav, tabs, captions, and metadata use `text-caption` and weight. Hierarchy for chrome is `font-medium` vs regular, plus `opacity-70` / `opacity-50`. Do not invent a second gray token.
3. **Swiss lettering for editorial type.** Page titles, manifesto, text scraps, collection names, and empty-state lines use Geist Sans as a neo-grotesque (the Swiss face already in the kit). Set them **large and bold** (`.type-display`, `.type-essay`, `.type-title`): `font-weight: 700`, tight tracking (`-0.02em` to `-0.03em`), tight leading (`1.12`–`1.18`). Air lives *between* blocks, not inside the line. Do not switch the family to Inter or Helvetica. Do not paint type black — full kit foreground is the ink.
4. **Air is the luxury signal.** Prefer padding and unused paper over rules and bars. A full-width `border-t` bottom bar reads as a phone app, not a spread.
5. **Concentric radii from the kit.** Pills (`rounded-pill`) for chrome. Plates and modals (`rounded-plate` / `rounded-panel` / `rounded-float`). Media on a plate uses the plate radius, not `rounded-sm`.
6. **Depth without extra boxes.** Kit shadows: `shadow-hairline`, `shadow-raised`, `shadow-overlay`. A scrap is a plate (media edge-to-edge), not a padded `Surface` around a small photo.
7. **One-at-a-time Today.** Finite pack via `SittingStack`. Peek of the next plate is allowed. Infinite masonry and discovery feeds are not.
8. **Create is verbs as tiles, then fields.** Photograph, words, book, music. Submit with kit `Button`, never a black Cosmo pill.
9. **Naming a collection is typographic.** Large borderless `.type-display` field, small caption label, kit `Switch` only when it maps to real visibility, kit `Button` to create.
10. **Voice.** Manifesto language. Love / inspired / curate. No like, follow, For You, Explore, or Shop. Section labels may be lowercase.

## Tokens

Do **not** override `:root` RGB (`--background-rgb`, `--foreground-rgb`, `--surface-rgb`, `--secondary-rgb`, `--accent-rgb`).

| Role | Use |
| --- | --- |
| Paper | `bg-background`, `bg-surface` — cream `255,252,243` |
| Type | `text-foreground` — mid gray `80,80,80` (ink). Bold + size, not a black token |
| Wash | `bg-secondary` — warm secondary, empty plates, selected tiles |
| Accent | kit `Button` primary, focus rings — orange `248,91,39`. Chrome, not fills behind photos |
| Hairline | `border-hairline`, `shadow-hairline` |
| Radius chrome | `rounded-pill` |
| Radius media / inset | `rounded-card` |
| Radius plate / modal | `rounded-plate` (alias of `--radius-panel`, 22px), `rounded-float` (28px) |
| Shadow | `shadow-hairline`, `shadow-raised`, `shadow-overlay` |
| Type scale | `text-caption` chrome · `text-body` form fields · `text-title` / `.type-title` names and rows · `text-essay` / `.type-essay` manifesto and text scraps · `text-display` / `.type-display` mastheads |
| Motion | `--duration-fast` / `--duration-base` / `--ease-out-quint` |

Optional scrapbook aliases (do not invent new values except `--text-essay`, which sits between kit `title` and `display`):

```css
--radius-plate: var(--radius-panel);
--text-essay: 1.875rem;
```

## Type roles

| Class | When |
| --- | --- |
| `.type-display` | Page masthead, empty Today, collection title field, sign-in wordmark, how-step title |
| `.type-essay` | Worth manifesto, walkthrough body, text scraps |
| `.type-title` | Book/music titles, people names, create-sheet verbs if they need punch |
| `text-caption` + opacity | Nav, dates, handles, “close” / “a room”, section meta |

Do not use `.type-display` on nav. Do not use `text-body` + `opacity-70` for the manifesto — that reads as UI help text, not a spread.

## Components

### Kit (import from `@/components/ui`)

- `Button` — primary for place / save / create. Ghost for Edit and quiet actions. Never restyle to black.
- `PageShell` — page frame. Shell adds nav offset; do not nest a second shell inside `AppShell`. Worth may use `width="essay"` for a narrower measure under large type.
- `Dialog` — collection name, new group, edit profile. Backdrop already dims and blurs. Extra padding / `rounded-float` on popup is allowed.
- `Switch`, `Checkbox`, `Radio`, `RadioGroup` — real settings only.
- `Input`, `Textarea` — fields after the create sheet. Collection title uses a borderless `.type-display` input, not `fieldControl`.
- `Surface` — rare. Prefer plates. Do not wrap scrap photographs in `Surface`.
- `Card` — kit **project row**. Do not use for scraps, albums, or Today.

### Scrapbook (this repo)

- `AppShell` — desktop top text nav; phone inset bottom pill. Kit paper.
- `ScrapViewCard` — one scrap as a plate (image full-bleed, text as `.type-essay`, caption under).
- `SittingStack` — finite Today pack. Framer only here. `bounce: 0`. Reduced motion: static list, no travel.
- `CollectionPlate` — album or group cover (or empty +). Title + caption under. Links or buttons.
- `CreateSheet` — 2×2 verb tiles for place kinds.

## Layout

- **Desktop:** thin top text nav (Today, Place, Me, Code). More vertical paper. Today is the sitting pack.
- **Phone:** QR, Place, Me in a quiet bottom pill, 44px hits. Place is the create sheet.
- **Today:** one plate at a time (or a list under reduced motion). End copy: “That is all for today.” in `.type-display`.
- **Me:** masthead in `.type-display`, then Profile / Collections. Collections are plates, not underlined lists.
- **Place:** verb heading in `.type-display` → tiles → audience → fields → kit `Button` “place”.
- **Worth / sign-in:** large bold essay on paper. One primary `Button`. Manifesto link in caption opacity.

## Motion

Product UI is fast and editorial. Animate only when it helps orientation. `MotionConfig` in `components/providers.tsx` already sets `reducedMotion="user"` and `spring.page` as the default Framer transition.

### Where animation lives

| Surface | Tool | Notes |
| --- | --- | --- |
| Nav, buttons, plates, form chrome | CSS | Kit `--duration-fast` / `--duration-base`. Hover: opacity or background. Press: `active:scale-[0.96]` (kit buttons). |
| `Dialog` enter/exit | Kit | Backdrop + popup already paired; do not change one without the other. |
| `SittingStack` (Today) | Framer | `spring.base`, `bounce: 0`. Drag + peek only here. |
| `HowStepper` | Framer | Opacity (and small `y` when motion allowed). Same spring. |
| Everything else | None | No new Framer on lists, plates, or forms. |

### Easing and duration

Use kit tokens. Pick easing by what the element is doing:

- **Entering or exiting** (modal, tooltip, plate appearing): `ease-out` / `--ease-out-quint`. Feels instant at the start.
- **Moving on screen** (stack card, step crossfade): `ease-in-out` or `spring.base`.
- **Hover / color / opacity**: `ease` or `ease-out`, **150ms** (`--duration-fast`).

Keep UI motion **under 300ms**. Exits can be ~20% faster than entrances. Do not use `ease-in` for UI (sluggish start). Do not use `linear` except marquees or progress bars (we have neither).

### Frequency

Users open Today and nav constantly. Do not add entrance animations to shell chrome, collection grids, or the create sheet. The sitting pack is the one place motion earns its keep — keep it short and interruptible (drag).

### Springs

Import `spring` from `@/components/ui`. Always **`bounce: 0`** in this product (no playful overshoot). Use `spring.base` for stack and step transitions. Do not add bounce to dismiss or modals.

### Reduced motion

Honor `prefers-reduced-motion` on every new animation.

- **Remove travel:** no `translate`, `scale` travel, or drag affordance that implies motion. `SittingStack` becomes a static list.
- **Keep meaning:** opacity and color fades are fine (how-step, dialog). State change should still read.
- CSS: `motion-safe:` for hover; globals already disable transitions on buttons under `reduce`.
- Framer: branch with `useReducedMotion()` — never rely on `MotionConfig` alone when you set custom `initial` / `exit` with `x` or `y`.

### Performance

Animate **`transform` and `opacity` only**. Do not animate `width`, `height`, `margin`, `padding`, or layout. Do not add decorative loops. Collection plate hover is opacity only (`motion-safe:`).

### Anti-patterns (motion)

- New Framer on Me, Place, albums, or profile lists
- Bounce, wobble, or long (>300ms) transitions on daily paths
- Animating nav labels or tab pills on every route change
- Reduced-motion variant that still slides or scales
- Hover scale on touch-primary UI without `@media (hover: hover) and (pointer: fine)`
- Unpaired dialog timing (backdrop and popup must match)

## Anti-patterns

- Overriding kit colors to Cosmos white / near-black / cool gray / black pills
- Replacing Geist with Inter / Helvetica / a second display face
- For You, Following, Explore, Shop, Suggested, search overlay, infinite masonry
- Kit `Card` for scraps
- Underlines as the only list treatment for albums and people
- Accent orange as a wash or overlay on photographs
- Bottom `border-t` app bar on desktop
- New gray/black tokens for type hierarchy — use weight, size, tracking, and opacity
- Manifesto or text scraps set in `text-body` + faded opacity
- Like / follow naming
