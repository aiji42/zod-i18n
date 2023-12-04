import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "zh-CN";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "预期输入为字符串，而输入为数字"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "预期输入为字符串，而输入为布尔值"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "预期输入为字符串，而输入为函数"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "预期输入为字符串，而输入为日期"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "错误的邮件格式"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("错误的链接格式");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "错误的格式"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    '文本必须以 "foo" 开头'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    '文本必须以 "bar" 结尾'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "文本长度不得少于 5 个字符"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "文本长度不得多于 5 个字符"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "文本长度必须为 5 个字符"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("错误的日期时间格式");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "预期输入为数字，而输入为字符串"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "预期输入为数字，而输入为空对象"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "预期输入为数字，而输入为非数"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "预期输入为整数，而输入为浮点数"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "数值必须是 5 的倍数"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "数值必须是 0.1 的倍数"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual("数值必须小于 5");
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "数值不得大于 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual("数值必须大于 5");
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual("数值不得小于 5");
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "数值不得小于 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "数值不得大于 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "数值必须小于 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "数值必须大于 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "数值必须有限"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "预期输入为日期，而输入为字符串"
  );
  expect(
    getErrorMessage(
      schema.min(new Date("2022-08-01")).safeParse(new Date("2022-07-29"))
    )
  ).toEqual(`日期必须晚于或等于 ${testDate.toLocaleDateString(LOCALE)}`);
  expect(
    getErrorMessage(
      schema.max(new Date("2022-08-01")).safeParse(new Date("2022-08-02"))
    )
  ).toEqual(`日期必须早于或等于 ${testDate.toLocaleDateString(LOCALE)}`);
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("错误的日期");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "预期输入为数组，而输入为字符串"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "至少需要包含 5 个元素"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "最多只能包含 2 个元素"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "至少需要包含 1 个元素"
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
    "错误的返回值类型"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "参数错误"
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
  ).toEqual("交集类型无法合并");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "无效的输入, 请输入 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "无效的 'D' 值。请输入 'A' | 'B' | 'C'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("无法识别对象的键: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("无效的标识符。请输入 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("输入格式错误");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("格式错误");
});
