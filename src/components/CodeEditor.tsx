import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  CursorPosition,
  DiagnosticItem,
  EditorSettings,
  LanguageId,
  Token,
} from '../types/editor';
import {findMatchingBracket} from '../utils/diagnostics';
import {LANGUAGES} from '../utils/languages';
import {getTokenStyle, NeonThemeDefinition} from '../utils/themes';
import {tokenizeByLines} from '../utils/tokenizer';

interface CodeEditorProps {
  code: string;
  language: LanguageId;
  settings: EditorSettings;
  theme: NeonThemeDefinition;
  diagnostics: DiagnosticItem[];
  searchQuery: string;
  caseSensitive: boolean;
  jumpToLineRequest: {line: number; column?: number; seq: number} | null;
  jumpToOffsetRequest: {offset: number; length: number; seq: number} | null;
  onChange: (newCode: string) => void;
  onCursorChange: (pos: CursorPosition) => void;
  onRunShortcut: () => void;
  onSaveShortcut: () => void;
  onFindShortcut: () => void;
  onFormatShortcut: () => void;
}

const PAIR_MAP: Record<string, string> = {
  '(': ')',
  '[': ']',
  '{': '}',
  '"': '"',
  "'": "'",
  '`': '`',
};
const CLOSE_CHARS = new Set([')', ']', '}', '"', "'", '`']);

