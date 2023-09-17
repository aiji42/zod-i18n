import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "ko";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "필수 입력 값 입니다."
  );
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "문자열 타입 입력을 기대하였지만, 숫자 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "문자열 타입 입력을 기대하였지만, 논리값 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "문자열 타입 입력을 기대하였지만, 함수 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "문자열 타입 입력을 기대하였지만, 날짜 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "허용되지 않은 이메일 형식 입니다."
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "허용되지 않은 URL 형식 입니다."
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "허용되지 않은 형식 입니다."
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    '"foo"로 시작하는 문자열이어야 합니다.'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    '"bar"로 끝나는 문자열이어야 합니다.'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "5자 보다 많거나 같아야 합니다."
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "5자 보다 작거나 같아야 합니다."
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "5자를 입력해야 합니다."
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("허용되지 않은 날짜 형식 입니다.");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual(
    "필수 입력 값 입니다."
  );
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "숫자 타입 입력을 기대하였지만, 문자열 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "숫자 타입 입력을 기대하였지만, null 값이 입력되었습니다."
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "숫자 타입 입력을 기대하였지만, NaN 값이 입력되었습니다."
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "정수 타입 입력을 기대하였지만, 실수 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "5의 배수이어야 합니다."
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "0.1의 배수이어야 합니다."
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "5보다 작은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "5보다 작거나 같은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "5보다 큰 값이어야 합니다."
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "5보다 크거나 같은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "0보다 크거나 같은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "0보다 작거나 같은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "0보다 작은 값이어야 합니다."
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "0보다 큰 값이어야 합니다."
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "유한한 값이어야 합니다."
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "날짜 타입 입력을 기대하였지만, 문자열 타입이 입력되었습니다."
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `${testDate.toLocaleDateString(LOCALE)}보다 이후이거나 같아야 합니다.`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `${testDate.toLocaleDateString(LOCALE)}보다 이전이거나 같아야 합니다.`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "허용되지 않은 날짜 값 입니다."
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "배열 타입 입력을 기대하였지만, 문자열 타입이 입력되었습니다."
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "5개 보다 많거나 같아야 합니다."
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "2개 보다 작거나 같아야 합니다."
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "1개 보다 많거나 같아야 합니다."
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "2개 이어야 합니다."
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "허용되지 않은 반환 타입입니다."
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "허용되지 않은 파라메터 타입입니다."
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
  ).toEqual("교차 타입을 만족하지 않습니다.");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "허용되지 않은 리터럴 값 입니다. 입력 가능한 값은 12 입니다."
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "'D'값은 허용되지 않습니다. 입력 가능한 값은 'A' | 'B' | 'C' 입니다."
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("객체 키 'cat', 'rat' 값은 허용되지 않습니다.");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("허용되지 않은 입력 값입니다. 입력 가능한 값은 'a' | 'b' 입니다.");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("허용되지 않은 입력 값입니다.");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("허용되지 않은 입력 값 입니다.");
});
