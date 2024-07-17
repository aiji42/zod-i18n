import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "pt";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obrigatório");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "O dado deve ser do tipo string, porém foi enviado number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "O dado deve ser do tipo string, porém foi enviado boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "O dado deve ser do tipo string, porém foi enviado function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "O dado deve ser do tipo string, porém foi enviado date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "E-mail inválido"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("URL inválida");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Combinação inválida"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Entrada inválida: deve iniciar com "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Entrada inválida: deve terminar com "bar"'
  );
  expect(getErrorMessage(schema.length(1).safeParse("abcdef"))).toEqual(
    "Texto deve conter exatamente 1 caracter"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Texto deve conter exatamente 5 caracteres"
  );
  expect(getErrorMessage(schema.min(1).safeParse(""))).toEqual(
    "Texto deve conter pelo menos 1 caracter"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Texto deve conter pelo menos 5 caracteres"
  );
  expect(getErrorMessage(schema.max(1).safeParse("abcdef"))).toEqual(
    "Texto pode conter no máximo 1 caracter"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Texto pode conter no máximo 5 caracteres"
  );
  // TODO: translation `datetime` (zod:validations.datetime and zod:errors.invalid_string.datetime)
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("datetime inválido");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obrigatório");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Obrigatório");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "O dado deve ser do tipo number, porém foi enviado string"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "O dado deve ser do tipo number, porém foi enviado nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "O dado deve ser do tipo integer, porém foi enviado float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "O número deverá ser múltiplo de 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "O número deverá ser múltiplo de 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Número deve ser menor que 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Número deve ser menor ou igual a 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Número deve ser maior que 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Número deve ser maior ou igual a 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Número deve ser maior ou igual a 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Número deve ser menor ou igual a 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Número deve ser menor que 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Número deve ser maior que 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Número não pode ser infinito"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "O dado deve ser do tipo date, porém foi enviado string"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Data deve ser maior ou igual a ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Data deve ser menor ou igual a ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Data inválida");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "O dado deve ser do tipo array, porém foi enviado string"
  );
  expect(getErrorMessage(schema.length(1).safeParse([]))).toEqual(
    "Lista deve conter exatamente 1 elemento"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Lista deve conter exatamente 2 elementos"
  );
  expect(getErrorMessage(schema.min(1).safeParse([]))).toEqual(
    "Lista deve conter no mínimo 1 elemento"
  );
  expect(getErrorMessage(schema.min(2).safeParse([""]))).toEqual(
    "Lista deve conter no mínimo 2 elementos"
  );
  expect(getErrorMessage(schema.max(1).safeParse(["", "", ""]))).toEqual(
    "Lista deve conter no máximo 1 elemento"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Lista deve conter no máximo 2 elementos"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Lista deve conter no mínimo 1 elemento"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Tipo de retorno de função inválido"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Argumento de função inválido"
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
  ).toEqual("Valores de interseção não poderam ser mesclados");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valor literal inválido, era esperado 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Enum no formato inválido. Foi esperado 'A' | 'B' | 'C', porém foi recebido 'D'"
  );
  expect(
    getErrorMessage(
      z.object({ dog: z.string() }).strict().safeParse({ dog: "", cat: "" })
    )
  ).toEqual("Chave não reconhecida no objeto: 'cat'");
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Chaves não reconhecidas no objeto: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Valor discriminador inválido. Foi esperado 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Entrada inválida");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Entrada inválida");
});
