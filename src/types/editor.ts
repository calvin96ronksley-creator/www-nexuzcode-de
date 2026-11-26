export type LanguageId =
  | 'python'
  | 'typescript'
  | 'javascript'
  | 'html'
  | 'css'
  | 'json'
  | 'rust'
  | 'sql'
  | 'markdown';

export type TokenType =
  | 'keyword'
  | 'control'
  | 'function'
  | 'type'
  | 'string'
  | 'number'
  | 'comment'
  | 'operator'
  | 'punctuation'
  | 'variable'
  | 'property'
  | 'decorator'
  | 'tag'
  | 'attribute'
  | 'builtin'
  | 'boolean'
  | 'regex'
  | 'plain';

export interface Token {
  type: TokenType;
  value: string;
}

export interface EditorFile {
  id: string;
  name: string;
  language: LanguageId;
  content: string;
  savedContent: string;
}

export type NeonThemeId = 'cyber-cyan' | 'plasma-violet' | 'hyper-acid' | 'solar-flare';

export type GlowIntensity = 'off' | 'subtle' | 'radiant';

export interface DiagnosticItem {
  line: number;
  column: number;
  severity: 'error' | 'warning';
  message: string;
}

export interface ConsoleEntry {
  id: string;
  level: 'log' | 'warn' | 'error' | 'info' | 'result';
  text: string;
  timestamp: string;
}

export interface EditorSettings {
  theme: NeonThemeId;
  glow: GlowIntensity;
  fontSize: number;
  tabSize: 2 | 4;
  wordWrap: boolean;
  minimap: boolean;
}

export interface CursorPosition {
  line: number;
  column: number;
  offset: number;
  selectionLength: number;
}
