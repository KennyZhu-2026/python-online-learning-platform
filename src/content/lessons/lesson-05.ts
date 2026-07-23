import type { Lesson } from "./types";

export const lesson05 = {
  id: "loop",
  number: 5,
  title: "重复魔法",
  emoji: "🔁",
  stage: "循环",
  goal: "用 for 和 range() 把重复任务交给电脑。",
  taskTitle: "火箭发射倒计时",
  task: "改造循环程序，让火箭完成从 5 到 1 的倒计时并成功发射。",
  taskSteps: ["把 range() 改成从 5 倒数到 1", "每次循环打印当前数字", "倒计时结束后打印“发射！”"],
  homework: "使用循环完成 10 到 1 的倒计时，并在最后输出“挑战成功！”。",
  hints: ["range(1, 6) 会产生 1 到 5", "循环中的代码需要缩进", "倒数可以试试 range(5, 0, -1)"],
  starterCode: `for number in range(1, 6):
    print("第", number, "次练习")

print("我完成啦！")`,
} satisfies Lesson;
