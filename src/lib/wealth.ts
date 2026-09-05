// EXPORTS: getWealthOverview, getSecondHandPhoneAdvice, getFinanceAdvice, type WealthOverview, type TradeAdvice
// 财运综合评分 + 交易建议生成

import {
  getTenGod,
  getWuXing,
  getZhiRelations,
  type ZhiRelation,
} from './bazi';
import { getAquariusFortune } from './constellation';
import { drawDailyTarot } from './tarot';

export interface WealthOverview {
  totalScore: number;
  level: string;
  levelColor: string;
  summary: string;
  direction: string; // 今日财运方向
  bestTimePeriod: string; // 最佳时间段
  forbiddenThing: string; // 禁忌事项
  baziWealthScore: number;
  constellationWealthScore: number;
  tarotFortuneScore: number;
}

export interface TradeAdvice {
  title: string;
  action: string; // 适合：买入/卖出/观望 等
  actionType: 'good' | 'neutral' | 'bad';
  tips: string[];
  notes: string[];
  // 子项（金融交易有两个子项）
  subItems?: {
    label: string;
    action: string;
    actionType: 'good' | 'neutral' | 'bad';
  }[];
}

// 十神财运基准分
const SHISHEN_WEALTH_SCORE: Record<string, number> = {
  '正财': 80,
  '偏财': 85,
  '食神': 65,
  '伤官': 55,
  '正印': 45,
  '偏印': 40,
  '正官': 50,
  '七杀': 35,
  '比肩': 30,
  '劫财': 20,
};

// 十神交易类型判定
const SHISHEN_TRADE_TYPE: Record<string, string> = {
  '正财': '正财日',
  '偏财': '偏财日',
  '食神': '食神日',
  '伤官': '伤官日',
  '正印': '印星日',
  '偏印': '印星日',
  '正官': '官杀日',
  '七杀': '官杀日',
  '比肩': '比劫日',
  '劫财': '比劫日',
};

function getLevel(score: number): { level: string; color: string } {
  if (score >= 85) return { level: '大吉', color: 'text-[hsl(43_85%_65%)]' };
  if (score >= 70) return { level: '吉', color: 'text-[hsl(130_54%_55%)]' };
  if (score >= 55) return { level: '平', color: 'text-[hsl(43_25%_60%)]' };
  if (score >= 35) return { level: '凶', color: 'text-[hsl(26_90%_60%)]' };
  return { level: '大凶', color: 'text-[hsl(0_84%_70%)]' };
}

// 地支关系修正分（财运维度）
function getZhiWealthModifier(relations: ZhiRelation[]): number {
  let mod = 0;
  for (const rel of relations) {
    if (rel.type === 'liuhe') mod += 10;
    else if (rel.type === 'sanhe') mod += 12;
    else if (rel.type === 'bansanhe') mod += 5;
    else if (rel.type === 'liuchong') mod -= 15;
    else if (rel.type === 'sanxing' || rel.type === 'zixing') mod -= 10;
    else if (rel.type === 'liuhai') mod -= 5;
  }
  return mod;
}

// 今日财运方向（根据日辰五行推导）
function getWealthDirection(dayZhi: string): string {
  const map: Record<string, string> = {
    '子': '正北方', '丑': '东北方', '寅': '东北方', '卯': '正东方',
    '辰': '东南方', '巳': '东南方', '午': '正南方', '未': '西南方',
    '申': '西南方', '酉': '正西方', '戌': '西北方', '亥': '西北方',
  };
  return map[dayZhi] || '正南方';
}

// 最佳时间段（根据时辰推导，用日支和日期混合）
function getBestTimePeriod(date: Date, dayGan: string): string {
  const dayMap: Record<string, [number, number]> = {
    '甲': [5, 7], '乙': [7, 9], '丙': [9, 11], '丁': [11, 13],
    '戊': [13, 15], '己': [15, 17], '庚': [17, 19], '辛': [19, 21],
    '壬': [21, 23], '癸': [23, 1],
  };
  const [start, end] = dayMap[dayGan] || [9, 11];
  const format = (h: number) => {
    if (h < 10) return `${h}时`;
    if (h >= 24) return `${h - 24}时`;
    return `${h}时`;
  };
  return `${format(start)} — ${format(end)}`;
}

// 禁忌事项
function getForbiddenThing(shiShen: string, liuchong: boolean): string {
  if (liuchong) return '大额交易/追涨杀跌';
  if (shiShen === '比肩' || shiShen === '劫财') return '与人合伙/借贷';
  if (shiShen === '七杀') return '短线操作/频繁交易';
  if (shiShen === '伤官') return '冲动决策/不听劝';
  return '贪心追高/满仓操作';
}

