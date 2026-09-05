import { motion } from 'framer-motion';
import type { TarotCard as TarotCardType } from '@/lib/tarot';

interface TarotCardProps {
  card: TarotCardType;
  isUpright: boolean;
  flipped: boolean;
  onFlip: () => void;
}

// 22张大阿卡纳视觉配置：渐变背景 + 强调色
const CARD_VISUALS: { from: string; to: string; accent: string }[] = [
  { from: '#0c2d48', to: '#061525', accent: '#7dd3fc' }, // 0 愚者 风
  { from: '#3b0764', to: '#1e0533', accent: '#c4b5fd' }, // 1 魔术师 水星
  { from: '#0f172a', to: '#020617', accent: '#e2e8f0' }, // 2 女祭司 月亮
  { from: '#500724', to: '#1f0510', accent: '#fda4af' }, // 3 女皇 金星
  { from: '#450a0a', to: '#1c0505', accent: '#fca5a5' }, // 4 皇帝 白羊
  { from: '#14532d', to: '#052e16', accent: '#86efac' }, // 5 教皇 金牛
  { from: '#422006', to: '#1c0f02', accent: '#fde047' }, // 6 恋人 双子
  { from: '#1e3a5f', to: '#0c1a2e', accent: '#93c5fd' }, // 7 战车 巨蟹
  { from: '#431407', to: '#1c0803', accent: '#fdba74' }, // 8 力量 狮子
  { from: '#052e16', to: '#02140b', accent: '#4ade80' }, // 9 隐士 处女
  { from: '#1e1b4b', to: '#0c0a2e', accent: '#a5b4fc' }, // 10 命运之轮 木星
  { from: '#082f49', to: '#041624', accent: '#7dd3fc' }, // 11 正义 天秤
  { from: '#083344', to: '#041a24', accent: '#67e8f9' }, // 12 倒吊人 海王
  { from: '#0a0a0a', to: '#000000', accent: '#a1a1aa' }, // 13 死神 天蝎
  { from: '#4a044e', to: '#1f0222', accent: '#e879f9' }, // 14 节制 射手
  { from: '#2d0a0a', to: '#120404', accent: '#ef4444' }, // 15 恶魔 摩羯
  { from: '#7c2d12', to: '#31120a', accent: '#fb923c' }, // 16 高塔 火星
  { from: '#0c4a6e', to: '#052334', accent: '#7dd3fc' }, // 17 星星 水瓶
  { from: '#1e1b4b', to: '#0a0824', accent: '#c4b5fd' }, // 18 月亮 双鱼
  { from: '#713f12', to: '#2d1806', accent: '#fbbf24' }, // 19 太阳 太阳
  { from: '#2e1065', to: '#140533', accent: '#a78bfa' }, // 20 审判 冥王
  { from: '#3f3f46', to: '#18181b', accent: '#d4d4d8' }, // 21 世界 土星
];

const ROMAN_NUMERALS = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
];

