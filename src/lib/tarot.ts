// EXPORTS: drawDailyTarot, type TarotCard, type TarotDrawResult
// 塔罗牌每日一抽算法 —— 基于日期的确定性计算，无随机因素
// 22张大阿卡纳牌

export interface TarotCard {
  index: number;
  name: string;
  englishName: string;
  element: string; // 元素/行星
  uprightMeaning: string; // 正位牌意
  reversedMeaning: string; // 逆位牌意
  wealthInsight: string; // 对财运/交易的启示
  reversedWealthInsight: string; // 逆位财运启示
  fortuneWeight: number; // 吉凶权重 0-100，越高越吉
}

export interface TarotDrawResult {
  card: TarotCard;
  isUpright: boolean;
  position: string; // '正位' | '逆位'
  meaning: string;
  wealthInsight: string;
  fortuneScore: number; // 吉凶分数 0-100
  fortuneLevel: string; // 大吉/吉/中平/凶/大凶
  fortuneColor: string;
  todayLesson: string; // 今日启示
}

const TAROT_CARDS: TarotCard[] = [
  {
    index: 0,
    name: '愚者',
    englishName: 'The Fool',
    element: '风',
    uprightMeaning: '新的开始、冒险、纯真、自由、无所畏惧',
    reversedMeaning: '鲁莽、冒险过度、缺乏计划、逃避现实',
    wealthInsight: '适合尝试新的投资领域，但要控制风险，小仓位试水',
    reversedWealthInsight: '冲动投资容易亏损，切勿盲目跟风，先做好功课',
    fortuneWeight: 55,
  },
  {
    index: 1,
    name: '魔术师',
    englishName: 'The Magician',
    element: '水星',
    uprightMeaning: '创造力、行动力、意志力、技巧娴熟、资源在手',
    reversedMeaning: '欺骗、操纵、才华未用、计划受阻',
    wealthInsight: '主动出击的好日子，灵活应变能创造收益',
    reversedWealthInsight: '谨防被他人话术欺骗，交易前再三核实信息',
    fortuneWeight: 78,
  },
  {
    index: 2,
    name: '女祭司',
    englishName: 'The High Priestess',
    element: '月亮',
    uprightMeaning: '直觉、智慧、内在声音、神秘、静观',
    reversedMeaning: '直觉失灵、秘密被揭露、表面化、冲动',
    wealthInsight: '相信自己的分析和直觉，适合研究和观察市场',
    reversedWealthInsight: '判断容易出错，不要凭感觉交易，多收集数据',
    fortuneWeight: 65,
  },
  {
    index: 3,
    name: '女皇',
    englishName: 'The Empress',
    element: '金星',
    uprightMeaning: '丰饶、创造力、母性、收获、繁荣',
    reversedMeaning: '创意受阻、依赖、停滞、损失',
    wealthInsight: '财运丰盛，播种的开始收获，适合增加仓位',
    reversedWealthInsight: '投资回报不及预期，耐心等待不要急于追加',
    fortuneWeight: 82,
  },
  {
    index: 4,
    name: '皇帝',
    englishName: 'The Emperor',
    element: '白羊座',
    uprightMeaning: '权威、稳定、领导力、秩序、掌控',
    reversedMeaning: '独裁、控制欲、僵化、失去权威',
    wealthInsight: '适合做战略决策，掌控风险，稳扎稳打有回报',
    reversedWealthInsight: '过于固执容易亏损，灵活应变比坚持己见重要',
    fortuneWeight: 76,
  },
  {
    index: 5,
    name: '教皇',
    englishName: 'The Hierophant',
    element: '金牛座',
    uprightMeaning: '传统、规则、导师、信仰、传承',
    reversedMeaning: '打破常规、挑战权威、特立独行、教条主义',
    wealthInsight: '遵循成熟策略和规则，稳健投资收益稳定',
    reversedWealthInsight: '反传统的操作可能带来意外，适合逆向思维但要谨慎',
    fortuneWeight: 72,
  },
  {
    index: 6,
    name: '恋人',
    englishName: 'The Lovers',
    element: '双子座',
    uprightMeaning: '选择、合作、价值观一致、重要决定',
    reversedMeaning: '分歧、错误选择、不和谐、价值观冲突',
    wealthInsight: '合作共赢的好时机，合伙交易或跟对人都有收益',
    reversedWealthInsight: '合作容易出问题，不要轻信他人，独立判断',
    fortuneWeight: 75,
  },
  {
    index: 7,
    name: '战车',
    englishName: 'The Chariot',
    element: '巨蟹座',
    uprightMeaning: '胜利、意志力、克服困难、前进、掌控',
    reversedMeaning: '失控、方向迷失、被情绪驱使、拖延',
    wealthInsight: '果断出手能获胜，主动操作有好结果',
    reversedWealthInsight: '方向不清容易做错，先观望不要强行交易',
    fortuneWeight: 78,
  },
  {
    index: 8,
    name: '力量',
    englishName: 'Strength',
    element: '狮子座',
    uprightMeaning: '勇气、耐心、内在力量、以柔克刚',
    reversedMeaning: '缺乏自信、软弱、冲动、被恐惧控制',
    wealthInsight: '有耐心就能等到好机会，持仓不动可能是最佳选择',
    reversedWealthInsight: '情绪容易失控，不要冲动操作，先冷静再决策',
    fortuneWeight: 74,
  },
  {
    index: 9,
    name: '隐士',
    englishName: 'The Hermit',
    element: '处女座',
    uprightMeaning: '内省、独处、智慧、指引、等待',
    reversedMeaning: '孤立、孤僻、迷失方向、拒绝帮助',
    wealthInsight: '适合学习和研究，沉淀自己比操作更重要',
    reversedWealthInsight: '闭门造车容易出错，多交流但不要盲从',
    fortuneWeight: 52,
  },
  {
    index: 10,
    name: '命运之轮',
    englishName: 'Wheel of Fortune',
    element: '木星',
    uprightMeaning: '转机、运气、转折点、顺势而为',
    reversedMeaning: '厄运、失控、逆势、拖延',
    wealthInsight: '运势上升期，抓住机会可以有大收获',
    reversedWealthInsight: '运势下行，少操作少亏损，等待时机',
    fortuneWeight: 88,
  },
  {
    index: 11,
    name: '正义',
    englishName: 'Justice',
    element: '天秤座',
    uprightMeaning: '公正、理性、平衡、因果、正确决定',
    reversedMeaning: '不公、偏见、逃避责任、失衡',
    wealthInsight: '理性分析做出的决策会有好回报，公平交易双赢',
    reversedWealthInsight: '判断容易有偏差，不要带情绪做单',
    fortuneWeight: 73,
  },
  {
    index: 12,
    name: '倒吊人',
    englishName: 'The Hanged Man',
    element: '海王星',
    uprightMeaning: '牺牲、暂停、换角度思考、等待、忍耐',
    reversedMeaning: '徒劳、无谓的牺牲、执迷不悟、拖延',
    wealthInsight: '暂时停下是为了更好的出发，换个视角看市场',
    reversedWealthInsight: '死扛只会越亏越多，该止损就止损',
    fortuneWeight: 35,
  },
  {
    index: 13,
    name: '死神',
    englishName: 'Death',
    element: '天蝎座',
    uprightMeaning: '结束、转变、新生、放手、蜕变',
    reversedMeaning: '抗拒改变、停滞不前、死灰复燃',
    wealthInsight: '旧的不去新的不来，果断清仓换仓迎接新机会',
    reversedWealthInsight: '执念太深不肯放手，越套越深',
    fortuneWeight: 18,
  },
  {
    index: 14,
    name: '节制',
    englishName: 'Temperance',
    element: '射手座',
    uprightMeaning: '平衡、节制、调和、耐心、循序渐进',
    reversedMeaning: '失衡、过度、极端、缺乏耐心',
    wealthInsight: '稳步推进，分批建仓，细水长流收益稳',
    reversedWealthInsight: '操作过度容易翻车，控制节奏',
    fortuneWeight: 77,
  },
  {
    index: 15,
    name: '恶魔',
    englishName: 'The Devil',
    element: '摩羯座',
    uprightMeaning: '诱惑、欲望、束缚、物质主义、执念',
    reversedMeaning: '解脱、打破束缚、醒悟、放手',
    wealthInsight: '贪婪会让你迷失，高收益背后是高风险',
    reversedWealthInsight: '从亏损的执念中解脱，抽身出局是明智之举',
    fortuneWeight: 20,
  },
  {
    index: 16,
    name: '高塔',
    englishName: 'The Tower',
    element: '火星',
    uprightMeaning: '突变、崩溃、冲击、打破假象、觉醒',
    reversedMeaning: '避免灾难、恐惧改变、延迟崩塌',
    wealthInsight: '市场可能有剧烈波动，风险极高，空仓观望',
    reversedWealthInsight: '暴风雨前的宁静，不要抱有侥幸心理',
    fortuneWeight: 12,
  },
  {
    index: 17,
    name: '星星',
    englishName: 'The Star',
    element: '水瓶座',
    uprightMeaning: '希望、灵感、宁静、疗愈、光明前景',
    reversedMeaning: '失望、信心丧失、迷失、不切实际',
    wealthInsight: '长期看好，保持信心，黎明前的黑暗终将过去',
    reversedWealthInsight: '期望过高容易失望，降低预期理性操作',
    fortuneWeight: 85,
  },
  {
    index: 18,
    name: '月亮',
    englishName: 'The Moon',
    element: '双鱼座',
    uprightMeaning: '幻觉、直觉、潜意识、迷茫、恐惧',
    reversedMeaning: '走出迷雾、真相大白、释放恐惧',
    wealthInsight: '市场情绪不稳，信息真假难辨，小心为上',
    reversedWealthInsight: '迷雾散去，局势明朗，可以按计划操作',
    fortuneWeight: 42,
  },
  {
    index: 19,
    name: '太阳',
    englishName: 'The Sun',
    element: '太阳',
    uprightMeaning: '成功、喜悦、活力、光明、胜利',
    reversedMeaning: '暂时的失败、乐观过度、缺乏活力',
    wealthInsight: '鸿运当头，怎么操作都顺，大胆把握黄金机会',
    reversedWealthInsight: '看似繁荣实则有隐忧，不要被表面利润冲昏头',
    fortuneWeight: 92,
  },
  {
    index: 20,
    name: '审判',
    englishName: 'Judgement',
    element: '冥王星',
    uprightMeaning: '觉醒、重生、召唤、宽恕、新的开始',
    reversedMeaning: '自我怀疑、拒绝召唤、拖延、逃避',
    wealthInsight: '复盘总结后再出发，新的策略会带来好收益',
    reversedWealthInsight: '犹豫不决错过机会，不要过度自我怀疑',
    fortuneWeight: 76,
  },
  {
    index: 21,
    name: '世界',
    englishName: 'The World',
    element: '土星',
    uprightMeaning: '完成、圆满、成功、达成目标、整合',
    reversedMeaning: '未完成、有缺陷、延迟、缺乏收尾',
    wealthInsight: '圆满收获的时刻，落袋为安，完成阶段性目标',
    reversedWealthInsight: '还差最后一步但不要急，耐心等待收尾',
    fortuneWeight: 90,
  },
];

