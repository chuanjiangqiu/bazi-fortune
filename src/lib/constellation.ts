// EXPORTS: getAquariusFortune, getAquariusDimensionScores, getLuckyInfo, type AquariusFortuneResult, type ConstellationDimension
// 水瓶座每日运势算法 —— 基于日期的确定性计算，无随机因素

export interface ConstellationDimension {
  name: string;
  score: number;
  description: string;
}

export interface AquariusFortuneResult {
  overallScore: number;
  overallLevel: string;
  overallColor: string;
  summary: string;
  dimensions: ConstellationDimension[];
  luckyNumber: number;
  luckyColor: string;
  luckyDirection: string;
  loveAdvice: string;
  careerAdvice: string;
}

// 水瓶座守护星：天王星。元素：风象。固定宫。
const AQUARIUS_TRAITS = {
  element: '风',
  ruler: '天王星',
  modality: '固定宫',
};

const LUCKY_COLORS = [
  '电光蓝', '银灰色', '青柠绿', '紫罗兰', '钴蓝色',
  '湖水蓝', '星空紫', '薄荷绿', '冰银色', '午夜蓝',
  '天青色', '极光绿',
];

const LUCKY_DIRECTIONS = [
  '东北方', '正北方', '西北方', '正东方', '东南方',
  '正南方', '正西方', '西南方',
];

// 分数等级
function getLevel(score: number): { level: string; color: string } {
  if (score >= 90) return { level: '大吉', color: 'text-[hsl(43_85%_65%)]' };
  if (score >= 75) return { level: '吉', color: 'text-[hsl(130_54%_55%)]' };
  if (score >= 55) return { level: '平', color: 'text-[hsl(43_25%_60%)]' };
  if (score >= 35) return { level: '凶', color: 'text-[hsl(26_90%_60%)]' };
  return { level: '大凶', color: 'text-[hsl(0_84%_70%)]' };
}

// 用日期做伪随机种子（确定性）
function seedFromDate(date: Date): number {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  // 混合运算生成 0-99 基础值
  return (y * 7 + m * 31 + d * 13 + (y % 100) * 17 + m * d * 3) % 100;
}

// 水瓶座特殊加成：水瓶月（1月20日-2月18日）整体运势加成
function isAquariusSeason(date: Date): number {
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if (m === 1 && d >= 20) return 10;
  if (m === 2 && d <= 18) return 10;
  // 本命生日附近额外加成
  if (m === 1 && d >= 18 && d <= 22) return 15;
  return 0;
}

// 星期几的影响
function weekdayFactor(date: Date): number {
  const day = date.getDay(); // 0=周日
  // 水瓶座幸运日：周六、周三
  if (day === 6) return 8;
  if (day === 3) return 5;
  // 一般：周二、周四
  if (day === 2 || day === 4) return 2;
  // 较弱：周一、周五、周日
  return -2;
}

// 各维度分数
function calcDimension(base: number, offset: number, mod: number): number {
  // 0-100 区间
  let score = (base * 3 + offset * 7 + mod * 5) % 100;
  // 让分数集中在 35-85 之间，不要太极端
  score = 35 + (score / 100) * 50;
  return score;
}

function getLoveScore(base: number, date: Date): { score: number; description: string } {
  const seasonBonus = isAquariusSeason(date);
  const weekdayBonus = weekdayFactor(date);
  const raw = calcDimension(base, 17, 23);
  const score = Math.min(100, Math.max(0, raw + seasonBonus * 0.5 + weekdayBonus * 0.3));

  let description: string;
  if (score >= 80) {
    description = '今日魅力值拉满，容易遇到志趣相投的人，单身者有望心动邂逅，有伴者相处融洽。';
  } else if (score >= 65) {
    description = '感情运势平稳，沟通顺畅，适合表达心意，注意不要太理性冷淡。';
  } else if (score >= 50) {
    description = '感情平平，可能因观念不同产生摩擦，给彼此一些空间会更好。';
  } else if (score >= 35) {
    description = '感情运稍弱，容易产生误解或冷战，建议低调处理感情问题。';
  } else {
    description = '今日不宜做重大感情决定，情绪波动较大，独处反思更有益。';
  }
  return { score, description };
}

function getCareerScore(base: number, date: Date): { score: number; description: string } {
  const seasonBonus = isAquariusSeason(date);
  const weekdayBonus = weekdayFactor(date);
  const raw = calcDimension(base, 29, 37);
  const score = Math.min(100, Math.max(0, raw + seasonBonus * 0.6 + weekdayBonus * 0.5));

  let description: string;
  if (score >= 80) {
    description = '创意爆棚的一天，独特想法容易得到认可，适合提出新方案或启动新项目。';
  } else if (score >= 65) {
    description = '事业运稳中有升，团队合作顺畅，执行效率高，适合推进手头工作。';
  } else if (score >= 50) {
    description = '工作运势平稳，按部就班即可，注意不要特立独行引发矛盾。';
  } else if (score >= 35) {
    description = '事业运稍低迷，可能遇到阻碍或被误解，沉住气默默积累更重要。';
  } else {
    description = '今日事业压力较大，容易与同事或上级产生分歧，宜低调行事。';
  }
  return { score, description };
}

