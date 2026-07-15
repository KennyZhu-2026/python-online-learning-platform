import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the ECS static application shell", async () => {
  const html = await readFile(new URL("../dist-ecs/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>Python 之旅/);
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
  assert.match(studio, /Python 之旅/);
  assert.match(studio, /学习编程 · 开始创造/);
  assert.match(studio, /知识讲解/);
  assert.match(studio, /实操练习/);
  assert.match(studio, /语法测评/);
  assert.match(studio, /作业通关/);
  assert.match(studio, /一课一闭环/);
  assert.match(studio, /lesson1-review-1fps\.mp4/);
  assert.match(studio, /从空白开始挑战/);
  assert.match(studio, /环境初始化成功/);
  assert.match(studio, /environment-overlay/);
  assert.doesNotMatch(studio, /Python 已就绪/);
  assert.match(studio, /运行代码/);
  assert.match(studio, /new Worker\("\.\/python-worker\.js", \{ type: "module" \}\)/);
  assert.match(worker, /type: "progress"/);

  await access(new URL("../dist-ecs/favicon.svg", import.meta.url));
  await access(new URL("../dist-ecs/og.png", import.meta.url));
  await access(new URL("../dist-ecs/videos/lesson1-review-1fps.mp4", import.meta.url));
});
