/**
 * Minimal in-browser syntax highlighter.
 *
 * Returns an array of {text, type} tokens for rendering as styled spans.
 * Supports python / typescript+javascript / json / bash / curl.
 *
 * This is intentionally small and dependency-free. It is not perfect — it
 * handles the patterns we use in code samples, and degrades to plain text
 * for anything it doesn't recognize.
 */

export type TokenType =
  | 'plain'
  | 'comment'
  | 'string'
  | 'number'
  | 'keyword'
  | 'builtin'
  | 'function'
  | 'punctuation'
  | 'operator'
  | 'property'
  | 'decorator'
  | 'tag'
  | 'flag';

export interface Token {
  text: string;
  type: TokenType;
}

export type Language = 'python' | 'js' | 'ts' | 'json' | 'bash' | 'http';

const PY_KEYWORDS = new Set([
  'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except',
  'finally', 'raise', 'with', 'as', 'import', 'from', 'pass', 'break', 'continue',
  'in', 'is', 'not', 'and', 'or', 'lambda', 'yield', 'global', 'nonlocal',
  'True', 'False', 'None', 'async', 'await', 'self',
]);

const PY_BUILTINS = new Set([
  'print', 'len', 'range', 'dict', 'list', 'set', 'tuple', 'str', 'int', 'float',
  'bool', 'open', 'isinstance', 'enumerate', 'zip', 'map', 'filter', 'any', 'all',
  'sum', 'min', 'max', 'abs',
]);

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'do',
  'switch', 'case', 'break', 'continue', 'try', 'catch', 'finally', 'throw',
  'new', 'class', 'extends', 'super', 'this', 'import', 'export', 'from', 'default',
  'async', 'await', 'typeof', 'instanceof', 'in', 'of', 'true', 'false', 'null',
  'undefined', 'void', 'interface', 'type', 'enum', 'as', 'public', 'private',
  'protected', 'readonly', 'static', 'implements',
]);

const JS_BUILTINS = new Set([
  'console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Promise', 'Date', 'Map', 'Set', 'window', 'document', 'process', 'require',
  'module', 'exports', 'fetch', 'res', 'req', 'app',
]);

const BASH_KEYWORDS = new Set([
  'if', 'then', 'else', 'fi', 'for', 'in', 'do', 'done', 'while', 'until',
  'function', 'return', 'export', 'echo', 'cd', 'ls', 'mkdir', 'rm', 'cp', 'mv',
  'curl', 'wget', 'cat', 'grep', 'sed', 'awk',
]);

export const tokenize = (code: string, lang: Language): Token[] => {
  if (lang === 'json') return tokenizeJson(code);
  if (lang === 'bash' || lang === 'http') return tokenizeBash(code);
  if (lang === 'python') return tokenizePy(code);
  return tokenizeJs(code);
};

const tokenizePy = (code: string): Token[] => {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    // Comment
    if (ch === '#') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      out.push({ text: code.slice(i, end), type: 'comment' });
      i = end;
      continue;
    }

    // Triple-quoted string
    if (code.slice(i, i + 3) === '"""' || code.slice(i, i + 3) === "'''") {
      const quote = code.slice(i, i + 3);
      let end = code.indexOf(quote, i + 3);
      if (end === -1) end = code.length;
      else end += 3;
      out.push({ text: code.slice(i, end), type: 'string' });
      i = end;
      continue;
    }

    // String
    if (ch === '"' || ch === "'") {
      const end = consumeString(code, i, ch);
      out.push({ text: code.slice(i, end), type: 'string' });
      i = end;
      continue;
    }

    // Decorator
    if (ch === '@' && /[a-zA-Z_]/.test(code[i + 1] || '')) {
      let j = i + 1;
      while (j < code.length && /[\w.]/.test(code[j])) j++;
      out.push({ text: code.slice(i, j), type: 'decorator' });
      i = j;
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let j = i;
      while (j < code.length && /[\d._a-fA-FxXoObB]/.test(code[j])) j++;
      out.push({ text: code.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Identifier
    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < code.length && /[\w]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (PY_KEYWORDS.has(word)) out.push({ text: word, type: 'keyword' });
      else if (PY_BUILTINS.has(word)) out.push({ text: word, type: 'builtin' });
      else if (code[j] === '(') out.push({ text: word, type: 'function' });
      else out.push({ text: word, type: 'plain' });
      i = j;
      continue;
    }

    out.push({ text: ch, type: 'plain' });
    i++;
  }
  return mergeAdjacent(out);
};

