# 听故事小程序后端

Node.js + Express + MySQL 实现的听故事小程序后端服务，包含微信登录、故事内容、分集、收藏、播放历史与断点续听，以及供管理后台使用的管理端 API。

## 技术栈

- Node.js >= 18
- Express 4（HTTP 框架）
- MySQL 5.7+ + mysql2/promise（异步连接池，DAO 层统一封装）
- jsonwebtoken（登录鉴权）
- axios（微信 code2session / LibriVox 资源拉取）

> 原 SQLite 版代码已归档到 `_legacy/` 留底，不参与运行。数据库层为异步 DAO，所有 Service/路由均已配套 async 化。

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

## 数据库（MySQL）

服务启动时自动创建数据库、建表并写入种子数据（6 个故事、5 个分类）。配置在 `.env`：

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=story_app
```

手动重建种子数据（幂等，重复执行不会重复插入）：

```bash
npm run init-db
```

数据库为 utf8mb4，DAO 层所有 SQL 集中在 `src/dao/`，换库只需改这一层。

## 音频文件

把真实音频放进 `storage/audio/`，文件名需与故事/分集的 `audio_url` 对应。接口 `/api/audio/:filename` 支持 HTTP Range（206 分段响应），小程序拖动进度条依赖此特性。

封面图片放到 `storage/static/`，通过 `/static/xxx.png` 访问。

> 种子数据里的音频/封面路径是占位示例，需要你自己放入对应文件才能播放。

## LibriVox 故事批量导入

从 LibriVox（公有领域有声书）拉取童话/寓言作品，解析分集、生成封面、写入 MySQL：

```bash
node tools/import-librivox.js --dry-run                  # 只预览不入库
node tools/import-librivox.js --skip-download --limit 8  # 入库元数据+远程URL，不下载音频
node tools/import-librivox.js --limit 3 --episodes 5     # 下载前5集到本地并入库
node tools/import-librivox.js --retry-download           # 网络恢复后补下远程音频
node tools/import-librivox.js --keywords Aesop,Grimm     # 自定义搜索词
```

参数：`--limit`（作品数）、`--episodes`（每作品集数）、`--timeout`（单集下载超时毫秒）、`--skip-download`、`--dry-run`、`--retry-download`。

- 音频源文件托管在 archive.org（公有领域），需网络能访问该域名才能下载；不可达时用 `--skip-download` 入库元数据，之后用 `--retry-download` 补下。
- 下载失败的分集保留远程 `audio_url`，小程序端播放器会直接用该地址。
- 标题自动中文化（如 `Aesop's Fables Volume 12` → `伊索寓言·第12卷`）。
- 封面是脚本生成的渐变 SVG，存放在 `storage/static/`。
- 去重按标题判断，重复执行不会重复导入。

## edge-tts 公版童话合成（推荐，国内可直连）

archive.org 在国内常不可达，故事正文改用国内可直连的 edge-tts 自行合成，版权干净、零成本、零密钥：

```bash
pip install edge-tts
python tools/tts/synthesize.py --list                       # 列出内置公版童话
python tools/tts/synthesize.py --dry-run                    # 预览
python tools/tts/synthesize.py                              # 全部合成并入库
python tools/tts/synthesize.py --story little-red-riding-hood
python tools/tts/synthesize.py --replace-seed               # 替换同名占位故事的音频
python tools/tts/synthesize.py --rate -10%                  # 调语速
```

- 内置 8 个公版童话/寓言/科普/历史故事，文本在 `tools/tts/stories/fables.json`，可自行增删。
- 音色按人设分配：甜甜姐姐=`XiaoxiaoNeural`、阿哲哥哥=`YunxiNeural`、老韩=`YunyangNeural`。
- 每段文本合成一个分集 mp3，存 `storage/audio/`，生成渐变 SVG 封面，通过管理 API 自动入库（故事+分集）。
- `--replace-seed` 会复用库中同名故事、清空旧分集后写入新音频，用于把种子占位故事换成真实音频。
- 遇到偶发 `No audio was received` 是接口抖动，重跑一次即可。

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

## 背景音乐（BGM）

播放页的背景音乐由脚本程序化合成（自制内容，无版权风险），存放于 `storage/audio/bgm-*.mp3`：

```bash
pip install numpy lameenc
python tools/bgm/generate.py          # 生成全部 3 首（星光摇篮曲/细雨呢喃/梦境花园）
python tools/bgm/generate.py rain     # 只重新生成某一首
```

小程序播放页通过 `/api/audio/bgm-*.mp3` 加载，开关状态与选曲持久化在本地存储（`bgmEnabled` / `bgmTrack`）。
