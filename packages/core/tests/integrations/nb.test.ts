import { beforeAll, expect, test } from "vitest";
import { z } from "zod";
import { getErrorMessage, getErrorMessageFromZodError, init } from "./helpers";

const LOCALE = "nb";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Må ikke være tom"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Forventet streng, mottok nummer"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Forventet streng, mottok boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Forventet streng, mottok funksjon"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Forventet streng, mottok dato"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Ugyldig e-postadresse"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Ugyldig URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("Ugyldig");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Ugyldig inndata: må starte med "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Ugyldig inndata: må slutte med "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Strengen må inneholde minst 5 bokstav(er)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Strengen må være mindre eller lik 5 tegn"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Strengen må inneholde nøyaktig 5 tegn"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Ugyldig dato og klokkeslett");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Må ikke være tom"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Må ikke være tom");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Forventet nummer, mottok streng"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Forventet nummer, mottok NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Forventet heltall, mottok flyttall"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Tallet må være et multiplum av 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Tallet må være et multiplum av 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Tallet må være mindre enn 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Tallet må være mindre enn eller lik 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Tallet må være større enn 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Tallet må være større enn eller lik 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Tallet må være større enn eller lik 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Tallet må være mindre enn eller lik 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Tallet må være mindre enn 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Tallet må være større enn 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Tallet må være endelig"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Forventet dato, mottok streng"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Datoen må være større enn eller lik ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Datoen må være mindre enn eller lik ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Ugyldig dato");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Forventet array, mottok streng"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Array må inneholde minst 5 element(er)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Array må inneholde maksimalt 2 element(er)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Array må inneholde minst 1 element(er)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Array må inneholde nøyaktig 2 element(er)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Ugyldig returtype"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Ugyldige funksjonsargumenter"
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
  ).toEqual("Kryssresultater kunne ikke slås sammen");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Ugyldig bokstavlig verdi, forventet 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Ugyldig enum-verdi. Forventet 'A' | 'B' | 'C', mottatt 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Ukjent nøkkel i objektet: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Ugyldig diskriminatorverdi, forventet 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Ugyldig inndata");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Ugyldig inndata");
});
