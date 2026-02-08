# v.ts Assessment

## Summary
- Reads a global variable value from DOM by `data-name`.
- Optional `REPORT` mode throws on missing values.

## Strengths
- Simple and widely applicable.
- Clear error behavior when `REPORT` is used.

## Risks / Maintainability
- Hard-coded selector structure limits flexibility.
- Returns empty string on missing values without `REPORT`.

## Suggested Next Improvement (Optional)
- Allow alternate attribute names or selector patterns.
- Return `null` to distinguish missing values from empty strings.
