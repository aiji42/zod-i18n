import * as i18next from "i18next";
import ICU from "i18next-icu";
import { z } from "zod";
import { zodI18nMap } from "../../src";

export const initIcu = async (lng: string) => {
  const translation = await import(`../../locales/${lng}/zod.icu.json`);
  await i18next.use(ICU).init({
    lng,
    resources: {
      [lng]: { zod: translation },
    },
    interpolation: {
      escapeValue: false,
    },
  });
  z.config({
    customError: zodI18nMap,
  });
};

export * from "../helpers";
