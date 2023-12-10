import { test, expect, beforeAll } from "vitest";
import { z } from "zod";
import { init, getErrorMessage, getErrorMessageFromZodError } from "./helpers";

const LOCALE = "id";

beforeAll(async () => {
  await init(LOCALE);
});

test("string parser error messages", () => {
  const schema = z.string();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Wajib diisi");
  expect(getErrorMessage(schema.safeParse(1))).toEqual(
    "Nilai seharusnya memiliki tipe data string, diterima number"
  );
  expect(getErrorMessage(schema.safeParse(true))).toEqual(
    "Nilai seharusnya memiliki tipe data string, diterima boolean"
  );
  expect(getErrorMessage(schema.safeParse(Date))).toEqual(
    "Nilai seharusnya memiliki tipe data string, diterima function"
  );
  expect(getErrorMessage(schema.safeParse(new Date()))).toEqual(
    "Nilai seharusnya memiliki tipe data string, diterima date"
  );
  expect(getErrorMessage(schema.email().safeParse(""))).toEqual(
    "Format email tidak valid"
  );
  expect(getErrorMessage(schema.url().safeParse(""))).toEqual(
    "Format url tidak valid"
  );
  expect(getErrorMessage(schema.regex(/aaa/).safeParse(""))).toEqual(
    "Tidak valid"
  );
  expect(getErrorMessage(schema.startsWith("foo").safeParse(""))).toEqual(
    'String harus dimulai dengan "foo"'
  );
  expect(getErrorMessage(schema.endsWith("bar").safeParse(""))).toEqual(
    'String harus diakhiri dengan "bar"'
  );
  expect(getErrorMessage(schema.min(5).safeParse("a"))).toEqual(
    "String harus minimal 5 karakter"
  );
  expect(getErrorMessage(schema.max(5).safeParse("abcdef"))).toEqual(
    "String harus maksimal 5 karakter"
  );
  expect(getErrorMessage(schema.length(5).safeParse("abcdef"))).toEqual(
    "String harus 5 karakter"
  );
  expect(
    getErrorMessage(schema.datetime().safeParse("2020-01-01T00:00:00+02:00"))
  ).toEqual("Format datetime tidak valid");
});

test("number parser error messages", () => {
  const schema = z.number();

  expect(getErrorMessage(schema.safeParse(undefined))).toEqual("Wajib diisi");
  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Nilai seharusnya memiliki tipe data number, diterima string"
  );
  expect(getErrorMessage(schema.safeParse(null))).toEqual(
    "Nilai seharusnya memiliki tipe data number, diterima null"
  );
  expect(getErrorMessage(schema.safeParse(NaN))).toEqual(
    "Nilai seharusnya memiliki tipe data number, diterima nan"
  );
  expect(getErrorMessage(schema.int().safeParse(0.1))).toEqual(
    "Nilai seharusnya memiliki tipe data integer, diterima float"
  );
  expect(getErrorMessage(schema.multipleOf(5).safeParse(2))).toEqual(
    "Angka harus merupakan kelipatan dari 5"
  );
  expect(getErrorMessage(schema.step(0.1).safeParse(0.0001))).toEqual(
    "Angka harus merupakan kelipatan dari 0.1"
  );
  expect(getErrorMessage(schema.lt(5).safeParse(10))).toEqual(
    "Angka harus kurang dari 5"
  );
  expect(getErrorMessage(schema.lte(5).safeParse(10))).toEqual(
    "Angka harus kurang atau sama dengan dari 5"
  );
  expect(getErrorMessage(schema.gt(5).safeParse(1))).toEqual(
    "Angka harus lebih dari 5"
  );
  expect(getErrorMessage(schema.gte(5).safeParse(1))).toEqual(
    "Angka harus lebih atau sama dengan dari 5"
  );
  expect(getErrorMessage(schema.nonnegative().safeParse(-1))).toEqual(
    "Angka harus lebih atau sama dengan dari 0"
  );
  expect(getErrorMessage(schema.nonpositive().safeParse(1))).toEqual(
    "Angka harus kurang atau sama dengan dari 0"
  );
  expect(getErrorMessage(schema.negative().safeParse(1))).toEqual(
    "Angka harus kurang dari 0"
  );
  expect(getErrorMessage(schema.positive().safeParse(0))).toEqual(
    "Angka harus lebih dari 0"
  );
  expect(getErrorMessage(schema.finite().safeParse(Infinity))).toEqual(
    "Angka harus berhingga"
  );
});

