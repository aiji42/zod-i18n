import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage } from "./helpers";

beforeAll(async () => {
  await init("en");
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Required");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Expected string, received number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Expected string, received boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Expected string, received function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Expected string, received date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Invalid email"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Invalid url");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("Invalid");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    "Invalid input: must start with foo"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "Invalid input: must end with bar"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "String must contain at least 5 character(s)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "String must contain at most 5 character(s)"
  );
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Required");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Expected number, received string"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Expected number, received null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Expected number, received nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Expected integer, received float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Number must be a multiple of 5"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Number must be less than 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Number must be less than or equal to 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Number must be greater than 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Number must be greater than or equal to 5"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Number must be greater than 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Number must be finite"
  );
});

test("date parser error messages", () => {
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Expected date, received string"
  );
  expect(
    getErrorMessage(
      schema.min(new Date("2022-08-01")).safeParse(new Date("2022-07-29"))
    )
  ).toEqual(`Date must be greater than or equal to 8/1/2022`);
  expect(
    getErrorMessage(
      schema.max(new Date("2022-08-01")).safeParse(new Date("2022-08-02"))
    )
  ).toEqual(`Date must be smaller than or equal to 8/1/2022`);
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Expected array, received string"
  );

  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Array must contain at least 5 element(s)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Array must contain at most 2 element(s)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Array must contain at least 1 element(s)"
  );
});

test("other parser error messages", () => {
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Invalid literal value, expected 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Invalid enum value. Expected 'A' | 'B' | 'C', received D"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Unrecognized key(s) in object: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Invalid discriminator value. Expected 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Invalid input");
});
