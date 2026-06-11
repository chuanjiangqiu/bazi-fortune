---
name: bazi-fortune-lunar-conversion-fallback
description: 农历转公历的备选方案 - 当 lunarcalendar 包不可用时
---

# 农历转公历备选方案

## 背景

`bazi_calc.py` 依赖用户提供公历日期。用户常给农历日期，需先转换。标准方式用 `lunarcalendar` Python 包，但在某些环境（如 Hermes WSL，externally-managed-environment）无法 `pip install`。

---

## 方案一：已知参考点推算（推荐，精度 ±1-2 天）

利用已知的「农历↔公历」对照点，按平均朔望月（29.5306 天）推算。

### 常用锚点（近年）

| 农历日期 | 公历日期 | 备注 |
|----------|----------|------|
| 2007 年正月初一 | 2007-02-18 | 2007 春节 |
| 2007 年腊月十三 | 2008-01-21 | **记忆中确认的锚点**：用户八字记忆 `2008-01-21 = 农历 2007.12.13` |
| 2008 年正月初一 | 2008-02-07 | 2008 春节 |
| 2024 年正月初一 | 2024-02-10 | 2024 春节 |
| 2025 年正月初一 | 2025-01-29 | 2025 春节 |

### 推算公式

```python
from datetime import date, timedelta

# 锚点
anchor_lunar = (2007, 12, 13)  # 年、月、日
anchor_greg = date(2008, 1, 21)

# 目标农历
target_lunar = (2007, 11, 7)

# 农历月差 × 29.53 + 日差
month_diff = (target_lunar[1] - anchor_lunar[1]) * 29.5306
day_diff = target_lunar[2] - anchor_lunar[2]
total_days = round(month_diff + day_diff)

target_greg = anchor_greg + timedelta(days=total_days)
# 结果：2007-12-16（与万年历核对一致）
```

**优点**：无依赖、精度够用（±1 天）、可在 `execute_code` 直接跑
**缺点**：跨闰月会偏 ±1 天、远年份累积误差大

> ⚠️ 如需高精度（如法律/医疗/官方用途），仍需万年历或 Swiss Ephemeris

---

## 方案二：Web 搜索验证（补充）

```bash
# 在 execute_code 中调用 web_search
web_search("农历 2007 年 11 月 7 日 是 公历 几月 几日")
```

取前 2-3 个结果交叉验证。

---

## 方案三：内置简易万年表（备用）

在 `bazi_calc.py` 中内置 1900-2100 年农历正月初一公历日期表（约 200 行），按月累加即可。见 `scripts/lunar_new_year_table.py`（待创建）。

---

## 实战验证记录（2026-06-08）

| 用户输入 | 备选法结果 | 万年历核对 | 偏差 |
|----------|------------|------------|------|
| 农历 2007.11.07 | 2007-12-16 | 2007-12-16 | 0 天 |

---

## 集成建议

在 `bazi_calc.py` 入口增加 `--lunar` 参数：

```python
parser.add_argument('--lunar', action='store_true', help='输入为农历，自动用锚点法转公历')
parser.add_argument('--lunar-year', type=int, help='农历年')
parser.add_argument('--lunar-month', type=int, help='农历月')
parser.add_argument('--lunar-day', type=int, help='农历日')
```

逻辑：
1. 若 `--lunar`，调用锚点推算得公历
2. 再走原有排盘流程
3. 输出时同时显示「农历→公历换算来源：锚点法（锚点 2008-01-21=农历 2007.12.13）」

零依赖、零破坏、可直接用。