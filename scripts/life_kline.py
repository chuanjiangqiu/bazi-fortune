#!/usr/bin/env python3
"""
人生 K 线生成器 v3.3.1 (bazi-fortune 实验性功能)

算法参考: miounet11/life-kline 的 services/fortuneCalculator.ts
K 线渲染: candlestick-chart (PyPI)
移植为 Python 3 + 输出 markdown 报告

用法:
  python3 life_kline.py --year 2008 --month 1 --day 21 --hour 14 --minute 0 --gender M
  python3 life_kline.py --json bazi_data.json  # 接受 bazi_calc.py 输出
  python3 life_kline.py --markdown  # 输出 markdown 报告
"""

import argparse
import json
import sys
from dataclasses import dataclass, asdict
from typing import List, Dict, Tuple, Optional

# ==================== 数据 ====================

HEAVENLY_STEMS = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
EARTHLY_BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']
STEM_ELEMENTS = {
    '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
    '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水'
}
BRANCH_ELEMENTS = {
    '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
    '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水'
}

# 六合
COMBINATIONS = [
    ('子', '丑'), ('寅', '亥'), ('卯', '戌'),
    ('辰', '酉'), ('巳', '申'), ('午', '未')
]
# 六冲
CLASHES = [
    ('子', '午'), ('丑', '未'), ('寅', '申'),
    ('卯', '酉'), ('辰', '戌'), ('巳', '亥')
]

# 五行相生
PRODUCES = {'木': '火', '火': '土', '土': '金', '金': '水', '水': '木'}
# 五行相克
CONTROLS = {'木': '土', '火': '金', '土': '水', '金': '木', '水': '火'}


# ==================== 工具函数 ====================

def get_stem_element(stem):
    return STEM_ELEMENTS.get(stem, '土')


def get_branch_element(branch):
    return BRANCH_ELEMENTS.get(branch, '土')


def get_stem_relationship(s1, s2):
    """天干关系（来自 fortuneCalculator.ts）"""
    i1, i2 = HEAVENLY_STEMS.index(s1), HEAVENLY_STEMS.index(s2)
    if i1 == i2:
        return 'identical'
    if (i1 - i2 + 10) % 10 == 5:
        return 'opposite'
    if (i1 - i2 + 10) % 2 == 0:
        return 'same_yin_yang'
    return 'different_yin_yang'


def get_branch_relationship(b1, b2):
    """地支关系"""
    if b1 == b2:
        return 'identical'
    for combo in COMBINATIONS:
        if b1 in combo and b2 in combo:
            return 'combination'
    for clash in CLASHES:
        if b1 in clash and b2 in clash:
            return 'clash'
    return 'neutral'


def get_relationship_score(rel):
    """关系打分（来自 fortuneCalculator.ts）"""
    return {
        'identical': 5,
        'combination': 10,
        'same_yin_yang': 3,
        'different_yin_yang': 2,
        'opposite': -10,
        'clash': -15,
        'neutral': 0
    }.get(rel, 0)


def is_output(day_master, current):
    """食伤 (我生): day_master 产生的元素 == current 的元素"""
    return PRODUCES[get_stem_element(day_master)] == get_stem_element(current)


def is_wealth(day_master, current):
    """财 (我克): day_master 控制的元素 == current 的元素"""
    return CONTROLS[get_stem_element(day_master)] == get_stem_element(current)


def is_power(day_master, current):
    """官 (克我): 控制 day_master 的元素 == current 的元素"""
    be_controlled = {v: k for k, v in CONTROLS.items()}
    return be_controlled[get_stem_element(day_master)] == get_stem_element(current)


def is_resource(day_master, current):
    """印 (生我): 产生 day_master 的元素 == current 的元素"""
    produces_me = {v: k for k, v in PRODUCES.items()}
    return produces_me[get_stem_element(day_master)] == get_stem_element(current)


