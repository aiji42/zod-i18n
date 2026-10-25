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
import { type Json, validateLocale } from "../src/validate.ts";

const ROOT = join(import.meta.dirname, "..", "locales");
const load = (locale: string) =>
  JSON.parse(readFileSync(join(ROOT, locale, "zod.json"), "utf8")) as Json;

const locales = readdirSync(ROOT)
  .filter((name) => statSync(join(ROOT, name)).isDirectory())
  .sort();
const reference = load("en");
const errors: string[] = [];

for (const locale of locales) {
  try {
    const { missing, problems } = validateLocale(reference, load(locale), locale);
    for (const key of missing) errors.push(`${locale}: missing key "${key}"`);
    for (const problem of problems) errors.push(`${locale}: ${problem}`);
  } catch (e) {
    errors.push(`${locale}: invalid JSON (${(e as Error).message})`);
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
