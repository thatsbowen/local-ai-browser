# 目录结构说明

## 概览

```
local-ai-browser/          # 项目根目录
├── 配置文件               # package.json, tsconfig.json, vite.config.ts 等
├── 源码目录
│   ├── main/              # Electron 主进程（Node 环境）
│   ├── preload/           # 预加载脚本（桥接主进程和渲染进程）
│   └── renderer/          # React 前端（浏览器环境）
├── 构建资源               # resources/（图标等）
└── 构建输出               # dist/, dist-electron/, release/
```

---

## 配置文件

| 文件 | 说明 |
|------|------|
| `package.json` | 项目配置、npm 脚本、electron-builder 打包配置 |
| `tsconfig.json` | TypeScript 配置（渲染进程 + 前端） |
| `tsconfig.node.json` | TypeScript 配置（Node 环境 / vite 主进程） |
| `vite.config.ts` | Vite 构建配置，含 electron-plugin 两入口 |
| `tailwind.config.js` | Tailwind CSS 主题配置 |
| `postcss.config.js` | PostCSS 配置 |
| `.gitignore` | Git 忽略文件 |
| `SPEC.md` | 产品规格文档 |
| `README.md` | 项目说明文档 |
| `DIRECTORY.md` | 本文件，目录结构说明 |

---

## src/main/ — Electron 主进程

> 运行在 Node.js 环境，拥有操作系统原生能力。

```
main/
├── index.ts              # ★ 应用入口
│                        # - app.whenReady() 初始化 store、db、IPC
│                        # - createWindow() 创建无边框 BrowserWindow
│                        # - 注册窗口控制 IPC (minimize/maximize/close)
│                        # - 注册 shell.openExternal 打开外部链接
│
├── ipc/                  # ★ IPC 处理器（渲染进程 <--> 主进程）
│   │
│   ├── index.ts         # 统一注册所有 handler
│   │
│   ├── bookmarks.ts     # 书签 IPC
│   │                    # - bookmarks:getAll     获取全部书签
│   │                    # - bookmarks:add        添加书签
│   │                    # - bookmarks:remove     删除书签
│   │                    # - bookmarks:update     更新书签
│   │
│   ├── history.ts       # 历史记录 IPC
│   │                    # - history:getAll       获取历史（支持 limit）
│   │                    # - history:add          添加记录
│   │                    # - history:search       搜索标题/URL
│   │                    # - history:clear        清空历史
│   │
│   ├── ai.ts            # AI 配置 + 对话历史 IPC
│   │                    # - ai:getConfig          读取 AI 配置
│   │                    # - ai:setConfig          保存 AI 配置
│   │                    # - ai:getChatHistory     获取对话列表
│   │                    # - ai:getChatMessages    获取某对话的所有消息
│   │                    # - ai:createChat         创建新对话
│   │                    # - ai:deleteChat         删除对话
│   │                    # - ai:clearChat          清除对话消息（保留对话）
│   │                    # - ai:chat               AI 对话（流式）
│   │
│   └── ai/
│       └── chat.ts      # ★ AI 厂商 API 调用实现
│                        # - getProviderInfo()     获取预设提供商信息
│                        # - getAllProviders()     获取所有预设
│                        # - chatWithAI()          发起 AI 对话（SSE 流式）
│
├── store/                # 数据持久化
│   │
│   ├── config.ts        # electron-store 加密存储
│   │                    # - initStore()           初始化 store
│   │                    # - getStore()            获取 store 实例
│   │                    # - 存储内容：AI 配置（provider/apiKey/baseURL/model）
│   │                    #              浏览器配置（主题/主页/搜索引擎）
│   │                    #              窗口状态
│   │
│   └── db.ts            # SQLite 数据库
│                        # - initDatabase()        初始化 db，建表
│                        # - getDb()               获取 db 实例
│                        # - 表：bookmarks / history / ai_chats / ai_messages
│
└── utils/
    └── logger.ts         # 日志工具（写文件 + console 输出）
```

---

## src/preload/ — 预加载脚本

```
preload/
└── index.ts             # ★ contextBridge API 暴露
                         # 渲染进程通过 window.electronAPI 访问：
                         # - window.*        窗口控制
                         # - bookmarks.*     书签操作
                         # - history.*       历史操作
                         # - ai.*            AI 配置和对话
                         # - shell.*         打开外部链接
                         # - dialog.*        文件对话框
```

> 预加载脚本运行在渲染进程中，但可以访问 Node.js 和 Electron 主进程的 API。
> 通过 `contextIsolation: true` 和 `contextBridge` 确保渲染进程安全隔离。

---

## src/renderer/ — React 前端

> 运行在 Chromium 浏览器环境中，不可直接访问 Node.js。