test("date parser error messages", async () => {
  const testDate = new Date("2022-08-01");
  const schema = z.date();

  expect(getErrorMessage(schema.safeParse("2022-12-01"))).toEqual(
    "Nilai seharusnya memiliki tipe data date, diterima string"
  );
  expect(
    getErrorMessage(schema.min(testDate).safeParse(new Date("2022-07-29")))
  ).toEqual(
    `Tanggal harus lebih atau sama dengan dari ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  expect(
    getErrorMessage(schema.max(testDate).safeParse(new Date("2022-08-02")))
  ).toEqual(
    `Tanggal harus kurang atau sama dengan dari ${testDate.toLocaleDateString(
      LOCALE
    )}`
  );
  try {
    await schema.parseAsync(new Date("invalid"));
  } catch (err) {
    expect((err as z.ZodError).issues[0].message).toEqual(
      "Tanggal tidak valid"
    );
  }
});

test("array parser error messages", () => {
  const schema = z.string().array();

  expect(getErrorMessage(schema.safeParse(""))).toEqual(
    "Nilai seharusnya memiliki tipe data array, diterima string"
  );
  expect(getErrorMessage(schema.min(5).safeParse([""]))).toEqual(
    "Array harus berisi minimal 5 elemen"
  );
  expect(getErrorMessage(schema.max(2).safeParse(["", "", ""]))).toEqual(
    "Array harus berisi maksimal 2 elemen"
  );
  expect(getErrorMessage(schema.nonempty().safeParse([]))).toEqual(
    "Array harus berisi minimal 1 elemen"
  );
  expect(getErrorMessage(schema.length(2).safeParse([]))).toEqual(
    "Array harus berisi tepat 2 elemen"
  );
});

test("function parser error messages", () => {
  const functionParse = z
    .function(z.tuple([z.string()]), z.number())
    .parse((a: any) => a);
  expect(getErrorMessageFromZodError(() => functionParse(""))).toEqual(
    "Tipe data return function tidak valid"
  );
  expect(getErrorMessageFromZodError(() => functionParse(1 as any))).toEqual(
    "Argumen function tidak valid"
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
  ).toEqual("Hasil intersection tidak dapat disatukan");
  expect(getErrorMessage(z.literal(12).safeParse(""))).toEqual(
    "Nilai literal tidak valid, seharusnya 12"
  );
  expect(getErrorMessage(z.enum(["A", "B", "C"]).safeParse("D"))).toEqual(
    "Nilai enum 'D' tidak ditemukan dalam 'A' | 'B' | 'C'"
  );
  expect(
    getErrorMessage(
      z
        .object({ dog: z.string() })
        .strict()
        .safeParse({ dog: "", cat: "", rat: "" })
    )
  ).toEqual("Key 'cat', 'rat' tidak valid pada object");
  expect(
    getErrorMessage(
      z
        .discriminatedUnion("type", [
          z.object({ type: z.literal("a"), a: z.string() }),
          z.object({ type: z.literal("b"), b: z.string() }),
        ])
        .safeParse({ type: "c", c: "abc" })
    )
  ).toEqual("Nilai discriminator tidak ditemukan dalam 'a' | 'b'");
  expect(
    getErrorMessage(z.union([z.string(), z.number()]).safeParse([true]))
  ).toEqual("Input tidak valid");
  expect(
    getErrorMessage(
      z
        .string()
        .refine(() => {
          return false;
        })
        .safeParse("")
    )
  ).toEqual("Input tidak valid");
});
