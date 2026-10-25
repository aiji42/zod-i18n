import i18next, { createInstance } from "i18next";
import { beforeEach, describe, expect, test } from "vitest";
import * as z from "zod";
import en from "../locales/en/zod.json" with { type: "json" };
import { i18nKey, makeZodI18nMap, translateIssue, zodI18nMap } from "../src/index.ts";

// Feature probes, so the suite also runs against older Zod versions in the CI matrix.
const probeIssue = (schema: z.ZodType, input: unknown) =>
  schema.safeParse(input, { error: makeZodI18nMap({ t: () => "x" }) }).error?.issues[0];
/** Zod >= 4.4 keeps properties added by the error map, which translateIssue relies on. */
const keepsIssueMeta = "zodI18n" in (probeIssue(z.string(), 1) ?? {});
/** Older Zod versions don't report the allowed values of a discriminated union. */
const reportsDiscriminatorOptions =
  "options" in
  (probeIssue(z.discriminatedUnion("k", [z.object({ k: z.literal("a") })]), { k: "b" }) ?? {});

const messageOf = (schema: z.ZodType, input: unknown): string | undefined =>
  schema.safeParse(input).error?.issues[0]?.message;

const messagesOf = (schema: z.ZodType, input: unknown) =>
  schema.safeParse(input).error?.issues.map((i) => [i.path.join("."), i.message]);

beforeEach(async () => {
  await i18next.init({ lng: "en", resources: { en: { zod: en } } });
  z.config({ customError: zodI18nMap });
});

describe("English messages", () => {
  test.each<[string, z.ZodType, unknown, string]>([
    ["invalid_type", z.string(), 1, "Expected string, received number"],
    ["invalid_type (int)", z.int(), 1.5, "Expected integer, received number"],
    ["invalid_type (nan)", z.number(), Number.NaN, "Expected number, received NaN"],
    ["invalid_type (date)", z.string(), new Date(), "Expected string, received date"],
    ["invalid_type (array)", z.object({}), [], "Expected object, received array"],
    ["received undefined", z.string(), undefined, "Required"],
    ["received null", z.string(), null, "Required"],
    ["invalid_value (enum)", z.enum(["a", "b"]), "c", 'Invalid option: expected one of "a" | "b"'],
    ["invalid_value (literal)", z.literal(1), 2, "Invalid input: expected 1"],
    ["invalid_value (bigint)", z.literal(1n), 2n, "Invalid input: expected 1n"],
    ["email", z.email(), "x", "Invalid email address"],
    ["url", z.url(), "x", "Invalid URL"],
    ["iso date", z.iso.date(), "x", "Invalid ISO date"],
    ["regex", z.string().regex(/a/), "b", "Invalid format"],
    ["startsWith", z.string().startsWith("a'b"), "x", `Must start with "a'b"`],
    ["endsWith", z.string().endsWith("z"), "x", 'Must end with "z"'],
    ["includes", z.string().includes("q"), "x", 'Must include "q"'],
    ["lowercase", z.string().lowercase(), "X", "Must be lowercase"],
    ["string min (one)", z.string().min(1), "", "String must contain at least 1 character"],
    ["string min (other)", z.string().min(3), "a", "String must contain at least 3 characters"],
    ["string length", z.string().length(2), "a", "String must contain exactly 2 characters"],
    ["string max", z.string().max(1), "ab", "String must contain at most 1 character"],
    ["number gt", z.number().gt(5), 5, "Number must be greater than 5"],
    ["number gte", z.number().gte(5), 4, "Number must be greater than or equal to 5"],
    ["number lt", z.number().lt(5), 5, "Number must be less than 5"],
    ["int uses number wording", z.int().max(5), 6, "Number must be less than or equal to 5"],
    [
      "bigint uses number wording",
      z.bigint().min(5n),
      4n,
      "Number must be greater than or equal to 5",
    ],
    ["array min", z.array(z.string()).min(2), [], "Array must contain at least 2 elements"],
    ["array max", z.array(z.string()).max(1), ["a", "b"], "Array must contain at most 1 element"],
    ["set min", z.set(z.string()).min(2), new Set(), "Set must contain at least 2 items"],
    ["multipleOf", z.number().multipleOf(3), 4, "Number must be a multiple of 3"],
    ["unrecognized_keys (one)", z.strictObject({}), { a: 1 }, 'Unrecognized key in object: "a"'],
    [
      "unrecognized_keys (other)",
      z.strictObject({}),
      { a: 1, b: 2 },
      'Unrecognized keys in object: "a", "b"',
    ],
    ["union", z.union([z.string(), z.number()]), true, "Invalid input"],
    [
      "discriminated union",
      z.discriminatedUnion("k", [z.object({ k: z.literal("a") }), z.object({ k: z.literal("b") })]),
      { k: "c" },
      reportsDiscriminatorOptions
        ? 'Invalid discriminator value. Expected "a" | "b"'
        : "Invalid input",
    ],
    ["invalid_key", z.record(z.string().min(2), z.number()), { a: 1 }, "Invalid key in record"],
    ["refine", z.string().refine(() => false), "", "Invalid input"],
  ])("%s", (_, schema, input, expected) => {
    expect(messageOf(schema, input)).toBe(expected);
  });

  test("date bounds are formatted with Intl", () => {
    const min = new Date("2026-01-01T00:00:00Z");
    expect(messageOf(z.date().min(min), new Date("2025-01-01"))).toBe(
      `Date must be on or after ${new Intl.DateTimeFormat("en").format(min)}`,
    );
  });
});

