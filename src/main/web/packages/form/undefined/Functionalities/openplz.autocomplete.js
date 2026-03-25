import { removeDuplicates } from "./chunk-HBJWSWLB.js";
import { AE } from "./chunk-XOYTHML7.js";
import { GREATER } from "./chunk-S6DBGVOR.js";
import { OR } from "./chunk-YYG42PYR.js";
import "./chunk-NKLWL4ZS.js";
import { DEFINED } from "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/openplz.autocomplete.ts
var import_fc_form_renderer2 = __toESM(require_dist(), 1);

// src/js/EPs/openplz.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var OpenPLZ = class {
  static retrieve(params) {
    return new Promise((resolve, reject) => {
      (0, import_fc_form_renderer.getJQuery)()
        .ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": params[0] ? params[0] : "",
            "X-OrgaUnit": params[1] ? params[1] : "",
            "X-OfficialKey": params[2] ? params[2] : "",
            "X-Detail": params[3] ? params[3] : "",
            "X-Param1": params[4] ? params[4].replace("=", "-").replace(/ /, "") : "",
            "X-Param2": params[5] ? params[5].replace("=", "-").replace(/ /, "") : "",
            "X-Param3": params[6] ? params[6].replace("=", "-").replace(/ /, "") : "",
            "X-Param4": params[7] ? params[7].replace("=", "-").replace(/ /, "") : "",
            "X-PagesToLoad": params[8] ? params[8].toString() : void 0,
          },
        })
        .done((response) => {
          resolve(JSON.parse(response));
        });
    });
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, GREATER.PRE(1, true, false, "length", "Hasn't at least the Orga-Unit been specified?")),
    __decorateParam(0, AE.PRE(new TYPE("string"), 0)),
    __decorateParam(0, AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)),
    __decorateParam(0, AE.PRE(new TYPE("string"), 2)),
    __decorateParam(0, AE.PRE(new OR([new EQ(""), new REGEX(/^\d+$/)]), 2)),
  ],
  OpenPLZ,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ", OpenPLZ.retrieve.bind(OpenPLZ));

// src/js/EPs/openplz.streets.ts
var OpenPLZ_Streets = class extends OpenPLZ {
  static retrieve(params) {
    return OpenPLZ.retrieve([
      params[0] ? params[0] : "",
      "Streets",
      "",
      "",
      `name-${params[1].replace(/^/, "\xB0")}`,
      params.length >= 4
        ? `locality-${params[3].replace(/^/, "\xB0")}`
        : `postalCode-${params[2].replace(/^/, "\xB0")}`,
      "",
      "",
      params[4] ? params[4] : "",
    ]);
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      0,
      GREATER.PRE(2, true, false, "length", "Hasn't at least the Street and City RegEx been specified?"),
    ),
    __decorateParam(0, AE.PRE(new TYPE("string"), 0, 4)),
    __decorateParam(0, AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)),
  ],
  OpenPLZ_Streets,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Streets", OpenPLZ_Streets.retrieve.bind(OpenPLZ_Streets));

// src/js/EPs/openplz.localities.ts
var OpenPLZ_Localities = class extends OpenPLZ {
  static retrieve(params) {
    return OpenPLZ.retrieve([
      params[0],
      "Localities",
      "",
      "",
      `name-${params[1].replace(/^/, "\xB0")}`,
      params.length >= 3 ? `postalCode-${params[2].replace(/^/, "\xB0")}` : "",
      "",
      "",
      "",
      params[3] ? params[3] : "",
      params[3] ? params[3] : "",
    ]);
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(
      0,
      GREATER.PRE(1, true, false, "length", "Hasn't at least the Locality's or the Postalcode RegEx been specified?"),
    ),
    __decorateParam(0, AE.PRE(new TYPE("string"), 0, 2)),
    __decorateParam(0, AE.PRE(new OR([new EQ(""), new REGEX(/(de|en|at|li|ch)/i)]), 0)),
    __decorateParam(0, AE.PRE(new TYPE("string | number"), 3)),
    __decorateParam(0, AE.PRE(new IF(new TYPE("string"), new REGEX(/^\d+$/)), 3)),
  ],
  OpenPLZ_Localities,
  "retrieve",
  1,
);
window.codbi.registerEP("OpenPLZ.Localities", OpenPLZ_Localities.retrieve.bind(OpenPLZ_Localities));

