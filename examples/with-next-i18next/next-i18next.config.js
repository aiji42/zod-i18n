const path = require("path");

module.exports = {
  i18n: {
    defaultLocale: "en",
    locales: ["en", "ja"],
    localePath: path.resolve("./public/locales"),
    interpolation: {
      skipOnVariables: false,
    },
  },
};
