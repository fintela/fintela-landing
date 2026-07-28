// i18next type augmentation. Key-level type-checking is relaxed during the full
// extraction pass (no `resources` map) so buckets can add namespaces without
// all editing this file; completeness is gated by the `no-literal-string` rule
// and scripts/i18n-keysync.mjs. `returnNull: false` keeps `t()` typed as string.
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false;
  }
}
