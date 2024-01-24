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
    "Le type « chaîne de caractères » est attendu mais « nombre » a été reçu"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Le type « chaîne de caractères » est attendu mais « booléen » a été reçu"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Le type « chaîne de caractères » est attendu mais « fonction » a été reçu"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Le type « chaîne de caractères » est attendu mais « date » a été reçu"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "e-mail non valide"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "lien non valide"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "expression régulière non valide"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    "Le champ doit commencer par « foo »"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "Le champ doit se terminer par « bar »"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "La chaîne doit contenir au moins 5 caractère(s)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "La chaîne doit contenir au plus 5 caractère(s)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "La chaîne doit contenir exactement 5 caractère(s)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("horodate non valide");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoire");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Obligatoire");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Le type « nombre » est attendu mais « chaîne de caractères » a été reçu"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Le type « nombre » est attendu mais « NaN » a été reçu"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Le type « entier » est attendu mais « décimal » a été reçu"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Le nombre doit être un multiple de 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Le nombre doit être un multiple de 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Le nombre doit être inférieur à 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Le nombre doit être inférieur ou égal à 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Le nombre doit être supérieur à 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Le nombre doit être supérieur ou égal à 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Le nombre doit être supérieur ou égal à 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Le nombre doit être inférieur ou égal à 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Le nombre doit être inférieur à 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Le nombre doit être supérieur à 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Le nombre doit être fini"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Le type « date » est attendu mais « chaîne de caractères » a été reçu"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `La date doit être ultérieure ou égale au ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `La date doit être antérieure ou égale au ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "La date est non valide"
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Le type « liste » est attendu mais « chaîne de caractères » a été reçu"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "La liste doit contenir au moins 5 élément(s)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "La liste doit contenir au plus 2 élément(s)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "La liste doit contenir au moins 1 élément(s)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "La liste doit contenir exactement 2 élément(s)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Le type de retour de la fonction n'est pas valide"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Les arguments de la fonction sont non valides"
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
    "La valeur doit être 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "La valeur « D » n'existe pas dans les options : 'A' | 'B' | 'C'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual(
    "Une ou plusieurs clé(s) non reconnue(s) dans l'objet : 'cat', 'rat'"
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
    "La valeur du discriminateur est non valide. Options attendues : 'a' | 'b'"
  );
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Champ non valide");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Champ non valide");
});
