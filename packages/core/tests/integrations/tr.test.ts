import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "tr";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Zorunlu");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Beklenen metin, alınan sayı"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Beklenen metin, alınan boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Beklenen metin, alınan fonksiyon"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Beklenen metin, alınan tarih"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Geçersiz mail"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Geçersiz link");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Geçersiz"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'Geçersiz girdi: "foo" ile başlamalı'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'Geçersiz girdi: "bar" ile bitmeli'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Metin en az 5 karakter içermeli"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Metin en fazla 5 karakter içermeli"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Metin tam olarak 5 karakter içermeli"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Geçersiz tarih ve zaman");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Zorunlu");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("Zorunlu");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Beklenen sayı, alınan metin"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Beklenen sayı, alınan NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Beklenen tam sayı, alınan noktalı sayı"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "5 ve katları olmalı"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "0.1 ve katları olmalı"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Sayı 5 den daha küçük olmalı"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Sayı 5 veya daha küçük olmalı"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Sayı 5 den daha büyük olmalı"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Sayı 5 veya daha büyük olmalı"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Sayı 0 veya daha büyük olmalı"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Sayı 0 veya daha küçük olmalı"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Sayı 0 den daha küçük olmalı"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Sayı 0 den daha büyük olmalı"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Sayı sonlu olmalıdır"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Beklenen tarih, alınan metin"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Tarih eşit veya daha büyük olmalı ${testDate.toLocaleDateString(LOCALE)}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Tarih eşit veya daha küçük olmalı ${testDate.toLocaleDateString(LOCALE)}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Geçersiz tarih");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Beklenen dizi, alınan metin"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Dizi en az 5 adet veri içermeli"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Dizi en fazla 2 adet veri içermeli"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Dizi en az 1 adet veri içermeli"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Dizi tam olarak 2 adet veri içermeli"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Geçersiz fonksiyon dönüş değeri"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Geçersiz fonksiyon argümanları"
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
  ).toEqual("Kesişim sonuçları birleştirilemedi");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Geçersiz ilkel veri, beklenen 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Geçersiz enum değeri. Beklenen 'A' | 'B' | 'C', alınan 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Nesne içinde bilinmeyen anahtar(lar): 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Geçersiz ayırıcı değer. Beklenen 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Geçersiz tip birleşimi");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Geçersiz girdi");
});
