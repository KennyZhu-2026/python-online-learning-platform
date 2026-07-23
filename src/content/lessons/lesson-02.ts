import type { Lesson } from "./types";

export const lesson02 = {
  id: "data-types",
  number: 2,
  title: "数字和文字，谁要穿“外套”？",
  emoji: "🧥",
  stage: "数字与字符串",
  knowledgePoints: "数据类型",
  contentReady: true,
  videoSrc: "videos/lesson-02.mp4",
  goal: "认识字符串和整数，分清哪些内容需要英文引号，并用英文逗号在一行中输出多个内容。",
  taskTitle: "我的数字身份卡",
  task: "把示例中的昵称和年龄换成自己的信息，再增加一个可以用整数表示的个人信息，制作一张属于你的数字身份卡。",
  taskSteps: [
    "把第1行的“哆啦”改成自己的名字或昵称，保留英文引号",
    "把第2、3行的年龄改成自己的年龄，整数不加引号",
    "增加一行 print()，用英文逗号输出一个新的数字信息",
    "运行代码，检查引号、括号和逗号是否都是英文符号",
  ],
  homework: "从空白文件开始，输出昵称、年龄和一个新的数字信息；至少有一行使用英文逗号输出“文字 + 整数”。",
  hints: [
    "姓名和句子是文字，需要穿上英文引号外套",
    "年龄和数量是整数，在本课中直接写数字，不穿引号外套",
    "一条 print() 中有多个内容时，用英文逗号 , 隔开",
    "检查逗号是否写在引号外面，括号和引号是否左右成对",
  ],
  starterCode: `print("哆啦")
print(9)
print("我今年", 9, "岁啦")`,
} satisfies Lesson;