test("inserted labels are not HTML-escaped", async () => {
  await i18next.init({
    lng: "fr",
    resources: {
      fr: {
        zod: {
          errors: { invalid_format: { default: "{{format}} non valide" } },
          formats: { email: "adresse d'e-mail" },
        },
      },
    },
  });
  expect(messageOf(z.email(), "-")).toBe("adresse d'e-mail non valide");
});

test("formats without a label fall back to the raw format name", async () => {
  const { email: _, ...formats } = en.formats;
  await i18next.init({ lng: "en", resources: { en: { zod: { ...en, formats } } } });
  expect(messageOf(z.email(), "x")).toBe("Invalid email");
});

describe("fallback", () => {
  test("missing keys defer to Zod's own message", async () => {
    await i18next.init({ lng: "en", resources: { en: { zod: {} } } });
    expect(messageOf(z.string(), 1)).toBe("Invalid input: expected string, received number");
  });

  test("schema-level error wins over the map", () => {
    expect(messageOf(z.string({ error: "custom!" }), 1)).toBe("custom!");
  });
});

describe("namespaces", () => {
  test("ns option selects the namespace", async () => {
    await i18next.init({
      lng: "en",
      resources: { en: { zod: en, form: { errors: { invalid_type: "Form: {{expected}}" } } } },
    });
    z.config({ customError: makeZodI18nMap({ ns: "form" }) });
    expect(messageOf(z.string(), 1)).toBe("Form: string");
  });
});

describe("params.i18n", () => {
  beforeEach(async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: en,
          custom: {
            too_short: "Password needs {{count}}+ characters",
            not_admin: "Only {{role}} may do this",
            plain: "Something went wrong",
          },
        },
      },
    });
    z.config({ customError: makeZodI18nMap({ ns: ["zod", "custom"] }) });
  });

  test("on refine with a key", () => {
    expect(
      messageOf(
        z.string().refine(() => false, { params: { i18n: "plain" } }),
        "",
      ),
    ).toBe("Something went wrong");
  });

  test("on refine with values", () => {
    const schema = z.string().refine(() => false, {
      params: { i18n: { key: "not_admin", values: { role: "admins" } } },
    });
    expect(messageOf(schema, "")).toBe("Only admins may do this");
  });

  test("key() on a built-in check, interpolating the issue's own values", () => {
    const map = makeZodI18nMap({ ns: ["zod", "custom"] });
    expect(messageOf(z.string().min(8, { error: map.key("too_short") }), "a")).toBe(
      "Password needs 8+ characters",
    );
  });

  test("i18nKey on a schema, with an ns-prefixed key and values", () => {
    const schema = z.email({ error: i18nKey("custom:not_admin", { role: "editors" }) });
    expect(messageOf(schema, "a")).toBe("Only editors may do this");
  });

  test("key() falls back to the default message when the key is missing", () => {
    expect(messageOf(z.string().min(2, { error: i18nKey("nope") }), "a")).toBe(
      "String must contain at least 2 characters",
    );
  });
});

