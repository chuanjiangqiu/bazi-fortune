// EXPORTS: drawDailyTarot, type TarotCard, type TarotDrawResult, type SingleCardResult
// 塔罗牌每日三牌阵 —— 当天首次随机抽3张不重复，存 localStorage，当天内固定
// 78张完整牌：22张大阿卡纳 + 56张小阿卡纳（权杖/圣杯/宝剑/星币 × 14等级）

export interface TarotCard {
  index: number;
  name: string;
  englishName: string;
  element: string; // 元素/行星/花色元素
  uprightMeaning: string;
  reversedMeaning: string;
  wealthInsight: string;
  reversedWealthInsight: string;
  fortuneWeight: number; // 吉凶权重 0-100
  isMajor: boolean; // 是否大阿卡纳
}

export interface SingleCardResult {
  card: TarotCard;
  isUpright: boolean;
  position: string; // '正位' | '逆位'
  meaning: string;
  wealthInsight: string;
  fortuneScore: number;
}

export interface TarotDrawResult {
  past: SingleCardResult;
  present: SingleCardResult;
  future: SingleCardResult;
  fortuneScore: number; // 综合：过去20% + 现在50% + 未来30%
  fortuneLevel: string;
  fortuneColor: string;
  todayLesson: string;
}

const TAROT_CARDS: TarotCard[] = [
  // ===== 22张大阿卡纳 =====
  { index: 0, name: '愚者', englishName: 'The Fool', element: '风', uprightMeaning: '新的开始、冒险、纯真、自由、无所畏惧', reversedMeaning: '鲁莽、冒险过度、缺乏计划、逃避现实', wealthInsight: '适合尝试新的投资领域，但要控制风险，小仓位试水', reversedWealthInsight: '冲动投资容易亏损，切勿盲目跟风，先做好功课', fortuneWeight: 55, isMajor: true },
  { index: 1, name: '魔术师', englishName: 'The Magician', element: '水星', uprightMeaning: '创造力、行动力、意志力、技巧娴熟、资源在手', reversedMeaning: '欺骗、操纵、才华未用、计划受阻', wealthInsight: '主动出击的好日子，灵活应变能创造收益', reversedWealthInsight: '谨防被他人话术欺骗，交易前再三核实信息', fortuneWeight: 78, isMajor: true },
  { index: 2, name: '女祭司', englishName: 'The High Priestess', element: '月亮', uprightMeaning: '直觉、智慧、内在声音、神秘、静观', reversedMeaning: '直觉失灵、秘密被揭露、表面化、冲动', wealthInsight: '相信自己的分析和直觉，适合研究和观察市场', reversedWealthInsight: '判断容易出错，不要凭感觉交易，多收集数据', fortuneWeight: 65, isMajor: true },
  { index: 3, name: '女皇', englishName: 'The Empress', element: '金星', uprightMeaning: '丰饶、创造力、母性、收获、繁荣', reversedMeaning: '创意受阻、依赖、停滞、损失', wealthInsight: '财运丰盛，播种的开始收获，适合增加仓位', reversedWealthInsight: '投资回报不及预期，耐心等待不要急于追加', fortuneWeight: 82, isMajor: true },
  { index: 4, name: '皇帝', englishName: 'The Emperor', element: '白羊座', uprightMeaning: '权威、稳定、领导力、秩序、掌控', reversedMeaning: '独裁、控制欲、僵化、失去权威', wealthInsight: '适合做战略决策，掌控风险，稳扎稳打有回报', reversedWealthInsight: '过于固执容易亏损，灵活应变比坚持己见重要', fortuneWeight: 76, isMajor: true },
  { index: 5, name: '教皇', englishName: 'The Hierophant', element: '金牛座', uprightMeaning: '传统、规则、导师、信仰、传承', reversedMeaning: '打破常规、挑战权威、特立独行、教条主义', wealthInsight: '遵循成熟策略和规则，稳健投资收益稳定', reversedWealthInsight: '反传统的操作可能带来意外，适合逆向思维但要谨慎', fortuneWeight: 72, isMajor: true },
  { index: 6, name: '恋人', englishName: 'The Lovers', element: '双子座', uprightMeaning: '选择、合作、价值观一致、重要决定', reversedMeaning: '分歧、错误选择、不和谐、价值观冲突', wealthInsight: '合作共赢的好时机，合伙交易或跟对人都有收益', reversedWealthInsight: '合作容易出问题，不要轻信他人，独立判断', fortuneWeight: 75, isMajor: true },
  { index: 7, name: '战车', englishName: 'The Chariot', element: '巨蟹座', uprightMeaning: '胜利、意志力、克服困难、前进、掌控', reversedMeaning: '失控、方向迷失、被情绪驱使、拖延', wealthInsight: '果断出手能获胜，主动操作有好结果', reversedWealthInsight: '方向不清容易做错，先观望不要强行交易', fortuneWeight: 78, isMajor: true },
  { index: 8, name: '力量', englishName: 'Strength', element: '狮子座', uprightMeaning: '勇气、耐心、内在力量、以柔克刚', reversedMeaning: '缺乏自信、软弱、冲动、被恐惧控制', wealthInsight: '有耐心就能等到好机会，持仓不动可能是最佳选择', reversedWealthInsight: '情绪容易失控，不要冲动操作，先冷静再决策', fortuneWeight: 74, isMajor: true },
  { index: 9, name: '隐士', englishName: 'The Hermit', element: '处女座', uprightMeaning: '内省、独处、智慧、指引、等待', reversedMeaning: '孤立、孤僻、迷失方向、拒绝帮助', wealthInsight: '适合学习和研究，沉淀自己比操作更重要', reversedWealthInsight: '闭门造车容易出错，多交流但不要盲从', fortuneWeight: 52, isMajor: true },
  { index: 10, name: '命运之轮', englishName: 'Wheel of Fortune', element: '木星', uprightMeaning: '转机、运气、转折点、顺势而为', reversedMeaning: '厄运、失控、逆势、拖延', wealthInsight: '运势上升期，抓住机会可以有大收获', reversedWealthInsight: '运势下行，少操作少亏损，等待时机', fortuneWeight: 88, isMajor: true },
  { index: 11, name: '正义', englishName: 'Justice', element: '天秤座', uprightMeaning: '公正、理性、平衡、因果、正确决定', reversedMeaning: '不公、偏见、逃避责任、失衡', wealthInsight: '理性分析做出的决策会有好回报，公平交易双赢', reversedWealthInsight: '判断容易有偏差，不要带情绪做单', fortuneWeight: 73, isMajor: true },
  { index: 12, name: '倒吊人', englishName: 'The Hanged Man', element: '海王星', uprightMeaning: '牺牲、暂停、换角度思考、等待、忍耐', reversedMeaning: '徒劳、无谓的牺牲、执迷不悟、拖延', wealthInsight: '暂时停下是为了更好的出发，换个视角看市场', reversedWealthInsight: '死扛只会越亏越多，该止损就止损', fortuneWeight: 35, isMajor: true },
  { index: 13, name: '死神', englishName: 'Death', element: '天蝎座', uprightMeaning: '结束、转变、新生、放手、蜕变', reversedMeaning: '抗拒改变、停滞不前、死灰复燃', wealthInsight: '旧的不去新的不来，果断清仓换仓迎接新机会', reversedWealthInsight: '执念太深不肯放手，越套越深', fortuneWeight: 18, isMajor: true },
  { index: 14, name: '节制', englishName: 'Temperance', element: '射手座', uprightMeaning: '平衡、节制、调和、耐心、循序渐进', reversedMeaning: '失衡、过度、极端、缺乏耐心', wealthInsight: '稳步推进，分批建仓，细水长流收益稳', reversedWealthInsight: '操作过度容易翻车，控制节奏', fortuneWeight: 77, isMajor: true },
  { index: 15, name: '恶魔', englishName: 'The Devil', element: '摩羯座', uprightMeaning: '诱惑、欲望、束缚、物质主义、执念', reversedMeaning: '解脱、打破束缚、醒悟、放手', wealthInsight: '贪婪会让你迷失，高收益背后是高风险', reversedWealthInsight: '从亏损的执念中解脱，抽身出局是明智之举', fortuneWeight: 20, isMajor: true },
  { index: 16, name: '高塔', englishName: 'The Tower', element: '火星', uprightMeaning: '突变、崩溃、冲击、打破假象、觉醒', reversedMeaning: '避免灾难、恐惧改变、延迟崩塌', wealthInsight: '市场可能有剧烈波动，风险极高，空仓观望', reversedWealthInsight: '暴风雨前的宁静，不要抱有侥幸心理', fortuneWeight: 12, isMajor: true },
  { index: 17, name: '星星', englishName: 'The Star', element: '水瓶座', uprightMeaning: '希望、灵感、宁静、疗愈、光明前景', reversedMeaning: '失望、信心丧失、迷失、不切实际', wealthInsight: '长期看好，保持信心，黎明前的黑暗终将过去', reversedWealthInsight: '期望过高容易失望，降低预期理性操作', fortuneWeight: 85, isMajor: true },
  { index: 18, name: '月亮', englishName: 'The Moon', element: '双鱼座', uprightMeaning: '幻觉、直觉、潜意识、迷茫、恐惧', reversedMeaning: '走出迷雾、真相大白、释放恐惧', wealthInsight: '市场情绪不稳，信息真假难辨，小心为上', reversedWealthInsight: '迷雾散去，局势明朗，可以按计划操作', fortuneWeight: 42, isMajor: true },
  { index: 19, name: '太阳', englishName: 'The Sun', element: '太阳', uprightMeaning: '成功、喜悦、活力、光明、胜利', reversedMeaning: '暂时的失败、乐观过度、缺乏活力', wealthInsight: '鸿运当头，怎么操作都顺，大胆把握黄金机会', reversedWealthInsight: '看似繁荣实则有隐忧，不要被表面利润冲昏头', fortuneWeight: 92, isMajor: true },
  { index: 20, name: '审判', englishName: 'Judgement', element: '冥王星', uprightMeaning: '觉醒、重生、召唤、宽恕、新的开始', reversedMeaning: '自我怀疑、拒绝召唤、拖延、逃避', wealthInsight: '复盘总结后再出发，新的策略会带来好收益', reversedWealthInsight: '犹豫不决错过机会，不要过度自我怀疑', fortuneWeight: 76, isMajor: true },
  { index: 21, name: '世界', englishName: 'The World', element: '土星', uprightMeaning: '完成、圆满、成功、达成目标、整合', reversedMeaning: '未完成、有缺陷、延迟、缺乏收尾', wealthInsight: '圆满收获的时刻，落袋为安，完成阶段性目标', reversedWealthInsight: '还差最后一步但不要急，耐心等待收尾', fortuneWeight: 90, isMajor: true },

  // ===== 权杖 Wands（火）=====
  { index: 22, name: '权杖Ace', englishName: 'Ace of Wands', element: '火', uprightMeaning: '新的创造灵感、事业起步、热情迸发、潜力', reversedMeaning: '延迟、缺乏动力、创意受阻、机会流失', wealthInsight: '新的赚钱机会出现，适合尝试新领域小仓位试水', reversedWealthInsight: '机会不成熟，暂缓投资，先积蓄力量', fortuneWeight: 68, isMajor: false },
  { index: 23, name: '权杖二', englishName: 'Two of Wands', element: '火', uprightMeaning: '规划、决策、远见、选择方向、掌控', reversedMeaning: '犹豫、缺乏规划、恐惧未知、目光短浅', wealthInsight: '面临投资选择，做好规划再出手，别盲目', reversedWealthInsight: '犹豫不决错过机会，需要果断决策', fortuneWeight: 60, isMajor: false },
  { index: 24, name: '权杖三', englishName: 'Three of Wands', element: '火', uprightMeaning: '扩展、合作初成、远见实现、贸易、进展', reversedMeaning: '延迟、受阻、缺乏远见、计划搁置', wealthInsight: '事业扩展顺利，合作带来收益，适合长线布局', reversedWealthInsight: '扩展计划受阻，耐心等待时机成熟', fortuneWeight: 72, isMajor: false },
  { index: 25, name: '权杖四', englishName: 'Four of Wands', element: '火', uprightMeaning: '庆祝、稳定、和谐、家园、成就、快乐', reversedMeaning: '不稳定、冲突、缺乏归属感、根基动摇', wealthInsight: '收获期，稳定收益，适合落袋为安享受成果', reversedWealthInsight: '收益不稳定，注意风险，别急于庆祝', fortuneWeight: 75, isMajor: false },
  { index: 26, name: '权杖五', englishName: 'Five of Wands', element: '火', uprightMeaning: '竞争、冲突、分歧、混乱、内耗', reversedMeaning: '避免冲突、和解、内耗减少、妥协', wealthInsight: '市场竞争激烈，避免跟风，差异化操作', reversedWealthInsight: '竞争缓和，内部理顺后可出击', fortuneWeight: 35, isMajor: false },
  { index: 27, name: '权杖六', englishName: 'Six of Wands', element: '火', uprightMeaning: '胜利、认可、成功、公众赞誉、凯旋', reversedMeaning: '骄傲、失败、缺乏认可、虚名', wealthInsight: '投资获利被认可，顺势加仓但别骄傲自满', reversedWealthInsight: '表面风光实则有隐忧，警惕追高', fortuneWeight: 76, isMajor: false },
  { index: 28, name: '权杖七', englishName: 'Seven of Wands', element: '火', uprightMeaning: '坚守、防御、挑战、坚持立场、勇气', reversedMeaning: '放弃、被压垮、逃避挑战、精疲力竭', wealthInsight: '持仓面临压力，坚持自己的判断，别被洗出去', reversedWealthInsight: '扛不住压力割肉在低点，再坚持一下', fortuneWeight: 50, isMajor: false },
  { index: 29, name: '权杖八', englishName: 'Eight of Wands', element: '火', uprightMeaning: '快速、行动、消息、进展迅速、旅行', reversedMeaning: '延迟、阻碍、信息混乱、等待', wealthInsight: '行情变化快，果断操作能抓住短线机会', reversedWealthInsight: '消息面混乱，暂缓操作等明朗', fortuneWeight: 68, isMajor: false },
  { index: 30, name: '权杖九', englishName: 'Nine of Wands', element: '火', uprightMeaning: '韧性、最后一搏、疲惫但坚持、警觉', reversedMeaning: '精疲力竭、放弃、偏执、过度防御', wealthInsight: '接近目标但疲惫，坚持最后一段就能收获', reversedWealthInsight: '精力耗尽，该休息就休息，别硬扛', fortuneWeight: 55, isMajor: false },
  { index: 31, name: '权杖十', englishName: 'Ten of Wands', element: '火', uprightMeaning: '负担、过载、压力、责任过重、辛苦', reversedMeaning: '放下负担、减轻压力、委托他人、解脱', wealthInsight: '仓位过重压力大，适当减仓轻装上阵', reversedWealthInsight: '终于放下包袱，减负后操作更灵活', fortuneWeight: 38, isMajor: false },
  { index: 32, name: '权杖侍从', englishName: 'Page of Wands', element: '火', uprightMeaning: '探索、学习、新消息、热情、灵感', reversedMeaning: '拖延、缺乏方向、坏消息、三分钟热度', wealthInsight: '有新的投资消息，先研究再行动，保持好奇', reversedWealthInsight: '消息不实或延迟，不要轻信', fortuneWeight: 58, isMajor: false },
  { index: 33, name: '权杖骑士', englishName: 'Knight of Wands', element: '火', uprightMeaning: '冲动、冒险、热情行动、追求、魅力', reversedMeaning: '鲁莽、无计划、冲动消费、半途而废', wealthInsight: '敢冲敢闯有机会，但控制仓位别all in', reversedWealthInsight: '冲动交易容易亏损，冷静再出手', fortuneWeight: 55, isMajor: false },
  { index: 34, name: '权杖皇后', englishName: 'Queen of Wands', element: '火', uprightMeaning: '自信、魅力、独立、热情、领导力', reversedMeaning: '嫉妒、自负、缺乏自信、控制欲', wealthInsight: '自信独立的判断带来收益，相信自己', reversedWealthInsight: '情绪化操作，别让嫉妒影响决策', fortuneWeight: 72, isMajor: false },
  { index: 35, name: '权杖国王', englishName: 'King of Wands', element: '火', uprightMeaning: '领导、愿景、企业家精神、掌控、大胆', reversedMeaning: '独裁、冲动、缺乏远见、刚愎自用', wealthInsight: '有大局观的操作，适合做战略决策', reversedWealthInsight: '刚愎自用不听劝，容易判断失误', fortuneWeight: 74, isMajor: false },

  // ===== 圣杯 Cups（水）=====
  { index: 36, name: '圣杯Ace', englishName: 'Ace of Cups', element: '水', uprightMeaning: '新感情、直觉、灵感、内心满足、爱', reversedMeaning: '情感空虚、直觉失灵、压抑、情感堵塞', wealthInsight: '直觉敏锐，相信第一感觉的投资机会', reversedWealthInsight: '情绪影响判断，先冷静再交易', fortuneWeight: 65, isMajor: false },
  { index: 37, name: '圣杯二', englishName: 'Two of Cups', element: '水', uprightMeaning: '合作、伙伴关系、和谐、结合、吸引', reversedMeaning: '分歧、合作破裂、不和谐、失衡', wealthInsight: '合作共赢的好时机，合伙生意顺利', reversedWealthInsight: '合作出问题，独立操作更稳妥', fortuneWeight: 70, isMajor: false },
  { index: 38, name: '圣杯三', englishName: 'Three of Cups', element: '水', uprightMeaning: '庆祝、友谊、社交、团体快乐、丰收', reversedMeaning: '过度放纵、八卦、社交过度、三角关系', wealthInsight: '人脉带来机会，社交场合有赚钱信息', reversedWealthInsight: '应酬开销大，注意控制消费', fortuneWeight: 68, isMajor: false },
  { index: 39, name: '圣杯四', englishName: 'Four of Cups', element: '水', uprightMeaning: '冷漠、不满、冥想、错过机会、倦怠', reversedMeaning: '觉醒、抓住机会、走出停滞、重新投入', wealthInsight: '对现有收益不满，但别忽视眼前的机会', reversedWealthInsight: '终于看到机会，果断出手', fortuneWeight: 48, isMajor: false },
  { index: 40, name: '圣杯五', englishName: 'Five of Cups', element: '水', uprightMeaning: '失落、悲伤、遗憾、专注损失、失望', reversedMeaning: '接受、恢复、看到希望、放下过去', wealthInsight: '亏损后情绪低落，别只看损失，还有机会', reversedWealthInsight: '走出亏损阴影，重新开始布局', fortuneWeight: 30, isMajor: false },
  { index: 41, name: '圣杯六', englishName: 'Six of Cups', element: '水', uprightMeaning: '怀旧、童年、回忆、纯真、给予、友善', reversedMeaning: '停留过去、不切实际、逃避现实、不成熟', wealthInsight: '老朋友/老关系带来机会，熟人交易靠谱', reversedWealthInsight: '活在过去的收益里，面对现实调整策略', fortuneWeight: 60, isMajor: false },
  { index: 42, name: '圣杯七', englishName: 'Seven of Cups', element: '水', uprightMeaning: '幻想、选择、幻觉、不切实际、诱惑', reversedMeaning: '清醒、做出选择、面对现实、辨别真假', wealthInsight: '机会太多眼花缭乱，别被高收益诱惑', reversedWealthInsight: '看清现实，做出理性选择', fortuneWeight: 42, isMajor: false },
  { index: 43, name: '圣杯八', englishName: 'Eight of Cups', element: '水', uprightMeaning: '放弃、离开、寻找意义、放下、旅程', reversedMeaning: '害怕离开、停滞、逃避改变、犹豫', wealthInsight: '该放手的投资就放手，去寻找更好的机会', reversedWealthInsight: '舍不得割肉越套越深，该断则断', fortuneWeight: 45, isMajor: false },
  { index: 44, name: '圣杯九', englishName: 'Nine of Cups', element: '水', uprightMeaning: '满足、愿望成真、享乐、满意、感恩', reversedMeaning: '物质主义、不满足、空虚、贪婪', wealthInsight: '愿望达成，收益满意，适合享受成果', reversedWealthInsight: '贪心不足，赚了还想赚容易回吐', fortuneWeight: 78, isMajor: false },
  { index: 45, name: '圣杯十', englishName: 'Ten of Cups', element: '水', uprightMeaning: '圆满、家庭幸福、情感满足、和谐、祝福', reversedMeaning: '家庭冲突、情感破裂、不和谐、失望', wealthInsight: '家庭财务和谐，长期规划顺利', reversedWealthInsight: '家庭财务纠纷，先理顺内部', fortuneWeight: 80, isMajor: false },
  { index: 46, name: '圣杯侍从', englishName: 'Page of Cups', element: '水', uprightMeaning: '敏感、创意、消息、直觉、学习、好奇', reversedMeaning: '情绪化、坏消息、缺乏创意、过度敏感', wealthInsight: '有意外的好消息，保持敏感捕捉机会', reversedWealthInsight: '消息令人失望，别情绪化操作', fortuneWeight: 58, isMajor: false },
  { index: 47, name: '圣杯骑士', englishName: 'Knight of Cups', element: '水', uprightMeaning: '浪漫、追求、魅力、想象力、邀请、优雅', reversedMeaning: '不切实际、情绪化、失望、欺骗、虚假承诺', wealthInsight: '有诱人的投资邀请，但要核实真实性', reversedWealthInsight: '被画饼欺骗，高收益承诺要警惕', fortuneWeight: 55, isMajor: false },
  { index: 48, name: '圣杯皇后', englishName: 'Queen of Cups', element: '水', uprightMeaning: '慈悲、直觉、情感成熟、关怀、同理心', reversedMeaning: '情绪不稳定、依赖、缺乏同理心、压抑', wealthInsight: '直觉准，关怀他人带来合作机会', reversedWealthInsight: '情绪波动大，别在心情差时交易', fortuneWeight: 70, isMajor: false },
  { index: 49, name: '圣杯国王', englishName: 'King of Cups', element: '水', uprightMeaning: '情感掌控、冷静、慈悲、智慧、外交、平衡', reversedMeaning: '情绪压抑、操纵、冷漠、爆发、不真诚', wealthInsight: '情绪稳定的操作，冷静面对市场波动', reversedWealthInsight: '压抑情绪后突然爆发，容易冲动交易', fortuneWeight: 72, isMajor: false },

  // ===== 宝剑 Swords（风）=====
  { index: 50, name: '宝剑Ace', englishName: 'Ace of Swords', element: '风', uprightMeaning: '新想法、突破、清晰、真理、胜利、灵感', reversedMeaning: '混乱、误解、缺乏清晰、失败、信息错误', wealthInsight: '思路清晰，分析到位的交易有收益', reversedWealthInsight: '思路混乱，暂缓操作想清楚', fortuneWeight: 65, isMajor: false },
  { index: 51, name: '宝剑二', englishName: 'Two of Swords', element: '风', uprightMeaning: '抉择、僵局、回避、平衡、犹豫、妥协', reversedMeaning: '做出决定、打破僵局、面对现实、信息公开', wealthInsight: '面临两难选择，信息不足时先观望', reversedWealthInsight: '终于做出决定，打破僵局', fortuneWeight: 48, isMajor: false },
  { index: 52, name: '宝剑三', englishName: 'Three of Swords', element: '风', uprightMeaning: '心痛、悲伤、分离、伤害、真相、背叛', reversedMeaning: '恢复、原谅、释放痛苦、愈合、接受', wealthInsight: '亏损令人心痛，但接受现实才能重新开始', reversedWealthInsight: '走出亏损阴影，心态恢复', fortuneWeight: 22, isMajor: false },
  { index: 53, name: '宝剑四', englishName: 'Four of Swords', element: '风', uprightMeaning: '休息、恢复、沉思、撤退、冥想、静养', reversedMeaning: '不安、无法休息、拖延、焦虑、躁动', wealthInsight: '需要休息，空仓观望调整状态', reversedWealthInsight: '焦虑不安频繁操作，越做越亏', fortuneWeight: 50, isMajor: false },
  { index: 54, name: '宝剑五', englishName: 'Five of Swords', element: '风', uprightMeaning: '冲突、失败、背叛、损人利己、紧张、争斗', reversedMeaning: '和解、放下、避免冲突、学习教训、释怀', wealthInsight: '市场博弈激烈，赢了也是惨胜，别斗气', reversedWealthInsight: '放下执念，和解后重新出发', fortuneWeight: 25, isMajor: false },
  { index: 55, name: '宝剑六', englishName: 'Six of Swords', element: '风', uprightMeaning: '过渡、离开、恢复、旅程、进入平静、转移', reversedMeaning: '无法离开、停滞、旧问题延续、拖延', wealthInsight: '从亏损中走出，过渡到新阶段，换思路', reversedWealthInsight: '困在旧思路里走不出来', fortuneWeight: 55, isMajor: false },
  { index: 56, name: '宝剑七', englishName: 'Seven of Swords', element: '风', uprightMeaning: '策略、欺骗、隐藏、逃跑、投机、隐瞒', reversedMeaning: '被揭露、忏悔、诚实、放下、回归正途', wealthInsight: '市场有欺诈信息，别轻信小道消息', reversedWealthInsight: '真相大白，之前的隐瞒被揭露', fortuneWeight: 32, isMajor: false },
  { index: 57, name: '宝剑八', englishName: 'Eight of Swords', element: '风', uprightMeaning: '束缚、困境、受害者、限制、迷茫、无助', reversedMeaning: '解放、突破、看清真相、自由、自救', wealthInsight: '感觉被套牢，但其实有出路，别自我设限', reversedWealthInsight: '终于找到突破口，解套有望', fortuneWeight: 28, isMajor: false },
  { index: 58, name: '宝剑九', englishName: 'Nine of Swords', element: '风', uprightMeaning: '焦虑、噩梦、恐惧、担忧、绝望、失眠', reversedMeaning: '释放焦虑、面对恐惧、恢复、希望、走出阴影', wealthInsight: '过度焦虑影响判断，市场没你想的那么糟', reversedWealthInsight: '焦虑缓解，心态恢复理性', fortuneWeight: 20, isMajor: false },
  { index: 59, name: '宝剑十', englishName: 'Ten of Swords', element: '风', uprightMeaning: '终结、痛苦、背叛、低谷、毁灭、绝境', reversedMeaning: '复苏、黎明前黑暗、恢复、放下、触底反弹', wealthInsight: '最坏的时候到了，利空出尽就是机会', reversedWealthInsight: '开始复苏，别在最低点割肉', fortuneWeight: 15, isMajor: false },
  { index: 60, name: '宝剑侍从', englishName: 'Page of Swords', element: '风', uprightMeaning: '好奇、警觉、新想法、沟通、学习、敏锐', reversedMeaning: '八卦、无重点、欺骗、缺乏方向、言语冲突', wealthInsight: '信息灵敏，关注市场动态捕捉机会', reversedWealthInsight: '被八卦信息干扰，别听风就是雨', fortuneWeight: 52, isMajor: false },
  { index: 61, name: '宝剑骑士', englishName: 'Knight of Swords', element: '风', uprightMeaning: '冲动、快速、野心、直接、冲撞、果断', reversedMeaning: '鲁莽、无方向、言语伤人、冲动、不计后果', wealthInsight: '反应快敢操作，但别冲动，设好止损', reversedWealthInsight: '鲁莽交易亏损，放慢节奏', fortuneWeight: 48, isMajor: false },
  { index: 62, name: '宝剑皇后', englishName: 'Queen of Swords', element: '风', uprightMeaning: '独立、清晰、公正、智慧、边界、理性', reversedMeaning: '冷酷、苛刻、偏见、情绪用事、刻薄', wealthInsight: '理性独立的分析，不被情绪左右', reversedWealthInsight: '带偏见看市场，容易判断失误', fortuneWeight: 65, isMajor: false },
  { index: 63, name: '宝剑国王', englishName: 'King of Swords', element: '风', uprightMeaning: '权威、理性、道德、清晰、领导、公正', reversedMeaning: '专制、冷酷、滥用权力、不道德、操纵', wealthInsight: '理性权威的决策，适合做复杂交易判断', reversedWealthInsight: '独断专行，听不进意见容易出错', fortuneWeight: 68, isMajor: false },

  // ===== 星币 Pentacles（土）=====
  { index: 64, name: '星币Ace', englishName: 'Ace of Pentacles', element: '土', uprightMeaning: '新机会、财富、物质、稳定、技能、机遇', reversedMeaning: '机会流失、财务困难、缺乏规划、不稳定', wealthInsight: '新的赚钱机会，实实在在的收益入口', reversedWealthInsight: '机会没抓住，财务规划需要调整', fortuneWeight: 75, isMajor: false },
  { index: 65, name: '星币二', englishName: 'Two of Pentacles', element: '土', uprightMeaning: '平衡、灵活、管理、多任务、适应、调配', reversedMeaning: '失衡、混乱、财务压力、过度扩展、资金紧张', wealthInsight: '多线操作需要平衡，灵活调配资金', reversedWealthInsight: '资金链紧张，别同时开太多仓位', fortuneWeight: 58, isMajor: false },
  { index: 66, name: '星币三', englishName: 'Three of Pentacles', element: '土', uprightMeaning: '合作、工艺、学习、团队、质量、专业', reversedMeaning: '合作不佳、质量差、缺乏认可、配合问题', wealthInsight: '团队合作或专业技能带来收益，重视质量', reversedWealthInsight: '合作不顺，专业能力不足导致亏损', fortuneWeight: 68, isMajor: false },
  { index: 67, name: '星币四', englishName: 'Four of Pentacles', element: '土', uprightMeaning: '守财、控制、稳定、占有、安全、保守', reversedMeaning: '财务不稳定、过度消费、放手、贪婪、吝啬', wealthInsight: '适合守成，保住现有收益，别轻易冒险', reversedWealthInsight: '守不住财，过度消费或投资失误', fortuneWeight: 55, isMajor: false },
  { index: 68, name: '星币五', englishName: 'Five of Pentacles', element: '土', uprightMeaning: '贫困、损失、困难、疾病、被排斥、寒冬', reversedMeaning: '恢复、走出困境、财务好转、希望、援助', wealthInsight: '财务困难期，减少操作保住本金', reversedWealthInsight: '困境开始好转，可以逐步布局', fortuneWeight: 20, isMajor: false },
  { index: 69, name: '星币六', englishName: 'Six of Pentacles', element: '土', uprightMeaning: '给予、分享、慷慨、平衡、慈善、分配', reversedMeaning: '债务、不平等、自私、财务纠纷、施舍', wealthInsight: '有贵人相助或分红，收益可以分享', reversedWealthInsight: '财务纠纷或债务问题，注意账目', fortuneWeight: 62, isMajor: false },
  { index: 70, name: '星币七', englishName: 'Seven of Pentacles', element: '土', uprightMeaning: '耐心、投资、长期、评估、等待收获、耕耘', reversedMeaning: '缺乏耐心、短期思维、投资失败、放弃', wealthInsight: '长线投资需要耐心，评估后再决定去留', reversedWealthInsight: '没耐心拿不住，错过长期收益', fortuneWeight: 60, isMajor: false },
  { index: 71, name: '星币八', englishName: 'Eight of Pentacles', element: '土', uprightMeaning: '勤奋、技能、精进、工作、质量、专注', reversedMeaning: '懒惰、敷衍、缺乏技能、完美主义、重复劳动', wealthInsight: '靠技能和勤奋赚钱，精进业务提升收入', reversedWealthInsight: '敷衍了事，技能不足影响收入', fortuneWeight: 70, isMajor: false },
  { index: 72, name: '星币九', englishName: 'Nine of Pentacles', element: '土', uprightMeaning: '独立、富足、奢侈、自给自足、享受、优雅', reversedMeaning: '财务依赖、过度消费、不安全感、虚假繁荣', wealthInsight: '财务独立富足，靠自己的能力享受成果', reversedWealthInsight: '过度消费或依赖他人，财务不独立', fortuneWeight: 76, isMajor: false },
  { index: 73, name: '星币十', englishName: 'Ten of Pentacles', element: '土', uprightMeaning: '财富、继承、家庭、长期成功、稳定、传承', reversedMeaning: '财务失败、家庭纠纷、不稳定、损失、败家', wealthInsight: '财运亨通，长期积累的成果，适合大布局', reversedWealthInsight: '财务出问题，家庭或继承方面有纠纷', fortuneWeight: 82, isMajor: false },
  { index: 74, name: '星币侍从', englishName: 'Page of Pentacles', element: '土', uprightMeaning: '学习、新机会、务实、规划、技能、起步', reversedMeaning: '缺乏规划、不切实际、拖延、坏消息、停滞', wealthInsight: '有新的务实机会，先学习研究再投入', reversedWealthInsight: '规划不足，机会不成熟', fortuneWeight: 58, isMajor: false },
  { index: 75, name: '星币骑士', englishName: 'Knight of Pentacles', element: '土', uprightMeaning: '勤奋、可靠、耐心、常规、坚持、稳重', reversedMeaning: '懒惰、停滞、无聊、缺乏进步、固执、拖延', wealthInsight: '稳扎稳打，可靠的投资方式，耐心持有', reversedWealthInsight: '停滞不前，该动的时候不动错过机会', fortuneWeight: 62, isMajor: false },
  { index: 76, name: '星币皇后', englishName: 'Queen of Pentacles', element: '土', uprightMeaning: '滋养、务实、富足、关怀、自然、理财', reversedMeaning: '财务忽视、过度工作、不安全感、自私', wealthInsight: '务实理财，兼顾生活和投资，稳定收益', reversedWealthInsight: '忽视财务管理，或过度工作忽略生活', fortuneWeight: 72, isMajor: false },
  { index: 77, name: '星币国王', englishName: 'King of Pentacles', element: '土', uprightMeaning: '财富、成功、商业头脑、掌控、稳定、富豪', reversedMeaning: '财务失败、贪婪、物质主义、不稳定、冒险', wealthInsight: '商业头脑强，适合大额投资和财务决策', reversedWealthInsight: '贪婪导致失败，别太追求物质收益', fortuneWeight: 78, isMajor: false },
];

