#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import pkg from "../package.json" with { type: "json" };
import { SKILL_MD, translationGuide } from "./guide.ts";
import { toIcu } from "./icu.ts";
import { type Json, validateLocale } from "./validate.ts";

const REPO = "aiji42/zod-i18n";
const RAW_BASE = process.env.ZOD_I18N_MAP_BASE_URL ?? `https://raw.githubusercontent.com/${REPO}`;
const DEFAULT_REF = `v${pkg.version}`;
const DEFAULT_OUT = "locales/{locale}/zod.json";
const DEFAULT_SKILL_OUT = ".claude/skills/zod-i18n-map/SKILL.md";

const HELP = `zod-i18n-map v${pkg.version}

Copy Zod error message translations into your project.
The files are yours to edit: they are plain i18next JSON resources.

Usage:
  npx zod-i18n-map add <locale...>       Download translation files
  npx zod-i18n-map list                  List available locales
  npx zod-i18n-map check <file>          Validate a translation file (missing keys, variables, plurals)
  npx zod-i18n-map scaffold <locale>     Start a new language: copy the English file and print
                                         translation rules for you or your coding agent
  npx zod-i18n-map skill                 Install an Agent Skill that teaches coding agents this library

Options:
  -o, --out <path>       Output path. {locale} is replaced.
                         add/scaffold default: "${DEFAULT_OUT}". skill default: "${DEFAULT_SKILL_OUT}"
  -r, --ref <ref>        Git tag, branch or commit to fetch from (default: "${DEFAULT_REF}", falls back to "main")
  -l, --locale <code>    Language of the file for check (default: inferred from the path)
      --format <format>  "i18next" (default) or "icu" (ICU MessageFormat, for i18next-icu)
  -f, --force            Overwrite existing files
      --json             Machine-readable output
  -h, --help             Show this help

Examples:
  npx zod-i18n-map add ja fr
  npx zod-i18n-map add de --out public/locales/{locale}/zod.json
  npx zod-i18n-map add fr --format icu
  npx zod-i18n-map scaffold sw && npx zod-i18n-map check locales/sw/zod.json
`;

type Options = {
  out?: string;
  ref: string;
  explicitRef: boolean;
  force: boolean;
  json: boolean;
  format: "i18next" | "icu";
  locale?: string;
};

const fetchText = async (path: string, ref: string): Promise<string | null> => {
  const res = await fetch(`${RAW_BASE}/${ref}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${res.url} failed: ${res.status}`);
  return res.text();
};

/** Fetch from the pinned ref first so files match the installed version; fall back to main. */
const fetchWithFallback = async (
  path: string,
  { ref, explicitRef }: Pick<Options, "ref" | "explicitRef">,
): Promise<{ text: string; ref: string } | null> => {
  const text = await fetchText(path, ref);
  if (text !== null) return { text, ref };
  if (explicitRef || ref === "main") return null;
  const fallback = await fetchText(path, "main");
  return fallback === null ? null : { text: fallback, ref: "main" };
};

const fetchJson = async <T>(path: string, opts: Options): Promise<{ data: T; ref: string }> => {
  const found = await fetchWithFallback(path, opts);
  if (!found) throw new Error(`Could not fetch ${path} at ref "${opts.ref}"`);
  return { data: JSON.parse(found.text) as T, ref: found.ref };
};

const writeOutput = async (path: string, content: string) => {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content);
};

const add = async (locales: string[], opts: Options): Promise<number> => {
  if (locales.length === 0) {
    console.error("Specify at least one locale, e.g. `npx zod-i18n-map add ja`.");
    return 1;
  }
  const results: { locale: string; status: string; path?: string; ref?: string }[] = [];
  for (const locale of locales) {
    const path = resolve((opts.out ?? DEFAULT_OUT).replaceAll("{locale}", locale));
    if (existsSync(path) && !opts.force) {
      results.push({ locale, status: "skipped (exists, use --force)", path });
      continue;
    }
    const found = await fetchWithFallback(`locales/${locale}/zod.json`, opts);
    if (!found) {
      results.push({
        locale,
        status: `not available (see \`npx zod-i18n-map list\`, or create it with \`npx zod-i18n-map scaffold ${locale}\`)`,
      });
      continue;
    }
    const content =
      opts.format === "icu"
        ? `${JSON.stringify(toIcu(JSON.parse(found.text) as Json), null, 2)}\n`
        : found.text;
    await writeOutput(path, content);
    results.push({ locale, status: "written", path, ref: found.ref });
  }

  if (opts.json) console.log(JSON.stringify(results, null, 2));
  else
    for (const r of results)
      console.log(
        `${r.locale}: ${r.status}${r.path ? ` -> ${r.path}` : ""}${r.ref ? ` (@${r.ref})` : ""}`,
      );
  return results.every((r) => r.status === "written" || r.status.startsWith("skipped")) ? 0 : 1;
};

