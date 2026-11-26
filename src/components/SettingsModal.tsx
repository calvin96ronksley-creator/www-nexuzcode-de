import {X} from 'lucide-react';
import {EditorSettings, GlowIntensity, NeonThemeId} from '../types/editor';
import {NEON_THEMES} from '../utils/themes';

interface SettingsModalProps {
  settings: EditorSettings;
  onUpdateSettings: (patch: Partial<EditorSettings>) => void;
  onClose: () => void;
}

const GLOW_OPTIONS: Array<{id: GlowIntensity; label: string}> = [
  {id: 'off', label: 'Aus'},
  {id: 'subtle', label: 'Subtil'},
  {id: 'radiant', label: 'Strahlend'},
];

export function SettingsModal({
  settings,
  onUpdateSettings,
  onClose,
}: SettingsModalProps) {
  const activeTheme = NEON_THEMES[settings.theme];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Editor-Einstellungen"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl bg-[#0A0E17] border border-slate-800 shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-100">
              Editor-Einstellungen
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Neon-Farbschema, Leuchtkraft und Typografie anpassen
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 text-xs">
          {/* Neon Themes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-2.5">
              Neon-Farbschema
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(Object.keys(NEON_THEMES) as NeonThemeId[]).map((themeId) => {
                const t = NEON_THEMES[themeId];
                const selected = settings.theme === themeId;
                return (
                  <button
                    key={themeId}
                    type="button"
                    onClick={() => onUpdateSettings({theme: themeId})}
                    className={`p-3 rounded-lg text-left border transition-colors ${
                      selected
                        ? 'bg-slate-800/60 text-slate-100'
                        : 'bg-[#070A10] border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                    style={
                      selected
                        ? {
                            borderColor: t.accent,
                            boxShadow: `0 0 16px rgba(${t.accentRgb}, 0.16)`,
                          }
                        : undefined
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-slate-100">{t.name}</span>
                      <div className="flex items-center gap-1">
                        {t.swatches.map((hex) => (
                          <span
                            key={hex}
                            className="w-2.5 h-2.5 rounded-full"
                            style={{backgroundColor: hex}}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-[11px] text-slate-400">{t.subtitle}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Neon Glow Intensity */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-200">Neon-Leuchtkraft</div>
              <div className="text-[11px] text-slate-400">
                Lichtschein auf Syntax-Tokens
              </div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#06080D] border border-slate-800">
              {GLOW_OPTIONS.map((opt) => {
                const active = settings.glow === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onUpdateSettings({glow: opt.id})}
                    className={`px-3 py-1 rounded-md font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'text-slate-950 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={active ? {backgroundColor: activeTheme.accent} : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-200">Schriftgröße</div>
              <div className="text-[11px] text-slate-400 font-code tabular-nums">
                {settings.fontSize} px · JetBrains Mono
              </div>
            </div>
            <input
              type="range"
              min={12}
              max={20}
              step={1}
              value={settings.fontSize}
              onChange={(e) => onUpdateSettings({fontSize: Number(e.target.value)})}
              className="w-40 accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Tab Width */}
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold text-slate-200">Einzug (Tab-Breite)</div>
              <div className="text-[11px] text-slate-400">Leerzeichen pro Tab</div>
            </div>
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#06080D] border border-slate-800">
              {([2, 4] as const).map((size) => {
                const active = settings.tabSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => onUpdateSettings({tabSize: size})}
                    className={`px-3 py-1 rounded-md font-code font-medium transition-colors ${
                      active ? 'text-slate-950 font-semibold' : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={active ? {backgroundColor: activeTheme.accent} : undefined}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Toggles: Word Wrap & Minimap */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={() => onUpdateSettings({wordWrap: !settings.wordWrap})}
              className="p-3 rounded-lg border border-slate-800 bg-[#070A10] flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <span className="font-medium text-slate-200">Zeilenumbruch</span>
              <span
                className="font-code text-[11px] font-semibold"
                style={{color: settings.wordWrap ? activeTheme.accent : '#64748B'}}
              >
                {settings.wordWrap ? 'AN' : 'AUS'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({minimap: !settings.minimap})}
              className="p-3 rounded-lg border border-slate-800 bg-[#070A10] flex items-center justify-between hover:border-slate-700 transition-colors"
            >
              <span className="font-medium text-slate-200">Minimap</span>
              <span
                className="font-code text-[11px] font-semibold"
                style={{color: settings.minimap ? activeTheme.accent : '#64748B'}}
              >
                {settings.minimap ? 'AN' : 'AUS'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
