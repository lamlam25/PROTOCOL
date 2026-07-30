/**
 * Statically verifies that every `t("some.key")` / `tX("some.key")` call
 * (string-literal keys only — dynamic `t(\`ns.${value}\`)` calls can't be
 * checked this way and are skipped) resolves against the actual bn message
 * JSON, using each translator's declared namespace scope
 * (`useTranslations("ns")` / `getTranslations({namespace: "ns"})`).
 *
 * Catches wrong-nesting-level bugs (e.g. calling t("adminPanel") when the
 * translator is scoped to "common" but the key actually lives at
 * "common.nav.adminPanel") that next-intl only surfaces as an inline
 * MISSING_MESSAGE error in the browser, never a build/type error.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const MESSAGES_DIR = join(__dirname, "..", "messages", "bn");
const SCAN_DIRS = [
  join(__dirname, "..", "src", "app"),
  join(__dirname, "..", "src", "components"),
];

const namespaceRoots: Record<string, unknown> = {};
for (const file of readdirSync(MESSAGES_DIR)) {
  if (!file.endsWith(".json")) continue;
  namespaceRoots[file.replace(/\.json$/, "")] = JSON.parse(
    readFileSync(join(MESSAGES_DIR, file), "utf8")
  );
}

function resolves(fullPath: string): boolean {
  const [root, ...rest] = fullPath.split(".");
  let node: unknown = namespaceRoots[root];
  for (const key of rest) {
    if (node == null || typeof node !== "object" || !(key in node)) return false;
    node = (node as Record<string, unknown>)[key];
  }
  return typeof node === "string";
}

function walk(dir: string, files: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (entry.endsWith(".tsx") || entry.endsWith(".ts")) files.push(full);
  }
  return files;
}

function main() {
  const files = SCAN_DIRS.flatMap((dir) => walk(dir));
  let issues = 0;

  for (const file of files) {
    const content = readFileSync(file, "utf8");

    const translatorScopes: Record<string, string> = {};
    for (const m of content.matchAll(
      /const\s+(\w+)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations\(\{[^}]*namespace:\s*)"([^"]+)"/g
    )) {
      translatorScopes[m[1]] = m[2];
    }
    if (Object.keys(translatorScopes).length === 0) continue;

    for (const m of content.matchAll(/\b(\w+)\(\s*[`"]([^`"$]+)[`"]/g)) {
      const [, varName, key] = m;
      const scope = translatorScopes[varName];
      if (!scope) continue;
      const fullPath = `${scope}.${key}`;
      if (!resolves(fullPath)) {
        console.error(`missing: ${fullPath}  (${file}: ${varName}("${key}"))`);
        issues++;
      }
    }
  }

  if (issues > 0) {
    console.error(`\n${issues} translation key reference(s) don't resolve.`);
    process.exit(1);
  }
  console.log("All static translation key references resolve.");
}

main();
