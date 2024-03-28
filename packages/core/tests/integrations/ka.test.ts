import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "ka";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("საჭიროა");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "უნდა ყოფილიყო სტრინგი, მიიღო ციფრი"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "უნდა ყოფილიყო სტრინგი, მიიღო boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "უნდა ყოფილიყო სტრინგი, მიიღო ფუნქცია"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "უნდა ყოფილიყო სტრინგი, მიიღო თარიღი"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "არასწორი ელ-ფოსტა"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("არასწორი ლინკი");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "არასწორი"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'არასწორი მნიშვნელობა: უნდა დაიწყოს "foo"-ით'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'არასწორი მნიშვნელობა: უნდა დამთავრდეს "bar"-ით'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "სტრინგი უნდა შეიცავდეს მინიმუმ 5 სიმბოლოებს"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "სტრინგი უნდა შეიცავდეს მაქსიმუმ 5 სიმბოლოებს"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "სტრინგი უნდა შეიცავდეს ზუსტად 5 სიმბოლოებს"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("არასწორი დრო და თარიღი");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("საჭიროა");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("საჭიროა");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "უნდა ყოფილიყო ციფრი, მიიღო სტრინგი"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "უნდა ყოფილიყო ციფრი, მიიღო nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "უნდა ყოფილიყო ინტეჯერი, მიიღო ათწილადი"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "ციფრი უნდა იყოს 5-ის ჯერადი"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "ციფრი უნდა იყოს 0.1-ის ჯერადი"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "ციფრი ნაკლები უნდა იყოს 5-ზე"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "ციფრი ან ნაკლები ან ტოლი უნდა იყოს 5-ზე"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "ციფრი მეტი უნდა იყოს 5-ზე"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "ციფრი ან მეტი ან ტოლი უნდა იყოს 5-ზე"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "ციფრი ან მეტი ან ტოლი უნდა იყოს 0-ზე"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "ციფრი ან ნაკლები ან ტოლი უნდა იყოს 0-ზე"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "ციფრი ნაკლები უნდა იყოს 0-ზე"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "ციფრი მეტი უნდა იყოს 0-ზე"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "ციფრი უნდა იყოს ფინიტური"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "უნდა ყოფილიყო თარიღი, მიიღო სტრინგი"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `თარიღი ან მეტი ან ტოლი უნდა იყოს ${testDate.toLocaleDateString(LOCALE)}-ზე`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `თარიღი ან ნაკლები ან ტოლი უნდა იყოს ${testDate.toLocaleDateString(
      LOCALE
    )}-ზე`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("არასწორი თარიღი");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "უნდა ყოფილიყო სია, მიიღო სტრინგი"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "სია უნდა შეიცავდეს მინიმუმ 5 ელემენტს"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "სია უნდა შეიცავდეს მაქსიმუმ 2 ელემენტს"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "სია უნდა შეიცავდეს მინიმუმ 1 ელემენტს"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "სია უნდა შეიცავდეს ზუსტად 2 ელემენტს"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "არასწორი ფუნქციის დაბრუნების ტიპი"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "არასწორი ფუნქციის არგუმენტები"
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
  ).toEqual("გადაკვეთის შედეგები ვერ გაერთიანდა");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "არასწორი მნიშვნელობა, უნდა ყოფილიყო 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "არასწორი ენუმერატორის მნიშვნელობა. უნდა ყოფილიყო 'A' | 'B' | 'C', მიიღო 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("უცნობი მნიშვნელობები ობიექტში: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("არასწორი მნიშვნელობა, უნდა ყოფილიყო 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("არასწორი მნიშვნელობა");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("არასწორი მნიშვნელობა");
});
