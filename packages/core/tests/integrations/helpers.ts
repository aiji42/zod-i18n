import * as i18next from "i18next";
import { z } from "zod";
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

export * from "../helpers";
