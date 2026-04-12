import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

/**
 * Test that Configurations properly call loadConfigs/loadConfig with expected parameters.
 */
describe("Configuration: Print.Removal", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfigs = ((configs: any[]) => {
      calls.push(...configs);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfigs with Print.Remove configs", async () => {
    await import("../src/js/Configurations/Print.Removal.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBeGreaterThanOrEqual(3);
    expect(calls.some((c: any) => c.targets === ".CodBi_Print_Remove_Tagged")).toBe(true);
    expect(calls.some((c: any) => c.FUNC === "Print.Remove")).toBe(true);
  });
});

describe("Configuration: UI.Panels", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfigs = ((configs: any[]) => {
      calls.push(...configs);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfigs with panel configs", async () => {
    await import("../src/js/Configurations/UI.Panels.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls.some((c: any) => c.FUNC?.includes("HTML.Panel"))).toBe(true);
  });
});

describe("Configuration: Holistic.FieldsetsToPanel.Standard", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfig = ((config: any) => {
      calls.push(config);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with HTML.Panel for fieldsets", async () => {
    await import("../src/js/Configurations/Holistic.FieldsetsToPanel.Standard.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("HTML.Panel");
    expect(calls[0].targets).toContain("fieldset");
  });
});

describe("Configuration: People", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfig = ((config: any) => {
      calls.push(config);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with people-related configs", async () => {
    await import("../src/js/Configurations/People.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBeGreaterThanOrEqual(4);
    expect(calls.some((c: any) => c.targets?.includes("CodBi_People_Name"))).toBe(true);
    expect(calls.some((c: any) => c.targets?.includes("CodBi_People_Mail"))).toBe(true);
  });
});

describe("Configuration: Financial", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfig = ((config: any) => {
      calls.push(config);
    }) as any;
    window.codbi.loadConfigs = ((configs: any[]) => {
      calls.push(...configs);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig/loadConfigs with financial configs", async () => {
    await import("../src/js/Configurations/Financial.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Configuration: Appointments", () => {
  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    const calls: any[] = [];
    window.codbi.loadConfig = ((config: any) => {
      calls.push(config);
    }) as any;
    window.codbi.loadConfigs = ((configs: any[]) => {
      calls.push(...configs);
    }) as any;
    (window.codbi as any).__configCalls = calls;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig/loadConfigs with appointment configs", async () => {
    await import("../src/js/Configurations/Appointments.js");
    const calls = (window.codbi as any).__configCalls as any[];

    expect(calls.length).toBeGreaterThanOrEqual(1);
  });
});
