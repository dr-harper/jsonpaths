import { useState, useEffect } from 'react';
import LanguageExamples from './components/LanguageExamples';
import JsonTreeView from './components/JsonTreeView';

type JsonData =
  | null
  | boolean
  | number
  | string
  | JsonData[]
  | { [key: string]: JsonData };

function App() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'tree' | 'compact' | 'raw'>('tree');

  const getInitialTheme = (): 'light' | 'dark' => {
    const stored = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  };

  const [theme, setTheme] = useState<'light' | 'dark'>(getInitialTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    if (!value.trim()) {
      setJsonData(null);
      setError('');
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setJsonData(parsed);
      setError('');
    } catch {
      setError('Invalid JSON format');
      setJsonData(null);
    }
  };

  const loadSample = () => {
    const sampleJson = JSON.stringify({
      "user": {
        "id": 12345,
        "name": "John Doe",
        "email": "john@example.com",
        "profile": {
          "age": 30,
          "location": {
            "city": "New York",
            "country": "USA"
          },
          "interests": ["coding", "music", "travel"]
        }
      },
      "products": [
        {
          "id": 1,
          "name": "Laptop",
          "price": 999.99,
          "inStock": true
        },
        {
          "id": 2,
          "name": "Mouse",
          "price": 29.99,
          "inStock": false
        }
      ]
    }, null, 2);
    handleJsonChange(sampleJson);
  };


  return (
    <div
      className={`d-flex flex-column vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light'}`}
      data-bs-theme={theme}
    >
      {/* Bootstrap Navbar */}
      <nav className={`navbar navbar-expand-lg ${theme === 'dark' ? 'navbar-dark bg-dark' : 'navbar-dark bg-primary'}`}>
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            <i className="bi bi-braces me-2"></i>
            JSON Path Navigator
          </a>
          <div className="d-flex align-items-center gap-2">
            <span
              className={`badge ${
                theme === 'dark' ? 'bg-secondary text-light' : 'bg-light text-primary'
              }`}
            >
              v1.0.0
            </span>
            <button
              className="btn btn-sm btn-outline-light"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              <i className={`bi ${theme === 'dark' ? 'bi-sun' : 'bi-moon'}`}></i>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-fill d-flex overflow-auto">
        <div className="container-fluid p-3 d-flex">
          <div className="row g-3 flex-fill">
            {/* JSON Input Card */}
            <div className="col-12 col-md-6 col-lg-4 mb-3 mb-lg-0 d-flex">
              <div className={`card w-100 shadow-sm d-flex flex-column ${theme === 'dark' ? 'text-bg-dark' : ''}`}>
                <div className={`card-header ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white'}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-code-square me-2 text-primary"></i>
                      JSON Input
                    </h6>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        onClick={loadSample}
                        className="btn btn-primary"
                      >
                        <i className="bi bi-download me-1"></i>
                        Sample
                      </button>
                      <button
                        onClick={() => handleJsonChange('')}
                        className="btn btn-outline-secondary"
                      >
                        <i className="bi bi-x-lg me-1"></i>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body d-flex flex-column overflow-hidden">
                  {error && (
                    <div className="alert alert-danger py-2 mb-3 d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <small>{error}</small>
                    </div>
                  )}
                  {!error && jsonInput && (
                    <div className="alert alert-success py-2 mb-3 d-flex align-items-center" role="alert">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <small>Valid JSON</small>
                    </div>
                  )}
                  <textarea
                    value={jsonInput}
                    onChange={(e) => handleJsonChange(e.target.value)}
                    placeholder="Paste or type your JSON here..."
                    className="form-control font-monospace flex-fill"
                    style={{ fontSize: '0.875rem', minHeight: '300px' }}
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Structure View */}
            <div className="col-12 col-md-6 col-lg-4 mb-3 mb-lg-0 d-flex">
              <div className={`card w-100 shadow-sm d-flex flex-column ${theme === 'dark' ? 'text-bg-dark' : ''}`}>
                <div className={`card-header ${theme === 'dark' ? 'bg-dark border-secondary' : 'bg-white'}`}>
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-diagram-3 me-2 text-primary"></i>
                      Structure View
                    </h6>
                    <div className="d-flex gap-2">
                      {/* Search input */}
                      <div className="input-group input-group-sm" style={{ width: '150px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                      </div>
                      {/* View mode toggle */}
                      <div className="btn-group btn-group-sm" role="group">
                        <button
                          className={`btn ${viewMode === 'tree' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewMode('tree')}
                          title="Tree View"
                        >
                          <i className="bi bi-diagram-3"></i>
                        </button>
                        <button
                          className={`btn ${viewMode === 'compact' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewMode('compact')}
                          title="Compact View"
                        >
                          <i className="bi bi-braces"></i>
                        </button>
                        <button
                          className={`btn ${viewMode === 'raw' ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => setViewMode('raw')}
                          title="Raw JSON"
                        >
                          <i className="bi bi-code"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body overflow-auto">
                  {jsonData ? (
                    <JsonTreeView
                      data={jsonData}
                      onPathSelect={setSelectedPath}
                      searchTerm={searchTerm}
                      viewMode={viewMode}
                      theme={theme}
                    />
                  ) : (
                    <div className="text-center text-muted py-5">
                      <i className="bi bi-inbox display-1 mb-3"></i>
                      <p className="mb-1">No JSON data to display</p>
                      <small>Enter valid JSON to see its structure</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Language Examples Panel */}
            <div className="col-12 col-md-12 col-lg-4 d-flex">
              <div className={`card w-100 shadow-sm d-flex flex-column ${theme === 'dark' ? 'text-bg-dark' : ''}`}>
                <LanguageExamples path={selectedPath} theme={theme} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-top py-3 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-white'}`}>
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">© 2024 JSON Path Navigator</small>
            <div className="d-flex gap-3">
              <a href="#" className="text-decoration-none text-muted small">
                <i className="bi bi-book me-1"></i>Documentation
              </a>
              <a href="https://github.com/dr-harper/jsonpaths" className="text-decoration-none text-muted small" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github me-1"></i>GitHub
              </a>
              <a href="#" className="text-decoration-none text-muted small">
                <i className="bi bi-life-preserver me-1"></i>Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;