export function TarotCard({ card, isUpright, flipped, onFlip }: TarotCardProps) {
  const visual = CARD_VISUALS[card.index] ?? CARD_VISUALS[0];
  const roman = ROMAN_NUMERALS[card.index] ?? String(card.index);

  return (
    <div
      className="group relative mx-auto cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      <motion.div
        className="relative h-[240px] w-[160px] md:h-[280px] md:w-[186px]"
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* ===== 牌背 ===== */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden rounded-xl border-2 shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            borderColor: 'hsl(43 60% 45%)',
            background: 'linear-gradient(135deg, #1a1025 0%, #0d0818 50%, #1a1025 100%)',
            boxShadow: '0 0 30px hsl(43 85% 58% / 0.15), inset 0 0 20px hsl(43 85% 58% / 0.08)',
          }}
        >
          {/* 内边框 */}
          <div
            className="absolute inset-2 rounded-lg border"
            style={{ borderColor: 'hsl(43 60% 45% / 0.4)' }}
          />
          {/* 中央八角星 */}
          <div className="relative flex items-center justify-center">
            <div
              className="absolute h-20 w-20 md:h-24 md:w-24 animate-spin-slow rounded-full"
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, hsl(43 85% 58% / 0.3) 45deg, transparent 90deg, hsl(43 85% 58% / 0.3) 135deg, transparent 180deg, hsl(43 85% 58% / 0.3) 225deg, transparent 270deg, hsl(43 85% 58% / 0.3) 315deg, transparent 360deg)`,
              }}
            />
            <div
              className="h-14 w-14 md:h-16 md:w-16 rounded-full border-2 flex items-center justify-center"
              style={{ borderColor: 'hsl(43 85% 58%)', background: 'hsl(43 85% 58% / 0.08)' }}
            >
              <span
                className="text-2xl md:text-3xl font-serif"
                style={{ color: 'hsl(43 85% 65%)' }}
              >
                ✦
              </span>
            </div>
          </div>
          {/* 底部文字 */}
          <div
            className="absolute bottom-4 text-[10px] tracking-[0.3em]"
            style={{ color: 'hsl(43 60% 55% / 0.7)' }}
          >
            TAROT
          </div>
          {/* 四角装饰 */}
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
            <div
              key={pos}
              className={`absolute ${pos} h-2 w-2 rounded-full`}
              style={{ background: 'hsl(43 85% 58% / 0.6)' }}
            />
          ))}
        </div>

        {/* ===== 牌面 ===== */}
        <div
          className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border-2 shadow-2xl"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
            borderColor: visual.accent,
            background: `linear-gradient(160deg, ${visual.from} 0%, ${visual.to} 100%)`,
            boxShadow: `0 0 30px ${visual.accent}33, inset 0 0 30px ${visual.accent}15`,
          }}
        >
          {/* 逆位时整体旋转180 */}
          <div
            className="flex h-full flex-col"
            style={{ transform: isUpright ? 'none' : 'rotate(180deg)' }}
          >
            {/* 顶部罗马数字 */}
            <div className="flex items-center justify-between px-3 pt-2.5">
              <span
                className="font-serif text-lg md:text-xl font-bold"
                style={{ color: visual.accent }}
              >
                {roman}
              </span>
              <span
                className="text-[9px] md:text-[10px] tracking-wider opacity-70"
                style={{ color: visual.accent }}
              >
                {card.element}
              </span>
            </div>

            {/* 中央符号区 */}
            <div className="flex flex-1 flex-col items-center justify-center px-2">
              <div
                className="mb-2 flex h-14 w-14 md:h-16 md:w-16 items-center justify-center rounded-full border"
                style={{
                  borderColor: `${visual.accent}66`,
                  background: `${visual.accent}15`,
                }}
              >
                <span
                  className="text-2xl md:text-3xl"
                  style={{ color: visual.accent }}
                >
                  {getCardSymbol(card.index)}
                </span>
              </div>
              <div
                className="text-center text-xl md:text-2xl font-bold tracking-wide"
                style={{ color: visual.accent, textShadow: `0 0 15px ${visual.accent}66` }}
              >
                {card.name}
              </div>
              <div
                className="mt-1 text-center text-[10px] md:text-xs tracking-wider opacity-70"
                style={{ color: visual.accent }}
              >
                {card.englishName}
              </div>
            </div>

            {/* 底部正逆位 */}
            <div className="pb-2.5 text-center">
              <span
                className="inline-block rounded-full border px-2.5 py-0.5 text-[10px] md:text-xs font-medium"
                style={{
                  borderColor: `${visual.accent}55`,
                  color: visual.accent,
                  background: `${visual.accent}12`,
                }}
              >
                {isUpright ? '正位' : '逆位'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 悬浮提示 */}
      {!flipped && (
        <div className="mt-3 text-center text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          点击翻开今日牌
        </div>
      )}
    </div>
  );
}

// 每张牌的象征符号（emoji，轻量无依赖）
function getCardSymbol(index: number): string {
  const symbols = [
    '🌬️', // 愚者
    '🪄', // 魔术师
    '🌙', // 女祭司
    '👑', // 女皇
    '⚔️', // 皇帝
    '📿', // 教皇
    '💞', // 恋人
    '🏛️', // 战车
    '🦁', // 力量
    '🏮', // 隐士
    '☸️', // 命运之轮
    '⚖️', // 正义
    '🙃', // 倒吊人
    '🦋', // 死神
    '🏺', // 节制
    '🔗', // 恶魔
    '🗼', // 高塔
    '⭐', // 星星
    '🌕', // 月亮
    '☀️', // 太阳
    '📯', // 审判
    '🌍', // 世界
  ];
  return symbols[index] ?? '✦';
}
