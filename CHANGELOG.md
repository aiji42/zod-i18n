# Changelog

## [3.0.1](https://github.com/aiji42/zod-i18n/compare/v3.0.0...v3.0.1) (2026-10-25)


### Bug Fixes

* work with a custom keySeparator and getFixedT keyPrefix ([#231](https://github.com/aiji42/zod-i18n/issues/231)) ([6225487](https://github.com/aiji42/zod-i18n/commit/6225487604fcb75e5baab36d9422f4f5fefc8ca0))

## [3.0.0](https://github.com/aiji42/zod-i18n/compare/v2.27.0...v3.0.0) (2026-10-25)


### ⚠ BREAKING CHANGES

* requires Zod v4. Translation files are no longer shipped in the npm package; use `npx zod-i18n-map add <locale>`. Message keys follow Zod v4 issue codes.

### Features

* rewrite for Zod v4 and stop bundling translations ([#229](https://github.com/aiji42/zod-i18n/issues/229)) ([1e0b270](https://github.com/aiji42/zod-i18n/commit/1e0b27063a148ae4e3e4ed41f11f56d806f24e3e))
