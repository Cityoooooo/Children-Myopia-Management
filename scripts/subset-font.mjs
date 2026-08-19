import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontDir = path.join(root, "assets", "fonts");
const tmpDir = path.join(root, "tmp");

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".git" || name === "tmp") continue;
    const full = path.join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) files.push(...walk(full));
    else files.push(full);
  }
  return files;
}

function collectText() {
  const allow = new Set([".html", ".css", ".ts", ".js", ".svg"]);
  let text = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  text += " ,.:;!?、。！？：；“”\"'‘’（）()[]【】+-—·～~/%℃°+";
  for (const file of walk(root)) {
    if (!allow.has(path.extname(file))) continue;
    text += readFileSync(file, "utf8");
  }
  return [...new Set(text)].sort().join("");
}

async function download(url, dest) {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`download failed ${res.status} ${url}`);
  writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
}

async function downloadFirst(urls, dest) {
  let lastError = null;
  for (const url of urls) {
    try {
      console.log(`downloading ${url}`);
      await download(url, dest);
      return;
    } catch (error) {
      lastError = error;
      console.warn(String(error));
    }
  }
  throw lastError ?? new Error("no font source available");
}

function subset(src, dest, text, extraArgs = []) {
  const bin = process.env.HOME
    ? `${process.env.HOME}/.local/bin/pyftsubset`
    : "pyftsubset";
  execFileSync(
    bin,
    [
      src,
      `--text=${text}`,
      "--flavor=woff2",
      `--output-file=${dest}`,
      "--layout-features=kern,liga,calt",
      ...extraArgs,
    ],
    { stdio: "inherit" },
  );
}

mkdirSync(fontDir, { recursive: true });
mkdirSync(tmpDir, { recursive: true });

const text = collectText();
writeFileSync(path.join(tmpDir, "subset-chars.txt"), text, "utf8");
console.log(`subset glyph count: ${text.length}`);

const jobs = [
  {
    weight: "400",
    dest: path.join(fontDir, "noto-sans-sc-400.woff2"),
    src: path.join(tmpDir, "noto-sans-sc-400-src.woff"),
    urls: [
      "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@5.2.8/chinese-simplified-400-normal.woff",
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.2.8/files/noto-sans-sc-chinese-simplified-400-normal.woff",
    ],
  },
  {
    weight: "600",
    dest: path.join(fontDir, "noto-sans-sc-600.woff2"),
    src: path.join(tmpDir, "noto-sans-sc-600-src.woff"),
    urls: [
      "https://cdn.jsdelivr.net/fontsource/fonts/noto-sans-sc@5.2.8/chinese-simplified-600-normal.woff",
      "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-sc@5.2.8/files/noto-sans-sc-chinese-simplified-600-normal.woff",
    ],
  },
];

for (const job of jobs) {
  await downloadFirst(job.urls, job.src);
  subset(job.src, job.dest, text);
  const size = statSync(job.dest).size;
  console.log(`${path.basename(job.dest)}: ${(size / 1024).toFixed(1)} KB`);
}
