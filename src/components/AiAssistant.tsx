import { useState, useEffect } from 'react';
import { JSONPath } from 'jsonpath-plus';

interface AiAssistantProps {
  jsonData: any;
  selectedLanguages: Array<{id: string, name: string, icon: string, getExample: (path: string[]) => string}>;
  onShowLanguageSettings?: () => void;
}

interface QueryResult {
  explanation: string;
  jsonPath: string;
  reasoning: string;
  results: any[];
  codeExamples: Array<{language: string, icon: string, code: string}>;
  error?: string;
  jsonPathError?: string | null;
  requiresPostProcessing?: boolean;
  postProcessingNote?: string;
}

interface CachedQueryData {
  question: string;
  explanation: string;
  jsonPath: string;
  reasoning: string;
  results: any[];
  requiresPostProcessing: boolean;
  postProcessingNote?: string;
  jsonPathError?: string | null;
}

const buildCodeExamples = (
  cache: CachedQueryData,
  languages: AiAssistantProps['selectedLanguages']
): Array<{language: string, icon: string, code: string}> => {
  const { jsonPath, question } = cache;
  const questionLower = question.toLowerCase();

  return languages.map(lang => {
    const hasFilter = jsonPath.includes('?(@');
    const isComplexQuery =
      questionLower.includes('cheapest') ||
      questionLower.includes('most expensive') ||
      questionLower.includes('minimum price') ||
      questionLower.includes('maximum price');

    const handleComplexAggregation = (language: string): string | null => {
      if (!isComplexQuery || !jsonPath.includes('products[*]')) {
        return null;
      }

      switch (language) {
        case 'Python':
          if (questionLower.includes('cheapest') || questionLower.includes('minimum price')) {
            return `min(data['products'], key=lambda x: x.get('price', float('inf')))`;
          }
          if (questionLower.includes('most expensive') || questionLower.includes('maximum price')) {
            return `max(data['products'], key=lambda x: x.get('price', 0))`;
          }
          break;
        case 'JavaScript':
          if (questionLower.includes('cheapest') || questionLower.includes('minimum price')) {
            return `data.products.reduce((min, product) =>
    product.price < min.price ? product : min
)`;
          }
          if (questionLower.includes('most expensive') || questionLower.includes('maximum price')) {
            return `data.products.reduce((max, product) =>
    product.price > max.price ? product : max
)`;
          }
          break;
        case 'Swift':
          if (questionLower.includes('cheapest') || questionLower.includes('minimum price')) {
            return `data["products"]?.min {
    ($0["price"] as? Double ?? Double.infinity) <
    ($1["price"] as? Double ?? Double.infinity)
}`;
          }
          if (questionLower.includes('most expensive') || questionLower.includes('maximum price')) {
            return `data["products"]?.max {
    ($0["price"] as? Double ?? 0) <
    ($1["price"] as? Double ?? 0)
}`;
          }
          break;
        default:
          if (questionLower.includes('cheapest') || questionLower.includes('minimum price')) {
            return `// Find item with minimum price\n// Implementation varies by language`;
          }
          if (questionLower.includes('most expensive') || questionLower.includes('maximum price')) {
            return `// Find item with maximum price\n// Implementation varies by language`;
          }
          break;
      }

      return null;
    };

    const buildArrayIterationCode = (language: string, arrayPath: string, fieldPath?: string): string | null => {
      switch (language) {
        case 'Python':
          if (fieldPath) {
            const fieldAccess = fieldPath.split('.').map(f => `['${f}']`).join('');
            return `[item${fieldAccess} for item in data['${arrayPath}']]`;
          }
          return `data['${arrayPath}']`;
        case 'JavaScript':
          if (fieldPath) {
            const fieldAccess = fieldPath.split('.').map(f => `.${f}`).join('');
            return `data.${arrayPath}.map(item => item${fieldAccess})`;
          }
          return `data.${arrayPath}`;
        case 'Swift':
          if (fieldPath) {
            const fieldAccess = fieldPath.split('.').map(f => `["${f}"]`).join('');
            return `data["${arrayPath}"]?.compactMap { $0${fieldAccess} }`;
          }
          return `data["${arrayPath}"]`;
        default:
          return `// Iterate through ${arrayPath} array${fieldPath ? ` and access ${fieldPath}` : ''}`;
      }
    };

    const simplePathSegments = jsonPath
      .replace(/^\$\./, '')
      .replace(/\[(\d+)\]/g, '.$1')
      .replace(/\[\*\]/g, '')
      .split('.')
      .filter(Boolean);

    const generateCode = (): string => {
      if (!hasFilter) {
        const aggregationCode = handleComplexAggregation(lang.name);
        if (aggregationCode) {
          return aggregationCode;
        }

        if (jsonPath.includes('[*]')) {
          const pathMatch = jsonPath.match(/^\$\.(.+?)\[\*\](?:\.(.+))?$/);
          if (pathMatch) {
            const [, arrayPath, fieldPath] = pathMatch;
            const arrayCode = buildArrayIterationCode(lang.name, arrayPath, fieldPath);
            if (arrayCode) {
              return arrayCode;
            }
          }
        }

        return lang.getExample(simplePathSegments);
      }

      switch (lang.name) {
        case 'Python':
          if (jsonPath.includes('price > 100')) {
            return `[product['name'] for product in data['products'] if product['price'] > 100]`;
          }
          if (jsonPath.includes('inStock == true')) {
            return `[item for item in data['products'] if item.get('inStock') == True]`;
          }
          if (jsonPath.includes('products[*]')) {
            const aggregationCode = handleComplexAggregation('Python');
            if (aggregationCode) {
              return aggregationCode;
            }
            return `[item['name'] for item in data['products']]`;
          }
          return `# Filter products based on condition\n[item for item in data if condition(item)]`;
        case 'JavaScript':
          if (jsonPath.includes('price > 100')) {
            return `data.products.filter(product => product.price > 100).map(product => product.name)`;
          }
          if (jsonPath.includes('inStock == true')) {
            return `data.products.filter(item => item.inStock === true)`;
          }
          if (jsonPath.includes('products[*]')) {
            const aggregationCode = handleComplexAggregation('JavaScript');
            if (aggregationCode) {
              return aggregationCode;
            }
            return `data.products.map(item => item.name)`;
          }
          return `data.products.filter(item => /* condition */).map(item => item.property)`;
        case 'Swift':
          if (jsonPath.includes('price > 100')) {
            return `data["products"]?.compactMap { product in
    guard let price = product["price"] as? Double, price > 100 else { return nil }
    return product["name"] as? String
}`;
          }
          if (jsonPath.includes('inStock == true')) {
            return `data["products"]?.filter { ($0["inStock"] as? Bool) == true }`;
          }
          if (jsonPath.includes('products[*]')) {
            const aggregationCode = handleComplexAggregation('Swift');
            if (aggregationCode) {
              return aggregationCode;
            }
          }
          return `data["products"]?.filter { /* condition */ }`;
        default:
          const aggregationCode = handleComplexAggregation(lang.name);
          if (aggregationCode) {
            return aggregationCode;
          }
          const fallbackPath = jsonPath
            .replace(/^\$\./, '')
            .replace(/\[(\d+)\]/g, '.$1')
            .replace(/\[\?\([^\)]+\)\]/g, '[*]')
            .replace(/\[\*\]/g, '')
            .split('.')
            .filter(Boolean);
          return lang.getExample(fallbackPath);
      }
    };

    const code = generateCode();
    const finalCode = code || `// ${lang.name} code example would go here\n// JSONPath: ${jsonPath}`;

    return {
      language: lang.name,
      icon: lang.icon,
      code: finalCode
    };
  });
};