function getWealthScore(base: number, date: Date): { score: number; description: string } {
  const seasonBonus = isAquariusSeason(date);
  const weekdayBonus = weekdayFactor(date);
  const raw = calcDimension(base, 41, 43);
  const score = Math.min(100, Math.max(0, raw + seasonBonus * 0.7 + weekdayBonus * 0.4));

  let description: string;
  if (score >= 80) {
    description = '财运亨通，偏财运旺，意外收入机会增多，投资理财易有斩获。';
  } else if (score >= 65) {
    description = '财运向好，正财稳定，适合做财务规划或长期投资布局。';
  } else if (score >= 50) {
    description = '财运中平，收支平衡，不宜冒进，守住本金就是胜利。';
  } else if (score >= 35) {
    description = '财运稍弱，容易有意外支出，谨慎消费，避免冲动投资。';
  } else {
    description = '今日财运不佳，忌大额投资和投机，守财为上，不要追涨杀跌。';
  }
  return { score, description };
}

function getHealthScore(base: number, date: Date): { score: number; description: string } {
  const seasonBonus = isAquariusSeason(date);
  const weekdayBonus = weekdayFactor(date);
  const raw = calcDimension(base, 53, 59);
  const score = Math.min(100, Math.max(0, raw + seasonBonus * 0.3 + weekdayBonus * 0.2));

  let description: string;
  if (score >= 80) {
    description = '身体状态极佳，精力充沛，适合运动健身或户外活动。';
  } else if (score >= 65) {
    description = '健康状况良好，注意规律作息和饮食，保持好心情。';
  } else if (score >= 50) {
    description = '健康状况一般，容易疲劳，注意休息，避免熬夜。';
  } else if (score >= 35) {
    description = '身体略有不适，可能睡眠不佳或胃口不好，注意调养。';
  } else {
    description = '今日健康运弱，谨防感冒或肠胃问题，多喝温水少熬夜。';
  }
  return { score, description };
}

function getLuckyNumber(base: number): number {
  // 水瓶座幸运数字：4、7、8、11、22
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 13, 17, 22, 29, 33];
  return numbers[base % numbers.length];
}

function getLuckyColor(base: number): string {
  return LUCKY_COLORS[base % LUCKY_COLORS.length];
}

function getLuckyDirection(base: number): string {
  return LUCKY_DIRECTIONS[base % LUCKY_DIRECTIONS.length];
}

// 综合解读
function getSummary(overall: number, wealthScore: number, careerScore: number): string {
  if (overall >= 85) {
    return `今日水瓶座能量强劲，思维活跃创意多，${wealthScore >= 70 ? '财运看涨，适合主动出击' : '虽财运一般但贵人运好'}，把握机会乘胜追击。`;
  }
  if (overall >= 70) {
    return `今日整体运势向好，${careerScore >= 70 ? '事业上容易突破' : '稳扎稳打即可'}，保持开放心态会有意外收获。`;
  }
  if (overall >= 55) {
    return `今日运势平稳，${wealthScore < 50 ? '财运方面需要谨慎，不宜冒进' : '财务状况尚可'}，做好分内事就是最好的策略。`;
  }
  if (overall >= 40) {
    return `今日运势稍显低迷，情绪容易波动，建议低调行事、沉淀自己，不宜做重大决策。`;
  }
  return `今日运势较弱，诸事需谨慎，多关注自身状态，养精蓄锐等待转机。`;
}

export function getAquariusFortune(date: Date): AquariusFortuneResult {
  const base = seedFromDate(date);

  const love = getLoveScore(base, date);
  const career = getCareerScore(base, date);
  const wealth = getWealthScore(base, date);
  const health = getHealthScore(base, date);
  // 分数取整
  love.score = Math.round(love.score);
  career.score = Math.round(career.score);
  wealth.score = Math.round(wealth.score);
  health.score = Math.round(health.score);

  // 综合分：四维加权平均 + 水瓶季节加成
  const seasonBonus = isAquariusSeason(date);
  const overallRaw = (love.score * 0.2 + career.score * 0.3 + wealth.score * 0.3 + health.score * 0.2) + seasonBonus * 0.5;
  const overallScore = Math.min(100, Math.max(0, Math.round(overallRaw)));
  const levelInfo = getLevel(overallScore);

  const dimensions: ConstellationDimension[] = [
    { name: '爱情', score: love.score, description: love.description },
    { name: '事业', score: career.score, description: career.description },
    { name: '财运', score: wealth.score, description: wealth.description },
    { name: '健康', score: health.score, description: health.description },
  ];

  const summary = getSummary(overallScore, wealth.score, career.score);
  const luckyNumber = getLuckyNumber(base);
  const luckyColor = getLuckyColor(base + 5);
  const luckyDirection = getLuckyDirection(base + 3);

  // 针对性建议
  const loveAdvice = love.score >= 70 ? '主动表达心意' : '保持距离冷静';
  const careerAdvice = career.score >= 70 ? '大胆推进项目' : '稳扎稳打为主';

  return {
    overallScore,
    overallLevel: levelInfo.level,
    overallColor: levelInfo.color,
    summary,
    dimensions,
    luckyNumber,
    luckyColor,
    luckyDirection,
    loveAdvice,
    careerAdvice,
  };
}

export function getAquariusDimensionScores(date: Date): ConstellationDimension[] {
  return getAquariusFortune(date).dimensions;
}

export function getLuckyInfo(date: Date) {
  const base = seedFromDate(date);
  return {
    luckyNumber: getLuckyNumber(base),
    luckyColor: getLuckyColor(base + 5),
    luckyDirection: getLuckyDirection(base + 3),
    traits: AQUARIUS_TRAITS,
  };
}
