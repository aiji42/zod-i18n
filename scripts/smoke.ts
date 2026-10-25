/**
 * Installs the packed tarball into a scratch project and checks it the way users consume it:
 * ESM import, require(esm), the bin, and type resolution under `nodenext` and `bundler`.
 *
 *   pnpm build && node scripts/smoke.ts
 */
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const dir = mkdtempSync(join(tmpdir(), "zod-i18n-smoke-"));
const sh = (cmd: string, args: string[], cwd = dir) =>
  execFileSync(cmd, args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
const step = (name: string, fn: () => void) => {
  fn();
  console.log(`✔ ${name}`);
};

try {
  sh("pnpm", ["pack", "--pack-destination", dir], ROOT);
  const tarball = readdirSync(dir).find((f) => f.endsWith(".tgz"));
  if (!tarball) throw new Error("pnpm pack produced no tarball");

  step("package contents (no bundled translations)", () => {
    const files = sh("tar", ["-tzf", tarball]).split("\n");
    const unexpected = files.filter(
      (f) => f && !/^package\/(dist\/|package\.json|README\.md|LICENSE|llms\.txt)/.test(f),
    );
    if (unexpected.length) throw new Error(`unexpected files: ${unexpected.join(", ")}`);
  });

  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "smoke", private: true }));
  sh("npm", [
    "install",
    "--no-audit",
    "--no-fund",
    "--ignore-scripts",
    `./${tarball}`,
    "zod",
    "i18next",
  ]);

  const usage = `
    import i18next from "i18next";
    import * as z from "zod";
    import { zodI18nMap, i18nKey, translateIssue } from "zod-i18n-map";
    await i18next.init({ lng: "en", resources: { en: { zod: { errors: { invalid_type: "E:{{expected}}" }, custom: "C" } } } });
    z.config({ customError: zodI18nMap });
    const issue = z.string().safeParse(1).error?.issues[0];
    if (issue?.message !== "E:string" || translateIssue(issue) !== "E:string") throw new Error(String(issue?.message));
    if (z.string().min(2, { error: i18nKey("custom") }).safeParse("").error?.issues[0]?.message !== "C") throw new Error("i18nKey");
  `;

  step("ESM import", () => {
    writeFileSync(join(dir, "esm.mjs"), usage);
    sh("node", ["esm.mjs"]);
  });

  step("require(esm) from CommonJS", () => {
    writeFileSync(
      join(dir, "cjs.cjs"),
      `const { makeZodI18nMap } = require("zod-i18n-map"); if (typeof makeZodI18nMap !== "function") throw new Error("require");`,
    );
    sh("node", ["cjs.cjs"]);
  });

  step("bin", () => {
    if (!sh("npx", ["--no-install", "zod-i18n-map", "--help"]).includes("Usage:"))
      throw new Error("bin --help");
  });

  for (const moduleResolution of ["nodenext", "bundler"]) {
    step(`types (moduleResolution: ${moduleResolution})`, () => {
      writeFileSync(join(dir, "usage.mts"), usage);
      writeFileSync(
        join(dir, "tsconfig.json"),
        JSON.stringify({
          compilerOptions: {
            strict: true,
            noEmit: true,
            target: "es2022",
            module: moduleResolution === "bundler" ? "esnext" : "nodenext",
            moduleResolution,
            skipLibCheck: false,
            types: [],
          },
          files: ["usage.mts"],
        }),
      );
      sh(join(ROOT, "node_modules/.bin/tsc"), ["-p", "tsconfig.json"]);
    });
  }
  console.log("smoke test passed");
} finally {
  rmSync(dir, { recursive: true, force: true });
}
