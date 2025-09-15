import { useState, useEffect } from 'react';

interface PythonPathProps {
  path: string[];
}

const PythonPath = ({ path }: PythonPathProps) => {
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generatePythonPath = (pathArray: string[]) => {
    if (pathArray.length === 0) return 'data';
    
    return pathArray.reduce((acc, key) => {
      if (/^\d+$/.test(key)) {
        return `${acc}[${key}]`;
      } else if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key)) {
        return acc === 'data' ? `${acc}['${key}']` : `${acc}['${key}']`;
      } else {
        return `${acc}['${key}']`;
      }
    }, 'data');
  };

  const pythonPath = generatePythonPath(path);

  useEffect(() => {
    if (pythonPath && pythonPath !== 'data' && !history.includes(pythonPath)) {
      setHistory(prev => [pythonPath, ...prev.slice(0, 9)]);
    }
  }, [pythonPath]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pythonPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-700">Python Path</h2>
      </div>
      
      <div className="flex-1 p-4 overflow-auto">
        {path.length > 0 ? (
          <>
            <div className="mb-4">
              <label className="text-sm text-gray-600 block mb-2">Current Selection:</label>
              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                <code className="text-sm font-mono text-primary break-all">
                  {pythonPath}
                </code>
              </div>
              <button
                onClick={handleCopy}
                className={`mt-2 w-full px-4 py-2 text-sm rounded-lg transition ${
                  copied 
                    ? 'bg-green-500 text-white' 
                    : 'bg-secondary text-white hover:bg-cyan-600'
                }`}
              >
                {copied ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Copied!
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                      <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                    </svg>
                    Copy to Clipboard
                  </span>
                )}
              </button>
            </div>

            <div className="mt-6">
              <label className="text-sm text-gray-600 block mb-2">Alternative Formats:</label>
              <div className="space-y-2">
                <div className="bg-gray-50 p-2 rounded border border-gray-200">
                  <code className="text-xs font-mono text-gray-700">
                    {generatePythonPath(path).replace(/\['/g, '.get("').replace(/'\]/g, '")')}
                  </code>
                </div>
              </div>
            </div>

            {history.length > 1 && (
              <div className="mt-6">
                <label className="text-sm text-gray-600 block mb-2">Recent Paths:</label>
                <div className="space-y-1 max-h-40 overflow-auto">
                  {history.slice(1).map((histPath, index) => (
                    <div 
                      key={index}
                      className="bg-gray-50 p-2 rounded border border-gray-100 hover:border-gray-300 cursor-pointer transition"
                      onClick={async () => {
                        await navigator.clipboard.writeText(histPath);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      <code className="text-xs font-mono text-gray-600 break-all">
                        {histPath}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center text-gray-400 mt-8">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l1.419 2.839c.092.184.272.332.47.39l3.177.461c.507.074.711.696.343 1.052l-2.298 2.24a.75.75 0 00-.216.664l.543 3.165c.087.506-.444.895-.894.656L7 12.348a.75.75 0 00-.698 0l-2.84 1.493c-.45.237-.981-.15-.894-.656l.543-3.165a.75.75 0 00-.216-.664L.597 7.116c-.368-.356-.164-.978.343-1.052l3.177-.461a.75.75 0 00.47-.39l1.419-2.839c.227-.454.848-.454 1.075 0z" />
            </svg>
            <p className="text-sm">Click on any field in the JSON structure to see its Python path</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PythonPath;