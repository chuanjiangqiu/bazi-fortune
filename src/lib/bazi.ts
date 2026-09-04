// EXPORTS: getTenGod, getWuXing, getYinYang, getZhiRelations, getFortuneScore, getDimensionScores, generateInterpretation, generateYiJi, getFortuneLevel, calcFortuneByGanZhi, type ZhiRelation, type DimensionScore, type FortuneByGanZhiResult

// 天干五行
const GAN_WUXING: Record<string, string> = {
  甲: '木', 乙: '木',
  丙: '火', 丁: '火',
  戊: '土', 己: '土',
  庚: '金', 辛: '金',
  壬: '水', 癸: '水',
};

// 天干阴阳
const GAN_YINYANG: Record<string, '阳' | '阴'> = {
  甲: '阳', 丙: '阳', 戊: '阳', 庚: '阳', 壬: '阳',
  乙: '阴', 丁: '阴', 己: '阴', 辛: '阴', 癸: '阴',
};

// 地支五行
const ZHI_WUXING: Record<string, string> = {
  子: '水', 丑: '土', 寅: '木', 卯: '木',
  辰: '土', 巳: '火', 午: '火', 未: '土',
  申: '金', 酉: '金', 戌: '土', 亥: '水',
};

// 五行生克
// 生: 木→火→土→金→水→木
const WUXING_SHENG: Record<string, string> = {
  木: '火', 火: '土', 土: '金', 金: '水', 水: '木',
};
// 克: 木→土→水→火→金→木
const WUXING_KE: Record<string, string> = {
  木: '土', 土: '水', 水: '火', 火: '金', 金: '木',
};

// 六冲对
const LIU_CHONG: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

// 六合对
const LIU_HE: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

// 三合局
const SAN_HE: string[][] = [
  ['申', '子', '辰'],  // 水局
  ['亥', '卯', '未'],  // 木局
  ['寅', '午', '戌'],  // 火局
  ['巳', '酉', '丑'],  // 金局
];

// 三刑
const SAN_XING: string[][] = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
  ['子', '卯'],
];

// 自刑
const ZI_XING: string[] = ['辰', '午', '酉', '亥'];

// 六害
const LIU_HAI: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'],
  ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

// 桃花地支
const TAOHUA_ZHI = ['子', '午', '卯', '酉'];

export type ZhiRelationType = 'liuhe' | 'sanhe' | 'bansanhe' | 'liuchong' | 'sanxing' | 'zixing' | 'liuhai';

export interface ZhiRelation {
  type: ZhiRelationType;
  name: string;
  targetZhi: string;
}

/**
 * 获取天干五行
 */
export function getWuXing(gan: string): string {
  return GAN_WUXING[gan] || '';
}

/**
 * 获取天干阴阳
 */
export function getYinYang(gan: string): '阳' | '阴' {
  return GAN_YINYANG[gan] || '阳';
}

/**
 * 计算十神：以 dayGan（日主）为"我"，targetGan 为目标天干
 */
export function getTenGod(dayGan: string, targetGan: string): string {
  const myWuxing = GAN_WUXING[dayGan];
  const targetWuxing = GAN_WUXING[targetGan];
  const myYinYang = GAN_YINYANG[dayGan];
  const targetYinYang = GAN_YINYANG[targetGan];
  const sameYinYang = myYinYang === targetYinYang;

  if (!myWuxing || !targetWuxing) return '';

  // 同我
  if (myWuxing === targetWuxing) {
    return sameYinYang ? '比肩' : '劫财';
  }

  // 我生
  if (WUXING_SHENG[myWuxing] === targetWuxing) {
    return sameYinYang ? '食神' : '伤官';
  }

  // 我克
  if (WUXING_KE[myWuxing] === targetWuxing) {
    return sameYinYang ? '偏财' : '正财';
  }

  // 克我
  if (WUXING_KE[targetWuxing] === myWuxing) {
    return sameYinYang ? '七杀' : '正官';
  }

  // 生我
  if (WUXING_SHENG[targetWuxing] === myWuxing) {
    return sameYinYang ? '偏印' : '正印';
  }

  return '';
}

/**
 * 判断日辰地支与命局地支之间的关系
 */
