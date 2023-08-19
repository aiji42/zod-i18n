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
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
// Import your language translation files
import translation from "zod-i18n-map/locales/es/zod.json";

// lng and resources key depend on your locale.
i18next.init({
  lng: "es",
  resources: {
    es: { zod: translation },
  },
});
z.setErrorMap(zodI18nMap);

const schema = z.string().email();
// Translated into Spanish (es)
schema.parse("foo"); // => correo inválido
```

## `makeZodI18nMap`

Detailed customization is possible by using `makeZodI18nMap` and option values.

```ts
export type MakeZodI18nMap = (option?: ZodI18nMapOption) => ZodErrorMap;

export type ZodI18nMapOption = {
  t?: i18n["t"];
  ns?: string | readonly string[]; // See: `Namespace`
  handlePath?: {
    // See: `Handling object schema keys`
    keyPrefix?: string;
  };
};
```

### Namespace (`ns`)

You can switch between translation files by specifying a namespace.
This is useful in cases where the application handles validation messages for different purposes, e.g., validation messages for forms are for end users, while input value checks for API schemas are for developers.

The default namespace is `zod`.

```ts
import i18next from "i18next";
import { z } from "zod";
import { makeZodI18nMap } from "zod-i18n-map";

i18next.init({
  lng: "en",
  resources: {
    en: {
      zod: {
        // default namespace
        invalid_type: "Error: expected {{expected}}, received {{received}}",
      },
      formValidation: {
        // custom namespace
        invalid_type:
          "it is expected to provide {{expected}} but you provided {{received}}",
      },
    },
  },
});

// use default namespace
z.setErrorMap(makeZodI18nMap());
z.string().parse(1); // => Error: expected string, received number

// select custom namespace
z.setErrorMap(makeZodI18nMap({ ns: "formValidation" }));
z.string().parse(1); // => it is expected to provide string but you provided number
```

📝 **You can also specify multiple namespaces in an array.**

### Plurals

Messages using `{{maximum}}`, `{{minimum}}` or `{{keys}}` can be converted to the plural form.

Keys are i18next compliant. (https://www.i18next.com/translation-function/plurals)

```json
{
  "exact_one": "String must contain exactly {{minimum}} character",
  "exact_other": "String must contain exactly {{minimum}} characters"
}
```

```ts
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";

i18next.init({
  lng: "en",
  resources: {
    en: {
      zod: {
        errors: {
          too_big: {
            string: {
              exact_one: "String must contain exactly {{maximum}} character",
              exact_other: "String must contain exactly {{maximum}} characters",
            },
          },
        },
      },
    },
  },
});

z.setErrorMap(zodI18nMap);

z.string().length(1).safeParse("abc"); // => String must contain exactly 1 character

z.string().length(5).safeParse("abcdefgh"); // => String must contain exactly 5 characters
```

### Custom errors

You can translate also custom errors, for example errors from `refine`.

Create a key for the custom error in a namespace and add `i18n` to the refine second arg(see example)

```ts
import i18next from "i18next";
import { z } from "zod";
import { makeZodI18nMap } from "zod-i18n-map";
import translation from "zod-i18n-map/locales/en/zod.json";

i18next.init({
  lng: "en",
  resources: {
    en: {
      zod: translation,
      custom: {
        my_error_key: "Something terrible",
        my_error_key_with_value: "Something terrible {{msg}}",
      },
    },
  },
});

z.setErrorMap(makeZodI18nMap({ ns: ["zod", "custom"] }));

z.string()
  .refine(() => false, { params: { i18n: "my_error_key" } })
  .safeParse(""); // => Something terrible

// Or

z.string()
  .refine(() => false, {
    params: {
      i18n: { key: "my_error_key_with_value", values: { msg: "happened" } },
    },
  })
  .safeParse(""); // => Something terrible happened
```

### Handling object schema keys (`handlePath`)

When dealing with structured data, such as when using Zod as a validator for form input values, it is common to generate a schema with `z.object`.
You can handle the object's key in the message by preparing messages with the key in the `with_path` context.

```ts
import i18next from "i18next";
import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";

