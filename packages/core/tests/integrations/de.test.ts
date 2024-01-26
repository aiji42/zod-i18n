import { beforeAll, expect, test } from "vitest";
import { z } from "zod";
import { getErrorMessage, getErrorMessageFromZodError, init } from "./helpers";

const LOCALE = "de";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Darf nicht leer sein"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "String erwartet, Zahl erhalten"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "String erwartet, Boolean erhalten"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "String erwartet, Funktion erhalten"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "String erwartet, Datum erhalten"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Ungültige E-Mail-Adresse"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Ungültige URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Ungültig"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Ungültige Eingabe: muss mit "foo" beginnen'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Ungültige Eingabe: muss mit "bar" enden'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "String muss mindestens 5 Zeichen enthalten"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "String darf höchstens 5 Zeichen enthalten"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "String muss genau 5 Zeichen enthalten"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Ungültiger Datums- und Uhrzeitwert");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Darf nicht leer sein"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Darf nicht leer sein"
  );
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Zahl erwartet, String erhalten"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Zahl erwartet, NaN erhalten"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Ganzzahl erwartet, Gleitkommazahl erhalten"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Zahl muss ein Vielfaches von 5 sein"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Zahl muss ein Vielfaches von 0.1 sein"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Zahl muss kleiner als 5 sein"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Zahl muss kleiner oder gleich 5 sein"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Zahl muss größer als 5 sein"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Zahl muss größer oder gleich 5 sein"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Zahl muss größer oder gleich 0 sein"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Zahl muss kleiner oder gleich 0 sein"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Zahl muss kleiner als 0 sein"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Zahl muss größer als 0 sein"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Zahl muss endlich sein"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Datum erwartet, String erhalten"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Datum muss größer oder gleich ${testDate.toLocaleDateString(LOCALE)} sein`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Datum muss kleiner oder gleich ${testDate.toLocaleDateString(LOCALE)} sein`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Ungültiges Datum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Array erwartet, String erhalten"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Array muss mindestens 5 Element(e) enthalten"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Array darf höchstens 2 Element(e) enthalten"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Array muss mindestens 1 Element(e) enthalten"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Array muss genau 2 Element(e) enthalten"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Ungültiger Funktionsrückgabewert"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Ungültige Funktionsargumente"
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
  ).toEqual("Schnittmengenergebnisse konnten nicht zusammengeführt werden");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Ungültiger Literalwert, 12 erwartet"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Ungültiger Enum-Wert. 'A' | 'B' | 'C' erwartet, 'D' erhalten"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Unbekannte Schlüssel im Objekt: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Ungültiger Diskriminatorwert, 'a' | 'b' erwartet");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Ungültige Eingabe");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Ungültige Eingabe");
});
