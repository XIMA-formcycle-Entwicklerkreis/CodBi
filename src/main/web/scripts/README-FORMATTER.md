# CodBi Formatter - Automatic Formatting on Save

The CodBi formatter automatically applies your coding patterns (spacing, alignment, etc.) after Prettier formats your files.

## Setup Options

### Option 1: VS Code Extension (Recommended)

1. Install the extension from `ide/vscode/.vscode/extensions/codbi-formatter`
   - Press `Ctrl+Shift+P`
   - Type "Developer: Install Extension from Location..."
   - Select the `codbi-formatter` folder

2. Reload VS Code

3. The extension will automatically run after Prettier formats on save

### Option 2: File Watcher Script

Run the file watcher in the background:

```bash
node scripts/watch-and-format.js
```

Or add it as a VS Code task that runs on folder open (already configured in `tasks.json`).

### Option 3: Manual Task

Run the formatter manually when needed:
- Press `Ctrl+Shift+P`
- Type "Tasks: Run Task"
- Select "Format with CodBi Patterns"

## What it does

The formatter applies:
- ✅ Spacing around type assertions: `( variable as Type )`
- ✅ Spacing in generic types: `Map < string, number >`
- ✅ Spacing in object types: `{[ key: string ]: string }`
- ✅ Spacing in if statements: `if( condition )`
- ✅ Spacing in arrow function parameters: `( param ) =>`
- ✅ **Tabular alignment for variable declarations**

## Example

Before:
```typescript
const headers: {[key: string]: string} = {};
const questions: Map<string, [string, string]> = new Map();
```

After:
```typescript
const headers  : {[ key: string ]: string }         = {};
const questions: Map < string, [ string, string ]>  = new Map();
```
