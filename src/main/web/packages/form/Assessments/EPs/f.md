# f.ts Assessment

## Summary
- Filters array items by property name and value.
- Returns matches as an array.

## Strengths
- Simple, predictable behavior.
- Validates parameter types and arity.

## Risks / Maintainability
- No support for deep property paths.
- Strict equality may be too limiting for string comparisons.

## Suggested Next Improvement (Optional)
- Support nested property paths.
- Allow optional case-insensitive comparison for strings.
