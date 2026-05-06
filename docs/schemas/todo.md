# Todo Schema

`journal` consumes todos as a map of `dateKey -> items[]`. The sample data lives in [`data/public/todos.json`](../../data/public/todos.json).

## Expected shape

```json
{
  "2026-04-27": [
    {
      "text": "reply messages",
      "status": "open",
      "source": "sanitized-sample"
    }
  ]
}
```

## Todo item fields

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `text` | string | yes | visible task label |
| `status` | string | yes | `open`, `done`, or `dropped` |
| `source` | string | no | provenance label |
| `note` | string | no | extra task detail |
| `updatedAt` | ISO datetime string | no | optional metadata |
| `createdAt` | ISO datetime string | no | optional metadata |

## Frontend behavior

- `done` renders as completed
- `open` renders as active
- `dropped` is filtered out from the visible checklist
- Missing todo data simply results in an empty checklist block

## Minimal example

```json
{
  "2026-04-27": [
    {
      "text": "reply messages",
      "status": "open"
    },
    {
      "text": "finish admin",
      "status": "done",
      "source": "manual"
    }
  ]
}
```
