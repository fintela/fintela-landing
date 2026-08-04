---
title: Strategies
section: API Reference
sectionOrder: 6
order: 2
published: true
updated: 2026-08-04
summary: Read strategy definitions, metadata, parameters, and version history.
keywords: /strategies, GET, metadata, params, versions, execution type
---

Read the strategies that already exist in your organization — their names, code, parameter
definitions, the studies that use them, and their full edit history. Strategies are authored in
the Fintela app; every endpoint here is a `GET`.

## Endpoints

```http
GET /strategies
GET /strategies/metadata
GET /strategies/params
GET /v2/strategies/:id/versions
GET /v1/strategies
```

| Endpoint | What it returns |
|---|---|
| `GET /strategies` | List strategies as an `{ id: name }` map. |
| `GET /strategies/metadata` | Full record — code, parameters, linked studies. Filter with `?strategy_ids=1,2,3`. |
| `GET /strategies/params` | Parameter definitions only. Filter with `?strategy_ids=1,2,3`. |
| `GET /v2/strategies/:id/versions` | Append-only edit history for one strategy, newest first. |
| `GET /v1/strategies` | Legacy alias of `/strategies` — identical response. |

Every response is wrapped in a `data` envelope, and every read applies the visibility of the
user who created the key. A colleague's private strategy is simply absent from the list rather
than returning an error.

## List strategies

The list endpoint returns the smallest useful payload — a map of strategy id to name — so it is
the cheapest way to discover what ids exist before fetching detail. Keys are JSON object keys,
so ids arrive as strings.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/strategies

# → { "data": { "7": "roc_top_n", "12": "mean_reversion" } }
```

`/v1/strategies` is a legacy alias kept for backward compatibility. It is bound to the same
handler and returns byte-identical output — prefer the unversioned path in new code.

## Full metadata

`/strategies/metadata` returns the complete record for each visible strategy, keyed by id. Pass
`?strategy_ids=` with a comma-separated list to narrow it; omit the filter to get every strategy
the key can see.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     "https://developer.fintela.io/strategies/metadata?strategy_ids=7,12"
```

```json
{
  "data": {
    "7": {
      "name": "roc_top_n",
      "description": "Pick the top N by rate of change.",
      "execution_type": "internal",
      "execution_details": {
        "code": "def roc_top_n(data, start_date, end_date, n_top, roc_window_size, ma_kind):\n    ..."
      },
      "parameters": [
        { "parameter_name": "n_top", "description": "How many names to hold.",
          "dtype": "integer", "is_window": false },
        { "parameter_name": "roc_window_size", "description": null,
          "dtype": "integer", "is_window": true },
        { "parameter_name": "ma_kind", "description": null,
          "dtype": "categorical", "is_window": false,
          "choices": ["ema", "sma", "wma"] }
      ],
      "studies": [31, 44],
      "created_at": "2025-11-04 09:12:41.882374+00",
      "updated_at": "2026-02-18 17:03:55.104219+00"
    }
  }
}
```

**Fields per strategy**

| Name | Type | Description |
|---|---|---|
| `name` | string | Strategy name, unique within the organization. |
| `description` | string \| null | Free-form description shown in the app. |
| `execution_type` | `"internal"` \| `"external"` | Whether the strategy runs as Python code on Fintela, or as a call out to an HTTPS endpoint you host. |
| `execution_details` | object | For `internal`: `{ code }`. For `external`: `{ endpoint, timeout, max_concurrency }`. |
| `parameters` | array | Hyperparameter declarations — see `/strategies/params` below for the field-by-field breakdown. |
| `studies` | number[] | Ids of the studies that reference this strategy. Empty if it has never been optimized. |
| `created_at` | string \| null | Postgres timestamp text, e.g. `"2025-11-04 09:12:41.882374+00"`. |
| `updated_at` | string \| null | Same format; moves on every material edit. |

