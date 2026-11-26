import {LanguageId, Token, TokenType} from '../types/editor';

const PYTHON_KEYWORDS = new Set([
  'def', 'class', 'lambda', 'import', 'from', 'as', 'global', 'nonlocal',
  'async', 'await', 'with', 'pass', 'del', 'assert', 'in', 'is', 'not', 'and', 'or',
]);
const PYTHON_CONTROL = new Set([
  'if', 'elif', 'else', 'for', 'while', 'break', 'continue', 'return',
  'yield', 'try', 'except', 'finally', 'raise', 'match', 'case',
]);
const PYTHON_BUILTINS = new Set([
  'print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'sorted',
  'reversed', 'sum', 'min', 'max', 'abs', 'round', 'pow', 'type', 'isinstance',
  'issubclass', 'callable', 'hasattr', 'getattr', 'setattr', 'id', 'hash',
  'list', 'dict', 'set', 'tuple', 'str', 'int', 'float', 'bool', 'bytes',
  'open', 'super', 'any', 'all', 'chr', 'ord', 'hex', 'bin', 'oct', 'format',
  'input', 'repr', 'dir', 'vars', 'next', 'iter', 'slice', 'object',
]);
const PYTHON_BOOLEANS = new Set(['True', 'False', 'None', 'NotImplemented', 'Ellipsis']);
const PYTHON_SELF = new Set(['self', 'cls']);

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'class', 'extends', 'implements', 'interface',
  'type', 'enum', 'namespace', 'declare', 'abstract', 'readonly', 'keyof', 'typeof',
  'infer', 'satisfies', 'as', 'is', 'in', 'of', 'new', 'delete', 'void', 'instanceof',
  'import', 'export', 'from', 'default', 'async', 'static', 'public', 'private',
  'protected', 'get', 'set', 'debugger',
]);
const JS_CONTROL = new Set([
  'if', 'else', 'switch', 'case', 'for', 'while', 'do', 'break', 'continue',
  'return', 'throw', 'try', 'catch', 'finally', 'await', 'yield',
]);
const JS_BUILTINS = new Set([
  'console', 'Math', 'JSON', 'Promise', 'Array', 'Object', 'Map', 'Set', 'WeakMap',
  'WeakSet', 'Date', 'RegExp', 'Error', 'TypeError', 'Number', 'String', 'Boolean',
  'Symbol', 'BigInt', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'fetch',
  'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval', 'window', 'document',
  'globalThis', 'Intl', 'Reflect', 'Proxy',
]);
const JS_TYPES = new Set([
  'string', 'number', 'boolean', 'unknown', 'never', 'any', 'object', 'symbol',
  'bigint', 'Record', 'Partial', 'Required', 'Readonly', 'Pick', 'Omit', 'Exclude',
  'Extract', 'ReturnType', 'Parameters', 'Awaited',
]);
const JS_BOOLEANS = new Set(['true', 'false', 'null', 'undefined', 'NaN', 'Infinity', 'this', 'super']);

const RUST_KEYWORDS = new Set([
  'fn', 'let', 'mut', 'const', 'static', 'pub', 'struct', 'enum', 'impl', 'trait',
  'type', 'where', 'use', 'mod', 'crate', 'super', 'as', 'in', 'ref', 'move',
  'async', 'unsafe', 'extern', 'dyn',
]);
const RUST_CONTROL = new Set([
  'if', 'else', 'match', 'loop', 'for', 'while', 'break', 'continue', 'return', 'await',
]);
const RUST_TYPES = new Set([
  'i8', 'i16', 'i32', 'i64', 'i128', 'isize', 'u8', 'u16', 'u32', 'u64', 'u128',
  'usize', 'f32', 'f64', 'bool', 'char', 'str', 'String', 'Vec', 'Option', 'Result',
  'Box', 'Rc', 'Arc', 'HashMap', 'HashSet', 'Self',
]);
const RUST_BOOLEANS = new Set(['true', 'false', 'Some', 'None', 'Ok', 'Err', 'self']);

