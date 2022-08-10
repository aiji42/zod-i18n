[![npm version](https://badge.fury.io/js/zod-i18n-map.svg)](https://badge.fury.io/js/zod-i18n-map)
[![codecov](https://codecov.io/gh/aiji42/zod-i18n/branch/main/graph/badge.svg?token=XHRXA3C2D3)](https://codecov.io/gh/aiji42/zod-i18n)
[![CI](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml)

![hero](https://raw.githubusercontent.com/aiji42/zod-i18n/main/images/hero.png)

# Zod Internationalization

This library is used to translate Zod's default error messages.

## Installation

```bash
yarn add zod-i18n-map i18next
```
This library depends on `i18next`.

## How to Use
```ts
import i18next from 'i18next'
import { z } from 'zod'
import { zodI18nMap } from 'zod-i18n-map'
// Import your language translation files
import translation from 'zod-i18n-map/languages/ja.json'

// lng and resources key depend on your locale.
i18next.init({
  lng: 'ja',
  resources: {
    ja: { zod: translation },
  },
  interpolation: {
    // https://www.i18next.com/translation-function/nesting#passing-nesting-to-interpolated
    skipOnVariables: false
  }
});
z.setErrorMap(zodI18nMap)

const schema = z.string().email()
schema.parse('foo') // メールアドレスの形式で入力してください。
```

## Translation Files
`zod-i18n-map` contains translation files for several languages. See [here](https://github.com/aiji42/zod-i18n/tree/main/packages/core/languages) if your language is included.

It is also possible to create and edit translation files. You can use [this English translation file](https://github.com/aiji42/zod-i18n/blob/main/packages/core/languages/en.json) as a basis for rewriting it in your language.

If you have created a translation file for a language not yet in the repository, please send us a pull request.

## Use with `next-i18next`

Many users will want to use it with `next-i18next` (i.e. on Next.js). [This example](https://github.com/aiji42/zod-i18n/tree/main/examples/with-next-i18next) summarizes how to use with it.

## Contributing
Please read [CONTRIBUTING.md](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) file for details