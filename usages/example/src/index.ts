import { z } from "zod";
import { zodI18nMap } from "zod-i18n-map";
import { translation } from "zod-i18n-map/languages/ja";

import i18next from "i18next";
i18next.init({
  lng: "ja",
  resources: {
    ja: {
      translation: {
        ...translation,
      },
    },
  },
});

z.setErrorMap(zodI18nMap);

const main = () => {
  const mySchema = z.string().max(2);
  try {
    mySchema.parse("adfea");
  } catch (e) {
    console.error(e);
  }
  console.log("parsed");
};

main();
