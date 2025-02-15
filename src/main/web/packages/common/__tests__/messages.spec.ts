// Tests for the "messages.ts" module.

import { describe, expect, it } from "@jest/globals";

import { formMessage, pluginMessage, type TMessageKey } from "../src/js/messages.js";

describe("pluginMessage", () => {
  it("returns the localized message for a plugin message", () => {
    expect(pluginMessage("de", "plugin.form_designer_resource.name")).toBe("Formular-Designer-Ressource");
    expect(pluginMessage("en", "plugin.form_designer_resource.name")).toBe("Form designer resource");
  });
  it("defaults to English when no translation is available for a language", () => {
    expect(pluginMessage("klingon", "plugin.form_designer_resource.name")).toBe("Form designer resource");
  });
  it("returns the key enclosed in question marks when no translation is available", () => {
    expect(pluginMessage("klingon", "foo" as TMessageKey)).toBe("?foo?");
  });
});

describe("formMessage", () => {
  it("returns the localized message from the form I18N variables if available", () => {
    expect(formMessage("de", "form.test_string", { testString: "msg-de" })).toBe("msg-de");
    expect(formMessage("en", "form.test_string", { testString: "msg-en" })).toBe("msg-en");
  });
  it("falls back to the plugin message when no I18N variable is available", () => {
    expect(formMessage("de", "form.test_string", {})).toBe("test-de");
    expect(formMessage("en", "form.test_string", {})).toBe("test-en");
  });
  it("defaults to English when no translation is available for a language", () => {
    expect(formMessage("klingon", "plugin.form_designer_resource.name", {})).toBe("Form designer resource");
  });
  it("returns the key enclosed in question marks when no translation is available", () => {
    expect(formMessage("en", "foo" as TMessageKey, {})).toBe("?foo?");
  });
});
