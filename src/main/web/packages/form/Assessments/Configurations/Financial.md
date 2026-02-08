# Financial.ts Assessment

## Summary
- Applies Cleave formatting for currency inputs.
- Configures thousands grouping and decimal mark.

## Strengths
- Minimal and focused configuration.
- Clear defaults for German-style formatting.

## Risks / Maintainability
- Assumes Cleave plugin is available and initialized.
- Fixed formatting (no per-field overrides).

## Suggested Next Improvement (Optional)
- Allow per-field overrides via data attributes.
- Add a guard to skip loading if `window.codbi` is absent.
