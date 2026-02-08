# openplz.localities.ts Assessment

## Summary
- Specialized OpenPLZ query for localities.
- Accepts name and postal code regex.

## Strengths
- Builds on shared OpenPLZ base.
- Clear parameter validation.

## Risks / Maintainability
- Duplicate `params[3]` passed twice in call array.
- Regex prefixing with `°` is opaque to callers.

## Suggested Next Improvement (Optional)
- Fix parameter list length and remove duplicate entries.
- Document or encapsulate the `°` prefix behavior.
