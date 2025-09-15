import React from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop fade show"
        style={{ zIndex: 1040 }}
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div
        className="modal fade show d-block"
        style={{ zIndex: 1050 }}
        tabIndex={-1}
      >
        <div className="modal-dialog modal-lg modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-book me-2 text-primary"></i>
                JSON Assistant Documentation
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">

              {/* Overview */}
              <section className="mb-4">
                <h6 className="text-primary mb-3">
                  <i className="bi bi-info-circle me-2"></i>
                  Overview
                </h6>
                <p>
                  JSON Assistant is a powerful tool for exploring, querying, and extracting data from JSON structures.
                  It provides visual navigation, AI-powered path finding, JSONPath querying, and accurate code generation for multiple programming languages.
                </p>
                <p className="text-muted small">
                  <strong>Version:</strong> 1.0.0
                </p>
              </section>

              {/* JSON Input */}
              <section className="mb-4">
                <h6 className="text-success mb-3">
                  <i className="bi bi-code-square me-2"></i>
                  JSON Input Panel
                </h6>
                <ul className="list-unstyled ms-3">
                  <li className="mb-2">
                    <strong>Manual Input:</strong> Paste or type JSON directly into the textarea
                  </li>
                  <li className="mb-2">
                    <strong>File Upload:</strong> Click "Upload" to load JSON files (max 10MB)
                  </li>
                  <li className="mb-2">
                    <strong>Sample Data:</strong> Click "Sample" to load example JSON for testing
                  </li>
                  <li className="mb-2">
                    <strong>Validation:</strong> Real-time JSON validation with error reporting
                  </li>
                  <li>
                    <strong>Clear:</strong> Remove all content and start fresh
                  </li>
                </ul>
              </section>

              {/* Structure View */}
              <section className="mb-4">
                <h6 className="text-info mb-3">
                  <i className="bi bi-diagram-3 me-2"></i>
                  Structure View Panel
                </h6>

                <div className="mb-3">
                  <strong>View Modes:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li><i className="bi bi-diagram-3 me-1"></i> <strong>Tree View:</strong> Interactive hierarchical display with expand/collapse</li>
                    <li><i className="bi bi-braces me-1"></i> <strong>Compact View:</strong> Minified JSON on a single line</li>
                    <li><i className="bi bi-code me-1"></i> <strong>Raw JSON:</strong> Pretty-printed JSON with formatting</li>
                  </ul>
                </div>

                <div className="mb-3">
                  <strong>Search & Filter:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1">
                      <i className="bi bi-search me-1"></i>
                      <strong>Search:</strong> Find text in keys and values with highlighting
                    </li>
                    <li>
                      <i className="bi bi-funnel me-1"></i>
                      <strong>Filter Mode:</strong> Show only matching results and their paths
                    </li>
                  </ul>
                </div>

                <div>
                  <strong>Interactive Features:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1">• Click any key to select and see its path</li>
                    <li className="mb-1">• Copy individual values with the copy button</li>
                    <li>• Navigate using breadcrumb trail</li>
                  </ul>
                </div>
              </section>

              {/* JSONPath Query */}
              <section className="mb-4">
                <h6 className="text-purple mb-3" style={{ color: '#6f42c1' }}>
                  <i className="bi bi-search me-2"></i>
                  JSONPath Query Panel
                </h6>
                <div className="mb-3">
                  <strong>Direct JSONPath Queries:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1">• Write JSONPath expressions directly to query your data</li>
                    <li className="mb-1">• See real-time results as you type</li>
                    <li className="mb-1">• Access example queries and syntax reference</li>
                    <li>• Supports advanced features like filters, wildcards, and array slicing</li>
                  </ul>
                </div>
                <div>
                  <strong>Common Patterns:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1"><code>$</code> - Root object</li>
                    <li className="mb-1"><code>$.user.name</code> - Specific path</li>
                    <li className="mb-1"><code>$..email</code> - All email fields anywhere</li>
                    <li className="mb-1"><code>$.items[*]</code> - All array items</li>
                    <li><code>$.items[?(@.price &gt; 50)]</code> - Filtered results</li>
                  </ul>
                </div>
              </section>

              {/* AI Path Finder */}
              <section className="mb-4">
                <h6 className="text-warning mb-3">
                  <i className="bi bi-robot me-2"></i>
                  AI Path Finder Panel
                </h6>

                <div className="mb-3">
                  <strong>Setup:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1">
                      1. Click the <i className="bi bi-key"></i> button to configure your Gemini API key
                    </li>
                    <li>
                      2. Get a free API key from{' '}
                      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                        Google AI Studio
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="mb-3">
                  <strong>Finding Paths to Your Data:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1">• Ask in plain English how to find specific data in your JSON</li>
                    <li className="mb-1">• Get JSONPath expressions to locate your data</li>
                    <li className="mb-1">• Receive working code examples for accessing the data</li>
                    <li>• Examples: "Get all user emails", "Find items over $50", "Extract all addresses"</li>
                  </ul>
                </div>

                <div className="mb-3">
                  <strong>AI Response Includes:</strong>
                  <ul className="list-unstyled ms-3 mt-2">
                    <li className="mb-1"><strong>Explanation:</strong> What the AI understood from your query</li>
                    <li className="mb-1"><strong>JSONPath:</strong> The generated JSONPath expression</li>
                    <li className="mb-1"><strong>Code Examples:</strong> How to access the data in multiple programming languages</li>
                    <li className="mb-1"><strong>Results:</strong> The actual extracted data</li>
                    <li><strong>Technical Explanation:</strong> How the JSONPath expression works</li>
                  </ul>
                </div>

                <div>
                  <strong>Debug Mode:</strong>
                  <p className="ms-3 mb-0">
                    <i className="bi bi-bug me-1"></i>
                    Enable debug mode to see detailed API requests/responses and error information
                  </p>
                </div>
              </section>

              {/* Language Examples */}
              <section className="mb-4">
                <h6 className="text-secondary mb-3">
                  <i className="bi bi-code-slash me-2"></i>
                  Language Examples
                </h6>
                <p>
                  When you select any item in the Structure View, you'll see code examples showing how to access
                  that specific data in multiple programming languages:
                </p>
                <div className="row">
                  <div className="col-6">
                    <ul className="list-unstyled">
                      <li>🐍 Python</li>
                      <li>🟨 JavaScript</li>
                      <li>💎 Ruby</li>
                      <li>🐘 PHP</li>
                      <li>☕ Java</li>
                    </ul>
                  </div>
                  <div className="col-6">
                    <ul className="list-unstyled">
                      <li>🔷 C#</li>
                      <li>🐹 Go</li>
                      <li>🦀 Rust</li>
                      <li>🐦 Swift</li>
                      <li>🎯 Kotlin</li>
                    </ul>
                  </div>
                </div>
                <p className="mb-2">
                  <i className="bi bi-gear me-1"></i>
                  Click the <i className="bi bi-code-slash"></i> button in the navbar or the Configure button in any panel to choose which languages to display.
                </p>
                <p>
                  <strong>Note:</strong> The AI Path Finder generates accurate code for complex queries including array wildcards, filters, and aggregations.
                </p>
              </section>

              {/* Dark Mode */}
              <section className="mb-4">
                <h6 className="text-dark mb-3">
                  <i className="bi bi-moon me-2"></i>
                  Dark Mode
                </h6>
                <p>
                  Toggle between light and dark themes using the moon/sun button in the top navigation bar.
                  Your preference is automatically saved.
                </p>
              </section>

              {/* Tips */}
              <section>
                <h6 className="text-primary mb-3">
                  <i className="bi bi-lightbulb me-2"></i>
                  Pro Tips
                </h6>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Use the filter mode when working with large JSON files to focus on specific data
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Ask the AI Path Finder to help you find specific data using natural language
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Copy code examples directly from the language panels - they're automatically generated for your selected path
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Configure which programming languages to display using the language settings
                  </li>
                  <li>
                    <i className="bi bi-check-circle text-success me-2"></i>
                    Use the breadcrumb navigation to quickly jump to parent objects
                  </li>
                </ul>
              </section>

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Close
              </button>
              <a
                href="https://github.com/dr-harper/jsonpaths"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                <i className="bi bi-github me-1"></i>
                View on GitHub
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DocumentationModal;