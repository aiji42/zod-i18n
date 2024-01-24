import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "ru";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Обязательное поле"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Ожидался тип - строка, получено - число"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Ожидался тип - строка, получено - булево значение"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Ожидался тип - строка, получено - функция"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Ожидался тип - строка, получено - дата"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Неверный Email"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Неверный URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Неверное регулярное выражение"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Неверный формат, должен начинаться с "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Неверный формат, должен заканчиваться на "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Строка должна содержать не менее 5 символа(ов)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Строка должна содержать не более 5 символа(ов)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Строка должна содержать ровно 5 символа(ов)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Неверная дата и время");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Обязательное поле"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Обязательное поле");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Ожидался тип - число, получено - строка"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Ожидался тип - число, получено - NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Ожидался тип - целое число, получено - число с плавающей точкой"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Число должно быть кратно 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Число должно быть кратно 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Число должно быть меньше 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Число должно быть меньше или равно 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Число должно быть больше 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Число должно быть больше или равно 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Число должно быть больше или равно 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Число должно быть меньше или равно 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Число должно быть меньше 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Число должно быть больше 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Число должно быть конечным"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Ожидался тип - дата, получено - строка"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Дата должна быть больше или равна ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Дата должна быть меньше или равна ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "Неверный формат даты"
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Ожидался тип - массив, получено - строка"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Массив должен содержать не менее 5 элемента(ов)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Массив должен содержать не более 2 элемента(ов)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Массив должен содержать не менее 1 элемента(ов)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Массив должен содержать ровно 2 элемента(ов)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Неверный тип возвращаемого значения функции"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Неверный тип аргументов функции"
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
  ).toEqual("Результаты пересечения не могут быть объединены");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Неверное значение литерала, ожидалось 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Неверное значение перечисления. Ожидалось 'A' | 'B' | 'C', получено 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Неверные ключи в объекте: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Неверное значение дискриминатора. Ожидалось 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Результаты пересечения не могут быть объединены");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Неверный ввод");
});
