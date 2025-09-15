import { useState, useEffect } from 'react';

interface DiffCheckerProps {
  darkMode?: boolean;
}

interface DiffResult {
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  oldValue?: any;
  newValue?: any;
}

const DiffChecker = ({ darkMode }: DiffCheckerProps) => {
  const [leftJson, setLeftJson] = useState<string>('');
  const [rightJson, setRightJson] = useState<string>('');
  const [leftError, setLeftError] = useState<string>('');
  const [rightError, setRightError] = useState<string>('');
  const [leftData, setLeftData] = useState<any>(null);
  const [rightData, setRightData] = useState<any>(null);
  const [differences, setDifferences] = useState<DiffResult[]>([]);
  const [showOnlyDifferences, setShowOnlyDifferences] = useState<boolean>(true);
  const [leftTextareaRef, setLeftTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [leftLineNumbersRef, setLeftLineNumbersRef] = useState<HTMLDivElement | null>(null);
  const [rightTextareaRef, setRightTextareaRef] = useState<HTMLTextAreaElement | null>(null);
  const [rightLineNumbersRef, setRightLineNumbersRef] = useState<HTMLDivElement | null>(null);

  // Parse JSON and validate
  const parseJson = (input: string, side: 'left' | 'right') => {
    if (!input.trim()) {
      if (side === 'left') {
        setLeftData(null);
        setLeftError('');
      } else {
        setRightData(null);
        setRightError('');
      }
      return;
    }

    try {
      const parsed = JSON.parse(input);
      if (side === 'left') {
        setLeftData(parsed);
        setLeftError('');
      } else {
        setRightData(parsed);
        setRightError('');
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Invalid JSON';
      if (side === 'left') {
        setLeftData(null);
        setLeftError(errorMsg);
      } else {
        setRightData(null);
        setRightError(errorMsg);
      }
    }
  };

  // Deep diff comparison
  const compareObjects = (obj1: any, obj2: any, path: string = ''): DiffResult[] => {
    const results: DiffResult[] = [];

    // Handle null/undefined cases
    if (obj1 === null || obj1 === undefined || obj2 === null || obj2 === undefined) {
      if (obj1 !== obj2) {
        results.push({
          path: path || 'root',
          type: obj1 === null || obj1 === undefined ? 'added' : 'removed',
          oldValue: obj1,
          newValue: obj2
        });
      }
      return results;
    }

    // Different types
    if (typeof obj1 !== typeof obj2 || Array.isArray(obj1) !== Array.isArray(obj2)) {
      results.push({
        path: path || 'root',
        type: 'modified',
        oldValue: obj1,
        newValue: obj2
      });
      return results;
    }

    // Primitive values
    if (typeof obj1 !== 'object') {
      if (obj1 !== obj2) {
        results.push({
          path: path || 'root',
          type: 'modified',
          oldValue: obj1,
          newValue: obj2
        });
      } else if (!showOnlyDifferences) {
        results.push({
          path: path || 'root',
          type: 'unchanged',
          oldValue: obj1,
          newValue: obj2
        });
      }
      return results;
    }

    // Arrays
    if (Array.isArray(obj1)) {
      const maxLength = Math.max(obj1.length, obj2.length);
      for (let i = 0; i < maxLength; i++) {
        const currentPath = path ? `${path}[${i}]` : `[${i}]`;
        if (i >= obj1.length) {
          results.push({
            path: currentPath,
            type: 'added',
            oldValue: undefined,
            newValue: obj2[i]
          });
        } else if (i >= obj2.length) {
          results.push({
            path: currentPath,
            type: 'removed',
            oldValue: obj1[i],
            newValue: undefined
          });
        } else {
          results.push(...compareObjects(obj1[i], obj2[i], currentPath));
        }
      }
      return results;
    }

    // Objects
    const allKeys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
    for (const key of allKeys) {
      const currentPath = path ? `${path}.${key}` : key;

      if (!(key in obj1)) {
        results.push({
          path: currentPath,
          type: 'added',
          oldValue: undefined,
          newValue: obj2[key]
        });
      } else if (!(key in obj2)) {
        results.push({
          path: currentPath,
          type: 'removed',
          oldValue: obj1[key],
          newValue: undefined
        });
      } else {
        results.push(...compareObjects(obj1[key], obj2[key], currentPath));
      }
    }

    return results;
  };

  // Update differences when data changes
  useEffect(() => {
    if (leftData && rightData) {
      const diffs = compareObjects(leftData, rightData);
      setDifferences(diffs);
    } else {
      setDifferences([]);
    }
  }, [leftData, rightData, showOnlyDifferences]);

  const handleLeftChange = (value: string) => {
    setLeftJson(value);
    parseJson(value, 'left');
  };

  const handleRightChange = (value: string) => {
    setRightJson(value);
    parseJson(value, 'right');
  };

  const handleLeftScroll = () => {
    if (leftTextareaRef && leftLineNumbersRef) {
      leftLineNumbersRef.scrollTop = leftTextareaRef.scrollTop;
    }
  };

  const handleRightScroll = () => {
    if (rightTextareaRef && rightLineNumbersRef) {
      rightLineNumbersRef.scrollTop = rightTextareaRef.scrollTop;
    }
  };

  const loadLeftSample = () => {
    const sample = JSON.stringify({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      address: {
        street: "123 Main St",
        city: "New York"
      },
      hobbies: ["reading", "gaming"]
    }, null, 2);
    setLeftJson(sample);
    parseJson(sample, 'left');
  };

  const loadRightSample = () => {
    const sample = JSON.stringify({
      name: "John Doe",
      age: 31,
      email: "john.doe@example.com",
      phone: "+1234567890",
      address: {
        street: "123 Main St",
        city: "New York",
        zip: "10001"
      },
      hobbies: ["reading", "gaming", "cooking"]
    }, null, 2);
    setRightJson(sample);
    parseJson(sample, 'right');
  };

  const getTypeIcon = (type: DiffResult['type']) => {
    switch (type) {
      case 'added':
        return <i className="bi bi-plus-circle-fill text-success"></i>;
      case 'removed':
        return <i className="bi bi-dash-circle-fill text-danger"></i>;
      case 'modified':
        return <i className="bi bi-arrow-left-right text-warning"></i>;
      case 'unchanged':
        return <i className="bi bi-check-circle text-muted"></i>;
    }
  };

  const getTypeColor = (type: DiffResult['type']) => {
    switch (type) {
      case 'added':
        return 'bg-success bg-opacity-10 border-success';
      case 'removed':
        return 'bg-danger bg-opacity-10 border-danger';
      case 'modified':
        return 'bg-warning bg-opacity-10 border-warning';
      case 'unchanged':
        return '';
    }
  };

  const formatValue = (value: any): string => {
    if (value === undefined) return 'undefined';
    if (value === null) return 'null';
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  };

  const stats = {
    added: differences.filter(d => d.type === 'added').length,
    removed: differences.filter(d => d.type === 'removed').length,
    modified: differences.filter(d => d.type === 'modified').length,
    unchanged: differences.filter(d => d.type === 'unchanged').length
  };


  return (
    <div className="container-fluid p-3 h-100 d-flex flex-column">
      <div className="row g-3 flex-grow-1" style={{ minHeight: 0 }}>
        {/* Left JSON Input */}
        <div className="col-12 col-lg-4 d-flex">
          <div className="card shadow-sm w-100 d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                Original JSON
              </h6>
              <div className="d-flex align-items-center gap-2">
                {leftError && (
                  <span className="badge bg-danger">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Invalid
                  </span>
                )}
                {!leftError && leftData && (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Valid
                  </span>
                )}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    onClick={loadLeftSample}
                    className="btn btn-primary"
                    title="Load sample JSON"
                  >
                    <i className="bi bi-download me-1"></i>
                    Sample
                  </button>
                  <label className="btn btn-outline-primary" title="Upload JSON file">
                    <i className="bi bi-upload me-1"></i>
                    Upload
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const text = e.target?.result as string;
                            setLeftJson(text);
                            parseJson(text, 'left');
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      setLeftJson('');
                      setLeftData(null);
                    }}
                    className="btn btn-outline-danger"
                    title="Clear JSON"
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body d-flex flex-column overflow-hidden flex-fill p-0">
              <div className="d-flex border rounded overflow-hidden flex-fill">
                {/* Line numbers column */}
                <div
                  ref={setLeftLineNumbersRef}
                  className="text-muted text-end pe-2 border-end"
                  style={{
                    minWidth: '40px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    height: '100%',
                    overflowY: 'hidden',
                    overflowX: 'hidden',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem'
                  }}
                >
                  {(leftJson || ' ').split('\n').map((line, index) => {
                    let lineType = 'unchanged';

                    // Check each difference to see if it affects this line
                    differences.forEach(diff => {
                      // Skip unchanged differences
                      if (diff.type === 'unchanged') return;

                      // For removed items, check if they appear in left side
                      if (diff.type === 'removed' && diff.oldValue !== undefined) {
                        const valueStr = JSON.stringify(diff.oldValue);
                        if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                          lineType = 'removed';
                        }
                      }

                      // For modified items, check old value in left side
                      if (diff.type === 'modified' && diff.oldValue !== undefined) {
                        const valueStr = JSON.stringify(diff.oldValue);
                        if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                          lineType = 'modified';
                        }
                      }

                      // Also check for property names in path
                      const pathParts = diff.path.split('.');
                      const lastPart = pathParts[pathParts.length - 1];
                      if (line.includes(`"${lastPart}"`)) {
                        if (diff.type === 'removed') lineType = 'removed';
                        if (diff.type === 'modified') lineType = 'modified';
                      }
                    });

                    return (
                      <div
                        key={index}
                        className="d-flex align-items-center justify-content-end"
                        style={{
                          height: '1.5rem',
                          backgroundColor: lineType === 'removed' ? 'rgba(220, 53, 69, 0.1)' :
                                         lineType === 'modified' ? 'rgba(255, 193, 7, 0.2)' :
                                         'transparent'
                        }}
                      >
                        <span>{index + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Text input area */}
                <div className="position-relative flex-fill">
                  {/* Highlighted overlay */}
                  {leftData && differences.length > 0 && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 font-monospace"
                      style={{
                        pointerEvents: 'none',
                        fontSize: '0.875rem',
                        lineHeight: '1.5rem',
                        padding: '0.5rem',
                        whiteSpace: 'pre',
                        wordBreak: 'break-all',
                        overflow: 'hidden'
                      }}
                    >
                      {leftJson.split('\n').map((line, idx) => {
                        let lineType = 'unchanged';

                        differences.forEach(diff => {
                          if (diff.type === 'unchanged') return;

                          if (diff.type === 'removed' && diff.oldValue !== undefined) {
                            const valueStr = JSON.stringify(diff.oldValue);
                            if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                              lineType = 'removed';
                            }
                          }

                          if (diff.type === 'modified' && diff.oldValue !== undefined) {
                            const valueStr = JSON.stringify(diff.oldValue);
                            if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                              lineType = 'modified';
                            }
                          }

                          const pathParts = diff.path.split('.');
                          const lastPart = pathParts[pathParts.length - 1];
                          if (line.includes(`"${lastPart}"`)) {
                            if (diff.type === 'removed') lineType = 'removed';
                            if (diff.type === 'modified') lineType = 'modified';
                          }
                        });

                        return (
                          <div
                            key={idx}
                            style={{
                              height: '1.5rem',
                              backgroundColor: lineType === 'removed' ? 'rgba(220, 53, 69, 0.15)' :
                                             lineType === 'modified' ? 'rgba(255, 193, 7, 0.25)' :
                                             'transparent'
                            }}
                          >
                            {' '}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <textarea
                    ref={setLeftTextareaRef}
                    value={leftJson}
                    onChange={(e) => handleLeftChange(e.target.value)}
                    onScroll={handleLeftScroll}
                    placeholder="Paste your original JSON here..."
                    className={`flex-fill border-0 font-monospace h-100 ${darkMode ? 'bg-dark text-light' : ''}`}
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: '1.5rem',
                      padding: '0.5rem',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      position: 'relative',
                      zIndex: 2
                    }}
                    spellCheck={false}
                  />
                </div>
              </div>
              {leftError && (
                <div className="alert alert-danger m-2 py-2">
                  <small><i className="bi bi-exclamation-triangle me-1"></i>{leftError}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right JSON Input */}
        <div className="col-12 col-lg-4 d-flex">
          <div className="card shadow-sm w-100 d-flex flex-column">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h6 className="mb-0 fw-bold">
                <i className="bi bi-file-earmark-text me-2 text-info"></i>
                Modified JSON
              </h6>
              <div className="d-flex align-items-center gap-2">
                {rightError && (
                  <span className="badge bg-danger">
                    <i className="bi bi-exclamation-triangle me-1"></i>
                    Invalid
                  </span>
                )}
                {!rightError && rightData && (
                  <span className="badge bg-success">
                    <i className="bi bi-check-circle me-1"></i>
                    Valid
                  </span>
                )}
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    onClick={loadRightSample}
                    className="btn btn-primary"
                    title="Load sample JSON"
                  >
                    <i className="bi bi-download me-1"></i>
                    Sample
                  </button>
                  <label className="btn btn-outline-primary" title="Upload JSON file">
                    <i className="bi bi-upload me-1"></i>
                    Upload
                    <input
                      type="file"
                      accept=".json"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            const text = e.target?.result as string;
                            setRightJson(text);
                            parseJson(text, 'right');
                          };
                          reader.readAsText(file);
                        }
                      }}
                    />
                  </label>
                  <button
                    onClick={() => {
                      setRightJson('');
                      setRightData(null);
                    }}
                    className="btn btn-outline-danger"
                    title="Clear JSON"
                  >
                    <i className="bi bi-x-lg me-1"></i>
                    Clear
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body d-flex flex-column overflow-hidden flex-fill p-0">
              <div className="d-flex border rounded overflow-hidden flex-fill">
                {/* Line numbers column */}
                <div
                  ref={setRightLineNumbersRef}
                  className="text-muted text-end pe-2 border-end"
                  style={{
                    minWidth: '40px',
                    fontSize: '0.875rem',
                    lineHeight: '1.5rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0,0,0,0.03)',
                    height: '100%',
                    overflowY: 'hidden',
                    overflowX: 'hidden',
                    paddingTop: '0.5rem',
                    paddingBottom: '0.5rem'
                  }}
                >
                  {(rightJson || ' ').split('\n').map((line, index) => {
                    let lineType = 'unchanged';

                    differences.forEach(diff => {
                      if (diff.type === 'unchanged') return;

                      // For added items, check if they appear in right side
                      if (diff.type === 'added' && diff.newValue !== undefined) {
                        const valueStr = JSON.stringify(diff.newValue);
                        if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                          lineType = 'added';
                        }
                      }

                      // For modified items, check new value in right side
                      if (diff.type === 'modified' && diff.newValue !== undefined) {
                        const valueStr = JSON.stringify(diff.newValue);
                        if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                          lineType = 'modified';
                        }
                      }

                      // Also check for property names in path
                      const pathParts = diff.path.split('.');
                      const lastPart = pathParts[pathParts.length - 1];
                      if (line.includes(`"${lastPart}"`)) {
                        if (diff.type === 'added') lineType = 'added';
                        if (diff.type === 'modified') lineType = 'modified';
                      }
                    });

                    return (
                      <div
                        key={index}
                        className="d-flex align-items-center justify-content-end"
                        style={{
                          height: '1.5rem',
                          backgroundColor: lineType === 'added' ? 'rgba(25, 135, 84, 0.1)' :
                                         lineType === 'modified' ? 'rgba(255, 193, 7, 0.2)' :
                                         'transparent'
                        }}
                      >
                        <span>{index + 1}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Text input area */}
                <div className="position-relative flex-fill">
                  {/* Highlighted overlay */}
                  {rightData && differences.length > 0 && (
                    <div
                      className="position-absolute top-0 start-0 w-100 h-100 font-monospace"
                      style={{
                        pointerEvents: 'none',
                        fontSize: '0.875rem',
                        lineHeight: '1.5rem',
                        padding: '0.5rem',
                        whiteSpace: 'pre',
                        wordBreak: 'break-all',
                        overflow: 'hidden'
                      }}
                    >
                      {rightJson.split('\n').map((line, idx) => {
                        let lineType = 'unchanged';

                        differences.forEach(diff => {
                          if (diff.type === 'unchanged') return;

                          if (diff.type === 'added' && diff.newValue !== undefined) {
                            const valueStr = JSON.stringify(diff.newValue);
                            if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                              lineType = 'added';
                            }
                          }

                          if (diff.type === 'modified' && diff.newValue !== undefined) {
                            const valueStr = JSON.stringify(diff.newValue);
                            if (line.includes(valueStr.replace(/^"|"$/g, ''))) {
                              lineType = 'modified';
                            }
                          }

                          const pathParts = diff.path.split('.');
                          const lastPart = pathParts[pathParts.length - 1];
                          if (line.includes(`"${lastPart}"`)) {
                            if (diff.type === 'added') lineType = 'added';
                            if (diff.type === 'modified') lineType = 'modified';
                          }
                        });

                        return (
                          <div
                            key={idx}
                            style={{
                              height: '1.5rem',
                              backgroundColor: lineType === 'added' ? 'rgba(25, 135, 84, 0.15)' :
                                             lineType === 'modified' ? 'rgba(255, 193, 7, 0.25)' :
                                             'transparent'
                            }}
                          >
                            {' '}
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <textarea
                    ref={setRightTextareaRef}
                    value={rightJson}
                    onChange={(e) => handleRightChange(e.target.value)}
                    onScroll={handleRightScroll}
                    placeholder="Paste your modified JSON here..."
                    className={`flex-fill border-0 font-monospace h-100 ${darkMode ? 'bg-dark text-light' : ''}`}
                    style={{
                      fontSize: '0.875rem',
                      lineHeight: '1.5rem',
                      padding: '0.5rem',
                      resize: 'none',
                      outline: 'none',
                      backgroundColor: 'transparent',
                      position: 'relative',
                      zIndex: 2
                    }}
                    spellCheck={false}
                  />
                </div>
              </div>
              {rightError && (
                <div className="alert alert-danger m-2 py-2">
                  <small><i className="bi bi-exclamation-triangle me-1"></i>{rightError}</small>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Differences Display - Third Column */}
        <div className="col-12 col-lg-4 d-flex">
          <div className="card shadow-sm w-100 d-flex flex-column">
            <div className="card-header">
              <div className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0 fw-bold">
                  <i className="bi bi-list-check me-2 text-primary"></i>
                  Differences Found ({differences.filter(d => d.type !== 'unchanged').length})
                </h6>
                <div className="form-check mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="showOnlyDiff"
                    checked={showOnlyDifferences}
                    onChange={(e) => setShowOnlyDifferences(e.target.checked)}
                  />
                  <label className="form-check-label small" htmlFor="showOnlyDiff">
                    Only differences
                  </label>
                </div>
              </div>
            </div>
            <div className="card-body overflow-auto flex-fill">
              {differences.length > 0 ? (
                <>
                  {/* Stats Summary */}
                  <div className="d-flex gap-2 mb-3 flex-wrap">
                    <span className="badge bg-success">
                      <i className="bi bi-plus-circle me-1"></i>
                      {stats.added} Added
                    </span>
                    <span className="badge bg-danger">
                      <i className="bi bi-dash-circle me-1"></i>
                      {stats.removed} Removed
                    </span>
                    <span className="badge bg-warning">
                      <i className="bi bi-arrow-left-right me-1"></i>
                      {stats.modified} Modified
                    </span>
                    {!showOnlyDifferences && (
                      <span className="badge bg-secondary">
                        <i className="bi bi-check-circle me-1"></i>
                        {stats.unchanged} Unchanged
                      </span>
                    )}
                  </div>

                  {/* Differences List */}
                  {differences.map((diff, idx) => (
                    <div
                      key={idx}
                      className={`mb-2 p-2 border rounded ${getTypeColor(diff.type)}`}
                    >
                      <div className="d-flex align-items-start">
                        <span className="me-2">{getTypeIcon(diff.type)}</span>
                        <div className="flex-grow-1">
                          <div className="fw-bold font-monospace small">{diff.path}</div>
                          {diff.type === 'modified' && (
                            <div className="mt-1 d-flex align-items-center gap-2" style={{ fontSize: '11px' }}>
                              <span className="text-muted">Old:</span>
                              <code className="text-danger bg-light px-1 rounded">{formatValue(diff.oldValue)}</code>
                              <i className="bi bi-arrow-right text-muted"></i>
                              <span className="text-muted">New:</span>
                              <code className="text-success bg-light px-1 rounded">{formatValue(diff.newValue)}</code>
                            </div>
                          )}
                          {diff.type === 'added' && (
                            <div className="mt-1" style={{ fontSize: '11px' }}>
                              <code className="text-success bg-light px-1 rounded">{formatValue(diff.newValue)}</code>
                            </div>
                          )}
                          {diff.type === 'removed' && (
                            <div className="mt-1" style={{ fontSize: '11px' }}>
                              <code className="text-danger bg-light px-1 rounded">{formatValue(diff.oldValue)}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              ) : leftData && rightData ? (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-check-circle display-3 mb-3"></i>
                  <p>The JSON structures are identical</p>
                </div>
              ) : (
                <div className="text-center text-muted py-5">
                  <i className="bi bi-arrow-left-right display-4 mb-3"></i>
                  <p>Enter JSON in both panels to compare</p>
                </div>
              )}
            </div>
            <div className="card-footer">
              <button
                onClick={() => {
                  setLeftJson('');
                  setRightJson('');
                  setLeftData(null);
                  setRightData(null);
                }}
                className="btn btn-sm btn-outline-secondary w-100"
              >
                <i className="bi bi-x-lg me-1"></i>
                Clear All
              </button>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
};

export default DiffChecker;