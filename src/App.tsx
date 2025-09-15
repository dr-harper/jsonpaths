import { useState, useEffect } from 'react';
import LanguageExamples from './components/LanguageExamples';
import JsonTreeView from './components/JsonTreeView';
import AiAssistant from './components/AiAssistant';
import DocumentationModal from './components/DocumentationModal';

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
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterMode, setFilterMode] = useState<boolean>(true);
  const [viewMode] = useState<'tree' | 'compact' | 'raw'>('tree');
  const [selectedLanguages, setSelectedLanguages] = useState<Array<{id: string, name: string, icon: string, getExample: (path: string[]) => string}>>([]);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [showDocumentation, setShowDocumentation] = useState<boolean>(false);
  const [showLanguageSettings, setShowLanguageSettings] = useState<boolean>(false);
  const [textareaRef, setTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [lineNumbersRef, setLineNumbersRef] = useState<HTMLDivElement | null>(null);

  // Helper function to create language object with getExample function
  const createLanguageObject = (id: string, name: string, icon: string) => {
    const generatePath = (pathArray: string[], language: string): string => {
      if (pathArray.length === 0) {
        switch(language) {
          case 'python': return 'data';
          case 'javascript': return 'data';
          case 'ruby': return 'data';
          case 'php': return '$data';
          case 'java': return 'data';
          case 'csharp': return 'data';
          case 'go': return 'data';
          case 'rust': return 'data';
          case 'swift': return 'data';
          case 'kotlin': return 'data';
          default: return 'data';
        }
      }

      switch(language) {
        case 'python':
          return pathArray.reduce((acc, key) => {
            if (/^\d+$/.test(key)) {
              return `${acc}[${key}]`;
            } else {
              return `${acc}['${key}']`;
            }
          }, 'data');

        case 'javascript':
          return pathArray.reduce((acc, key) => {
            if (/^\d+$/.test(key)) {
              return `${acc}[${key}]`;
            } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
              return `${acc}.${key}`;
            } else {
              return `${acc}['${key}']`;
            }
          }, 'data');

        case 'swift':
          return pathArray.reduce((acc, key) => {
            if (/^\d+$/.test(key)) {
              return `${acc}[${key}]`;
            } else {
              return `${acc}["${key}"]`;
            }
          }, 'data');

        default:
          return `// ${language} path access: ${pathArray.join('.')}`;
      }
    };

    return {
      id,
      name,
      icon,
      getExample: (path: string[]) => generatePath(path, id)
    };
  };

  // Initialize language preferences
  useEffect(() => {
    // Load from localStorage or default to Python and Swift
    try {
      const saved = localStorage.getItem('selectedLanguages');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reconstruct with getExample functions
        const reconstructed = parsed.map((lang: any) => createLanguageObject(lang.id, lang.name, lang.icon));
        setSelectedLanguages(reconstructed);
        return;
      }
    } catch (error) {
      console.error('Failed to load language preferences:', error);
    }

    // Default to Python and Swift
    const defaultLanguages = [
      createLanguageObject('python', 'Python', '🐍'),
      createLanguageObject('swift', 'Swift', '🐦')
    ];
    setSelectedLanguages(defaultLanguages);

    // Save defaults to localStorage
    try {
      const toSave = defaultLanguages.map(lang => ({ id: lang.id, name: lang.name, icon: lang.icon }));
      localStorage.setItem('selectedLanguages', JSON.stringify(toSave));
    } catch (error) {
      console.error('Failed to save default language preferences:', error);
    }
  }, []);

  // Save language preferences to localStorage whenever they change
  useEffect(() => {
    if (selectedLanguages.length > 0) {
      try {
        const toSave = selectedLanguages.map(lang => ({ id: lang.id, name: lang.name, icon: lang.icon }));
        localStorage.setItem('selectedLanguages', JSON.stringify(toSave));
      } catch (error) {
        console.error('Failed to save language preferences:', error);
      }
    }
  }, [selectedLanguages]);

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

  // Sync scroll between textarea and line numbers
  const handleScroll = () => {
    if (textareaRef && lineNumbersRef) {
      lineNumbersRef.scrollTop = textareaRef.scrollTop;
    }
  };

  const handleJsonChange = (value: string) => {
    setJsonInput(value);
    if (!value.trim()) {
      setJsonData(null);
      setError('');
      setErrorLine(null);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      setJsonData(parsed);
      setError('');
      setErrorLine(null);
    } catch (e) {
      let errorMessage = 'Invalid JSON format';

      if (e instanceof SyntaxError && e.message) {
        // Try to extract position information from the error message
        const positionMatch = e.message.match(/position (\d+)/);
        const lineMatch = e.message.match(/line (\d+)/);

        if (positionMatch) {
          const position = parseInt(positionMatch[1]);
          const lines = value.substring(0, position).split('\n');
          const lineNumber = lines.length;
          const columnNumber = lines[lines.length - 1].length + 1;
          errorMessage = `JSON syntax error at line ${lineNumber}, column ${columnNumber}: ${e.message.split(' at ')[0]}`;
          setErrorLine(lineNumber);
        } else if (lineMatch) {
          const lineNumber = parseInt(lineMatch[1]);
          errorMessage = `JSON syntax error at ${e.message}`;
          setErrorLine(lineNumber);
        } else {
          errorMessage = `JSON syntax error: ${e.message}`;
          setErrorLine(null);
        }
      }

      setError(errorMessage);
      setJsonData(null);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is JSON
    if (!file.name.endsWith('.json') && file.type !== 'application/json') {
      setError('Please upload a valid JSON file');
      return;
    }

    // Check file size (limit to 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        setJsonInput(JSON.stringify(parsed, null, 2));
        setJsonData(parsed);
        setError('');
      } catch (err) {
        setError('Failed to parse JSON file. Please check the file format.');
        setJsonData(null);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsText(file);

    // Reset the input so the same file can be uploaded again if needed
    event.target.value = '';
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
            <div className="d-flex flex-column">
              <div>
                <i className="bi bi-braces me-2"></i>
                JSON Assistant
              </div>
              <small className="text-light opacity-75" style={{ fontSize: '0.75rem', fontWeight: 'normal' }}>
                Explore, query, and extract data with AI assistance
              </small>
            </div>
          </a>
          <div className="d-flex align-items-center gap-2">
            <button
              onClick={() => setShowDocumentation(true)}
              className="btn btn-sm btn-outline-light rounded-circle p-0"
              style={{ width: '32px', height: '32px' }}
              title="Documentation & Help"
            >
              <i className="bi bi-question-circle-fill"></i>
            </button>
            <button
              onClick={() => setShowLanguageSettings(!showLanguageSettings)}
              className="btn btn-sm btn-light text-primary rounded-pill px-2 d-flex align-items-center"
              style={{ height: '32px' }}
              title={`${selectedLanguages.length} language${selectedLanguages.length !== 1 ? 's' : ''} selected for code examples`}
            >
              <i className="bi bi-code-slash me-1"></i>
              <span className="badge bg-primary rounded-pill">{selectedLanguages.length}</span>
            </button>
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
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-fill d-flex overflow-auto">
        <div className="container-fluid p-3 d-flex">
          <div className="row g-3 flex-fill">
            {/* JSON Input Card */}
            <div className="col-12 col-md-6 col-lg-3 mb-3 mb-lg-0 d-flex">
              <div className="card w-100 shadow-sm d-flex flex-column" style={{ height: 'calc(100vh - 160px)' }}>
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-code-square me-2 text-primary"></i>
                      JSON Input
                    </h6>
                    <div className="btn-group btn-group-sm" role="group">
                      <button
                        onClick={loadSample}
                        className="btn btn-primary"
                        title="Load sample JSON"
                      >
                        <i className="bi bi-download me-1"></i>
                        Sample
                      </button>
                      <label className="btn btn-outline-primary" title="Upload JSON file">
                        <i className="bi bi-upload me-1"></i>
                        Upload
                        <input
                          type="file"
                          className="d-none"
                          accept=".json,application/json"
                          onChange={handleFileUpload}
                        />
                      </label>
                      <button
                        onClick={() => handleJsonChange('')}
                        className="btn btn-outline-primary"
                        title="Clear all content"
                      >
                        <i className="bi bi-x-lg me-1"></i>
                        Clear
                      </button>
                    </div>
                  </div>
                </div>
                <div className="card-body d-flex flex-column overflow-hidden flex-fill">
                  <div className="d-flex border rounded overflow-hidden flex-fill">
                    {/* Line numbers column */}
                    <div
                      ref={setLineNumbersRef}
                      className="text-muted text-end pe-2 py-2 border-end"
                      style={{
                        minWidth: '40px',
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        fontFamily: 'monospace',
                        backgroundColor: 'rgba(0,0,0,0.03)',
                        height: '100%',
                        overflowY: 'hidden',
                        overflowX: 'hidden'
                      }}
                    >
                      {(jsonInput || ' ').split('\n').map((_, index) => (
                        <div
                          key={index}
                          className="d-flex align-items-center justify-content-end"
                          style={{
                            height: '1.4rem',
                            backgroundColor: errorLine === index + 1 ? 'rgba(220, 53, 69, 0.1)' : 'transparent'
                          }}
                        >
                          {errorLine === index + 1 && (
                            <i className="bi bi-exclamation-triangle-fill text-danger me-1" style={{ fontSize: '0.7rem' }}></i>
                          )}
                          <span>{index + 1}</span>
                        </div>
                      ))}
                    </div>

                    {/* Text input area */}
                    <textarea
                      ref={setTextareaRef}
                      value={jsonInput}
                      onChange={(e) => handleJsonChange(e.target.value)}
                      onScroll={handleScroll}
                      placeholder="Paste or type your JSON here..."
                      className="flex-fill border-0 font-monospace h-100"
                      style={{
                        fontSize: '0.875rem',
                        lineHeight: '1.4',
                        padding: '0.5rem',
                        resize: 'none',
                        outline: 'none',
                        backgroundColor: 'transparent'
                      }}
                      spellCheck={false}
                    />
                  </div>
                  {error && (
                    <div className="alert alert-danger py-2 mt-3 mb-0 d-flex align-items-center" role="alert">
                      <i className="bi bi-exclamation-triangle-fill me-2"></i>
                      <small>{error}</small>
                    </div>
                  )}
                  {!error && jsonInput && (
                    <div className="alert alert-success py-2 mt-3 mb-0 d-flex align-items-center" role="alert">
                      <i className="bi bi-check-circle-fill me-2"></i>
                      <small>Valid JSON</small>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Structure View */}
            <div className="col-12 col-md-6 col-lg-4 mb-3 mb-lg-0 d-flex">
              <div className="card w-100 shadow-sm d-flex flex-column">
                <div className="card-header">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 fw-bold">
                      <i className="bi bi-diagram-3 me-2 text-primary"></i>
                      Structure View
                    </h6>
                    <div className="d-flex gap-2">
                      {/* Search input */}
                      <div className="input-group input-group-sm" style={{ width: '200px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button
                          onClick={() => setFilterMode(!filterMode)}
                          className={`btn ${filterMode ? 'btn-primary' : 'btn-outline-secondary'}`}
                          title={filterMode ? 'Show all (disable filter)' : 'Show only matches (enable filter)'}
                        >
                          <i className="bi bi-funnel"></i>
                        </button>
                        <span className="input-group-text">
                          <i className="bi bi-search"></i>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="card-body overflow-hidden d-flex flex-column" style={{ height: 'calc(100vh - 230px)' }}>
                  {jsonData ? (
                    <>
                      <div className="flex-grow-1 overflow-auto mb-3">
                        <JsonTreeView
                          data={jsonData}
                          onPathSelect={setSelectedPath}
                          searchTerm={searchTerm}
                          viewMode={viewMode}
                          filterMode={filterMode}
                        />
                      </div>

                      {/* Language Examples at bottom */}
                      <div className="border-top pt-3 flex-shrink-0" style={{ maxHeight: '200px', overflow: 'hidden' }}>
                        {selectedPath.length > 0 ? (
                          <div>
                            <small className="text-muted d-block mb-2">
                              <i className="bi bi-cursor me-1"></i>
                              Selected: <code>{selectedPath.join('.')}</code>
                            </small>
                            <div style={{ maxHeight: '150px', overflow: 'auto' }}>
                              <LanguageExamples
                                path={selectedPath}
                                onLanguagesChange={setSelectedLanguages}
                                onShowLanguageSettings={() => setShowLanguageSettings(true)}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted py-3">
                            <i className="bi bi-hand-index display-6 mb-2"></i>
                            <p className="mb-1 small">Click any item above</p>
                            <small>to see code examples for accessing that data</small>
                          </div>
                        )}
                      </div>
                    </>
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

            {/* AI Assistant Panel */}
            <div className="col-12 col-md-12 col-lg-5 d-flex">
              <div className="card w-100 shadow-sm d-flex flex-column" style={{ height: 'calc(100vh - 160px)' }}>
                <AiAssistant
                  jsonData={jsonData}
                  selectedLanguages={selectedLanguages}
                  onLanguagesChange={setSelectedLanguages}
                  onShowLanguageSettings={() => setShowLanguageSettings(true)}
                />
               </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${darkMode ? 'bg-secondary' : 'bg-light'} border-top py-2`}>
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <small className="text-muted">
              © {new Date().getFullYear()} JSON Assistant by{' '}
              <a href="https://github.com/dr-harper" className="text-decoration-none text-muted" target="_blank" rel="noopener noreferrer">
                Mikey Harper
              </a>
            </small>
            <div className="d-flex gap-3 align-items-center">
              <small className="text-muted">v1.0.0</small>
              <a href="https://github.com/dr-harper/jsonpaths" className="text-decoration-none text-muted small" target="_blank" rel="noopener noreferrer">
                <i className="bi bi-github me-1"></i>GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Language Settings Modal */}
      {showLanguageSettings && (
        <>
          {/* Backdrop */}
          <div
            className="modal-backdrop fade show"
            style={{ zIndex: 1040 }}
            onClick={() => setShowLanguageSettings(false)}
          ></div>

          {/* Modal */}
          <div
            className={`modal fade show d-block ${darkMode ? 'dark-mode' : ''}`}
            style={{ zIndex: 1050 }}
            tabIndex={-1}
            onClick={(e) => {
              // Close modal if clicking outside the modal content
              if (e.target === e.currentTarget) {
                setShowLanguageSettings(false);
              }
            }}
          >
            <div className="modal-dialog modal-dialog-centered">
              <div className={`modal-content ${darkMode ? 'bg-dark text-light' : ''}`}>
                <div className={`modal-header ${darkMode ? 'border-secondary' : ''}`}>
                  <h5 className={`modal-title ${darkMode ? 'text-light' : ''}`}>
                    <i className="bi bi-code me-2 text-primary"></i>
                    Configure Code Example Languages
                  </h5>
                  <button
                    type="button"
                    className={`btn-close ${darkMode ? 'btn-close-white' : ''}`}
                    onClick={() => setShowLanguageSettings(false)}
                    aria-label="Close"
                  ></button>
                </div>
                <div className="modal-body">
                  <p className={`small mb-3 ${darkMode ? 'text-light opacity-75' : 'text-muted'}`}>
                    Select which programming languages to show in code examples across the application:
                  </p>
                  <div className="row g-3">
                    {[
                      { id: 'python', name: 'Python', icon: '🐍' },
                      { id: 'javascript', name: 'JavaScript', icon: '🟨' },
                      { id: 'swift', name: 'Swift', icon: '🐦' },
                      { id: 'ruby', name: 'Ruby', icon: '💎' },
                      { id: 'php', name: 'PHP', icon: '🐘' },
                      { id: 'java', name: 'Java', icon: '☕' },
                      { id: 'csharp', name: 'C#', icon: '🔷' },
                      { id: 'go', name: 'Go', icon: '🐹' },
                      { id: 'rust', name: 'Rust', icon: '🦀' },
                      { id: 'kotlin', name: 'Kotlin', icon: '🎯' }
                    ].map(lang => {
                      const isSelected = selectedLanguages.some(selected => selected.id === lang.id);
                      return (
                        <div key={lang.id} className="col-6">
                          <div className={`form-check ${isSelected ? 'text-primary' : ''}`}>
                            <input
                              className="form-check-input rounded-0"
                              type="checkbox"
                              checked={isSelected}
                              style={{
                                borderRadius: '2px',
                                width: '18px',
                                height: '18px',
                                marginTop: '2px',
                                backgroundColor: darkMode && !isSelected ? '#2b2b2b' : '',
                                borderColor: darkMode ? '#6c757d' : '#ced4da'
                              }}
                              onChange={() => {
                                const isCurrentlySelected = selectedLanguages.some(selected => selected.id === lang.id);
                                let newLanguages;

                                if (isCurrentlySelected) {
                                  // Remove the language
                                  newLanguages = selectedLanguages.filter(selected => selected.id !== lang.id);
                                } else {
                                  // Add the language
                                  const newLang = createLanguageObject(lang.id, lang.name, lang.icon);
                                  newLanguages = [...selectedLanguages, newLang];
                                }

                                setSelectedLanguages(newLanguages);
                              }}
                              id={`navbar-lang-${lang.id}`}
                            />
                            <label
                              className={`form-check-label ms-2 ${darkMode ? 'text-light' : ''}`}
                              htmlFor={`navbar-lang-${lang.id}`}
                              style={{ cursor: 'pointer' }}
                            >
                              <span className="me-2">{lang.icon}</span>
                              {lang.name}
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className={`mt-3 p-2 rounded ${darkMode ? 'bg-secondary bg-opacity-25' : 'bg-light'}`}>
                    <small className={darkMode ? 'text-light opacity-75' : 'text-muted'}>
                      <i className="bi bi-info-circle me-1"></i>
                      <strong>Selected: {selectedLanguages.length}</strong> -
                      Changes apply to both Structure View and AI Assistant panels.
                    </small>
                  </div>
                </div>
                <div className={`modal-footer ${darkMode ? 'border-secondary' : ''}`}>
                  <button
                    type="button"
                    className={`btn ${darkMode ? 'btn-outline-secondary' : 'btn-secondary'}`}
                    onClick={() => setShowLanguageSettings(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Documentation Modal */}
      <DocumentationModal
        isOpen={showDocumentation}
        onClose={() => setShowDocumentation(false)}
      />
    </div>
  );
}

export default App;