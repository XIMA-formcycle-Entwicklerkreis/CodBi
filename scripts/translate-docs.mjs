import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── CLI args ────────────────────────────────────────────────────────────────
// Usage: node translate-docs.mjs <lang> [pkgDir] [srcSubdir] [ext]
//   lang       – target language code (de, it, fr, es …)
//   pkgDir     – absolute or repo-relative path to the package (default: src/main/web/packages/form)
//   srcSubdir  – source subdirectory inside pkgDir (default: src/js)
//   ext        – file extension to scan (default: .ts)
const LANG_NAMES = { de: 'German', it: 'Italian', fr: 'French', es: 'Spanish' };
const targetLang = (process.argv[2] || 'de').toLowerCase();
const langName = LANG_NAMES[targetLang] || targetLang;

const repoRoot = path.resolve(__dirname, '..');
const pkgDir = path.resolve(repoRoot, process.argv[3] || 'src/main/web/packages/form');
const srcSubdir = process.argv[4] || 'src/js';
const fileExt = process.argv[5] || '.ts';

const sourceDir = path.join(pkgDir, srcSubdir);
const targetDir = path.join(pkgDir, `src_${targetLang}_temp`);
const cacheDir = path.join(pkgDir, `.translate-cache/${targetLang}`);
const hashFile = path.join(cacheDir, 'hashes.json');

// ─── Google Translate API key detection ──────────────────────────────────────
// Checks (in order): GOOGLE_TRANSLATE_API_KEY env var → .env file in repo root.
// If a key is found, the official Cloud Translation API v2 is used.
// Otherwise, falls back to the free (unofficial) GTX endpoint.
async function loadApiKey() {
    if (process.env.GOOGLE_TRANSLATE_API_KEY) return process.env.GOOGLE_TRANSLATE_API_KEY.trim();
    try {
        const envContent = await fs.readFile(path.join(repoRoot, '.env'), 'utf-8');
        const match = envContent.match(/^GOOGLE_TRANSLATE_API_KEY\s*=\s*(.+)$/m);
        if (match) return match[1].trim();
    } catch { /* no .env file */ }
    return null;
}
const GOOGLE_API_KEY = await loadApiKey();

console.log(`[Translate] Starting doc → ${langName} (${targetLang}) translation...`);
console.log(`[Translate] Backend : ${GOOGLE_API_KEY ? 'Google Cloud Translation API v2 (official)' : 'GTX (free, unofficial)'}`);
console.log(`[Translate] Package: ${pkgDir}`);
console.log(`[Translate] Source : ${sourceDir}`);
console.log(`[Translate] Target : ${targetDir}`);

