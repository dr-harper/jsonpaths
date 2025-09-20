import React, { useMemo, useState } from 'react';

type JsonData =
  | null
  | boolean
  | number
  | string
  | JsonData[]
  | { [key: string]: JsonData };

interface JsonTreeViewProps {
  data: JsonData;
  onPathSelect: (path: string[]) => void;
  searchTerm?: string;
  viewMode?: 'tree' | 'compact' | 'raw';
  filterMode?: boolean;
}

interface TreeNodeProps {
  data: JsonData;
  path: string[];
  level: number;
  onPathSelect: (path: string[]) => void;
  searchTerm: string;
  normalizedSearchTerm: string;
  filterMode?: boolean;
  isLast?: boolean;
  parentExpanded?: boolean;
  selectedPath?: string[];
  visiblePaths: Set<string> | null;
}

interface VisibilityIndexResult {
  visiblePaths: Set<string>;
  hasMatches: boolean;
}

const serializePath = (segments: readonly string[]): string => JSON.stringify(segments);

const buildVisibilityIndex = (
  node: JsonData,
  normalizedSearchTerm: string
): VisibilityIndexResult => {
  const visiblePaths = new Set<string>();
  const pathSegments: string[] = [];
  let lowerPath = '';

  const visitNode = (current: JsonData): boolean => {
    const currentPathMatches =
      lowerPath.length > 0 && lowerPath.includes(normalizedSearchTerm);

    let valueMatches = false;
    if (typeof current === 'string') {
      valueMatches = current.toLowerCase().includes(normalizedSearchTerm);
    }

    let childMatches = false;
    if (current && typeof current === 'object') {
      if (Array.isArray(current)) {
        for (let index = 0; index < current.length; index += 1) {
          const segment = String(index);
          const lowerSegment = segment.toLowerCase();
          const previousLowerPath = lowerPath;
          lowerPath = previousLowerPath
            ? `${previousLowerPath}.${lowerSegment}`
            : lowerSegment;
          pathSegments.push(segment);
          if (visitNode(current[index])) {
            childMatches = true;
          }
          pathSegments.pop();
          lowerPath = previousLowerPath;
        }
      } else {
        for (const [key, value] of Object.entries(current)) {
          const lowerKey = key.toLowerCase();
          const previousLowerPath = lowerPath;
          lowerPath = previousLowerPath
            ? `${previousLowerPath}.${lowerKey}`
            : lowerKey;
          pathSegments.push(key);
          if (visitNode(value)) {
            childMatches = true;
          }
          pathSegments.pop();
          lowerPath = previousLowerPath;
        }
      }
    }

    const isMatch = currentPathMatches || valueMatches || childMatches;

    if (isMatch) {
      visiblePaths.add(serializePath(pathSegments));
    }

    return isMatch;
  };

  const hasMatches = visitNode(node);

  return { visiblePaths, hasMatches };
};

