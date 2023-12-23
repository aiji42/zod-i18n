import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "fa";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("الزامی");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "نوع مورد انتظار رشته, نوع دریافت شده عدد"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "نوع مورد انتظار رشته, نوع دریافت شده بولی"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "نوع مورد انتظار رشته, نوع دریافت شده تابع"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "نوع مورد انتظار رشته, نوع دریافت شده تاریخ"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "ایمیل نامعتبر"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "آدرس اینترنتی نامعتبر"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("نامعتبر");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'ورودی نامعتبر: باید با "foo" شروع شود'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'ورودی نامعتبر: باید با "bar" به اتمام برسد'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "رشته باید حداقل 5 کلمه‌ای باشد"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "رشته حداکثر باید دارای  5 کلمه داشته‌ باشد"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "رشته باید دقیقا دارای 5 کلمه باشد"
  );
  expect(
     getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("تاریخ و زمان نامعتبر");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("الزامی");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "نوع مورد انتظار عدد, نوع دریافت شده رشته"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "نوع مورد انتظار عدد, نوع دریافت شده خالی"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "نوع مورد انتظار عدد, نوع دریافت شده ناعدد"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "نوع مورد انتظار عدد صحیح, نوع دریافت شده عدد اعشار"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "عدد موردنظر باید مضرب 5 باشد"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "عدد موردنظر باید مضرب 0.1 باشد"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "عدد باید کمتر از 5 باشد"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "عدد باید کمتر یا مساوی 5 باشد"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "عدد باید بزرگتر از 5 باشد"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "عدد باید بزرگتر یا مساوی 5 باشد"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "عدد باید بزرگتر یا مساوی 0 باشد"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "عدد باید کمتر یا مساوی 0 باشد"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "عدد باید کمتر از 0 باشد"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "عدد باید بزرگتر از 0 باشد"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "عدد باید متناهی باشد"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "نوع مورد انتظار تاریخ, نوع دریافت شده رشته"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `تاریخ باید بزرگتر یا برابر ${testDate.toLocaleDateString(
      LOCALE
    )} باشد`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `تاریخ باید کوچکتر یا برابر ${testDate.toLocaleDateString(
      LOCALE
    )} باشد`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("تاریخ نامعتبر");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "نوع مورد انتظار آرایه, نوع دریافت شده رشته"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "آرایه باید حداقل 5 عضو داشته باشد"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "آرایه باید حداکثر 2 عضو داشته باشد"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "آرایه باید حداقل 1 عضو داشته باشد"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "آرایه باید دقیقا 2 عضو داشته باشد"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "نوع خروجی تابع نامعتبر است"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "مقدار ورودی تابع نامعتبر است"
  );
});

test.only("other parser error messages", () => {
  expect(
    getErrorMessage(
      z
        .intersection(
          z.number(),
          z.number().transform((x) => x + 1)
        )
        .safeParse(1234)
    )
  ).toEqual("امکان اشتراک گیری نیست");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "مقدار دقیق نامعتبر, مورد انتظار 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "مقدار نامعتبر, مورد انتظار 'A' | 'B' | 'C', دریافت شده 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("کلید(ها) شناسایی نشده در آبجکت: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("مقدار جدا کننده نامعتبر, مورد انتظار 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("مقدار ورودی نامعتبر");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("ورودی نامعتبر");
});
