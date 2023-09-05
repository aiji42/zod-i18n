import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "uz";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Majburiy maydon"
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Kutilayotgan tur - satr, qabul qilingan - son"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Kutilayotgan tur - satr, qabul qilingan - mantiqiy qiymat"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Kutilayotgan tur - satr, qabul qilingan - funksiya"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Kutilayotgan tur - satr, qabul qilingan - sana"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Noto'g'ri e-mail"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("Noto'g'ri URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Noto'g'ri"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    "Noto'g'ri kiritildi: \"foo\" bilan boshlanishi kerak"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "Noto'g'ri kiritildi: \"bar\" bilan tugashi kerak"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "Satr kamida 5 belgidan iborat bo'lishi kerak"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "Satrda ko'pi bilan 5 ta belgi bo'lishi kerak"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "Satr aynan 5 ta belgidan iborat bo'lishi kerak"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Noto'g'ri sana va vaqt");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "Majburiy maydon"
  );
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Kutilayotgan tur - son, qabul qilingan - satr"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Kutilayotgan tur - son, qabul qilingan - null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Kutilayotgan tur - son, qabul qilingan - NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Kutilayotgan tur - butun son, qabul qilingan - suzuvchi nuqtali son"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Son 5 ga karrali bo'lishi kerak"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Son 0.1 ga karrali bo'lishi kerak"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Son 5 dan kichik bo'lishi kerak"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Son 5 dan kichik yoki unga teng bo'lishi kerak"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Son 5 dan katta bo'lishi kerak"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Son 5 dan katta yoki unga teng bo'lishi kerak"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Son 0 dan katta yoki unga teng bo'lishi kerak"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Son 0 dan kichik yoki unga teng bo'lishi kerak"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Son 0 dan kichik bo'lishi kerak"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Son 0 dan katta bo'lishi kerak"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Son chekli bo'lishi kerak"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Kutilayotgan tur - sana, qabul qilingan - satr"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Sana ${testDate.toLocaleDateString(
      LOCALE
    )} dan katta yoki unga teng bo'lishi kerak`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Sana ${testDate.toLocaleDateString(
      LOCALE
    )} dan kichik yoki unga teng bo'lishi kerak`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("Sana noto'g'ri");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Kutilayotgan tur - massiv, qabul qilingan - satr"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Massivda kamida 5 ta element(lar) bo'lishi kerak"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Massiv 2 ta elementdan oshmasligi kerak"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Massivda kamida 1 ta element(lar) bo'lishi kerak"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Massivda aynan 2 ta element(lar) bo'lishi kerak"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Funktsiyani qaytarish turi noto'g'ri"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Funksiya argumentlari noto'g'ri"
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
  ).toEqual("Kesishma natijalarini birlashtirib bo'lmaydi");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Noto'g'ri so'zma-so'z qiymat, kutilmoqda 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Enum qiymati noto'g'ri. Kutilayotgan 'A' | 'B' | 'C', qabul qilingan 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Obyektdagi kalit(lar) noto'g'ri: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Diskriminator qiymati noto'g'ri. 'a' | 'b' kutilmoqda");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Kesishma natijalarini birlashtirib bo'lmaydi");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Noto'g'ri kiritildi");
});