const SQL_KEYWORDS = new Set([
  'SELECT', 'FROM', 'WHERE', 'JOIN', 'INNER', 'LEFT', 'RIGHT', 'FULL', 'OUTER',
  'CROSS', 'ON', 'AS', 'AND', 'OR', 'NOT', 'IN', 'IS', 'LIKE', 'ILIKE', 'BETWEEN',
  'GROUP', 'BY', 'ORDER', 'ASC', 'DESC', 'HAVING', 'LIMIT', 'OFFSET', 'DISTINCT',
  'UNION', 'ALL', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE',
  'TABLE', 'VIEW', 'INDEX', 'DROP', 'ALTER', 'ADD', 'PRIMARY', 'KEY', 'FOREIGN',
  'REFERENCES', 'WITH', 'RECURSIVE', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END',
  'OVER', 'PARTITION', 'ROWS', 'RANGE', 'UNBOUNDED', 'PRECEDING', 'FOLLOWING',
  'CURRENT', 'ROW', 'EXISTS', 'CAST', 'RETURNING', 'CONFLICT', 'DO', 'NOTHING',
]);
const SQL_BUILTINS = new Set([
  'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'COALESCE', 'NULLIF', 'ROW_NUMBER',
  'RANK', 'DENSE_RANK', 'LAG', 'LEAD', 'FIRST_VALUE', 'LAST_VALUE', 'ROUND',
  'ABS', 'LOWER', 'UPPER', 'TRIM', 'SUBSTRING', 'CONCAT', 'NOW', 'DATE_TRUNC',
  'EXTRACT', 'JSON_AGG', 'ARRAY_AGG',
]);
const SQL_TYPES = new Set([
  'INT', 'INTEGER', 'BIGINT', 'SMALLINT', 'NUMERIC', 'DECIMAL', 'FLOAT', 'REAL',
  'DOUBLE', 'BOOLEAN', 'TEXT', 'VARCHAR', 'CHAR', 'TIMESTAMP', 'TIMESTAMPTZ',
  'DATE', 'UUID', 'JSONB', 'JSON', 'SERIAL',
]);
const SQL_BOOLEANS = new Set(['TRUE', 'FALSE', 'NULL']);

function isIdentStart(ch: string): boolean {
  return /[A-Za-z_$]/.test(ch);
}

function isIdentPart(ch: string): boolean {
  return /[A-Za-z0-9_$]/.test(ch);
}

function isDigit(ch: string): boolean {
  return /[0-9]/.test(ch);
}

function peekNonSpace(code: string, index: number): string {
  let i = index;
  while (i < code.length && (code[i] === ' ' || code[i] === '\t')) i++;
  return code[i] ?? '';
}

