import { z } from "zod";
import { defaultErrorMap } from "zodi18n";
import { translation } from "zodi18n/languages/ja";

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

z.setErrorMap(defaultErrorMap);

const main = () => {
  const mySchema = z.string().email();
  try {
    mySchema.parse("");
  } catch (e) {
    console.error(e);
  }
  console.log("parsed");
};

main();
