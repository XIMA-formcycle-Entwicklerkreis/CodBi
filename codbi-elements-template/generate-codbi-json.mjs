// @ts-check
/**
 * Generates a single importable CodBi Local-API-Doc JSON from all built elements.
 *
 * For each .ts / .tsx source the script:
 *  1. Extracts the main TSDoc block (the first /** ... * / comment that precedes the
 *     class or function declaration — for Functionalities the TSDoc on
 *     `public static functionality` is used).
 *  2. Parses custom @codbi-* tags from the TSDoc:
 *       @codbi-param  <name> <description>   → Functionality Parameter
 *       @codbi-css    <name> <description>   → Standard Configuration class
 *       @codbi-global <name> <description>   → Standard Configuration global variable
 *  3. Converts the remaining TSDoc body into HTML for the Description field.
 *  4. Reads the compiled JS from dist/.
 *  5. Writes a separate importable JSON per element (named like the .js).
 *
 * TSDoc → HTML conversion rules:
 *  - **bold**          → <b>bold</b>
 *  - `code`            → <code>code</code>
 *  - ```lang\n...\n``` → <pre><code>...</code></pre>
 *  - Blank lines       → paragraph breaks
 *  - Lines starting with " - " or " * " → <li> items wrapped in <ul>
 *  - Lines starting with a number+dot   → <li> items wrapped in <ol>
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, relative, sep, extname } from "path";

const SRC_ROOT = new URL(".", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const DIST_DIR = join(SRC_ROOT, "dist");
const APIDOC_DIR = join(DIST_DIR, "APIDoc");

// ─── Collect source entries ────────────────────────────────────────────────────
function collectEntries(dir) {
    const entries = [];

    for (const entry of readdirSync(dir)) {
        const full = join(dir, entry);

        if (entry === "node_modules" || entry === "dist" || entry === ".vscode") {
            continue;
        }

        if (statSync(full).isDirectory()) {
            entries.push(...collectEntries(full));
        } else if (/\.tsx?$/.test(entry) && !entry.startsWith("esbuild") && !entry.startsWith("generate") && !entry.endsWith(".d.ts")) {
            entries.push(full);
        }
    }

    return entries;
}

function toCodBiName(filePath) {
    const rel = relative(SRC_ROOT, filePath);
    const withoutExt = rel.replace(/\.[^.]+$/, "");

    return withoutExt.split(sep).join(".");
}

// ─── Determine element type from path ──────────────────────────────────────────
function getElementType(filePath) {
    const rel = relative(SRC_ROOT, filePath).split(sep);

    if (rel[0] === "Functionalities") return "Functionality";
    if (rel[0] === "EPs") return "Elementplaceholder";
    if (rel[0] === "Configurations") return "Standard";

    return null;
}

// ─── Extract the relevant TSDoc block ──────────────────────────────────────────
/** For Functionalities: extracts the TSDoc on `public static functionality`.
 *  For EPs / Configs: extracts the first TSDoc block (on the class or function). */
function extractTSDoc(source, elementType) {
    // Find all /** ... */ blocks with their positions.
    const docBlocks = [];
    const docRegex = /\/\*\*([\s\S]*?)\*\//g;
    let match;

    while ((match = docRegex.exec(source)) !== null) {
        docBlocks.push({ text: match[1], end: match.index + match[0].length });
    }

    if (docBlocks.length === 0) return "";

    if (elementType === "Functionality") {
        // Find the block whose end is followed (within ~200 chars) by "public static functionality"
        for (const block of docBlocks) {
            const after = source.slice(block.end, block.end + 300);

            if (/public\s+static\s+functionality/.test(after)) {
                return block.text;
            }
        }
    }

    // Fallback / EPs / Configs: use the first block.
    return docBlocks[0].text;
}

// ─── Parse TSDoc into description body + @codbi-* tags ─────────────────────────
function parseTSDoc(raw) {
    // Strip leading " * " from each line.
    const lines = raw.split("\n").map((l) => l.replace(/^\s*\*\s?/, ""));
    const bodyLines = [];
    const params = {};
    const cssClasses = {};
    const globals = {};

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        // Stop collecting body at @param, @remarks, @returns (non-codbi tags).
        if (/^@param\b/.test(line) || /^@remarks\b/.test(line) || /^@returns\b/.test(line)) {
            break;
        }

        const paramMatch = line.match(/^@codbi-param\s+(\S+)\s*(.*)/);

        if (paramMatch) {
            params[paramMatch[1]] = paramMatch[2].replace(/^—\s*/, "").trim();

            continue;
        }

        const cssMatch = line.match(/^@codbi-css\s+(\S+)\s*(.*)/);

        if (cssMatch) {
            cssClasses[cssMatch[1]] = cssMatch[2].replace(/^—\s*/, "").trim();

            continue;
        }

        const globalMatch = line.match(/^@codbi-global\s+(\S+)\s*(.*)/);

        if (globalMatch) {
            globals[globalMatch[1]] = globalMatch[2].replace(/^—\s*/, "").trim();

            continue;
        }

        bodyLines.push(line);
    }

    return { body: bodyLines, params, cssClasses, globals };
}

