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
      "ko",
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
      "uz",
      "hr-HR",
      "fi",
    ],
  },
  localePath: path.resolve("./public/locales"),
  reloadOnPrerender: true,
};
