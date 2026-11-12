// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Fast XML-Parser
import { XMLParser } from "fast-xml-parser";
// #endregion Fast XML-Parser
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * Shared plumbing for the BayVIS (BayernPortal) **resource** element placeholders — the ones backed
 * by the {@link BAYVIS_RESOURCE_SERVLET} proxy instead of a dedicated servlet.
 *
 * Why this exists:
 * - The dedicated BayVIS servlets keep returning the API's default **XML** representation, so their
 *   element placeholders parse known XML envelopes (`ns2:GetBehoerdeResponse` …). The new resources
 *   are requested as **JSON** by the proxy servlet, which removes the need to hard-code envelope
 *   element names that are not documented.
 * - Every new resource differs only in its `Service` key, its path ids and the optional property to
 *   extract, so that knowledge lives in ONE place instead of 18 near-identical classes.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net)
 */

/** The `name=` value of the proxy servlet that serves every BayVIS REST v3 resource. */
export const BAYVIS_RESOURCE_SERVLET = "CodBi_BayVIS_Auskunft_Ressourcen";

/** Describes one BayVIS resource request. */
export interface BayVISResourceRequest {
  /** The servlet's whitelisted `Service` key, e.g. `"leistungen"` or `"dienststellen.formulare"`. */
  service: string;

  /** The path ids in template order (`{id}`, `{id2}`, `{id3}`). */
  ids?: Array<unknown>;

  /** The optional `full` query flag. */
  full?: string | boolean;

  /** The optional 8-digit official municipality key (`gemeindekennziffer`). */
  gemeindekennziffer?: string;

  /**
   * Additional documented query parameters, keyed by the HEADER NAME the proxy servlet expects
   * (e.g. `{ BehoerdenAnsprechpartnerZuordnungen: "DIREKT" }`).
   */
  query?: Record<string, string>;
}

/**
 * Describes the parameter layout of a resource element placeholder.
 *
 * All indexes are **0-based** positions in the element placeholder's parameter list.
 */
export interface BayVISResourceEPConfig {
  /** The servlet's whitelisted `Service` key. */
  service: string;

  /** Positions of the parameters that carry the path ids, in `{id}`, `{id2}`, `{id3}` order. */
  idParams?: Array<number>;

  /** Position of the parameter naming the property to extract from the result. */
  propertyParam?: number;

  /** Position of the parameter holding the `gemeindekennziffer`. */
  gemeindekennzifferParam?: number;

  /** Position of the parameter controlling the `full` query flag (`"true"` / `"false"`). */
  fullParam?: number;

  /** Query parameters (header name → parameter position), forwarded when that parameter is set. */
  queryParams?: Record<string, number>;

  /** Fallback values for [queryParams] entries whose parameter is empty. */
  defaultQuery?: Record<string, string>;

  /** Reduce the payload to the contact records found anywhere inside it. */
  contactsOnly?: boolean;
}

/**
 * Converts a raw element-placeholder parameter into a trimmed string.
 *
 * @param value The raw parameter.
 * @return The trimmed string, or `""` when the parameter is missing/empty.
 */
export function toParameterString(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value === "string") {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return "";
}

/**
 * States whether the given value is a plain object (and not an array / null).
 *
 * @param value The value to check.
 * @return `true` for a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parses the servlet's response body. JSON is expected (the proxy requests `application/json`), but
 * an XML representation is accepted as well so a deployment that overrides the endpoint with an
 * XML-only service still works.
 *
 * @param response The response as delivered by jQuery.
 * @return The parsed document.
 * @throws A {@link CodBiError } when the body is empty or cannot be parsed.
 */
function parseResponse(response: unknown): unknown {
  if (typeof response !== "string") {
    return response;
  }

  const text = response.trim();

  if (text === "") {
    throw new CodBiError("The BayVIS resource answered with an empty body.");
  }

  if (text.startsWith("{") || text.startsWith("[")) {
    return JSON.parse(text);
  }

  return new XMLParser({
    attributeNamePrefix: "@_",
    ignoreAttributes: false,
    removeNSPrefix: true,
  }).parse(text);
}

/**
 * Removes the transport envelopes from a BayVIS document until the payload is reached.
 *
 * The portal wraps every answer in one or two single-key objects (JSON object name / XML root
 * element, then the singular resource name), so a single-key object is always unwrapped. An object
 * that carries exactly one ARRAY value is unwrapped too (a collection next to metadata). Everything
 * else is the payload.
 *
 * @param node The document (or an intermediate node).
 * @param depth The current recursion depth (guards against cyclic/degenerate structures).
 * @return The unwrapped payload.
 * @throws A {@link CodBiError } when the servlet reported an error.
 */
export function unwrapPayload(node: unknown, depth = 0): unknown {
  if (depth > 6) {
    return node;
  }

  if (Array.isArray(node)) {
    return node;
  }

  if (!isRecord(node)) {
    return node;
  }

  const keys = Object.keys(node);

  if (keys.length === 1 && typeof node.error === "string") {
    throw new CodBiError(String(node.error));
  }

  if (keys.length === 0) {
    return node;
  }

  if (keys.length === 1) {
    return unwrapPayload(node[keys[0]], depth + 1);
  }

  const arrays = keys.filter((key) => Array.isArray(node[key]));

  if (arrays.length === 1) {
    return unwrapPayload(node[arrays[0]], depth + 1);
  }

  return node;
}