function getFortuneLevel(score: number): { level: string; color: string } {
  if (score >= 85) return { level: '大吉', color: 'text-[hsl(43_85%_65%)]' };
  if (score >= 70) return { level: '吉', color: 'text-[hsl(130_54%_55%)]' };
  if (score >= 50) return { level: '中平', color: 'text-[hsl(43_25%_60%)]' };
  if (score >= 30) return { level: '凶', color: 'text-[hsl(26_90%_60%)]' };
  return { level: '大凶', color: 'text-[hsl(0_84%_70%)]' };
}

function calcSingleResult(card: TarotCard, isUpright: boolean): SingleCardResult {
  let fortuneScore: number;
  if (isUpright) {
    fortuneScore = card.fortuneWeight;
  } else {
    // 逆位向中间值50回归
    fortuneScore = Math.round(50 + (card.fortuneWeight - 50) * 0.6);
  }
  fortuneScore = Math.min(100, Math.max(0, fortuneScore));
  return {
    card,
    isUpright,
    position: isUpright ? '正位' : '逆位',
    meaning: isUpright ? card.uprightMeaning : card.reversedMeaning,
    wealthInsight: isUpright ? card.wealthInsight : card.reversedWealthInsight,
    fortuneScore,
  };
}

function getTodayLesson(present: SingleCardResult): string {
  const card = present.card;
  if (present.isUpright) {
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
      `今日抽到${card.name}逆位，${card.wealthInsight}。`,
    ];
    return lessons[card.index % 3];
  }
}

