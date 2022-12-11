const path = require("path");
/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "fr", "ar", "pt", "zh-CN"],
  },
  localePath: path.resolve("./public/locales"),
  interpolation: {
    skipOnVariables: false,
  },
  reloadOnPrerender: true,
};
