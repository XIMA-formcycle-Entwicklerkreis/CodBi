import { beforeEach, describe, expect, it, jest } from "@jest/globals";

// Mock the shared resource helper so the REVERSE lookup can be pinned down without touching the HTTP
// layer. `jest.fn` is created inside the hoisted factory (Jest forbids closing over outer bindings
// there), and the real module is imported below to inspect/steer the call record.
jest.mock("../../src/js/commons/bayvis-resource.js", () => ({
  requestBayVISResource: jest.fn<(request: Record<string, unknown>) => Promise<unknown>>().mockResolvedValue([]),
  // Mimics the real pickProperty (maps a dotted path over every array entry) so the property
  // extraction test end-to-end; both helpers are re-implemented inline because the hoisted factory
  // may not close over the real module.
  pickProperty: jest.fn((payload: unknown, property?: string) => {
    if (!property) return payload;
    if (Array.isArray(payload)) {
      return (payload as Array<Record<string, unknown>>)
        .map((entry) =>
          property
            .split(".")
            .reduce<unknown>((current, segment) => (current as Record<string, unknown> | undefined)?.[segment], entry),
        )
        .filter((value) => value !== undefined);
    }
    return payload;
  }),
  // Re-implemented inline because the hoisted factory may not close over the real module.
  toParameterString: (value: unknown): string => {
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value.trim();
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    return "";
  },
}));

import { BayVIS_Leistungsansprechpartner } from "../../src/js/EPs/bayvis.leistungsansprechpartner.js";
import { pickProperty, requestBayVISResource } from "../../src/js/commons/bayvis-resource.js";

const requestMock = requestBayVISResource as jest.MockedFunction<typeof requestBayVISResource>;
// pickProperty is exercised end-to-end against the matches array in the last test.
const pickMock = pickProperty as jest.MockedFunction<typeof pickProperty>;

/** The `/ansprechpartner` directory returned by the proxy. */
const directory = [
  {
    ansprechpartnerId: 1,
    behoerdeId: 11,
    gebaeudeId: 111,
    vorname: "Anna",
    nachname: "Meier",
    email: "anna.meier@example.de",
  },
  {
    ansprechpartnerId: 2,
    behoerdeId: 22,
    gebaeudeId: 222,
    vorname: "Ben",
    nachname: "Schmidt",
    email: "ben.schmidt@example.de",
  },
  {
    ansprechpartnerId: 3,
    behoerdeId: 33,
    gebaeudeId: 333,
    vorname: "Chiara",
    nachname: "Weber",
    email: "chiara.weber@example.de",
  },
];

/** The `{ bezeichnung, id }[]` assigned to each contact. */
const assignments: Record<number, Array<{ bezeichnung: string; id: number }>> = {
  1: [
    { bezeichnung: "Baugenehmigung", id: 100 },
    { bezeichnung: "Denkmalschutz-Auskunft", id: 200 },
  ],
  2: [{ bezeichnung: "Baugenehmigung für Garage", id: 100 }],
  3: [{ bezeichnung: "Geburtsurkunde", id: 300 }],
};

/** The per-contact detail of `/ansprechpartner/{id}` (the unwrapped `{ap:[…]}` payload). */
const details: Record<number, Record<string, unknown>> = {
  1: { telefonOrtsvorwahl: "980", telefonAnlage: "51", telefonDurchwahl: "248" },
  2: { telefonOrtsvorwahl: "980", telefonAnlage: "52", telefonDurchwahl: "100" },
  3: { telefonOrtsvorwahl: "", telefonAnlage: "", telefonDurchwahl: "" },
};

/** The building record of `/behoerden/{id}/gebaeude/{id2}` (the unwrapped `behoerdenGebaeude`). */
const gebaeude: Record<number, Record<string, unknown>> = {
  11: { postanschriftStrasse: "Musterstraße 1", postanschriftPLZ: "91522", postanschriftOrt: "Ansbach" },
  22: { postanschriftStrasse: "Hauptweg 2", postanschriftPLZ: "91522", postanschriftOrt: "Ansbach" },
  33: { postanschriftStrasse: "", postanschriftPLZ: "", postanschriftOrt: "" },
};

function stageDirectoryAndAssignments(): void {
  requestMock.mockImplementation((request) => {
    if (request.service === "ansprechpartner") {
      return Promise.resolve(directory);
    }

    if (request.service === "ansprechpartner.details") {
      const id = request.ids?.[0];
      return Promise.resolve([details[Number(id)] ?? {}]);
    }

    if (request.service === "behoerden.gebaeude") {
      const id = request.ids?.[0];
      return Promise.resolve(gebaeude[Number(id)] ?? {});
    }

    const id = request.ids?.[0];
    return Promise.resolve(assignments[Number(id)] ?? []);
  });
}

