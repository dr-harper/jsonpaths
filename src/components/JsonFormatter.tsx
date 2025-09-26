import { useMemo, useState } from 'react';

interface JsonFormatterProps {
  darkMode: boolean;
}

interface JsonStats {
  objects: number;
  arrays: number;
  strings: number;
  numbers: number;
  booleans: number;
  nulls: number;
  keys: number;
  totalNodes: number;
  maxDepth: number;
}

const formatJsonValue = (value: unknown, sortKeys: boolean): unknown => {
  if (Array.isArray(value)) {
    return value.map(item => formatJsonValue(item, sortKeys));
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    const sortedEntries = sortKeys ? entries.sort(([a], [b]) => a.localeCompare(b)) : entries;

    return sortedEntries.reduce<Record<string, unknown>>((acc, [key, val]) => {
      acc[key] = formatJsonValue(val, sortKeys);
      return acc;
    }, {});
  }

  return value;
};

const calculateStats = (value: unknown): JsonStats => {
  const initial: JsonStats = {
    objects: 0,
    arrays: 0,
    strings: 0,
    numbers: 0,
    booleans: 0,
    nulls: 0,
    keys: 0,
    totalNodes: 0,
    maxDepth: 0
  };

  const traverse = (node: unknown, depth: number) => {
    initial.totalNodes += 1;
    initial.maxDepth = Math.max(initial.maxDepth, depth);

    if (Array.isArray(node)) {
      initial.arrays += 1;
      node.forEach(item => traverse(item, depth + 1));
      return;
    }

    if (node === null) {
      initial.nulls += 1;
      return;
    }

    const typeOfNode = typeof node;

    if (typeOfNode === 'object') {
      initial.objects += 1;
      const entries = Object.entries(node as Record<string, unknown>);
      initial.keys += entries.length;
      entries.forEach(([, val]) => traverse(val, depth + 1));
      return;
    }

    if (typeOfNode === 'string') {
      initial.strings += 1;
      return;
    }

    if (typeOfNode === 'number') {
      initial.numbers += 1;
      return;
    }

    if (typeOfNode === 'boolean') {
      initial.booleans += 1;
    }
  };

  traverse(value, 1);
  return initial;
};