/**
 * Reads a DOTTED path of members (e.g. `bezeichnung.value`, `lebenslagen.lebenslage`) from one record.
 *
 * The BayernPortal wraps many editorial fields: `bezeichnung` is not a string but an object
 * `{ leittext, position, sichtbar, value }`, `lebenslagen` holds `lebenslage[]`, `synonyme` holds
 * `synonym[]{ value }`. A dotted path addresses those members without needing a separate element
 * placeholder. When a member on the way is an ARRAY, the rest of the path is mapped over its entries
 * (so `synonyme.synonym.value` yields one array of values per record).
 *
 * @param node The record to read from.
 * @param path The path segments, in order.
 * @return The value found, or `undefined` when any segment is missing.
 */
function readMemberPath(node: unknown, path: Array<string>): unknown {
  let current: unknown = node;

  for (const [index, segment] of path.entries()) {
    if (Array.isArray(current)) {
      return current.map((entry) => readMemberPath(entry, path.slice(index)));
    }

    if (!isRecord(current)) {
      return undefined;
    }

    current = current[segment];

    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

/**
 * Splits a property parameter into its path segments (`"bezeichnung.value"` → `["bezeichnung",
 * "value"]`).
 *
 * @param property The raw property parameter.
 * @return The non-empty path segments.
 */
function propertyPath(property: string): Array<string> {
  return property
    .split(".")
    .map((segment) => segment.trim())
    .filter((segment) => segment !== "");
}

/**
 * Extracts one property of the payload (or of every record of a collection).
 *
 * A DOTTED path reads nested members, which the BayVIS payloads need for the wrapped editorial
 * fields: `bezeichnung.value` (the actual name), `lebenslagen.lebenslage`, `synonyme.synonym.value`.
 *
 * @param payload The unwrapped payload.
 * @param property The property (or dotted path), or `undefined`/`""` to return the payload unchanged.
 * @return The property value(s).
 * @throws A {@link CodBiError } when the property does not exist on the payload.
 */
export function pickProperty(payload: unknown, property?: string): unknown {
  if (property === undefined || property === "") {
    return payload;
  }

  const path = propertyPath(property);

  if (path.length === 0) {
    return payload;
  }

  if (Array.isArray(payload)) {
    return payload.map((entry) => readMemberPath(entry, path)).filter((value) => value !== undefined);
  }

  if (isRecord(payload)) {
    const value = readMemberPath(payload, path);

    if (value === undefined) {
      throw new CodBiError(`Property "${property}" is not available on that BayVIS resource.`);
    }

    return value;
  }

  throw new CodBiError(`Property "${property}" cannot be read from a scalar BayVIS resource.`);
}

/**
 * Property names that identify a CONTACT record of the BayernPortal.
 *
 * The `Leistungsbeschreibung`'s "Zuständigkeiten" block embeds contacts at three levels:
 *  - a PERSON carries `apEmail`/`apTelefon*` and has `vorname`/`nachname`/`anrede` (plus the
 *    optional `funktion`/`stellenbezeichnung`);
 *  - an AUTHORITY (`zustaendig[]`) carries `bwwlink` and usually `website` (and `email`);
 *  - a BUILDING (`gebaeude[]`) carries `hausanschrift`/`postanschrift` and `telefon`/`fax`.
 *
 * The portal has NO per-leistung person records (that endpoint never returns persons, only the
 * authority/building contact data), so an authority or a building inside "Zuständigkeiten" is a
 * legitimate contact to surface. A bare `email` alone is deliberately NOT a marker: it appears on
 * non-contact editorial records and would make the collector over-match.
 */
const CONTACT_MARKERS = [
  // person
  "vorname",
  "nachname",
  "anrede",
  "apEmail",
  "apTelefonLandvorwahl",
  "apTelefonOrtsvorwahl",
  "apTelefonAnlage",
  "apTelefonDurchwahl",
  "funktion",
  "stellenbezeichnung",
  // authority (zustaendig[])
  "bwwlink",
  "website",
  // building (gebaeude[])
  "hausanschrift",
  "postanschrift",
  "telefon",
  "fax",
];

/** States whether the given value is a BayVIS contact record. */
function isContactRecord(value: unknown): value is Record<string, unknown> {
  if (!isRecord(value)) {
    return false;
  }

  return CONTACT_MARKERS.some((marker) => marker in value);
}

/**
 * Builds the identity of a contact record for de-duplication (`id` when present, else the name and
 * e-mail).
 *
 * @param record The contact record.
 * @return A stable key.
 */
function contactKey(record: Record<string, unknown>): string {
  if (record.id !== undefined && record.id !== null) {
    return `id:${record.id}`;
  }

  return ["vorname", "nachname", "email", "apEmail"].map((name) => `${name}=${record[name] ?? ""}`).join("|");
}

/**
 * Collects EVERY contact record found anywhere inside a BayVIS payload, flattened and de-duplicated.
 *
 * Why this exists: the portal nests the contacts of a Leistung deep inside the "Zuständigkeiten"
 * subtree of a Leistungsbeschreibung (authority → building → contacts), and the public documentation
 * does not name those properties. Walking the tree for CONTACT-shaped records therefore yields
 * exactly the contacts without hard-coding a property path that may be renamed.
 *
 * The portal never embeds PERSON records in that subtree — it only delivers the responsible
 * AUTHORITY (`zustaendig[]` with `bwwlink`/`website`/`email`) and its BUILDING (`gebaeude[]` with
 * `telefon`/`fax`). Both are surfaced as contacts (a matched authority carries its nested building
 * address/phone, so buildings inside a matched authority are not duplicated separately).
 *
 * @param payload The (unwrapped) payload.
 * @return The contact records, in document order, without duplicates.
 */
export function collectContacts(payload: unknown): Array<Record<string, unknown>> {
  const found: Array<Record<string, unknown>> = [];
  const seen = new Set<string>();

  const visit = (node: unknown, depth: number): void => {
    if (depth > 12) {
      return;
    }

    if (Array.isArray(node)) {
      for (const entry of node) {
        visit(entry, depth + 1);
      }

      return;
    }

    if (!isRecord(node)) {
      return;
    }

    if (isContactRecord(node)) {
      const key = contactKey(node);

      if (!seen.has(key)) {
        seen.add(key);
        found.push(node);
      }

      return;
    }

    for (const child of Object.values(node)) {
      visit(child, depth + 1);
    }
  };

  visit(payload, 0);

  return found;
}

/**
 * Requests one BayVIS resource through the {@link BAYVIS_RESOURCE_SERVLET} proxy.
 *
 * @param request The resource request.
 * @return The unwrapped payload.
 * @throws A {@link CodBiError } when the request fails or the proxy reports an error.
 */
export function requestBayVISResource(request: BayVISResourceRequest): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const $ = getJQuery();
    const headers: Record<string, string> = {
      Accept: "application/json",
      Service: request.service,
    };
    const idHeaders = ["ID", "ID2", "ID3"];

    (request.ids ?? []).forEach((id, index) => {
      const value = toParameterString(id);

      if (value !== "" && index < idHeaders.length) {
        headers[idHeaders[index]] = value;
      }
    });

    if (request.full !== undefined && `${request.full}`.trim() !== "") {
      headers.Full = `${request.full}`.trim();
    }

    const gemeindekennziffer = toParameterString(request.gemeindekennziffer);

    if (gemeindekennziffer !== "") {
      headers.Gemeindekennziffer = gemeindekennziffer;
    }

    for (const [header, value] of Object.entries(request.query ?? {})) {
      const trimmed = `${value}`.trim();

      if (trimmed !== "") {
        headers[header] = trimmed;
      }
    }

    $.ajax({
      url: `${window.codbi.baseURL}plugin?name=${BAYVIS_RESOURCE_SERVLET}`,
      type: "GET",
      headers,
    })
      .done((response: unknown) => {
        try {
          resolve(unwrapPayload(parseResponse(response)));
        } catch (error) {
          reject(
            error instanceof Error ? error : new CodBiError(`Unable to read the BayVIS resource "${request.service}".`),
          );
        }
      })
      .fail(() => {
        reject(new CodBiError(`Unable to retrieve data from ${BAYVIS_RESOURCE_SERVLET} ("${request.service}").`));
      });
  });
}

