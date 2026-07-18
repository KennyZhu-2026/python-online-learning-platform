import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("builds the ECS static application shell", async () => {
  const html = await readFile(new URL("../dist-ecs/index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>哆啦编程 \| 零基础入门<\/title>/);
  assert.match(html, /content="哆啦编程为孩子设计的在线 Python 学习空间/);
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
  const styles = await readFile(new URL("../src/globals.css", import.meta.url), "utf8");
  const lessonFiles = await Promise.all(
    Array.from({ length: 6 }, (_, index) =>
      readFile(
        new URL(`../src/content/lessons/lesson-${String(index + 1).padStart(2, "0")}.ts`, import.meta.url),
        "utf8",
      ),
    ),
  );
  const lessonContent = lessonFiles.join("\n");
  const lessonIndex = await readFile(new URL("../src/content/lessons/index.ts", import.meta.url), "utf8");

  assert.match(studio, /from "\.\/content\/lessons"/);
  assert.doesNotMatch(studio, /const lessons:/);
  for (let lessonNumber = 1; lessonNumber <= 6; lessonNumber += 1) {
    const paddedNumber = String(lessonNumber).padStart(2, "0");
    assert.match(lessonIndex, new RegExp(`import \\{ lesson${paddedNumber} \\} from "\\./lesson-${paddedNumber}"`));
  }
  assert.match(studio, /哆啦编程/);
  assert.match(studio, /学习编程 · 开始创造/);
  assert.match(studio, /className="brand-copy"/);
  assert.match(styles, /\.brand-block h1 \{[\s\S]*?text-align-last: justify;/);
  assert.match(studio, /知识讲解/);
  assert.match(studio, /代码练习/);
  assert.match(studio, /当前课程/);
  assert.doesNotMatch(studio, /completed\.length\}<\/strong> \/ \{lessons\.length\} 课/);
  assert.match(studio, /lesson1-review-1fps\.mp4/);
  assert.doesNotMatch(studio, /先看懂，再动手/);
  assert.doesNotMatch(studio, /第一课教学样片/);
  assert.doesNotMatch(studio, /<figcaption>/);
  assert.match(studio, /视频播放进度/);
  assert.match(studio, /全屏播放/);
  assert.match(studio, /isPlaying \? "is-playing"/);
  assert.doesNotMatch(studio, /<video\s+controls/);
  assert.match(studio, /从空白开始挑战/);
  assert.match(studio, /registerCompletionItemProvider\("python"/);
  assert.match(studio, /CompletionItemInsertTextRule\.InsertAsSnippet/);
  assert.match(studio, /for \$\{1:i\} in range/);
  assert.doesNotMatch(studio, /输入 p \/ i \/ f \/ w 查看语法提示/);
  assert.match(lessonContent, /让电脑开口说话/);
  assert.match(lessonContent, /会说话的自我介绍卡/);
  assert.match(lessonContent, /谁该穿引号？/);
  assert.match(lessonContent, /我的数字身份卡/);
  assert.match(lessonContent, /print\("我今年", 9, "岁啦"\)/);
  assert.match(lessonContent, /火箭发射倒计时/);
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
  assert.match(studio, /const \[showInitOverlay, setShowInitOverlay\] = useState\(false\)/);
  assert.match(studio, /runtimeState === "loading"/);
  assert.match(studio, /setShowInitOverlay\(true\)/);
  assert.doesNotMatch(studio, /disabled=\{runtimeState !== "ready"\}/);
  assert.doesNotMatch(studio, /Python 已就绪/);
  assert.match(studio, /运行代码/);
  assert.match(studio, /new Worker\("\.\/python-worker\.js", \{ type: "module" \}\)/);
  assert.match(worker, /type: "progress"/);

  await access(new URL("../dist-ecs/favicon.svg", import.meta.url));
  await access(new URL("../dist-ecs/og.png", import.meta.url));
  await access(new URL("../dist-ecs/videos/lesson1-review-1fps.mp4", import.meta.url));
});
