"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Lesson = {
  id: string;
  number: number;
  title: string;
  emoji: string;
  stage: string;
  goal: string;
  task: string;
  hints: string[];
  starterCode: string;
  inputs?: string;
};

type MonacoEditor = {
  getValue: () => string;
  setValue: (value: string) => void;
  focus: () => void;
  dispose: () => void;
  layout: () => void;
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void };
  addAction: (action: {
    id: string;
    label: string;
    keybindings: number[];
    run: () => void;
  }) => void;
};

declare global {
  interface Window {
    monaco?: {
      editor: {
        create: (element: HTMLElement, options: Record<string, unknown>) => MonacoEditor;
        defineTheme: (name: string, theme: Record<string, unknown>) => void;
      };
      KeyMod: { CtrlCmd: number };
      KeyCode: { Enter: number };
    };
    require?: {
      (modules: string[], callback: () => void): void;
      config: (options: Record<string, unknown>) => void;
    };
  }
}

const lessons: Lesson[] = [
  {
    id: "hello",
    number: 1,
    title: "启动 Python 魔法盒",
    emoji: "👋",
    stage: "认识程序",
    goal: "认识代码从上到下运行，并用 print() 让电脑说话。",
    task: "把欢迎语改成你的昵称，再增加一句自己的学习愿望。",
    hints: ["文字要放在英文引号里", "每个 print() 会输出一行", "# 开头的内容是给人看的注释"],
    starterCode: `# 我的第一个 Python 程序\nprint("朵朵开始学习 Python 啦！")\nprint("今天是我的第一段程序。")`,
  },
  {
    id: "variables",
    number: 2,
    title: "会变化的魔法盒",
    emoji: "📦",
    stage: "变量",
    goal: "把文字和数字装进有名字的“盒子”，再把它们取出来。",
    task: "修改姓名、年龄和爱好，制作一张属于你的信息卡。",
    hints: ["= 表示把右边的值放进左边的变量", "变量名不能以数字开头", "f-string 可以把变量放进文字里"],
    starterCode: `name = "朵朵"\nage = 9\nhobby = "画画"\n\nprint(f"你好，我叫{name}")\nprint(f"我今年{age}岁，喜欢{hobby}")`,
  },
  {
    id: "input",
    number: 3,
    title: "电脑采访员",
    emoji: "🎤",
    stage: "用户输入",
    goal: "使用 input() 接收回答，让程序和人互动。",
    task: "再问一个问题，比如最喜欢的动物，并把答案打印出来。",
    hints: ["右侧“程序输入”每行对应一次 input()", "input() 得到的内容默认是文字", "问题文字也要放在英文引号里"],
    starterCode: `name = input("你叫什么名字？")\nhobby = input("你喜欢做什么？")\n\nprint(f"你好，{name}！")\nprint(f"原来你也喜欢{hobby}呀！")`,
    inputs: "朵朵\n画画",
  },
  {
    id: "condition",
    number: 4,
    title: "智能游乐园检票器",
    emoji: "🎡",
    stage: "条件判断",
    goal: "用 if / else 让程序根据不同情况做决定。",
    task: "把身高改成不同数字运行，观察程序会走哪一条路。",
    hints: ["if 后面要有英文冒号", "下一行要缩进 4 个空格", ">= 表示大于或等于"],
    starterCode: `height = 135\n\nif height >= 120:\n    print("检票成功，祝你玩得开心！")\nelse:\n    print("还差一点点，下次再来挑战吧！")`,
  },
  {
    id: "loop",
    number: 5,
    title: "重复魔法",
    emoji: "🔁",
    stage: "循环",
    goal: "用 for 和 range() 把重复任务交给电脑。",
    task: "让火箭从 5 倒数到 1，然后打印“发射！”",
    hints: ["range(1, 6) 会产生 1 到 5", "循环中的代码需要缩进", "倒数可以试试 range(5, 0, -1)"],
    starterCode: `for number in range(1, 6):\n    print("第", number, "次练习")\n\nprint("我完成啦！")`,
  },
  {
    id: "list",
    number: 6,
    title: "愿望清单",
    emoji: "🌟",
    stage: "列表",
    goal: "用列表把多个数据整齐地放在一起。",
    task: "增加两个愿望，再用循环为每个愿望加上序号。",
    hints: ["列表使用方括号 []", "每一项之间用英文逗号隔开", "append() 可以添加新内容"],
    starterCode: `wishes = ["学会 Python", "做一个小游戏", "认识新朋友"]\n\nfor wish in wishes:\n    print("✨", wish)`,
  },
];

