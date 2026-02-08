# openplz.streets.ts Assessment

## Summary
- Specialized OpenPLZ query for street search.
- Supports postal code or locality filtering.

## Strengths
- Clear parameter validation.
- Uses shared OpenPLZ base for execution.

## Risks / Maintainability
- Ambiguous parameter usage when both postal code and locality are present.
- No error handling on the underlying request.

## Suggested Next Improvement (Optional)
- Clarify precedence rules for postal code vs locality.
- Add error handling in base or wrapper.
