import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage } from "./helpers";

beforeAll(async () => {
  await init("pt");
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
    "Entrada inválida: precisa iniciar com foo"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "Entrada inválida: precisa terminar com bar"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "A string precisa conter pelo menos 5 caracter(es)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "A string pode conter no máximo 5 caracter(es)"
  );
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Obrigatório");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "O dado deve ser do tipo number, porém foi enviado string"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "O dado deve ser do tipo number, porém foi enviado null"
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
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Número deve ser menor que 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Número deve ser menor ou igual a 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "O número precisa ser maior que 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "O número precisa ser maior ou igual a 5"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "O número precisa ser maior que 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Número não pode ser infinito"
  );
});

test("date parser error messages", () => {
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "O dado deve ser do tipo date, porém foi enviado string"
  );

  const testDate = new Date("2022-08-01");

  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Data precisa ser maior ou igual a ${testDate.toLocaleDateString("pt")}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `A data precisa ser menor ou igual a ${testDate.toLocaleDateString("pt")}`
  );
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "O dado deve ser do tipo array, porém foi enviado string"
  );

  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "O array deve conter no mínimo 5 elemento(s)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "O array deve conter no máximo 2 elemento(s)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "O array deve conter no mínimo 1 elemento(s)"
  );
});

test("other parser error messages", () => {
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valor literal inválido, era esperado 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Enum no formato inválido. Foi esperado 'A' | 'B' | 'C', porém foi recebido D"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Chave(s) não reconhecida(s) no objeto: 'cat', 'rat'");
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
});
