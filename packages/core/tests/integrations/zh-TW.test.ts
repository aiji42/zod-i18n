import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "zh-TW";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填的欄位");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "期望輸入的是字串，而輸入的是數字"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "期望輸入的是字串，而輸入的是布林值"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "期望輸入的是字串，而輸入的是函數"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "期望輸入的是字串，而輸入的是日期"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "電子郵件格式錯誤"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("連結格式錯誤");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "格式錯誤"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    '必須以 "foo" 開始'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    '必須以 "bar" 結尾'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "至少需要包含 5 個字元"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "最多只能包含 5 個字元"
  );
  // TODO: add `zod:errors.(too_small|too_big).string.exact`
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "String must contain exactly 5 character(s)"
  );
  // TODO: translation `datetime` (zod:validations.datetime)
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("datetime 格式錯誤");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填的欄位");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("必填的欄位");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "期望輸入的是數字，而輸入的是字串"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "期望輸入的是數字，而輸入的是NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "期望輸入的是整數，而輸入的是浮點數"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "必須是 5 的倍數"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "必須是 0.1 的倍數"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual("必須小於 5");
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "必須小於或等於 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual("必須大於 5");
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "必須大於或等於 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "必須大於或等於 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "必須小於或等於 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual("必須小於 0");
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual("必須大於 0");
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "不能為無限值"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "期望輸入的是日期，而輸入的是字串"
  );
  expect(
    getErrorMessage(
      schema.min(new Date("2022-08-01")).safeParse(new Date("2022-07-29"))
    )
  ).toEqual(`日期必須晚於或等於 ${testDate.toLocaleDateString(LOCALE)}`);
  expect(
    getErrorMessage(
      schema.max(new Date("2022-08-01")).safeParse(new Date("2022-08-02"))
    )
  ).toEqual(`日期必須早於或等於 ${testDate.toLocaleDateString(LOCALE)}`);
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("錯誤的日期");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "期望輸入的是陣列，而輸入的是字串"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "至少需要包含 5 個元素"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "最多只能包含 2 個元素"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "至少需要包含 1 個元素"
  );
  // TODO: add `zod:errors.(too_small|too_big).array.exact`
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Array must contain exactly 2 element(s)"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "錯誤的回傳值類型"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "參數錯誤"
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
  ).toEqual("交集類型無法合併");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "無效的輸入，請輸入 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "無效的 'D' 值，請輸入 'A' | 'B' | 'C'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("無法識別物件的鍵值：'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("無效的識別符，請輸入 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("輸入格式錯誤");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("格式錯誤");
});