i18next.init({
  lng: "en",
  resources: {
    en: {
      zod: {
        errors: {
          invalid_type: "Expected {{expected}}, received {{received}}",
          invalid_type_with_path:
            "{{path}} is expected {{expected}}, received {{received}}",
        },
        userName: "User's name",
      },
    },
  },
});

z.setErrorMap(zodI18nMap);

z.string().parse(1); // => Expected string, received number

const schema = z.object({
  userName: z.string(),
});
schema.parse({ userName: 1 }); // => User's name is expected string, received number
```

If `_with_path` is suffixed to the key of the message, that message will be adopted in the case of an object type schema.
If there is no message key with `_with_path`, fall back to the normal error message.

Object schema keys can be handled in the message with `{{path}}`.
By preparing the translated data for the same key as the key in the object schema, the translated value will be output in `{{path}}`, otherwise the key will be output as is.
It is possible to access nested translation data by specifying `handlePath.keyPrefix`.

```ts
i18next.init({
  lng: "en",
  resources: {
    en: {
      zod: {
        errors: {
          invalid_type: "Expected {{expected}}, received {{received}}",
          invalid_type_with_path:
            "{{- path}} is expected {{expected}}, received {{received}}",
        },
      },
      form: {
        paths: {
          userName: "User's name",
        },
      },
    },
  },
});

