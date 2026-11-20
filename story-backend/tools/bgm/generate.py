# -*- coding: utf-8 -*-
"""
程序化合成背景音乐（BGM）。
自制内容，版权完全归本项目，无任何第三方素材依赖。

用法：
    python tools/bgm/generate.py            # 生成全部 3 首
    python tools/bgm/generate.py starlight  # 只生成指定曲目

输出：storage/audio/bgm-*.mp3（96kbps 立体声，循环友好）
依赖：numpy, lameenc
"""
import sys
import numpy as np
import lameenc
from pathlib import Path

SR = 44100
OUT_DIR = Path(__file__).resolve().parents[2] / "storage" / "audio"


# ---------- 基础音色 ----------

def pluck(freq, dur, bright=1.0):
    """拨弦/八音盒音色：谐波衰减。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for h, amp, decay in [(1, 1.0, 3.5), (2, 0.45 * bright, 5.0), (3, 0.22 * bright, 7.0), (4, 0.1 * bright, 9.0)]:
        out += amp * np.sin(2 * np.pi * freq * h * t) * np.exp(-decay * t)
    # 轻微起音
    attack = int(SR * 0.004)
    out[:attack] *= np.linspace(0, 1, attack)
    return out


def pad(freqs, dur, vol=0.16, detune=0.15):
    """温暖弦乐垫：轻微失谐合唱 + 慢起音慢收尾。"""
    n = int(SR * dur)
    t = np.arange(n) / SR
    out = np.zeros(n)
    for f in freqs:
        for d in (-detune, detune):
            out += np.sin(2 * np.pi * f * (1 + d / 100) * t)
        out += 0.5 * np.sin(2 * np.pi * f / 2 * t)  # 低八度厚度
    # 慢包络
    env = np.ones(n)
    a = int(SR * min(1.8, dur * 0.25))
    r = int(SR * min(1.8, dur * 0.25))
    env[:a] = np.linspace(0, 1, a) ** 2
    env[-r:] *= np.linspace(1, 0, r) ** 2
    return out * env * vol / max(len(freqs), 1)


def rain_noise(dur):
    """柔化雨声：低通白噪声 + 慢波动。"""
    rng = np.random.default_rng(42)
    n = int(SR * dur)
    noise = rng.standard_normal(n)
    # 一阶低通（阻尼感）
    alpha = 0.12
    filtered = np.empty(n)
    acc = 0.0
    # 分块模拟一阶低通
    a = 1.0 - alpha
    filtered[0] = noise[0] * alpha
    for i in range(1, n):
        filtered[i] = alpha * noise[i] + a * filtered[i - 1]
    # 慢呼吸起伏
    t = np.arange(n) / SR
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.05 * t) * np.sin(2 * np.pi * 0.013 * t + 1.2)
    return filtered * lfo


def place(base, snd, start_sec, gain=1.0, pan=0.0):
    """把片段放进双轨（L/R），pan -1左 +1右（等功率）。"""
    i = int(start_sec * SR)
    n = min(len(snd), len(base[0]) - i)
    if n <= 0:
        return
    gl = gain * np.cos((pan + 1) * np.pi / 4)
    gr = gain * np.sin((pan + 1) * np.pi / 4)
    base[0][i:i + n] += snd[:n] * gl
    base[1][i:i + n] += snd[:n] * gr


NOTE = {n: 440.0 * 2 ** ((i - 9) / 12) for i, n in enumerate(
    ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"])}
def nf(name, octave):
    return NOTE[name] * 2 ** (octave - 4)


# ---------- 曲目 ----------

def track_starlight(total=64.0):
    """星光摇篮曲：八音盒 + 弦垫，C 大调 60BPM，睡前氛围。"""
    n = int(SR * total)
    buf = [np.zeros(n), np.zeros(n)]
    beat = 1.0  # 60 BPM
    bar = 4 * beat
    prog = [
        (["C", "E", "G"], 3), (["A", "C", "E"], 3),
        (["F", "A", "C"], 3), (["G", "B", "D"], 3),
    ]
    # 弦垫（每 2 小节一换）
    for b in range(0, int(total / (2 * bar))):
        chord, octv = prog[b % 4]
        freqs = [nf(c, octv) for c in chord]
        place(buf, pad(freqs, 2 * bar), b * 2 * bar, gain=1.0)
    # 八音盒旋律（五声音阶，随机但固定种子）
    rng = np.random.default_rng(7)
    pent = ["C", "D", "E", "G", "A"]
    t = 0.0
    step = 0
    while t < total - 2:
        dur = beat * (2 if step % 8 == 0 else 1)
        name = pent[rng.integers(0, len(pent))]
        octv = 5 if rng.random() < 0.65 else 6
        pan = float(rng.uniform(-0.4, 0.4))
        place(buf, pluck(nf(name, octv), dur * 2.2, bright=1.0), t, gain=0.30, pan=pan)
        # 低音点缀
        if step % 8 == 0:
            place(buf, pluck(nf(pent[step % 3], 3), dur * 3, bright=0.5), t, gain=0.22)
        t += dur
        step += 1
    return buf, "星光摇篮曲"


def track_rain(total=64.0):
    """细雨呢喃：柔雨声 + 暖垫，睡前白噪音。"""
    n = int(SR * total)
    buf = [np.zeros(n), np.zeros(n)]
    bar = 8.0
    prog = [
        (["D", "F", "A"], 3), (["B", "D", "F"], 3),
        (["G", "B", "D"], 3), (["A", "C", "E"], 3),
    ]
    for b in range(int(total / bar)):
        chord, octv = prog[b % 4]
        freqs = [nf(c, octv) for c in chord]
        place(buf, pad(freqs, bar, vol=0.20), b * bar)
    # 雨声（轻微左右差异）
    rain = rain_noise(total)
    place(buf, rain, 0, gain=0.045, pan=-0.25)
    place(buf, rain_noise(total), 0, gain=0.045, pan=0.25)
    # 偶发水滴
    rng = np.random.default_rng(11)
    for _ in range(14):
        t = float(rng.uniform(0, total - 3))
        place(buf, pluck(float(rng.uniform(900, 1600)), 1.2, bright=0.6), t, gain=0.10,
              pan=float(rng.uniform(-0.5, 0.5)))
    return buf, "细雨呢喃"


def track_garden(total=64.0):
    """梦境花园：竖琴琶音，F 大调，轻盈梦幻。"""
    n = int(SR * total)
    buf = [np.zeros(n), np.zeros(n)]
    beat = 0.75  # 80 BPM
    bar = 4 * beat
    prog = [
        (["F", "A", "C"], 3), (["D", "F", "A"], 3),
        (["B", "D", "F"], 3), (["C", "E", "G"], 3),
    ]
    for b in range(int(total / bar)):
        chord, octv = prog[b % 4]
        # 弦垫
        place(buf, pad([nf(c, octv) for c in chord], bar, vol=0.13), b * bar)
        # 竖琴琶音：上行-下行
        notes = [nf(c, 4) for c in chord] + [nf(chord[1], 5), nf(chord[0], 5)]
        seq = notes + notes[::-1][1:-1]
        for i, f in enumerate(seq):
            t = b * bar + i * beat / 2
            if t >= total - 1:
                break
            pan = -0.5 + i / max(len(seq) - 1, 1)
            place(buf, pluck(f, 2.0, bright=0.7), t, gain=0.26, pan=pan)
    return buf, "梦境花园"


# ---------- 编码输出 ----------

def to_mp3(buf, fade=1.5):
    l, r = buf
    peak = max(np.abs(l).max(), np.abs(r).max(), 1e-9)
    k = 0.72 / peak
    n = len(l)
    f = int(SR * fade)
    ramp_in = np.linspace(0, 1, f)
    ramp_out = np.linspace(1, 0, f)
    l *= k
    r *= k
    l[:f] *= ramp_in
    r[:f] *= ramp_in
    l[-f:] *= ramp_out
    r[-f:] *= ramp_out
    # 轻微限幅
    l = np.tanh(l)
    r = np.tanh(r)
    inter = np.empty(n * 2, dtype=np.int16)
    inter[0::2] = (l * 32767).astype(np.int16)
    inter[1::2] = (r * 32767).astype(np.int16)
    enc = lameenc.Encoder()
    enc.set_bit_rate(96)
    enc.set_in_sample_rate(SR)
    enc.set_channels(2)
    enc.set_quality(2)
    return enc.encode(inter.tobytes()) + enc.flush()


TRACKS = {"starlight": track_starlight, "rain": track_rain, "garden": track_garden}


def main():
    names = sys.argv[1:] or list(TRACKS)
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for name in names:
        fn = TRACKS.get(name)
        if not fn:
            print(f"未知曲目: {name}（可选: {', '.join(TRACKS)}）")
            continue
        buf, title = fn()
        data = to_mp3(buf)
        out = OUT_DIR / f"bgm-{name}.mp3"
        out.write_bytes(data)
        print(f"✓ {title} → {out.name}  {len(data) / 1024:.0f} KB  {len(buf[0]) / SR:.0f}s")


if __name__ == "__main__":
    main()
