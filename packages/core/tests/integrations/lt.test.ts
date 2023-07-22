import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "lt";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Šis laukas yra privalomas"
  );
  //Here the "tekstas" should be "teksto", but I believe there is no way to resolve it.
  //Because, if it would be the received type then it would be written as "tesktas".
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Tikėtasi tekstas, gauta(s) skaičius"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Tikėtasi tekstas, gauta(s) loginė reikšmė"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Tikėtasi tekstas, gauta(s) funkcija"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Tikėtasi tekstas, gauta(s) data"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Klaidingas el. paštas"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Klaidinga nuoroda"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Klaidingas reguliarus išraiškos šablonas"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Klaidinga įvestis: privaloma pradžia "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Klaidinga įvestis: privaloma pabaiga "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Tekstas privalo būti sudarytas, bent iš 5 simbolio(ių)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Tekstas negali būti sudarytas iš daugiau, nei 5 simbolio(ių)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Tekstas privalo būti sudarytas iš 5 simbolio(ių)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Klaidinga datos ir laiko reikšmė");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Šis laukas yra privalomas"
  );
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Tikėtasi skaičius, gauta(s) tekstas"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Tikėtasi skaičius, gauta(s) null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Tikėtasi skaičius, gauta(s) nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Tikėtasi sveikasis skaičius, gauta(s) slankusis kablelis"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Skaičius privalo būti 5 kartotinis"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Skaičius privalo būti 0.1 kartotinis"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Skaičius privalo būti mažesnis, nei 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Skaičius privalo būti mažesnis arba lygus 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Skaičius privalo būti didesnis, nei 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Skaičius privalo būti didesnis arba lygus 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Skaičius privalo būti didesnis arba lygus 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Skaičius privalo būti mažesnis arba lygus 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Skaičius privalo būti mažesnis, nei 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Skaičius privalo būti didesnis, nei 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Skaičius privalo būti baigtinis"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Tikėtasi data, gauta(s) tekstas"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Data privalo būti vėlesnė arba lygi ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Data privalo būti ankstesnė arba lygi ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Klaidinga data");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Tikėtasi masyvas, gauta(s) tekstas"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Masyvas privalo turėti bent 5 elementą(us)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Masyvas negali turėti daugiau, nei 2 elementą(us)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Masyvas privalo turėti bent 1 elementą(us)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Masyvas privalo turėti 2 elementą(us)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Klaidingas funkcijos gražinamos reikšmės tipas"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Klaidingi funkcijos argumentai"
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
  ).toEqual("Negalima sujungti sankirtos rezultatų");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Klaidinga literalo reikšmė, tikėtasi 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Klaidinga reikšmė. Tikėtasi 'A' | 'B' | 'C', gauta 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Neatpažintas(i) raktas(ai) objekte: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Netinkama diksriminanto reikšmė. Tikėtasi 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Klaidinga įvestis");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Klaidinga įvestis");
});
