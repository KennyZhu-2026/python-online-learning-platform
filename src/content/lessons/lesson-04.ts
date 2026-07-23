import type { Lesson } from "./types";

export const lesson04 = {
  id: "condition",
  number: 4,
  title: "智能游乐园检票器",
  emoji: "🎡",
  stage: "条件判断",
  goal: "用 if / else 让程序根据不同情况做决定。",
  taskTitle: "游乐园小小检票员",
  task: "用不同身高测试检票程序，看看它会放行还是提醒下次再来。",
  taskSteps: ["先用身高 135 运行一次", "再把身高改成 110", "比较两次运行结果有什么不同"],
  homework: "编写一个年龄判断器：根据输入的年龄，分别输出儿童、少年或成年人的提示。",
  hints: ["if 后面要有英文冒号", "下一行要缩进 4 个空格", ">= 表示大于或等于"],
  starterCode: `height = 135

if height >= 120:
    print("检票成功，祝你玩得开心！")
else:
    print("还差一点点，下次再来挑战吧！")`,
} satisfies Lesson;
