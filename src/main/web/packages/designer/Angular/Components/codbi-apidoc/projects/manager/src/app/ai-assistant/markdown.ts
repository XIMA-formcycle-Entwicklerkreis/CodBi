// #region Markdown rendering
//
// A small, dependency-free Markdown → HTML renderer used by the Form Assistant Chat to display the
// AI answers as formatted bubbles (markdown view). It is deliberately conservative about security:
//  - all plain text and code is HTML-escaped, so raw `<script>`, `onerror=…` etc. can never be
//    injected by the AI output,
//  - link/image URLs are restricted to http/https/mailto/tel and same-page anchors; unsafe URLs are
//    shown as plain text instead of becoming live elements,
//  - the Angular `[innerHTML]` binding sanitizes the produced HTML again as a second layer.
//
// It covers the Markdown that AI answers typically use: ATX headings, paragraphs (line breaks
// preserved), bold/italic/strikethrough, inline + fenced code, links, images, unordered/ordered/
// task lists, blockquotes, horizontal rules and GFM-style tables.
// #endregion Markdown rendering

// #region Helpers

const entity = (code: string): string => "&" + code + ";";
const HTML_ESCAPES: Record<string, string> = {
  "&": entity("amp"),
  "<": entity("lt"),
  ">": entity("gt"),
  '"': entity("quot"),
};

/** Escapes the characters that could break out of HTML text or a quoted attribute value. */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (ch) => HTML_ESCAPES[ch] ?? ch);
}

/** Accepts http(s), mailto, tel and same-page anchor links; everything else is treated as unsafe. */
function isSafeUrl(url: string): boolean {
  // Remove control characters and whitespace for the protocol check (a raw newline inside an href
  // could otherwise be used to smuggle a protocol past the prefix test).
  // eslint-disable-next-line no-control-regex
  const stripped = url
    .trim()
    .replace(/[\u0000-\u001F\u007F\s]/g, "")
    .toLowerCase();
  return (
    stripped.startsWith("http://") ||
    stripped.startsWith("https://") ||
    stripped.startsWith("mailto:") ||
    stripped.startsWith("tel:") ||
    stripped.startsWith("#")
  );
}

/** Splits a GFM table row into its cell texts (handles the surrounding `|` pipes). */
function splitTableRow(line: string): string[] {
  let s = line.trim();
  if (s.startsWith("|")) s = s.slice(1);
  if (s.endsWith("|")) s = s.slice(0, -1);
  return s.split("|").map((cell) => cell.trim());
}

/** Maps a GFM table alignment marker (e.g. `:---:` / `---:`) to an inline style attribute. */
function tableAlign(separator: string): string {
  const s = separator.trim();
  const left = s.startsWith(":");
  const right = s.endsWith(":");
  if (left && right) return ' style="text-align:center"';
  if (right) return ' style="text-align:right"';
  if (left) return ' style="text-align:left"';
  return "";
}

const TABLE_SEPARATOR = /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/;
const TABLE_ROW = /^\s*\|?[^|\n]*\|/;

function isTableSeparator(line: string): boolean {
  return TABLE_SEPARATOR.test(line.trim());
}

function isTableRow(line: string): boolean {
  const s = line.trim();
  return s.includes("|") && TABLE_ROW.test(s);
}

// #endregion Helpers

/**
 * Renders the inline Markdown of one line (already trimmed) to safe HTML. Inline code and
 * links/images are protected first (replaced by placeholders), so the emphasis passes below can
 * never operate on their raw `*` / `_` / `~` characters.
 */
