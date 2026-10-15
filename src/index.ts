import i18next from "i18next";
import type * as z from "zod/v4/core";

/**
 * Minimal shape of an i18next-compatible `t` function.
 * `i18next.t`, `i18n.getFixedT(lng)` and react-i18next's `t` all satisfy it.
 */
export type TranslateFunction = (
  key: string | string[],
  options?: Record<string, unknown>,
) => unknown;

export type HandlePathOption = {
  /** i18next context appended to message keys when the issue has a path. @default "with_path" */
  context?: string;
  /** Namespace(s) used to look up path labels. Defaults to `ns`. */
  ns?: string | readonly string[];
  /** Prefix for path label keys, e.g. `"fields"` looks up `fields.user.name`. */
  keyPrefix?: string;
};

export type ZodI18nMapOption = {
  /** Translation function. Defaults to the global `i18next.t`. */
  t?: TranslateFunction;
  /** Namespace(s) holding the zod messages. @default "zod" */
  ns?: string | readonly string[];
  /** Translate object keys and expose them as `{{path}}`. Pass `false` to disable. */
  handlePath?: HandlePathOption | false;
};

/**
 * Value accepted by `params.i18n` on `.refine()`, `.superRefine()` and `z.custom()`.
 * For built-in schemas and checks use `error: zodI18nMap.key(...)` / `i18nKey(...)` instead.
 */
export type CustomErrorParams = string | { key: string; values?: Record<string, unknown> };

const DEFAULT_NS = "zod";
const DEFAULT_CONTEXT = "with_path";
// Returned by `t` only when none of the keys exist, so we can defer to Zod's own message.
const MISSING = "\u0000zod-i18n-map:missing\u0000";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stringify = (value: unknown): string =>
  typeof value === "string"
    ? JSON.stringify(value)
    : typeof value === "bigint"
      ? `${value}n`
      : String(value);

const joinValues = (values: readonly unknown[], separator: string): string =>
  values.map(stringify).join(separator);

/** Zod v4 reports class names for objects; reduce them to stable, translatable type names. */
const getReceivedType = (input: unknown): string => {
  switch (typeof input) {
    case "number":
      return Number.isNaN(input) ? "nan" : "number";
    case "object": {
      if (input === null) return "null";
      if (Array.isArray(input)) return "array";
      if (input instanceof Date) return "date";
      if (input instanceof Map) return "map";
      if (input instanceof Set) return "set";
      if (typeof File !== "undefined" && input instanceof File) return "file";
      if (typeof (input as { then?: unknown }).then === "function") return "promise";
      return "object";
    }
    default:
      return typeof input;
  }
};

/** `int` and `bigint` share number wording; `file` sizes are bytes. */
const normalizeOrigin = (origin: string): string =>
  origin === "int" || origin === "bigint" ? "number" : origin;

const toCount = (value: number | bigint): number | undefined => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const getCustomI18n = (param: unknown): CustomI18n | undefined => {
  if (typeof param === "string") return { key: param, values: {} };
  if (isRecord(param) && typeof param.key === "string") {
    return {
      key: param.key,
      values: isRecord(param.values) ? param.values : {},
    };
  }
  return undefined;
};

export type ZodI18nMap = z.$ZodErrorMap & {
  /**
   * Error map that translates with `key` first, for use as a schema or check `error`.
   * The issue's own values (`count`, `minimum`, `path`, ...) are available for interpolation.
   *
   * @example z.string().min(8, { error: zodI18nMap.key("password.too_short") })
   */
  key: (key: string, values?: Record<string, unknown>) => z.$ZodErrorMap;
  /**
   * Translate an already-created issue with the *current* language, e.g. at render time after
   * the user switched languages. Issues created by this map carry what is needed in `issue.zodI18n`.
   * Other issues (e.g. messages from your own `error` strings) are returned unchanged.
   */
  translate: (issue: z.$ZodIssue) => string;
};

type CustomI18n = { key: string; values: Record<string, unknown> };

/** Stored on each issue this map handles, so `translate()` can rebuild the message later. */
export type ZodI18nIssueMeta = { received?: string; custom?: CustomI18n };

const META = "zodI18n";

