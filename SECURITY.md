# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| Older   | :x:                |

Only the latest release is actively supported with security updates.

## Reporting a Vulnerability

If you discover a security vulnerability in CodBi, **please do not open a public issue**. Instead, report it responsibly via one of the following channels:

- **Email**: [Callari@WaXCode.net](mailto:Callari@WaXCode.net)
- **GitHub Private Vulnerability Reporting**: Use the [Security Advisories](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev/security/advisories/new) feature to report privately.

### What to Include

- A description of the vulnerability and its potential impact.
- Steps to reproduce the issue.
- Affected versions or components (e.g., backend Kotlin, frontend TypeScript, specific element).
- Any suggested fix or mitigation, if available.

### Response Timeline

- **Acknowledgement**: Within 5 business days of your report.
- **Assessment**: We will evaluate the severity and impact within 10 business days.
- **Resolution**: We aim to publish a fix or mitigation as quickly as possible, depending on complexity.

You will be kept informed of progress throughout the process.

## Scope

This policy covers the CodBi-Dev plugin codebase, including:

- Backend Kotlin code (`src/main/kotlin/`)
- Frontend TypeScript/CSS code (`src/main/web/packages/`)
- CodBi Elements Template (`codbi-elements-template/`)
- Build and deployment configuration

## Security Best Practices for Contributors

- Never commit secrets, credentials, API keys, or tokens.
- Sanitize all user input on both client and server side.
- Follow the [OWASP Top 10](https://owasp.org/www-project-top-ten/) guidelines.
- Keep dependencies up to date and review them for known vulnerabilities.
- Use parameterized queries and avoid string concatenation for dynamic content.

## Disclosure Policy

We follow a coordinated disclosure approach. Once a fix is available, we will:

1. Release a patched version.
2. Publish a security advisory on GitHub.
3. Credit the reporter (unless they prefer to remain anonymous).
