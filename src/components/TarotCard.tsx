import { motion } from 'framer-motion';
import type { TarotCard as TarotCardType } from '@/lib/tarot';

interface TarotCardProps {
  card: TarotCardType;
  isUpright: boolean;
  flipped: boolean;
  onFlip: () => void;
  compact?: boolean; // 小尺寸模式（三牌阵中过去/未来位使用）
  highlight?: boolean; // 高亮模式（现在位使用）
}

// 22张大阿卡纳独特配色
const MAJOR_VISUALS: { from: string; to: string; accent: string }[] = [
  { from: '#0c2d48', to: '#061525', accent: '#7dd3fc' }, // 0 愚者
  { from: '#3b0764', to: '#1e0533', accent: '#c4b5fd' }, // 1 魔术师
  { from: '#0f172a', to: '#020617', accent: '#e2e8f0' }, // 2 女祭司
  { from: '#500724', to: '#1f0510', accent: '#fda4af' }, // 3 女皇
  { from: '#450a0a', to: '#1c0505', accent: '#fca5a5' }, // 4 皇帝
  { from: '#14532d', to: '#052e16', accent: '#86efac' }, // 5 教皇
  { from: '#422006', to: '#1c0f02', accent: '#fde047' }, // 6 恋人
  { from: '#1e3a5f', to: '#0c1a2e', accent: '#93c5fd' }, // 7 战车
  { from: '#431407', to: '#1c0803', accent: '#fdba74' }, // 8 力量
  { from: '#052e16', to: '#02140b', accent: '#4ade80' }, // 9 隐士
  { from: '#1e1b4b', to: '#0c0a2e', accent: '#a5b4fc' }, // 10 命运之轮
  { from: '#082f49', to: '#041624', accent: '#7dd3fc' }, // 11 正义
  { from: '#083344', to: '#041a24', accent: '#67e8f9' }, // 12 倒吊人
  { from: '#0a0a0a', to: '#000000', accent: '#a1a1aa' }, // 13 死神
  { from: '#4a044e', to: '#1f0222', accent: '#e879f9' }, // 14 节制
  { from: '#2d0a0a', to: '#120404', accent: '#ef4444' }, // 15 恶魔
  { from: '#7c2d12', to: '#31120a', accent: '#fb923c' }, // 16 高塔
  { from: '#0c4a6e', to: '#052334', accent: '#7dd3fc' }, // 17 星星
  { from: '#1e1b4b', to: '#0a0824', accent: '#c4b5fd' }, // 18 月亮
  { from: '#713f12', to: '#2d1806', accent: '#fbbf24' }, // 19 太阳
  { from: '#2e1065', to: '#140533', accent: '#a78bfa' }, // 20 审判
  { from: '#3f3f46', to: '#18181b', accent: '#d4d4d8' }, // 21 世界
];

// 小阿卡纳按花色分配基础配色（四花色各14张）
function getMinorVisual(index: number): { from: string; to: string; accent: string } {
  const suitIndex = Math.floor((index - 22) / 14); // 0权杖 1圣杯 2宝剑 3星币
  const rankIndex = (index - 22) % 14; // 0-13
  const brightness = 8 + (rankIndex % 7) * 3; // 同花色内微调

  const suits = [
    { from: `hsl(20 ${60 + rankIndex}% ${12 + brightness * 0.5}%)`, to: `hsl(15 50% ${5 + brightness * 0.3}%)`, accent: '#fb923c' }, // 权杖 橙红
    { from: `hsl(190 ${50 + rankIndex}% ${12 + brightness * 0.5}%)`, to: `hsl(200 40% ${5 + brightness * 0.3}%)`, accent: '#67e8f9' }, // 圣杯 蓝绿
    { from: `hsl(220 ${30 + rankIndex}% ${12 + brightness * 0.5}%)`, to: `hsl(230 25% ${5 + brightness * 0.3}%)`, accent: '#94a3b8' }, // 宝剑 灰蓝
    { from: `hsl(40 ${50 + rankIndex}% ${12 + brightness * 0.5}%)`, to: `hsl(35 40% ${5 + brightness * 0.3}%)`, accent: '#fbbf24' }, // 星币 金黄
  ];
  return suits[suitIndex] ?? suits[0];
}

function getCardVisual(card: TarotCardType): { from: string; to: string; accent: string } {
  if (card.isMajor) {
    return MAJOR_VISUALS[card.index] ?? MAJOR_VISUALS[0];
  }
  return getMinorVisual(card.index);
}

const ROMAN_NUMERALS = [
  '0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI',
];

// 小阿卡纳符号
const SUIT_SYMBOLS: Record<string, string> = {
  '火': '🔥', '水': '💧', '风': '💨', '土': '🌿',
};

function getCardSymbol(card: TarotCardType): string {
  if (card.isMajor) {
    const majorSymbols = ['🌬️','🪄','🌙','👑','⚔️','📿','💞','🏛️','🦁','🏮','☸️','⚖️','🙃','🦋','🏺','🔗','🗼','⭐','🌕','☀️','📯','🌍'];
    return majorSymbols[card.index] ?? '✦';
  }
  return SUIT_SYMBOLS[card.element] ?? '✦';
}

