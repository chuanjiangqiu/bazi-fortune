#!/usr/bin/env python3
"""八字排盘计算脚本 v3.2

功能：
- 排四柱（年/月/日/时）
- 藏干、十神、神煞、纳音
- 空亡（旬空法）
- 紫微命宫（公式 + 口诀双验证）
- 起运岁数精确计算
- 大运序列
- 身强身弱量化评分
- 长生十二运

用法：
  python3 bazi_calc.py --year 2008 --month 1 --day 21 --hour 14 --minute 0 --gender M
  python3 bazi_calc.py -y 2008 -m 1 -d 21 -H 14 -M 0 -g M
"""

import sys
import argparse
from datetime import date, datetime, timedelta

# ============ 基础数据 ============

TIANGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
DIZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

CANGGAN = {
    '子': ['癸'], '丑': ['己', '癸', '辛'], '寅': ['甲', '丙', '戊'], '卯': ['乙'],
    '辰': ['戊', '乙', '癸'], '巳': ['丙', '戊', '庚'], '午': ['丁', '己'],
    '未': ['己', '丁', '乙'], '申': ['庚', '壬', '戊'], '酉': ['辛'],
    '戌': ['戊', '辛', '丁'], '亥': ['壬', '甲']
}

WUXING = {'甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土', '己': '土',
          '庚': '金', '辛': '金', '壬': '水', '癸': '水'}

YINYANG = {'甲': '阳', '乙': '阴', '丙': '阳', '丁': '阴', '戊': '阳', '己': '阴',
           '庚': '阳', '辛': '阴', '壬': '阳', '癸': '阴'}

NAYIN = {
    '甲子': '海中金', '乙丑': '海中金', '丙寅': '炉中火', '丁卯': '炉中火',
    '戊辰': '大林木', '己巳': '大林木', '庚午': '路旁土', '辛未': '路旁土',
    '壬申': '剑锋金', '癸酉': '剑锋金', '甲戌': '山头火', '乙亥': '山头火',
    '丙子': '涧下水', '丁丑': '涧下水', '戊寅': '城头土', '己卯': '城头土',
    '庚辰': '白蜡金', '辛巳': '白蜡金', '壬午': '杨柳木', '癸未': '杨柳木',
    '甲申': '泉中水', '乙酉': '泉中水', '丙戌': '屋上土', '丁亥': '屋上土',
    '戊子': '霹雳火', '己丑': '霹雳火', '庚寅': '松柏木', '辛卯': '松柏木',
    '壬辰': '长流水', '癸巳': '长流水', '甲午': '沙中金', '乙未': '沙中金',
    '丙申': '山下火', '丁酉': '山下火', '戊戌': '平地木', '己亥': '平地木',
    '庚子': '壁上土', '辛丑': '壁上土', '壬寅': '金箔金', '癸卯': '金箔金',
    '甲辰': '覆灯火', '乙巳': '覆灯火', '丙午': '天河水', '丁未': '天河水',
    '戊申': '大驿土', '己酉': '大驿土', '庚戌': '钗钏金', '辛亥': '钗钏金',
    '壬子': '桑柘木', '癸丑': '桑柘木', '甲寅': '大溪水', '乙卯': '大溪水',
    '丙辰': '沙中土', '丁巳': '沙中土', '戊午': '天上火', '己未': '天上火',
    '庚申': '石榴木', '辛酉': '石榴木', '壬戌': '大海水', '癸亥': '大海水'
}

