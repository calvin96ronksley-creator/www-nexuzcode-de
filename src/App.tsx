import {useCallback, useEffect, useMemo, useState} from 'react';
import {CodeEditor} from './components/CodeEditor';
import {FindReplaceBar} from './components/FindReplaceBar';
import {OutputPanel, OutputTabId} from './components/OutputPanel';
import {SettingsModal} from './components/SettingsModal';
import {Sidebar} from './components/Sidebar';
import {StatusBar} from './components/StatusBar';
import {TabBar} from './components/TabBar';
import {TopBar} from './components/TopBar';
import {CodeTemplate, STARTER_FILES} from './data/starterFiles';
import {
  ConsoleEntry,
  CursorPosition,
  EditorFile,
  EditorSettings,
  LanguageId,
} from './types/editor';
import {analyzeDiagnostics} from './utils/diagnostics';
import {formatCode} from './utils/formatter';
import {detectLanguageFromFilename, LANGUAGES} from './utils/languages';
import {executeCode} from './utils/runner';
import {NEON_THEMES} from './utils/themes';

const STORAGE_FILES_KEY = 'lumincode.workspace.files.v1';
const STORAGE_SETTINGS_KEY = 'lumincode.settings.v1';

const DEFAULT_SETTINGS: EditorSettings = {
  theme: 'cyber-cyan',
  glow: 'radiant',
  fontSize: 14,
  tabSize: 4,
  wordWrap: false,
  minimap: true,
};

