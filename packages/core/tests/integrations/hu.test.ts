import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "hu";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Kötelező");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Várt: sztring, kapott: szám"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Várt: sztring, kapott: logikai"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Várt: sztring, kapott: függvény"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Várt: sztring, kapott: dátum"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Érvénytelen e-mail cím"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Érvénytelen url"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Érvénytelen"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Érvénytelen bemenet: "foo"-sel kell kezdődnie'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Érvénytelen bemenet: "bar"-re kell végződnie'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "A szövegnek legalább 5 karakterből kell állnia"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "A szöveg legfeljebb 5 karakterből állhat"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "A szövegnek pontosan 5 karakterből kell állnia"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Érvénytelen dátum és idő");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Kötelező");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Kötelező");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Várt: szám, kapott: sztring"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Várt: szám, kapott: NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Várt: egész, kapott: lebegőpontos"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "A számnak a(z) 5 többszörösének kell lennie"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "A számnak a(z) 0.1 többszörösének kell lennie"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "A szám értéke legyen kisebb, mint 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "A szám értéke legyen kisebb vagy egyenlő, mint 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "A szám értéke legyen nagyobb, mint 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "A szám értéke legyen nagyobb vagy egyenlő, mint 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "A szám értéke legyen nagyobb vagy egyenlő, mint 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "A szám értéke legyen kisebb vagy egyenlő, mint 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "A szám értéke legyen kisebb, mint 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "A szám értéke legyen nagyobb, mint 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "A számnak végesnek kell lennie"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Várt: dátum, kapott: sztring"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `A dátumnak nagyobbnak vagy egyenlőnek kell lennie, mint ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `A dátumnak kisebbnek vagy egyenlőnek kell lennie, mint ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Érvénytelen dátum");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Várt: tömb, kapott: sztring"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "A tömbnek legalább 5 elemet kell tartalmaznia"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "A tömb legfeljebb 2 elemet tartalmazhat"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "A tömbnek legalább 1 elemet kell tartalmaznia"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "A tömbnek pontosan 2 elemet kell tartalmaznia"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Érvénytelen függvény visszatérési típus"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Érvénytelen függvényargumentumok"
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
  ).toEqual("A metszet eredményei nem egyesíthetők");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Érvénytelen literál érték, várt: 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Érvénytelen enum érték. Várt: 'A' | 'B' | 'C', kapott: 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Ismeretlen kulcs(ok) az objektumban: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Érvénytelen diszkriminátor érték. Várt: 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Érvénytelen bemenet");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Érvénytelen bemenet");
});
