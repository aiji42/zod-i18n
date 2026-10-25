/**
 * The map is only useful together with an i18n setup, so these tests run it through the
 * libraries people actually combine it with: react-i18next, lazy-loading backends and
 * i18next-icu (see icu.test.ts). Locale files are loaded from ../locales like a user's copy.
 */
import { readFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { createInstance, type i18n, type TFunction } from "i18next";
import HttpBackend from "i18next-http-backend";
import resourcesToBackend from "i18next-resources-to-backend";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { I18nextProvider, initReactI18next, useTranslation } from "react-i18next";
import { afterAll, beforeAll, describe, expect, test } from "vitest";
import * as z from "zod";
import { makeZodI18nMap, type TranslateFunction } from "../src/index.ts";

const LOCALES = join(import.meta.dirname, "..", "locales");
const loadLocale = async (lng: string) =>
  JSON.parse(await readFile(join(LOCALES, lng, "zod.json"), "utf8")) as Record<string, unknown>;

const schema = z.object({ name: z.string().min(3), email: z.email() });
const input = { name: "a", email: "nope" };
const messages = (i: i18n, error = makeZodI18nMap({ t: i.t })) =>
  schema.safeParse(input, { error }).error?.issues.map((issue) => issue.message);

test("TranslateFunction accepts the t functions of the ecosystem (type-level)", () => {
  const i = createInstance();
  const fromI18next: TranslateFunction = i.t;
  const fixed: TranslateFunction = i.getFixedT("ja");
  const generic: TranslateFunction = ((key: string) => key) as TFunction;
  expect([fromI18next, fixed, generic].every((t) => typeof t === "function")).toBe(true);
});

describe("react-i18next", () => {
  test("useTranslation().t works as the map's t, and follows changeLanguage", async () => {
    const i = createInstance().use(initReactI18next);
    await i.init({
      lng: "en",
      resources: { en: { zod: await loadLocale("en") }, ja: { zod: await loadLocale("ja") } },
    });

    const Form = () => {
      const { t } = useTranslation("zod");
      const result = schema.safeParse(input, { error: makeZodI18nMap({ t }) });
      return createElement(
        "ul",
        null,
        result.error?.issues.map((x) => createElement("li", { key: x.path.join() }, x.message)),
      );
    };
    const render = () =>
      renderToString(createElement(I18nextProvider, { i18n: i }, createElement(Form)));

    expect(render()).toBe(
      "<ul><li>String must contain at least 3 characters</li><li>Invalid email address</li></ul>",
    );
    await i.changeLanguage("ja");
    expect(render()).toBe(
      "<ul><li>3文字以上で入力してください。</li><li>メールアドレスの形式で入力してください。</li></ul>",
    );
  });
});

describe("lazy-loaded resources", () => {
  test("i18next-resources-to-backend (dynamic import of the copied JSON)", async () => {
    const i = createInstance().use(resourcesToBackend((lng: string) => loadLocale(lng)));
    await i.init({ lng: "de", ns: ["zod"], defaultNS: "zod" });
    expect(messages(i)).toEqual([
      "Text muss mindestens 3 Zeichen enthalten",
      "Ungültige E-Mail-Adresse",
    ]);
  });

  describe("i18next-http-backend (files served from public/ or a CDN)", () => {
    let server: Server;
    let base: string;
    beforeAll(async () => {
      server = createServer(async (req, res) => {
        try {
          const [, lng, file] = (req.url ?? "").split("/");
          res.setHeader("content-type", "application/json");
          res.end(await readFile(join(LOCALES, lng ?? "", file ?? "")));
        } catch {
          res.statusCode = 404;
          res.end();
        }
      });
      await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
      base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    afterAll(() => server.close());

    test("loads the namespace over HTTP", async () => {
      const i = createInstance().use(HttpBackend);
      await i.init({
        lng: "fr",
        ns: ["zod"],
        defaultNS: "zod",
        backend: { loadPath: `${base}/{{lng}}/{{ns}}.json` },
      });
      const [name, email] = messages(i) ?? [];
      expect(name).toMatch(/3/);
      expect(email).toMatch(/e-mail/i);
      expect(name).not.toBe("String must contain at least 3 characters");
    });
  });
});

describe("i18next options people commonly set", () => {
  test.each([
    ["escapeValue: true (default)", { interpolation: { escapeValue: true } }],
    ["escapeValue: false (React setups)", { interpolation: { escapeValue: false } }],
    ["custom nsSeparator", { nsSeparator: "::" }],
    ["returnNull / returnEmptyString", { returnNull: true, returnEmptyString: true }],
    ["fallbackLng to en", { fallbackLng: "en" }],
  ])("%s", async (_, options) => {
    const i = createInstance();
    await i.init({ lng: "en", resources: { en: { zod: await loadLocale("en") } }, ...options });
    const issue = z.enum(["it's", "b"]).safeParse("x", { error: makeZodI18nMap({ t: i.t }) }).error
      ?.issues[0];
    expect(issue?.message).toBe(`Invalid option: expected one of "it's" | "b"`);
  });

  test("fallbackLng fills keys missing from a partial locale", async () => {
    const i = createInstance();
    await i.init({
      lng: "xx",
      fallbackLng: "en",
      resources: { en: { zod: await loadLocale("en") }, xx: { zod: { errors: { custom: "XX" } } } },
    });
    expect(
      z.string().safeParse(1, { error: makeZodI18nMap({ t: i.t }) }).error?.issues[0]?.message,
    ).toBe("Expected string, received number");
  });
});
