# PyPath JSON Navigator

Navigate JSON, Extract Python Paths

## Features

- **JSON Input Panel**: Paste or type JSON with real-time validation
- **Interactive Tree View**: Explore JSON structure with expandable/collapsible nodes
- **Python Path Generation**: Click any field to get its Python access path
- **Multiple Path Formats**: Dictionary notation and get() method alternatives
- **Path History**: Track recently accessed paths
- **Copy to Clipboard**: One-click copying of generated paths
- **Sample Data**: Load example JSON to test functionality

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Usage

1. Paste your JSON in the left panel
2. Explore the structure in the center view
3. Click on any field to see its Python path
4. Copy the path with one click

## Tech Stack

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS for styling
- Native JSON parsing

## Example

For JSON:
```json
{
  "user": {
    "profile": {
      "name": "John"
    }
  }
}
```

Clicking on "name" generates: `data['user']['profile']['name']`