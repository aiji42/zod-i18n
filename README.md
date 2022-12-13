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
import translation from 'zod-i18n-map/locales/ja/zod.json'

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
`zod-i18n-map` contains translation files for several locals. See [here](https://github.com/aiji42/zod-i18n/tree/main/packages/core/locales) if your language is included.

It is also possible to create and edit translation files. You can use [this English translation file](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json) as a basis for rewriting it in your language.

If you have created a translation file for a language not yet in the repository, please send us a pull request.

## Use with `next-i18next`

Many users will want to use it with `next-i18next` (i.e. on Next.js). [This example](https://github.com/aiji42/zod-i18n/tree/main/examples/with-next-i18next) summarizes how to use with it.

## Contributing
Please read [CONTRIBUTING.md](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) file for details

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-6-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center"><a href="https://github.com/aiji42"><img src="https://avatars.githubusercontent.com/u/6711766?v=4?s=100" width="100px;" alt="Aiji Uejima"/><br /><sub><b>Aiji Uejima</b></sub></a><br /><a href="https://github.com/aiji42/zod-i18n/commits?author=aiji42" title="Code">💻</a> <a href="#translation-aiji42" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=aiji42" title="Tests">⚠️</a> <a href="#ideas-aiji42" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center"><a href="https://github.com/ismailajizou"><img src="https://avatars.githubusercontent.com/u/64745987?v=4?s=100" width="100px;" alt="Ismail Ajizou"/><br /><sub><b>Ismail Ajizou</b></sub></a><br /><a href="#translation-ismailajizou" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=ismailajizou" title="Tests">⚠️</a></td>
      <td align="center"><a href="http://maher.app"><img src="https://avatars.githubusercontent.com/u/10340702?v=4?s=100" width="100px;" alt="Mohammed Maher"/><br /><sub><b>Mohammed Maher</b></sub></a><br /><a href="#translation-maherapp" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=maherapp" title="Tests">⚠️</a></td>
      <td align="center"><a href="https://github.com/montedonioluiz"><img src="https://avatars.githubusercontent.com/u/36773088?v=4?s=100" width="100px;" alt="Luiz Oliveira Montedonio"/><br /><sub><b>Luiz Oliveira Montedonio</b></sub></a><br /><a href="#translation-montedonioluiz" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=montedonioluiz" title="Tests">⚠️</a></td>
      <td align="center"><a href="https://github.com/izayoi-hibiki"><img src="https://avatars.githubusercontent.com/u/23469365?v=4?s=100" width="100px;" alt="Izayoi Hibiki"/><br /><sub><b>Izayoi Hibiki</b></sub></a><br /><a href="#translation-izayoi-hibiki" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=izayoi-hibiki" title="Tests">⚠️</a></td>
      <td align="center"><a href="https://hrafnkellbaldurs.com/"><img src="https://avatars.githubusercontent.com/u/5609118?v=4?s=100" width="100px;" alt="Hrafnkell Baldursson"/><br /><sub><b>Hrafnkell Baldursson</b></sub></a><br /><a href="#translation-hrafnkellbaldurs" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=hrafnkellbaldurs" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
