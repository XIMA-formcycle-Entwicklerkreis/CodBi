import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";

function setupConfigCapture() {
  const calls: any[] = [];
  window.codbi.loadConfig = ((config: any) => {
    calls.push(config);
  }) as any;
  window.codbi.loadConfigs = ((configs: any[]) => {
    calls.push(...configs);
  }) as any;
  return calls;
}

describe("Configuration: BayVIS", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with BayVIS targets", async () => {
    await import("../src/js/Configurations/BayVIS.js");
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls.some((c: any) => c.targets?.includes("CodBi_BayVIS"))).toBe(true);
  });
});

describe("Configuration: Holistic.Cleave.Date", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with datepicker targets and HTML.Input.Cleave", async () => {
    await import("../src/js/Configurations/Holistic.Cleave.Date.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("HTML.Input.Cleave");
    expect(calls[0].targets).toContain("data-datepicker");
  });
});

describe("Configuration: Holistic.Cleave.Phone", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with phone targets and HTML.Input.Cleave", async () => {
    await import("../src/js/Configurations/Holistic.Cleave.Phone.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("HTML.Input.Cleave");
    expect(calls[0].targets).toContain("phone");
  });
});

describe("Configuration: Holistic.Cleave.PLZ", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with PLZ targets and HTML.Input.Cleave", async () => {
    await import("../src/js/Configurations/Holistic.Cleave.PLZ.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("HTML.Input.Cleave");
    expect(calls[0].targets).toContain("plzDE");
  });
});

describe("Configuration: Holistic.Cleave.Time", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with time targets and HTML.Input.Cleave", async () => {
    await import("../src/js/Configurations/Holistic.Cleave.Time.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("HTML.Input.Cleave");
    expect(calls[0].targets).toContain("time");
  });
});

describe("Configuration: LDAP.Autofill", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfigs with LDAP Autocomplete configs", async () => {
    await import("../src/js/Configurations/LDAP.Autofill.js");
    expect(calls.length).toBeGreaterThanOrEqual(4);
    expect(calls.some((c: any) => c.FUNC?.includes("LDAP.Autocomplete"))).toBe(true);
    expect(calls.some((c: any) => c.targets?.includes("CodBi_LDAP"))).toBe(true);
  });
});

describe("Configuration: OpenPLZ.AC.SET", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfigs with OpenPLZ Autocomplete configs", async () => {
    await import("../src/js/Configurations/OpenPLZ.AC.SET.js");
    expect(calls.length).toBeGreaterThanOrEqual(2);
    expect(calls.some((c: any) => c.FUNC?.includes("OpenPLZ.Autocomplete"))).toBe(true);
    expect(calls.some((c: any) => c.targets?.includes("CodBi_OpenPLZ"))).toBe(true);
  });
});

describe("Configuration: AI", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfigs with AI-related configs", async () => {
    await import("../src/js/Configurations/AI.js");
    expect(calls.length).toBeGreaterThanOrEqual(1);
  });
});

describe("Configuration: Holistic.Matomo.Tracking", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with Matomo.Tracking on body", async () => {
    await import("../src/js/Configurations/Holistic.Matomo.Tracking.js");
    expect(calls.length).toBe(1);
    expect(calls[0].targets).toBe("body");
    expect(calls[0].FUNC).toBe("Matomo.Tracking");
  });
});

describe("Configuration: Holistic.Media.Input.Speech", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with MEDIA.INPUT.SPEECH", async () => {
    await import("../src/js/Configurations/Holistic.Media.Input.Speech.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("MEDIA.INPUT.SPEECH");
    expect(calls[0].targets).toContain("input");
  });
});

describe("Configuration: Holistic.Media.Input.Speech.Whisper", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with MEDIA.INPUT.SPEECH.WHISPER", async () => {
    await import("../src/js/Configurations/Holistic.Media.Input.Speech.Whisper.js");
    expect(calls.length).toBe(1);
    expect(calls[0].FUNC).toBe("MEDIA.INPUT.SPEECH.WHISPER");
    expect(calls[0].targets).toContain("textarea");
  });
});

describe("Configuration: Holistic.CSS.Standard", () => {
  let calls: any[];

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    calls = setupConfigCapture();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  it("calls loadConfig with HTML.CSS targeting head", async () => {
    await import("../src/js/Configurations/Holistic.CSS.Standard.js");
    expect(calls.length).toBe(1);
    expect(calls[0].targets).toBe("head");
    expect(calls[0].FUNC).toBe("HTML.CSS");
    expect(calls[0].CSS).toBeDefined();
  });
});
