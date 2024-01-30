import { beforeAll, expect, test } from "vitest";
import { z } from "zod";
import { getErrorMessage, getErrorMessageFromZodError, init } from "./helpers";

const LOCALE = "sk";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Povinné");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Typ vstupu musí byť text, ale bol obdržaný typ číslo"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Typ vstupu musí byť text, ale bol obdržaný typ boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Typ vstupu musí byť text, ale bol obdržaný typ funkcia"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Typ vstupu musí byť text, ale bol obdržaný typ dátum"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Neplatný e-mail"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Neplatná url");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Neplatná kombinácia"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Neplatný vstup: musí začínať "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Neplatný vstup: musí končiť "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Text musí obsahovať aspoň 5 znak(y)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Text musí obsahovať najviac 5 znak(y)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Text musí obsahovať presne 5 znak(y)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Neplatný dátum a čas");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Povinné");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Povinné");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Typ vstupu musí byť číslo, ale bol obdržaný typ text"
  );

  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Typ vstupu musí byť číslo, ale bol obdržaný typ NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Typ vstupu musí byť celé číslo, ale bol obdržaný typ reálne číslo"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Číslo musí byť násobkom 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Číslo musí byť násobkom 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Číslo musí byť menšie než 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Číslo musí byť menšie alebo rovné 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Číslo musí byť väčšie než 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Číslo musí byť väčšie alebo rovné 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Číslo musí byť väčšie alebo rovné 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Číslo musí byť menšie alebo rovné 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Číslo musí byť menšie než 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Číslo musí byť väčšie než 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Číslo nesmie byť nekonečné"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Typ vstupu musí byť dátum, ale bol obdržaný typ text"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Dátum musí byť väčší alebo rovný ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Dátum musí byť menší alebo rovný ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Neplatný dátum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Typ vstupu musí byť pole, ale bol obdržaný typ text"
  );

  const too_small = [];
  expect(getErrorMessage(schema.min(1).safeParse(too_small))).toEqual(
    "Pole musí obsahovať aspoň jeden prvok"
  );
  expect(getErrorMessage(schema.min(2).safeParse(too_small))).toEqual(
    "Pole musí obsahovať aspoň 2 prvky"
  );
  expect(getErrorMessage(schema.length(1).safeParse(too_small))).toEqual(
    "Pole musí obsahovať presne jeden prvok"
  );
  expect(getErrorMessage(schema.length(2).safeParse(too_small))).toEqual(
    "Pole musí obsahovať presne 2 prvky"
  );
  // too_small.not_inclusive
  expect(
    getErrorMessage(
      schema
        .superRefine((val, ctx) => {
          if (val.length <= 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_small,
              minimum: 2,
              type: "array",
              inclusive: false,
            });
          }
        })
        .safeParse(["", ""])
    )
  ).toEqual("Pole musí obsahovať viac ako 2 prvky");
  expect(
    getErrorMessage(
      schema
        .superRefine((val, ctx) => {
          if (val.length <= 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_small,
              minimum: 1,
              type: "array",
              inclusive: false,
            });
          }
        })
        .safeParse([""])
    )
  ).toEqual("Pole musí obsahovať aspoň dva prvky");

  const too_big = ["", "", ""];
  expect(getErrorMessage(schema.max(1).safeParse(too_big))).toEqual(
    "Pole musí obsahovať najviac jeden prvok"
  );
  expect(getErrorMessage(schema.max(2).safeParse(too_big))).toEqual(
    "Pole musí obsahovať najviac 2 prvky"
  );
  expect(getErrorMessage(schema.length(1).safeParse(too_big))).toEqual(
    "Pole musí obsahovať presne jeden prvok"
  );
  expect(getErrorMessage(schema.length(2).safeParse(too_big))).toEqual(
    "Pole musí obsahovať presne 2 prvky"
  );
  // too_big.not_inclusive
  expect(
    getErrorMessage(
      schema
        .superRefine((val, ctx) => {
          if (val.length >= 2) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_big,
              maximum: 2,
              type: "array",
              inclusive: false,
            });
          }
        })
        .safeParse(["", ""])
    )
  ).toEqual("Pole musí obsahovať menej než 2 prvky");
  expect(
    getErrorMessage(
      schema
        .superRefine((val, ctx) => {
          if (val.length >= 1) {
            ctx.addIssue({
              code: z.ZodIssueCode.too_big,
              maximum: 1,
              type: "array",
              inclusive: false,
            });
          }
        })
        .safeParse([""])
    )
  ).toEqual("Pole musí byť prázdne");
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Neplatný typ návratovej hodnoty"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Neplatné argumenty funkcie"
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
  ).toEqual("Hodnoty prieniku nie je možné zlúčiť");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Neplatná doslovná hodnota, očakáva sa 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Neplatná hodnota výčtu. Očakáva sa 'A' | 'B' | 'C', ale bolo obdržané 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Nerozpoznané kľúče v objekte: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Neplatná hodnota diskriminátora. Očakáva sa 'a' | 'b'");
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
