# Timeline Schema

`journal` expects a Cyberboss-compatible timeline state object. The sample data lives at [`data/public/timeline-state.json`](../../data/public/timeline-state.json).

## Minimum shape

```json
{
  "version": 1,
  "timezone": "Asia/Shanghai",
  "taxonomy": {
    "categories": [],
    "eventNodes": []
  },
  "facts": {
    "2026-04-27": {
      "status": "draft",
      "updatedAt": "2026-04-27T12:00:00.000Z",
      "source": null,
      "events": []
    }
  },
  "proposals": []
}
```

## Required top-level fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `version` | number | yes | upstream timeline payload version |
| `timezone` | string | yes | sample uses `Asia/Shanghai` |
| `taxonomy.categories` | array | yes | category tree for color and grouping |
| `taxonomy.eventNodes` | array | yes | event node dictionary |
| `facts` | object | yes | keyed by `YYYY-MM-DD` |
| `proposals` | array | no | currently ignored by most UI paths |

## `facts[dateKey]`

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `status` | string | yes | e.g. `draft` |
| `updatedAt` | ISO datetime string | yes | UTC timestamp |
| `source` | any | no | passthrough metadata |
| `events` | array | yes | timed event spans for the day bucket |

## Event object

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `id` | string | yes | stable event id |
| `startAt` | ISO datetime string | yes | UTC timestamp |
| `endAt` | ISO datetime string | yes | UTC timestamp |
| `title` | string | yes | display label |
| `categoryId` | string | yes | maps to taxonomy category |
| `subcategoryId` | string | yes | maps to taxonomy child |
| `eventNodeId` | string | yes | maps to taxonomy event node |
| `note` | string | no | extra detail for event cards |
| `tags` | string[] | no | optional secondary labels |
| `confidence` | number | no | optional provenance signal |
| `sourceMessageIds` | string[] | no | optional provenance ids |

## Time conventions

- `startAt` and `endAt` are UTC ISO timestamps
- `journal` converts them into the target local timezone for layout
- Cross-day events are split across adjacent daily views by the frontend

## Taxonomy conventions

`taxonomy.categories`:

```json
{
  "id": "work",
  "label": "Work",
  "color": "var(--cat-work)",
  "children": [
    { "id": "work.coding", "label": "Coding" }
  ]
}
```

`taxonomy.eventNodes`:

```json
{
  "id": "evt.focus_coding",
  "label": "Focused Coding",
  "aliases": ["coding", "implementation"],
  "parentId": "work.coding",
  "status": "official"
}
```

## Minimal event example

```json
{
  "id": "evt-1",
  "startAt": "2026-04-27T02:20:00.000Z",
  "endAt": "2026-04-27T04:10:00.000Z",
  "title": "Deep Work",
  "categoryId": "work",
  "subcategoryId": "work.coding",
  "eventNodeId": "evt.focus_coding",
  "note": "Worked through implementation details.",
  "tags": ["work", "focus"]
}
```
