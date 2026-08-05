---
name: add-frontend-domain
description: >-
  Scaffold a new frontend data domain under frontend/src/domains/<x>/ following
  the Fintela 4-layer pattern (endpoints → service → queries + queryKeys →
  selectors → types → index barrel). Use when adding any new client-side data
  source / API surface to the React SPA — "new frontend domain", "add a domain",
  "wire up a new endpoint", "add TanStack Query hooks for X".
---

# Add a frontend domain (Fintela)

Scaffolds a domain in [`frontend/src/domains/`](../../../frontend/src/domains/) following the
mandatory **4-layer pattern**. Every one of the ~30 existing domains has the same skeleton;
copy it exactly. UI consumes **only** the `index.ts` barrel — never raw axios/fetch and never
the inner files directly.

## Layers (file order = data flow)

```
endpoints.ts   URLs only (typed constant object)
service.ts  →  typed fetch via lib/api clients + apiCall()
queries.ts  →  TanStack Query hooks (useQuery/useMutation)
queryKeys.ts   stable cache keys
selectors.ts   OPTIONAL — pure functions deriving view data (only if needed)
types.ts       request/response interfaces — mirror the backend models field-for-field
index.ts       public barrel — the ONLY thing features import
BACKEND.md     OPTIONAL — documents the backend contract / mock status
```

## Procedure

1. **Confirm the name** (camelCase dir, e.g. `riskManagers`) and the endpoints it needs
   (method + path + response shape). If the backend route doesn't exist yet, note it.
2. **Pick the client**: `backendClient` (main API, the default), `compilerClient`,
   `agentClient`, or `stripeClient` — all from `@/lib/api`.
3. Create `frontend/src/domains/<name>/` with the files below, adapting names/types.
4. **Verify**: `make tsc-check` (frontend typecheck) must pass.
5. Do NOT export inner files anywhere except through `index.ts`.

## Templates

`endpoints.ts`
```ts
export const ENDPOINTS = {
  /** GET — short description of what this returns. */
  LIST: '/<name>',
  BY_ID: (id: string) => `/<name>/${id}`,
} as const;
```

`types.ts` — mirror the Rust models in `services/backend/src/routes/<name>/models.rs`
field-for-field (same names, same nullability). Document non-obvious fields.
```ts
export interface Thing {
  id: string;
  name: string;
  created_at: string; // ISO-8601 UTC
}

export interface ThingListResponse {
  items: Thing[];
  total: number;
}
```

`service.ts`
```ts
import backendClient from '@/lib/api/backendClient';
import { apiCall } from '@/lib/api';
import { ENDPOINTS } from './endpoints';
import type { Thing, ThingListResponse } from './types';

export const <name>Service = {
  list: async (): Promise<ThingListResponse> =>
    apiCall<ThingListResponse>(backendClient, { method: 'GET', url: ENDPOINTS.LIST }),

  byId: async (id: string): Promise<Thing> =>
    apiCall<Thing>(backendClient, { method: 'GET', url: ENDPOINTS.BY_ID(id) }),
};
```
> `apiCall` already unwraps the standard `{ data: T }` envelope — never do
> `res.data.data` by hand.

`queryKeys.ts`
```ts
export const <name>Keys = {
  all: ['<name>'] as const,
  list: () => ['<name>', 'list'] as const,
  byId: (id: string) => ['<name>', 'byId', id] as const,
};
```

`queries.ts`
```ts
import { useQuery } from '@tanstack/react-query';
import { <name>Service } from './service';
import { <name>Keys } from './queryKeys';
import type { Thing, ThingListResponse } from './types';

export { <name>Keys };

export function use<Name>List() {
  return useQuery<ThingListResponse>({
    queryKey: <name>Keys.list(),
    queryFn: () => <name>Service.list(),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
```

`index.ts`
```ts
export { use<Name>List, <name>Keys } from './queries';
export { <name>Service } from './service';
export type { Thing, ThingListResponse } from './types';
```

`selectors.ts` (only when the view needs derived/computed data — see
`domains/portfolios/selectors.ts`, `domains/usageDashboard/selectors.ts` for the only two
existing examples). Pure functions, no hooks:
```ts
import type { Thing } from './types';
export function selectActive(things: Thing[]): Thing[] {
  return things.filter((t) => /* … */ true);
}
```

## Reference domains
- Smallest complete example: [`frontend/src/domains/activity/`](../../../frontend/src/domains/activity/)
  (single GET, has a `BACKEND.md`).
- With selectors: `domains/portfolios/`, `domains/usageDashboard/`.

## Done when
- All files compile (`make tsc-check`), features import only from `index.ts`, and `types.ts`
  matches the backend `models.rs`. Pair this with the **add-backend-domain** skill when the
  route doesn't exist yet.
