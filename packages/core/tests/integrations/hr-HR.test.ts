import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "hr-HR";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obvezno polje");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Očekivano: tekst, uneseno: broj"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Očekivano: tekst, uneseno: boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Očekivano: tekst, uneseno: funkcija"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Očekivano: tekst, uneseno: datum"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Neispravan email"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Neispravan url");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Neispravno"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Neispravan unos: mora započeti s "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Neispravan unos: mora završiti s "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Tekst mora sadržavati barem 5 znak(ova)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Tekst mora sadržavati najviše 5 znak(ova)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Tekst mora sadržavati točno 5 znak(ova)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Neispravan datum i vrijeme");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obvezno polje");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Obvezno polje");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Očekivano: broj, uneseno: tekst"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Očekivano: broj, uneseno: nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Očekivano: broj, uneseno: decimalni broj"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Broj mora biti višekratnik od 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Broj mora biti višekratnik od 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Broj mora biti manji od 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Broj mora biti manji od ili jednak 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Broj mora biti veći od 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Broj mora biti veći od ili jednak 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Broj mora biti veći od ili jednak 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Broj mora biti manji od ili jednak 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Broj mora biti manji od 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Broj mora biti veći od 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Broj mora biti konačan"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Očekivano: datum, uneseno: tekst"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Datum mora biti veći od ili jednak ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Datum mora biti manji od ili jednak ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Neispravan datum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Očekivano: niz, uneseno: tekst"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Niz mora sadržavati barem 5 element(a)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Niz mora sadržavati najviše 2 element(a)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Niz mora sadržavati barem 1 element(a)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Niz mora sadržavati točno 2 element(a)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Neispravan tip povratne vrijednosti"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Neispravni argumenti funkcije"
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
  ).toEqual("Rezultati presjecanja nisu se mogli spojiti");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Neispravna literalna vrijednost, očekivano 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Neispravna vrijednost enumeracije. Očekivano 'A' | 'B' | 'C', uneseno 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Neprepoznat(i) ključ(evi) u objektu: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Neispravna vrijednost diskriminatora. Očekivano 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Neispravan unos");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Neispravan unos");
});
