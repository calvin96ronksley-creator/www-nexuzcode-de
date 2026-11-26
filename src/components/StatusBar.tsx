import {CursorPosition, DiagnosticItem, EditorFile, EditorSettings} from '../types/editor';
import {LANGUAGES} from '../utils/languages';
import {NeonThemeDefinition} from '../utils/themes';

interface StatusBarProps {
  activeFile: EditorFile;
  cursor: CursorPosition;
  settings: EditorSettings;
  diagnostics: DiagnosticItem[];
  theme: NeonThemeDefinition;
  onClickDiagnostics: () => void;
  onToggleTabSize: () => void;
}

export function StatusBar({
  activeFile,
  cursor,
  settings,
  diagnostics,
  theme,
  onClickDiagnostics,
  onToggleTabSize,
}: StatusBarProps) {
  const lineCount = activeFile.content.split('\n').length;
  const charCount = activeFile.content.length;
  const lang = LANGUAGES[activeFile.language];

  return (
    <footer className="h-7 shrink-0 px-3.5 flex items-center justify-between bg-[#070A10] border-t border-slate-800/80 text-[11px] text-slate-400 select-none gap-4">
      <div className="flex items-center gap-2.5 min-w-0 truncate">
        <button
          type="button"
          onClick={onClickDiagnostics}
          className="hover:text-slate-200 transition-colors whitespace-nowrap shrink-0"
          style={diagnostics.length > 0 ? {color: '#FB7185'} : undefined}
        >
          {diagnostics.length === 0
            ? 'Keine Probleme'
            : `${diagnostics.length} ${diagnostics.length === 1 ? 'Problem' : 'Probleme'}`}
        </button>
        <span className="text-slate-700" aria-hidden="true">
          ·
        </span>
        <span className="font-code tabular-nums whitespace-nowrap shrink-0">
          {lineCount} Zeilen · {charCount} Zeichen
        </span>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 font-code tabular-nums">
        <span className="whitespace-nowrap">
          Z.{cursor.line}, Sp.{cursor.column}
          {cursor.selectionLength > 0 ? ` (${cursor.selectionLength} markiert)` : ''}
        </span>
        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
          ·
        </span>
        <button
          type="button"
          onClick={onToggleTabSize}
          title="Tab-Breite umschalten"
          className="hidden sm:inline hover:text-slate-200 transition-colors whitespace-nowrap"
        >
          {settings.tabSize} Leerzeichen
        </button>
        <span className="text-slate-700 hidden md:inline" aria-hidden="true">
          ·
        </span>
        <span className="hidden md:inline whitespace-nowrap">UTF-8</span>
        <span className="text-slate-700" aria-hidden="true">
          ·
        </span>
        <span className="whitespace-nowrap font-medium" style={{color: theme.accent}}>
          {lang.label}
        </span>
      </div>
    </footer>
  );
}
