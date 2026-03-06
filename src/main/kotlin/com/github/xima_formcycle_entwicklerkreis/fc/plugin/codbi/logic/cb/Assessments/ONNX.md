# ONNX.kt Assessment

## Summary
- Solid base class for ONNX lifecycle, native provisioning, and model/predictor pooling.
- Defensive initialization and cleanup logic with good logging.
- Heavy reliance on global properties and filesystem side effects.

## Strengths
- Clear lifecycle handling with `AI_Remove` support and cleanup.
- Robust native extraction and caching from Maven.
- Predictor pooling improves concurrency and reduces overhead.
- Defensive engine initialization and tokenizers pre-init workaround.

## Risks / Maintainability
- Global `System.setProperty` changes can affect other components.
- ONNX initialization logic and filesystem management are tightly coupled.
- Cleanup deletes shared caches (tokenizers/DJL) which may affect other AI modules.

## Suggested Next Improvement (Optional)
- Encapsulate filesystem/cache management into a dedicated service.
- Add safer cache cleanup scoping (avoid deleting shared tokenizers/DJL by default).
- Centralize property-setting to reduce global side effects.