// 从78张中随机抽3张不重复
function drawThreeUnique(): { cardIndex: number; isUpright: boolean }[] {
  const pool = Array.from({ length: 78 }, (_, i) => i);
  const result: { cardIndex: number; isUpright: boolean }[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const cardIndex = pool.splice(idx, 1)[0];
    result.push({ cardIndex, isUpright: Math.random() < 0.5 });
  }
  return result;
}

export function drawDailyTarot(date: Date): TarotDrawResult {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const dateKey = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const storageKey = `tarot_three_${dateKey}`;

  // 当天首次随机抽3张，存 localStorage，当天内固定；隔天自动重新抽
  let draws: { cardIndex: number; isUpright: boolean }[];
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      draws = JSON.parse(saved);
    } else {
      draws = drawThreeUnique();
      localStorage.setItem(storageKey, JSON.stringify(draws));
    }
  } catch {
    // localStorage 不可用时回退到确定性算法
    const idx1 = (y + m + d) % 78;
    const idx2 = (y * 2 + m + d) % 78;
    const idx3 = (y * 3 + m + d) % 78;
    draws = [
      { cardIndex: idx1, isUpright: d % 2 === 1 },
      { cardIndex: idx2, isUpright: d % 2 === 0 },
      { cardIndex: idx3, isUpright: (d + 1) % 2 === 1 },
    ];
  }

  const past = calcSingleResult(TAROT_CARDS[draws[0].cardIndex], draws[0].isUpright);
  const present = calcSingleResult(TAROT_CARDS[draws[1].cardIndex], draws[1].isUpright);
  const future = calcSingleResult(TAROT_CARDS[draws[2].cardIndex], draws[2].isUpright);

  // 综合吉凶分：过去20% + 现在50% + 未来30%
  const fortuneScore = Math.round(
    past.fortuneScore * 0.2 + present.fortuneScore * 0.5 + future.fortuneScore * 0.3
  );

  const levelInfo = getFortuneLevel(fortuneScore);

  return {
    past,
    present,
    future,
    fortuneScore,
    fortuneLevel: levelInfo.level,
    fortuneColor: levelInfo.color,
    todayLesson: getTodayLesson(present),
  };
}
