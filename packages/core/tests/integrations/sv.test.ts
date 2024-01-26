import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "sv";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoriskt");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Förväntade sträng, fick nummer"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Förväntade sträng, fick boolesk"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Förväntade sträng, fick funktion"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Förväntade sträng, fick datum"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Ogiltig e-post"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Ogiltig webbadress"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Ogiltigt"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Ogiltig inmatning: måste börja med "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Ogiltig inmatning: måste sluta med "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Strängen måste innehålla minst 5 tecken"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Strängen måste innehålla högst 5 tecken"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Strängen måste innehålla exakt 5 tecken"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Ogiltig datumtid");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoriskt");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Obligatoriskt");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Förväntade nummer, fick sträng"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Förväntade nummer, fick NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Förväntade heltal, fick flyttal"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Numret måste vara ett multipel av 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Numret måste vara ett multipel av 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Numret måste vara mindre än 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Numret måste vara högst 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Numret måste vara större än 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Numret måste vara större än eller lika med 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Numret måste vara större än eller lika med 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Numret måste vara högst 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Numret måste vara mindre än 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Numret måste vara större än 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Numret måste vara ändligt"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Förväntade datum, fick sträng"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Datumet måste vara större än eller lika med ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Datumet måste vara mindre än eller lika med ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Ogiltigt datum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Förväntade array, fick sträng"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Arrayen måste innehålla minst 5 element"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Arrayen måste innehålla högst 2 element"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Arrayen måste innehålla minst 1 element"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Arrayen måste innehålla exakt 2 element"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Ogiltig returtyp för funktionen"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Ogiltiga funktionsargument"
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
  ).toEqual("Sammansättningsresultaten kunde inte slås samman");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Ogiltigt literalvärde, förväntade 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Ogiltigt enumvärde. Förväntade 'A' | 'B' | 'C', fick 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Okänd(a) nyckel(ar) i objektet: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Ogiltigt diskriminatorsvärde. Förväntade 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Ogiltig inmatning");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Ogiltig inmatning");
});
