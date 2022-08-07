[![npm version](https://badge.fury.io/js/zod-i18n-map.svg)](https://badge.fury.io/js/zod-i18n-map)
[![codecov](https://codecov.io/gh/aiji42/zod-i18n/branch/main/graph/badge.svg?token=XHRXA3C2D3)](https://codecov.io/gh/aiji42/zod-i18n)
[![CI](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml)

<center>
<img src="./images/icon.png" style="max-width: 240px" />
</center>

# Zod Internationalization

This library is used to translate Zod's default error messages.

## Installation

```bash
yarn add zod-i18n-map i18next
```
This library depends on `i18next`.

## How to Use
```ts
import { z } from 'zod'
import { zodI18nMap } from 'zod-i18n-map'
// Import your language translation files
import { translation } from 'zod-i18n-map/languages/ja'

// lng and resources key depend on your locale.
i18next.init({
  lng: 'ja',
  resources: {
    ja: { translation },
  },
});
z.setErrorMap(zodI18nMap)

const schema = z.string().email()
schema.parse('foo') // メールアドレスの形式で入力してください。
```

## Translation Files
`zod-i18n-map` contains translation files for several languages. See [here](https://github.com/aiji42/zod-i18n/tree/main/packages/core/src/languages) if your language is included.
v
It is also possible to create and edit translation files. You can use [this English translation file](https://github.com/aiji42/zod-i18n/blob/main/packages/core/src/languages/en.ts) as a basis for rewriting it in your language.

If you have created a translation file for a language not yet in the repository, please send us a pull request.

## Contributing
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details