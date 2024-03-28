const path = require("path");
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: "en",
    // Please ensure the locales are listed in alphabetical order.
    locales: [
      "ar",
      "bg",
      "cs",
      "de",
      "en",
      "es",
      "fa",
      "fi",
      "fr",
      "he",
      "hr-HR",
      "id",
      "is",
      "it",
      "ja",
      "ka",
      "ko",
      "lt",
      "nb",
      "nl",
      "pl",
      "pt",
      "ro",
      "ru",
      "sk",
      "sv",
      "tr",
      "uk-UA",
      "uz",
      "zh-CN",
      "zh-TW",
    ],
  },
  localePath: path.resolve("./public/locales"),
  reloadOnPrerender: true,
};
