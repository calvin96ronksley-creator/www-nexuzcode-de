import {GlowIntensity, NeonThemeId, TokenType} from '../types/editor';

export interface NeonThemeDefinition {
  id: NeonThemeId;
  name: string;
  subtitle: string;
  accent: string;
  accentRgb: string;
  secondary: string;
  secondaryRgb: string;
  swatches: [string, string, string];
  tokens: Record<TokenType, string>;
}

export const NEON_THEMES: Record<NeonThemeId, NeonThemeDefinition> = {
  'cyber-cyan': {
    id: 'cyber-cyan',
    name: 'Cyber Cyan',
    subtitle: 'Elektrisches Cyan & Magenta',
    accent: '#00F0FF',
    accentRgb: '0, 240, 255',
    secondary: '#FF2E97',
    secondaryRgb: '255, 46, 151',
    swatches: ['#00F0FF', '#FF2E97', '#39FF14'],
    tokens: {
      keyword: '#FF2E97',
      control: '#FF5CE1',
      function: '#00F0FF',
      type: '#FFD166',
      string: '#39FF14',
      number: '#B388FF',
      comment: '#64748B',
      operator: '#38BDF8',
      punctuation: '#94A3B8',
      variable: '#E2E8F0',
      property: '#67E8F9',
      decorator: '#FF6B6B',
      tag: '#FF2E97',
      attribute: '#FFD166',
      builtin: '#22D3EE',
      boolean: '#C084FC',
      regex: '#FB923C',
      plain: '#E2E8F0',
    },
  },
  'plasma-violet': {
    id: 'plasma-violet',
    name: 'Plasma Violet',
    subtitle: 'Ultraviolett & Aquamarin',
    accent: '#C084FC',
    accentRgb: '192, 132, 252',
    secondary: '#2DD4BF',
    secondaryRgb: '45, 212, 191',
    swatches: ['#C084FC', '#2DD4BF', '#FB7185'],
    tokens: {
      keyword: '#F472B6',
      control: '#C084FC',
      function: '#2DD4BF',
      type: '#FBBF24',
      string: '#4ADE80',
      number: '#60A5FA',
      comment: '#64748B',
      operator: '#A78BFA',
      punctuation: '#94A3B8',
      variable: '#F1F5F9',
      property: '#5EEAD4',
      decorator: '#FB7185',
      tag: '#F472B6',
      attribute: '#FBBF24',
      builtin: '#38BDF8',
      boolean: '#E879F9',
      regex: '#F97316',
      plain: '#F1F5F9',
    },
  },
  'hyper-acid': {
    id: 'hyper-acid',
    name: 'Hyper Acid',
    subtitle: 'Strahlendes Lime & Eisblau',
    accent: '#A3E635',
    accentRgb: '163, 230, 53',
    secondary: '#22D3EE',
    secondaryRgb: '34, 211, 238',
    swatches: ['#A3E635', '#22D3EE', '#FACC15'],
    tokens: {
      keyword: '#22D3EE',
      control: '#38BDF8',
      function: '#A3E635',
      type: '#FACC15',
      string: '#34D399',
      number: '#F472B6',
      comment: '#64748B',
      operator: '#4ADE80',
      punctuation: '#94A3B8',
      variable: '#E2E8F0',
      property: '#BEF264',
      decorator: '#FB923C',
      tag: '#22D3EE',
      attribute: '#FACC15',
      builtin: '#67E8F9',
      boolean: '#E879F9',
      regex: '#FDBA74',
      plain: '#E2E8F0',
    },
  },
  'solar-flare': {
    id: 'solar-flare',
    name: 'Solar Flare',
    subtitle: 'Neon-Gold & Koralle',
    accent: '#FFB800',
    accentRgb: '255, 184, 0',
    secondary: '#FF4D6D',
    secondaryRgb: '255, 77, 109',
    swatches: ['#FFB800', '#FF4D6D', '#38BDF8'],
    tokens: {
      keyword: '#FF4D6D',
      control: '#FF758F',
      function: '#FFB800',
      type: '#38BDF8',
      string: '#4ADE80',
      number: '#C084FC',
      comment: '#64748B',
      operator: '#FBBF24',
      punctuation: '#94A3B8',
      variable: '#F1F5F9',
      property: '#7DD3FC',
      decorator: '#FB923C',
      tag: '#FF4D6D',
      attribute: '#FFB800',
      builtin: '#22D3EE',
      boolean: '#F472B6',
      regex: '#34D399',
      plain: '#F1F5F9',
    },
  },
};

const GLOW_TOKEN_TYPES = new Set<TokenType>([
  'keyword',
  'control',
  'function',
  'string',
  'type',
  'decorator',
  'tag',
  'builtin',
  'boolean',
]);

export function getTokenStyle(
  type: TokenType,
  theme: NeonThemeDefinition,
  glow: GlowIntensity
): {color: string; textShadow?: string; fontStyle?: 'italic' | 'normal'; fontWeight?: number} {
  const color = theme.tokens[type] ?? theme.tokens.plain;
  const fontStyle = type === 'comment' ? 'italic' : 'normal';
  const fontWeight = type === 'keyword' || type === 'control' ? 500 : undefined;

  if (glow === 'off' || !GLOW_TOKEN_TYPES.has(type)) {
    return {color, fontStyle, fontWeight};
  }

  if (glow === 'subtle') {
    return {
      color,
      fontStyle,
      fontWeight,
      textShadow: `0 0 8px ${color}40`,
    };
  }

  // radiant
  return {
    color,
    fontStyle,
    fontWeight,
    textShadow: `0 0 10px ${color}78, 0 0 22px ${color}33`,
  };
}
