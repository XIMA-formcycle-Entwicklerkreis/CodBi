import { describe, expect, it } from "@jest/globals";
import {
  collectContacts,
  pickProperty,
  toParameterString,
  unwrapPayload,
} from "../../src/js/commons/bayvis-resource.js";

/**
 * The BayVIS resource helper is shared by 19 element placeholders, so its three heuristics must be
 * pinned down:
 * 1. envelope unwrapping must reach the record without knowing the (undocumented) key names,
 * 2. contact collection must find nested contacts, INCLUDING the authority/building records the
 *    portal actually embeds in a Leistungsbeschreibung's "Zuständigkeiten" block,
 * 3. property extraction must map over a collection.
 *
 * Reported case that motivated `collectContacts`: "all Ansprechpartner that are defined for a
 * Leistung" — the portal nests them inside the Leistungsbeschreibung's "Zuständigkeiten" block.
 */
describe("BayVIS resource helper", () => {
  /** A Leistungsbeschreibung shaped like the portal's (authority → building → contacts). */
  const payload = {
    GetLeistungsbeschreibungResponse: {
      leistungsbeschreibung: {
        id: 12345,
        bezeichnung: "Baugenehmigung",
        zustaendigkeiten: {
          behoerde: [
            {
              id: 42,
              bezeichnung: "Amt 44",
              // An authority carries `email` — NEVER `apEmail`/`vorname`, so it is no contact.
              email: "amt44@example.org",
              gebaeude: [
                {
                  id: 7,
                  hausanschriftStrasse: "Maximilianstraße 1",
                  ansprechpartner: [
                    {
                      id: 1,
                      vorname: "Salvatore",
                      nachname: "Callari",
                      apEmail: "salvatore@example.org",
                      apTelefonDurchwahl: "1234",
                    },
                    { id: 2, vorname: "Anna", nachname: "Muster", apEmail: "anna@example.org" },
                  ],
                },
              ],
            },
          ],
        },
      },
    },
  };

  it("unwraps the transport envelopes down to the record", () => {
    const unwrapped = unwrapPayload(payload) as Record<string, unknown>;

    expect(unwrapped.id).toBe(12345);
    expect(unwrapped.bezeichnung).toBe("Baugenehmigung");
    expect(unwrapped).toHaveProperty("zustaendigkeiten");
  });

  it("collects every nested contact record", () => {
    const contacts = collectContacts(payload);

    expect(contacts.map((contact) => contact.nachname)).toEqual(["Callari", "Muster"]);
    expect(contacts[0].apTelefonDurchwahl).toBe("1234");
  });

  it("never mistakes a bare `email` record for a contact", () => {
    // CAREFUL: the real portal authority record always carries `bwwlink`/`website` (plus `email`).
    // A record with ONLY `email` (e.g. an editorial entry) must still NOT be collected.
    const contacts = collectContacts({ behoerde: [{ id: 42, email: "amt44@example.org" }] });

    expect(contacts).toEqual([]);
  });

  it("collects the authority records of a real Zuständigkeiten block", () => {
    // Live shape of `leistungsbeschreibungen/{id}` with `gemeindekennziffer`: the zustaendig[]
    // authorities carry `bwwlink`/`website`/`email` and nest `anschriften.gebaeude[]`.
    const zustaendig = {
      leistungsbeschreibung: {
        id: 100,
        zustaendigkeiten: {
          zustaendig: [
            {
              anschriften: {
                gebaeude: [{ telefon: "+49 89 2306-0", fax: "+49 89 2306-2808" }],
              },
              bezeichnung: "Bayerisches Staatsministerium der Finanzen und für Heimat",
              bwwlink: "https://www.bayernportal.de/dokumente/behoerde/36665710206",
              email: "poststelle@stmfh.bayern.de",
              website: "http://www.stmfh.bayern.de",
            },
          ],
        },
      },
    };
    const contacts = collectContacts(zustaendig);

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject({
      bezeichnung: "Bayerisches Staatsministerium der Finanzen und für Heimat",
      email: "poststelle@stmfh.bayern.de",
      bwwlink: "https://www.bayernportal.de/dokumente/behoerde/36665710206",
    });
    // Nested building stays inside the matched authority record (not duplicated as a second contact).
    const anschriften = contacts[0].anschriften as { gebaeude: Array<{ telefon?: string }> };
    expect(anschriften.gebaeude[0]?.telefon).toBe("+49 89 2306-0");
  });

  it("de-duplicates contacts by id", () => {
    const duplicated = {
      ...payload,
      zweiteSicht: JSON.parse(JSON.stringify(payload.GetLeistungsbeschreibungResponse)),
    };
    const contacts = collectContacts(duplicated);

    expect(contacts).toHaveLength(2);
  });

  it("maps a property over the collected contacts", () => {
    const contacts = collectContacts(payload);

    expect(pickProperty(contacts, "apEmail")).toEqual(["salvatore@example.org", "anna@example.org"]);
  });

  it("returns the payload unchanged when no property is requested", () => {
    expect(pickProperty("plain")).toBe("plain");
    expect(pickProperty({ a: 1 }, "")).toEqual({ a: 1 });
    expect(pickProperty({ a: 1 }, "  ")).toEqual({ a: 1 });
  });

  it("reads a dotted path of the wrapped editorial fields", () => {
    // Real shape of `/leistungen`: `bezeichnung` is an OBJECT, the name is `bezeichnung.value`.
    const services = [
      { id: 3627, bezeichnung: { leittext: "Bezeichnung", value: "Abendgymnasium; Anmeldung" } },
      { id: 3625, bezeichnung: { leittext: "Bezeichnung", value: "Abendrealschule; Anmeldung" } },
    ];

    expect(pickProperty(services, "bezeichnung.value")).toEqual([
      "Abendgymnasium; Anmeldung",
      "Abendrealschule; Anmeldung",
    ]);
    expect(pickProperty(services, "bezeichnung")).toEqual([
      { leittext: "Bezeichnung", value: "Abendgymnasium; Anmeldung" },
      { leittext: "Bezeichnung", value: "Abendrealschule; Anmeldung" },
    ]);
  });

  it("maps the rest of the path over an array on the way", () => {
    const record = {
      lebenslagen: { lebenslage: [{ id: "1", bezeichnung: "Weiterbildung" }] },
      synonyme: { synonym: [{ value: "müll" }, { value: "abfall" }] },
    };

    expect(pickProperty(record, "synonyme.synonym.value")).toEqual(["müll", "abfall"]);
    expect(pickProperty(record, "lebenslagen.lebenslage.bezeichnung")).toEqual(["Weiterbildung"]);
  });

  it("throws for a dotted path that does not exist on a single record", () => {
    expect(() => pickProperty({ id: 1 }, "bezeichnung.value")).toThrow(/not available/);
  });

  it("trims parameter values and treats empty ones as absent", () => {
    expect(toParameterString("  DIREKT ")).toBe("DIREKT");
    expect(toParameterString("")).toBe("");
    expect(toParameterString(undefined)).toBe("");
    expect(toParameterString(0)).toBe("0");
    expect(toParameterString({})).toBe("");
  });
});