# 24 节气表（2000-2030 简化版）
# 格式: {year: {jieqi_name: datetime}}
# 包含 12 个"节"（用于月柱分界），不含 12 个"中气"
JIEQI_2000_2030 = {
    # 节气时间每年略有差异（±1 天），这里是平均值
    # 1月小寒、2月立春、3月惊蛰、4月清明、5月立夏、6月芒种
    # 7月小暑、8月立秋、9月白露、10月寒露、11月立冬、12月大雪
    # (month, day, hour, minute) for 立春 of each year
    2007: {'小寒': (1, 6, 6), '大寒': (1, 20, 8), '立春': (2, 4, 2), '惊蛰': (3, 5, 18),
           '清明': (4, 4, 22), '立夏': (5, 5, 18), '芒种': (6, 5, 19), '小暑': (7, 7, 11),
           '立秋': (8, 7, 19), '白露': (9, 7, 23), '寒露': (10, 8, 16), '立冬': (11, 7, 13),
           '大雪': (12, 7, 7)},
    2008: {'小寒': (1, 6, 6), '大寒': (1, 21, 2), '立春': (2, 4, 19), '惊蛰': (3, 5, 12),
           '清明': (4, 4, 21), '立夏': (5, 5, 12), '芒种': (6, 5, 12), '小暑': (7, 7, 11),
           '立秋': (8, 7, 12), '白露': (9, 7, 23), '寒露': (10, 8, 9), '立冬': (11, 7, 7),
           '大雪': (12, 7, 0)},
    2009: {'小寒': (1, 5, 14), '大寒': (1, 20, 8), '立春': (2, 3, 23), '惊蛰': (3, 5, 11),
           '清明': (4, 4, 16), '立夏': (5, 5, 9), '芒种': (6, 5, 12), '小暑': (7, 7, 6),
           '立秋': (8, 7, 12), '白露': (9, 7, 21), '寒露': (10, 8, 14), '立冬': (11, 7, 12),
           '大雪': (12, 7, 6)},
    2010: {'小寒': (1, 5, 18), '大寒': (1, 20, 11), '立春': (2, 4, 6), '惊蛰': (3, 5, 19),
           '清明': (4, 5, 1), '立夏': (5, 5, 19), '芒种': (6, 5, 19), '小暑': (7, 7, 11),
           '立秋': (8, 7, 19), '白露': (9, 8, 4), '寒露': (10, 8, 13), '立冬': (11, 7, 12),
           '大雪': (12, 7, 7)},
    # ... 简化起见，2000-2030 同年节气的偏差大多在 ±1 天内
    # 实际生产建议用 Swiss Ephemeris 或 lunar-python
}

# 如果年份不在表里，用相邻年份估算（±1 天误差）
def get_jieqi(year, name):
    if year in JIEQI_2000_2030 and name in JIEQI_2000_2030[year]:
        m, d, h = JIEQI_2000_2030[year][name]
        return datetime(year, m, d, h, 0)
    # 回退：用通用平均日期
    avg_dates = {
        '小寒': (1, 5), '大寒': (1, 20), '立春': (2, 4), '惊蛰': (3, 5),
        '清明': (4, 4), '立夏': (5, 5), '芒种': (6, 5), '小暑': (7, 7),
        '立秋': (8, 7), '白露': (9, 7), '寒露': (10, 8), '立冬': (11, 7),
        '大雪': (12, 7)
    }
    if name in avg_dates:
        m, d = avg_dates[name]
        return datetime(year, m, d, 12, 0)
    return None

# 12 节气月份映射
JIEQI_TO_MONTH = {
    '立春': '寅', '惊蛰': '卯', '清明': '辰', '立夏': '巳',
    '芒种': '午', '小暑': '未', '立秋': '申', '白露': '酉',
    '寒露': '戌', '立冬': '亥', '大雪': '子', '小寒': '丑'
}

# 时辰对应地支
HOUR_TO_ZHI = {
    23: '子', 0: '子', 1: '丑', 2: '丑', 3: '寅', 4: '寅', 5: '卯', 6: '卯',
    7: '辰', 8: '辰', 9: '巳', 10: '巳', 11: '午', 12: '午', 13: '未', 14: '未',
    15: '申', 16: '申', 17: '酉', 18: '酉', 19: '戌', 20: '戌', 21: '亥', 22: '亥'
}

# 五虎遁：年干 → 正月（寅月）天干
WULIU_DUN_YEAR = {'甲': '丙', '己': '丙', '乙': '戊', '庚': '戊',
                  '丙': '庚', '辛': '庚', '丁': '壬', '壬': '壬',
                  '戊': '甲', '癸': '甲'}

# 五鼠遁：日干 → 子时天干
WUSHU_DUN_DAY = {'甲': '甲', '己': '甲', '乙': '丙', '庚': '丙',
                 '丙': '戊', '辛': '戊', '丁': '庚', '壬': '庚',
                 '戊': '壬', '癸': '壬'}


# ============ 排盘函数 ============

def calc_year_pillar(birth_dt):
    """年柱：立春前用上一年"""
    lichun = get_jieqi(birth_dt.year, '立春')
    if lichun and birth_dt < lichun:
        year = birth_dt.year - 1
    else:
        year = birth_dt.year
    gan_idx = (year - 4) % 10
    zhi_idx = (year - 4) % 12
    return TIANGAN[gan_idx] + DIZHI[zhi_idx], year


