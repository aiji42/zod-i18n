import type { ZodIssueOptionalMessage } from "zod";
import { ZodIssueCode, ZodParsedType } from "zod";
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

function assertNever(_x: never): never {
  throw new Error();
}

type ErrorMapCtx = {
  defaultError: string;
  data: any;
};

// https://github.com/colinhacks/zod/blob/master/src/ZodError.ts#L308
export const defaultErrorMap = (
  issue: ZodIssueOptionalMessage,
  _ctx: ErrorMapCtx
): { message: string } => {
  let message: string;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
        message = i18next.t("zod.invalid_type_required", message);
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
        // TODO: expected and received type
        message = i18next.t("zod.invalid_type", {
          expected: issue.expected,
          received: issue.received,
          defaultValue: message,
        });
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(
        issue.expected,
        jsonStringifyReplacer
      )}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${joinValues(
        issue.keys,
        ", "
      )}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${joinValues(
        issue.options
      )}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${joinValues(
        issue.options
      )}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${
          issue.inclusive ? `at least` : `more than`
        } ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${
          issue.inclusive ? `at least` : `over`
        } ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be greater than ${
          issue.inclusive ? `or equal to ` : ``
        }${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be greater than ${
          issue.inclusive ? `or equal to ` : ``
        }${new Date(issue.minimum)}`;
      else message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${
          issue.inclusive ? `at most` : `less than`
        } ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${
          issue.inclusive ? `at most` : `under`
        } ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be less than ${
          issue.inclusive ? `or equal to ` : ``
        }${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be smaller than ${
          issue.inclusive ? `or equal to ` : ``
        }${new Date(issue.maximum)}`;
      else message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    default:
      message = _ctx.defaultError;
      assertNever(issue);
  }
  return { message };
};
