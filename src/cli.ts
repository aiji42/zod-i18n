#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { parseArgs } from "node:util";
import pkg from "../package.json" with { type: "json" };
import { toIcu } from "./icu.ts";

const REPO = "aiji42/zod-i18n";
const RAW_BASE = process.env.ZOD_I18N_MAP_BASE_URL ?? `https://raw.githubusercontent.com/${REPO}`;
const DEFAULT_REF = `v${pkg.version}`;

const HELP = `zod-i18n-map v${pkg.version}

Download Zod error message translations into your project.
The files are yours to edit: they are plain i18next JSON resources.

Usage:
  npx zod-i18n-map add <locale...> [options]   Download translation files
  npx zod-i18n-map list [--json]               List available locales
  npx zod-i18n-map check <file> [options]      Report keys missing from a local file

Options:
  -o, --out <pattern>  Output path; {locale} is replaced (default: "locales/{locale}/zod.json")
  -r, --ref <ref>      Git tag, branch or commit to fetch from (default: "${DEFAULT_REF}", falls back to "main")
      --format <format>  "i18next" (default) or "icu" (ICU MessageFormat, for i18next-icu)
  -f, --force          Overwrite existing files
      --json           Machine-readable output
  -h, --help           Show this help

Examples:
  npx zod-i18n-map add ja fr
  npx zod-i18n-map add de --out public/locales/{locale}/zod.json
  npx zod-i18n-map add fr --format icu
  npx zod-i18n-map check locales/ja/zod.json
`;

type Json = { [key: string]: Json } | string;

const fetchText = async (path: string, ref: string): Promise<string | null> => {
  const res = await fetch(`${RAW_BASE}/${ref}/${path}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${res.url} failed: ${res.status}`);
  return res.text();
};

/** Fetch from the pinned ref first so files match the installed version; fall back to main. */
const fetchWithFallback = async (
  path: string,
  ref: string,
  explicitRef: boolean,
): Promise<{ text: string; ref: string } | null> => {
  const text = await fetchText(path, ref);
  if (text !== null) return { text, ref };
  if (explicitRef || ref === "main") return null;
  const fallback = await fetchText(path, "main");
  return fallback === null ? null : { text: fallback, ref: "main" };
};

const fetchLocales = async (ref: string, explicitRef: boolean): Promise<string[]> => {
  const found = await fetchWithFallback("locales/index.json", ref, explicitRef);
  if (!found) throw new Error(`Could not find locales/index.json at ref "${ref}"`);
  return JSON.parse(found.text) as string[];
};

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

/** Flatten to dotted keys, folding plural variants (`_one`, `_other`, ...) into their base key. */
const flattenKeys = (obj: Json, prefix = "", out = new Set<string>()): Set<string> => {
  if (typeof obj === "string") {
    out.add(prefix.replace(PLURAL_SUFFIX, ""));
    return out;
  }
  for (const [key, value] of Object.entries(obj)) {
    flattenKeys(value, prefix ? `${prefix}.${key}` : key, out);
  }
  return out;
};

const add = async (
  locales: string[],
  opts: {
    out: string;
    ref: string;
    explicitRef: boolean;
    force: boolean;
    json: boolean;
    format: "i18next" | "icu";
  },
): Promise<number> => {
  if (locales.length === 0) {
    console.error("Specify at least one locale, e.g. `npx zod-i18n-map add ja`.");
    return 1;
  }
  const results: { locale: string; status: string; path?: string; ref?: string }[] = [];
  for (const locale of locales) {
    const path = resolve(opts.out.replaceAll("{locale}", locale));
    if (existsSync(path) && !opts.force) {
      results.push({ locale, status: "skipped (exists, use --force)", path });
      continue;
    }
    const found = await fetchWithFallback(`locales/${locale}/zod.json`, opts.ref, opts.explicitRef);
    if (!found) {
      results.push({ locale, status: "not found (run `npx zod-i18n-map list`)" });
      continue;
    }
    await mkdir(dirname(path), { recursive: true });
    const content =
      opts.format === "icu"
        ? `${JSON.stringify(toIcu(JSON.parse(found.text) as Json), null, 2)}\n`
        : found.text;
    await writeFile(path, content);
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

const check = async (
  file: string | undefined,
  opts: { ref: string; explicitRef: boolean; json: boolean },
): Promise<number> => {
  if (!file) {
    console.error(
      "Specify a local translation file, e.g. `npx zod-i18n-map check locales/ja/zod.json`.",
    );
    return 1;
  }
  const local = flattenKeys(JSON.parse(await readFile(file, "utf8")) as Json);
  const found = await fetchWithFallback("locales/en/zod.json", opts.ref, opts.explicitRef);
  if (!found) throw new Error(`Could not fetch the reference locale at ref "${opts.ref}"`);
  const reference = flattenKeys(JSON.parse(found.text) as Json);
  const missing = [...reference].filter((k) => !local.has(k));

  if (opts.json) console.log(JSON.stringify({ file, ref: found.ref, missing }, null, 2));
  else if (missing.length === 0) console.log(`${file}: up to date with ${found.ref}`);
  else {
    console.log(`${file}: ${missing.length} key(s) missing compared to ${found.ref}`);
    for (const key of missing) console.log(`  - ${key}`);
    console.log("Missing keys fall back to Zod's built-in message.");
  }
  return missing.length === 0 ? 0 : 1;
};

const main = async (): Promise<number> => {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      out: { type: "string", short: "o", default: "locales/{locale}/zod.json" },
      ref: { type: "string", short: "r" },
      force: { type: "boolean", short: "f", default: false },
      json: { type: "boolean", default: false },
      format: { type: "string", default: "i18next" },
      help: { type: "boolean", short: "h", default: false },
    },
  });
  const [command, ...args] = positionals;
  const ref = values.ref ?? DEFAULT_REF;
  const explicitRef = values.ref !== undefined;

  if (values.help || !command) {
    console.log(HELP);
    return 0;
  }
  switch (command) {
    case "add":
      if (values.format !== "i18next" && values.format !== "icu") {
        console.error(`Unknown --format "${values.format}". Use "i18next" or "icu".`);
        return 1;
      }
      return add(args, {
        format: values.format,
        out: values.out,
        ref,
        explicitRef,
        force: values.force,
        json: values.json,
      });
    case "list": {
      const locales = await fetchLocales(ref, explicitRef);
      console.log(values.json ? JSON.stringify(locales) : locales.join("\n"));
      return 0;
    }
    case "check":
      return check(args[0], { ref, explicitRef, json: values.json });
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
