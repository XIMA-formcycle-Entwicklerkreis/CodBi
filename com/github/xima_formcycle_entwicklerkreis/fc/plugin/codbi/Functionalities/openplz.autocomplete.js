import {
  removeDuplicates
} from "./chunk-DGTDURHA.js";
import "./chunk-QGX5JPGQ.js";
import "./chunk-RSH3LX4Y.js";
import {
  INSTANCE
} from "./chunk-4PFSMFDI.js";
import {
  require_dist
} from "./chunk-2R3WETV4.js";
import "./chunk-MQ6BYLTP.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/openplz.autocomplete.ts
var import_fc_form_renderer3 = __toESM(require_dist(), 1);

// src/js/EPs/openplz.streets.ts
var import_fc_form_renderer2 = __toESM(require_dist(), 1);

// src/js/EPs/openplz.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var OpenPLZ = class _OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  static retrieve(params) {
    return new Promise((resolve, reject) => {
      (0, import_fc_form_renderer.getJQuery)().ajax({
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
          "X-PagesToLoad": params[8] ? params[8].toString() : void 0
        }
      }).done((response) => {
        resolve(JSON.parse(response));
      });
    });
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("OpenPLZ", _OpenPLZ.retrieve);
    })();
  }
  // #region Initialization
};

// src/js/EPs/openplz.streets.ts
var OpenPLZ_Streets = class _OpenPLZ_Streets extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  static retrieve(params) {
    return OpenPLZ.retrieve([
      params[0] ? params[0] : "",
      "Streets",
      "",
      "",
      `name-${params[1].replace(/^/, "\xB0")}`,
      params.length >= 4 ? `locality-${params[3].replace(/^/, "\xB0")}` : `postalCode-${params[2].replace(/^/, "\xB0")}`,
      "",
      "",
      params[4] ? params[4] : ""
    ]);
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ_Streets } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("OpenPLZ.Streets", _OpenPLZ_Streets.retrieve);
    })();
  }
  // #region Initialization
};