describe("handlePath", () => {
  const resources = {
    zod: {
      ...en,
      errors: { ...en.errors, invalid_type_with_path: "{{- path}}: expected {{expected}}" },
      userName: "User's name",
    },
    form: { fields: { items: { name: "Item name" } } },
  };

  beforeEach(async () => {
    await i18next.init({ lng: "en", resources: { en: resources } });
  });

  test("translates the path and uses the with_path context", () => {
    expect(messageOf(z.object({ userName: z.string() }), { userName: 1 })).toBe(
      "User's name: expected string",
    );
  });

  test("falls back to the raw path", () => {
    expect(messageOf(z.object({ age: z.object({ n: z.string() }) }), { age: { n: 1 } })).toBe(
      "age.n: expected string",
    );
  });

  test("falls back to the message without context", () => {
    expect(messageOf(z.object({ a: z.number() }), { a: undefined })).toBe("Required");
  });

  test("ns and keyPrefix, ignoring array indices", () => {
    z.config({
      customError: makeZodI18nMap({ handlePath: { ns: "form", keyPrefix: "fields" } }),
    });
    const schema = z.object({ items: z.array(z.object({ name: z.string() })) });
    expect(messagesOf(schema, { items: [{ name: 1 }] })).toEqual([
      ["items.0.name", "Item name: expected string"],
    ]);
  });

  test("can be disabled", () => {
    z.config({ customError: makeZodI18nMap({ handlePath: false }) });
    expect(messageOf(z.object({ userName: z.string() }), { userName: 1 })).toBe(
      "Expected string, received number",
    );
  });
});

describe("per-request translation", () => {
  test("a fixed t can be passed per parse", async () => {
    z.config({ customError: undefined });
    const i18n = createInstance();
    await i18n.init({
      lng: "en",
      resources: {
        en: { zod: en },
        ja: { zod: { errors: { invalid_type_received_undefined: "必須" } } },
      },
    });
    const error = makeZodI18nMap({ t: i18n.getFixedT("ja") });
    expect(z.string().safeParse(undefined, { error }).error?.issues[0]?.message).toBe("必須");
  });
});

test.skipIf(keepsIssueMeta)("translateIssue is a no-op on Zod < 4.4", () => {
  const issue = z.string().safeParse(1).error?.issues[0];
  expect(issue && translateIssue(issue)).toBe(issue?.message);
});

describe.skipIf(!keepsIssueMeta)("translateIssue (render-time translation)", () => {
  const ja = {
    errors: {
      invalid_type: "{{expected}}を入力してください（{{received}}）",
      invalid_type_received_undefined: "必須項目です",
      too_small: { string: { inclusive: "{{count}}文字以上で入力してください" } },
    },
    types: { string: "文字列", number: "数値" },
    custom: { too_short: "{{count}}文字以上必要です" },
  };

  beforeEach(async () => {
    await i18next.init({ lng: "en", resources: { en: { zod: en }, ja: { zod: ja } } });
    z.config({ customError: zodI18nMap });
  });

  const issuesOf = (schema: z.ZodType, input: unknown) =>
    schema.safeParse(input).error?.issues ?? [];

  test("re-translates existing issues after a language change", async () => {
    const schema = z.object({ a: z.string(), b: z.string(), c: z.string().min(3) });
    const issues = issuesOf(schema, { b: 1, c: "x" });
    expect(issues.map((i) => i.message)).toEqual([
      "Required",
      "Expected string, received number",
      "String must contain at least 3 characters",
    ]);
    await i18next.changeLanguage("ja");
    expect(issues.map(translateIssue)).toEqual([
      "必須項目です",
      "文字列を入力してください（数値）",
      "3文字以上で入力してください",
    ]);
  });

  test("keeps keys set with i18nKey", async () => {
    const [issue] = issuesOf(z.string().min(5, { error: i18nKey("custom.too_short") }), "a");
    await i18next.changeLanguage("ja");
    expect(issue && translateIssue(issue)).toBe("5文字以上必要です");
  });

  test("leaves messages it did not create untouched", async () => {
    const [issue] = issuesOf(z.string({ error: "my own message" }), 1);
    await i18next.changeLanguage("ja");
    expect(issue && translateIssue(issue)).toBe("my own message");
  });
});
