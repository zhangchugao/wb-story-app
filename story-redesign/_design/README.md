# 听故事 ·「今夜的灯」改版交付包

> 方向：深夜蓝夜空 + 暖黄唯一光源 + 月亮灯签名（用户于 2026-11-23 选定，见 `../direction-approved.md`）
> 设计基准：**375 宽，1px = 2rpx**。screens/ 内截图为 750 宽（已按 2 倍矢量渲染导出，1px = 1rpx）。

## 包内清单

| 文件/目录 | 说明 |
|---|---|
| `screens/index.png` | 首页（home）：页眉日期 + 「接着讲」继续听窗 + 分类胶囊 + 横滑在听 |
| `screens/category.png` | 分类页：按孩子状态分（晚安盒/磨耳朵/涨知识/老故事） |
| `screens/search.png` | 搜索页：演示态「月亮」1 条结果；清空后为空状态（引导第一个故事） |
| `screens/mine.png` | 我的页：陪听统计 + 哄睡提醒卡 + 收藏/历史入口 |
| `screens/detail.png` | 详情页：封面大图 + 简介 + 章节（多集连播） |
| `screens/player.png` | 播放页（签名屏）：月亮灯呼吸光晕 + 熄灯暗场 + 定时循环 |
| `screens/history.png` | 收听历史：按日期分组，讲完的置灰，只剩未听完的有播放钮 |
| `share-1.png` | 转发卡片图（**5:4**，1000×800，月亮的秘密） |
| `images/` | 7 张 AI 生成绘本插画（JPG，最长边 1000px，共 794KB） |
| `tokens.json` | 颜色 / 字号 / 圆角 / 间距 / tabBar 参数 |
| `给WorkBuddy的话.md` | 可直接粘贴给 WorkBuddy 的开工说明 |

原设计稿（可交互）：`../design-demos/dir-1-final.html`（双击浏览器打开，7 屏均可点击、熄灯与定时可操作）。

## 页面清单（app.json 骨架，与现有工程一致）

```json
{
  "pages": [
    "pages/index/index",
    "pages/category/category",
    "pages/search/search",
    "pages/mine/mine",
    "pages/detail/detail",
    "pages/player/player",
    "pages/history/history"
  ],
  "window": {
    "navigationBarTitleText": "听故事",
    "navigationBarBackgroundColor": "#0F1B33",
    "navigationBarTextStyle": "white",
    "backgroundColor": "#0F1B33",
    "backgroundTextStyle": "light"
  },
  "tabBar": {
    "color": "#93A0BF",
    "selectedColor": "#F5C97B",
    "backgroundColor": "#121D36",
    "borderStyle": "black",
    "list": [
      { "pagePath": "pages/index/index", "text": "首页", "iconPath": "assets/tabbar/home.png", "selectedIconPath": "assets/tabbar/home-active.png" },
      { "pagePath": "pages/category/category", "text": "分类", "iconPath": "assets/tabbar/category.png", "selectedIconPath": "assets/tabbar/category-active.png" },
      { "pagePath": "pages/search/search", "text": "搜索", "iconPath": "assets/tabbar/search.png", "selectedIconPath": "assets/tabbar/search-active.png" },
      { "pagePath": "pages/mine/mine", "text": "我的", "iconPath": "assets/tabbar/mine.png", "selectedIconPath": "assets/tabbar/mine-active.png" }
    ]
  },
  "style": "v2",
  "lazyCodeLoading": "requiredComponents"
}
```

注意：tabBar 图标需按新配色重绘（PNG 81×81，选中态 #F5C97B，未选中 #93A0BF，线性图标：房子/四方格/放大镜/人形）。

## 体检（人工逐屏核对结果）

- ✗ 字压胶囊：7 屏均无文字/按钮压在右上角胶囊上（胶囊左侧留空）——通过
- ✗ tab 数量：4 个（2–5 规格内）——通过
- ✗ 转发卡片：5:4（1000×800）——通过
- ✗ 字号底线：全站最小 12px（375 基准；tabBar 文字为微信原生渲染）——已修正（原 10.5/11.5px 均升到 12px）
- ✗ 图片体积：插画 7 张共 794KB；若最终打包超限，可把 detail 封面压到最长边 800px（预计再省 ~150KB）——通过
- ！可滚屏截图为首屏状态：搜索结果、详情章节、历史列表在真机里可滚动，长图未导出（以可交互 HTML 稿为准）
- ！熄灯态（dim）：播放页点「熄灯」进入，背景换 #0A1226→#101B36、光晕减弱、封面叠暗层——开发时按 tokens.json 的 signature.dimMode 实现

## 设计意图备忘（开发时容易走样的三处）

1. **光只给正在发生的事**：全站只有一个暖黄光源。插画之外的暖色只出现在：继续听按钮、播放钮、定时/熄灯选中态、tabBar 选中——别的元素一律夜色透明卡。
2. **建议句文案**：全程陈述句/建议句（「今晚适合听这个」「把手机放到远处，声音刚刚好」），不用红点、感叹号、排名、「限时」等运营语气。
3. **继续听是首屏主角**：首页第一屏 40% 给「接着讲昨晚的故事」，分类与推荐都在其下；任何「运营 banner」都不得插到它前面。
