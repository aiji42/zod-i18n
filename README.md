[![npm version](https://img.shields.io/npm/v/zod-i18n-map)](https://www.npmjs.com/package/zod-i18n-map)
[![CI](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml/badge.svg)](https://github.com/aiji42/zod-i18n/actions/workflows/ci.yml)

![hero](https://raw.githubusercontent.com/aiji42/zod-i18n/main/images/hero.png)

# zod-i18n-map

Translate [Zod](https://zod.dev) error messages with [i18next](https://www.i18next.com).

Zod v4 ships built-in locales (`z.config(z.locales.ja())`). Those are global and use fixed wording. Use this library when you need any of the following:

- **Your app chooses the language**: i18next picks it, and you can switch per user or per request on the server.
- **You own the wording**: the translations are plain i18next JSON files in your repository.
- **Field names in messages**: for example "Email is required" instead of "Required".
- **Your own translation keys** on any schema, check or refinement, with access to values like `{{count}}`.

> Using Zod v3? Stay on [`zod-i18n-map@2`](https://github.com/aiji42/zod-i18n/tree/zod-i18n-map-v2.27.0).

## Quick start

```bash
npm install zod-i18n-map i18next zod
npx zod-i18n-map add en ja        # writes locales/en/zod.json and locales/ja/zod.json
```

The translation files are **not** included in the npm package. The CLI copies them into your project, and from then on you edit them like any other resource file.

```ts
import i18next from "i18next";
import * as z from "zod";
import { zodI18nMap } from "zod-i18n-map";
import ja from "./locales/ja/zod.json";

await i18next.init({
  lng: "ja",
  resources: { ja: { zod: ja } },
});
z.config({ customError: zodI18nMap });

z.email().safeParse("foo").error?.issues[0]?.message;
// => "メールアドレスの形式で入力してください。"
```

If a key is missing, Zod's own message is used instead. That is either English or the built-in Zod locale you configured with `z.config(z.locales.xx())`.

## Translation files

```bash
npx zod-i18n-map list                    # available locales
npx zod-i18n-map add de fr               # -> locales/{locale}/zod.json
npx zod-i18n-map add de --out public/locales/{locale}/zod.json
npx zod-i18n-map add de --force          # overwrite an existing file
npx zod-i18n-map check locales/de/zod.json   # validate: missing keys, unknown variables, plural forms
npx zod-i18n-map add de --format icu     # ICU MessageFormat, for i18next-icu
```

- By default, files come from the Git tag that matches your installed version, so they always match the key layout your version expects. Use `--ref <tag|branch|sha>` to pick another source.
- Use `--json` to get machine-readable output.
- The source files are in [`locales/`](./locales). You can also download them directly or load them at runtime from a CDN, e.g. with [i18next-http-backend](https://github.com/i18next/i18next-http-backend):
  `https://cdn.jsdelivr.net/gh/aiji42/zod-i18n@v3.0.0/locales/ja/zod.json`

- If your app uses [i18next-icu](https://github.com/i18next/i18next-icu), use `--format icu`. The files are converted to ICU MessageFormat: `{name}`, `{minimum, date}`, and plurals merged into `{count, plural, ...}`. i18next contexts don't work with i18next-icu, so the `_with_path` variants are not used. `{path}` is still passed to every message.

**Available locales:** ar, bg, bn, ca, cs, da, de, el, en, es, et, fa, fi, fr, he, hi, hr, hu, id, is, it, ja, ka, ko, lt, lv, ms, nb, nl, pl, pt-BR, pt-PT, ro, ru, sk, sl, sr, sr-Latn, sv, th, tr, uk, uz, vi, zh-CN, zh-TW.
Something wrong or missing? Pull requests are welcome, see [CONTRIBUTING.md](./CONTRIBUTING.md).

## Usage

### Per request (servers, RSC, edge)

You don't have to set the error map globally. Zod v4 accepts an error map for each parse:

```ts
import { makeZodI18nMap } from "zod-i18n-map";

const error = makeZodI18nMap({ t: i18next.getFixedT(request.locale) });
const result = schema.safeParse(body, { error });
```

`t` can be any i18next-compatible translate function: `i18next.t`, `getFixedT(...)`, or react-i18next's `useTranslation().t`.

### Re-translating shown errors after a language switch

Messages are created when a value is parsed. If the user switches languages while errors are on screen (e.g. kept in react-hook-form state), translate the issues again when you render them:

```tsx
import { translateIssue } from "zod-i18n-map";

{result.error.issues.map((issue) => <p key={issue.path.join(".")}>{translateIssue(issue)}</p>)}
```

This needs Zod 4.4 or later; on older versions it returns `issue.message` unchanged. It works because the map stores a small `zodI18n` field on each issue it handles, with the received type and any `i18nKey`. So the message can be rebuilt in full, field names included. Issues whose message came from your own `error` string are returned unchanged. With a custom map, use `map.translate(issue)`.

### Your own keys for specific fields

Use `i18nKey` (or `.key()` on a map you created) as the `error` of any schema or check. All the issue's values (`count`, `minimum`, `maximum`, `path`, ...) are available for interpolation:

```ts
import { i18nKey } from "zod-i18n-map";

// zod.json: { "password": { "too_short": "Use at least {{count}} characters" } }
const password = z.string().min(8, { error: i18nKey("password.too_short") });

// Keys from another namespace use i18next's `ns:key` syntax, extra values go in the 2nd argument
const email = z.email({ error: i18nKey("form:email_invalid", { example: "you@example.com" }) });
```

For refinements, `params.i18n` works too:

```ts
z.string().refine((v) => v !== "admin", { params: { i18n: "username.reserved" } });
z.string().refine(isAllowed, {
  params: { i18n: { key: "username.not_allowed", values: { name: "admin" } } },
});
```

If the custom key is missing, the default translation for that issue is used.

### Field names in messages (`handlePath`)

If the issue has a path, the `with_path` [context](https://www.i18next.com/translation-function/context) variant of a message is used when it exists. `{{path}}` holds the translated field name:

```jsonc
// locales/en/zod.json
{
  "errors": {
    "invalid_type_received_undefined": "Required",
    "invalid_type_received_undefined_with_path": "{{- path}} is required"
  },
  "email": "Email address"
}
```

```ts
z.object({ email: z.email() }).parse({}); // => "Email address is required"
```

- Field names are looked up by the joined path (`user.email`). If that key is missing, they are looked up again without array indices (`items.0.name` → `items.name`). If both are missing, the raw path is used.
- Use `handlePath: { ns: "form", keyPrefix: "fields" }` to keep labels elsewhere. With that setting, `form:fields.user.email` is looked up.
- Use `context: "..."` to change the context suffix, or `handlePath: false` to turn this off.

### Plurals

Messages that receive `{{count}}` use [i18next plurals](https://www.i18next.com/translation-function/plurals), so each language can use the right forms:

```json
{ "inclusive_one": "At least {{count}} character", "inclusive_other": "At least {{count}} characters" }
```

### Namespaces

Messages are looked up in the `zod` namespace by default. Use a different namespace for each audience, for example end-user forms and developer-facing APIs:

```ts
z.config({ customError: makeZodI18nMap({ ns: "formErrors" }) });
// several namespaces are searched in order
makeZodI18nMap({ ns: ["formErrors", "zod"] });
```

## API

```ts
makeZodI18nMap(options?: {
  t?: TranslateFunction;                 // default: i18next.t
  ns?: string | readonly string[];       // default: "zod"
  handlePath?: false | {
    context?: string;                    // default: "with_path"
    ns?: string | readonly string[];     // default: same as ns
    keyPrefix?: string;
  };
}): ZodI18nMap

zodI18nMap: ZodI18nMap                   // makeZodI18nMap() with defaults
zodI18nMap.key(key, values?)             // error map that tries `key` first
i18nKey(key, values?)                    // = zodI18nMap.key
zodI18nMap.translate(issue)              // re-translate an existing issue in the current language
translateIssue(issue)                    // = zodI18nMap.translate
```

`ZodI18nMap` is a regular Zod v4 error map. You can use it in `z.config({ customError })`, in a parse's `{ error }`, or in a schema's `{ error }`.

## Message keys

| Zod issue | Key | Variables |
| --- | --- | --- |
| `invalid_type` | `errors.invalid_type`<br>`errors.invalid_type_received_undefined`<br>`errors.invalid_type_received_null` | `expected`, `received` (translated via `types.*`) |
| `invalid_value` | `errors.invalid_value`<br>`errors.invalid_value_single` (one allowed value, e.g. `z.literal`) | `options` / `expected` |
| `invalid_format` | `errors.invalid_format.<format>`, otherwise `errors.invalid_format.default` | `format` (translated via `formats.*`), `pattern`, `prefix`, `suffix`, `includes` |
| `too_small` / `too_big` | `errors.too_small.<origin>.<exact\|inclusive\|not_inclusive>`. Origins are `string`, `number` (incl. `int`, `bigint`), `array`, `set`, `map`, `file` and `date`. | `minimum` / `maximum`, `count` |
| `not_multiple_of` | `errors.not_multiple_of` | `divisor` |
| `unrecognized_keys` | `errors.unrecognized_keys` | `keys`, `count` |
| `invalid_key` / `invalid_element` | `errors.invalid_key` / `errors.invalid_element` | `origin` |
| `invalid_union` | `errors.invalid_union`<br>`errors.invalid_union_discriminator` | `options`, `discriminator` |
| `custom` | `errors.custom`, or the key given via `params.i18n` | your `values` |

Every message also receives `path` when `handlePath` is on. See [`locales/en/zod.json`](./locales/en/zod.json) for the full reference file.

## Migrating from v2

- **Zod v4 is required.** With `zod@3.25`, import from `zod/v4`.
- **Setup:** replace `z.setErrorMap(zodI18nMap)` with `z.config({ customError: zodI18nMap })`.
- **Translation files are no longer imported from the package.** Replace `import translation from "zod-i18n-map/locales/ja/zod.json"` with a file you get from `npx zod-i18n-map add ja`.
- **Keys follow Zod v4 issue codes:**
  - `invalid_string.*` → `invalid_format.*`
  - `validations.*` → `formats.*`
  - `invalid_enum_value` / `invalid_literal` → `invalid_value` / `invalid_value_single`
  - `{{multipleOf}}` → `{{divisor}}`
  - `invalid_date`, `invalid_arguments`, `invalid_return_type`, `invalid_intersection_types`, `not_finite` and the `too_small.set` / `too_big.set` "Invalid input" placeholders were removed or replaced, because Zod v4 no longer emits them.
  - If you customized a v2 file, start from the new file and copy your wording over. `npx zod-i18n-map check` lists the keys you are missing.
- **Locale codes:** `hr-HR` → `hr`, `uk-UA` → `uk`, `pt` → `pt-BR` (it was always Brazilian Portuguese; European Portuguese is now `pt-PT`). (You choose the file name, so any i18next language code works.)

## Any language, with your coding agent

The translation files belong to you, so a language that isn't listed is one command away:

```bash
npx zod-i18n-map scaffold sw     # copies the English file and prints translation rules for Swahili
# ...let your coding agent (or a human) translate locales/sw/zod.json...
npx zod-i18n-map check locales/sw/zod.json   # verifies keys, {{variables}} and the plural forms Swahili needs
```

The rules that `scaffold` prints are written for agents. They cover which variables must stay intact, which plural suffixes the language requires (from `Intl.PluralRules`) and how to keep templates grammatical. `check` turns those rules into a pass/fail result the agent can loop on. Run `check` after editing any translation file, too.

## For AI coding agents

- **`llms.txt`:** the npm package includes a short, complete usage guide at `node_modules/zod-i18n-map/llms.txt`.
- **Agent Skill:** `npx zod-i18n-map skill` installs [`SKILL.md`](https://agentskills.io) at `.claude/skills/zod-i18n-map/`. Use `--out` for other agents' skill directories. With the skill installed, "localize our form validation errors" is something your agent knows how to do with this library.
- **CLI:** every command is non-interactive, supports `--json`, and signals failure through its exit code.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). Translation fixes and new locales are especially welcome.

## License

[MIT](./LICENSE)