const AiAssistant = ({ jsonData, selectedLanguages, onShowLanguageSettings }: AiAssistantProps) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini-api-key') || '';
  });
  const [showApiKeyInput, setShowApiKeyInput] = useState(!apiKey);
  const [debugMode, setDebugMode] = useState(false);
  const [lastError, setLastError] = useState<any>(null);
  const [lastSuccessfulQuery, setLastSuccessfulQuery] = useState<string>('');
  const [lastSuccessfulJsonPath, setLastSuccessfulJsonPath] = useState<string>('');
  const [cachedQueryData, setCachedQueryData] = useState<CachedQueryData | null>(null);

  useEffect(() => {
    localStorage.setItem('gemini-api-key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    if (!cachedQueryData || !lastSuccessfulJsonPath || !lastSuccessfulQuery) {
      return;
    }

    if (selectedLanguages.length === 0) {
      return;
    }

    const updatedCodeExamples = buildCodeExamples(cachedQueryData, selectedLanguages);

    setResult(prev => {
      if (!prev) {
        return {
          explanation: cachedQueryData.explanation,
          jsonPath: cachedQueryData.jsonPath,
          reasoning: cachedQueryData.reasoning,
          results: cachedQueryData.results,
          codeExamples: updatedCodeExamples,
          jsonPathError: cachedQueryData.jsonPathError,
          requiresPostProcessing: cachedQueryData.requiresPostProcessing,
          postProcessingNote: cachedQueryData.postProcessingNote
        };
      }

      return {
        ...prev,
        codeExamples: updatedCodeExamples
      };
    });
  }, [cachedQueryData, lastSuccessfulJsonPath, lastSuccessfulQuery, selectedLanguages]);

  const generateDynamicQuestions = (data: any): string[] => {
    if (!data) return [];

    const questions: string[] = [];
    const dataStr = JSON.stringify(data).toLowerCase();

    // Price-related questions
    if (dataStr.includes('price')) {
      questions.push('Find all items with price greater than 100');
      questions.push('Get the cheapest products');
    }

    // Name-related questions
    if (dataStr.includes('name')) {
      questions.push('Extract all names from the data');
    }

    // Array-related questions
    if (hasArrays(data)) {
      questions.push('Show me all items in arrays');
      questions.push('Get the first item from each array');
    }

    // ID-related questions
    if (dataStr.includes('id')) {
      questions.push('Find all objects that have an id field');
    }

    // Email-related questions
    if (dataStr.includes('email') || dataStr.includes('@')) {
      questions.push('Extract all email addresses');
    }

    // Location-related questions
    if (dataStr.includes('location') || dataStr.includes('city') || dataStr.includes('address')) {
      questions.push('Get all location information');
    }

    // Boolean field questions
    if (dataStr.includes('true') || dataStr.includes('false')) {
      questions.push('Find all items where inStock is true');
    }

    // Fallback generic questions
    if (questions.length === 0) {
      questions.push('Show me all the keys in this data');
      questions.push('Get all nested objects');
      questions.push('Find the deepest nested values');
    }

    return questions.slice(0, 6); // Limit to 6 suggestions
  };

  const getAllKeys = (obj: any, keys: Set<string> = new Set()): string[] => {
    if (typeof obj === 'object' && obj !== null) {
      Object.keys(obj).forEach(key => {
        keys.add(key);
        getAllKeys(obj[key], keys);
      });
    }
    return Array.from(keys);
  };

  const hasArrays = (obj: any): boolean => {
    if (Array.isArray(obj)) return true;
    if (typeof obj === 'object' && obj !== null) {
      return Object.values(obj).some(hasArrays);
    }
    return false;
  };

  const dynamicQuestions = generateDynamicQuestions(jsonData);

  const executeJsonPath = (jsonPath: string) => {
    if (!jsonData) return [];
    try {
      return JSONPath({
        path: jsonPath,
        json: jsonData,
        resultType: 'all'
      });
    } catch (error) {
      return [];
    }
  };

  const callGeminiAPI = async (userQuestion: string): Promise<string> => {
    if (!apiKey) {
      throw new Error('Gemini API key is required');
    }

    const prompt = `You are a JSON data extraction expert. Given the following JSON data and question, provide:

1. A clear explanation of what we're looking for
2. The JSONPath expression to extract that data
3. A technical explanation of how the JSONPath works

IMPORTANT JSONPath Limitations:
- JSONPath cannot perform aggregation functions like min(), max(), sum(), avg()
- JSONPath cannot compare values across different array elements
- For questions asking for "cheapest", "most expensive", "best", etc., extract ALL relevant items and let the application handle the comparison
- Use simple comparison operators: ==, !=, <, >, <=, >=
- Valid filter examples: $.products[?(@.price > 50)], $.items[?(@.inStock == true)]
- Invalid examples: $.products[?(@.price == min($.products[*].price))], $.products[?(@.price == $.[*].price.min())]

For complex queries like "cheapest item", use a simple path like "$.products[*]" to get all items, then explain that the application will find the cheapest one from the results.

Format your response as JSON with this structure:
{
  "explanation": "Clear explanation of what we're looking for (avoid saying 'the user wants')",
  "jsonPath": "$.exact.jsonpath.expression",
  "reasoning": "Technical explanation of how this JSONPath expression works"
}

JSON Data:
${JSON.stringify(jsonData, null, 2)}

Question: "${userQuestion}"

Respond only with the JSON object, no additional text.`;

    const requestBody = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    if (debugMode) {
      console.log('🔍 Debug - API Request:', {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey.substring(0, 10)}...`,
        body: requestBody
      });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    const data = await response.json();

    if (debugMode) {
      console.log('🔍 Debug - API Response:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: data
      });
    }

    if (!response.ok) {
      const errorDetails = {
        status: response.status,
        statusText: response.statusText,
        data: data,
        message: data.error?.message || 'Unknown API error'
      };
      setLastError(errorDetails);
      throw new Error(`Gemini API error (${response.status}): ${data.error?.message || response.statusText}`);
    }

    const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    if (debugMode) {
      console.log('🔍 Debug - Parsed Response Text:', responseText);
    }

    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return jsonMatch[0];
      }
      return responseText;
    } catch (error) {
      if (debugMode) {
        console.log('🔍 Debug - JSON Parse Error:', error);
      }
      return responseText;
    }
  };

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return;

    setIsLoading(true);
    setResult(null);
    setCachedQueryData(null);
    setLastSuccessfulJsonPath('');
    setLastSuccessfulQuery('');

    try {
      if (!jsonData) {
        setResult({
          explanation: 'Please load some JSON data first before asking questions.',
          jsonPath: '',
          reasoning: '',
          results: [],
          codeExamples: [],
          error: 'No JSON data available'
        });
        return;
      }

      const response = await callGeminiAPI(question);
      const parsedResponse = JSON.parse(response);

      // Execute the JSONPath directly and get detailed results
      let pathResults: any[] = [];
      let jsonPathError: string | null = null;

      try {
        pathResults = executeJsonPath(parsedResponse.jsonPath);
      } catch (error) {
        jsonPathError = error instanceof Error ? error.message : 'Unknown JSONPath execution error';
        console.error('JSONPath execution error:', error);
      }

      let results = pathResults.map((r: any) => r.value);

      // Detect if post-processing is needed and what kind
      const questionLower = question.toLowerCase();
      let requiresPostProcessing = false;
      let postProcessingNote = '';

      if (results.length > 1 && (questionLower.includes('cheapest') || questionLower.includes('minimum price') || questionLower.includes('lowest price'))) {
        requiresPostProcessing = true;
        postProcessingNote = 'JSONPath retrieved all items, then JavaScript found the one with minimum price';
        // Find the item with the lowest price
        const cheapest = results.reduce((min, item) => {
          const currentPrice = item?.price || Infinity;
          const minPrice = min?.price || Infinity;
          return currentPrice < minPrice ? item : min;
        }, results[0]);
        results = cheapest ? [cheapest] : [];
      } else if (results.length > 1 && (questionLower.includes('most expensive') || questionLower.includes('maximum price') || questionLower.includes('highest price'))) {
        requiresPostProcessing = true;
        postProcessingNote = 'JSONPath retrieved all items, then JavaScript found the one with maximum price';
        // Find the item with the highest price
        const expensive = results.reduce((max, item) => {
          const currentPrice = item?.price || -Infinity;
          const maxPrice = max?.price || -Infinity;
          return currentPrice > maxPrice ? item : max;
        }, results[0]);
        results = expensive ? [expensive] : [];
      }

      const cachedPayload: CachedQueryData = {
        question,
        explanation: parsedResponse.explanation,
        jsonPath: parsedResponse.jsonPath,
        reasoning: parsedResponse.reasoning,
        results,
        requiresPostProcessing,
        postProcessingNote,
        jsonPathError
      };

      const codeExamples = buildCodeExamples(cachedPayload, selectedLanguages);

      setResult({
        explanation: cachedPayload.explanation,
        jsonPath: cachedPayload.jsonPath,
        reasoning: cachedPayload.reasoning,
        results: cachedPayload.results,
        codeExamples: codeExamples,
        jsonPathError: cachedPayload.jsonPathError,
        requiresPostProcessing: cachedPayload.requiresPostProcessing,
        postProcessingNote: cachedPayload.postProcessingNote
      });

      setCachedQueryData(cachedPayload);
      setLastSuccessfulQuery(question);
      setLastSuccessfulJsonPath(cachedPayload.jsonPath);

    } catch (error) {
      setLastError(error);
      let errorMsg = `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;

      if (debugMode && lastError) {
        errorMsg += `\n\nDebug Info:\n${JSON.stringify(lastError, null, 2)}`;
      }

      setResult({
        explanation: 'Failed to process your question',
        jsonPath: '',
        reasoning: '',
        results: [],
        codeExamples: [],
        error: errorMsg
      });
      setCachedQueryData(null);
      setLastSuccessfulJsonPath('');
      setLastSuccessfulQuery('');
    } finally {
      setIsLoading(false);
    }
  };

  const clearResult = () => {
    setResult(null);
    setQuery('');
    setLastSuccessfulQuery('');
    setLastSuccessfulJsonPath('');
    setCachedQueryData(null);
  };

  return (
    <div className="w-100 d-flex flex-column h-100">
      <div className="card-header">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="mb-0 fw-bold">
            <i className="bi bi-robot me-2 text-primary"></i>
            AI Path Finder
            <small className="text-muted fw-normal ms-2" style={{ fontSize: '0.75rem' }}>Get paths to your JSON data</small>
          </h6>
          <div className="d-flex gap-1">
            <button
              onClick={() => setDebugMode(!debugMode)}
              className={`btn btn-sm ${debugMode ? 'btn-warning' : 'btn-outline-secondary'}`}
              title={debugMode ? 'Disable Debug Mode' : 'Enable Debug Mode'}
            >
              <i className="bi bi-bug"></i>
            </button>
            <button
              onClick={() => setShowApiKeyInput(!showApiKeyInput)}
              className="btn btn-sm btn-outline-secondary"
              title="Configure API Key"
            >
              <i className="bi bi-key"></i>
            </button>
            <button
              onClick={clearResult}
              className="btn btn-sm btn-outline-secondary"
              title="Clear result"
            >
              <i className="bi bi-x-lg"></i>
            </button>
          </div>
        </div>
      </div>

      <div className="card-body d-flex flex-column p-0 overflow-hidden" style={{ flex: '1 1 auto' }}>
        {/* API Key Configuration */}
        {showApiKeyInput && (
          <div className="p-3 border-bottom bg-light">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-info-circle me-1"></i>
              Get your free API key from{' '}
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

        {/* Debug Mode Info */}
        {debugMode && (
          <div className="p-3 border-bottom bg-warning bg-opacity-10">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-bug-fill text-warning me-2"></i>
              <strong className="text-warning">Debug Mode Active</strong>
            </div>
            <small className="text-muted d-block mb-2">
              Debug information will be shown in console and error messages.
            </small>
            {lastError && (
              <details className="mt-2">
                <summary className="text-warning small cursor-pointer">Last Error Details</summary>
                <pre className="mt-2 p-2 bg-dark text-light rounded" style={{ fontSize: '10px', maxHeight: '150px', overflow: 'auto' }}>
                  {JSON.stringify(lastError, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Query Input */}
        <div className="p-3 border-bottom">
          <div className="input-group mb-2">
            <input
              type="text"
              className="form-control"
              placeholder={apiKey ? "Ask how to find specific data (e.g., 'get all user emails', 'find items over $50')" : "Configure API key first"}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(query)}
              disabled={!apiKey || isLoading}
            />
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit(query)}
              disabled={!apiKey || !query.trim() || isLoading}
            >
              {isLoading ? (
                <div className="spinner-border spinner-border-sm" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              ) : (
                <i className="bi bi-send"></i>
              )}
            </button>
          </div>

          {/* Dynamic Example Questions */}
          {dynamicQuestions.length > 0 && !result && (
            <div>
              <small className="text-muted d-block mb-2">
                <i className="bi bi-lightbulb me-1"></i>
                Example queries to find paths in your data:
              </small>
              <div className="d-flex flex-wrap gap-1">
                {dynamicQuestions.slice(0, 3).map((question, idx) => (
                  <button
                    key={idx}
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => handleSubmit(question)}
                    disabled={!apiKey || !jsonData || isLoading}
                    style={{ fontSize: '11px' }}
                  >
                    {question}
                  </button>
                ))}
              </div>
              {dynamicQuestions.length > 3 && (
                <details className="mt-2">
                  <summary className="text-muted small cursor-pointer">More suggestions...</summary>
                  <div className="d-flex flex-wrap gap-1 mt-1">
                    {dynamicQuestions.slice(3).map((question, idx) => (
                      <button
                        key={idx + 3}
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => handleSubmit(question)}
                        disabled={!apiKey || !jsonData || isLoading}
                        style={{ fontSize: '10px' }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Query Result */}
        <div className="flex-grow-1 p-3 overflow-auto" style={{ minHeight: 0, maxHeight: '100%' }}>
          {!result && !isLoading ? (
            <div className="text-center text-muted">
              <i className="bi bi-search display-4 mb-3"></i>
              <p className="mb-2">Ask me anything about your JSON data!</p>
              <small>Example: "Find all products with price higher than 50"</small>
            </div>
          ) : (
            <div>
              {isLoading && (
                <div className="text-center mb-3">
                  <div className="spinner-border spinner-border-sm text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <div className="mt-2 small text-muted">Processing your query...</div>
                </div>
              )}

              {result && (
                <div>
                  {result.error ? (
                    <div className="alert alert-danger">
                      <i className="bi bi-exclamation-triangle me-2"></i>
                      <pre className="mb-0" style={{ fontSize: '12px' }}>{result.error}</pre>
                    </div>
                  ) : (
                    <div>
                      {/* Explanation */}
                      <div className="mb-3">
                        <h6 className="text-primary mb-2">
                          <i className="bi bi-lightbulb me-2"></i>Explanation
                        </h6>
                        <p className="mb-0 small">{result.explanation}</p>
                      </div>

                      {/* JSONPath */}
                      {result.jsonPath && (
                        <div className="mb-3">
                          <h6 className="text-success mb-2">
                            <i className="bi bi-code-slash me-2"></i>JSONPath Query
                            {result.requiresPostProcessing && (
                              <span className="badge bg-warning text-dark ms-2" title={result.postProcessingNote}>
                                <i className="bi bi-gear me-1"></i>+ Processing
                              </span>
                            )}
                          </h6>
                          <div className="bg-dark text-white p-2 rounded">
                            <code className="text-info">{result.jsonPath}</code>
                          </div>
                          {result.requiresPostProcessing && result.postProcessingNote && (
                            <small className="text-muted d-block mt-1">
                              <i className="bi bi-info-circle me-1"></i>
                              {result.postProcessingNote}
                            </small>
                          )}
                        </div>
                      )}

                      {/* Code Examples - Always show if available */}
                      {result.codeExamples && result.codeExamples.length > 0 && (
                        <div className="mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-2">
                            <h6 className="text-secondary mb-0">
                              <i className="bi bi-code-slash me-2"></i>Code Examples
                            </h6>
                            <button
                              onClick={() => onShowLanguageSettings?.()}
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              style={{ fontSize: '11px', height: '22px' }}
                              title="Configure Languages"
                            >
                              <i className="bi bi-gear me-1" style={{ fontSize: '11px' }}></i>
                              Configure
                            </button>
                          </div>
                          <div className="border rounded">
                            {result.codeExamples.map((example, idx) => (
                              <div key={idx} className={`d-flex align-items-center justify-content-between p-2 ${idx > 0 ? 'border-top' : ''}`}>
                                <div className="d-flex align-items-center flex-grow-1">
                                  <span className="me-2" style={{ fontSize: '14px' }}>{example.icon}</span>
                                  <span className="fw-semibold small me-2" style={{ minWidth: '70px' }}>{example.language}:</span>
                                  <code className="text-break font-monospace flex-grow-1" style={{ fontSize: '11px', background: 'none' }}>
                                    {example.code}
                                  </code>
                                </div>
                                <button
                                  onClick={() => navigator.clipboard.writeText(example.code)}
                                  className="btn btn-sm btn-outline-primary py-0 px-1 ms-2"
                                  style={{ fontSize: '10px', height: '20px', minWidth: '20px' }}
                                  title="Copy to clipboard"
                                >
                                  <i className="bi bi-clipboard"></i>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Results - Always show JSONPath execution */}
                      <div className="mb-3">
                        <h6 className="text-warning mb-2">
                          <i className="bi bi-list-ul me-2"></i>JSONPath Results
                          {!result.jsonPathError && ` (${result.results.length})`}
                        </h6>
                        <div className="bg-light p-2 rounded border">
                          {result.jsonPathError ? (
                            <div className="text-danger">
                              <i className="bi bi-exclamation-triangle me-1"></i>
                              JSONPath Error: {result.jsonPathError}
                            </div>
                          ) : result.results.length === 0 ? (
                            <div className="text-muted">
                              <i className="bi bi-info-circle me-1"></i>
                              No results found - the JSONPath query returned an empty result set
                            </div>
                          ) : (
                            <pre className="mb-0" style={{ fontSize: '11px', maxHeight: '150px', overflow: 'auto' }}>
                              {JSON.stringify(result.results, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>

                      {/* Reasoning */}
                      {result.reasoning && (
                        <div>
                          <h6 className="text-info mb-2">
                            <i className="bi bi-info-circle me-2"></i>How it works
                          </h6>
                          <p className="mb-0 small text-muted">{result.reasoning}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AiAssistant;