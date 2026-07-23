import type { Lesson } from "./types";

export const lesson03 = {
  id: "input",
  number: 3,
  title: "电脑采访员",
  emoji: "🎤",
  stage: "用户输入",
  goal: "使用 input() 接收回答，让程序和人互动。",
  taskTitle: "电脑小记者",
  task: "让电脑成为小记者，除了姓名和爱好，再采访一个你感兴趣的问题。",
  taskSteps: ["增加一个新的 input() 问题", "在程序输入框准备三个回答", "打印新答案并运行采访程序"],
  homework: "设计一个小采访程序：至少提出 3 个问题，并在最后把收到的答案组合成一段欢迎语。",
  hints: ["右侧“程序输入”每行对应一次 input()", "input() 得到的内容默认是文字", "问题文字也要放在英文引号里"],
  starterCode: `name = input("你叫什么名字？")
hobby = input("你喜欢做什么？")

print(f"你好，{name}！")
print(f"原来你也喜欢{hobby}呀！")`,
  inputs: "朵朵\n画画",
} satisfies Lesson;
