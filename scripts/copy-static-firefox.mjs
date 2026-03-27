import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const distDir = path.join(root, "dist");
const publicDir = path.join(root, "public");

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(path.join(distDir, "js"), { recursive: true });

const copyRecursive = (from, to) => {
  if (!fs.existsSync(from)) return;
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) {
      copyRecursive(path.join(from, entry), path.join(to, entry));
    }
    return;
  }
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
};

copyRecursive(publicDir, distDir);
copyRecursive(path.join(root, "icons"), path.join(distDir, "icons"));
copyRecursive(path.join(root, "_locales"), path.join(distDir, "_locales"));
copyRecursive(path.join(root, "js"), path.join(distDir, "js"));

// MISSING: Copy root CSS/HTML files
const rootFiles = ["content.css", "shared.css", "popup.css", "popup.html"];
for (const file of rootFiles) {
  const src = path.join(root, file);
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(distDir, file));
}

// MISSING: Copy component directories
const rootDirs = ["options", "help", "welcome", "permissions", "libs"];
for (const dir of rootDirs) {
  copyRecursive(path.join(root, dir), path.join(distDir, dir));
}

fs.copyFileSync(
  path.join(root, "manifest.firefox.v2.json"),
  path.join(distDir, "manifest.json")
);
fs.copyFileSync(
  path.join(root, "src/content/spotify-inject.js"),
  path.join(distDir, "js/spotify-inject.js")
);

const projectConfigPath = path.join(root, "config.json");
const fallbackConfigPath = path.join(root, "config.json.example");
const sourceConfigPath = fs.existsSync(projectConfigPath) ? projectConfigPath : fallbackConfigPath;
if (fs.existsSync(sourceConfigPath)) {
  fs.copyFileSync(sourceConfigPath, path.join(distDir, "config.json"));
}

console.log("Firefox MV2 build generated in dist/");
