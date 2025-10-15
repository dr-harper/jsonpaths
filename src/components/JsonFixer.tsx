import { useEffect, useMemo, useState } from 'react';

interface JsonFixerProps {
  darkMode?: boolean;
}

interface FixerResult {
  issues: string[];
  fixExplanation: string;
  fixedJson: string;
  notes?: string;
}

const DEFAULT_ISSUE_MESSAGE = 'No specific issues reported by the model.';

const JsonFixer = ({ darkMode }: JsonFixerProps) => {
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('gemini-api-key') || '');
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(() => !localStorage.getItem('gemini-api-key'));
  const [input, setInput] = useState<string>('');
  const [parseError, setParseError] = useState<string>('');
  const [isValidJson, setIsValidJson] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<FixerResult | null>(null);
  const [fixValidationError, setFixValidationError] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!input.trim()) {
      setParseError('');
      setIsValidJson(false);
      return;
    }

    try {
      JSON.parse(input);
      setParseError('');
      setIsValidJson(true);
    } catch (err) {
      setIsValidJson(false);
      setParseError(err instanceof Error ? err.message : 'Invalid JSON input.');
    }
  }, [input]);

  const callGeminiFixer = async (content: string, parsingIssue: string | null): Promise<string> => {
    if (!apiKey) {
      throw new Error('Gemini API key is required to use the JSON fixer.');
    }

    const parsingSummary = parsingIssue
      ? `The local JSON.parse error message was: ${parsingIssue}`
      : 'The text parsed successfully as JSON, but you should still check for logical issues or formatting improvements.';

    const prompt = `You are a meticulous JSON repair assistant. The user provided text might not be valid JSON. Your job is to:
1. Identify concrete issues that prevent it from being valid JSON.
2. Produce a corrected JSON version while preserving the original structure and intent.
3. Explain the adjustments you made.

Original JSON-like text:
${content}

Additional parsing context:
${parsingSummary}

Respond ONLY with a JSON object using this schema:
{
  "issues": ["List", "of", "specific", "problems"],
  "fixExplanation": "Short paragraph explaining the fix",
  "fixedJson": "The corrected JSON string, pretty-printed with two spaces",
  "notes": "Optional tips for the user"
}

Important rules:
- "fixedJson" must be valid JSON that can be parsed with JSON.parse.
- Use double quotes for all JSON keys and string values.
- Keep numeric and boolean values as numbers/booleans, not strings.
- If the original text is already valid JSON, keep it but explain why it's valid.
- Do not wrap your response in Markdown fences.`;

    const body = {
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    };

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const message = data?.error?.message || 'Unknown Gemini API error.';
      throw new Error(`Gemini API error (${response.status}): ${message}`);
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return jsonMatch ? jsonMatch[0] : text;
  };

  const normalizeResult = (raw: any): FixerResult => {
    const issuesSource = raw?.issues ?? raw?.problems ?? [];
    const issuesArray = Array.isArray(issuesSource)
      ? issuesSource
      : typeof issuesSource === 'string'
        ? [issuesSource]
        : [];

    let fixedJson = '';
    if (typeof raw?.fixedJson === 'string') {
      fixedJson = raw.fixedJson.trim();
    } else if (typeof raw?.fixedJSON === 'string') {
      fixedJson = raw.fixedJSON.trim();
    } else if (raw?.fixedJson && typeof raw.fixedJson === 'object') {
      fixedJson = JSON.stringify(raw.fixedJson, null, 2);
    } else if (raw?.fixedJSON && typeof raw.fixedJSON === 'object') {
      fixedJson = JSON.stringify(raw.fixedJSON, null, 2);
    }

    const explanation =
      typeof raw?.fixExplanation === 'string'
        ? raw.fixExplanation
        : typeof raw?.explanation === 'string'
          ? raw.explanation
          : 'The assistant did not provide a detailed explanation.';

    const notes = typeof raw?.notes === 'string' ? raw.notes : typeof raw?.tips === 'string' ? raw.tips : undefined;

    return {
      issues: issuesArray.length > 0 ? issuesArray : [DEFAULT_ISSUE_MESSAGE],
      fixExplanation: explanation,
      fixedJson,
      notes
    };
  };

  const handleFixJson = async () => {
    setError('');
    setResult(null);
    setFixValidationError('');

    if (!input.trim()) {
      setError('Please provide some JSON content to analyze.');
      return;
    }

    if (!apiKey) {
      setError('Gemini API key is required. Add it to continue.');
      setShowApiKeyInput(true);
      return;
    }

    setIsLoading(true);

    try {
      const parsingIssue = parseError || null;
      const responseText = await callGeminiFixer(input, parsingIssue);
      const parsed = JSON.parse(responseText);
      const normalized = normalizeResult(parsed);

      if (!normalized.fixedJson) {
        throw new Error('The AI response did not include a fixedJson field.');
      }

      try {
        JSON.parse(normalized.fixedJson);
        setFixValidationError('');
      } catch (fixErr) {
        setFixValidationError(
          fixErr instanceof Error
            ? `The returned fixed JSON could not be parsed: ${fixErr.message}`
            : 'The returned fixed JSON could not be parsed.'
        );
      }

      setResult(normalized);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process the JSON fixer response.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyFixedJson = async () => {
    if (!result?.fixedJson) return;
    try {
      await navigator.clipboard.writeText(result.fixedJson);
    } catch (err) {
      console.error('Failed to copy fixed JSON:', err);
    }
  };

  const parseStatus = useMemo(() => {
    if (!input.trim()) {
      return {
        type: 'info' as const,
        message: 'Paste JSON to validate and repair.'
      };
    }

    if (isValidJson) {
      return {
        type: 'success' as const,
        message: 'This is valid JSON. You can still run the fixer for formatting or suggestions.'
      };
    }

    return {
      type: 'danger' as const,
      message: `Invalid JSON: ${parseError}`
    };
  }, [input, isValidJson, parseError]);

  const fixedJsonClasses = darkMode
    ? 'bg-dark text-light border-secondary'
    : 'bg-light border';

  return (
    <div className="container-fluid p-3 w-100">
      <div className="row g-3">
        <div className="col-12 col-lg-5 d-flex">
          <div className="card w-100 shadow-sm d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-wrench-adjustable-circle me-2 text-primary"></i>
                  JSON Fixer
                </h6>
                <small className="text-muted">
                  Use AI to diagnose and repair malformed JSON snippets.
                </small>
              </div>
              <button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                className="btn btn-sm btn-outline-secondary"
                title="Configure Gemini API key"
              >
                <i className="bi bi-key"></i>
              </button>
            </div>
            <div className="card-body d-flex flex-column gap-3">
              {showApiKeyInput && (
                <div>
                  <small className="text-muted d-block mb-2">
                    <i className="bi bi-info-circle me-1"></i>
                    Get your API key from{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      Google AI Studio
                    </a>
                  </small>
                  <div className="input-group input-group-sm">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter your Gemini API key..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                    />
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => setShowApiKeyInput(false)}
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              <div className="flex-grow-1 d-flex flex-column">
                <label className="form-label fw-semibold">Problematic JSON</label>
                <textarea
                  className="form-control font-monospace"
                  style={{ minHeight: '260px', flexGrow: 1 }}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder='{"name": "Missing quote}'
                  spellCheck={false}
                />
                <div className={`alert alert-${parseStatus.type} mt-3 mb-0 py-2`} role="alert">
                  <small>{parseStatus.message}</small>
                </div>
              </div>

              <button
                className="btn btn-primary"
                onClick={handleFixJson}
                disabled={isLoading || !apiKey || !input.trim()}
              >
                {isLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Fixing JSON...
                  </>
                ) : (
                  <>
                    <i className="bi bi-magic me-2"></i>
                    Fix JSON with AI
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-7 d-flex">
          <div className="card w-100 shadow-sm d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-chat-left-text me-2 text-warning"></i>
                Comments & Changes
              </h6>
              {result?.fixedJson && (
                <button className="btn btn-sm btn-outline-secondary" onClick={handleCopyFixedJson}>
                  <i className="bi bi-clipboard-check me-1"></i>
                  Copy fixed JSON
                </button>
              )}
            </div>
            <div className="card-body overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
              {!result && !error && !isLoading && (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-braces display-4 mb-3"></i>
                  <p className="mb-1">Paste your JSON on the left to see comments and changes here.</p>
                  <small>The assistant will highlight issues and return a corrected version.</small>
                </div>
              )}

              {error && (
                <div className="alert alert-danger" role="alert">
                  <i className="bi bi-exclamation-octagon me-2"></i>
                  {error}
                </div>
              )}

              {isLoading && (
                <div className="text-center text-muted py-4">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-3">Asking Gemini to repair your JSON...</div>
                </div>
              )}

              {result && (
                <div className="d-flex flex-column gap-3">
                  <div className="alert alert-info mb-0" role="alert">
                    <h6 className="fw-semibold mb-2">
                      <i className="bi bi-chat-quote me-2"></i>
                      Comments
                    </h6>
                    <ul className="mb-0 ps-3">
                      {result.issues.map((issue, index) => (
                        <li key={index}>{issue}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="alert alert-success mb-0" role="alert">
                    <h6 className="fw-semibold mb-2">
                      <i className="bi bi-arrow-repeat me-2"></i>
                      Changes applied
                    </h6>
                    <p className="mb-0">{result.fixExplanation}</p>
                    {result.notes && <p className="mb-0 mt-2"><strong>Notes:</strong> {result.notes}</p>}
                  </div>

                  {fixValidationError && (
                    <div className="alert alert-warning" role="alert">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      {fixValidationError}
                    </div>
                  )}

                  <div>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h6 className="fw-semibold mb-0">Fixed JSON</h6>
                      <span className="badge bg-secondary">AI generated</span>
                    </div>
                    <pre
                      className={`${fixedJsonClasses} p-3 rounded`}
                      style={{ maxHeight: '400px', overflow: 'auto' }}
                    >{result.fixedJson}</pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JsonFixer;