const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";
const CODE_KEY_PREFIX = "python-sprout-code-";
const INPUT_KEY_PREFIX = "python-sprout-input-";
const COMPLETED_KEY = "python-sprout-completed";

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (window.monaco) resolve();
      else existing.addEventListener("load", () => resolve(), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("代码编辑器加载失败"));
    document.head.appendChild(script);
  });
}

function explainError(raw: string) {
  const rules: Array<[string, string]> = [
    ["SyntaxError", "语法有一点小问题，请检查英文括号、引号和冒号。"],
    ["IndentationError", "缩进没有排整齐，请检查代码前面的空格。"],
    ["NameError", "有一个名字还没定义，看看变量名是不是拼错了。"],
    ["TypeError", "数据类型不匹配，可能把文字和数字直接放在一起计算了。"],
    ["ValueError", "收到的数据格式不合适，检查输入内容和类型转换。"],
    ["ZeroDivisionError", "数字不能除以 0，换一个除数再试试。"],
    ["IndexError", "列表里没有这个位置，检查索引是否超出范围。"],
    ["EOFError", "程序还在等输入，请在“程序输入”中每行填写一个答案。"],
  ];
  const matched = rules.find(([name]) => raw.includes(name));
  return matched?.[1] ?? "程序遇到了一个小状况。先看看最后一行提示，再检查对应的代码。";
}

