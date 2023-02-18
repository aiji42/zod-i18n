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
      "is",
      "es",
      "nl",
      "de",
      "it",
    ],
  },
  localePath: path.resolve("./public/locales"),
  reloadOnPrerender: true,
};