export const makeZodI18nMap = (option: ZodI18nMapOption = {}): ZodI18nMap => {
  const t: TranslateFunction = option.t ?? ((key, options) => i18next.t(key as string, options));
  const ns = option.ns ?? DEFAULT_NS;
  const handlePath =
    option.handlePath === false
      ? null
      : {
          context: DEFAULT_CONTEXT,
          ns,
          ...option.handlePath,
        };

  const label = (key: string, defaultValue: string): string => String(t(key, { ns, defaultValue }));

  const build =
    (forced?: CustomI18n): z.$ZodErrorMap =>
    (issue) => {
      const path = (issue.path ?? []).map(String);
      const pathOptions =
        handlePath && path.length > 0
          ? {
              context: handlePath.context,
              path: t(
                [path.join("."), path.filter((p) => !/^\d+$/.test(p)).join(".")]
                  .filter((key, i, keys) => key && keys.indexOf(key) === i)
                  .map((key) => (handlePath.keyPrefix ? `${handlePath.keyPrefix}.${key}` : key)),
                { ns: handlePath.ns, defaultValue: path.join(".") },
              ),
            }
          : {};

      const meta: ZodI18nIssueMeta = (issue as { [META]?: ZodI18nIssueMeta })[META] ?? {};
      if (issue.code === "invalid_type" && "input" in issue && meta.received === undefined)
        meta.received = getReceivedType(issue.input);
      if (forced) meta.custom = forced;
      // Copied onto the final issue by Zod (it keeps the raw issue's own properties).
      (issue as { [META]?: ZodI18nIssueMeta })[META] = meta;

      const { key, values } = resolve(issue, label, meta.received);
      const override =
        meta.custom ?? (issue.code === "custom" ? getCustomI18n(issue.params?.i18n) : undefined);
      if (issue.code === "custom" && !override) {
        return translateOrUndefined(t, "errors.custom", pathOptions, ns);
      }
      if (!key && !override) return undefined;

      return translateOrUndefined(
        t,
        [override?.key, ...(Array.isArray(key) ? key : [key])].filter((k): k is string => !!k),
        { ...values, ...override?.values, ...pathOptions },
        ns,
      );
    };

  const map = build();
  return Object.assign(map, {
    key: (key: string, values: Record<string, unknown> = {}) => build({ key, values }),
    translate: (issue: z.$ZodIssue): string => {
      if (!(META in issue)) return issue.message;
      const message = map({ ...issue } as unknown as z.$ZodRawIssue);
      return (typeof message === "string" ? message : message?.message) ?? issue.message;
    },
  });
};

const translateOrUndefined = (
  t: TranslateFunction,
  key: string | string[],
  values: Record<string, unknown>,
  ns: string | readonly string[],
): string | undefined => {
  // Messages are plain text, not HTML: escaping would turn labels like "nom d'hôte" into "nom d&#39;hôte".
  const message = t(key, {
    ...values,
    ns,
    defaultValue: MISSING,
    interpolation: { escapeValue: false },
  });
  return typeof message === "string" && message !== MISSING ? message : undefined;
};

type Resolved = {
  key: string | string[] | undefined;
  values?: Record<string, unknown>;
};

const resolve = (
  issue: z.$ZodRawIssue,
  label: (key: string, defaultValue: string) => string,
  received = "unknown",
): Resolved => {
  switch (issue.code) {
    case "invalid_type": {
      if (received === "undefined") return { key: "errors.invalid_type_received_undefined" };
      if (received === "null") return { key: "errors.invalid_type_received_null" };
      return {
        key: "errors.invalid_type",
        values: {
          expected: label(`types.${issue.expected}`, issue.expected),
          received: label(`types.${received}`, received),
        },
      };
    }

    case "invalid_value":
      if (issue.values.length === 1)
        return {
          key: "errors.invalid_value_single",
          values: { expected: stringify(issue.values[0]) },
        };
      return {
        key: "errors.invalid_value",
        values: { options: joinValues(issue.values, " | ") },
      };

    case "too_small":
    case "too_big": {
      const isSmall = issue.code === "too_small";
      const raw = isSmall ? issue.minimum : issue.maximum;
      const origin = normalizeOrigin(issue.origin);
      const variant = issue.exact ? "exact" : issue.inclusive ? "inclusive" : "not_inclusive";
      return {
        key: `errors.${issue.code}.${origin}.${variant}`,
        values: {
          [isSmall ? "minimum" : "maximum"]: origin === "date" ? new Date(Number(raw)) : raw,
          count: origin === "date" ? undefined : toCount(raw),
        },
      };
    }

    case "invalid_format": {
      const format = issue.format;
      const extra = issue as { prefix?: string; suffix?: string; includes?: string };
      return {
        key: [`errors.invalid_format.${format}`, "errors.invalid_format.default"],
        values: {
          format: label(`formats.${format}`, format),
          pattern: issue.pattern,
          prefix: extra.prefix,
          suffix: extra.suffix,
          includes: extra.includes,
        },
      };
    }

    case "not_multiple_of":
      return {
        key: "errors.not_multiple_of",
        values: { divisor: issue.divisor },
      };

    case "unrecognized_keys":
      return {
        key: "errors.unrecognized_keys",
        values: { keys: joinValues(issue.keys, ", "), count: issue.keys.length },
      };

    case "invalid_key":
    case "invalid_element":
      return {
        key: `errors.${issue.code}`,
        values: { origin: label(`types.${issue.origin}`, issue.origin) },
      };

    case "invalid_union":
      if (Array.isArray(issue.options) && issue.options.length > 0)
        return {
          key: "errors.invalid_union_discriminator",
          values: {
            options: joinValues(issue.options, " | "),
            discriminator: issue.discriminator,
          },
        };
      return { key: "errors.invalid_union" };

    default:
      return { key: undefined };
  }
};

/** Ready-to-use error map backed by the global `i18next` instance and the `zod` namespace. */
export const zodI18nMap: ZodI18nMap = makeZodI18nMap();

/** Shorthand for `zodI18nMap.key(...)` using the global `i18next` instance. */
export const i18nKey: ZodI18nMap["key"] = zodI18nMap.key;

/** Shorthand for `zodI18nMap.translate(...)` using the global `i18next` instance. */
export const translateIssue: ZodI18nMap["translate"] = zodI18nMap.translate;
