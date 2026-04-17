// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
// #region CodBi
// #region Elementplaceholder
import { OpenPLZ_Streets } from "../EPs/openplz.streets";
import { OpenPLZ_Localities } from "../EPs/openplz.localities";
import { removeDuplicates } from "./ldap.autocomplete";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion Elementplaceholder
// #endregion CodBi
// #endregion Imports
/**
 * Provides the {@link OpenPLZ_Autocomplete.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
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
   * Registers the "OpenPLZ.Autocomplete"-Functionality.
   *
   * This functionality takes advantage of the {@link OpenPLZ_Streets} and {@link OpenPLZ_Localities } Elementplaceholder to
   * complete what is typed into the tagged {@link HTMLInputElement } with data the public [OpenPLZ API ](https://www.openplzapi.org/)
   * provides.
   * It suggests completions as soon as there are multiple matches and only allows entries that match exactly one OpenPLZ-Entry.
   *
   * Config Parameter:
   *  - Country:            The optional **country** to retrieve the data of (if not provided either the country specified in
   *                        the CodBi's Configuration **OpenPLZ_Country** will be used or, if not specified, "de").
   *  - TargetData:         What type of data shall be received by the target (Localities, PostalCode or Streets ).
   *  - DependentPLZ        The CSS-Selector of the field that restricts the search of streets by it's value resembling a
   *                        postal-code, only if **DependentLocality** is **undefined**.
   *  - DependentLocality   The CSS-Selector of the field that restricts the search of streets by it's value resembling a
   *                        locality (overwrites **DependentPLZ**).
   *  - FocusOnAutocomplete The CSS-Selector of the field to focus when an autocomplete has occurred.
   *  - MsgNotKnown:        The message to show when trying to set a value that can't be found in OpenPLZ.
   *  - CSSProposals:       The CSS-Style for the proposals-Select-Element appearing when there are multiple matches.
   *  - AllowEmpty:         If set to **"true"** an empty input value won't trigger an error message. */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("targetdata :: focusonautocomplete")
    @TYPE.PRE(
      "string",
      "targetdata :: country :: cssproposals :: msgnotknown :: dependent :: dependentplz :: dependentlocality :: focusonautocomplete :: allowempty",
    )
    @REGEX.PRE(/(de|en|at|li|ch)/i, "country")
    @REGEX.PRE(/^(localities|postalcode|streets)$/i, "targetdata")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "dependentplz")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "dependentlocality")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "focusonautocomplete")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")
    @EQ.PRE("text", false, "type", 'Isn\'t the tagged <input type = "text"/> ?')
    toProcess: Element,
  ): void {
    const targetResultProperty =
      toLoad.targetdata.toLowerCase() === "localities" || toLoad.targetdata.toLowerCase() === "streets"
        ? "name"
        : "postalCode";
    // #region Remove entries that're not in LDAP.
    let userHasTyped = false;
    toProcess.addEventListener(
      "input",
      () => {
        userHasTyped = true;
      },
      { capture: true },
    );
    toProcess.addEventListener("blur", async (event) => {
      const $ = getJQuery();

      if ((toProcess as HTMLInputElement).value.trim() === "") {
        if (userHasTyped) {
          userHasTyped = false;
        }
        $(toProcess).error("");

        return;
      }

      if (!userHasTyped || proposals.parentElement) {
        return;
      }
      userHasTyped = false;

      let result: Array<unknown>;

      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            `°${(toProcess as HTMLInputElement).value}$`,
            "",
            1,
          ])) as Array<unknown>;

          break;
        case "postalcodes":
          result = (await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `°${(toProcess as HTMLInputElement).value}$`,
            1,
          ])) as Array<unknown>;

          break;

        case "streets":
          result = removeDuplicates(
            (await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `°${(toProcess as HTMLInputElement).value}$`,
              toLoad.dependentplz === undefined ||
              (toLoad.dependentlocality &&
                INSTANCE.tsCheck<HTMLInputElement>(
                  toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality),
                  HTMLInputElement,
                  'Is the DependentLocality not pointing to a <input type = "text">?',
                ) &&
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(
                    toLoad.dependentlocality,
                  ) as HTMLInputElement
                ).value !== "") ||
              (INSTANCE.tsCheck<HTMLInputElement>(
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz),
                HTMLInputElement,
                'Is the DependentPLZ not pointing to a <input type = "text">?',
              ) &&
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
          removeProposals();
        }

        $(toProcess).error("");
      }
    });
    // #endregion Remove entries that're not in LDAP.
    let blocked = false;
    // #region Create Selection.
    const proposals = document.createElement("select");
    const removeProposals = () => {
      try {
        proposals.parentElement?.removeChild(proposals);
      } catch {
        /* blur/change race */
      }
    };

    proposals.addEventListener("blur", (event) => {
      if (document.activeElement !== toProcess) {
        removeProposals();
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
    const proposalResults = new Map<string, unknown>();
    proposals.addEventListener("change", () => {
      const val = (proposals as HTMLSelectElement).value;
      if (!val) {
        return;
      }
      const match = proposalResults.get(val);
      (toProcess as HTMLInputElement).value = val;
      removeProposals();
      userHasTyped = false;
      getJQuery()(toProcess).error("");

      if (!match) {
        return;
      }
      matchedValue = val;

      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if ((toProcess as any).codbiOpenPLZSetMatchListeners) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        for (const listener of (toProcess as any).codbiOpenPLZSetMatchListeners) {
          listener([match], toProcess);
        }
      }

      const tcTargetData = toLoad.targetdata.toLowerCase();
      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);

      if (tcTargetData !== "streets" && dependent) {
        (dependent as HTMLInputElement).value =
          tcTargetData === "localities"
            ? (match as { postalCode: string }).postalCode
            : (match as { name: string }).name;
        getJQuery()(dependent).error("");
      }

      blocked = true;
      const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
        toLoad.focusonautocomplete,
      ) as HTMLElement;

      setTimeout(() => {
        blocked = false;
        if (toLoad.focusonautocomplete && toFocus) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = false;
        }
      }, 1000);

      if (toFocus && toLoad.focusonautocomplete) {
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;
        (toFocus as HTMLInputElement).readOnly = true;
        toFocus.focus();
        toFocus.animate(OpenPLZ_Autocomplete.kfFocusOnAutocomplete, OpenPLZ_Autocomplete.tmgFocusOnAutocomplete).play();
        setTimeout(() => {
          (toFocus as HTMLInputElement).readOnly = false;
        }, 150);
      }
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
    // #region Block on keyup (desktop keyboards).
    toProcess.addEventListener("keyup", (event) => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (blocked || (toProcess as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
    // #endregion Block on keyup (desktop keyboards).
    // #region OpenPLZ query on input (cross-platform: fires on desktop and Android soft-keyboards).
    let matchedValue = "";
    toProcess.addEventListener("input", async () => {
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      if (blocked || (toProcess as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        (toProcess as HTMLInputElement).value = matchedValue;

        return;
      }

      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);

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
        matchedValue = result[0][targetResultProperty] as string;
        // #region Set dependent, if available.
        const tcTargetData = toLoad.targetdata.toLowerCase();

        if (tcTargetData !== "streets") {
          if (dependent) {
            (dependent as HTMLInputElement).value =
              tcTargetData === "localities"
                ? (result[0] as { postalCode: string }).postalCode
                : (result[0] as { name: string }).name;
            getJQuery()(dependent).error("");
          }
        }
        // #endregion Set dependent, if available.
        // #region Block input on match.
        blocked = true;
        // #region Remove proposals.
        removeProposals();
        // #endregion Remove proposals.
        const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
          toLoad.focusonautocomplete,
        ) as HTMLElement;

        setTimeout(() => {
          blocked = false;

          if (toLoad.focusonautocomplete && toFocus) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = false;
          }
        }, 1000);
        // #endregion Block input on match.
        // #region Focus the field after autocomplete, if specified.
        if (toFocus && toLoad.focusonautocomplete) {
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          (toFocus as any).CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;

          removeProposals();
          (toFocus as HTMLInputElement).readOnly = true;
          toFocus.focus();
          // Best-effort keyboard show for mobile (post-await, user activation expired).
          // biome-ignore lint/suspicious/noExplicitAny: VirtualKeyboard API not in all TS libs.
          (navigator as any).virtualKeyboard?.show();
          toFocus
            .animate(OpenPLZ_Autocomplete.kfFocusOnAutocomplete, OpenPLZ_Autocomplete.tmgFocusOnAutocomplete)
            .play();
          setTimeout(() => {
            (toFocus as HTMLInputElement).readOnly = false;
          }, 150);
        }
        // #endregion Focus the field after autocomplete, if specified.
      }
      // #region Show proposals.
      if (result.length > 1) {
        proposals.innerHTML = "";
        proposalResults.clear();
        const prompt = new Option("▼", "");
        prompt.disabled = true;
        prompt.selected = true;
        prompt.hidden = true;
        proposals.options.add(prompt);

        for (const element of result) {
          proposals.options.add(new Option(element[targetResultProperty], element[targetResultProperty]));
          proposalResults.set(element[targetResultProperty] as string, element);
        }

        toProcess.parentElement.appendChild(proposals);
      }
      // #endregion Show proposals.
    });
    // #endregion OpenPLZ query on input.
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

window.codbi.registerFunctionality(
  "OpenPLZ.Autocomplete",
  OpenPLZ_Autocomplete.functionality.bind(OpenPLZ_Autocomplete),
); // Initialization
