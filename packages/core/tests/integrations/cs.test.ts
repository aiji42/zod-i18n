import { beforeAll, expect, test } from "vitest";
import { z } from "zod";
import { getErrorMessage, getErrorMessageFromZodError, init } from "./helpers";

const LOCALE = "cs";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Povinné");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Typ vstupu musí být text, ale byl obdržen typ číslo"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Typ vstupu musí být text, ale byl obdržen typ boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Typ vstupu musí být text, ale byl obdržen typ funkce"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Typ vstupu musí být text, ale byl obdržen typ datum"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Neplatný e-mail"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Neplatná url");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Neplatná kombinace"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Neplatný vstup: musí začínat "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Neplatný vstup: musí končit "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Text musí obsahovat alespoň 5 znak/znaků"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Text musí obsahovat nejvýše 5 znak/znaků"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Text musí obsahovat přesně 5 znak/znaků"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Neplatné datum a čas");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Povinné");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Typ vstupu musí být číslo, ale byl obdržen typ text"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Typ vstupu musí být číslo, ale byl obdržen typ null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Typ vstupu musí být číslo, ale byl obdržen typ nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Typ vstupu musí být celé číslo, ale byl obdržen typ reálné číslo"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Číslo musí být násobkem 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Číslo musí být násobkem 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Číslo musí být menší než 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Číslo musí být menší nebo rovno 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Číslo musí být větší než 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Číslo musí být větší nebo rovno 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Číslo musí být větší nebo rovno 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Číslo musí být menší nebo rovno 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Číslo musí být menší než 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Číslo musí být větší než 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Číslo nesmí být nekonečné"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Typ vstupu musí být datum, ale byl obdržen typ text"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Datum musí být větší nebo rovno ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Datum musí být menší nebo rovno ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Neplatné datum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Typ vstupu musí být pole, ale byl obdržen typ text"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Pole musí obsahovat alespoň 5 prvek/prvků"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Pole musí obsahovat nejvýše 2 prvek/prvků"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Pole musí obsahovat alespoň 1 prvek/prvků"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Pole musí obsahovat přesně 2 prvek/prvků"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Neplatný typ návratové hodnoty"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Neplatné argumenty funkce"
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
  ).toEqual("Hodnoty průniku nelze sloučit");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Neplatná doslovná hodnota, očekává se 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Neplatná hodnota výčtu. Očekává se 'A' | 'B' | 'C', ale bylo obdrženo 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Nerozpoznané klíče v objektu: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Neplatná hodnota diskriminátoru. Očekává se 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Neplatný vstup");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Neplatný vstup");
});
