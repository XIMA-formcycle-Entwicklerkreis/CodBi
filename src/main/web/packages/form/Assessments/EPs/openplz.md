# openplz.ts Assessment

## Summary
- Base EP for querying OpenPLZ via servlet.
- Passes country, orga unit, and optional query params.

## Strengths
- Centralizes request building for OpenPLZ features.
- Keeps API access server-side via plugin servlet.

## Risks / Maintainability
- No error handling for failed requests or JSON parse errors.
- Parameter order is long and easy to misuse.

## Suggested Next Improvement (Optional)
- Add error handling and reject on failures.
- Accept a single options object to reduce ordering mistakes.
