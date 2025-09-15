import { useState, useEffect } from 'react';

interface LanguageExamplesProps {
  path: string[];
  onLanguagesChange?: (languages: LanguageConfig[]) => void;
}

interface LanguageConfig {
  id: string;
  name: string;
  icon: string;
  enabled: boolean;
  getExample: (path: string[]) => string;
}

const LanguageExamples = ({ path, onLanguagesChange }: LanguageExamplesProps) => {
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
      { id: 'python', name: 'Python', icon: '🐍', enabled: true, getExample: (p: string[]) => generatePath(p, 'python') },
      { id: 'javascript', name: 'JavaScript', icon: '🟨', enabled: false, getExample: (p: string[]) => generatePath(p, 'javascript') },
      { id: 'ruby', name: 'Ruby', icon: '💎', enabled: false, getExample: (p: string[]) => generatePath(p, 'ruby') },
      { id: 'php', name: 'PHP', icon: '🐘', enabled: false, getExample: (p: string[]) => generatePath(p, 'php') },
      { id: 'java', name: 'Java', icon: '☕', enabled: false, getExample: (p: string[]) => generatePath(p, 'java') },
      { id: 'csharp', name: 'C#', icon: '🔷', enabled: false, getExample: (p: string[]) => generatePath(p, 'csharp') },
      { id: 'go', name: 'Go', icon: '🐹', enabled: false, getExample: (p: string[]) => generatePath(p, 'go') },
      { id: 'rust', name: 'Rust', icon: '🦀', enabled: false, getExample: (p: string[]) => generatePath(p, 'rust') },
      { id: 'swift', name: 'Swift', icon: '🐦', enabled: true, getExample: (p: string[]) => generatePath(p, 'swift') },
      { id: 'kotlin', name: 'Kotlin', icon: '🎯', enabled: false, getExample: (p: string[]) => generatePath(p, 'kotlin') },
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

    // Notify parent component of enabled languages
    if (onLanguagesChange) {
      onLanguagesChange(languages.filter(lang => lang.enabled));
    }
  }, [languages, onLanguagesChange]);

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
                <h6 className="card-title mb-3">Configure Displayed Languages</h6>
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
                        <span className="me-1">{lang.icon}</span>{lang.name}
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

      <div className="card-body overflow-auto" style={{ padding: '8px' }}>
        {path.length > 0 ? (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">Code examples:</small>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn btn-sm btn-outline-secondary px-2 py-0"
                style={{ fontSize: '9px', height: '18px' }}
              >
                <i className="bi bi-gear me-1" style={{ fontSize: '9px' }}></i>
                Configure
              </button>
            </div>
            {enabledLanguages.map(lang => {
              const example = lang.getExample(path);
              return (
                <div key={lang.id} className="d-flex align-items-center justify-content-between py-0 px-1" style={{ minHeight: '18px' }}>
                  <div className="d-flex align-items-center flex-grow-1">
                    <span className="me-1" style={{ fontSize: '12px' }}>{lang.icon}</span>
                    <span className="fw-semibold me-1" style={{ fontSize: '10px', minWidth: '50px' }}>{lang.name}:</span>
                    <code className="text-break font-monospace flex-grow-1" style={{ fontSize: '10px', background: 'none' }}>
                      {example}
                    </code>
                  </div>
                  <button
                    onClick={() => handleCopy(example, lang.id)}
                    className={`btn py-0 px-1 ms-1 ${
                      copied === lang.id
                        ? 'btn-success'
                        : 'btn-outline-primary'
                    }`}
                    style={{ fontSize: '8px', height: '16px', minWidth: '16px', border: 'none' }}
                    title="Copy to clipboard"
                  >
                    {copied === lang.id ? (
                      <i className="bi bi-check"></i>
                    ) : (
                      <i className="bi bi-clipboard"></i>
                    )}
                  </button>
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