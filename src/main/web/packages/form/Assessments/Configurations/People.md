# People.ts Assessment

## Summary
- Centralizes regex validation, formatting, and OpenPLZ autocomplete wiring.
- Covers alphanumeric, name, building number, email, phone, PLZ, age limits, and photo cropper.
- Provides both input and select configurations for OpenPLZ.

## Strengths
- Broad coverage of common “people” fields.
- Combines formatting and validation in one place.
- Includes autocomplete and selection helpers.

## Risks / Maintainability
- Large file with repeated patterns and regex literals.
- Heavy reliance on globals (e.g., `CodBi_OpenPLZ_Country`).
- Complex configs can be hard to test and update safely.

## Suggested Next Improvement (Optional)
- Extract repeated regex and Cleave config into helpers.
- Add input validation for required globals and selectors.
- Split into smaller modules (validation, autocomplete, media).