z.setErrorMap(
  zodI18nMap({
    ns: ["zod", "form"],
    handlePath: {
      keyPrefix: "paths",
    },
  })
);
```

## Translation Files

`zod-i18n-map` contains translation files for several locales.

- [Arabic(ar)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ar/zod.json)
- [German(de)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/de/zod.json)
- [English(en)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json)
- [Spanish(es)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/es/zod.json)
- [French(fr)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/fr/zod.json)
- [Hebrew(he)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/he/zod.json)
- [Icelandic(is)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/is/zod.json)
- [Italian(it)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/it/zod.json)
- [Japanese(ja)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ja/zod.json)
- [Lithuanian(lt)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/lt/zod.json)
- [Norwegian(nb)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/nb/zod.json)
- [Dutch(nl)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/nl/zod.json)
- [Polish(pl)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/pl/zod.json)
- [Portuguese(pt)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/pt/zod.json)
- [Russian(ru)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ru/zod.json)
- [Romanian(ro)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ro/zod.json)
- [Swedish(sv)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/sv/zod.json)
- [Turkish(tr)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/tr/zod.json)
- Chinese
  - [Simplified Chinese(zh-CN)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/zh-CN/zod.json)
  - [Traditional Chinese(zh-TW)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/zh-TW/zod.json)

It is also possible to create and edit translation files. You can use [this English translation file](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json) as a basis for rewriting it in your language.

**If you have created a translation file for a language not yet in the repository, please send us a pull request.**

## Use with `next-i18next`

Many users will want to use it with `next-i18next` (i.e. on Next.js). [This example](https://github.com/aiji42/zod-i18n/tree/main/examples/with-next-i18next) summarizes how to use with it.

## Contributing

Please read [CONTRIBUTING.md](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## License

This project is licensed under the MIT License - see the [LICENSE](https://github.com/aiji42/zod-i18n/tree/main/CONTRIBUTING.md) file for details

## Contributors ✨

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-28-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/aiji42"><img src="https://avatars.githubusercontent.com/u/6711766?v=4?s=100" width="100px;" alt="Aiji Uejima"/><br /><sub><b>Aiji Uejima</b></sub></a><br /><a href="https://github.com/aiji42/zod-i18n/commits?author=aiji42" title="Code">💻</a> <a href="#translation-aiji42" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=aiji42" title="Tests">⚠️</a> <a href="#ideas-aiji42" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/ismailajizou"><img src="https://avatars.githubusercontent.com/u/64745987?v=4?s=100" width="100px;" alt="Ismail Ajizou"/><br /><sub><b>Ismail Ajizou</b></sub></a><br /><a href="#translation-ismailajizou" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=ismailajizou" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://maher.app"><img src="https://avatars.githubusercontent.com/u/10340702?v=4?s=100" width="100px;" alt="Mohammed Maher"/><br /><sub><b>Mohammed Maher</b></sub></a><br /><a href="#translation-maherapp" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=maherapp" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/montedonioluiz"><img src="https://avatars.githubusercontent.com/u/36773088?v=4?s=100" width="100px;" alt="Luiz Oliveira Montedonio"/><br /><sub><b>Luiz Oliveira Montedonio</b></sub></a><br /><a href="#translation-montedonioluiz" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=montedonioluiz" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/izayoi-hibiki"><img src="https://avatars.githubusercontent.com/u/23469365?v=4?s=100" width="100px;" alt="Izayoi Hibiki"/><br /><sub><b>Izayoi Hibiki</b></sub></a><br /><a href="#translation-izayoi-hibiki" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=izayoi-hibiki" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://hrafnkellbaldurs.com/"><img src="https://avatars.githubusercontent.com/u/5609118?v=4?s=100" width="100px;" alt="Hrafnkell Baldursson"/><br /><sub><b>Hrafnkell Baldursson</b></sub></a><br /><a href="#translation-hrafnkellbaldurs" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=hrafnkellbaldurs" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://arturolopez.co"><img src="https://avatars.githubusercontent.com/u/35613775?v=4?s=100" width="100px;" alt="Arturo"/><br /><sub><b>Arturo</b></sub></a><br /><a href="#translation-Arturo-Lopez" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=Arturo-Lopez" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/nicksulkers"><img src="https://avatars.githubusercontent.com/u/13705408?v=4?s=100" width="100px;" alt="Nick Sulkers"/><br /><sub><b>Nick Sulkers</b></sub></a><br /><a href="#translation-nicksulkers" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=nicksulkers" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/irrelevation"><img src="https://avatars.githubusercontent.com/u/5075175?v=4?s=100" width="100px;" alt="Lukas"/><br /><sub><b>Lukas</b></sub></a><br /><a href="#translation-irrelevation" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=irrelevation" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.yodaka-star.com/profile"><img src="https://avatars.githubusercontent.com/u/44350989?v=4?s=100" width="100px;" alt="yodaka"/><br /><sub><b>yodaka</b></sub></a><br /><a href="#translation-yodakaEngineer" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/issues?q=author%3AyodakaEngineer" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://tomer.fly.dev/"><img src="https://avatars.githubusercontent.com/u/32360493?v=4?s=100" width="100px;" alt="Tomer Yechiel"/><br /><sub><b>Tomer Yechiel</b></sub></a><br /><a href="https://github.com/aiji42/zod-i18n/commits?author=tomer-yechiel" title="Code">💻</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=tomer-yechiel" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://leonardomontini.dev/"><img src="https://avatars.githubusercontent.com/u/7253929?v=4?s=100" width="100px;" alt="Leonardo Montini"/><br /><sub><b>Leonardo Montini</b></sub></a><br /><a href="#translation-Balastrong" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=Balastrong" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/lSelectral"><img src="https://avatars.githubusercontent.com/u/43554487?v=4?s=100" width="100px;" alt="Recep Çiftçi"/><br /><sub><b>Recep Çiftçi</b></sub></a><br /><a href="#translation-lSelectral" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=lSelectral" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://terawatthour.dev"><img src="https://avatars.githubusercontent.com/u/65347730?v=4?s=100" width="100px;" alt="TeraWattHour"/><br /><sub><b>TeraWattHour</b></sub></a><br /><a href="#translation-TeraWattHour" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=TeraWattHour" title="Tests">⚠️</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://yeecord.com/"><img src="https://avatars.githubusercontent.com/u/33802653?v=4?s=100" width="100px;" alt="凱恩Kane"/><br /><sub><b>凱恩Kane</b></sub></a><br /><a href="#translation-Gary50613" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=Gary50613" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/fcrozatier"><img src="https://avatars.githubusercontent.com/u/48696601?v=4?s=100" width="100px;" alt="fcrozatier"/><br /><sub><b>fcrozatier</b></sub></a><br /><a href="#translation-fcrozatier" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/issues?q=author%3Afcrozatier" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/trondal"><img src="https://avatars.githubusercontent.com/u/1000199?v=4?s=100" width="100px;" alt="Trond Albinussen"/><br /><sub><b>Trond Albinussen</b></sub></a><br /><a href="#translation-trondal" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=trondal" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://chrisgvdev.com"><img src="https://avatars.githubusercontent.com/u/47041342?v=4?s=100" width="100px;" alt="Christian Gil"/><br /><sub><b>Christian Gil</b></sub></a><br /><a href="#translation-ChrisGV04" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/issues?q=author%3AChrisGV04" title="Bug reports">🐛</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://manchenkoff.me"><img src="https://avatars.githubusercontent.com/u/6690063?v=4?s=100" width="100px;" alt="Artem Manchenkov"/><br /><sub><b>Artem Manchenkov</b></sub></a><br /><a href="#translation-manchenkoff" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=manchenkoff" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://greener.bio"><img src="https://avatars.githubusercontent.com/u/41754896?v=4?s=100" width="100px;" alt="Teodoro Villanueva"/><br /><sub><b>Teodoro Villanueva</b></sub></a><br /><a href="https://github.com/aiji42/zod-i18n/commits?author=teovillanueva" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/wjsymagic"><img src="https://avatars.githubusercontent.com/u/25776648?v=4?s=100" width="100px;" alt="Willem Jan Weitering"/><br /><sub><b>Willem Jan Weitering</b></sub></a><br /><a href="#translation-wjsymagic" title="Translation">🌍</a></td>
    </tr>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/MendyLanda"><img src="https://avatars.githubusercontent.com/u/54242706?v=4?s=100" width="100px;" alt="Mendy Landa"/><br /><sub><b>Mendy Landa</b></sub></a><br /><a href="#translation-MendyLanda" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=MendyLanda" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/itispx"><img src="https://avatars.githubusercontent.com/u/44107896?v=4?s=100" width="100px;" alt="Px (Guilherme Ciota)"/><br /><sub><b>Px (Guilherme Ciota)</b></sub></a><br /><a href="#translation-itispx" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="http://sralab.com"><img src="https://avatars.githubusercontent.com/u/1815?v=4?s=100" width="100px;" alt="Stéphane Raimbault"/><br /><sub><b>Stéphane Raimbault</b></sub></a><br /><a href="#translation-stephane" title="Translation">🌍</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/gabinbernard"><img src="https://avatars.githubusercontent.com/u/96436168?v=4?s=100" width="100px;" alt="gabinbernard"/><br /><sub><b>gabinbernard</b></sub></a><br /><a href="#translation-gabinbernard" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=gabinbernard" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.gabrielmajeri.ro"><img src="https://avatars.githubusercontent.com/u/3010346?v=4?s=100" width="100px;" alt="Gabriel Majeri"/><br /><sub><b>Gabriel Majeri</b></sub></a><br /><a href="#translation-GabrielMajeri" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=GabrielMajeri" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://kudze.lt"><img src="https://avatars.githubusercontent.com/u/14080617?v=4?s=100" width="100px;" alt="Karolis Kraujelis"/><br /><sub><b>Karolis Kraujelis</b></sub></a><br /><a href="#translation-Kudze" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=Kudze" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/demptd13"><img src="https://avatars.githubusercontent.com/u/103131906?v=4?s=100" width="100px;" alt="Ihor"/><br /><sub><b>Ihor</b></sub></a><br /><a href="#translation-demptd13" title="Translation">🌍</a> <a href="https://github.com/aiji42/zod-i18n/commits?author=demptd13" title="Tests">⚠️</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
