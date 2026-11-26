import {LanguageId} from '../types/editor';

export interface LanguageConfig {
  id: LanguageId;
  label: string;
  shortLabel: string;
  extension: string;
  badgeColor: string;
  defaultTabSize: 2 | 4;
  lineComment: string;
  blockComment?: [string, string];
  runnable: boolean;
  previewable?: boolean;
}

export const LANGUAGES: Record<LanguageId, LanguageConfig> = {
  python: {
    id: 'python',
    label: 'Python 3',
    shortLabel: 'PY3',
    extension: 'py',
    badgeColor: '#38BDF8',
    defaultTabSize: 4,
    lineComment: '#',
    runnable: true,
  },
  typescript: {
    id: 'typescript',
    label: 'TypeScript',
    shortLabel: 'TS',
    extension: 'ts',
    badgeColor: '#00F0FF',
    defaultTabSize: 2,
    lineComment: '//',
    blockComment: ['/*', '*/'],
    runnable: true,
  },
  javascript: {
    id: 'javascript',
    label: 'JavaScript',
    shortLabel: 'JS',
    extension: 'js',
    badgeColor: '#FACC15',
    defaultTabSize: 2,
    lineComment: '//',
    blockComment: ['/*', '*/'],
    runnable: true,
  },
  html: {
    id: 'html',
    label: 'HTML5',
    shortLabel: 'HTML',
    extension: 'html',
    badgeColor: '#FF4D6D',
    defaultTabSize: 2,
    lineComment: '<!--',
    blockComment: ['<!--', '-->'],
    runnable: false,
    previewable: true,
  },
  css: {
    id: 'css',
    label: 'CSS3',
    shortLabel: 'CSS',
    extension: 'css',
    badgeColor: '#C084FC',
    defaultTabSize: 2,
    lineComment: '/*',
    blockComment: ['/*', '*/'],
    runnable: false,
  },
  json: {
    id: 'json',
    label: 'JSON',
    shortLabel: 'JSON',
    extension: 'json',
    badgeColor: '#39FF14',
    defaultTabSize: 2,
    lineComment: '//',
    runnable: true,
  },
  rust: {
    id: 'rust',
    label: 'Rust',
    shortLabel: 'RS',
    extension: 'rs',
    badgeColor: '#FB923C',
    defaultTabSize: 4,
    lineComment: '//',
    blockComment: ['/*', '*/'],
    runnable: false,
  },
  sql: {
    id: 'sql',
    label: 'SQL',
    shortLabel: 'SQL',
    extension: 'sql',
    badgeColor: '#2DD4BF',
    defaultTabSize: 2,
    lineComment: '--',
    blockComment: ['/*', '*/'],
    runnable: false,
  },
  markdown: {
    id: 'markdown',
    label: 'Markdown',
    shortLabel: 'MD',
    extension: 'md',
    badgeColor: '#94A3B8',
    defaultTabSize: 2,
    lineComment: '<!--',
    blockComment: ['<!--', '-->'],
    runnable: false,
    previewable: true,
  },
};

export const LANGUAGE_LIST: LanguageConfig[] = Object.values(LANGUAGES);

export function detectLanguageFromFilename(filename: string): LanguageId {
  const lower = filename.toLowerCase().trim();
  if (lower.endsWith('.py') || lower.endsWith('.pyw')) return 'python';
  if (lower.endsWith('.ts') || lower.endsWith('.tsx') || lower.endsWith('.mts')) return 'typescript';
  if (lower.endsWith('.js') || lower.endsWith('.jsx') || lower.endsWith('.mjs')) return 'javascript';
  if (lower.endsWith('.html') || lower.endsWith('.htm') || lower.endsWith('.svg')) return 'html';
  if (lower.endsWith('.css') || lower.endsWith('.scss')) return 'css';
  if (lower.endsWith('.json') || lower.endsWith('.jsonc')) return 'json';
  if (lower.endsWith('.rs')) return 'rust';
  if (lower.endsWith('.sql')) return 'sql';
  if (lower.endsWith('.md') || lower.endsWith('.mdx')) return 'markdown';
  return 'typescript';
}
