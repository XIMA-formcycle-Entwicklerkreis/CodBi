# unique.ts Assessment

## Summary
- Removes duplicates from an array, optionally by property name.
- Delegates to `removeDuplicates` helper.

## Strengths
- Simple API and reusable helper.
- Supports property-based uniqueness.

## Risks / Maintainability
- Behavior depends on external helper implementation.
- No option for stable ordering or custom equality.

## Suggested Next Improvement (Optional)
- Document `removeDuplicates` behavior in this module.
- Add optional comparator or key selector.
