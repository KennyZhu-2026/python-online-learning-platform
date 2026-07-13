# Python 小芽

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
- 6 个由浅入深的儿童 Python 闯关课程
- 中文“程序侦探”报错提示
- 课程代码、输入和完成进度自动保存在浏览器
- 窄屏设备自动切换到轻量编辑器
- 键盘快捷键：`Ctrl/Command + Enter` 运行

## 本地开发

需要 Node.js 22 或更高版本。

```bash
npm install
npm run dev
```

访问 `http://localhost:3000/`。

## 构建

Sites / Cloudflare Worker 构建：

```bash
npm run build
```

ECS 静态站点构建：

```bash
npm run build:ecs
```

静态产物生成在 `dist-ecs/`，基础路径为 `/python-online/`。

## 自动部署

推送到 `main` 分支后，GitHub Actions 会自动构建并同步到 ECS 的 `/opt/python_online`。Nginx 将其发布在 `/python-online/`，不会影响服务器根路径上的既有服务。

服务器使用的 Nginx 配置参考位于 `deploy/nginx-customer-agent.conf`。

## 技术说明

- [Monaco Editor](https://github.com/microsoft/monaco-editor) 提供代码编辑体验。
- [Pyodide](https://pyodide.org/) 在 WebAssembly 中运行 Python。
- Python 在独立 Web Worker 中执行，可随时终止并重新启动运行环境。
- Monaco 和 Pyodide 当前通过 jsDelivr 加载，首次打开需要联网下载运行环境，后续会使用浏览器缓存。
