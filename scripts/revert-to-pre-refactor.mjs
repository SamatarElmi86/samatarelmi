#!/usr/bin/env node
/**
 * Rollback script: Restores the website to the exact pre-refactor state
 * using files preserved in templates/backup-pre-refactor/
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const backupRoot = path.join(repoRoot, "templates", "backup-pre-refactor");

if (!fs.existsSync(backupRoot)) {
  console.error("Error: Backup directory not found at", backupRoot);
  process.exit(1);
}

function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === "README.md") continue;
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Restored: ${path.relative(repoRoot, destPath)}`);
    }
  }
}

console.log("Restoring all files from pre-refactor backup...");
copyDir(backupRoot, repoRoot);
console.log("Rollback completed successfully!");
