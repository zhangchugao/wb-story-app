#!/usr/bin/env python3
"""
公版童话 TTS 批量合成脚本（edge-tts，免费、国内可直连）

流程：读取 stories/*.json → 逐段合成 mp3 → 生成封面 SVG → 调后端管理 API 入库

用法：
  python tools/tts/synthesize.py --list                    # 列出内置故事
  python tools/tts/synthesize.py --dry-run                 # 只预览，不合成不入库
  python tools/tts/synthesize.py --story little-red-riding-hood
  python tools/tts/synthesize.py --rate -10%               # 调整语速
  python tools/tts/synthesize.py --no-upload               # 只合成不入库
"""

import argparse
import asyncio
import json
import os
import sys
import urllib.request
import urllib.parse
from pathlib import Path

import edge_tts

ROOT = Path(__file__).resolve().parents[2]          # story-backend/
STORIES_DIR = Path(__file__).resolve().parent / "stories"
AUDIO_DIR = ROOT / "storage" / "audio"
STATIC_DIR = ROOT / "storage" / "static"
API_BASE = os.environ.get("API_BASE", "http://localhost:3000/api")
ADMIN_USER = os.environ.get("ADMIN_USER", "admin")
ADMIN_PASS = os.environ.get("ADMIN_PASS", "admin123")

PALETTE = [
    ("#FFAB91", "#FF7043"), ("#80DEB1", "#10B981"), ("#92B4F4", "#3B82F6"),
    ("#FFD166", "#F59E0B"), ("#B39DDB", "#8B5CF6"), ("#6FCFBF", "#0891B2"),
]


def load_stories():
    items = []
    for f in sorted(STORIES_DIR.glob("*.json")):
        with open(f, encoding="utf-8") as fp:
            data = json.load(fp)
        if isinstance(data, list):
            items.extend(data)
        else:
            items.append(data)
    return items


def http_json(method, url, data=None, token=None):
    """极简 HTTP JSON 客户端，仅用标准库"""
    body = json.dumps(data).encode("utf-8") if data is not None else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = "Bearer " + token
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def admin_token():
    res = http_json("POST", API_BASE + "/admin/login", {"username": ADMIN_USER, "password": ADMIN_PASS})
    if res.get("code") != 0:
        raise RuntimeError("管理员登录失败: " + res.get("message", ""))
    return res["data"]["token"]


def find_story(token, title):
    """返回已存在故事的 id，否则 None"""
    res = http_json("GET", API_BASE + "/admin/stories?keyword=" + urllib.parse.quote(title), token=token)
    if res.get("code") == 0:
        for s in res["data"].get("list", []):
            if s["title"] == title:
                return s["id"]
    return None


def create_story(token, story, cover_url, duration):
    payload = {
        "title": story["title"],
        "author": story.get("author", ""),
        "narrator": story.get("narrator", ""),
        "category_id": story.get("category", 1),
        "cover_url": cover_url,
        "description": story.get("summary", ""),
        "audio_url": "",
        "duration": duration,
        "status": 1,
        "sort_order": 50,
    }
    res = http_json("POST", API_BASE + "/admin/stories", payload, token)
    if res.get("code") != 0:
        raise RuntimeError("创建故事失败: " + res.get("message", ""))
    return res["data"]["id"]


def create_episode(token, story_id, title, episode_no, audio_url, duration):
    payload = {"title": title, "episode_no": episode_no, "audio_url": audio_url, "duration": duration}
    res = http_json("POST", API_BASE + f"/admin/stories/{story_id}/episodes", payload, token)
    if res.get("code") != 0:
        raise RuntimeError("创建分集失败: " + res.get("message", ""))
    return res["data"]["id"]


