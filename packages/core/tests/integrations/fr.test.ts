import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "fr";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoire");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Type invalide: chaîne de caractères doit être fourni(e), mais nombre a été reçu(e)"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Type invalide: chaîne de caractères doit être fourni(e), mais booléen a été reçu(e)"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Type invalide: chaîne de caractères doit être fourni(e), mais fonction a été reçu(e)"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Type invalide: chaîne de caractères doit être fourni(e), mais date a été reçu(e)"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "e-mail invalide"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("lien invalide");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "expression régulière invalide"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Champ invalide: doit commencer par "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Champ invalide: doit se terminer par "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Champ de texte doit contenir au moins 5 caractère(s)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Champ de texte doit contenir au plus 5 caractère(s)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Champ de texte doit contenir exactement 5 caractère(s)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("horodate invalide");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoire");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Type invalide: nombre doit être fourni(e), mais chaîne de caractères a été reçu(e)"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Type invalide: nombre doit être fourni(e), mais null a été reçu(e)"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Type invalide: nombre doit être fourni(e), mais NaN a été reçu(e)"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Type invalide: entier doit être fourni(e), mais décimal a été reçu(e)"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Nombre doit être multiple de 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Nombre doit être multiple de 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Nombre doit être inférieur à 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Nombre doit être inférieur ou égale à 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Nombre doit être supérieur à 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Nombre doit être supérieur ou égale à 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Nombre doit être supérieur ou égale à 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Nombre doit être inférieur ou égale à 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Nombre doit être inférieur à 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Nombre doit être supérieur à 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Nombre doit être fini"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Type invalide: date doit être fourni(e), mais chaîne de caractères a été reçu(e)"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Date doit être supérieure ou égale à ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Date doit être inférieure ou égale à ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Date invalide");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Type invalide: liste doit être fourni(e), mais chaîne de caractères a été reçu(e)"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Liste doit contenir au moins 5 élément(s)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Liste doit contenir au plus 2 élément(s)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Liste doit contenir au moins 1 élément(s)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Liste doit contenir exactement 2 élément(s)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Fonction a retourné un type invalide"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Fonction a reçu des arguments invalides"
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
  ).toEqual("Les résultats d'intersection n'ont pas pu être fusionnés");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valeur doit être 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Valeur 'D' n'existe pas dans les options: 'A' | 'B' | 'C'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual(
    "Une ou plusieurs clé(s) non reconnue(s) dans l'objet: 'cat', 'rat'"
  );
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
    "La valeur du discriminateur est invalide. Options attendus: 'a' | 'b'"
  );
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Champ invalide");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Champ invalide");
});
