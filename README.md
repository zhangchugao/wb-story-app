# 听故事 · 全栈项目

一个「听故事」应用的完整技术栈，包含后端服务、微信小程序、后台管理系统三部分，共享同一套故事数据。

## 项目结构

```
.
├── story-backend/       # Node.js 后端（Express + SQLite）
├── story-miniprogram/   # 微信小程序（原生 WXML/WXSS）
└── story-admin/         # 后台管理系统（Vue3 + TS + SCSS + Vite）
```

## 快速启动

### 1. 后端（必须先启动）

```bash
cd story-backend
npm install
npm start
```

服务运行在 http://localhost:3000，默认管理员 `admin` / `admin123`。

> 数据库用 Node 内置 `node:sqlite`，需要 Node >= 22.5，无需编译原生模块。服务启动自动建表并写入种子数据。

### 2. 后台管理系统

```bash
cd story-admin
npm install
npm run dev        # http://localhost:5173
```

> 若开发环境因文件安全策略崩溃，改用 `npm run build && npm run serve`，访问 http://localhost:5180。

### 3. 微信小程序

用微信开发者工具打开 `story-miniprogram` 目录，填入自己的 AppID。真机调试时把 `utils/api.js` 里的 `localhost` 改成局域网 IP。

## 各模块说明

| 模块 | 技术栈 | 说明 |
|---|---|---|
| story-backend | Node.js + Express + SQLite | 小程序 API + 管理端 API，JWT 鉴权，音频 Range 流 |
| story-miniprogram | 原生微信小程序 | 4 个 Tab + 详情页/播放器，3D 清新风格 |
| story-admin | Vue3 + TypeScript + SCSS + Vite | 内容管理后台，H5 响应式，Element Plus 按需引入 |

详细文档见各目录下的 README：
- [后端 README](story-backend/README.md) / [API 文档](story-backend/API.md)
- [管理后台 README](story-admin/README.md)

## 注意

- 三个项目共享 `story-backend` 的 SQLite 数据库，在后台改数据小程序会同步生效。
- 种子数据中的音频/封面是占位路径，需在后台「资源管理」上传真实文件后填入故事。
- 生产环境务必修改 JWT 密钥与管理员密码（见 `story-backend/.env.example`）。
