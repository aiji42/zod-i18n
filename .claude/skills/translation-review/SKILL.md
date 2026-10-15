---
name: translation-review
description: Review or update a zod-i18n-map locale file (locales/<code>/zod.json). Use when adding a locale, applying a community translation fix, or after keys were added to locales/en/zod.json.
---

# Translation review

1. Read `locales/en/zod.json` (reference) and `src/index.ts` (`resolve()` shows which variables each key receives and how `types.*` / `formats.*` labels are inserted).
2. Read the target `locales/<code>/zod.json`. If it is a community PR, read the PR's file with read-only GitHub tools. Don't comment on the PR unless asked.
3. Check each message:
   - **Meaning:** it must match the English message. Common past mistakes:
     - date-only messages translated as "date and time"
     - `number.exact` translated as "contain N characters"
     - "discriminator" translated as social discrimination
   - **Grammar:** templates must stay correct with every `types.*` / `formats.*` label inserted, including grammatical case and gender.
   - **Plurals:** `node -e 'console.log(new Intl.PluralRules("<code>").resolvedOptions().pluralCategories)'`. Use exactly those suffixes, or plain keys if the only category is `other`.
   - Use the same terminology and punctuation style throughout the file.
4. Run `pnpm locales:check` (add `--write` for a new locale). It must report no problems for the locale.
5. Render a few real messages to proofread in context, e.g. a scratch script using `makeZodI18nMap` with `i18next.init({ lng: "<code>", resources: { "<code>": { zod: file } } })`.
6. Commit as `fix(<code>): ...` or `feat(locale): add <code>`, and credit community authors with a `Co-authored-by:` trailer.
