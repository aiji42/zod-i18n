import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "ka";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("სავალდებულოა");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "მოსალოდნელი იყო სტრიქონი, მიღებულია რიცხვი"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "მოსალოდნელი იყო სტრიქონი, მიღებულია ბულის ტიპი"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "მოსალოდნელი იყო სტრიქონი, მიღებულია ფუნქცია"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "მოსალოდნელი იყო სტრიქონი, მიღებულია თარიღი"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "არასწორი ელფოსტა"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "არასწორი მისამართი"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "არასწორია"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'არასწორი მონაცემი: უნდა იწყებოდეს "foo"-ით'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'არასწორი მონაცემი: უნდა მთავრდებოდეს "bar"-ით'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "სტრიქონი უნდა შეიცავდეს მინიმუმ 5 სიმბოლოს"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "სტრიქონი უნდა შეიცავდეს მაქსიმუმ 5 სიმბოლოს"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "სტრიქონი უნდა შეიცავდეს ზუსტად 5 სიმბოლოს"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("არასწორი თარიღი და დრო");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("სავალდებულოა");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("სავალდებულოა");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "მოსალოდნელი იყო რიცხვი, მიღებულია სტრიქონი"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "მოსალოდნელი იყო რიცხვი, მიღებულია არ არის რიცხვი"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "მოსალოდნელი იყო მთელი რიცხვი, მიღებულია ათწილადი"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "რიცხვი უნდა იყოს 5-ის ჯერადი"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "რიცხვი უნდა იყოს 0.1-ის ჯერადი"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "რიცხვი უნდა იყოს 5-ზე ნაკლები"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "რიცხვი უნდა იყოს 5-ის ტოლი ან ნაკლები"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "რიცხვი უნდა იყოს 5-ზე მეტი"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "რიცხვი უნდა იყოს 5-ის ტოლი ან მეტი"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "რიცხვი უნდა იყოს 0-ის ტოლი ან მეტი"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "რიცხვი უნდა იყოს 0-ის ტოლი ან ნაკლები"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "რიცხვი უნდა იყოს 0-ზე ნაკლები"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "რიცხვი უნდა იყოს 0-ზე მეტი"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "რიცხვი უნდა იყოს სასრული"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "მოსალოდნელი იყო თარიღი, მიღებულია სტრიქონი"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `თარიღი უნდა იყოს ${testDate.toLocaleDateString(LOCALE)}-ის ტოლი ან გვიანი`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `თარიღი უნდა იყოს ${testDate.toLocaleDateString(LOCALE)}-ის ტოლი ან ადრე`
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
    "მოსალოდნელი იყო მასივი, მიღებულია სტრიქონი"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "მასივი უნდა შეიცავდეს მინიმუმ 5 ელემენტს"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "მასივი უნდა შეიცავდეს მაქსიმუმ 2 ელემენტს"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "მასივი უნდა შეიცავდეს მინიმუმ 1 ელემენტს"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "მასივი უნდა შეიცავდეს ზუსტად 2 ელემენტს"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "ფუნქციის დაბრუნებული ტიპის არასწორი მნიშვნელობა"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "ფუნქციის არასწორი არგუმენტები"
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
  ).toEqual("გადაკვეთის ტიპების შედეგების გარჩევა ვერ მოხერხდა");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "არასწორი ლიტერალური მნიშვნელობა, მოსალოდნელი იყო 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Enum-ის არასწორი მნიშვნელობა. მოსალოდნელი იყო ერთ-ერთი: 'A' | 'B' | 'C', მიღებულია 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("ობიექტში უცნობი გასაღები(ებია): 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("დისკრიმინატორის არასწორი მნიშვნელობა. მოსალოდნელი იყო: 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("არასწორი მონაცემი");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("არასწორი მონაცემი");
});
