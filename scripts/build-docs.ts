/**
 * Regenerates src/shared/docs/generated.ts from the markdown in docs/. The /docs pages import the
 * generated module, so the Worker needs no file system access and ships plain HTML.
 * Run with `npm run docs:build` after editing anything in docs/.
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildDocsModule } from "../src/shared/docs/build";

const root = process.cwd();
writeFileSync(join(root, "src/shared/docs/generated.ts"), buildDocsModule(root));
console.log("Wrote src/shared/docs/generated.ts");
