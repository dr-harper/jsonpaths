import { useState, useEffect } from 'react';
import { JSONPath } from 'jsonpath-plus';

interface JsonPathQueryProps {
  jsonData: any;
  onResultsChange?: (paths: string[]) => void;
  darkMode?: boolean;
}

const JsonPathQuery = ({ jsonData, onResultsChange }: JsonPathQueryProps) => {
  const [query, setQuery] = useState<string>('$');
  const [results, setResults] = useState<any[]>([]);
  const [resultPaths, setResultPaths] = useState<string[]>([]);
  const [error, setError] = useState<string>('');
  const [showExamples, setShowExamples] = useState(false);

  const exampleQueries = [
    { query: '$', description: 'Root object' },
    { query: '$..*', description: 'All values' },
    { query: '$..name', description: 'All "name" fields' },
    { query: '$.user.profile', description: 'Specific path' },
    { query: '$.products[*]', description: 'All array items' },
    { query: '$.products[0]', description: 'First array item' },
    { query: '$.products[-1]', description: 'Last array item' },
    { query: '$.products[0:2]', description: 'Array slice' },
    { query: '$.products[?(@.price > 50)]', description: 'Filter by condition' },
    { query: '$.products[?(@.inStock == true)]', description: 'Filter boolean' },
    { query: '$..[?(@.id)]', description: 'All objects with "id" field' },
    { query: '$.products[*].name', description: 'Array item properties' },
  ];

  useEffect(() => {
    if (!jsonData || !query) {
      setResults([]);
      setResultPaths([]);
      setError('');
      return;
    }

    try {
      const result = JSONPath({
        path: query,
        json: jsonData,
        resultType: 'all'
      });

      if (result && result.length > 0) {
        const values = result.map((r: any) => r.value);
        const paths = result.map((r: any) => {
          // Convert JSONPath format to simple path array
          const pathStr = r.path;
          if (typeof pathStr === 'string') {
            return pathStr
              .replace(/^\$\./, '')
              .replace(/\[(\d+)\]/g, '.$1')
              .split('.')
              .filter(Boolean);
          }
          return [];
        });

        setResults(values);
        setResultPaths(paths);
        setError('');

        // Notify parent component about the paths
        if (onResultsChange) {
          onResultsChange(paths.map((p: string[]) => p.join('.')));
        }
      } else {
        setResults([]);
        setResultPaths([]);
        setError('No matches found');
        if (onResultsChange) {
          onResultsChange([]);
        }
      }
    } catch (err) {
      setError(`Invalid JSONPath: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setResults([]);
      setResultPaths([]);
      if (onResultsChange) {
        onResultsChange([]);
      }
    }
  }, [query, jsonData, onResultsChange]);

  const handleExampleClick = (exampleQuery: string) => {
    setQuery(exampleQuery);
    setShowExamples(false);
  };

  return (
    <div className="w-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-search me-2 text-primary"></i>
            JSONPath Query
          </h6>
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="btn btn-sm btn-outline-secondary"
            title="Show example queries"
          >
            <i className="bi bi-lightbulb me-1"></i>
            Examples
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Query Input */}
        <div className="mb-3">
          <div className="input-group">
            <span className="input-group-text">
              <i className="bi bi-terminal"></i>
            </span>
            <input
              type="text"
              className="form-control font-monospace"
              placeholder="Enter JSONPath query (e.g., $.user.name)"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {error && (
            <small className="text-danger d-block mt-1">
              <i className="bi bi-exclamation-circle me-1"></i>
              {error}
            </small>
          )}
        </div>

        {/* Examples Dropdown */}
        {showExamples && (
          <div className="mb-3 p-2 border rounded bg-light">
            <small className="text-muted d-block mb-2">Click an example to use it:</small>
            <div className="d-flex flex-column gap-1">
              {exampleQueries.map((example, idx) => (
                <button
                  key={idx}
                  className="btn btn-sm btn-outline-primary text-start"
                  onClick={() => handleExampleClick(example.query)}
                >
                  <code className="me-2">{example.query}</code>
                  <small className="text-muted">- {example.description}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <small className="fw-bold">
                Results: {results.length} match{results.length !== 1 ? 'es' : ''}
              </small>
            </div>
            <div className="border rounded p-2 bg-light" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {results.map((result, idx) => (
                <div key={idx} className="mb-2 p-2 bg-white rounded border">
                  <small className="text-muted d-block mb-1">
                    Path: <code>{Array.isArray(resultPaths[idx]) ? resultPaths[idx].join('.') : 'root'}</code>
                  </small>
                  <pre className="mb-0 text-break" style={{ fontSize: '12px', maxHeight: '100px', overflowY: 'auto' }}>
                    <code>
                      {typeof result === 'object'
                        ? JSON.stringify(result, null, 2)
                        : String(result)}
                    </code>
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Reference */}
        <details className="mt-3">
          <summary className="text-muted small cursor-pointer">
            <i className="bi bi-info-circle me-1"></i>
            JSONPath Syntax Reference
          </summary>
          <div className="mt-2 p-2 bg-light rounded small">
            <div className="row">
              <div className="col-6">
                <strong>Basic:</strong>
                <ul className="mb-0">
                  <li><code>$</code> - Root</li>
                  <li><code>.</code> - Child</li>
                  <li><code>..</code> - Recursive descent</li>
                  <li><code>*</code> - Wildcard</li>
                </ul>
              </div>
              <div className="col-6">
                <strong>Arrays:</strong>
                <ul className="mb-0">
                  <li><code>[n]</code> - Index</li>
                  <li><code>[start:end]</code> - Slice</li>
                  <li><code>[?()]</code> - Filter</li>
                  <li><code>[@.field]</code> - Current object</li>
                </ul>
              </div>
            </div>
          </div>
        </details>
      </div>
    </div>
  );
};

export default JsonPathQuery;