import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { initIcu, getErrorMessage } from "./helpers.icu";

const LOCALE = "fr";

beforeAll(async () => {
  await initIcu(LOCALE);
});

test("literal apostrophes in the French ICU template are preserved", () => {
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

  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "La valeur « D » n'existe pas dans les options : 'A' | 'B' | 'C'"
  );
});

test("string parser error messages (ICU)", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obligatoire");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Le type « chaîne de caractères » est attendu mais « nombre » a été reçu"
  );
});
