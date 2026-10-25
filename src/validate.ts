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

const PLURAL = /_(zero|one|two|few|many|other)$/;
const CONTEXT = /_with_path$/;
// Always available regardless of key: `path` via handlePath, `count` via plurals.
const GLOBAL_VARS = ["path", "count"];

export const flatten = (
  obj: Json,
  prefix = "",
  out: Map<string, string> = new Map(),
): Map<string, string> => {
  if (typeof obj === "string") out.set(prefix, obj);
  else for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
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
    for (const v of variables(message)) vars.add(v);
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
  messages: Json,
  locale: string,
): ValidationResult => {
  const { required, optional } = referenceSchema(reference);
  const problems: string[] = [];
  const present = new Set<string>();
  const pluralGroups = new Map<string, Set<string>>();

  for (const [key, message] of flatten(messages)) {
    const base = baseKey(key);
    present.add(base);
    const allowed = required.get(base) ?? optional.get(base);
    if (!allowed) {
      problems.push(`unknown key "${key}"`);
      continue;
    }
    if (typeof message !== "string" || message.trim() === "")
      problems.push(`empty message "${key}"`);
    else
      for (const v of variables(message))
        if (!allowed.has(v)) problems.push(`"${key}" uses unknown variable {{${v}}}`);

    const plural = key.match(PLURAL);
    if (plural) {
      const group = key.replace(PLURAL, "");
      const set = pluralGroups.get(group) ?? new Set();
      set.add(plural[1] as string);
      pluralGroups.set(group, set);
    }
  }

  let categories: string[];
  try {
    categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  } catch {
    problems.push(`"${locale}" is not a valid language code`);
    categories = ["other"];
  }
  for (const [group, found] of pluralGroups) {
    const missing = categories.filter((c) => !found.has(c));
    if (missing.length > 0)
      problems.push(
        `"${group}" is missing plural form(s) ${missing.map((c) => `_${c}`).join(", ")} required by ${locale}`,
      );
    const extra = [...found].filter((c) => !categories.includes(c));
    if (extra.length > 0)
      problems.push(
        `"${group}" has plural form(s) ${extra.map((c) => `_${c}`).join(", ")} that ${locale} never uses`,
      );
  }

  return { missing: [...required.keys()].filter((k) => !present.has(k)), problems };
};
