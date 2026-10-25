import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterAll, beforeAll, expect, test } from "vitest";
import pkg from "../package.json" with { type: "json" };

const ROOT = join(import.meta.dirname, "..");
const run = promisify(execFile);

let server: Server;
let base: string;
let dir: string;
const requested: string[] = [];

// Serves the repo as raw.githubusercontent.com would: /<ref>/<path>. Only "main" exists,
// so the default ref (v<version>) exercises the fallback.
beforeAll(async () => {
  server = createServer(async (req, res) => {
    const url = req.url ?? "";
    requested.push(url);
    const [, ref, ...rest] = url.split("/");
    try {
      if (ref !== "main") throw new Error("unknown ref");
      res.end(await readFile(join(ROOT, ...rest)));
    } catch {
      res.statusCode = 404;
      res.end();
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  dir = await mkdtemp(join(tmpdir(), "zod-i18n-cli-"));
});
afterAll(async () => {
  server.close();
  await rm(dir, { recursive: true, force: true });
});

const cli = (...args: string[]) =>
  run(process.execPath, [join(ROOT, "src/cli.ts"), ...args], {
    cwd: dir,
    env: { ...process.env, ZOD_I18N_MAP_BASE_URL: base },
  }).then(
    (r) => ({ code: 0, ...r }),
    (e: { code: number; stdout: string; stderr: string }) => e,
  );

test("list", async () => {
  const { code, stdout } = await cli("list", "--json");
  expect(code).toBe(0);
  expect(JSON.parse(stdout)).toContain("ja");
});

test("add falls back from the version tag to main and writes the file", async () => {
  const { code, stdout } = await cli("add", "ja", "--json");
  expect(code).toBe(0);
  expect(requested).toContain(`/v${pkg.version}/locales/index.json`);
  expect(requested).toContain("/main/locales/ja/zod.json");
  expect(JSON.parse(stdout)[0]).toMatchObject({ locale: "ja", status: "written", ref: "main" });
  expect(await readFile(join(dir, "locales/ja/zod.json"), "utf8")).toBe(
    await readFile(join(ROOT, "locales/ja/zod.json"), "utf8"),
  );
});

test("add skips existing files unless --force, and honours --out", async () => {
  expect((await cli("add", "ja")).stdout).toMatch(/skipped/);
  const { code } = await cli("add", "de", "fr", "--out", "public/{locale}/zod.json");
  expect(code).toBe(0);
  expect(JSON.parse(await readFile(join(dir, "public/fr/zod.json"), "utf8"))).toHaveProperty(
    "errors",
  );
});

test("add reports unknown locales with a non-zero exit code", async () => {
  const { code, stdout } = await cli("add", "xx");
  expect(code).toBe(1);
  expect(stdout).toMatch(/not available.*scaffold xx/);
});

test("add --format icu", async () => {
  await cli("add", "ru", "--format", "icu", "--out", "icu/{locale}.json");
  const ru = JSON.parse(await readFile(join(dir, "icu/ru.json"), "utf8"));
  expect(ru.errors.too_small.string.inclusive).toMatch(/^\{count, plural, one \{/);
});

test("check reports missing keys and real problems", async () => {
  const file = join(dir, "partial.json");
  await writeFile(file, JSON.stringify({ errors: { custom: "{{oops}}" } }));
  const result = await cli("check", file, "--locale", "de", "--json");
  expect(result.code).toBe(1);
  const report = JSON.parse(result.stdout);
  expect(report.missing).toContain("errors.invalid_type");
  expect(report.problems).toContain('"errors.custom" uses unknown variable {{oops}}');

  const complete = await cli("check", join(dir, "locales/ja/zod.json"));
  expect(complete.code).toBe(0);
  expect(complete.stdout).toMatch(/\(ja\): OK/);
});

test("scaffold copies the English reference and prints rules for the language", async () => {
  expect((await cli("scaffold", "ja")).code).toBe(1); // already available

  const { code, stdout } = await cli("scaffold", "sw", "--json");
  expect(code).toBe(0);
  const { path, instructions } = JSON.parse(stdout);
  expect(await readFile(path, "utf8")).toBe(
    await readFile(join(ROOT, "locales/en/zod.json"), "utf8"),
  );
  expect(instructions).toMatch(/`_one`, `_other`/);
  expect(instructions).toMatch(/npx zod-i18n-map check locales\/sw\/zod.json --locale sw/);

  // An untranslated scaffold is structurally valid, so `check` passes once plurals fit the language.
  expect((await cli("check", path)).code).toBe(0);
  const ja = await cli("scaffold", "ja-Kana", "--json");
  expect(JSON.parse(ja.stdout).instructions).toMatch(/single plural category/);
});

test("skill installs the Agent Skill", async () => {
  const { code } = await cli("skill");
  expect(code).toBe(0);
  const skill = await readFile(join(dir, ".claude/skills/zod-i18n-map/SKILL.md"), "utf8");
  expect(skill).toMatch(/^---\nname: zod-i18n-map\ndescription: /);
  expect((await cli("skill")).code).toBe(1); // exists
  expect((await cli("skill", "--out", "agents/zod/SKILL.md")).code).toBe(0);
});

test("add refuses several locales into one file", async () => {
  const { code, stderr } = await cli("add", "en", "ja", "--out", "src/zod.json");
  expect(code).toBe(1);
  expect(stderr).toMatch(/must contain \{locale\}/);
});
