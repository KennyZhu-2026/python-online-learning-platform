import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Lesson = {
  id: string;
  number: number;
  title: string;
  emoji: string;
  stage: string;
  goal: string;
  task: string;
  homework: string;
  hints: string[];
  starterCode: string;
  inputs?: string;
};

type LearningTab = "knowledge" | "practice" | "quiz" | "assignment";

type QuizQuestion = {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
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
    homework: "从空白文件开始，写一个不少于 3 行的自我介绍程序。请至少使用 2 次 print()，让电脑说出你的名字、爱好和一个学习愿望。",
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
    homework: "创建 name、age 和 hobby 三个变量，再用它们输出一张属于你的个人信息卡。",
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
    homework: "设计一个小采访程序：至少提出 3 个问题，并在最后把收到的答案组合成一段欢迎语。",
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
    homework: "编写一个年龄判断器：根据输入的年龄，分别输出儿童、少年或成年人的提示。",
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
    homework: "使用循环完成 10 到 1 的倒计时，并在最后输出“挑战成功！”。",
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
    homework: "创建一个至少包含 5 项内容的愿望清单，用循环逐项输出，并为每项加上星星符号。",
    hints: ["列表使用方括号 []", "每一项之间用英文逗号隔开", "append() 可以添加新内容"],
    starterCode: `wishes = ["学会 Python", "做一个小游戏", "认识新朋友"]\n\nfor wish in wishes:\n    print("✨", wish)`,
  },
];

const learningTabs: Array<{ id: LearningTab; label: string; icon: string }> = [
  { id: "knowledge", label: "知识讲解", icon: "学" },
  { id: "practice", label: "实操练习", icon: "练" },
  { id: "quiz", label: "语法测评", icon: "测" },
  { id: "assignment", label: "作业通关", icon: "评" },
];

const quizQuestions: QuizQuestion[] = [
  {
    id: "value-type",
    question: "下面哪个选项是 Python 中常见的变量类型？",
    options: ["字符串 str", "文件夹 folder", "画笔 brush", "网页 page"],
    answer: 0,
    explanation: "str 表示字符串，用来保存姓名、句子等文字内容。",
  },
  {
    id: "print",
    question: "想让电脑在屏幕上显示一句话，应该使用哪个命令？",
    options: ["show()", "say()", "print()", "writeword()"],
    answer: 2,
    explanation: "print() 是 Python 中最常用的输出命令。",
  },
  {
    id: "variable-name",
    question: "下面哪个变量名写法是正确的？",
    options: ["1name", "my-name", "my_name", "我的 name"],
    answer: 2,
    explanation: "变量名可以使用字母、数字和下划线，但不能以数字开头。",
  },
];

