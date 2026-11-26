import {DiagnosticItem, LanguageId} from '../types/editor';

export function analyzeDiagnostics(code: string, language: LanguageId): DiagnosticItem[] {
  const diagnostics: DiagnosticItem[] = [];

  if (language === 'json') {
    try {
      JSON.parse(code);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ungültiges JSON';
      let line = 1;
      let column = 1;
      const posMatch = message.match(/position\s+(\d+)/i);
      const lineColMatch = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
      if (lineColMatch) {
        line = Number(lineColMatch[1]);
        column = Number(lineColMatch[2]);
      } else if (posMatch) {
        const pos = Number(posMatch[1]);
        const upTo = code.slice(0, pos);
        const lines = upTo.split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
      diagnostics.push({
        line,
        column,
        severity: 'error',
        message: `JSON-Syntaxfehler: ${message}`,
      });
    }
    return diagnostics;
  }

  if (language === 'markdown' || language === 'html') {
    return diagnostics;
  }

  // Bracket balance check skipping strings & comments
  const stack: Array<{char: string; line: number; column: number}> = [];
  const pairs: Record<string, string> = {'(': ')', '[': ']', '{': '}'};
  const closingToOpen: Record<string, string> = {')': '(', ']': '[', '}': '{'};

  let line = 1;
  let col = 1;
  let i = 0;

  while (i < code.length) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    if (ch === '\n') {
      line++;
      col = 1;
      i++;
      continue;
    }

    // Comments
    if ((language === 'python' && ch === '#') || ((language === 'javascript' || language === 'typescript' || language === 'rust') && two === '//') || (language === 'sql' && two === '--')) {
      while (i < code.length && code[i] !== '\n') i++;
      continue;
    }

    if ((language === 'javascript' || language === 'typescript' || language === 'css' || language === 'rust' || language === 'sql') && two === '/*') {
      const startLine = line;
      const startCol = col;
      i += 2;
      col += 2;
      let closed = false;
      while (i < code.length) {
        if (code[i] === '*' && code[i + 1] === '/') {
          i += 2;
          col += 2;
          closed = true;
          break;
        }
        if (code[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
      if (!closed) {
        diagnostics.push({
          line: startLine,
          column: startCol,
          severity: 'warning',
          message: 'Nicht geschlossener Blockkommentar (/* ... */)',
        });
      }
      continue;
    }

    // Strings
    if (ch === '"' || ch === "'" || (ch === '`' && (language === 'javascript' || language === 'typescript'))) {
      const triple = language === 'python' && (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''");
      const quote = triple ? code.slice(i, i + 3) : ch;
      const startLine = line;
      const startCol = col;
      i += quote.length;
      col += quote.length;
      let closed = false;
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          if (code[i + 1] === '\n') {
            line++;
            col = 1;
          } else {
            col += 2;
          }
          i += 2;
          continue;
        }
        if (quote.length === 1 && quote !== '`' && code[i] === '\n') {
          break;
        }
        if (code.slice(i, i + quote.length) === quote) {
          i += quote.length;
          col += quote.length;
          closed = true;
          break;
        }
        if (code[i] === '\n') {
          line++;
          col = 1;
        } else {
          col++;
        }
        i++;
      }
      if (!closed) {
        diagnostics.push({
          line: startLine,
          column: startCol,
          severity: 'error',
          message: `Nicht geschlossenes String-Literal (${quote})`,
        });
      }
      continue;
    }

    if (pairs[ch]) {
      stack.push({char: ch, line, column: col});
    } else if (closingToOpen[ch]) {
      const top = stack[stack.length - 1];
      if (!top || top.char !== closingToOpen[ch]) {
        diagnostics.push({
          line,
          column: col,
          severity: 'error',
          message: `Unerwartete schließende Klammer '${ch}'`,
        });
      } else {
        stack.pop();
      }
    }

    i++;
    col++;
  }

  for (const unclosed of stack) {
    diagnostics.push({
      line: unclosed.line,
      column: unclosed.column,
      severity: 'error',
      message: `Nicht geschlossene Klammer '${unclosed.char}'`,
    });
  }

  return diagnostics.sort((a, b) => a.line - b.line || a.column - b.column);
}

export function findMatchingBracket(
  code: string,
  offset: number
): [number, number] | null {
  const openChars = new Set(['(', '[', '{']);
  const closeChars = new Set([')', ']', '}']);
  const pairs: Record<string, string> = {'(': ')', '[': ']', '{': '}', ')': '(', ']': '[', '}': '{'};

  let targetIdx = -1;
  if (openChars.has(code[offset]) || closeChars.has(code[offset])) {
    targetIdx = offset;
  } else if (offset > 0 && (openChars.has(code[offset - 1]) || closeChars.has(code[offset - 1]))) {
    targetIdx = offset - 1;
  }
  if (targetIdx === -1) return null;

  const targetChar = code[targetIdx];
  const matchChar = pairs[targetChar];
  const dir = openChars.has(targetChar) ? 1 : -1;

  let depth = 0;
  let i = targetIdx;
  while (i >= 0 && i < code.length) {
    const ch = code[i];
    if (ch === targetChar) depth++;
    else if (ch === matchChar) {
      depth--;
      if (depth === 0) return [targetIdx, i];
    }
    i += dir;
  }
  return null;
}
