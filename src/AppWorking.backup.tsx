import { useState } from 'react';
import LanguageExamples from './components/LanguageExamples';

type JsonData =
  | null
  | boolean
  | number
  | string
  | JsonData[]
  | { [key: string]: JsonData };

function AppWorking() {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [jsonData, setJsonData] = useState<JsonData | null>(null);
  const [selectedPath, setSelectedPath] = useState<string[]>([]);
  const [error, setError] = useState<string>('');

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
      return <span className="text-gray-500">null</span>;
    }

    if (typeof data === 'boolean') {
      return <span className="text-blue-600 font-medium">{String(data)}</span>;
    }

    if (typeof data === 'number') {
      return <span className="text-blue-600 font-medium">{data}</span>;
    }

    if (typeof data === 'string') {
      const truncated = data.length > 60 ? data.substring(0, 60) + '...' : data;
      return <span className="text-green-700" title={data}>"{truncated}"</span>;
    }

    if (Array.isArray(data)) {
      return (
        <div style={{ marginLeft: indent }}>
          <span className="text-gray-600">[</span>
          {data.map((item, index) => (
            <div key={index} className="my-1">
              <span
                className="text-gray-700 hover:text-blue-600 cursor-pointer px-1 py-0.5 hover:bg-gray-50 rounded"
                onClick={() => setSelectedPath([...path, String(index)])}
              >
                {index}:
              </span>{' '}
              {renderJsonTree(item, [...path, String(index)], level + 1)}
            </div>
          ))}
          <span className="text-gray-600">]</span>
        </div>
      );
    }

    if (typeof data === 'object' && data !== null) {
      return (
        <div style={{ marginLeft: indent }}>
          <span className="text-gray-600">{'{'}</span>
          {Object.entries(data).map(([key, val]) => (
            <div key={key} className="my-1">
              <span
                className="text-gray-700 hover:text-blue-600 cursor-pointer px-1 py-0.5 hover:bg-gray-50 rounded"
                onClick={() => setSelectedPath([...path, key])}
              >
                "{key}":
              </span>{' '}
              {renderJsonTree(val, [...path, key], level + 1)}
            </div>
          ))}
          <span className="text-gray-600">{'}'}</span>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Toast Notification */}
      {false && (
        <div className="fixed top-4 right-4 bg-gray-900 text-white px-4 py-6 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied to clipboard
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="px-6">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                PyPath JSON Navigator
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">Extract Python paths from JSON data</p>
            </div>
            <span className="text-xs text-gray-400 font-mono">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-auto" style={{ padding: '40px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

          {/* JSON Input Panel */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex justify-between items-center">
                <h2 className="text-sm font-medium text-gray-900">JSON Input</h2>
                <div className="flex gap-2">
                  <button
                    onClick={loadSample}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Load Sample
                  </button>
                  <button
                    onClick={() => handleJsonChange('')}
                    className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded"
                  >
                    Clear
                  </button>
                </div>
              </div>
              {error && (
                <div className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              )}
              {!error && jsonInput && (
                <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Valid JSON
                </div>
              )}
            </div>
            <div className="p-4">
              <textarea
                value={jsonInput}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder="Paste or type your JSON here..."
                className="w-full h-[650px] p-3 font-mono text-sm text-gray-900 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                spellCheck={false}
              />
            </div>
          </div>

          {/* Structure View */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 px-4 py-3">
              <h2 className="text-sm font-medium text-gray-900">Structure View</h2>
            </div>
            <div className="p-4 h-[650px] overflow-auto">
              {jsonData ? (
                <div className="font-mono text-sm">
                  {renderJsonTree(jsonData)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                  <p className="text-sm">No JSON data to display</p>
                  <p className="text-xs text-gray-400 mt-1">Enter valid JSON to see its structure</p>
                </div>
              )}
            </div>
          </div>

          {/* Language Examples Panel */}
          <div className="bg-white rounded-lg border border-gray-200 h-[500px] overflow-hidden">
            <LanguageExamples path={selectedPath} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-6 px-8">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            © 2024 PyPath JSON Navigator. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-gray-400 hover:text-white text-sm">Documentation</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">GitHub</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppWorking;
