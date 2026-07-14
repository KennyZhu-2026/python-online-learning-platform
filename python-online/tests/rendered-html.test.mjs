import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the ECS static application shell", async () => {
  const html = await readFile(new URL("../dist-ecs/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>Python 小芽/);
  assert.match(html, /<div id="root"><\/div>/);
  assert.match(html, /\/python-online\/assets\//);
});

test("ships the Python worker and learning content", async () => {
  const worker = await readFile(new URL("../dist-ecs/python-worker.js", import.meta.url), "utf8");
  assert.match(worker, /loadPyodide/);
  assert.match(worker, /runPythonAsync/);
  assert.match(worker, /setStdin/);
  assert.match(worker, /pyodide\.mjs/);
  assert.doesNotMatch(worker, /importScripts/);

  const studio = await readFile(new URL("../src/PythonStudio.tsx", import.meta.url), "utf8");
  assert.match(studio, /启动 Python 魔法盒/);
  assert.match(studio, /运行代码/);
  assert.match(studio, /new Worker\("\.\/python-worker\.js", \{ type: "module" \}\)/);

  await access(new URL("../dist-ecs/favicon.svg", import.meta.url));
  await access(new URL("../dist-ecs/og.png", import.meta.url));
});
