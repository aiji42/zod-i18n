# Contributing

Thanks for helping! Most contributions are translation fixes or new locales, and they don't require any JavaScript.

## Setup

```bash
corepack enable    # provides the pinned pnpm version
pnpm install
pnpm check         # lint, typecheck, locale validation, tests and build
```

## Translations

`locales/en/zod.json` is the reference file. Every other `locales/<code>/zod.json` must have the same keys.

- **Fix a translation:** edit the file and open a pull request. Please explain why the new wording is better. Native speakers are the best reviewers.
- **Add a locale:**
  1. Run `node src/cli.ts scaffold <code> --ref main`, or copy `locales/en/zod.json` to `locales/<code>/zod.json`, using an [i18next language code](https://www.i18next.com/how-to/faq#how-should-the-language-codes-be-formatted), e.g. `pt-BR`.
  2. Translate it.
  3. Run `pnpm locales:check --write`. This validates the file and registers the code in `locales/index.json`.

The translations are shown to the end users of forms and APIs, so prefer clear, polite wording over technical jargon.

`pnpm locales:check` verifies that:

- the file is valid JSON and has exactly the keys of the English file
- it uses only variables that exist for each key (e.g. `{{count}}`, `{{- options}}`)
- plural keys (`_one`, `_few`, `_other`, ...) match the plural categories of that language. If your language doesn't inflect, use the plain key without a suffix.

If the generic `errors.invalid_format.default` ("Invalid {{format}}") can't be grammatical for every format label in your language, add specific keys for the common formats, e.g. `errors.invalid_format.email`. Every key under `formats.*` can have one of these.

Messages are plain text: the library turns off i18next's HTML escaping, so `{{name}}` and `{{- name}}` behave the same. Keep the English file's form for consistency.

## Code

- `src/index.ts`: the error map. It maps each Zod v4 issue to a translation key and its variables.
- `src/cli.ts`: the `npx zod-i18n-map` CLI. It has no dependencies and uses `fetch` and `node:util`'s `parseArgs`.
- `tests/`: tests run with the English file only. Translations are validated by `scripts/check-locales.ts`.

If you add or rename a key, update `locales/en/zod.json`, every other locale (at least with English text plus a note in the PR), the key table in `README.md`, and `llms.txt`.

## Commit messages and releases

Pull requests are squash-merged, and the **PR title** becomes the commit message. Please use [Conventional Commits](https://www.conventionalcommits.org/):

- `fix: ...` / `fix(ja): ...`: bug or translation fix, released as a patch version
- `feat: ...` / `feat(locale): add pt-BR`: new feature or locale, released as a minor version
- `feat!: ...` or a `BREAKING CHANGE:` footer: released as a major version
- `docs:`, `chore:`, `test:`, `refactor:`: no release

Releases are automated with [release-please](https://github.com/googleapis/release-please). It keeps a release PR open, and merging that PR publishes to npm.
