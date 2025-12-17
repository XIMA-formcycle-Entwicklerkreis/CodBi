// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #region Elementplaceholder
import { OpenPLZ_Streets } from "../EPs/openplz.streets";
import { OpenPLZ_Localities } from "../EPs/openplz.localities";
import { removeDuplicates } from "./ldap.autocomplete";
// #endregion Elementplaceholder
// #endregion Imports
/**
 * Provides the {@link OpenPLZ_Autocomplete.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class OpenPLZ_Autocomplete {
  /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
   *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
  protected static kfFocusOnAutocomplete: Keyframe[] = [
    {
      transform: "scale(1)",
    },
    {
      transform: "scale(1.5)",
      boxShadow: "0 0 10em darkorange",
      borderColor: "darkorange",
    },

    {
      transform: "scale(1)",
      boxShadow: "0 0 0em darkorange",
      borderColor: "unset",
    },
  ];
  /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
   *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
  protected static tmgFocusOnAutocomplete: KeyframeAnimationOptions = {
    duration: 500,
    iterations: 1,
    easing: "ease-out",
    fill: "forwards",
  };
  /**
   * Registers the "LDAP.Autocomplete"-Functionality.
   *
   * This functionalities takes advantage of the {@link LDAP_Find} Elementplaceholder to complete what is typed into
   * the tagged {@link HTMLInputElement } with data from a connected Formcycle predefined LDAP-Query according
   * to the {@link LDAP_Find } specifications.
   * It suggests completions as soon as there are multiple matches and only allows entries that match exactly one
   * LDAP-Entry.
   *
   * Config Parameter:
   *  - Country:            The optional **country** to retrieve the data of (if not provided either the country specified in
   *                        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
   *  - TargetData:         What type of data shall be received by the target (Localities, PostalCode or Streets ).
   *  - Dependent:          The CSS-Selector of the field that automatically will be filled accordingly if either a
   *                        postal-code or a locality has been found.
   *  - DependentPLZ        The CSS-Selector of the field that restricts the search of streets by it's value resembling a
   *                        postal-code, only if **DependentLocality** is **undefined**.
   *  - DependentLocality   The CSS-Selector of the field that restricts the search of streets by it's value resembling a
   *                        locality (overwrites **DependentPLZ**).
   *  - FocusOnAutocomplete The CSS-Selector of the field to focus when an autocomplete has occured.
   *  - MsgNotKnown:        The message to show when trying to set a value that can't be found in OpenPLZ.
   *  - CSSProposals:       The CSS-Style for the proposals-Select-Element appearing when there are multiple matches. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: string }, toProcess: Element): void {
    const targetResultProperty =
      toLoad.targetdata.toLowerCase() === "localities" || toLoad.targetdata.toLowerCase() === "streets"
        ? "name"
        : "postalCode";
    // #region Remove entries that're not in LDAP.
    toProcess.addEventListener("blur", async (event) => {
      const $ = getJQuery();

      let result: Array<unknown>;

      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            `°${(toProcess as HTMLInputElement).value}`,
            "",
            1,
          ])) as Array<unknown>;

          break;
        case "postalcodes":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `°${(toProcess as HTMLInputElement).value}`,
            1,
          ])) as Array<unknown>;

          break;

        case "streets":
          result = removeDuplicates(
            (await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}`,
              toLoad.dependentplz === undefined ||
              (toLoad.dependentlocality &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentlocality,
                  ) as HTMLInputElement
                ).value !== "") ||
              (toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentplz,
                  ) as HTMLInputElement
                ).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `°${(toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) as HTMLInputElement).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              (
                toProcess.parentElement.parentElement.parentElement.querySelector(
                  toLoad.dependentlocality,
                ) as HTMLInputElement
              ).value !== ""
                ? `°${
                    (
                      toProcess.parentElement.parentElement.parentElement.querySelector(
                        toLoad.dependentlocality,
                      ) as HTMLInputElement
                    ).value
                  }`
                : "",
              1,
            ])) as Array<unknown>,
            "name",
          );

          break;
      }

      if (result.length === 0) {
        $(toProcess).error(toLoad.msgnotknown ? toLoad.msgnotknown : `Only known ${toLoad.targetdata} are permitted.`);
      } else {
        if (document.activeElement !== proposals) {
          proposals.remove();
        }

        $(toProcess).error("");
      }
    });
    // #endregion Remove entries that're not in LDAP.
    let blocked = false;
    // #region Create Selection.
    const proposals = document.createElement("select");

    proposals.addEventListener("blur", (event) => {
      if (document.activeElement !== toProcess) {
        proposals.remove();
      }
    });

    proposals.classList.add("---CodBi", "--OpenPLZ_Autocomplete", `--${toLoad.targetdata}`, "-Proposals");
    proposals.setAttribute(
      "style",
      toLoad.cssproposals
        ? toLoad.cssproposals
        : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;",
    );
    // #region Handle Selection.
    const onSelected = async () => {
      (toProcess as HTMLInputElement).value = (proposals as HTMLSelectElement).value;

      let result: Array<unknown>;

      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = removeDuplicates(
            (await OpenPLZ_Localities.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}`,
              "",
              1,
            ])) as Array<unknown>,
            "name",
          );

          break;
        case "postalcodes":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `°${(toProcess as HTMLInputElement).value}`,
            1,
          ])) as Array<unknown>;

          break;

        case "streets":
          result = removeDuplicates(
            (await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}`,
              toLoad.dependentplz === undefined ||
              (toLoad.dependentlocality &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentlocality,
                  ) as HTMLInputElement
                ).value !== "") ||
              (toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentplz,
                  ) as HTMLInputElement
                ).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `°${(toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) as HTMLInputElement).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              (
                toProcess.parentElement.parentElement.parentElement.querySelector(
                  toLoad.dependentlocality,
                ) as HTMLInputElement
              ).value !== ""
                ? `°${
                    (
                      toProcess.parentElement.parentElement.parentElement.querySelector(
                        toLoad.dependentlocality,
                      ) as HTMLInputElement
                    ).value
                  }`
                : "",
              1,
            ])) as Array<unknown>,
            "name",
          );

          break;
      }

      if (result.length === 0) {
        return;
      }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if ((toProcess as any).codbiOpenPLZSetMatchListeners) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        for (const listener of (toProcess as any).codbiOpenPLZSetMatchListeners) {
          listener(result, toProcess);
        }
      }
      // #region Set dependent, if available.
      const tcTargetData = toLoad.targetdata.toLowerCase();
      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);

      if (tcTargetData !== "streets") {
        if (dependent) {
          (dependent as HTMLInputElement).value =
            tcTargetData === "localities"
              ? (result[0] as { postalCode: string }).postalCode
              : (result[0] as { name: string }).name;
        }
      }
      // #endregion Set dependent, if available.
      // #region Focus the field after autocomplete, if specified.
      const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
        toLoad.focusonautocomplete,
      ) as HTMLElement;

      if (toFocus && toLoad.focusonautocomplete) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;

        proposals.remove();
        toFocus.focus();
        toFocus.animate(OpenPLZ_Autocomplete.kfFocusOnAutocomplete, OpenPLZ_Autocomplete.tmgFocusOnAutocomplete).play();
      }
      // #endregion Focus the field after autocomplete, if specified.
    };

    proposals.addEventListener("change", async (event) => {
      onSelected();
    });

    toProcess.addEventListener("keydown", (event) => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (blocked || (toProcess as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
    // #endregion Handle Selection.
    // #endregion Create Selection.
    toProcess.addEventListener("keyup", async (event) => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (blocked || (toProcess as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();

        return;
      }

      const key = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent).key;
      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);

      if (key.length !== 1 && key !== "Backspace" && key !== "Delete") {
        return;
      }

      if (key === "Enter" || key === "Space") {
        onSelected();
      }

      let result: Array<unknown>;

      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = removeDuplicates(
            (await OpenPLZ_Localities.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}`,
              "",
              1,
            ])) as Array<unknown>,
            "name",
          );

          break;
        case "postalcodes":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `°${(toProcess as HTMLInputElement).value}`,
            1,
          ])) as Array<unknown>;

          break;

        case "streets":
          result = removeDuplicates(
            (await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}`,
              toLoad.dependentplz === undefined ||
              (toLoad.dependentlocality &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentlocality,
                  ) as HTMLInputElement
                ).value !== "") ||
              (toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentplz,
                  ) as HTMLInputElement
                ).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `°${(toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) as HTMLInputElement).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              (
                toProcess.parentElement.parentElement.parentElement.querySelector(
                  toLoad.dependentlocality,
                ) as HTMLInputElement
              ).value !== ""
                ? `°${
                    (
                      toProcess.parentElement.parentElement.parentElement.querySelector(
                        toLoad.dependentlocality,
                      ) as HTMLInputElement
                    ).value
                  }`
                : "",
              1,
            ])) as Array<unknown>,
            "name",
          );

          break;
      }
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (result.length === 0 || (result[0] as any).result) {
        return;
      }

      if (result.length === 1) {
        // #region If the request returned an error.
        if ((result[0] as { error: string }).error) {
          return;
        }
        // #endregion If the request returned an error.
        (toProcess as HTMLInputElement).value = result[0][targetResultProperty];
        // #region Set dependent, if available.
        const tcTargetData = toLoad.targetdata.toLowerCase();

        if (tcTargetData !== "streets") {
          if (dependent) {
            (dependent as HTMLInputElement).value =
              tcTargetData === "localities"
                ? (result[0] as { postalCode: string }).postalCode
                : (result[0] as { name: string }).name;
          }
        }
        // #endregion Set dependent, if available.
        // #region Block input on match.
        blocked = true;
        // #region Remove proposals.
        proposals.remove();
        // #endregion Remove proposals.
        const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
          toLoad.focusonautocomplete,
        ) as HTMLElement;

        setTimeout(() => {
          blocked = false;

          if (toLoad.focusonautocomplete) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = false;
          }
        }, 1000);
        // #endregion Block input on match.
        // #region Focus the field after autocomplete, if specified.
        if (toFocus && toLoad.focusonautocomplete) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;

          proposals.remove();
          toFocus.focus();
          toFocus
            .animate(OpenPLZ_Autocomplete.kfFocusOnAutocomplete, OpenPLZ_Autocomplete.tmgFocusOnAutocomplete)
            .play();
        }
        // #endregion Focus the field after autocomplete, if specified.
      }
      // #region Show proposals.
      if (result.length > 1) {
        proposals.innerHTML = "";

        for (const element of result) {
          proposals.options.add(new Option(element[targetResultProperty], element[targetResultProperty]));
        }

        toProcess.parentElement.appendChild(proposals);
      }
      // #endregion Show proposals.
    });
  }
  // #region Initialization
  /**
   * States whether this {@link OpenPLZ_Autocomplete } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("OpenPLZ.Autocomplete", OpenPLZ_Autocomplete.functionality);
  })();
  // #endregion Initialization
}
