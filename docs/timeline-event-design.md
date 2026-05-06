# Timeline Event Design

This document is the style contract for all current timeline events in `Journal`.
It defines the visual system, category palette, and the current event inventory used by the public sample.

## Source of Truth

Use these files in this order:

1. `src/build-journal-data.js`
   Defines `CATEGORY_PALETTE`, which is the canonical category color map used by timeline events.
2. `src/app.jsx`
   Defines event chip styling, warm-paper theme tokens, and the rendering behavior for daily / weekly / monthly views.
3. `data/public/timeline-taxonomy.json`
   Defines category, subcategory, and event-node structure.
4. `data/public/timeline-facts.json`
   Defines which event titles are currently active in the public sample.

If these files disagree, fix the code first and then update this document.

## Design Intent

The timeline should read like a warm, tactile paper journal, not a dashboard.

- Events use soft category fills instead of loud status colors.
- Meaning comes from category families, not from one-off per-event colors.
- Overlapping events should feel like stacked memo slips, not collision errors.
- The visual hierarchy is date first, event second, metadata third.

## Global Theme Tokens

Current default theme: `Warm Paper`

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `oklch(0.970 0.012 75)` | Page background |
| `--paper-2` | `oklch(0.988 0.008 80)` | Raised card background |
| `--paper-edge` | `oklch(0.945 0.014 70)` | Card edge / hover wash |
| `--ink` | `oklch(0.305 0.018 55)` | Primary text |
| `--ink-2` | `oklch(0.480 0.014 58)` | Secondary text |
| `--ink-3` | `oklch(0.680 0.012 62)` | Muted labels |
| `--ink-4` | `oklch(0.820 0.010 68)` | Disabled / placeholder |
| `--rule` | `oklch(0.880 0.014 65)` | Dividers |
| `--rule-soft` | `oklch(0.935 0.012 70)` | Soft dividers |
| `--accent` | `oklch(0.660 0.070 42)` | Focus state / selected date |
| `--accent-ink` | `oklch(0.520 0.080 40)` | Accent text |
| `--accent-wash` | `oklch(0.955 0.022 50)` | Accent background wash |
| `--accent-dot` | `oklch(0.880 0.040 48)` | Small accent markers |

## Event Rendering Rules

### Event chips

Current chip behavior in `src/app.jsx`:

- Background: category `fill`
- Text: category `ink`
- Font: `'Cormorant Garamond', 'Garamond', serif`
- Font size: `11.5px`
- Font style: italic
- Radius:
  - inline chip: `999px`
  - block chip: `6px`
- Padding:
  - inline chip: `2px 8px`
  - block chip: `2px 6px`

### Event blocks

- Multi-hour blocks in day view should use a softened wash derived from category fill.
- The current softening formula is:
  - `color-mix(in oklch, <fill> 78%, white)`
- Overlapping blocks should stay visually separate by stacking with small offsets and preserving rounded corners.

### Inheritance rule

- Event titles do **not** get unique colors by default.
- Every event inherits color from its top-level category.
- Subcategories may affect wording and grouping, but not palette, unless a deliberate exception is added.

## Category Palette

These values come from `src/build-journal-data.js`.

| Category | Label | Fill | Ink | Visual role |
| --- | --- | --- | --- | --- |
| `life` | Life | `#F4E7CE` | `#6d5a2d` | Meals, hygiene, errands, everyday domestic rhythm |
| `work` | Work | `#BEDAE3` | `#3d5a64` | Focus, meetings, communication, structured output |
| `study` | Study | `#C6DBDA` | `#3d5f5d` | Reading, courses, reflective learning; calm neutral blue in the work color family |
| `exercise` | Exercise | `#F3EA93` | `#6b6426` | Movement, sport, body activation; soft daylight yellow |
| `entertainment` | Entertainment | `#FFD1DB` | `#7a3e4c` | Watching, scrolling, leisure media; soft playful pink |
| `health` | Health | `#C4D4B1` | `#4d5b3a` | Recovery, symptom care, medical context; calm care green |
| `social` | Social | `#D3C7E6` | `#4b4266` | Calls, chats, catch-ups, relational time |
| `care` | Care | `#ECD5E3` | `#6a4458` | Pet / home / self-care support actions |
| `travel` | Travel | `#F1B598` | `#6d3a1e` | Commute, transit, movement between scenes |
| `rest` | Rest | `#FDECDF` | `#7a5a40` | Sleep, nap, idle recovery |

