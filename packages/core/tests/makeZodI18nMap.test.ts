import { test, expect, describe } from "vitest";
import { z } from "zod";
import { makeZodI18nMap } from "../src";
import * as i18next from "i18next";
import { getErrorMessage } from "./helpers";

describe("ns", () => {
  test("changeable ns", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: {
            errors: {
              invalid_type: "Expected {{expected}}, received {{received}}",
            },
          },
          zod2: {
            errors: {
              invalid_type:
                "Error: it is expected to provide {{expected}} but you provided {{received}}",
            },
          },
        },
      },
    });
    z.setErrorMap(makeZodI18nMap());

    expect(getErrorMessage(z.string().safeParse(5))).toEqual(
      "Expected string, received number"
    );

    z.setErrorMap(makeZodI18nMap({ ns: "zod2" }));

    expect(getErrorMessage(z.string().safeParse(5))).toEqual(
      "Error: it is expected to provide string but you provided number"
    );
  });
});

describe("Handling key of object schema", () => {
  test("default context, ns, and keyPrefix", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: {
            errors: {
              invalid_type: "Expected {{expected}}, received {{received}}",
              invalid_type_with_path:
                "{{- path}} is expected {{expected}}, received {{received}}",
            },
            userName: "user's name",
          },
        },
      },
    });
    z.setErrorMap(makeZodI18nMap());

    const schema = z.object({
      userName: z.string(),
    });

    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "user's name is expected string, received number"
    );
  });

  test("custom context", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: {
            errors: {
              invalid_type: "Expected {{expected}}, received {{received}}",
              invalid_type_custom_context:
                "{{- path}} is expected {{expected}}, received {{received}}",
            },
            userName: "user's name",
          },
        },
      },
    });
    z.setErrorMap(
      makeZodI18nMap({ handlePath: { context: "custom_context" } })
    );

    const schema = z.object({
      userName: z.string(),
    });

    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "user's name is expected string, received number"
    );

    z.setErrorMap(makeZodI18nMap());
    // fallback
    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "Expected string, received number"
    );
  });

  test("custom ns", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          common: {
            userName: "user's name",
          },
          zod: {
            errors: {
              invalid_type: "Expected {{expected}}, received {{received}}",
              invalid_type_with_path:
                "{{- path}} is expected {{expected}}, received {{received}}",
            },
          },
        },
      },
    });
    z.setErrorMap(makeZodI18nMap({ handlePath: { ns: "common" } }));

    const schema = z.object({
      userName: z.string(),
    });

    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "user's name is expected string, received number"
    );

    z.setErrorMap(makeZodI18nMap());
    // fallback
    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "userName is expected string, received number"
    );
  });

  test("custom keyPrefix", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: {
            errors: {
              invalid_type: "Expected {{expected}}, received {{received}}",
              invalid_type_with_path:
                "{{- path}} is expected {{expected}}, received {{received}}",
            },
            paths: {
              userName: "user's name",
            },
          },
        },
      },
    });
    z.setErrorMap(makeZodI18nMap({ handlePath: { keyPrefix: "paths" } }));

    const schema = z.object({
      userName: z.string(),
    });

    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "user's name is expected string, received number"
    );

    z.setErrorMap(makeZodI18nMap());
    // fallback
    expect(getErrorMessage(schema.safeParse({ userName: 5 }))).toEqual(
      "userName is expected string, received number"
    );
  });
});

describe("plurals", () => {
  test("separate messages for singular and plural", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod: {
            errors: {
              too_big: {
                string: {
                  exact_one:
                    "String must contain exactly {{maximum}} character",
                  exact_other:
                    "String must contain exactly {{maximum}} characters",
                },
              },
            },
          },
        },
      },
    });
    z.setErrorMap(makeZodI18nMap());
    expect(getErrorMessage(z.string().length(1).safeParse("abc"))).toEqual(
      "String must contain exactly 1 character"
    );
    expect(getErrorMessage(z.string().length(5).safeParse("abcdefgh"))).toEqual(
      "String must contain exactly 5 characters"
    );
  });
});

describe("jsonStringifyReplacer", () => {
  test("include bigint", async () => {
    expect(
      getErrorMessage(z.literal(BigInt(9007199254740991)).safeParse(""))
    ).toEqual('Invalid literal value, expected "9007199254740991"');
  });
});

describe("custom error message", () => {
  test("custom error with refine", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod_custom: {
            test_custom_key: "custom error message",
          },
        },
      },
    });

    z.setErrorMap(makeZodI18nMap({ ns: "zod_custom" }));

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, { params: { i18n: "test_custom_key" } })
          .safeParse("")
      )
    ).toEqual("custom error message");

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, { params: { i18n: { key: "test_custom_key" } } })
          .safeParse("")
      )
    ).toEqual("custom error message");
  });

  test("custom error with refine and values", async () => {
    await i18next.init({
      lng: "en",
      resources: {
        en: {
          zod_custom: {
            test_custom_key: "custom error message with value {{myVal}}",
          },
        },
      },
    });

    z.setErrorMap(makeZodI18nMap({ ns: "zod_custom" }));

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, {
            params: {
              i18n: { key: "test_custom_key", values: { myVal: "42069" } },
            },
          })
          .safeParse("")
      )
    ).toEqual("custom error message with value 42069");

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, {
            params: {
              i18n: { key: "test_custom_key" },
            },
          })
          .safeParse("")
      )
    ).toEqual("custom error message with value {{myVal}}");

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, {
            params: {
              i18n: { key: "test_custom_key", values: null },
            },
          })
          .safeParse("")
      )
    ).toEqual("custom error message with value {{myVal}}");

    expect(
      getErrorMessage(
        z
          .string()
          .refine(() => false, {
            params: {
              i18n: { key: "test_custom_key", values: 123 },
            },
          })
          .safeParse("")
      )
    ).toEqual("custom error message with value {{myVal}}");
  });
});
