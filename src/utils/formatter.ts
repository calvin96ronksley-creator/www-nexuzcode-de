import {LanguageId} from '../types/editor';

export function formatCode(code: string, language: LanguageId, tabSize: 2 | 4): string {
  const indentUnit = ' '.repeat(tabSize);

  if (language === 'json') {
    const parsed = JSON.parse(code);
    return JSON.stringify(parsed, null, tabSize) + '\n';
  }

  if (language === 'python' || language === 'sql' || language === 'markdown') {
    // Preserve semantic indentation while trimming trailing whitespace and collapsing excessive blank lines
    const lines = code.replace(/\r\n/g, '\n').split('\n').map((l) => l.replace(/[ \t]+$/g, ''));
    const cleaned: string[] = [];
    let blankRun = 0;
    for (const line of lines) {
      if (line === '') {
        blankRun++;
        if (blankRun <= 2) cleaned.push(line);
      } else {
        blankRun = 0;
        cleaned.push(line);
      }
    }
    return cleaned.join('\n').replace(/\n*$/, '\n');
  }

  if (language === 'html') {
    const rawLines = code
      .replace(/>\s*</g, '>\n<')
      .replace(/\r\n/g, '\n')
      .split('\n')
      .map((l) => l.trim())
      .filter((l, idx, arr) => l.length > 0 || (idx > 0 && arr[idx - 1].length > 0));

    const voidTags = new Set([
      'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
      'link', 'meta', 'param', 'source', 'track', 'wbr',
    ]);

    let depth = 0;
    const out: string[] = [];
    for (const line of rawLines) {
      if (line === '') {
        out.push('');
        continue;
      }
      const isClosing = /^<\/[A-Za-z]/.test(line);
      if (isClosing) depth = Math.max(0, depth - 1);
      out.push(indentUnit.repeat(depth) + line);

      const openMatch = line.match(/^<([A-Za-z][A-Za-z0-9-]*)(?:\s[^>]*)?>$/);
      if (openMatch && !voidTags.has(openMatch[1].toLowerCase()) && !line.includes(`</${openMatch[1]}>`)) {
        depth++;
      }
    }
    return out.join('\n') + '\n';
  }

  // Brace-based languages: JS, TS, CSS, Rust
  const lines = code.replace(/\r\n/g, '\n').split('\n');
  let depth = 0;
  const formatted: string[] = [];
  let blankRun = 0;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (trimmed === '') {
      blankRun++;
      if (blankRun <= 1 && formatted.length > 0) formatted.push('');
      continue;
    }
    blankRun = 0;

    // Count leading closing braces/brackets
    const startsWithClose = /^[}\])]/.test(trimmed);
    if (startsWithClose) {
      depth = Math.max(0, depth - 1);
    }

    formatted.push(indentUnit.repeat(depth) + trimmed);

    // Adjust depth for net braces on this line (ignoring strings & line comments)
    let net = 0;
    let inStr: string | null = null;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (inStr) {
        if (ch === '\\') {
          i++;
          continue;
        }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inStr = ch;
        continue;
      }
      if (trimmed.slice(i, i + 2) === '//') break;
      if (ch === '{' || ch === '[' || ch === '(') net++;
      else if (ch === '}' || ch === ']' || ch === ')') net--;
    }

    if (startsWithClose) {
      // We already decremented 1 for the leading close
      depth = Math.max(0, depth + net + 1);
    } else {
      depth = Math.max(0, depth + net);
    }
  }

  return formatted.join('\n').replace(/\n*$/, '\n');
}