// 综合总结
function getWealthSummary(
  totalScore: number,
  shiShen: string,
  tarotName: string,
  tarotUpright: boolean,
): string {
  const tradeType = SHISHEN_TRADE_TYPE[shiShen] || '';
  const tarotPart = `${tarotName}${tarotUpright ? '正位' : '逆位'}`;

  if (totalScore >= 80) {
    return `今日${tradeType}，财运旺盛，配合${tarotPart}能量加持，主动出击有望斩获收益。`;
  }
  if (totalScore >= 65) {
    return `今日${tradeType}，财运尚可，${tarotPart}带来助力，稳健操作可有小获。`;
  }
  if (totalScore >= 50) {
    return `今日${tradeType}，财运平平，${tarotPart}影响下宜多看少动，等待时机。`;
  }
  if (totalScore >= 35) {
    return `今日${tradeType}，财运偏弱，${tarotPart}提示风险增加，保守为上。`;
  }
  return `今日${tradeType}，财运低迷，${tarotPart}警示强烈，空仓观望方为上策。`;
}

export function getWealthOverview(params: {
  dayGanZhi: string; // 日辰干支 如 "甲子"
  dayGan: string;    // 日主
  mingJuZhiList: string[];
  date: Date;
}): WealthOverview {
  const { dayGanZhi, dayGan, mingJuZhiList, date } = params;
  const gan = dayGanZhi.charAt(0);
  const zhi = dayGanZhi.charAt(1);
  const ganWuXing = getWuXing(gan);

  // 日辰天干十神
  const dayGanShiShen = getTenGod(dayGan, gan);

  // 八字财运分（百分制）
  const baseWealth = SHISHEN_WEALTH_SCORE[dayGanShiShen] || 50;
  const zhiRelations = getZhiRelations(zhi, mingJuZhiList);
  const zhiModifier = getZhiWealthModifier(zhiRelations);
  const baziWealthScore = Math.min(100, Math.max(0, baseWealth + zhiModifier));

  // 星座财运分
  const aquarius = getAquariusFortune(date);
  const constellationWealthScore = aquarius.dimensions.find(d => d.name === '财运')?.score || 50;

  // 塔罗吉凶分
  const tarot = drawDailyTarot(date);
  const tarotFortuneScore = tarot.fortuneScore;

  // 综合评分 = 八字 × 55% + 星座 × 23% + 塔罗 × 22%
  // 八字为核心体系；星座辅助参考；塔罗三牌阵占比提升至22%
  const totalScore = Math.round(
    baziWealthScore * 0.55 + constellationWealthScore * 0.23 + tarotFortuneScore * 0.22
  );

  const levelInfo = getLevel(totalScore);
  const summary = getWealthSummary(totalScore, dayGanShiShen, tarot.present.card.name, tarot.present.isUpright);

  const direction = getWealthDirection(zhi);
  const bestTime = getBestTimePeriod(date, gan);
  const hasLiuChong = zhiRelations.some(r => r.type === 'liuchong');
  const forbidden = getForbiddenThing(dayGanShiShen, hasLiuChong);

  return {
    totalScore,
    level: levelInfo.level,
    levelColor: levelInfo.color,
    summary,
    direction,
    bestTimePeriod: bestTime,
    forbiddenThing: forbidden,
    baziWealthScore,
    constellationWealthScore,
    tarotFortuneScore,
  };
}

// 二手手机交易建议
export function getSecondHandPhoneAdvice(params: {
  shiShen: string;
  zhiRelations: ZhiRelation[];
  score: number;
}): TradeAdvice {
  const { shiShen, zhiRelations, score } = params;
  const hasLiuHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
  const hasLiuChong = zhiRelations.some(r => r.type === 'liuchong');

  let action = '观望';
  let actionType: 'good' | 'neutral' | 'bad' = 'neutral';
  const tips: string[] = [];
  const notes: string[] = [];

  // 十神判定
  if (shiShen === '偏财') {
    action = '买卖皆宜';
    actionType = 'good';
    tips.push('偏财运旺，低买高卖空间大，有机会捡漏也有机会卖高价');
    tips.push('可以小批量快进快出，赚取差价效率高');
    tips.push('多平台比价，抓住价格波动的窗口期');
  } else if (shiShen === '正财') {
    action = '卖出';
    actionType = 'good';
    tips.push('正财稳定，出货顺畅利润可期，适合批量常规机型');
    tips.push('按市场价挂单即可，稳定出单不用急着降价');
    tips.push('适合做老客户复购和熟人生意，口碑带来持续收益');
  } else if (shiShen === '食神') {
    action = '买入';
    actionType = 'good';
    tips.push('眼光独到，能捡到性价比高的好货，适合进货');
    tips.push('适合学习手机维修技术，动手能力强、学得快');
    tips.push('可以多蹲拍机堂拍卖，有机会捡漏');
  } else if (shiShen === '伤官') {
    action = '买入';
    actionType = 'neutral';
    tips.push('有一定捡漏机会，但要仔细验机，避免看走眼');
    tips.push('适合研究新品类、新玩法，拓展产品线');
    notes.push('伤官日容易冲动消费，买之前三思');
  } else if (shiShen === '比肩' || shiShen === '劫财') {
    action = '观望';
    actionType = 'bad';
    tips.push('市场竞争激烈，同行压价严重，利润空间被压缩');
    tips.push('买家砍价狠，出货容易亏本金，不建议低价甩卖');
    notes.push('比劫日最忌跟人拼价格，守住利润才是王道');
  } else if (shiShen === '正官' || shiShen === '七杀') {
    action = '谨慎';
    actionType = 'bad';
    tips.push('容易遇到售后纠纷或奇葩买家，交易前留好证据');
    tips.push('收货要仔细验机，避免收到问题机维权困难');
    notes.push('官杀日压力大，不适合做大笔交易');
  } else {
    // 印星日
    action = '学习整理';
    actionType = 'neutral';
    tips.push('适合整理库存、记账复盘，不适合大进大出');
    tips.push('适合学习维修技术、研究新机型，提升自身能力');
    tips.push('优化listing文案和图片，为后续销售打基础');
  }

  // 地支修正
  if (hasLiuHe) {
    notes.push('今日地支六合，交易谈判顺畅，沟通效率高');
  }
  if (hasLiuChong) {
    notes.unshift('⚠️ 今日地支六冲，交易易出变故，务必谨慎');
    if (actionType === 'good') actionType = 'neutral';
  }

  return {
    title: '二手手机交易',
    action,
    actionType,
    tips: tips.slice(0, 3),
    notes,
  };
}

