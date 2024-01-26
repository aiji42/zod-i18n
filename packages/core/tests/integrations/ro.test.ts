import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "ro";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoriu");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Tipul de date așteptat era șir de caractere, s-a primit număr"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Tipul de date așteptat era șir de caractere, s-a primit boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Tipul de date așteptat era șir de caractere, s-a primit funcție"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Tipul de date așteptat era șir de caractere, s-a primit dată"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "E-mail nevalid"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("URL nevalid");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("Nevalid");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Intrare nevalidă: trebuie să înceapă cu "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Intrare nevalidă: trebuie să se termine cu "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Șirul trebuie să conțină cel puțin 5 caracter(e)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Șirul trebuie să conțină cel mult 5 caracter(e)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Șirul trebuie să conțină exact 5 caracter(e)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Dată și timp nevalid");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoriu");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Obligatoriu");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Tipul de date așteptat era număr, s-a primit șir de caractere"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Tipul de date așteptat era număr, s-a primit NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Tipul de date așteptat era număr întreg, s-a primit număr zecimal"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Numărul trebuie să fie multiplu de 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Numărul trebuie să fie multiplu de 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Numărul trebuie să fie strict mai mic decât 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Numărul trebuie să fie mai mic sau egal cu 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Numărul trebuie să fie strict mai mare decât 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Numărul trebuie să fie mai mare sau egal cu 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Numărul trebuie să fie mai mare sau egal cu 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Numărul trebuie să fie mai mic sau egal cu 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Numărul trebuie să fie strict mai mic decât 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Numărul trebuie să fie strict mai mare decât 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Numărul trebuie să fie finit"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Tipul de date așteptat era dată, s-a primit șir de caractere"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Data trebuie să fie mai mare sau egală cu ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Data trebuie să fie mai mică sau egală cu ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Dată nevalidă");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Tipul de date așteptat era listă, s-a primit șir de caractere"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Lista trebuie să conțină cel puțin 5 element(e)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Lista trebuie să conțină cel mult 2 element(e)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Lista trebuie să conțină cel puțin 1 element(e)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Lista trebuie să conțină exact 2 element(e)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Tip de date returnat de funcție nevalid"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Parametri nevalizi pentru funcție"
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
  ).toEqual("Rezultatele intersecției nu s-au putut îmbina");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valoare literală nevalidă, valoarea așteptată era 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Valoare nevalidă pentru enum. Valori așteptate: 'A' | 'B' | 'C', s-a primit: 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Chei/e nerecunoscută/e în obiect: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual(
    "Valoare nevalidă pentru discriminant. Valori așteptate: 'a' | 'b'"
  );
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Intrare nevalidă");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Intrare nevalidă");
});
