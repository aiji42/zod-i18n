import { ZodIssueCode, ZodParsedType, defaultErrorMap } from "zod";
import i18next from "i18next";

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

export const zodI18nMap: typeof defaultErrorMap = (issue, ctx) => {
  let message: string;
  message = defaultErrorMap(issue, ctx).message;

  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = i18next.t("zod.errors.invalid_type_received_undefined", {
          defaultValue: message,
        });
      } else {
        message = i18next.t("zod.errors.invalid_type", {
          expected: i18next.t(`zod.types.${issue.expected}`, issue.expected),
          received: i18next.t(`zod.types.${issue.received}`, issue.received),
          defaultValue: message,
        });
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = i18next.t("zod.errors.invalid_literal", {
        expected: JSON.stringify(issue.expected, jsonStringifyReplacer),
        defaultValue: message,
      });
      break;
    case ZodIssueCode.unrecognized_keys:
      message = i18next.t("zod.errors.unrecognized_keys", {
        keys: joinValues(issue.keys, ", "),
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_union:
      message = i18next.t("zod.errors.invalid_union", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = i18next.t("zod.errors.invalid_union_discriminator", {
        options: joinValues(issue.options),
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_enum_value:
      message = i18next.t("zod.errors.invalid_enum_value", {
        options: joinValues(issue.options),
        received: issue.received,
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_arguments:
      message = i18next.t("zod.errors.invalid_arguments", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_return_type:
      message = i18next.t("zod.errors.invalid_return_type", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_date:
      message = i18next.t("zod.errors.invalid_date", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("startsWith" in issue.validation) {
          message = i18next.t(`zod.errors.invalid_string.startsWith`, {
            startsWith: issue.validation.startsWith,
            defaultValue: message,
          });
        } else if ("endsWith" in issue.validation) {
          message = i18next.t(`zod.errors.invalid_string.endsWith`, {
            endsWith: issue.validation.endsWith,
            defaultValue: message,
          });
        }
      } else {
        message = i18next.t(`zod.errors.invalid_string.${issue.validation}`, {
          validation: i18next.t(
            `zod.validations.${issue.validation}`,
            issue.validation
          ),
          defaultValue: message,
        });
      }
      break;
    case ZodIssueCode.too_small:
      message = i18next.t(
        `zod.errors.too_small.${issue.type}.${
          issue.inclusive ? "inclusive" : "not_inclusive"
        }`,
        {
          minimum:
            issue.type === "date" ? new Date(issue.minimum) : issue.minimum,
          defaultValue: message,
        }
      );
      break;
    case ZodIssueCode.too_big:
      message = i18next.t(
        `zod.errors.too_big.${issue.type}.${
          issue.inclusive ? "inclusive" : "not_inclusive"
        }`,
        {
          maximum:
            issue.type === "date" ? new Date(issue.maximum) : issue.maximum,
          defaultValue: message,
        }
      );
      break;
    case ZodIssueCode.custom:
      message = i18next.t("zod.errors.custom", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = i18next.t("zod.errors.invalid_intersection_types", {
        defaultValue: message,
      });
      break;
    case ZodIssueCode.not_multiple_of:
      message = i18next.t("zod.errors.not_multiple_of", {
        multipleOf: issue.multipleOf,
        defaultValue: message,
      });
      break;
    default:
  }

  return { message };
};