const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";
const CODE_KEY_PREFIX = "python-sprout-code-";
const INPUT_KEY_PREFIX = "python-sprout-input-";
const ASSIGNMENT_KEY_PREFIX = "python-sprout-assignment-";
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
  const activeTabRef = useRef<LearningTab>("knowledge");
  const overlayTimerRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);
  const [selectedId, setSelectedId] = useState(lessons[0].id);
  const [activeTab, setActiveTab] = useState<LearningTab>("knowledge");
  const [code, setCode] = useState(lessons[0].starterCode);
  const [assignmentCode, setAssignmentCode] = useState("");
  const [inputText, setInputText] = useState(lessons[0].inputs ?? "");
  const [output, setOutput] = useState("点击“运行代码”，看看会发生什么吧！");
  const [runtimeState, setRuntimeState] = useState<"loading" | "ready" | "running" | "error">("loading");
  const [loadProgress, setLoadProgress] = useState(0);
  const [showInitOverlay, setShowInitOverlay] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [editorState, setEditorState] = useState<"loading" | "ready" | "fallback">("loading");
  const [completed, setCompleted] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [isCompact, setIsCompact] = useState(false);

  const lesson = useMemo(
    () => lessons.find((item) => item.id === selectedId) ?? lessons[0],
    [selectedId],
  );

  const saveEditorValue = useCallback((
    value: string,
    mode = activeTabRef.current,
    lessonId = selectedIdRef.current,
  ) => {
    if (mode === "assignment") {
      setAssignmentCode(value);
      localStorage.setItem(`${ASSIGNMENT_KEY_PREFIX}${lessonId}`, value);
      return;
    }
    setCode(value);
    localStorage.setItem(`${CODE_KEY_PREFIX}${lessonId}`, value);
  }, []);

  const createWorker = useCallback(() => {
    workerRef.current?.terminate();
    if (overlayTimerRef.current !== null) window.clearTimeout(overlayTimerRef.current);
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    setRuntimeState("loading");
    setLoadProgress(0);
    setShowInitOverlay(true);
    setShowSuccessToast(false);
    const worker = new Worker("./python-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ type: string; text?: string; value?: number }>) => {
      const message = event.data;
      if (message.type === "ready") {
        setLoadProgress(100);
        setRuntimeState("ready");
        setShowSuccessToast(true);
        overlayTimerRef.current = window.setTimeout(() => setShowInitOverlay(false), 700);
        toastTimerRef.current = window.setTimeout(() => setShowSuccessToast(false), 3200);
      } else if (message.type === "progress") {
        setLoadProgress((previous) => Math.max(previous, message.value ?? previous));
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
        setShowInitOverlay(false);
        console.error("Python environment failed to load:", message.text);
        setOutput("Python 魔法盒加载失败了。请检查网络后点击“重新加载 Python 环境”。");
      }
    };
    worker.onerror = (event) => {
      console.error("Python worker error:", event.message);
      setRuntimeState("error");
      setShowInitOverlay(false);
      setOutput("Python 魔法盒暂时没有加载成功，请点击“重新加载 Python 环境”再试。 ");
    };
  }, []);

  const runCode = useCallback(() => {
    if (runtimeState !== "ready" || !workerRef.current) return;
    const currentCode = editorRef.current?.getValue() ?? (activeTab === "assignment" ? assignmentCode : code);
    saveEditorValue(currentCode, activeTab);
    setOutput("");
    setRuntimeState("running");
    workerRef.current.postMessage({
      type: "run",
      code: currentCode,
      inputs: inputText.split(/\r?\n/),
    });
  }, [activeTab, assignmentCode, code, inputText, runtimeState, saveEditorValue]);

  useEffect(() => {
    runRef.current = runCode;
  }, [runCode]);

  useEffect(() => {
    if (runtimeState !== "loading") return undefined;
    const progressTimer = window.setInterval(() => {
      setLoadProgress((previous) => {
        if (previous >= 88) return previous;
        if (previous < 36) return Math.min(36, previous + 3);
        if (previous < 70) return previous + 2;
        return previous + 1;
      });
    }, 420);
    return () => window.clearInterval(progressTimer);
  }, [runtimeState]);

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
      const savedAssignment = localStorage.getItem(`${ASSIGNMENT_KEY_PREFIX}${lessons[0].id}`);
      const savedInput = localStorage.getItem(`${INPUT_KEY_PREFIX}${lessons[0].id}`);
      if (savedCode) {
        initialCodeRef.current = savedCode;
        setCode(savedCode);
        editorRef.current?.setValue(savedCode);
      }
      if (savedAssignment !== null) setAssignmentCode(savedAssignment);
      if (savedInput !== null) setInputText(savedInput);
      createWorker();
    });
    return () => {
      window.cancelAnimationFrame(restoreFrame);
      query.removeEventListener("change", sync);
      workerRef.current?.terminate();
      if (overlayTimerRef.current !== null) window.clearTimeout(overlayTimerRef.current);
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current);
    };
  }, [createWorker]);

  useEffect(() => {
    if (activeTab !== "practice" && activeTab !== "assignment") return undefined;
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
          changeListener = editor.onDidChangeModelContent(() => saveEditorValue(editor.getValue()));
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
  }, [activeTab, isCompact, saveEditorValue]);

  const chooseLesson = (nextLesson: Lesson) => {
    if (activeTabRef.current === "practice" || activeTabRef.current === "assignment") {
      const currentValue = editorRef.current?.getValue()
        ?? (activeTabRef.current === "assignment" ? assignmentCode : code);
      saveEditorValue(currentValue, activeTabRef.current, selectedIdRef.current);
    }
    selectedIdRef.current = nextLesson.id;
    setSelectedId(nextLesson.id);
    setShowHints(false);
    setQuizAnswers({});
    const nextCode = localStorage.getItem(`${CODE_KEY_PREFIX}${nextLesson.id}`) ?? nextLesson.starterCode;
    const nextAssignment = localStorage.getItem(`${ASSIGNMENT_KEY_PREFIX}${nextLesson.id}`) ?? "";
    const nextInput = localStorage.getItem(`${INPUT_KEY_PREFIX}${nextLesson.id}`) ?? nextLesson.inputs ?? "";
    setCode(nextCode);
    setAssignmentCode(nextAssignment);
    setInputText(nextInput);
    const nextEditorValue = activeTabRef.current === "assignment" ? nextAssignment : nextCode;
    initialCodeRef.current = nextEditorValue;
    editorRef.current?.setValue(nextEditorValue);
    editorRef.current?.focus();
    setOutput("新一课准备好啦，先猜一猜运行结果，再点击“运行代码”！");
  };

  const switchTab = (nextTab: LearningTab) => {
    if (nextTab === activeTabRef.current) return;
    if (activeTabRef.current === "practice" || activeTabRef.current === "assignment") {
      const currentValue = editorRef.current?.getValue()
        ?? (activeTabRef.current === "assignment" ? assignmentCode : code);
      saveEditorValue(currentValue, activeTabRef.current, lesson.id);
    }
    activeTabRef.current = nextTab;
    setActiveTab(nextTab);
    setShowHints(false);
    if (nextTab === "practice" || nextTab === "assignment") {
      const nextValue = nextTab === "assignment"
        ? localStorage.getItem(`${ASSIGNMENT_KEY_PREFIX}${lesson.id}`) ?? assignmentCode
        : localStorage.getItem(`${CODE_KEY_PREFIX}${lesson.id}`) ?? code;
      initialCodeRef.current = nextValue;
      setEditorState(isCompact ? "fallback" : "loading");
      window.requestAnimationFrame(() => editorRef.current?.setValue(nextValue));
    }
  };

  const resetLesson = () => {
    saveEditorValue(lesson.starterCode, "practice", lesson.id);
    editorRef.current?.setValue(lesson.starterCode);
    const defaultInput = lesson.inputs ?? "";
    setInputText(defaultInput);
    localStorage.setItem(`${INPUT_KEY_PREFIX}${lesson.id}`, defaultInput);
    setOutput("示例代码已经恢复，可以重新挑战啦！");
  };

  const clearAssignment = () => {
    saveEditorValue("", "assignment", lesson.id);
    editorRef.current?.setValue("");
    editorRef.current?.focus();
    setOutput("作业代码已清空。读一遍任务要求，然后从第一行开始吧！");
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

  return (
    <>
    <main className="studio-shell">
      <header className="topbar">
        <div className="topbar-main">
          <div className="brand-block">
            <span className="brand-mark" aria-hidden="true">Py</span>
            <div>
              <p className="eyebrow">学习编程 · 开始创造</p>
              <h1>Python 之旅</h1>
            </div>
          </div>
          <div className="current-lesson-title">
            <p>第 {lesson.number} 课 · {lesson.stage} <span>一课一闭环</span></p>
            <strong><span aria-hidden="true">{lesson.emoji}</span> {lesson.title}</strong>
          </div>
          <div className="topbar-actions">
            {(runtimeState === "loading" || runtimeState === "error") && (
              <div className={`runtime-badge is-${runtimeState}`} role="status">
                <span className="status-dot" />
                {runtimeState === "loading" ? "环境准备中" : "环境初始化失败"}
              </div>
            )}
            <div className="progress-copy">
              <strong>{completed.length}</strong> / {lessons.length} 课
            </div>
          </div>
        </div>
        <nav className="learning-tabs" aria-label="本课学习阶段" role="tablist">
          {learningTabs.map((tab) => (
            <button
              key={tab.id}
              className={activeTab === tab.id ? "is-active" : ""}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => switchTab(tab.id)}
            >
              <span aria-hidden="true">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <section className="workspace">
        <aside className="lesson-rail" aria-label="课程列表">
          <div className="rail-heading">
            <span>学习地图</span>
            <span className="rail-count">{lessons.length} 课</span>
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

        <section className="main-stage">
          {activeTab === "knowledge" && (
            <section className="knowledge-stage" role="tabpanel" aria-label="知识讲解">
              <div className="stage-heading">
                <div>
                  <p className="eyebrow">知识讲解</p>
                  <h2>先看懂，再动手</h2>
                  <p>{lesson.goal}</p>
                </div>
                <span className="stage-badge">约 3 分钟</span>
              </div>
              <figure className="video-card">
                <video
                  controls
                  preload="metadata"
                  src={`${import.meta.env.BASE_URL}videos/lesson1-review-1fps.mp4`}
                  aria-label={`${lesson.title} 教学视频`}
                >
                  你的浏览器暂不支持视频播放。
                </video>
                <figcaption>
                  <span>第一课教学样片</span>
                  {lesson.number === 1 ? "跟着视频认识第一行 Python 代码。" : "本课视频正在制作，当前暂用第一课样片展示播放效果。"}
                </figcaption>
              </figure>
            </section>
          )}

          {activeTab === "quiz" && (
            <section className="quiz-stage" role="tabpanel" aria-label="语法测评">
              <div className="stage-heading">
                <div>
                  <p className="eyebrow">语法测评</p>
                  <h2>小小知识挑战</h2>
                  <p>选择你认为正确的答案，答完马上看到讲解。</p>
                </div>
                <span className="quiz-score">
                  {Object.keys(quizAnswers).length} / {quizQuestions.length} 已作答
                </span>
              </div>
              <div className="quiz-list">
                {quizQuestions.map((question, questionIndex) => {
                  const chosen = quizAnswers[question.id];
                  return (
                    <fieldset className="quiz-card" key={question.id}>
                      <legend><span>{questionIndex + 1}</span>{question.question}</legend>
                      <div className="quiz-options">
                        {question.options.map((option, optionIndex) => (
                          <label
                            className={`${chosen === optionIndex ? "is-selected" : ""} ${chosen !== undefined && optionIndex === question.answer ? "is-correct" : ""}`}
                            key={option}
                          >
                            <input
                              type="radio"
                              name={`quiz-${lesson.id}-${question.id}`}
                              checked={chosen === optionIndex}
                              onChange={() => setQuizAnswers((previous) => ({ ...previous, [question.id]: optionIndex }))}
                            />
                            <span>{String.fromCharCode(65 + optionIndex)}</span>
                            {option}
                          </label>
                        ))}
                      </div>
                      {chosen !== undefined && (
                        <p className={`quiz-feedback ${chosen === question.answer ? "is-correct" : "is-wrong"}`}>
                          {chosen === question.answer ? "答对啦！" : "再记一遍："} {question.explanation}
                        </p>
                      )}
                    </fieldset>
                  );
                })}
              </div>
            </section>
          )}

          {(activeTab === "practice" || activeTab === "assignment") && (
            <section className="coding-stage" role="tabpanel" aria-label={activeTab === "practice" ? "实操练习" : "作业通关"}>
              <div className="coding-primary">
                <div className="editor-card">
                  <div className="panel-toolbar">
                    <div className="file-tab"><span className="python-icon">Py</span> main.py</div>
                    <div className="toolbar-actions">
                      <span className="shortcut-hint">⌘ / Ctrl + Enter 运行</span>
                      <button className="dark-text-button" onClick={activeTab === "practice" ? resetLesson : clearAssignment}>
                        {activeTab === "practice" ? "恢复示例" : "清空代码"}
                      </button>
                    </div>
                  </div>
                  {editorState !== "fallback" && <div className="monaco-host" ref={editorHostRef} />}
                  {editorState === "loading" && <div className="editor-loading">正在准备代码编辑器…</div>}
                  {editorState === "fallback" && (
                    <textarea
                      className="code-fallback"
                      value={activeTab === "assignment" ? assignmentCode : code}
                      onChange={(event) => saveEditorValue(event.target.value, activeTab)}
                      spellCheck={false}
                      aria-label="Python 代码编辑器"
                      placeholder={activeTab === "assignment" ? "# 从这里开始写作业代码…" : undefined}
                    />
                  )}
                  <div className="run-bar">
                    <span className="autosave-note">● 草稿已自动保存在这台设备</span>
                    {runtimeState === "running" ? (
                      <button className="stop-button" onClick={stopCode}>■ 停止程序</button>
                    ) : runtimeState === "error" ? (
                      <button className="run-button" onClick={createWorker}>↻ 重新加载 Python 环境</button>
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
              </div>

              <aside className="mission-panel">
                <div className={`mission-card ${activeTab === "assignment" ? "is-assignment" : ""}`}>
                  <p className="eyebrow">{activeTab === "practice" ? "本课任务" : "通关作业"}</p>
                  <h3>{activeTab === "practice" ? "先模仿，再创造" : "从空白开始挑战"}</h3>
                  <p className="mission-text">{activeTab === "practice" ? lesson.task : lesson.homework}</p>
                  <div className="three-steps">
                    {activeTab === "practice" ? (
                      <>
                        <span><b>1</b>先猜结果</span>
                        <span><b>2</b>运行验证</span>
                        <span><b>3</b>改出新作品</span>
                      </>
                    ) : (
                      <>
                        <span><b>1</b>读懂要求</span>
                        <span><b>2</b>独立编写</span>
                        <span><b>3</b>运行检查</span>
                      </>
                    )}
                  </div>
                </div>

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

                <div className="input-card">
                  <label htmlFor="program-input">程序输入</label>
                  <p>程序使用 input() 时，每行填写一个回答。</p>
                  <textarea
                    id="program-input"
                    value={inputText}
                    onChange={(event) => {
                      setInputText(event.target.value);
                      localStorage.setItem(`${INPUT_KEY_PREFIX}${lesson.id}`, event.target.value);
                    }}
                    placeholder={"第一个回答\n第二个回答"}
                    rows={5}
                  />
                </div>

                <button className={`complete-button ${completed.includes(lesson.id) ? "is-done" : ""}`} onClick={toggleCompleted}>
                  {completed.includes(lesson.id)
                    ? "✓ 已完成这一课"
                    : activeTab === "assignment" ? "提交作业并通关" : "我完成这一课了"}
                </button>
                <p className="privacy-note">🔒 代码在你的浏览器里运行，不会上传。</p>
              </aside>
            </section>
          )}
        </section>
      </section>
    </main>
    {showInitOverlay && (
      <div className={`environment-overlay ${loadProgress === 100 ? "is-success" : ""}`} role="dialog" aria-modal="true" aria-labelledby="environment-title">
        <div className="environment-dialog">
          <div className="environment-mark" aria-hidden="true">{loadProgress === 100 ? "✓" : "Py"}</div>
          <p className="eyebrow">Python 运行环境</p>
          <h2 id="environment-title">{loadProgress === 100 ? "环境初始化成功" : "环境准备中"}</h2>
          <div
            className="environment-progress"
            role="progressbar"
            aria-label="Python 环境加载进度"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={loadProgress}
          >
            <span style={{ width: `${loadProgress}%` }} />
          </div>
          <div className="environment-progress-copy">
            <strong>{loadProgress}%</strong>
          </div>
        </div>
      </div>
    )}
    {showSuccessToast && !showInitOverlay && (
      <div className="environment-toast" role="status"><span aria-hidden="true">✓</span> 环境初始化成功</div>
    )}
    </>
  );
}
