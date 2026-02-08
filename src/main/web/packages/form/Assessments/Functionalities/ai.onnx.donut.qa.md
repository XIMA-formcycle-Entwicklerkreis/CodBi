# ai.onnx.donut.qa.ts Assessment

## Summary
- Sends document images to the Donut QA backend and maps answers to fields.
- Supports PDF processing and optional rotation control.
- Collects questions from DOM elements in the upload container.

## Strengths
- Clear separation of question discovery and request building.
- Handles PDF conversion into images.
- Useful logging for missing question attributes.

## Risks / Maintainability
- Large method with UI, PDF, and network concerns intertwined.
- No explicit error handling for failed requests.
- Assumes DOM structure for container lookup.

## Suggested Next Improvement (Optional)
- Extract PDF handling and request dispatch into helpers.
- Add failure UI states and error messages.
- Allow a configurable selector for question elements.
