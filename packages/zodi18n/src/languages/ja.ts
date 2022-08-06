export const translation = {
  zod: {
    invalid_type_required: "必須",
    invalid_type:
      "{{expected}}での入力を期待していますが、{{received}}で入力されました。",

    invalid_string:
      "入力形式が間違っています。{{validation}}を入力してください。",
    invalid_string_regex: "入力形式が間違っています。",
    invalid_string_startWith:
      "入力形式が間違っています。{{startWith}}で始まる必要があります。",
    invalid_string_endsWith:
      "入力形式が間違っています。{{endsWith}}で終わる必要があります。",

    validations: {
      email: "メールアドレス",
      url: "URL",
      uuid: "UUID",
      cuid: "CUID",
      regex: "正規表現",
    },
    // TODO: expected and received type
  },
};
