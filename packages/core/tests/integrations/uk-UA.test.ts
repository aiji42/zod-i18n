import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "uk-UA";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Обов'язковe поле"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Очікувався тип string, отримано number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Очікувався тип string, отримано boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Очікувався тип string, отримано function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Очікувався тип string, отримано date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Невірний email"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Невірний url");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Невдала валідація"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Невірне введення: повинно починатись з "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Невірне введення: повинно закінчуватись на "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Рядок повинен містити щонайменше 5 символа(-ів)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Рядок повинен містити не більше 5 символа(-ів)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Рядок повинен містити рівно 5 символа(-ів)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Невірний формат datetime");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Обов'язковe поле"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Обов'язковe поле");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Очікувався тип number, отримано string"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Очікувався тип number, отримано NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Очікувався тип integer, отримано float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Число повинно бути кратним 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Число повинно бути кратним 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Число повинно бути менше 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Число повинно бути менше або дорівнювати 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Число повинно бути більше 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Число повинно бути більше або дорівнювати 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Число повинно бути більше або дорівнювати 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Число повинно бути менше або дорівнювати 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Число повинно бути менше 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Число повинно бути більше 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Число повинно бути скінченним"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Очікувався тип date, отримано string"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Дата повинно бути більшою або рівною ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Дата повинна бути меншою або дорівнювати ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "Невірний формат дати"
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Очікувався тип array, отримано string"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Масив повинен містити щонайменше 5 елемента(-ів)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Масив повинен містити не більше 2 елемента(-ів)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Масив повинен містити щонайменше 1 елемента(-ів)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Масив повинен містити рівно 2 елемента(-ів)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Невірний тип значення, що повертається функцією"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Невірні аргументи функції"
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
  ).toEqual("Результати перетину не вдалося об'єднати");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Невірне літеральне значення, очікувалось 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Невірне значення enum. Очікувалося 'A' | 'B' | 'C', отримано 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Нерозпізнані ключі в об'єкті: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Неправильне значення дискримінатора. Очікувалось 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Невірне введення");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Невірне введення");
});