## Current Public Event Inventory

These are the event titles that currently appear in `data/public/timeline-facts.json`.
They should be treated as the maintained public sample vocabulary.

| Event title | Category | Subcategory | Event node | Visual handling |
| --- | --- | --- | --- | --- |
| `Breakfast` | `life` | `life.meal` | `evt.breakfast` | Warm neutral card/chip |
| `Lunch` | `life` | `life.meal` | `evt.lunch` | Warm neutral card/chip |
| `Dinner` | `life` | `life.meal` | `evt.dinner` | Warm neutral card/chip |
| `Shower` | `life` | `life.hygiene` | `evt.shower` | Warm neutral card/chip |
| `Shopping` | `life` | `life.shopping` | `evt.shopping` | Warm neutral card/chip |
| `Deep Work` | `work` | `work.coding` or `work.other` | `evt.focus_coding` | Cool structured block; safe as dominant anchor event |
| `Meeting` | `work` | `work.meeting` | `evt.meeting` | Cool structured block; works well as overlap note |
| `Messages` | `work` | `work.communication` | `evt.meeting` | Cool structured block; ideally use a dedicated communication event node later |
| `Reading` | `study` | `study.reading` | `evt.reading` | Soft sage study marker |
| `Tennis` | `exercise` | `exercise.workout` | `evt.workout` | Athletic movement block; acceptable as a premium morning anchor |
| `Workout` | `exercise` | `exercise.workout` | `evt.workout` | Athletic movement block |
| `Walk` | `exercise` | `exercise.walk` | `evt.walk` | Light movement block |
| `Movie` | `entertainment` | `entertainment.video` | `evt.watch_show` | Leisure accent block |
| `Phone Scroll` | `entertainment` | `entertainment.social_media` | `evt.phone_scroll` | Leisure accent block; should stay visually lighter than deep work |
| `Call` | `social` | `social.call` | `evt.call` | Lavender relational note |
| `Coffee Chat` | `social` | `social.chat` | `evt.chatting` | Lavender relational note |
| `Coffee Catch-up` | `social` | `social.chat` | `evt.chatting` | Lavender relational note |
| `Commute` | `travel` | `travel.commute` | `evt.commute` | Transit block; usually a connector event, not the day’s hero |
| `Sleep` | `rest` | `rest.sleep` | `evt.sleep` | Soft rest wash; low-tension base layer |

## Overlap Rules

Overlaps are intentional in the public sample and should be preserved when useful.

Current showcase examples:

- `Deep Work` + `Meeting`
- `Lunch` + `Call`
- `Coffee Catch-up` + `Messages`

Guidelines:

- One overlap pair per day is enough to demonstrate the UI.
- Use overlap to imply interruption, multitasking, or parallel context shifts.
- Do not stack more than two small notes over one long block unless the layout is explicitly redesigned.

## Content-to-Style Rules

- `Sleep` should remain visually calm and never look urgent.
- `Deep Work` is allowed to dominate a daily view and can be the narrative anchor.
- `Travel` should bridge scenes, not overpower them.
- `Social` events should feel lighter and more conversational than `Work`.
- `Entertainment` should feel soft and casual, not bright or childish.
- `Life` should stabilize the composition between more expressive blocks.

## When Adding New Events

1. Add or confirm the event node in `timeline-taxonomy.json`.
2. Map it to an existing top-level category whenever possible.
3. Reuse the category palette instead of inventing a new event color.
4. Only create a new category if the existing palette no longer communicates the event’s role.
5. Update this file if a new public event title is introduced.

## Known Data Caveats

- `Messages` currently uses `eventNodeId: evt.meeting` in public sample data.
  This does not affect rendering because color comes from `categoryId`, but the taxonomy should eventually get a dedicated communication node if this event remains.
- `Tennis` currently reuses `evt.workout`.
  This is acceptable for the sample, but a dedicated racket-sport node would be cleaner if sports variety expands.
