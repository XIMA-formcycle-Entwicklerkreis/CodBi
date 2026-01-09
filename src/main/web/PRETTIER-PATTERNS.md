# Prettier Configuration vs CodBi Patterns

This document explains which CodBi coding patterns can be configured directly in Prettier and which require post-processing.

## ✅ Patterns Configured in Prettier

These patterns are handled directly by Prettier via `.prettierrc.json`:

### Basic Formatting
- ✅ **Semicolons**: `"semi": true` - Always use semicolons
- ✅ **Quotes**: `"singleQuote": false` - Use double quotes
- ✅ **Trailing Commas**: `"trailingComma": "es5"` - Add trailing commas where valid
- ✅ **Line Width**: `"printWidth": 120` - Wrap lines at 120 characters
- ✅ **Indentation**: `"tabWidth": 2` - Use 2 spaces for indentation
- ✅ **Tabs vs Spaces**: `"useTabs": false` - Use spaces, not tabs
- ✅ **Arrow Function Parens**: `"arrowParens": "always"` - Always include parentheses
- ✅ **Object Literal Spacing**: `"bracketSpacing": true` - `{ foo: bar }` not `{foo: bar}`

## ❌ Patterns Requiring Post-Processing

These patterns **cannot** be configured in Prettier and require the `apply-codbi-patterns.js` script:

### Spacing Patterns (Not Supported by Prettier)
- ❌ **Type Assertions**: `( variable as Type )` - Prettier outputs `(variable as Type)`
- ❌ **Generic Types**: `Map < string, number >` - Prettier outputs `Map<string, number>`
- ❌ **Object Type Definitions**: `{[ key: string ]: string }` - Prettier outputs `{[key: string]: string}`
- ❌ **If Statements**: `if( condition )` - Prettier outputs `if (condition)` or `if(condition)`
- ❌ **Arrow Function Parameters**: `( param ) =>` - Prettier outputs `(param) =>`
- ❌ **Array Access**: `obj[ key ]` - Prettier outputs `obj[key]`

### Alignment Patterns (Not Supported by Prettier)
- ❌ **Tabular Variable Alignment**: Prettier doesn't align variable declarations in columns

## Why Prettier Can't Handle These

Prettier is intentionally opinionated and doesn't support fine-grained spacing control. It focuses on:
- Consistent formatting
- Automatic code style enforcement
- Avoiding style debates

Your patterns require text-level post-processing that Prettier's AST-based formatter cannot provide.

## Solution

1. **Prettier** formats the code (handles basic formatting)
2. **apply-codbi-patterns.js** applies your custom spacing and alignment patterns

This two-step process ensures you get both Prettier's consistency and your specific coding patterns.