export function getZhiRelations(dayZhi: string, mingJuZhiList: string[]): ZhiRelation[] {
  const relations: ZhiRelation[] = [];

  // 六合
  for (const [a, b] of LIU_HE) {
    if (dayZhi === a && mingJuZhiList.includes(b)) {
      relations.push({ type: 'liuhe', name: '六合', targetZhi: b });
    } else if (dayZhi === b && mingJuZhiList.includes(a)) {
      relations.push({ type: 'liuhe', name: '六合', targetZhi: a });
    }
  }

  // 三合（日支与命局中任意两个构成三合局）
  for (const trio of SAN_HE) {
    if (trio.includes(dayZhi)) {
      const others = trio.filter(z => z !== dayZhi);
      const found = others.filter(z => mingJuZhiList.includes(z));
      if (found.length >= 2) {
        relations.push({ type: 'sanhe', name: '三合', targetZhi: found.join('、') });
      } else if (found.length === 1) {
        relations.push({ type: 'bansanhe', name: '半三合', targetZhi: found[0] });
      }
    }
  }

  // 六冲
  for (const [a, b] of LIU_CHONG) {
    if (dayZhi === a && mingJuZhiList.includes(b)) {
      relations.push({ type: 'liuchong', name: '六冲', targetZhi: b });
    } else if (dayZhi === b && mingJuZhiList.includes(a)) {
      relations.push({ type: 'liuchong', name: '六冲', targetZhi: a });
    }
  }

  // 三刑
  for (const trio of SAN_XING) {
    if (trio.includes(dayZhi)) {
      const others = trio.filter(z => z !== dayZhi);
      const found = others.filter(z => mingJuZhiList.includes(z));
      if (found.length >= 2) {
        relations.push({ type: 'sanxing', name: '三刑', targetZhi: found.join('、') });
      } else if (found.length === 1 && trio.length === 2) {
        // 子卯刑（两位）
        relations.push({ type: 'sanxing', name: '相刑', targetZhi: found[0] });
      }
    }
  }

  // 自刑（日辰地支属自刑支，且命局中出现该支，即伏吟自刑）
  if (ZI_XING.includes(dayZhi) && mingJuZhiList.includes(dayZhi)) {
    relations.push({ type: 'zixing', name: '自刑', targetZhi: dayZhi });
  }

  // 六害
  for (const [a, b] of LIU_HAI) {
    if (dayZhi === a && mingJuZhiList.includes(b)) {
      relations.push({ type: 'liuhai', name: '六害', targetZhi: b });
    } else if (dayZhi === b && mingJuZhiList.includes(a)) {
      relations.push({ type: 'liuhai', name: '六害', targetZhi: a });
    }
  }

  return relations;
}

/**
 * 十神吉凶基准分范围
 */
// 十神吉凶基准分（固定值，确保同一八字同日结果完全一致）
const TEN_GOD_BASE_SCORE: Record<string, number> = {
  正印: 22,
  正官: 20,
  正财: 18,
  食神: 15,
  偏印: 10,
  偏财: 8,
  比肩: 5,
  劫财: -5,
  伤官: -8,
  七杀: -15,
};

/**
 * 计算综合运势评分
 */
export interface FortuneScoreInput {
  dayGanShiShen: string;       // 日天干对日主的十神
  zhiRelations: ZhiRelation[]; // 地支关系
  mingJuWuxing: string[];      // 命局所有五行（天干+地支）
  dayGanWuXing: string;        // 日天干五行
  dayZhiWuXing: string;        // 日地支五行
}

