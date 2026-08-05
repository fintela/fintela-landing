---
name: add-backend-domain
description: >-
  Scaffold a new backend route domain under services/backend/src/routes/<x>/
  (handlers.rs, service.rs, models.rs, router.rs, mod.rs) and register it in
  routes/mod.rs. Use when adding any new HTTP route/domain to the Rust Axum
  backend — "new backend route", "add an endpoint", "new domain on the API",
  "expose X over HTTP".
---

# Add a backend route domain (Fintela)

Scaffolds an Axum route domain under
[`services/backend/src/routes/`](../../../services/backend/src/routes/) and wires it into the
router. ~30 domains already follow this exact shape. The easy-to-forget step is **registration
in `routes/mod.rs`** (two places) — this skill makes it atomic.

## Pattern (one folder per domain)

```
routes/<name>/
  mod.rs       declares submodules + `pub use router::router;`
  router.rs    Router<Arc<AppState>> mapping paths → handlers
  handlers.rs  thin: extract auth + args, call service, map to Response
  service.rs   business logic in a `*Service<'a>` struct over &Arc<AppState>
  models.rs    request/response structs (serde) + SQLx FromRow rows
```

Logic lives in **`*Service<'a>` structs**, not handlers. Errors use `api_service::error::ApiError`;
success uses `OkResponse::new(..)`. Queries are SQLx (compile-time checked against `.sqlx/`).

## Procedure

1. Confirm the domain name (snake_case, e.g. `risk_managers`) and its routes (method + path).
2. Create `routes/<name>/` with the five files (templates below).
3. **Register in [`routes/mod.rs`](../../../services/backend/src/routes/mod.rs)** — BOTH:
   - add `pub mod <name>;` to the module list, and
   - add `.merge(<name>::router())` inside the `timed` router block (use the `streaming`
     block instead only for SSE/long-lived routes).
4. If you added/changed any SQLx query, run the **sqlx-prepare** skill and commit `.sqlx/`.
5. **Verify**: `make cargo-check` (runs with `SQLX_OFFLINE=true`).

## Templates

`mod.rs`
```rust
pub mod handlers;
pub mod models;
pub mod router;
pub mod service;

pub use router::router;
```

`router.rs`
```rust
use axum::{Router, routing::get};
use std::sync::Arc;

use crate::{routes::<name>::handlers::list_things, state::AppState};

pub fn router() -> Router<Arc<AppState>> {
    Router::new().route("/<name>", get(list_things))
}
```

`models.rs`
```rust
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use uuid::Uuid;

#[derive(Debug, Serialize, FromRow)]
pub struct Thing {
    pub id: String,
    pub name: String,
    pub created_at: DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct ThingListResponse {
    pub items: Vec<Thing>,
    pub total: i64,
}

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    pub limit: Option<i64>,
}
```

`service.rs`
```rust
use std::sync::Arc;
use uuid::Uuid;

use crate::state::AppState;
use super::models::Thing;

pub struct <Name>Service<'a> {
    pub state: &'a Arc<AppState>,
}

impl<'a> <Name>Service<'a> {
    pub fn new(state: &'a Arc<AppState>) -> Self {
        Self { state }
    }

    pub async fn list(&self, organization_id: Uuid, limit: i64) -> Result<Vec<Thing>, sqlx::Error> {
        sqlx::query_as::<_, Thing>(
            "SELECT id::text AS id, name, created_at \
             FROM developers.<table> \
             WHERE organization_id = $1 \
             ORDER BY created_at DESC LIMIT $2",
        )
        .bind(organization_id)
        .bind(limit)
        .fetch_all(&self.state.pool)
        .await
    }
}
```

`handlers.rs`
```rust
use std::sync::Arc;

use api_service::{error::ApiError, response::OkResponse};
use axum::{
    extract::{Query, State},
    response::{IntoResponse, Response},
};

use crate::{
    auth_middleware::{AuthClaims, resolve_organization_id},
    state::AppState,
};

use super::{
    models::{ListQuery, ThingListResponse},
    service::<Name>Service,
};

const DEFAULT_LIMIT: i64 = 50;
const MAX_LIMIT: i64 = 200;

pub async fn list_things(
    AuthClaims(claims): AuthClaims,
    State(state): State<Arc<AppState>>,
    Query(query): Query<ListQuery>,
) -> Response {
    let organization_id = match resolve_organization_id(&claims, &state.pool).await {
        Ok(id) => id,
        Err(e) => return e.into_response(),
    };
    let limit = query.limit.unwrap_or(DEFAULT_LIMIT).clamp(1, MAX_LIMIT);
    let service = <Name>Service::new(&state);

    match service.list(organization_id, limit).await {
        Ok(items) => {
            let total = items.len() as i64;
            OkResponse::new(ThingListResponse { items, total }).into_response()
        }
        Err(e) => ApiError::internal(e.to_string()).into_response(),
    }
}
```

## Reference domain
Smallest clean example: [`services/backend/src/routes/activity/`](../../../services/backend/src/routes/activity/).
Auth/org-scoping helpers live in `auth_middleware.rs` (`AuthClaims`, `resolve_organization_id`).

## Done when
- `make cargo-check` passes, the domain is merged in `mod.rs` (module decl + `.merge(...)`),
  and any new SQLx query has a regenerated `.sqlx/` entry. Pair with **add-frontend-domain** so
  `types.ts` mirrors `models.rs`.
