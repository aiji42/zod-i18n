import { ZodIssueCode, ZodParsedType, defaultErrorMap, ZodErrorMap } from "zod";
import i18next, { i18n } from "i18next";

const jsonStringifyReplacer = (_: string, value: any): any => {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
};

function joinValues<T extends any[]>(array: T, separator = " | "): string {
  return array
    .map((val) => (typeof val === "string" ? `'${val}'` : val))
    .join(separator);
}

type ZodI18nMapOption = {
  t?: i18n["t"];
  handlePath?: HandlePathOption;
};

type HandlePathOption = {
  context?: string;
  ns?: string | readonly string[];
  keyPrefix?: string;
};

const defaultNs = "zod";

export const makeZodI18nMap =
  (option?: ZodI18nMapOption): ZodErrorMap =>
  (issue, ctx) => {
    const { t, handlePath } = {
      t: i18next.t,
      ...option,
      handlePath: {
        context: "with_path",
        ns: defaultNs,
        keyPrefix: undefined,
        ...option?.handlePath,
      },
    };

    let message: string;
    message = defaultErrorMap(issue, ctx).message;

    const path =
      issue.path.length > 0
        ? {
            context: handlePath.context,
            path: t(
              [handlePath.keyPrefix, issue.path.join(".")]
                .filter(Boolean)
                .join("."),
              {
                ns: handlePath.ns,
                defaultValue: issue.path.join("."),
              }
            ),
          }
        : {};

    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = t("errors.invalid_type_received_undefined", {
            ns: defaultNs,
            defaultValue: message,
            ...path,
          });
        } else {
          message = t("errors.invalid_type", {
            expected: t(`types.${issue.expected}`, {
              defaultValue: issue.expected,
              ns: defaultNs,
            }),
            received: t(`types.${issue.received}`, {
              defaultValue: issue.received,
              ns: defaultNs,
            }),
            ns: defaultNs,
            defaultValue: message,
            ...path,
          });
        }
        break;
      case ZodIssueCode.invalid_literal:
        message = t("errors.invalid_literal", {
          expected: JSON.stringify(issue.expected, jsonStringifyReplacer),
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.unrecognized_keys:
        message = t("errors.unrecognized_keys", {
          keys: joinValues(issue.keys, ", "),
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_union:
        message = t("errors.invalid_union", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_union_discriminator:
        message = t("errors.invalid_union_discriminator", {
          options: joinValues(issue.options),
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_enum_value:
        message = t("errors.invalid_enum_value", {
          options: joinValues(issue.options),
          received: issue.received,
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_arguments:
        message = t("errors.invalid_arguments", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_return_type:
        message = t("errors.invalid_return_type", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_date:
        message = t("errors.invalid_date", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === "object") {
          if ("startsWith" in issue.validation) {
            message = t(`errors.invalid_string.startsWith`, {
              startsWith: issue.validation.startsWith,
              ns: defaultNs,
              defaultValue: message,
              ...path,
            });
          } else if ("endsWith" in issue.validation) {
            message = t(`errors.invalid_string.endsWith`, {
              endsWith: issue.validation.endsWith,
              ns: defaultNs,
              defaultValue: message,
              ...path,
            });
          }
        } else {
          message = t(`errors.invalid_string.${issue.validation}`, {
            validation: t(`validations.${issue.validation}`, {
              defaultValue: issue.validation,
              ns: defaultNs,
            }),
            ns: defaultNs,
            defaultValue: message,
            ...path,
          });
        }
        break;
      case ZodIssueCode.too_small:
        message = t(
          `errors.too_small.${issue.type}.${
            issue.exact
              ? "exact"
              : issue.inclusive
              ? "inclusive"
              : "not_inclusive"
          }`,
          {
            minimum:
              issue.type === "date" ? new Date(issue.minimum) : issue.minimum,
            ns: defaultNs,
            defaultValue: message,
            ...path,
          }
        );
        break;
      case ZodIssueCode.too_big:
        message = t(
          `errors.too_big.${issue.type}.${
            issue.exact
              ? "exact"
              : issue.inclusive
              ? "inclusive"
              : "not_inclusive"
          }`,
          {
            maximum:
              issue.type === "date" ? new Date(issue.maximum) : issue.maximum,
            ns: defaultNs,
            defaultValue: message,
            ...path,
          }
        );
        break;
      case ZodIssueCode.custom:
        message = t("errors.custom", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.invalid_intersection_types:
        message = t("errors.invalid_intersection_types", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.not_multiple_of:
        message = t("errors.not_multiple_of", {
          multipleOf: issue.multipleOf,
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      case ZodIssueCode.not_finite:
        message = t("errors.not_finite", {
          ns: defaultNs,
          defaultValue: message,
          ...path,
        });
        break;
      default:
    }

    return { message };
  };

export const zodI18nMap = makeZodI18nMap();