export function getFortuneScore(input: FortuneScoreInput): number {
  let score = 50; // 基准分

  // 十神分
  const tenGodScore = TEN_GOD_BASE_SCORE[input.dayGanShiShen] ?? 0;
  score += tenGodScore;

  // 地支修正
  for (const rel of input.zhiRelations) {
    switch (rel.type) {
      case 'liuhe':
        score += 10;
        break;
      case 'sanhe':
        score += 12;
        break;
      case 'bansanhe':
        score += 5;
        break;
      case 'liuchong':
        score -= 15;
        break;
      case 'sanxing':
      case 'zixing':
        score -= 10;
        break;
      case 'liuhai':
        score -= 5;
        break;
    }
  }

  // 五行平衡修正：当日干支五行如果是命局所缺五行
  const uniqueWuxing = Array.from(new Set(input.mingJuWuxing));
  const fiveElements = ['金', '木', '水', '火', '土'];
  const missingWuxing = fiveElements.filter(w => !uniqueWuxing.includes(w));
  if (missingWuxing.includes(input.dayGanWuXing)) score += 5;
  if (missingWuxing.includes(input.dayZhiWuXing)) score += 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export interface DimensionScore {
  name: string;
  score: number;
  description: string;
}

/**
 * 四维度运势评分
 */
export function getDimensionScores(
  dayGanShiShen: string,
  zhiRelations: ZhiRelation[],
  gender: '男' | '女',
  dayZhi: string,
  riZhi: string, // 日支（命局日柱地支）
): DimensionScore[] {
  const hasChong = zhiRelations.some(r => r.type === 'liuchong');
  const hasHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
  const hasXing = zhiRelations.some(r => r.type === 'sanxing' || r.type === 'zixing');
  const hasHai = zhiRelations.some(r => r.type === 'liuhai');
  const isTaohuaDay = TAOHUA_ZHI.includes(dayZhi);
  const riZhiChong = hasChong && zhiRelations.some(r => r.targetZhi.includes(riZhi));

  // 事业维度
  let careerScore = 60;
  let careerDesc = '';
  if (dayGanShiShen === '正官' || dayGanShiShen === '七杀') {
    careerScore = dayGanShiShen === '正官' ? 85 : 72;
    careerDesc = '官杀当值，事业决策力强，适合推进重要工作与谈判。';
  } else if (dayGanShiShen === '正印' || dayGanShiShen === '偏印') {
    careerScore = dayGanShiShen === '正印' ? 82 : 75;
    careerDesc = '印星助力，宜学习规划、文案整理、知识输出类工作。';
  } else if (dayGanShiShen === '比肩' || dayGanShiShen === '劫财') {
    careerScore = 68;
    careerDesc = '比劫相逢，利于团队合作，但需提防竞争与利益分配。';
  } else if (dayGanShiShen === '食神' || dayGanShiShen === '伤官') {
    careerScore = 72;
    careerDesc = '食伤吐秀，创意灵感丰富，适合策划、创作类事务。';
  } else {
    careerScore = 78;
    careerDesc = '财星当值，工作务实高效，利于商务洽谈与业绩推进。';
  }
  if (hasHe) careerScore += 5;
  if (hasChong) careerScore -= 12;
  if (hasXing) careerScore -= 8;
  careerScore = Math.max(0, Math.min(100, careerScore));

  // 财运维度
  let wealthScore = 60;
  let wealthDesc = '';
  if (dayGanShiShen === '正财' || dayGanShiShen === '偏财') {
    wealthScore = dayGanShiShen === '正财' ? 82 : 78;
    wealthDesc = '财星高照，正偏财皆有进账机遇，适合投资理财与商务合作。';
  } else if (dayGanShiShen === '食神' || dayGanShiShen === '伤官') {
    wealthScore = 70;
    wealthDesc = '食伤生财，财源有门路，但需主动把握机会，不宜坐等。';
  } else if (dayGanShiShen === '比肩' || dayGanShiShen === '劫财') {
    wealthScore = 48;
    wealthDesc = '比劫夺财，今日宜守不宜攻，谨防破财与大额支出。';
  } else if (dayGanShiShen === '正印' || dayGanShiShen === '偏印') {
    wealthScore = 65;
    wealthDesc = '印星护身，财运平稳，偏财运弱，宜求稳为主。';
  } else {
    wealthScore = 58;
    wealthDesc = '官杀当值，财为用但需防压力，求财宜稳进。';
  }
  if (hasHe) wealthScore += 6;
  if (hasChong) wealthScore -= 15;
  if (hasHai) wealthScore -= 5;
  wealthScore = Math.max(0, Math.min(100, wealthScore));

  // 感情维度
  let loveScore = 60;
  let loveDesc = '';
  if (gender === '男' && (dayGanShiShen === '正财' || dayGanShiShen === '偏财')) {
    loveScore = 80;
    loveDesc = '妻星当值，男命感情顺遂，利于约会表白与增进关系。';
  } else if (gender === '女' && (dayGanShiShen === '正官' || dayGanShiShen === '七杀')) {
    loveScore = 78;
    loveDesc = '夫星显现，女命异性缘佳，感情有升温之象。';
  } else if (isTaohuaDay) {
    loveScore = 75;
    loveDesc = '桃花当值，社交运旺盛，单身者有望结识良缘。';
  } else if (dayGanShiShen === '食神' || dayGanShiShen === '伤官') {
    loveScore = 68;
    loveDesc = '食伤当值，情绪外露需收敛，感情宜多沟通少挑剔。';
  } else if (dayGanShiShen === '比肩' || dayGanShiShen === '劫财') {
    loveScore = 55;
    loveDesc = '比劫争辉，感情易有竞争与摩擦，需多包容。';
  } else {
    loveScore = 65;
    loveDesc = '感情运势平稳，宜维系现状，勿强求突破。';
  }
  if (riZhiChong) {
    loveScore -= 18;
    loveDesc += '日支逢冲，情侣间易生矛盾，宜多忍让。';
  }
  if (hasHe && !riZhiChong) loveScore += 5;
  loveScore = Math.max(0, Math.min(100, loveScore));

  // 健康维度
  let healthScore = 70;
  let healthDesc = '身体状况总体平稳，作息规律为宜。';
  if (dayGanShiShen === '七杀') {
    healthScore = 52;
    healthDesc = '七杀当值，精神压力较大，注意休息与意外伤害防范。';
  } else if (hasChong) {
    healthScore = 58;
    healthDesc = '地支相冲，气血易紊乱，注意出行安全与劳逸结合。';
  } else if (hasXing) {
    healthScore = 60;
    healthDesc = '地支相刑，身体易有小疾，注意饮食规律与情绪调摄。';
  } else if (dayGanShiShen === '正印') {
    healthScore = 82;
    healthDesc = '印星护身，身心舒畅，精神状态良好。';
  } else if (dayGanShiShen === '食神') {
    healthScore = 78;
    healthDesc = '食神吐秀，食欲佳心情好，适合休闲养生。';
  }
  if (hasHai) healthScore -= 5;
  healthScore = Math.max(0, Math.min(100, healthScore));

  return [
    { name: '事业', score: careerScore, description: careerDesc },
    { name: '财运', score: wealthScore, description: wealthDesc },
    { name: '感情', score: loveScore, description: loveDesc },
    { name: '健康', score: healthScore, description: healthDesc },
  ];
}

/**
 * 获取运势等级
 */
export function getFortuneLevel(score: number): { level: string; color: string } {
  if (score >= 90) return { level: '大吉', color: 'text-[hsl(145_50%_65%)]' };
  if (score >= 75) return { level: '吉', color: 'text-[hsl(145_50%_60%)]' };
  if (score >= 55) return { level: '平', color: 'text-[hsl(43_30%_65%)]' };
  if (score >= 35) return { level: '凶', color: 'text-[hsl(5_80%_70%)]' };
  return { level: '大凶', color: 'text-[hsl(5_80%_65%)]' };
}

/**
 * 生成今日解读
 */
export function generateInterpretation(
  dayGanShiShen: string,
  zhiRelations: ZhiRelation[],
  score: number,
  dayGanZhi: string,
): string[] {
  const paragraphs: string[] = [];

  // 第一段：十神总论
  const godDescriptions: Record<string, string> = {
    正官: '今日正官主事，行事端正有序，贵人运佳，适合推进公务、签约、面试等正式场合。为人处世以礼相待，易得他人敬重。',
    七杀: '今日七杀当值，气场强势但压力并存。宜主动出击但避免冲动，面对挑战需冷静应对，谨防小人是非与意外伤害。',
    正印: '今日正印护身，思维清晰记忆力佳，是学习充电、读书写作的好日子。长辈贵人暗中相助，内心安定平和。',
    偏印: '今日偏印透出，灵感直觉敏锐，适合研究、策划、创意类工作。但需注意情绪起伏，不宜钻牛角尖。',
    比肩: '今日比肩相逢，合作运佳，适合团队协作与朋友聚会。但竞争意识增强，财务上需谨慎，避免替人担保。',
    劫财: '今日劫财当值，人际活跃但暗藏竞争。求财需防破财，合作需明算账，感情上易有摩擦，以和为贵。',
    食神: '今日食神吐秀，心情愉悦思路开阔，创意灵感源源不断。适合享受生活、品尝美食、休闲娱乐，身心舒畅。',
    伤官: '今日伤官透出，才华横溢但锋芒易露。表达需注意方式，避免口舌是非。创意工作者灵感迸发，宜把握时机。',
    正财: '今日正财当值，财运亨通，工作务实高效。正财稳定收入可期，适合理财规划、商务洽谈，求财有道。',
    偏财: '今日偏财显现，偏财运旺，可能有意外之财或额外收入。但财来财去需谨慎，不宜投机赌博，见好就收。',
  };

  paragraphs.push(godDescriptions[dayGanShiShen] || '今日运势平稳，顺其自然为宜。');

  // 第二段：地支关系
  if (zhiRelations.length > 0) {
    const relNames = zhiRelations.map(r => r.name + '（' + r.targetZhi + '）').join('、');
    const positive = zhiRelations.filter(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
    const negative = zhiRelations.filter(r => r.type !== 'liuhe' && r.type !== 'sanhe' && r.type !== 'bansanhe');

    let zhiText = `日辰与命局地支形成${relNames}。`;
    if (positive.length > 0) {
      zhiText += '合局为吉，人缘和合，事情容易得到助力与支持。';
    }
    if (negative.length > 0) {
      const negNames = negative.map(n => n.name).join('、');
      zhiText += `${negNames}则需谨慎，行事宜稳不宜急，注意防范突发状况与人际摩擦。`;
    }
    paragraphs.push(zhiText);
  } else {
    paragraphs.push(`日辰${dayGanZhi}与命局地支无明显合冲刑害，运势平稳无大波澜，宜按部就班、循序渐进。`);
  }

  // 第三段：综合建议
  if (score >= 85) {
    paragraphs.push('综合运势极佳，万事皆宜。把握今日良机，积极进取，必有所获。');
  } else if (score >= 70) {
    paragraphs.push('综合运势偏吉，顺势而为可有所成。保持平和心态，稳扎稳打。');
  } else if (score >= 55) {
    paragraphs.push('综合运势中等，吉凶参半。宜守不宜攻，做好分内之事即可，不必强求。');
  } else if (score >= 40) {
    paragraphs.push('综合运势偏弱，宜低调行事、韬光养晦。遇事三思而后行，避免冲突与风险。');
  } else {
    paragraphs.push('今日运势欠佳，诸事需格外谨慎。宜静不宜动，养精蓄锐，等待时机好转。');
  }

  return paragraphs;
}

/**
 * 通用：根据干支计算运势（日/月/年通用核心逻辑）
 */
export interface FortuneByGanZhiInput {
  ganZhi: string;          // 干支字符串，如 "壬午"
  dayGan: string;          // 日主天干
  mingJuZhiList: string[]; // 命局四个地支
  mingJuWuxing: string[];  // 命局所有五行
  gender: '男' | '女';
  riZhi: string;           // 命局日支
  scope: 'day' | 'month' | 'year';
}

export interface FortuneByGanZhiResult {
  ganZhi: string;
  gan: string;
  zhi: string;
  ganWuXing: string;
  zhiWuXing: string;
  ganShiShen: string;
  zhiRelations: ZhiRelation[];
  totalScore: number;
  fortuneLevel: { level: string; color: string };
  dimensions: DimensionScore[];
  interpretation: string[];
  yiJi: { yi: string[]; ji: string[] };
}

export function calcFortuneByGanZhi(input: FortuneByGanZhiInput): FortuneByGanZhiResult {
  const { ganZhi, dayGan, mingJuZhiList, mingJuWuxing, gender, riZhi, scope } = input;
  const gan = ganZhi.charAt(0);
  const zhi = ganZhi.charAt(1);
  const ganWuXing = getWuXing(gan);
  const zhiWuXing = ZHI_WUXING[zhi] || '';
  const ganShiShen = getTenGod(dayGan, gan);
  const zhiRelations = getZhiRelations(zhi, mingJuZhiList);

  const totalScore = getFortuneScore({
    dayGanShiShen: ganShiShen,
    zhiRelations,
    mingJuWuxing,
    dayGanWuXing: ganWuXing,
    dayZhiWuXing: zhiWuXing,
  });

  const fortuneLevel = getFortuneLevel(totalScore);
  const dimensions = getDimensionScores(ganShiShen, zhiRelations, gender, zhi, riZhi);

  let interpretation: string[];
  let yiJi: { yi: string[]; ji: string[] };

  if (scope === 'year') {
    interpretation = generateYearInterpretation(ganShiShen, zhiRelations, totalScore, ganZhi);
    yiJi = generateYearYiJi(ganShiShen, zhiRelations);
  } else if (scope === 'month') {
    interpretation = generateMonthInterpretation(ganShiShen, zhiRelations, totalScore, ganZhi);
    yiJi = generateMonthYiJi(ganShiShen, zhiRelations);
  } else {
    interpretation = generateInterpretation(ganShiShen, zhiRelations, totalScore, ganZhi);
    yiJi = generateYiJi(ganShiShen, zhiRelations);
  }

  return {
    ganZhi,
    gan,
    zhi,
    ganWuXing,
    zhiWuXing,
    ganShiShen,
    zhiRelations,
    totalScore,
    fortuneLevel,
    dimensions,
    interpretation,
    yiJi,
  };
}

/**
 * 生成日度解读
 */
export function generateYiJi(dayGanShiShen: string, zhiRelations: ZhiRelation[]): { yi: string[]; ji: string[] } {
  const hasChong = zhiRelations.some(r => r.type === 'liuchong');
  const hasHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
  const hasXing = zhiRelations.some(r => r.type === 'sanxing' || r.type === 'zixing');

  const yiBase: string[] = [];
  const jiBase: string[] = [];

  // 十神对应宜忌
  switch (dayGanShiShen) {
    case '正官':
      yiBase.push('求职面试', '签约合作', '拜见长辈', '公务办理');
      jiBase.push('争执诉讼', '冒险投机', '张扬跋扈');
      break;
    case '七杀':
      yiBase.push('主动出击', '突破困境', '健身运动', '决策果断');
      jiBase.push('冲动行事', '与人争斗', '深夜外出', '危险活动');
      break;
    case '正印':
      yiBase.push('读书学习', '报考考证', '孝敬长辈', '修身养性');
      jiBase.push('熬夜通宵', '过度思虑', '搬家远行');
      break;
    case '偏印':
      yiBase.push('创意策划', '研究探索', '打坐冥想', '艺术创作');
      jiBase.push('固执己见', '钻牛角尖', '暴饮暴食');
      break;
    case '比肩':
      yiBase.push('朋友聚会', '团队合作', '健身锻炼', '开源节流');
      jiBase.push('合伙投资', '替人担保', '大额借贷');
      break;
    case '劫财':
      yiBase.push('社交拓展', '锻炼身体', '整理内务');
      jiBase.push('投资理财', '大额支出', '与人争执', '酒后失言');
      break;
    case '食神':
      yiBase.push('美食烹饪', '休闲度假', '创意设计', '陪伴家人');
      jiBase.push('节食减肥', '过度劳累', '争执冲突');
      break;
    case '伤官':
      yiBase.push('创意写作', '艺术表演', '技能提升', '表达自我');
      jiBase.push('口无遮拦', '顶撞上司', '感情用事');
      break;
    case '正财':
      yiBase.push('理财规划', '商务洽谈', '开业开市', '催旺财运');
      jiBase.push('借钱不还', '奢侈浪费', '贪小便宜');
      break;
    case '偏财':
      yiBase.push('投资理财', '商务应酬', '争取业绩', '开拓新局');
      jiBase.push('投机赌博', '见利忘义', '铺张浪费');
      break;
    default:
      yiBase.push('按部就班', '修身养性');
      jiBase.push('冒险行事');
  }

  // 地支关系宜忌修正
  if (hasChong) {
    yiBase.splice(0, 0, '低调行事', '求稳守成');
    jiBase.push('出行远行', '重大决策', '与人冲突');
  }
  if (hasHe) {
    yiBase.push('社交联谊', '求媒说合', '增进感情');
  }
  if (hasXing) {
    jiBase.push('打官司', '医疗手术', '与人结怨');
  }

  // 去重
  const yi = Array.from(new Set(yiBase)).slice(0, 6);
  const ji = Array.from(new Set(jiBase)).slice(0, 5);

  return { yi, ji };
}

/**
 * 生成年度解读
 */
function generateYearInterpretation(
  ganShiShen: string,
  zhiRelations: ZhiRelation[],
  score: number,
  ganZhi: string,
): string[] {
  const paragraphs: string[] = [];

  const yearGodDescs: Record<string, string> = {
    正官: '流年正官主事，全年事业运旺盛，贵人扶持，适合稳扎稳打、谋求晋升。正官之年宜守规矩、重信用，职场发展可期。',
    七杀: '流年七杀当值，是充满挑战与机遇的一年。压力虽大，但爆发力强，宜主动出击、突破现状，同时注意健康与小人是非。',
    正印: '流年正印护身，全年学习运与长辈贵人运俱佳。适合深造、考证、谋划长远发展，内心安定，做事顺遂。',
    偏印: '流年偏印透出，灵感与直觉敏锐，适合研究、策划、转行或开拓新领域。但需防情绪起伏，不宜钻牛角尖。',
    比肩: '流年比肩相逢，合作与竞争并存。人脉拓展有利，但财务上需谨慎，避免合伙投资与替人担保，宜守不宜攻。',
    劫财: '流年劫财当值，人际活跃但暗藏竞争。求财防破财，合作需明算账，感情易有摩擦，以和为贵、和气生财。',
    食神: '流年食神吐秀，全年心情舒畅，创意灵感源源不断。生活品质提升，财运有来源，适合享受生活与自我成长。',
    伤官: '流年伤官透出，才华横溢但锋芒易露。表达需注意方式，避免口舌是非。创意行业大有可为，但职场需收敛锋芒。',
    正财: '流年正财当值，财运稳定，正财收入可期。适合务实工作、理财规划，财库充盈，家庭美满。',
    偏财: '流年偏财显现，偏财运旺，可能有意外之财或投资收益。但财来财去需谨慎，不宜过度投机，见好就收。',
  };

  paragraphs.push(yearGodDescs[ganShiShen] || '今年运势整体平稳，顺其自然为宜。');

  if (zhiRelations.length > 0) {
    const relNames = zhiRelations.map(r => r.name + '（' + r.targetZhi + '）').join('、');
    const positive = zhiRelations.filter(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
    const negative = zhiRelations.filter(r => r.type !== 'liuhe' && r.type !== 'sanhe' && r.type !== 'bansanhe');
    let zhiText = `流年地支${ganZhi.charAt(1)}与命局形成${relNames}。`;
    if (positive.length > 0) {
      zhiText += '合局为吉，全年人缘和合，做事多得助力，人脉资源可善加利用。';
    }
    if (negative.length > 0) {
      const negNames = negative.map(n => n.name).join('、');
      zhiText += `${negNames}则全年需谨慎行事，宜稳不宜急，注意防范突发变动与人际摩擦。`;
    }
    paragraphs.push(zhiText);
  } else {
    paragraphs.push(`流年${ganZhi}与命局地支无明显合冲刑害，全年运势平稳无大波澜，宜按部就班、厚积薄发。`);
  }

  if (score >= 85) {
    paragraphs.push('年运极佳，是大展宏图的好年份。把握机遇，积极进取，事业财运双丰收。');
  } else if (score >= 70) {
    paragraphs.push('年运偏吉，顺势而为可有所成。保持节奏，稳扎稳打，年底必有收获。');
  } else if (score >= 55) {
    paragraphs.push('年运中等，吉凶参半。宜守成不宜冒进，做好分内之事，等待时机再图突破。');
  } else if (score >= 40) {
    paragraphs.push('年运偏弱，宜韬光养晦、低调行事。以退为进，积蓄力量，为来年打好基础。');
  } else {
    paragraphs.push('年运欠佳，诸事需格外谨慎。宜静不宜动，养精蓄锐，平安度过即是胜利。');
  }

  return paragraphs;
}

/**
 * 生成月度解读
 */
function generateMonthInterpretation(
  ganShiShen: string,
  zhiRelations: ZhiRelation[],
  score: number,
  ganZhi: string,
): string[] {
  const paragraphs: string[] = [];

  const monthGodDescs: Record<string, string> = {
    正官: '流月正官主事，本月事业运走高，工作推进顺利，适合落实计划与正式沟通。贵人相助，行事端正易得认可。',
    七杀: '流月七杀当值，本月压力与动力并存。挑战增多但也是突破良机，宜主动作为，同时注意劳逸结合。',
    正印: '流月正印护身，本月学习与思考运佳，适合充电进修、整理规划。长辈与资源暗中助力，内心安定。',
    偏印: '流月偏印透出，本月灵感直觉敏锐，适合策划、研究、创意类事务。需注意情绪管理，避免过度思虑。',
    比肩: '流月比肩相逢，本月合作运佳，团队协作效率高。但竞争也随之增强，财务上宜守不宜攻。',
    劫财: '流月劫财当值，本月人际活跃但竞争暗藏。求财需防破耗，合作需明算账，感情易起摩擦。',
    食神: '流月食神吐秀，本月心情愉悦创意多，适合休闲、享受生活与创作表达。身心舒畅，效率反高。',
    伤官: '流月伤官透出，本月才华展现但锋芒易露。表达需谨慎，避免口舌。创意工作者灵感迸发，宜把握。',
    正财: '流月正财当值，本月财运稳定，正财收入可期。适合理财规划与商务洽谈，务实推进见成效。',
    偏财: '流月偏财显现，本月偏财运活跃，可能有额外收入或投资机会。但需见好就收，不宜贪多冒进。',
  };

  paragraphs.push(monthGodDescs[ganShiShen] || '本月运势平稳，按部就班即可。');

  if (zhiRelations.length > 0) {
    const relNames = zhiRelations.map(r => r.name + '（' + r.targetZhi + '）').join('、');
    const positive = zhiRelations.filter(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
    const negative = zhiRelations.filter(r => r.type !== 'liuhe' && r.type !== 'sanhe' && r.type !== 'bansanhe');
    let zhiText = `月支${ganZhi.charAt(1)}与命局形成${relNames}。`;
    if (positive.length > 0) zhiText += '合局为吉，本月人缘和合，做事易得助力。';
    if (negative.length > 0) {
      const negNames = negative.map(n => n.name).join('、');
      zhiText += `${negNames}需留意，本月宜稳不宜急，注意突发状况。`;
    }
    paragraphs.push(zhiText);
  } else {
    paragraphs.push(`流月${ganZhi}与命局地支无明显合冲刑害，本月运势平稳，宜稳步推进。`);
  }

  return paragraphs;
}

/**
 * 年度宜忌（宏观）
 */
function generateYearYiJi(ganShiShen: string, zhiRelations: ZhiRelation[]): { yi: string[]; ji: string[] } {
  const hasChong = zhiRelations.some(r => r.type === 'liuchong');
  const hasHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
  const hasXing = zhiRelations.some(r => r.type === 'sanxing' || r.type === 'zixing');

  const yi: string[] = [];
  const ji: string[] = [];

  switch (ganShiShen) {
    case '正官':
      yi.push('事业布局', '谋求晋升', '拓展人脉', '进修提升');
      ji.push('违纪违规', '投机取巧', '锋芒太露');
      break;
    case '七杀':
      yi.push('突破创新', '开拓新局', '强身健体', '果断决策');
      ji.push('冲动冒险', '与人结怨', '过度劳累', '违法乱纪');
      break;
    case '正印':
      yi.push('学习深造', '考取证书', '孝敬长辈', '积累沉淀');
      ji.push('好高骛远', '焦躁冒进', '透支身体');
      break;
    case '偏印':
      yi.push('研究探索', '创意布局', '转型调整', '修行养生');
      ji.push('固执偏见', '钻牛角尖', '暴饮暴食');
      break;
    case '比肩':
      yi.push('团队建设', '人脉积累', '锻炼身体', '稳健理财');
      ji.push('合伙创业', '替人担保', '大额借贷');
      break;
    case '劫财':
      yi.push('拓展圈子', '健身规划', '整顿内务');
      ji.push('投机投资', '大额支出', '口角是非');
      break;
    case '食神':
      yi.push('技能提升', '生活品质', '副业布局', '家人团聚');
      ji.push('过度消耗', '懒散懈怠', '口舌纠纷');
      break;
    case '伤官':
      yi.push('才华展现', '技艺深造', '自我表达', '创新突破');
      ji.push('恃才傲物', '顶撞上级', '感情用事');
      break;
    case '正财':
      yi.push('理财规划', '事业积累', '置业安家', '稳扎稳打');
      ji.push('铺张浪费', '贪小便宜', '借钱不还');
      break;
    case '偏财':
      yi.push('投资理财', '资源整合', '多元发展', '把握机遇');
      ji.push('赌博投机', '见利忘义', '铺张挥霍');
      break;
    default:
      yi.push('稳扎稳打', '修身养性');
      ji.push('冒险行事');
  }

  if (hasChong) {
    yi.splice(0, 0, '求稳守成', '低调务实');
    ji.push('重大变动', '远行搬迁', '冲动决策');
  }
  if (hasHe) {
    yi.push('人脉经营', '合作共赢');
  }
  if (hasXing) {
    ji.push('官司诉讼', '大额手术', '与人结怨');
  }

  return { yi: Array.from(new Set(yi)).slice(0, 6), ji: Array.from(new Set(ji)).slice(0, 5) };
}

/**
 * 月度宜忌（中观）
 */
function generateMonthYiJi(ganShiShen: string, zhiRelations: ZhiRelation[]): { yi: string[]; ji: string[] } {
  const hasChong = zhiRelations.some(r => r.type === 'liuchong');
  const hasHe = zhiRelations.some(r => r.type === 'liuhe' || r.type === 'sanhe' || r.type === 'bansanhe');
  const hasXing = zhiRelations.some(r => r.type === 'sanxing' || r.type === 'zixing');

  const yi: string[] = [];
  const ji: string[] = [];

  switch (ganShiShen) {
    case '正官':
      yi.push('推进计划', '面试求职', '汇报工作', '签约合作');
      ji.push('敷衍了事', '投机取巧', '顶撞上级');
      break;
    case '七杀':
      yi.push('攻坚破局', '主动出击', '运动健身', '快速决策');
      ji.push('冲动行事', '与人争执', '熬夜透支', '危险活动');
      break;
    case '正印':
      yi.push('学习充电', '考试报名', '拜访长辈', '整理规划');
      ji.push('好高骛远', '过度焦虑', '频繁变动');
      break;
    case '偏印':
      yi.push('策划方案', '研究项目', '静心冥想', '艺术创作');
      ji.push('固执己见', '钻牛角尖', '饮食不节');
      break;
    case '比肩':
      yi.push('团队协作', '朋友相聚', '健身计划', '财务梳理');
      ji.push('合伙投资', '替人担保', '大额借款');
      break;
    case '劫财':
      yi.push('社交活动', '锻炼身体', '整理整顿');
      ji.push('盲目投资', '冲动消费', '口舌是非');
      break;
    case '食神':
      yi.push('创意产出', '休闲放松', '美食烹饪', '陪伴家人');
      ji.push('过度劳累', '节食减肥', '与人冲突');
      break;
    case '伤官':
      yi.push('创意表达', '技能打磨', '展示自我', '尝试新事物');
      ji.push('口无遮拦', '恃才傲物', '感情用事');
      break;
    case '正财':
      yi.push('理财复盘', '商务推进', '业绩冲刺', '收支规划');
      ji.push('超前消费', '奢侈浪费', '贪小失大');
      break;
    case '偏财':
      yi.push('投资布局', '商务应酬', '业绩突破', '拓展渠道');
      ji.push('投机赌博', '见利忘义', '铺张浪费');
      break;
    default:
      yi.push('稳步推进', '休养生息');
      ji.push('冒险盲动');
  }

  if (hasChong) {
    yi.splice(0, 0, '稳扎稳打', '低调行事');
    ji.push('重大决策', '长途出行', '激烈冲突');
  }
  if (hasHe) {
    yi.push('联谊聚会', '合作洽谈');
  }
  if (hasXing) {
    ji.push('打官司', '手术', '与人结怨');
  }

  return { yi: Array.from(new Set(yi)).slice(0, 6), ji: Array.from(new Set(ji)).slice(0, 5) };
}

// 地支五行（供外部使用）
export { ZHI_WUXING, GAN_WUXING, GAN_YINYANG, TAOHUA_ZHI };