export function TarotCard({ card, isUpright, flipped, onFlip, compact = false, highlight = false }: TarotCardProps) {
  const visual = getCardVisual(card);
  const roman = card.isMajor ? (ROMAN_NUMERALS[card.index] ?? String(card.index)) : '';

  const sizeClass = compact
    ? 'h-[168px] w-[112px] md:h-[196px] md:w-[130px]'
    : 'h-[240px] w-[160px] md:h-[280px] md:w-[186px]';

  const glowIntensity = highlight ? '0.5' : '0.25';

  return (
    <div
      className="group relative mx-auto cursor-pointer select-none"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      {highlight && (
        <div className="absolute -inset-2 rounded-2xl bg-[hsl(43_85%_58%_/_0.15)] blur-xl animate-glow-pulse" />
      )}
      <motion.div
        className={`relative ${sizeClass}`}
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
            boxShadow: `0 0 30px hsl(43 85% 58% / ${glowIntensity}), inset 0 0 20px hsl(43 85% 58% / 0.08)`,
          }}
        >
          <div className="absolute inset-2 rounded-lg border" style={{ borderColor: 'hsl(43 60% 45% / 0.4)' }} />
          <div className="relative flex items-center justify-center">
            <div
              className={`absolute ${compact ? 'h-12 w-12 md:h-14 md:w-14' : 'h-20 w-20 md:h-24 md:w-24'} animate-spin-slow rounded-full`}
              style={{
                background: `conic-gradient(from 0deg, transparent 0deg, hsl(43 85% 58% / 0.3) 45deg, transparent 90deg, hsl(43 85% 58% / 0.3) 135deg, transparent 180deg, hsl(43 85% 58% / 0.3) 225deg, transparent 270deg, hsl(43 85% 58% / 0.3) 315deg, transparent 360deg)`,
              }}
            />
            <div
              className={`${compact ? 'h-8 w-8 md:h-10 md:w-10' : 'h-14 w-14 md:h-16 md:w-16'} rounded-full border-2 flex items-center justify-center`}
              style={{ borderColor: 'hsl(43 85% 58%)', background: 'hsl(43 85% 58% / 0.08)' }}
            >
              <span className={`${compact ? 'text-base md:text-lg' : 'text-2xl md:text-3xl'} font-serif`} style={{ color: 'hsl(43 85% 65%)' }}>✦</span>
            </div>
          </div>
          <div className={`absolute ${compact ? 'bottom-2 text-[8px]' : 'bottom-4 text-[10px]'} tracking-[0.3em]`} style={{ color: 'hsl(43 60% 55% / 0.7)' }}>TAROT</div>
          {['top-2 left-2', 'top-2 right-2', 'bottom-2 left-2', 'bottom-2 right-2'].map((pos) => (
            <div key={pos} className={`absolute ${pos} ${compact ? 'h-1 w-1' : 'h-2 w-2'} rounded-full`} style={{ background: 'hsl(43 85% 58% / 0.6)' }} />
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
          <div className="flex h-full flex-col" style={{ transform: isUpright ? 'none' : 'rotate(180deg)' }}>
            <div className="flex items-center justify-between px-2 pt-1.5 md:px-3 md:pt-2.5">
              {roman && (
                <span className={`${compact ? 'text-xs md:text-sm' : 'text-lg md:text-xl'} font-serif font-bold`} style={{ color: visual.accent }}>{roman}</span>
              )}
              <span className={`${compact ? 'text-[8px] md:text-[9px]' : 'text-[9px] md:text-[10px]'} tracking-wider opacity-70`} style={{ color: visual.accent }}>{card.element}</span>
            </div>
            <div className="flex flex-1 flex-col items-center justify-center px-1">
              <div className={`${compact ? 'mb-1 h-8 w-8 md:h-10 md:w-10' : 'mb-2 h-14 w-14 md:h-16 md:w-16'} flex items-center justify-center rounded-full border`} style={{ borderColor: `${visual.accent}66`, background: `${visual.accent}15` }}>
                <span className={`${compact ? 'text-base md:text-lg' : 'text-2xl md:text-3xl'}`} style={{ color: visual.accent }}>{getCardSymbol(card)}</span>
              </div>
              <div className={`text-center ${compact ? 'text-sm md:text-base' : 'text-xl md:text-2xl'} font-bold tracking-wide`} style={{ color: visual.accent, textShadow: `0 0 15px ${visual.accent}66` }}>{card.name}</div>
              <div className={`mt-0.5 text-center ${compact ? 'text-[8px] md:text-[9px]' : 'text-[10px] md:text-xs'} tracking-wider opacity-70`} style={{ color: visual.accent }}>{card.englishName}</div>
            </div>
            <div className={`pb-1.5 md:pb-2.5 text-center`}>
              <span className={`inline-block rounded-full border ${compact ? 'px-1.5 py-0.5 text-[8px] md:text-[9px]' : 'px-2.5 py-0.5 text-[10px] md:text-xs'} font-medium`} style={{ borderColor: `${visual.accent}55`, color: visual.accent, background: `${visual.accent}12` }}>
                {isUpright ? '正位' : '逆位'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