/** `locales/pt-BR/zod.json` -> `pt-BR`, `i18n/de.json` -> `de`. */
const inferLocale = (file: string): string | undefined => {
  const looksLikeCode = (s: string) => /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/i.test(s);
  const fromName = basename(file).replace(/\.json$/, "");
  if (fromName !== "zod" && looksLikeCode(fromName)) return fromName;
  const fromDir = basename(dirname(resolve(file)));
  return looksLikeCode(fromDir) ? fromDir : undefined;
};

const check = async (file: string | undefined, opts: Options): Promise<number> => {
  if (!file) {
    console.error("Specify a translation file, e.g. `npx zod-i18n-map check locales/ja/zod.json`.");
    return 1;
  }
  const locale = opts.locale ?? inferLocale(file);
  if (!locale) {
    console.error(`Could not infer the language of ${file}; pass --locale <code>.`);
    return 1;
  }
  let messages: Json;
  try {
    messages = JSON.parse(await readFile(file, "utf8")) as Json;
  } catch (e) {
    console.error(`${file}: ${(e as Error).message}`);
    return 1;
  }
  const { data: reference, ref } = await fetchJson<Json>("locales/en/zod.json", opts);
  const { missing, problems } = validateLocale(reference, messages, locale);
  const ok = missing.length === 0 && problems.length === 0;

  if (opts.json) console.log(JSON.stringify({ file, locale, ref, ok, missing, problems }, null, 2));
  else if (ok) console.log(`${file} (${locale}): OK, up to date with ${ref}`);
  else {
    console.log(`${file} (${locale}) compared to ${ref}:`);
    for (const p of problems) console.log(`  ✖ ${p}`);
    for (const key of missing) console.log(`  - missing "${key}" (falls back to Zod's message)`);
  }
  return ok ? 0 : 1;
};

const scaffold = async (locale: string | undefined, opts: Options): Promise<number> => {
  if (!locale) {
    console.error("Specify a language code, e.g. `npx zod-i18n-map scaffold sw`.");
    return 1;
  }
  const { data: available } = await fetchJson<string[]>("locales/index.json", opts);
  if (available.includes(locale) && !opts.force) {
    console.error(`"${locale}" is already available: run \`npx zod-i18n-map add ${locale}\`.`);
    return 1;
  }
  const out = (opts.out ?? DEFAULT_OUT).replaceAll("{locale}", locale);
  const path = resolve(out);
  if (existsSync(path) && !opts.force) {
    console.error(`${out} already exists (use --force to overwrite).`);
    return 1;
  }
  const found = await fetchWithFallback("locales/en/zod.json", opts);
  if (!found) throw new Error(`Could not fetch the English reference at ref "${opts.ref}"`);
  await writeOutput(path, found.text);

  const instructions = translationGuide(locale, out);
  if (opts.json)
    console.log(JSON.stringify({ locale, path, ref: found.ref, instructions }, null, 2));
  else console.log(`Wrote the English reference to ${out}.\n\n${instructions}`);
  return 0;
};

const skill = async (opts: Options): Promise<number> => {
  const out = opts.out ?? DEFAULT_SKILL_OUT;
  const path = resolve(out);
  if (existsSync(path) && !opts.force) {
    console.error(`${out} already exists (use --force to overwrite).`);
    return 1;
  }
  await writeOutput(path, SKILL_MD);
  if (opts.json) console.log(JSON.stringify({ path }));
  else console.log(`Wrote ${out}`);
  return 0;
};

const main = async (): Promise<number> => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o" },
      ref: { type: "string", short: "r" },
      locale: { type: "string", short: "l" },
      force: { type: "boolean", short: "f", default: false },
      json: { type: "boolean", default: false },
      format: { type: "string", default: "i18next" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [command, ...args] = positionals;
  if (values.help || !command) {
    console.log(HELP);
    return 0;
  }
  if (values.format !== "i18next" && values.format !== "icu") {
    console.error(`Unknown --format "${values.format}". Use "i18next" or "icu".`);
    return 1;
  }
  const opts: Options = {
    out: values.out,
    ref: values.ref ?? DEFAULT_REF,
    explicitRef: values.ref !== undefined,
    force: values.force,
    json: values.json,
    format: values.format,
    locale: values.locale,
  };

  switch (command) {
    case "add":
      return add(args, opts);
    case "list": {
      const { data } = await fetchJson<string[]>("locales/index.json", opts);
      console.log(opts.json ? JSON.stringify(data) : data.join("\n"));
      return 0;
    }
    case "check":
      return check(args[0], opts);
    case "scaffold":
      return scaffold(args[0], opts);
    case "skill":
      return skill(opts);
    default:
      console.error(`Unknown command: ${command}\n\n${HELP}`);
      return 1;
  }
};

main().then(
  (code) => {
    process.exitCode = code;
  },
  (error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  },
);
