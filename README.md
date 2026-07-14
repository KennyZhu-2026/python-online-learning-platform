# Python 教学项目

本仓库按用途分为两个主要目录：

- `python-online/`：Python 在线学习平台工程，包括应用源码、构建配置、部署配置和依赖。
- `lesson-video/`：课程教案、共享视觉规范，以及每一节课的 HyperFrames 课件和视频工程。该目录仅保存在本地，不纳入 Git 提交。

仓库级的 `.git`、`.github` 和 `.gitignore` 保留在根目录。

在线平台的开发与构建命令需要在 `python-online/` 中运行：

```bash
cd python-online
npm install
npm run dev
```

课件视频的制作要求与审批流程见 `lesson-video/课件视频制作流程.md`。
