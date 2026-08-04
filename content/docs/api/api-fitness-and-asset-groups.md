---
title: Fitness & asset groups
section: API Reference
sectionOrder: 6
order: 6
published: true
updated: 2026-08-04
summary: Read fitness functions, their metadata and versions, and asset group definitions.
keywords: /fitness, /v1/data_clusters, GET, fitness function, asset group, versions, universe, data cluster
---

The two inputs that shape an optimization study: the **fitness function** that scores each trial,
and the **asset group** that defines the ticker universe it runs over. Both are authored in the
Fintela app — these endpoints read what exists, so you can reproduce, audit or document a study
from outside the platform. Every endpoint here is a `GET`.

## Endpoints

| Endpoint | What it returns |
|---|---|
| `GET /fitness` | List fitness functions as an `{ id: name }` map. |
| `GET /fitness/metadata` | Full record — code, parameters, linked studies. Filter with `?fitness_ids=1,2,3`. |
| `GET /v2/fitness/:id/versions` | Append-only edit history for one fitness function, newest first. |
| `GET /v1/data_clusters` | List the organization's asset groups with their ticker counts. |

Every response is wrapped in a `data` envelope, and every read applies the visibility of the user
who created the key. A colleague's private fitness function is simply absent from the list rather
than returning an error.

## List fitness functions

The list endpoint returns the smallest useful payload — a map of fitness id to name, ordered by
id — so it is the cheapest way to discover what exists before fetching detail. Keys are JSON
object keys, so ids arrive as strings.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/fitness

# → { "data": { "4": "sharpe_with_drawdown_penalty", "9": "calmar" } }
```

## Full metadata

`/fitness/metadata` returns the complete record for each visible fitness function, keyed by id.
Pass `?fitness_ids=` with a comma-separated list to narrow it; omit the filter to get everything
the key can see.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/fitness/metadata?fitness_ids=4,9"
```

```json
{
  "data": {
    "4": {
      "name": "sharpe_with_drawdown_penalty",
      "description": "Sharpe, penalized for deep drawdowns.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def fitness(equity, trades, penalty_weight):\n    ..."
      },
      "parameters": [
        { "parameter_name": "penalty_weight", "dtype": "float",
          "description": "How hard to punish drawdown." }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}
```

**Fields per fitness function**

| Name | Type | Description |
|---|---|---|
| `name` | string | Fitness name, unique within the organization. |
| `description` | string \| null | Free-form description shown in the app. |
| `execution_type` | `"internal"` \| `"external"` | Whether the function runs as Python code on Fintela, or as a call out to an HTTPS endpoint you host. |
| `execution_details` | object | For `internal`: `{ code }`. For `external`: `{ endpoint, timeout, max_concurrency }`. |
| `parameters` | array | Declarations as `{ parameter_name, dtype, description? }`. Unlike strategy parameters, fitness parameters have no `is_window` flag — a fitness function scores a finished simulation, so there is no rolling window to declare. |
| `studies` | number[] | Ids of the studies that reference this fitness function. Empty if it has never been used. |
| `created_at` | string \| null | Postgres timestamp text, e.g. `"2025-11-04 09:12:41.882374+00"`. |
| `updated_at` | string \| null | Same format; moves on every material edit. |

> [!WARNING] Explicit ids are checked one by one
> With `?fitness_ids=`, each id is verified against the key owner's visibility before anything is
> returned. A malformed id returns `400 Bad Request`; an id that exists but is not visible to the
> key owner — or does not exist at all — returns `406 Not Acceptable` with
> `{"message": "Fitness 4 not found"}`, and the whole request fails rather than returning a
> partial map. Omit the filter if you would rather receive whatever is visible.

## Version history

Every material edit to a fitness function appends a row to an append-only history. This is what
lets you answer "what did this scoring function actually look like when that study ran?" months
later — the code, the parameters and the data configuration are all snapshotted.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/fitness/4/versions
```

```json
{
  "data": [
    {
      "version_id": 512,
      "version_number": 3,
      "snapshot_name": "sharpe_with_drawdown_penalty",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": { "code": "def fitness(...):\n    ..." },
      "snapshot_parameters": [
        { "parameter_name": "penalty_weight", "dtype": "float" }
      ],
      "snapshot_extra_data_config": null,
      "note": "raised the penalty after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}
```

**Fields per version**

| Name | Type | Description |
|---|---|---|
| `version_id` | integer | Monotonic row id of the history entry. |
| `version_number` | integer | Per-fitness version counter. Rows come back **newest first**, ordered by this descending. |
| `snapshot_name` | string | The name the function had at that version — renames are captured too. |
| `snapshot_execution_type` | string | Uppercase in the snapshot — `"INTERNAL"` or `"EXTERNAL"` — where the metadata endpoint reports lowercase. Compare case-insensitively. |
| `snapshot_execution_details` | object \| null | The code or endpoint configuration as it stood. |
| `snapshot_parameters` | array \| null | Parameter declarations as they stood. |
| `snapshot_extra_data_config` | object \| null | Any additional data configuration attached at that version. |
| `note` | string \| null | Optional note recorded with the edit. |
| `created_at` | string | ISO-8601 UTC, e.g. `"2026-02-18T17:03:55Z"`. |

> [!NOTE] An empty array is the not-visible answer
> This endpoint returns `{"data": []}` — not a `404` — for a fitness id the key owner cannot read
> at full fidelity, and the same empty array for one that genuinely has no history yet. Version
> snapshots carry historical source code, so they are withheld without confirming whether the id
> exists. Treat an empty array as "nothing available to you" rather than proof that the function
> was never edited.

## Asset groups

An asset group is a named ticker universe that studies and strategies run over. The listing is a
lightweight index — id, name, description and how many tickers are in it — ordered by creation time
descending.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v1/data_clusters
```

```json
{
  "data": [
    {
      "id": 42,
      "name": "S&P 500 liquid names",
      "description": "Large caps filtered for average daily volume.",
      "ticker_count": 418,
      "created_at": "2026-01-09T13:44:02Z"
    },
    {
      "id": 17,
      "name": "Crypto majors",
      "description": null,
      "ticker_count": 12,
      "created_at": "2025-08-22T10:05:39Z"
    }
  ]
}
```

**Fields per cluster**

| Name | Type | Description |
|---|---|---|
| `id` | integer | Cluster id, as referenced by studies and strategies. |
| `name` | string | Display name given in the app. |
| `description` | string \| null | Free-form description. |
| `ticker_count` | integer | How many tickers the cluster contains. |
| `created_at` | timestamp \| null | Creation time, UTC. The list is ordered by this, descending. |

The endpoint returns counts rather than the ticker list itself. When you need the constituents,
open the cluster in the app — and note that this route has no detail sibling and takes no query
parameters, so there is nothing to filter on. Clusters the key owner cannot read at full fidelity
are omitted from the list entirely.
