import type { Lesson } from "./types";

export const lesson01 = {
  id: "hello",
  number: 1,
  title: "让电脑说话的魔法",
  emoji: "👋",
  stage: "认识程序",
  goal: "认识代码从上到下运行，并用 print() 让电脑说话。",
  taskTitle: "自我介绍卡",
  task: "在电脑上按顺序输出你的名字、年龄和爱好",
  taskSteps: [
    "把第2行的“哆啦”改成你的名字或昵称",
    "把第3行的年龄改成你的年龄或年级",
    "增加一行 print()，让电脑说出你的爱好",
  ],
  homework: "从空白文件开始，写一个不少于 3 行的自我介绍程序。请至少使用 2 次 print()，让电脑说出你的名字、爱好和一个学习愿望。",
  hints: [
    "每说一句话，就写一行 print()",
    "想原样显示的文字，需要放在英文双引号里",
    "检查英文括号和英文引号是否左右成对",
    "代码会按照从上到下的顺序运行，可以调整代码顺序改变介绍顺序",
  ],
  starterCode: `# 我的第一段代码
print("我是哆啦")
print("我今年9岁啦")`,
} satisfies Lesson;
