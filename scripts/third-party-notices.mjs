import fs from "node:fs";
let text =
  "# Third-party notices\n\nThe following libraries are bundled in the application.\n";
for (const name of ["react", "react-dom", "scheduler", "katex", "three"]) {
  const directory = `node_modules/${name}`;
  const pkg = JSON.parse(fs.readFileSync(`${directory}/package.json`, "utf8"));
  const file = ["LICENSE", "LICENSE.txt", "LICENSE.md"].find((file) =>
    fs.existsSync(`${directory}/${file}`),
  );
  if (!file) throw new Error(`No license found for ${name}`);
  text += `\n## ${name} ${pkg.version}\n\n\`\`\`text\n${fs.readFileSync(`${directory}/${file}`, "utf8").trim()}\n\`\`\`\n`;
}
fs.writeFileSync("docs/THIRD_PARTY_NOTICES.md", text);
