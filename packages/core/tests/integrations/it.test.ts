import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "it";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obbligatorio");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Atteso string, ricevuto number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Atteso string, ricevuto boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Atteso string, ricevuto function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Atteso string, ricevuto date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "email non valida"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("url non valido");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Non valida"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Input non valido: deve iniziare con "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Input non valido: deve finire con "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "La stringa deve contenere almeno 5 caratteri"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "La stringa deve contenere al massimo 5 caratteri"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "La stringa deve contenere esattamente 5 caratteri"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("datetime non valido");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obbligatorio");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Atteso number, ricevuto string"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Atteso number, ricevuto null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Atteso number, ricevuto nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Atteso integer, ricevuto float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Il numero deve essere un multiplo di 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Il numero deve essere un multiplo di 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Il numero deve essere minore di 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Il numero deve essere minore di o uguale a 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Il numero deve essere maggiore di 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Il numero deve essere maggiore o uguale a 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Il numero deve essere maggiore o uguale a 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Il numero deve essere minore di o uguale a 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Il numero deve essere minore di 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Il numero deve essere maggiore di 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Il numero deve essere finito"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Atteso date, ricevuto string"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `La data deve essere maggiore di o uguale a ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `La data deve essere minore di o uguale a ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Data non valida");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Atteso array, ricevuto string"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "L'array deve contenere almeno 5 elementi"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "L'array deve contenere al massimo 2 elementi"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "L'array deve contenere almeno 1 elementi"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "L'array deve contenere esattamente 2 elementi"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Tipo di ritorno della funzione non valido"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Argomenti della funzione non validi"
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
  ).toEqual("Il risultato dell'intersezione non può essere unito");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valore literal non valido, atteso 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Valore dell'enum non valido. Atteso 'A' | 'B' | 'C', ricevuto 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Campo/i non riconosciuto nell'oggetto: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Valore discriminante non valido. Atteso 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Input non valido");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Input non valido");
});
