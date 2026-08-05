---
name: add-feature-flag
description: >-
  Add a frontend feature flag to frontend/src/lib/featureFlags.ts with the
  correct resolve order (URL override → localStorage → compile-time default) and
  consume it via the useFeatureFlag hook. Use when gating new UI behind a flag —
  "add a feature flag", "gate this behind a flag", "flag X", "ff_ override".
---

# Add a frontend feature flag (Fintela)

Flags live in [`frontend/src/lib/featureFlags.ts`](../../../frontend/src/lib/featureFlags.ts).
Resolve order (highest precedence first):

1. **URL override** `?ff_<key>=1` / `?ff_<key>=0` (persisted to localStorage on boot via
   `consumeFlagOverridesFromUrl()`; great for QA/dogfood)
2. **localStorage** `fintela.flags.<key>` ∈ `{"1","0"}`
3. **compile-time default** in the `DEFAULTS` map

Flags use a **dotted hierarchy** for sub-features (e.g. `workspaces`,
`workspaces.organizations_subtab`). The `FlagKey` union makes every flag known at compile time —
an unknown `?ff_` param is ignored.

## Procedure

1. **Add the key to the `FlagKey` union** in `featureFlags.ts`:
   ```ts
   type FlagKey = 'workspaces' | 'workspaces.organizations_subtab' | '<your_key>';
   ```
2. **Add its compile-time default to `DEFAULTS`** (every `FlagKey` must have one — the
   `Record<FlagKey, boolean>` type enforces it). Default `false` for not-yet-ready features,
   `true` to dogfood:
   ```ts
   const DEFAULTS: Record<FlagKey, boolean> = {
     workspaces: true,
     'workspaces.organizations_subtab': true,
     '<your_key>': false,
   };
   ```
3. **Consume it** in a component via the reactive hook (re-renders on cross-tab flips):
   ```tsx
   import { useFeatureFlag } from '@/lib/featureFlags';

   const showNewThing = useFeatureFlag('<your_key>');
   return showNewThing ? <NewThing /> : <OldThing />;
   ```
   For non-component contexts (route resolvers, plain functions) use the imperative read:
   ```ts
   import { readFeatureFlag } from '@/lib/featureFlags';
   if (readFeatureFlag('<your_key>')) { /* … */ }
   ```
4. **Verify**: `make tsc-check`.

## Notes
- `consumeFlagOverridesFromUrl()` is already called once at app boot — no need to re-wire it.
- To flip locally without a rebuild: visit `…?ff_<your_key>=1` once, or set
  `localStorage['fintela.flags.<your_key>'] = '1'` in DevTools.
- These are **client-side** flags. The backend `/subscriptions/me` payload does not yet carry
  per-org flags (see the file header for the planned server-controlled phase) — don't assume a
  flag is enforced server-side.

## Done when
- The key is in both `FlagKey` and `DEFAULTS`, consumers read it via `useFeatureFlag` /
  `readFeatureFlag`, and `make tsc-check` passes.
