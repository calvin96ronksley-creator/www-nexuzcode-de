import {ChevronDown, ChevronUp, Replace, X} from 'lucide-react';
import {NeonThemeDefinition} from '../utils/themes';

interface FindReplaceBarProps {
  query: string;
  replaceText: string;
  caseSensitive: boolean;
  matchCount: number;
  activeMatchIndex: number;
  theme: NeonThemeDefinition;
  onQueryChange: (val: string) => void;
  onReplaceTextChange: (val: string) => void;
  onToggleCaseSensitive: () => void;
  onNextMatch: () => void;
  onPrevMatch: () => void;
  onReplaceOne: () => void;
  onReplaceAll: () => void;
  onClose: () => void;
}

export function FindReplaceBar({
  query,
  replaceText,
  caseSensitive,
  matchCount,
  activeMatchIndex,
  theme,
  onQueryChange,
  onReplaceTextChange,
  onToggleCaseSensitive,
  onNextMatch,
  onPrevMatch,
  onReplaceOne,
  onReplaceAll,
  onClose,
}: FindReplaceBarProps) {
  return (
    <div className="shrink-0 flex flex-wrap items-center gap-2 px-3 py-2 bg-[#0B101B] border-b border-slate-800/80 text-xs">
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          autoFocus
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              if (e.shiftKey) onPrevMatch();
              else onNextMatch();
            }
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Suchen..."
          className="w-44 sm:w-52 h-7 px-2.5 font-code text-xs bg-[#06080D] text-slate-100 border border-slate-700/80 rounded focus:outline-none focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={onToggleCaseSensitive}
          title="Groß-/Kleinschreibung beachten"
          className={`h-7 px-2 rounded font-code text-xs border transition-colors ${
            caseSensitive
              ? 'text-slate-950 font-semibold border-transparent'
              : 'text-slate-400 border-slate-700/80 hover:text-slate-200'
          }`}
          style={caseSensitive ? {backgroundColor: theme.accent} : undefined}
        >
          Aa
        </button>

        <span className="font-code tabular-nums text-slate-400 min-w-[54px] text-center">
          {query ? (matchCount > 0 ? `${activeMatchIndex + 1} / ${matchCount}` : '0 / 0') : '—'}
        </span>

        <button
          type="button"
          onClick={onPrevMatch}
          disabled={matchCount === 0}
          title="Vorheriger Treffer"
          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-35"
        >
          <ChevronUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onNextMatch}
          disabled={matchCount === 0}
          title="Nächster Treffer"
          className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 disabled:opacity-35"
        >
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={replaceText}
          onChange={(e) => onReplaceTextChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') onClose();
          }}
          placeholder="Ersetzen durch..."
          className="w-40 sm:w-48 h-7 px-2.5 font-code text-xs bg-[#06080D] text-slate-100 border border-slate-700/80 rounded focus:outline-none focus:border-cyan-400"
        />

        <button
          type="button"
          onClick={onReplaceOne}
          disabled={matchCount === 0}
          className="h-7 px-2.5 flex items-center gap-1 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 disabled:opacity-35 whitespace-nowrap shrink-0"
        >
          <Replace className="w-3 h-3" />
          <span>Ersetzen</span>
        </button>
        <button
          type="button"
          onClick={onReplaceAll}
          disabled={matchCount === 0}
          className="h-7 px-2.5 rounded bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 disabled:opacity-35 whitespace-nowrap shrink-0"
        >
          Alle
        </button>
      </div>

      <button
        type="button"
        onClick={onClose}
        title="Schließen (Esc)"
        className="ml-auto h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
