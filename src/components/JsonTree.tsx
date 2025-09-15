import { useState } from 'react';
import type { JsonData, TreeNodeProps } from '../types/index';

interface JsonTreeProps {
  data: JsonData;
  onNodeClick: (path: string[]) => void;
  selectedPath: string[];
}

const JsonTree = ({ data, onNodeClick, selectedPath }: JsonTreeProps) => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold text-gray-700 mb-4">Structure View</h2>
      <TreeNode 
        data={data} 
        path={[]} 
        onNodeClick={onNodeClick}
        selectedPath={selectedPath}
        level={0}
      />
    </div>
  );
};

const TreeNode = ({ data, path, onNodeClick, selectedPath, level = 0 }: TreeNodeProps) => {
  const [expanded, setExpanded] = useState(true);
  
  const isSelected = JSON.stringify(path) === JSON.stringify(selectedPath);
  const indent = level * 20;

  const getTypeColor = (value: JsonData) => {
    if (value === null) return 'text-gray-400';
    if (typeof value === 'boolean') return 'text-purple-600';
    if (typeof value === 'number') return 'text-blue-600';
    if (typeof value === 'string') return 'text-green-600';
    if (Array.isArray(value)) return 'text-orange-600';
    return 'text-pink-600';
  };

  const getTypeLabel = (value: JsonData) => {
    if (value === null) return 'null';
    if (typeof value === 'boolean') return 'bool';
    if (typeof value === 'number') return 'num';
    if (typeof value === 'string') return 'str';
    if (Array.isArray(value)) return `array[${value.length}]`;
    return `object{${Object.keys(value).length}}`;
  };

  const renderValue = (value: JsonData, currentPath: string[]) => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (typeof value === 'boolean') return <span className="text-purple-600">{String(value)}</span>;
    if (typeof value === 'number') return <span className="text-blue-600">{value}</span>;
    if (typeof value === 'string') return <span className="text-green-600">"{value}"</span>;
    
    if (Array.isArray(value)) {
      return (
        <div>
          <span className="text-gray-500">[</span>
          {expanded && value.map((item, index) => (
            <div key={index} style={{ marginLeft: 20 }}>
              <span 
                className="text-orange-700 cursor-pointer hover:bg-orange-50 px-1 rounded"
                onClick={() => onNodeClick([...currentPath, String(index)])}
              >
                [{index}]:
              </span>{' '}
              {typeof item === 'object' && item !== null ? (
                <TreeNode 
                  data={item} 
                  path={[...currentPath, String(index)]} 
                  onNodeClick={onNodeClick}
                  selectedPath={selectedPath}
                  level={level + 1}
                />
              ) : (
                renderValue(item, [...currentPath, String(index)])
              )}
            </div>
          ))}
          <span className="text-gray-500">]</span>
        </div>
      );
    }
    
    if (typeof value === 'object' && value !== null) {
      return (
        <div>
          <span className="text-gray-500">{'{'}</span>
          {expanded && Object.entries(value).map(([key, val]) => (
            <div key={key} style={{ marginLeft: 20 }}>
              <span 
                className="text-pink-700 cursor-pointer hover:bg-pink-50 px-1 rounded"
                onClick={() => onNodeClick([...currentPath, key])}
              >
                "{key}":
              </span>{' '}
              {typeof val === 'object' && val !== null ? (
                <TreeNode 
                  data={val} 
                  path={[...currentPath, key]} 
                  onNodeClick={onNodeClick}
                  selectedPath={selectedPath}
                  level={level + 1}
                />
              ) : (
                renderValue(val, [...currentPath, key])
              )}
            </div>
          ))}
          <span className="text-gray-500">{'}'}</span>
        </div>
      );
    }
    
    return null;
  };

  const isExpandable = typeof data === 'object' && data !== null;

  return (
    <div 
      className={`font-mono text-sm ${isSelected ? 'bg-blue-50 rounded' : ''}`}
      style={{ marginLeft: indent }}
    >
      {isExpandable && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mr-1 text-gray-500 hover:text-gray-700"
        >
          {expanded ? '▼' : '▶'}
        </button>
      )}
      
      <span 
        className={`inline-flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-1 rounded`}
        onClick={() => onNodeClick(path)}
      >
        <span className={`text-xs px-1 py-0.5 rounded ${getTypeColor(data)} bg-opacity-10`}>
          {getTypeLabel(data)}
        </span>
      </span>
      
      {renderValue(data, path)}
    </div>
  );
};

export default JsonTree;