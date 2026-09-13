import { getTenGod, getZhiRelations, type ZhiRelation, getFortuneScore, getDimensionScores, getFortuneLevel } from './bazi';
import { describe, it, expect } from 'vitest';

describe('getTenGod', () => {
  it('同我 → 比肩/劫财', () => {
    expect(getTenGod('甲', '甲')).toBe('比肩');  // 同木同阳
    expect(getTenGod('甲', '乙')).toBe('劫财');  // 同木异阳
  });

  it('我生 → 食神/伤官', () => {
    expect(getTenGod('甲', '丙')).toBe('食神');  // 甲木生丙火，同阳
    expect(getTenGod('甲', '丁')).toBe('伤官');  // 甲木生丁火，异阳
  });

  it('我克 → 正财/偏财', () => {
    // 甲(阳)克戊(阳)→同阳→正财; 甲(阳)克己(阴)→异阳→偏财
    expect(getTenGod('甲', '戊')).toBe('正财');
    expect(getTenGod('甲', '己')).toBe('偏财');
  });

  it('生我 → 正印/偏印', () => {
    // 金生水: 庚(阳)生壬(阳)→同阳→正印; 辛(阴)生壬(阳)→异阳→偏印
    expect(getTenGod('壬', '庚')).toBe('正印');
    expect(getTenGod('壬', '辛')).toBe('偏印');
  });
});

describe('getZhiRelations', () => {
  it('六合', () => {
    const r = getZhiRelations('子', ['丑']);
    expect(r.length).toBe(1);
    expect(r[0].type).toBe('liuhe');
    expect(r[0].name).toBe('六合');
    expect(r[0].targetZhi).toBe('丑');
  });

  it('三合', () => {
    const r = getZhiRelations('申', ['子', '辰']);
    expect(r.some(x => x.type === 'sanhe')).toBe(true);
  });

  it('六冲', () => {
    const r = getZhiRelations('子', ['午']);
    expect(r.some(x => x.type === 'liuchong')).toBe(true);
  });
});

describe('getFortuneScore', () => {
  it('基础分数在 0-100', () => {
    const score = getFortuneScore({
      dayGanShiShen: '正财',
      zhiRelations: [],
      mingJuWuxing: ['木'],
      dayGanWuXing: '水',
      dayZhiWuXing: '水',
    });
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe('getDimensionScores', () => {
  it('返回 4 个维度且分数合法', () => {
    const r = getDimensionScores('食神', [], '男', '子', '子');
    expect(r.length).toBe(4);
    r.forEach((d) => {
      expect(d.score).toBeGreaterThanOrEqual(0);
      expect(d.score).toBeLessThanOrEqual(100);
    });
  });

  it('桃花日支 → 感情分 ≥ 非桃花', () => {
    const r1 = getDimensionScores('食神', [], '男', '子', '子');   // 桃花日支
    const r2 = getDimensionScores('食神', [], '男', '丑', '子');   // 非桃花日支
    const d1 = r1.find(d => d.name === '感情');
    const d2 = r2.find(d => d.name === '感情');
    expect(d1!.score).toBeGreaterThanOrEqual(d2!.score);
  });
});

describe('getFortuneLevel', () => {
  it('分数映射到等级', () => {
    expect(getFortuneLevel(95).level).toBe('大吉');
    expect(getFortuneLevel(80).level).toBe('吉');
    expect(getFortuneLevel(75).level).toBe('吉');
    expect(getFortuneLevel(65).level).toBe('平');
    expect(getFortuneLevel(55).level).toBe('平');
    expect(getFortuneLevel(35).level).toBe('凶');
    expect(getFortuneLevel(20).level).toBe('大凶');
  });
});