const TreeNode: React.FC<TreeNodeProps> = ({
  data,
  path,
  level,
  onPathSelect,
  searchTerm,
  normalizedSearchTerm,
  filterMode = false,
  isLast = false,
  selectedPath = [],
  visiblePaths
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedValue, setCopiedValue] = useState(false);

  const handleCopyValue = async (value: any) => {
    try {
      await navigator.clipboard.writeText(
        typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
      );
      setCopiedValue(true);
      setTimeout(() => setCopiedValue(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getDataType = (value: JsonData): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'string': return '📝';
      case 'number': return '🔢';
      case 'boolean': return '✓';
      case 'null': return '∅';
      case 'array': return '[]';
      case 'object': return '{}';
      default: return '';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'string': return 'text-success';
      case 'number': return 'text-primary';
      case 'boolean': return 'text-warning';
      case 'null': return 'text-muted fst-italic';
      case 'array': return 'text-info';
      case 'object': return 'text-secondary';
      default: return '';
    }
  };

  const renderTreeLine = () => {
    if (level === 0) return null;

    const lines = [];
    // Add vertical lines for each parent level
    for (let i = 1; i < level; i++) {
      lines.push(
        <span key={i} className="text-muted" style={{
          display: 'inline-block',
          width: '24px',
          textAlign: 'center'
        }}>
          │
        </span>
      );
    }
    // Add the branch connector
    lines.push(
      <span className="text-muted" style={{
        display: 'inline-block',
        width: '24px'
      }}>
        {isLast ? '└─ ' : '├─ '}
      </span>
    );
    return <span style={{ display: 'inline-flex', alignItems: 'center' }}>{lines}</span>;
  };

  const isSelected = JSON.stringify(path) === JSON.stringify(selectedPath);
  const dataType = getDataType(data);
  const isExpandable = dataType === 'object' || dataType === 'array';

  const pathKey = serializePath(path);
  const isFiltering = Boolean(searchTerm && filterMode && visiblePaths);
  const isVisible = !isFiltering || visiblePaths?.has(pathKey);

  // Don't render if filtering is on and this node doesn't match
  if (!isVisible) {
    return null;
  }

  // Highlight search matches
  const highlightMatch = (text: string): React.ReactElement => {
    if (!searchTerm) {
      return <>{text}</>;
    }

    const lowerText = text.toLowerCase();
    const lowerSearch = normalizedSearchTerm;
    const highlightedParts: React.ReactNode[] = [];
    let searchStart = 0;
    let matchIndex = lowerText.indexOf(lowerSearch, searchStart);
    let partIndex = 0;

    while (matchIndex !== -1) {
      if (matchIndex > searchStart) {
        highlightedParts.push(
          <span key={`text-${partIndex}`}>{text.slice(searchStart, matchIndex)}</span>
        );
        partIndex += 1;
      }

      const matchText = text.slice(matchIndex, matchIndex + searchTerm.length);
      highlightedParts.push(
        <mark key={`mark-${partIndex}`} className="bg-warning">
          {matchText}
        </mark>
      );
      partIndex += 1;
      searchStart = matchIndex + searchTerm.length;
      matchIndex = lowerText.indexOf(lowerSearch, searchStart);
    }

    if (searchStart < text.length) {
      highlightedParts.push(
        <span key={`text-${partIndex}`}>{text.slice(searchStart)}</span>
      );
    }

    return <>{highlightedParts}</>;
  };

  // Render value based on type
  const renderValue = () => {
    if (data === null) {
      return <span className={getTypeColor('null')}>null</span>;
    }

    if (typeof data === 'boolean') {
      return (
        <span className={getTypeColor('boolean')}>
          {data ? 'true' : 'false'}
        </span>
      );
    }

    if (typeof data === 'number') {
      return <span className={getTypeColor('number')}>{data}</span>;
    }

    if (typeof data === 'string') {
      const truncated = data.length > 60 ? data.substring(0, 60) + '...' : data;
      return (
        <span className={getTypeColor('string')} title={data}>
          "{highlightMatch(truncated)}"
        </span>
      );
    }

    if (Array.isArray(data)) {
      return (
        <span className="text-muted ms-2">
          [{data.length} {data.length === 1 ? 'item' : 'items'}]
        </span>
      );
    }

    if (typeof data === 'object' && data !== null) {
      const keyCount = Object.keys(data).length;
      return (
        <span className="text-muted ms-2">
          {'{'}
          {keyCount} {keyCount === 1 ? 'property' : 'properties'}
          {'}'}
        </span>
      );
    }

    return null;
  };

  return (
    <div className={`tree-node ${isSelected ? 'tree-node-selected' : ''}`}>
      <div
        className="d-flex align-items-center hover-bg"
        style={{
          cursor: isExpandable ? 'pointer' : 'default',
          minHeight: '24px',
          lineHeight: '24px',
          paddingLeft: '2px',
          paddingRight: '4px'
        }}
      >
        {/* Tree lines */}
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'monospace',
          fontSize: '14px',
          userSelect: 'none'
        }}>
          {renderTreeLine()}
        </span>

        {/* Expand/Collapse button */}
        {isExpandable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="btn btn-sm p-0 me-1 border-0"
            style={{
              width: '16px',
              height: '16px',
              lineHeight: '1',
              fontSize: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}

        {path.length > 0 && (
          <>
            <span
              className="fw-bold text-dark me-2 hover-text-primary"
              onClick={() => onPathSelect(path)}
              style={{ cursor: 'pointer' }}
            >
              {highlightMatch(path[path.length - 1])}:
            </span>
            <span className="me-2" title={dataType}>
              {getTypeIcon(dataType)}
            </span>
          </>
        )}

        {!isExpandable && renderValue()}
        {isExpandable && renderValue()}

        {!isExpandable && (
          <button
            onClick={() => handleCopyValue(data)}
            className="btn btn-sm btn-outline-secondary ms-2 py-0 px-1"
            style={{ fontSize: '0.7rem', opacity: copiedValue ? 1 : 0.3 }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
            onMouseLeave={(e) => !copiedValue && (e.currentTarget.style.opacity = '0.3')}
          >
            {copiedValue ? '✓' : '📋'}
          </button>
        )}
      </div>

      {isExpandable && isExpanded && (
        <div style={{ marginLeft: '0' }}>
          {Array.isArray(data) ? (
            data.map((item, index) => (
              <TreeNode
                key={index}
                data={item}
                path={[...path, String(index)]}
                level={level + 1}
                onPathSelect={onPathSelect}
                searchTerm={searchTerm}
                normalizedSearchTerm={normalizedSearchTerm}
                filterMode={filterMode}
                isLast={index === data.length - 1}
                selectedPath={selectedPath}
                visiblePaths={visiblePaths}
              />
            ))
          ) : (
            Object.entries(data as object).map(([key, value], index, arr) => (
              <TreeNode
                key={key}
                data={value}
                path={[...path, key]}
                level={level + 1}
                onPathSelect={onPathSelect}
                searchTerm={searchTerm}
                normalizedSearchTerm={normalizedSearchTerm}
                filterMode={filterMode}
                isLast={index === arr.length - 1}
                selectedPath={selectedPath}
                visiblePaths={visiblePaths}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

const JsonTreeView: React.FC<JsonTreeViewProps> = ({
  data,
  onPathSelect,
  searchTerm = '',
  viewMode = 'tree',
  filterMode = false
}) => {
  const [selectedPath, setSelectedPath] = useState<string[]>([]);

  const trimmedSearchTerm = searchTerm.trim();
  const normalizedSearchTerm = trimmedSearchTerm.toLowerCase();

  const { visiblePaths, hasMatches } = useMemo<{
    visiblePaths: Set<string> | null;
    hasMatches: boolean;
  }>(() => {
    if (!filterMode || !normalizedSearchTerm) {
      return { visiblePaths: null, hasMatches: true };
    }
    return buildVisibilityIndex(data, normalizedSearchTerm);
  }, [data, filterMode, normalizedSearchTerm]);

  const handlePathSelect = (path: string[]) => {
    setSelectedPath(path);
    onPathSelect(path);
  };

  // Create breadcrumb trail
  const breadcrumb = selectedPath.length > 0 ? (
    <nav aria-label="breadcrumb" className="mb-3">
      <ol className="breadcrumb small">
        <li className="breadcrumb-item">
          <a href="#" onClick={() => handlePathSelect([])}>root</a>
        </li>
        {selectedPath.map((segment, index) => {
          const partialPath = selectedPath.slice(0, index + 1);
          const isLast = index === selectedPath.length - 1;
          return (
            <li
              key={index}
              className={`breadcrumb-item ${isLast ? 'active' : ''}`}
              aria-current={isLast ? 'page' : undefined}
            >
              {isLast ? (
                segment
              ) : (
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handlePathSelect(partialPath);
                  }}
                >
                  {segment}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  ) : null;

  // Raw JSON view
  if (viewMode === 'raw') {
    return (
      <div>
        {breadcrumb}
        <pre className="bg-light p-3 rounded">
          <code>{JSON.stringify(data, null, 2)}</code>
        </pre>
      </div>
    );
  }

  // Compact view
  if (viewMode === 'compact') {
    return (
      <div>
        {breadcrumb}
        <pre className="bg-light p-3 rounded">
          <code>{JSON.stringify(data)}</code>
        </pre>
      </div>
    );
  }

  // Check if we have any visible nodes when filtering
  const showNoMatchesWarning = Boolean(trimmedSearchTerm && filterMode && !hasMatches);

  // Tree view (default)
  return (
    <div>

      {/* Breadcrumb */}
      {breadcrumb}

      {/* No matches warning */}
      {showNoMatchesWarning ? (
        <div className="text-center text-muted py-4">
          <i className="bi bi-search display-4 mb-3"></i>
          <p className="mb-2">No matches found for "{searchTerm}"</p>
          <small>Try a different search term or disable the filter to see all data</small>
        </div>
      ) : (
        /* Tree */
        <div className="font-monospace" style={{ fontSize: '0.875rem' }}>
          <TreeNode
            data={data}
            path={[]}
            level={0}
            onPathSelect={handlePathSelect}
            searchTerm={trimmedSearchTerm}
            normalizedSearchTerm={normalizedSearchTerm}
            filterMode={filterMode}
            selectedPath={selectedPath}
            visiblePaths={visiblePaths}
          />
        </div>
      )}
    </div>
  );
};

export default JsonTreeView;