const tokenizeJs = (code: string): Token[] => {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    // Line comment
    if (ch === '/' && code[i + 1] === '/') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      out.push({ text: code.slice(i, end), type: 'comment' });
      i = end;
      continue;
    }
    // Block comment
    if (ch === '/' && code[i + 1] === '*') {
      let end = code.indexOf('*/', i + 2);
      if (end === -1) end = code.length;
      else end += 2;
      out.push({ text: code.slice(i, end), type: 'comment' });
      i = end;
      continue;
    }

    // Template literal
    if (ch === '`') {
      const end = consumeString(code, i, '`');
      out.push({ text: code.slice(i, end), type: 'string' });
      i = end;
      continue;
    }
    // String
    if (ch === '"' || ch === "'") {
      const end = consumeString(code, i, ch);
      out.push({ text: code.slice(i, end), type: 'string' });
      i = end;
      continue;
    }

    // Number
    if (/\d/.test(ch)) {
      let j = i;
      while (j < code.length && /[\d._a-fA-FxXoObB]/.test(code[j])) j++;
      out.push({ text: code.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    // Identifier
    if (/[a-zA-Z_$]/.test(ch)) {
      let j = i;
      while (j < code.length && /[\w$]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (JS_KEYWORDS.has(word)) out.push({ text: word, type: 'keyword' });
      else if (JS_BUILTINS.has(word)) out.push({ text: word, type: 'builtin' });
      else if (code[j] === '(') out.push({ text: word, type: 'function' });
      else out.push({ text: word, type: 'plain' });
      i = j;
      continue;
    }

    out.push({ text: ch, type: 'plain' });
    i++;
  }
  return mergeAdjacent(out);
};

const tokenizeJson = (code: string): Token[] => {
  const out: Token[] = [];
  let i = 0;
  while (i < code.length) {
    const ch = code[i];

    if (ch === '/' && code[i + 1] === '/') {
      let end = code.indexOf('\n', i);
      if (end === -1) end = code.length;
      out.push({ text: code.slice(i, end), type: 'comment' });
      i = end;
      continue;
    }

    if (ch === '"') {
      const end = consumeString(code, i, '"');
      // Detect property keys: trailing whitespace then colon → property
      let k = end;
      while (k < code.length && /\s/.test(code[k])) k++;
      const isKey = code[k] === ':';
      out.push({ text: code.slice(i, end), type: isKey ? 'property' : 'string' });
      i = end;
      continue;
    }

    if (/\d/.test(ch) || (ch === '-' && /\d/.test(code[i + 1] || ''))) {
      let j = i + (ch === '-' ? 1 : 0);
      while (j < code.length && /[\d.eE+-]/.test(code[j])) j++;
      out.push({ text: code.slice(i, j), type: 'number' });
      i = j;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let j = i;
      while (j < code.length && /[\w]/.test(code[j])) j++;
      const word = code.slice(i, j);
      if (word === 'true' || word === 'false' || word === 'null') {
        out.push({ text: word, type: 'keyword' });
      } else {
        out.push({ text: word, type: 'plain' });
      }
      i = j;
      continue;
    }

    out.push({ text: ch, type: 'plain' });
    i++;
  }
  return mergeAdjacent(out);
};

const tokenizeBash = (code: string): Token[] => {
  const out: Token[] = [];
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    if (line.trim().startsWith('#')) {
      out.push({ text: line, type: 'comment' });
    } else {
      let i = 0;
      while (i < line.length) {
        const ch = line[i];
        // String
        if (ch === '"' || ch === "'") {
          const end = consumeString(line, i, ch);
          out.push({ text: line.slice(i, end), type: 'string' });
          i = end;
          continue;
        }
        // Flag (e.g., --header, -X)
        if (ch === '-' && (/[A-Za-z-]/.test(line[i + 1] || ''))) {
          let j = i;
          while (j < line.length && /[\w-]/.test(line[j])) j++;
          out.push({ text: line.slice(i, j), type: 'flag' });
          i = j;
          continue;
        }
        // Word
        if (/[a-zA-Z_]/.test(ch)) {
          let j = i;
          while (j < line.length && /[\w./:-]/.test(line[j])) j++;
          const word = line.slice(i, j);
          if (BASH_KEYWORDS.has(word)) out.push({ text: word, type: 'keyword' });
          else if (/^https?:\/\//.test(word)) out.push({ text: word, type: 'string' });
          else out.push({ text: word, type: 'plain' });
          i = j;
          continue;
        }
        // Number
        if (/\d/.test(ch)) {
          let j = i;
          while (j < line.length && /[\d.]/.test(line[j])) j++;
          out.push({ text: line.slice(i, j), type: 'number' });
          i = j;
          continue;
        }
        out.push({ text: ch, type: 'plain' });
        i++;
      }
    }
    if (idx < lines.length - 1) out.push({ text: '\n', type: 'plain' });
  });
  return mergeAdjacent(out);
};

const consumeString = (s: string, start: number, quote: string): number => {
  let i = start + 1;
  while (i < s.length) {
    if (s[i] === '\\') {
      i += 2;
      continue;
    }
    if (s[i] === quote) return i + 1;
    if (s[i] === '\n' && quote !== '`') return i;
    i++;
  }
  return s.length;
};

const mergeAdjacent = (tokens: Token[]): Token[] => {
  const out: Token[] = [];
  for (const t of tokens) {
    const prev = out[out.length - 1];
    if (prev && prev.type === t.type) {
      prev.text += t.text;
    } else {
      out.push({ ...t });
    }
  }
  return out;
};

export const TOKEN_COLORS: Record<TokenType, string> = {
  plain: '#e6e8f0',
  comment: '#6b7387',
  string: '#a7e3a3',
  number: '#f7b777',
  keyword: '#cba6f7',
  builtin: '#89dceb',
  function: '#94d2ff',
  punctuation: '#cdd6f4',
  operator: '#cdd6f4',
  property: '#94d2ff',
  decorator: '#f5c2e7',
  tag: '#f5c2e7',
  flag: '#fab387',
};
