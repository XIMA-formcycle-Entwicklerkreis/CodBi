# sorted.ts Assessment

## Summary
- Sorts arrays alphabetically, optionally by object property.

## Strengths
- Simple and predictable utility.
- Property-based sorting is useful for object arrays.

## Risks / Maintainability
- In-place sort mutates input array.
- Assumes property values are strings.

## Suggested Next Improvement (Optional)
- Clone before sorting to avoid side effects.
- Support numeric or custom comparator options.