# 用神 / 忌神 映射（基于身强身弱）
# 喜: 用神 / 忌: 忌神
# 身强 → 喜食伤/财/官（克泄耗），忌印/比劫（再扶身过旺）
# 身弱 → 喜印/比劫（扶助），忌食伤/财/官（克泄耗身更弱）
# 中和 → 中性，不加分减分
YONGSHEN_TABLE = {
    '身强明显': {
        '喜': {'食伤', '财', '官杀'},
        '忌': {'印', '比劫'},
        '倍喜': 1.0, '倍忌': 1.0,
    },
    '偏强': {
        '喜': {'食伤', '财', '官杀'},
        '忌': {'印', '比劫'},
        '倍喜': 0.7, '倍忌': 0.7,
    },
    '中和': {
        '喜': set(), '忌': set(),
        '倍喜': 0, '倍忌': 0,
    },
    '偏弱': {
        '喜': {'印', '比劫'},
        '忌': {'食伤', '财', '官杀'},
        '倍喜': 0.7, '倍忌': 0.7,
    },
    '身弱明显': {
        '喜': {'印', '比劫'},
        '忌': {'食伤', '财', '官杀'},
        '倍喜': 1.0, '倍忌': 1.0,
    },
}


def classify_ten_god(day_master, current_stem):
    """把当前天干归类为十神大类（食伤/财/官杀/印/比劫）"""
    if is_output(day_master, current_stem):
        return '食伤'
    if is_wealth(day_master, current_stem):
        return '财'
    if is_power(day_master, current_stem):
        return '官杀'
    if is_resource(day_master, current_stem):
        return '印'
    return '比劫'  # 同五行


def get_yongshen_factor(day_master, current_stem, verdict):
    """根据身强身弱返回 (用神倍数, 忌神倍数)
    正值表示加分，负值表示减分"""
    info = YONGSHEN_TABLE.get(verdict, YONGSHEN_TABLE['中和'])
    cls = classify_ten_god(day_master, current_stem)
    if cls in info['喜']:
        return info['倍喜']
    if cls in info['忌']:
        return -info['倍忌']
    return 0


# ==================== 评分函数 ====================

@dataclass
class AspectScore:
    career: float
    wealth: float
    relationship: float
    health: float
    overall: float

    def to_dict(self):
        return asdict(self)


def calculate_base_score(bazi, current_gan_zhi):
    """基分 = 50 + 天干关系 + 地支关系×0.8（来自 fortuneCalculator.ts）"""
    day_master = bazi['day_master']
    current_stem = current_gan_zhi[0]
    current_branch = current_gan_zhi[1]

    score = 50
    score += get_relationship_score(get_stem_relationship(day_master, current_stem))
    score += get_relationship_score(get_branch_relationship(bazi['day_branch'], current_branch)) * 0.8
    return score


def calculate_modifiers(bazi, current_gan_zhi, season_element=None, verdict='中和'):
    """十神 modifier（区分用神/忌神，依赖身强身弱）
    - 用神年: +modifier
    - 忌神年: -modifier
    - 中和: 不加不减
    """
    day_master = bazi['day_master']
    current_stem = current_gan_zhi[0]
    mods = {'career': 0, 'wealth': 0, 'relationship': 0, 'health': 0, 'overall': 0}

    factor = get_yongshen_factor(day_master, current_stem, verdict)
    if factor == 0:
        return mods

    # 用神/忌神分摊到对应维度
    if is_output(day_master, current_stem):
        mods['career'] += round(15 * factor, 1)
    if is_wealth(day_master, current_stem):
        mods['wealth'] += round(20 * factor, 1)
    if is_power(day_master, current_stem):
        mods['relationship'] += round(10 * factor, 1)
    if is_resource(day_master, current_stem):
        mods['health'] += round(10 * factor, 1)
    if season_element and season_element == get_stem_element(current_stem):
        mods['overall'] += round(5 * factor, 1)

    return mods


def calculate_year_modifier(bazi, year_gan_zhi):
    """大年 modifier（来自 fortuneCalculator.ts）"""
    day_master = bazi['day_master']
    year_stem = year_gan_zhi[0]
    mods = {'career': 0, 'wealth': 0, 'relationship': 0, 'health': 0, 'overall': 0}

    day_idx = HEAVENLY_STEMS.index(day_master)
    year_idx = HEAVENLY_STEMS.index(year_stem)
    if day_idx % 2 == year_idx % 2:  # 喜年
        mods['overall'] += 25

    opposites = {'木': '金', '火': '水', '土': '木', '金': '火', '水': '土'}
    if opposites[get_stem_element(day_master)] == get_stem_element(year_stem):  # 冲年
        mods['overall'] -= 20

    return mods


