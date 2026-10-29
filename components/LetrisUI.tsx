import type { CSSProperties, ReactNode } from 'react';
import { useI18n } from '../lib/i18n';

// Peças visuais compartilhadas pelas telas: blocos de letra, logo, cartões,
// seletor de controle e ícones (SVG inline, sem emoji).

export type TileColor = 'blue' | 'yellow' | 'red' | 'orange' | 'green';

export const TILE_COLORS: TileColor[] = ['blue', 'yellow', 'red', 'orange', 'green'];

const TILE_FG: Record<TileColor, string> = {
  blue: '#ffffff',
  yellow: 'var(--color-ink)',
  red: '#ffffff',
  orange: 'var(--color-ink)',
  green: '#ffffff',
};

export function tileVars(color: TileColor): CSSProperties {
  return {
    '--tile-bg': `var(--color-tile-${color})`,
    '--tile-fg': TILE_FG[color],
  } as CSSProperties;
}

interface TileProps {
  letter?: string;
  color: TileColor;
  /** Lado em px; sem tamanho o bloco ocupa a célula do grid */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Tile({ letter, color, size, className = '', style }: TileProps) {
  const sizing: CSSProperties = size
    ? { width: size, height: size, fontSize: Math.round(size * 0.58), flexShrink: 0 }
    : {};
  return (
    <div className={`tile ${className}`} style={{ ...tileVars(color), ...sizing, ...style }}>
      {letter}
    </div>
  );
}

const LOGO: Array<[string, TileColor]> = [
  ['L', 'blue'], ['E', 'yellow'], ['T', 'red'], ['R', 'red'], ['I', 'green'], ['S', 'orange'],
];

export function Logo({ size, gap = 3 }: { size: number; gap?: number }) {
  return (
    <div className="flex" style={{ gap }} role="img" aria-label="LETRIS">
      {LOGO.map(([letter, color], i) => (
        <Tile key={i} letter={letter} color={color} size={size} />
      ))}
    </div>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`bg-panel rounded-2xl ${className}`}>{children}</div>;
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <span className={`text-[11px] font-extrabold tracking-wider text-soft ${className}`}>{children}</span>;
}

export function StatCard({ label, value }: { label: string; value: ReactNode }) {
  return (
    <Panel className="flex flex-col items-center justify-center py-2.5 px-1">
      <Label>{label}</Label>
      <span className="text-[22px] font-black leading-tight">{value}</span>
    </Panel>
  );
}

export type ControlMode = 'buttons' | 'gestures';

export function ControlModeToggle({ value, onChange, compact = false }: {
  value: ControlMode;
  onChange: (mode: ControlMode) => void;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const options: Array<[ControlMode, string, ReactNode]> = [
    ['buttons', t('controls.buttons'), <IconGamepad key="g" />],
    ['gestures', t('controls.gestures'), <IconHand key="h" />],
  ];
  return (
    <div className="grid grid-cols-2 gap-1.5 bg-deep rounded-2xl p-1.5" role="radiogroup" aria-label={t('controls.label')}>
      {options.map(([mode, label, icon]) => {
        const selected = value === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(mode)}
            className={`rounded-xl font-black flex items-center justify-center gap-2 ${compact ? 'h-12 flex-row text-[15px]' : 'h-16 flex-col gap-0.5 text-[15px]'} ${selected ? 'bg-tile-yellow text-ink' : 'text-chip'}`}
          >
            {icon}
            {label}
          </button>
        );
      })}
    </div>
  );
}

export function WordChip({ word, found }: { word: string; found: boolean }) {
  return (
    <span
      className={`px-2 py-[3px] rounded-full text-xs font-extrabold tracking-wide flex items-center gap-1 ${found ? 'bg-tile-green text-white' : 'bg-panel text-chip'}`}
    >
      {found && <IconCheck size={12} />}
      {word}
    </span>
  );
}

// ---------- Ícones ----------

type IconProps = { size?: number; strokeWidth?: number };

function Svg({ size = 24, strokeWidth = 3, children }: IconProps & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

export const IconLeft = (p: IconProps) => <Svg {...p}><path d="M15 6l-6 6 6 6" /></Svg>;
export const IconRight = (p: IconProps) => <Svg {...p}><path d="M9 6l6 6-6 6" /></Svg>;
export const IconDown = (p: IconProps) => <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>;
export const IconRotate = (p: IconProps) => (
  <Svg {...p}><path d="M20 12a8 8 0 1 1-2.34-5.66" /><path d="M20 4v5h-5" /></Svg>
);
export const IconDrop = (p: IconProps) => (
  <Svg {...p}><path d="M7 4l5 5 5-5" /><path d="M7 11l5 5 5-5" /><path d="M5 20h14" /></Svg>
);
export const IconPause = (p: IconProps) => <Svg {...p}><path d="M9 5v14M15 5v14" /></Svg>;
export const IconBack = IconLeft;
export const IconCheck = (p: IconProps) => <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconPlay = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />
  </svg>
);
export const IconStar = ({ size = 24 }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />
  </svg>
);
export const IconGamepad = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}><rect x="3" y="7" width="18" height="10" rx="5" /><path d="M8 10v4M6 12h4" /><path d="M16 11h.01M18 13h.01" /></Svg>
);
export const IconHand = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}>
    <path d="M9 11V5a2 2 0 0 1 4 0v6" />
    <path d="M13 10a2 2 0 0 1 4 0v4a6 6 0 0 1-6 6h-.5a6 6 0 0 1-5-2.7L4 15a2 2 0 0 1 3.3-2.2L9 15" />
  </Svg>
);
export const IconSwipe = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}><path d="M8 8l-4 4 4 4" /><path d="M16 8l4 4-4 4" /><path d="M4 12h16" /></Svg>
);
export const IconTap = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}><circle cx="12" cy="12" r="3" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2" /></Svg>
);
export const IconSwipeDown = (p: IconProps) => (
  <Svg strokeWidth={2.6} {...p}><path d="M12 4v14" /><path d="M7 13l5 5 5-5" /></Svg>
);
