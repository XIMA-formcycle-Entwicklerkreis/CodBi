# openplz.organizationalunits.ts Assessment

## Summary
- Retrieves organizational units and optional details.
- Supports lookup by numeric key or by name.

## Strengths
- Flexible handling for both numeric and name lookup.
- Reuses base OpenPLZ endpoint.

## Risks / Maintainability
- Multiple nested AJAX calls without error handling.
- Repeats request-building logic instead of using base helper.

## Suggested Next Improvement (Optional)
- Add consistent error handling for all branches.
- Refactor to reuse base `OpenPLZ.retrieve` helper.
