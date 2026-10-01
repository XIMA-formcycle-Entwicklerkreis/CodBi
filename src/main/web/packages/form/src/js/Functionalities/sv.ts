// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * Provides the {@link SV.functionality }.
 *
 * This functionality reads the values of the URL-parameters named in "Sources" and assigns them to the
 * global variables named in "Destinations" (paired by index). The global variable is addressed the same
 * way the **V** Element-Placeholder addresses it, i.e. by the {@link Element } tagged with a
 * matching `data-name` whose `value` attribute is set (for form controls the {@link HTMLInputElement.value }
 * is assigned and an `input` event is dispatched so the form reacts).
 *
 * @remarks
 * Maintainer: Salvatore Callari (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class SV {
  /**
   * This functionality sets the global variables named in "Destinations" to the values of the
   * URL-parameters named in "Sources".
   *
   * Config Parameter:
   *  - Destinations: The name(s) of the global variable(s) to set (a single {@link string } or an
   *                  {@link Array } of {@link string }s).
   *  - Sources:      The name(s) of the URL-parameter(s) to read (a single {@link string } or an
   *                  {@link Array } of {@link string }s). Both parameters must contain the same amount
   *                  of entries; the "i"-th destination is set to the value of the "i"-th source.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws A {@link CodBiError } if "Destinations" and "Sources" don't contain the same amount of entries. */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("destinations")
    @DEFINED.PRE("sources")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): undefined {
    const destinations: Array<string> = Array.isArray(toLoad.destinations)
      ? (toLoad.destinations as Array<string>)
      : [toLoad.destinations as string];
    const sources: Array<string> = Array.isArray(toLoad.sources)
      ? (toLoad.sources as Array<string>)
      : [toLoad.sources as string];

    window.codbi.log(
      "INFO",
      `SV called. Destinations: ${JSON.stringify(destinations)} | Sources: ${JSON.stringify(sources)} | URL: "${window.location.search}"`,
      "SV / SET GLOBAL",
    );

    if (destinations.length !== sources.length) {
      window.codbi.log(
        "ERROR",
        `Destinations (${destinations.length}) and Sources (${sources.length}) have different lengths.`,
        "SV / SET GLOBAL",
      );
      throw new CodBiError(
        `[SV] The parameters "Destinations" (${destinations.length}) and "Sources" (${sources.length}) must contain the same amount of entries.`,
      );
    }

    const urlParameters = new URLSearchParams(window.location.search);

    // Formcycle only forwards global variables that are declared in the form (persisted `variables`
    // list); those are the ones rendered as hidden `input.XVariable` elements inside the `<form>`.
    // Scope the lookup to the nearest form so we only match declared variables belonging to this
    // form, falling back to the whole document.
    const container = toProcess.closest("form") ?? document.body;

    for (let index = 0; index < destinations.length; index++) {
      const destinationName = destinations[index].trim();
      const sourceName = sources[index].trim();
      const rawValue = urlParameters.get(sourceName);
      const value = rawValue ?? "";

      if (rawValue === null) {
        window.codbi.log(
          "WARNING",
          `URL-parameter "${sourceName}" not present in URL "${window.location.search}" — assigning empty string.`,
          "SV / SET GLOBAL",
        );
      }

      SV.setGlobalVariable(destinationName, value, sourceName, container);
    }
  }

  /**
   * Assigns the specified value to the global variable addressed by the given name. The global variable
   * is addressed by the {@link Element } tagged with a matching `data-name`; for form controls both the
   * control's {@link HTMLInputElement.value } and its `value` attribute are set and an `input` event is
   * dispatched so the form reacts to the change. Other elements only get their `value` attribute set
   * (mirroring how the **V** Element-Placeholder reads them).
   *
   * Formcycle registers global variables **server-side** from the form's persisted `variables` list
   * (it renders exactly one hidden `input.XVariable` per declared entry and the workflow only
   * receives values for those declared variables). A variable created purely in the DOM at runtime is
   * therefore **never** visible to the workflow. Consequently, if no {@link Element } with a matching
   * `data-name` exists (i.e. the variable was not defined in the form designer), this method does NOT
   * create one — it logs an explicit {@code ERROR} so the form author knows the destination must be
   * declared as a global variable in the designer for the workflow to receive it.
   *
   * @param variableName The name of the global variable to set.
   * @param value        The value to assign to the global variable.
   * @param sourceName   The name of the URL-parameter that provided the value (for logging).
   * @param container    The {@link HTMLElement } to scope the declared-variable lookup to ({@link HTMLFormElement }
   *                     when available, otherwise the document body). */
  private static setGlobalVariable(
    variableName: string,
    value: string,
    sourceName: string,
    container: HTMLElement,
  ): void {
    const selector = `[ data-name = "${variableName}"]`;
    const target = container.querySelector(selector) ?? document.querySelector(selector);

    if (!target) {
      window.codbi.log(
        "ERROR",
        `Global variable "${variableName}" is not defined anywhere in the form, so the workflow will never receive
it. Create it in the form designer (as a global variable / Formularvariable) first, then this functionality can
assign the value from URL-parameter "${sourceName}" to it.`,
        "SV / UNDEFINED GLOBAL",
      );
      return;
    }

    const control = target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    if (
      control instanceof HTMLInputElement ||
      control instanceof HTMLTextAreaElement ||
      control instanceof HTMLSelectElement
    ) {
      control.value = value;
      control.setAttribute("value", value);
      control.dispatchEvent(new Event("input", { bubbles: true }));
      control.dispatchEvent(new Event("change", { bubbles: true }));
      window.codbi.log(
        "INFO",
        `Set "${variableName}" (a ${target.tagName}) to "${value}" from URL-parameter "${sourceName}".`,
        "SV / SET GLOBAL",
      );
      return;
    }

    target.setAttribute("value", value);
    window.codbi.log(
      "INFO",
      `Set "value" attribute of element with data-name="${variableName}" to "${value}" from URL-parameter "${sourceName}".`,
      "SV / SET GLOBAL",
    );
  }
}

window.codbi.registerFunctionality("SV", SV.functionality.bind(SV)); // Initialization
