# API 接口文档

Base URL：`http://localhost:3000/api`

统一响应：`{ "code": 0, "message": "ok", "data": ... }`，`code=0` 为成功。

需要登录的接口在请求头带：`Authorization: Bearer <token>`

---

## 公共接口

### 健康检查
`GET /health`

### 微信登录
`POST /auth/wx-login`

请求体：
```json
{ "code": "wx.login 返回的 code", "nickname": "选填", "avatarUrl": "选填" }
```
响应：
```json
{ "code": 0, "data": { "token": "...", "userInfo": { "id": 1, "openid": "...", "nickname": "听友" } } }
```

### 校验登录态
`GET /auth/check`（需登录）

---

## 故事内容

### 分类列表
`GET /stories/categories`

### 热门故事
`GET /stories/hot`

### 热搜词
`GET /stories/search/hot`

### 故事列表
`GET /stories?page=1&pageSize=20&categoryId=1&keyword=小红帽&sort=hot`

| 参数 | 说明 |
|---|---|
| page | 页码，默认 1 |
| pageSize | 每页条数，默认 20，最大 50 |
| categoryId | 分类 ID，选填 |
| keyword | 搜索关键词，选填 |
| sort | `hot` 按播放量 / `new` 按最新 / 默认按排序权重 |

### 故事详情（含分集、收藏状态、播放进度）
`GET /stories/:id`（带 token 时返回 `favorited` 与 `progress`）

```json
{
  "code": 0,
  "data": {
    "id": 1,
    "title": "小红帽",
    "narrator": "甜甜姐姐",
    "duration": 312,
    "episodes": [],
    "favorited": false,
    "progress": null
  }
}
```

### 上报播放量
`POST /stories/:id/play`

### 音频流（支持 Range）
`GET /audio/:filename`

---

## 用户接口（均需登录）

### 我的资料
`GET /user/profile`

### 更新资料
`PUT /user/profile`
```json
{ "nickname": "新昵称", "avatarUrl": "https://..." }
```

### 我的收藏
`GET /user/favorites`

### 收藏 / 取消收藏（切换）
`POST /user/favorites/:storyId` → 返回 `{ "favorited": true/false }`

### 删除收藏
`DELETE /user/favorites/:storyId`

### 播放历史
`GET /user/history`

### 清空历史
`DELETE /user/history`

### 获取某故事进度
`GET /user/progress/:storyId`

### 上报播放进度（断点续听）
`POST /user/progress`
```json
{ "storyId": 1, "episodeId": null, "position": 120 }
```
> `position` 单位：秒。前端在 audio 的 `timeupdate` 中节流上报（例如每 5 秒一次，暂停/退出时再报一次）。

---

## 管理端接口（供 story-admin 使用）

Base：`http://localhost:3000/api/admin`，除登录外均需 `Authorization: Bearer <adminToken>`（管理员 JWT 与小程序用户 token 隔离）。

### 管理员登录
`POST /admin/login` → `{ token, userInfo }`，默认账号 `admin` / `admin123`

### 校验 / 统计
- `GET /admin/check`
- `GET /admin/stats` → 故事数/上架数/用户数/播放量/分类分布/Top5

### 故事
- `GET /admin/stories?page=&pageSize=&keyword=&categoryId=&status=`
- `POST /admin/stories`（body：title 必填，其余见 StoryPayload）
- `PUT /admin/stories/:id`
- `DELETE /admin/stories/:id`（级联删分集/收藏/历史）
- `POST /admin/stories/:id/status` → `{ status: 0|1 }`

### 分集
- `GET /admin/stories/:id/episodes`
- `POST /admin/stories/:id/episodes` → `{ title, episode_no, audio_url, duration }`
- `PUT /admin/episodes/:id`
- `DELETE /admin/episodes/:id`

### 分类
- `GET /admin/categories`
- `POST /admin/categories` → `{ name, icon, sort_order }`
- `PUT /admin/categories/:id`
- `DELETE /admin/categories/:id`（分类下有故事时拒绝）

### 热搜词
- `GET /admin/hot-keywords`
- `POST /admin/hot-keywords` → `{ keyword, weight, sort_order }`
- `DELETE /admin/hot-keywords/:id`

### 用户
- `GET /admin/users?page=&pageSize=&keyword=`

### 文件上传（需管理员鉴权）
- `POST /admin/upload/audio`（multipart，字段名 `file`）→ `{ url, filename }`
- `POST /admin/upload/image`（multipart，字段名 `file`）→ `{ url, filename }`