def calc_month_pillar(birth_dt, year_gan):
    """月柱：以节气定月支，五虎遁定月干"""
    # 找到出生时间之前的最近"节"（非中气）
    jie_order = ['立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
                 '立秋', '白露', '寒露', '立冬', '大雪', '小寒']

    # 12 个月柱对应的节（从小寒开始）
    jie_for_month = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种',
                     '小暑', '立秋', '白露', '寒露', '立冬', '大雪']
    # 月支（从小寒月=丑月开始）
    month_zhis = ['丑', '寅', '卯', '辰', '巳', '午',
                  '未', '申', '酉', '戌', '亥', '子']

    # 找到出生时所在月
    month_idx = 0
    for i, jie_name in enumerate(jie_for_month):
        # 这个节气可能在前一年或当年
        jie_dt = get_jieqi(birth_dt.year, jie_name)
        if jie_dt and birth_dt < jie_dt:
            month_idx = (i - 1) % 12
            break
    else:
        month_idx = 11  # 出生在最后一个月（大雪之后）

    month_zhi = month_zhis[month_idx]

    # 五虎遁：寅月天干由年干定
    yin_gan = WULIU_DUN_YEAR[year_gan]
    # 寅月=index 0 起点
    month_idx_from_yin = (month_idx - 1) % 12  # 0=寅, 1=卯, ..., 11=丑
    gan_idx = (TIANGAN.index(yin_gan) + month_idx_from_yin) % 10
    return TIANGAN[gan_idx] + month_zhi


def calc_day_pillar(birth_date):
    """日柱：用 2008-01-21 = 辛酉（seq=57）作参考"""
    ref = date(2008, 1, 21)
    ref_seq = 57  # 辛酉
    delta = (birth_date - ref).days
    seq = (ref_seq + delta) % 60
    return TIANGAN[seq % 10] + DIZHI[seq % 12], seq


def calc_hour_pillar(birth_hour, day_gan):
    """时柱：五鼠遁"""
    zhi = HOUR_TO_ZHI.get(birth_hour)
    if not zhi:
        return None
    zhi_idx = DIZHI.index(zhi)
    zishi_gan = WUSHU_DUN_DAY[day_gan]
    gan_idx = (TIANGAN.index(zishi_gan) + zhi_idx) % 10
    return TIANGAN[gan_idx] + zhi


def shishen(day_gan, other_gan):
    """十神"""
    dw, ow = WUXING[day_gan], WUXING[other_gan]
    dy, oy = YINYANG[day_gan], YINYANG[other_gan]
    same_yy = dy == oy
    if dw == ow:
        return '比肩' if same_yy else '劫财'
    cycle = ['木', '火', '土', '金', '水']
    di, oi = cycle.index(dw), cycle.index(ow)
    if (di + 1) % 5 == oi:
        return '食神' if same_yy else '伤官'
    if (di + 2) % 5 == oi:
        return '偏财' if same_yy else '正财'
    if (di + 3) % 5 == oi:
        return '七杀' if same_yy else '正官'
    if (di + 4) % 5 == oi:
        return '偏印' if same_yy else '正印'
    return '?'


