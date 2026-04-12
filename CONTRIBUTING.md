# Contributing to CodBi-Dev

Thank you for your interest in contributing to CodBi-Dev! This document provides guidelines and instructions for contributing.

## Table of Contents

- [QA Testing — Contribute Without Coding](#qa-testing--contribute-without-coding)
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Commit Guidelines](#commit-guidelines)
- [Pull Requests](#pull-requests)
- [Code Style](#code-style)
- [Reporting Issues](#reporting-issues)

## QA Testing — Contribute Without Coding

We are always looking for people who want to help by **testing CodBi elements** across different operating systems and browsers. You do **not** need to be a developer to participate!

### How It Works

We maintain a **QA portal** with dedicated test containers for each CodBi element. Each container includes instructions on what to test. After testing:

1. **Your OS and browser are detected automatically** in the result area.
2. You select whether the test was **successful** or an **error** occurred.
3. You submit the form — the maintainer of the CodBi element receives an e-mail notification.
4. When the maintainer fixes the reported error, they use the same container to submit an **error resolved** result.
5. You’ll receive an automated email once the fix is deployed. Please re-test the system to ensure everything is working as expected. If the problem remains, feel free to report it again.

All results are instantly reflected on the **system overview page**, which shows the current status (working / not working) per OS, browser, and CodBi element:

> **[CodBi Testing — System Overview](https://forms.ansbach.de/frontend-server/form/alias/1/CodBi_Testing_Systemuebersicht)**

### Tested Platforms

| OS | Browsers |
| --- | --- |
| Windows | Firefox, Chrome, Edge |
| macOS | Firefox, Chrome, Edge, Safari |
| Linux | Firefox, Chrome, Chromium, Edge |
| iOS | Firefox, Chrome, Edge, Safari |

### How to Participate

To start testing you will need a **Tester ID** and the **form password**. Send an e-mail to **Salvatore.Callari@Ansbach.de** to request them.

---

## Code of Conduct

Please be respectful and constructive in all interactions. We are committed to providing a welcoming and inclusive experience for everyone.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```shell
   git clone https://github.com/<your-username>/CodBi-Dev.git
   ```
3. Add the upstream remote:
   ```shell
   git remote add upstream https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev.git
   ```
4. Create a new branch for your work:
   ```shell
   git checkout -b feature/your-feature-name
   ```

## Development Setup

This is a Maven project that also uses yarn for frontend resources. You do **not** need to install yarn or Node.js — the `frontend-maven-plugin` handles that automatically.

### Prerequisites

- Java JDK (see `pom.xml` for the required version)
- Maven (or use the included Maven Wrapper `mvnw` / `mvnw.cmd`)

### Build

```shell
# Full build
./mvnw clean package

# Quick dev build (non-minified, no tests)
./mvnw package -Pdev

# Start a local formcycle server with the plugin
./mvnw fc-server:run-ms-war

# Build and deploy to locally running server
./mvnw -Pdev fc-deploy:deploy
```

On Windows, substitute `./mvnw` with `mvnw.cmd`.

### IDE

We recommend **IntelliJ** for backend Kotlin code and **Visual Studio Code** for frontend TypeScript/CSS code. Pre-configured IDE settings are available in the `ide/` folder. See the [README](README.md#ide) for details.

## Making Changes

1. Make sure your branch is up to date with upstream:
   ```shell
   git fetch upstream
   git rebase upstream/main
   ```
2. Make your changes in small, focused commits.
3. Add or update tests where applicable.
4. Ensure the build passes:
   ```shell
   ./mvnw clean package
   ```

## Commit Guidelines

- Use clear, descriptive commit messages.
- Start the subject line with a verb in imperative mood (e.g., "Add", "Fix", "Update").
- Keep the subject line under 72 characters.
- Reference related issues where applicable (e.g., `Fixes #42`).

## Pull Requests

1. Push your branch to your fork:
   ```shell
   git push origin feature/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of the upstream repository.
3. Provide a clear description of your changes and the problem they solve.
4. Link any related issues.
5. Wait for a code review. Address any feedback promptly.

### PR Checklist

- [ ] Code compiles without errors (`./mvnw clean package`)
- [ ] Tests pass
- [ ] Code is formatted (see [Code Style](#code-style))
- [ ] TSDoc / KDoc is added for new public APIs
- [ ] Commit messages are clear and descriptive

## Code Style

We use [Spotless](https://github.com/diffplug/spotless/blob/main/plugin-maven/README.md) to enforce consistent formatting. A git hook is installed automatically and formats code on commit.

To format manually:

```shell
./mvnw spotless:apply
```

- **Kotlin**: Formatted with [ktfmt](https://facebook.github.io/ktfmt/) (default `Meta` style).
- **TypeScript / CSS**: Formatted with [Biome](https://biomejs.dev/).

### Additional Conventions

- Kotlin backend classes use KDoc documentation.
- TypeScript classes use TSDoc with `@remarks` sections including `Initial Author` and `Maintainer` fields.
- All public-facing CodBi elements (Functionalities, Element Placeholders, Standard Configurations) must include TSDoc with `@codbi-param`, `@codbi-css`, and/or `@codbi-global` tags as applicable.

## Reporting Issues

- Use the [GitHub Issues](https://github.com/XIMA-formcycle-Entwicklerkreis/CodBi-Dev/issues) page.
- Include steps to reproduce, expected behaviour, and actual behaviour.
- Include the formcycle version and browser version if relevant.
- Attach screenshots or log output where helpful.

## License

By contributing, you agree that your contributions will be licensed under the same license as the project. See [LICENSE](LICENSE) for details.