// src/js/EPs/openplz.localities.ts
var OpenPLZ_Localities = class _OpenPLZ_Localities extends OpenPLZ {
  /**
   * Retrieves the localities found according to the provided **params**.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
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
      params[3] ? params[3] : ""
    ]);
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ_Localities } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("OpenPLZ.Localities", _OpenPLZ_Localities.retrieve);
    })();
  }
  // #region Initialization
};

// src/js/Functionalities/openplz.autocomplete.ts
var _OpenPLZ_Autocomplete = class _OpenPLZ_Autocomplete {
  static {
    /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
     *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
    this.kfFocusOnAutocomplete = [
      {
        transform: "scale(1)"
      },
      {
        transform: "scale(1.5)",
        boxShadow: "0 0 10em darkorange",
        borderColor: "darkorange"
      },
      {
        transform: "scale(1)",
        boxShadow: "0 0 0em darkorange",
        borderColor: "unset"
      }
    ];
  }
  static {
    /** Store the {@link PropertyIndexedKeyframes } to use to animate the {@link HTMLElement }
     *  specified by the **FocusOnAutocomplete**-CodBi-Parameter. */
    this.tmgFocusOnAutocomplete = {
      duration: 500,
      iterations: 1,
      easing: "ease-out",
      fill: "forwards"
    };
  }
  static functionality(toLoad, toProcess) {
    const targetResultProperty = toLoad.targetdata.toLowerCase() === "localities" || toLoad.targetdata.toLowerCase() === "streets" ? "name" : "postalCode";
    toProcess.addEventListener("blur", async (event) => {
      const $ = (0, import_fc_form_renderer3.getJQuery)();
      let result;
      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            `\xB0${toProcess.value}`,
            "",
            1
          ]);
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 || toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" || toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentplz
              ).value === "" ? "" : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}` : "",
              toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value}` : "",
              1
            ]),
            "name"
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
      toLoad.cssproposals ? toLoad.cssproposals : "margin-top: .5em ; max-width: 100% ; border-color: darkorange ; border-radius: .5em ; box-shadow: 0 0 .5em darkorange ; color: green ; font-weight: bolder ; cursor: pointer;"
    );
    const onSelected = async () => {
      toProcess.value = proposals.value;
      let result;
      switch (toLoad.targetdata.toLowerCase()) {
        case "localities":
          result = removeDuplicates(
            await OpenPLZ_Localities.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              "",
              1
            ]),
            "name"
          );
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 || toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" || toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentplz
              ).value === "" ? "" : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}` : "",
              toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value}` : "",
              1
            ]),
            "name"
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
      const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
        toLoad.focusonautocomplete
      );
      if (toFocus && toLoad.focusonautocomplete) {
        toFocus.CodBi_OpenPLZ_Autocomplete_BlockedByDependent = true;
        proposals.remove();
        toFocus.focus();
        toFocus.animate(_OpenPLZ_Autocomplete.kfFocusOnAutocomplete, _OpenPLZ_Autocomplete.tmgFocusOnAutocomplete).play();
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
            await OpenPLZ_Localities.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              "",
              1
            ]),
            "name"
          );
          break;
        case "postalcodes":
          result = await OpenPLZ_Localities.retrieve([
            toLoad.country ? toLoad.country : "",
            ".*",
            `\xB0${toProcess.value}`,
            1
          ]);
          break;
        case "streets":
          result = removeDuplicates(
            await OpenPLZ_Streets.retrieve([
              toLoad.country ? toLoad.country : "",
              `\xB0${toProcess.value}`,
              toLoad.dependentplz === void 0 || toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" || toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentplz
              ).value === "" ? "" : toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz) ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentplz).value}` : "",
              toLoad.dependentlocality && toProcess.parentElement.parentElement.parentElement.querySelector(toLoad.dependentlocality) && toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value !== "" ? `\xB0${toProcess.parentElement.parentElement.parentElement.querySelector(
                toLoad.dependentlocality
              ).value}` : "",
              1
            ]),
            "name"
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
        const toFocus = toProcess.parentElement.parentElement.parentElement.querySelector(
          toLoad.focusonautocomplete
        );
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
          toFocus.animate(_OpenPLZ_Autocomplete.kfFocusOnAutocomplete, _OpenPLZ_Autocomplete.tmgFocusOnAutocomplete).play();
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
__decorateClass([
  DBC.ParamvalueProvider
], _OpenPLZ_Autocomplete, "functionality", 1);
var OpenPLZ_Autocomplete = _OpenPLZ_Autocomplete;
export {
  OpenPLZ_Autocomplete
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9vcGVucGx6LmF1dG9jb21wbGV0ZS50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvZm9ybS9zcmMvanMvRVBzL29wZW5wbHouc3RyZWV0cy50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvcGFja2FnZXMvZm9ybS9zcmMvanMvRVBzL29wZW5wbHoudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9vcGVucGx6LmxvY2FsaXRpZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IERCQyB9IGZyb20gXCJ4ZGJjL3NyYy9EQkNcIjtcbmltcG9ydCB7IElOU1RBTkNFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JTlNUQU5DRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjcmVnaW9uIEVsZW1lbnRwbGFjZWhvbGRlclxuaW1wb3J0IHsgT3BlblBMWl9TdHJlZXRzIH0gZnJvbSBcIi4uL0VQcy9vcGVucGx6LnN0cmVldHNcIjtcbmltcG9ydCB7IE9wZW5QTFpfTG9jYWxpdGllcyB9IGZyb20gXCIuLi9FUHMvb3BlbnBsei5sb2NhbGl0aWVzXCI7XG5pbXBvcnQgeyByZW1vdmVEdXBsaWNhdGVzIH0gZnJvbSBcIi4vbGRhcC5hdXRvY29tcGxldGVcIjtcbi8vICNlbmRyZWdpb24gRWxlbWVudHBsYWNlaG9sZGVyXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBPcGVuUExaX0F1dG9jb21wbGV0ZS5mdW5jdGlvbmFsaXR5IH0uXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbi8vIGJpb21lLWlnbm9yZSBsaW50L2NvbXBsZXhpdHkvbm9TdGF0aWNPbmx5Q2xhc3M6IFByb2FjdGl2ZSBEZXNpZ24uXG5leHBvcnQgY2xhc3MgT3BlblBMWl9BdXRvY29tcGxldGUge1xuICAvKiogU3RvcmUgdGhlIHtAbGluayBQcm9wZXJ0eUluZGV4ZWRLZXlmcmFtZXMgfSB0byB1c2UgdG8gYW5pbWF0ZSB0aGUge0BsaW5rIEhUTUxFbGVtZW50IH1cbiAgICogIHNwZWNpZmllZCBieSB0aGUgKipGb2N1c09uQXV0b2NvbXBsZXRlKiotQ29kQmktUGFyYW1ldGVyLiAqL1xuICBwcm90ZWN0ZWQgc3RhdGljIGtmRm9jdXNPbkF1dG9jb21wbGV0ZTogS2V5ZnJhbWVbXSA9IFtcbiAgICB7XG4gICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMSlcIixcbiAgICB9LFxuICAgIHtcbiAgICAgIHRyYW5zZm9ybTogXCJzY2FsZSgxLjUpXCIsXG4gICAgICBib3hTaGFkb3c6IFwiMCAwIDEwZW0gZGFya29yYW5nZVwiLFxuICAgICAgYm9yZGVyQ29sb3I6IFwiZGFya29yYW5nZVwiLFxuICAgIH0sXG5cbiAgICB7XG4gICAgICB0cmFuc2Zvcm06IFwic2NhbGUoMSlcIixcbiAgICAgIGJveFNoYWRvdzogXCIwIDAgMGVtIGRhcmtvcmFuZ2VcIixcbiAgICAgIGJvcmRlckNvbG9yOiBcInVuc2V0XCIsXG4gICAgfSxcbiAgXTtcbiAgLyoqIFN0b3JlIHRoZSB7QGxpbmsgUHJvcGVydHlJbmRleGVkS2V5ZnJhbWVzIH0gdG8gdXNlIHRvIGFuaW1hdGUgdGhlIHtAbGluayBIVE1MRWxlbWVudCB9XG4gICAqICBzcGVjaWZpZWQgYnkgdGhlICoqRm9jdXNPbkF1dG9jb21wbGV0ZSoqLUNvZEJpLVBhcmFtZXRlci4gKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyB0bWdGb2N1c09uQXV0b2NvbXBsZXRlOiBLZXlmcmFtZUFuaW1hdGlvbk9wdGlvbnMgPSB7XG4gICAgZHVyYXRpb246IDUwMCxcbiAgICBpdGVyYXRpb25zOiAxLFxuICAgIGVhc2luZzogXCJlYXNlLW91dFwiLFxuICAgIGZpbGw6IFwiZm9yd2FyZHNcIixcbiAgfTtcbiAgLyoqXG4gICAqIFJlZ2lzdGVycyB0aGUgXCJMREFQLkF1dG9jb21wbGV0ZVwiLUZ1bmN0aW9uYWxpdHkuXG4gICAqXG4gICAqIFRoaXMgZnVuY3Rpb25hbGl0aWVzIHRha2VzIGFkdmFudGFnZSBvZiB0aGUge0BsaW5rIExEQVBfRmluZH0gRWxlbWVudHBsYWNlaG9sZGVyIHRvIGNvbXBsZXRlIHdoYXQgaXMgdHlwZWQgaW50b1xuICAgKiB0aGUgdGFnZ2VkIHtAbGluayBIVE1MSW5wdXRFbGVtZW50IH0gd2l0aCBkYXRhIGZyb20gYSBjb25uZWN0ZWQgRm9ybWN5Y2xlIHByZWRlZmluZWQgTERBUC1RdWVyeSBhY2NvcmRpbmdcbiAgICogdG8gdGhlIHtAbGluayBMREFQX0ZpbmQgfSBzcGVjaWZpY2F0aW9ucy5cbiAgICogSXQgc3VnZ2VzdHMgY29tcGxldGlvbnMgYXMgc29vbiBhcyB0aGVyZSBhcmUgbXVsdGlwbGUgbWF0Y2hlcyBhbmQgb25seSBhbGxvd3MgZW50cmllcyB0aGF0IG1hdGNoIGV4YWN0bHkgb25lXG4gICAqIExEQVAtRW50cnkuXG4gICAqXG4gICAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIENvdW50cnk6ICAgICAgICAgICAgVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gICAqICAtIFRhcmdldERhdGE6ICAgICAgICAgV2hhdCB0eXBlIG9mIGRhdGEgc2hhbGwgYmUgcmVjZWl2ZWQgYnkgdGhlIHRhcmdldCAoTG9jYWxpdGllcywgUG9zdGFsQ29kZSBvciBTdHJlZXRzICkuXG4gICAqICAtIERlcGVuZGVudDogICAgICAgICAgVGhlIENTUy1TZWxlY3RvciBvZiB0aGUgZmllbGQgdGhhdCBhdXRvbWF0aWNhbGx5IHdpbGwgYmUgZmlsbGVkIGFjY29yZGluZ2x5IGlmIGVpdGhlciBhXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgcG9zdGFsLWNvZGUgb3IgYSBsb2NhbGl0eSBoYXMgYmVlbiBmb3VuZC5cbiAgICogIC0gRGVwZW5kZW50UExaICAgICAgICBUaGUgQ1NTLVNlbGVjdG9yIG9mIHRoZSBmaWVsZCB0aGF0IHJlc3RyaWN0cyB0aGUgc2VhcmNoIG9mIHN0cmVldHMgYnkgaXQncyB2YWx1ZSByZXNlbWJsaW5nIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBwb3N0YWwtY29kZSwgb25seSBpZiAqKkRlcGVuZGVudExvY2FsaXR5KiogaXMgKip1bmRlZmluZWQqKi5cbiAgICogIC0gRGVwZW5kZW50TG9jYWxpdHkgICBUaGUgQ1NTLVNlbGVjdG9yIG9mIHRoZSBmaWVsZCB0aGF0IHJlc3RyaWN0cyB0aGUgc2VhcmNoIG9mIHN0cmVldHMgYnkgaXQncyB2YWx1ZSByZXNlbWJsaW5nIGFcbiAgICogICAgICAgICAgICAgICAgICAgICAgICBsb2NhbGl0eSAob3ZlcndyaXRlcyAqKkRlcGVuZGVudFBMWioqKS5cbiAgICogIC0gRm9jdXNPbkF1dG9jb21wbGV0ZSBUaGUgQ1NTLVNlbGVjdG9yIG9mIHRoZSBmaWVsZCB0byBmb2N1cyB3aGVuIGFuIGF1dG9jb21wbGV0ZSBoYXMgb2NjdXJlZC5cbiAgICogIC0gTXNnTm90S25vd246ICAgICAgICBUaGUgbWVzc2FnZSB0byBzaG93IHdoZW4gdHJ5aW5nIHRvIHNldCBhIHZhbHVlIHRoYXQgY2FuJ3QgYmUgZm91bmQgaW4gT3BlblBMWi5cbiAgICogIC0gQ1NTUHJvcG9zYWxzOiAgICAgICBUaGUgQ1NTLVN0eWxlIGZvciB0aGUgcHJvcG9zYWxzLVNlbGVjdC1FbGVtZW50IGFwcGVhcmluZyB3aGVuIHRoZXJlIGFyZSBtdWx0aXBsZSBtYXRjaGVzLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkodG9Mb2FkOiB7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9LCB0b1Byb2Nlc3M6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICBjb25zdCB0YXJnZXRSZXN1bHRQcm9wZXJ0eSA9XG4gICAgICB0b0xvYWQudGFyZ2V0ZGF0YS50b0xvd2VyQ2FzZSgpID09PSBcImxvY2FsaXRpZXNcIiB8fCB0b0xvYWQudGFyZ2V0ZGF0YS50b0xvd2VyQ2FzZSgpID09PSBcInN0cmVldHNcIlxuICAgICAgICA/IFwibmFtZVwiXG4gICAgICAgIDogXCJwb3N0YWxDb2RlXCI7XG4gICAgLy8gI3JlZ2lvbiBSZW1vdmUgZW50cmllcyB0aGF0J3JlIG5vdCBpbiBMREFQLlxuICAgIHRvUHJvY2Vzcy5hZGRFdmVudExpc3RlbmVyKFwiYmx1clwiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxuICAgICAgbGV0IHJlc3VsdDogQXJyYXk8dW5rbm93bj47XG5cbiAgICAgIHN3aXRjaCAodG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwibG9jYWxpdGllc1wiOlxuICAgICAgICAgIHJlc3VsdCA9IChhd2FpdCBPcGVuUExaX0xvY2FsaXRpZXMucmV0cmlldmUoW1xuICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICBgXHUwMEIwJHsodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlfWAsXG4gICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj47XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInBvc3RhbGNvZGVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gKGF3YWl0IE9wZW5QTFpfTG9jYWxpdGllcy5yZXRyaWV2ZShbXG4gICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgIFwiLipcIixcbiAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+O1xuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcInN0cmVldHNcIjpcbiAgICAgICAgICByZXN1bHQgPSByZW1vdmVEdXBsaWNhdGVzKFxuICAgICAgICAgICAgKGF3YWl0IE9wZW5QTFpfU3RyZWV0cy5yZXRyaWV2ZShbXG4gICAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgICBgXHUwMEIwJHsodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlfWAsXG4gICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRwbHogPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgICAodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5ICYmXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICApLnZhbHVlICE9PSBcIlwiKSB8fFxuICAgICAgICAgICAgICAodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgJiZcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseixcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICAgICAgOiB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KVxuICAgICAgICAgICAgICAgICAgPyBgXHUwMEIwJHsodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YFxuICAgICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCJcbiAgICAgICAgICAgICAgICA/IGBcdTAwQjAke1xuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICkudmFsdWVcbiAgICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IodG9Mb2FkLm1zZ25vdGtub3duID8gdG9Mb2FkLm1zZ25vdGtub3duIDogYE9ubHkga25vd24gJHt0b0xvYWQudGFyZ2V0ZGF0YX0gYXJlIHBlcm1pdHRlZC5gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChkb2N1bWVudC5hY3RpdmVFbGVtZW50ICE9PSBwcm9wb3NhbHMpIHtcbiAgICAgICAgICBwcm9wb3NhbHMucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAkKHRvUHJvY2VzcykuZXJyb3IoXCJcIik7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgZW50cmllcyB0aGF0J3JlIG5vdCBpbiBMREFQLlxuICAgIGxldCBibG9ja2VkID0gZmFsc2U7XG4gICAgLy8gI3JlZ2lvbiBDcmVhdGUgU2VsZWN0aW9uLlxuICAgIGNvbnN0IHByb3Bvc2FscyA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzZWxlY3RcIik7XG5cbiAgICBwcm9wb3NhbHMuYWRkRXZlbnRMaXN0ZW5lcihcImJsdXJcIiwgKGV2ZW50KSA9PiB7XG4gICAgICBpZiAoZG9jdW1lbnQuYWN0aXZlRWxlbWVudCAhPT0gdG9Qcm9jZXNzKSB7XG4gICAgICAgIHByb3Bvc2Fscy5yZW1vdmUoKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIHByb3Bvc2Fscy5jbGFzc0xpc3QuYWRkKFwiLS0tQ29kQmlcIiwgXCItLU9wZW5QTFpfQXV0b2NvbXBsZXRlXCIsIGAtLSR7dG9Mb2FkLnRhcmdldGRhdGF9YCwgXCItUHJvcG9zYWxzXCIpO1xuICAgIHByb3Bvc2Fscy5zZXRBdHRyaWJ1dGUoXG4gICAgICBcInN0eWxlXCIsXG4gICAgICB0b0xvYWQuY3NzcHJvcG9zYWxzXG4gICAgICAgID8gdG9Mb2FkLmNzc3Byb3Bvc2Fsc1xuICAgICAgICA6IFwibWFyZ2luLXRvcDogLjVlbSA7IG1heC13aWR0aDogMTAwJSA7IGJvcmRlci1jb2xvcjogZGFya29yYW5nZSA7IGJvcmRlci1yYWRpdXM6IC41ZW0gOyBib3gtc2hhZG93OiAwIDAgLjVlbSBkYXJrb3JhbmdlIDsgY29sb3I6IGdyZWVuIDsgZm9udC13ZWlnaHQ6IGJvbGRlciA7IGN1cnNvcjogcG9pbnRlcjtcIixcbiAgICApO1xuICAgIC8vICNyZWdpb24gSGFuZGxlIFNlbGVjdGlvbi5cbiAgICBjb25zdCBvblNlbGVjdGVkID0gYXN5bmMgKCkgPT4ge1xuICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9IChwcm9wb3NhbHMgYXMgSFRNTFNlbGVjdEVsZW1lbnQpLnZhbHVlO1xuXG4gICAgICBsZXQgcmVzdWx0OiBBcnJheTx1bmtub3duPjtcblxuICAgICAgc3dpdGNoICh0b0xvYWQudGFyZ2V0ZGF0YS50b0xvd2VyQ2FzZSgpKSB7XG4gICAgICAgIGNhc2UgXCJsb2NhbGl0aWVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gcmVtb3ZlRHVwbGljYXRlcyhcbiAgICAgICAgICAgIChhd2FpdCBPcGVuUExaX0xvY2FsaXRpZXMucmV0cmlldmUoW1xuICAgICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgICAgYFx1MDBCMCR7KHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gLFxuICAgICAgICAgICAgICBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIFwicG9zdGFsY29kZXNcIjpcbiAgICAgICAgICByZXN1bHQgPSAoYXdhaXQgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKFtcbiAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgXCIuKlwiLFxuICAgICAgICAgICAgYFx1MDBCMCR7KHRvUHJvY2VzcyBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gLFxuICAgICAgICAgICAgMSxcbiAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj47XG5cbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlIFwic3RyZWV0c1wiOlxuICAgICAgICAgIHJlc3VsdCA9IHJlbW92ZUR1cGxpY2F0ZXMoXG4gICAgICAgICAgICAoYXdhaXQgT3BlblBMWl9TdHJlZXRzLnJldHJpZXZlKFtcbiAgICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseiA9PT0gdW5kZWZpbmVkIHx8XG4gICAgICAgICAgICAgICh0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkpICYmXG4gICAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCIpIHx8XG4gICAgICAgICAgICAgICh0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50cGx6LFxuICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgKS52YWx1ZSA9PT0gXCJcIilcbiAgICAgICAgICAgICAgICA/IFwiXCJcbiAgICAgICAgICAgICAgICA6IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnRwbHopXG4gICAgICAgICAgICAgICAgICA/IGBcdTAwQjAkeyh0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gXG4gICAgICAgICAgICAgICAgICA6IFwiXCIsXG4gICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSAmJlxuICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkpICYmXG4gICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgKS52YWx1ZSAhPT0gXCJcIlxuICAgICAgICAgICAgICAgID8gYFx1MDBCMCR7XG4gICAgICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRsb2NhbGl0eSxcbiAgICAgICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICAgICAgKS52YWx1ZVxuICAgICAgICAgICAgICAgICAgfWBcbiAgICAgICAgICAgICAgICA6IFwiXCIsXG4gICAgICAgICAgICAgIDEsXG4gICAgICAgICAgICBdKSkgYXMgQXJyYXk8dW5rbm93bj4sXG4gICAgICAgICAgICBcIm5hbWVcIixcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnJlYWs7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgYW55KS5jb2RiaU9wZW5QTFpTZXRNYXRjaExpc3RlbmVycykge1xuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgZm9yIChjb25zdCBsaXN0ZW5lciBvZiAodG9Qcm9jZXNzIGFzIGFueSkuY29kYmlPcGVuUExaU2V0TWF0Y2hMaXN0ZW5lcnMpIHtcbiAgICAgICAgICBsaXN0ZW5lcihyZXN1bHQsIHRvUHJvY2Vzcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIC8vICNyZWdpb24gU2V0IGRlcGVuZGVudCwgaWYgYXZhaWxhYmxlLlxuICAgICAgY29uc3QgdGNUYXJnZXREYXRhID0gdG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKTtcbiAgICAgIGNvbnN0IGRlcGVuZGVudCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnQpO1xuXG4gICAgICBpZiAodGNUYXJnZXREYXRhICE9PSBcInN0cmVldHNcIikge1xuICAgICAgICBpZiAoZGVwZW5kZW50KSB7XG4gICAgICAgICAgKGRlcGVuZGVudCBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9XG4gICAgICAgICAgICB0Y1RhcmdldERhdGEgPT09IFwibG9jYWxpdGllc1wiXG4gICAgICAgICAgICAgID8gKHJlc3VsdFswXSBhcyB7IHBvc3RhbENvZGU6IHN0cmluZyB9KS5wb3N0YWxDb2RlXG4gICAgICAgICAgICAgIDogKHJlc3VsdFswXSBhcyB7IG5hbWU6IHN0cmluZyB9KS5uYW1lO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIFNldCBkZXBlbmRlbnQsIGlmIGF2YWlsYWJsZS5cbiAgICAgIC8vICNyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgY29uc3QgdG9Gb2N1cyA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICB0b0xvYWQuZm9jdXNvbmF1dG9jb21wbGV0ZSxcbiAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgIGlmICh0b0ZvY3VzICYmIHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgICAodG9Gb2N1cyBhcyBhbnkpLkNvZEJpX09wZW5QTFpfQXV0b2NvbXBsZXRlX0Jsb2NrZWRCeURlcGVuZGVudCA9IHRydWU7XG5cbiAgICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgICB0b0ZvY3VzLmZvY3VzKCk7XG4gICAgICAgIHRvRm9jdXMuYW5pbWF0ZShPcGVuUExaX0F1dG9jb21wbGV0ZS5rZkZvY3VzT25BdXRvY29tcGxldGUsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLnRtZ0ZvY3VzT25BdXRvY29tcGxldGUpLnBsYXkoKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgIH07XG5cbiAgICBwcm9wb3NhbHMuYWRkRXZlbnRMaXN0ZW5lcihcImNoYW5nZVwiLCBhc3luYyAoZXZlbnQpID0+IHtcbiAgICAgIG9uU2VsZWN0ZWQoKTtcbiAgICB9KTtcblxuICAgIHRvUHJvY2Vzcy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCAoZXZlbnQpID0+IHtcbiAgICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxuICAgICAgaWYgKGJsb2NrZWQgfHwgKHRvUHJvY2VzcyBhcyBhbnkpLkNvZEJpX09wZW5QTFpfQXV0b2NvbXBsZXRlX0Jsb2NrZWRCeURlcGVuZGVudCkge1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcEltbWVkaWF0ZVByb3BhZ2F0aW9uKCk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgU2VsZWN0aW9uLlxuICAgIC8vICNlbmRyZWdpb24gQ3JlYXRlIFNlbGVjdGlvbi5cbiAgICB0b1Byb2Nlc3MuYWRkRXZlbnRMaXN0ZW5lcihcImtleXVwXCIsIGFzeW5jIChldmVudCkgPT4ge1xuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICBpZiAoYmxvY2tlZCB8fCAodG9Qcm9jZXNzIGFzIGFueSkuQ29kQmlfT3BlblBMWl9BdXRvY29tcGxldGVfQmxvY2tlZEJ5RGVwZW5kZW50KSB7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24oKTtcblxuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGtleSA9IElOU1RBTkNFLnRzQ2hlY2s8S2V5Ym9hcmRFdmVudD4oZXZlbnQsIEtleWJvYXJkRXZlbnQpLmtleTtcbiAgICAgIGNvbnN0IGRlcGVuZGVudCA9IHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKHRvTG9hZC5kZXBlbmRlbnQpO1xuXG4gICAgICBpZiAoa2V5Lmxlbmd0aCAhPT0gMSAmJiBrZXkgIT09IFwiQmFja3NwYWNlXCIgJiYga2V5ICE9PSBcIkRlbGV0ZVwiKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKGtleSA9PT0gXCJFbnRlclwiIHx8IGtleSA9PT0gXCJTcGFjZVwiKSB7XG4gICAgICAgIG9uU2VsZWN0ZWQoKTtcbiAgICAgIH1cblxuICAgICAgbGV0IHJlc3VsdDogQXJyYXk8dW5rbm93bj47XG5cbiAgICAgIHN3aXRjaCAodG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKSkge1xuICAgICAgICBjYXNlIFwibG9jYWxpdGllc1wiOlxuICAgICAgICAgIHJlc3VsdCA9IHJlbW92ZUR1cGxpY2F0ZXMoXG4gICAgICAgICAgICAoYXdhaXQgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKFtcbiAgICAgICAgICAgICAgdG9Mb2FkLmNvdW50cnkgPyB0b0xvYWQuY291bnRyeSA6IFwiXCIsXG4gICAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgICAgXCJcIixcbiAgICAgICAgICAgICAgMSxcbiAgICAgICAgICAgIF0pKSBhcyBBcnJheTx1bmtub3duPixcbiAgICAgICAgICAgIFwibmFtZVwiLFxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSBcInBvc3RhbGNvZGVzXCI6XG4gICAgICAgICAgcmVzdWx0ID0gKGF3YWl0IE9wZW5QTFpfTG9jYWxpdGllcy5yZXRyaWV2ZShbXG4gICAgICAgICAgICB0b0xvYWQuY291bnRyeSA/IHRvTG9hZC5jb3VudHJ5IDogXCJcIixcbiAgICAgICAgICAgIFwiLipcIixcbiAgICAgICAgICAgIGBcdTAwQjAkeyh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YCxcbiAgICAgICAgICAgIDEsXG4gICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+O1xuXG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSBcInN0cmVldHNcIjpcbiAgICAgICAgICByZXN1bHQgPSByZW1vdmVEdXBsaWNhdGVzKFxuICAgICAgICAgICAgKGF3YWl0IE9wZW5QTFpfU3RyZWV0cy5yZXRyaWV2ZShbXG4gICAgICAgICAgICAgIHRvTG9hZC5jb3VudHJ5ID8gdG9Mb2FkLmNvdW50cnkgOiBcIlwiLFxuICAgICAgICAgICAgICBgXHUwMEIwJHsodG9Qcm9jZXNzIGFzIEhUTUxJbnB1dEVsZW1lbnQpLnZhbHVlfWAsXG4gICAgICAgICAgICAgIHRvTG9hZC5kZXBlbmRlbnRwbHogPT09IHVuZGVmaW5lZCB8fFxuICAgICAgICAgICAgICAodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5ICYmXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAgIChcbiAgICAgICAgICAgICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5xdWVyeVNlbGVjdG9yKFxuICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICApIGFzIEhUTUxJbnB1dEVsZW1lbnRcbiAgICAgICAgICAgICAgICApLnZhbHVlICE9PSBcIlwiKSB8fFxuICAgICAgICAgICAgICAodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgJiZcbiAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3RvcihcbiAgICAgICAgICAgICAgICAgICAgdG9Mb2FkLmRlcGVuZGVudHBseixcbiAgICAgICAgICAgICAgICAgICkgYXMgSFRNTElucHV0RWxlbWVudFxuICAgICAgICAgICAgICAgICkudmFsdWUgPT09IFwiXCIpXG4gICAgICAgICAgICAgICAgPyBcIlwiXG4gICAgICAgICAgICAgICAgOiB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQucXVlcnlTZWxlY3Rvcih0b0xvYWQuZGVwZW5kZW50cGx6KVxuICAgICAgICAgICAgICAgICAgPyBgXHUwMEIwJHsodG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudHBseikgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWV9YFxuICAgICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHkgJiZcbiAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IodG9Mb2FkLmRlcGVuZGVudGxvY2FsaXR5KSAmJlxuICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICkudmFsdWUgIT09IFwiXCJcbiAgICAgICAgICAgICAgICA/IGBcdTAwQjAke1xuICAgICAgICAgICAgICAgICAgICAoXG4gICAgICAgICAgICAgICAgICAgICAgdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgICAgICAgICAgICAgICB0b0xvYWQuZGVwZW5kZW50bG9jYWxpdHksXG4gICAgICAgICAgICAgICAgICAgICAgKSBhcyBIVE1MSW5wdXRFbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICkudmFsdWVcbiAgICAgICAgICAgICAgICAgIH1gXG4gICAgICAgICAgICAgICAgOiBcIlwiLFxuICAgICAgICAgICAgICAxLFxuICAgICAgICAgICAgXSkpIGFzIEFycmF5PHVua25vd24+LFxuICAgICAgICAgICAgXCJuYW1lXCIsXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICBpZiAocmVzdWx0Lmxlbmd0aCA9PT0gMCB8fCAocmVzdWx0WzBdIGFzIGFueSkucmVzdWx0KSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlc3VsdC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgLy8gI3JlZ2lvbiBJZiB0aGUgcmVxdWVzdCByZXR1cm5lZCBhbiBlcnJvci5cbiAgICAgICAgaWYgKChyZXN1bHRbMF0gYXMgeyBlcnJvcjogc3RyaW5nIH0pLmVycm9yKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gSWYgdGhlIHJlcXVlc3QgcmV0dXJuZWQgYW4gZXJyb3IuXG4gICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPSByZXN1bHRbMF1bdGFyZ2V0UmVzdWx0UHJvcGVydHldO1xuICAgICAgICAvLyAjcmVnaW9uIFNldCBkZXBlbmRlbnQsIGlmIGF2YWlsYWJsZS5cbiAgICAgICAgY29uc3QgdGNUYXJnZXREYXRhID0gdG9Mb2FkLnRhcmdldGRhdGEudG9Mb3dlckNhc2UoKTtcblxuICAgICAgICBpZiAodGNUYXJnZXREYXRhICE9PSBcInN0cmVldHNcIikge1xuICAgICAgICAgIGlmIChkZXBlbmRlbnQpIHtcbiAgICAgICAgICAgIChkZXBlbmRlbnQgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUgPVxuICAgICAgICAgICAgICB0Y1RhcmdldERhdGEgPT09IFwibG9jYWxpdGllc1wiXG4gICAgICAgICAgICAgICAgPyAocmVzdWx0WzBdIGFzIHsgcG9zdGFsQ29kZTogc3RyaW5nIH0pLnBvc3RhbENvZGVcbiAgICAgICAgICAgICAgICA6IChyZXN1bHRbMF0gYXMgeyBuYW1lOiBzdHJpbmcgfSkubmFtZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBTZXQgZGVwZW5kZW50LCBpZiBhdmFpbGFibGUuXG4gICAgICAgIC8vICNyZWdpb24gQmxvY2sgaW5wdXQgb24gbWF0Y2guXG4gICAgICAgIGJsb2NrZWQgPSB0cnVlO1xuICAgICAgICAvLyAjcmVnaW9uIFJlbW92ZSBwcm9wb3NhbHMuXG4gICAgICAgIHByb3Bvc2Fscy5yZW1vdmUoKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBSZW1vdmUgcHJvcG9zYWxzLlxuICAgICAgICBjb25zdCB0b0ZvY3VzID0gdG9Qcm9jZXNzLnBhcmVudEVsZW1lbnQucGFyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50LnF1ZXJ5U2VsZWN0b3IoXG4gICAgICAgICAgdG9Mb2FkLmZvY3Vzb25hdXRvY29tcGxldGUsXG4gICAgICAgICkgYXMgSFRNTEVsZW1lbnQ7XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgYmxvY2tlZCA9IGZhbHNlO1xuXG4gICAgICAgICAgaWYgKHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cbiAgICAgICAgICAgICh0b0ZvY3VzIGFzIGFueSkuQ29kQmlfT3BlblBMWl9BdXRvY29tcGxldGVfQmxvY2tlZEJ5RGVwZW5kZW50ID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBCbG9jayBpbnB1dCBvbiBtYXRjaC5cbiAgICAgICAgLy8gI3JlZ2lvbiBGb2N1cyB0aGUgZmllbGQgYWZ0ZXIgYXV0b2NvbXBsZXRlLCBpZiBzcGVjaWZpZWQuXG4gICAgICAgIGlmICh0b0ZvY3VzICYmIHRvTG9hZC5mb2N1c29uYXV0b2NvbXBsZXRlKSB7XG4gICAgICAgICAgLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XG4gICAgICAgICAgKHRvRm9jdXMgYXMgYW55KS5Db2RCaV9PcGVuUExaX0F1dG9jb21wbGV0ZV9CbG9ja2VkQnlEZXBlbmRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgcHJvcG9zYWxzLnJlbW92ZSgpO1xuICAgICAgICAgIHRvRm9jdXMuZm9jdXMoKTtcbiAgICAgICAgICB0b0ZvY3VzXG4gICAgICAgICAgICAuYW5pbWF0ZShPcGVuUExaX0F1dG9jb21wbGV0ZS5rZkZvY3VzT25BdXRvY29tcGxldGUsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLnRtZ0ZvY3VzT25BdXRvY29tcGxldGUpXG4gICAgICAgICAgICAucGxheSgpO1xuICAgICAgICB9XG4gICAgICAgIC8vICNlbmRyZWdpb24gRm9jdXMgdGhlIGZpZWxkIGFmdGVyIGF1dG9jb21wbGV0ZSwgaWYgc3BlY2lmaWVkLlxuICAgICAgfVxuICAgICAgLy8gI3JlZ2lvbiBTaG93IHByb3Bvc2Fscy5cbiAgICAgIGlmIChyZXN1bHQubGVuZ3RoID4gMSkge1xuICAgICAgICBwcm9wb3NhbHMuaW5uZXJIVE1MID0gXCJcIjtcblxuICAgICAgICBmb3IgKGNvbnN0IGVsZW1lbnQgb2YgcmVzdWx0KSB7XG4gICAgICAgICAgcHJvcG9zYWxzLm9wdGlvbnMuYWRkKG5ldyBPcHRpb24oZWxlbWVudFt0YXJnZXRSZXN1bHRQcm9wZXJ0eV0sIGVsZW1lbnRbdGFyZ2V0UmVzdWx0UHJvcGVydHldKSk7XG4gICAgICAgIH1cblxuICAgICAgICB0b1Byb2Nlc3MucGFyZW50RWxlbWVudC5hcHBlbmRDaGlsZChwcm9wb3NhbHMpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBTaG93IHByb3Bvc2Fscy5cbiAgICB9KTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBPcGVuUExaX0F1dG9jb21wbGV0ZSB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIk9wZW5QTFouQXV0b2NvbXBsZXRlXCIsIE9wZW5QTFpfQXV0b2NvbXBsZXRlLmZ1bmN0aW9uYWxpdHkpO1xuICB9KSgpO1xuICAvLyAjZW5kcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbmltcG9ydCB7IE9wZW5QTFogfSBmcm9tIFwiLi9vcGVucGx6LmpzXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogQW4ge0BsaW5rIE9wZW5QTFogfS1SZXF1ZXN0IHNwZWNpYWxpemVkIGludG8gc2VhcmNoaW5nIGZvciBzdHJlZXRzLlxuICpcbiAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gKiAtIDFzdDogVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICogICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gKiAtIDJuZDogVGhlIFsgUE9TSVggUmVnRXggXShodHRwczovL3d3dy5vcGVucGx6YXBpLm9yZy9kZS9yZWdleC8pIGZvciB0aGUgc3RyZWV0J3MgbmFtZS5cbiAqIC0gM3JkOiBUaGUgWyBQT1NJWCBSZWdFeCBdKGh0dHBzOi8vd3d3Lm9wZW5wbHphcGkub3JnL2RlL3JlZ2V4LykgZm9yIHRoZSBzdHJlZXQncyBwb3N0YWwgY29kZS4gSWYgdGhpcyBpcyBlbXB0eSB0aGVcbiAqICAgICAgICAqKjR0aCoqIHBhcmFtZXRlciB3aWxsIGJlIHVzZWQgZm9yIHRoZSBzZWFyY2ggYXMgdGhlIHN0cmVldCdzIGNpdHktbmFtZS5cbiAqIC0gNHRoOiBUaGUgWyBQT1NJWCBSZWdFeCBdKGh0dHBzOi8vd3d3Lm9wZW5wbHphcGkub3JnL2RlL3JlZ2V4LykgZm9yIHRoZSBjaXR5J3MgbmFtZSB1c2VkIGlmIHRoZSAqKjNyZCoqXG4gKiAgICAgICAgcGFyYW1ldGVyIGlzIGVtcHR5LlxuICogLSA1dGg6IEFuIE9wdGlvbmFsIG51bWJlciBvZiBwYWdlcyB0byBsb2FkLlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5kZSkgKi9cbmV4cG9ydCBjbGFzcyBPcGVuUExaX1N0cmVldHMgZXh0ZW5kcyBPcGVuUExaIHtcbiAgLyoqXG4gICAqIEpvaW5zIGFsbCB7QGxpbmsgb2JqZWN0IH1zIGluIFwicGFyYW1zXCIgaW50byBvbmUuXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoYXQgRWxlbWVudC1QbGFjZWhvbGRlciAocHJvdmlkZWQgYnkgQ29kQmkpLiAqL1xuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIHJldHJpZXZlKHBhcmFtczogQXJyYXk8dW5rbm93bj4pOiBBcnJheTx1bmtub3duPiB8IHVua25vd24ge1xuICAgIHJldHVybiBPcGVuUExaLnJldHJpZXZlKFtcbiAgICAgIHBhcmFtc1swXSA/IChwYXJhbXNbMF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICBcIlN0cmVldHNcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIlwiLFxuICAgICAgYG5hbWUtJHsocGFyYW1zWzFdIGFzIHN0cmluZykucmVwbGFjZSgvXi8sIFwiXHUwMEIwXCIpfWAsXG4gICAgICBwYXJhbXMubGVuZ3RoID49IDRcbiAgICAgICAgPyBgbG9jYWxpdHktJHsocGFyYW1zWzNdIGFzIHN0cmluZykucmVwbGFjZSgvXi8sIFwiXHUwMEIwXCIpfWBcbiAgICAgICAgOiBgcG9zdGFsQ29kZS0keyhwYXJhbXNbMl0gYXMgc3RyaW5nKS5yZXBsYWNlKC9eLywgXCJcdTAwQjBcIil9YCxcbiAgICAgIFwiXCIsXG4gICAgICBcIlwiLFxuICAgICAgcGFyYW1zWzRdID8gcGFyYW1zWzRdIDogXCJcIixcbiAgICBdKTtcbiAgfVxuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG4gIC8qKlxuICAgKiBTdGF0ZXMgd2hldGhlciB0aGlzIHtAbGluayBPcGVuUExaX1N0cmVldHMgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWRcbiAgICogdmlhIHtAbGluayBDb2RiaUdsb2JhbC5yZWdpc3RlckVQIH0gd2l0aCB0aGUgQ29kQmkgYW5kIHBlcmZvcm1zIHRoZSByZWdpc3RyYXRpb24gdXBvbiBjbGFzcyB1c2FnZS4qL1xuICBwdWJsaWMgc3RhdGljIG92ZXJyaWRlIHJlZ2lzdGVyZWQ6IGJvb2xlYW4gPSAoKCkgPT4ge1xuICAgIHJldHVybiB3aW5kb3cuY29kYmkucmVnaXN0ZXJFUChcIk9wZW5QTFouU3RyZWV0c1wiLCBPcGVuUExaX1N0cmVldHMucmV0cmlldmUpO1xuICB9KSgpO1xuICAvLyAjcmVnaW9uIEluaXRpYWxpemF0aW9uXG59XG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBSZXRyaWV2ZXMgZGF0YSBmcm9tIHRoZSAqKkNvZEJpX09wZW5QTFpfVmVyd2FsdHVuZ3NlaW5oZWl0ZW4qKi1TZXJ2bGV0IGFjY29yZGluZyB0byB0aGUgcGFyYW1ldGVyIHNwZWNpZmllZC5cbiAqIFRoaXMgaXMgdGhlIGJhc2UgY2xhc3MgZm9yIGFjY2Vzc2luZyB0aGUgKipbT3BlblBMWiBSRVNUIEFQSV0oaHR0cHM6Ly93d3cub3BlbnBsemFwaS5vcmcvZGUvKSoqLCB0aHVzIG1ha2luZyBhbGxcbiAqIGZlYXR1cmVzIHRoYXQgdGhlIFJFU1QtU2VydmljZSBwcm92aWRlcyBhY2Nlc3NpYmxlLlxuICpcbiAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gKiAtIDFzdDogVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICogICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gKiAtIDJuZDogVGhlICoqb3JnYVVuaXQqKiB0byByZXRyaWV2ZSAoZS5nLiAqKkZlZGVyYWxTdGF0ZXMqKiwgKipGZWRlcmFsUHJvdmluY2VzKiogb3IgKipDYW50b25zKiopLlxuICogLSAzcmQ6IFRoZSBvcHRpb25hbCBrZXkgb2YgdGhlIHN0YXRlLCBwcm92aW5jZSBvciBjYW50b24gdG8gZ2V0IGRldGFpbHMgb2YuXG4gKiAtIDR0aDogVGhlIG9wdGlvbmFsIGRldGFpbCB0byBmZXRjaCBhYm91dCBhIGNlcnRhaW4gc3RhdGUsIHByb3ZpbmNlIG9yIGNhbnRvbiBpZGVudGlmaWVkIGJ5IHRoZVxuICogICAgICAgICoqb2ZmaWNpYWxLZXkqKiAobm90IG9wdGlvbmFsIGlmIGFuIG9mZmljaWFsIGtleSBpcyBwcmVzZW50KS4gTWF5IGJlIE11bmljaXBhbGl0aWVzIG9yIERpc3RyaWN0cy5cbiAqIC0gNXRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gNnRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gN3RoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gOHRoOiBUaGVyZSBtYXkgYmUgdXAgdG8gZm91ciBwYXJhbWV0ZXIgcGFzc2VkIGFsb25nIHRoZSByZXF1ZXN0IChlLmcuICoqcG9zdGFsQ29kZSoqLCAqKm5hbWUqKixcbiAqICAgICAgICAqKmxvY2FsaXR5KiosICoqc2VhcmNoVGVybSoqKS5cbiAqIC0gOXRoOiBBbiBPcHRpb25hbCBudW1iZXIgb2YgcGFnZXMgdG8gbG9hZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogRnV0dXJlIGluaGVyaXRhbmNlIHByb2JhYmxlLlxuZXhwb3J0IGNsYXNzIE9wZW5QTFoge1xuICAvKipcbiAgICogSm9pbnMgYWxsIHtAbGluayBvYmplY3QgfXMgaW4gXCJwYXJhbXNcIiBpbnRvIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUocGFyYW1zOiBBcnJheTx1bmtub3duPik6IEFycmF5PHVua25vd24+IHwgdW5rbm93biB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGdldEpRdWVyeSgpXG4gICAgICAgIC5hamF4KHtcbiAgICAgICAgICB1cmw6IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX09wZW5QTFpfUXVlcnlgLFxuICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIFwiWC1Db3VudHJ5XCI6IHBhcmFtc1swXSA/IChwYXJhbXNbMF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtT3JnYVVuaXRcIjogcGFyYW1zWzFdID8gKHBhcmFtc1sxXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1PZmZpY2lhbEtleVwiOiBwYXJhbXNbMl0gPyAocGFyYW1zWzJdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgXCJYLURldGFpbFwiOiBwYXJhbXNbM10gPyAocGFyYW1zWzNdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtMVwiOiBwYXJhbXNbNF0gPyAocGFyYW1zWzRdIGFzIHN0cmluZykucmVwbGFjZShcIj1cIiwgXCItXCIpLnJlcGxhY2UoLyAvLCBcIlwiKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtUGFyYW0yXCI6IHBhcmFtc1s1XSA/IChwYXJhbXNbNV0gYXMgc3RyaW5nKS5yZXBsYWNlKFwiPVwiLCBcIi1cIikucmVwbGFjZSgvIC8sIFwiXCIpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1QYXJhbTNcIjogcGFyYW1zWzZdID8gKHBhcmFtc1s2XSBhcyBzdHJpbmcpLnJlcGxhY2UoXCI9XCIsIFwiLVwiKS5yZXBsYWNlKC8gLywgXCJcIikgOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtNFwiOiBwYXJhbXNbN10gPyAocGFyYW1zWzddIGFzIHN0cmluZykucmVwbGFjZShcIj1cIiwgXCItXCIpLnJlcGxhY2UoLyAvLCBcIlwiKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtUGFnZXNUb0xvYWRcIjogcGFyYW1zWzhdID8gcGFyYW1zWzhdLnRvU3RyaW5nKCkgOiB1bmRlZmluZWQsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSlcbiAgICAgICAgLmRvbmUoKHJlc3BvbnNlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgT3BlblBMWiB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRVAgfSB3aXRoIHRoZSBDb2RCaSBhbmQgcGVyZm9ybXMgdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLiovXG4gIHB1YmxpYyBzdGF0aWMgcmVnaXN0ZXJlZDogYm9vbGVhbiA9ICgoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5jb2RiaS5yZWdpc3RlckVQKFwiT3BlblBMWlwiLCBPcGVuUExaLnJldHJpZXZlKTtcbiAgfSkoKTtcbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIiwgIi8vICNyZWdpb24gSW1wb3J0c1xuaW1wb3J0IHsgT3BlblBMWiB9IGZyb20gXCIuL29wZW5wbHouanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBBbiB7QGxpbmsgT3BlblBMWiB9LVJlcXVlc3Qgc3BlY2lhbGl6ZWQgaW50byBzZWFyY2hpbmcgZm9yIGxvY2FsaXRpZXMuXG4gKlxuICogQ29uZmlnIFBhcmFtZXRlcjpcbiAqIC0gMXN0OiBUaGUgb3B0aW9uYWwgKipjb3VudHJ5KiogdG8gcmV0cmlldmUgdGhlIGRhdGEgb2YgKGlmIG5vdCBwcm92aWRlZCBlaXRoZXIgdGhlIGNvdW50cnkgc3BlY2lmaWVkIGluXG4gKiAgICAgICAgdGhlIENvZEJpJ3MgQ29uZmlndXJhdGlvbiAqKk9wZW5QTFpfQ291bnRyeSoqIHdpbGwgYmUgdXNlZCBvciwgaWYgbm90IHNwZWNpZmllZCwgXCJkZVwiKS5cbiAqIC0gMm5kOiBUaGUgWyBQT1NJWCBSZWdFeCBdKGh0dHBzOi8vd3d3Lm9wZW5wbHphcGkub3JnL2RlL3JlZ2V4LykgZm9yIHRoZSBsb2NhbGl0eSdzIG5hbWUuXG4gKiAtIDNyZDogVGhlIFsgUE9TSVggUmVnRXggXShodHRwczovL3d3dy5vcGVucGx6YXBpLm9yZy9kZS9yZWdleC8pIGZvciB0aGUgbG9jYWxpdHkncyBwb3N0YWwgY29kZS5cbiAqIC0gNHRoOiBBbiBPcHRpb25hbCBudW1iZXIgb2YgcGFnZXMgdG8gbG9hZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuZXhwb3J0IGNsYXNzIE9wZW5QTFpfTG9jYWxpdGllcyBleHRlbmRzIE9wZW5QTFoge1xuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBsb2NhbGl0aWVzIGZvdW5kIGFjY29yZGluZyB0byB0aGUgcHJvdmlkZWQgKipwYXJhbXMqKi5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgcmV0cmlldmUocGFyYW1zOiBBcnJheTx1bmtub3duPik6IEFycmF5PHVua25vd24+IHwgdW5rbm93biB7XG4gICAgcmV0dXJuIE9wZW5QTFoucmV0cmlldmUoW1xuICAgICAgcGFyYW1zWzBdLFxuICAgICAgXCJMb2NhbGl0aWVzXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIGBuYW1lLSR7KHBhcmFtc1sxXSBhcyBzdHJpbmcpLnJlcGxhY2UoL14vLCBcIlx1MDBCMFwiKX1gLFxuICAgICAgcGFyYW1zLmxlbmd0aCA+PSAzID8gYHBvc3RhbENvZGUtJHsocGFyYW1zWzJdIGFzIHN0cmluZykucmVwbGFjZSgvXi8sIFwiXHUwMEIwXCIpfWAgOiBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIlwiLFxuICAgICAgcGFyYW1zWzNdID8gcGFyYW1zWzNdIDogXCJcIixcbiAgICAgIHBhcmFtc1szXSA/IHBhcmFtc1szXSA6IFwiXCIsXG4gICAgXSk7XG4gIH1cbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgT3BlblBMWl9Mb2NhbGl0aWVzIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJFUCB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyBvdmVycmlkZSByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCJPcGVuUExaLkxvY2FsaXRpZXNcIiwgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKTtcbiAgfSkoKTtcbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsSUFBQUEsMkJBQTBCOzs7QUNBMUIsSUFBQUMsMkJBQTBCOzs7QUNBMUIsOEJBQTBCO0FBNEJuQixJQUFNLFVBQU4sTUFBTSxTQUFRO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQUtuQixPQUFjLFNBQVMs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Q1Y7QUFBQSxNQUVGO0FBRUEsVUFBSSxPQUFPLFNBQVMsR0FBRztBQUNyQixrQkFBVSxZQUFZO0FBRXRCLG1CQUFXLFdBQVcsUUFBUTtBQUM1QixvQkFBVSxRQUFRLElBQUksSUFBSSxPQUFPLFFBQVEsb0JBQW9CLEdBQUcsUUFBUSxvQkFBb0IsQ0FBQyxDQUFDO0FBQUEsUUFDaEc7QUFFQSxrQkFBVSxjQUFjLFlBQVksU0FBUztBQUFBLE1BQy9DO0FBQUEsSUFFRixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBS0E7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLFNBQWMsY0FBdUIsTUFBTTtBQUN6QyxhQUFPLE9BQU8sTUFBTSxzQkFBc0Isd0JBQXdCLHNCQUFxQixhQUFhO0FBQUEsSUFDdEcsR0FBRztBQUFBO0FBQUE7QUFFTDtBQWhaZ0I7QUFBQSxFQURiLElBQUk7QUFBQSxHQWpETSx1QkFrREc7QUFsRFQsSUFBTSx1QkFBTjsiLAogICJuYW1lcyI6IFsiaW1wb3J0X2ZjX2Zvcm1fcmVuZGVyZXIiLCAiaW1wb3J0X2ZjX2Zvcm1fcmVuZGVyZXIiXQp9Cg==
