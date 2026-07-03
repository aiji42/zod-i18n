import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import {
  initIcu,
  getErrorMessage,
  getErrorMessageFromZodError,
} from "./helpers.icu";

const LOCALE = "en";

beforeAll(async () => {
  await initIcu(LOCALE);
});

test("string parser error messages (ICU)", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Required");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Expected string, received number"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Invalid email"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Invalid input: must start with "foo"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "String must contain at least 5 character(s)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "String must contain at most 5 character(s)"
  );
});

test("number parser error messages (ICU)", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Expected number, received string"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Number must be a multiple of 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Number must be greater than or equal to 5"
  );
});

test("date parser error messages (ICU)", () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Date must be greater than or equal to ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Date must be smaller than or equal to ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
});

test("literal quote escaping is respected by the ICU parser", () => {
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Invalid literal value, expected 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Invalid enum value. Expected 'A' | 'B' | 'C', received 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Unrecognized key(s) in object: 'cat', 'rat'");
});

test("custom refine error messages (ICU)", () => {
  expect(
    getErrorMessageFromZodError(() =>
      z
        .string()
        .refine(() => false, { params: { i18n: "errors.custom" } })
        .parse("")
    )
  ).toEqual("Invalid input");
});
