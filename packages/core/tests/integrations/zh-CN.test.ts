import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage } from "./helpers";

beforeAll(async () => {
  await init("zh-CN");
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填项");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "期望输入的是字符串, 而输入的是数字"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "期望输入的是字符串, 而输入的是布尔值"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "期望输入的是字符串, 而输入的是函数"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "期望输入的是字符串, 而输入的是日期"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual("邮件格式错误");
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("url 格式错误");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "格式错误"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    "必须以 foo 起始"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "必须以 bar 结尾"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "至少需要包含 5 个字符"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "最多只能包含 5 个字符"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("datetime 格式错误");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必填项");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "期望输入的是数字, 而输入的是字符串"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "期望输入的是数字, 而输入的是null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "期望输入的是数字, 而输入的是NaN"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "期望输入的是整数, 而输入的是浮点数"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "必须是 5 的倍数"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual("必须小于 5");
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "必须小于或等于 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual("必须大于 5");
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "必须大于或等于 5"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual("必须大于 0");
});

test("date parser error messages", () => {
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "期望输入的是日期, 而输入的是字符串"
  );

  const testDate = new Date("2022-08-01");

  expect(
    getErrorMessage(
      schema.min(new Date("2022-08-01")).safeParse(new Date("2022-07-29"))
    )
  ).toEqual(`日期必须晚于或等于 ${testDate.toLocaleDateString("zh-CN")}`);
  expect(
    getErrorMessage(
      schema.max(new Date("2022-08-01")).safeParse(new Date("2022-08-02"))
    )
  ).toEqual(`日期必须早于或等于 ${testDate.toLocaleDateString("zh-CN")}`);
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "期望输入的是数组, 而输入的是字符串"
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
});

test("other parser error messages", () => {
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "无效的输入, 请输入 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "无效的 D 值。请输入 'A' | 'B' | 'C'"
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
});
