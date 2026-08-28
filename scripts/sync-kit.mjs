import { cpSync, existsSync, mkdirSync, rmSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "../portfolio-website");
const dest = join(root, "vendor/portfolio-website");

if (!existsSync(join(src, "package.json"))) {
  console.error("Expected sibling checkout at ../portfolio-website");
  process.exit(1);
}

const paths = [
  "src/app/theme.css",
  "src/app/lib/cn.ts",
  "src/app/lib/motion.ts",
  "src/app/components/MotionProvider.tsx",
  "src/app/components/ui",
];

for (const relative of paths) {
  const from = join(src, relative);
  const to = join(dest, relative);
  mkdirSync(dirname(to), { recursive: true });
  rmSync(to, { recursive: true, force: true });
  cpSync(from, to, { recursive: true });
}

console.log("Synced kit into vendor/portfolio-website");
