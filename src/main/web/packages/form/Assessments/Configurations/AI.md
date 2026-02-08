# AI.ts Assessment

## Summary
- Registers standard AI-related input mappings for Donut QA and Tesseract outputs.
- Applies a default regex transform to target inputs.
- Auto-loads configuration on module import.

## Strengths
- Clear, minimal configuration surface.
- Consistent defaults for extractor and replacements.
- Small and easy to reason about.

## Risks / Maintainability
- Assumes `window.codbi` is available at load time.
- Default regex applies to all tagged fields without opt-out.
- No validation of target elements or data attributes.

## Suggested Next Improvement (Optional)
- Guard against missing `window.codbi` and defer loading if needed.
- Allow overrides for `Extractor`/`Replacements` via data attributes.
- Add a small runtime warning when no targets match.
