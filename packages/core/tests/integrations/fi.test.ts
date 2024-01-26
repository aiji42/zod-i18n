import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "fi";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Vaadittu");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Odotettiin arvon olevan merkkijono, saatiin numero"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Odotettiin arvon olevan merkkijono, saatiin totuusarvo"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Odotettiin arvon olevan merkkijono, saatiin funktio"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Odotettiin arvon olevan merkkijono, saatiin päivämäärä"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Virheellinen sähköpostiosoite"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Virheellinen URL"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Virheellinen"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Virheellinen syöte: täytyy alkaa "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Virheellinen syöte: täytyy päättyä "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Merkkijonon tulee sisältää vähintään 5 merkkiä"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Merkkijonon tulee sisältää enintään 5 merkkiä"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Merkkijonon tulee sisältää täsmälleen 5 merkkiä"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Virheellinen päivämäärä");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Vaadittu");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Vaadittu");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Odotettiin arvon olevan numero, saatiin merkkijono"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Odotettiin arvon olevan numero, saatiin ei-luku"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Odotettiin arvon olevan kokonaisluku, saatiin desimaaliluku"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Numeron tulee olla luvun 5 monikerta"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Numeron tulee olla luvun 0.1 monikerta"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Numeron tulee olla pienempi kuin 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Numeron tulee olla pienempi tai yhtä suuri kuin 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Numeron tulee olla suurempi kuin 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Numeron tulee olla suurempi tai yhtä suuri kuin 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Numeron tulee olla suurempi tai yhtä suuri kuin 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Numeron tulee olla pienempi tai yhtä suuri kuin 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Numeron tulee olla pienempi kuin 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Numeron tulee olla suurempi kuin 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Numeron tulee olla äärellinen"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Odotettiin arvon olevan päivämäärä, saatiin merkkijono"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Päivämäärän on oltava suurempi tai yhtä suuri kuin ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Päivämäärän on oltava pienempi tai yhtä suuri kuin ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "Virheellinen päivämäärä"
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Odotettiin arvon olevan taulukko, saatiin merkkijono"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Taulukon tulee sisältää vähintään 5 alkiota"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Taulukon tulee sisältää enintään 2 alkiota"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Taulukon tulee sisältää vähintään 1 alkiota"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Taulukon tulee sisältää tarkalleen 2 alkiota"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Virheellinen funktion palautustyyppi"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Virheelliset funktion argumentit"
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
  ).toEqual("Risteystuloksia ei voitu yhdistää");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Virheellinen merkkijono, odotettiin 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Virheellinen vaihtoehto. Odotettiin 'A' | 'B' | 'C', saatiin 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Tuntemattomia avaimia objektissa: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Virheellinen erottimen arvo. Odotettiin 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Virheellinen syöte");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Virheellinen syöte");
});
