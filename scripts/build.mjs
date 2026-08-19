import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

await esbuild.build({
  absWorkingDir: root,
  entryPoints: ["assets/ts/app.ts"],
  bundle: true,
  format: "iife",
  target: ["es2019"],
  outfile: "assets/js/app.js",
  minify: true,
  legalComments: "none",
});

console.log("built assets/js/app.js");