// src/js/Functionalities/openplz.autocomplete.ts
var _OpenPLZ_Autocomplete = class _OpenPLZ_Autocomplete {
  static {
    /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
     *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
    this.kfFocusOnAutocomplete = [
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
  }
  static {
    /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
     *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
    this.tmgFocusOnAutocomplete = {
      duration: 500,
      iterations: 1,
      easing: "ease-out",
      fill: "forwards",
    };
  }
  static functionality(toLoad, toProcess) {
    const targetResultProperty =
      toLoad.targetdata.toLowerCase() === "localities" || toLoad.targetdata.toLowerCase() === "streets"
        ? "name"
        : "postalCode";
    toProcess.addEventListener("blur", async (event) => {
      const $ = (0, import_fc_form_renderer2.getJQuery)();
      let result;
      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            `\xB0${toProcess.value}`,
            "",
            1,
          ]);
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1,
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 ||
              (toLoad.dependentlocality &&
                INSTANCE.tsCheck(
                  toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality),
                  HTMLInputElement,
                  'Is the DependentLocality not pointing to a <input type = "text">?',
                ) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !==
                  "") ||
              (INSTANCE.tsCheck(
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz),
                HTMLInputElement,
                'Is the DependentPLZ not pointing to a <input type = "text">?',
              ) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !== ""
                ? `\xB0${
                    toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value
                  }`
                : "",
              1,
            ]),
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
    let blocked = false;
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
    const onSelected = async () => {
      toProcess.value = proposals.value;
      let result;
      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = removeDuplicates(
            await OpenPLZ_Localities.retrieve([toLoad.country ? toLoad.country : "", `\xB0${toProcess.value}`, "", 1]),
            "name",
          );
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1,
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 ||
              (toLoad.dependentlocality &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !==
                  "") ||
              (toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !== ""
                ? `\xB0${
                    toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value
                  }`
                : "",
              1,
            ]),
            "name",
          );
          break;
      }
      if (result.length === 0) {
        return;
      }
      if (toProcess.codbiOpenPLZSetMatchListeners) {
        for (const listener of toProcess.codbiOpenPLZSetMatchListeners) {
          listener(result, toProcess);
        }
      }
      const tcTargetData = toLoad.targetdata.toLowerCase();
      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);
      if (tcTargetData !== "streets") {
        if (dependent) {
          dependent.value = tcTargetData === "localities" ? result[0].postalCode : result[0].name;
        }
      }
      const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.focusonautocomplete);
      if (toFocus && toLoad.focusonautocomplete) {
        toFocus.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;
        proposals.remove();
        toFocus.focus();
        toFocus
          .animate(_OpenPLZ_Autocomplete.kfFocusOnAutocomplete, _OpenPLZ_Autocomplete.tmgFocusOnAutocomplete)
          .play();
      }
    };
    proposals.addEventListener("change", async (event) => {
      onSelected();
    });
    toProcess.addEventListener("keydown", (event) => {
      if (blocked || toProcess.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    });
    toProcess.addEventListener("keyup", async (event) => {
      if (blocked || toProcess.CodBi_OpenPLZ_Autocomplete_BlockedByDependent) {
        event.stopPropagation();
        event.preventDefault();
        event.stopImmediatePropagation();
        return;
      }
      const key = INSTANCE.tsCheck(event, KeyboardEvent).key;
      const dependent = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependent);
      if (key.length !== 1 && key !== "Backspace" && key !== "Delete") {
        return;
      }
      if (key === "Enter" || key === "Space") {
        onSelected();
      }
      let result;
      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = removeDuplicates(
            await OpenPLZ_Localities.retrieve([toLoad.country ? toLoad.country : "", `\xB0${toProcess.value}`, "", 1]),
            "name",
          );
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1,
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 ||
              (toLoad.dependentlocality &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !==
                  "") ||
              (toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) &&
                toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value === "")
                ? ""
                : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz)
                  ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}`
                  : "",
              toLoad.dependentlocality &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) &&
              toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value !== ""
                ? `\xB0${
                    toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality).value
                  }`
                : "",
              1,
            ]),
            "name",
          );
          break;
      }
      if (result.length === 0 || result[0].result) {
        return;
      }
      if (result.length === 1) {
        if (result[0].error) {
          return;
        }
        toProcess.value = result[0][targetResultProperty];
        const tcTargetData = toLoad.targetdata.toLowerCase();
        if (tcTargetData !== "streets") {
          if (dependent) {
            dependent.value = tcTargetData === "localities" ? result[0].postalCode : result[0].name;
          }
        }
        blocked = true;
        proposals.remove();
        const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.focusonautocomplete);
        setTimeout(() => {
          blocked = false;
          if (toLoad.focusonautocomplete) {
            toFocus.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = false;
          }
        }, 1e3);
        if (toFocus && toLoad.focusonautocomplete) {
          toFocus.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;
          proposals.remove();
          toFocus.focus();
          toFocus
            .animate(_OpenPLZ_Autocomplete.kfFocusOnAutocomplete, _OpenPLZ_Autocomplete.tmgFocusOnAutocomplete)
            .play();
        }
      }
      if (result.length > 1) {
        proposals.innerHTML = "";
        for (const element of result) {
          proposals.options.add(new Option(element[targetResultProperty], element[targetResultProperty]));
        }
        toProcess.parentElement.appendChild(proposals);
      }
    });
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ_Autocomplete } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("OpenPLZ.Autocomplete", _OpenPLZ_Autocomplete.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, DEFINED.PRE("targetdata :: focusonautocomplete")),
    __decorateParam(
      0,
      TYPE.PRE(
        "string",
        "targetdata :: country :: cssproposals :: msgnotknown :: dependent :: dependentplz :: dependentlocality :: focusonautocomplete",
      ),
    ),
    __decorateParam(0, REGEX.PRE(/(de|en|at|li|ch)/i, "country")),
    __decorateParam(0, REGEX.PRE(/^(localities|postalcode|streets)$/i, "targetdata")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "dependentplz")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "dependentlocality")),
    __decorateParam(0, REGEX.PRE(REGEX.stdExp.cssSelector, "focusonautocomplete")),
    __decorateParam(1, INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")),
    __decorateParam(1, EQ.PRE("text", false, "type", `Isn't the tagged <input type = "text"/> ?`)),
  ],
  _OpenPLZ_Autocomplete,
  "functionality",
  1,
);
var OpenPLZ_Autocomplete = _OpenPLZ_Autocomplete;
window.codbi.registerFunctionality(
  "OpenPLZ.Autocomplete",
  OpenPLZ_Autocomplete.functionality.bind(OpenPLZ_Autocomplete),
);
export { OpenPLZ_Autocomplete };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9vcGVucGx6LmF1dG9jb21wbGV0ZS50cyIsICIuLi8uLi9zcmMvanMvRVBzL29wZW5wbHoudHMiLCAiLi4vLi4vc3JjL2pzL0VQcy9vcGVucGx6LnN0cmVldHMudHMiLCAiLi4vLi4vc3JjL2pzL0VQcy9vcGVucGx6LmxvY2FsaXRpZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbi8vICNyZWdpb24gQ29kQmlcbi8vICNyZWdpb24gRWxlbWVudHBsYWNlaG9sZGVyXG5pbXBvcnQgeyBPcGVuUExaX1N0cmVldHMgfSBmcm9tIFwiLi4vRVBzL29wZW5wbHouc3RyZWV0c1wiO1xuaW1wb3J0IHsgT3BlblBMWl9Mb2NhbGl0aWVzIH0gZnJvbSBcIi4uL0VQcy9vcGVucGx6LmxvY2FsaXRpZXNcIjtcbmltcG9ydCB7IHJlbW92ZUR1cGxpY2F0ZXMgfSBmcm9tIFwiLi9sZGFwLmF1dG9jb21wbGV0ZVwiO1xuaW1wb3J0IHsgREVGSU5FRCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvREVGSU5FRFwiO1xuaW1wb3J0IHsgRVEgfSBmcm9tIFwieGRiYy9zcmMvREJDL0VRXCI7XG4vLyAjZW5kcmVnaW9uIEVsZW1lbnRwbGFjZWhvbGRlclxuLy8gI2VuZHJlZ2lvbiBDb2RCaVxuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIFByb3ZpZGVzIHRoZSB7QGxpbmsgT3BlblBMWl9BdXRvY29tcGxldGUuZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIE9wZW5QTFpfQXV0b2NvbXBsZXRlIHtcbiAgLyoqIFN0b3JlIHRoZSB7QGxpbmsgUHJvcGVydHlJbmRleGVkS2V5ZnJhbWVzIH0gdG8gdXNlIHRvIGFuaW1hdGUgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9XG4gICAqICBzcGVjaWZpZWQgYnkgdGhlICoqRm9jdXNPbkF1dG9jb21wbGV0ZSoqLUNvZEJpLVBhcmFtZXRlci4gKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBrZkZvY3VzT25BdXRvY29tcGxldGU6IEtleWZyYW1lW10gPSBbXG4gICAge1xuICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsXG4gICAgfSxcbiAgICB7XG4gICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMS41KVwiLFxuICAgICAgYm94U2hhZG93OiBcIjAgMCAxMGVtIGRhcmtvcmFuZ2VcIixcbiAgICAgIGJvcmRlckNvbG9yOiBcImRhcmtvcmFuZ2VcIixcbiAgICB9LFxuXG4gICAge1xuICAgICAgdHJhbnNmb3JtOiBcInNjYWxlKDEpXCIsXG4gICAgICBib3hTaGFkb3c6IFwiMCAwIDBlbSBkYXJrb3JhbmdlXCIsXG4gICAgICBib3JkZXJDb2xvcjogXCJ1bnNldFwiLFxuICAgIH0sXG4gIF07XG4gIC8qKiBTdG9yZSB0aGUge0BsaW5rIFByb3BlcnR5SW5kZXhlZEtleWZyYW1lcyB9IHRvIHVzZSB0byBhbmltYXRlIHRoZSB7QGxpbmsgSFRNTEVsZW1lbnQgfVxuICAgKiAgc3BlY2lmaWVkIGJ5IHRoZSAqKkZvY3VzT25BdXRvY29tcGxldGUqKi1Db2RCaS1QYXJhbWV0ZXIuICovXG4gIHByb3RlY3RlZCBzdGF0aWMgdG1nRm9jdXNPbkF1dG9jb21wbGV0ZTogS2V5ZnJhbWVBbmltYXRpb25PcHRpb25zID0ge1xuICAgIGR1cmF0aW9uOiA1MDAsXG4gICAgaXRlcmF0aW9uczogMSxcbiAgICBlYXNpbmc6IFwiZWFzZS1vdXRcIixcbiAgICBmaWxsOiBcImZvcndhcmRzXCIsXG4gIH07XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiT3BlblBMWi5BdXRvY29tcGxldGVcIi1GdW5jdGlvbmFsaXR5LlxuICAgKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdGllcyB0YWtlcyBhZHZhbnRhZ2Ugb2YgdGhlIHtAbGluayBPcGVuUExaX1N0cmVldHN9IGFuZCB7QGxpbmsgT3BlblBMWl9Mb2NhbGl0aWVzIH0gRWxlbWVudHBsYWNlaG9sZGVyIHRvXG4gICAqIGNvbXBsZXRlIHdoYXQgaXMgdHlwZWQgaW50byB0aGUgdGFnZ2VkIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gd2l0aCBkYXRhIHRoZSBwdWJsaWMgW09wZW5QTFogQVBJIF0oaHR0cHM6Ly93d3cub3BlbnBsemFwaS5vcmcvKVxuICAgKiBwcm92aWRlcy5cbiAgICogSXQgc3VnZ2VzdHMgY29tcGxldGlvbnMgYXMgc29vbiBhcyB0aGVyZSBhcmUgbXVsdGlwbGUgbWF0Y2hlcyBhbmQgb25seSBhbGxvd3MgZW50cmllcyB0aGF0IG1hdGNoIGV4YWN0bHkgb25lIE9wZW5QTFotRW50cnkuXG4gICAqXG4gICAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIENvdW50cnk6ICAgICAgICAgICAgVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gICAqICAtIFRhcmdldERhdGE6ICAgICAgICAgV2hhdCB0eXBlIG9mIGRhdGEgc2hhbGwgYmUgcmVjZWl2ZWQgYnkgdGhlIHRhcmdldCAoTG9jYWxpdGllcywgUG9zdGFsQ29kZSBvciBTdHJlZXRzICkuXG4gICAqICAtIERlcGVuZGVudFBMWiAgICAgICAgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUgZmllbGQgdGhhdCByZXN0cmljdHMgdGhlIHNlYXJjaCBvZiBzdHJlZXRzIGJ5IGl0J3MgdmFsdWUgcmVzZW1ibGluZyBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgcG9zdGFsLWNvZGUsIG9ubHkgaWYgKipEZXBlbmRlbnRMb2NhbGl0eSoqIGlzICoqdW5kZWZpbmVkKiouXG4gICAqICAtIERlcGVuZGVudExvY2FsaXR5ICAgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUgZmllbGQgdGhhdCByZXN0cmljdHMgdGhlIHNlYXJjaCBvZiBzdHJlZXRzIGJ5IGl0J3MgdmFsdWUgcmVzZW1ibGluZyBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxpdHkgKG92ZXJ3cml0ZXMgKipEZXBlbmRlbnRQTFoqKikuXG4gICAqICAtIEZvY3VzT25BdXRvY29tcGxldGUgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUgZmllbGQgdG8gZm9jdXMgd2hlbiBhbiBhdXRvY29tcGxldGUgaGFzIG9jY3VycmVkLlxuICAgKiAgLSBNc2dOb3RLbm93bjogICAgICAgIFRoZSBtZXNzYWdlIHRvIHNob3cgd2hlbiB0cnlpbmcgdG8gc2V0IGEgdmFsdWUgdGhhdCBjYW4ndCBiZSBmb3VuZCBpbiBPcGVuUExaLlxuICAgKiAgLSBDU1NQcm9wb3NhbHM6ICAgICAgIFRoZSBDU1MtU3R5bGUgZm9yIHRoZSBwcm9wb3NhbHMtU2VsZWN0LUVsZW1lbnQgYXBwZWFyaW5nIHdoZW4gdGhlcmUgYXJlIG11bHRpcGxlIG1hdGNoZXMuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eShcbiAgICBAREVGSU5FRC5QUkUoXCJ0YXJnZXRkYXRhIDo6IGZvY3Vzb25hdXRvY29tcGxldGVcIilcbiAgICBAVFlQRS5QUkUoXG4gICAgICBcInN0cmluZ1wiLFxuICAgICAgXCJ0YXJnZXRkYXRhIDo6IGNvdW50cnkgOjogY3NzcHJvcG9zYWxzIDo6IG1zZ25vdGtub3duIDo6IGRlcGVuZGVudCA6OiBkZXBlbmRlbnRwbHogOjogZGVwZW5kZW50bG9jYWxpdHkgOjogZm9jdXNvbmF1dG9jb21wbGV0ZVwiLFxuICAgIClcbiAgICBAUkVHRVguUFJFKC8oZGV8ZW58YXR8bGl8Y2gpL2ksIFwiY291bnRyeVwiKVxuICAgIEBSRUdFWC5QUkUoL14obG9jYWxpdGllc3xwb3N0YWxjb2RlfHN0cmVldHMpJC9pLCBcInRhcmdldGRhdGFcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJkZXBlbmRlbnRwbHpcIilcbiAgICBAUkVHRVguUFJFKFJFR0VYLnN0ZEV4cC5jc3NTZWxlY3RvciwgXCJkZXBlbmRlbnRsb2NhbGl0eVwiKVxuICAgIEBSRUdFWC5QUkUoUkVHRVguc3RkRXhwLmNzc1NlbGVjdG9yLCBcImZvY3Vzb25hdXRvY29tcGxldGVcIilcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKEhUTUxJbnB1dEVsZW1lbnQsIFwiSXMgaXQgbm90IGFuIDxpbnB1dD4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/XCIpXG4gICAgQEVRLlBSRShcInRleHRcIiwgZmFsc2UsIFwidHlwZVwiLCAnSXNuXFwndCB0aGUgdGFnZ2VkIDxpbnB1dCB0eXBlID0gXCJ0ZXh0XCIvPiA/JylcbiAgICB0b1Byb2Nlc3M6IEVsZW1lbnQsXG4gICk6IHZvaWQge1xuICAgIGNvbnN0IHRhcmdldFJlc3VsdFByb3BlcnR5ID1cbiAgICAgIHRvTG9hZC50YXJnZXRkYXRhLnRvTG93ZXJDYXNlKCkgPT09IFwibG9jYWxpdGllc1wiIHx8IHRvTG9hZC50YXJnZXRkYXRhLnRvTG93ZXJDYXNlKCkgPT09IFwic3RyZWV0c1wiXG4gICAgICAgID8gXCJuYW1lXCJcbiAgICAgICAgOiBcInBvc3RhbENvZGVcIjtcbiAgICAvLyAjcmVnaW9uIFJlbW92ZSBlbnRyaWVzIHRoYXQncmUgbm90IGluIExEQVAuXG4gICAgdG9Qcm9jZXNzLmFkZEV2ZW50TGlzdGVuZXIoXCJibHVyXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgY29uc3QgJCA9IGdldEpRdWVyeSgpO1xuXG4gICAgICBsZXQgcmVzdWx0OiBBcnJheTx1bmtub3duPjtcblxuICAgICAgc3dpdGNoICh0b0xvYWQudGFyZ2V0ZGF0YS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJsb2NhbGl0aWVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gKGF3YWl0IE9wZW5QTFpfTG9jYWxpdGllcy5yZXRyaWV2ZShbXG4gICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgIFwiXCIsXG4gICAgICAgICAgICAxLFxuICAgICAgICAgIF0pKSBhcyBBcnJheTx1bmtub3duPjtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicG9zdGFsY29kZXNcIjpcbiAgICAgICAgICByZXN1bHQgPSAoYXdhaXQgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKFtcbiAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgXCIuKlwiLFxuICAgICAgICAgICAgYFx1MDBCMCR7KHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj47XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwic3RyZWV0c1wiOlxuICAgICAgICAgIHJlc3VsdCA9IHJlbW92ZUR1cGxpY2F0ZXMoXG4gICAgICAgICAgICAoYXdhaXQgT3BlblBMWl9TdHJlZXRzLnJldHJpZXZlKFtcbiAgICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseiA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICh0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxJbnB1dEVsZW1lbnQ+KFxuICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSxcbiAgICAgICAgICAgICAgICAgIEhUTUxJbnB1dEVsZW1lbnQsXG4gICAgICAgICAgICAgICAgICAnSXMgdGhlIERlcGVuZGVudExvY2FsaXR5IG5vdCBwb2ludGluZyB0byBhIDxpbnB1dCB0eXBlID0gXCJ0ZXh0XCI+PycsXG4gICAgICAgICAgICAgICAgKSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICApLnZhbHVlICE9PSBcIlwiKSB8fFxuICAgICAgICAgICAgICAoSU5TVEFOQ0UudHNDaGVjazxIVE1MSW5wdXRFbGVtZW50PihcbiAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KSxcbiAgICAgICAgICAgICAgICBIVE1MSW5wdXRFbGVtZW50LFxuICAgICAgICAgICAgICAgICdJcyB0aGUgRGVwZW5kZW50UExaIG5vdCBwb2ludGluZyB0byBhIDxpbnB1dCB0eXBlID0gXCJ0ZXh0XCI+PycsXG4gICAgICAgICAgICAgICkgJiZcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseixcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICAgICAgOiB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KVxuICAgICAgICAgICAgICAgICAgPyBgXHUwMEIwJHsodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YFxuICAgICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCJcbiAgICAgICAgICAgICAgICA/IGBcdTAwQjAke1xuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICkudmFsdWVcbiAgICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IodG9Mb2FkLm1zZ25vdGtub3duID8gdG9Mb2FkLm1zZ25vdGtub3duIDogYE9ubHkga25vd24gJHt0b0xvYWQudGFyZ2V0ZGF0YX0gYXJlIHBlcm1pdHRlZC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBwcm9wb3NhbHMpIHtcbiAgICAgICAgICBwcm9wb3NhbHMucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgZW50cmllcyB0aGF0J3JlIG5vdCBpbiBMREFQLlxuICAgIGxldCBibG9ja2VkID0gZmFsc2U7XG4gICAgLy8gI3JlZ2lvbiBDcmVhdGUgU2VsZWN0aW9uLlxuICAgIGNvbnN0IHByb3Bvc2FscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG5cbiAgICBwcm9wb3NhbHMuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdG9Qcm9jZXNzKSB7XG4gICAgICAgIHByb3Bvc2Fscy5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHByb3Bvc2Fscy5jbGFzc0xpc3QuYWRkKFwiLS0tQ29kQmlcIiwgXCItLU9wZW5QTFpfQXV0b2NvbXBsZXRlXCIsIGAtLSR7dG9Mb2FkLnRhcmdldGRhdGF9YCwgXCItUHJvcG9zYWxzXCIpO1xuICAgIHByb3Bvc2Fscy5zZXRBdHRyaWJ1dGUoXG4gICAgICBcInN0eWxlXCIsXG4gICAgICB0b0xvYWQuY3NzcHJvcG9zYWxzXG4gICAgICAgID8gdG9Mb2FkLmNzc3Byb3Bvc2Fsc1xuICAgICAgICA6IFwibWFyZ2luLXRvcDogLjVlbSA7IG1heC13aWR0aDogMTAwJSA7IGJvcmRlci1jb2xvcjogZGFya29yYW5nZSA7IGJvcmRlci1yYWRpdXM6IC41ZW0gOyBib3gtc2hhZG93OiAwIDAgLjVlbSBkYXJrb3JhbmdlIDsgY29sb3I6IGdyZWVuIDsgZm9udC13ZWlnaHQ6IGJvbGRlciA7IGN1cnNvcjogcG9pbnRlcjtcIixcbiAgICApO1xuICAgIC8vICNyZWdpb24gSGFuZGxlIFNlbGVjdGlvbi5cbiAgICBjb25zdCBvblNlbGVjdGVkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9IChwcm9wb3NhbHMgYXMgSFRNTFNlbGVjdEVsZW1lbnQpLnZhbHVlO1xuXG4gICAgICBsZXQgcmVzdWx0OiBBcnJheTx1bmtub3duPjtcblxuICAgICAgc3dpdGNoICh0b0xvYWQudGFyZ2V0ZGF0YS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJsb2NhbGl0aWVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gcmVtb3ZlRHVwbGljYXRlcyhcbiAgICAgICAgICAgIChhd2FpdCBPcGVuUExaX0xvY2FsaXRpZXMucmV0cmlldmUoW1xuICAgICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgICAgYFx1MDBCMCR7KHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gLFxuICAgICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicG9zdGFsY29kZXNcIjpcbiAgICAgICAgICByZXN1bHQgPSAoYXdhaXQgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKFtcbiAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgXCIuKlwiLFxuICAgICAgICAgICAgYFx1MDBCMCR7KHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj47XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwic3RyZWV0c1wiOlxuICAgICAgICAgIHJlc3VsdCA9IHJlbW92ZUR1cGxpY2F0ZXMoXG4gICAgICAgICAgICAoYXdhaXQgT3BlblBMWl9TdHJlZXRzLnJldHJpZXZlKFtcbiAgICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseiA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICh0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkpICYmXG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCIpIHx8XG4gICAgICAgICAgICAgICh0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50cGx6LFxuICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgKS52YWx1ZSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICA/IFwiXCJcbiAgICAgICAgICAgICAgICA6IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnRwbHopXG4gICAgICAgICAgICAgICAgICA/IGBcdTAwQjAkeyh0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gXG4gICAgICAgICAgICAgICAgICA6IFwiXCIsXG4gICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSAmJlxuICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkpICYmXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgKS52YWx1ZSAhPT0gXCJcIlxuICAgICAgICAgICAgICAgID8gYFx1MDBCMCR7XG4gICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICAgICA6IFwiXCIsXG4gICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj4sXG4gICAgICAgICAgICBcIm5hbWVcIixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgYW55KS5jb2RiaU9wZW5QTFpTZXRNYXRjaExpc3RlbmVycykge1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiAodG9Qcm9jZXNzIGFzIGFueSkuY29kYmlPcGVuUExaU2V0TWF0Y2hMaXN0ZW5lcnMpIHtcbiAgICAgICAgICBsaXN0ZW5lcihyZXN1bHQsIHRvUHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNyZWdpb24gU2V0IGRlcGVuZGVudCwgaWYgYXZhaWxhYmxlLlxuICAgICAgY29uc3QgdGNUYXJnZXREYXRhID0gdG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGRlcGVuZGVudCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnQpO1xuXG4gICAgICBpZiAodGNUYXJnZXREYXRhICE9PSBcInN0cmVldHNcIikge1xuICAgICAgICBpZiAoZGVwZW5kZW50KSB7XG4gICAgICAgICAgKGRlcGVuZGVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9XG4gICAgICAgICAgICB0Y1RhcmdldERhdGEgPT09IFwibG9jYWxpdGllc1wiXG4gICAgICAgICAgICAgID8gKHJlc3VsdFswXSBhcyB7IHBvc3RhbENvZGU6IHN0cmluZyB9KS5wb3N0YWxDb2RlXG4gICAgICAgICAgICAgIDogKHJlc3VsdFswXSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFNldCBkZXBlbmRlbnQsIGlmIGF2YWlsYWJsZS5cbiAgICAgIC8vICNyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgY29uc3QgdG9Gb2N1cyA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICB0b0xvYWQuZm9jdXNvbmF1dG9jb21wbGV0ZSxcbiAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgIGlmICh0b0ZvY3VzICYmIHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAodG9Gb2N1cyBhcyBhbnkpLkNvZEJpX09wZW5QTFpfQXV0b2NvbXBsZXRlX0Jsb2NrZWRCeURlcGVuZGVudCA9IHRydWU7XG5cbiAgICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgICB0b0ZvY3VzLmZvY3VzKCk7XG4gICAgICAgIHRvRm9jdXMuYW5pbWF0ZShPcGVuUExaX0F1dG9jb21wbGV0ZS5rZkZvY3VzT25BdXRvY29tcGxldGUsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLnRtZ0ZvY3VzT25BdXRvY29tcGxldGUpLnBsYXkoKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgIH07XG5cbiAgICBwcm9wb3NhbHMuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIG9uU2VsZWN0ZWQoKTtcbiAgICB9KTtcblxuICAgIHRvUHJvY2Vzcy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgaWYgKGJsb2NrZWQgfHwgKHRvUHJvY2VzcyBhcyBhbnkpLkNvZEJpX09wZW5QTFpfQXV0b2NvbXBsZXRlX0Jsb2NrZWRCeURlcGVuZGVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgU2VsZWN0aW9uLlxuICAgIC8vICNlbmRyZWdpb24gQ3JlYXRlIFNlbGVjdGlvbi5cbiAgICB0b1Byb2Nlc3MuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICBpZiAoYmxvY2tlZCB8fCAodG9Qcm9jZXNzIGFzIGFueSkuQ29kQmlfT3BlblBMWl9BdXRvY29tcGxldGVfQmxvY2tlZEJ5RGVwZW5kZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGtleSA9IElOU1RBTkNFLnRzQ2hlY2s8S2V5Ym9hcmRFdmVudD4oZXZlbnQsIEtleWJvYXJkRXZlbnQpLmtleTtcbiAgICAgIGNvbnN0IGRlcGVuZGVudCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnQpO1xuXG4gICAgICBpZiAoa2V5Lmxlbmd0aCAhPT0gMSAmJiBrZXkgIT09IFwiQmFja3NwYWNlXCIgJiYga2V5ICE9PSBcIkRlbGV0ZVwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleSA9PT0gXCJFbnRlclwiIHx8IGtleSA9PT0gXCJTcGFjZVwiKSB7XG4gICAgICAgIG9uU2VsZWN0ZWQoKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3VsdDogQXJyYXk8dW5rbm93bj47XG5cbiAgICAgIHN3aXRjaCAodG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwibG9jYWxpdGllc1wiOlxuICAgICAgICAgIHJlc3VsdCA9IHJlbW92ZUR1cGxpY2F0ZXMoXG4gICAgICAgICAgICAoYXdhaXQgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKFtcbiAgICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIF0pKSBhcyBBcnJheTx1bmtub3duPixcbiAgICAgICAgICAgIFwibmFtZVwiLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInBvc3RhbGNvZGVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gKGF3YWl0IE9wZW5QTFpfTG9jYWxpdGllcy5yZXRyaWV2ZShbXG4gICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgIFwiLipcIixcbiAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+O1xuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcInN0cmVldHNcIjpcbiAgICAgICAgICByZXN1bHQgPSByZW1vdmVEdXBsaWNhdGVzKFxuICAgICAgICAgICAgKGF3YWl0IE9wZW5QTFpfU3RyZWV0cy5yZXRyaWV2ZShbXG4gICAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgICBgXHUwMEIwJHsodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlfWAsXG4gICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRwbHogPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgICAodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5ICYmXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICApLnZhbHVlICE9PSBcIlwiKSB8fFxuICAgICAgICAgICAgICAodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgJiZcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseixcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICAgICAgOiB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KVxuICAgICAgICAgICAgICAgICAgPyBgXHUwMEIwJHsodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YFxuICAgICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCJcbiAgICAgICAgICAgICAgICA/IGBcdTAwQjAke1xuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICkudmFsdWVcbiAgICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCB8fCAocmVzdWx0WzBdIGFzIGFueSkucmVzdWx0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBJZiB0aGUgcmVxdWVzdCByZXR1cm5lZCBhbiBlcnJvci5cbiAgICAgICAgaWYgKChyZXN1bHRbMF0gYXMgeyBlcnJvcjogc3RyaW5nIH0pLmVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gSWYgdGhlIHJlcXVlc3QgcmV0dXJuZWQgYW4gZXJyb3IuXG4gICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSByZXN1bHRbMF1bdGFyZ2V0UmVzdWx0UHJvcGVydHldO1xuICAgICAgICAvLyAjcmVnaW9uIFNldCBkZXBlbmRlbnQsIGlmIGF2YWlsYWJsZS5cbiAgICAgICAgY29uc3QgdGNUYXJnZXREYXRhID0gdG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBpZiAodGNUYXJnZXREYXRhICE9PSBcInN0cmVldHNcIikge1xuICAgICAgICAgIGlmIChkZXBlbmRlbnQpIHtcbiAgICAgICAgICAgIChkZXBlbmRlbnQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPVxuICAgICAgICAgICAgICB0Y1RhcmdldERhdGEgPT09IFwibG9jYWxpdGllc1wiXG4gICAgICAgICAgICAgICAgPyAocmVzdWx0WzBdIGFzIHsgcG9zdGFsQ29kZTogc3RyaW5nIH0pLnBvc3RhbENvZGVcbiAgICAgICAgICAgICAgICA6IChyZXN1bHRbMF0gYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBTZXQgZGVwZW5kZW50LCBpZiBhdmFpbGFibGUuXG4gICAgICAgIC8vICNyZWdpb24gQmxvY2sgaW5wdXQgb24gbWF0Y2guXG4gICAgICAgIGJsb2NrZWQgPSB0cnVlO1xuICAgICAgICAvLyAjcmVnaW9uIFJlbW92ZSBwcm9wb3NhbHMuXG4gICAgICAgIHByb3Bvc2Fscy5yZW1vdmUoKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgcHJvcG9zYWxzLlxuICAgICAgICBjb25zdCB0b0ZvY3VzID0gdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgdG9Mb2FkLmZvY3Vzb25hdXRvY29tcGxldGUsXG4gICAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgYmxvY2tlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICh0b0ZvY3VzIGFzIGFueSkuQ29kQmlfT3BlblBMWl9BdXRvY29tcGxldGVfQmxvY2tlZEJ5RGVwZW5kZW50ID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBCbG9jayBpbnB1dCBvbiBtYXRjaC5cbiAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyB0aGUgZmllbGQgYWZ0ZXIgYXV0b2NvbXBsZXRlLCBpZiBzcGVjaWZpZWQuXG4gICAgICAgIGlmICh0b0ZvY3VzICYmIHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgICAgKHRvRm9jdXMgYXMgYW55KS5Db2RCaV9PcGVuUExaX0F1dG9jb21wbGV0ZV9CbG9ja2VkQnlEZXBlbmRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgICAgIHRvRm9jdXMuZm9jdXMoKTtcbiAgICAgICAgICB0b0ZvY3VzXG4gICAgICAgICAgICAuYW5pbWF0ZShPcGVuUExaX0F1dG9jb21wbGV0ZS5rZkZvY3VzT25BdXRvY29tcGxldGUsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLnRtZ0ZvY3VzT25BdXRvY29tcGxldGUpXG4gICAgICAgICAgICAucGxheSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBTaG93IHByb3Bvc2Fscy5cbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID4gMSkge1xuICAgICAgICBwcm9wb3NhbHMuaW5uZXJIVE1MID0gXCJcIjtcblxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcmVzdWx0KSB7XG4gICAgICAgICAgcHJvcG9zYWxzLm9wdGlvbnMuYWRkKG5ldyBPcHRpb24oZWxlbWVudFt0YXJnZXRSZXN1bHRQcm9wZXJ0eV0sIGVsZW1lbnRbdGFyZ2V0UmVzdWx0UHJvcGVydHldKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChwcm9wb3NhbHMpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBTaG93IHByb3Bvc2Fscy5cbiAgICB9KTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBPcGVuUExaX0F1dG9jb21wbGV0ZSB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIk9wZW5QTFouQXV0b2NvbXBsZXRlXCIsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG5cbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXG4gIFwiT3BlblBMWi5BdXRvY29tcGxldGVcIixcbiAgT3BlblBMWl9BdXRvY29tcGxldGUuZnVuY3Rpb25hbGl0eS5iaW5kKE9wZW5QTFpfQXV0b2NvbXBsZXRlKSxcbik7IC8vIEluaXRpYWxpemF0aW9uXG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgQUUgfSBmcm9tIFwieGRiYy9zcmMvREJDL0FFXCI7XG5pbXBvcnQgeyBHUkVBVEVSIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9DT01QQVJJU09OL0dSRUFURVJcIjtcbmltcG9ydCB7IEVRIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9FUVwiO1xuaW1wb3J0IHsgT1IgfSBmcm9tIFwieGRiYy9zcmMvREJDL09SXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIFJldHJpZXZlcyBkYXRhIGZyb20gdGhlICoqQ29kQmlfT3BlblBMWl9WZXJ3YWx0dW5nc2VpbmhlaXRlbioqLVNlcnZsZXQgYWNjb3JkaW5nIHRvIHRoZSBwYXJhbWV0ZXIgc3BlY2lmaWVkLlxuICogVGhpcyBpcyB0aGUgYmFzZSBjbGFzcyBmb3IgYWNjZXNzaW5nIHRoZSAqKltPcGVuUExaIFJFU1QgQVBJXShodHRwczovL3d3dy5vcGVucGx6YXBpLm9yZy9kZS8pKiosIHRodXMgbWFraW5nIGFsbFxuICogZmVhdHVyZXMgdGhhdCB0aGUgUkVTVC1TZXJ2aWNlIHByb3ZpZGVzIGFjY2Vzc2libGUuXG4gKlxuICogIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gKiAtIDFzdDogVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICogICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gKiAtIDJuZDogVGhlICoqb3JnYVVuaXQqKiB0byByZXRyaWV2ZSAoZS5nLiAqKkZlZGVyYWxTdGF0ZXMqKiwgKipGZWRlcmFsUHJvdmluY2VzKiogb3IgKipDYW50b25zKiopLlxuICogLSAzcmQ6IFRoZSBvcHRpb25hbCBrZXkgb2YgdGhlIHN0YXRlLCBwcm92aW5jZSBvciBjYW50b24gdG8gZ2V0IGRldGFpbHMgb2YuXG4gKiAtIDR0aDogVGhlIG9wdGlvbmFsIGRldGFpbCB0byBmZXRjaCBhYm91dCBhIGNlcnRhaW4gc3RhdGUsIHByb3ZpbmNlIG9yIGNhbnRvbiBpZGVudGlmaWVkIGJ5IHRoZVxuICogICAgICAgICoqb2ZmaWNpYWxLZXkqKiAobm90IG9wdGlvbmFsIGlmIGFuIG9mZmljaWFsIGtleSBpcyBwcmVzZW50KS4gTWF5IGJlIE11bmljaXBhbGl0aWVzIG9yIERpc3RyaWN0cy5cbiAqIC0gNXRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gNnRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gN3RoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gOHRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gOXRoOiBBbiBPcHRpb25hbCBudW1iZXIgb2YgcGFnZXMgdG8gbG9hZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogRnV0dXJlIGluaGVyaXRhbmNlIHByb2JhYmxlLlxuZXhwb3J0IGNsYXNzIE9wZW5QTFoge1xuICAvKipcbiAgICogSm9pbnMgYWxsIHtAbGluayBvYmplY3QgfXMgaW4gXCJwYXJhbXNcIiBpbnRvIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUoXG4gICAgQEdSRUFURVIuUFJFKDEsIHRydWUsIGZhbHNlLCBcImxlbmd0aFwiLCBcIkhhc24ndCBhdCBsZWFzdCB0aGUgT3JnYS1Vbml0IGJlZW4gc3BlY2lmaWVkP1wiKVxuICAgIEBBRS5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIDApXG4gICAgQEFFLlBSRShuZXcgT1IoW25ldyBFUShcIlwiKSwgbmV3IFJFR0VYKC8oZGV8ZW58YXR8bGl8Y2gpL2kpXSksIDApXG4gICAgQEFFLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgMilcbiAgICBAQUUuUFJFKG5ldyBPUihbbmV3IEVRKFwiXCIpLCBuZXcgUkVHRVgoL15cXGQrJC8pXSksIDIpXG4gICAgcGFyYW1zOiBBcnJheTx1bmtub3duPixcbiAgKTogQXJyYXk8dW5rbm93bj4gfCB1bmtub3duIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgZ2V0SlF1ZXJ5KClcbiAgICAgICAgLmFqYXgoe1xuICAgICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfT3BlblBMWl9RdWVyeWAsXG4gICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgXCJYLUNvdW50cnlcIjogcGFyYW1zWzBdID8gKHBhcmFtc1swXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1PcmdhVW5pdFwiOiBwYXJhbXNbMV0gPyAocGFyYW1zWzFdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgXCJYLU9mZmljaWFsS2V5XCI6IHBhcmFtc1syXSA/IChwYXJhbXNbMl0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtRGV0YWlsXCI6IHBhcmFtc1szXSA/IChwYXJhbXNbM10gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtUGFyYW0xXCI6IHBhcmFtc1s0XSA/IChwYXJhbXNbNF0gYXMgc3RyaW5nKS5yZXBsYWNlKFwiPVwiLCBcIi1cIikucmVwbGFjZSgvIC8sIFwiXCIpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1QYXJhbTJcIjogcGFyYW1zWzVdID8gKHBhcmFtc1s1XSBhcyBzdHJpbmcpLnJlcGxhY2UoXCI9XCIsIFwiLVwiKS5yZXBsYWNlKC8gLywgXCJcIikgOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtM1wiOiBwYXJhbXNbNl0gPyAocGFyYW1zWzZdIGFzIHN0cmluZykucmVwbGFjZShcIj1cIiwgXCItXCIpLnJlcGxhY2UoLyAvLCBcIlwiKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtUGFyYW00XCI6IHBhcmFtc1s3XSA/IChwYXJhbXNbN10gYXMgc3RyaW5nKS5yZXBsYWNlKFwiPVwiLCBcIi1cIikucmVwbGFjZSgvIC8sIFwiXCIpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1QYWdlc1RvTG9hZFwiOiBwYXJhbXNbOF0gPyBwYXJhbXNbOF0udG9TdHJpbmcoKSA6IHVuZGVmaW5lZCxcbiAgICAgICAgICB9LFxuICAgICAgICB9KVxuICAgICAgICAuZG9uZSgocmVzcG9uc2U6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwb25zZSkpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJFUChcIk9wZW5QTFpcIiwgT3BlblBMWi5yZXRyaWV2ZS5iaW5kKE9wZW5QTFopKTsgLy8gSW5pdGlhbGl6YXRpb25cbiIsICIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQUVcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgR1JFQVRFUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbmltcG9ydCB7IEVRIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9FUVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG5pbXBvcnQgeyBPcGVuUExaIH0gZnJvbSBcIi4vb3BlbnBselwiO1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIEFuIHtAbGluayBPcGVuUExaIH0tUmVxdWVzdCBzcGVjaWFsaXplZCBpbnRvIHNlYXJjaGluZyBmb3Igc3RyZWV0cy5cbiAqXG4gKiAjIyMgQ29uZmlnIFBhcmFtZXRlcjpcbiAqIC0gMXN0OiBUaGUgb3B0aW9uYWwgKipjb3VudHJ5KiogdG8gcmV0cmlldmUgdGhlIGRhdGEgb2YgKGlmIG5vdCBwcm92aWRlZCBlaXRoZXIgdGhlIGNvdW50cnkgc3BlY2lmaWVkIGluXG4gKiAgICAgICAgdGhlIENvZEJpJ3MgQ29uZmlndXJhdGlvbiAqKk9wZW5QTFpfQ291bnRyeSoqIHdpbGwgYmUgdXNlZCBvciwgaWYgbm90IHNwZWNpZmllZCwgXCJkZVwiKS5cbiAqIC0gMm5kOiBUaGUgWyBQT1NJWCBSZWdFeCBdKGh0dHBzOi8vd3d3Lm9wZW5wbHphcGkub3JnL2RlL3JlZ2V4LykgZm9yIHRoZSBzdHJlZXQncyBuYW1lLlxuICogLSAzcmQ6IFRoZSBbIFBPU0lYIFJlZ0V4IF0oaHR0cHM6Ly93d3cub3BlbnBsemFwaS5vcmcvZGUvcmVnZXgvKSBmb3IgdGhlIHN0cmVldCdzIHBvc3RhbCBjb2RlLiBJZiB0aGlzIGlzIGVtcHR5IHRoZVxuICogICAgICAgICoqNHRoKiogcGFyYW1ldGVyIHdpbGwgYmUgdXNlZCBmb3IgdGhlIHNlYXJjaCBhcyB0aGUgc3RyZWV0J3MgY2l0eS1uYW1lLlxuICogLSA0dGg6IFRoZSBbIFBPU0lYIFJlZ0V4IF0oaHR0cHM6Ly93d3cub3BlbnBsemFwaS5vcmcvZGUvcmVnZXgvKSBmb3IgdGhlIGNpdHkncyBuYW1lIHVzZWQgaWYgdGhlICoqM3JkKipcbiAqICAgICAgICBwYXJhbWV0ZXIgaXMgZW1wdHkuXG4gKiAtIDV0aDogQW4gT3B0aW9uYWwgbnVtYmVyIG9mIHBhZ2VzIHRvIGxvYWQuXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuZXhwb3J0IGNsYXNzIE9wZW5QTFpfU3RyZWV0cyBleHRlbmRzIE9wZW5QTFoge1xuICAvKipcbiAgICogSm9pbnMgYWxsIHtAbGluayBvYmplY3QgfXMgaW4gXCJwYXJhbXNcIiBpbnRvIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgcmV0cmlldmUoXG4gICAgQEdSRUFURVIuUFJFKDIsIHRydWUsIGZhbHNlLCBcImxlbmd0aFwiLCBcIkhhc24ndCBhdCBsZWFzdCB0aGUgU3RyZWV0IGFuZCBDaXR5IFJlZ0V4IGJlZW4gc3BlY2lmaWVkP1wiKVxuICAgIEBBRS5QUkUobmV3IFRZUEUoXCJzdHJpbmdcIiksIDAsIDQpXG4gICAgQEFFLlBSRShuZXcgT1IoW25ldyBFUShcIlwiKSwgbmV3IFJFR0VYKC8oZGV8ZW58YXR8bGl8Y2gpL2kpXSksIDApXG4gICAgcGFyYW1zOiBBcnJheTx1bmtub3duPixcbiAgKTogQXJyYXk8dW5rbm93bj4gfCB1bmtub3duIHtcbiAgICByZXR1cm4gT3BlblBMWi5yZXRyaWV2ZShbXG4gICAgICBwYXJhbXNbMF0gPyAocGFyYW1zWzBdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgXCJTdHJlZXRzXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIGBuYW1lLSR7KHBhcmFtc1sxXSBhcyBzdHJpbmcpLnJlcGxhY2UoL14vLCBcIlx1MDBCMFwiKX1gLFxuICAgICAgcGFyYW1zLmxlbmd0aCA+PSA0XG4gICAgICAgID8gYGxvY2FsaXR5LSR7KHBhcmFtc1szXSBhcyBzdHJpbmcpLnJlcGxhY2UoL14vLCBcIlx1MDBCMFwiKX1gXG4gICAgICAgIDogYHBvc3RhbENvZGUtJHsocGFyYW1zWzJdIGFzIHN0cmluZykucmVwbGFjZSgvXi8sIFwiXHUwMEIwXCIpfWAsXG4gICAgICBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIHBhcmFtc1s0XSA/IHBhcmFtc1s0XSA6IFwiXCIsXG4gICAgXSk7XG4gIH1cbn1cblxud2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCJPcGVuUExaLlN0cmVldHNcIiwgT3BlblBMWl9TdHJlZXRzLnJldHJpZXZlLmJpbmQoT3BlblBMWl9TdHJlZXRzKSk7IC8vIEluaXRpYWxpemF0aW9uXG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IEdSRUFURVIgfSBmcm9tIFwieGRiYy9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUlwiO1xuaW1wb3J0IHsgQUUgfSBmcm9tIFwieGRiYy9zcmMvREJDL0FFXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRlwiO1xuaW1wb3J0IHsgT1IgfSBmcm9tIFwieGRiYy9zcmMvREJDL09SLmpzXCI7XG5pbXBvcnQgeyBFUSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvRVEuanNcIjtcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgT3BlblBMWiB9IGZyb20gXCIuL29wZW5wbHpcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBBbiB7QGxpbmsgT3BlblBMWiB9LVJlcXVlc3Qgc3BlY2lhbGl6ZWQgaW50byBzZWFyY2hpbmcgZm9yIGxvY2FsaXRpZXMuXG4gKlxuICogIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gKiAtIDFzdDogVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICogICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gKiAtIDJuZDogVGhlIFsgUE9TSVggUmVnRXggXShodHRwczovL3d3dy5vcGVucGx6YXBpLm9yZy9kZS9yZWdleC8pIGZvciB0aGUgbG9jYWxpdHkncyBuYW1lLlxuICogLSAzcmQ6IFRoZSBbIFBPU0lYIFJlZ0V4IF0oaHR0cHM6Ly93d3cub3BlbnBsemFwaS5vcmcvZGUvcmVnZXgvKSBmb3IgdGhlIGxvY2FsaXR5J3MgcG9zdGFsIGNvZGUuXG4gKiAtIDR0aDogQW4gT3B0aW9uYWwgbnVtYmVyIG9mIHBhZ2VzIHRvIGxvYWQuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbmV4cG9ydCBjbGFzcyBPcGVuUExaX0xvY2FsaXRpZXMgZXh0ZW5kcyBPcGVuUExaIHtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgbG9jYWxpdGllcyBmb3VuZCBhY2NvcmRpbmcgdG8gdGhlIHByb3ZpZGVkICoqcGFyYW1zKiouXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoYXQgRWxlbWVudC1QbGFjZWhvbGRlciAocHJvdmlkZWQgYnkgQ29kQmkpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIHJldHJpZXZlKFxuICAgIEBHUkVBVEVSLlBSRSgxLCB0cnVlLCBmYWxzZSwgXCJsZW5ndGhcIiwgXCJIYXNuJ3QgYXQgbGVhc3QgdGhlIExvY2FsaXR5J3Mgb3IgdGhlIFBvc3RhbGNvZGUgUmVnRXggYmVlbiBzcGVjaWZpZWQ/XCIpXG4gICAgQEFFLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgMCwgMilcbiAgICBAQUUuUFJFKG5ldyBPUihbbmV3IEVRKFwiXCIpLCBuZXcgUkVHRVgoLyhkZXxlbnxhdHxsaXxjaCkvaSldKSwgMClcbiAgICBAQUUuUFJFKG5ldyBUWVBFKFwic3RyaW5nIHwgbnVtYmVyXCIpLCAzKVxuICAgIEBBRS5QUkUobmV3IElGKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoL15cXGQrJC8pKSwgMylcbiAgICBwYXJhbXM6IEFycmF5PHVua25vd24+LFxuICApOiBBcnJheTx1bmtub3duPiB8IHVua25vd24ge1xuICAgIHJldHVybiBPcGVuUExaLnJldHJpZXZlKFtcbiAgICAgIHBhcmFtc1swXSxcbiAgICAgIFwiTG9jYWxpdGllc1wiLFxuICAgICAgXCJcIixcbiAgICAgIFwiXCIsXG4gICAgICBgbmFtZS0keyhwYXJhbXNbMV0gYXMgc3RyaW5nKS5yZXBsYWNlKC9eLywgXCJcdTAwQjBcIil9YCxcbiAgICAgIHBhcmFtcy5sZW5ndGggPj0gMyA/IGBwb3N0YWxDb2RlLSR7KHBhcmFtc1syXSBhcyBzdHJpbmcpLnJlcGxhY2UoL14vLCBcIlx1MDBCMFwiKX1gIDogXCJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIHBhcmFtc1szXSA/IHBhcmFtc1szXSA6IFwiXCIsXG4gICAgICBwYXJhbXNbM10gPyBwYXJhbXNbM10gOiBcIlwiLFxuICAgIF0pO1xuICB9XG59XG5cbndpbmRvdy5jb2RiaS5yZWdpc3RlckVQKFwiT3BlblBMWi5Mb2NhbGl0aWVzXCIsIE9wZW5QTFpfTG9jYWxpdGllcy5yZXRyaWV2ZS5iaW5kKE9wZW5QTFpfTG9jYWxpdGllcykpOyAvLyBJbml0aWFsaXphdGlvblxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSxJQUFBQSwyQkFBMEI7OztBQ0ExQiw4QkFBMEI7QUFxQ25CLElBQU0sVUFBTixNQUFjO0FBQUEsRUFNbkIsT0FBYyxTQU1aLFFBQzBCO0FBQzFCLFdBQU8sSUFBSSxRQUFRLENBQUMsU0FBUyxXQUFXO0FBQ3RDLDZDQUFVLEVBQ1AsS0FBSztBQUFBLFFBQ0osS0FBSyxHQUFHLE9BQU8sTUFBTSxPQUFPO0FBQUEsUUFDNUIsTUFBTTtBQUFBLFFBQ04sU0FBUztBQUFBLFVBQ1AsUUFBUTtBQUFBLFVBQ1IsYUFBYSxPQUFPLENBQUMsSUFBSyxPQUFPLENBQUMsSUFBZTtBQUFBLFVBQ2pELGNBQWMsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxVQUNsRCxpQkFBaUIsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxVQUNyRCxZQUFZLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsVUFDaEQsWUFBWSxPQUFPLENBQUMsSUFBSyxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssR0FBRyxFQUFFLFFBQVEsS0FBSyxFQUFFLElBQUk7QUFBQSxVQUNuRixZQUFZLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxFQUFhLFFBQVEsS0FBSyxHQUFHLEVBQUUsUUFBUSxLQUFLLEVBQUUsSUFBSTtBQUFBLFVBQ25GLFlBQVksT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLEVBQWEsUUFBUSxLQUFLLEdBQUcsRUFBRSxRQUFRLEtBQUssRUFBRSxJQUFJO0FBQUEsVUFDbkYsWUFBWSxPQUFPLENBQUMsSUFBSyxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssR0FBRyxFQUFFLFFBQVEsS0FBSyxFQUFFLElBQUk7QUFBQSxVQUNuRixpQkFBaUIsT0FBTyxDQUFDLElBQUksT0FBTyxDQUFDLEVBQUUsU0FBUyxJQUFJO0FBQUEsUUFDdEQ7QUFBQSxNQUNGLENBQUMsRUFDQSxLQUFLLENBQUMsYUFBcUI7QUFDMUIsZ0JBQVEsS0FBSyxNQUFNLFFBQVEsQ0FBQztBQUFBLE1BQzlCLENBQUM7QUFBQSxJQUNMLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUEvQmdCO0FBQUEsRUFEYixJQUFJO0FBQUEsRUFFRiwyQkFBUSxJQUFJLEdBQUcsTUFBTSxPQUFPLFVBQVUsK0NBQStDO0FBQUEsRUFDckYsc0JBQUcsSUFBSSxJQUFJLEtBQUssUUFBUSxHQUFHLENBQUM7QUFBQSxFQUM1QixzQkFBRyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsSUFBSSxNQUFNLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUFDO0FBQUEsRUFDOUQsc0JBQUcsSUFBSSxJQUFJLEtBQUssUUFBUSxHQUFHLENBQUM7QUFBQSxFQUM1QixzQkFBRyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsSUFBSSxNQUFNLE9BQU8sQ0FBQyxDQUFDLEdBQUcsQ0FBQztBQUFBLEdBWDFDLFNBTUc7QUFpQ2hCLE9BQU8sTUFBTSxXQUFXLFdBQVcsUUFBUSxTQUFTLEtBQUssT0FBTyxDQUFDOzs7QUNqRDFELElBQU0sa0JBQU4sY0FBOEIsUUFBUTtBQUFBLEVBTTNDLE9BQXVCLFNBSXJCLFFBQzBCO0FBQzFCLFdBQU8sUUFBUSxTQUFTO0FBQUEsTUFDdEIsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxNQUNwQztBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxRQUFTLE9BQU8sQ0FBQyxFQUFhLFFBQVEsS0FBSyxNQUFHLENBQUM7QUFBQSxNQUMvQyxPQUFPLFVBQVUsSUFDYixZQUFhLE9BQU8sQ0FBQyxFQUFhLFFBQVEsS0FBSyxNQUFHLENBQUMsS0FDbkQsY0FBZSxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssTUFBRyxDQUFDO0FBQUEsTUFDekQ7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSTtBQUFBLElBQzFCLENBQUM7QUFBQSxFQUNIO0FBQ0Y7QUFwQnlCO0FBQUEsRUFEdEIsSUFBSTtBQUFBLEVBRUYsMkJBQVEsSUFBSSxHQUFHLE1BQU0sT0FBTyxVQUFVLDJEQUEyRDtBQUFBLEVBQ2pHLHNCQUFHLElBQUksSUFBSSxLQUFLLFFBQVEsR0FBRyxHQUFHLENBQUM7QUFBQSxFQUMvQixzQkFBRyxJQUFJLElBQUksR0FBRyxDQUFDLElBQUksR0FBRyxFQUFFLEdBQUcsSUFBSSxNQUFNLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUFDO0FBQUEsR0FUdEQsaUJBTVk7QUFzQnpCLE9BQU8sTUFBTSxXQUFXLG1CQUFtQixnQkFBZ0IsU0FBUyxLQUFLLGVBQWUsQ0FBQzs7O0FDaENsRixJQUFNLHFCQUFOLGNBQWlDLFFBQVE7QUFBQSxFQU05QyxPQUF1QixTQU1yQixRQUMwQjtBQUMxQixXQUFPLFFBQVEsU0FBUztBQUFBLE1BQ3RCLE9BQU8sQ0FBQztBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsUUFBUyxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssTUFBRyxDQUFDO0FBQUEsTUFDL0MsT0FBTyxVQUFVLElBQUksY0FBZSxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssTUFBRyxDQUFDLEtBQUs7QUFBQSxNQUMvRTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSTtBQUFBLE1BQ3hCLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDMUIsQ0FBQztBQUFBLEVBQ0g7QUFDRjtBQXRCeUI7QUFBQSxFQUR0QixJQUFJO0FBQUEsRUFFRiwyQkFBUSxJQUFJLEdBQUcsTUFBTSxPQUFPLFVBQVUsd0VBQXdFO0FBQUEsRUFDOUcsc0JBQUcsSUFBSSxJQUFJLEtBQUssUUFBUSxHQUFHLEdBQUcsQ0FBQztBQUFBLEVBQy9CLHNCQUFHLElBQUksSUFBSSxHQUFHLENBQUMsSUFBSSxHQUFHLEVBQUUsR0FBRyxJQUFJLE1BQU0sbUJBQW1CLENBQUMsQ0FBQyxHQUFHLENBQUM7QUFBQSxFQUM5RCxzQkFBRyxJQUFJLElBQUksS0FBSyxpQkFBaUIsR0FBRyxDQUFDO0FBQUEsRUFDckMsc0JBQUcsSUFBSSxJQUFJLEdBQUcsSUFBSSxLQUFLLFFBQVEsR0FBRyxJQUFJLE1BQU0sT0FBTyxDQUFDLEdBQUcsQ0FBQztBQUFBLEdBWGhELG9CQU1ZO0FBd0J6QixPQUFPLE1BQU0sV0FBVyxzQkFBc0IsbUJBQW1CLFNBQVMsS0FBSyxrQkFBa0IsQ0FBQzs7O0FIN0IzRixJQUFNLHdCQUFOLE1BQU0sc0JBQXFCO0FBQUEsRUFHaEM7QUFBQTtBQUFBO0FBQUEsU0FBaUIsd0JBQW9DO0FBQUEsTUFDbkQ7QUFBQSxRQUNFLFdBQVc7QUFBQSxNQUNiO0FBQUEsTUFDQTtBQUFBLFFBQ0UsV0FBVztBQUFBLFFBQ1gsV0FBVztBQUFBLFFBQ1gsYUFBYTtBQUFBLE1BQ2Y7QUFBQSxNQUVBO0FBQUEsUUFDRSxXQUFXO0FBQUEsUUFDWCxXQUFXO0FBQUEsUUFDWCxhQUFhO0FBQUEsTUFDZjtBQUFBLElBQ0Y7QUFBQTtBQUFBLEVBR0E7QUFBQTtBQUFBO0FBQUEsU0FBaUIseUJBQW1EO0FBQUEsTUFDbEUsVUFBVTtBQUFBLE1BQ1YsWUFBWTtBQUFBLE1BQ1osUUFBUTtBQUFBLE1BQ1IsTUFBTTtBQUFBLElBQ1I7QUFBQTtBQUFBLEVBcUJBLE9BQWMsY0FXWixRQUlBLFdBQ007QUFDTixVQUFNLHVCQUNKLE9BQU8sV0FBVyxZQUFZLE1BQU0sZ0JBQWdCLE9BQU8sV0FBVyxZQUFZLE1BQU0sWUFDcEYsU0FDQTtBQUVOLGNBQVUsaUJBQWlCLFFBQVEsT0FBTyxVQUFVO0FBQ2xELFlBQU0sUUFBSSxvQ0FBVTtBQUVwQixVQUFJO0FBRUosY0FBUSxPQUFPLFdBQVcsWUFBWSxHQUFHO0FBQUEsUUFDdkMsS0FBSztBQUNILG1CQUFVLE1BQU0sbUJBQW1CLFNBQVM7QUFBQSxZQUMxQyxPQUFPLFVBQVUsT0FBTyxVQUFVO0FBQUEsWUFDbEMsT0FBSyxVQUErQixLQUFLO0FBQUEsWUFDekM7QUFBQSxZQUNBO0FBQUEsVUFDRixDQUFDO0FBRUQ7QUFBQSxRQUNGLEtBQUs7QUFDSCxtQkFBVSxNQUFNLG1CQUFtQixTQUFTO0FBQUEsWUFDMUMsT0FBTyxVQUFVLE9BQU8sVUFBVTtBQUFBLFlBQ2xDO0FBQUEsWUFDQSxPQUFLLFVBQStCLEtBQUs7QUFBQSxZQUN6QztBQUFBLFVBQ0YsQ0FBQztBQUVEO0FBQUEsUUFFRixLQUFLO0FBQ0gsbUJBQVM7QUFBQSxZQUNOLE1BQU0sZ0JBQWdCLFNBQVM7QUFBQSxjQUM5QixPQUFPLFVBQVUsT0FBTyxVQUFVO0FBQUEsY0FDbEMsT0FBSyxVQUErQixLQUFLO0FBQUEsY0FDekMsT0FBTyxpQkFBaUIsVUFDdkIsT0FBTyxxQkFDTixTQUFTO0FBQUEsZ0JBQ1AsVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8saUJBQWlCO0FBQUEsZ0JBQzFGO0FBQUEsZ0JBQ0E7QUFBQSxjQUNGLEtBRUUsVUFBVSxjQUFjLGNBQWMsY0FBYztBQUFBLGdCQUNsRCxPQUFPO0FBQUEsY0FDVCxFQUNBLFVBQVUsTUFDYixTQUFTO0FBQUEsZ0JBQ1IsVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sWUFBWTtBQUFBLGdCQUNyRjtBQUFBLGdCQUNBO0FBQUEsY0FDRixLQUVJLFVBQVUsY0FBYyxjQUFjLGNBQWM7QUFBQSxnQkFDbEQsT0FBTztBQUFBLGNBQ1QsRUFDQSxVQUFVLEtBQ1YsS0FDQSxVQUFVLGNBQWMsY0FBYyxjQUFjLGNBQWMsT0FBTyxZQUFZLElBQ25GLE9BQUssVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sWUFBWSxFQUF1QixLQUFLLEtBQ3RIO0FBQUEsY0FDTixPQUFPLHFCQUNQLFVBQVUsY0FBYyxjQUFjLGNBQWMsY0FBYyxPQUFPLGlCQUFpQixLQUV4RixVQUFVLGNBQWMsY0FBYyxjQUFjO0FBQUEsZ0JBQ2xELE9BQU87QUFBQSxjQUNULEVBQ0EsVUFBVSxLQUNSLE9BRUksVUFBVSxjQUFjLGNBQWMsY0FBYztBQUFBLGdCQUNsRCxPQUFPO0FBQUEsY0FDVCxFQUNBLEtBQ0osS0FDQTtBQUFBLGNBQ0o7QUFBQSxZQUNGLENBQUM7QUFBQSxZQUNEO0FBQUEsVUFDRjtBQUVBO0FBQUEsTUFDSjtBQUVBLFVBQUksT0FBTyxXQUFXLEdBQUc7QUFDdkIsVUFBRSxTQUFTLEVBQUUsTUFBTSxPQUFPLGNBQWMsT0FBTyxjQUFjLGNBQWMsT0FBTyxVQUFVLGlCQUFpQjtBQUFBLE1BQy9HLE9BQU87QUFDTCxZQUFJLFNBQVMsa0JBQWtCLFdBQVc7QUFDeEMsb0JBQVUsT0FBTztBQUFBLFFBQ25CO0FBRUEsVUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO0FBQUEsTUFDdkI7QUFBQSxJQUNGLENBQUM7QUFFRCxRQUFJLFVBQVU7QUFFZCxVQUFNLFlBQVksU0FBUyxjQUFjLFFBQVE7QUFFakQsY0FBVSxpQkFBaUIsUUFBUSxDQUFDLFVBQVU7QUFDNUMsVUFBSSxTQUFTLGtCQUFrQixXQUFXO0FBQ3hDLGtCQUFVLE9BQU87QUFBQSxNQUNuQjtBQUFBLElBQ0YsQ0FBQztBQUVELGNBQVUsVUFBVSxJQUFJLFlBQVksMEJBQTBCLEtBQUssT0FBTyxVQUFVLElBQUksWUFBWTtBQUNwRyxjQUFVO0FBQUEsTUFDUjtBQUFBLE1BQ0EsT0FBTyxlQUNILE9BQU8sZUFDUDtBQUFBLElBQ047QUFFQSxVQUFNLGFBQWEsWUFBWTtBQUM3QixNQUFDLFVBQStCLFFBQVMsVUFBZ0M7QUFFekUsVUFBSTtBQUVKLGNBQVEsT0FBTyxXQUFXLFlBQVksR0FBRztBQUFBLFFBQ3ZDLEtBQUs7QUFDSCxtQkFBUztBQUFBLFlBQ04sTUFBTSxtQkFBbUIsU0FBUztBQUFBLGNBQ2pDLE9BQU8sVUFBVSxPQUFPLFVBQVU7QUFBQSxjQUNsQyxPQUFLLFVBQStCLEtBQUs7QUFBQSxjQUN6QztBQUFBLGNBQ0E7QUFBQSxZQUNGLENBQUM7QUFBQSxZQUNEO0FBQUEsVUFDRjtBQUVBO0FBQUEsUUFDRixLQUFLO0FBQ0gsbUJBQVUsTUFBTSxtQkFBbUIsU0FBUztBQUFBLFlBQzFDLE9BQU8sVUFBVSxPQUFPLFVBQVU7QUFBQSxZQUNsQztBQUFBLFlBQ0EsT0FBSyxVQUErQixLQUFLO0FBQUEsWUFDekM7QUFBQSxVQUNGLENBQUM7QUFFRDtBQUFBLFFBRUYsS0FBSztBQUNILG1CQUFTO0FBQUEsWUFDTixNQUFNLGdCQUFnQixTQUFTO0FBQUEsY0FDOUIsT0FBTyxVQUFVLE9BQU8sVUFBVTtBQUFBLGNBQ2xDLE9BQUssVUFBK0IsS0FBSztBQUFBLGNBQ3pDLE9BQU8saUJBQWlCLFVBQ3ZCLE9BQU8scUJBQ04sVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8saUJBQWlCLEtBRXhGLFVBQVUsY0FBYyxjQUFjLGNBQWM7QUFBQSxnQkFDbEQsT0FBTztBQUFBLGNBQ1QsRUFDQSxVQUFVLE1BQ2IsVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sWUFBWSxLQUVsRixVQUFVLGNBQWMsY0FBYyxjQUFjO0FBQUEsZ0JBQ2xELE9BQU87QUFBQSxjQUNULEVBQ0EsVUFBVSxLQUNWLEtBQ0EsVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sWUFBWSxJQUNuRixPQUFLLFVBQVUsY0FBYyxjQUFjLGNBQWMsY0FBYyxPQUFPLFlBQVksRUFBdUIsS0FBSyxLQUN0SDtBQUFBLGNBQ04sT0FBTyxxQkFDUCxVQUFVLGNBQWMsY0FBYyxjQUFjLGNBQWMsT0FBTyxpQkFBaUIsS0FFeEYsVUFBVSxjQUFjLGNBQWMsY0FBYztBQUFBLGdCQUNsRCxPQUFPO0FBQUEsY0FDVCxFQUNBLFVBQVUsS0FDUixPQUVJLFVBQVUsY0FBYyxjQUFjLGNBQWM7QUFBQSxnQkFDbEQsT0FBTztBQUFBLGNBQ1QsRUFDQSxLQUNKLEtBQ0E7QUFBQSxjQUNKO0FBQUEsWUFDRixDQUFDO0FBQUEsWUFDRDtBQUFBLFVBQ0Y7QUFFQTtBQUFBLE1BQ0o7QUFFQSxVQUFJLE9BQU8sV0FBVyxHQUFHO0FBQ3ZCO0FBQUEsTUFDRjtBQUVBLFVBQUssVUFBa0IsK0JBQStCO0FBRXBELG1CQUFXLFlBQWEsVUFBa0IsK0JBQStCO0FBQ3ZFLG1CQUFTLFFBQVEsU0FBUztBQUFBLFFBQzVCO0FBQUEsTUFDRjtBQUVBLFlBQU0sZUFBZSxPQUFPLFdBQVcsWUFBWTtBQUNuRCxZQUFNLFlBQVksVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sU0FBUztBQUVwRyxVQUFJLGlCQUFpQixXQUFXO0FBQzlCLFlBQUksV0FBVztBQUNiLFVBQUMsVUFBK0IsUUFDOUIsaUJBQWlCLGVBQ1osT0FBTyxDQUFDLEVBQTZCLGFBQ3JDLE9BQU8sQ0FBQyxFQUF1QjtBQUFBLFFBQ3hDO0FBQUEsTUFDRjtBQUdBLFlBQU0sVUFBVSxVQUFVLGNBQWMsY0FBYyxjQUFjO0FBQUEsUUFDbEUsT0FBTztBQUFBLE1BQ1Q7QUFFQSxVQUFJLFdBQVcsT0FBTyxxQkFBcUI7QUFFekMsUUFBQyxRQUFnQixnREFBZ0Q7QUFFakUsa0JBQVUsT0FBTztBQUNqQixnQkFBUSxNQUFNO0FBQ2QsZ0JBQVEsUUFBUSxzQkFBcUIsdUJBQXVCLHNCQUFxQixzQkFBc0IsRUFBRSxLQUFLO0FBQUEsTUFDaEg7QUFBQSxJQUVGO0FBRUEsY0FBVSxpQkFBaUIsVUFBVSxPQUFPLFVBQVU7QUFDcEQsaUJBQVc7QUFBQSxJQUNiLENBQUM7QUFFRCxjQUFVLGlCQUFpQixXQUFXLENBQUMsVUFBVTtBQUUvQyxVQUFJLFdBQVksVUFBa0IsK0NBQStDO0FBQy9FLGNBQU0sZ0JBQWdCO0FBQ3RCLGNBQU0sZUFBZTtBQUNyQixjQUFNLHlCQUF5QjtBQUFBLE1BQ2pDO0FBQUEsSUFDRixDQUFDO0FBR0QsY0FBVSxpQkFBaUIsU0FBUyxPQUFPLFVBQVU7QUFFbkQsVUFBSSxXQUFZLFVBQWtCLCtDQUErQztBQUMvRSxjQUFNLGdCQUFnQjtBQUN0QixjQUFNLGVBQWU7QUFDckIsY0FBTSx5QkFBeUI7QUFFL0I7QUFBQSxNQUNGO0FBRUEsWUFBTSxNQUFNLFNBQVMsUUFBdUIsT0FBTyxhQUFhLEVBQUU7QUFDbEUsWUFBTSxZQUFZLFVBQVUsY0FBYyxjQUFjLGNBQWMsY0FBYyxPQUFPLFNBQVM7QUFFcEcsVUFBSSxJQUFJLFdBQVcsS0FBSyxRQUFRLGVBQWUsUUFBUSxVQUFVO0FBQy9EO0FBQUEsTUFDRjtBQUVBLFVBQUksUUFBUSxXQUFXLFFBQVEsU0FBUztBQUN0QyxtQkFBVztBQUFBLE1BQ2I7QUFFQSxVQUFJO0FBRUosY0FBUSxPQUFPLFdBQVcsWUFBWSxHQUFHO0FBQUEsUUFDdkMsS0FBSztBQUNILG1CQUFTO0FBQUEsWUFDTixNQUFNLG1CQUFtQixTQUFTO0FBQUEsY0FDakMsT0FBTyxVQUFVLE9BQU8sVUFBVTtBQUFBLGNBQ2xDLE9BQUssVUFBK0IsS0FBSztBQUFBLGNBQ3pDO0FBQUEsY0FDQTtBQUFBLFlBQ0YsQ0FBQztBQUFBLFlBQ0Q7QUFBQSxVQUNGO0FBRUE7QUFBQSxRQUNGLEtBQUs7QUFDSCxtQkFBVSxNQUFNLG1CQUFtQixTQUFTO0FBQUEsWUFDMUMsT0FBTyxVQUFVLE9BQU8sVUFBVTtBQUFBLFlBQ2xDO0FBQUEsWUFDQSxPQUFLLFVBQStCLEtBQUs7QUFBQSxZQUN6QztBQUFBLFVBQ0YsQ0FBQztBQUVEO0FBQUEsUUFFRixLQUFLO0FBQ0gsbUJBQVM7QUFBQSxZQUNOLE1BQU0sZ0JBQWdCLFNBQVM7QUFBQSxjQUM5QixPQUFPLFVBQVUsT0FBTyxVQUFVO0FBQUEsY0FDbEMsT0FBSyxVQUErQixLQUFLO0FBQUEsY0FDekMsT0FBTyxpQkFBaUIsVUFDdkIsT0FBTyxxQkFDTixVQUFVLGNBQWMsY0FBYyxjQUFjLGNBQWMsT0FBTyxpQkFBaUIsS0FFeEYsVUFBVSxjQUFjLGNBQWMsY0FBYztBQUFBLGdCQUNsRCxPQUFPO0FBQUEsY0FDVCxFQUNBLFVBQVUsTUFDYixVQUFVLGNBQWMsY0FBYyxjQUFjLGNBQWMsT0FBTyxZQUFZLEtBRWxGLFVBQVUsY0FBYyxjQUFjLGNBQWM7QUFBQSxnQkFDbEQsT0FBTztBQUFBLGNBQ1QsRUFDQSxVQUFVLEtBQ1YsS0FDQSxVQUFVLGNBQWMsY0FBYyxjQUFjLGNBQWMsT0FBTyxZQUFZLElBQ25GLE9BQUssVUFBVSxjQUFjLGNBQWMsY0FBYyxjQUFjLE9BQU8sWUFBWSxFQUF1QixLQUFLLEtBQ3RIO0FBQUEsY0FDTixPQUFPLHFCQUNQLFVBQVUsY0FBYyxjQUFjLGNBQWMsY0FBYyxPQUFPLGlCQUFpQixLQUV4RixVQUFVLGNBQWMsY0FBYyxjQUFjO0FBQUEsZ0JBQ2xELE9BQU87QUFBQSxjQUNULEVBQ0EsVUFBVSxLQUNSLE9BRUksVUFBVSxjQUFjLGNBQWMsY0FBYztBQUFBLGdCQUNsRCxPQUFPO0FBQUEsY0FDVCxFQUNBLEtBQ0osS0FDQTtBQUFBLGNBQ0o7QUFBQSxZQUNGLENBQUM7QUFBQSxZQUNEO0FBQUEsVUFDRjtBQUVBO0FBQUEsTUFDSjtBQUVBLFVBQUksT0FBTyxXQUFXLEtBQU0sT0FBTyxDQUFDLEVBQVUsUUFBUTtBQUNwRDtBQUFBLE1BQ0Y7QUFFQSxVQUFJLE9BQU8sV0FBVyxHQUFHO0FBRXZCLFlBQUssT0FBTyxDQUFDLEVBQXdCLE9BQU87QUFDMUM7QUFBQSxRQUNGO0FBRUEsUUFBQyxVQUErQixRQUFRLE9BQU8sQ0FBQyxFQUFFLG9CQUFvQjtBQUV0RSxjQUFNLGVBQWUsT0FBTyxXQUFXLFlBQVk7QUFFbkQsWUFBSSxpQkFBaUIsV0FBVztBQUM5QixjQUFJLFdBQVc7QUFDYixZQUFDLFVBQStCLFFBQzlCLGlCQUFpQixlQUNaLE9BQU8sQ0FBQyxFQUE2QixhQUNyQyxPQUFPLENBQUMsRUFBdUI7QUFBQSxVQUN4QztBQUFBLFFBQ0Y7QUFHQSxrQkFBVTtBQUVWLGtCQUFVLE9BQU87QUFFakIsY0FBTSxVQUFVLFVBQVUsY0FBYyxjQUFjLGNBQWM7QUFBQSxVQUNsRSxPQUFPO0FBQUEsUUFDVDtBQUVBLG1CQUFXLE1BQU07QUFDZixvQkFBVTtBQUVWLGNBQUksT0FBTyxxQkFBcUI7QUFFOUIsWUFBQyxRQUFnQixnREFBZ0Q7QUFBQSxVQUNuRTtBQUFBLFFBQ0YsR0FBRyxHQUFJO0FBR1AsWUFBSSxXQUFXLE9BQU8scUJBQXFCO0FBRXpDLFVBQUMsUUFBZ0IsZ0RBQWdEO0FBRWpFLG9CQUFVLE9BQU87QUFDakIsa0JBQVEsTUFBTTtBQUNkLGtCQUNHLFFBQVEsc0JBQXFCLHVCQUF1QixzQkFBcUIsc0JBQXNCLEVBQy9GLEtBQUs7QUFBQSxRQUNWO0FBQUEsTUFFRjtBQUVBLFVBQUksT0FBTyxTQUFTLEdBQUc7QUFDckIsa0JBQVUsWUFBWTtBQUV0QixtQkFBVyxXQUFXLFFBQVE7QUFDNUIsb0JBQVUsUUFBUSxJQUFJLElBQUksT0FBTyxRQUFRLG9CQUFvQixHQUFHLFFBQVEsb0JBQW9CLENBQUMsQ0FBQztBQUFBLFFBQ2hHO0FBRUEsa0JBQVUsY0FBYyxZQUFZLFNBQVM7QUFBQSxNQUMvQztBQUFBLElBRUYsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUtBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFjLGNBQXVCLE1BQU07QUFDekMsYUFBTyxPQUFPLE1BQU0sc0JBQXNCLHdCQUF3QixzQkFBcUIsYUFBYTtBQUFBLElBQ3RHLEdBQUc7QUFBQTtBQUFBO0FBRUw7QUF4YWdCO0FBQUEsRUFEYixJQUFJO0FBQUEsRUFFRiwyQkFBUSxJQUFJLG1DQUFtQztBQUFBLEVBQy9DLHdCQUFLO0FBQUEsSUFDSjtBQUFBLElBQ0E7QUFBQSxFQUNGO0FBQUEsRUFDQyx5QkFBTSxJQUFJLHFCQUFxQixTQUFTO0FBQUEsRUFDeEMseUJBQU0sSUFBSSxzQ0FBc0MsWUFBWTtBQUFBLEVBQzVELHlCQUFNLElBQUksTUFBTSxPQUFPLGFBQWEsY0FBYztBQUFBLEVBQ2xELHlCQUFNLElBQUksTUFBTSxPQUFPLGFBQWEsbUJBQW1CO0FBQUEsRUFDdkQseUJBQU0sSUFBSSxNQUFNLE9BQU8sYUFBYSxxQkFBcUI7QUFBQSxFQUd6RCw0QkFBUyxJQUFJLGtCQUFrQiw4REFBOEQ7QUFBQSxFQUM3RixzQkFBRyxJQUFJLFFBQVEsT0FBTyxRQUFRLDJDQUE0QztBQUFBLEdBN0RsRSx1QkErQ0c7QUEvQ1QsSUFBTSx1QkFBTjtBQXlkUCxPQUFPLE1BQU07QUFBQSxFQUNYO0FBQUEsRUFDQSxxQkFBcUIsY0FBYyxLQUFLLG9CQUFvQjtBQUM5RDsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2ZjX2Zvcm1fcmVuZGVyZXIiXQp9Cg==
