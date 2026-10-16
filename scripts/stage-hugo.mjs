// Prepare a Hugo checkout or isolated copy. Never builds, commits, or deploys the website.
import fs from "node:fs";
import path from "node:path";
const target = process.argv[2];
if (!target)
  throw new Error("Usage: node scripts/stage-hugo.mjs /path/to/hugo-copy");
if (!fs.existsSync(path.join(target, "config/_default/menus.yaml")))
  throw new Error("Expected the academic Hugo website");
const manifest = JSON.parse(
  fs.readFileSync("dist/.vite/manifest.json", "utf8"),
);
const entry = manifest["index.html"];
if (!entry?.file) throw new Error("Run npm run build first");
// Byte copies avoid ownership/metadata operations on Docker Desktop bind mounts.
function copyTree(source, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(source, { withFileTypes: true })) {
    const from = path.join(source, item.name),
      to = path.join(dest, item.name);
    if (item.isDirectory()) copyTree(from, to);
    else if (item.isFile()) fs.writeFileSync(to, fs.readFileSync(from));
  }
}
for (const dir of ["content", "layouts"])
  copyTree(`integration/hugo/${dir}`, path.join(target, dir));
const destination = path.join(target, "static/linear-algebra/assets");
fs.mkdirSync(destination, { recursive: true });
copyTree("dist/assets", destination);
fs.mkdirSync(path.join(target, "data"), { recursive: true });
fs.writeFileSync(
  path.join(target, "data/linear_algebra.json"),
  JSON.stringify(
    {
      entry: `linear-algebra/${entry.file}`,
      css: entry.css.map((file) => `linear-algebra/${file}`),
    },
    null,
    2,
  ) + "\n",
);
const menuPath = path.join(target, "config/_default/menus.yaml");
let menus = fs.readFileSync(menuPath, "utf8");
if (!menus.includes("identifier: teaching-material")) {
  if (!/^main:\s*$/m.test(menus))
    throw new Error("Expected main navigation list");
  menus = menus.replace(
    /^main:\s*$/m,
    "main:\n  - name: Teaching material\n    identifier: teaching-material\n    url: /linear-algebra/\n    weight: 45",
  );
  fs.writeFileSync(menuPath, menus);
}
console.log(
  `Staged the dashboard in ${target}. No commit, push, or deployment performed.`,
);
