import {useMemo} from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Play,
  Terminal,
  Trash2,
  XCircle,
} from 'lucide-react';
import {
  ConsoleEntry,
  DiagnosticItem,
  EditorFile,
  TokenType,
} from '../types/editor';
import {LANGUAGES} from '../utils/languages';
import {NeonThemeDefinition} from '../utils/themes';
import {tokenizeFlat} from '../utils/tokenizer';

export type OutputTabId = 'console' | 'preview' | 'diagnostics' | 'tokens';

interface OutputPanelProps {
  dock: 'bottom' | 'right';
  activeTab: OutputTabId;
  onSelectTab: (tab: OutputTabId) => void;
  activeFile: EditorFile;
  allFiles: EditorFile[];
  consoleEntries: ConsoleEntry[];
  lastRunDurationMs: number | null;
  lastRunSuccess: boolean | null;
  diagnostics: DiagnosticItem[];
  theme: NeonThemeDefinition;
  onRun: () => void;
  onClearConsole: () => void;
  onJumpToLine: (line: number, column: number) => void;
}

const TOKEN_LABELS: Record<TokenType, string> = {
  keyword: 'Schlüsselwörter',
  control: 'Kontrollfluss',
  function: 'Funktionen',
  type: 'Typen & Klassen',
  string: 'Strings',
  number: 'Zahlen',
  comment: 'Kommentare',
  operator: 'Operatoren',
  punctuation: 'Interpunktion',
  variable: 'Variablen',
  property: 'Eigenschaften',
  decorator: 'Dekoratoren',
  tag: 'HTML/CSS-Tags',
  attribute: 'Attribute',
  builtin: 'Built-ins',
  boolean: 'Booleans & Null',
  regex: 'RegExp',
  plain: 'Sonstiges',
};