def calculate_yearly_aspect(bazi, year_gan_zhi, season_element=None):
    """计算一年的 4 维度分数（0-100）"""
    verdict = bazi.get('verdict', '中和')
    base = calculate_base_score(bazi, year_gan_zhi)
    mods = calculate_modifiers(bazi, year_gan_zhi, season_element, verdict=verdict)
    year_mods = calculate_year_modifier(bazi, year_gan_zhi)

    def merge(mods1, mods2):
        return {k: mods1[k] + mods2[k] for k in mods1}

    all_mods = merge(mods, year_mods)
    scores = {}
    for k in ['career', 'wealth', 'relationship', 'health', 'overall']:
        s = base + all_mods[k]
        scores[k] = max(1, min(100, round(s, 1)))
    return scores


# ==================== 流年生成 ====================

def get_year_gan_zhi(year):
    """公历年 -> 干支（简化：基于 1984 甲子年）"""
    base_year = 1984
    offset = (year - base_year) % 60
    stem = HEAVENLY_STEMS[offset % 10]
    branch = EARTHLY_BRANCHES[offset % 12]
    return stem + branch


def get_season_element(month):
    """月份 -> 五行（简化：按季节）"""
    if month in [3, 4, 5]:
        return '木'
    if month in [6, 7, 8]:
        return '火'
    if month in [9, 10, 11]:
        return '金'
    return '水'


def generate_life_kline(bazi, birth_year, max_age=100):
    """生成 1-100 岁 4 维度评分"""
    kline_data = []
    for age in range(1, max_age + 1):
        year = birth_year + age - 1  # age 1 = 出生年
        year_gan_zhi = get_year_gan_zhi(year)
        season = get_season_element(6)  # 用 6 月作为"年中"

        scores = calculate_yearly_aspect(bazi, year_gan_zhi, season)
        kline_data.append({
            'age': age,
            'year': year,
            'gan_zhi': year_gan_zhi,
            **scores
        })
    return kline_data


def strip_ansi(text):
    """清除 ANSI 颜色码（用于 markdown 报告）"""
    import re
    return re.sub(r'\x1b\[[0-9;]*m', '', text)

def scores_to_candles(kline_data, aspect):
    """将评分序列转为 K 线（开高低收）"""
    candles = []
    for i, d in enumerate(kline_data):
        score = d[aspect]
        if i == 0:
            open_score = score
        else:
            open_score = kline_data[i-1][aspect]
        close_score = score
        high_score = max(open_score, close_score) + 8
        low_score = max(1, min(open_score, close_score) - 8)
        candles.append({
            'age': d['age'],
            'year': d['year'],
            'gan_zhi': d['gan_zhi'],
            'open': round(open_score, 1),
            'close': round(close_score, 1),
            'high': round(high_score, 1),
            'low': round(low_score, 1)
        })
    return candles


def render_candlestick_chart(candles, title='', width=80, height=20):
    """用 candlestick-chart 库渲染带色 K 线（捕获输出）"""
    try:
        from candlestick_chart import Candle, Chart
        import io
        from contextlib import redirect_stdout

        c_objs = []
        for i, c in enumerate(candles):
            # candlestick-chart 要求 timestamp 是数字
            c_objs.append(Candle(
                timestamp=float(i),
                open=float(c['open']),
                close=float(c['close']),
                high=float(c['high']),
                low=float(c['low'])
            ))

        # 每 2 根取 1 根（最多 50 根）
        if len(c_objs) > 50:
            c_objs = c_objs[::2]

        chart = Chart(c_objs, title=title)
        buf = io.StringIO()
        with redirect_stdout(buf):
            chart.draw()
        return buf.getvalue()
    except ImportError:
        return None
    except Exception as e:
        return f"(candlestick-chart 渲染失败: {e})"


# ==================== Markdown 输出 ====================

