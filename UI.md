# ODYSSEY — UI & Motion Spec

## Design principles
1. **The scene is the interface.** UI chrome is thin, monospaced and peripheral, like instrument readouts on a visor.
2. **Editorial type over cinematic imagery.** Huge display headlines are paired with small, calm body copy.
3. **Every chapter has a color.** One accent per world themes the rail, kickers, stats and cursor.
4. **Motion has weight.** Nothing snaps. Everything eases with inertia (`expo.out` / `power4.out`).

## Type
| Role | Font | Size | Notes |
|---|---|---|---|
| Display | **Syne 800** | `clamp(3rem, 8.4vw, 9rem)` | Uppercase, `line-height .88`, `letter-spacing -0.04em` |
| Accent | **Instrument Serif Italic** | inherits | One or two words per headline, for a human contrast |
| Body | **Space Grotesk 400** | `clamp(1rem, 1.1vw, 1.15rem)` | 60ch max, 72% opacity |
| HUD / kicker | **JetBrains Mono 500** | 11–12px | Uppercase, `letter-spacing .18em` |

## Color
| Token | Value |
|---|---|
| `--void` | `#04050a` (page background) |
| `--ink` | `#eef1f8` |
| `--ink-dim` | `rgba(238,241,248,.62)` |
| `--line` | `rgba(238,241,248,.14)` |
| `--accent` (per chapter) | Earth `#6fc3ff` · Moon `#d4dbea` · Mars `#ff7a45` · Belt `#d9a066` · Jupiter `#f0b27a` · Saturn `#f2d49b` · Sgr A* `#ff9d3d` · Beyond `#b89cff` |

The site is always dark. It's space; a light theme would break the premise.

## Layout
```
┌───────────────────────────────────────────────────────────┐
│ ODYSSEY ◦                     T+ 00:03:12      ● SCROLL   │  top HUD
│                                                     ─ 00  │
│  00 — ORIGIN · EARTH                                ─ 01  │  right rail
│  BEYOND THE                         ( planet )      ━ 02  │  (active = long bar
│  pale blue DOT                                      ─ 03  │   + label)
│  body copy…                                         ─ …   │
│  12,742 KM   23H 56M   1 AU                               │
│                                                           │
│ DIST 0 km · VEL 0 km/s · CH 00/07                         │  bottom telemetry
└───────────────────────────────────────────────────────────┘
```
- Copy panels alternate left and right. The camera's lateral look offset pushes the planet to the opposite side.
- Gutters are `6vw` on desktop and `20px` on mobile.
- **Portrait:** the panel is pinned to the bottom with a gradient scrim, the planet is framed in the top half, and the rail is hidden.

## Components
- **Preloader:** a mono counter from 000 to 100 and a hairline progress bar, labelled "Calibrating optics". On exit the counter slides up and the scene fades in from black.
- **Chapter panel:** kicker (index — name), headline (words masked and chars rising, stagger .018s), body, and a stat row (value counts up with its mono label).
- **Rail:** 8 ticks. The active tick widens to 36px in the accent color and shows its label. Hover reveals the label. Click flies the camera to that chapter (Lenis `scrollTo`, 2.2s, expo).
- **Telemetry:** DIST, VEL and CH, updated every frame and tabular-nums.
- **Cursor:** a 34px ring with `mix-blend-mode: difference` and lerped follow. It grows to 64px over interactive elements. Disabled on touch.
- **CTA "Return to Earth":** a pill with an accent border that fills on hover and scrolls to the top (a 4s reverse flight).

## Motion system
| Effect | Driver | Mapping |
|---|---|---|
| Camera travel | scroll progress | Catmull-Rom curve, with a dwell plateau of 18% on each side of a keyframe |
| Warp streaks | scroll velocity | streak length and opacity ∝ \|v\| |
| FOV kick | scroll velocity | 45° → up to 62° |
| Camera roll | signed velocity | ±3° bank |
| Chromatic aberration | scroll velocity | 0 → 0.006 radial |
| Pointer parallax | cursor | ±0.6 units in camera space, lerp 0.05 |
| Black hole blend | progress | fades in during the Saturn → Sgr A* transit |

Easing: reveals use `power4.out` at 1.1s, and exits reverse at 0.6s.

## Accessibility
- All copy is real DOM text inside `<section>`s with headings, and the canvas is `aria-hidden`.
- `prefers-reduced-motion` turns off Lenis smoothing, warp, CA, roll and the char stagger. The camera still follows scroll.
- Rail buttons are focusable with a visible accent outline.
