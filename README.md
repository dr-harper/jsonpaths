# JSON Path Navigator

Navigate JSON, Generate Multi-Language Access Paths

## Features

- **JSON Input Panel**: Paste or type JSON with real-time validation
- **Interactive Tree View**: Explore JSON structure with expandable/collapsible nodes
- **Multi-Language Path Generation**: Click any field to get language-specific access code for Python, JavaScript, Ruby, PHP, Java, C#, Go, Rust, Swift, and Kotlin
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
3. Click on any field to see access snippets for your selected languages
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

Clicking on "name" generates:

```text
🐍 Python: data['user']['profile']['name']
🟨 JavaScript: data.user.profile.name
💎 Ruby: data.dig('user', 'profile', 'name')
🐘 PHP: $data['user']['profile']['name']
☕ Java (JsonNode): data.path("user").path("profile").path("name")
🔷 C#: data["user"]["profile"]["name"]
🐹 Go (using map[string]any): data.(map[string]any)["user"].(map[string]any)["profile"].(map[string]any)["name"]
🦀 Rust: data["user"]["profile"]["name"]
🐦 Swift: data["user"]["profile"]["name"]
🎯 Kotlin (kotlinx.serialization): data.jsonObject["user"]?.jsonObject["profile"]?.jsonObject["name"]
```