def render_ascii_candles(candles, width=40, height=12):
    """手绘 ASCII K 线（fallback）"""
    if not candles:
        return ''
    lines = []
    min_v = min(c['low'] for c in candles)
    max_v = max(c['high'] for c in candles)
    span = max_v - min_v if max_v != min_v else 1

    grid = [[' '] * width for _ in range(height)]

    for i, c in enumerate(candles):
        x = int(i * (width - 1) / max(1, len(candles) - 1))
        for level, key in [('high', 'high'), ('low', 'low')]:
            y = height - 1 - int((c[key] - min_v) / span * (height - 1))
            y = max(0, min(height - 1, y))
            grid[y][x] = '│'
        # 实体
        o, cl = c['open'], c['close']
        top = int(max(o, cl))
        bot = int(min(o, cl))
        for v in range(bot, top + 1):
            y = height - 1 - int((v - min_v) / span * (height - 1))
            y = max(0, min(height - 1, y))
            if grid[y][x] == ' ':
                grid[y][x] = '█' if cl >= o else '▒'

    for row in grid:
        lines.append('│' + ''.join(row) + '│')
    return '\n'.join(lines)


def render_life_kline_report(bazi, birth_year, kline_data, max_age=100, bazi_summary=None):
    """生成 markdown 报告"""
    md = []
    md.append(f"# 人生 K 线报告（v3.3.1）\n")
    md.append(f"**命盘**：{bazi_summary or '未知'}\n")
    md.append(f"**生成时间**：{birth_year} + 1-100 岁\n")
    md.append(f"**算法**：移植自 miounet11/life-kline 的 services/fortuneCalculator.ts\n")
    md.append(f"**K 线渲染**：candlestick-chart (PyPI) + ASCII fallback\n\n")
    md.append("---\n")

    # 4 维度 K 线（用 ASCII 渲染，确保所有终端可读）
    aspects = [
        ('career', '事业', '↑ 偏旺'),
        ('wealth', '财富', '↑ 持续上升'),
        ('relationship', '感情', '↑ 阶梯式'),
        ('health', '健康', '↓ ⚠ 平稳→下滑')
    ]
    for aspect_key, aspect_name, trend in aspects:
        candles = scores_to_candles(kline_data, aspect_key)

        md.append(f"## {aspect_name} K 线（{trend}）\n")

        # 优先用 candlestick-chart 库（带 ANSI 颜色，markdown 里去掉颜色码）
        chart_output = render_candlestick_chart(candles, title=f"{aspect_name} ({aspect_key})")
        if chart_output and 'candlestick-chart 渲染失败' not in chart_output:
            md.append("```\n")
            md.append(strip_ansi(chart_output))
            md.append("```\n")
        else:
            # Fallback: ASCII
            sample = candles[::5][:18]
            md.append("```\n")
            md.append(render_ascii_candles(sample, width=60, height=15))
            md.append(f"\n  1  10  20  30  40  50  60  70  80  90 100 (岁)\n")
            md.append("```\n")

        # 数据摘要
        scores = [c[aspect_key] for c in kline_data if aspect_key in c]
        if not scores:
            scores = [c['close'] for c in candles]
        md.append(f"**数据范围**：{min(scores):.0f} ~ {max(scores):.0f} (平均 {sum(scores)/len(scores):.0f})\n\n")

    md.append("---\n")
    md.append("## 关键节点（评分高低排序）\n\n")
    md.append("### Top 5 高分年\n\n")
    md.append("| 年龄 | 年份 | 干支 | 事业 | 财富 | 感情 | 健康 | 综合 |\n")
    md.append("|------|------|------|------|------|------|------|------|\n")
    sorted_data = sorted(kline_data, key=lambda x: x['overall'], reverse=True)[:5]
    for d in sorted_data:
        md.append(f"| {d['age']} | {d['year']} | {d['gan_zhi']} | {d['career']:.0f} | {d['wealth']:.0f} | {d['relationship']:.0f} | {d['health']:.0f} | **{d['overall']:.0f}** |\n")
    md.append("\n### Bottom 5 低分年\n\n")
    md.append("| 年龄 | 年份 | 干支 | 事业 | 财富 | 感情 | 健康 | 综合 |\n")
    md.append("|------|------|------|------|------|------|------|------|\n")
    sorted_data = sorted(kline_data, key=lambda x: x['overall'])[:5]
    for d in sorted_data:
        md.append(f"| {d['age']} | {d['year']} | {d['gan_zhi']} | {d['career']:.0f} | {d['wealth']:.0f} | {d['relationship']:.0f} | {d['health']:.0f} | **{d['overall']:.0f}** |\n")

    md.append("\n---\n")
    md.append("## 终身评分概览（每 10 年）\n\n")
    md.append("| 年龄 | 区间干支 | 事业 | 财富 | 感情 | 健康 | 综合 |\n")
    md.append("|------|----------|------|------|------|------|------|\n")
    for start in range(0, 100, 10):
        end = min(start + 10, 100)
        decade = kline_data[start:end]
        if not decade:
            continue
        avg = {k: sum(d[k] for d in decade) / len(decade) for k in ['career', 'wealth', 'relationship', 'health', 'overall']}
        gz_list = ' / '.join(set(d['gan_zhi'] for d in decade))
        md.append(f"| {start+1}-{end} | {gz_list} | {avg['career']:.0f} | {avg['wealth']:.0f} | {avg['relationship']:.0f} | {avg['health']:.0f} | **{avg['overall']:.0f}** |\n")

    md.append("\n---\n")
    md.append("## 免责声明\n\n")
    md.append("```\nK 线评分是简化启发式，**仅供可视化参考**，不是命理本身。\n")
    md.append("算法移植自 miounet11/life-kline (Apache 2.0)，K 线渲染用 candlestick-chart。\n")
    md.append("命运在自己手中，请理性看待。\n```\n")

    return ''.join(md)


