# 本地化AI智能浏览器 - 产品规格文档

## 1. 项目概述

- **项目名称：** 本地化AI智能浏览器
- **项目类型：** Windows桌面应用程序
- **核心功能：** 基于Chromium内核的本地浏览器 + 内置AI对话助手，所有数据完全本地存储
- **目标用户：** 注重隐私、有AI使用需求、不希望数据上云的用户

## 2. 技术栈

| 层级 | 技术选型 | 版本 |
|------|---------|------|
| 桌面框架 | Electron | ^35.0.0 |
| 前端框架 | React | ^18.3.0 |
| 构建工具 | Vite | ^6.0.0 |
| 语言 | TypeScript | ^5.5.0 |
| 浏览器内核 | Chromium | 128+ (Electron内置) |
| 数据存储 | electron-store + SQLite (better-sqlite3) | |
| 打包工具 | electron-builder | ^25.0.0 |
| 样式 | Tailwind CSS | ^3.4.0 |
| AI API调用 | OpenAI / Anthropic 兼容客户端 | |

## 3. UI/UX 设计

### 3.1 主窗口布局

```
┌─────────────────────────────────────────────────────────────┐
│  [≡] [本地化AI智能浏览器]          [—] [□] [×]              │  ← 标题栏
├─────────────────────────────────────────────────────────────┤
│  [←] [→] [↻]  [🔖]  [📌固定标签...]        [🔍 地址栏...] [🤖] │  ← 工具栏
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                     网页内容区域                             │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 AI侧边栏（右侧滑出）

- 宽度：420px
- 顶栏：AI logo + 名称 + 最小化/关闭按钮
- 中部：对话消息列表（支持滚动）
- 底栏：输入框 + 发送按钮 + 设置入口

### 3.3 AI Logo（抽象设计）

```
  ╭───╮
  │ ◉ │   抽象含义：
  │ ▽ │   - ◉ 代表用户（浏览器使用者）
  ╰───╯   - ▽ 代表AI（智能助手）
           - 圆形+三角形组合 = 交互/对话
  配色：渐变蓝紫色 (#6366F1 → #8B5CF6)
```

### 3.4 主题色

| 用途 | 颜色 |
|------|------|
| 主色 | #6366F1 (Indigo) |
| 强调色 | #8B5CF6 (Purple) |
| 背景色 | #0F172A (深色) / #FFFFFF (浅色) |
| 文字色 | #F8FAFC (深色) / #1E293B (浅色) |
| 边框色 | #334155 |
| 成功色 | #10B981 |
| 警告色 | #F59E0B |
| 错误色 | #EF4444 |

## 4. 功能模块

### 4.1 浏览器核心功能

- Chromium内核（最新版Electron内置）
- 标签页管理（新建、关闭、切换）
- 地址栏导航
- 前进/后退/刷新
- 书签管理（增删改查，全部本地存储）
- 浏览历史记录（本地SQLite）
- 固定标签页
- 页面内搜索 (Ctrl+F)

### 4.2 AI对话功能

#### 4.2.1 模型配置

**预设模型（用户直接选择填入key即可）：**

| 提供商 | 模型ID | 显示名称 |
|--------|--------|---------|
| 智谱AI | glm-4-flash / glm-4-plus | 智谱 GLM-4 |
| 阿里云 | qwen-turbo / qwen-plus | 阿里 Qwen |
| 腾讯混元 | hunyuan-turbo / hunyuan-pro | 腾讯 混元 |
| DeepSeek | deepseek-chat / deepseek-coder | DeepSeek |
| 自定义 | - | 自定义 API |

**自定义模型配置项：**
- API地址（必填，支持OpenAI格式 `https://api.xxx.com/v1` 或 Anthropic格式）
- API Key（必填）
- 模型名称（必填）
- API格式（自动检测：OpenAI / Anthropic）

#### 4.2.2 对话功能

- 单轮对话 + 多轮对话（维护上下文，最多20轮）
- 实时流式输出（SSE）
- 对话历史保存（本地）
- 清除当前对话
- 新建对话

#### 4.2.3 提示词模板

- 系统角色设置（默认空空）
- 预设快捷提示词：
  - "帮我总结这个页面"
  - "解释这段代码"
  - "翻译成中文"
  - "以表格形式呈现"

### 4.3 数据存储

**全部本地存储，不上云：**

| 数据类型 | 存储方式 |
|---------|---------|
| 书签 | SQLite (bookmarks.db) |
| 历史记录 | SQLite (history.db) |
| AI配置 | electron-store (encrypted) |
| AI对话历史 | SQLite (ai_chats.db) |
| 浏览器设置 | electron-store |
| 下载文件 | 用户指定目录 |

## 5. 模块设计

### 5.1 主进程 (main/)

```
main/
├── index.ts              # 入口，创建BrowserWindow
├── ipc/
│   ├── bookmarks.ts      # 书签IPC处理
│   ├── history.ts        # 历史记录IPC处理
│   ├── ai.ts             # AI配置/对话IPC处理
│   └── window.ts         # 窗口控制IPC
├── store/
│   ├── config.ts         # electron-store配置
│   └── db.ts             # SQLite连接
└── utils/
    └── logger.ts         # 日志工具
```

### 5.2 渲染进程 (renderer/)

```
renderer/
├── index.html
├── main.tsx
├── App.tsx
├── components/
│   ├── Browser/
│   │   ├── Toolbar.tsx       # 工具栏
│   │   ├── AddressBar.tsx    # 地址栏
│   │   ├── TabBar.tsx        # 标签栏
│   │   └── WebView.tsx       # webview组件
│   ├── AI/
│   │   ├── AISidebar.tsx     # AI侧边栏容器
│   │   ├── AIChat.tsx        # 对话区域
│   │   ├── AIMessage.tsx     # 单条消息
│   │   ├── AIInput.tsx       # 输入区
│   │   ├── AIModelConfig.tsx # 模型配置面板
│   │   └── AILogo.tsx        # AI抽象logo
│   └── common/
│       ├── TitleBar.tsx      # 窗口标题栏
│       └── Modal.tsx         # 通用弹窗
├── hooks/
│   ├── useBookmarks.ts
│   ├── useHistory.ts
│   └── useAIChat.ts
├── services/
│   ├── ai/
│   │   ├── client.ts         # AI客户端（统一接口）
│   │   ├── openai.ts         # OpenAI兼容客户端
│   │   ├── anthropic.ts      # Anthropic兼容客户端
│   │   └── providers.ts      # 预设提供商配置
│   └── api/
│       └── ipc.ts            # IPC调用封装
└── styles/
    └── globals.css
```

## 6. AI厂商API对接

### 6.1 智谱AI

- **API格式：** OpenAI兼容
- **Base URL:** `https://open.bigmodel.cn/api/paas/v4`
- **模型:** `glm-4-flash`, `glm-4-plus`

### 6.2 阿里云（通义千问）

- **API格式：** OpenAI兼容
- **Base URL:** `https://dashscope.aliyuncs.com/compatible-mode/v1`
- **模型:** `qwen-turbo`, `qwen-plus`

### 6.3 腾讯混元

- **API格式:** OpenAI兼容
- **Base URL:** `https://api.hunyuan.cloud.tencent.com/v1`
- **模型:** `hunyuan-turbo`, `hunyuan-pro`

### 6.4 DeepSeek

- **API格式:** OpenAI兼容
- **Base URL:** `https://api.deepseek.com/v1`
- **模型:** `deepseek-chat`, `deepseek-coder`

### 6.5 自定义

- 用户填入完整API地址、Key、模型名
- 自动检测API格式（检查URL路径包含 `anthropic` 则用Anthropic格式）
- 支持任一兼容OpenAI API或Anthropic API的服务商

## 7. IPC通信设计

| Channel | 方向 | 描述 |
|---------|------|------|
| `bookmarks:get` | renderer→main | 获取所有书签 |
| `bookmarks:add` | renderer→main | 添加书签 |
| `bookmarks:remove` | renderer→main | 删除书签 |
| `history:get` | renderer→main | 获取历史记录 |
| `history:add` | renderer→main | 添加历史记录 |
| `ai:config:get` | renderer→main | 获取AI配置 |
| `ai:config:set` | renderer→main | 保存AI配置 |
| `ai:chat` | renderer→main | 发送AI对话请求 |
| `ai:chat:stream` | main→renderer | 流式响应 |
| `window:minimize` | renderer→main | 最小化 |
| `window:maximize` | renderer→main | 最大化/还原 |
| `window:close` | renderer→main | 关闭 |

## 8. 打包配置

- **目标平台：** Windows (x64)
- **输出格式：** NSIS安装程序 (.exe)
- **应用图标：** 自定义.ico
- **安装目录：** 用户可选
- **桌面快捷方式：** 可选创建
- **启动菜单：** 创建

## 9. 验收标准

1. ✅ 生成的exe文件可在Windows 10/11直接安装运行
2. ✅ 浏览器可正常加载网页（以百度为例）
3. ✅ AI按钮点击后侧边栏滑出显示
4. ✅ 配置任意一个AI模型后可正常对话
5. ✅ 关闭应用后重新打开，书签、历史、AI配置均保留
6. ✅ 无需任何互联网账户
7. ✅ 所有数据文件均在用户本地目录，不外传