function tokenizePython(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let expectDefName = false;
  let expectClassName = false;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) {
      prev.value += value;
    } else {
      tokens.push({type, value});
    }
  };

  while (i < code.length) {
    const ch = code[i];

    // Comments
    if (ch === '#') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    // Decorators
    if (ch === '@' && (i === 0 || code[i - 1] === '\n' || /[ \t]/.test(code[i - 1]))) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_.]/.test(code[j])) j++;
      if (j > i + 1) {
        push('decorator', code.slice(i, j));
        i = j;
        continue;
      }
    }

    // Prefixed strings (f"...", r"...", b"...", u"...", fr"...")
    const strPrefixMatch = code.slice(i, i + 3).match(/^([fFrRbBuU]{1,2})("""|'''|"|')/);
    if (strPrefixMatch || ch === '"' || ch === "'") {
      const prefix = strPrefixMatch ? strPrefixMatch[1] : '';
      const quote = strPrefixMatch ? strPrefixMatch[2] : (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''" ? code.slice(i, i + 3) : ch);
      const isFString = prefix.toLowerCase().includes('f');
      const start = i;
      i += prefix.length + quote.length;

      if (!isFString) {
        while (i < code.length) {
          if (code[i] === '\\' && i + 1 < code.length) {
            i += 2;
            continue;
          }
          if (quote.length === 1 && code[i] === '\n') break;
          if (code.slice(i, i + quote.length) === quote) {
            i += quote.length;
            break;
          }
          i++;
        }
        push('string', code.slice(start, i));
        continue;
      } else {
        // F-string with {expr} highlighting
        push('string', code.slice(start, i));
        let bufStart = i;
        while (i < code.length) {
          if (code[i] === '\\' && i + 1 < code.length) {
            i += 2;
            continue;
          }
          if (quote.length === 1 && code[i] === '\n') break;
          if (code.slice(i, i + quote.length) === quote) {
            push('string', code.slice(bufStart, i + quote.length));
            i += quote.length;
            bufStart = -1;
            break;
          }
          if (code[i] === '{' && code[i + 1] !== '{') {
            push('string', code.slice(bufStart, i));
            push('punctuation', '{');
            i++;
            let depth = 1;
            const exprStart = i;
            while (i < code.length && depth > 0) {
              if (code[i] === '{') depth++;
              else if (code[i] === '}') depth--;
              if (depth > 0) i++;
            }
            const expr = code.slice(exprStart, i);
            const colonIdx = expr.indexOf(':');
            if (colonIdx !== -1) {
              for (const t of tokenizePython(expr.slice(0, colonIdx))) push(t.type, t.value);
              push('operator', expr.slice(colonIdx));
            } else {
              for (const t of tokenizePython(expr)) push(t.type, t.value);
            }
            if (code[i] === '}') {
              push('punctuation', '}');
              i++;
            }
            bufStart = i;
            continue;
          }
          if (code[i] === '{' && code[i + 1] === '{') {
            i += 2;
            continue;
          }
          i++;
        }
        if (bufStart !== -1 && bufStart < i) {
          push('string', code.slice(bufStart, i));
        }
        continue;
      }
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && isDigit(code[i + 1] ?? ''))) {
      const numMatch = code
        .slice(i)
        .match(/^(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|0[oO][0-7_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d[\d_]*)?j?|\.\d[\d_]*(?:[eE][+-]?\d[\d_]*)?j?)/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    // Identifiers & Keywords
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const prevChar = i > 0 ? code[i - 1] : '';
      const nextChar = peekNonSpace(code, j);

      if (expectDefName) {
        push('function', word);
        expectDefName = false;
      } else if (expectClassName) {
        push('type', word);
        expectClassName = false;
      } else if (PYTHON_CONTROL.has(word)) {
        push('control', word);
      } else if (PYTHON_KEYWORDS.has(word)) {
        push('keyword', word);
        if (word === 'def') expectDefName = true;
        if (word === 'class') expectClassName = true;
      } else if (PYTHON_BOOLEANS.has(word)) {
        push('boolean', word);
      } else if (PYTHON_SELF.has(word)) {
        push('decorator', word);
      } else if (PYTHON_BUILTINS.has(word)) {
        push('builtin', word);
      } else if (prevChar === '.') {
        push(nextChar === '(' ? 'function' : 'property', word);
      } else if (nextChar === '(') {
        push('function', word);
      } else if (/^[A-Z][A-Za-z0-9_]*$/.test(word)) {
        push('type', word);
      } else {
        push('variable', word);
      }
      i = j;
      continue;
    }

    // Operators & punctuation
    const opMatch = code.slice(i).match(/^(?:->|:=|\*\*=?|\/\/=?|<<=?|>>=?|[+\-*/%&|^=<>!]=?|@)/);
    if (opMatch) {
      push('operator', opMatch[0]);
      i += opMatch[0].length;
      continue;
    }

    if (/[()[\]{},.:;]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeJsTs(code: string, isTs: boolean): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let expectFuncName = false;
  let expectTypeName = false;
  let lastSignificantType: TokenType | null = null;
  let lastSignificantVal = '';

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    if (type !== 'plain' && type !== 'comment') {
      lastSignificantType = type;
      lastSignificantVal = value;
    }
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) {
      prev.value += value;
    } else {
      tokens.push({type, value});
    }
  };

  while (i < code.length) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    // Single-line comment
    if (two === '//') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    // Multi-line comment
    if (two === '/*') {
      const end = code.indexOf('*/', i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    // Decorator
    if (ch === '@' && isIdentStart(code[i + 1] ?? '')) {
      let j = i + 1;
      while (j < code.length && isIdentPart(code[j])) j++;
      push('decorator', code.slice(i, j));
      i = j;
      continue;
    }

    // Strings (' or ")
    if (ch === '"' || ch === "'") {
      const start = i;
      i++;
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          i += 2;
          continue;
        }
        if (code[i] === ch || code[i] === '\n') {
          if (code[i] === ch) i++;
          break;
        }
        i++;
      }
      push('string', code.slice(start, i));
      continue;
    }

    // Template literals `...${expr}...`
    if (ch === '`') {
      push('string', '`');
      i++;
      let bufStart = i;
      while (i < code.length) {
        if (code[i] === '\\' && i + 1 < code.length) {
          i += 2;
          continue;
        }
        if (code[i] === '`') {
          push('string', code.slice(bufStart, i + 1));
          i++;
          bufStart = -1;
          break;
        }
        if (code[i] === '$' && code[i + 1] === '{') {
          push('string', code.slice(bufStart, i));
          push('punctuation', '${');
          i += 2;
          let depth = 1;
          const exprStart = i;
          while (i < code.length && depth > 0) {
            if (code[i] === '{') depth++;
            else if (code[i] === '}') depth--;
            if (depth > 0) i++;
          }
          for (const t of tokenizeJsTs(code.slice(exprStart, i), isTs)) {
            push(t.type, t.value);
          }
          if (code[i] === '}') {
            push('punctuation', '}');
            i++;
          }
          bufStart = i;
          continue;
        }
        i++;
      }
      if (bufStart !== -1 && bufStart < i) {
        push('string', code.slice(bufStart, i));
      }
      continue;
    }

    // Regex literal heuristic
    if (
      ch === '/' &&
      code[i + 1] !== '/' &&
      code[i + 1] !== '*' &&
      (lastSignificantType === null ||
        lastSignificantType === 'operator' ||
        lastSignificantType === 'control' ||
        lastSignificantType === 'keyword' ||
        ['(', '[', '{', ',', ';', ':', '='].includes(lastSignificantVal))
    ) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < code.length && code[j] !== '\n') {
        if (code[j] === '\\' && j + 1 < code.length) {
          j += 2;
          continue;
        }
        if (code[j] === '[') inClass = true;
        else if (code[j] === ']') inClass = false;
        else if (code[j] === '/' && !inClass) {
          j++;
          while (j < code.length && /[gimsuvy]/.test(code[j])) j++;
          closed = true;
          break;
        }
        j++;
      }
      if (closed) {
        push('regex', code.slice(i, j));
        i = j;
        continue;
      }
    }

    // Numbers
    if (isDigit(ch) || (ch === '.' && isDigit(code[i + 1] ?? ''))) {
      const numMatch = code
        .slice(i)
        .match(/^(?:0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d[\d_]*)?n?|\.\d[\d_]*(?:[eE][+-]?\d[\d_]*)?)/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    // Identifiers & Keywords
    if (isIdentStart(ch)) {
      let j = i + 1;
      while (j < code.length && isIdentPart(code[j])) j++;
      const word = code.slice(i, j);
      const prevChar = i > 0 ? code[i - 1] : '';
      const nextChar = peekNonSpace(code, j);

      if (expectFuncName) {
        push('function', word);
        expectFuncName = false;
      } else if (expectTypeName) {
        push('type', word);
        expectTypeName = false;
      } else if (JS_CONTROL.has(word)) {
        push('control', word);
      } else if (JS_KEYWORDS.has(word)) {
        push('keyword', word);
        if (word === 'function') expectFuncName = true;
        if (word === 'class' || word === 'interface' || word === 'type' || word === 'enum') {
          expectTypeName = true;
        }
      } else if (JS_BOOLEANS.has(word)) {
        push('boolean', word);
      } else if (isTs && JS_TYPES.has(word)) {
        push('type', word);
      } else if (JS_BUILTINS.has(word)) {
        push('builtin', word);
      } else if (prevChar === '.') {
        push(nextChar === '(' ? 'function' : 'property', word);
      } else if (nextChar === ':' && ['{', ',', '('].includes(lastSignificantVal)) {
        push('property', word);
      } else if (nextChar === '(') {
        push('function', word);
      } else if (/^[A-Z][A-Za-z0-9_]*$/.test(word)) {
        push('type', word);
      } else {
        push('variable', word);
      }
      i = j;
      continue;
    }

    // Operators
    const opMatch = code.slice(i).match(/^(?:=>|===|!==|\.\.\.|\?\?=?|&&=?|\|\|=?|<<=?|>>=?|>>>=?|\*\*=?|[+\-*/%&|^=<>!~?]=?)/);
    if (opMatch) {
      push('operator', opMatch[0]);
      i += opMatch[0].length;
      continue;
    }

    if (/[()[\]{},.:;]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeHtml(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) {
      prev.value += value;
    } else {
      tokens.push({type, value});
    }
  };

  while (i < code.length) {
    if (code.startsWith('<!--', i)) {
      const end = code.indexOf('-->', i + 4);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 3);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    if (code.slice(i, i + 9).toUpperCase() === '<!DOCTYPE') {
      const end = code.indexOf('>', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 1);
      push('keyword', slice);
      i += slice.length;
      continue;
    }

    if (code[i] === '<' && (code[i + 1] === '/' || /[A-Za-z]/.test(code[i + 1] ?? ''))) {
      const isClosing = code[i + 1] === '/';
      push('punctuation', isClosing ? '</' : '<');
      i += isClosing ? 2 : 1;

      let tagEnd = i;
      while (tagEnd < code.length && /[A-Za-z0-9_-]/.test(code[tagEnd])) tagEnd++;
      const tagName = code.slice(i, tagEnd);
      push('tag', tagName);
      i = tagEnd;

      // Attributes until '>'
      while (i < code.length && code[i] !== '>') {
        if (code[i] === '/' && code[i + 1] === '>') {
          push('punctuation', '/>');
          i += 2;
          break;
        }
        if (/\s/.test(code[i])) {
          push('plain', code[i]);
          i++;
          continue;
        }
        if (code[i] === '=') {
          push('operator', '=');
          i++;
          continue;
        }
        if (code[i] === '"' || code[i] === "'") {
          const q = code[i];
          const start = i;
          i++;
          while (i < code.length && code[i] !== q) i++;
          if (code[i] === q) i++;
          push('string', code.slice(start, i));
          continue;
        }
        if (/[A-Za-z0-9_:@.-]/.test(code[i])) {
          let attrEnd = i;
          while (attrEnd < code.length && /[A-Za-z0-9_:@.-]/.test(code[attrEnd])) attrEnd++;
          push('attribute', code.slice(i, attrEnd));
          i = attrEnd;
          continue;
        }
        push('plain', code[i]);
        i++;
      }

      if (code[i] === '>') {
        push('punctuation', '>');
        i++;
      }

      // Inline <style> or <script> content
      if (!isClosing && (tagName.toLowerCase() === 'style' || tagName.toLowerCase() === 'script')) {
        const closeTag = `</${tagName}`;
        const closeIdx = code.toLowerCase().indexOf(closeTag.toLowerCase(), i);
        if (closeIdx !== -1) {
          const inner = code.slice(i, closeIdx);
          const innerTokens =
            tagName.toLowerCase() === 'style' ? tokenizeCss(inner) : tokenizeJsTs(inner, false);
          for (const t of innerTokens) push(t.type, t.value);
          i = closeIdx;
        }
      }
      continue;
    }

    // HTML entity
    if (code[i] === '&') {
      const ent = code.slice(i).match(/^&(?:#\d+|#x[0-9a-fA-F]+|[A-Za-z]+);/);
      if (ent) {
        push('builtin', ent[0]);
        i += ent[0].length;
        continue;
      }
    }

    push('plain', code[i]);
    i++;
  }

  return tokens;
}

function tokenizeCss(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let insideBlock = 0;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) {
      prev.value += value;
    } else {
      tokens.push({type, value});
    }
  };

  while (i < code.length) {
    const ch = code[i];

    if (code.slice(i, i + 2) === '/*') {
      const end = code.indexOf('*/', i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const start = i;
      i++;
      while (i < code.length && code[i] !== ch && code[i] !== '\n') {
        if (code[i] === '\\' && i + 1 < code.length) i += 2;
        else i++;
      }
      if (code[i] === ch) i++;
      push('string', code.slice(start, i));
      continue;
    }

    if (ch === '@') {
      const atMatch = code.slice(i).match(/^@[A-Za-z-]+/);
      if (atMatch) {
        push('keyword', atMatch[0]);
        i += atMatch[0].length;
        continue;
      }
    }

    // Hex colors
    if (ch === '#') {
      const hexMatch = code.slice(i).match(/^#[0-9a-fA-F]{3,8}\b/);
      if (hexMatch && insideBlock > 0) {
        push('number', hexMatch[0]);
        i += hexMatch[0].length;
        continue;
      }
      const idMatch = code.slice(i).match(/^#[A-Za-z0-9_-]+/);
      if (idMatch) {
        push('type', idMatch[0]);
        i += idMatch[0].length;
        continue;
      }
    }

    if (ch === '{') {
      insideBlock++;
      push('punctuation', ch);
      i++;
      continue;
    }
    if (ch === '}') {
      insideBlock = Math.max(0, insideBlock - 1);
      push('punctuation', ch);
      i++;
      continue;
    }

    // Numbers with units
    if (isDigit(ch) || (ch === '.' && isDigit(code[i + 1] ?? ''))) {
      const numMatch = code.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)(?:px|rem|em|vh|vw|vmin|vmax|%|deg|rad|ms|s|fr|ch)?\b|^(?:\d+(?:\.\d+)?|\.\d+)%/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    if (/[A-Za-z_.-]/.test(ch)) {
      let j = i;
      while (j < code.length && /[A-Za-z0-9_-]/.test(code[j])) j++;
      if (j === i) {
        push('punctuation', ch);
        i++;
        continue;
      }
      const word = code.slice(i, j);
      const nextChar = peekNonSpace(code, j);

      if (insideBlock > 0) {
        if (nextChar === ':') {
          push('property', word);
        } else if (nextChar === '(') {
          push('function', word);
        } else if (word === 'important') {
          push('decorator', word);
        } else {
          push('builtin', word);
        }
      } else {
        if (ch === '.') {
          push('attribute', word);
        } else {
          push('tag', word);
        }
      }
      i = j;
      continue;
    }

    if (/[():;,]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    if (/[>+~*=!]/.test(ch)) {
      push('operator', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeJson(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) prev.value += value;
    else tokens.push({type, value});
  };

  while (i < code.length) {
    const ch = code[i];

    if (ch === '"') {
      const start = i;
      i++;
      while (i < code.length && code[i] !== '"' && code[i] !== '\n') {
        if (code[i] === '\\' && i + 1 < code.length) i += 2;
        else i++;
      }
      if (code[i] === '"') i++;
      const str = code.slice(start, i);
      const nextChar = peekNonSpace(code, i);
      push(nextChar === ':' ? 'property' : 'string', str);
      continue;
    }

    if (ch === '-' || isDigit(ch)) {
      const numMatch = code.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    if (/[A-Za-z]/.test(ch)) {
      const kwMatch = code.slice(i).match(/^(?:true|false|null)\b/);
      if (kwMatch) {
        push('boolean', kwMatch[0]);
        i += kwMatch[0].length;
        continue;
      }
    }

    if (/[{}[\]:,]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeRust(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let expectFn = false;
  let expectType = false;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) prev.value += value;
    else tokens.push({type, value});
  };

  while (i < code.length) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    if (two === '//') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      push('comment', slice);
      i += slice.length;
      continue;
    }
    if (two === '/*') {
      const end = code.indexOf('*/', i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    // Attributes #[...]
    if (two === '#[' || code.slice(i, i + 3) === '#![') {
      const end = code.indexOf(']', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 1);
      push('decorator', slice);
      i += slice.length;
      continue;
    }

    // Strings
    if (ch === '"') {
      const start = i;
      i++;
      while (i < code.length && code[i] !== '"') {
        if (code[i] === '\\' && i + 1 < code.length) i += 2;
        else i++;
      }
      if (code[i] === '"') i++;
      push('string', code.slice(start, i));
      continue;
    }

    // Lifetimes vs char literals
    if (ch === "'") {
      const lt = code.slice(i).match(/^'[A-Za-z_][A-Za-z0-9_]*/);
      if (lt && code[i + lt[0].length] !== "'") {
        push('decorator', lt[0]);
        i += lt[0].length;
        continue;
      }
      const chLit = code.slice(i).match(/^'(?:\\.|[^'\\])'/);
      if (chLit) {
        push('string', chLit[0]);
        i += chLit[0].length;
        continue;
      }
    }

    if (isDigit(ch)) {
      const numMatch = code.slice(i).match(/^(?:0x[0-9a-fA-F_]+|0b[01_]+|\d[\d_]*(?:\.[\d_]+)?(?:[eE][+-]?\d+)?(?:i32|u32|i64|u64|usize|f64|f32)?)/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j])) j++;
      if (code[j] === '!') {
        push('builtin', code.slice(i, j + 1));
        i = j + 1;
        continue;
      }
      const word = code.slice(i, j);
      const nextChar = peekNonSpace(code, j);

      if (expectFn) {
        push('function', word);
        expectFn = false;
      } else if (expectType) {
        push('type', word);
        expectType = false;
      } else if (RUST_CONTROL.has(word)) {
        push('control', word);
      } else if (RUST_KEYWORDS.has(word)) {
        push('keyword', word);
        if (word === 'fn') expectFn = true;
        if (word === 'struct' || word === 'enum' || word === 'trait') expectType = true;
      } else if (RUST_BOOLEANS.has(word)) {
        push('boolean', word);
      } else if (RUST_TYPES.has(word) || /^[A-Z]/.test(word)) {
        push('type', word);
      } else if (nextChar === '(') {
        push('function', word);
      } else {
        push('variable', word);
      }
      i = j;
      continue;
    }

    const opMatch = code.slice(i).match(/^(?:->|=>|::|\.\.=?|&&|\|\||[+\-*/%&|^=<>!]=?)/);
    if (opMatch) {
      push('operator', opMatch[0]);
      i += opMatch[0].length;
      continue;
    }

    if (/[()[\]{},.;:]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeSql(code: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const push = (type: TokenType, value: string) => {
    if (!value) return;
    const prev = tokens[tokens.length - 1];
    if (prev && prev.type === type) prev.value += value;
    else tokens.push({type, value});
  };

  while (i < code.length) {
    const ch = code[i];
    const two = code.slice(i, i + 2);

    if (two === '--') {
      const end = code.indexOf('\n', i);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end);
      push('comment', slice);
      i += slice.length;
      continue;
    }
    if (two === '/*') {
      const end = code.indexOf('*/', i + 2);
      const slice = end === -1 ? code.slice(i) : code.slice(i, end + 2);
      push('comment', slice);
      i += slice.length;
      continue;
    }

    if (ch === "'") {
      const start = i;
      i++;
      while (i < code.length) {
        if (code[i] === "'" && code[i + 1] === "'") {
          i += 2;
          continue;
        }
        if (code[i] === "'") {
          i++;
          break;
        }
        i++;
      }
      push('string', code.slice(start, i));
      continue;
    }

    if (isDigit(ch)) {
      const numMatch = code.slice(i).match(/^\d+(?:\.\d+)?/);
      if (numMatch) {
        push('number', numMatch[0]);
        i += numMatch[0].length;
        continue;
      }
    }

    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < code.length && /[A-Za-z0-9_]/.test(code[j])) j++;
      const word = code.slice(i, j);
      const upper = word.toUpperCase();
      if (SQL_BOOLEANS.has(upper)) push('boolean', word);
      else if (SQL_KEYWORDS.has(upper)) push('keyword', word);
      else if (SQL_BUILTINS.has(upper)) push('function', word);
      else if (SQL_TYPES.has(upper)) push('type', word);
      else push('variable', word);
      i = j;
      continue;
    }

    const opMatch = code.slice(i).match(/^(?:<>|!=|<=|>=|\|\||::|[+\-*/=<>])/);
    if (opMatch) {
      push('operator', opMatch[0]);
      i += opMatch[0].length;
      continue;
    }

    if (/[(),.;]/.test(ch)) {
      push('punctuation', ch);
      i++;
      continue;
    }

    push('plain', ch);
    i++;
  }

  return tokens;
}

function tokenizeMarkdown(code: string): Token[] {
  const lines = code.split('\n');
  const flat: Token[] = [];
  let inFence = false;

  lines.forEach((line, idx) => {
    if (idx > 0) flat.push({type: 'plain', value: '\n'});
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      flat.push({type: 'decorator', value: line});
      return;
    }
    if (inFence) {
      flat.push({type: 'string', value: line});
      return;
    }
    if (/^#{1,6}\s/.test(line)) {
      flat.push({type: 'function', value: line});
      return;
    }
    if (/^\s*>/.test(line)) {
      flat.push({type: 'comment', value: line});
      return;
    }
    if (/^\s*(?:[-*+]|\d+\.)\s/.test(line)) {
      const m = line.match(/^(\s*(?:[-*+]|\d+\.)\s)(.*)$/);
      if (m) {
        flat.push({type: 'keyword', value: m[1]});
        flat.push({type: 'plain', value: m[2]});
        return;
      }
    }
    // Inline code & bold
    let i = 0;
    while (i < line.length) {
      if (line[i] === '`') {
        const end = line.indexOf('`', i + 1);
        if (end !== -1) {
          flat.push({type: 'string', value: line.slice(i, end + 1)});
          i = end + 1;
          continue;
        }
      }
      if (line.startsWith('**', i)) {
        const end = line.indexOf('**', i + 2);
        if (end !== -1) {
          flat.push({type: 'type', value: line.slice(i, end + 2)});
          i = end + 2;
          continue;
        }
      }
      flat.push({type: 'plain', value: line[i]});
      i++;
    }
  });

  return flat;
}

export function tokenizeFlat(code: string, language: LanguageId): Token[] {
  switch (language) {
    case 'python':
      return tokenizePython(code);
    case 'typescript':
      return tokenizeJsTs(code, true);
    case 'javascript':
      return tokenizeJsTs(code, false);
    case 'html':
      return tokenizeHtml(code);
    case 'css':
      return tokenizeCss(code);
    case 'json':
      return tokenizeJson(code);
    case 'rust':
      return tokenizeRust(code);
    case 'sql':
      return tokenizeSql(code);
    case 'markdown':
      return tokenizeMarkdown(code);
    default:
      return [{type: 'plain', value: code}];
  }
}

export function tokenizeByLines(code: string, language: LanguageId): Token[][] {
  const flat = tokenizeFlat(code, language);
  const lines: Token[][] = [[]];

  for (const token of flat) {
    if (!token.value.includes('\n')) {
      lines[lines.length - 1].push(token);
      continue;
    }
    const parts = token.value.split('\n');
    for (let p = 0; p < parts.length; p++) {
      if (p > 0) {
        lines.push([]);
      }
      if (parts[p].length > 0) {
        lines[lines.length - 1].push({type: token.type, value: parts[p]});
      }
    }
  }

  return lines;
}