export function CodeEditor({
  code,
  language,
  settings,
  theme,
  diagnostics,
  searchQuery,
  caseSensitive,
  jumpToLineRequest,
  jumpToOffsetRequest,
  onChange,
  onCursorChange,
  onRunShortcut,
  onSaveShortcut,
  onFindShortcut,
  onFormatShortcut,
}: CodeEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const minimapRef = useRef<HTMLDivElement>(null);

  const [cursorOffset, setCursorOffset] = useState(0);
  const [activeLine, setActiveLine] = useState(1);
  const [scrollTop, setScrollTop] = useState(0);

  const lineHeightPx = Math.round(settings.fontSize * 1.6);
  const paddingY = 16;
  const paddingX = 20;

  const lines = useMemo(() => code.split('\n'), [code]);
  const tokenizedLines = useMemo(() => tokenizeByLines(code, language), [code, language]);

  const diagnosticsByLine = useMemo(() => {
    const map = new Map<number, DiagnosticItem[]>();
    for (const d of diagnostics) {
      const list = map.get(d.line) ?? [];
      list.push(d);
      map.set(d.line, list);
    }
    return map;
  }, [diagnostics]);

  const matchedBrackets = useMemo(
    () => findMatchingBracket(code, cursorOffset),
    [code, cursorOffset]
  );

  // Compute line start offsets for bracket & search highlighting
  const lineStartOffsets = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const line of lines) {
      offsets.push(acc);
      acc += line.length + 1;
    }
    return offsets;
  }, [lines]);

  const updateCursorState = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const offset = ta.selectionStart ?? 0;
    const end = ta.selectionEnd ?? offset;
    const upTo = ta.value.slice(0, offset);
    const split = upTo.split('\n');
    const line = split.length;
    const column = split[split.length - 1].length + 1;

    setCursorOffset(offset);
    setActiveLine(line);
    onCursorChange({
      line,
      column,
      offset,
      selectionLength: Math.abs(end - offset),
    });
  }, [onCursorChange]);

  const syncScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    setScrollTop(ta.scrollTop);
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  // Handle jump-to-line requests (from Diagnostics or Minimap)
  useEffect(() => {
    if (!jumpToLineRequest || !textareaRef.current) return;
    const targetLine = Math.max(1, Math.min(lines.length, jumpToLineRequest.line));
    const offset = (lineStartOffsets[targetLine - 1] ?? 0) + Math.max(0, (jumpToLineRequest.column ?? 1) - 1);
    const ta = textareaRef.current;
    ta.focus();
    ta.setSelectionRange(offset, offset);
    const targetScroll = Math.max(0, (targetLine - 4) * lineHeightPx);
    ta.scrollTop = targetScroll;
    syncScroll();
    updateCursorState();
  }, [jumpToLineRequest, lines.length, lineStartOffsets, lineHeightPx, syncScroll, updateCursorState]);

  // Handle jump-to-offset requests (from Find & Replace)
  useEffect(() => {
    if (!jumpToOffsetRequest || !textareaRef.current) return;
    const ta = textareaRef.current;
    const {offset, length} = jumpToOffsetRequest;
    const upTo = code.slice(0, offset);
    const targetLine = upTo.split('\n').length;
    ta.focus();
    ta.setSelectionRange(offset, offset + length);
    const targetScroll = Math.max(0, (targetLine - 5) * lineHeightPx);
    ta.scrollTop = targetScroll;
    syncScroll();
    updateCursorState();
  }, [jumpToOffsetRequest, code, lineHeightPx, syncScroll, updateCursorState]);

  const applyEditWithSelection = (nextCode: string, selStart: number, selEnd: number) => {
    onChange(nextCode);
    requestAnimationFrame(() => {
      const ta = textareaRef.current;
      if (!ta) return;
      ta.setSelectionRange(selStart, selEnd);
      updateCursorState();
      syncScroll();
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const ta = e.currentTarget;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const val = ta.value;
    const isMod = e.ctrlKey || e.metaKey;

    if (isMod && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onSaveShortcut();
      return;
    }
    if (isMod && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onFindShortcut();
      return;
    }
    if (isMod && e.key === 'Enter') {
      e.preventDefault();
      onRunShortcut();
      return;
    }
    if (e.altKey && e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      onFormatShortcut();
      return;
    }

    // Toggle Line Comment (Ctrl/Cmd + /)
    if (isMod && e.key === '/') {
      e.preventDefault();
      const commentToken = LANGUAGES[language].lineComment;
      if (commentToken === '/*' || commentToken === '<!--') return;

      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = val.indexOf('\n', end);
      const blockEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
      const selectedBlock = val.slice(lineStart, blockEnd);
      const blockLines = selectedBlock.split('\n');
      const allCommented = blockLines.every(
        (l) => l.trim() === '' || l.trimStart().startsWith(commentToken)
      );

      const transformed = blockLines.map((l) => {
        if (l.trim() === '') return l;
        if (allCommented) {
          return l.replace(new RegExp(`^(\\s*)${commentToken.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s?`), '$1');
        }
        return l.replace(/^(\s*)/, `$1${commentToken} `);
      });

      const joined = transformed.join('\n');
      const next = val.slice(0, lineStart) + joined + val.slice(blockEnd);
      applyEditWithSelection(next, lineStart, lineStart + joined.length);
      return;
    }

    // Tab / Shift+Tab indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const indent = ' '.repeat(settings.tabSize);

      if (start !== end && val.slice(start, end).includes('\n')) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const lineEndIdx = val.indexOf('\n', end);
        const blockEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
        const blockLines = val.slice(lineStart, blockEnd).split('\n');
        const nextLines = blockLines.map((l) => {
          if (e.shiftKey) {
            if (l.startsWith(indent)) return l.slice(indent.length);
            return l.replace(/^[ \t]{1,4}/, '');
          }
          return indent + l;
        });
        const joined = nextLines.join('\n');
        applyEditWithSelection(
          val.slice(0, lineStart) + joined + val.slice(blockEnd),
          lineStart,
          lineStart + joined.length
        );
        return;
      }

      if (e.shiftKey) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1;
        const linePrefix = val.slice(lineStart, start);
        const removeCount = linePrefix.endsWith(indent)
          ? indent.length
          : linePrefix.match(/ +$/)?.[0].length ?? 0;
        if (removeCount > 0) {
          const next = val.slice(0, start - removeCount) + val.slice(start);
          applyEditWithSelection(next, start - removeCount, start - removeCount);
        }
        return;
      }

      const next = val.slice(0, start) + indent + val.slice(end);
      applyEditWithSelection(next, start + indent.length, start + indent.length);
      return;
    }

    // Enter smart auto-indentation
    if (e.key === 'Enter') {
      e.preventDefault();
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const currentLineUpToCursor = val.slice(lineStart, start);
      const baseIndent = currentLineUpToCursor.match(/^\s*/)?.[0] ?? '';
      const trimmedBefore = currentLineUpToCursor.trimEnd();
      const charAfter = val[end] ?? '';

      const opensBlock =
        trimmedBefore.endsWith('{') ||
        trimmedBefore.endsWith('[') ||
        trimmedBefore.endsWith('(') ||
        (language === 'python' && trimmedBefore.endsWith(':'));

      const indentUnit = ' '.repeat(settings.tabSize);
      const extraIndent = opensBlock ? indentUnit : '';

      if (
        (trimmedBefore.endsWith('{') && charAfter === '}') ||
        (trimmedBefore.endsWith('[') && charAfter === ']') ||
        (trimmedBefore.endsWith('(') && charAfter === ')')
      ) {
        const insert = `\n${baseIndent}${indentUnit}\n${baseIndent}`;
        const next = val.slice(0, start) + insert + val.slice(end);
        const caret = start + 1 + baseIndent.length + indentUnit.length;
        applyEditWithSelection(next, caret, caret);
        return;
      }

      const insert = `\n${baseIndent}${extraIndent}`;
      const next = val.slice(0, start) + insert + val.slice(end);
      const caret = start + insert.length;
      applyEditWithSelection(next, caret, caret);
      return;
    }

    // Backspace deletes empty auto-closed pair
    if (e.key === 'Backspace' && start === end && start > 0) {
      const prevChar = val[start - 1];
      const nextChar = val[start];
      if (PAIR_MAP[prevChar] && PAIR_MAP[prevChar] === nextChar) {
        e.preventDefault();
        const next = val.slice(0, start - 1) + val.slice(start + 1);
        applyEditWithSelection(next, start - 1, start - 1);
        return;
      }
    }

    // Skip over closing bracket/quote if already present
    if (start === end && CLOSE_CHARS.has(e.key) && val[start] === e.key) {
      e.preventDefault();
      applyEditWithSelection(val, start + 1, start + 1);
      return;
    }

    // Auto-pair brackets and quotes
    if (PAIR_MAP[e.key] && !isMod && !e.altKey) {
      const closeChar = PAIR_MAP[e.key];
      // Don't auto-close quote inside identifier word
      if ((e.key === "'" || e.key === '"') && start === end && /[A-Za-z0-9_]/.test(val[start - 1] ?? '')) {
        return;
      }
      e.preventDefault();
      const selected = val.slice(start, end);
      const next = val.slice(0, start) + e.key + selected + closeChar + val.slice(end);
      if (start !== end) {
        applyEditWithSelection(next, start + 1, end + 1);
      } else {
        applyEditWithSelection(next, start + 1, start + 1);
      }
    }
  };

  // Render a single line's tokens with search & bracket highlights
  const renderLineTokens = (tokens: Token[], lineIdx: number, rawLine: string) => {
    const lineStart = lineStartOffsets[lineIdx] ?? 0;
    const matchSet = new Set<number>();

    if (matchedBrackets) {
      for (const bOffset of matchedBrackets) {
        if (bOffset >= lineStart && bOffset < lineStart + rawLine.length) {
          matchSet.add(bOffset - lineStart);
        }
      }
    }

    // Compute search highlight ranges within this line
    const searchRanges: Array<[number, number]> = [];
    if (searchQuery.length > 0) {
      const hay = caseSensitive ? rawLine : rawLine.toLowerCase();
      const needle = caseSensitive ? searchQuery : searchQuery.toLowerCase();
      let idx = 0;
      while ((idx = hay.indexOf(needle, idx)) !== -1) {
        searchRanges.push([idx, idx + needle.length]);
        idx += Math.max(1, needle.length);
      }
    }

    if (tokens.length === 0) {
      return <span>{'\u200B'}</span>;
    }

    const isHighlightedChar = (charOffsetInLine: number) =>
      searchRanges.some(([s, e]) => charOffsetInLine >= s && charOffsetInLine < e);

    let charCursor = 0;
    return tokens.map((tok, tIdx) => {
      const style = getTokenStyle(tok.type, theme, settings.glow);
      const tokStart = charCursor;
      const tokEnd = charCursor + tok.value.length;
      charCursor = tokEnd;

      const hasSpecial =
        Array.from(matchSet).some((m) => m >= tokStart && m < tokEnd) ||
        searchRanges.some(([s, e]) => s < tokEnd && e > tokStart);

      if (!hasSpecial) {
        return (
          <span key={tIdx} style={style}>
            {tok.value}
          </span>
        );
      }

      // Split character-by-character only for tokens containing bracket/search highlights
      return (
        <span key={tIdx} style={style}>
          {Array.from(tok.value).map((ch, cIdx) => {
            const absInLine = tokStart + cIdx;
            const isBracket = matchSet.has(absInLine);
            const isSearch = isHighlightedChar(absInLine);
            if (!isBracket && !isSearch) return ch;
            return (
              <span
                key={cIdx}
                className="rounded-[2px]"
                style={{
                  backgroundColor: isSearch
                    ? `rgba(${theme.secondaryRgb}, 0.35)`
                    : `rgba(${theme.accentRgb}, 0.22)`,
                  boxShadow: isBracket ? `inset 0 0 0 1px ${theme.accent}` : undefined,
                }}
              >
                {ch}
              </span>
            );
          })}
        </span>
      );
    });
  };

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!minimapRef.current || !textareaRef.current) return;
    const rect = minimapRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const ta = textareaRef.current;
    const maxScroll = Math.max(0, ta.scrollHeight - ta.clientHeight);
    ta.scrollTop = ratio * maxScroll;
    syncScroll();
  };

  const gutterWidth = Math.max(48, String(lines.length).length * 10 + 26);

  return (
    <div className="relative flex-1 flex min-h-0 overflow-hidden bg-[#06080D]">
      {/* Line Number Gutter */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className="shrink-0 overflow-hidden select-none bg-[#070A10] border-r border-slate-800/70 font-code tabular-nums text-right"
        style={{
          width: `${gutterWidth}px`,
          paddingTop: `${paddingY}px`,
          paddingBottom: `${paddingY}px`,
          fontSize: `${Math.max(11, settings.fontSize - 1)}px`,
          lineHeight: `${lineHeightPx}px`,
        }}
      >
        {lines.map((_, idx) => {
          const lineNum = idx + 1;
          const isCurrent = lineNum === activeLine;
          const diags = diagnosticsByLine.get(lineNum);
          const hasError = diags?.some((d) => d.severity === 'error');
          const hasWarn = diags?.some((d) => d.severity === 'warning');

          return (
            <div
              key={lineNum}
              onClick={() => {
                const offset = lineStartOffsets[idx] ?? 0;
                if (textareaRef.current) {
                  textareaRef.current.focus();
                  textareaRef.current.setSelectionRange(offset, offset);
                  updateCursorState();
                }
              }}
              title={diags?.map((d) => d.message).join('\n')}
              className="relative pr-3 pl-2 cursor-pointer transition-colors flex items-center justify-end gap-1.5"
              style={{
                height: `${lineHeightPx}px`,
                color: hasError
                  ? '#FB7185'
                  : isCurrent
                    ? theme.accent
                    : '#475569',
                backgroundColor: isCurrent ? `rgba(${theme.accentRgb}, 0.06)` : undefined,
              }}
            >
              {(hasError || hasWarn) && (
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    hasError ? 'bg-rose-500' : 'bg-amber-400'
                  }`}
                />
              )}
              <span>{lineNum}</span>
            </div>
          );
        })}
      </div>

      {/* Synchronized Highlighted Layer + Transparent Input Layer */}
      <div className="relative flex-1 min-w-0 min-h-0 overflow-hidden">
        {/* Highlighted <pre> overlay */}
        <div
          ref={preRef}
          aria-hidden="true"
          className="absolute inset-0 overflow-hidden pointer-events-none font-code"
          style={{
            padding: `${paddingY}px ${paddingX}px`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: `${lineHeightPx}px`,
            tabSize: settings.tabSize,
            letterSpacing: '0px',
            wordSpacing: '0px',
            scrollbarGutter: 'stable',
          }}
        >
          <div
            style={{
              whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
              wordBreak: settings.wordWrap ? 'break-word' : 'normal',
              overflowWrap: settings.wordWrap ? 'break-word' : 'normal',
              minWidth: settings.wordWrap ? undefined : 'max-content',
            }}
          >
            {tokenizedLines.map((tokens, idx) => {
              const lineNum = idx + 1;
              const isCurrent = lineNum === activeLine;
              const hasError = diagnosticsByLine.get(lineNum)?.some((d) => d.severity === 'error');

              return (
                <div
                  key={idx}
                  className="relative"
                  style={{
                    minHeight: `${lineHeightPx}px`,
                    backgroundColor: hasError
                      ? 'rgba(244, 63, 94, 0.09)'
                      : isCurrent
                        ? `rgba(${theme.accentRgb}, 0.055)`
                        : undefined,
                    boxShadow: isCurrent
                      ? `inset 2px 0 0 rgba(${theme.accentRgb}, 0.7)`
                      : undefined,
                  }}
                >
                  {renderLineTokens(tokens, idx, lines[idx] ?? '')}
                </div>
              );
            })}
          </div>
        </div>

        {/* Real Editable Textarea */}
        <textarea
          ref={textareaRef}
          value={code}
          onChange={(e) => {
            onChange(e.target.value);
            requestAnimationFrame(updateCursorState);
          }}
          onKeyDown={handleKeyDown}
          onScroll={syncScroll}
          onClick={updateCursorState}
          onKeyUp={updateCursorState}
          onSelect={updateCursorState}
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          aria-label="Code-Editor Eingabefeld"
          className="editor-textarea absolute inset-0 w-full h-full font-code overflow-auto"
          style={{
            padding: `${paddingY}px ${paddingX}px`,
            fontSize: `${settings.fontSize}px`,
            lineHeight: `${lineHeightPx}px`,
            tabSize: settings.tabSize,
            letterSpacing: '0px',
            wordSpacing: '0px',
            whiteSpace: settings.wordWrap ? 'pre-wrap' : 'pre',
            wordBreak: settings.wordWrap ? 'break-word' : 'normal',
            overflowWrap: settings.wordWrap ? 'break-word' : 'normal',
            scrollbarGutter: 'stable',
          }}
        />
      </div>

      {/* Interactive Neon Minimap */}
      {settings.minimap && (
        <div
          ref={minimapRef}
          onClick={handleMinimapClick}
          title="Klicken zum Scrollen"
          className="hidden lg:block w-20 shrink-0 bg-[#070A10] border-l border-slate-800/70 py-3 px-2 overflow-hidden cursor-pointer select-none relative"
        >
          {/* Viewport indicator */}
          <div
            className="absolute left-0 right-0 pointer-events-none border-y"
            style={{
              top: `${Math.min(85, (scrollTop / Math.max(1, lines.length * lineHeightPx)) * 100)}%`,
              height: '42px',
              backgroundColor: `rgba(${theme.accentRgb}, 0.08)`,
              borderColor: `rgba(${theme.accentRgb}, 0.25)`,
            }}
          />
          <div className="space-y-[2px]">
            {tokenizedLines.slice(0, 140).map((tokens, idx) => {
              const firstColored = tokens.find(
                (t) => t.type !== 'plain' && t.value.trim().length > 0
              );
              const color = firstColored
                ? theme.tokens[firstColored.type]
                : '#334155';
              const len = Math.min(100, Math.max(8, (lines[idx]?.trim().length ?? 0) * 1.4));
              const indent = Math.min(28, (lines[idx]?.match(/^\s*/)?.[0].length ?? 0) * 2);

              return (
                <div
                  key={idx}
                  className="h-[2px] rounded-full opacity-65"
                  style={{
                    width: `${len}%`,
                    marginLeft: `${indent}%`,
                    backgroundColor: lines[idx]?.trim() ? color : 'transparent',
                  }}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
