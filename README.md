# Zod I18n

This library is used to translate Zod's default error messages.

## Installation

```bash
yarn add zpdi18n i18next
```
This library depends on `i18next`.

## How to Use
```ts
import { z } from 'zod'
import { errorMapping } from 'zodi18n'
// Import your language translation files
import { translation } from 'zodi18n/languages/ja'

// lng and resources key depend on your locale.
i18next.init({
  lng: 'ja',
  resources: {
    ja: { translation },
  },
});
z.setErrorMap(errorMapping)

const schema = z.string().email()
schema.parse('foo') // メールアドレスの形式で入力してください。
```

## Translation File
`zodi18n` contains translation files for several languages. See [here](https://github.com/aiji42/zod-i18n/tree/main/packages/zodi18n/src/languages) if your language is included.

It is also possible to create and edit translation files. You can use [this English translation file](https://github.com/aiji42/zod-i18n/blob/main/packages/zodi18n/src/languages/en.ts) as a basis for rewriting it in your language.

If you have created a translation file for a language not yet in the repository, please send us a pull request.

## Contributing
Please read [CONTRIBUTING.md](./CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details