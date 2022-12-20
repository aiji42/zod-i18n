import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "es";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Requerido");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Esperado string, recibido number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Esperado string, recibido boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Esperado string, recibido function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Esperado string, recibido date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "correo inválido"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("url inválida");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Inválido"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Entrada inválida: debe comenzar con "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Entrada inválida: debe finalizar con "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "El texto debe contener al menos 5 carácter(es)"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "El texto debe contener como máximo 5 carácter(es)"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "El texto debe contener exactamente 5 carácter(es)"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("datetime inválido");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Requerido");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Esperado number, recibido string"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Esperado number, recibido null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Esperado number, recibido nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Esperado integer, recibido float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Número debe ser multiplo de 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Número debe ser multiplo de 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "El número debe ser menor a 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "El número debe ser menor o igual a 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "El número debe ser mayor a 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "El número debe ser mayor o igual a 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "El número debe ser mayor o igual a 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "El número debe ser menor o igual a 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "El número debe ser menor a 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "El número debe ser mayor a 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Número no puede ser infinito"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Esperado date, recibido string"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `La fecha debe ser mayor o igual a ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `La fecha debe ser menor o igual a ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Fecha inválida");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Esperado array, recibido string"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "El array debe contener al menos 5 elemento(s)"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "El array debe contener como máximo 2 elemento(s)"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "El array debe contener al menos 1 elemento(s)"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "El array debe contener exactamente 2 elemento(s)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Tipo de retorno de función inválido"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Argumentos de función inválido"
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
  ).toEqual("Valores de intersección no pudieron ser mezclados");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Valor literal inválido, era esperado 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Valor de enum inválido. Era esperado 'A' | 'B' | 'C', fue recibido 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Llave(s) no reconocida(s) en el objeto: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Valor discriminador inválido. Era esperado 'a' | 'b'");
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
