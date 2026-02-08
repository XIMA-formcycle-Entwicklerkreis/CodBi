# onchange.conditional.ts Assessment

## Summary
- Applies conditional attribute changes based on comparisons.
- Supports numeric/date comparisons and target selection.

## Strengths
- Flexible attribute-based configuration.
- Supports date parsing for comparisons.

## Risks / Maintainability
- Complex attribute parsing and reliance on DOM structure.
- Throws on invalid dates but does not report gracefully.
- Uses global `window.codbi.checkAttributes` side effects.

## Suggested Next Improvement (Optional)
- Simplify target/candidate resolution.
- Add safe failure states for invalid comparisons.
- Provide clear logging for configuration issues.
