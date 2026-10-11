/**
 * Element-Placeholder expression parsing & serialization (designer side).
 *
 * The runtime grammar (see the form package's `CodBi.nestingBraces`) is:
 *
 * ```text
 * value := ( text | ep )*
 * ep    := "{" id ">" ( param ( ";" param )* )? "}"
 * ```
 *
 * A parameter may itself contain nested EPs, so the whole value is modelled as an AST
 * (**A**bstract **S**yntax **T**ree) of segments. Literal `{` / `}` are escaped with a leading `°`
 * exactly like the runtime does, so parsing and serializing round-trip stably.
 *
 * This module is intentionally dependency-free so both the builder UI and the runtime grammar stay in
 * sync.
 */

/** The opening brace of an EP. */
const OPEN = "{";
/** The closing brace of an EP. */
const CLOSE = "}";
/** Separates the EP id from its first parameter. */
const EP_SEP = ">";
/** Separates two parameters. */
const PARAM_SEP = ";";
/** Escape character that neutralizes a literal `{` / `}`. */
const ESCAPE = "°";

/** A literal text run inside an EP value. */
export interface TextSegment {
  kind: "text";
  /** The (unescaped) text. */
  value: string;
}

/** A single Element-Placeholder node. */
export interface EPNode {
  kind: "ep";
  /** The EP id as written. */
  id: string;
  /** The ordered parameters; each parameter is itself a segment list (may contain nested EPs). */
  params: Array<ValueSegment[]>;
}

/** One segment of an EP value (either literal text or a (nested) EP). */
export type ValueSegment = TextSegment | EPNode;

/**
 * Determines whether the character at **index** is neutralized by a preceding {@link ESCAPE }.
 *
 * @param text  The source text.
 * @param index The index to test.
 *
 * @returns **TRUE** when the character is escaped. */
function isEscaped(text: string, index: number): boolean {
  return index > 0 && text[index - 1] === ESCAPE;
}

/**
 * Finds the matching closing brace for the opening brace at **openIndex**, honoring nesting and `°`
 * escaping.
 *
 * @param text      The source text.
 * @param openIndex The index of the opening brace.
 *
 * @returns The index of the matching closing brace or **-1** when unbalanced. */
function findClosingBrace(text: string, openIndex: number): number {
  let depth = 0;

  for (let index = openIndex; index < text.length; index++) {
    const char = text[index];

    if (isEscaped(text, index)) {
      continue;
    }

    if (char === OPEN) {
      depth++;
    } else if (char === CLOSE) {
      depth--;

      if (depth === 0) {
        return index;
      }
    }
  }

  return -1;
}

/**
 * Finds the first occurrence of **separator** that is neither escaped nor nested inside braces.
 *
 * @param text      The source text.
 * @param separator The separator to look for (a single character).
 *
 * @returns The index of the separator or **-1**. */
function findTopLevel(text: string, separator: string): number {
  let depth = 0;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (isEscaped(text, index)) {
      continue;
    }

    if (char === OPEN) {
      depth++;
    } else if (char === CLOSE) {
      depth--;
    } else if (char === separator && depth === 0) {
      return index;
    }
  }

  return -1;
}

/**
 * Splits **text** at every top-level (unescaped, non-nested) occurrence of **separator**.
 *
 * @param text      The source text.
 * @param separator The separator character.
 *
 * @returns The split parts. */
function splitTopLevel(text: string, separator: string): Array<string> {
  const parts = new Array<string>();
  let depth = 0;
  let start = 0;

  for (let index = 0; index < text.length; index++) {
    const char = text[index];

    if (isEscaped(text, index)) {
      continue;
    }

    if (char === OPEN) {
      depth++;
    } else if (char === CLOSE) {
      depth--;
    } else if (char === separator && depth === 0) {
      parts.push(text.substring(start, index));
      start = index + 1;
    }
  }

  parts.push(text.substring(start));

  return parts;
}

/**
 * Parses the inner text of an EP (everything between the outermost braces) into an {@link EPNode}.
 *
 * @param inner The text between the braces.
 *
 * @returns The parsed {@link EPNode }. */
