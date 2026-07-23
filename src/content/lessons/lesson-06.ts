import type { Lesson } from "./types";

export const lesson06 = {
  id: "list",
  number: 6,
  title: "愿望清单",
  emoji: "🌟",
  stage: "列表",
  goal: "用列表把多个数据整齐地放在一起。",
  taskTitle: "闪闪发光的愿望清单",
  task: "扩充你的愿望列表，再用循环把每一个愿望整齐地展示出来。",
  taskSteps: ["在列表中增加两个新愿望", "使用循环逐个打印所有愿望", "为每个输出的愿望加上 ✨"],
  homework: "创建一个至少包含 5 项内容的愿望清单，用循环逐项输出，并为每项加上星星符号。",
  hints: ["列表使用方括号 []", "每一项之间用英文逗号隔开", "append() 可以添加新内容"],
  starterCode: `wishes = ["学会 Python", "做一个小游戏", "认识新朋友"]

for wish in wishes:
    print("✨", wish)`,
} satisfies Lesson;
