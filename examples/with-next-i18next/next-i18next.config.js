const path = require("path");
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: [
      "en",
      "he",
      "ja",
      "fr",
      "ar",
      "pt",
      "zh-CN",
      "zh-TW",
      "is",
      "es",
      "nl",
      "sv",
      "nb",
      "de",
      "it",
      "tr",
      "pl",
      "lt",
      "ru",
      "ro",
      "uk-UA",
    ],
  },
  localePath: path.resolve("./public/locales"),
  reloadOnPrerender: true,
};
