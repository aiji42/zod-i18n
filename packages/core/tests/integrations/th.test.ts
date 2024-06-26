import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "th";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("จำเป็น");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "คาดว่า สตริง แต่ได้รับ ตัวเลข"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "คาดว่า สตริง แต่ได้รับ บูลีน"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "คาดว่า สตริง แต่ได้รับ ฟังก์ชัน"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "คาดว่า สตริง แต่ได้รับ วันที่"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "ไม่ถูกต้อง อีเมล"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual("ไม่ถูกต้อง URL");
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual("ไม่ถูกต้อง");
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'ข้อมูลไม่ถูกต้อง: ต้องเริ่มต้นด้วย "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'ข้อมูลไม่ถูกต้อง: ต้องลงท้ายด้วย "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "สตริงต้องมีอย่างน้อย 5 ตัวอักษร"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "สตริงต้องมีไม่เกิน 5 ตัวอักษร"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "สตริงต้องมี 5 ตัวอักษรเท่านั้น"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("ไม่ถูกต้อง วันที่และเวลา");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("จำเป็น");
  expect(getErrorMessage(schema.safeParse(null))).toEqual("จำเป็น");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "คาดว่า ตัวเลข แต่ได้รับ สตริง"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "คาดว่า ตัวเลข แต่ได้รับ ไม่ใช่ตัวเลข"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "คาดว่า จำนวนเต็ม แต่ได้รับ จำนวนทศนิยม"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "ตัวเลขต้องเป็นพหุคูณของ 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "ตัวเลขต้องเป็นพหุคูณของ 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "ตัวเลขต้องมีค่าน้อยกว่า 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "ตัวเลขต้องมีค่าน้อยกว่าหรือเท่ากับ 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "ตัวเลขต้องมีค่ามากกว่า 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "ตัวเลขต้องมีค่ามากกว่าหรือเท่ากับ 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "ตัวเลขต้องมีค่ามากกว่าหรือเท่ากับ 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "ตัวเลขต้องมีค่าน้อยกว่าหรือเท่ากับ 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "ตัวเลขต้องมีค่าน้อยกว่า 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "ตัวเลขต้องมีค่ามากกว่า 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "ตัวเลขต้องมีขอบเขต"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "คาดว่า วันที่ แต่ได้รับ สตริง"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `วันที่ต้องมากกว่าหรือเท่ากับ ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `วันที่ต้องน้อยกว่าหรือเท่ากับ ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual("วันที่ไม่ถูกต้อง");
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "คาดว่า อาร์เรย์ แต่ได้รับ สตริง"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "อาร์เรย์ต้องมีอย่างน้อย 5 องค์ประกอบ"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "อาร์เรย์ต้องมีไม่เกิน 2 องค์ประกอบ"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "อาร์เรย์ต้องมีอย่างน้อย 1 องค์ประกอบ"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "อาร์เรย์ต้องมี 2 องค์ประกอบเท่านั้น"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "ประเภทการส่งคืนของฟังก์ชันไม่ถูกต้อง"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "อาร์กิวเมนต์ของฟังก์ชันไม่ถูกต้อง"
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
  ).toEqual("ผลลัพธ์ของการตัดกันไม่สามารถรวมกันได้");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    'ค่าที่กำหนดไม่ถูกต้อง คาดว่า 12'
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "ค่าที่กำหนดไม่ถูกต้อง คาดว่า 'A' | 'B' | 'C', แต่ได้รับ 'D'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("คีย์ที่ไม่รู้จักในอ็อบเจ็กต์: 'cat', 'rat'");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("ค่าตัวแบ่งไม่ถูกต้อง คาดว่า 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("ข้อมูลไม่ถูกต้อง");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("ข้อมูลไม่ถูกต้อง");
});
