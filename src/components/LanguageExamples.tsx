import { useState, useEffect } from 'react';

interface LanguageExamplesProps {
  path: string[];
}

interface LanguageConfig {
  id: string;
  name: string;
  enabled: boolean;
  getExample: (path: string[]) => string;
}

const LanguageExamples = ({ path }: LanguageExamplesProps) => {
  const [showSettings, setShowSettings] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

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

      case 'ruby':
        return pathArray.reduce((acc, key) => {
          if (/^\d+$/.test(key)) {
            return `${acc}[${key}]`;
          } else {
            return `${acc}['${key}']`;
          }
        }, 'data');

      case 'php':
        return pathArray.reduce((acc, key) => {
          if (/^\d+$/.test(key)) {
            return `${acc}[${key}]`;
          } else {
            return `${acc}['${key}']`;
          }
        }, '$data');

      case 'java':
        return pathArray.reduce((acc, key, index) => {
          if (index === 0) {
            return `data.get("${key}")`;
          }
          if (/^\d+$/.test(key)) {
            return `${acc}.get(${key})`;
          } else {
            return `${acc}.get("${key}")`;
          }
        }, 'data');

      case 'csharp':
        return pathArray.reduce((acc, key) => {
          if (/^\d+$/.test(key)) {
            return `${acc}[${key}]`;
          } else {
            return `${acc}["${key}"]`;
          }
        }, 'data');

      case 'go':
        return pathArray.reduce((acc, key) => {
          if (/^\d+$/.test(key)) {
            return `${acc}[${key}]`;
          } else {
            return `${acc}["${key}"]`;
          }
        }, 'data');

      case 'rust':
        return pathArray.reduce((acc, key, index) => {
          if (index === 0) {
            if (/^\d+$/.test(key)) {
              return `data.get(${key})`;
            } else {
              return `data.get("${key}")`;
            }
          }
          if (/^\d+$/.test(key)) {
            return `${acc}?.get(${key})`;
          } else {
            return `${acc}?.get("${key}")`;
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

      case 'kotlin':
        return pathArray.reduce((acc, key) => {
          if (/^\d+$/.test(key)) {
            return `${acc}[${key}]`;
          } else {
            return `${acc}["${key}"]`;
          }
        }, 'data');

      default:
        return '';
    }
  };

  // Load saved preferences from localStorage
  const loadSavedPreferences = (): Record<string, boolean> => {
    try {
      const saved = localStorage.getItem('languagePreferences');
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Failed to load preferences:', error);
      return {};
    }
  };

  const [languages, setLanguages] = useState<LanguageConfig[]>(() => {
    const savedPrefs = loadSavedPreferences();
    const defaultLanguages = [
      { id: 'python', name: 'Python', enabled: true, getExample: (p: string[]) => generatePath(p, 'python') },
      { id: 'javascript', name: 'JavaScript', enabled: true, getExample: (p: string[]) => generatePath(p, 'javascript') },
      { id: 'ruby', name: 'Ruby', enabled: true, getExample: (p: string[]) => generatePath(p, 'ruby') },
      { id: 'php', name: 'PHP', enabled: true, getExample: (p: string[]) => generatePath(p, 'php') },
      { id: 'java', name: 'Java', enabled: false, getExample: (p: string[]) => generatePath(p, 'java') },
      { id: 'csharp', name: 'C#', enabled: false, getExample: (p: string[]) => generatePath(p, 'csharp') },
      { id: 'go', name: 'Go', enabled: false, getExample: (p: string[]) => generatePath(p, 'go') },
      { id: 'rust', name: 'Rust', enabled: false, getExample: (p: string[]) => generatePath(p, 'rust') },
      { id: 'swift', name: 'Swift', enabled: false, getExample: (p: string[]) => generatePath(p, 'swift') },
      { id: 'kotlin', name: 'Kotlin', enabled: false, getExample: (p: string[]) => generatePath(p, 'kotlin') },
    ];

    // Apply saved preferences if they exist
    return defaultLanguages.map(lang => ({
      ...lang,
      enabled: savedPrefs[lang.id] !== undefined ? savedPrefs[lang.id] : lang.enabled
    }));
  });

  // Save preferences to localStorage whenever languages change
  useEffect(() => {
    const preferences: Record<string, boolean> = {};
    languages.forEach(lang => {
      preferences[lang.id] = lang.enabled;
    });
    try {
      localStorage.setItem('languagePreferences', JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [languages]);

  const toggleLanguage = (id: string) => {
    setLanguages(prev => prev.map(lang =>
      lang.id === id ? { ...lang, enabled: !lang.enabled } : lang
    ));
  };

  const handleCopy = async (text: string, langId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(langId);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const enabledLanguages = languages.filter(lang => lang.enabled);

  return (
    <div className="d-flex flex-column h-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-code-slash me-2 text-primary"></i>
            Language Examples
          </h6>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="btn btn-sm btn-outline-secondary rounded-circle p-0"
            style={{ width: '28px', height: '28px' }}
            aria-label="Settings"
          >
            <i className="bi bi-gear" style={{ fontSize: '14px' }}></i>
          </button>
        </div>
      </div>

      {showSettings && (
        <>
          <div
            className="position-fixed top-0 start-0 w-100 h-100 bg-dark bg-opacity-25"
            style={{ zIndex: 1040 }}
            onClick={() => setShowSettings(false)}
          />
          <div className="position-absolute top-0 end-0 mt-5 me-3" style={{ zIndex: 1050 }}>
            <div className="card shadow-lg" style={{ width: '250px' }}>
              <div className="card-body">
                <h6 className="card-title mb-3">Select Languages</h6>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {languages.map(lang => (
                    <div key={lang.id} className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id={`lang-${lang.id}`}
                        checked={lang.enabled}
                        onChange={() => toggleLanguage(lang.id)}
                      />
                      <label className="form-check-label" htmlFor={`lang-${lang.id}`}>
                        {lang.name}
                      </label>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-sm btn-secondary w-100 mt-3"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="card-body overflow-auto" style={{ padding: '12px' }}>
        {path.length > 0 ? (
          <div className="d-flex flex-column gap-2">
            {enabledLanguages.map(lang => {
              const example = lang.getExample(path);
              return (
                <div key={lang.id} className="border rounded p-3 bg-light">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold">{lang.name}</span>
                    <button
                      onClick={() => handleCopy(example, lang.id)}
                      className={`btn btn-sm py-0 px-2 ${
                        copied === lang.id
                          ? 'btn-success'
                          : 'btn-outline-primary'
                      }`}
                      style={{ fontSize: '12px', height: '24px' }}
                    >
                      {copied === lang.id ? (
                        <>
                          <i className="bi bi-check me-1"></i>
                          Copied
                        </>
                      ) : (
                        <>
                          <i className="bi bi-clipboard me-1"></i>
                          Copy
                        </>
                      )}
                    </button>
                  </div>
                  <div className="bg-white p-2 rounded border">
                    <code className="text-break font-monospace" style={{ fontSize: '13px' }}>
                      {example}
                    </code>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center text-muted py-5">
            <i className="bi bi-code-slash display-3 mb-3"></i>
            <p className="mb-1 small">Select a field to see extraction examples</p>
            <small style={{ fontSize: '11px' }}>in different languages</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageExamples;