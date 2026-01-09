# Prettier with CodBi Coding Patterns

This setup uses Prettier for basic formatting, then applies CodBi-specific spacing patterns.

## Setup

1. **Install Prettier extension** in VS Code: `esbenp.prettier-vscode`

2. **Install dependencies** (if using the plugin):
   ```bash
   cd src/main/web
   yarn add -D prettier
   ```

3. **Format on Save**: Prettier will format automatically when you save TypeScript/JavaScript files.

## Applying CodBi Patterns

The custom spacing patterns (spaces inside parentheses, type assertions, etc.) are applied via a post-processing script:

```bash
# Apply patterns to a specific file
node scripts/apply-codbi-patterns.js path/to/file.ts

# Or use the VS Code task (Ctrl+Shift+P -> "Run Task" -> "Format with CodBi Patterns")
```

## Limitations

Prettier doesn't support custom spacing patterns natively. The post-processing script handles:
- Type assertions: `( variable as Type )`
- Generic types: `Map < Type >`
- Object types: `{[ key: string ]: string }`
- If statements: `if( condition )`
- Arrow function parameters: `( param ) =>`

## Automatic Application

To apply patterns automatically on save, you can:
1. Use the VS Code task (see tasks.json)
2. Create a VS Code extension hook
3. Use a git pre-commit hook
