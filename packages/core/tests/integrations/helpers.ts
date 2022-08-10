import * as i18next from "i18next";
import { SafeParseReturnType, z } from "zod";
import { zodI18nMap } from "../../src";

export const init = async (lng: string) => {
  const translation = await import(`../../languages/${lng}.json`);
  i18next.init({
    lng,
    resources: {
      [lng]: { zod: translation },
    },
    interpolation: {
      skipOnVariables: false,
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
