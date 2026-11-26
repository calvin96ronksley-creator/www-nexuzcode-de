import {EditorFile, LanguageId} from '../types/editor';

export interface CodeTemplate {
  id: string;
  title: string;
  language: LanguageId;
  filename: string;
  code: string;
}

const RAW_STARTER_FILES: EditorFile[] = [
  {
    id: 'file-py-main',
    name: 'matrix_solver.py',
    language: 'python',
    content: `# Python 3 — Spektrale Signal-Analyse & Fibonacci-Generator
import math

def fibonacci_sequence(limit: int) -> list:
    """Berechnet die Fibonacci-Folge bis zum angegebenen Limit."""
    seq = [0, 1]
    while len(seq) < limit:
        seq.append(seq[-1] + seq[-2])
    return seq

def harmonic_energy(samples: list) -> float:
    squared = [math.pow(x, 2) for x in samples]
    return round(math.sqrt(sum(squared) / len(samples)), 4)

# Berechnung starten
fib = fibonacci_sequence(10)
normalized = [round(v / fib[-1], 3) for v in fib]
energy = harmonic_energy(normalized)

print(f"Fibonacci (10): {fib}")
print(f"Normalisiert:   {normalized}")
print(f"RMS-Energie:    {energy:.4f} units")

for idx, val in enumerate(fib[:5]):
    bar = "#" * (val + 1)
    print(f"  [{idx}] {val:2d} | {bar}")
`,
    savedContent: '',
  },
  {
    id: 'file-ts-engine',
    name: 'signal_store.ts',
    language: 'typescript',
    content: `// TypeScript — Typisierter Vektor- & Signal-Prozessor

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

type ChannelMode = 'cyan' | 'magenta' | 'lime';

interface TelemetryPacket<T> {
  channel: ChannelMode;
  timestamp: number;
  payload: T;
}

function magnitude(v: Vector3D): number {
  return Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
}

function createPacket<T>(channel: ChannelMode, payload: T): TelemetryPacket<T> {
  return {
    channel,
    timestamp: Date.now(),
    payload,
  };
}

const vectors: Vector3D[] = [
  { x: 3, y: 4, z: 12 },
  { x: 8, y: 15, z: 0 },
  { x: 5, y: 12, z: 84 },
];

const results = vectors.map((vec, index) => {
  const packet = createPacket('cyan', vec);
  return {
    index,
    channel: packet.channel,
    length: Number(magnitude(packet.payload).toFixed(2)),
  };
});

console.log('Verarbeitete Vektoren:', results);
`,
    savedContent: '',
  },
  {
    id: 'file-js-wave',
    name: 'harmonic_wave.js',
    language: 'javascript',
    content: `// JavaScript — Prozedurale Wellen-Synthese
const SAMPLE_RATE = 8;
const FREQUENCY = 2.5;

const synthesizeWave = (steps, amplitude = 10) => {
  const frames = [];
  for (let i = 0; i < steps; i++) {
    const phase = (i / steps) * Math.PI * 2 * FREQUENCY;
    const value = Math.sin(phase) * amplitude;
    frames.push({
      step: i,
      amplitude: Number(value.toFixed(2)),
      intensity: Math.round(Math.abs(value) * 10),
    });
  }
  return frames;
};

const wave = synthesizeWave(SAMPLE_RATE, 12);
const peak = Math.max(...wave.map((f) => Math.abs(f.amplitude)));

console.log(\`Wellen-Samples (\${wave.length}):\`, wave);
console.info(\`Spitzenamplitude: \${peak}\`);
`,
    savedContent: '',
  },
  {
    id: 'file-html-hud',
    name: 'neon_card.html',
    language: 'html',
    content: `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Neon HUD Vorschau</title>
</head>
<body>
  <main class="hud-frame">
    <div class="hud-header">
      <span class="hud-kicker">Optische Vorschau</span>
      <h1>Spektral-Modul</h1>
    </div>
    <p class="hud-copy">
      Live gerendertes HTML &amp; CSS direkt aus dem LuminCode-Workspace.
      Änderungen an der HTML- oder CSS-Datei aktualisieren diese Ansicht sofort.
    </p>
    <div class="hud-metrics">
      <div class="metric">
        <span class="metric-label">Farbraum</span>
        <strong class="metric-value cyan">sRGB / P3</strong>
      </div>
      <div class="metric">
        <span class="metric-label">Kontrast</span>
        <strong class="metric-value magenta">14.2 : 1</strong>
      </div>
      <div class="metric">
        <span class="metric-label">Raster</span>
        <strong class="metric-value lime">8px Basis</strong>
      </div>
    </div>
  </main>
</body>
</html>
`,
    savedContent: '',
  },
  {
    id: 'file-css-hud',
    name: 'neon_card.css',
    language: 'css',
    content: `/* Futuristisches HUD-Styling für die Live-Vorschau */
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #06080d;
  color: #e2e8f0;
  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
}

.hud-frame {
  width: 100%;
  max-width: 460px;
  padding: 28px;
  border-radius: 14px;
  background: linear-gradient(160deg, #0d1322 0%, #090d16 100%);
  border: 1px solid rgba(0, 240, 255, 0.28);
  box-shadow: 0 0 36px rgba(0, 240, 255, 0.12);
}

.hud-kicker {
  display: block;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: #00f0ff;
  margin-bottom: 6px;
}

h1 {
  font-size: 24px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 12px;
}

.hud-copy {
  font-size: 14px;
  line-height: 1.6;
  color: #94a3b8;
  margin-bottom: 22px;
}

.hud-metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding-top: 18px;
  border-top: 1px solid rgba(148, 163, 184, 0.14);
}

.metric-label {
  display: block;
  font-size: 11px;
  color: #64748b;
  margin-bottom: 4px;
}

.metric-value {
  font-size: 14px;
  font-weight: 600;
}

.cyan { color: #00f0ff; }
.magenta { color: #ff2e97; }
.lime { color: #39ff14; }
`,
    savedContent: '',
  },
  {
    id: 'file-json-tokens',
    name: 'palette.json',
    language: 'json',
    content: `{
  "theme": "Cyber Cyan",
  "version": "1.0.0",
  "surface": {
    "canvas": "#06080D",
    "panel": "#0A0E17",
    "border": "rgba(148, 163, 184, 0.12)"
  },
  "neonTokens": {
    "keyword": "#FF2E97",
    "function": "#00F0FF",
    "string": "#39FF14",
    "type": "#FFD166",
    "number": "#B388FF"
  },
  "languages": [
    "python",
    "typescript",
    "javascript",
    "html",
    "css",
    "json",
    "rust",
    "sql"
  ]
}
`,
    savedContent: '',
  },
  {
    id: 'file-rust-lexer',
    name: 'tokenizer.rs',
    language: 'rust',
    content: `// Rust — Zero-Copy Token Scanner
#[derive(Debug, Clone, PartialEq)]
pub enum TokenKind {
    Keyword,
    Identifier,
    Number(i64),
    StringLit,
}

pub struct Scanner<'a> {
    source: &'a str,
    cursor: usize,
}

impl<'a> Scanner<'a> {
    pub fn new(source: &'a str) -> Self {
        Self { source, cursor: 0 }
    }

    pub fn remaining(&self) -> &'a str {
        &self.source[self.cursor..]
    }

    pub fn scan_number(&mut self) -> Option<TokenKind> {
        let rest = self.remaining();
        let len = rest.bytes().take_while(|b| b.is_ascii_digit()).count();
        if len == 0 {
            return None;
        }
        let val = rest[..len].parse::<i64>().ok()?;
        self.cursor += len;
        Some(TokenKind::Number(val))
    }
}

fn main() {
    let mut scanner = Scanner::new("4096");
    println!("{:?}", scanner.scan_number());
}
`,
    savedContent: '',
  },
  {
    id: 'file-sql-query',
    name: 'analytics.sql',
    language: 'sql',
    content: `-- SQL — Aggregation der Build-Metriken pro Sprache
WITH recent_runs AS (
  SELECT
    language_id,
    duration_ms,
    exit_code,
    executed_at
  FROM workspace_executions
  WHERE executed_at >= NOW() - INTERVAL '7 days'
)
SELECT
  language_id,
  COUNT(*) AS total_runs,
  ROUND(AVG(duration_ms), 2) AS avg_duration_ms,
  SUM(CASE WHEN exit_code = 0 THEN 1 ELSE 0 END) AS successful_runs
FROM recent_runs
GROUP BY language_id
ORDER BY total_runs DESC
LIMIT 10;
`,
    savedContent: '',
  },
];

