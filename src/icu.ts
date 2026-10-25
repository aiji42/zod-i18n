import { type Json, PLURAL } from "./validate.ts";

const ICU_PLURAL_ORDER = ["zero", "one", "two", "few", "many", "other"];

/** `{{- name}}` / `{{name}}` / `{{- name, datetime}}` -> `{name}` / `{name, date}`; escape ICU syntax chars. */
const convertMessage = (message: string): string =>
  message
    .split(/(\{\{-?\s*[\w.]+(?:\s*,\s*\w+)?\s*\}\})/)
    .map((part, i) => {
      if (i % 2 === 0) return part.replaceAll("'", "''").replace(/[{}]+/g, "'$&'");
      const [, name, format] = part.match(/\{\{-?\s*([\w.]+)(?:\s*,\s*(\w+))?\s*\}\}/) ?? [];
      return format === "datetime" ? `{${name}, date}` : `{${name}}`;
    })
    .join("");

/**
 * Convert an i18next JSON resource into ICU MessageFormat for use with `i18next-icu`.
 * Plural variants (`key_one`, `key_other`, ...) are merged into one `{count, plural, ...}` message.
 */
export const toIcu = (obj: Json): Json => {
  if (typeof obj === "string") return convertMessage(obj);

  const out: { [key: string]: Json } = {};
  const plurals = new Map<string, Map<string, string>>();
  for (const [key, value] of Object.entries(obj)) {
    const match = typeof value === "string" ? key.match(PLURAL) : null;
    if (match) {
      const base = key.replace(PLURAL, "");
      const category = match[1] as string;
      const forms = plurals.get(base) ?? new Map<string, string>();
      forms.set(category, convertMessage(value as string));
      plurals.set(base, forms);
      out[base] ??= "";
    } else {
      out[key] = toIcu(value);
    }
  }
  for (const [base, forms] of plurals) {
    const cases = ICU_PLURAL_ORDER.filter((c) => forms.has(c))
      .map((c) => `${c} {${forms.get(c)}}`)
      .join(" ");
    out[base] = `{count, plural, ${cases}}`;
  }
  return out;
};
