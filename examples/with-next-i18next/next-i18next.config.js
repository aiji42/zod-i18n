/**
 * @type {import('next-i18next').UserConfig}
 */
module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja", "fr", "ar", "pt", "zh-CN"],
  },
  interpolation: {
    skipOnVariables: false,
  },
  reloadOnPrerender: true,
};