function parseEPNode(inner: string): EPNode {
  const separatorIndex = findTopLevel(inner, EP_SEP);
  const id = (separatorIndex === -1 ? inner : inner.substring(0, separatorIndex)).trim();
  const paramsText = separatorIndex === -1 ? "" : inner.substring(separatorIndex + 1);

  const params =
    paramsText.trim() === "" ? [] : splitTopLevel(paramsText, PARAM_SEP).map((param) => parseEPValue(param.trim()));

  return { kind: "ep", id, params };
}

/**
 * Parses an Element-Placeholder value into an AST of {@link ValueSegment }s.
 *
 * @param value The raw attribute value (may contain literal text and/or EPs).
 *
 * @returns The parsed segments. Unbalanced braces are treated as literal text. */
export function parseEPValue(value: string): Array<ValueSegment> {
  const segments = new Array<ValueSegment>();
  let text = "";
  let index = 0;

  while (index < value.length) {
    const char = value[index];

    // Unescape `°{` / `°}` into their literal counterparts.
    if (char === ESCAPE && index + 1 < value.length && (value[index + 1] === OPEN || value[index + 1] === CLOSE)) {
      text += value[index + 1];
      index += 2;
      continue;
    }

    if (char === OPEN) {
      const close = findClosingBrace(value, index);

      if (close === -1) {
        // Unbalanced: keep the remainder as literal text so nothing is lost.
        text += value.substring(index);
        break;
      }

      if (text !== "") {
        segments.push({ kind: "text", value: text });
        text = "";
      }

      segments.push(parseEPNode(value.substring(index + 1, close)));
      index = close + 1;
      continue;
    }

    text += char;
    index++;
  }

  if (text !== "") {
    segments.push({ kind: "text", value: text });
  }

  return segments;
}

/**
 * Escapes literal `{` / `}` so they survive a parse/serialize round-trip.
 *
 * @param text The literal text.
 *
 * @returns The escaped text. */
function escapeText(text: string): string {
  return text.replace(/\{/g, `${ESCAPE}${OPEN}`).replace(/\}/g, `${ESCAPE}${CLOSE}`);
}

/**
 * Serializes an AST of {@link ValueSegment }s back into an Element-Placeholder value string.
 *
 * @param segments        The segments to serialize.
 * @param lowercaseValues When **TRUE**, every literal parameter value is lowercased (CodBi treats
 *                        parameter values case-insensitively). EP ids are left untouched, and the
 *                        builder's inputs keep the user's original casing — only the serialized
 *                        value is affected.
 *
 * @returns The serialized value. */
export function serializeEPValue(segments: Array<ValueSegment>, lowercaseValues = false): string {
  return segments
    .map((segment) =>
      segment.kind === "text"
        ? escapeText(lowercaseValues ? segment.value.toLowerCase() : segment.value)
        : serializeEPNode(segment, lowercaseValues),
    )
    .join("");
}

/**
 * Serializes a single {@link EPNode }.
 *
 * @param node            The EP node.
 * @param lowercaseValues See {@link serializeEPValue }.
 *
 * @returns The serialized `{ id > p1; p2 }` string. */
export function serializeEPNode(node: EPNode, lowercaseValues = false): string {
  const inner = node.params.map((param) => serializeEPValue(param, lowercaseValues)).join(` ${PARAM_SEP} `);

  return `${OPEN} ${node.id} ${EP_SEP} ${inner} ${CLOSE}`;
}

/**
 * Collects the (lowercased) ids of every EP contained in **segments**, including nested ones.
 *
 * @param segments The segments to scan.
 *
 * @returns The distinct EP ids. */
export function collectEPIds(segments: Array<ValueSegment>): Array<string> {
  const ids = new Set<string>();

  const visit = (list: Array<ValueSegment>): void => {
    for (const segment of list) {
      if (segment.kind === "ep") {
        ids.add(segment.id.toLowerCase());

        for (const param of segment.params) {
          visit(param);
        }
      }
    }
  };

  visit(segments);

  return Array.from(ids);
}

/**
 * Convenience helper: builds a fresh {@link EPNode } with one empty parameter per signature entry (or
 * a single empty parameter when the signature is unknown).
 *
 * @param id            The EP id.
 * @param paramCount    The amount of parameters to pre-fill.
 *
 * @returns The new {@link EPNode }. */
export function createEPNode(id: string, paramCount: number): EPNode {
  const params = new Array<Array<ValueSegment>>();
  const count = Math.max(paramCount, 0);

  for (let index = 0; index < count; index++) {
    params.push([]);
  }

  return { kind: "ep", id, params };
}
