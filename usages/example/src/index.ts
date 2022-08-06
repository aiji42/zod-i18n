import { z } from "zod";
import { errorMapping } from "zodi18n";
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

z.setErrorMap(errorMapping);

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
