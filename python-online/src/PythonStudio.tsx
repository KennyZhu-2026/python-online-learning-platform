import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { lessons, type Lesson } from "./content/lessons";

type LearningTab = "knowledge" | "practice" | "assignment";

type RunRequest = {
  code: string;
  inputs: string[];
};

type MonacoEditor = {
  getValue: () => string;
  setValue: (value: string) => void;
  getPosition: () => MonacoPosition | null;
  getModel: () => MonacoModel | null;
  focus: () => void;
  dispose: () => void;
  layout: () => void;
  trigger: (source: string, action: string, payload: Record<string, never>) => void;
  onDidChangeModelContent: (listener: () => void) => { dispose: () => void };
  addAction: (action: {
    id: string;
    label: string;
    keybindings: number[];
    run: () => void;
  }) => void;
};

type MonacoPosition = { lineNumber: number; column: number };

type MonacoModel = {
  getLineContent: (lineNumber: number) => string;
  getWordUntilPosition: (position: MonacoPosition) => { startColumn: number; endColumn: number; word: string };
};

type MonacoCompletionItem = {
  label: string;
  detail: string;
  documentation: string;
  kind: number;
  insertText: string;
  insertTextRules: number;
  sortText: string;
  range: {
    startLineNumber: number;
    endLineNumber: number;
    startColumn: number;
    endColumn: number;
  };
};

