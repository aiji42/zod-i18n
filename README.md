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

// export configured zod instance
export { z }
```

Import wherever it's required

```ts
import { z } from "./es-zod";

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
- [Bulgarian(bg)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/bg/zod.json)
- [Czech(cs)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/cs/zod.json)
- [German(de)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/de/zod.json)
- [English(en)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json)
- [Spanish(es)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/es/zod.json)
- [Persian(fa)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/fa/zod.json)
- [Finnish(fi)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/fi/zod.json)
- [French(fr)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/fr/zod.json)
- [Hebrew(he)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/he/zod.json)
- [Croatian(hr-Hr)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/hr-He/zod.json)
- [Indonesian(id)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/id/zod.json)
- [Icelandic(is)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/is/zod.json)
- [Italian(it)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/it/zod.json)
- [Japanese(ja)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ja/zod.json)
- [Korean(ko)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ko/zod.json)
- [Lithuanian(lt)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/lt/zod.json)
- [Norwegian(nb)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/nb/zod.json)
- [Dutch(nl)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/nl/zod.json)
- [Polish(pl)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/pl/zod.json)
- [Portuguese(pt)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/pt/zod.json)
- [Romanian(ro)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ro/zod.json)
- [Russian(ru)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ru/zod.json)
- [Swedish(sv)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/sv/zod.json)
- [Turkish(tr)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/tr/zod.json)
- [Ukrainian(uk-UA)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/uk-UA/zod.json)
- [Uzbek(uz)](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/uz/zod.json)
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

![Contributors icons](https://contrib.nn.ci/api?repo=aiji42/zod-i18n)