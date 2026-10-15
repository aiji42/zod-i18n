import { createInstance } from "i18next";
import ICU from "i18next-icu";
import { expect, test } from "vitest";
import * as z from "zod";
import en from "../locales/en/zod.json" with { type: "json" };
import ru from "../locales/ru/zod.json" with { type: "json" };
import { toIcu } from "../src/icu.ts";
import { makeZodI18nMap } from "../src/index.ts";

test("converts interpolation, escaping and plurals", () => {
  expect(
    toIcu({
      a: 'Must start with "{{- prefix}}" and isn\'t {{x}}',
      d: "after {{- minimum, datetime}}",
      n: { k_one: "{{count}} item", k_other: "{{count}} items" },
    }),
  ).toEqual({
    a: "Must start with \"{prefix}\" and isn''t {x}",
    d: "after {minimum, date}",
    n: { k: "{count, plural, one {{count} item} other {{count} items}}" },
  });
});

test.each([
  ["en", en, z.string().min(3), "a", "String must contain at least 3 characters"],
  ["en", en, z.strictObject({}), { a: 1 }, 'Unrecognized key in object: "a"'],
  ["ru", ru, z.string().min(5), "a", "Текст должен содержать не менее 5 символов"],
] as const)(
  "renders shipped %s messages through i18next-icu",
  async (lng, res, schema, input, expected) => {
    const i18n = createInstance().use(ICU);
    await i18n.init({ lng, resources: { [lng]: { zod: toIcu(res) } } });
    const error = makeZodI18nMap({ t: i18n.t, handlePath: false });
    expect(schema.safeParse(input, { error }).error?.issues[0]?.message).toBe(expected);
  },
);
