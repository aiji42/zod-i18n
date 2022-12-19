import * as i18next from "i18next";
import { SafeParseReturnType, z, ZodError } from "zod";
import { zodI18nMap } from "../../src";

export const init = async (lng: string) => {
  const translation = await import(`../../locales/${lng}/zod.json`);
  await i18next.init({
    lng,
    resources: {
      [lng]: { zod: translation },
    },
  });
  z.setErrorMap(zodI18nMap);
};

export const getErrorMessage = (
  parsed: SafeParseReturnType<unknown, unknown>
): string => {
  if ("error" in parsed) return parsed.error.issues[0].message;
  throw new Error();
};

export const getErrorMessageFromZodError = (callback: () => void) => {
  try {
    callback();
  } catch (e) {
    if (e instanceof ZodError) {
      return e.errors[0].message;
    }
    throw e;
  }
};
