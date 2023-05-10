import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "he";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("נדרש");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "צפוי מחרוזת, קיבלנו מספר"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "צפוי מחרוזת, קיבלנו בוליאני"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "צפוי מחרוזת, קיבלנו פונקציה"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "צפוי מחרוזת, קיבלנו תאריך"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    'כתובת דוא"ל לא תקינה'
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "כתובת אינטרנט לא תקינה"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "קלט לא תקין"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'קלט לא תקין: חייב להתחיל ב-"foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'קלט לא תקין: חייב להסתיים ב-"bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "המחרוזת חייבת להכיל לפחות 5 תווים"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "המחרוזת חייבת להכיל לכל היותר 5 תווים"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "המחרוזת חייבת להכיל בדיוק 5 תווים"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("תאריך ושעה לא תקינים");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("נדרש");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "צפוי מספר, קיבלנו מחרוזת"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "צפוי מספר, קיבלנו null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "צפוי מספר, קיבלנו NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "צפוי מספר שלם, קיבלנו מספר עשרוני"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "המספר חייב להיות מכפלה של 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "המספר חייב להיות מכפלה של 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "המספר חייב להיות קטן מ-5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "המספר חייב להיות קטן או שווה ל-5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "המספר חייב להיות גדול מ-5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "המספר חייב להיות גדול או שווה ל-5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "המספר חייב להיות גדול או שווה ל-0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "המספר חייב להיות קטן או שווה ל-0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "המספר חייב להיות קטן מ-0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "המספר חייב להיות גדול מ-0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "המספר חייב להיות סופי"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "צפוי תאריך, קיבלנו מחרוזת"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `התאריך חייב להיות גדול או שווה ל-${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `התאריך חייב להיות קטן או שווה ל-${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("תאריך לא תקין");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "צפוי מערך, קיבלנו מחרוזת"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "המערך חייב להכיל לפחות 5 איברים"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "המערך חייב להכיל לכל היותר 2 איברים"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "המערך חייב להכיל לפחות 1 איברים"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "המערך חייב להכיל בדיוק 2 איברים"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "סוג ההחזרה של הפונקציה לא תקין"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "פרמטרים לפונקציה לא תקינים"
  );
});

test("other parser error messages", () => {
  expect(
    getErrorMessage(
      z
        .intersection(
          z.number(),
          z.number().transform((x) => x + 1)
        )
        .safeParse(1234)
    )
  ).toEqual("לא ניתן למזג את הסוגים");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "ערך לא תקין, צפוי 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "ערך לא תקין לסוג enum. ציפיתי ל-'A' | 'B' | 'C', קיבלתי 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("מפתחות לא מזוהים באובייקט: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("ערך מזהה לא תקין. צפוי 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("קלט לא תקין");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("קלט לא תקין");
});
