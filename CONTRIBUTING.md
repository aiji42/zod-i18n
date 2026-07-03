# Contributions

:crystal_ball: Thanks for considering contributing to this project! :crystal_ball:

These guidelines will help you send a pull request.

If you're submitting an issue instead, please skip this document.

If your pull request is related to a typo or the documentation being unclear, please click on the relevant page's `Edit`
button (pencil icon) and directly suggest a correction instead.

This project was made with your goodwill. The simplest way to give back is by starring and sharing it online.

Everyone is welcome regardless of personal background.

## Development process

First fork and clone the repository.

Run:

```bash
yarn
```

Make sure everything is correctly setup with:

```bash
yarn test
```

## Create a new translation file

When creating a new translation file, copy `packages/core/locales/en/zod.json` and name the file with the locale code.

Also copy `packages/core/locales/en/zod.icu.json` (the [ICU MessageFormat](https://formatjs.github.io/docs/core-concepts/icu-syntax/) variant) and translate it the same way. Keep both files in sync: same keys, same variable names inside `{}`/`{{}}`. The only differences should be brace style (`{{var}}` vs `{var}`) and that any literal `'` in the ICU file must be escaped as `''` (ICU MessageFormat treats a lone `'` as the start of a quoted-literal section).

After creation and customization is complete, copy `packages/core/tests/integrations/en.test.ts` and create a new test file.

## How to write commit messages

We use [Conventional Commit messages](https://www.conventionalcommits.org/) to automate version management.

Most common commit message prefixes are:

* `fix:` which represents bug fixes, and generate a patch release.
* `feat:` which represents a new feature, and generate a minor release.