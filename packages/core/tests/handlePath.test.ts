import { test, expect, describe } from "vitest";
import { z } from "zod";
import { makeZodI18nMap } from "../src";
import * as i18next from "i18next";
import { getErrorMessage } from "./helpers";

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
