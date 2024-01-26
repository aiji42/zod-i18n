import { beforeAll, expect, test } from "vitest";
import { z } from "zod";
import { getErrorMessage, getErrorMessageFromZodError, init } from "./helpers";

const LOCALE = "bg";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Задължително поле"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Очаквано - низ, получено - число"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Очаквано - низ, получено - булев тип"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Очаквано - низ, получено - функция"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Очаквано - низ, получено - дата"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Невалиден имейл"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Невалиден URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Невалиден регулярен израз"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Невалидни данни: трябва да започва с "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Невалидни данни: трябва да завършва с "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Низът трябва да съдържа поне 5 знак(а)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Низът трябва да съдържа най-много 5 знак(а)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Низът трябва да съдържа точно 5 знак(а)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Невалидна дата");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Задължително поле"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Задължително поле");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Очаквано - число, получено - низ"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Очаквано - число, получено - NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Очаквано - цяло число, получено - число с плаваща запетая"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Числото трябва да бъде кратно на 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Числото трябва да бъде кратно на 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Числото трябва да бъде по-малко от 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Числото трябва да бъде по-малко или равно на 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Числото трябва да бъде по-голямо от 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Числото трябва да бъде по-голямо или равно на 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Числото трябва да бъде по-голямо или равно на 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Числото трябва да бъде по-малко или равно на 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Числото трябва да бъде по-малко от 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Числото трябва да бъде по-голямо от 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Числото трябва да бъде крайно"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Очаквано - дата, получено - низ"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Датата трябва да бъде по-голяма или равна на ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Датата трябва да бъде по-малка или равна на ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Невалидна дата");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Очаквано - масив, получено - низ"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Масивът трябва да съдържа поне 5 елемент(а)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Масивът трябва да съдържа най-много 2 елемент(а)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Масивът трябва да съдържа поне 1 елемент(а)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Масивът трябва да съдържа точно 2 елемент(а)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Невалиден тип на върнатата от функцията стойност"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Невалидни аргументи на функцията"
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
  ).toEqual("Резултатите от сечението не могат да бъдат обединени");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Невалиден литерал, очаквано 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Невалидна стойност на enum. Очаквано 'A' | 'B' | 'C', получено 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Неразпознат(и) ключ(ове) в обекта: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Невалидна стойност на дискриминатора. Очаквано 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Невалидно обединение");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Невалидни данни");
});
