import { copyFile, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";

const projectRoot = new URL("../", import.meta.url);
const dist = new URL("../dist/", import.meta.url);
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ["index.html", "styles.css", "app.js", "data.js", "refresh-state.js"]) {
  await copyFile(new URL(`../${file}`, import.meta.url), new URL(`../dist/${file}`, import.meta.url));
}
await writeFile(new URL("../dist/.nojekyll", import.meta.url), "");

try {
  const publicFiles = await readdir(new URL("../public/", import.meta.url));
  for (const file of publicFiles) await copyFile(new URL(`../public/${file}`, import.meta.url), join(dist.pathname, file));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}

console.log("Built static site in dist/.");