function loadInitialFiles(): EditorFile[] {
  try {
    const raw = localStorage.getItem(STORAGE_FILES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as EditorFile[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return STARTER_FILES;
}

function loadInitialSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (raw) {
      return {...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<EditorSettings>)};
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export default function App() {
  const [files, setFiles] = useState<EditorFile[]>(loadInitialFiles);
  const [openTabIds, setOpenTabIds] = useState<string[]>(() =>
    loadInitialFiles()
      .slice(0, 4)
      .map((f) => f.id)
  );
  const [activeFileId, setActiveFileId] = useState<string>(() => loadInitialFiles()[0].id);
  const [settings, setSettings] = useState<EditorSettings>(loadInitialSettings);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [panelDock, setPanelDock] = useState<'bottom' | 'right'>('right');
  const [outputTab, setOutputTab] = useState<OutputTabId>('console');
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [consoleEntries, setConsoleEntries] = useState<ConsoleEntry[]>([]);
  const [lastRunDurationMs, setLastRunDurationMs] = useState<number | null>(null);
  const [lastRunSuccess, setLastRunSuccess] = useState<boolean | null>(null);

  const [copied, setCopied] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const [cursor, setCursor] = useState<CursorPosition>({
    line: 1,
    column: 1,
    offset: 0,
    selectionLength: 0,
  });

  // Find & Replace state
  const [findOpen, setFindOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  const [jumpToLineReq, setJumpToLineReq] = useState<{
    line: number;
    column?: number;
    seq: number;
  } | null>(null);
  const [jumpToOffsetReq, setJumpToOffsetReq] = useState<{
    offset: number;
    length: number;
    seq: number;
  } | null>(null);

  const activeFile = useMemo(
    () => files.find((f) => f.id === activeFileId) ?? files[0],
    [files, activeFileId]
  );

  const openFiles = useMemo(() => {
    const valid = openTabIds
      .map((id) => files.find((f) => f.id === id))
      .filter((f): f is EditorFile => Boolean(f));
    if (!valid.some((f) => f.id === activeFile.id)) {
      return [...valid, activeFile];
    }
    return valid;
  }, [openTabIds, files, activeFile]);

  const activeTheme = NEON_THEMES[settings.theme];

  // Sync CSS variables for neon theme
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--neon-accent', activeTheme.accent);
    root.style.setProperty('--neon-accent-rgb', activeTheme.accentRgb);
    root.style.setProperty('--neon-secondary', activeTheme.secondary);
    root.style.setProperty('--neon-secondary-rgb', activeTheme.secondaryRgb);
  }, [activeTheme]);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Persist files
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_FILES_KEY, JSON.stringify(files));
    } catch {
      // ignore
    }
  }, [files]);

  // Run initial file once on mount for immediate interactive output
  useEffect(() => {
    const res = executeCode(activeFile.content, activeFile.language);
    setConsoleEntries(res.entries);
    setLastRunDurationMs(res.durationMs);
    setLastRunSuccess(res.success);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diagnostics = useMemo(
    () => analyzeDiagnostics(activeFile.content, activeFile.language),
    [activeFile.content, activeFile.language]
  );

  // Compute search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery) return [];
    const hay = caseSensitive ? activeFile.content : activeFile.content.toLowerCase();
    const needle = caseSensitive ? searchQuery : searchQuery.toLowerCase();
    const indices: number[] = [];
    let pos = 0;
    while ((pos = hay.indexOf(needle, pos)) !== -1) {
      indices.push(pos);
      pos += Math.max(1, needle.length);
    }
    return indices;
  }, [activeFile.content, searchQuery, caseSensitive]);

  useEffect(() => {
    if (activeMatchIndex >= searchMatches.length) {
      setActiveMatchIndex(0);
    }
  }, [searchMatches.length, activeMatchIndex]);

  const handleSelectFile = useCallback(
    (id: string) => {
      setActiveFileId(id);
      setOpenTabIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
      const target = files.find((f) => f.id === id);
      if (target) {
        if (target.language === 'html' || target.language === 'css') {
          setOutputTab('preview');
        } else if (outputTab === 'preview') {
          setOutputTab('console');
        }
      }
    },
    [files, outputTab]
  );

  const handleCloseTab = useCallback(
    (id: string) => {
      setOpenTabIds((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((t) => t !== id);
        if (activeFileId === id) {
          setActiveFileId(next[next.length - 1]);
        }
        return next;
      });
    },
    [activeFileId]
  );

  const handleUpdateCode = useCallback(
    (newCode: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? {...f, content: newCode} : f))
      );
    },
    [activeFile.id]
  );

  const handleChangeLanguage = useCallback(
    (lang: LanguageId) => {
      setFiles((prev) =>
        prev.map((f) => (f.id === activeFile.id ? {...f, language: lang} : f))
      );
      setSettings((prev) => ({
        ...prev,
        tabSize: LANGUAGES[lang].defaultTabSize,
      }));
    },
    [activeFile.id]
  );

  const handleCreateFile = useCallback((filename: string) => {
    const lang = detectLanguageFromFilename(filename);
    const newId = `file-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const starterComment =
      lang === 'python'
        ? `# ${filename}\nprint("Hallo von ${filename}")\n`
        : lang === 'html'
          ? `<!DOCTYPE html>\n<html lang="de">\n<body>\n  <h1>${filename}</h1>\n</body>\n</html>\n`
          : lang === 'json'
            ? `{\n  "name": "${filename}"\n}\n`
            : lang === 'sql'
              ? `-- ${filename}\nSELECT 1;\n`
              : `// ${filename}\n`;

    const created: EditorFile = {
      id: newId,
      name: filename,
      language: lang,
      content: starterComment,
      savedContent: starterComment,
    };
    setFiles((prev) => [...prev, created]);
    setOpenTabIds((prev) => [...prev, newId]);
    setActiveFileId(newId);
  }, []);

  const handleRenameFile = useCallback((id: string, newName: string) => {
    const lang = detectLanguageFromFilename(newName);
    setFiles((prev) =>
      prev.map((f) => (f.id === id ? {...f, name: newName, language: lang} : f))
    );
  }, []);

  const handleDeleteFile = useCallback(
    (id: string) => {
      setFiles((prev) => {
        if (prev.length <= 1) return prev;
        const remaining = prev.filter((f) => f.id !== id);
        setOpenTabIds((tabs) => {
          const nextTabs = tabs.filter((t) => t !== id);
          if (nextTabs.length === 0) return [remaining[0].id];
          return nextTabs;
        });
        if (activeFileId === id) {
          setActiveFileId(remaining[0].id);
        }
        return remaining;
      });
    },
    [activeFileId]
  );

  const handleUploadFile = useCallback((filename: string, content: string) => {
    const lang = detectLanguageFromFilename(filename);
    const newId = `file-${Date.now()}`;
    const uploaded: EditorFile = {
      id: newId,
      name: filename,
      language: lang,
      content,
      savedContent: content,
    };
    setFiles((prev) => [...prev, uploaded]);
    setOpenTabIds((prev) => [...prev, newId]);
    setActiveFileId(newId);
  }, []);

  const handleLoadTemplate = useCallback(
    (tpl: CodeTemplate) => {
      const existing = files.find((f) => f.name === tpl.filename);
      if (existing) {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === existing.id ? {...f, content: tpl.code, language: tpl.language} : f
          )
        );
        handleSelectFile(existing.id);
        return;
      }
      const newId = `tpl-${Date.now()}`;
      const newFile: EditorFile = {
        id: newId,
        name: tpl.filename,
        language: tpl.language,
        content: tpl.code,
        savedContent: tpl.code,
      };
      setFiles((prev) => [...prev, newFile]);
      setOpenTabIds((prev) => [...prev, newId]);
      setActiveFileId(newId);
    },
    [files, handleSelectFile]
  );

  const handleResetWorkspace = useCallback(() => {
    setFiles(STARTER_FILES);
    setOpenTabIds(STARTER_FILES.slice(0, 4).map((f) => f.id));
    setActiveFileId(STARTER_FILES[0].id);
  }, []);

  const handleRun = useCallback(() => {
    if (LANGUAGES[activeFile.language].previewable) {
      setOutputTab('preview');
      return;
    }
    setOutputTab('console');
    const res = executeCode(activeFile.content, activeFile.language);
    setConsoleEntries(res.entries);
    setLastRunDurationMs(res.durationMs);
    setLastRunSuccess(res.success);
  }, [activeFile.content, activeFile.language]);

  const handleFormat = useCallback(() => {
    try {
      const formatted = formatCode(activeFile.content, activeFile.language, settings.tabSize);
      handleUpdateCode(formatted);
    } catch (err) {
      setOutputTab('console');
      setConsoleEntries((prev) => [
        ...prev,
        {
          id: `${Date.now()}`,
          level: 'error',
          text: `Formatierung fehlgeschlagen: ${err instanceof Error ? err.message : String(err)}`,
          timestamp: new Date().toLocaleTimeString('de-DE', {hour12: false}),
        },
      ]);
    }
  }, [activeFile.content, activeFile.language, settings.tabSize, handleUpdateCode]);

  const handleSave = useCallback(() => {
    setFiles((prev) =>
      prev.map((f) => (f.id === activeFile.id ? {...f, savedContent: f.content} : f))
    );
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1800);
  }, [activeFile.id]);

  const handleCopyCode = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // ignore clipboard errors
    }
  }, [activeFile.content]);

  const handleDownloadFile = useCallback(() => {
    const blob = new Blob([activeFile.content], {type: 'text/plain;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeFile.content, activeFile.name]);

  const jumpToMatch = useCallback(
    (idx: number) => {
      if (searchMatches.length === 0) return;
      const wrapped = ((idx % searchMatches.length) + searchMatches.length) % searchMatches.length;
      setActiveMatchIndex(wrapped);
      setJumpToOffsetReq({
        offset: searchMatches[wrapped],
        length: searchQuery.length,
        seq: Date.now(),
      });
    },
    [searchMatches, searchQuery.length]
  );

  const handleReplaceOne = useCallback(() => {
    if (searchMatches.length === 0 || !searchQuery) return;
    const offset = searchMatches[activeMatchIndex] ?? searchMatches[0];
    const next =
      activeFile.content.slice(0, offset) +
      replaceText +
      activeFile.content.slice(offset + searchQuery.length);
    handleUpdateCode(next);
  }, [searchMatches, activeMatchIndex, searchQuery, replaceText, activeFile.content, handleUpdateCode]);

  const handleReplaceAll = useCallback(() => {
    if (!searchQuery) return;
    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = activeFile.content.replace(new RegExp(escaped, flags), replaceText);
    handleUpdateCode(next);
  }, [searchQuery, caseSensitive, activeFile.content, replaceText, handleUpdateCode]);

  return (
    <div className="h-screen w-screen flex flex-col bg-[#06080D] text-slate-100 overflow-hidden">
      <TopBar
        activeFile={activeFile}
        theme={activeTheme}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        panelDock={panelDock}
        onTogglePanelDock={() => setPanelDock((d) => (d === 'bottom' ? 'right' : 'bottom'))}
        onRun={handleRun}
        onFormat={handleFormat}
        onToggleFind={() => setFindOpen((v) => !v)}
        onCopyCode={handleCopyCode}
        onDownloadFile={handleDownloadFile}
        onOpenSettings={() => setSettingsOpen(true)}
        copied={copied}
        savedFlash={savedFlash}
      />

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {sidebarOpen && (
          <Sidebar
            files={files}
            activeFileId={activeFile.id}
            theme={activeTheme}
            onSelectFile={handleSelectFile}
            onCreateFile={handleCreateFile}
            onRenameFile={handleRenameFile}
            onDeleteFile={handleDeleteFile}
            onUploadFile={handleUploadFile}
            onLoadTemplate={handleLoadTemplate}
            onResetWorkspace={handleResetWorkspace}
          />
        )}

        {/* Editor + Dockable Output Area */}
        <main
          className={`flex-1 flex min-w-0 min-h-0 overflow-hidden ${
            panelDock === 'bottom' ? 'flex-col' : 'flex-col md:flex-row'
          }`}
        >
          {/* Center Editor Column */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
            <TabBar
              openFiles={openFiles}
              activeFile={activeFile}
              theme={activeTheme}
              onSelectTab={handleSelectFile}
              onCloseTab={handleCloseTab}
              onChangeLanguage={handleChangeLanguage}
            />

            {findOpen && (
              <FindReplaceBar
                query={searchQuery}
                replaceText={replaceText}
                caseSensitive={caseSensitive}
                matchCount={searchMatches.length}
                activeMatchIndex={activeMatchIndex}
                theme={activeTheme}
                onQueryChange={(v) => {
                  setSearchQuery(v);
                  setActiveMatchIndex(0);
                }}
                onReplaceTextChange={setReplaceText}
                onToggleCaseSensitive={() => setCaseSensitive((v) => !v)}
                onNextMatch={() => jumpToMatch(activeMatchIndex + 1)}
                onPrevMatch={() => jumpToMatch(activeMatchIndex - 1)}
                onReplaceOne={handleReplaceOne}
                onReplaceAll={handleReplaceAll}
                onClose={() => setFindOpen(false)}
              />
            )}

            <CodeEditor
              code={activeFile.content}
              language={activeFile.language}
              settings={settings}
              theme={activeTheme}
              diagnostics={diagnostics}
              searchQuery={findOpen ? searchQuery : ''}
              caseSensitive={caseSensitive}
              jumpToLineRequest={jumpToLineReq}
              jumpToOffsetRequest={jumpToOffsetReq}
              onChange={handleUpdateCode}
              onCursorChange={setCursor}
              onRunShortcut={handleRun}
              onSaveShortcut={handleSave}
              onFindShortcut={() => setFindOpen(true)}
              onFormatShortcut={handleFormat}
            />
          </div>

          <OutputPanel
            dock={panelDock}
            activeTab={outputTab}
            onSelectTab={setOutputTab}
            activeFile={activeFile}
            allFiles={files}
            consoleEntries={consoleEntries}
            lastRunDurationMs={lastRunDurationMs}
            lastRunSuccess={lastRunSuccess}
            diagnostics={diagnostics}
            theme={activeTheme}
            onRun={handleRun}
            onClearConsole={() => {
              setConsoleEntries([]);
              setLastRunDurationMs(null);
              setLastRunSuccess(null);
            }}
            onJumpToLine={(line, column) =>
              setJumpToLineReq({line, column, seq: Date.now()})
            }
          />
        </main>
      </div>

      <StatusBar
        activeFile={activeFile}
        cursor={cursor}
        settings={settings}
        diagnostics={diagnostics}
        theme={activeTheme}
        onClickDiagnostics={() => setOutputTab('diagnostics')}
        onToggleTabSize={() =>
          setSettings((prev) => ({...prev, tabSize: prev.tabSize === 4 ? 2 : 4}))
        }
      />

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(patch) => setSettings((prev) => ({...prev, ...patch}))}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