export const STARTER_FILES: EditorFile[] = RAW_STARTER_FILES.map((f) => ({
  ...f,
  savedContent: f.content,
}));

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: 'tpl-py-quicksort',
    title: 'Python 3: Quicksort & Benchmark',
    language: 'python',
    filename: 'quicksort.py',
    code: `# Python 3 — Rekursiver Quicksort
def quicksort(arr: list) -> list:
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quicksort(left) + middle + quicksort(right)

data = [42, 7, 19, 3, 99, 14, 28, 7, 61]
sorted_data = quicksort(data)
print(f"Eingabe:  {data}")
print(f"Sortiert: {sorted_data}")
`,
  },
  {
    id: 'tpl-ts-state',
    title: 'TypeScript: Event-Emitter',
    language: 'typescript',
    filename: 'event_bus.ts',
    code: `// TypeScript — Typsicherer Event-Bus
type Listener<T> = (payload: T) => void;

interface EventMap {
  compile: { file: string; durationMs: number };
  error: { line: number; message: string };
}

class EventBus<Events extends Record<string, unknown>> {
  private listeners: Map<keyof Events, Array<Listener<any>>> = new Map();

  on<K extends keyof Events>(event: K, fn: Listener<Events[K]>): void {
    const list = this.listeners.get(event) ?? [];
    list.push(fn);
    this.listeners.set(event, list);
  }

  emit<K extends keyof Events>(event: K, payload: Events[K]): void {
    const list = this.listeners.get(event) ?? [];
    list.forEach((fn) => fn(payload));
  }
}

const bus = new EventBus<EventMap>();
bus.on('compile', (data) => console.log('Build abgeschlossen:', data));
bus.emit('compile', { file: 'app.ts', durationMs: 14.8 });
`,
  },
  {
    id: 'tpl-js-prime',
    title: 'JavaScript: Sieb des Eratosthenes',
    language: 'javascript',
    filename: 'primes.js',
    code: `// JavaScript — Primzahlen bis N berechnen
function findPrimes(limit) {
  const isPrime = new Array(limit + 1).fill(true);
  isPrime[0] = false;
  isPrime[1] = false;

  for (let p = 2; p * p <= limit; p++) {
    if (isPrime[p]) {
      for (let m = p * p; m <= limit; m += p) {
        isPrime[m] = false;
      }
    }
  }

  return isPrime
    .map((flag, num) => (flag ? num : null))
    .filter((n) => n !== null);
}

const primes = findPrimes(60);
console.log(\`Gefundene Primzahlen (\${primes.length}):\`, primes);
`,
  },
];
