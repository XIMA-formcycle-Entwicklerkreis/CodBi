import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { EQ } from "xdbc/src/DBC/EQ";
/**
 * Provides the {@link htm.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
export class HTML_Select_Favorites {
  /**
   * Rearranges the {@link HTMLOptionElement } within the {@link HTMLSelectElement} "toProcess" in order to place the
   * {@link HTMLOptionElement }s that're specified in "Favorites" are placed on top of the others in the order they're
   * specified.
   * After the Favorite-{@link HTMLOptionElement}s a dividing {@link HTMLOptionElement} with it's "innerHTML"-Property set
   * to the value given in "Divider", if available. Otherwise the dividing {@link HTMLOptionElement} will be empty.
   * Clicking on the divider will either result in selecting the {@link HTMLOptionElement} specified in "DividerTarget"
   * or in selecting the previously selected one, if no "DividerTarget" is specified.
   *
   * If an "InitialElement" is specified this one will be selected on loading the form.
   *
   * Config Parameter:
   *  - DividerTarget:  Specifies the {@link HTMLOptionElement} to select when the
   *                    Divider-{@link HTMLOptionElement} is selected.
   *  - InitialElement: Specifies the {@link HTMLOptionElement} that shall be selected when the form is loaded.
   *  - Favorites:      Specifies the {@link HTMLOptionElement}s that shall be shown before all other ones.
   *  - Divider:        Specifies the divider's text-content.
   *
   * Style:
   *  - .---CodBi.--HTML_Select_Favorites.--Divider:  Style the divider.
   *  - .---CodBi.--HTML_Select_Favorites.--Favorite: Style the favorites.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "dividertarget")
    @INSTANCE.PRE(Array<string>, "favorites")
    @EQ.PRE(0, true, "favorites.length")
    toLoad: { [key: string]: unknown },
    @EQ.PRE("SELECT", false, "tagName")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    let lastSelection: string =
      toLoad.initialelement && typeof toLoad.initialelement === "string"
        ? toLoad.initialelement
        : // biome-ignore lint/style/noNonNullAssertion: Existence of <option> has been assured, any <option> has a value.
          toProcess.querySelector("option")!.getAttribute("value")!;
    // #region On selection change
    toProcess.addEventListener("change", () => {
      if ($(toProcess).val() === "Divider") {
        // Set to "DividerTarget" if available.
        if (toLoad.dividertarget && typeof toLoad.dividertarget === "string") {
          $(toProcess).val(toLoad.dividertarget);

          lastSelection = toLoad.dividertarget;
        } else {
          $(toProcess).val(lastSelection);
        }
      } else {
        lastSelection = $(toProcess).val() as string;
      }
    });
    // #endregion On selection change
    // #region Insert Divider
    toProcess.innerHTML = `
          <option value = "Divider"
                  class = "---CodBi --HTML_Select_Favorites --Divider">
                  ${toLoad.divider && typeof toLoad.divider === "string" ? toLoad.divider : ""}</option>
                  ${toProcess.innerHTML}`;
    // #endregion Insert Divider
    // #region Place favorites on top.
    const divider = toProcess.querySelector(".---CodBi.--HTML_Select_Favorites.--Divider");

    for (const favorite of toLoad.favorites as Array<string>) {
      for (const candidate of toProcess.querySelectorAll("option")) {
        if (candidate.innerHTML === favorite) {
          candidate.classList.add("---CodBi", "--HTML_Select_Favorites", "--Favorite");
          candidate.remove();
          toProcess.insertBefore(candidate, divider);
        }
      }
    }
    // #endregion Place favorites on top.
    if (toLoad.initialelement && typeof toLoad.initialelement === "string") {
      $(toProcess).val(toLoad.initialelement);
    }
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Select_Favorites } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Select.Favorites", HTML_Select_Favorites.functionality);
  })();
  // #endregion Initialization
}
