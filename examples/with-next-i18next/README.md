# Example of `zod-i18n-map` with `next-i18next` (on Next.js)

## What is this

This is an example of [`zod-i18n-map`](https://github.com/aiji42/zod-i18n) for use with [`next-i18next`](https://github.com/i18next/next-i18next).

## Setup

It is assumed that Next.js (`next`), `next-i18next`, `react-i18next`, `i18next` and `zod` are already installed.

Next.js (`next`), `next-i18next`, `react-i18next`, `i18next` and `zod` are assumed to be already installed and setup for `next-i18next`.
This document summarizes the setup specific to `zod-i18n-map`, so please refer to [the document for the setup of next-i18next](https://github.com/i18next/next-i18next).

### 1. Installation

```bash
yarn add zod-i18n-map
```

### 2. Translation content

Copy the translation files from [here](https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales) and place them in the directory for each locale under the name `zod.json`.
If there is no translation file there for your locale, create one based on `en.json`.

```
.
└── public
    └── locales
        ├── en
        |   ├── common.json
        |   └── zod.json
        |       ^^^ copy from https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json
        └── ja
            ├── common.json
            └── zod.json
                ^^^ copy from https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/ja/zod.json
```

### 3. Project setup

Update `next-i18next.config.js`.

#### `next-i18next.config.js`

```js
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "and more..."],
  },
  interpolation: {
    // https://www.i18next.com/translation-function/nesting#passing-nesting-to-interpolated
    skipOnVariables: false,
  },
};
```

### 4. Page setup

By giving the `t` method from `useTranslation` as an argument to `makeZodI18nMap` and giving it as an argument to `z.setErrorMap`, the zod error messages are automatically translated.
```ts
const { t } = useTranslation();
z.setErrorMap(makeZodI18nMap(t));
```

Finally, the page file will be as follows.

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import z from "zod";
import { makeZodI18nMap } from "zod-i18n-map";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useTranslation } from "next-i18next";

export const getServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale!)),
    },
  };
};

const schema = z.object({
  nickname: z.string().min(5),
});

export default function Page() {
  const { t } = useTranslation();
  z.setErrorMap(makeZodI18nMap(t));
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
  });
  
  return (
    <form onSubmit={handleSubmit(console.log)}>
      <label htmlFor="nickname">Nickname</label>
      <input id="nickname" {...register("nickname")} />
      {errors.nickname?.message && <p>{errors.nickname.message}</p>}
      <button type="submit">submit</button>
    </form>
  )
}
```
