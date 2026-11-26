import {X} from 'lucide-react';
import {EditorFile, LanguageId} from '../types/editor';
import {LANGUAGE_LIST, LANGUAGES} from '../utils/languages';
import {NeonThemeDefinition} from '../utils/themes';

interface TabBarProps {
  openFiles: EditorFile[];
  activeFile: EditorFile;
  theme: NeonThemeDefinition;
  onSelectTab: (id: string) => void;
  onCloseTab: (id: string) => void;
  onChangeLanguage: (language: LanguageId) => void;
}

export function TabBar({
  openFiles,
  activeFile,
  theme,
  onSelectTab,
  onCloseTab,
  onChangeLanguage,
}: TabBarProps) {
  return (
    <div className="h-10 shrink-0 flex items-center justify-between bg-[#080B12] border-b border-slate-800/80 px-2 gap-3 select-none">
      {/* Open Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto min-w-0 flex-1 no-scrollbar">
        {openFiles.map((file) => {
          const isActive = file.id === activeFile.id;
          const isDirty = file.content !== file.savedContent;
          const lang = LANGUAGES[file.language];

          return (
            <div
              key={file.id}
              onClick={() => onSelectTab(file.id)}
              className={`group relative h-8 px-3 flex items-center gap-2 rounded-md text-xs cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-[#0E1422] text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
              style={
                isActive
                  ? {
                      boxShadow: `inset 0 -2px 0 ${theme.accent}`,
                    }
                  : undefined
              }
            >
              <span
                className="font-code text-[10px] font-semibold"
                style={{color: lang.badgeColor}}
              >
                {lang.shortLabel}
              </span>
              <span className="font-medium">{file.name}</span>
              {isDirty && (
                <span className="text-[11px] font-bold" style={{color: theme.accent}}>
                  *
                </span>
              )}
              {openFiles.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCloseTab(file.id);
                  }}
                  title="Tab schließen"
                  className="ml-0.5 p-0.5 rounded text-slate-500 hover:text-slate-100 hover:bg-slate-700/60 opacity-70 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Language Switcher Dropdown */}
      <div className="flex items-center gap-2 shrink-0 pr-1">
        <label htmlFor="lang-select" className="sr-only">
          Programmiersprache wählen
        </label>
        <select
          id="lang-select"
          value={activeFile.language}
          onChange={(e) => onChangeLanguage(e.target.value as LanguageId)}
          className="h-7 px-2.5 text-xs font-medium bg-[#0E1422] text-slate-200 border border-slate-800 rounded-md focus:outline-none focus:border-cyan-400 cursor-pointer"
        >
          {LANGUAGE_LIST.map((lang) => (
            <option key={lang.id} value={lang.id} className="bg-[#0B0F19] text-slate-100">
              {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
