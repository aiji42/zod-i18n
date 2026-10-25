import { expect, test } from "vitest";
import en from "../locales/en/zod.json" with { type: "json" };
import { validateLocale } from "../src/validate.ts";

const ru = (patch: (errors: Record<string, unknown>) => void) => {
  const copy = structuredClone(en) as unknown as { errors: Record<string, unknown> };
  patch(copy.errors);
  return copy;
};

test("non-string values are reported, not crashed on", () => {
  const { problems } = validateLocale(
    en,
    ru((e) => {
      e.custom = null;
      e.invalid_union = 1;
    }),
    "en",
  );
  expect(problems.sort()).toEqual([
    '"errors.custom" must be a string',
    '"errors.invalid_union" must be a string',
  ]);
  expect(validateLocale(en, [], "en").problems).toEqual(["the file must contain a JSON object"]);
});

test("a plain key mixed with plural variants is reported", () => {
  const { problems } = validateLocale(
    en,
    ru((e) => {
      e.unrecognized_keys = "x";
    }),
    "en",
  );
  expect(problems).toEqual([
    '"errors.unrecognized_keys" mixes a plain key with plural variants; use one or the other',
  ]);
});

test("_zero is allowed in any language", () => {
  const { problems } = validateLocale(
    en,
    ru((e) => {
      e.unrecognized_keys_zero = "none";
    }),
    "en",
  );
  expect(problems).toEqual([]);
});

test("unknown language codes are reported instead of validated as English", () => {
  expect(validateLocale(en, en, "app").problems).toEqual([
    '"app" is not a known language code, so plural forms can\'t be checked',
  ]);
});
