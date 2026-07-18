import type { Lesson } from "./types";

export const lesson01 = {
  id: "hello",
  number: 1,
  title: "让电脑开口说话",
  emoji: "👋",
  stage: "认识程序",
  goal: "认识代码从上到下运行，并用 print() 让电脑说话。",
  taskTitle: "会说话的自我介绍卡",
  task: "请把示例代码改造成一张属于你的自我介绍卡，让 Python 按顺序说出你的名字、年龄和爱好。完成后运行代码，检查三句话是否都正确显示。",
  taskSteps: [
    "把第二行的“朵朵”改成你的名字或昵称",
    "增加一行 print()，让电脑说出你的年龄",
    "再增加一行 print()，让电脑说出你的爱好",
    "运行代码，检查三句话的顺序和内容",
  ],
  homework: "从空白文件开始，写一个不少于 3 行的自我介绍程序。请至少使用 2 次 print()，让电脑说出你的名字、爱好和一个学习愿望。",
  hints: [
    "每说一句话，就写一行 print()",
    "想原样显示的文字，需要放在英文双引号里",
    "检查英文括号和英文引号是否左右成对",
    "代码会按照从上到下的顺序运行，可以调整代码顺序改变介绍顺序",
  ],
  starterCode: `print("你好，Python！")
print("我是朵朵！")`,
} satisfies Lesson;
