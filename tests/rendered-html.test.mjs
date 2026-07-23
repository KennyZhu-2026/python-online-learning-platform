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
  const lesson01 = await readFile(new URL("../src/content/lessons/lesson-01.ts", import.meta.url), "utf8");
  const lesson02 = await readFile(new URL("../src/content/lessons/lesson-02.ts", import.meta.url), "utf8");
  const courseOutline = await readFile(new URL("../src/content/lessons/course-outline.ts", import.meta.url), "utf8");
  const lessonContent = `${lesson01}\n${lesson02}\n${courseOutline}`;
  const lessonIndex = await readFile(new URL("../src/content/lessons/index.ts", import.meta.url), "utf8");

  assert.match(studio, /from "\.\/content\/lessons"/);
  assert.doesNotMatch(studio, /const lessons:/);
  assert.match(lessonIndex, /import \{ lesson01 \} from "\.\/lesson-01"/);
  assert.match(lessonIndex, /import \{ lesson02 \} from "\.\/lesson-02"/);
  assert.match(lessonIndex, /import \{ plannedLessons \} from "\.\/course-outline"/);
  assert.match(lessonIndex, /\[lesson01, lesson02, \.\.\.plannedLessons\]/);
  assert.equal((courseOutline.match(/number: \d+/g) ?? []).length, 19);

  const courseTitles = [
    "让电脑说话的魔法",
    "数字和文字，谁要穿“外套”？",
    "装礼物的魔法小盒子",
    "给盒子贴标签，换新礼物",
    "超级计算器，一秒出答案",
    "文字积木，拼出新花样",
    "电脑问，我来答",
    "文字和数字的变身魔法",
    "谁大谁小？电脑来判！",
    "岔路口，二选一",
    "两个都要，还是一个就行？",
    "多条岔路，选一条走",
    "让电脑当复读机",
    "玩具排队上火车",
    "从 0 号车厢开始找",
    "玩具轮流登场表演",
    "车尾添一节，再拆一节",
    "只要有力气，就继续走",
    "听到“停”，立刻刹车！",
    "写菜谱，按订单做菜",
    "菜做好了，端出来",
  ];
  for (const title of courseTitles) assert.match(lessonContent, new RegExp(title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.match(studio, /哆啦编程/);
  assert.match(studio, /学习编程 · 开始创造/);
  assert.match(studio, /className="brand-copy"/);
  assert.match(styles, /\.brand-block h1 \{[\s\S]*?text-align-last: justify;/);
  assert.match(studio, /知识讲解/);
  assert.match(studio, /代码练习/);
  assert.doesNotMatch(studio, /当前课程/);
  assert.doesNotMatch(studio, /completed\.length\}<\/strong> \/ \{lessons\.length\} 课/);
  assert.match(studio, /lesson\.videoSrc/);
  assert.match(lesson01, /videos\/lesson-01\.mp4/);
  assert.match(lesson02, /videos\/lesson-02\.mp4/);
  assert.match(studio, /item\.knowledgePoints/);
  assert.match(studio, /教学视频正在准备中/);
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
  assert.match(lessonContent, /让电脑说话的魔法/);
  assert.doesNotMatch(lessonContent, /会说话的自我介绍卡/);
  assert.match(lessonContent, /taskTitle: "自我介绍卡"/);
  assert.match(lessonContent, /在电脑上按顺序输出你的名字、年龄和爱好/);
  assert.match(lessonContent, /把第1行的“哆啦”改成你的名字或昵称/);
  assert.match(lessonContent, /把第2行的年龄改成你的年龄或年级/);
  assert.match(lessonContent, /print\("我是哆啦"\)/);
  assert.match(lessonContent, /print\("我今年9岁啦"\)/);
  assert.doesNotMatch(lesson01, /# 我的第一段代码/);
  assert.match(lessonContent, /数字和文字，谁要穿“外套”？/);
  assert.match(lesson02, /knowledgePoints: "数据类型"/);
  assert.match(lessonContent, /我的数字身份卡/);
  assert.match(lessonContent, /print\("哆啦"\)/);
  assert.match(lessonContent, /print\("我今年", 9, "岁啦"\)/);
  assert.match(courseOutline, /knowledgePoints: "函数返回"/);
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
  await access(new URL("../dist-ecs/videos/lesson-01.mp4", import.meta.url));
  await access(new URL("../dist-ecs/videos/lesson-02.mp4", import.meta.url));
});
