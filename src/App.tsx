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
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    const lightTheme = document.getElementById('bootstrap-theme') as HTMLLinkElement;
    const darkTheme = document.getElementById('bootstrap-theme-dark') as HTMLLinkElement;

    if (darkMode) {
      lightTheme.disabled = true;
      darkTheme.disabled = false;
      document.documentElement.setAttribute('data-bs-theme', 'dark');
      document.body.classList.add('bg-dark', 'text-light');
    } else {
      lightTheme.disabled = false;
      darkTheme.disabled = true;
      document.documentElement.removeAttribute('data-bs-theme');
      document.body.classList.remove('bg-dark', 'text-light');
    }

    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

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
    } catch (e) {
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


  const renderJsonTree = (data: JsonData, path: string[] = [], level: number = 0) => {
    const indent = level * 20;

    if (data === null) {
      return <span className="text-muted">null</span>;
    }

    if (typeof data === 'boolean') {
      return <span className="text-primary fw-medium">{String(data)}</span>;
    }

    if (typeof data === 'number') {
      return <span className="text-primary fw-medium">{data}</span>;
    }

    if (typeof data === 'string') {
      const truncated = data.length > 60 ? data.substring(0, 60) + '...' : data;
      return <span className="text-success" title={data}>"{truncated}"</span>;
    }

    if (Array.isArray(data)) {
      return (
        <div style={{ marginLeft: indent }}>
          <span className="text-secondary">[</span>
          {data.map((item, index) => (
            <div key={index} className="my-1">
              <span
                className="text-dark hover-primary cursor-pointer px-1 py-0 rounded"
                onClick={() => setSelectedPath([...path, String(index)])}
                style={{ cursor: 'pointer' }}
              >
                {index}:
              </span>{' '}
              {renderJsonTree(item, [...path, String(index)], level + 1)}
            </div>
          ))}
          <span className="text-secondary">]</span>
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      return (
        <div style={{ marginLeft: indent }}>
          <span className="text-secondary">{'{'}</span>
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="my-1">
              <span
                className="text-dark hover-primary cursor-pointer px-1 py-0 rounded"
                onClick={() => setSelectedPath([...path, key])}
                style={{ cursor: 'pointer' }}
              >
                "{key}":
              </span>{' '}
              {renderJsonTree(val, [...path, key], level + 1)}
            </div>
          ))}
          <span className="text-secondary">{'}'}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={`d-flex flex-column vh-100 ${darkMode ? 'bg-dark' : 'bg-light'}`}>
      {/* Bootstrap Navbar */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container-fluid">
          <a className="navbar-brand fw-bold" href="#">
            <i className="bi bi-braces me-2"></i>
            JSON Path Navigator
          </a>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn btn-sm btn-outline-light rounded-circle p-0"
              style={{ width: '32px', height: '32px' }}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <i className="bi bi-sun-fill"></i>
              ) : (
                <i className="bi bi-moon-fill"></i>
              )}
            </button>
            <span className={`badge ${darkMode ? 'bg-dark text-light' : 'bg-light text-primary'}`}>v1.0.0</span>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-fill d-flex overflow-auto">
        <div className="container-fluid p-3 d-flex">
          <div className="row g-3 flex-fill">
            {/* JSON Input Card */}
            <div className="col-12 col-md-6 col-lg-4 mb-3 mb-lg-0 d-flex">
              <div className="card w-100 shadow-sm d-flex flex-column">
                <div className={`card-header ${darkMode ? 'bg-dark' : 'bg-white'}`}>
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
              <div className="card w-100 shadow-sm d-flex flex-column">
                <div className={`card-header ${darkMode ? 'bg-dark' : 'bg-white'}`}>
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
              <div className="card w-100 shadow-sm d-flex flex-column">
                <LanguageExamples path={selectedPath} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-dark' : 'bg-white'} border-top py-3`}>
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