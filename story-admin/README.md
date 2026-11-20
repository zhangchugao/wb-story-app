# 听故事 · 后台管理系统

Vue 3 + TypeScript + SCSS + Vite 构建的听故事内容管理后台，配套 Node.js 后端（复用 `story-backend` 的 API 与数据库）。

## 技术栈

- Vue 3（Composition API + `<script setup>`）
- TypeScript（strict 模式）
- SCSS
- Vite 6
- Element Plus（按需引入）
- Pinia（状态管理）
- Vue Router（Hash 模式）
- Axios（请求封装）

## 快速开始

```bash
# 1. 先启动后端（另开一个终端）
cd ../story-backend
npm start

# 2. 启动前端
cd story-admin
npm install
npm run dev
```

打开 http://localhost:5173

> 如果 `npm run dev` 因环境的文件删除安全策略崩溃（Vite 依赖预构建清理被拦），改用：
> `npm run build && npm run serve`，然后打开 http://localhost:5180。
> `serve` 是一个零依赖的预览服务器，托管 `dist/` 并把 `/api` 代理到后端，效果等同开发环境。

默认账号：`admin` / `admin123`（在 `story-backend/.env` 里用 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 修改）

## 功能

| 模块 | 说明 |
|---|---|
| 概览 | 故事数/上架数/听友数/总播放量统计，分类分布、热门榜 |
| 故事管理 | 列表、搜索筛选、新增/编辑、上下架、删除、分集管理 |
| 分类管理 | 分类增删改、排序权重调整 |
| 热搜词 | 小程序搜索页热词的增删 |
| 用户管理 | 听友列表、收藏/收听记录数 |
| 资源管理 | 音频/封面上传，生成路径填入故事表单 |

## 目录结构

```
src/
├── api/          # axios 封装与各模块接口
├── router/       # 路由与登录守卫
├── store/        # pinia 管理端登录态
├── styles/       # 全局 SCSS 主题（薄荷绿）
├── layouts/      # 主布局（侧边栏 + 顶栏）
├── views/        # 各功能页面
├── types/        # TS 类型定义
└── utils/        # 工具
```

## 构建

```bash
npm run build     # vue-tsc 类型检查 + vite 生产构建
npm run preview   # 预览生产包
```

构建产物在 `dist/`。Element Plus 已做按需引入，主包 gzip 后约 92KB。

## 与后端的关系

前端通过 Vite 开发代理（`/api` → `http://localhost:3000`）访问后端管理接口，与小程序共用同一个 SQLite 数据库和故事数据。后端管理接口见 `story-backend/API.md` 的「管理端」部分（或源码 `src/routes/admin.routes.js`）。

生产部署时，把前端 `dist/` 部署为静态站点，并将 `/api` 反向代理到后端服务即可。

## H5 / 移动端适配

后台已做响应式适配，手机浏览器可正常操作：

- **< 768px**：侧边栏自动收起为左上角汉堡菜单，点击滑出抽屉导航
- **表格**：在容器内横向滑动，不再撑破整页布局
- **弹窗**：宽度自适应屏幕（左右留边），表单可完整填写
- **筛选栏**：搜索框独占一行，下拉框平分宽度
- **分页**：窄屏隐藏「每页条数」，只保留翻页
- 统计卡片在手机上自动切为单列
- 适配刘海屏（viewport-fit=cover）与安全区

## 注意

- 后端需先启动，否则页面数据为空（axios 拦截器会提示网络错误）。
- 上传的音频在后端 `storage/audio/`，封面在 `storage/static/`。
- 种子数据里的音频/封面是占位路径，需在「资源管理」上传真实文件后，把路径填入故事。
