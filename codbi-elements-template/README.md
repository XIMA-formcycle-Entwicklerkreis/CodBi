[![MIT License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)
[![TypeScript](https://img.shields.io/badge/typescript-%3E%3D4.9.0-3178c6.svg)](https://www.typescriptlang.org/)
[![VS Code](https://img.shields.io/badge/optimized%20for-VS%20Code-007acc.svg)](https://code.visualstudio.com/)

# 🧩 CodBi Elements Template

**TypeScript Scaffold for Custom CodBi Elements**

A ready-to-use project template for building **CodBi elements** in **TypeScript** — including Functionalities, Element Placeholders (EPs), and Standard Configurations — with full documentation support. Build outputs are directly importable via the **CodBi Local API-Documentation Manager** in Formcycle.

---

## 🚀 Key Highlights

- 🛠️ **Seamless Integration** — Build, document, and export custom CodBi elements as JSON for direct import into CodBi's Local API-Documentation Manager in Formcycle Designer.
- 📝 **TypeScript-First** — Author elements in modern TypeScript (strict mode, ESNext, JSX supported).
- 📄 **Automated Documentation** — TSDoc comments are automatically extracted and included in the generated JSON for rich in-designer documentation.
- 🗂 **Modular Structure** — Organize your code by Functionalities, EPs, and Configurations for clarity and maintainability.
- 🔒 **Design By Contract (XDbC)** — Use XDbC decorators for robust runtime validation of parameters, return values, and invariants in your elements.
- ⚡ **Efficient Bundling** — Uses esbuild for fast, minified, self-contained outputs.
- 💻 **VS Code Ready** — Includes recommended settings and build tasks for a smooth developer experience.

---

## 📦 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build all elements (one-shot)
npm run build

# 3. Or start watching for changes
npm run watch
```

After building, find importable `.json` files in `dist/APIDoc/`. Import them into Formcycle via the APIDoc Manager's **Import** button.

### ⚡ Build a Single Element

To compile only the currently open file (instead of the entire project), use the **Build Current Element** VS Code task (`Ctrl+Shift+P` → `Tasks: Run Task` → `Build Current Element`). This runs esbuild and the JSON generator for just that one `.ts` file — significantly faster than a full build.

From the command line:
```bash
node esbuild.config.mjs --file=Functionalities/Example/HelloWorld.ts
node generate-codbi-json.mjs --file=Functionalities/Example/HelloWorld.ts
```

---

## 🗂 Project Structure

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

### 📁 Folder Conventions

| Folder              | Element Type       | HTML attribute                      |
|---------------------|--------------------|-------------------------------------|
| `Functionalities/`  | 🧩 Functionality      | `data-cb-func="<name>"`            |
| `EPs/`              | 🧩 Elementplaceholder | *(inside ``data-cb-`-Parameter)              |
| `Configurations/`   | 🧩 Standard Config    | *(loaded via `CodBi.loadConfig()`)* |

The **CodBi name** of each element is derived from its file path relative to the project root, with path separators replaced by dots and the extension removed. Example: `Functionalities/Example/HelloWorld.ts` → `Example.HelloWorld`

---

## 🔒 XDbC: Design by Contract for TypeScript

This template includes [XDbC](https://www.npmjs.com/package/xdbc) (**eXplicit Design by Contract™**) for robust runtime validation of parameters, return values, and invariants using decorators. XDbC enables you to specify contracts (such as regex, type, or custom logic) directly on your classes and methods, improving reliability and documentation.

**Key Features:**
- Declarative validation for parameters, return values, and fields
- Supports contracts like REGEX, TYPE, EQ, AE (array element), INSTANCE, and more
- Clear error messages and contract violation reporting

**Common Contracts:**

| Decorator | Purpose | Example |
|-----------|---------|---------|
| `@TYPE.PRE()` | Validate parameter types | `@TYPE.PRE("string", "propName")` |
| `@REGEX.PRE()` | Regex pattern validation | `@REGEX.PRE(/^(D\|W\|M\|Y)$/i, "unit")` |
| `@REGEX.POST()` | Regex validation on return value | `@REGEX.POST(/^\d{4}-\d{2}-\d{2}$/)` |
| `@INSTANCE.PRE()` | DOM type instance checking | `@INSTANCE.PRE(HTMLInputElement)` |
| `@EQ.PRE()` | Equality check on a property | `@EQ.PRE("text", false, "type")` |
| `@GREATER.PRE()` | Greater-than check | `@GREATER.PRE(1, true, false, "length")` |
| `@AE.PRE()` | Array-element validation | `@AE.PRE([new TYPE("object")])` |
| `@IF.PRE()` | Conditional conversion | `@IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "prop")` |

---

## ✍️ Writing Elements

### ⚡ Functionalities (with XDbC)

Functionalities use the signature `public static functionality(toLoad, toProcess)`, where `toLoad` is the parameters object and `toProcess` is the HTML element the functionality is applied to. XDbC decorators validate both at runtime:

```typescript
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC

/**
 * Sets minimum date validation on an input element.
 *
 * @codbi-param minimum — Number of days/weeks/months/years from today
 * @codbi-param unit — D (days), W (weeks), M (months), or Y (years)
 */
class Date_Min {
    @DBC.ParamvalueProvider
    public static functionality(
        // Validate that 'minimum' param is numeric (string→number conversion)
        @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "minimum")
        // Validate that 'unit' param is one of D, W, M, or Y
        @REGEX.PRE(/(D|W|M|Y)/i, "unit", "Unit must be D, W, M, or Y")
        toLoad: { [key: string]: unknown },

        // Ensure the target element is an <input type="text">
        @INSTANCE.PRE(
            HTMLInputElement,
            undefined,
            'Is it not an <input/> that is tagged with this functionality?',
        )
        @EQ.PRE("text", false, "type","Is it not an <input type="text"/> that is tagged with this functionality?")
        toProcess: Element,
    ): void {
        const input = toProcess as HTMLInputElement;
        const minimum = Number(toLoad["minimum"]);
        const unit = String(toLoad["unit"]).toUpperCase();
        // ... date logic
    }
}

window.codbi.registerFunctionality("Example.Date.Min", Date_Min.functionality.bind(Date_Min));
```

#### 🔄 Using `@REGEX.POST()` for Return-Value Validation

```typescript
import { REGEX } from "xdbc/src/DBC/REGEX";

class DateFormatter {
    /** Ensures the returned string is always a valid YYYY-MM-DD date. */
    @REGEX.POST(/^\d{4}-\d{2}-\d{2}$/)
    static formatDate(date: Date): string {
        return date.toISOString().slice(0, 10);
    }
}
```

#### 🔍 Runtime DOM Checks with `INSTANCE.tsCheck()` and `EQ.tsCheck()`

Use `INSTANCE.tsCheck()` and `EQ.tsCheck()` inside method bodies to validate `querySelector` results at runtime — for example, verifying that a selected element is an `<input type="file">`:

```typescript
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";

// Verify that the element with class ".MyUpload" is an <input type="file">
const upload = INSTANCE.tsCheck<HTMLInputElement>( DEFINED.tsCheck<HTMLInputElement>(container.querySelector(".MyUpload"),"Is \".MyUpload\" even existing within the form?"), HTMLInputElement, 'Is the element tagged with ".MyUpload" not an <input>?');

EQ.tsCheck(upload.type, "file", 'Is the element tagged with ".MyUpload" not an <input> of type "file"?');
```

`INSTANCE.tsCheck<T>(value, Type, errorMessage?)` narrows the type and throws an XDbC infringement if the value is not an instance of the given type. Because `DEFINED.tsCheck` throws before returning when the element does not exist (or `INSTANCE.tsCheck` throws if it is of the wrong type), `EQ.tsCheck` on the next line is never reached in that case — so there is no need for `if (upload)` guards or optional chaining (`upload?.type`). `EQ.tsCheck(actual, expected, errorMessage?)` throws if the values are not equal, thus the `upload`-field is not of type "file".

**Why this matters:**

- **Fail-fast with meaningful diagnostics** — Each check produces a specific, descriptive error message ("Is `.MyUpload` even existing?", "Is it an `<input>`?", "Is it type `file`?"). Compare that to a raw `null` reference error or a silent misbehavior deep in the logic — the developer immediately knows *which* assumption failed and *why*.
- **Eliminates defensive boilerplate** — Without XDbC, the equivalent would be:
  ```typescript
  const el = container.querySelector(".MyUpload");
  if (!el) throw new Error("...");
  if (!(el instanceof HTMLInputElement)) throw new Error("...");
  if (el.type !== "file") throw new Error("...");
  
  -- or --

  const el = container.querySelector(".MyUpload");
  assert(el, "Element .MyUpload not found");
  assert(el instanceof HTMLInputElement, "Element is not an HTMLInputElement");
  assert(el.type === "file", "Element is not of type 'file'");
  ```
  That's 4 lines of repetitive guard code. XDbC collapses it into 2 lines with richer error reporting.
- **Self-documenting contracts** — The code reads as a specification: "this element must exist, must be an `HTMLInputElement`, and its type must be `file`." Future maintainers instantly understand the requirements without reading implementation details or comments.

- **XDbC vs Regular Assertions**

  | | Manual `if`/`throw` | `assert()` | **XDbC `.tsCheck`** |
  |---|---|---|---|
  | **Type narrowing** | Requires explicit cast after check | ❌ Does not narrow TypeScript types | ✅ Returns the narrowed type automatically |
  | **Composability** | Statements only — needs separate lines and mutable variables | Statements only | ✅ Expression-based — checks can be chained inline |
  | **Error messages** | Written manually per check | Written manually or generic "Assertion failed" | ✅ Standardized, descriptive messages generated automatically |
  | **Dual use** | Inline only | Inline only | ✅ Same contracts work as runtime checks (`.tsCheck`) *and* method decorators (`@.PRE`) |
  | **Centralized control** | None — each check is independent | Binary: on or off | ✅ Behavior (throw, log, disable) controlled globally via XDbC-Configuration |
  | **Boilerplate** | 4 lines for 3 checks & assignment | 4 lines for 3 checks & assignment | ✅ 2 lines for 3 checks & assignment |
  | **Dependencies** | None | Node built-in (`assert`) | Requires `xdbc` |

  **When to use what:** Regular assertions (`assert()`) are fine for quick sanity checks in plain JavaScript with zero dependencies. In a TypeScript project like CodBi — where type safety, composability, and consistent contract enforcement matter — XDbC should be preferred.

### 🔗 Element Placeholders (EPs) (with XDbC)

EPs use the signature `public static retrieve(params)`, where `params` is an array of string arguments. XDbC decorators validate the array contents:

```typescript
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC

/**
 * Joins multiple objects into a single merged object.
 *
 * @codbi-param objects — The objects to merge (passed as array elements)
 */
class Data_Join {
    @DBC.ParamvalueProvider
    public static retrieve(
        // Ensure at least 2 params were provided
        @GREATER.PRE(1, true, false, "length", "Weren't the objects to join specified?")
        // Ensure there're no undefined or null elements in the array
        @AE.PRE([new TYPE("object")])
        params: Array<unknown>,
    ): Array<unknown> {
        const merged = Object.assign({}, ...params);
        return [merged];
    }
}

window.codbi.registerEP("Data.Join", Data_Join.retrieve.bind(Data_Join));
```

### 🛠️ Standard Configurations

Configurations wire together Functionalities and EPs by applying `data-cb-*` attributes to elements matching CSS selectors. Use `window.codbi.loadConfig()` for a single config or `window.codbi.loadConfigs()` for a batch:

```typescript
/**
 * Registers standard configurations for people-related input validation.
 *
 * @codbi-css  CodBi_People_Name — Input may only contain name characters (letters, hyphens, apostrophes)
 * @codbi-css  CodBi_People_Alphanumeric — Input may only contain alphanumeric characters
 * @codbi-global CodBi_People_ErrorPrefix — Custom error message prefix
 */
export function loadConfig(): void {
    window.codbi.loadConfigs([
        {
            targets: ".CodBi_People_Name",
            FUNC: "HTML.Input.Regex",
            Expression: "°[-A-Za-zà-ÿ' ]*[a-zà-ÿ']$",
            KeyExpression: "[ A-Za-zà-ÿ'-]",
            ErrorPrefix: "The name must match the expression",
        },
        {
            targets: ".CodBi_People_Alphanumeric",
            FUNC: "HTML.Input.Regex",
            Expression: "°[-0-9A-Za-z/: ]*[0-9A-Za-z]$",
            KeyExpression: "[-0-9A-Za-z/: ]",
            ErrorPrefix: "The value must match the expression",
        },
    ]);
}

loadConfig();
```

---

## 📝 TSDoc Tags & Documentation

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

## 📥 Importing into Formcycle

1. Build the project (`npm run build`)
2. Open the **CodBi Local APIDoc Manager** in FORMCYCLE Designer
3. Click **Import** and select the `.json` file(s) from `dist/APIDoc/`
4. The element's code, description, and parameters are imported automatically

To **update** an existing element, either delete it in the Manager first, then re-import
or simply upload the generated JavaScript-File using the upload code button on the node
in question.

---

## 🛠 CodBi Runtime API (global.d.ts)

The `global.d.ts` file declares the `CodBi` namespace available at runtime:

| Function                      | Purpose                                    |
|-------------------------------|--------------------------------------------|
| `CodBi.registerFunctionality` | Register a Functionality handler           |
| `CodBi.registerEP`           | Register an Elementplaceholder handler     |
| `CodBi.loadConfig`           | Load a global value from a Configuration   |
| `CodBi.invokeFunctionality`  | Programmatically invoke a Functionality    |
| `CodBi.invokeEP`             | Programmatically invoke an EP              |

---

## ⚙️ Build Details

- **Bundler**: [esbuild](https://esbuild.github.io/) — each source file is
    compiled into a self-contained IIFE in `dist/`
- **Minification**: Enabled (required—CodBi backend strips newlines from stored code, which would break `//` line comments)
- **TypeScript**: Strict mode, ESNext target, JSX support (React-compatible)
- **JSON generation**: Runs automatically after esbuild via `generate-codbi-json.mjs`

---

## 📜 License & Authorship

- **Template Author:** Salvatore Callari ([@CallariS](https://github.com/CallariS))
- **Project:** [CodBi-Dev](../README.md)

Licensed under the [MIT License](../LICENSE).
