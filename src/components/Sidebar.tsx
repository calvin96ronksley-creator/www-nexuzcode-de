import React, {useRef, useState} from 'react';
import {
  FileCode2,
  FilePlus,
  FolderOpen,
  Pencil,
  RotateCcw,
  Trash2,
  Upload,
} from 'lucide-react';
import {CODE_TEMPLATES, CodeTemplate} from '../data/starterFiles';
import {EditorFile} from '../types/editor';
import {LANGUAGES} from '../utils/languages';
import {NeonThemeDefinition} from '../utils/themes';

interface SidebarProps {
  files: EditorFile[];
  activeFileId: string;
  theme: NeonThemeDefinition;
  onSelectFile: (id: string) => void;
  onCreateFile: (filename: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onDeleteFile: (id: string) => void;
  onUploadFile: (filename: string, content: string) => void;
  onLoadTemplate: (tpl: CodeTemplate) => void;
  onResetWorkspace: () => void;
}

export function Sidebar({
  files,
  activeFileId,
  theme,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onUploadFile,
  onLoadTemplate,
  onResetWorkspace,
}: SidebarProps) {
  const [creating, setCreating] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newFilename.trim();
    if (!trimmed) {
      setCreating(false);
      return;
    }
    onCreateFile(trimmed);
    setNewFilename('');
    setCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    const trimmed = renameValue.trim();
    if (trimmed) {
      onRenameFile(id, trimmed);
    }
    setRenamingId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onUploadFile(file.name, reader.result);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside className="w-64 shrink-0 flex flex-col bg-[#080B12] border-r border-slate-800/80 select-none overflow-hidden">
      {/* Explorer Header */}
      <div className="h-10 px-3.5 flex items-center justify-between border-b border-slate-800/60 shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 tracking-wide">
          <FolderOpen className="w-3.5 h-3.5 text-slate-400" />
          <span>Dateien</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setCreating(true);
              setNewFilename('');
            }}
            title="Neue Datei erstellen"
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
          >
            <FilePlus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Lokale Datei öffnen"
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onResetWorkspace}
            title="Standard-Dateien wiederherstellen"
            className="h-7 w-7 flex items-center justify-center rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".py,.ts,.tsx,.js,.jsx,.html,.css,.json,.rs,.sql,.md,.txt"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* New File Input */}
      {creating && (
        <form onSubmit={handleCreateSubmit} className="p-2 border-b border-slate-800/60 bg-[#0C101B]">
          <input
            type="text"
            autoFocus
            value={newFilename}
            onChange={(e) => setNewFilename(e.target.value)}
            onBlur={() => {
              if (!newFilename.trim()) setCreating(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setCreating(false);
            }}
            placeholder="z.B. script.py oder app.ts"
            className="w-full px-2.5 py-1.5 text-xs font-code bg-[#06080D] text-slate-100 border border-slate-700 rounded focus:outline-none focus:border-cyan-400"
          />
        </form>
      )}

      {/* File List */}
      <div className="flex-1 overflow-y-auto py-1.5 px-2 space-y-0.5">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isDirty = file.content !== file.savedContent;
          const lang = LANGUAGES[file.language];

          if (renamingId === file.id) {
            return (
              <form
                key={file.id}
                onSubmit={(e) => handleRenameSubmit(e, file.id)}
                className="px-1 py-0.5"
              >
                <input
                  type="text"
                  autoFocus
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  onBlur={() => setRenamingId(null)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="w-full px-2 py-1 text-xs font-code bg-[#06080D] text-slate-100 border border-cyan-400 rounded focus:outline-none"
                />
              </form>
            );
          }

          return (
            <div
              key={file.id}
              className={`group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors cursor-pointer ${
                isActive
                  ? 'bg-slate-800/65 text-slate-100'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/35'
              }`}
              style={
                isActive
                  ? {
                      boxShadow: `inset 0 0 0 1px rgba(${theme.accentRgb}, 0.28)`,
                    }
                  : undefined
              }
              onClick={() => onSelectFile(file.id)}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="font-code text-[10px] font-semibold w-7 shrink-0 text-left"
                  style={{color: lang.badgeColor}}
                >
                  {lang.shortLabel}
                </span>
                <span className="truncate font-medium">{file.name}</span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {isDirty && (
                  <span
                    className="text-[11px] font-bold leading-none"
                    style={{color: theme.accent}}
                    title="Ungespeicherte Änderungen"
                  >
                    *
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingId(file.id);
                    setRenameValue(file.name);
                  }}
                  title="Umbenennen"
                  className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-slate-200 transition-opacity"
                >
                  <Pencil className="w-3 h-3" />
                </button>
                {files.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteFile(file.id);
                    }}
                    title="Datei löschen"
                    className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-500 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Curated Templates Section */}
      <div className="border-t border-slate-800/80 p-3 bg-[#070A10] shrink-0">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-2">
          <FileCode2 className="w-3.5 h-3.5" style={{color: theme.secondary}} />
          <span>Code-Vorlagen</span>
        </div>
        <div className="space-y-1">
          {CODE_TEMPLATES.map((tpl) => {
            const lang = LANGUAGES[tpl.language];
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => onLoadTemplate(tpl)}
                className="w-full text-left px-2.5 py-1.5 rounded text-xs text-slate-400 hover:text-slate-100 hover:bg-slate-800/50 transition-colors flex items-center justify-between gap-2"
              >
                <span className="truncate">{tpl.title}</span>
                <span
                  className="font-code text-[10px] shrink-0"
                  style={{color: lang.badgeColor}}
                >
                  {lang.shortLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}