> [!WARNING] Explicit ids are checked one by one
> With `?strategy_ids=`, each id is verified against the key owner's visibility before anything
> is returned. A malformed id returns `400 Bad Request`; an id that exists but is not visible to
> the key owner — or does not exist at all — returns `406 Not Acceptable` with
> `{"message": "Strategy 7 not found"}`, and the whole request fails rather than returning a
> partial map. Omitting the filter never fails this way: it just returns what is visible.

## Parameter definitions

When you only need to know what a strategy takes — to build a UI, validate a config, or mirror
the search space in your own tooling — `/strategies/params` returns just the hyperparameter
declarations, keyed by strategy id, with the code left out.

```json
{
  "data": {
    "7": [
      { "name": "n_top",           "dtype": "integer",     "is_window": false },
      { "name": "roc_window_size", "dtype": "integer",     "is_window": true  },
      { "name": "ma_kind",         "dtype": "categorical", "is_window": false,
        "choices": ["ema", "sma", "wma"] }
    ]
  }
}
```

**Fields per parameter**

| Name | Type | Description |
|---|---|---|
| `name` | string | The argument name your strategy function receives. |
| `dtype` | string | One of `integer`, `float` or `categorical`. |
| `is_window` | boolean | True when the parameter is a lookback window, which is what drives warm-up requirements before the simulation start date. |
| `choices` | string[] | Present only for `categorical` parameters — the declared value set a study may explore or pin. Omitted otherwise. |

Unlike `/strategies/metadata`, this endpoint does not fail on an unknown or invisible id:
unreadable strategies are dropped from the result, so ask for three ids and you may get back
two. Compare the returned keys against the ids you requested rather than assuming a one-to-one
mapping.

## Version history

Every material edit to a strategy — its code, its execution details, its parameters — appends a
row to an immutable version log. A study pins the version it launched with, so history is how
you reproduce what a past run actually executed even after the strategy kept evolving.

```bash
curl -H "Authorization: Bearer $FINTELA_API_KEY" \
     https://developer.fintela.io/v2/strategies/7/versions
```

```json
{
  "data": [
    {
      "version_id": 918,
      "version_number": 3,
      "snapshot_name": "roc_top_n",
      "snapshot_execution_type": "INTERNAL",
      "snapshot_execution_details": { "code": "def roc_top_n(...):\n    ..." },
      "snapshot_parameters": [
        { "parameter_name": "n_top", "dtype": "integer", "is_window": false }
      ],
      "snapshot_extra_data_config": null,
      "snapshot_strategy_type": null,
      "note": "tightened the ROC window after the Q3 review",
      "created_at": "2026-02-18T17:03:55Z"
    }
  ]
}
```

- Rows are ordered by `version_number` descending, so `data[0]` is the current live definition
- `version_number` starts at `1` when the strategy is created and increments on each captured
  edit; `version_id` is a global, monotonic row id
- `note` carries the change note the author typed in the app, or `null`
- `created_at` is ISO-8601 UTC — `YYYY-MM-DDTHH:MM:SSZ` — unlike the Postgres-style timestamps
  on `/strategies/metadata`
- `snapshot_extra_data_config` and `snapshot_strategy_type` are frozen historical columns. They
  are `null` on anything recorded since data pipelines replaced them, and are kept only so old
  versions stay readable

> [!NOTE] An invisible strategy returns an empty list
> Asking for the versions of a strategy that does not exist, belongs to another organization, or
> is not visible to the key owner returns `200 OK` with `{"data": []}` — not a `404`. Treat an
> empty array as "nothing to show", not as "the strategy exists but has no history": a real
> strategy always has at least version `1`.

## Authoring happens in the app

There is no endpoint here to create, edit, delete or sandbox-run a strategy. Writing a strategy
means compiling and validating code, and sandbox-running one means executing a simulation — both
consume metered compute, so both live in the app where that metering applies. Use this API to
read the result of that work.

> [!NOTE] Custom data is wired through data pipelines
> Strategies take no inline data field. Custom inputs — built-in feeds or your own external
> sources — reach strategies, fitness functions, and risk managers through **data pipelines**
> wired in the platform (Registry → Data pipelines), not as a property of the strategy itself.
> See [Data pipelines](/docs/data-pipelines) for the full reference.
