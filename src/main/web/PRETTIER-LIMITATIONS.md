# Prettier Spacing Limitations

## ❌ What Prettier CANNOT Do

Prettier **does not support** spacing between letters/digits and control characters. This is by design - Prettier is intentionally opinionated and doesn't allow fine-grained spacing control.

### Your Patterns That Prettier Cannot Handle:

1. **Parentheses spacing**: `( variable )` ❌
   - Prettier outputs: `(variable)` or `( variable)` (only in specific contexts)
   - Your pattern: `( variable )` - spaces on both sides

2. **Bracket spacing**: `[ key ]` ❌
   - Prettier outputs: `[key]`
   - Your pattern: `[ key ]` - spaces inside brackets

3. **Type assertions**: `( variable as Type )` ❌
   - Prettier outputs: `(variable as Type)`
   - Your pattern: `( variable as Type )` - spaces inside parentheses

4. **Generic types**: `Map < string >` ❌
   - Prettier outputs: `Map<string>`
   - Your pattern: `Map < string >` - spaces around angle brackets

5. **If statements**: `if( condition )` ❌
   - Prettier outputs: `if (condition)` or `if(condition)`
   - Your pattern: `if( condition )` - no space after `if`, space before closing paren

6. **Object types**: `{[ key: string ]: string }` ❌
   - Prettier outputs: `{[key: string]: string}`
   - Your pattern: `{[ key: string ]: string }` - spaces inside brackets

## ✅ What Prettier CAN Do

Prettier only supports these spacing options:

1. **`bracketSpacing`**: Controls `{ foo: bar }` vs `{foo: bar}` (object literals only)
2. **`spaceBeforeFunctionParen`**: Controls `function foo()` vs `function foo ()` (function declarations only)
3. **`arrowParens`**: Controls `(x) =>` vs `x =>` (arrow functions only)

## Why Prettier Can't Do This

Prettier's philosophy is:
- **Consistency over configurability** - One style, enforced everywhere
- **AST-based formatting** - Works at the syntax tree level, not text level
- **No style debates** - Removes spacing decisions from developers

Your patterns require **text-level post-processing** that Prettier's AST formatter cannot provide.

## Solution

The **post-processing script** (`apply-codbi-patterns.js`) is the correct solution because:
1. Prettier formats the code structure (AST level)
2. The script applies your spacing patterns (text level)
3. This two-step process gives you both Prettier's consistency and your specific style

This is the standard approach for custom spacing patterns that Prettier doesn't support.
