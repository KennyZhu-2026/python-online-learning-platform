# 哆啦编程

一个为孩子设计的在线 Python 学习平台。无需安装 Python、编辑器或浏览器插件，打开网页即可学习、编写和运行 Python 代码。

## 线上地址

```text
http://8.148.201.87/python-online/
```

## 已有功能

- Monaco 代码编辑器与 Python 语法高亮
- Pyodide + Web Worker 浏览器内运行，不把代码上传到服务器
- 可停止运行，避免错误循环卡住整个页面
- `input()` 多行输入支持
- 21 节由浅入深的儿童 Python 课程目录
- 第 1、2 课教学视频与配套代码练习
- 中文“程序侦探”报错提示
- 课程代码、输入和完成进度自动保存在浏览器
- 窄屏设备自动切换到轻量编辑器
- 键盘快捷键：`Ctrl/Command + Enter` 运行

## 工程目录结构

```text
python-online/
├── deploy/
│   └── python-online.location.conf.example  # 可合并到 ECS 现有站点的 Nginx 路由片段
├── public/                         # 构建时原样复制的静态资源
│   ├── favicon.svg                 # 网站图标
│   ├── og.png                      # 页面分享预览图
│   └── python-worker.js            # 在独立线程中运行 Pyodide/Python
├── src/                            # 前端应用源码
│   ├── content/
│   │   └── lessons/                # 课程大纲、已发布课程配置及统一索引
│   ├── PythonStudio.tsx            # 学习平台主界面、课程和交互逻辑
│   ├── globals.css                 # 全局样式与响应式布局
│   └── main.tsx                    # React 应用入口
├── tests/
│   └── rendered-html.test.mjs      # ECS 静态构建产物与核心内容测试
├── index.html                      # Vite HTML 入口
├── package.json                    # 项目依赖和开发、构建、检查命令
├── package-lock.json               # npm 依赖版本锁定文件
├── tsconfig.json                   # TypeScript 编译与类型检查配置
├── vite.config.ts                  # Vite 构建配置及部署基础路径
└── README.md                       # 项目说明文档
```

21 节课的标题和知识点维护在 `src/content/lessons/course-outline.ts`。教案确认并准备发布时，在 `src/content/lessons/` 中新增对应的 `lesson-XX.ts`，再从大纲占位数据切换为正式课程配置。代码编辑器、运行结果和任务卡继续复用 `PythonStudio.tsx` 中的通用页面，不需要为每节课复制页面。

运行 `npm install` 后会生成 `node_modules/`；运行 `npm run build` 后会生成用于 ECS 部署的 `dist-ecs/`。这两个目录都是本地生成目录，不属于源码结构。

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

终端会显示本地访问地址，Vite 默认通常为 `http://localhost:5173/`。

## 构建与检查

项目仅使用 ECS 静态站点构建：

```bash
npm run build
npm run check
```

静态产物生成在 `dist-ecs/`，基础路径为 `/python-online/`。

## 自动部署

推送到 `main` 分支后，GitHub Actions 会自动构建并同步到 ECS 的 `/opt/python_online`。Nginx 将其发布在 `/python-online/`，不会影响服务器根路径上的既有服务。

Nginx 路由示例位于 `deploy/python-online.location.conf.example`。它只包含 `/python-online/` 路由，需要合并到 ECS 当前生效站点的 `server { ... }` 中，不要把它作为独立的 `server` 或 `default_server` 配置启用。

部署前请确认 GitHub Secret `DEPLOY_PATH` 的值为本项目独立目录 `/opt/python_online`。部署流程使用 `rsync --delete`，路径配置错误可能删除其他项目目录中的文件。

## 技术说明

- [Monaco Editor](https://github.com/microsoft/monaco-editor) 提供代码编辑体验。
- [Pyodide](https://pyodide.org/) 在 WebAssembly 中运行 Python。
- Python 在独立 Web Worker 中执行，可随时终止并重新启动运行环境。
- Monaco 和 Pyodide 当前通过 jsDelivr 加载，首次打开需要联网下载运行环境，后续会使用浏览器缓存。
