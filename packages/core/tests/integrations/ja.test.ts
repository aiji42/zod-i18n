import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage } from "./helpers";

beforeAll(async () => {
  await init("ja");
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必須");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "文字列での入力を期待していますが、数値が入力されました。"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "文字列での入力を期待していますが、真偽値が入力されました。"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "文字列での入力を期待していますが、関数が入力されました。"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "文字列での入力を期待していますが、日時が入力されました。"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "メールアドレスの形式で入力してください。"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "URLの形式で入力してください。"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "入力形式が間違っています。"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    "fooで始まる文字列である必要があります。"
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    "barで終わる文字列である必要があります。"
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "5文字以上の文字列である必要があります。"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "5文字以下の文字列である必要があります。"
  );
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("必須");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "数値での入力を期待していますが、文字列が入力されました。"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "数値での入力を期待していますが、NULLが入力されました。"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "数値での入力を期待していますが、NaNが入力されました。"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "整数での入力を期待していますが、浮動小数点数が入力されました。"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "5の倍数である必要があります。"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "5より小さな数値である必要があります。"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "5以下の数値である必要があります。"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "5より大きな数値である必要があります。"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "5以上の数値である必要があります。"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "0より大きな数値である必要があります。"
  );
});

test("date parser error messages", () => {
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "日時での入力を期待していますが、文字列が入力されました。"
  );

  const testDate = new Date("2022-08-01");

  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `${testDate.toLocaleDateString("ja")}以降の日時である必要があります。`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `${testDate.toLocaleDateString("ja")}以前の日時である必要があります。`
  );
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "配列での入力を期待していますが、文字列が入力されました。"
  );

  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "5個以上の要素が必要です。"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "2個以下の要素である必要があります。"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "1個以上の要素が必要です。"
  );
});

test("other parser error messages", () => {
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "無効なリテラル値です。12を入力してください。"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Dは無効な値です。'A' | 'B' | 'C'で入力してください。"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("オブジェクトのキー'cat', 'rat'が識別できません。");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("無効な識別子です。'a' | 'b'で入力してください。");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("入力形式が間違っています。");
});