// ─── Convert TSDoc body lines to HTML ──────────────────────────────────────────
function bodyToHTML(lines) {
    // Trim leading/trailing empty lines.
    while (lines.length > 0 && lines[0].trim() === "") lines.shift();
    while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

    let html = "";
    let inCodeBlock = false;
    let codeBuffer = [];
    let inList = null; // "ul" | "ol" | null

    function closeList() {
        if (inList) {
            html += `</${inList}>`;
            inList = null;
        }
    }

    for (const line of lines) {
        // Fenced code blocks.
        if (/^```/.test(line)) {
            if (!inCodeBlock) {
                closeList();
                inCodeBlock = true;
                codeBuffer = [];
            } else {
                html += `<pre><code>${escapeHTML(codeBuffer.join("\n"))}</code></pre>`;
                inCodeBlock = false;
            }

            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(line);

            continue;
        }

        // Blank line → paragraph break.
        if (line.trim() === "") {
            closeList();
            html += "</p><p>";

            continue;
        }

        // Unordered list items: " - text" or " * text".
        const ulMatch = line.match(/^\s*[-*]\s+(.*)/);

        if (ulMatch) {
            if (inList !== "ul") {
                closeList();
                html += "<ul>";
                inList = "ul";
            }

            html += `<li>${inlineFormat(ulMatch[1])}</li>`;

            continue;
        }

        // Ordered list items: "1. text", "2. text".
        const olMatch = line.match(/^\s*\d+[.)]\s+(.*)/);

        if (olMatch) {
            if (inList !== "ol") {
                closeList();
                html += "<ol>";
                inList = "ol";
            }

            html += `<li>${inlineFormat(olMatch[1])}</li>`;

            continue;
        }

        closeList();
        html += inlineFormat(line) + " ";
    }

    closeList();

    // Wrap in <p>, clean up empty paragraphs.
    html = `<p>${html}</p>`;
    html = html.replace(/<p>\s*<\/p>/g, "");
    html = html.replace(/<p>\s*<(ul|ol|pre)/g, "<$1");
    html = html.replace(/<\/(ul|ol|pre)>\s*<\/p>/g, "</$1>");
    html = html.replace(/<\/p>\s*<p>/g, "</p><p>");

    return html.trim();
}

function escapeHTML(str) {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function inlineFormat(text) {
    // **bold** → <b>
    text = text.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
    // `code` → <code>
    text = text.replace(/`([^`]+)`/g, "<code>$1</code>");
    // {@link Foo} → <code>Foo</code>
    text = text.replace(/\{@link\s+([^}]+)\}/g, "<code>$1</code>");

    return text;
}

// ─── Main ──────────────────────────────────────────────────────────────────────
const entries = collectEntries(SRC_ROOT);
mkdirSync(APIDOC_DIR, { recursive: true });

for (const entry of entries) {
    const codbiName = toCodBiName(entry);
    const elementType = getElementType(entry);

    if (!elementType) {
        console.warn(`  SKIP  ${codbiName}  (unknown element type)`);

        continue;
    }

    const source = readFileSync(entry, "utf-8");
    const jsFile = join(DIST_DIR, `${codbiName}.js`);
    let jsCode;

    try {
        jsCode = readFileSync(jsFile, "utf-8");
    } catch {
        console.warn(`  SKIP  ${codbiName}  (no compiled JS in dist/)`);

        continue;
    }

    const rawDoc = extractTSDoc(source, elementType);
    const { body, params, cssClasses, globals } = parseTSDoc(rawDoc);
    const descriptionHTML = bodyToHTML(body);

    // Build a per-element import JSON with the full CodBi structure.
    const output = {
        fslFunctionalities: [],
        detFunctionalities: {},
        fslElementplaceholder: [],
        detElementplaceholder: {},
        fileListing: [],
        detStandards: {},
    };

    const shortName = codbiName
        .replace(/^Functionalities\./, "")
        .replace(/^EPs\./, "")
        .replace(/^Configurations\./, "");

    if (elementType === "Functionality") {
        output.fslFunctionalities.push(`${shortName}.js`);
        output.detFunctionalities[shortName] = {
            Description: descriptionHTML,
            ...(Object.keys(params).length > 0 ? { Parameter: params } : {}),
            Code: jsCode,
        };
    } else if (elementType === "Elementplaceholder") {
        output.fslElementplaceholder.push(`${shortName}.js`);
        output.detElementplaceholder[shortName] = {
            Description: descriptionHTML,
            ...(Object.keys(params).length > 0 ? { Parameter: params } : {}),
            Code: jsCode,
        };
    } else if (elementType === "Standard") {
        output.fileListing.push(`${shortName}.js`);
        output.detStandards[shortName] = {
            Description: descriptionHTML,
            ...(Object.keys(cssClasses).length > 0 ? { classes: cssClasses } : {}),
            ...(Object.keys(globals).length > 0 ? { globals } : {}),
            Code: jsCode,
        };
    }

    // Stringify file listings to match CodBi's expected format (JSON-array-as-string).
    output.fslFunctionalities = JSON.stringify(output.fslFunctionalities);
    output.fslElementplaceholder = JSON.stringify(output.fslElementplaceholder);
    output.fileListing = JSON.stringify(output.fileListing);

    const outPath = join(APIDOC_DIR, `${codbiName}.json`);

    writeFileSync(outPath, JSON.stringify(output, null, 2), "utf-8");
    console.log(`  ✓  ${elementType.padEnd(18)}  ${codbiName}.json`);
}
