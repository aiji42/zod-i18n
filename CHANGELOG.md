# Changelog

## [3.0.0](https://github.com/aiji42/zod-i18n/compare/v2.27.0...v3.0.0) (2026-10-25)


### ⚠ BREAKING CHANGES

* requires Zod v4. Translation files are no longer shipped in the npm package; use `npx zod-i18n-map add <locale>`. Message keys follow Zod v4 issue codes.

### Features

* rewrite for Zod v4 and stop bundling translations ([#229](https://github.com/aiji42/zod-i18n/issues/229)) ([1e0b270](https://github.com/aiji42/zod-i18n/commit/1e0b27063a148ae4e3e4ed41f11f56d806f24e3e))