// 金融交易建议（美股长线 + 币圈合约）
export function getFinanceAdvice(params: {
  shiShen: string;
  zhiRelations: ZhiRelation[];
  score: number;
}): TradeAdvice {
  const { shiShen, zhiRelations, score } = params;
  const hasLiuChong = zhiRelations.some(r => r.type === 'liuchong');
  const hasLiuHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');

  let coinAction = '观望';
  let coinType: 'good' | 'neutral' | 'bad' = 'neutral';
  let stockAction = '持有';
  let stockType: 'good' | 'neutral' | 'bad' = 'neutral';
  const tips: string[] = [];
  const notes: string[] = [];

  // 十神判定
  if (shiShen === '偏财') {
    coinAction = '开仓';
    coinType = 'good';
    stockAction = '持有';
    stockType = 'good';
    tips.push('偏财旺，适合短线合约操作，波动中易获利');
    tips.push('美股长线可以继续持有，逢低可小幅加仓');
    tips.push('但要设置好止盈止损，不要贪多');
  } else if (shiShen === '正财') {
    coinAction = '观望';
    coinType = 'neutral';
    stockAction = '加仓';
    stockType = 'good';
    tips.push('正财主正财，适合美股长线价值投资');
    tips.push('合约交易以稳为主，不宜频繁开仓');
    tips.push('分批建仓优质标的，长期持有收益稳');
  } else if (shiShen === '食神' || shiShen === '伤官') {
    coinAction = '分析研究';
    coinType = 'neutral';
    stockAction = '研究调仓';
    stockType = 'neutral';
    tips.push('食伤日头脑灵活，适合做研究和分析，但不要急于操作');
    tips.push('可以复盘之前的交易，优化交易系统');
    tips.push('有新想法先记下来，等运势更好时再执行');
  } else if (shiShen === '比肩' || shiShen === '劫财') {
    coinAction = '不建议开仓';
    coinType = 'bad';
    stockAction = '持有不动';
    stockType = 'neutral';
    tips.push('比劫日竞争大，容易追高杀跌被割韭菜');
    tips.push('合约交易最忌盲目跟单，今天不操作就是赚');
    tips.push('美股长线继续持有，不要频繁调仓');
    notes.push('比劫日不要跟别人比收益，守住自己的节奏');
  } else if (shiShen === '正官' || shiShen === '七杀') {
    coinAction = '谨慎';
    coinType = 'bad';
    stockAction = '持有观望';
    stockType = 'neutral';
    tips.push('官杀日行情波动大，合约爆仓风险高');
    tips.push('压力大容易情绪化操作，建议空仓或小仓位');
    tips.push('美股长线不受短期波动影响，继续持有即可');
    notes.push('官杀日心态最关键，不要被行情带着走');
  } else {
    // 印星
    coinAction = '观望学习';
    coinType = 'neutral';
    stockAction = '持有';
    stockType = 'neutral';
    tips.push('印星日适合学习充电，研究技术和基本面');
    tips.push('不用急着交易，磨刀不误砍柴工');
    tips.push('复盘总结之前的操作，提升认知水平');
  }

  // 六冲修正
  if (hasLiuChong) {
    notes.unshift('⚠️ 今日地支六冲，行情波动剧烈，合约风险极高');
    if (coinType === 'good') {
      coinAction = '轻仓';
      coinType = 'neutral';
    } else if (coinType === 'neutral') {
      coinAction = '不建议操作';
      coinType = 'bad';
    }
  }

  if (hasLiuHe) {
    notes.push('地支六合，整体趋势相对顺畅');
  }

  return {
    title: '金融交易',
    action: '币圈合约' + coinAction + ' / 美股' + stockAction,
    actionType: (coinType === 'bad' ? 'bad'
      : coinType === 'good' || stockType === 'good' ? 'good' : 'neutral'),
    tips: tips.slice(0, 3),
    notes,
    subItems: [
      { label: '币圈合约', action: coinAction, actionType: coinType },
      { label: '美股长线', action: stockAction, actionType: stockType },
    ],
  };
}
