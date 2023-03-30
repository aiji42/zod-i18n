const path = require("path");
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "en",
      "ja",
      "fr",
      "ar",
      "pt",
      "zh-CN",
      "zh-TW",
      "is",
      "es",
      "nl",
      "nb",
      "de",
      "it",
      "tr",
      "pl",
    ],
  },
  localePath: path.resolve("./public/locales"),
  reloadOnPrerender: true,
};
