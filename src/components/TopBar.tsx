import {
  Columns2,
  Copy,
  Download,
  PanelBottom,
  PanelLeft,
  Play,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import {EditorFile} from '../types/editor';
import {LANGUAGES} from '../utils/languages';
import {NeonThemeDefinition} from '../utils/themes';

interface TopBarProps {
  activeFile: EditorFile;
  theme: NeonThemeDefinition;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  panelDock: 'bottom' | 'right';
  onTogglePanelDock: () => void;
  onRun: () => void;
  onFormat: () => void;
  onToggleFind: () => void;
  onCopyCode: () => void;
  onDownloadFile: () => void;
  onOpenSettings: () => void;
  copied: boolean;
  savedFlash: boolean;
}

export function TopBar({
  activeFile,
  theme,
  sidebarOpen,
  onToggleSidebar,
  panelDock,
  onTogglePanelDock,
  onRun,
  onFormat,
  onToggleFind,
  onCopyCode,
  onDownloadFile,
  onOpenSettings,
  copied,
  savedFlash,
}: TopBarProps) {
  const langConfig = LANGUAGES[activeFile.language];

  return (
    <header className="h-13 shrink-0 flex items-center justify-between gap-4 px-4 bg-[#080B12] border-b border-slate-800/80 select-none">
      {/* Left: Brand Wordmark + Workspace Breadcrumb */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleSidebar}
          title={sidebarOpen ? 'Explorer ausblenden' : 'Explorer einblenden'}
          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <PanelLeft className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 shrink-0">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path
              d="M12 2L20.66 7V17L12 22L3.34 17V7L12 2Z"
              stroke={theme.accent}
              strokeWidth="1.6"
            />
            <path
              d="M9 8.5L5.5 12L9 15.5M15 8.5L18.5 12L15 15.5M13 7.5L11 16.5"
              stroke={theme.secondary}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-base font-semibold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
            LuminCode
          </span>
        </div>

        <span className="text-slate-700 hidden sm:inline" aria-hidden="true">
          /
        </span>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 min-w-0 truncate">
          <span className="text-slate-500 whitespace-nowrap shrink-0">Workspace</span>
          <span className="text-slate-700" aria-hidden="true">
            /
          </span>
          <span className="text-slate-200 font-medium truncate">{activeFile.name}</span>
          <span className="text-slate-700" aria-hidden="true">
            ·
          </span>
          <span className="whitespace-nowrap shrink-0" style={{color: langConfig.badgeColor}}>
            {langConfig.label}
          </span>
          {savedFlash && (
            <>
              <span className="text-slate-700" aria-hidden="true">
                ·
              </span>
              <span className="text-emerald-400 whitespace-nowrap shrink-0">Gespeichert</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Functional Editor Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onToggleFind}
          title="Suchen & Ersetzen (Strg+F)"
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Suchen</span>
        </button>

        <button
          type="button"
          onClick={onFormat}
          title="Code formatieren (Alt+Shift+F)"
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Formatieren</span>
        </button>

        <button
          type="button"
          onClick={onCopyCode}
          title="Code in Zwischenablage kopieren"
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-slate-100 hover:bg-slate-800/70 transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Copy className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{copied ? 'Kopiert' : 'Kopieren'}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadFile}
          title="Aktive Datei herunterladen"
          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onTogglePanelDock}
          title={panelDock === 'bottom' ? 'Ausgabe rechts andocken' : 'Ausgabe unten andocken'}
          className="h-8 w-8 hidden sm:flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          {panelDock === 'bottom' ? (
            <Columns2 className="w-4 h-4" />
          ) : (
            <PanelBottom className="w-4 h-4" />
          )}
        </button>

        <button
          type="button"
          onClick={onOpenSettings}
          title="Editor-Einstellungen & Neon-Themes"
          className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-slate-800 mx-1" aria-hidden="true" />

        <button
          type="button"
          onClick={onRun}
          title="Code ausführen (Strg+Enter)"
          className="h-8 px-3.5 flex items-center gap-1.5 rounded-md text-xs font-semibold text-slate-950 transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#080B12]"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 18px rgba(${theme.accentRgb}, 0.38)`,
          }}
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span>{langConfig.previewable ? 'Vorschau' : 'Ausführen'}</span>
        </button>
      </div>
    </header>
  );
}