function getFortuneLevel(score: number): { level: string; color: string } {
  if (score >= 85) return { level: '大吉', color: 'text-[hsl(43_85%_65%)]' };
  if (score >= 70) return { level: '吉', color: 'text-[hsl(130_54%_55%)]' };
  if (score >= 50) return { level: '中平', color: 'text-[hsl(43_25%_60%)]' };
  if (score >= 30) return { level: '凶', color: 'text-[hsl(26_90%_60%)]' };
  return { level: '大凶', color: 'text-[hsl(0_84%_70%)]' };
}

function getTodayLesson(card: TarotCard, isUpright: boolean): string {
  if (isUpright) {
    const lessons = [
      `今日${card.name}正位：保持${card.uprightMeaning.split('、')[0]}的心态，顺应趋势做出选择。`,
      `${card.name}正位提示：${card.uprightMeaning.split('、')[0]}是今日的关键词，相信自己的判断。`,
      `今日抽到${card.name}正位，${card.wealthInsight}。`,
    ];
    return lessons[card.index % 3];
  } else {
    const lessons = [
      `今日${card.name}逆位：警惕${card.reversedMeaning.split('、')[0]}的陷阱，多一份谨慎。`,
      `${card.name}逆位提示：避免${card.reversedMeaning.split('、')[0]}，退一步海阔天空。`,
      `今日抽到${card.name}逆位，${card.reversedWealthInsight}。`,
    ];
    return lessons[card.index % 3];
  }
}

