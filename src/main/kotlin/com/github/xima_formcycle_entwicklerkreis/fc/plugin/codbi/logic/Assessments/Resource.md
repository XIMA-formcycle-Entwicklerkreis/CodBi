# Resource.kt Assessment

## Summary
- Simple resource-serving servlet for static assets in the JAR.
- Handles MIME type inference and cache headers.
- Clear default behavior when no path is provided.

## Strengths
- Straightforward, minimal logic.
- Good cache-control for static assets.
- MIME type mapping covers common asset types.

## Risks / Maintainability
- Error response always references the default SVG path, not the requested path.
- No validation/sanitization of the `Path` parameter (could be used to access unintended resources within the JAR).
- `CONTENT_TYPE_SVG` constant is unused.

## Suggested Next Improvement (Optional)
- Return the requested path in error messages.
- Validate/normalize `Path` to avoid path traversal within the JAR.
- Remove unused constants or use them in defaults.