declare global {
  interface Window {
    monaco?: {
      editor: {
        create: (element: HTMLElement, options: Record<string, unknown>) => MonacoEditor;
        defineTheme: (name: string, theme: Record<string, unknown>) => void;
      };
      languages: {
        CompletionItemKind: { Snippet: number };
        CompletionItemInsertTextRule: { InsertAsSnippet: number };
        registerCompletionItemProvider: (
          language: string,
          provider: {
            triggerCharacters: string[];
            provideCompletionItems: (
              model: MonacoModel,
              position: MonacoPosition,
            ) => { suggestions: MonacoCompletionItem[] };
          },
        ) => { dispose: () => void };
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

const learningTabs: Array<{ id: LearningTab; label: string; icon: string }> = [
  { id: "knowledge", label: "知识讲解", icon: "▶" },
  { id: "practice", label: "代码练习", icon: "</>" },
];

const MONACO_BASE = "https://cdn.jsdelivr.net/npm/monaco-editor@0.55.1/min/vs";
const CODE_KEY_PREFIX = "python-sprout-code-";
const INPUT_KEY_PREFIX = "python-sprout-input-";
const ASSIGNMENT_KEY_PREFIX = "python-sprout-assignment-";
const COMPLETED_KEY = "python-sprout-completed";

const childFriendlySnippets = [
  {
    keyword: "print",
    label: "print()  输出一个数字",
    detail: "让电脑显示一个数字",
    documentation: "数字不需要放在引号中，可以直接写在 print() 里面。",
    insertText: "print(${1:123})$0",
  },
  {
    keyword: "print",
    label: 'print("")  输出一句话',
    detail: "让电脑显示一行文字",
    documentation: "自动补齐 print() 和英文引号，光标会停在引号中间。",
    insertText: 'print("${1:你好，Python！}")$0',
  },
  {
    keyword: "print",
    label: "print(变量)  输出变量",
    detail: "查看变量里保存的内容",
    documentation: "把变量名放进 print()，运行后就能看到变量的值。",
    insertText: "print(${1:name})$0",
  },
  {
    keyword: "if",
    label: "if / else  条件判断",
    detail: "根据条件选择不同的代码",
    documentation: "自动补齐冒号、else 和四个空格缩进。",
    insertText: 'if ${1:score >= 60}:\n    ${2:print("挑战成功！")}\nelse:\n    ${3:print("继续加油！")}\n$0',
  },
  {
    keyword: "if",
    label: "if / elif / else  多条件判断",
    detail: "依次判断三种不同情况",
    documentation: "自动补齐 if、elif、else、冒号和缩进。",
    insertText: 'if ${1:score >= 90}:\n    ${2:print("优秀！")}\nelif ${3:score >= 60}:\n    ${4:print("挑战成功！")}\nelse:\n    ${5:print("继续加油！")}\n$0',
  },
  {
    keyword: "input",
    label: 'input("")  获取回答',
    detail: "让程序向使用者提问",
    documentation: "输入的回答会保存到左边的变量中。",
    insertText: '${1:name} = input("${2:你叫什么名字？}")$0',
  },
  {
    keyword: "for",
    label: "for i in range()  按次数循环",
    detail: "让一段代码重复运行",
    documentation: "自动补齐 range()、冒号和缩进。",
    insertText: "for ${1:i} in range(${2:5}):\n    ${3:print(i)}\n$0",
  },
  {
    keyword: "for",
    label: "for item in [ ]  遍历列表内容",
    detail: "依次取出方括号中的每一项",
    documentation: "把列表直接写在 for 循环中，并自动补齐冒号和缩进。",
    insertText: 'for ${1:item} in [${2:"苹果", "香蕉"}]:\n    ${3:print(item)}\n$0',
  },
  {
    keyword: "for",
    label: "for item in 变量  遍历已有列表",
    detail: "依次取出列表变量中的每一项",
    documentation: "使用一个已经创建好的列表变量进行循环。",
    insertText: "for ${1:item} in ${2:items}:\n    ${3:print(item)}\n$0",
  },
  {
    keyword: "while",
    label: "while  条件循环",
    detail: "条件成立时重复运行",
    documentation: "模板包含计数变量和更新语句，避免忘记修改变量造成无限循环。",
    insertText: "${1:count} = 0\nwhile ${2:count < 5}:\n    ${3:print(count)}\n    ${4:count += 1}\n$0",
  },
];

function provideChildFriendlyCompletions(
  monaco: NonNullable<Window["monaco"]>,
  model: MonacoModel,
  position: MonacoPosition,
) {
  const lineBeforeCursor = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
  const prefix = lineBeforeCursor.trim().toLowerCase();
  if (!/^[a-z]+$/.test(prefix)) return { suggestions: [] };

  const word = model.getWordUntilPosition(position);
  const range = {
    startLineNumber: position.lineNumber,
    endLineNumber: position.lineNumber,
    startColumn: word.startColumn,
    endColumn: word.endColumn,
  };
  const suggestions = childFriendlySnippets
    .filter((snippet) => snippet.keyword.startsWith(prefix))
    .map((snippet, index) => ({
      label: snippet.label,
      detail: snippet.detail,
      documentation: snippet.documentation,
      kind: monaco.languages.CompletionItemKind.Snippet,
      insertText: snippet.insertText,
      insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      sortText: `0${index}`,
      range,
    }));
  return { suggestions };
}

function shouldTriggerChildFriendlyCompletions(model: MonacoModel, position: MonacoPosition) {
  const prefix = model
    .getLineContent(position.lineNumber)
    .slice(0, position.column - 1)
    .trim()
    .toLowerCase();
  return /^[a-z]+$/.test(prefix)
    && childFriendlySnippets.some((snippet) => snippet.keyword.startsWith(prefix));
}

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

function formatVideoTime(value: number) {
  const totalSeconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function LessonVideo({ src, label }: { src: string; label: string }) {
  const playerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) await video.play();
    else video.pause();
  };

  const seekTo = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const changeVolume = (value: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = value;
    video.muted = false;
    setVolume(value);
    setIsMuted(false);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const enterFullscreen = async () => {
    await playerRef.current?.requestFullscreen?.();
  };

  return (
    <div className={`video-card ${isPlaying ? "is-playing" : ""}`} ref={playerRef}>
      <video
        ref={videoRef}
        preload="metadata"
        playsInline
        src={src}
        aria-label={label}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onDurationChange={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
      >
        你的浏览器暂不支持视频播放。
      </video>
      <div className="video-controls" aria-label="视频播放控制">
        <input
          className="video-progress"
          type="range"
          min="0"
          max={Math.max(duration, 0.1)}
          step="0.1"
          value={Math.min(currentTime, Math.max(duration, 0.1))}
          onChange={(event) => seekTo(Number(event.target.value))}
          aria-label="视频播放进度"
          aria-valuetext={`${formatVideoTime(currentTime)} / ${formatVideoTime(duration)}`}
        />
        <div className="video-control-row">
          <button type="button" onClick={togglePlayback} aria-label={isPlaying ? "暂停视频" : "播放视频"}>
            {isPlaying ? "❚❚" : "▶"}
          </button>
          <span className="video-time">{formatVideoTime(currentTime)} / {formatVideoTime(duration)}</span>
          <span className="video-control-spacer" />
          <button type="button" onClick={toggleMute} aria-label={isMuted ? "打开声音" : "静音"}>
            {isMuted || volume === 0 ? "🔇" : "🔊"}
          </button>
          <input
            className="video-volume"
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(event) => changeVolume(Number(event.target.value))}
            aria-label="视频音量"
          />
          <button type="button" onClick={enterFullscreen} aria-label="全屏播放">⛶</button>
        </div>
      </div>
    </div>
  );
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
  const pendingRunRef = useRef<RunRequest | null>(null);
  const showInitOverlayRef = useRef(false);
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
  const [showInitOverlay, setShowInitOverlay] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [editorState, setEditorState] = useState<"loading" | "ready" | "fallback">("loading");
  const [completed, setCompleted] = useState<string[]>([]);
  const [showHints, setShowHints] = useState(false);
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
    showInitOverlayRef.current = pendingRunRef.current !== null;
    setShowInitOverlay(showInitOverlayRef.current);
    setShowSuccessToast(false);
    const worker = new Worker("./python-worker.js", { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (event: MessageEvent<{ type: string; text?: string; value?: number }>) => {
      const message = event.data;
      if (message.type === "ready") {
        setLoadProgress(100);
        if (showInitOverlayRef.current) {
          setShowSuccessToast(true);
          overlayTimerRef.current = window.setTimeout(() => {
            showInitOverlayRef.current = false;
            setShowInitOverlay(false);
          }, 700);
          toastTimerRef.current = window.setTimeout(() => setShowSuccessToast(false), 3200);
        }
        const pendingRun = pendingRunRef.current;
        pendingRunRef.current = null;
        if (pendingRun) {
          setRuntimeState("running");
          worker.postMessage({ type: "run", ...pendingRun });
        } else {
          setRuntimeState("ready");
        }
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
        pendingRunRef.current = null;
        showInitOverlayRef.current = false;
        setRuntimeState("error");
        setShowInitOverlay(false);
        console.error("Python environment failed to load:", message.text);
        setOutput("Python 魔法盒加载失败了。请检查网络后点击“重新加载 Python 环境”。");
      }
    };
    worker.onerror = (event) => {
      console.error("Python worker error:", event.message);
      pendingRunRef.current = null;
      showInitOverlayRef.current = false;
      setRuntimeState("error");
      setShowInitOverlay(false);
      setOutput("Python 魔法盒暂时没有加载成功，请点击“重新加载 Python 环境”再试。 ");
    };
  }, []);

  const runCode = useCallback(() => {
    const currentCode = editorRef.current?.getValue() ?? (activeTab === "assignment" ? assignmentCode : code);
    saveEditorValue(currentCode, activeTab);
    setOutput("");
    const runRequest = {
      code: currentCode,
      inputs: inputText.split(/\r?\n/),
    };
    if (runtimeState === "loading") {
      pendingRunRef.current = runRequest;
      showInitOverlayRef.current = true;
      setShowInitOverlay(true);
      return;
    }
    if (runtimeState !== "ready" || !workerRef.current) return;
    setRuntimeState("running");
    workerRef.current.postMessage({ type: "run", ...runRequest });
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
    let completionProvider: { dispose: () => void } | undefined;
    let completionTimer: number | undefined;
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
          completionProvider = window.monaco.languages.registerCompletionItemProvider("python", {
            triggerCharacters: ["p", "i", "f", "w"],
            provideCompletionItems: (model, position) => (
              provideChildFriendlyCompletions(window.monaco!, model, position)
            ),
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
            quickSuggestions: { other: true, comments: false, strings: false },
            suggestOnTriggerCharacters: true,
            wordBasedSuggestions: "off",
            snippetSuggestions: "top",
            tabCompletion: "on",
            acceptSuggestionOnEnter: "on",
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            contextmenu: true,
            ariaLabel: "Python 代码编辑器",
          });
          editorRef.current = editor;
          changeListener = editor.onDidChangeModelContent(() => {
            saveEditorValue(editor.getValue());
            if (completionTimer !== undefined) window.clearTimeout(completionTimer);
            completionTimer = window.setTimeout(() => {
              const model = editor.getModel();
              const position = editor.getPosition();
              if (model && position && shouldTriggerChildFriendlyCompletions(model, position)) {
                editor.trigger("child-friendly-completion", "editor.action.triggerSuggest", {});
              }
            }, 40);
          });
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
      completionProvider?.dispose();
      if (completionTimer !== undefined) window.clearTimeout(completionTimer);
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
            <div className="brand-copy">
              <p className="eyebrow">学习编程 · 开始创造</p>
              <h1>哆啦编程</h1>
            </div>
          </div>
          <div className="topbar-actions">
            {(runtimeState === "loading" || runtimeState === "error") && (
              <div className={`runtime-badge is-${runtimeState}`} role="status">
                <span className="status-dot" />
                {runtimeState === "loading" ? "环境准备中" : "环境初始化失败"}
              </div>
            )}
            <div className="current-lesson" aria-label={`当前课程：第 ${lesson.number} 课 ${lesson.title}`}>
              <span>当前课程</span>
              <div className="current-lesson-copy">
                <strong>第 {lesson.number} 课 · {lesson.title}</strong>
                <small>{lesson.goal}</small>
              </div>
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
              <LessonVideo
                src={`${import.meta.env.BASE_URL}videos/lesson1-review-1fps.mp4`}
                label={`${lesson.title} 教学视频`}
              />
            </section>
          )}

          {(activeTab === "practice" || activeTab === "assignment") && (
            <section className="coding-stage" role="tabpanel" aria-label={activeTab === "practice" ? "代码练习" : "作业通关"}>
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
                      <button className="run-button" onClick={runCode}>
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
                  <h3>{activeTab === "practice" ? lesson.taskTitle : "从空白开始挑战"}</h3>
                  <p className="mission-text">{activeTab === "practice" ? lesson.task : lesson.homework}</p>
                  <div className="three-steps">
                    {activeTab === "practice" ? (
                      lesson.taskSteps.map((step, index) => (
                        <span key={step}><b>{index + 1}</b>{step}</span>
                      ))
                    ) : (
                      <>
                        <span><b>1</b>读懂要求</span>
                        <span><b>2</b>独立编写</span>
                        <span><b>3</b>运行检查</span>
                      </>
                    )}
                  </div>
                  {showHints && (
                    <ul className="mission-hints">
                      {lesson.hints.map((hint) => <li key={hint}>{hint}</li>)}
                    </ul>
                  )}
                  <div className="mission-card-actions">
                    <button className="mission-hint-button" onClick={() => setShowHints(!showHints)} aria-expanded={showHints}>
                      <span aria-hidden="true">💡</span> {showHints ? "收起提示" : "看提示"}
                    </button>
                  </div>
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
                    rows={4}
                  />
                </div>

                <button className={`complete-button ${completed.includes(lesson.id) ? "is-done" : ""}`} onClick={toggleCompleted}>
                  {completed.includes(lesson.id)
                    ? "✓ 任务已完成"
                    : activeTab === "assignment" ? "提交作业并通关" : "完成任务"}
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