def make_cover(title, index):
    from_color, to_color = PALETTE[index % len(PALETTE)]
    safe = (title[:14]).replace("&", "&amp;").replace("<", "&lt;")
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{from_color}"/><stop offset="1" stop-color="{to_color}"/></linearGradient></defs>
<rect width="400" height="400" fill="url(#g)"/>
<circle cx="330" cy="70" r="110" fill="rgba(255,255,255,0.12)"/>
<text x="200" y="210" font-size="40" fill="#fff" font-family="sans-serif" font-weight="bold" text-anchor="middle">{safe}</text>
<text x="200" y="270" font-size="17" fill="rgba(255,255,255,0.85)" font-family="sans-serif" text-anchor="middle">听故事 · 公版童话</text>
</svg>'''
    name = f"tts-{index}-{os.getpid()}.svg"
    (STATIC_DIR / name).write_text(svg, encoding="utf-8")
    return "/static/" + name


def clean_filename(text, idx):
    keep = "".join(c for c in text[:12] if c.isalnum() or c in "-_")
    return f"tts-{keep}-{idx}.mp3"


async def synthesize(text, voice, out_path, rate, volume):
    communicate = edge_tts.Communicate(text, voice, rate=rate, volume=volume)
    await communicate.save(str(out_path))


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--list", action="store_true", help="列出内置故事")
    parser.add_argument("--story", help="只处理指定 id")
    parser.add_argument("--dry-run", action="store_true", help="只预览")
    parser.add_argument("--no-upload", action="store_true", help="只合成不入库")
    parser.add_argument("--replace-seed", action="store_true", help="替换库中同名占位故事的音频")
    parser.add_argument("--rate", default="+0%", help="语速，如 -10%% +10%%")
    parser.add_argument("--volume", default="+0%", help="音量")
    args = parser.parse_args()

    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
    stories = load_stories()

    if args.list:
        print("内置故事：")
        for s in stories:
            print(f"  {s['id']:28} {s['title']:12} {len(s['parts'])} 集 | {s['voice']}")
        return

    if args.story:
        stories = [s for s in stories if s["id"] == args.story]
        if not stories:
            print(f"未找到故事: {args.story}")
            sys.exit(1)

    print(f"=== edge-tts 批量合成 === ({len(stories)} 个故事)")

    token = None if (args.dry_run or args.no_upload) else admin_token()
    total_audio = 0

    for idx, story in enumerate(stories):
        print(f"\n[{idx+1}/{len(stories)}] {story['title']} | {story['voice']} | {len(story['parts'])} 集")
        existing_id = find_story(token, story["title"]) if token else None
        if existing_id and not args.replace_seed:
            print("  库中已存在，跳过（如需替换占位故事用 --replace-seed）")
            continue
        if existing_id:
            print(f"  替换已有故事 id={existing_id} 的音频")

        cover_url = make_cover(story["title"], idx)
        total_dur = 0
        entries = []

        for i, part in enumerate(story["parts"]):
            fname = clean_filename(story["id"], i + 1)
            out = AUDIO_DIR / fname
            if args.dry_run:
                print(f"    集{i+1}: {part[:24]}... → {fname}")
                continue
            try:
                await synthesize(part, story["voice"], out, args.rate, args.volume)
                size = out.stat().st_size
                total_dur += len(part) // 4  # 粗略估算秒数（约4字/秒）
                entries.append((i + 1, part[:20], "/api/audio/" + fname, 0))
                total_audio += 1
                print(f"    ✓ 集{i+1}: {fname} ({size//1024}KB)")
            except Exception as e:
                print(f"    ✗ 集{i+1} 合成失败: {e}")

        if args.dry_run:
            continue

        if args.no_upload or not token:
            print("  跳过入库（--no-upload）")
            continue

        try:
            if existing_id:
                sid = existing_id
                # 删除旧分集（管理 API）
                old_eps = http_json("GET", API_BASE + f"/admin/stories/{sid}/episodes", token=token)
                if old_eps.get("code") == 0:
                    for ep in old_eps["data"]:
                        http_json("DELETE", API_BASE + f"/admin/episodes/{ep['id']}", token=token)
            else:
                sid = create_story(token, story, cover_url, total_dur)

            for ep_no, title, audio_url, dur in entries:
                create_episode(token, sid, f"第{ep_no}集 · {title}", ep_no, audio_url, 0)
            if entries:
                http_json("PUT", API_BASE + f"/admin/stories/{sid}",
                          {"audio_url": entries[0][2], "duration": total_dur, "cover_url": cover_url,
                           "narrator": story.get("narrator", "")}, token)
            print(f"  ✓ 已{'更新' if existing_id else '入库'} story_id={sid}")
        except Exception as e:
            print(f"  ✗ 入库失败: {e}")

    print(f"\n=== 完成 === 合成音频 {total_audio} 个")


if __name__ == "__main__":
    asyncio.run(main())