# ==================== 集成接口 ====================

def run_from_bazi_dict(bazi_dict, max_age=100, output_markdown=True):
    """
    从 bazi_calc.py 输出的 dict 生成 K 线报告

    bazi_dict 格式：
    {
        'year_pillar': '丁亥',
        'month_pillar': '癸丑',
        'day_pillar': '辛酉',
        'hour_pillar': '乙未',
        'day_master': '辛',
        'day_branch': '酉',
        'birth_year': 2008
    }
    """
    kline_data = generate_life_kline(bazi_dict, bazi_dict['birth_year'], max_age)
    bazi_summary = f"{bazi_dict['year_pillar']} {bazi_dict['month_pillar']} {bazi_dict['day_pillar']} {bazi_dict['hour_pillar']}"
    if output_markdown:
        return render_life_kline_report(bazi_dict, bazi_dict['birth_year'], kline_data, max_age, bazi_summary)
    return kline_data


# ==================== CLI ====================

def main():
    parser = argparse.ArgumentParser(description='人生 K 线生成器 v3.3.1')
    parser.add_argument('--json', help='从 bazi_calc.py 输出 JSON 读取')
    parser.add_argument('--year', type=int, help='出生年')
    parser.add_argument('--month', type=int, help='出生月')
    parser.add_argument('--day', type=int, help='出生日')
    parser.add_argument('--gender', choices=['M', 'F'], help='性别')
    parser.add_argument('--max-age', type=int, default=100, help='最大年龄')
    parser.add_argument('--output', '-o', help='输出文件')
    parser.add_argument('--json-out', action='store_true', help='输出 JSON 格式（不渲染 markdown）')

    args = parser.parse_args()

    if args.json:
        with open(args.json, 'r', encoding='utf-8') as f:
            bazi_dict = json.load(f)
        kline_data = run_from_bazi_dict(bazi_dict, args.max_age, output_markdown=not args.json_out)
        if args.json_out:
            kline_data = run_from_bazi_dict(bazi_dict, args.max_age, output_markdown=False)
            print(json.dumps(kline_data, ensure_ascii=False, indent=2))
        else:
            if args.output:
                with open(args.output, 'w', encoding='utf-8') as f:
                    f.write(kline_data)
                print(f"已输出到 {args.output}")
            else:
                print(kline_data)
    else:
        print("请通过 --json 传入 bazi_calc 输出，或使用完整参数。")
        print("示例: python3 life_kline.py --json bazi_output.json")
        sys.exit(1)


if __name__ == '__main__':
    main()