function renderInline(raw: string): string {
  const tokens: string[] = [];

  let text = raw;

  // 1) Inline code — protect it so `**` / `*` inside code is never parsed as emphasis.
  text = text.replace(/`([^`]+)`/g, (_m, code: string) => {
    tokens.push(`<code>${escapeHtml(code)}</code>`);
    return `\u0000${tokens.length - 1}\u0000`;
  });

  // 2) Images (before links, so the leading `!` is not consumed by the link rule).
  text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_m, alt: string, url: string) => {
    if (!isSafeUrl(url)) {
      tokens.push(`<span class="cb-ai-md-raw">${escapeHtml(`![${alt}](${url})`)}</span>`);
    } else {
      tokens.push(`<img src="${escapeHtml(url.trim())}" alt="${escapeHtml(alt)}" loading="lazy" />`);
    }
    return `\u0000${tokens.length - 1}\u0000`;
  });

  // 3) Links — the href is validated + escaped, the label may itself contain Markdown.
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, label: string, url: string) => {
    if (!isSafeUrl(url)) {
      tokens.push(`<span class="cb-ai-md-raw">${escapeHtml(`[${label}](${url})`)}</span>`);
    } else {
      tokens.push(
        `<a href="${escapeHtml(url.trim())}" target="_blank" rel="noopener noreferrer">${renderInline(label)}</a>`,
      );
    }
    return `\u0000${tokens.length - 1}\u0000`;
  });

  // 4) Escape everything that is not a protected token (the placeholders are untouched).
  text = escapeHtml(text);

  // 5) Emphasis on the escaped text (protected tokens contain no `*` / `_` / `~` markers).
  text = text.replace(/\*\*([^*]+?)\*\*/g, "<strong>$1</strong>");
  text = text.replace(/__([^_]+?)__/g, "<strong>$1</strong>");
  text = text.replace(/(^|[^*])\*([^*]+?)\*(?!\*)/g, "$1<em>$2</em>");
  text = text.replace(/(^|[^_])_([^_]+?)_(?!_)/g, "$1<em>$2</em>");
  text = text.replace(/~~([^~]+?)~~/g, "<del>$1</del>");

  // 6) Bare http(s) URLs → links (drop trailing punctuation). Runs on the escaped text, so an `&`
  //    inside the URL is already escaped and stays valid inside the href attribute.
  text = text.replace(/(^|[\s(>])(https?:\/\/[^\s<]+)/g, (_m, pre: string, url: string) => {
    const clean = url.replace(/[)\].,;:!?]+$/, "");
    return `${pre}<a href="${clean}" target="_blank" rel="noopener noreferrer">${clean}</a>`;
  });

  // 7) Restore the protected tokens (safe HTML).
  text = text.replace(/\u0000(\d+)\u0000/g, (_m, idx: string) => tokens[Number(idx)] ?? "");

  return text;
}

/** Renders a paragraph / blockquote body, preserving single line breaks as <br>. */
function renderBody(text: string): string {
  return renderInline(text).replace(/\n/g, "<br />");
}

/** Renders a list item, converting a leading `[ ]` / `[x]` task marker into a disabled checkbox. */
function renderListItem(text: string): string {
  const content = renderInline(text);
  return content.replace(
    /^\[([ xX])\]\s+/,
    (_m, c: string) => `<input type="checkbox" disabled ${c.toLowerCase() === "x" ? "checked" : ""} /> `,
  );
}

/**
 * Renders a Markdown string to safe HTML. Returns an empty string for empty/whitespace input.
 */
export function markdownToHtml(markdown: string): string {
  if (!markdown) return "";

  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = (): void => {
    if (paragraph.length === 0) return;
    out.push(`<p>${renderBody(paragraph.join("\n"))}</p>`);
    paragraph = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block ```lang … ``` (or ~~~ … ~~~)
    const fence = line.match(/^\s*(`{3,}|~{3,})\s*(\S*)\s*$/);
    if (fence) {
      flushParagraph();
      const marker = fence[1];
      const lang = fence[2];
      const close = new RegExp(`^\\s*${marker[0]}{3,}\\s*$`);
      const code: string[] = [];
      i++;
      while (i < lines.length && !close.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // skip the closing fence (or EOF)
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : "";
      out.push(`<pre><code${cls}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    // ATX heading # … ######
    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.*)$/);
    if (heading) {
      flushParagraph();
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2].trim())}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule --- / *** / ___
    if (/^\s{0,3}(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      flushParagraph();
      out.push("<hr />");
      i++;
      continue;
    }

    // Blockquote > …
    if (/^\s{0,3}>/.test(line)) {
      flushParagraph();
      const quote: string[] = [];
      while (i < lines.length && /^\s{0,3}>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s{0,3}>\s?/, ""));
        i++;
      }
      out.push(`<blockquote>${renderBody(quote.join("\n"))}</blockquote>`);
      continue;
    }

    // GFM table: a header row immediately followed by a separator row
    if (isTableRow(line) && isTableSeparator(lines[i + 1] ?? "")) {
      flushParagraph();
      const headerCells = splitTableRow(line);
      const alignCells = splitTableRow(lines[i + 1]);
      i += 2;
      out.push("<table><thead><tr>");
      headerCells.forEach((cell, idx) => {
        out.push(`<th${tableAlign(alignCells[idx] ?? "")}>${renderInline(cell)}</th>`);
      });
      out.push("</tr></thead><tbody>");
      while (i < lines.length && isTableRow(lines[i]) && !isTableSeparator(lines[i])) {
        const cells = splitTableRow(lines[i]);
        out.push("<tr>");
        cells.forEach((cell) => {
          out.push(`<td>${renderInline(cell)}</td>`);
        });
        out.push("</tr>");
        i++;
      }
      out.push("</tbody></table>");
      continue;
    }

    // Unordered list - / * / +
    const ul = line.match(/^\s{0,3}[-*+]\s+(.*)$/);
    if (ul) {
      flushParagraph();
      out.push("<ul>");
      while (i < lines.length) {
        const item = lines[i].match(/^\s{0,3}[-*+]\s+(.*)$/);
        if (!item) break;
        out.push(`<li>${renderListItem(item[1])}</li>`);
        i++;
      }
      out.push("</ul>");
      continue;
    }

    // Ordered list 1. 2. 3. …
    const ol = line.match(/^\s{0,3}\d+\.\s+(.*)$/);
    if (ol) {
      flushParagraph();
      out.push("<ol>");
      while (i < lines.length) {
        const item = lines[i].match(/^\s{0,3}\d+\.\s+(.*)$/);
        if (!item) break;
        out.push(`<li>${renderListItem(item[1])}</li>`);
        i++;
      }
      out.push("</ol>");
      continue;
    }

    // Blank line ends the current paragraph
    if (line.trim() === "") {
      flushParagraph();
      i++;
      continue;
    }

    // Plain paragraph line (multi-line paragraphs keep their line breaks in the bubble)
    paragraph.push(line.trim());
    i++;
  }
  flushParagraph();

  return out.join("\n");
}