describe("BayVIS.Leistungsansprechpartner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    stageDirectoryAndAssignments();
  });

  it("returns the contacts that have the service with the given numeric id assigned", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["100"])) as Array<Record<string, unknown>>;

    // Anna and Ben both carry id 100; Chiara does not.
    expect(result).toHaveLength(2);
    expect(result.map((c) => c.ansprechpartnerId)).toEqual([1, 2]);
  });

  it("matches the selector as a regular expression against the bezeichnung", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["^Denkmal"])) as Array<Record<string, unknown>>;

    // Only Anna's "Denkmalschutz-Auskunft" begins with "Denk".
    expect(result.map((c) => c.ansprechpartnerId)).toEqual([1]);
  });

  it("falls back to a substring match when the regex is invalid", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["[unclosed"])) as Array<Record<string, unknown>>;

    // "[unclosed" is not a valid regex; as a substring it matches nothing here.
    expect(result).toHaveLength(0);
  });

  it("returns the whole contact records when no property is requested", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["Geburtsurkunde"])) as Array<
      Record<string, unknown>
    >;

    expect(result.map((c) => c.ansprechpartnerId)).toEqual([3]);
  });

  it("extracts the requested property from every matching contact and forwards the gemeindekennziffer", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["100", "09561000", "email"])) as Array<string>;

    expect(result).toEqual(["anna.meier@example.de", "ben.schmidt@example.de"]);

    // The gemeindekennziffer is forwarded on EVERY request (directory, leistungen, details, gebaeude).
    const calls = requestMock.mock.calls;
    expect(calls[0][0].service).toBe("ansprechpartner");
    expect(calls[0][0].gemeindekennziffer).toBe("09561000");
    for (const call of calls.slice(1)) {
      expect(call[0].gemeindekennziffer).toBe("09561000");
    }
    // Directory + for each of the 3 contacts one leistungen call + for each of the 2 matches a
    // details and a gebaeude call: 1 + 3 + 2 + 2 = 8.
    expect(calls.length).toBe(8);
  });

  it("enriches every matching contact with its split phone and authority address fields", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["100"])) as Array<Record<string, unknown>>;

    expect(result.map((c) => c.ansprechpartnerId)).toEqual([1, 2]);

    // Phone parts (Anna: `980 / 51 - 248`; Ben: `980 / 52 - 100`).
    expect(result[0].telefonOrtsvorwahl).toBe("980");
    expect(result[0].telefonAnlage).toBe("51");
    expect(result[0].telefonDurchwahl).toBe("248");
    expect(result[1].telefonOrtsvorwahl).toBe("980");
    expect(result[1].telefonAnlage).toBe("52");
    expect(result[1].telefonDurchwahl).toBe("100");

    // Address parts of the Behörde.
    expect(result[0].postanschriftStrasse).toBe("Musterstraße 1");
    expect(result[0].postanschriftPLZ).toBe("91522");
    expect(result[0].postanschriftOrt).toBe("Ansbach");
    expect(result[1].postanschriftStrasse).toBe("Hauptweg 2");

    // The original directory fields are preserved.
    expect(result[0].email).toBe("anna.meier@example.de");
  });

  it("exposes the phone and address fields as empty strings when the detail lacks the data", async () => {
    const result = (await BayVIS_Leistungsansprechpartner.retrieve(["Geburtsurkunde"])) as Array<
      Record<string, unknown>
    >;

    // Chiara matches, but her staged detail/gebaeude records are empty.
    expect(result).toHaveLength(1);
    expect(result[0].telefonOrtsvorwahl).toBe("");
    expect(result[0].telefonAnlage).toBe("");
    expect(result[0].telefonDurchwahl).toBe("");
    expect(result[0].postanschriftStrasse).toBe("");
    expect(result[0].postanschriftPLZ).toBe("");
    expect(result[0].postanschriftOrt).toBe("");
  });

  it("forwards the raw parameter positions (selector, gemeindekennziffer, property)", async () => {
    await BayVIS_Leistungsansprechpartner.retrieve(["100", "09561000", "email"]);

    // pickProperty receives the matches array and the trimmed property parameter.
    expect(pickMock).toHaveBeenCalledTimes(1);
    expect(pickMock.mock.calls[0][1]).toBe("email");
  });
});
