import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("https://python.example/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server renders the Python learning platform", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>Python 小芽/);
  assert.match(html, /Python 小芽/);
  assert.match(html, /启动 Python 魔法盒/);
  assert.match(html, /运行代码/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/);
});

test("ships the browser Python worker and social card", async () => {
  const worker = await readFile(new URL("../public/python-worker.js", import.meta.url), "utf8");
  assert.match(worker, /loadPyodide/);
  assert.match(worker, /runPythonAsync/);
  assert.match(worker, /setStdin/);
  assert.match(worker, /pyodide\.mjs/);
  assert.doesNotMatch(worker, /importScripts/);
  const studio = await readFile(new URL("../app/PythonStudio.tsx", import.meta.url), "utf8");
  assert.match(studio, /new Worker\("\.\/python-worker\.js", \{ type: "module" \}\)/);
  await access(new URL("../public/og.png", import.meta.url));
});
