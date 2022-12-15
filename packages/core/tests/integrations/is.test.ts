import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

beforeAll(async () => {
  await init("is");
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Nauðsynlegt");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Bjóst við streng, fékk tölu"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Bjóst við streng, fékk boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Bjóst við streng, fékk fall"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Bjóst við streng, fékk dagsetningu"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Ógilt netfang"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Ógild slóð");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("Ógilt");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Ógilt inntak: þarf að byrja á "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Ógilt inntak: þarf að enda á "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Strengur verður að innihalda að minnsta kosti 5 stafi"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Strengur getur ekki verið lengri en 5 stafir"
  );
  // TODO: add `zod:errors.(too_small|too_big).string.exact`
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "String must contain exactly 5 character(s)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Ógild dagsetning og tími");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Nauðsynlegt");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Bjóst við tölu, fékk streng"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Bjóst við tölu, fékk null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Bjóst við tölu, fékk nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Bjóst við heiltölu, fékk kommutölu"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Tala þarf að vera margfeldi af 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Tala þarf að vera margfeldi af 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Tala verður að vera minni en 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Tala verður að vera minni en eða jöfn 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Tala verður að vera stærri en 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Tala verður að vera stærri en eða jöfn 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Tala verður að vera stærri en eða jöfn 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Tala verður að vera minni en eða jöfn 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Tala verður að vera minni en 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Tala verður að vera stærri en 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Tala þarf að vera endanleg"
  );
});

test("date parser error messages", async () => {
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Bjóst við dagsetningu, fékk streng"
  );

  const testDate = new Date("2022-08-01");

  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Dagsetning verður að vera á eftir eða sama og ${testDate.toLocaleDateString(
      "is"
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Dagsetning verður að vera fyrr en eða sama og ${testDate.toLocaleDateString(
      "is"
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Ógild dagsetning");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Bjóst við fylki, fékk streng"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Fylki verður að innihalda að minnsta kosti 5 stök"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Fylki verður að innihalda að hámarki 2 stök"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Fylki verður að innihalda að minnsta kosti 1 stök"
  );
  // TODO: add `zod:errors.(too_small|too_big).array.exact`
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Array must contain exactly 2 element(s)"
  );
});

test("other parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Ógild skilategund á falli"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Ógildar aðgerðarbreytur"
  );
  expect(
    getErrorMessage(
      z
        .intersection(
          z.number(),
          z.number().transform((x) => x + 1)
        )
        .safeParse(1234)
    )
  ).toEqual("Ekki var hægt að sameina niðurstöður");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Ógilt bókstaflegt gildi, bjóst við 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Ógilt upptalningargildi. Bjóst við 'A' | 'B' | 'C', fékk 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Óþekktir lyklar í hlut: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Ógilt mismununargildi. Bjóst við 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Ógilt inntak");
});