export function drawDailyTarot(date: Date): TarotDrawResult {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const storageKey = `tarot_draw_${dateKey}`;

  // 抽牌：当天首次打开随机抽1张，存 localStorage，当天内固定；隔天自动重新抽
  let cardIndex: number;
  let isUpright: boolean;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      cardIndex = parsed.cardIndex;
      isUpright = parsed.isUpright;
    } else {
      cardIndex = Math.floor(Math.random() * 22);
      isUpright = Math.random() < 0.5;
      localStorage.setItem(storageKey, JSON.stringify({ cardIndex, isUpright }));
    }
  } catch {
    // localStorage 不可用时回退到确定性算法
    cardIndex = (y + m + d) % 22;
    isUpright = d % 2 === 1;
  }

  const card = TAROT_CARDS[cardIndex];

  // 吉凶分数：正位 = 牌权重；逆位 = 向中间值(50)回归
  let fortuneScore: number;
  if (isUpright) {
    fortuneScore = card.fortuneWeight;
  } else {
    fortuneScore = Math.round(50 + (card.fortuneWeight - 50) * 0.6);
  }

  fortuneScore = Math.min(100, Math.max(0, fortuneScore));

  const levelInfo = getFortuneLevel(fortuneScore);

  return {
    card,
    isUpright,
    position: isUpright ? '正位' : '逆位',
    meaning: isUpright ? card.uprightMeaning : card.reversedMeaning,
    wealthInsight: isUpright ? card.wealthInsight : card.reversedWealthInsight,
    fortuneScore,
    fortuneLevel: levelInfo.level,
    fortuneColor: levelInfo.color,
    todayLesson: getTodayLesson(card, isUpright),
  };
}
