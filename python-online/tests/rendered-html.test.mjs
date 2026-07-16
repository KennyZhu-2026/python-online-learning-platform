import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the ECS static application shell", async () => {
  const html = await readFile(new URL("../dist-ecs/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>Python之旅 \| 零基础入门<\/title>/);
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
  assert.match(studio, /代码练习/);
  assert.match(studio, /lesson1-review-1fps\.mp4/);
  assert.match(studio, /从空白开始挑战/);
  assert.match(studio, /registerCompletionItemProvider\("python"/);
  assert.match(studio, /CompletionItemInsertTextRule\.InsertAsSnippet/);
  assert.match(studio, /for \$\{1:i\} in range/);
  assert.doesNotMatch(studio, /输入 p \/ i \/ f \/ w 查看语法提示/);
  assert.match(studio, /会说话的欢迎卡/);
  assert.match(studio, /火箭发射倒计时/);
  assert.match(studio, /mission-hint-button/);
  assert.match(studio, /完成任务/);
  assert.match(studio, /print\(\)  输出一个数字/);
  assert.ok(studio.indexOf('label: "print()  输出一个数字"') < studio.indexOf("label: 'print(\"\")  输出一句话'"));
  assert.ok(studio.indexOf("label: 'print(\"\")  输出一句话'") < studio.indexOf('label: "print(变量)  输出变量"'));
  assert.match(studio, /if \/ elif \/ else/);
  assert.match(studio, /for i in range\(\)/);
  assert.match(studio, /for item in \[ \]/);
  assert.match(studio, /for item in 变量/);
  assert.match(studio, /while  条件循环/);
  assert.doesNotMatch(studio, /keyword: "list"/);
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
