# Compatibility Notes

## Current target

- `schemaVersion`: `journal-v1`
- upstream style: Cyberboss-compatible structured data
- sample timezone: `Asia/Shanghai`

## Stable vs evolving inputs

More stable:

- timeline event spans
- category / subcategory / event-node references
- todo item status and text

More likely to evolve:

- diary summary phrasing and markdown richness
- optional note / tag fields
- higher-level weekly and monthly aggregation behavior

## Upgrade expectation

If upstream Cyberboss data contracts change, `journal` may require:

- a small adapter layer before build time, or
- a frontend update in `src/build-journal-data.js`

## Recommended policy

- Treat `timeline` as the primary contract
- Keep diary and todo inputs additive where possible
- When changing field names, update schema docs and sample data together
