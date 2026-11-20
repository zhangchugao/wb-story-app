# 听故事小程序后端

Node.js + Express + SQLite 实现的听故事小程序后端服务，包含微信登录、故事内容、分集、收藏、播放历史与断点续听。

## 技术栈

- Node.js >= 22.5（使用内置的 `node:sqlite`，无需编译原生模块）
- Express 4（HTTP 框架）
- node:sqlite（嵌入式数据库，零依赖零运维）
- jsonwebtoken（登录鉴权）
- axios（微信 code2session）

> 为什么不用 better-sqlite3：它在 Windows 上需要 Visual Studio C++ 构建工具现编译，环境不具备时会安装失败。内置 `node:sqlite` 完全规避这个问题。

## 快速开始

```bash
npm install
cp .env.example .env      # 按需修改配置
npm start                 # 默认 http://localhost:3000
```

开发模式热重载：

```bash
npm run dev
```

健康检查：

```bash
curl http://localhost:3000/api/health
```

## 微信登录配置

在 `.env` 中填写微信公众平台的 `WX_APPID` 与 `WX_SECRET`：

```env
WX_APPID=你的appid
WX_SECRET=你的secret
```

- **未配置**这两项时，服务自动进入开发模式 mock 登录：`code` 会被哈希成稳定的假 openid，方便本地联调，无需真实微信凭证。
- 小程序端调用 `wx.login()` 拿到 `code`，请求 `/api/auth/wx-login` 换取 JWT，后续接口在请求头带 `Authorization: Bearer <token>`。

## 数据库

服务启动时自动建表并写入种子数据（6 个故事、5 个分类）。数据库文件默认在 `data/story.db`，可用 `DB_PATH` 修改。

手动重建种子数据：

```bash
npm run init-db
```

> 种子数据是幂等的，重复执行不会重复插入。

## 音频文件

把真实音频放进 `storage/audio/`，文件名需与故事/分集的 `audio_url` 对应。接口 `/api/audio/:filename` 支持 HTTP Range（206 分段响应），小程序拖动进度条依赖此特性。

封面图片放到 `storage/static/`，通过 `/static/xxx.png` 访问。

> 种子数据里的音频/封面路径是占位示例，需要你自己放入对应文件才能播放。

## 分层结构

```
src/
├── app.js              # Express 应用装配
├── server.js           # 启动入口
├── config/             # 环境配置
├── db/                 # 数据库连接、建表 SQL、种子数据
├── dao/                # 数据访问层（所有 SQL 集中在此，换库只改这里）
├── services/           # 业务逻辑层
├── routes/             # 路由
├── middlewares/        # 鉴权、错误处理
└── utils/              # 响应封装、异步包装
```

## 统一响应格式

```json
{ "code": 0, "message": "ok", "data": {} }
```

`code` 为 0 表示成功，非 0 表示业务错误（同时带 `message` 说明）。

## API 接口

见 [API.md](./API.md)。

## 注意

- 生产环境务必修改 `JWT_SECRET` 为随机长字符串。
- 小程序正式发布时，请求域名需在微信公众平台配置为 HTTPS + 已备案域名，本地开发可在开发者工具中关闭域名校验。
