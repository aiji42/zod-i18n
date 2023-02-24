import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "pl";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Wymagane");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Oczekiwano: ciąg znaków, otrzymano: liczba"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Oczekiwano: ciąg znaków, otrzymano: wartość boolowska"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Oczekiwano: ciąg znaków, otrzymano: funkcja"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Oczekiwano: ciąg znaków, otrzymano: data"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Niewłaściwy adres email"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Niewłaściwy URL"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Niewłaściwa wartość"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Niewłaściwa wartość: musi zaczynać się na "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Niewłaściwa wartość: musi kończyć się na "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Ciąg znaków musi zawierać co najmniej 5 znak(ów)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Ciąg znaków może zawierać co najwyżej 5 znak(ów)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Ciąg znaków musi zawierać dokładnie 5 znak(ów)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Niewłaściwa data i czas");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Wymagane");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Oczekiwano: liczba, otrzymano: ciąg znaków"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Oczekiwano: liczba, otrzymano: null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Oczekiwano: liczba, otrzymano: NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Oczekiwano: liczba całkowita, otrzymano: liczba zmiennoprzecinkowa"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Liczba musi być wielokrotnością 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Liczba musi być wielokrotnością 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Liczba musi być mniejsza niż 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Liczba musi być mniejsza lub równa 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Liczba musi być większa niż 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Liczba musi być większa lub równa 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Liczba musi być większa lub równa 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Liczba musi być mniejsza lub równa 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Liczba musi być mniejsza niż 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Liczba musi być większa niż 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Liczba musi być skończona"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Oczekiwano: data, otrzymano: ciąg znaków"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Data musi być większa lub równa ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Data musi być mniejsza lub równa ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Niewłaściwa data");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Oczekiwano: tablica, otrzymano: ciąg znaków"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Tablica musi zawierać co najmniej 5 element(ów)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Tablica musi zawierać co najwyżej 2 element(ów)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Tablica musi zawierać co najmniej 1 element(ów)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Tablica musi zawierać dokładnie 2 element(ów)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Niewłaściwy typ zwrotny funkcji"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Niewłaściwe argumenty funkcji"
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
  ).toEqual("Wyniki skrzyżowania nie mogły zostać połączone");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Niewłaściwa wartość literału, oczekiwano: 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Niewłaściwa wartość wyliczeniowa. Oczekiwano: 'A' | 'B' | 'C', otrzymano: 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Nierozpoznany klucz(e) w obiekcie: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Niewłaściwa wartość dyskryminatora. Oczekiwano: 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Niewłaściwa wartość");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Niewłaściwa wartość");
});
