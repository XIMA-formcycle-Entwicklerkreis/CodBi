// biome-ignore lint/style/useImportType: <explanation>
import { ComponentFixture, TestBed } from "@angular/core/testing";

import { Manager } from "./manager";

describe("Manager", () => {
  let component: Manager;
  let fixture: ComponentFixture<Manager>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manager],
    }).compileComponents();

    fixture = TestBed.createComponent(Manager);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});

describe("Manager.dropCodeLess", () => {
  let component: Manager;
  let dropCodeLess: (doc: {
    detFunctionalities: object;
    detElementplaceholder: object;
    detStandards: object;
  }) => void;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Manager],
    }).compileComponents();

    component = TestBed.createComponent(Manager).componentInstance;
    // The method under test is private; exercise it through the component instance.
    dropCodeLess = (
      component as unknown as {
        dropCodeLess: (doc: {
          detFunctionalities: object;
          detElementplaceholder: object;
          detStandards: object;
        }) => void;
      }
    ).dropCodeLess;
  });

  it("keeps a leaf that carries a code body", () => {
    const doc = {
      detFunctionalities: { "Lokaler.Rechner": { Description: "A calculator", Code: "window.codbi.register..." } },
      detElementplaceholder: {},
      detStandards: {},
    };

    dropCodeLess(doc);

    expect(doc.detFunctionalities).toEqual({
      "Lokaler.Rechner": { Description: "A calculator", Code: "window.codbi.register..." },
    });
  });

  it("drops a parent / container node that has no code body", () => {
    const doc = {
      detFunctionalities: {
        Lokaler: { Description: "A parent path segment" },
        "Lokaler.Rechner": { Description: "A calculator", Code: "window.codbi.register..." },
      },
      detElementplaceholder: {},
      detStandards: {},
    };

    dropCodeLess(doc);

    // The registrar is an index-signature map; widen it so Jasmine's `Expected<T>` matcher accepts the
    // partial object and so `Lokaler` can be read with bracket access (TS4111).
    const det = doc.detFunctionalities as Record<string, unknown>;
    expect(det).toEqual({
      "Lokaler.Rechner": { Description: "A calculator", Code: "window.codbi.register..." },
    });
    expect(det["Lokaler"]).toBeUndefined();
  });

  it("drops entries whose code is only whitespace", () => {
    const doc = {
      detFunctionalities: { "Lokaler.Empty": { Description: "parent", Code: "   " } },
      detElementplaceholder: {},
      detStandards: {},
    };

    dropCodeLess(doc);

    // Widen to an index-signature map so Jasmine's `Expected<T>` accepts the empty matcher.
    expect(doc.detFunctionalities as Record<string, unknown>).toEqual({});
  });

  it("drops code-less entries from all three registries", () => {
    const doc = {
      detFunctionalities: { Parent: { Description: "segments" } },
      detElementplaceholder: { Placeholder: { Description: "segments" } },
      detStandards: { Holistic: { Description: "segments" } },
    };

    dropCodeLess(doc);

    // Widen to index-signature maps so Jasmine's `Expected<T>` accepts the empty matchers.
    expect(doc.detFunctionalities as Record<string, unknown>).toEqual({});
    expect(doc.detElementplaceholder as Record<string, unknown>).toEqual({});
    expect(doc.detStandards as Record<string, unknown>).toEqual({});
  });
});
