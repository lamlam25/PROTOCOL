import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const MESSAGES_DIR = join(__dirname, "..", "messages");
const LOCALES = ["bn", "en"] as const;

function flattenKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([key, value]) =>
    flattenKeys(value, prefix ? `${prefix}.${key}` : key)
  );
}

function main() {
  const [base, ...rest] = LOCALES;
  const baseFiles = readdirSync(join(MESSAGES_DIR, base)).filter((f) =>
    f.endsWith(".json")
  );

  let hasError = false;

  for (const locale of rest) {
    const localeFiles = new Set(
      readdirSync(join(MESSAGES_DIR, locale)).filter((f) =>
        f.endsWith(".json")
      )
    );

    for (const file of baseFiles) {
      if (!localeFiles.has(file)) {
        console.error(`[i18n] missing file: messages/${locale}/${file}`);
        hasError = true;
        continue;
      }

      const baseKeys = new Set(
        flattenKeys(
          JSON.parse(readFileSync(join(MESSAGES_DIR, base, file), "utf8"))
        )
      );
      const localeKeys = new Set(
        flattenKeys(
          JSON.parse(readFileSync(join(MESSAGES_DIR, locale, file), "utf8"))
        )
      );

      for (const key of baseKeys) {
        if (!localeKeys.has(key)) {
          console.error(`[i18n] ${file}: missing "${key}" in ${locale}`);
          hasError = true;
        }
      }
      for (const key of localeKeys) {
        if (!baseKeys.has(key)) {
          console.error(`[i18n] ${file}: extra "${key}" in ${locale} (not in ${base})`);
          hasError = true;
        }
      }
    }
  }

  if (hasError) {
    console.error("\ni18n parity check failed.");
    process.exit(1);
  }
  console.log(`i18n parity OK across ${LOCALES.join(", ")} (${baseFiles.length} namespace files).`);
}

main();
