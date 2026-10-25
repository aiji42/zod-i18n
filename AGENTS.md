# AGENTS.md — maintainer guide for coding agents

`zod-i18n-map` is an error map that translates Zod v4 issues through i18next. It has a CLI that copies translation JSON files into user projects. The npm package does **not** contain the translations.

## Layout

- `src/index.ts`: the whole library. `makeZodI18nMap`, `zodI18nMap`, `i18nKey`, `translateIssue`. Issues carry a `zodI18n` metadata field so `translate()` can rebuild messages later. It has no runtime dependencies except `i18next`, and imports only types from `zod/v4/core`.
- `src/validate.ts`: structural validation of a locale file. Used by both `scripts/check-locales.ts` and `cli check`.
- `src/guide.ts`: texts for agents in user projects. These are the translation rules printed by `cli scaffold` and the SKILL.md written by `cli skill`. Keep them in sync with `llms.txt` and the README.
- `src/cli.ts`: `npx zod-i18n-map add|list|check|scaffold|skill`. It has zero dependencies, fetches from `raw.githubusercontent.com/aiji42/zod-i18n/<ref>/locales/...`, and defaults to ref `v<package version>` with `main` as fallback.
- `locales/<code>/zod.json`: translations. `locales/en/zod.json` is the reference key schema. `locales/index.json` is generated and read by `cli list`.
- `scripts/check-locales.ts`: structural validation of every locale. It checks keys, variables and CLDR plural categories, and it replaces per-locale tests.
- `tests/`: vitest, English only.
- `llms.txt`: shipped in the npm package. It is the usage guide for agents working in *user* projects.

## Commands

```bash
pnpm install
pnpm check                    # lint + typecheck + locales:check + test + build. Run before you finish.
pnpm test
pnpm locales:check            # add --write after adding or removing a locale directory
pnpm format                   # biome
node dist/cli.mjs add ja --ref main --out /tmp/x/{locale}.json   # manual CLI test after `pnpm build`
```

Scripts run TypeScript directly with Node (type stripping). Don't add a TS runner.

## Rules

- **Keys are public API.** Renaming or removing a key in `locales/en/zod.json` is a breaking change (`feat!:`). When keys change:
  - update every locale (`pnpm locales:check` must pass)
  - update the key table in `README.md`
  - update `llms.txt`
- **The issue → key mapping lives in `resolve()` in `src/index.ts`.** When Zod adds an issue code or format, add a case or a `formats.*` label, a test in `tests/zodI18nMap.test.ts`, and the en key.
- **Missing translations must return `undefined`**, so that Zod falls through to its own message. Don't return English strings from code.
- Keep the library small:
  - no new runtime dependencies
  - the CLI uses only Node built-ins
  - ESM only
- Translations are for end users: clear, polite and concise. Plural keys must match `Intl.PluralRules(<code>).resolvedOptions().pluralCategories`. Use plain keys for languages with only `other`.
- Use Conventional Commit / PR titles. release-please derives versions and the CHANGELOG from them. Don't edit `CHANGELOG.md` or the version by hand.
- Don't comment on, label or close GitHub issues/PRs unless the maintainer asks you to.
