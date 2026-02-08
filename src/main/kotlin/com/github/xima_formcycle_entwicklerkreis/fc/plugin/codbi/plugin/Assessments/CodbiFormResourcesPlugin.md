# CodbiFormResourcesPlugin.kt Assessment

## Summary
- Registers static and dynamic frontend resources for forms.
- Scans JAR or filesystem to auto-register JS/CSS.
- Injects Matomo and LDAP settings dynamically.

## Strengths
- Handles both JAR and dev filesystem layouts.
- Cache-busting via versioned resource URLs.
- Dynamic JS settings are safely escaped.

## Risks / Maintainability
- `getResources()` hardcodes Matomo settings, ignoring plugin config.
- Resource scanning is heavy and logs at info for each file.
- Duplicated descriptor creation logic (`formResourceDescriptor` and `templateFormResourceDescriptor`).

## Suggested Next Improvement (Optional)
- Use configured Matomo values consistently (remove hardcoded defaults).
- Reduce logging noise or gate behind debug flag.
- Deduplicate descriptor creation methods.
