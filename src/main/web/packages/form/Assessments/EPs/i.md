# i.ts Assessment

## Summary
- Returns a value at a given index from an array.
- Allows non-array second parameter when index is `0`.

## Strengths
- Clear behavior with validation.
- Simple utility for templates.

## Risks / Maintainability
- Error message references “global variable” and can be confusing.
- If index is out of range, returns `undefined` without warning.

## Suggested Next Improvement (Optional)
- Improve error messages and out-of-range handling.
- Disallow non-array inputs unless explicitly intended.
