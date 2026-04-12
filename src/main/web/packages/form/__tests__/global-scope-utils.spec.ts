import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { resolveLdapUrl, stringToDate } from "../src/js/global-scope.js";

describe("resolveLdapUrl", () => {
  const origSettings = window.codbiSettings;
  const origLocation = window.location;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    // Reset settings each time
    (window as any).codbiSettings = undefined;
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    (window as any).codbiSettings = origSettings;
  });

  it("returns undefined when no LDAP settings exist", () => {
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns undefined when both URLs are empty", () => {
    (window as any).codbiSettings = { LDAP: {} };
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns undefined when both URLs are 'null' strings", () => {
    (window as any).codbiSettings = { LDAP: { URL: "null", URL_BACKEND: "null" } };
    expect(resolveLdapUrl()).toBeUndefined();
  });

  it("returns frontend URL when only frontend provided", () => {
    (window as any).codbiSettings = {
      LDAP: { URL: "http://frontend.example.com/ldap" },
    };
    expect(resolveLdapUrl()).toBe("http://frontend.example.com/ldap");
  });

  it("returns backend URL when only backend provided", () => {
    (window as any).codbiSettings = {
      LDAP: { URL_BACKEND: "http://backend.example.com/ldap" },
    };
    expect(resolveLdapUrl()).toBe("http://backend.example.com/ldap");
  });

  it("returns frontend URL when browser hostname matches frontend", () => {
    // jsdom default hostname is "localhost"
    (window as any).codbiSettings = {
      LDAP: {
        URL: "http://localhost/ldap",
        URL_BACKEND: "http://backend.example.com/ldap",
      },
    };
    expect(resolveLdapUrl()).toBe("http://localhost/ldap");
  });

  it("returns backend URL when browser hostname matches backend", () => {
    // Cannot easily change window.location.hostname in jsdom, so this tests the fallback
    (window as any).codbiSettings = {
      LDAP: {
        URL: "http://other-server.example.com/ldap",
        URL_BACKEND: "http://localhost/ldap",
      },
    };
    expect(resolveLdapUrl()).toBe("http://localhost/ldap");
  });

  it("defaults to frontend URL when neither hostname matches", () => {
    (window as any).codbiSettings = {
      LDAP: {
        URL: "http://server-a.example.com/ldap",
        URL_BACKEND: "http://server-b.example.com/ldap",
      },
    };
    expect(resolveLdapUrl()).toBe("http://server-a.example.com/ldap");
  });

  it("handles invalid frontend URL gracefully", () => {
    (window as any).codbiSettings = {
      LDAP: {
        URL: "not-a-valid-url",
        URL_BACKEND: "http://localhost/ldap",
      },
    };
    // Should still resolve — backend matches localhost
    expect(resolveLdapUrl()).toBe("http://localhost/ldap");
  });
});

describe("stringToDate — edge cases", () => {
  it("parses date with slashes DD/MM/YYYY", () => {
    const result = stringToDate("31/12/2023", "DD/MM/YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2023);
    expect(result!.getMonth()).toBe(11);
    expect(result!.getDate()).toBe(31);
  });

  it("handles YYYY.MM.DD format", () => {
    const result = stringToDate("2023.03.15", "YYYY.MM.DD");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getFullYear()).toBe(2023);
    expect(result!.getMonth()).toBe(2);
    expect(result!.getDate()).toBe(15);
  });

  it("returns null for letters-only input", () => {
    expect(stringToDate("abc-def-ghi", "DD-MM-YYYY")).toBeNull();
  });

  it("handles date with extra whitespace", () => {
    const result = stringToDate("  05 . 06 . 2024  ", "DD.MM.YYYY");
    expect(result).toBeInstanceOf(Date);
    expect(result!.getDate()).toBe(5);
  });
});
