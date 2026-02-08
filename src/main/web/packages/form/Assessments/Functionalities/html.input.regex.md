# html.input.regex.ts Assessment

## Summary
- Enforces regex-based input validation and key filtering.
- Shows configurable error messages on invalid values.

## Strengths
- Supports both full-value and per-key validation.
- Clear error messaging hooks.

## Risks / Maintainability
- Keydown filtering blocks some non-character keys.
- Regex flags default to `g` which may be unexpected.

## Suggested Next Improvement (Optional)
- Refine key filtering to allow navigation/control keys.
- Use `i` as default flag or make defaults explicit.
