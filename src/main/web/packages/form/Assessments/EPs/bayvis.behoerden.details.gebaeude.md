# bayvis.behoerden.details.gebaeude.ts Assessment

## Summary
- Retrieves building details for a BayVIS authority/building pair.
- Supports XML and JSON responses.
- Allows property selection.

## Strengths
- Clear parameter validation.
- Handles JSON fallback path.
- Simple output for templating.

## Risks / Maintainability
- Buffer map is unused and never populated.
- Error message references the wrong servlet in failure path.
- Lacks response validation for missing properties.

## Suggested Next Improvement (Optional)
- Implement or remove the unused buffer.
- Correct error message for this endpoint.
- Add response shape checks.