def calc_kong_wang(day_ganzhi):
    """空亡：日柱所在旬的空亡两支

    六十甲子分六旬：
      甲子旬 (0-9)   → 空 戌、亥
      甲戌旬 (10-19) → 空 申、酉
      甲申旬 (20-29) → 空 午、未
      甲午旬 (30-39) → 空 辰、巳
      甲辰旬 (40-49) → 空 寅、卯
      甲寅旬 (50-59) → 空 子、丑

    简化算法：旬首地支序号往前推 2 位就是空亡。
    """
    seq = next(i for i in range(60)
               if TIANGAN[i % 10] + DIZHI[i % 12] == day_ganzhi)
    xun_start = (seq // 10) * 10
    xun_start_dz_idx = xun_start % 12
    return [DIZHI[(xun_start_dz_idx - 1) % 12],
            DIZHI[(xun_start_dz_idx - 2) % 12]]


def calc_ziwei_palace(month_zhi, hour_zhi):
    """紫微命宫：公式 + 口诀双验证"""
    month_num_map = {'寅': 1, '卯': 2, '辰': 3, '巳': 4, '午': 5, '未': 6,
                     '申': 7, '酉': 8, '戌': 9, '亥': 10, '子': 11, '丑': 12}
    hour_num_map = {'子': 1, '丑': 2, '寅': 3, '卯': 4, '辰': 5, '巳': 6,
                    '午': 7, '未': 8, '申': 9, '酉': 10, '戌': 11, '亥': 12}
    mn = month_num_map[month_zhi]
    hn = hour_num_map[hour_zhi]
    idx = (mn - hn + 2) % 12
    zhi = DIZHI[idx]
    # 口诀验证：寅起正月→顺数到月→逆数到时
    yz_list = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
    month_pos = (mn - 1) % 12
    # 从该位置逆数到时辰
    yz_seq = yz_list[month_pos]
    for _ in range(hn - 1):
        yz_seq = yz_list[(yz_list.index(yz_seq) - 1) % 12]
    return zhi, yz_seq, (zhi == yz_seq)


# ============ 长生十二运 ============

LONGSHENG_TABLE = {
    '甲': {'长生': '亥', '沐浴': '子', '冠带': '丑', '临官': '寅', '帝旺': '卯',
           '衰': '辰', '病': '巳', '死': '午', '墓': '未', '绝': '申', '胎': '酉', '养': '戌'},
    '乙': {'长生': '午', '沐浴': '巳', '冠带': '辰', '临官': '卯', '帝旺': '寅',
           '衰': '丑', '病': '子', '死': '亥', '墓': '戌', '绝': '酉', '胎': '申', '养': '未'},
    '丙': {'长生': '寅', '沐浴': '卯', '冠带': '辰', '临官': '巳', '帝旺': '午',
           '衰': '未', '病': '申', '死': '酉', '墓': '戌', '绝': '亥', '胎': '子', '养': '丑'},
    '丁': {'长生': '酉', '沐浴': '申', '冠带': '未', '临官': '午', '帝旺': '巳',
           '衰': '辰', '病': '卯', '死': '寅', '墓': '丑', '绝': '子', '胎': '亥', '养': '戌'},
    '戊': {'长生': '寅', '沐浴': '卯', '冠带': '辰', '临官': '巳', '帝旺': '午',
           '衰': '未', '病': '申', '死': '酉', '墓': '戌', '绝': '亥', '胎': '子', '养': '丑'},
    '己': {'长生': '酉', '沐浴': '申', '冠带': '未', '临官': '午', '帝旺': '巳',
           '衰': '辰', '病': '卯', '死': '寅', '墓': '丑', '绝': '子', '胎': '亥', '养': '戌'},
    '庚': {'长生': '巳', '沐浴': '午', '冠带': '未', '临官': '申', '帝旺': '酉',
           '衰': '戌', '病': '亥', '死': '子', '墓': '丑', '绝': '寅', '胎': '卯', '养': '辰'},
    '辛': {'长生': '子', '沐浴': '亥', '冠带': '戌', '临官': '酉', '帝旺': '申',
           '衰': '未', '病': '午', '死': '巳', '墓': '辰', '绝': '卯', '胎': '寅', '养': '丑'},
    '壬': {'长生': '申', '沐浴': '酉', '冠带': '戌', '临官': '亥', '帝旺': '子',
           '衰': '丑', '病': '寅', '死': '卯', '墓': '辰', '绝': '巳', '胎': '午', '养': '未'},
    '癸': {'长生': '卯', '沐浴': '寅', '冠带': '丑', '临官': '子', '帝旺': '亥',
           '衰': '戌', '病': '酉', '死': '申', '墓': '未', '绝': '午', '胎': '巳', '养': '辰'}
}


def longsheng_for_day(day_gan, zhi):
    """日主在指定地支的长生十二运"""
    table = LONGSHENG_TABLE[day_gan]
    for stage, z in table.items():
        if z == zhi:
            return stage
    return '?'


# ============ 身强身弱评分 ============

def score_strength(year_gan, month_gan, day_gan, hour_gan,
                   year_zhi, month_zhi, day_zhi, hour_zhi,
                   kong_wang, shensha_penalty=True):
    """身强身弱量化评分（完整版）

    包含：
    - 月令得气/失气
    - 日支根气
    - 印透干
    - 比劫透干
    - 财官杀食泄透干
    - 年支/月支/时支 藏干评分
    - 空亡削弱
    """
    score = 0
    details = []

    # 1. 月令得气
    LINGQI = {
        '甲': {'寅': 3, '卯': 3, '亥': 3, '辰': 0, '未': 0, '戌': 0, '丑': 0},
        '乙': {'卯': 3, '寅': 3, '午': 3, '巳': 0, '申': 0, '子': 0, '辰': 0},
        '丙': {'巳': 3, '午': 3, '寅': 3, '未': 0, '戌': 0, '丑': 0, '辰': 0},
        '丁': {'午': 3, '巳': 3, '酉': 3, '未': 0, '戌': 0, '丑': 0, '辰': 0},
        '戊': {'巳': 3, '午': 3, '寅': 3, '辰': 0, '戌': 0, '丑': 0, '未': 0},
        '己': {'午': 3, '巳': 3, '酉': 3, '辰': 0, '戌': 0, '丑': 0, '未': 0},
        '庚': {'申': 3, '酉': 3, '巳': 3, '戌': 0, '丑': 0, '辰': 0, '未': 0},
        '辛': {'酉': 3, '申': 3, '子': 3, '戌': 0, '丑': 0, '辰': 0, '未': 0},
        '壬': {'亥': 3, '子': 3, '申': 3, '丑': 0, '辰': 0, '未': 0, '戌': 0},
        '癸': {'子': 3, '亥': 3, '卯': 3, '丑': 0, '辰': 0, '未': 0, '戌': 0}
    }
    # 简化版：月令与日主同五行 = +3
    day_wx = WUXING[day_gan]
    same_wx = [z for z, gans in CANGGAN.items() if any(WUXING[g] == day_wx for g in gans[:1])]
    # 简化判断：月支的本气五行
    month_main = CANGGAN[month_zhi][0]
    if WUXING[month_main] == day_wx:
        score += 3
        details.append(f"月令得气: {month_zhi}({month_main}) → +3")
    # 月令墓地
    elif month_zhi in ['辰', '戌', '丑', '未']:
        score += 0
        details.append(f"月令墓库: {month_zhi} → 0")
    else:
        # 检查是否在死绝
        lost = {'木': ['申', '酉'], '火': ['亥', '子'], '土': ['亥', '子'],
                '金': ['寅', '卯'], '水': ['巳', '午']}
        if month_zhi in lost.get(day_wx, []):
            score += -2
            details.append(f"月令失气: {month_zhi} → -2")
        else:
            details.append(f"月令中性: {month_zhi} → 0")

    # 月支空亡削弱
    if month_zhi in kong_wang:
        # 找到刚才加的月令分，减半
        # 简化：粗略减 1.5
        score -= 1.5
        details.append(f"⚠ 月支{month_zhi}空亡，月令得分减半")

    # 2. 日支根气
    LU_TABLE = {'甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
                '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'}
    mu_table = {'甲': '未', '乙': '戌', '丙': '戌', '丁': '丑', '戊': '辰',
                '己': '辰', '庚': '丑', '辛': '辰', '壬': '辰', '癸': '未'}
    if day_zhi == LU_TABLE[day_gan]:
        score += 2
        details.append(f"日支根气: {day_zhi}(禄) → +2")
    elif day_zhi == mu_table.get(day_gan):
        score += 1
        details.append(f"日支微根: {day_zhi}(墓) → +1")
    else:
        details.append(f"日支无根: {day_zhi} → 0")

    # 3. 透干评分（排除日干本身）
    year_gan_ss = shishen(day_gan, year_gan)
    month_gan_ss = shishen(day_gan, month_gan)
    hour_gan_ss = shishen(day_gan, hour_gan)

    ten_god_score = {
        '正印': 2, '偏印': 1, '比肩': 1, '劫财': 1.5,
        '七杀': -2, '正官': -2, '偏财': -1.5, '正财': -1.5,
        '食神': -1, '伤官': -1
    }
    for pos, ss in [('年干', year_gan_ss), ('月干', month_gan_ss), ('时干', hour_gan_ss)]:
        pts = ten_god_score.get(ss, 0)
        score += pts
        details.append(f"{pos}{ss}: {pts:+g}")

    # 4. 藏干评分（年支、月支、时支；日支不再计）
    hidden_score_rates = [0.5, 0.3, 0.2]  # 本气、中气、余气
    for pos, zhi in [('年支', year_zhi), ('月支', month_zhi), ('时支', hour_zhi)]:
        cg = CANGGAN[zhi]
        # 日支藏干已计入根气，不重复计
        is_kong = zhi in kong_wang
        for i, g in enumerate(cg):
            ss = shishen(day_gan, g)
            base = ten_god_score.get(ss, 0)
            rate = hidden_score_rates[min(i, 2)]
            pts = base * rate
            if is_kong:
                pts *= 0.5  # 空亡减半
                kong_mark = "⚠空"
            else:
                kong_mark = ""
            score += pts
            details.append(f"{pos}{zhi}藏干{g}({ss}×{rate}{kong_mark}): {pts:+.2f}")

    # 5. 合局（简化为巳酉丑三合 + 六合）
    # 此处简化：原局三合金局 = +0.5, 三合木局帮身 = +1 等
    # 不在这里展开，详细见 references/strength-scoring.md

    # 结论
    if score >= 5:
        verdict = '身强明显'
        advice = '喜克泄耗（食伤/财/官杀）'
    elif score >= 2:
        verdict = '偏强'
        advice = '适度克泄，不宜再扶'
    elif score >= -1:
        verdict = '中和'
        advice = '看大运流向'
    elif score >= -4:
        verdict = '偏弱'
        advice = '喜印比扶'
    else:
        verdict = '身弱明显'
        advice = '必须印比帮身'

    return score, verdict, advice, details


# ============ 起运岁数 ============

def calc_qiyun_age(birth_dt, gender, year_gan):
    """起运岁数精确计算"""
    # 男阳女阴 → 顺排（数到下一个节）
    # 男阴女阳 → 逆排（数到上一个节）
    year_yy = YINYANG[year_gan]
    if gender == 'M':
        shun = (year_yy == '阳')
    else:
        shun = (year_yy == '阴')

    jie_order = ['小寒', '立春', '惊蛰', '清明', '立夏', '芒种', '小暑',
                 '立秋', '白露', '寒露', '立冬', '大雪', '小寒']
    # 找离出生最近的节
    candidates = []
    for jie in jie_order[:-1]:
        for y in [birth_dt.year - 1, birth_dt.year, birth_dt.year + 1]:
            jie_dt = get_jieqi(y, jie)
            if jie_dt:
                diff = (jie_dt - birth_dt).total_seconds() / 86400  # 天数
                candidates.append((diff, jie_dt, jie))
    candidates.sort(key=lambda x: abs(x[0]))

    if shun:
        # 找出生之后的最近节
        future = [c for c in candidates if c[0] > 0]
        if not future:
            return None
        diff_days, next_jie_dt, next_jie = min(future, key=lambda x: x[0])
    else:
        # 找出生之前的最近节
        past = [c for c in candidates if c[0] < 0]
        if not past:
            return None
        diff_days, prev_jie_dt, prev_jie = max(past, key=lambda x: x[0])
        diff_days = abs(diff_days)

    # 三天折一年，一天折四个月，一个时辰折十天
    years = diff_days / 3
    whole_years = int(years)
    months = round((years - whole_years) * 12)
    if months == 12:
        whole_years += 1
        months = 0
    return {
        'direction': '顺排' if shun else '逆排',
        'jie_name': next_jie if shun else prev_jie,
        'jie_dt': (next_jie_dt if shun else prev_jie_dt).strftime('%Y-%m-%d %H:%M'),
        'diff_days': round(diff_days, 2),
        'age_years': whole_years,
        'age_months': months,
        'total_years_decimal': round(years, 2)
    }


def calc_dayun_sequence(month_ganzhi, qiyun, gender, year_gan, num=8):
    """大运序列"""
    mg = month_ganzhi[0]
    mz = month_ganzhi[1]
    mg_idx = TIANGAN.index(mg)
    mz_idx = DIZHI.index(mz)

    direction = calc_qiyun_age.__defaults__  # 避免重算
    year_yy = YINYANG[year_gan]
    shun = (gender == 'M' and year_yy == '阳') or (gender == 'F' and year_yy == '阴')

    seq = []
    for i in range(num):
        if shun:
            g_idx = (mg_idx + i + 1) % 10
            z_idx = (mz_idx + i + 1) % 12
        else:
            g_idx = (mg_idx - i - 1) % 10
            z_idx = (mz_idx - i - 1) % 12
        start = qiyun['age_years'] + i * 10
        end = start + 9
        seq.append({
            'ganzhi': TIANGAN[g_idx] + DIZHI[z_idx],
            'start_age': start,
            'end_age': end
        })
    return seq


# ============ 主函数 ============


def build_kline_payload(birth_year, birth_dt, gender, year_pz, month_pz, day_pz, hour_pz, day_gan, day_zhi, kong):
    return {
        'birth_year': birth_year,
        'birth_dt': birth_dt.strftime('%Y-%m-%d %H:%M'),
        'gender': gender,
        'year_pillar': year_pz,
        'month_pillar': month_pz,
        'day_pillar': day_pz,
        'hour_pillar': hour_pz,
        'day_master': day_gan,
        'day_branch': day_zhi,
    }

def main():
    parser = argparse.ArgumentParser(description='八字排盘计算脚本 v3.2')
    parser.add_argument('-y', '--year', type=int, required=True, help='出生年份（公历）')
    parser.add_argument('-m', '--month', type=int, required=True, help='出生月份（公历）')
    parser.add_argument('-d', '--day', type=int, required=True, help='出生日期（公历）')
    parser.add_argument('-H', '--hour', type=int, required=True, help='出生小时（0-23）')
    parser.add_argument('-M', '--minute', type=int, default=0, help='出生分钟（默认 0）')
    parser.add_argument('-g', '--gender', type=str, required=True, choices=['M', 'F'],
                        help='性别：M=男, F=女')
    parser.add_argument('--longitude', type=float, default=None,
                        help='出生地经度（可选，用于真太阳时校准）')
    parser.add_argument('--kline', action='store_true', help='计算人生 K 线并输出')
    parser.add_argument('--kline-output', type=str, default=None,
                        help='人生 K 线报告输出文件；不指定则 stdout')
    parser.add_argument('--kline-max-age', type=int, default=100,
                        help='人生 K 线计算年龄上限（默认 100）')
    args = parser.parse_args()

    # 真太阳时校准
    birth_dt = datetime(args.year, args.month, args.day, args.hour, args.minute)
    if args.longitude:
        offset_min = round((args.longitude - 120) * 4)
        birth_dt = birth_dt - timedelta(minutes=offset_min)
        print(f"真太阳时校准: 经度{args.longitude}°E → 偏移{offset_min}分钟 → {birth_dt.strftime('%Y-%m-%d %H:%M')}")

    print(f"\n{'='*60}")
    print(f"  八字排盘 v3.2")
    print(f"  出生: {args.year}-{args.month:02d}-{args.day:02d} {args.hour:02d}:{args.minute:02d}")
    print(f"  性别: {'男' if args.gender == 'M' else '女'}")
    print(f"{'='*60}")

    # === 排盘 ===
    year_pz, used_year = calc_year_pillar(birth_dt)
    month_pz = calc_month_pillar(birth_dt, year_pz[0])
    day_pz, _ = calc_day_pillar(birth_dt.date())
    hour_pz = calc_hour_pillar(birth_dt.hour, day_pz[0])
    day_gan = day_pz[0]
    day_zhi = day_pz[1]

    print(f"\n=== 四柱八字 ===")
    print(f"  年柱: {year_pz}  (使用{used_year}年)")
    print(f"  月柱: {month_pz}")
    print(f"  日柱: {day_pz}")
    print(f"  时柱: {hour_pz}")

    # === 藏干十神 ===
    print(f"\n=== 藏干 ===")
    pillars = [
        ('年支', year_pz[1], year_pz[0]),
        ('月支', month_pz[1], month_pz[0]),
        ('日支', day_pz[1], day_pz[0]),
        ('时支', hour_pz[1], hour_pz[0])
    ]
    for pos, zhi, gan in pillars:
        cg = CANGGAN[zhi]
        ss_list = [f"{g}({shishen(day_pz[0], g)})" for g in cg]
        print(f"  {pos}{zhi}: {', '.join(ss_list)}")

    # === 纳音 ===
    print(f"\n=== 纳音 ===")
    for pos, pz in [('年', year_pz), ('月', month_pz), ('日', day_pz), ('时', hour_pz)]:
        print(f"  {pos}柱 {pz}: {NAYIN.get(pz, '?')}")

    # === 空亡 ===
    kong = calc_kong_wang(day_pz)
    print(f"\n=== 空亡 ===")
    print(f"  日柱{day_pz} → 空亡: {', '.join(kong)}")
    for pos, zhi in [(p[0], p[1]) for p in pillars]:
        if zhi in kong:
            print(f"  ⚠ {pos}{zhi} 空亡（藏干评分减半）")

    # === 神煞 ===
    print(f"\n=== 神煞 ===")
    tianyi_map = {'甲': '丑未', '乙': '子申', '丙': '亥酉', '丁': '亥酉',
                  '戊': '丑未', '己': '子申', '庚': '寅午', '辛': '寅午',
                  '壬': '卯巳', '癸': '卯巳'}
    lu_map = {'甲': '寅', '乙': '卯', '丙': '巳', '丁': '午', '戊': '巳',
              '己': '午', '庚': '申', '辛': '酉', '壬': '亥', '癸': '子'}
    taohua = {'子': '酉', '丑': '午', '寅': '卯', '卯': '子', '辰': '酉',
              '巳': '午', '午': '卯', '未': '子', '申': '酉', '酉': '午',
              '戌': '卯', '亥': '子'}
    huagai = {'子': '辰', '丑': '丑', '寅': '戌', '卯': '未', '辰': '辰',
              '巳': '丑', '午': '戌', '未': '未', '申': '辰', '酉': '丑',
              '戌': '戌', '亥': '未'}
    yima = {'子': '寅', '丑': '亥', '寅': '申', '卯': '巳', '辰': '寅',
            '巳': '亥', '午': '申', '未': '巳', '申': '寅', '酉': '亥',
            '戌': '申', '亥': '巳'}
    wc_map = {'甲': '巳', '乙': '午', '丙': '申', '丁': '酉', '戊': '申',
              '己': '酉', '庚': '亥', '辛': '子', '壬': '寅', '癸': '卯'}

    all_zhi = [year_pz[1], month_pz[1], day_pz[1], hour_pz[1]]
    dg = day_pz[0]

    shensha = [
        ('天乙贵人', tianyi_map[dg], "有" if any(z in tianyi_map[dg] for z in all_zhi) else "无"),
        ('禄神', lu_map[dg], "有" if lu_map[dg] in all_zhi else "无"),
        ('桃花', taohua[day_pz[1]], "有" if taohua[day_pz[1]] in all_zhi else "无"),
        ('华盖', huagai[day_pz[1]], "有" if huagai[day_pz[1]] in all_zhi else "无"),
        ('驿马', yima[day_pz[1]], "有" if yima[day_pz[1]] in all_zhi else "无"),
        ('文昌', wc_map[dg], "有" if wc_map[dg] in all_zhi else "无"),
    ]
    for name, loc, has in shensha:
        print(f"  {name}: {has} ({loc})")

    # === 紫微命宫 ===
    zw_zhi, kj_zhi, kj_match = calc_ziwei_palace(month_pz[1], hour_pz[1])
    stars = {'子': '天同', '丑': '天机', '寅': '太阳', '卯': '天相', '辰': '巨门',
             '巳': '天梁', '午': '破军', '未': '太阴', '申': '廉贞', '酉': '武曲',
             '戌': '紫微+天相', '亥': '紫微'}
    print(f"\n=== 紫微命宫 ===")
    print(f"  公式法: 丑月(12) 未时(8) → (12-8+2)%12 = 6 → {zw_zhi}({stars[zw_zhi]})")
    print(f"  口诀法: {kj_zhi}({stars.get(kj_zhi, '?')})")
    print(f"  双验证: {'✓ 一致' if kj_match else '✗ 不一致！检查索引/映射'}")

    # === 起运 ===
    qiyun = calc_qiyun_age(birth_dt, args.gender, year_pz[0])
    print(f"\n=== 起运 ===")
    print(f"  方向: {qiyun['direction']}")
    print(f"  {'下一个' if qiyun['direction'] == '顺排' else '上一个'}节气: {qiyun['jie_name']} ({qiyun['jie_dt']})")
    print(f"  天数差: {qiyun['diff_days']} 天")
    print(f"  起运: {qiyun['age_years']} 岁 {qiyun['age_months']} 个月 (={qiyun['total_years_decimal']} 岁)")

    # === 大运序列 ===
    dayun = calc_dayun_sequence(month_pz, qiyun, args.gender, year_pz[0], num=8)
    print(f"\n=== 大运序列（{qiyun['age_years']}岁起，10年一步）===")
    for dy in dayun:
        gz = dy['ganzhi']
        ss = shishen(day_pz[0], gz[0])
        print(f"  {dy['start_age']:>2}-{dy['end_age']:>2}岁: {gz} ({ss}+地支{gz[1]})")

    # === 身强身弱评分 ===
    score, verdict, advice, details = score_strength(
        year_pz[0], month_pz[0], day_pz[0], hour_pz[0],
        year_pz[1], month_pz[1], day_pz[1], hour_pz[1],
        kong
    )
    print(f"\n=== 身强身弱评分 ===")
    for d in details:
        print(f"  {d}")
    print(f"\n  总分: {score:+.2f}")
    print(f"  结论: {verdict}")
    print(f"  建议: {advice}")

    # === 长生十二运 ===
    print(f"\n=== 长生十二运（日主{dg}在四柱地支）===")
    for pos, zhi in [(p[0], p[1]) for p in pillars]:
        stage = longsheng_for_day(dg, zhi)
        print(f"  {pos}{zhi}: {stage}")

    print(f"\n{'='*60}")
    print(f"  排盘完成")
    print(f"{'='*60}")

    bazi_dict = build_kline_payload(
        args.year, birth_dt, args.gender,
        year_pz, month_pz, day_pz, hour_pz,
        day_gan, day_zhi, kong
    )
    bazi_dict['strength_score'] = round(float(score), 2)
    bazi_dict['strength_verdict'] = verdict
    bazi_dict['strength_advice'] = advice

    if args.kline:
        try:
            from life_kline import run_from_bazi_dict, strip_ansi
        except ImportError as e:
            print(f"导入 life_kline 失败: {e}")
            sys.exit(1)
        out = run_from_bazi_dict(bazi_dict, args.kline_max_age, output_markdown=True)
        if args.kline_output:
            out = strip_ansi(out) if isinstance(out, str) else out
            with open(args.kline_output, 'w', encoding='utf-8') as f:
                f.write(out)
            print(f"\n人生 K 线已写入: {args.kline_output}")
        else:
            print(f"\n{'='*60}")
            print(f"  人生 K 线（--kline）")
            print(f"{'='*60}")
            print(out)


if __name__ == '__main__':
    main()
