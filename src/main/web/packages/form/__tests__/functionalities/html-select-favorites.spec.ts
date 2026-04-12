import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getJQuery } from "@de-xima/fc-form-renderer";

describe("HTML_Select_Favorites.functionality", () => {
  let $: ReturnType<typeof getJQuery>;

  beforeEach(() => {
    (globalThis as any).XFC_METADATA = { requestType: "provide" };
    document.body.innerHTML = "";
    $ = getJQuery();
  });

  afterEach(() => {
    delete (globalThis as any).XFC_METADATA;
    document.body.innerHTML = "";
  });

  function createSelect(...optionTexts: string[]): HTMLSelectElement {
    const select = document.createElement("select");
    for (const text of optionTexts) {
      const opt = document.createElement("option");
      opt.value = text.toLowerCase().replace(/\s/g, "-");
      opt.innerHTML = text;
      select.appendChild(opt);
    }
    document.body.appendChild(select);
    return select;
  }

  it("inserts a divider option before non-favorite options", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma", "Delta");

    HTML_Select_Favorites.functionality({ favorites: ["Alpha", "Beta"], divider: "---" }, select);

    const options = select.querySelectorAll("option");
    // Favorites first, then divider, then rest
    const divider = select.querySelector(".---CodBi.--HTML_Select_Favorites.--Divider") as HTMLOptionElement;
    expect(divider).not.toBeNull();
    expect(divider.innerHTML.trim()).toBe("---");
  });

  it("moves favorites above the divider", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma", "Delta");

    HTML_Select_Favorites.functionality({ favorites: ["Gamma"], divider: "---" }, select);

    const options = select.querySelectorAll("option");
    // Gamma should be before the divider
    const texts = Array.from(options).map((o) => o.innerHTML.trim());
    const gammaIdx = texts.indexOf("Gamma");
    const dividerIdx = texts.findIndex((t) => t === "---");
    expect(gammaIdx).toBeLessThan(dividerIdx);
  });

  it("adds CSS classes to favorite options", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma");

    HTML_Select_Favorites.functionality({ favorites: ["Beta"] }, select);

    const favorite = select.querySelector(".---CodBi.--HTML_Select_Favorites.--Favorite");
    expect(favorite).not.toBeNull();
    expect(favorite?.innerHTML.trim()).toBe("Beta");
  });

  it("sets initial element when specified", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma");

    HTML_Select_Favorites.functionality({ favorites: ["Alpha"], initialelement: "gamma" }, select);

    expect($(select).val()).toBe("gamma");
  });

  it("reverts to last selection when divider is clicked", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma");

    HTML_Select_Favorites.functionality({ favorites: ["Alpha"], initialelement: "alpha" }, select);

    // Select Beta first
    $(select).val("beta");
    select.dispatchEvent(new Event("change"));

    // Then select the Divider
    $(select).val("Divider");
    select.dispatchEvent(new Event("change"));

    // Should revert to last valid selection "beta"
    expect($(select).val()).toBe("beta");
  });

  it("goes to dividerTarget when divider is clicked and target specified", async () => {
    const { HTML_Select_Favorites } = await import("../../src/js/Functionalities/html.select.favorites.js");
    const select = createSelect("Alpha", "Beta", "Gamma");

    HTML_Select_Favorites.functionality({ favorites: ["Alpha"], dividertarget: "gamma" }, select);

    // Select the Divider
    $(select).val("Divider");
    select.dispatchEvent(new Event("change"));

    expect($(select).val()).toBe("gamma");
  });
});
