import { useState, useRef } from 'react';

interface JsonInputProps {
  onChange: (value: string) => void;
  error: string;
}

const JsonInput = ({ onChange, error }: JsonInputProps) => {
  const [value, setValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    onChange(newValue);
  };

  const handleClear = () => {
    setValue('');
    onChange('');
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
            "country": "USA",
            "coordinates": {
              "lat": 40.7128,
              "lng": -74.0060
            }
          },
          "interests": ["coding", "music", "travel"]
        },
        "orders": [
          {
            "id": "ORD001",
            "items": [
              {"name": "Laptop", "price": 999.99},
              {"name": "Mouse", "price": 29.99}
            ],
            "total": 1029.98
          }
        ]
      }
    }, null, 2);
    setValue(sampleJson);
    onChange(sampleJson);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      try {
        const parsed = JSON.parse(text);
        const formatted = JSON.stringify(parsed, null, 2);
        setValue(formatted);
        onChange(formatted);
      } catch {
        setValue(text);
        onChange(text);
      }
    };
    reader.readAsText(file);
  };

  const handleFileLoad = () => {
    fileInputRef.current?.click();
  };

  const handleDownload = () => {
    const blob = new Blob([value], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-semibold text-gray-700">JSON Input</h2>
          <div className="flex gap-2">
            <input
              type="file"
              accept="application/json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={handleFileLoad}
              className="px-3 py-1 text-sm bg-primary text-white rounded hover:bg-blue-600 transition"
            >
              Load File
            </button>
            <button
              onClick={loadSample}
              className="px-3 py-1 text-sm bg-secondary text-white rounded hover:bg-cyan-600 transition"
            >
              Load Sample
            </button>
            <button
              onClick={handleDownload}
              className="px-3 py-1 text-sm bg-success text-white rounded hover:bg-green-600 transition"
            >
              Download JSON
            </button>
            <button
              onClick={handleClear}
              className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition"
            >
              Clear
            </button>
          </div>
        </div>
        {error && (
          <div className="text-sm text-red-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}
        {!error && value && (
          <div className="text-sm text-green-500 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Valid JSON
          </div>
        )}
      </div>
      
      <div className="flex-1 p-4 relative">
        <textarea
          value={value}
          onChange={handleChange}
          placeholder="Paste your JSON here..."
          className="w-full h-full p-3 font-mono text-sm border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          spellCheck={false}
        />
      </div>
    </div>
  );
};

export default JsonInput;