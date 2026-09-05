import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Calendar,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  TrendingUp,
  Crown,
  Sparkle,
  Star,
  Compass,
  AlertTriangle,
  CheckCircle2,
  MinusCircle,
  DollarSign,
  Smartphone,
  LineChart,
  Sun,
  Moon as MoonIcon,
  Zap,
} from 'lucide-react';
import {
  getTenGod,
  getWuXing,
  getYinYang,
  getZhiRelations,
  calcFortuneByGanZhi,
  type ZhiRelation,
  type DimensionScore,
} from '@/lib/bazi';
import { getAquariusFortune, type AquariusFortuneResult } from '@/lib/constellation';
import { drawDailyTarot, type TarotDrawResult } from '@/lib/tarot';
import { TarotCard } from '@/components/TarotCard';
import {
  getWealthOverview,
  getSecondHandPhoneAdvice,
  getFinanceAdvice,
  type WealthOverview,
  type TradeAdvice,
} from '@/lib/wealth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { Solar as SolarCtor, Lunar as LunarCtor } from 'lunar-javascript';

interface PillarData {
  gan: string;
  zhi: string;
  naYin: string;
  ganWuXing: string;
  zhiWuXing: string;
  ganShiShen: string;
  zhiShiShen: string;
  hideGan: string[];
}

interface FortuneLevel {
  level: string;
  color: string;
}

interface FortuneUnit {
  ganZhi: string;
  gan: string;
  zhi: string;
  ganWuXing: string;
  zhiWuXing: string;
  ganShiShen: string;
  zhiRelations: ZhiRelation[];
  totalScore: number;
  fortuneLevel: FortuneLevel;
  dimensions: DimensionScore[];
  interpretation: string[];
  yiJi: { yi: string[]; ji: string[] };
}

interface FortuneResult {
  pillars: {
    year: PillarData;
    month: PillarData;
    day: PillarData;
    time: PillarData;
  };
  dayGan: string;
  dayGanWuXing: string;
  dayGanYinYang: string;
  dayFortune: FortuneUnit;
  monthFortune: FortuneUnit;
  yearFortune: FortuneUnit;
}

interface FullPageData {
  fortune: FortuneResult;
  wealth: WealthOverview;
  secondHandAdvice: TradeAdvice;
  financeAdvice: TradeAdvice;
  aquarius: AquariusFortuneResult;
  tarot: TarotDrawResult;
}

const PILLAR_LABELS = ['年柱', '月柱', '日柱', '时柱'] as const;

const ZHI_WUXING: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 固定命主信息
const BIRTH_YEAR = 2008;
const BIRTH_MONTH = 1;
const BIRTH_DAY = 20;
const BIRTH_HOUR = 14;
const GENDER: '男' | '女' = '男';
const BIRTH_DATE_STR = '2008年1月20日 未时';
const BAZI_STR = '丁亥 癸丑 己未 辛未';
const DAY_GAN_STR = '己土（阴土）';
const CONSTELLATION = '水瓶座';