/**
 * Implements one resource element placeholder: requests the configured resource and optionally
 * extracts a single property from its payload.
 *
 * @param config The parameter layout of that element placeholder.
 * @param params The parameters provided by CodBi.
 * @return The payload, or the extracted property value(s).
 * @throws A {@link CodBiError } when the request fails or the property does not exist.
 */
export function retrieveBayVISResource(config: BayVISResourceEPConfig, params: Array<unknown>): Promise<unknown> {
  const ids = (config.idParams ?? []).map((index) => params[index]);
  const property = config.propertyParam === undefined ? undefined : toParameterString(params[config.propertyParam]);
  const gemeindekennziffer =
    config.gemeindekennzifferParam === undefined
      ? undefined
      : toParameterString(params[config.gemeindekennzifferParam]);
  const full = config.fullParam === undefined ? undefined : toParameterString(params[config.fullParam]);
  const query: Record<string, string> = {};

  for (const [header, index] of Object.entries(config.queryParams ?? {})) {
    const value = toParameterString(params[index]);

    if (value !== "") {
      query[header] = value;
    }
  }

  for (const [header, value] of Object.entries(config.defaultQuery ?? {})) {
    if (query[header] === undefined) {
      query[header] = value;
    }
  }

  return requestBayVISResource({
    service: config.service,
    ids,
    gemeindekennziffer,
    full: full === "" ? undefined : full,
    query,
  }).then((payload) => {
    const resolved = config.contactsOnly === true ? collectContacts(payload) : payload;

    return pickProperty(resolved, property === "" ? undefined : property);
  });
}