export default function PythonStudio() {
  const editorHostRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<MonacoEditor | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const runRef = useRef<() => void>(() => undefined);
  const initialCodeRef = useRef(lessons[0].starterCode);
  const selectedIdRef = useRef(lessons[0].id);
  const [selectedId, setSelectedId] = useState(lessons[0].id);
  const [code, setCode] = useState(lessons[0].starterCode);
  const [inputText, setInputText] = useState(lessons[0].inputs ?? "");
  const [output, setOutput] = useState("点击“运行代码”，看看会发生什么吧！");
  const [runtimeState, setRuntimeState] = useState<"loading" | "ready" | "running" | "error">("loading");
  const [editorState, setEditorState] = useState<"loading" | "ready" | "fallback">("loading");
  const [completed, setCompleted] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const lesson = useMemo(
    () => lessons.find((item) => item.id === selectedId) ?? lessons[0],
    [selectedId],
  );

  const saveCode = useCallback((value: string, lessonId = selectedIdRef.current) => {
    setCode(value);
    localStorage.setItem(`${CODE_KEY_PREFIX}${lessonId}`, value);
  }, []);

  const createWorker = useCallback(() => {
    workerRef.current?.terminate();
    setRuntimeState("loading");
    const worker = new Worker("./python-worker.js");
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ type: string; text?: string }>) => {
      const message = event.data;
      if (message.type === "ready") {
        setRuntimeState("ready");
      } else if (message.type === "stdout" || message.type === "stderr") {
        setOutput((previous) => previous + (message.text ?? ""));
      } else if (message.type === "done") {
        setRuntimeState("ready");
        setOutput((previous) => previous || "程序运行成功，没有需要显示的内容。试试加入 print() 吧！");
      } else if (message.type === "error") {
        const raw = message.text ?? "Unknown error";
        setRuntimeState("ready");
        setOutput((previous) => `${previous}\n\n🕵️ 程序侦探提示\n${explainError(raw)}\n\n${raw}`.trim());
      } else if (message.type === "load-error") {
        setRuntimeState("error");
        setOutput("Python 魔法盒加载失败了。请检查网络后点击“重新连接”。");
      }
    };
    worker.onerror = () => {
      setRuntimeState("error");
      setOutput("Python 魔法盒暂时没有连接成功，请重新连接后再试。 ");
    };
  }, []);

  const runCode = useCallback(() => {
    if (runtimeState !== "ready" || !workerRef.current) return;
    const currentCode = editorRef.current?.getValue() ?? code;
    saveCode(currentCode);
    setOutput("");
    setRuntimeState("running");
    workerRef.current.postMessage({
      type: "run",
      code: currentCode,
      inputs: inputText.split(/\r?\n/),
    });
  }, [code, inputText, runtimeState, saveCode]);

  useEffect(() => {
    runRef.current = runCode;
  }, [runCode]);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 820px)");
    const sync = () => setIsCompact(query.matches);
    sync();
    query.addEventListener("change", sync);
    const restoreFrame = window.requestAnimationFrame(() => {
      const stored = localStorage.getItem(COMPLETED_KEY);
      if (stored) {
        try {
          setCompleted(JSON.parse(stored));
        } catch {
          localStorage.removeItem(COMPLETED_KEY);
        }
      }
      const savedCode = localStorage.getItem(`${CODE_KEY_PREFIX}${lessons[0].id}`);
      const savedInput = localStorage.getItem(`${INPUT_KEY_PREFIX}${lessons[0].id}`);
      if (savedCode) {
        initialCodeRef.current = savedCode;
        setCode(savedCode);
        editorRef.current?.setValue(savedCode);
      }
      if (savedInput !== null) setInputText(savedInput);
      createWorker();
    });
    return () => {
      window.cancelAnimationFrame(restoreFrame);
      query.removeEventListener("change", sync);
      workerRef.current?.terminate();
    };
  }, [createWorker]);

  useEffect(() => {
    if (isCompact || !editorHostRef.current || editorRef.current) {
      if (isCompact) {
        const frame = window.requestAnimationFrame(() => setEditorState("fallback"));
        return () => window.cancelAnimationFrame(frame);
      }
      return undefined;
    }
    let disposed = false;
    let changeListener: { dispose: () => void } | undefined;
    loadScript(`${MONACO_BASE}/loader.js`)
      .then(() => {
        window.require?.config({ paths: { vs: MONACO_BASE } });
        window.require?.(["vs/editor/editor.main"], () => {
          if (disposed || !window.monaco || !editorHostRef.current) return;
          window.monaco.editor.defineTheme("sprout", {
            base: "vs-dark",
            inherit: true,
            rules: [
              { token: "comment", foreground: "82A78A", fontStyle: "italic" },
              { token: "string", foreground: "F6C978" },
              { token: "keyword", foreground: "93C5FD" },
              { token: "number", foreground: "F5A7C6" },
            ],
            colors: {
              "editor.background": "#18231F",
              "editor.foreground": "#F7F3E8",
              "editorLineNumber.foreground": "#718078",
              "editorLineNumber.activeForeground": "#F6C978",
              "editor.selectionBackground": "#355A4B",
              "editor.lineHighlightBackground": "#20312A",
              "editorCursor.foreground": "#F6C978",
            },
          });
          const editor = window.monaco.editor.create(editorHostRef.current, {
            value: initialCodeRef.current,
            language: "python",
            theme: "sprout",
            fontSize: 16,
            lineHeight: 25,
            fontFamily: "var(--font-geist-mono), SFMono-Regular, Consolas, monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 18, bottom: 18 },
            roundedSelection: true,
            tabSize: 4,
            insertSpaces: true,
            wordWrap: "on",
            quickSuggestions: false,
            suggestOnTriggerCharacters: false,
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: true,
            ariaLabel: "Python 代码编辑器",
          });
          editorRef.current = editor;
          changeListener = editor.onDidChangeModelContent(() => saveCode(editor.getValue()));
          editor.addAction({
            id: "run-python-code",
            label: "运行 Python 代码",
            keybindings: [window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Enter],
            run: () => runRef.current(),
          });
          setEditorState("ready");
        });
      })
      .catch(() => setEditorState("fallback"));
    return () => {
      disposed = true;
      changeListener?.dispose();
      editorRef.current?.dispose();
      editorRef.current = null;
    };
  }, [isCompact, saveCode]);

  const chooseLesson = (nextLesson: Lesson) => {
    const currentValue = editorRef.current?.getValue() ?? code;
    localStorage.setItem(`${CODE_KEY_PREFIX}${selectedIdRef.current}`, currentValue);
    selectedIdRef.current = nextLesson.id;
    setSelectedId(nextLesson.id);
    setShowHints(false);
    const nextCode = localStorage.getItem(`${CODE_KEY_PREFIX}${nextLesson.id}`) ?? nextLesson.starterCode;
    const nextInput = localStorage.getItem(`${INPUT_KEY_PREFIX}${nextLesson.id}`) ?? nextLesson.inputs ?? "";
    setCode(nextCode);
    setInputText(nextInput);
    editorRef.current?.setValue(nextCode);
    editorRef.current?.focus();
    setOutput("新关卡准备好啦，先猜一猜运行结果，再点击“运行代码”！");
  };

  const resetLesson = () => {
    saveCode(lesson.starterCode, lesson.id);
    editorRef.current?.setValue(lesson.starterCode);
    const defaultInput = lesson.inputs ?? "";
    setInputText(defaultInput);
    localStorage.setItem(`${INPUT_KEY_PREFIX}${lesson.id}`, defaultInput);
    setOutput("示例代码已经恢复，可以重新挑战啦！");
  };

  const toggleCompleted = () => {
    const next = completed.includes(lesson.id)
      ? completed.filter((id) => id !== lesson.id)
      : [...completed, lesson.id];
    setCompleted(next);
    localStorage.setItem(COMPLETED_KEY, JSON.stringify(next));
  };

  const stopCode = () => {
    workerRef.current?.terminate();
    setOutput((previous) => `${previous}\n\n⏹ 程序已经停止。可以检查循环条件后再试一次。`.trim());
    createWorker();
  };

  const statusText =
    runtimeState === "ready"
      ? "Python 已就绪"
      : runtimeState === "running"
        ? "正在运行"
        : runtimeState === "error"
          ? "连接失败"
          : "正在唤醒 Python";

  return (
    <main className="studio-shell">
      <header className="topbar">
        <div className="brand-block">
          <span className="brand-mark" aria-hidden="true">Py</span>
          <div>
            <p className="eyebrow">打开浏览器 · 开始创造</p>
            <h1>Python 小芽</h1>
          </div>
        </div>
        <div className="topbar-actions">
          <div className={`runtime-badge is-${runtimeState}`} role="status">
            <span className="status-dot" />
            {statusText}
          </div>
          <div className="progress-copy">
            <strong>{completed.length}</strong> / {lessons.length} 关
          </div>
        </div>
      </header>

      <section className="workspace">
        <aside className="lesson-rail" aria-label="课程关卡">
          <div className="rail-heading">
            <span>学习地图</span>
            <span className="rail-count">{lessons.length} 关</span>
          </div>
          <div className="lesson-list">
            {lessons.map((item) => {
              const active = item.id === lesson.id;
              const done = completed.includes(item.id);
              return (
                <button
                  className={`lesson-item ${active ? "is-active" : ""}`}
                  key={item.id}
                  onClick={() => chooseLesson(item)}
                  aria-current={active ? "step" : undefined}
                >
                  <span className="lesson-number">{done ? "✓" : item.number}</span>
                  <span className="lesson-copy">
                    <small>{item.stage}</small>
                    <strong>{item.title}</strong>
                  </span>
                  <span className="lesson-emoji" aria-hidden="true">{item.emoji}</span>
                </button>
              );
            })}
          </div>
          <div className="rail-note">
            <span aria-hidden="true">🌱</span>
            <p><strong>慢慢来，比较快。</strong><br />每次只学一个新魔法。</p>
          </div>
        </aside>

        <section className="coding-zone">
          <div className="lesson-banner">
            <div>
              <p className="eyebrow">第 {lesson.number} 关 · {lesson.stage}</p>
              <h2>{lesson.emoji} {lesson.title}</h2>
              <p>{lesson.goal}</p>
            </div>
            <button className="ghost-button" onClick={resetLesson}>恢复示例</button>
          </div>

          <div className="editor-card">
            <div className="panel-toolbar">
              <div className="file-tab"><span className="python-icon">Py</span> main.py</div>
              <span className="shortcut-hint">⌘ / Ctrl + Enter 运行</span>
            </div>
            {editorState !== "fallback" && <div className="monaco-host" ref={editorHostRef} />}
            {editorState === "loading" && <div className="editor-loading">正在准备代码编辑器…</div>}
            {editorState === "fallback" && (
              <textarea
                className="code-fallback"
                value={code}
                onChange={(event) => saveCode(event.target.value)}
                spellCheck={false}
                aria-label="Python 代码编辑器"
              />
            )}
            <div className="run-bar">
              <span className="autosave-note">● 草稿已自动保存在这台设备</span>
              {runtimeState === "running" ? (
                <button className="stop-button" onClick={stopCode}>■ 停止程序</button>
              ) : runtimeState === "error" ? (
                <button className="run-button" onClick={createWorker}>↻ 重新连接</button>
              ) : (
                <button className="run-button" onClick={runCode} disabled={runtimeState !== "ready"}>
                  <span aria-hidden="true">▶</span> 运行代码
                </button>
              )}
            </div>
          </div>

          <div className="console-card">
            <div className="panel-toolbar console-toolbar">
              <div className="console-title"><span className="console-light" /> 运行结果</div>
              <button onClick={() => setOutput("")} className="text-button">清空</button>
            </div>
            <pre className="console-output" aria-live="polite">{output || "等待程序输出…"}</pre>
          </div>
        </section>

        <aside className="mission-panel">
          <div className="mission-card">
            <p className="eyebrow">本关任务</p>
            <h3>先模仿，再创造</h3>
            <p className="mission-text">{lesson.task}</p>
            <div className="three-steps">
              <span><b>1</b>先猜结果</span>
              <span><b>2</b>运行验证</span>
              <span><b>3</b>改出新作品</span>
            </div>
          </div>

          {code.includes("input(") && (
            <div className="input-card">
              <label htmlFor="program-input">程序输入</label>
              <p>每行填写一个回答，按顺序交给 input()。</p>
              <textarea
                id="program-input"
                value={inputText}
                onChange={(event) => {
                  setInputText(event.target.value);
                  localStorage.setItem(`${INPUT_KEY_PREFIX}${lesson.id}`, event.target.value);
                }}
                placeholder={"第一个回答\n第二个回答"}
                rows={4}
              />
            </div>
          )}

          <div className="hint-card">
            <button className="hint-toggle" onClick={() => setShowHints(!showHints)} aria-expanded={showHints}>
              <span>💡 遇到困难？</span>
              <span>{showHints ? "收起" : "看提示"}</span>
            </button>
            {showHints && (
              <ul>
                {lesson.hints.map((hint) => <li key={hint}>{hint}</li>)}
              </ul>
            )}
          </div>

          <button className={`complete-button ${completed.includes(lesson.id) ? "is-done" : ""}`} onClick={toggleCompleted}>
            {completed.includes(lesson.id) ? "✓ 已完成这一关" : "我完成这一关了"}
          </button>
          <p className="privacy-note">🔒 代码在你的浏览器里运行，不会上传。</p>
        </aside>
      </section>
    </main>
  );
}
