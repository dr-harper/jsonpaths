# AI Agent Guidelines for JSON Path Navigator

## Project Overview
JSON Path Navigator is a React-based web application that helps developers visualize JSON data structures and generate access paths in multiple programming languages. Users can paste JSON data, explore its structure interactively, and get language-specific code snippets for accessing specific fields.

## Key Features
- **JSON Validation & Parsing**: Real-time JSON validation with error messages
- **Interactive Tree View**: Expandable/collapsible JSON structure visualization
- **Multi-Language Path Generation**: Generates access paths for Python, JavaScript, Ruby, PHP, Java, C#, Go, Rust, Swift, and Kotlin
- **Search & Filter**: Search within JSON structure
- **View Modes**: Tree, Compact, and Raw JSON views
- **Customizable Languages**: Users can enable/disable languages via settings

## Architecture

### Tech Stack
- **Frontend Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Bootstrap 5 (Flatly theme) + Tailwind CSS
- **Icons**: Bootstrap Icons
- **State Management**: React hooks (useState, useEffect)

### Project Structure
```
src/
├── components/
│   ├── JsonTreeView.tsx    # JSON structure visualization
│   ├── LanguageExamples.tsx # Multi-language path generation
│   ├── JsonInput.tsx        # JSON input handling
│   ├── JsonTree.tsx         # Tree rendering logic
│   ├── PythonPath.tsx       # Python-specific path generation
│   └── Header.tsx           # Navigation header
├── types/                   # TypeScript type definitions
├── App.tsx                  # Main application component
└── main.tsx                 # Application entry point
```

## Development Guidelines

### When Adding New Features

1. **Language Support**: To add a new programming language:
   - Update `LanguageExamples.tsx`
   - Add language to the `generatePath` function
   - Add language configuration to the `defaultLanguages` array
   - Follow existing patterns for bracket/dot notation

2. **UI Components**:
   - Use Bootstrap components for consistency
   - Follow the existing card-based layout pattern
   - Maintain responsive design (col-12, col-md-6, col-lg-4 grid)

3. **State Management**:
   - Keep state in App.tsx when shared between components
   - Use localStorage for user preferences (see language preferences)
   - Handle errors gracefully with user-friendly messages

### Code Style Conventions

1. **TypeScript**:
   - Define interfaces for all props
   - Use strict typing (avoid `any`)
   - Export components as default exports

2. **React Patterns**:
   - Use functional components with hooks
   - Keep components focused and single-purpose
   - Extract complex logic into separate functions

3. **Styling**:
   - Primary: Bootstrap classes for layout
   - Secondary: Inline styles for specific adjustments
   - Use Bootstrap color classes (text-primary, bg-light, etc.)

## Common Tasks

### Adding a New View Mode
1. Update the `viewMode` state type in App.tsx
2. Add new button to the view mode toggle group
3. Implement rendering logic in JsonTreeView component

### Improving Path Generation
1. Check `generatePath` function in LanguageExamples.tsx
2. Consider language-specific syntax rules
3. Handle edge cases (special characters, reserved keywords)

### Adding Export Functionality
1. Create new export component
2. Access current `jsonData` and `selectedPath` from App state
3. Generate appropriate format (CSV, XML, etc.)

## Testing Considerations

### Key Test Scenarios
1. **JSON Parsing**: Valid/invalid JSON, edge cases (empty objects, deep nesting)
2. **Path Generation**: Special characters in keys, numeric indices, mixed paths
3. **UI Interactions**: Click to select, copy functionality, settings persistence
4. **Language Accuracy**: Verify generated paths work in target languages

### Sample Test Data
The app includes a "Sample" button that loads comprehensive test JSON with:
- Nested objects
- Arrays
- Various data types
- Mixed key types

## Performance Optimization

### Areas to Consider
1. **Large JSON Files**: Implement virtualization for very large structures
2. **Search Performance**: Consider debouncing search input
3. **Re-rendering**: Use React.memo for expensive components

## Security Notes

1. **JSON Parsing**: Uses native `JSON.parse()` - safe from injection
2. **Clipboard Access**: Uses modern Clipboard API with proper error handling
3. **Local Storage**: Only stores UI preferences, no sensitive data

## Deployment

### Build Process
```bash
npm run build  # Creates optimized production build in dist/
```

### Environment Requirements
- Node.js 18+
- Modern browser with ES6+ support
- Clipboard API support for copy functionality

## Future Enhancement Ideas

1. **Import/Export**: Support file upload/download
2. **JSONPath Queries**: Add JSONPath expression support
3. **Diff View**: Compare two JSON structures
4. **Schema Validation**: Validate against JSON Schema
5. **API Integration**: Fetch JSON from URLs
6. **Syntax Highlighting**: Enhanced code highlighting in examples
7. **Keyboard Navigation**: Arrow keys for tree navigation
8. **Dark Mode**: Theme toggle support

## Debugging Tips

1. **JSON Validation Errors**: Check console for parse errors
2. **Path Generation Issues**: Verify regex patterns in generatePath
3. **UI State Problems**: Use React DevTools to inspect component state
4. **Copy Failures**: Check browser console for Clipboard API errors

## Contributing Guidelines

1. Maintain existing code style
2. Add TypeScript types for new features
3. Test with various JSON structures
4. Ensure responsive design works on mobile
5. Update this document when adding major features

## CRITICAL: Pre-Commit Checklist

**ALWAYS run these checks before committing any changes:**

1. **Build Test**: Run `npm run build` to ensure the production build succeeds
   - Fix any TypeScript errors
   - Fix any JSX syntax errors (especially `>` characters in JSX that need escaping as `&gt;`)
   - Resolve any import/export issues

2. **Development Server**: Verify the dev server runs without errors
   - Check console for runtime errors
   - Test the changed functionality

3. **Type Check**: Run `npm run typecheck` if available, or rely on build process

**Never commit code that fails to build!**