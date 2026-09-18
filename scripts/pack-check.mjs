import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const temp = mkdtempSync(join(tmpdir(), "cube-motion-pack-"));
const run = (command, args, cwd = root) => execFileSync(command, args, { cwd, stdio: "inherit" });
try {
  // Exercise prepack itself: a clean checkout must produce current, usable exports.
  run("npm", ["pack", "--silent", "--pack-destination", temp]);
  const archive = join(temp, readdirSync(temp).find((name) => name.endsWith(".tgz")));
  const packed = join(temp, "node_modules/cube-motion");
  mkdirSync(packed, { recursive: true });
  run("tar", ["-xzf", archive, "--strip-components=1", "-C", packed]);
  const pkg = JSON.parse(readFileSync(join(packed, "package.json"), "utf8"));
  assert.equal(Object.keys(pkg.dependencies ?? {}).length, 0, "core must have zero runtime dependencies");
  for (const entry of Object.values(pkg.exports)) {
    for (const target of typeof entry === "string" ? [entry] : Object.values(entry)) {
      assert.ok(existsSync(join(packed, target)), `missing packed export: ${target}`);
    }
  }
  assert.match(readFileSync(join(packed, "dist/react.js"), "utf8"), /^['"]use client['"]/);
  assert.ok(!existsSync(join(packed, "remotion")) && !existsSync(join(packed, "public")));
  writeFileSync(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }));
  if (process.argv.includes("--minimum-peers")) {
    run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", "--package-lock=false",
      "react@18.0.0", "@types/react@18", "solid-js@1.8.0", "svelte@4.0.0", "vue@3.4.0"], temp);
    // npm removes the unpacked package as extraneous; restore the exact tested archive.
    mkdirSync(packed, { recursive: true });
    run("tar", ["-xzf", archive, "--strip-components=1", "-C", packed]);
  } else {
    for (const name of [...Object.keys(pkg.peerDependencies), "@types/react"]) {
      const target = join(temp, "node_modules", name);
      mkdirSync(dirname(target), { recursive: true });
      symlinkSync(join(root, "node_modules", name), target, "dir");
    }
  }
  copyFileSync(join(root, "tests/consumer.tsx"), join(temp, "consumer.tsx"));
  // Solid 1.8's own declarations use extensionless imports; validate that peer in
  // the bundler resolution mode used by Solid applications. Current peers also cover NodeNext.
  const resolution = process.argv.includes("--minimum-peers")
    ? ["--module", "ESNext", "--moduleResolution", "Bundler"] : ["--module", "NodeNext"];
  run(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict",
    "--skipLibCheck", "false", ...resolution, "--target", "ES2020", "--jsx", "react-jsx", "consumer.tsx"], temp);
  writeFileSync(join(temp, "imports.mjs"), `
    import assert from "node:assert/strict";
    for (const path of ["cube-motion", "cube-motion/react", "cube-motion/vue", "cube-motion/solid", "cube-motion/svelte"]) {
      const exports = await import(path);
      assert.ok(Object.keys(exports).length, path);
    }
  `);
  run(process.execPath, [join(temp, "imports.mjs")], temp);
  console.log(`Packed exports, SSR-safe imports and consumer types passed${process.argv.includes("--minimum-peers") ? " (minimum peers)" : ""}.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