const JsonFormatter = ({ darkMode }: JsonFormatterProps) => {
  const [input, setInput] = useState<string>('');
  const [indent, setIndent] = useState<'2' | '4' | 'tab'>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);
  const [minify, setMinify] = useState<boolean>(false);
  const [formattedOutput, setFormattedOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [stats, setStats] = useState<JsonStats | null>(null);

  const indentString = useMemo(() => {
    if (minify) {
      return '';
    }

    if (indent === 'tab') {
      return '\t';
    }

    return ' '.repeat(parseInt(indent, 10));
  }, [indent, minify]);

  const handleFormat = () => {
    if (!input.trim()) {
      setFormattedOutput('');
      setStats(null);
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(input);
      const normalized = formatJsonValue(parsed, sortKeys);
      const statsResult = calculateStats(normalized);
      const formatted = JSON.stringify(normalized, null, indentString || undefined);
      setFormattedOutput(formatted);
      setStats(statsResult);
      setError('');
    } catch (formatError) {
      setError('Unable to format JSON. Please ensure it is valid.');
      setStats(null);
      setFormattedOutput('');
      console.error(formatError);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formattedOutput);
    } catch (clipboardError) {
      console.error('Failed to copy JSON:', clipboardError);
    }
  };

  return (
    <div className="container-fluid p-3">
      <div className="row g-3">
        <div className="col-12 col-lg-6">
          <div className={`card shadow-sm ${darkMode ? 'bg-dark text-light' : ''}`}>
            <div className={`card-header ${darkMode ? 'border-secondary' : ''}`}>
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-code-square me-2 text-primary"></i>
                  JSON Input
                </h6>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setInput('')}>Clear</button>
              </div>
            </div>
            <div className="card-body">
              <textarea
                className={`form-control ${darkMode ? 'bg-dark text-light border-secondary' : ''}`}
                style={{ minHeight: '320px', fontFamily: 'var(--bs-font-monospace)' }}
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Paste JSON here to format"
              ></textarea>
            </div>
            <div className={`card-footer ${darkMode ? 'border-secondary' : ''}`}>
              <div className="row g-2 align-items-center">
                <div className="col-12 col-md-6">
                  <label className="form-label mb-1 small text-muted">Indentation</label>
                  <div className="btn-group w-100" role="group">
                    <button
                      className={`btn btn-sm ${indent === '2' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setIndent('2')}
                    >
                      2 spaces
                    </button>
                    <button
                      className={`btn btn-sm ${indent === '4' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setIndent('4')}
                    >
                      4 spaces
                    </button>
                    <button
                      className={`btn btn-sm ${indent === 'tab' ? 'btn-primary' : 'btn-outline-primary'}`}
                      onClick={() => setIndent('tab')}
                    >
                      Tabs
                    </button>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="sortKeys"
                      checked={sortKeys}
                      onChange={event => setSortKeys(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="sortKeys">
                      Sort keys
                    </label>
                  </div>
                </div>
                <div className="col-6 col-md-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="minifyJson"
                      checked={minify}
                      onChange={event => setMinify(event.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="minifyJson">
                      Minify
                    </label>
                  </div>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <div className="text-danger small">{error}</div>
                <button className="btn btn-primary" onClick={handleFormat}>
                  <i className="bi bi-magic me-2"></i>
                  Format JSON
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-lg-6 d-flex flex-column gap-3">
          <div className={`card shadow-sm flex-fill ${darkMode ? 'bg-dark text-light' : ''}`}>
            <div className={`card-header d-flex justify-content-between align-items-center ${darkMode ? 'border-secondary' : ''}`}>
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-check2-square me-2 text-success"></i>
                Formatted Output
              </h6>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-primary" onClick={handleCopy} disabled={!formattedOutput}>
                  <i className="bi bi-clipboard me-1"></i>
                  Copy
                </button>
              </div>
            </div>
            <div className="card-body">
              <div
                className={`border rounded p-3 ${darkMode ? 'border-secondary bg-dark text-light' : 'bg-light text-dark'}`}
                style={{ minHeight: '200px', maxHeight: '420px', overflow: 'auto' }}
              >
                <pre className="mb-0" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {formattedOutput || 'Formatted JSON will appear here'}
                </pre>
              </div>
            </div>
          </div>
          <div className={`card shadow-sm ${darkMode ? 'bg-dark text-light' : ''}`}>
            <div className={`card-header ${darkMode ? 'border-secondary' : ''}`}>
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-bar-chart-line me-2 text-info"></i>
                JSON Statistics
              </h6>
            </div>
            <div className="card-body">
              {stats ? (
                <div className="row g-3 small">
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Total Nodes</div>
                      <div className="fs-5 fw-semibold">{stats.totalNodes.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Max Depth</div>
                      <div className="fs-5 fw-semibold">{stats.maxDepth}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Objects</div>
                      <div className="fs-5 fw-semibold">{stats.objects.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Arrays</div>
                      <div className="fs-5 fw-semibold">{stats.arrays.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Keys</div>
                      <div className="fs-5 fw-semibold">{stats.keys.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Strings</div>
                      <div className="fs-5 fw-semibold">{stats.strings.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Numbers</div>
                      <div className="fs-5 fw-semibold">{stats.numbers.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Booleans</div>
                      <div className="fs-5 fw-semibold">{stats.booleans.toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="p-2 border rounded h-100">
                      <div className="text-muted text-uppercase small">Nulls</div>
                      <div className="fs-5 fw-semibold">{stats.nulls.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted mb-0">Run the formatter to see JSON statistics.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFormatter;
