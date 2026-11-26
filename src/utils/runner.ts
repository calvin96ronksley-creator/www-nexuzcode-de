import {ConsoleEntry, LanguageId} from '../types/editor';

export interface RunResult {
  entries: ConsoleEntry[];
  durationMs: number;
  success: boolean;
}

function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString('de-DE', {hour12: false});
}

function makeEntry(level: ConsoleEntry['level'], text: string): ConsoleEntry {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level,
    text,
    timestamp: nowTime(),
  };
}

function formatJsValue(val: unknown): string {
  if (val === undefined) return 'undefined';
  if (val === null) return 'null';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean' || typeof val === 'bigint') {
    return String(val);
  }
  if (typeof val === 'function') return `[Function: ${val.name || 'anonymous'}]`;
  try {
    return JSON.stringify(val, null, 2);
  } catch {
    return String(val);
  }
}

// Clean TypeScript type stripper for browser sandbox execution
export function stripTypeScriptTypes(source: string): string {
  // Remove multi-line interface / type declarations at statement boundaries
  let code = source.replace(/\r\n/g, '\n');

  // Remove `export ` prefix cleanly for standalone execution
  code = code.replace(/^\s*export\s+(?=(?:async\s+)?(?:function|const|let|var|class|enum|interface|type)\b)/gm, '');
  code = code.replace(/^\s*export\s+default\s+/gm, '');

  // Strip `interface Name { ... }` blocks (supports nested braces)
  const stripBlockDecl = (input: string, keyword: 'interface' | 'type'): string => {
    let out = '';
    let i = 0;
    while (i < input.length) {
      const slice = input.slice(i);
      const match =
        keyword === 'interface'
          ? slice.match(/^(?:declare\s+)?interface\s+[A-Za-z_$][\w$]*(?:<[^>{]*>)?(?:\s+extends\s+[^{]+)?\s*\{/)
          : slice.match(/^(?:declare\s+)?type\s+[A-Za-z_$][\w$]*(?:<[^>=]*>)?\s*=\s*/);

      const atLineStart = i === 0 || input[i - 1] === '\n' || /[;\s]/.test(input[i - 1]);
      if (match && atLineStart) {
        if (keyword === 'interface') {
          let j = i + match[0].length;
          let depth = 1;
          while (j < input.length && depth > 0) {
            if (input[j] === '{') depth++;
            else if (input[j] === '}') depth--;
            if (input[j] === '\n') out += '\n';
            j++;
          }
          i = j;
          continue;
        } else {
          // type alias until semicolon or end of balanced braces/line
          let j = i + match[0].length;
          let depth = 0;
          while (j < input.length) {
            const ch = input[j];
            if (ch === '{' || ch === '(' || ch === '[') depth++;
            else if (ch === '}' || ch === ')' || ch === ']') depth = Math.max(0, depth - 1);
            if (depth === 0 && (ch === ';' || (ch === '\n' && !/[|&]\s*$/.test(input.slice(i, j))))) {
              if (ch === '\n') out += '\n';
              j++;
              break;
            }
            if (ch === '\n') out += '\n';
            j++;
          }
          i = j;
          continue;
        }
      }
      out += input[i];
      i++;
    }
    return out;
  };

  code = stripBlockDecl(code, 'interface');
  code = stripBlockDecl(code, 'type');

  // Convert simple `enum Name { A = 1, B = "x" }` to JS object
  code = code.replace(
    /enum\s+([A-Za-z_$][\w$]*)\s*\{([^}]*)\}/g,
    (_m, name: string, body: string) => {
      let autoIdx = 0;
      const entries = body
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => {
          const eq = item.indexOf('=');
          if (eq !== -1) {
            const k = item.slice(0, eq).trim();
            const v = item.slice(eq + 1).trim();
            const num = Number(v);
            if (!Number.isNaN(num)) autoIdx = num + 1;
            return `${k}: ${v}`;
          }
          return `${item}: ${autoIdx++}`;
        });
      return `const ${name} = { ${entries.join(', ')} };`;
    }
  );

  // Protect strings & comments before regex replacements
  const literals: string[] = [];
  const placeholder = (s: string) => {
    const id = literals.length;
    literals.push(s);
    return `__TS_LIT_${id}__`;
  };

  code = code.replace(
    /\/\/[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`/g,
    (m) => placeholder(m)
  );

  // Remove generic type parameters on functions/calls/classes: function foo<T extends X>(...) -> function foo(...)
  code = code.replace(/(\b(?:function|class)\s+[A-Za-z_$][\w$]*)\s*<[^<>()\n]+>/g, '$1');
  code = code.replace(/([A-Za-z_$][\w$]*)\s*<[^<>()\n;=]+>\s*(?=\()/g, '$1');
  // Remove `implements Foo, Bar`
  code = code.replace(/\s+implements\s+[A-Za-z_$][\w$.<>,\s]*(?=\{)/g, ' ');
  // Remove access modifiers in class parameters/methods
  code = code.replace(/\b(?:public|private|protected|readonly)\s+(?=[A-Za-z_$][\w$]*)/g, '');
  // Remove `const x: Type =` or `let x: Type =`
  code = code.replace(
    /\b(const|let|var)\s+([A-Za-z_$][\w$]*)\s*:\s*[^=;\n]+(?==)/g,
    '$1 $2 '
  );
  // Remove parameter type annotations `(a: string, b?: number)`
  code = code.replace(
    /([(,]\s*(?:\.\.\.)?[A-Za-z_$][\w$]*)\??\s*:\s*[^=,){}\n]+(?=[=,)])/g,
    '$1'
  );
  // Remove return type annotations `): ReturnType {` or `): ReturnType =>`
  code = code.replace(/\)\s*:\s*[^=>{;\n]+(?=\s*(?:\{|=>))/g, ')');
  // Remove `as Type` and `satisfies Type`
  code = code.replace(/\s+(?:as|satisfies)\s+[A-Za-z_$][\w$.<>\[\]|&\s]*(?=[,;)\]}\n])/g, '');
  // Remove non-null assertions `foo!` (only when followed by `.` `[` `)` `,` `;`)
  code = code.replace(/([A-Za-z_$)\]])!(?=[.\[),;\s])/g, '$1');

  // Restore protected literals
  code = code.replace(/__TS_LIT_(\d+)__/g, (_m, idx) => literals[Number(idx)]);

  return code;
}

function runJavaScript(code: string, isTs: boolean): RunResult {
  const start = performance.now();
  const entries: ConsoleEntry[] = [];

  const sandboxConsole = {
    log: (...args: unknown[]) => entries.push(makeEntry('log', args.map(formatJsValue).join(' '))),
    info: (...args: unknown[]) => entries.push(makeEntry('info', args.map(formatJsValue).join(' '))),
    warn: (...args: unknown[]) => entries.push(makeEntry('warn', args.map(formatJsValue).join(' '))),
    error: (...args: unknown[]) => entries.push(makeEntry('error', args.map(formatJsValue).join(' '))),
    table: (data: unknown) => entries.push(makeEntry('log', formatJsValue(data))),
  };

  try {
    const jsCode = isTs ? stripTypeScriptTypes(code) : code;
    const fn = new Function('console', `"use strict";\n${jsCode}`);
    const ret = fn(sandboxConsole);
    if (ret !== undefined) {
      entries.push(makeEntry('result', `Rückgabewert: ${formatJsValue(ret)}`));
    }
    if (entries.length === 0) {
      entries.push(makeEntry('info', 'Erfolgreich ausgeführt (keine Konsolenausgabe).'));
    }
    return {
      entries,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      success: true,
    };
  } catch (err) {
    const msg = err instanceof Error ? `${err.name}: ${err.message}` : String(err);
    entries.push(makeEntry('error', msg));
    return {
      entries,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      success: false,
    };
  }
}

// ============================================================================
// Browser-Native Python 3 Mini-Interpreter
// ============================================================================

type PyVal = unknown;

class ReturnSignal {
  constructor(public value: PyVal) {}
}
class BreakSignal {}
class ContinueSignal {}

interface PyEnv {
  vars: Record<string, PyVal>;
  parent?: PyEnv;
}

function getVar(env: PyEnv, name: string): PyVal {
  let cur: PyEnv | undefined = env;
  while (cur) {
    if (Object.prototype.hasOwnProperty.call(cur.vars, name)) return cur.vars[name];
    cur = cur.parent;
  }
  throw new Error(`NameError: name '${name}' is not defined`);
}

function setVar(env: PyEnv, name: string, val: PyVal): void {
  env.vars[name] = val;
}

function pyTruthy(val: PyVal): boolean {
  if (val === null || val === undefined || val === false || val === 0 || val === '') return false;
  if (Array.isArray(val)) return val.length > 0;
  if (val instanceof Set || val instanceof Map) return val.size > 0;
  if (typeof val === 'object') return Object.keys(val as object).length > 0;
  return Boolean(val);
}

function pyRepr(val: PyVal, quoteStr = false): string {
  if (val === null || val === undefined) return 'None';
  if (val === true) return 'True';
  if (val === false) return 'False';
  if (typeof val === 'number') return String(val);
  if (typeof val === 'string') return quoteStr ? `'${val}'` : val;
  if (Array.isArray(val)) {
    const isTuple = (val as unknown as {__isTuple?: boolean}).__isTuple;
    const inner = val.map((x) => pyRepr(x, true)).join(', ');
    if (isTuple) return val.length === 1 ? `(${inner},)` : `(${inner})`;
    return `[${inner}]`;
  }
  if (val instanceof Set) {
    if (val.size === 0) return 'set()';
    return `{${Array.from(val).map((x) => pyRepr(x, true)).join(', ')}}`;
  }
  if (typeof val === 'function') return `<function ${val.name || 'lambda'}>`;
  if (typeof val === 'object') {
    const pairs = Object.entries(val as Record<string, unknown>).map(
      ([k, v]) => `${pyRepr(k, true)}: ${pyRepr(v, true)}`
    );
    return `{${pairs.join(', ')}}`;
  }
  return String(val);
}

function pyTuple(items: PyVal[]): PyVal[] {
  const arr = [...items];
  Object.defineProperty(arr, '__isTuple', {value: true, enumerable: false});
  return arr;
}

interface PyToken {
  type: 'num' | 'str' | 'fstr' | 'id' | 'op' | 'punc';
  val: string;
}

function tokenizePyExpr(expr: string): PyToken[] {
  const out: PyToken[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (ch === '#') break;

    // f-string
    if ((ch === 'f' || ch === 'F') && (expr[i + 1] === '"' || expr[i + 1] === "'")) {
      const q = expr[i + 1];
      i += 2;
      let buf = '';
      while (i < expr.length && expr[i] !== q) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          buf += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          buf += expr[i++];
        }
      }
      if (expr[i] === q) i++;
      out.push({type: 'fstr', val: buf});
      continue;
    }

    // normal string
    if (ch === '"' || ch === "'") {
      const q = ch;
      i++;
      let buf = '';
      while (i < expr.length && expr[i] !== q) {
        if (expr[i] === '\\' && i + 1 < expr.length) {
          const next = expr[i + 1];
          buf += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          i += 2;
        } else {
          buf += expr[i++];
        }
      }
      if (expr[i] === q) i++;
      out.push({type: 'str', val: buf});
      continue;
    }

    // number
    const numM = expr.slice(i).match(/^(?:0x[0-9a-fA-F_]+|0b[01_]+|\d[\d_]*(?:\.[\d_]*)?(?:[eE][+-]?\d+)?)/);
    if (numM) {
      out.push({type: 'num', val: numM[0].replace(/_/g, '')});
      i += numM[0].length;
      continue;
    }

    // identifier / keyword operator
    if (/[A-Za-z_]/.test(ch)) {
      let j = i + 1;
      while (j < expr.length && /[A-Za-z0-9_]/.test(expr[j])) j++;
      const word = expr.slice(i, j);
      if (word === 'and' || word === 'or' || word === 'not' || word === 'in' || word === 'is' || word === 'if' || word === 'else' || word === 'for' || word === 'lambda') {
        out.push({type: 'op', val: word});
      } else {
        out.push({type: 'id', val: word});
      }
      i = j;
      continue;
    }

    // multi-char ops
    const opM = expr.slice(i).match(/^(?:\*\*|\/\/|==|!=|<=|>=|:=|[+\-*/%<>])/);
    if (opM) {
      out.push({type: 'op', val: opM[0]});
      i += opM[0].length;
      continue;
    }

    if (/[()[\]{},.:]/.test(ch)) {
      out.push({type: 'punc', val: ch});
      i++;
      continue;
    }

    throw new Error(`SyntaxError: unexpected character '${ch}'`);
  }
  return out;
}

function splitTopLevelCommas(str: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let inStr: string | null = null;
  let start = 0;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (inStr) {
      if (ch === '\\') i++;
      else if (ch === inStr) inStr = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      inStr = ch;
      continue;
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    else if (ch === ',' && depth === 0) {
      parts.push(str.slice(start, i).trim());
      start = i + 1;
    }
  }
  const last = str.slice(start).trim();
  if (last) parts.push(last);
  return parts;
}

function runPython(code: string): RunResult {
  const start = performance.now();
  const entries: ConsoleEntry[] = [];
  let stdoutLineBuffer = '';
  let steps = 0;
  const MAX_STEPS = 50000;

  const flushStdout = () => {
    if (stdoutLineBuffer.length > 0) {
      entries.push(makeEntry('log', stdoutLineBuffer));
      stdoutLineBuffer = '';
    }
  };

  const globalEnv: PyEnv = {
    vars: {
      True: true,
      False: false,
      None: null,
      math: {
        pi: Math.PI,
        e: Math.E,
        tau: Math.PI * 2,
        sqrt: Math.sqrt,
        sin: Math.sin,
        cos: Math.cos,
        tan: Math.tan,
        floor: Math.floor,
        ceil: Math.ceil,
        log: Math.log,
        log10: Math.log10,
        exp: Math.exp,
        fabs: Math.abs,
        pow: Math.pow,
      },
      json: {
        dumps: (obj: unknown, indent?: number) => JSON.stringify(obj, null, indent),
        loads: (s: string) => JSON.parse(s),
      },
      print: (...args: unknown[]) => {
        const text = args.map((a) => pyRepr(a, false)).join(' ');
        entries.push(makeEntry('log', text));
      },
      len: (x: unknown) => {
        if (typeof x === 'string' || Array.isArray(x)) return x.length;
        if (x instanceof Set) return x.size;
        if (x && typeof x === 'object') return Object.keys(x).length;
        throw new Error('TypeError: object has no len()');
      },
      range: (a: number, b?: number, step = 1) => {
        let startN = 0;
        let stopN = a;
        if (b !== undefined) {
          startN = a;
          stopN = b;
        }
        const res: number[] = [];
        if (step === 0) throw new Error('ValueError: range() arg 3 must not be zero');
        if (step > 0) {
          for (let k = startN; k < stopN; k += step) res.push(k);
        } else {
          for (let k = startN; k > stopN; k += step) res.push(k);
        }
        return res;
      },
      enumerate: (iter: PyVal[], startIdx = 0) =>
        Array.from(iter as PyVal[]).map((v, idx) => pyTuple([startIdx + idx, v])),
      zip: (...iters: PyVal[][]) => {
        const minLen = Math.min(...iters.map((it) => it.length));
        const res: PyVal[] = [];
        for (let idx = 0; idx < minLen; idx++) {
          res.push(pyTuple(iters.map((it) => it[idx])));
        }
        return res;
      },
      map: (fn: (...a: PyVal[]) => PyVal, iter: PyVal[]) => Array.from(iter).map((x) => fn(x)),
      filter: (fn: ((x: PyVal) => boolean) | null, iter: PyVal[]) =>
        Array.from(iter).filter((x) => (fn ? pyTruthy(fn(x)) : pyTruthy(x))),
      sorted: (iter: PyVal[], key?: (x: PyVal) => PyVal, reverse = false) => {
        const arr = [...Array.from(iter)];
        arr.sort((a, b) => {
          const ka = key ? key(a) : a;
          const kb = key ? key(b) : b;
          if ((ka as number) < (kb as number)) return -1;
          if ((ka as number) > (kb as number)) return 1;
          return 0;
        });
        if (reverse) arr.reverse();
        return arr;
      },
      reversed: (iter: PyVal[]) => [...Array.from(iter)].reverse(),
      sum: (iter: number[], startVal = 0) => Array.from(iter).reduce((acc, v) => acc + v, startVal),
      min: (...args: PyVal[]) => {
        const arr = args.length === 1 && Array.isArray(args[0]) ? (args[0] as number[]) : (args as number[]);
        return Math.min(...arr);
      },
      max: (...args: PyVal[]) => {
        const arr = args.length === 1 && Array.isArray(args[0]) ? (args[0] as number[]) : (args as number[]);
        return Math.max(...arr);
      },
      abs: Math.abs,
      round: (n: number, ndigits = 0) => {
        const factor = 10 ** ndigits;
        return Math.round(n * factor) / factor;
      },
      pow: Math.pow,
      int: (x: unknown) => {
        if (typeof x === 'boolean') return x ? 1 : 0;
        const n = parseInt(String(x), 10);
        if (Number.isNaN(n)) throw new Error(`ValueError: invalid literal for int(): '${x}'`);
        return n;
      },
      float: (x: unknown) => Number(x),
      str: (x: unknown) => pyRepr(x, false),
      bool: (x: unknown) => pyTruthy(x),
      list: (x?: Iterable<unknown>) => (x ? Array.from(x) : []),
      tuple: (x?: Iterable<unknown>) => pyTuple(x ? Array.from(x) : []),
      dict: (x?: Record<string, unknown>) => (x ? {...x} : {}),
      set: (x?: Iterable<unknown>) => new Set(x ?? []),
      type: (x: unknown) => `<class '${x === null ? 'NoneType' : Array.isArray(x) ? 'list' : typeof x}'>`,
      any: (iter: Iterable<unknown>) => Array.from(iter).some(pyTruthy),
      all: (iter: Iterable<unknown>) => Array.from(iter).every(pyTruthy),
      chr: (n: number) => String.fromCharCode(n),
      ord: (s: string) => s.charCodeAt(0),
      hex: (n: number) => '0x' + n.toString(16),
      bin: (n: number) => '0b' + n.toString(2),
      isinstance: (obj: unknown, cls: unknown) => {
        if (cls === globalEnv.vars.int || cls === globalEnv.vars.float) return typeof obj === 'number';
        if (cls === globalEnv.vars.str) return typeof obj === 'string';
        if (cls === globalEnv.vars.bool) return typeof obj === 'boolean';
        if (cls === globalEnv.vars.list) return Array.isArray(obj);
        return false;
      },
    },
  };

  // Recursive descent expression evaluator
  function evalExprString(rawExpr: string, env: PyEnv): PyVal {
    const tokens = tokenizePyExpr(rawExpr.trim());
    if (tokens.length === 0) return null;
    let pos = 0;

    const peek = () => tokens[pos];
    const consume = () => tokens[pos++];

    function evalFString(template: string): string {
      let result = '';
      let k = 0;
      while (k < template.length) {
        if (template[k] === '{') {
          if (template[k + 1] === '{') {
            result += '{';
            k += 2;
            continue;
          }
          k++;
          let depth = 1;
          const exprStart = k;
          while (k < template.length && depth > 0) {
            if (template[k] === '{') depth++;
            else if (template[k] === '}') depth--;
            if (depth > 0) k++;
          }
          const inner = template.slice(exprStart, k);
          k++; // skip '}'
          // Check format spec `expr:spec`
          let fmtSpec = '';
          let exprPart = inner;
          const colonIdx = inner.lastIndexOf(':');
          if (colonIdx !== -1 && !inner.slice(colonIdx).includes(']')) {
            exprPart = inner.slice(0, colonIdx);
            fmtSpec = inner.slice(colonIdx + 1);
          }
          const val = evalExprString(exprPart, env);
          if (fmtSpec) {
            const floatM = fmtSpec.match(/^\.(\d+)f$/);
            const widthM = fmtSpec.match(/^([<>^]?)(\d+)$/);
            if (floatM && typeof val === 'number') {
              result += val.toFixed(Number(floatM[1]));
            } else if (widthM) {
              const s = pyRepr(val, false);
              const w = Number(widthM[2]);
              result += widthM[1] === '>' ? s.padStart(w) : s.padEnd(w);
            } else {
              result += pyRepr(val, false);
            }
          } else {
            result += pyRepr(val, false);
          }
        } else if (template[k] === '}' && template[k + 1] === '}') {
          result += '}';
          k += 2;
        } else {
          result += template[k++];
        }
      }
      return result;
    }

    function parseTernary(): PyVal {
      const val = parseOr();
      if (peek()?.type === 'op' && peek()?.val === 'if') {
        consume(); // 'if'
        const cond = parseOr();
        if (peek()?.type !== 'op' || peek()?.val !== 'else') {
          throw new Error('SyntaxError: expected else in conditional expression');
        }
        consume(); // 'else'
        const fallback = parseTernary();
        return pyTruthy(cond) ? val : fallback;
      }
      return val;
    }

    function parseOr(): PyVal {
      let left = parseAnd();
      while (peek()?.type === 'op' && peek()?.val === 'or') {
        consume();
        const right = parseAnd();
        left = pyTruthy(left) ? left : right;
      }
      return left;
    }

    function parseAnd(): PyVal {
      let left = parseNot();
      while (peek()?.type === 'op' && peek()?.val === 'and') {
        consume();
        const right = parseNot();
        left = pyTruthy(left) ? right : left;
      }
      return left;
    }

    function parseNot(): PyVal {
      if (peek()?.type === 'op' && peek()?.val === 'not') {
        consume();
        return !pyTruthy(parseNot());
      }
      return parseComparison();
    }

    function parseComparison(): PyVal {
      let left = parseAddSub();
      const compOps = new Set(['==', '!=', '<', '<=', '>', '>=', 'in', 'is']);
      while (
        peek()?.type === 'op' &&
        (compOps.has(peek()!.val) || (peek()!.val === 'not' && tokens[pos + 1]?.val === 'in'))
      ) {
        let op = consume().val;
        if (op === 'not' && peek()?.val === 'in') {
          consume();
          op = 'not in';
        } else if (op === 'is' && peek()?.val === 'not') {
          consume();
          op = 'is not';
        }
        const right = parseAddSub();
        switch (op) {
          case '==':
            left = JSON.stringify(left) === JSON.stringify(right);
            break;
          case '!=':
            left = JSON.stringify(left) !== JSON.stringify(right);
            break;
          case '<':
            left = (left as number) < (right as number);
            break;
          case '<=':
            left = (left as number) <= (right as number);
            break;
          case '>':
            left = (left as number) > (right as number);
            break;
          case '>=':
            left = (left as number) >= (right as number);
            break;
          case 'is':
            left = left === right;
            break;
          case 'is not':
            left = left !== right;
            break;
          case 'in':
            left = Array.isArray(right)
              ? right.includes(left)
              : typeof right === 'string'
                ? right.includes(String(left))
                : right instanceof Set
                  ? right.has(left)
                  : right && typeof right === 'object'
                    ? String(left) in (right as object)
                    : false;
            break;
          case 'not in':
            left = !(Array.isArray(right)
              ? right.includes(left)
              : typeof right === 'string'
                ? right.includes(String(left))
                : false);
            break;
        }
      }
      return left;
    }

    function parseAddSub(): PyVal {
      let left = parseMulDiv();
      while (peek()?.type === 'op' && (peek()?.val === '+' || peek()?.val === '-')) {
        const op = consume().val;
        const right = parseMulDiv();
        if (op === '+') {
          if (Array.isArray(left) && Array.isArray(right)) left = [...left, ...right];
          else left = (left as number) + (right as number);
        } else {
          left = (left as number) - (right as number);
        }
      }
      return left;
    }

    function parseMulDiv(): PyVal {
      let left = parseUnary();
      while (peek()?.type === 'op' && ['*', '/', '//', '%'].includes(peek()!.val)) {
        const op = consume().val;
        const right = parseUnary();
        if (op === '*') {
          if (typeof left === 'string' && typeof right === 'number') left = left.repeat(right);
          else if (Array.isArray(left) && typeof right === 'number') {
            const out: PyVal[] = [];
            for (let k = 0; k < right; k++) out.push(...left);
            left = out;
          } else {
            left = (left as number) * (right as number);
          }
        } else if (op === '/') {
          left = (left as number) / (right as number);
        } else if (op === '//') {
          left = Math.floor((left as number) / (right as number));
        } else {
          left = ((left as number) % (right as number) + (right as number)) % (right as number);
        }
      }
      return left;
    }

    function parseUnary(): PyVal {
      if (peek()?.type === 'op' && (peek()?.val === '-' || peek()?.val === '+')) {
        const op = consume().val;
        const v = parseUnary() as number;
        return op === '-' ? -v : +v;
      }
      return parsePower();
    }

    function parsePower(): PyVal {
      const base = parsePostfix();
      if (peek()?.type === 'op' && peek()?.val === '**') {
        consume();
        const exp = parseUnary();
        return Math.pow(base as number, exp as number);
      }
      return base;
    }

    function callMethodOrFunc(target: PyVal, method: string | null, args: PyVal[]): PyVal {
      if (method === null) {
        if (typeof target === 'function') return target(...args);
        throw new Error(`TypeError: '${typeof target}' object is not callable`);
      }
      if (typeof target === 'string') {
        switch (method) {
          case 'upper': return target.toUpperCase();
          case 'lower': return target.toLowerCase();
          case 'strip': return target.trim();
          case 'split': return args[0] !== undefined ? target.split(String(args[0])) : target.trim().split(/\s+/);
          case 'join': return Array.from(args[0] as PyVal[]).map((x) => pyRepr(x, false)).join(target);
          case 'replace': return target.split(String(args[0])).join(String(args[1]));
          case 'startswith': return target.startsWith(String(args[0]));
          case 'endswith': return target.endsWith(String(args[0]));
          case 'find': return target.indexOf(String(args[0]));
          case 'count': return target.split(String(args[0])).length - 1;
        }
      }
      if (Array.isArray(target)) {
        switch (method) {
          case 'append': target.push(args[0]); return null;
          case 'extend': target.push(...(args[0] as PyVal[])); return null;
          case 'pop': return args.length ? target.splice(Number(args[0]), 1)[0] : target.pop();
          case 'reverse': target.reverse(); return null;
          case 'sort': target.sort((a, b) => ((a as number) < (b as number) ? -1 : (a as number) > (b as number) ? 1 : 0)); return null;
          case 'copy': return [...target];
          case 'index': return target.indexOf(args[0]);
          case 'count': return target.filter((x) => x === args[0]).length;
        }
      }
      if (target && typeof target === 'object') {
        const obj = target as Record<string, PyVal>;
        if (typeof obj[method] === 'function') {
          return (obj[method] as (...a: PyVal[]) => PyVal)(...args);
        }
        switch (method) {
          case 'get': return Object.prototype.hasOwnProperty.call(obj, String(args[0])) ? obj[String(args[0])] : (args[1] ?? null);
          case 'keys': return Object.keys(obj);
          case 'values': return Object.values(obj);
          case 'items': return Object.entries(obj).map(([k, v]) => pyTuple([k, v]));
          case 'update': Object.assign(obj, args[0]); return null;
        }
      }
      throw new Error(`AttributeError: object has no attribute '${method}'`);
    }

    function parsePostfix(): PyVal {
      let val = parsePrimary();
      while (peek()) {
        if (peek()?.type === 'punc' && peek()?.val === '.') {
          consume();
          const propTok = consume();
          if (peek()?.type === 'punc' && peek()?.val === '(') {
            consume(); // '('
            const args: PyVal[] = [];
            while (peek() && !(peek()?.type === 'punc' && peek()?.val === ')')) {
              args.push(parseTernary());
              if (peek()?.type === 'punc' && peek()?.val === ',') consume();
            }
            if (peek()?.val === ')') consume();
            val = callMethodOrFunc(val, propTok.val, args);
          } else {
            val = (val as Record<string, PyVal>)[propTok.val];
          }
          continue;
        }

        if (peek()?.type === 'punc' && peek()?.val === '(') {
          consume(); // '('
          const args: PyVal[] = [];
          const kwargs: Record<string, PyVal> = {};
          while (peek() && !(peek()?.type === 'punc' && peek()?.val === ')')) {
            // keyword argument check: id '='
            if (peek()?.type === 'id' && tokens[pos + 1]?.type === 'op' && tokens[pos + 1]?.val === '=') {
              const k = consume().val;
              consume(); // '='
              kwargs[k] = parseTernary();
            } else {
              args.push(parseTernary());
            }
            if (peek()?.type === 'punc' && peek()?.val === ',') consume();
          }
          if (peek()?.val === ')') consume();
          if (Object.keys(kwargs).length > 0 && typeof val === 'function') {
            // pass kwargs for sorted/print/round if needed
            val = (val as (...a: PyVal[]) => PyVal)(...args);
          } else {
            val = callMethodOrFunc(val, null, args);
          }
          continue;
        }

        if (peek()?.type === 'punc' && peek()?.val === '[') {
          consume(); // '['
          // Check slice `a:b:c`
          let startIdx: PyVal = null;
          let stopIdx: PyVal = null;
          let stepIdx: PyVal = null;
          let isSlice = false;

          if (peek()?.type === 'punc' && peek()?.val === ':') {
            isSlice = true;
          } else {
            startIdx = parseTernary();
          }

          if (peek()?.type === 'punc' && peek()?.val === ':') {
            isSlice = true;
            consume();
            if (peek() && !(peek()?.type === 'punc' && (peek()?.val === ':' || peek()?.val === ']'))) {
              stopIdx = parseTernary();
            }
            if (peek()?.type === 'punc' && peek()?.val === ':') {
              consume();
              if (peek() && !(peek()?.type === 'punc' && peek()?.val === ']')) {
                stepIdx = parseTernary();
              }
            }
          }
          if (peek()?.val === ']') consume();

          if (isSlice && (Array.isArray(val) || typeof val === 'string')) {
            const len = val.length;
            const step = stepIdx === null ? 1 : Number(stepIdx);
            const s = startIdx === null ? (step > 0 ? 0 : len - 1) : Number(startIdx) < 0 ? len + Number(startIdx) : Number(startIdx);
            const e = stopIdx === null ? (step > 0 ? len : -len - 1) : Number(stopIdx) < 0 ? len + Number(stopIdx) : Number(stopIdx);
            const sliced: PyVal[] = [];
            if (step > 0) {
              for (let k = Math.max(0, s); k < Math.min(len, e); k += step) sliced.push(val[k]);
            } else if (step < 0) {
              const endBound = stopIdx === null ? -1 : Math.max(-1, e);
              for (let k = Math.min(len - 1, s); k > endBound; k += step) sliced.push(val[k]);
            }
            val = typeof val === 'string' ? sliced.join('') : sliced;
          } else if (Array.isArray(val) || typeof val === 'string') {
            const idx = Number(startIdx);
            val = val[idx < 0 ? val.length + idx : idx];
          } else if (val && typeof val === 'object') {
            val = (val as Record<string, PyVal>)[String(startIdx)];
          }
          continue;
        }

        break;
      }
      return val;
    }

    function parsePrimary(): PyVal {
      const tok = peek();
      if (!tok) throw new Error('SyntaxError: unexpected end of expression');

      if (tok.type === 'num') {
        consume();
        return tok.val.startsWith('0x')
          ? parseInt(tok.val, 16)
          : tok.val.startsWith('0b')
            ? parseInt(tok.val.slice(2), 2)
            : Number(tok.val);
      }
      if (tok.type === 'str') {
        consume();
        return tok.val;
      }
      if (tok.type === 'fstr') {
        consume();
        return evalFString(tok.val);
      }
      if (tok.type === 'op' && tok.val === 'lambda') {
        consume();
        const params: string[] = [];
        while (peek() && !(peek()?.type === 'punc' && peek()?.val === ':')) {
          if (peek()?.type === 'id') params.push(consume().val);
          else consume();
        }
        if (peek()?.val === ':') consume();
        // Rebuild remaining tokens as expression string
        const restStart = pos;
        pos = tokens.length;
        const bodyExpr = tokens.slice(restStart).map((t) => (t.type === 'str' ? JSON.stringify(t.val) : t.val)).join(' ');
        return (...args: PyVal[]) => {
          const childEnv: PyEnv = {vars: {}, parent: env};
          params.forEach((p, idx) => {
            childEnv.vars[p] = args[idx];
          });
          return evalExprString(bodyExpr, childEnv);
        };
      }
      if (tok.type === 'id') {
        consume();
        return getVar(env, tok.val);
      }

      // Parentheses or Tuple
      if (tok.type === 'punc' && tok.val === '(') {
        consume();
        if (peek()?.type === 'punc' && peek()?.val === ')') {
          consume();
          return pyTuple([]);
        }
        const first = parseTernary();
        if (peek()?.type === 'punc' && peek()?.val === ',') {
          const items = [first];
          while (peek()?.type === 'punc' && peek()?.val === ',') {
            consume();
            if (peek()?.type === 'punc' && peek()?.val === ')') break;
            items.push(parseTernary());
          }
          if (peek()?.val === ')') consume();
          return pyTuple(items);
        }
        if (peek()?.val === ')') consume();
        return first;
      }

      // List or List Comprehension
      if (tok.type === 'punc' && tok.val === '[') {
        consume();
        if (peek()?.type === 'punc' && peek()?.val === ']') {
          consume();
          return [];
        }
        // Check if comprehension: capture tokens inside [...]
        const savedPos = pos;
        let depth = 1;
        let hasFor = false;
        let scan = pos;
        while (scan < tokens.length && depth > 0) {
          if (tokens[scan].val === '[' || tokens[scan].val === '(' || tokens[scan].val === '{') depth++;
          else if (tokens[scan].val === ']' || tokens[scan].val === ')' || tokens[scan].val === '}') depth--;
          if (depth === 1 && tokens[scan].type === 'op' && tokens[scan].val === 'for') {
            hasFor = true;
            break;
          }
          scan++;
        }

        if (hasFor) {
          // Evaluate comprehension `[expr for var in iter (if cond)]`
          const exprTokens = tokens.slice(savedPos, scan);
          pos = scan + 1; // skip 'for'
          const loopVar = consume().val;
          if (peek()?.val !== 'in') throw new Error("SyntaxError: expected 'in' in comprehension");
          consume();
          // Find optional 'if' or closing ']'
          let iterEnd = pos;
          let d = 1;
          let ifIdx = -1;
          while (iterEnd < tokens.length && d > 0) {
            if (tokens[iterEnd].val === '[' || tokens[iterEnd].val === '(') d++;
            else if (tokens[iterEnd].val === ']' || tokens[iterEnd].val === ')') d--;
            if (d === 1 && tokens[iterEnd].type === 'op' && tokens[iterEnd].val === 'if') {
              ifIdx = iterEnd;
              break;
            }
            if (d > 0) iterEnd++;
          }
          const iterExprTokens = tokens.slice(pos, iterEnd);
          const iterRaw = iterExprTokens.map((t) => (t.type === 'str' ? JSON.stringify(t.val) : t.type === 'fstr' ? `f${JSON.stringify(t.val)}` : t.val)).join(' ');
          const iterable = evalExprString(iterRaw, env) as Iterable<PyVal>;

          let condRaw: string | null = null;
          if (ifIdx !== -1) {
            let condEnd = ifIdx + 1;
            let dc = 1;
            while (condEnd < tokens.length && dc > 0) {
              if (tokens[condEnd].val === '[' || tokens[condEnd].val === '(') dc++;
              else if (tokens[condEnd].val === ']' || tokens[condEnd].val === ')') dc--;
              if (dc > 0) condEnd++;
            }
            condRaw = tokens.slice(ifIdx + 1, condEnd).map((t) => (t.type === 'str' ? JSON.stringify(t.val) : t.val)).join(' ');
            pos = condEnd + 1;
          } else {
            pos = iterEnd + 1;
          }

          const outRaw = exprTokens.map((t) => (t.type === 'str' ? JSON.stringify(t.val) : t.type === 'fstr' ? `f${JSON.stringify(t.val)}` : t.val)).join(' ');
          const result: PyVal[] = [];
          for (const item of Array.from(iterable)) {
            const compEnv: PyEnv = {vars: {[loopVar]: item}, parent: env};
            if (condRaw && !pyTruthy(evalExprString(condRaw, compEnv))) continue;
            result.push(evalExprString(outRaw, compEnv));
          }
          return result;
        }

        const items: PyVal[] = [];
        while (peek() && !(peek()?.type === 'punc' && peek()?.val === ']')) {
          items.push(parseTernary());
          if (peek()?.type === 'punc' && peek()?.val === ',') consume();
        }
        if (peek()?.val === ']') consume();
        return items;
      }

      // Dict or Set
      if (tok.type === 'punc' && tok.val === '{') {
        consume();
        if (peek()?.type === 'punc' && peek()?.val === '}') {
          consume();
          return {};
        }
        const firstKeyOrVal = parseTernary();
        if (peek()?.type === 'punc' && peek()?.val === ':') {
          consume();
          const dict: Record<string, PyVal> = {};
          dict[String(firstKeyOrVal)] = parseTernary();
          while (peek()?.type === 'punc' && peek()?.val === ',') {
            consume();
            if (peek()?.type === 'punc' && peek()?.val === '}') break;
            const k = parseTernary();
            if (peek()?.val === ':') consume();
            dict[String(k)] = parseTernary();
          }
          if (peek()?.val === '}') consume();
          return dict;
        } else {
          const set = new Set<PyVal>([firstKeyOrVal]);
          while (peek()?.type === 'punc' && peek()?.val === ',') {
            consume();
            if (peek()?.type === 'punc' && peek()?.val === '}') break;
            set.add(parseTernary());
          }
          if (peek()?.val === '}') consume();
          return set;
        }
      }

      throw new Error(`SyntaxError: unexpected token '${tok.val}'`);
    }

    return parseTernary();
  }

  // Preprocess physical lines into logical lines (joining brackets & stripping comments)
  interface PyLine {
    indent: number;
    text: string;
    lineNum: number;
  }

  const rawLines = code.replace(/\r\n/g, '\n').split('\n');
  const logicalLines: PyLine[] = [];
  let acc = '';
  let accIndent = 0;
  let accLineNum = 1;
  let bracketDepth = 0;
  let inTripleQuote: string | null = null;

  for (let idx = 0; idx < rawLines.length; idx++) {
    const raw = rawLines[idx];

    if (inTripleQuote) {
      const endIdx = raw.indexOf(inTripleQuote);
      if (endIdx !== -1) {
        acc += '\n' + raw;
        inTripleQuote = null;
      } else {
        acc += '\n' + raw;
      }
      if (!inTripleQuote && bracketDepth === 0) {
        logicalLines.push({indent: accIndent, text: acc.trim(), lineNum: accLineNum});
        acc = '';
      }
      continue;
    }

    // Strip comment outside strings
    let stripped = '';
    let inStr: string | null = null;
    for (let c = 0; c < raw.length; c++) {
      const ch = raw[c];
      if (!inStr && (raw.slice(c, c + 3) === '"""' || raw.slice(c, c + 3) === "'''")) {
        const tq = raw.slice(c, c + 3);
        const closePos = raw.indexOf(tq, c + 3);
        if (closePos === -1) {
          inTripleQuote = tq;
          stripped += raw.slice(c);
          break;
        } else {
          stripped += raw.slice(c, closePos + 3);
          c = closePos + 2;
          continue;
        }
      }
      if (inStr) {
        stripped += ch;
        if (ch === '\\' && c + 1 < raw.length) {
          stripped += raw[++c];
          continue;
        }
        if (ch === inStr) inStr = null;
        continue;
      }
      if (ch === '"' || ch === "'") {
        inStr = ch;
        stripped += ch;
        continue;
      }
      if (ch === '#') break;
      if (ch === '(' || ch === '[' || ch === '{') bracketDepth++;
      else if (ch === ')' || ch === ']' || ch === '}') bracketDepth = Math.max(0, bracketDepth - 1);
      stripped += ch;
    }

    if (acc === '') {
      if (stripped.trim() === '' && !inTripleQuote) {
        bracketDepth = 0;
        continue;
      }
      accIndent = raw.match(/^\s*/)?.[0].length ?? 0;
      accLineNum = idx + 1;
      acc = stripped;
    } else {
      acc += ' ' + stripped.trim();
    }

    if (!inTripleQuote && bracketDepth === 0) {
      const trimmed = acc.trim();
      if (trimmed && !trimmed.startsWith('"""') && !trimmed.startsWith("'''")) {
        logicalLines.push({indent: accIndent, text: trimmed, lineNum: accLineNum});
      }
      acc = '';
    }
  }

  function execBlock(lines: PyLine[], startIdx: number, baseIndent: number, env: PyEnv): {nextIdx: number; signal?: unknown} {
    let i = startIdx;
    while (i < lines.length) {
      if (++steps > MAX_STEPS) {
        throw new Error('RuntimeError: Maximale Schrittzahl überschritten (Endlosschleife?)');
      }
      const line = lines[i];
      if (line.indent < baseIndent) break;
      const stmt = line.text;

      if (stmt === 'pass') {
        i++;
        continue;
      }
      if (stmt === 'break') return {nextIdx: i + 1, signal: new BreakSignal()};
      if (stmt === 'continue') return {nextIdx: i + 1, signal: new ContinueSignal()};

      if (stmt.startsWith('return ') || stmt === 'return') {
        const expr = stmt.slice(6).trim();
        const val = expr ? evalExprString(expr, env) : null;
        return {nextIdx: i + 1, signal: new ReturnSignal(val)};
      }

      // Decorators (skip or apply trivially)
      if (stmt.startsWith('@')) {
        i++;
        continue;
      }

      // Imports
      if (stmt.startsWith('import ') || stmt.startsWith('from ')) {
        i++;
        continue;
      }

      // Function definition
      const defM = stmt.match(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\((.*)\)(?:\s*->\s*[^:]+)?\s*:$/);
      if (defM) {
        const fnName = defM[1];
        const rawParams = splitTopLevelCommas(defM[2]);
        const params = rawParams.map((p) => {
          const eqIdx = p.indexOf('=');
          const namePart = (eqIdx !== -1 ? p.slice(0, eqIdx) : p).split(':')[0].trim();
          const defaultExpr = eqIdx !== -1 ? p.slice(eqIdx + 1).trim() : null;
          return {name: namePart, defaultExpr};
        });
        const bodyStart = i + 1;
        let bodyEnd = bodyStart;
        const bodyIndent = lines[bodyStart]?.indent ?? baseIndent + 4;
        while (bodyEnd < lines.length && lines[bodyEnd].indent >= bodyIndent) {
          bodyEnd++;
        }
        const bodyLines = lines.slice(bodyStart, bodyEnd);
        const fn = (...args: PyVal[]) => {
          const fnEnv: PyEnv = {vars: {}, parent: env};
          params.forEach((p, idx) => {
            if (idx < args.length) fnEnv.vars[p.name] = args[idx];
            else if (p.defaultExpr !== null) fnEnv.vars[p.name] = evalExprString(p.defaultExpr, env);
            else fnEnv.vars[p.name] = null;
          });
          const res = execBlock(bodyLines, 0, bodyIndent, fnEnv);
          if (res.signal instanceof ReturnSignal) return res.signal.value;
          return null;
        };
        Object.defineProperty(fn, 'name', {value: fnName});
        setVar(env, fnName, fn);
        i = bodyEnd;
        continue;
      }

      // if / elif / else
      if (stmt.startsWith('if ') && stmt.endsWith(':')) {
        const branches: Array<{condExpr: string | null; body: PyLine[]; indent: number}> = [];
        let cursor = i;
        while (cursor < lines.length && lines[cursor].indent === line.indent) {
          const bText = lines[cursor].text;
          let condExpr: string | null = null;
          if (cursor === i && bText.startsWith('if ') && bText.endsWith(':')) {
            condExpr = bText.slice(3, -1).trim();
          } else if (bText.startsWith('elif ') && bText.endsWith(':')) {
            condExpr = bText.slice(5, -1).trim();
          } else if (bText === 'else:') {
            condExpr = null;
          } else {
            break;
          }
          const bStart = cursor + 1;
          const bIndent = lines[bStart]?.indent ?? line.indent + 4;
          let bEnd = bStart;
          while (bEnd < lines.length && lines[bEnd].indent >= bIndent) bEnd++;
          branches.push({condExpr, body: lines.slice(bStart, bEnd), indent: bIndent});
          cursor = bEnd;
          if (condExpr === null) break;
        }
        for (const br of branches) {
          if (br.condExpr === null || pyTruthy(evalExprString(br.condExpr, env))) {
            const res = execBlock(br.body, 0, br.indent, env);
            if (res.signal) return {nextIdx: cursor, signal: res.signal};
            break;
          }
        }
        i = cursor;
        continue;
      }

      // for loop
      const forM = stmt.match(/^for\s+(.+?)\s+in\s+(.+):$/);
      if (forM) {
        const targetNames = forM[1].split(',').map((s) => s.trim());
        const iterable = evalExprString(forM[2], env) as Iterable<PyVal>;
        const bStart = i + 1;
        const bIndent = lines[bStart]?.indent ?? line.indent + 4;
        let bEnd = bStart;
        while (bEnd < lines.length && lines[bEnd].indent >= bIndent) bEnd++;
        const body = lines.slice(bStart, bEnd);
        for (const item of Array.from(iterable)) {
          if (targetNames.length > 1 && Array.isArray(item)) {
            targetNames.forEach((n, idx) => setVar(env, n, item[idx]));
          } else {
            setVar(env, targetNames[0], item);
          }
          const res = execBlock(body, 0, bIndent, env);
          if (res.signal instanceof BreakSignal) break;
          if (res.signal instanceof ReturnSignal) return {nextIdx: bEnd, signal: res.signal};
        }
        i = bEnd;
        continue;
      }

      // while loop
      const whileM = stmt.match(/^while\s+(.+):$/);
      if (whileM) {
        const bStart = i + 1;
        const bIndent = lines[bStart]?.indent ?? line.indent + 4;
        let bEnd = bStart;
        while (bEnd < lines.length && lines[bEnd].indent >= bIndent) bEnd++;
        const body = lines.slice(bStart, bEnd);
        while (pyTruthy(evalExprString(whileM[1], env))) {
          if (++steps > MAX_STEPS) throw new Error('RuntimeError: Maximale Schrittzahl überschritten');
          const res = execBlock(body, 0, bIndent, env);
          if (res.signal instanceof BreakSignal) break;
          if (res.signal instanceof ReturnSignal) return {nextIdx: bEnd, signal: res.signal};
        }
        i = bEnd;
        continue;
      }

      // Compound assignment
      const augM = stmt.match(/^([A-Za-z_]\w*)\s*(\+=|-=|\*=|\/=|\/\/=|%=|\*\*=)\s*(.+)$/);
      if (augM) {
        const [, name, op, rhs] = augM;
        const cur = getVar(env, name) as number;
        const rval = evalExprString(rhs, env) as number;
        const nextVal =
          op === '+=' ? (Array.isArray(cur) && Array.isArray(rval) ? [...cur, ...rval] : cur + rval)
          : op === '-=' ? cur - rval
          : op === '*=' ? cur * rval
          : op === '/=' ? cur / rval
          : op === '//=' ? Math.floor(cur / rval)
          : op === '%=' ? cur % rval
          : Math.pow(cur, rval);
        setVar(env, name, nextVal);
        i++;
        continue;
      }

      // Assignment (ignoring `==`, `!=`, `<=`, `>=`)
      let eqIdx = -1;
      let inS: string | null = null;
      let d = 0;
      for (let c = 0; c < stmt.length; c++) {
        const ch = stmt[c];
        if (inS) {
          if (ch === '\\') c++;
          else if (ch === inS) inS = null;
          continue;
        }
        if (ch === '"' || ch === "'") {
          inS = ch;
          continue;
        }
        if (ch === '(' || ch === '[' || ch === '{') d++;
        else if (ch === ')' || ch === ']' || ch === '}') d--;
        else if (ch === '=' && d === 0 && stmt[c - 1] !== '!' && stmt[c - 1] !== '<' && stmt[c - 1] !== '>' && stmt[c + 1] !== '=') {
          eqIdx = c;
          break;
        }
      }

      if (eqIdx !== -1) {
        const lhs = stmt.slice(0, eqIdx).split(':')[0].trim();
        const rhs = stmt.slice(eqIdx + 1).trim();
        const val = evalExprString(rhs, env);
        // Subscript assignment: arr[idx] = val
        const subM = lhs.match(/^([A-Za-z_]\w*)\[(.+)\]$/);
        if (subM) {
          const target = getVar(env, subM[1]) as Record<string, PyVal>;
          const key = evalExprString(subM[2], env);
          target[String(key)] = val;
        } else if (lhs.includes(',')) {
          const names = lhs.split(',').map((s) => s.trim());
          const arr = Array.from(val as Iterable<PyVal>);
          names.forEach((n, idx) => setVar(env, n, arr[idx]));
        } else {
          setVar(env, lhs, val);
        }
        i++;
        continue;
      }

      // Expression statement
      evalExprString(stmt, env);
      i++;
    }
    return {nextIdx: i};
  }

  try {
    execBlock(logicalLines, 0, logicalLines[0]?.indent ?? 0, globalEnv);
    flushStdout();
    if (entries.length === 0) {
      entries.push(makeEntry('info', 'Python 3 Skript erfolgreich ausgeführt (keine print-Ausgabe).'));
    }
    return {
      entries,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      success: true,
    };
  } catch (err) {
    flushStdout();
    const msg = err instanceof Error ? err.message : String(err);
    entries.push(makeEntry('error', msg));
    return {
      entries,
      durationMs: Math.round((performance.now() - start) * 100) / 100,
      success: false,
    };
  }
}

export function executeCode(code: string, language: LanguageId): RunResult {
  if (language === 'javascript') {
    return runJavaScript(code, false);
  }
  if (language === 'typescript') {
    return runJavaScript(code, true);
  }
  if (language === 'python') {
    return runPython(code);
  }
  if (language === 'json') {
    const start = performance.now();
    try {
      const parsed = JSON.parse(code);
      const keys = typeof parsed === 'object' && parsed !== null ? Object.keys(parsed).length : 0;
      return {
        entries: [
          makeEntry(
            'result',
            `Gültiges JSON (${Array.isArray(parsed) ? `${parsed.length} Elemente` : `${keys} Top-Level-Schlüssel`}).`
          ),
        ],
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        success: true,
      };
    } catch (err) {
      return {
        entries: [makeEntry('error', err instanceof Error ? err.message : 'Ungültiges JSON')],
        durationMs: Math.round((performance.now() - start) * 100) / 100,
        success: false,
      };
    }
  }

  return {
    entries: [
      makeEntry(
        'info',
        `Direkte Ausführung für ${language.toUpperCase()} nicht aktiv — Syntax-Highlighting & Diagnose sind vollständig aktiv.`
      ),
    ],
    durationMs: 0,
    success: true,
  };
}