```
renderer/
├── main.tsx             # React 入口，ReactDOM.createRoot
├── App.tsx              # ★ 根组件
│                        # - 布局：TitleBar + Toolbar + TabBar + WebViewContainer
│                        # - 状态：aiSidebarOpen / currentUrl / canGoBack / canGoForward
│
├── types.ts             # TypeScript 类型定义
│                        # - Bookmark / HistoryEntry / AIMessage / AIChat / AIConfig
│
├── styles/
│   └── globals.css       # Tailwind 入口 + 基础样式
│                        # - 自定义滚动条样式
│                        # - drag-region / no-drag 拖动区域
│
├── components/
│   ├── common/
│   │   └── TitleBar.tsx # 无边框窗口标题栏
│   │                    # - Logo + 应用名称
│   │                    # - 窗口控制按钮（最小化/最大化/关闭）
│   │                    # - 使用 drag-region 实现窗口拖动
│   │
│   ├── Browser/
│   │   ├── Toolbar.tsx  # ★ 工具栏
│   │                    # - 导航按钮（后退/前进/刷新）
│   │                    # - 地址栏（表单提交 → 加载 URL）
│   │                    # - 书签按钮
│   │                    # - AI 按钮（点击打开侧边栏）
│   │
│   │   ├── TabBar.tsx   # 标签栏
│   │                    # - 多标签显示
│   │                    # - 新建标签 / 关闭标签
│   │
│   │   └── WebViewContainer.tsx # webview 容器
│   │                    # - 创建 <webview> 元素
│   │                    # - 监听 did-start-loading / did-stop-loading / did-navigate
│   │                    # - 暴露 __webview 给全局，Toolbar 可调用 goBack/goForward
│   │
│   └── AI/
│       ├── AILogo.tsx   # ★ 抽象 AI Logo（SVG）
│       │                # - 圆形(◉) = 用户/人
│       │                # - 三角形(▽) = AI/智能
│       │                # - 渐变蓝紫色 (#6366F1 → #8B5CF6)
│       │
│       ├── AISidebar.tsx # AI 侧边栏容器
│       │                # - 固定宽度 420px，右侧滑出
│       │                # - 顶栏：AILogo + 名称 + 设置按钮
│       │                # - 内容：配置面板 AIModelConfig 或对话 AIChatView
│       │
│       ├── AIModelConfig.tsx # ★ 模型配置面板
│       │                # - 选择预设提供商（智谱/阿里/腾讯/DeepSeek/自定义）
│       │                # - 输入 API Key
│       │                # - 选择/输入模型
│       │                # - 自定义 API 配置（地址/Key/模型/格式）
│       │                # - 系统提示词
│       │
│       └── AIChatView.tsx # ★ AI 对话界面
│                        # - 对话历史列表（快捷切换）
│                        # - 消息展示区（用户/助手 气泡）
│                        # - 快捷提示词按钮
│                        # - 输入框（Enter 发送，Shift+Enter 换行）
│                        # - 流式输出动画（思考中...）
│
└── hooks/
    └── useWindowState.tsx # 窗口状态 React Context
```

---

## resources/ — 构建资源

```
resources/
└── icon.ico             # Windows 应用图标（256x256 .ico 格式）
                         # 用于 electron-builder 打包 Windows exe
```

---

## 构建输出目录

| 目录 | 内容 | 用途 |
|------|------|------|
| `dist/` | Vite 构建的前端静态文件 | 供 Electron 加载 |
| `dist-electron/main/` | Electron 主进程构建产物 | 应用入口 |
| `dist-electron/preload/` | 预加载脚本构建产物 | API 桥接 |
| `release/` | electron-builder 打包输出 | 正式发布 |
| `release/*.exe` | NSIS 安装程序 | Windows 安装包 |

---

## 数据流示意

```
用户操作（渲染进程）
  │
  ▼  window.electronAPI.xxx()
IPC 通道（contextBridge）
  │
  ▼  ipcRenderer.invoke / ipcMain.handle
主进程处理
  ├── store/  →  electron-store 加密配置
  ├── db/     →  SQLite 数据库（书签/历史/AI对话）
  └── ai/chat.ts → HTTP 请求调用大模型 API
  │
  ▼  event.sender.send / webContents.send
渲染进程更新 UI
```

---

## 关键设计决策

1. **无边框窗口** — 自定义标题栏，平台一致体验
2. **数据完全本地** — SQLite + electron-store，无任何云端依赖
3. **AI 配置加密** — electron-store 使用 AES 加密存储敏感信息
4. **流式响应** — SSE 实时输出，打字机效果
5. **预设 + 自定义** — 内置4家厂商快速上手，支持任意兼容 API