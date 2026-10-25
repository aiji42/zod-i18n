/** Texts the CLI hands to coding agents: translation instructions and the user-facing skill. */

const pluralCategories = (locale: string): string[] => {
  try {
    return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  } catch {
    return ["other"];
  }
};

export const translationGuide = (locale: string, file: string): string => {
  const categories = pluralCategories(locale);
  const plurals =
    categories.length === 1
      ? `"${locale}" has a single plural category, so replace every \`_one\`/\`_other\` pair with one plain key (e.g. \`inclusive_one\` + \`inclusive_other\` -> \`inclusive\`).`
      : `"${locale}" uses the plural categories ${categories.map((c) => `\`_${c}\``).join(", ")}. Every key that has plural variants in English must have exactly these suffixes. If your language puts a singular noun after numerals, you may use one plain key instead.`;

  return `Translate ${file} into "${locale}". It is currently a copy of the English reference.

These are Zod validation messages shown to the end users of forms and APIs.
Write them like a careful native UX writer would.

Rules:
1. Keep every key. Translate only the values.
2. Keep every {{variable}} exactly as written, including the "-" in {{- name}} and ", datetime" in {{- minimum, datetime}}. Never translate the names inside the braces.
3. ${plurals}
4. Pick one natural register for UI validation messages and use it in every message. Keep punctuation consistent (English uses no trailing period).
5. Use end-user words: "string" means text, "array" means list. For dates, say before/after rather than smaller/greater.
6. Values inserted into templates are translated labels:
   - {{expected}}, {{received}} and {{origin}} come from "types.*"
   - {{format}} comes from "formats.*"
   Every template must stay grammatical with every label. If "errors.invalid_format.default" can't be, add specific keys such as "errors.invalid_format.email" (any key under "formats" is allowed) with the same variables.
7. Don't add keys that aren't in the English file, except the invalid_format overrides above.

When done, run:
  npx zod-i18n-map check ${file} --locale ${locale}
Fix every reported problem and run it again until it passes.`;
};

export const SKILL_MD = `---
name: zod-i18n-map
description: Localize Zod validation error messages with i18next using zod-i18n-map. Use when adding or changing translated form/API validation errors, wiring Zod errors into i18next/react-i18next, adding a language for Zod messages, or showing field names in validation errors.
---

# Zod error messages with zod-i18n-map

zod-i18n-map is an error map for Zod v4 that resolves every issue through i18next. The translation files live in the project and are edited like any other i18n resource. Full reference: \`node_modules/zod-i18n-map/llms.txt\`.

## Setup

1. Fetch the translation files. Match the project's existing i18n layout with \`--out\` (e.g. \`public/locales/{locale}/zod.json\`):

   \`\`\`bash
   npx zod-i18n-map add en ja --out "locales/{locale}/zod.json"
   \`\`\`

2. Register the files as the \`zod\` namespace in the existing i18next setup.
3. Register the map once, at module scope: \`z.config({ customError: zodI18nMap })\`.
   - Use \`customError\`, not \`localeError\`, so missing keys fall back to Zod's own message.
   - On servers, pass the map per parse instead of changing global state:
     \`schema.safeParse(data, { error: makeZodI18nMap({ t: i18n.getFixedT(locale) }) })\`

## Common tasks

- **Custom message for one field or check:**
  - Built-in checks: \`z.string().min(8, { error: i18nKey("password.too_short") })\`. The key receives \`{{count}}\`, \`{{minimum}}\`, \`{{path}}\` and so on.
  - Refinements: \`.refine(fn, { params: { i18n: "key" } })\`.
  - Don't put translated strings into schemas; put keys in the JSON files.
- **Field names in messages:** add \`_with_path\` variants and a label key per field.
  - Example: \`"invalid_type_received_undefined_with_path": "{{- path}} is required"\` plus \`"email": "Email"\` at the namespace root.
  - Or use \`makeZodI18nMap({ handlePath: { ns: "form", keyPrefix: "fields" } })\` to keep labels elsewhere.
- **Language switch while errors are shown:** render \`translateIssue(issue)\` instead of \`issue.message\` (Zod >= 4.4).
- **ICU projects (i18next-icu):** \`npx zod-i18n-map add <locale> --format icu\`.

## A language that isn't available

\`npx zod-i18n-map list\` shows the available locales. For any other language:

1. Run \`npx zod-i18n-map scaffold <locale> --out "locales/{locale}/zod.json"\`. It copies the English reference and prints translation rules for that language.
2. Translate the file following those rules.
3. Run \`npx zod-i18n-map check <file> --locale <locale>\` until it reports no problems.

Run \`check\` after any manual edit of a translation file too.
`;
