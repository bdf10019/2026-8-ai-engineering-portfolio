import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const readText = (path) => readFile(join(root, path), "utf8");

test("PWA 清单使用正确品牌、独立显示与可用图标", async () => {
  const manifest = JSON.parse(await readText("manifest.webmanifest"));
  assert.equal(manifest.name, "2026_8月合輯");
  assert.equal(manifest.display, "standalone");
  assert.equal(manifest.start_url, "./");
  assert.equal(manifest.icons.length, 2);
  await Promise.all(manifest.icons.map((icon) => access(join(root, icon.src.replace(/^\.\//, "")))));
  assert.deepEqual(manifest.shortcuts.map((shortcut) => shortcut.url), ["./#overview", "./#incident", "./#evidence"]);
});

test("离线核心壳层列出的每个档案都真实存在", async () => {
  const serviceWorker = await readText("sw.js");
  const assets = [...serviceWorker.matchAll(/"\.\/([^"#]*)"/g)].map((match) => match[1]).filter(Boolean);
  assert.ok(assets.length >= 8);
  await Promise.all(assets.map((asset) => access(join(root, asset))));
  const html = await readText("index.html");
  assert.match(html, /rel="manifest" href="\.\/manifest\.webmanifest"/);
});

test("HTML 身份不重复且应用直接引用的元素全部存在", async () => {
  const html = await readText("index.html");
  const app = await readText("app.js");
  const ids = [...html.matchAll(/id="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length);
  const directRefs = [...app.matchAll(/\$\("#([^"]+)"\)/g)].map((match) => match[1]);
  const missing = [...new Set(directRefs)].filter((id) => !ids.includes(id));
  assert.deepEqual(missing, []);
});

test("静态发布证据中的六个 SHA-256 与目前核心档案一致", async () => {
  const evidence = JSON.parse(await readText("docs/RELEASE-EVIDENCE.json"));
  assert.equal(evidence.artifacts.length, 6);
  for (const artifact of evidence.artifacts) {
    const digest = createHash("sha256").update(await readFile(join(root, artifact.path))).digest("hex");
    assert.equal(digest, artifact.sha256, artifact.path);
  }
});