export function OutputPanel({
  dock,
  activeTab,
  onSelectTab,
  activeFile,
  allFiles,
  consoleEntries,
  lastRunDurationMs,
  lastRunSuccess,
  diagnostics,
  theme,
  onRun,
  onClearConsole,
  onJumpToLine,
}: OutputPanelProps) {
  const langConfig = LANGUAGES[activeFile.language];

  // Combine HTML file with any CSS/JS files in workspace for rich live preview
  const previewSrcDoc = useMemo(() => {
    if (activeFile.language === 'markdown') {
      const escaped = activeFile.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      return `<!doctype html><html><body style="background:#06080d;color:#e2e8f0;font-family:system-ui,sans-serif;padding:24px;line-height:1.6;"><pre style="white-space:pre-wrap;font-family:inherit;">${escaped}</pre></body></html>`;
    }

    const cssFiles = allFiles.filter((f) => f.language === 'css');
    const combinedCss = cssFiles.map((f) => f.content).join('\n');

    let html = activeFile.language === 'html' ? activeFile.content : '';
    if (activeFile.language === 'css') {
      const htmlPartner = allFiles.find((f) => f.language === 'html');
      html = htmlPartner
        ? htmlPartner.content
        : `<!doctype html><html><body><div class="hud-frame"><h1>CSS Vorschau</h1><p>Erstelle eine HTML-Datei für vollständiges Markup.</p></div></body></html>`;
    }

    if (!combinedCss) return html;
    if (html.includes('</head>')) {
      return html.replace('</head>', `<style>${combinedCss}</style></head>`);
    }
    return `<style>${combinedCss}</style>\n${html}`;
  }, [activeFile, allFiles]);

  // Token breakdown stats for active file
  const tokenStats = useMemo(() => {
    const tokens = tokenizeFlat(activeFile.content, activeFile.language);
    const counts = new Map<TokenType, number>();
    let totalSignificant = 0;
    for (const tok of tokens) {
      if (tok.type === 'plain' && tok.value.trim() === '') continue;
      counts.set(tok.type, (counts.get(tok.type) ?? 0) + 1);
      totalSignificant++;
    }
    return {
      total: totalSignificant,
      items: Array.from(counts.entries()).sort((a, b) => b[1] - a[1]),
    };
  }, [activeFile.content, activeFile.language]);

  const containerClass =
    dock === 'bottom'
      ? 'h-60 sm:h-64 shrink-0 border-t border-slate-800/80'
      : 'w-full md:w-[420px] lg:w-[460px] shrink-0 border-t md:border-t-0 md:border-l border-slate-800/80';

  return (
    <section className={`flex flex-col bg-[#080B12] ${containerClass}`}>
      {/* Panel Tab Strip */}
      <div className="h-10 shrink-0 px-3 flex items-center justify-between border-b border-slate-800/80 select-none gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => onSelectTab('console')}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'console'
                ? 'bg-slate-800/80 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" style={activeTab === 'console' ? {color: theme.accent} : undefined} />
            <span>Konsole</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('preview')}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'preview'
                ? 'bg-slate-800/80 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" style={activeTab === 'preview' ? {color: theme.accent} : undefined} />
            <span>Live-Vorschau</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('diagnostics')}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'diagnostics'
                ? 'bg-slate-800/80 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle
              className="w-3.5 h-3.5"
              style={
                diagnostics.length > 0
                  ? {color: '#FB7185'}
                  : activeTab === 'diagnostics'
                    ? {color: theme.accent}
                    : undefined
              }
            />
            <span>Probleme</span>
            <span className="font-code tabular-nums text-[11px] text-slate-400">
              ({diagnostics.length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('tokens')}
            className={`h-7 px-2.5 flex items-center gap-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'tokens'
                ? 'bg-slate-800/80 text-slate-100'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>Syntax-Tokens</span>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {activeTab === 'console' && lastRunDurationMs !== null && (
            <span className="hidden sm:inline font-code tabular-nums text-[11px] text-slate-400">
              {lastRunSuccess ? 'OK' : 'Fehler'} · {lastRunDurationMs} ms
            </span>
          )}
          {activeTab === 'console' && (
            <>
              <button
                type="button"
                onClick={onRun}
                title="Erneut ausführen"
                className="h-7 px-2 flex items-center gap-1 rounded text-xs text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
              >
                <Play className="w-3 h-3" style={{color: theme.accent}} />
                <span className="hidden sm:inline">Start</span>
              </button>
              <button
                type="button"
                onClick={onClearConsole}
                title="Konsole leeren"
                className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-auto bg-[#06080D]">
        {activeTab === 'console' && (
          <div className="p-3 font-code text-xs space-y-1.5">
            {consoleEntries.length === 0 ? (
              <div className="py-6 text-center text-slate-500 font-sans text-xs">
                Klicke auf <span className="text-slate-300 font-medium">Ausführen</span> (oder Strg+Enter), um{' '}
                <span className="text-slate-300">{langConfig.label}</span>-Code auszuführen.
              </div>
            ) : (
              consoleEntries.map((entry) => {
                const colorClass =
                  entry.level === 'error'
                    ? 'text-rose-400'
                    : entry.level === 'warn'
                      ? 'text-amber-300'
                      : entry.level === 'info'
                        ? 'text-cyan-300'
                        : entry.level === 'result'
                          ? 'text-emerald-400'
                          : 'text-slate-200';

                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-3 py-1 border-b border-slate-900/90 last:border-b-0"
                  >
                    <span className="text-[11px] text-slate-600 tabular-nums shrink-0 select-none">
                      {entry.timestamp}
                    </span>
                    <pre className={`whitespace-pre-wrap break-words flex-1 ${colorClass}`}>
                      {entry.text}
                    </pre>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeTab === 'preview' && (
          <div className="w-full h-full flex flex-col">
            {activeFile.language === 'html' || activeFile.language === 'css' || activeFile.language === 'markdown' ? (
              <iframe
                title="Live HTML/CSS Vorschau"
                sandbox="allow-scripts"
                srcDoc={previewSrcDoc}
                className="w-full h-full border-0 bg-[#06080D]"
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center text-xs text-slate-400 gap-2">
                <p>
                  Live-Vorschau ist für <strong className="text-slate-200">HTML5</strong>,{' '}
                  <strong className="text-slate-200">CSS3</strong> und{' '}
                  <strong className="text-slate-200">Markdown</strong> verfügbar.
                </p>
                <p className="text-slate-500">
                  Wähle im Explorer <span className="font-code text-slate-300">neon_card.html</span> oder nutze die Konsole für Python / JS / TS.
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="p-3 text-xs">
            {diagnostics.length === 0 ? (
              <div className="py-6 flex items-center justify-center gap-2 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Keine Syntax- oder Klammerfehler in {activeFile.name} gefunden.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {diagnostics.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onJumpToLine(item.line, item.column)}
                    className="w-full text-left py-2 px-2.5 flex items-center gap-3 hover:bg-slate-800/40 rounded transition-colors"
                  >
                    {item.severity === 'error' ? (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className="flex-1 text-slate-200">{item.message}</span>
                    <span className="font-code tabular-nums text-slate-500 shrink-0">
                      Z.{item.line}:{item.column}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tokens' && (
          <div className="p-3.5 space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-400">
              <span>Token-Verteilung in {activeFile.name}</span>
              <span className="font-code tabular-nums text-slate-300">
                {tokenStats.total} Tokens gesamt
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {tokenStats.items.map(([type, count]) => {
                const color = theme.tokens[type];
                const pct = tokenStats.total > 0 ? Math.round((count / tokenStats.total) * 100) : 0;
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium" style={{color}}>
                        {TOKEN_LABELS[type]}
                      </span>
                      <span className="font-code tabular-nums text-slate-400">
                        {count} · {pct}%
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-800/80 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{width: `${Math.max(4, pct)}%`, backgroundColor: color}}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