export default function FortunePage() {
  const today = new Date(2026, 8, 5); // 2026-09-05
  const [fortuneDate, setFortuneDate] = useState<Date>(today);
  const [activeTab, setActiveTab] = useState<'day' | 'month' | 'year'>('day');
  const [data, setData] = useState<FullPageData | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [tarotFlipped, setTarotFlipped] = useState(false);

  // 切换日期时重置塔罗牌翻牌状态
  useEffect(() => {
    setTarotFlipped(false);
  }, [fortuneDate]);

  // 页面加载后自动测算
  useEffect(() => {
    if (SolarCtor && LunarCtor) {
      calculate(today);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatFortuneDate = (d: Date) => {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const handlePrevDay = () => {
    const d = new Date(fortuneDate);
    d.setDate(d.getDate() - 1);
    setFortuneDate(d);
    calculate(d);
  };

  const handleNextDay = () => {
    const d = new Date(fortuneDate);
    d.setDate(d.getDate() + 1);
    setFortuneDate(d);
    calculate(d);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) return;
    const [y, m, d] = val.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    setFortuneDate(newDate);
    calculate(newDate);
  };

  function calculate(fDate: Date) {
    if (!SolarCtor || !LunarCtor) {
      toast.error('排盘服务暂不可用');
      return;
    }
    setIsCalculating(true);
    try {
      const result = calculateAll(fDate);
      setData(result);
    } catch (err) {
      toast.error('测算失败：' + String(err));
    } finally {
      setIsCalculating(false);
    }
  }

  function calculateFortune(fDate: Date): FortuneResult {
    const solar = SolarCtor.fromYmdHms(BIRTH_YEAR, BIRTH_MONTH, BIRTH_DAY, BIRTH_HOUR, 0, 0);
    const lunar = LunarCtor.fromSolar(solar);
    const eightChar = lunar.getEightChar();

    const dayGan = eightChar.getDayGan();
    const dayGanWuXing = getWuXing(dayGan);
    const dayGanYinYang = getYinYang(dayGan);

    const buildPillar = (
      gan: string,
      zhi: string,
      naYin: string,
      hideGan: string[],
    ): PillarData => {
      return {
        gan,
        zhi,
        naYin,
        ganWuXing: getWuXing(gan),
        zhiWuXing: ZHI_WUXING[zhi] || '',
        ganShiShen: getTenGod(dayGan, gan),
        zhiShiShen: getTenGod(dayGan, hideGan[0] || gan),
        hideGan,
      };
    };

    const pillars = {
      year: buildPillar(
        eightChar.getYearGan(), eightChar.getYearZhi(),
        eightChar.getYearNaYin(), eightChar.getYearHideGan(),
      ),
      month: buildPillar(
        eightChar.getMonthGan(), eightChar.getMonthZhi(),
        eightChar.getMonthNaYin(), eightChar.getMonthHideGan(),
      ),
      day: buildPillar(
        eightChar.getDayGan(), eightChar.getDayZhi(),
        eightChar.getDayNaYin(), eightChar.getDayHideGan(),
      ),
      time: buildPillar(
        eightChar.getTimeGan(), eightChar.getTimeZhi(),
        eightChar.getTimeNaYin(), eightChar.getTimeHideGan(),
      ),
    };

    const mingJuZhiList = [pillars.year.zhi, pillars.month.zhi, pillars.day.zhi, pillars.time.zhi];
    const mingJuWuxing = [
      pillars.year.ganWuXing, pillars.month.ganWuXing, pillars.day.ganWuXing, pillars.time.ganWuXing,
      pillars.year.zhiWuXing, pillars.month.zhiWuXing, pillars.day.zhiWuXing, pillars.time.zhiWuXing,
    ].filter(Boolean);

    const todaySolar = SolarCtor.fromYmd(fDate.getFullYear(), fDate.getMonth() + 1, fDate.getDate());
    const todayLunar = LunarCtor.fromSolar(todaySolar);
    const dayGanZhi = todayLunar.getDayInGanZhi();
    const monthGanZhi = todayLunar.getMonthInGanZhi();
    const yearGanZhi = todayLunar.getYearInGanZhi();

    const dayFortune = calcFortuneByGanZhi({
      ganZhi: dayGanZhi, dayGan, mingJuZhiList, mingJuWuxing,
      gender: GENDER, riZhi: pillars.day.zhi, scope: 'day',
    });
    const monthFortune = calcFortuneByGanZhi({
      ganZhi: monthGanZhi, dayGan, mingJuZhiList, mingJuWuxing,
      gender: GENDER, riZhi: pillars.day.zhi, scope: 'month',
    });
    const yearFortune = calcFortuneByGanZhi({
      ganZhi: yearGanZhi, dayGan, mingJuZhiList, mingJuWuxing,
      gender: GENDER, riZhi: pillars.day.zhi, scope: 'year',
    });

    return { pillars, dayGan, dayGanWuXing, dayGanYinYang, dayFortune, monthFortune, yearFortune };
  }

  function calculateAll(fDate: Date): FullPageData {
    const fortune = calculateFortune(fDate);
    const dayGanZhi = fortune.dayFortune.ganZhi;
    const mingJuZhiList = [
      fortune.pillars.year.zhi, fortune.pillars.month.zhi,
      fortune.pillars.day.zhi, fortune.pillars.time.zhi,
    ];

    // 财运总览
    const wealth = getWealthOverview({
      dayGanZhi,
      dayGan: fortune.dayGan,
      mingJuZhiList,
      date: fDate,
    });

    // 交易建议
    const shiShen = fortune.dayFortune.ganShiShen;
    const zhiRelations = fortune.dayFortune.zhiRelations;
    const secondHandAdvice = getSecondHandPhoneAdvice({ shiShen, zhiRelations, score: wealth.totalScore });
    const financeAdvice = getFinanceAdvice({ shiShen, zhiRelations, score: wealth.totalScore });

    // 星座运势
    const aquarius = getAquariusFortune(fDate);

    // 塔罗牌
    const tarot = drawDailyTarot(fDate);

    return { fortune, wealth, secondHandAdvice, financeAdvice, aquarius, tarot };
  }

  // 五行统计
  const wuxingCount = useMemo(() => {
    if (!data) return {} as Record<string, number>;
    const count: Record<string, number> = {};
    const wuxingList = [
      data.fortune.pillars.year.ganWuXing, data.fortune.pillars.month.ganWuXing,
      data.fortune.pillars.day.ganWuXing, data.fortune.pillars.time.ganWuXing,
      data.fortune.pillars.year.zhiWuXing, data.fortune.pillars.month.zhiWuXing,
      data.fortune.pillars.day.zhiWuXing, data.fortune.pillars.time.zhiWuXing,
    ].filter(Boolean);
    for (const w of wuxingList) {
      count[w] = (count[w] || 0) + 1;
    }
    return count;
  }, [data]);

  const wuxingList = ['金', '木', '水', '火', '土'];

  function ActionBadge({ action, type }: { action: string; type: 'good' | 'neutral' | 'bad' }) {
    const styles = {
      good: 'border-[hsl(130_54%_42%)] bg-[hsl(130_54%_42%_/_0.15)] text-[hsl(130_54%_55%)]',
      neutral: 'border-[hsl(43_30%_22%)] bg-[hsl(43_30%_22%_/_0.3)] text-[hsl(43_85%_65%)]',
      bad: 'border-[hsl(0_84%_60%)] bg-[hsl(0_84%_60%_/_0.1)] text-[hsl(0_84%_70%)]',
    };
    const Icon = type === 'good' ? CheckCircle2 : type === 'bad' ? AlertTriangle : MinusCircle;
    return (
      <Badge variant="outline" className={`gap-1 px-2 py-1 text-xs font-semibold ${styles[type]}`}>
        <Icon className="size-3.5" />
        {action}
      </Badge>
    );
  }

  function TradeCard({ advice, icon }: { advice: TradeAdvice; icon: React.ReactNode }) {
    return (
      <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur transition-all hover:border-[hsl(43_85%_58%)_/_0.5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg text-[hsl(43_85%_65%)]">
              {icon}
              {advice.title}
            </CardTitle>
            <ActionBadge action={advice.subItems ? advice.subItems[0].action : advice.action} type={advice.actionType} />
          </div>
          {advice.subItems && (
            <div className="mt-1 flex gap-2">
              {advice.subItems.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <span className="text-muted-foreground">{item.label}：</span>
                  <span className={`font-medium ${
                    item.actionType === 'good' ? 'text-[hsl(130_54%_55%)]'
                      : item.actionType === 'bad' ? 'text-[hsl(0_84%_70%)]'
                      : 'text-[hsl(43_85%_65%)]'
                  }`}>
                    {item.action}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[hsl(43_85%_65%)]">具体建议</div>
            <ul className="space-y-1.5">
              {advice.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground/90">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[hsl(43_85%_65%)]" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
          {advice.notes.length > 0 && (
            <div className="space-y-1.5 rounded-md border border-[hsl(26_90%_49%_/_0.3)] bg-[hsl(26_90%_49%_/_0.05)] p-3">
              {advice.notes.map((note, i) => (
                <p key={i} className="text-xs text-[hsl(26_90%_60%)]">
                  {note}
                </p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[rgb(20_15_25)] via-[rgb(25_20_30)] to-[rgb(15_10_20)] text-[hsl(40_25%_88%)]">
      {/* 背景装饰 */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* 星空粒子 */}
        <div className="starfield absolute inset-0 opacity-40" />
        {/* 光晕 */}
        <div className="animate-glow-pulse absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[hsl(43_85%_58%_/_0.08)] blur-3xl" />
        <div className="animate-glow-pulse absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[hsl(5_75%_45%_/_0.06)] blur-3xl" style={{ animationDelay: '2s' }} />
        <div className="animate-glow-pulse absolute top-1/3 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[hsl(260_50%_40%_/_0.04)] blur-3xl" style={{ animationDelay: '4s' }} />
      </div>

      <main className="relative mx-auto w-full max-w-5xl px-4 py-8 md:py-12">
        {/* ===== 顶部：标题 + 命主信息 ===== */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 text-center"
        >
          <div className="mb-3 flex items-center justify-center gap-2">
            <Crown className="size-5 text-[hsl(43_85%_65%)]" />
            <span className="text-xs tracking-[0.3em] text-[hsl(43_85%_65%)]">PERSONAL FORTUNE</span>
            <Crown className="size-5 text-[hsl(43_85%_65%)]" />
          </div>
          <h1 className="bg-gradient-to-r from-[hsl(43_85%_65%)] via-[hsl(43_85%_58%)] to-[hsl(5_75%_55%)] bg-clip-text text-4xl font-bold tracking-wider text-transparent md:text-5xl">
            我的专属运势
          </h1>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 rounded-full border border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] px-5 py-2 text-sm backdrop-blur">
            <span className="text-foreground/90">{BAZI_STR}</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-[hsl(43_85%_65%)]">{GENDER}命</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-foreground/90">日主{DAY_GAN_STR}</span>
            <span className="text-muted-foreground">·</span>
            <span className="flex items-center gap-1 text-[hsl(260_60%_75%)]">
              <Star className="size-3.5 fill-[hsl(260_60%_75%)]" />
              {CONSTELLATION}
            </span>
          </div>
          <p className="mt-3 text-xs text-muted-foreground md:text-sm">
            出生于{BIRTH_DATE_STR} · 每日运势专属解读
          </p>
        </motion.header>

        {data && (
          <>
            {/* ===== 第一屏：今日财运总览 ===== */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card className="border-[hsl(43_85%_58%_/_0.4)] bg-gradient-to-br from-[hsl(220_15%_10%_/_0.95)] via-[hsl(43_50%_10%_/_0.5)] to-[hsl(220_15%_10%_/_0.95)] backdrop-blur shadow-[0_0_40px_hsl(43_85%_58%_/_0.08)]">
                <CardContent className="pt-8 pb-6">
                  <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
                    {/* 左侧：财运评分大数字 */}
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-xs tracking-wider text-muted-foreground">今日财运综合评分</span>
                      <div className="mt-2 relative">
                        <div className="text-7xl font-black tabular-nums tracking-tight md:text-8xl" style={{
                          background: data.wealth.totalScore >= 75
                            ? 'linear-gradient(135deg, hsl(43 85% 70%), hsl(43 85% 50%))'
                            : data.wealth.totalScore >= 55
                            ? 'linear-gradient(135deg, hsl(40 25% 88%), hsl(40 15% 70%))'
                            : 'linear-gradient(135deg, hsl(40 10% 60%), hsl(40 5% 45%))',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                          backgroundClip: 'text',
                        }}>
                          {data.wealth.totalScore}
                        </div>
                      </div>
                      <div className={`mt-1 text-xl font-bold ${data.wealth.levelColor}`}>
                        {data.wealth.level}
                      </div>
                    </div>

                    {/* 中间：一句话总结 */}
                    <div className="flex-1 max-w-md text-center md:text-left">
                      <p className="text-base leading-relaxed text-foreground/90">
                        {data.wealth.summary}
                      </p>
                      <div className="mt-3 flex items-center justify-center gap-4 text-xs text-muted-foreground md:justify-start">
                        <span>八字 <span className="text-[hsl(43_85%_65%)]">{data.wealth.baziWealthScore}</span></span>
                        <span>星座 <span className="text-[hsl(260_60%_75%)]">{data.wealth.constellationWealthScore}</span></span>
                        <span>塔罗 <span className="text-[hsl(300_50%_75%)]">{data.wealth.tarotFortuneScore}</span></span>
                      </div>
                    </div>

                    {/* 右侧：三个快捷标签 */}
                    <div className="flex flex-col gap-2 md:items-end">
                      <Badge variant="outline" className="border-[hsl(43_85%_58%_/_0.4)] bg-[hsl(43_85%_58%_/_0.08)] px-3 py-1.5 text-xs">
                        <Compass className="mr-1 size-3.5 text-[hsl(43_85%_65%)]" />
                        财运方向：{data.wealth.direction}
                      </Badge>
                      <Badge variant="outline" className="border-[hsl(130_54%_42%_/_0.4)] bg-[hsl(130_54%_42%_/_0.08)] px-3 py-1.5 text-xs">
                        <Zap className="mr-1 size-3.5 text-[hsl(130_54%_55%)]" />
                        最佳时段：{data.wealth.bestTimePeriod}
                      </Badge>
                      <Badge variant="outline" className="border-[hsl(0_84%_60%_/_0.4)] bg-[hsl(0_84%_60%_/_0.08)] px-3 py-1.5 text-xs">
                        <AlertTriangle className="mr-1 size-3.5 text-[hsl(0_84%_70%)]" />
                        禁忌：{data.wealth.forbiddenThing}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ===== 第二屏：交易建议区 ===== */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-6"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[hsl(43_85%_65%)]">
                <DollarSign className="size-5" />
                今日交易建议
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <TradeCard
                  advice={data.secondHandAdvice}
                  icon={<Smartphone className="size-5" />}
                />
                <TradeCard
                  advice={data.financeAdvice}
                  icon={<LineChart className="size-5" />}
                />
              </div>
            </motion.section>

            {/* ===== 第三屏：多维度评定 ===== */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-8"
            >
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-[hsl(43_85%_65%)]">
                <Sparkles className="size-5" />
                多维度评定
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* 八字运势卡片 */}
                <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[hsl(43_85%_65%)]">
                      <Sparkle className="size-4" />
                      八字运势
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">日干支</span>
                      <span className="font-semibold text-[hsl(43_85%_65%)]">{data.fortune.dayFortune.ganZhi}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">十神</span>
                      <span className="text-sm">{data.fortune.dayFortune.ganShiShen}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">地支关系</span>
                      <div className="flex flex-wrap justify-end gap-1">
                        {data.fortune.dayFortune.zhiRelations.length > 0 ? (
                          data.fortune.dayFortune.zhiRelations.slice(0, 2).map((r, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1 py-0">
                              {r.name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">无</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-xs text-muted-foreground">综合评分</span>
                      <span className={`text-lg font-bold ${data.fortune.dayFortune.fortuneLevel.color}`}>
                        {data.fortune.dayFortune.totalScore}分
                      </span>
                    </div>
                    <Progress
                      value={data.fortune.dayFortune.totalScore}
                      className="h-1.5 bg-[hsl(43_30%_22%)]"
                    />
                  </CardContent>
                </Card>

                {/* 星座运势卡片 */}
                <Card className="border-[hsl(260_40%_30%)] bg-gradient-to-br from-[hsl(220_15%_10%_/_0.8)] to-[hsl(260_30%_12%_/_0.6)] backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[hsl(260_60%_75%)]">
                      <Star className="size-4 fill-[hsl(260_60%_75%)_/_0.3]" />
                      水瓶座运势
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">综合运势</span>
                      <span className={`text-lg font-bold ${data.aquarius.overallColor}`}>
                        {data.aquarius.overallScore}分
                      </span>
                    </div>
                    <Progress
                      value={data.aquarius.overallScore}
                      className="h-1.5 bg-[hsl(260_40%_22%)]"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {data.aquarius.dimensions.map((dim) => (
                        <div key={dim.name} className="flex items-center justify-between">
                          <span className="text-muted-foreground">{dim.name}</span>
                          <span className="font-medium text-[hsl(260_60%_75%)]">{dim.score}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-1 border-t border-[hsl(260_40%_22%)] pt-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">幸运数字</span>
                        <span className="text-[hsl(260_60%_75%)]">{data.aquarius.luckyNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">幸运色</span>
                        <span className="text-[hsl(260_60%_75%)]">{data.aquarius.luckyColor}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* 塔罗每日一牌卡片 */}
                <Card className="border-[hsl(300_30%_30%)] bg-gradient-to-br from-[hsl(220_15%_10%_/_0.8)] to-[hsl(300_25%_12%_/_0.6)] backdrop-blur">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base text-[hsl(300_50%_75%)]">
                      <MoonIcon className="size-4" />
                      今日塔罗牌
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TarotCard
                      card={data.tarot.card}
                      isUpright={data.tarot.isUpright}
                      flipped={tarotFlipped}
                      onFlip={() => setTarotFlipped(!tarotFlipped)}
                    />
                    {tarotFlipped ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">吉凶指数</span>
                          <span className={`text-lg font-bold ${data.tarot.fortuneColor}`}>
                            {data.tarot.fortuneLevel} · {data.tarot.fortuneScore}
                          </span>
                        </div>
                        <Progress value={data.tarot.fortuneScore} className="h-1.5 bg-[hsl(300_30%_22%)]" />
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-[hsl(300_40%_75%)]">牌意</p>
                          <p className="text-xs leading-relaxed text-foreground/80">{data.tarot.meaning}</p>
                        </div>
                        <div className="space-y-1.5">
                          <p className="text-xs font-medium text-[hsl(300_40%_75%)]">财运启示</p>
                          <p className="text-xs leading-relaxed text-foreground/80">{data.tarot.wealthInsight}</p>
                        </div>
                        <p className="rounded-lg border border-[hsl(300_30%_25%)] bg-[hsl(300_30%_15%_/_0.4)] p-2.5 text-xs leading-relaxed text-[hsl(43_60%_75%)]">
                          {data.tarot.todayLesson}
                        </p>
                      </motion.div>
                    ) : (
                      <p className="text-center text-xs text-muted-foreground">
                        点击卡牌，揭开今日运势
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.section>

            {/* ===== 八字排盘 ===== */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25 }}
              className="mt-8"
            >
              <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-xl text-[hsl(43_85%_65%)]">
                    <Sparkle className="size-5" />
                    命盘
                    <span className="ml-auto text-xs font-normal text-muted-foreground">
                      出生公历 {BIRTH_DATE_STR}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2 md:gap-4">
                    {(['year', 'month', 'day', 'time'] as const).map((key, idx) => {
                      const pillar = data.fortune.pillars[key];
                      const isDayPillar = key === 'day';
                      return (
                        <div
                          key={key}
                          className={`relative flex flex-col items-center rounded-lg border p-2 md:p-4 ${
                            isDayPillar
                              ? 'border-[hsl(43_85%_58%)] bg-[hsl(43_85%_58%_/_0.08)] shadow-[0_0_20px_hsl(43_85%_58%_/_0.15)]'
                              : 'border-[hsl(43_30%_22%)] bg-[hsl(220_15%_12%)]'
                          }`}
                        >
                          <span className="mb-1 text-[10px] text-muted-foreground md:text-xs">
                            {PILLAR_LABELS[idx]}
                          </span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className={`text-center text-2xl font-bold md:text-3xl ${isDayPillar ? 'text-[hsl(43_85%_65%)]' : 'text-foreground'}`}>
                                  {pillar.gan}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%)] text-foreground">
                                <p className="text-xs">五行：{pillar.ganWuXing}</p>
                                <p className="text-xs">十神：{pillar.ganShiShen}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <Badge
                            variant="outline"
                            className={`mb-1 mt-0.5 border-[hsl(43_30%_22%)] px-1.5 py-0 text-[10px] md:text-xs ${
                              pillar.ganShiShen === '正官' || pillar.ganShiShen === '正印' || pillar.ganShiShen === '正财' || pillar.ganShiShen === '食神'
                                ? 'text-[hsl(130_54%_55%)]'
                                : pillar.ganShiShen === '七杀'
                                ? 'text-[hsl(0_84%_65%)]'
                                : 'text-[hsl(43_85%_65%)]'
                            }`}
                          >
                            {pillar.ganShiShen}
                          </Badge>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="text-center text-xl font-semibold text-foreground md:text-2xl">
                                  {pillar.zhi}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%)] text-foreground">
                                <p className="text-xs">五行：{pillar.zhiWuXing}</p>
                                <p className="text-xs">藏干：{pillar.hideGan.join('、')}</p>
                                <p className="text-xs">纳音：{pillar.naYin}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <span className="mt-0.5 text-[10px] text-muted-foreground md:text-xs">
                            {pillar.zhiWuXing}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div className="flex items-center justify-center gap-3 rounded-lg border border-[hsl(43_30%_22%)] bg-[hsl(220_15%_12%)] p-3 md:p-4">
                      <Info className="size-4 shrink-0 text-[hsl(43_85%_65%)]" />
                      <div className="text-sm">
                        <span className="text-muted-foreground">日主：</span>
                        <span className="font-bold text-[hsl(43_85%_65%)]">{data.fortune.dayGan}</span>
                        <span className="text-muted-foreground">（{data.fortune.dayGanWuXing} · {data.fortune.dayGanYinYang}）</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 rounded-lg border border-[hsl(43_30%_22%)] bg-[hsl(220_15%_12%)] p-3 md:p-4">
                      <div className="text-xs">
                        <span className="text-muted-foreground">五行分布：</span>
                        <div className="mt-1 flex gap-2">
                          {wuxingList.map((w) => (
                            <span key={w} className={`${wuxingCount[w] ? 'text-[hsl(43_85%_65%)]' : 'text-muted-foreground/40 line-through'}`}>
                              {w}{wuxingCount[w] || 0}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.section>

            {/* ===== 日期切换 + 三级运势 Tab ===== */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 space-y-4"
            >
              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrevDay}
                  className="text-[hsl(43_85%_65%)] hover:bg-[hsl(43_30%_22%)]"
                >
                  <ChevronLeft className="size-5" />
                </Button>
                <div className="flex flex-1 items-center justify-center gap-3">
                  <Calendar className="size-4 text-[hsl(43_85%_65%)]" />
                  <Input
                    type="date"
                    value={formatFortuneDate(fortuneDate)}
                    onChange={handleDateChange}
                    className="max-w-[180px] border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%)] text-center text-[hsl(43_85%_65%)] [color-scheme:dark]"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNextDay}
                  className="text-[hsl(43_85%_65%)] hover:bg-[hsl(43_30%_22%)]"
                >
                  <ChevronRight className="size-5" />
                </Button>
              </div>

              <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
                <CardContent className="pt-6">
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'day' | 'month' | 'year')}>
                    <TabsList className="grid w-full grid-cols-3 bg-[hsl(220_15%_12%)]">
                      <TabsTrigger value="day">今日</TabsTrigger>
                      <TabsTrigger value="month">本月</TabsTrigger>
                      <TabsTrigger value="year">本年</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardContent>
              </Card>

              {/* 对应 Tab 的运势详情 */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {activeTab === 'day' && (
                    <FortuneDetail unit={data.fortune.dayFortune} label="day" />
                  )}
                  {activeTab === 'month' && (
                    <FortuneDetail unit={data.fortune.monthFortune} label="month" />
                  )}
                  {activeTab === 'year' && (
                    <FortuneDetail unit={data.fortune.yearFortune} label="year" />
                  )}
                </motion.div>
              </AnimatePresence>

              {/* 月运年运快捷卡片 */}
              {activeTab === 'day' && (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <Card
                    className="cursor-pointer border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur transition-all hover:border-[hsl(43_85%_58%)] hover:shadow-[0_0_20px_hsl(43_85%_58%_/_0.1)]"
                    onClick={() => setActiveTab('month')}
                  >
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <TrendingUp className="size-4 text-[hsl(43_85%_65%)]" />
                          <span className="text-sm font-medium text-[hsl(43_85%_65%)]">本月概览</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {data.fortune.monthFortune.ganZhi} · {data.fortune.monthFortune.ganShiShen}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold tabular-nums text-[hsl(43_85%_65%)]">
                          {data.fortune.monthFortune.totalScore}
                        </span>
                        <span className={`text-sm font-bold ${data.fortune.monthFortune.fortuneLevel.color}`}>
                          {data.fortune.monthFortune.fortuneLevel.level}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                  <Card
                    className="cursor-pointer border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur transition-all hover:border-[hsl(43_85%_58%)] hover:shadow-[0_0_20px_hsl(43_85%_58%_/_0.1)]"
                    onClick={() => setActiveTab('year')}
                  >
                    <CardContent className="flex items-center justify-between p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sun className="size-4 text-[hsl(43_85%_65%)]" />
                          <span className="text-sm font-medium text-[hsl(43_85%_65%)]">本年概览</span>
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {data.fortune.yearFortune.ganZhi} · {data.fortune.yearFortune.ganShiShen}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold tabular-nums text-[hsl(43_85%_65%)]">
                          {data.fortune.yearFortune.totalScore}
                        </span>
                        <span className={`text-sm font-bold ${data.fortune.yearFortune.fortuneLevel.color}`}>
                          {data.fortune.yearFortune.fortuneLevel.level}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 免责声明 */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-6 text-center text-xs text-muted-foreground"
              >
                免责声明：本应用基于传统命理算法，仅供娱乐参考，不构成任何决策建议。
              </motion.p>
            </motion.section>
          </>
        )}

        {/* 加载中 */}
        {!data && isCalculating && (
          <div className="mt-16 text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full border border-[hsl(43_30%_22%)] bg-[hsl(220_15%_12%)]">
              <Sparkles className="size-7 animate-pulse text-[hsl(43_85%_65%)]" />
            </div>
            <p className="text-sm text-muted-foreground">
              正在推演命盘...
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// 运势详情子组件
function FortuneDetail({ unit, label }: { unit: FortuneUnit; label: string }) {
  const titleMap = { day: '今日运势', month: '本月运势', year: '本年运势' } as const;
  const ganZhiLabelMap = { day: '今日干支', month: '本月干支', year: '本年干支' } as const;
  const shiShenLabelMap = { day: '日天干十神', month: '月天干十神', year: '年天干十神' } as const;

  return (
    <>
      {/* 运势总览 */}
      <Card className="border-[hsl(43_30%_22%)] bg-gradient-to-br from-[hsl(220_15%_10%_/_0.9)] to-[hsl(220_15%_12%_/_0.9)] backdrop-blur">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between md:gap-6">
            <div className="flex flex-col items-center md:items-start">
              <span className="text-xs text-muted-foreground">{ganZhiLabelMap[label]}</span>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-[hsl(43_85%_65%)] md:text-4xl">
                  {unit.ganZhi}
                </span>
                <span className="text-sm text-muted-foreground">
                  {unit.ganWuXing}{unit.zhiWuXing}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {shiShenLabelMap[label]}：<span className="text-[hsl(43_85%_65%)]">{unit.ganShiShen}</span>
              </div>
            </div>

            <div className="flex flex-col items-center">
              <div className="text-6xl font-black tabular-nums tracking-tight md:text-7xl" style={{
                background: unit.totalScore >= 75
                  ? 'linear-gradient(135deg, hsl(43 85% 65%), hsl(43 85% 55%))'
                  : unit.totalScore >= 55
                  ? 'linear-gradient(135deg, hsl(40 25% 88%), hsl(40 15% 70%))'
                  : 'linear-gradient(135deg, hsl(40 10% 60%), hsl(40 5% 45%))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                {unit.totalScore}
              </div>
              <div className={`mt-1 text-lg font-bold ${unit.fortuneLevel.color}`}>
                {unit.fortuneLevel.level}
              </div>
              <span className="text-xs text-muted-foreground">综合运势</span>
            </div>

            <div className="flex flex-col items-center md:items-end">
              <span className="text-xs text-muted-foreground">地支关系</span>
              <div className="mt-1 flex flex-wrap justify-end gap-1 md:max-w-[160px]">
                {unit.zhiRelations.length > 0 ? (
                  unit.zhiRelations.map((rel, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className={`text-xs ${
                        rel.type === 'liuhe' || rel.type === 'sanhe'
                          ? 'border-[hsl(130_54%_42%)] text-[hsl(130_54%_55%)]'
                          : rel.type === 'liuchong'
                          ? 'border-[hsl(0_84%_60%)] text-[hsl(0_84%_70%)]'
                          : rel.type === 'sanxing' || rel.type === 'zixing'
                          ? 'border-[hsl(26_90%_49%)] text-[hsl(26_90%_60%)]'
                          : 'border-[hsl(43_30%_22%)] text-muted-foreground'
                      }`}
                    >
                      {rel.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">无明显合冲</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 四维度运势 */}
      <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-[hsl(43_85%_65%)]">
            <Sparkles className="size-5" />
            四维度运势
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {unit.dimensions.map((dim) => (
            <div key={dim.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{dim.name}</span>
                <span className="text-sm font-bold tabular-nums text-[hsl(43_85%_65%)]">
                  {dim.score}分
                </span>
              </div>
              <Progress
                value={dim.score}
                className="h-2 bg-[hsl(43_30%_22%)]"
              />
              <p className="text-xs text-muted-foreground">{dim.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 解读 */}
      <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-[hsl(43_85%_65%)]">
            <Info className="size-5" />
            {titleMap[label]}解读
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm leading-relaxed text-foreground/90">
          {unit.interpretation.map((p, i) => (
            <p key={i} className="indent-8">{p}</p>
          ))}
        </CardContent>
      </Card>

      {/* 宜忌 */}
      <Card className="border-[hsl(43_30%_22%)] bg-[hsl(220_15%_10%_/_0.8)] backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl text-[hsl(43_85%_65%)]">
            <Clock className="size-5" />
            {label === 'year' ? '本年宜忌' : label === 'month' ? '本月宜忌' : '今日宜忌'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-[hsl(130_54%_42%_/_0.4)] bg-[hsl(130_54%_42%_/_0.05)] p-4">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-[hsl(130_54%_55%)]">
                <span className="flex size-6 items-center justify-center rounded-full bg-[hsl(130_54%_42%_/_0.2)] text-sm">宜</span>
                宜做事项
              </h4>
              <ul className="space-y-2">
                {unit.yiJi.yi.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-[hsl(130_54%_55%)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-[hsl(0_84%_60%_/_0.4)] bg-[hsl(0_84%_60%_/_0.05)] p-4">
              <h4 className="mb-3 flex items-center gap-2 font-bold text-[hsl(0_84%_70%)]">
                <span className="flex size-6 items-center justify-center rounded-full bg-[hsl(0_84%_60%_/_0.2)] text-sm">忌</span>
                忌做事项
              </h4>
              <ul className="space-y-2">
                {unit.yiJi.ji.map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="size-1.5 shrink-0 rounded-full bg-[hsl(0_84%_70%)]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
