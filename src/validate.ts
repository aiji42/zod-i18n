/**
 * Structural validation of a translation file against the English reference.
 * Shared by `scripts/check-locales.ts` (repo CI) and `npx zod-i18n-map check` (user projects,
 * e.g. to verify a file a coding agent just translated).
 */
export type Json = { [key: string]: Json } | string;

export type ValidationResult = {
  /** Keys present in the reference but not in the file. They fall back to Zod's message. */
  missing: string[];
  /** Real mistakes: unknown keys, unknown variables, empty messages, wrong plural forms. */
  problems: string[];
};

export const PLURAL: RegExp = /_(zero|one|two|few|many|other)$/;
const CONTEXT = /_with_path$/;
// Always available regardless of key: `path` via handlePath, `count` via plurals.
const GLOBAL_VARS = ["path", "count"];

/**
 * Plural categories of a language, or `undefined` if the runtime doesn't know the code
 * (`Intl.PluralRules` would silently fall back to the default locale).
 */
export const pluralCategories = (locale: string): string[] | undefined => {
  try {
    if (Intl.PluralRules.supportedLocalesOf(locale).length === 0) return undefined;
    return new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  } catch {
    return undefined;
  }
};

/** Flatten to dotted keys. Leaves keep their raw value so non-strings can be reported. */
export const flatten = (
  obj: unknown,
  prefix = "",
  out: Map<string, unknown> = new Map(),
): Map<string, unknown> => {
  if (typeof obj === "object" && obj !== null && !Array.isArray(obj))
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  else out.set(prefix, obj);
  return out;
};

const variables = (message: string): string[] =>
  [...message.matchAll(/\{\{-?\s*([\w.]+)[^}]*\}\}/g)].map((m) => m[1] as string);

/** `errors.too_small.string.inclusive_with_path_one` -> `errors.too_small.string.inclusive` */
const baseKey = (key: string): string => key.replace(PLURAL, "").replace(CONTEXT, "");

/** Allowed variables per base key, derived from the reference file. */
const referenceSchema = (reference: Json) => {
  const required = new Map<string, Set<string>>();
  const flat = flatten(reference);
  for (const [key, message] of flat) {
    const base = baseKey(key);
    const vars = required.get(base) ?? new Set(GLOBAL_VARS);
    // Plural messages use {{count}}, but the bound itself is always passed too.
    if (base.startsWith("errors.too_small.")) vars.add("minimum");
    if (base.startsWith("errors.too_big.")) vars.add("maximum");
    if (typeof message === "string") for (const v of variables(message)) vars.add(v);
    required.set(base, vars);
  }
  // Optional per-format overrides (e.g. `errors.invalid_format.email`) let languages with
  // grammatical gender avoid the generic "Invalid {{format}}" template.
  const optional = new Map<string, Set<string>>();
  const formatVars = required.get("errors.invalid_format.default") ?? new Set();
  for (const key of flat.keys())
    if (key.startsWith("formats.")) {
      const override = `errors.invalid_format.${key.slice("formats.".length)}`;
      if (!required.has(override)) optional.set(override, formatVars);
    }
  return { required, optional };
};

export const validateLocale = (
  reference: Json,
  messages: unknown,
  locale: string,
): ValidationResult => {
  const { required, optional } = referenceSchema(reference);
  const problems: string[] = [];
  const present = new Set<string>();
  const pluralGroups = new Map<string, Set<string>>();
  const plainKeys = new Set<string>();

  if (typeof messages !== "object" || messages === null || Array.isArray(messages))
    return { missing: [...required.keys()], problems: ["the file must contain a JSON object"] };

  for (const [key, message] of flatten(messages)) {
    const base = baseKey(key);
    present.add(base);
    const allowed = required.get(base) ?? optional.get(base);
    if (!allowed) {
      problems.push(`unknown key "${key}"`);
      continue;
    }
    if (typeof message !== "string") problems.push(`"${key}" must be a string`);
    else if (message.trim() === "") problems.push(`empty message "${key}"`);
    else
      for (const v of variables(message))
        if (!allowed.has(v)) problems.push(`"${key}" uses unknown variable {{${v}}}`);

    const plural = key.match(PLURAL);
    if (plural) {
      const group = key.replace(PLURAL, "");
      const set = pluralGroups.get(group) ?? new Set();
      set.add(plural[1] as string);
      pluralGroups.set(group, set);
    } else plainKeys.add(key);
  }

  const categories = pluralCategories(locale);
  if (!categories) {
    problems.push(`"${locale}" is not a known language code, so plural forms can't be checked`);
    return { missing: [...required.keys()].filter((k) => !present.has(k)), problems };
  }
  for (const [group, found] of pluralGroups) {
    if (plainKeys.has(group))
      problems.push(`"${group}" mixes a plain key with plural variants; use one or the other`);
    const missing = categories.filter((c) => !found.has(c));
    if (missing.length > 0)
      problems.push(
        `"${group}" is missing plural form(s) ${missing.map((c) => `_${c}`).join(", ")} required by ${locale}`,
      );
    // i18next looks up `_zero` for a count of 0 in every language, so it is always allowed.
    const extra = [...found].filter((c) => c !== "zero" && !categories.includes(c));
    if (extra.length > 0)
      problems.push(
        `"${group}" has plural form(s) ${extra.map((c) => `_${c}`).join(", ")} that ${locale} never uses`,
      );
  }

  return { missing: [...required.keys()].filter((k) => !present.has(k)), problems };
};
