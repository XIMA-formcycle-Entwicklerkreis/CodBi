// #region Imports
import { pickProperty, requestBayVISResource, toParameterString } from "../commons/bayvis-resource.js";
// #endregion Imports

/** The `{ bezeichnung, id }` shape of a service assigned to a contact. */
interface LeistungsZuordnung {
  bezeichnung?: unknown;
  id?: unknown;
}

/**
 * This **E**lement-**P**laceholder performs a REVERSE lookup: it returns the details (e-mail, name,
 * phone, authority address, …) of every Ansprechpartner that has the given service (**Leistung**)
 * assigned.
 *
 * The BayernPortal assigns services to a person on the ADMINISTRATOR side:
 * `/rest/allgemein/v3/ansprechpartner/{id}/leistungen` returns the `{ bezeichnung, id }[]` a contact
 * is responsible for. To find the contacts of ONE service the portal has no direct endpoint, so this
 * EP walks the whole `/ansprechpartner` directory, fetches the assigned services of every person and
 * keeps those whose assigned services match the selector.
 *
 * Each matching contact is enriched with the telephone parts (`telefonOrtsvorwahl`, `telefonAnlage`,
 * `telefonDurchwahl`) from `/ansprechpartner/{id}` and the postal-address parts
 * (`postanschriftStrasse`, `postanschriftPLZ`, `postanschriftOrt`) of its Behörde from
 * `/behoerden/{id}/gebaeude/{id2}` — exposed as separate fields under their BayVIS member names.
 *
 *  - 1st: The SELECTOR – either the NUMERIC id of the service (`BayVIS.Ansprechpartner.Leistungen`)
 *         or a regular expression that is tested against the `bezeichnung` of the assigned services.
 *  - 2nd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *  - 3rd: OPTIONAL – a property to extract from every matching Ansprechpartner (e.g. "email",
 *         "vorname", "telefonOrtsvorwahl", "postanschriftPLZ"). Omit it to receive the whole contact
 *         records.
 *
 *  - returns an {@link Array } of the matching contact records, or the values of the requested
 *    property.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungsansprechpartner {
  /**
   * See {@link BayVIS_Leistungsansprechpartner }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    const selector = toParameterString(params[0]);
    const gemeindekennziffer = toParameterString(params[1]);
    const property = toParameterString(params[2]);

    return requestBayVISResource({ service: "ansprechpartner", gemeindekennziffer }).then(async (payload) => {
      const directory = Array.isArray(payload) ? (payload as Array<Record<string, unknown>>) : [];
      const matches = new Array<Record<string, unknown>>();

      for (const contact of directory) {
        const ansprechpartnerId = contact.ansprechpartnerId;

        const assignments = await requestBayVISResource({
          service: "ansprechpartner.leistungen",
          ids: [ansprechpartnerId],
          gemeindekennziffer,
        });

        if (BayVIS_Leistungsansprechpartner.assigned(assignments, selector)) {
          matches.push(await BayVIS_Leistungsansprechpartner.enrich(contact, gemeindekennziffer));
        }
      }

      return pickProperty(matches, property === "" ? undefined : property);
    });
  }

  /**
   * Extends a contact record with the telephone number and the postal address of its authority.
   *
   * The portal stores the phone on the per-contact detail only (`/ansprechpartner/{id}`) and the
   * postal address on the authority's building (`/behoerden/{id}/gebaeude/{id2}`), neither of which
   * is part of the `/ansprechpartner` directory — so both are fetched once per matching contact.
   *
   * The three phone parts (`telefonOrtsvorwahl`, `telefonAnlage`, `telefonDurchwahl`) and the three
   * address parts (`postanschriftStrasse`, `postanschriftPLZ`, `postanschriftOrt`) are copied onto
   * the contact under their BayVIS member names, so they can be consumed separately.
   *
   * @param contact The directory record of one Ansprechpartner.
   * @param gemeindekennziffer The optional official municipality key to forward.
   * @return A copy of the contact enriched with the phone and address fields.
   */
  protected static async enrich(
    contact: Record<string, unknown>,
    gemeindekennziffer: string,
  ): Promise<Record<string, unknown>> {
    const enriched: Record<string, unknown> = { ...contact };
    const pick = (record: Record<string, unknown> | undefined): Record<string, unknown> =>
      record === undefined ? {} : record;

    const detail = pick(
      BayVIS_Leistungsansprechpartner.firstRecord(
        await requestBayVISResource({
          service: "ansprechpartner.details",
          ids: [contact.ansprechpartnerId],
          gemeindekennziffer,
        }),
      ),
    );
    enriched.telefonOrtsvorwahl = detail.telefonOrtsvorwahl;
    enriched.telefonAnlage = detail.telefonAnlage;
    enriched.telefonDurchwahl = detail.telefonDurchwahl;

    const gebaeude = pick(
      BayVIS_Leistungsansprechpartner.firstRecord(
        await requestBayVISResource({
          service: "behoerden.gebaeude",
          ids: [contact.behoerdeId, contact.gebaeudeId],
          gemeindekennziffer,
        }),
      ),
    );
    enriched.postanschriftStrasse = gebaeude.postanschriftStrasse;
    enriched.postanschriftPLZ = gebaeude.postanschriftPLZ;
    enriched.postanschriftOrt = gebaeude.postanschriftOrt;

    return enriched;
  }

  /**
   * Reads the first contact/building record of an unwrapped single-resource payload.
   *
   * @param payload The unwrapped payload (either a single record or a one-element array).
   * @return The record, or `undefined` when the payload is not a usable record.
   */
  protected static firstRecord(payload: unknown): Record<string, unknown> | undefined {
    const source = Array.isArray(payload) ? payload[0] : payload;
    return source !== null && typeof source === "object" ? (source as Record<string, unknown>) : undefined;
  }

  /**
   * States whether one of a contact's assigned services matches the selector.
   *
   * A purely numeric selector is compared against the service `id`; any other selector is compiled
   * into a regular expression and tested against the `bezeichnung` (falling back to a substring
   * comparison when the pattern is not a valid regular expression).
   *
   * @param assignments The `{ bezeichnung, id }[]` of one contact.
   * @param selector The service selector.
   * @return `true` when at least one assigned service matches.
   */
  public static assigned(assignments: unknown, selector: string): boolean {
    if (!Array.isArray(assignments) || selector === "") {
      return false;
    }

    const isNumericId = /^\d+$/.test(selector);

    for (const assignment of assignments) {
      const zuordnung = assignment as LeistungsZuordnung;

      if (isNumericId) {
        if (`${zuordnung.id ?? ""}` === selector) {
          return true;
        }
        continue;
      }

      const bezeichnung = String(zuordnung.bezeichnung ?? "");

      try {
        if (new RegExp(selector).test(bezeichnung)) {
          return true;
        }
      } catch {
        if (bezeichnung.includes(selector)) {
          return true;
        }
      }
    }

    return false;
  }
}

window.codbi.registerEP("BayVIS.Leistungsansprechpartner", BayVIS_Leistungsansprechpartner.retrieve); // Initialization