// ─── Google Cloud Translation API v2 (official, requires API key) ────────────
async function officialTranslate(text) {
    const url = `https://translation.googleapis.com/language/translate/v2`;
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q: text, source: 'en', target: targetLang, format: 'text', key: GOOGLE_API_KEY }),
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Cloud Translation API ${res.status}: ${body}`);
    }
    const json = await res.json();
    return json.data.translations[0].translatedText;
}

// ─── Google Translate (free GTX endpoint, no API key needed) ─────────────────
async function gtxTranslate(text) {
    const url =
        `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GTX ${res.status}: ${res.statusText}`);
    const json = await res.json();
    return json[0].map(s => s[0]).join('');
}

// ─── Translate dispatcher ────────────────────────────────────────────────────
const translateText = GOOGLE_API_KEY ? officialTranslate : gtxTranslate;

// ─── Inline-tag protection ({@link ...}, {@inheritDoc}, etc.) ────────────────
const INLINE_TAG_RE = /\{@\w+[^}]*\}/g;

function shieldInlineTags(text) {
    const tags = [];
    const shielded = text.replace(INLINE_TAG_RE, (m) => {
        tags.push(m);
        return `__JSDOC_${tags.length - 1}__`;
    });
    return { shielded, tags };
}

function restoreInlineTags(text, tags) {
    return text.replace(/__JSDOC_(\d+)__/g, (_, i) => tags[Number(i)] ?? _);
}

async function translateChunk(text, retries = 3) {
    if (!text.trim()) return text;
    const { shielded, tags } = shieldInlineTags(text);
    while (retries > 0) {
        try {
            const t = await translateText(shielded);
            await sleep(200);
            return restoreInlineTags(t, tags);
        } catch (err) {
            if (--retries === 0) {
                console.warn(`[Translate]  ⚠ chunk failed, keeping original. ${err.message}`);
                return text;
            }
            await sleep(2000);
        }
    }
    return text;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Process one file ────────────────────────────────────────────────────────
async function processFile(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    const tsDocRe = /\/\*\*([\s\S]*?)\*\//g;
    const matches = [...content.matchAll(tsDocRe)];
    if (matches.length === 0) return { content, translated: false };

    // Collect every translatable line across all doc blocks
    const texts = [];          // flat list of strings to translate
    const blockInfos = [];     // per-block reconstruction info

    for (const match of matches) {
        const lines = match[1].split('\n');
        const lineInfos = [];

        for (const line of lines) {
            const m = line.match(/^(\s*\*\s?)(.*)/);
            if (!m) { lineInfos.push({ raw: line }); continue; }

            const prefix = m[1];
            const body = m[2];

            if (!body.trim() || body.trim() === '/') {
                lineInfos.push({ raw: line });
            } else if (body.startsWith('@')) {
                // Try to translate only the description part after known tag patterns
                const desc =
                    body.match(/^(@\w+\s+\S+\s+[-—]\s+)(.+)/) ||   // @param foo - desc
                    body.match(/^(@returns?\s+)(.+)/);                // @return(s) desc
                if (desc) {
                    texts.push(desc[2]);
                    lineInfos.push({ prefix: prefix + desc[1], idx: texts.length - 1 });
                } else {
                    lineInfos.push({ raw: line });                    // @remarks, @see, etc.
                }
            } else {
                texts.push(body);
                lineInfos.push({ prefix, idx: texts.length - 1 });
            }
        }
        blockInfos.push({ original: match[0], lineInfos });
    }

    if (texts.length === 0) return { content, translated: false };

    // Translate all collected strings
    const translated = [];
    for (const t of texts) {
        translated.push(await translateChunk(t));
    }

    // Reconstruct
    let out = content;
    for (const block of blockInfos) {
        const rebuilt = block.lineInfos.map(li =>
            li.raw !== undefined ? li.raw : li.prefix + (translated[li.idx] ?? texts[li.idx])
        ).join('\n');
        out = out.replace(block.original, () => `/**${rebuilt}*/`);
    }

    return { content: out, translated: true };
}

// ─── Recursive file finder ───────────────────────────────────────────────────
const SKIP_DIRS = new Set(['.translate-cache', 'node_modules']);
async function findFiles(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(e => {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (SKIP_DIRS.has(e.name) || e.name.startsWith('src_') && e.name.endsWith('_temp')) return [];
            return findFiles(full);
        }
        return full;
    }));
    return files.flat().filter(f => f.endsWith(fileExt));
}

// ─── Hashing ─────────────────────────────────────────────────────────────────
function hashTsDoc(content) {
    const tsDocRe = /\/\*\*([\s\S]*?)\*\//g;
    const blocks = [...content.matchAll(tsDocRe)].map(m => m[0]).join('\n');
    return crypto.createHash('sha256').update(blocks || '').digest('hex');
}

async function loadHashes() {
    try { return JSON.parse(await fs.readFile(hashFile, 'utf-8')); }
    catch { return {}; }
}

async function saveHashes(hashes) {
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(hashFile, JSON.stringify(hashes, null, 2));
}

// ─── Main ────────────────────────────────────────────────────────────────────
async function run() {
    await fs.rm(targetDir, { recursive: true, force: true });
    await sleep(200); // let OS release handles

    const oldHashes = await loadHashes();
    const newHashes = {};

    const files = await findFiles(sourceDir);
    console.log(`[Translate] Found ${files.length} ${fileExt} files.`);

    let translatedCount = 0;
    let cachedCount = 0;
    for (let i = 0; i < files.length; i++) {
        const rel = path.relative(sourceDir, files[i]);
        const dest = path.join(targetDir, rel);
        // Use .cache suffix so Kotlin compiler won't pick up cached .kt files
        const cacheDest = path.join(cacheDir, rel + '.cache');
        const cacheDestLegacy = path.join(cacheDir, rel);
        await fs.mkdir(path.dirname(dest), { recursive: true });

        const srcContent = await fs.readFile(files[i], 'utf-8');
        const hash = hashTsDoc(srcContent);
        newHashes[rel] = hash;

        // Check cache: same TSDoc hash → reuse previous translation
        if (hash === oldHashes[rel]) {
            try {
                // Try new .cache path first, fall back to legacy path (pre-migration)
                let cached;
                try { cached = await fs.readFile(cacheDest, 'utf-8'); }
                catch { cached = await fs.readFile(cacheDestLegacy, 'utf-8'); }
                await fs.writeFile(dest, cached, 'utf-8');
                // Migrate legacy cache file to new .cache extension
                try { await fs.rm(cacheDestLegacy, { force: true }); } catch { }
                await fs.mkdir(path.dirname(cacheDest), { recursive: true });
                await fs.writeFile(cacheDest, cached, 'utf-8');
                cachedCount++;
                if ((i + 1) % 10 === 0) console.log(`[Translate] ${i + 1} / ${files.length} files done...`);
                continue;
            } catch { /* cache file missing, fall through to translate */ }
        }

        const result = await processFile(files[i]);
        await fs.writeFile(dest, result.content, 'utf-8');
        // Update cache with .cache extension
        await fs.mkdir(path.dirname(cacheDest), { recursive: true });
        await fs.writeFile(cacheDest, result.content, 'utf-8');
        // Remove legacy cache file if it exists
        try { await fs.rm(cacheDestLegacy, { force: true }); } catch { }
        if (result.translated) translatedCount++;

        if ((i + 1) % 10 === 0) console.log(`[Translate] ${i + 1} / ${files.length} files done...`);
    }

    // Prune stale cache entries (both .cache and legacy paths)
    for (const rel of Object.keys(oldHashes)) {
        if (!newHashes[rel]) {
            fs.rm(path.join(cacheDir, rel + '.cache'), { force: true }).catch(() => { });
            fs.rm(path.join(cacheDir, rel), { force: true }).catch(() => { });
        }
    }
    await saveHashes(newHashes);

    console.log(`[Translate] Done — ${translatedCount} translated, ${cachedCount} from cache.`);
    console.log(`[Translate] Output: ${targetDir}`);

    // ── Generate typedoc/tsconfig configs (TypeScript packages only) ──────────
    if (fileExt === '.ts') {
        const tdSrc = path.join(pkgDir, 'typedoc.json');
        try {
            const td = JSON.parse(await fs.readFile(tdSrc, 'utf-8'));
            td.entryPoints = [`./src_${targetLang}_temp/**/*.ts`];
            td.out = `./docs/${targetLang}`;
            td.tsconfig = `./tsconfig.${targetLang}.json`;
            const tdDest = path.join(pkgDir, `typedoc.${targetLang}.json`);
            await fs.writeFile(tdDest, JSON.stringify(td, null, 2));
            console.log(`[Translate] Wrote ${tdDest}`);
        } catch {
            console.log(`[Translate] No typedoc.json found in ${pkgDir}, skipping config generation.`);
        }

        const tsSrc = path.join(pkgDir, 'tsconfig.json');
        try {
            const ts = JSON.parse(await fs.readFile(tsSrc, 'utf-8'));
            ts.include = [`src_${targetLang}_temp/**/*`];
            const tsDest = path.join(pkgDir, `tsconfig.${targetLang}.json`);
            await fs.writeFile(tsDest, JSON.stringify(ts, null, 2));
            console.log(`[Translate] Wrote ${tsDest}`);
        } catch {
            console.log(`[Translate] No tsconfig.json found in ${pkgDir}, skipping config generation.`);
        }
    }
}

run().catch(err => { console.error(err); process.exit(1); });
