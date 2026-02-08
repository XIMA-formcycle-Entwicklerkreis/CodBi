# html.input.trans.capital.ts Assessment

## Summary
- Capitalizes words on input change using a transformer.

## Strengths
- Simple and reusable transformer extension.
- Consistent capitalization behavior.

## Risks / Maintainability
- Lowercases all text, which may be undesirable for acronyms.
- No locale awareness for special casing.

## Suggested Next Improvement (Optional)
- Add optional mode to preserve existing capitalization.
- Use locale-aware casing if needed.
