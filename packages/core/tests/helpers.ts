import { SafeParseReturnType, ZodError } from "zod";

export const getErrorMessage = (
  parsed: SafeParseReturnType<unknown, unknown>
): string => {
  if ("error" in parsed) return parsed.error.issues[0].message;
  throw new Error();
};

export const getErrorMessageFromZodError = (callback: () => void) => {
  try {
    callback();
  } catch (e) {
    if (e instanceof ZodError) {
      return e.errors[0].message;
    }
    throw e;
  }
};
