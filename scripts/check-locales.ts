/**
 * Validates every `locales/<locale>/zod.json` against `locales/en/zod.json`
 * and keeps `locales/index.json` in sync.
 *
 *   node scripts/check-locales.ts          # validate (CI)
 *   node scripts/check-locales.ts --write  # also regenerate locales/index.json
 *
 * Replaces the old per-locale snapshot tests: the runtime mapping is tested once
 * against English, and every other locale only has to be structurally sound.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Json = { [key: string]: Json } | string;

const ROOT = join(import.meta.dirname, "..", "locales");
const REFERENCE = "en";
const PLURAL = /_(zero|one|two|few|many|other)$/;
const CONTEXT = /_with_path$/;
// Always available regardless of key: `path` via handlePath, `count` via plurals.
const GLOBAL_VARS = new Set(["path", "count"]);

const flatten = (obj: Json, prefix = "", out = new Map<string, string>()) => {
  if (typeof obj === "string") out.set(prefix, obj);
  else for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
};

const variables = (message: string): Set<string> =>
  new Set([...message.matchAll(/\{\{-?\s*([\w.]+)[^}]*\}\}/g)].map((m) => m[1] as string));

/** `errors.too_small.string.inclusive_with_path_one` -> `errors.too_small.string.inclusive` */
const baseKey = (key: string): string => key.replace(PLURAL, "").replace(CONTEXT, "");

const load = (locale: string) =>
  flatten(JSON.parse(readFileSync(join(ROOT, locale, "zod.json"), "utf8")) as Json);

const locales = readdirSync(ROOT)
  .filter((name) => statSync(join(ROOT, name)).isDirectory())
  .sort();

const reference = load(REFERENCE);
const referenceVars = new Map<string, Set<string>>();
for (const [key, message] of reference) {
  const base = baseKey(key);
  const vars = referenceVars.get(base) ?? new Set(GLOBAL_VARS);
  // Plural messages use {{count}}, but the bound itself is always passed too.
  if (base.startsWith("errors.too_small.")) vars.add("minimum");
  if (base.startsWith("errors.too_big.")) vars.add("maximum");
  for (const v of variables(message)) vars.add(v);
  referenceVars.set(base, vars);
}

const errors: string[] = [];

for (const locale of locales) {
  let messages: Map<string, string>;
  try {
    messages = load(locale);
  } catch (e) {
    errors.push(`${locale}: invalid JSON (${(e as Error).message})`);
    continue;
  }

  const categories = new Intl.PluralRules(locale).resolvedOptions().pluralCategories;
  const present = new Set<string>();
  const pluralGroups = new Map<string, Set<string>>();

  for (const [key, message] of messages) {
    const base = baseKey(key);
    present.add(base);
    const allowed = referenceVars.get(base);
    if (!allowed) {
      errors.push(`${locale}: unknown key "${key}"`);
      continue;
    }
    if (message.trim() === "") errors.push(`${locale}: empty message "${key}"`);
    for (const v of variables(message))
      if (!allowed.has(v)) errors.push(`${locale}: "${key}" uses unknown variable {{${v}}}`);

    const plural = key.match(PLURAL);
    if (plural) {
      const group = key.replace(PLURAL, "");
      const set = pluralGroups.get(group) ?? new Set();
      set.add(plural[1] as string);
      pluralGroups.set(group, set);
    }
  }

  for (const base of referenceVars.keys())
    if (!present.has(base)) errors.push(`${locale}: missing key "${base}"`);

  for (const [group, found] of pluralGroups) {
    const missing = categories.filter((c) => !found.has(c));
    if (missing.length > 0)
      errors.push(
        `${locale}: "${group}" is missing plural form(s) ${missing.map((c) => `_${c}`).join(", ")}`,
      );
    const extra = [...found].filter((c) => !(categories as string[]).includes(c));
    if (extra.length > 0)
      errors.push(
        `${locale}: "${group}" has plural form(s) unused by ${locale}: ${extra.map((c) => `_${c}`).join(", ")}`,
      );
  }
}

const indexPath = join(ROOT, "index.json");
const index = `${JSON.stringify(locales)}\n`;
if (process.argv.includes("--write")) writeFileSync(indexPath, index);
else if (readFileSync(indexPath, "utf8") !== index)
  errors.push("locales/index.json is out of date (run `pnpm locales:check --write`)");

if (errors.length > 0) {
  console.error(errors.join("\n"));
  console.error(`\n${errors.length} problem(s) found.`);
  process.exit(1);
}
console.log(`${locales.length} locales OK`);
