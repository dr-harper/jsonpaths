import { useState } from 'react';

interface LanguageExamplesProps {
  path: string[];
  selectedLanguages: LanguageOption[];
  onShowLanguageSettings?: () => void;
}

interface LanguageOption {
  id: string;
  name: string;
  icon: string;
  getExample: (path: string[]) => string;
}

const LanguageExamples = ({ path, selectedLanguages, onShowLanguageSettings }: LanguageExamplesProps) => {
  const [copied, setCopied] = useState<string | null>(null);

  const handleConfigureClick = () => {
    if (onShowLanguageSettings) {
      onShowLanguageSettings();
    }
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

  return (
    <div className="d-flex flex-column h-100">
      <div className="card-body overflow-auto" style={{ padding: '8px' }}>
        {path.length > 0 ? (
          <div className="d-flex flex-column gap-1">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <small className="text-muted">
                {selectedLanguages.length > 0
                  ? 'Code examples:'
                  : 'No languages selected'}
              </small>
              {onShowLanguageSettings && (
                <button
                  onClick={handleConfigureClick}
                  className="btn btn-sm btn-outline-secondary px-2 py-0"
                  style={{ fontSize: '9px', height: '18px' }}
                >
                  <i className="bi bi-gear me-1" style={{ fontSize: '9px' }}></i>
                  Configure
                </button>
              )}
            </div>
            {selectedLanguages.length > 0 ? (
              selectedLanguages.map(lang => {
                const example = lang.getExample(path);
                return (
                  <div
                    key={lang.id}
                    className="d-flex align-items-center justify-content-between py-0 px-1"
                    style={{ minHeight: '18px' }}
                  >
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
              })
            ) : (
              <div className="text-center text-muted py-2">
                <small style={{ fontSize: '10px' }}>
                  Choose languages in the settings menu to view examples.
                </small>
              </div>
            )}
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