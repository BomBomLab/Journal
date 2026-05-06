# Diary Schema

`journal` currently consumes diary data as a map of `dateKey -> markdown string`. The sample files live in [`data/public/diary/`](../../data/public/diary).

## Expected shape

At build time, the public sample is represented as:

```json
{
  "2026-04-27": "## Summary\n\n### AM\n\n...\n\n### PM\n\n...\n\n## Entries\n\n## 08:30 Commute\n\n..."
}
```

## Required contract

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `dateKey` | `YYYY-MM-DD` | yes | implied by filename or object key |
| markdown body | string | yes | parsed into summary and entries |

## Supported markdown sections

The parser currently understands this structure:

```md
## Summary

### AM

Morning summary text.

### PM

Afternoon / evening summary text.

## Entries

## 08:30 Commute

Entry body text.

## 10:20 Deep Work

Entry body text.
```

## Parsing behavior

- `## Summary` is optional but recommended
- `### AM` and `### PM` are optional sub-sections
- `_Not updated yet._` is treated as empty
- `## Entries` is optional
- Entry headings beginning with `HH:MM Title` are parsed into timed diary entries

## Derived frontend behavior

When diary data is present:

- Daily summary cards use the parsed summary text
- Daily detail sections can show diary entry bodies
- Weekly and monthly summary text may derive from daily summaries

When diary data is missing:

- The frontend falls back to event-derived copy or empty states

## Minimal example

```md
## Summary

### AM

Morning moved through Sleep, Commute, Breakfast.

### PM

Afternoon focused on Deep Work and Lunch.

## Entries

## 08:30 Commute

A short ride into the office.

## 10:20 Deep Work

Shipped a focused implementation block.
```
