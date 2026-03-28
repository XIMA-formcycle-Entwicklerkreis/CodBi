# CodBi Elements — TypeScript Template

A ready-to-use project scaffold for building **CodBi TypeScript elements**
(Functionalities, Elementplaceholders, Configurations) with full documentation
support. Build outputs are importable directly via the **Local APIDoc Manager**.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build all elements (one-shot)
npm run build

# 3. Or start watching for changes
npm run watch
```

After building, look in `dist/APIDoc/` — each element gets its own `.json` file
that you can import via the APIDoc Manager's **Import** button.

---

## Project Structure

```
codbi-elements-template/
├── Functionalities/       ← Functionality sources (.ts / .tsx)
│   └── Example/
│       └── HelloWorld.ts
├── EPs/                   ← Elementplaceholder sources
│   └── Example/
│       └── CurrentDate.ts
├── Configurations/        ← Standard Configuration sources
│   └── Example.Holistic.ts
├── dist/                  ← Build output (git-ignored)
│   ├── *.js               ← Compiled IIFE bundles
│   └── APIDoc/            ← Importable JSON files
│       └── *.json
├── esbuild.config.mjs     ← esbuild bundler config
├── generate-codbi-json.mjs ← JSON generator (TSDoc → APIDoc)
├── global.d.ts            ← CodBi runtime type declarations
├── package.json
├── tsconfig.json
└── .vscode/
    ├── settings.json
    └── tasks.json          ← Ctrl+Shift+B → Build / Watch
```

### Folder Conventions

| Folder              | Element Type       | HTML attribute                      |
|---------------------|--------------------|-------------------------------------|
| `Functionalities/`  | Functionality      | `data-cb-func="<name>"`            |
| `EPs/`              | Elementplaceholder | `data-cb-ep="<name>"`              |
| `Configurations/`   | Standard Config    | *(loaded via `CodBi.loadConfig()`)* |

The **CodBi name** of each element is derived from the file path relative to the
project root, with path separators replaced by dots and the extension removed.

Example: `Functionalities/Example/HelloWorld.ts` → **`Example.HelloWorld`**

---

## Writing Elements

### Functionalities

```typescript
/**
 * Description shown in the APIDoc Manager.
 *
 * @codbi-param myParam — Explanation of this parameter
 */
class MyFunctionality {
    public static functionality(
        element: HTMLElement,
        params: Record<string, string>,
    ): void {
        const value = params["myParam"] || "default";
        // ... your logic
    }
}

CodBi.registerFunctionality("Example.MyFunctionality", MyFunctionality.functionality);
```

### Elementplaceholders (EPs)

```typescript
/**
 * Description for the EP.
 *
 * @codbi-param format — Some parameter
 */
class MyEP {
    public static ep(element: HTMLElement, params: Record<string, string>): void {
        // ... your logic
    }
}

CodBi.registerEP("Example.MyEP", MyEP.ep);
```

### Configurations

```typescript
/**
 * Description for the configuration.
 *
 * @codbi-css   myClass  — CSS class description
 * @codbi-global myGlobal — Global variable description
 */
(function () {
    const val = CodBi.loadConfig("Configurations.MyConfig", "myGlobal");
    // ... your logic
})();
```

---

## TSDoc Tags

The `generate-codbi-json.mjs` script extracts these custom tags from your TSDoc
comments and includes them in the generated JSON:

| Tag              | Purpose                               | Used by           |
|------------------|---------------------------------------|--------------------|
| `@codbi-param`   | Declares a named parameter            | Functionalities, EPs |
| `@codbi-css`     | Declares a CSS class entry            | Configurations     |
| `@codbi-global`  | Declares a global configuration var   | Configurations     |

Format: `@codbi-<tag> <name> — <description>`

The remaining TSDoc body (everything above the `@codbi-*` tags) is converted to
HTML and stored as the element's **Description** in the APIDoc Manager.

Supported TSDoc → HTML conversions:
- `**bold**` → `<b>bold</b>`
- `` `code` `` → `<code>code</code>`
- Fenced code blocks (` ``` `) → `<pre><code>…</code></pre>`
- Blank lines → paragraph breaks
- Lines starting with `- ` or `* ` → `<ul>` lists
- Lines starting with `1. ` → `<ol>` lists

---

## Importing into FORMCYCLE

1. Build the project (`npm run build`)
2. Open the **CodBi Local APIDoc Manager** in FORMCYCLE Designer
3. Click **Import** and select the `.json` file(s) from `dist/APIDoc/`
4. The element's code, description, and parameters are imported automatically

To **update** an existing element, delete it in the Manager first, then re-import.

---

## CodBi Runtime API (global.d.ts)

The `global.d.ts` file declares the `CodBi` namespace available at runtime:

| Function                      | Purpose                                    |
|-------------------------------|--------------------------------------------|
| `CodBi.registerFunctionality` | Register a Functionality handler           |
| `CodBi.registerEP`           | Register an Elementplaceholder handler     |
| `CodBi.loadConfig`           | Load a global value from a Configuration   |
| `CodBi.invokeFunctionality`  | Programmatically invoke a Functionality    |
| `CodBi.invokeEP`             | Programmatically invoke an EP              |

---

## Build Details

- **Bundler**: [esbuild](https://esbuild.github.io/) — each source file is
  compiled into a self-contained IIFE in `dist/`
- **Minification**: Enabled (required — the CodBi backend strips newlines from
  stored code, which would break `//` line comments)
- **TypeScript**: Strict mode, ESNext target, JSX support (React-compatible)
- **JSON generation**: Runs automatically after esbuild via `generate-codbi-json.mjs`
