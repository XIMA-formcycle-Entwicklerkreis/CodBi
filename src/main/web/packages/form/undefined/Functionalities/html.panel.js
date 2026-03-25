import { OR } from "./chunk-YYG42PYR.js";
import { CodBiError } from "./chunk-NKLWL4ZS.js";
import "./chunk-JP4GUAZX.js";
import { EQ } from "./chunk-RI3LWO6O.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/html.panel.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);

// ../../node_modules/xdbc/src/DBC/UNDEFINED.ts
var UNDEFINED = class _UNDEFINED extends DBC {
  /**
   * Checks if the value **toCheck** is undefined.
   *
   * @param toCheck	The {@link Object } to check.
   *
   * @returns TRUE if the value **toCheck** is of the specified **type**, otherwise FALSE. */
  // biome-ignore lint/suspicious/noExplicitAny: Necessary for dynamic type checking of also UNDEFINED.
  static checkAlgorithm(toCheck) {
    if (toCheck !== void 0) {
      return `Value must be UNDEFINED but it is ${typeof toCheck}`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param path	See {@link DBC.decPrecondition }.
   * @param dbc	See {@link DBC.decPrecondition }.
   * @param hint	See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _UNDEFINED.checkAlgorithm(value);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A method-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param path	See {@link DBC.Postcondition }.
   * @param dbc	See {@link DBC.decPostcondition }.
   * @param hint	See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _UNDEFINED.checkAlgorithm(value);
      },
      dbc,
      path,
      hint,
    );
  }
  /**
   * A field-decorator factory using the {@link UNDEFINED.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param path	See {@link DBC.decInvariant }.
   * @param dbc	See {@link DBC.decInvariant }.
   * @param hint	See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(type, path = void 0, hint = void 0, dbc = void 0) {
    return DBC.decInvariant([new _UNDEFINED()], path, dbc, hint);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like with AE-DBC).
  //
  /**
   * Invokes the {@link UNDEFINED.checkAlgorithm } passing the value **toCheck** and the {@link UNDEFINED.type } .
   *
   * @param toCheck See {@link UNDEFINED.checkAlgorithm }.
   *
   * @returns See {@link UNDEFINED.checkAlgorithm}. */
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  check(toCheck) {
    return _UNDEFINED.checkAlgorithm(toCheck);
  }
  /**
   * Invokes the {@link UNDEFINED.checkAlgorithm } passing the value **toCheck** and the {@link UNDEFINED.type } .
   *
   * @param toCheck	See {@link UNDEFINED.checkAlgorithm }.
   * @param id		A {@link string } identifying this {@link INSTANCE } via the {@link DBC.Infringement }-Message.
   *
   * @returns The **CANDIDATE** **toCheck** doesn't fulfill this {@link UNDEFINED }.
   *
   * @throws A {@link DBC.Infringement } if the **CANDIDATE** **toCheck** does not fulfill this {@link UNDEFINED }.*/
  static tsCheck(toCheck, id = void 0) {
    const result = _UNDEFINED.checkAlgorithm(toCheck);
    if (result === true) {
      return toCheck;
    } else {
      throw new DBC.Infringement(`${id ? `(${id}) ` : ""}${result}`);
    }
  }
  /** Creates this {@link UNDEFINED }. */
  constructor() {
    super();
  }
};

// src/js/Functionalities/html.panel.ts
var _HTML_Panel = class _HTML_Panel {
  static {
    this.mapHeaderAfterElements = /* @__PURE__ */ new Map();
  }
  /**
   * Retrieves the first ".CXPage"-{@link HTMLElement } above the given "element".
   *
   * @param element The {@link HTMLElement } to start the search from.
   *
   * @returns The ".CXPage"-{@link HTMLElement } containing the given "element". */
  static determinePage(element) {
    let currentElement = element;
    while (currentElement !== null) {
      if (currentElement.classList.contains("CXPage")) {
        return currentElement;
      }
      currentElement = currentElement.parentElement;
    }
    return currentElement;
  }
  static {
    /** Stores all {@link HTMLElement }s that're currently invalid. */
    this.invalidElements = new Array();
  }
  static {
    /** States whether the validator algorithm has already been registered. */
    this.validatorRegistered = false;
  }
  /**
   * Unfolds all HTML-Panels that are ancestors of the specified {@link Element } by simulating a click on their
   * header if they're folded.
   *
   * @param from The {@link Element } to start the unfolding from. */
  static unfoldPanelAncestors(from) {
    let currentElement = from;
    while (currentElement !== null) {
      if (currentElement.CodBi_HTML_Panel_Folded) {
        currentElement.CodBi_HTML_Panel_Header.click();
      }
      currentElement = currentElement.parentElement;
    }
  }
  static functionality(toLoad, toProcess) {
    if (XFC_METADATA.requestType === "print") {
      return;
    }
    let header;
    if (
      toLoad.generateheader &&
      toProcess.children.length > 0 &&
      toLoad.generateheader.toLocaleLowerCase() === "true"
    ) {
      if (toLoad.scroll === void 0) {
        toLoad.scroll = false;
      } else {
        if (typeof toLoad.scroll === "string") {
          toLoad.scroll = toLoad.scroll.toLowerCase().trim() === "true";
        }
      }
      if (toLoad.scroll && toLoad.scrollblock && typeof toLoad.scrollblock === "string") {
        toLoad.scrollblock = toLoad.scrollblock.toLowerCase().trim();
      }
      if (
        toLoad.scroll &&
        toLoad.scrollblock !== "start" &&
        toLoad.scrollblock !== "center" &&
        toLoad.scrollblock !== "end" &&
        toLoad.scrollblock !== "nearest"
      ) {
        toLoad.scrollblock = "nearest";
      }
      const wrpHeader = document.createElement("div");
      wrpHeader.classList.add("cHeader");
      header = document.createElement("div");
      const legend = toProcess.querySelector("legend");
      toLoad.autoheadertitlesuplementsspacer = toLoad.autoheadertitlesuplementsspacer
        ? toLoad.autoheadertitlesuplementsspacer
        : " / ";
      let autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer;
      const supplements = toProcess.querySelectorAll(".CodBi_HTML_Panel_AutoHeaderTitle_Supplement");
      const constructHeaderSupplements = () => {
        for (let i = 0; i < supplements.length; i++) {
          autoHeaderTitleSupplement += `${supplements[i].value === "" || i === 0 ? "" : ", "}${supplements[i].value}`;
        }
      };
      for (let i = 0; i < supplements.length; i++) {
        if (
          !isClassInBetween("XFieldSet", toProcess, supplements[i]) &&
          !isClassInBetween("XContainer", toProcess, supplements[i])
        ) {
          supplements[i].addEventListener("change", (event) => {
            autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer;
            constructHeaderSupplements();
            header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? toLoad.autoheadertitle + (autoHeaderTitleSupplement.length !== toLoad.autoheadertitlesuplementsspacer.length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? legend.innerHTML + (autoHeaderTitleSupplement.length === toLoad.autoheadertitlesuplementsspacer.length ? "" : autoHeaderTitleSupplement) : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
          });
        }
      }
      constructHeaderSupplements();
      header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? toLoad.autoheadertitle + (autoHeaderTitleSupplement.length !== toLoad.autoheadertitlesuplementsspacer.length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? (legend ? toProcess.querySelector("legend")?.innerHTML + (autoHeaderTitleSupplement.length === toLoad.autoheadertitlesuplementsspacer.length ? "" : autoHeaderTitleSupplement) : "") : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
      if (legend) {
        legend.remove();
      }
      header.setAttribute("style", toLoad.autoheadercss);
      header.classList.add("CodBi_HTML_Panel_Header");
      wrpHeader.appendChild(header);
      toProcess.insertBefore(wrpHeader, toProcess.firstChild);
    } else {
      header = toProcess.querySelector(".CodBi_HTML_Panel_Header");
    }
    if (header === null) {
      throw new CodBiError(
        `Tagged <div> or <fieldset> "${toProcess.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`,
      );
    } else {
      toProcess.CodBi_HTML_Panel_Header = header;
      toProcess.classList.add("--HTML_Panel");
      const styHeader = header.getAttribute("style");
      const childArray = Array.from(toProcess.children);
      const idxHeader = childArray.indexOf(header.parentElement);
      const headerAfterElement = idxHeader === childArray.length - 1 ? void 0 : childArray[idxHeader];
      if (headerAfterElement) {
        _HTML_Panel.mapHeaderAfterElements.set(toProcess, headerAfterElement);
      }
      const bufferDisplay = toProcess.style.display;
      toProcess.CodBi_HTML_Panel_Folded = document.body.classList.contains("fc-print-mode")
        ? false
        : toLoad.folded !== void 0
          ? toLoad.folded.toLowerCase().trim() === "true"
          : false;
      if (toProcess.CodBi_HTML_Panel_Folded) {
        toProcess.style.display = "none";
        header?.remove();
        toProcess.parentElement?.appendChild(header);
      } else {
        if (toLoad.cssheaderunfolded) {
          header?.setAttribute("style", toLoad.cssheaderunfolded);
        }
      }
      if (toProcess.CodBi_HTML_Panel_Folded) {
        toProcess.classList.add("--folded");
      }
      let parentID = header.parentElement?.getAttribute("id");
      if (parentID === null) {
        parentID = toProcess.getAttribute("id");
      }
      const style = document.createElement("style");
      style.innerHTML = `
      @media( print ) { #${parentID}.CodBi.--HTML_Panel { display : ${bufferDisplay} !important ;}}

      .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: red !important ;}

      @media( prefers-color-scheme : dark ) {
        .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: darkorange !important ;}

        #${parentID} .CodBi_HTML_Panel_Header { ${toLoad.dcssheaderunfolded ? toLoad.dcssheaderunfolded : "background: linear-gradient(130deg, rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(84, 62, 62, 1) 55%, rgba(56, 52, 52, 1) 89%, rgba(0, 0, 0, 1) 100%) !important ;"}}}

      .CodBi_HTML_Panel_Header > p { margin : 0 ;}

      #${parentID} .CodBi_HTML_Panel_Header:after,
      #${toProcess.parentElement?.parentElement?.getAttribute("id")} .CodBi_HTML_Panel_Header:after {
        content : "${toLoad.cssafterheadercontent ? toLoad.cssafterheadercontent : ""}";

        ${toLoad.cssafterheader ? toLoad.cssafterheader : ""}
      }

      #${parentID} .CodBi_HTML_Panel_Header:before,
      #${toProcess.parentElement?.parentElement?.getAttribute("id")} .CodBi_HTML_Panel_Header:before {
        content : "${toLoad.cssbeforeheadercontent ? toLoad.cssbeforeheadercontent : ""}";

        ${toLoad.cssbeforeheader ? toLoad.cssbeforeheader : ""}
      }

      #${parentID} .CodBi_HTML_Panel_Header:hover,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:hover     { ${toLoad.cssheaderhover ? toLoad.cssheaderhover : "color: darkorange ;"}}
      #${parentID} .CodBi_HTML_Panel_Header:hover > *,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:hover > * { ${toLoad.cssheaderhover ? "" : "margin-left: 5% ; transition: .5s all ;"}}
      #${parentID} .CodBi_HTML_Panel_Header:active,
      .XFieldSetWrapper:has( #${parentID}) .CodBi_HTML_Panel_Header:active    { ${toLoad.cssheaderactive ? toLoad.cssheaderactive : "scale : .9 ;"}}

      ${
        toLoad.cssanimfadeinpanel
          ? `@keyframes CodBi_FadeIN_Panel_${parentID} {
          ${toLoad.cssanimfadeinpanel}}`
          : ""
      }

      #${parentID} .CodBi.--HTML_Panel,
      #${parentID}.CodBi.--HTML_Panel    { animation : CodBi_FadeIN_Panel_${parentID} ${toLoad.cssanimfadeinpanelduration ? toLoad.cssanimfadeinpanelduration : "0s"} ${toLoad.cssanimfadeinpaneleasing ? toLoad.cssanimfadeinpaneleasing : "ease-in-out"} forwards ;}`;
      const styleAfterUnfolded = document.createElement("style");
      styleAfterUnfolded.innerHTML = `
        #${parentID} > style + .CodBi_HTML_Panel_Header::after,
        #${parentID} > * > style + .CodBi_HTML_Panel_Header::after {
          content : "${toLoad.cssafterheadercontentunfolded ? toLoad.cssafterheadercontentunfolded : toLoad.cssafterheadercontent ? toLoad.cssafterheadercontent : ""}";

          ${toLoad.cssafterheaderunfolded ? toLoad.cssafterheaderunfolded : toLoad.cssafterheader ? toLoad.cssafterheader : ""}}`;
      const styleBeforeUnfolded = document.createElement("style");
      styleBeforeUnfolded.innerHTML = `
        #${parentID} > style + .CodBi_HTML_Panel_Header::before,
        #${parentID} > * > style + .CodBi_HTML_Panel_Header::before {
          content : "${toLoad.cssbeforeheadercontentunfolded ? toLoad.cssbeforeheadercontentunfolded : toLoad.cssbeforeheadercontent ? toLoad.cssbeforeheadercontent : ""}";

          ${toLoad.cssbeforeheaderunfolded ? toLoad.cssbeforeheaderunfolded : toLoad.cssbeforeheader ? toLoad.cssbeforeheader : ""}}`;
      header.parentElement?.insertBefore(style, header);
      if (toLoad.wrappercss && toProcess.parentElement?.classList.contains("XFieldSetWrapper")) {
        toProcess.parentElement?.setAttribute("style", toLoad.wrappercss);
      }
      header.addEventListener("click", (event) => {
        if (toProcess.CodBi_HTML_Panel_Folded) {
          toProcess.CodBi_HTML_Panel_Folded = !toProcess.CodBi_HTML_Panel_Folded;
          toProcess.style.display = bufferDisplay;
          header?.remove();
          if (toLoad.cssheaderunfolded) {
            header.setAttribute("style", toLoad.cssheaderunfolded);
          }
          if (headerAfterElement === void 0) {
            toProcess.appendChild(header);
          } else {
            toProcess.insertBefore(header, headerAfterElement);
          }
          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            header.parentElement?.insertBefore(styleAfterUnfolded, header);
            header.parentElement?.insertBefore(styleBeforeUnfolded, header);
          }
          if (toLoad.scroll) {
            toProcess.scrollIntoView({
              behavior: "smooth",
              block: toLoad.scrollblock,
              inline: "nearest",
            });
          }
          if (toProcess.hasAttribute("data-cb-accordion")) {
            toLoad.accordion = toProcess.getAttribute("data-cb-accordion");
            for (const toFold of document.querySelectorAll(
              `.CodBi.--HTML_Panel[ data-cb-accordion = "${toLoad.accordion}"]:not(.--folded)`,
            )) {
              toFold
                .querySelector(".CodBi_HTML_Panel_Header")
                ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
            }
          }
          toProcess.classList.remove("--folded");
        } else {
          toProcess.CodBi_HTML_Panel_Folded = !toProcess.CodBi_HTML_Panel_Folded;
          toProcess.style.display = "none";
          header.remove();
          if (styHeader) {
            header.setAttribute("style", styHeader);
          }
          toProcess.parentElement?.appendChild(header);
          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            styleAfterUnfolded.remove();
            styleBeforeUnfolded.remove();
          }
          toProcess.classList.add("--folded");
        }
      });
      let requiredFieldsContained = false;
      for (const required of toProcess.querySelectorAll('[ aria-required = "true"]')) {
        requiredFieldsContained = true;
      }
      if (requiredFieldsContained) {
        const styleRequiredFieldsContained = document.createElement("style");
        styleRequiredFieldsContained.innerHTML = `
          #${parentID} > .CodBi_HTML_Panel_Header:before,
          #${toProcess.parentElement?.parentElement?.getAttribute("id")} > * > .CodBi_HTML_Panel_Header:before {
            content : "${toLoad.cssrequiredfieldscontent ? toLoad.cssrequiredfieldscontent : "*"}";

          ${toLoad.cssrequiredfields ? toLoad.cssrequiredfields : "color : red ; position : relative ; top : .5em ;"}}`;
        header.parentElement?.insertBefore(styleRequiredFieldsContained, header);
      }
      (0, import_fc_form_renderer.getXUtil)().on("submit", (params) => {
        for (const untag of document.querySelectorAll(".CodBi_HTML_Panel_MissingRequiredField")) {
          untag.classList.remove("CodBi_HTML_Panel_MissingRequiredField");
        }
        let reallyInvalid = false;
        for (const candidate of document.querySelectorAll('[ aria-required = "true"]')) {
          if (candidate.value === "" || candidate.value === void 0) {
            _HTML_Panel.unfoldPanelAncestors(candidate);
            if (!isDisplayNone(candidate)) {
              let checkedSelection = false;
              if (candidate.classList.contains("XSelect")) {
                for (const option of candidate.querySelectorAll("input")) {
                  if (option.checked === true) {
                    checkedSelection = true;
                  }
                }
              }
              if (!checkedSelection) {
                const pageName = _HTML_Panel.determinePage(candidate)?.getAttribute("data-xn");
                if (pageName) {
                  gotoPage(pageName);
                  candidate.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock });
                }
                candidate.focus();
                candidate.classList.add("CodBi_HTML_Panel_MissingRequiredField");
                return { preventSubmission: true };
              }
            }
          }
        }
        if (_HTML_Panel.invalidElements.length === 0) {
          return { preventSubmission: false };
        } else {
          for (const invalid of _HTML_Panel.invalidElements) {
            reallyInvalid = true;
            _HTML_Panel.unfoldPanelAncestors(invalid);
            const pageName = _HTML_Panel.determinePage(invalid)?.getAttribute("data-xn");
            if (pageName) {
              gotoPage(pageName);
              invalid.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock });
            }
            invalid.focus();
          }
          return { preventSubmission: reallyInvalid };
        }
      });
      if (!_HTML_Panel.validatorRegistered) {
        xm_validator.on("begin", (data) => {
          for (const item of data.items) {
            if (!_HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "true") {
              _HTML_Panel.invalidElements.push(item);
            }
            if (_HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "false") {
              _HTML_Panel.invalidElements = _HTML_Panel.invalidElements.filter((candidate) => candidate !== item);
            }
          }
        });
      }
    }
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "autoheadertitle :: autoheadertitlesupplementsspacer :: scrollblock")),
    __decorateParam(0, TYPE.PRE("string | boolean", "folded :: generateheader :: scroll")),
    __decorateParam(0, TYPE.PRE("string | number", "autoheaderlevel")),
    __decorateParam(
      0,
      OR.PRE(
        [new EQ("start"), new EQ("center"), new EQ("end"), new EQ("nearest"), new UNDEFINED()],
        "scrollblock",
        "Is data-cb-ScrollBlock something different than start, center, end or nearest?",
      ),
    ),
    __decorateParam(
      1,
      OR.PRE(
        [new INSTANCE(HTMLDivElement), new INSTANCE(HTMLFieldSetElement)],
        void 0,
        "Is it not a <div> that is tagged with this functionality?",
      ),
    ),
  ],
  _HTML_Panel,
  "functionality",
  1,
);
var HTML_Panel = _HTML_Panel;
window.codbi.registerFunctionality("HTML.Panel", HTML_Panel.functionality.bind(HTML_Panel));
function isClassInBetween(suspect, start, end) {
  while (end && end !== start) {
    if (
      end.getAttribute("class").indexOf(` ${suspect} `) !== -1 ||
      end.getAttribute("class").indexOf(` ${suspect}"`) !== -1 ||
      end.getAttribute("class").indexOf(`"${suspect} `) !== -1 ||
      end.getAttribute("class").indexOf(`"${suspect}"`) !== -1
    ) {
      return true;
    }
    end = end.parentElement;
  }
  return false;
}
function isDisplayNone(suspect) {
  while (suspect !== null) {
    if (suspect.style.display === "none") {
      return true;
    }
    suspect = suspect.parentElement;
  }
  return false;
}
export { HTML_Panel };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9odG1sLnBhbmVsLnRzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvVU5ERUZJTkVELnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0WFV0aWwsIGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBUWVBFIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9UWVBFXCI7XG5pbXBvcnQgeyBPUiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvT1JcIjtcbmltcG9ydCB7IEVRIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9FUVwiO1xuaW1wb3J0IHsgVU5ERUZJTkVEIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9VTkRFRklORURcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuaW1wb3J0IHsgQ29kQmlFcnJvciB9IGZyb20gXCIuLi9nbG9iYWwtc2NvcGVcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBQcm92aWRlcyB0aGUge0BsaW5rIEhUTUxfUGFuZWwuZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBTYWx2YXRvcmUgQ2FsbGFyaSAoU2FsdmF0b3JlLkNhbGxhcmlAQW5zYmFjaC5uZXQpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIEhUTUxfUGFuZWwge1xuICBzdGF0aWMgbWFwSGVhZGVyQWZ0ZXJFbGVtZW50czogTWFwPEhUTUxFbGVtZW50LCBIVE1MRWxlbWVudD4gPSBuZXcgTWFwPEhUTUxFbGVtZW50LCBIVE1MRWxlbWVudD4oKTtcbiAgLyoqXG4gICAqIFJldHJpZXZlcyB0aGUgZmlyc3QgXCIuQ1hQYWdlXCIte0BsaW5rIEhUTUxFbGVtZW50IH0gYWJvdmUgdGhlIGdpdmVuIFwiZWxlbWVudFwiLlxuICAgKlxuICAgKiBAcGFyYW0gZWxlbWVudCBUaGUge0BsaW5rIEhUTUxFbGVtZW50IH0gdG8gc3RhcnQgdGhlIHNlYXJjaCBmcm9tLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgXCIuQ1hQYWdlXCIte0BsaW5rIEhUTUxFbGVtZW50IH0gY29udGFpbmluZyB0aGUgZ2l2ZW4gXCJlbGVtZW50XCIuICovXG4gIHB1YmxpYyBzdGF0aWMgZGV0ZXJtaW5lUGFnZShlbGVtZW50OiBIVE1MRWxlbWVudCk6IEhUTUxFbGVtZW50IHwgbnVsbCB7XG4gICAgbGV0IGN1cnJlbnRFbGVtZW50OiBIVE1MRWxlbWVudCB8IG51bGwgPSBlbGVtZW50O1xuXG4gICAgd2hpbGUgKGN1cnJlbnRFbGVtZW50ICE9PSBudWxsKSB7XG4gICAgICBpZiAoY3VycmVudEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiQ1hQYWdlXCIpKSB7XG4gICAgICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgICAgIH1cblxuICAgICAgY3VycmVudEVsZW1lbnQgPSBjdXJyZW50RWxlbWVudC5wYXJlbnRFbGVtZW50O1xuICAgIH1cblxuICAgIHJldHVybiBjdXJyZW50RWxlbWVudDtcbiAgfVxuICAvKiogU3RvcmVzIGFsbCB7QGxpbmsgSFRNTEVsZW1lbnQgfXMgdGhhdCdyZSBjdXJyZW50bHkgaW52YWxpZC4gKi9cbiAgcHVibGljIHN0YXRpYyBpbnZhbGlkRWxlbWVudHM6IEFycmF5PEhUTUxFbGVtZW50PiA9IG5ldyBBcnJheTxIVE1MRWxlbWVudD4oKTtcbiAgLyoqIFN0YXRlcyB3aGV0aGVyIHRoZSB2YWxpZGF0b3IgYWxnb3JpdGhtIGhhcyBhbHJlYWR5IGJlZW4gcmVnaXN0ZXJlZC4gKi9cbiAgcHVibGljIHN0YXRpYyB2YWxpZGF0b3JSZWdpc3RlcmVkID0gZmFsc2U7XG4gIC8qKlxuICAgKiBVbmZvbGRzIGFsbCBIVE1MLVBhbmVscyB0aGF0IGFyZSBhbmNlc3RvcnMgb2YgdGhlIHNwZWNpZmllZCB7QGxpbmsgRWxlbWVudCB9IGJ5IHNpbXVsYXRpbmcgYSBjbGljayBvbiB0aGVpclxuICAgKiBoZWFkZXIgaWYgdGhleSdyZSBmb2xkZWQuXG4gICAqXG4gICAqIEBwYXJhbSBmcm9tIFRoZSB7QGxpbmsgRWxlbWVudCB9IHRvIHN0YXJ0IHRoZSB1bmZvbGRpbmcgZnJvbS4gKi9cbiAgcHVibGljIHN0YXRpYyB1bmZvbGRQYW5lbEFuY2VzdG9ycyhmcm9tOiBIVE1MRWxlbWVudCk6IHZvaWQge1xuICAgIGxldCBjdXJyZW50RWxlbWVudDogSFRNTEVsZW1lbnQgfCBudWxsID0gZnJvbTtcblxuICAgIHdoaWxlIChjdXJyZW50RWxlbWVudCAhPT0gbnVsbCkge1xuICAgICAgaWYgKChjdXJyZW50RWxlbWVudCBhcyB1bmtub3duIGFzIHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9KS5Db2RCaV9IVE1MX1BhbmVsX0ZvbGRlZCkge1xuICAgICAgICAoKGN1cnJlbnRFbGVtZW50IGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyIGFzIEhUTUxFbGVtZW50KS5jbGljaygpO1xuICAgICAgfVxuXG4gICAgICBjdXJyZW50RWxlbWVudCA9IGN1cnJlbnRFbGVtZW50LnBhcmVudEVsZW1lbnQ7XG4gICAgfVxuICB9XG4gIC8qKlxuICAgKiBUaGlzIGZ1bmN0aW9uYWxpdHkgdHJhbnNmb3JtcyB0aGUgdGFnZ2VkIHtAbGluayBIVE1MRGl2RWxlbWVudCB9IGludG8gYSBQYW5lbC4gVGhlIHBhbmVsJ3MgaGVhZGVyLCB3aGljaCBpcyB1c2VkIHRvIGZvbGQvdW5mb2xkXG4gICAqIHRoZSBwYW5lbCwgaXMgYW4ge0BsaW5rIEhUTUxFbGVtZW50IH0gdGFnZ2VkIHdpdGggdGhlIENTUy1DbGFzcyBcIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIgdGhhdCBpcyBuZXN0ZWQgIGF0IG1vc3RcbiAgICogdHdvIGxldmVscyB3aXRoaW4gdGhlIHRhZ2dlZCB7QGxpbmsgSFRNTEVsZW1lbnR9LiBUaHVzIHVzaW5nIGEgKiBYSU1BLVRleHQtRWxlbWVudCBhcyB0aGUgaGVhZGVyIHdpbGwgcHJvdmlkZVxuICAgKiB0aGUgWElNQS1UZXh0L0hUTUwtRWRpdG9yIGZvciBjcmVhdGluZyB0aGUgaGVhZGVyJ3MgY29udGVudC5cbiAgICpcbiAgICogIyMjIENvbmZpZyBQYXJhbWV0ZXI6XG4gICAqICAtIEZvbGRlZDogICAgICAgICAgICAgICAgICAgICAgICAgICBTdGF0ZXMgd2hldGhlciB0aGlzIHBhbmVsIGlzIGZvbGRlZCAoVFJVRSkgb3IgdW5mb2xkZWQgKGV2ZXJ5dGhpbmcgZWxzZSkgd2hlblxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaXQgaXMgbG9hZGVkIChkZWZhdWx0cyB0byBUUlVFKS5cbiAgICogIC0gQ1NTSGVhZGVySG92ZXI6ICAgICAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCBoZWFkZXIncyBDU1M6aG92ZXIgKGRlZmF1bHRzIHRvIHsgc2NhbGUgOiAxLjEgO30pLlxuICAgKiAgLSBDU1NIZWFkZXJBY3RpdmU6ICAgICAgICAgICAgICAgICAgVGhlIG9wdGlvbmFsIGhlYWRlcidzIENTUzphY3RpdmUgKGRlZmF1bHRzIHRvIHsgc2NhbGUgOiAuOSA7fSkuXG4gICAqICAtIENTU0hlYWRlclVuZm9sZGVkOiAgICAgICAgICAgICAgICBUaGUgb3B0aW9uYWwgQ1NTIHRvIGJlIGFwcGxpZWQgb250byB0aGUgaGVhZGVyIHdoZW4gdGhlIHBhbmVsIGlzIHVuZm9sZGVkLlxuICAgKiAgLSBEQ1NTSGVhZGVyVW5mb2xkZWQ6ICAgICAgICAgICAgICAgVGhlIG9wdGlvbmFsIERhcmttb2RlIENTUyB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogIC0gQ1NTQW5pbUZhZGVJTlBhbmVsOiAgICAgICAgICAgICAgIFRoZSBvcHRpb25hbCBhbmltYXRpb24gdG8gYmUgYXBwbGllZCBvbnRvIHRoZSBwYW5lbCB3aGVuZXZlciB0aGUgcGFuZWxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIHVuZm9sZGVkLlxuICAgKiAgLSBDU1NBbmltRmFkZUlOUGFuZWxEdXJhdGlvbjogICAgICAgVGhlIG9wdGlvbmFsIGFuaW1hdGlvbidzIGR1cmF0aW9uIHRoYXQgaXMgYXBwbGllZCBvbnRvIHRoZSBwYW5lbCB3aGVuZXZlclxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhlIHBhbmVsIGlzIHVuZm9sZGVkIChkZWZhdWx0cyB0byAwcykuXG4gICAqICAtIENTU0FuaW1GYWRlSU5QYW5lbEVhc2luZzogICAgICAgICBUaGUgb3B0aW9uYWwgYW5pbWF0aW9uJ3MgZWFzaW5nIGZ1bmN0aW9uIHRoYXQgaXMgYXBwbGllZCBvbnRvIHRoZSBwYW5lbFxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgd2hlbmV2ZXIgdGhlIHBhbmVsIGlzIHVuZm9sZGVkIChkZWZhdWx0cyB0byBcImVhc2UtaW4tb3V0XCIpLlxuICAgKiAgLSBDU1NBZnRlckhlYWRlcjogICAgICAgICAgICAgICAgICAgVGhlIENTUzphZnRlciB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWQuXG4gICAqICAtIENTU0JlZm9yZUhlYWRlcjogICAgICAgICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWRcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTQWZ0ZXJIZWFkZXJDb250ZW50OiAgICAgICAgICAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyBmb2xkZWQuXG4gICAqICAtIENTU0JlZm9yZUhlYWRlckNvbnRlbnQ6ICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSBjb250ZW50IHRvIGJlIGFwcGxpZWQgb250byB0aGUgaGVhZGVyIHdoZW4gdGhlIHBhbmVsIGlzIGZvbGRlZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTQWZ0ZXJIZWFkZXJDb250ZW50VW5mb2xkZWQ6ICAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogIC0gQ1NTQmVmb3JlSGVhZGVyQ29udGVudFVuZm9sZGVkOiAgIFRoZSBDU1M6YWZ0ZXIgY29udGVudCB0byBiZSBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciB3aGVuIHRoZSBwYW5lbCBpcyB1bmZvbGRlZC5cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICh3aWxsIGJlIG92ZXJ3cml0dGVuIHdoZW4gcmVxdWlyZWQgZmllbGRzIGFyZSBjb250YWluZWQgYnkgdGhlIHBhbmVsKS5cbiAgICogIC0gQ1NTUmVxdWlyZWRGaWVsZHNDb250ZW50OiAgICAgICAgIFRoZSBDU1M6YmVmb3JlIGNvbnRlbnQgdG8gYXBwbGllZCBvbnRvIHRoZSBoZWFkZXIgaWYgaXQgY29udGFpbnMgYSB2YWxpZGF0aW9uXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZW5zaXRpdmUgZmllbGQuXG4gICAqICAtIENTU1JlcXVpcmVkRmllbGRzOiAgICAgICAgICAgICAgICBUaGUgQ1NTOmJlZm9yZSB0byBhcHBsaWVkIG9udG8gdGhlIGhlYWRlciBpZiBpdCBjb250YWlucyBhIHZhbGlkYXRpb25cbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbnNpdGl2ZSBmaWVsZC5cbiAgICogIC0gQXV0b0hlYWRlclRpdGxlOiAgICAgICAgICAgICAgICAgIFRoZSB7QGxpbmsgc3RyaW5nIH10aGUgYXV0b21hdGljYWxseSBnZW5lcmF0ZWQgaGVhZGVyIHNoYWxsIGRpc3BsYXkuXG4gICAqICAtIEF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnRzU3BhY2VyICBUaGUge0BsaW5rIHN0cmluZyB9IHNlcGFyYXRpbmcgdGhlIGFjdHVhbCB0aXRsZSBmb3JtIGFsbCB7QGxpbmsgc3RyaW5nIH1zXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGF0J3JlIHN1cHBsZW1lbnRlZCAnY2F1c2UgdGhleSdyZSB7QGxpbmsgSFRNTElucHV0RWxlbWVudC52YWx1ZSB9cyBvZlxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge0BsaW5rIEhUTUxJbnB1dEVsZW1lbnQgfXMgdGFnZ2VkIHdpdGggdGhlXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDU1MtQ2xhc3MgKipDb2RCaV9IVE1MX1BhbmVsX0F1dG9IZWFkZXJUaXRsZV9TdXBwbGVtZW50Kiogd2l0aG91dCBhbnlcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICoqWEZpZWxkU2V0KipzIG9yICoqWENvbnRhaW5lcioqIGluIGJldHdlZW4uXG4gICAqICAtIEF1dG9IZWFkZXJMZXZlbDogICAgICAgICAgICAgICAgICBXaGljaCBsZXZlbCBvZiBlbmNsb3NpbmcgXFw8aD5zIHRoZSBcIkF1dG9IZWFkZXJUaXRsZVwiIHNoYWxsIGhhdmUsXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBlLmcuIHRvIGdldCBhIFxcPGgxPiBlbmNsb3N1cmUgdGhlIHZhbHVlIGhhcyB0byBiZSAxLlxuICAgKiAgLSBTY3JvbGxCbG9jazogICAgICAgICAgICAgICAgICAgICAgRGVmaW5lcyB0aGUgbG9naWNhbCBwb3NpdGlvbiB0byBzY3JvbGwgdG8gd2hlbiB0aGUgcGFuZWxcbiAgICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlzIHVuZm9sZGVkIChzdGFydCwgY2VudGVyLCBlbmQsIG5lYXJlc3QpLiBEZWZhdWx0cyB0byBcIm5lYXJlc3RcIi5cbiAgICogIC0gR2VuZXJhdGVIZWFkZXI6ICAgICAgICAgICAgICAgICAgIFN0YXRlcyB3aGV0aGVyIGEgaGVhZGVyIHNoYWxsIGJlIGF1dG9tYXRpY2FsbHkgZ2VuZXJhdGVkLiBEZWZhdWx0cyB0byBGQUxTRS5cbiAgICogIC0gU2Nyb2xsICAgICAgICAgICAgICAgICAgICAgICAgICAgIFN0YXRlcyB3aGV0aGVyIHRoZSB2aWV3IHNoYWxsIGJlIHNjcm9sbGVkIHdoZW4gdGhlIHBhbmVsIHVuZm9sZHMuXG4gICAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBEZWZhdWx0IGlzIEZBTFNFLlxuICAgKiAgLSBBY2NvcmRpb24gICAgICAgICAgICAgICAgICAgICAgICAgSWYgc2V0LCB0aGlzIHBhbmVsIGJlY29tZXMgcGFydCBvZiBhbiBhY2NvcmRpb24uIEFsbCBwYW5lbHMgc2hhcmluZyB0aGUgc2FtZVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYWNjb3JkaW9uIG5hbWUgd2lsbCBiZSBmb2xkZWQgd2hlbiBvbmUgb2YgdGhlbSBpcyB1bmZvbGRlZC5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB7QGxpbmsgQ29kQmkuY2hlY2tBdHRyaWJ1dGVzIH0gLyB7QGxpbmsgQ29kQmkubG9hZENvbmZpZyB9LlxuICAgKiBAcGFyYW0gdG9Qcm9jZXNzIFByb3ZpZGVkIGJ5IHtAbGluayBDb2RCaS5jaGVja0F0dHJpYnV0ZXMgfSAvIHtAbGluayBDb2RCaS5sb2FkQ29uZmlnIH0uXG4gICAqXG4gICAqIEB0aHJvd3MgIEEge0BsaW5rIENvZEJpRXJyb3IgfSBpZiB0aGUgdGFnZ2VkIHtAbGluayBFbGVtZW50IH0gZG9lcyBub3QgY29udGFpblxuICAgKiAgICAgICAgICBhIGNoaWxkIG9mIENTUy1DbGFzcyBcIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIuKi9cbiAgQERCQy5QYXJhbXZhbHVlUHJvdmlkZXJcbiAgcHVibGljIHN0YXRpYyBmdW5jdGlvbmFsaXR5KFxuICAgIEBUWVBFLlBSRShcInN0cmluZ1wiLCBcImF1dG9oZWFkZXJ0aXRsZSA6OiBhdXRvaGVhZGVydGl0bGVzdXBwbGVtZW50c3NwYWNlciA6OiBzY3JvbGxibG9ja1wiKVxuICAgIEBUWVBFLlBSRShcInN0cmluZyB8IGJvb2xlYW5cIiwgXCJmb2xkZWQgOjogZ2VuZXJhdGVoZWFkZXIgOjogc2Nyb2xsXCIpXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nIHwgbnVtYmVyXCIsIFwiYXV0b2hlYWRlcmxldmVsXCIpXG4gICAgQE9SLlBSRShcbiAgICAgIFtuZXcgRVEoXCJzdGFydFwiKSwgbmV3IEVRKFwiY2VudGVyXCIpLCBuZXcgRVEoXCJlbmRcIiksIG5ldyBFUShcIm5lYXJlc3RcIiksIG5ldyBVTkRFRklORUQoKV0sXG4gICAgICBcInNjcm9sbGJsb2NrXCIsXG4gICAgICBcIklzIGRhdGEtY2ItU2Nyb2xsQmxvY2sgc29tZXRoaW5nIGRpZmZlcmVudCB0aGFuIHN0YXJ0LCBjZW50ZXIsIGVuZCBvciBuZWFyZXN0P1wiLFxuICAgIClcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LFxuXG4gICAgQE9SLlBSRShcbiAgICAgIFtuZXcgSU5TVEFOQ0UoSFRNTERpdkVsZW1lbnQpLCBuZXcgSU5TVEFOQ0UoSFRNTEZpZWxkU2V0RWxlbWVudCldLFxuICAgICAgdW5kZWZpbmVkLFxuICAgICAgXCJJcyBpdCBub3QgYSA8ZGl2PiB0aGF0IGlzIHRhZ2dlZCB3aXRoIHRoaXMgZnVuY3Rpb25hbGl0eT9cIixcbiAgICApXG4gICAgdG9Qcm9jZXNzOiBFbGVtZW50LFxuICApOiB1bmRlZmluZWQge1xuICAgIGlmIChYRkNfTUVUQURBVEEucmVxdWVzdFR5cGUgPT09IFwicHJpbnRcIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGxldCBoZWFkZXI6IEhUTUxFbGVtZW50IHwgbnVsbDtcblxuICAgIGlmIChcbiAgICAgIHRvTG9hZC5nZW5lcmF0ZWhlYWRlciAmJlxuICAgICAgdG9Qcm9jZXNzLmNoaWxkcmVuLmxlbmd0aCA+IDAgJiZcbiAgICAgICh0b0xvYWQuZ2VuZXJhdGVoZWFkZXIgYXMgc3RyaW5nKS50b0xvY2FsZUxvd2VyQ2FzZSgpID09PSBcInRydWVcIlxuICAgICkge1xuICAgICAgLy8gI3JlZ2lvbiBOb3JtYWxpemUgWyB0b0xvYWQuc2Nyb2xsIF0uXG4gICAgICBpZiAodG9Mb2FkLnNjcm9sbCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIHRvTG9hZC5zY3JvbGwgPSBmYWxzZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmICh0eXBlb2YgdG9Mb2FkLnNjcm9sbCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgIHRvTG9hZC5zY3JvbGwgPSAodG9Mb2FkLnNjcm9sbCBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkudHJpbSgpID09PSBcInRydWVcIjtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBOb3JtYWxpemUgWyB0b0xvYWQuc2Nyb2xsIF0uXG4gICAgICAvLyAjcmVnaW9uIE5vcm1hbGl6ZSBbIHRvTG9hZC5zY3JvbGxibG9jayBdLlxuICAgICAgaWYgKHRvTG9hZC5zY3JvbGwgJiYgdG9Mb2FkLnNjcm9sbGJsb2NrICYmIHR5cGVvZiB0b0xvYWQuc2Nyb2xsYmxvY2sgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgdG9Mb2FkLnNjcm9sbGJsb2NrID0gdG9Mb2FkLnNjcm9sbGJsb2NrLnRvTG93ZXJDYXNlKCkudHJpbSgpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIHRvTG9hZC5zY3JvbGwgJiZcbiAgICAgICAgdG9Mb2FkLnNjcm9sbGJsb2NrICE9PSBcInN0YXJ0XCIgJiZcbiAgICAgICAgdG9Mb2FkLnNjcm9sbGJsb2NrICE9PSBcImNlbnRlclwiICYmXG4gICAgICAgIHRvTG9hZC5zY3JvbGxibG9jayAhPT0gXCJlbmRcIiAmJlxuICAgICAgICB0b0xvYWQuc2Nyb2xsYmxvY2sgIT09IFwibmVhcmVzdFwiXG4gICAgICApIHtcbiAgICAgICAgdG9Mb2FkLnNjcm9sbGJsb2NrID0gXCJuZWFyZXN0XCI7XG4gICAgICB9XG4gICAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbGl6ZSBbIHRvTG9hZC5zY3JvbGxibG9jayBdLlxuICAgICAgY29uc3Qgd3JwSGVhZGVyID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcblxuICAgICAgd3JwSGVhZGVyLmNsYXNzTGlzdC5hZGQoXCJjSGVhZGVyXCIpO1xuXG4gICAgICBoZWFkZXIgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpO1xuXG4gICAgICBjb25zdCBsZWdlbmQgPSB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvcihcImxlZ2VuZFwiKTtcbiAgICAgIC8vICNyZWdpb24gQXV0b2hlYWRlciBTdXBwbGVtZW50XG4gICAgICB0b0xvYWQuYXV0b2hlYWRlcnRpdGxlc3VwbGVtZW50c3NwYWNlciA9IHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyXG4gICAgICAgID8gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZylcbiAgICAgICAgOiBcIiAvIFwiO1xuXG4gICAgICBsZXQgYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCA9IHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZztcblxuICAgICAgY29uc3Qgc3VwcGxlbWVudHMgPSB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvckFsbChcIi5Db2RCaV9IVE1MX1BhbmVsX0F1dG9IZWFkZXJUaXRsZV9TdXBwbGVtZW50XCIpO1xuICAgICAgY29uc3QgY29uc3RydWN0SGVhZGVyU3VwcGxlbWVudHMgPSAoKSA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc3VwcGxlbWVudHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICBhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50ICs9IGAkeyhzdXBwbGVtZW50c1tpXSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZSA9PT0gXCJcIiB8fCBpID09PSAwID8gXCJcIiA6IFwiLCBcIn0keyhzdXBwbGVtZW50c1tpXSBhcyBIVE1MSW5wdXRFbGVtZW50KS52YWx1ZX1gO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHN1cHBsZW1lbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhaXNDbGFzc0luQmV0d2VlbihcIlhGaWVsZFNldFwiLCB0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQsIHN1cHBsZW1lbnRzW2ldIGFzIEhUTUxFbGVtZW50KSAmJlxuICAgICAgICAgICFpc0NsYXNzSW5CZXR3ZWVuKFwiWENvbnRhaW5lclwiLCB0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQsIHN1cHBsZW1lbnRzW2ldIGFzIEhUTUxFbGVtZW50KVxuICAgICAgICApIHtcbiAgICAgICAgICBzdXBwbGVtZW50c1tpXS5hZGRFdmVudExpc3RlbmVyKFwiY2hhbmdlXCIsIChldmVudCkgPT4ge1xuICAgICAgICAgICAgYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCA9IHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZztcblxuICAgICAgICAgICAgY29uc3RydWN0SGVhZGVyU3VwcGxlbWVudHMoKTtcblxuICAgICAgICAgICAgaGVhZGVyLmlubmVySFRNTCA9IGAke3RvTG9hZC5hdXRvaGVhZGVybGV2ZWwgPyBgPGgke3RvTG9hZC5hdXRvaGVhZGVybGV2ZWx9PmAgOiBcIlwifSR7dG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZSA/ICh0b0xvYWQuYXV0b2hlYWRlcnRpdGxlIGFzIHN0cmluZykgKyAoYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudC5sZW5ndGggIT09ICh0b0xvYWQuYXV0b2hlYWRlcnRpdGxlc3VwbGVtZW50c3NwYWNlciBhcyBzdHJpbmcpLmxlbmd0aCA/IGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQgOiBcIlwiKSA6IHRvUHJvY2Vzcy50YWdOYW1lID09PSBcIkZJRUxEU0VUXCIgPyAobGVnZW5kLmlubmVySFRNTCArIChhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50Lmxlbmd0aCA9PT0gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZykubGVuZ3RoID8gXCJcIiA6IGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQpKSA6IFwiXCJ9JHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsID8gYDwvaCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbH0+YCA6IFwiXCJ9YDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBjb25zdHJ1Y3RIZWFkZXJTdXBwbGVtZW50cygpO1xuXG4gICAgICBoZWFkZXIuaW5uZXJIVE1MID0gYCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbCA/IGA8aCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbH0+YCA6IFwiXCJ9JHt0b0xvYWQuYXV0b2hlYWRlcnRpdGxlID8gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGUgYXMgc3RyaW5nKSArIChhdXRvSGVhZGVyVGl0bGVTdXBwbGVtZW50Lmxlbmd0aCAhPT0gKHRvTG9hZC5hdXRvaGVhZGVydGl0bGVzdXBsZW1lbnRzc3BhY2VyIGFzIHN0cmluZykubGVuZ3RoID8gYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCA6IFwiXCIpIDogdG9Qcm9jZXNzLnRhZ05hbWUgPT09IFwiRklFTERTRVRcIiA/IChsZWdlbmQgPyB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvcihcImxlZ2VuZFwiKT8uaW5uZXJIVE1MICsgKGF1dG9IZWFkZXJUaXRsZVN1cHBsZW1lbnQubGVuZ3RoID09PSAodG9Mb2FkLmF1dG9oZWFkZXJ0aXRsZXN1cGxlbWVudHNzcGFjZXIgYXMgc3RyaW5nKS5sZW5ndGggPyBcIlwiIDogYXV0b0hlYWRlclRpdGxlU3VwcGxlbWVudCkgOiBcIlwiKSA6IFwiXCJ9JHt0b0xvYWQuYXV0b2hlYWRlcmxldmVsID8gYDwvaCR7dG9Mb2FkLmF1dG9oZWFkZXJsZXZlbH0+YCA6IFwiXCJ9YDtcbiAgICAgIC8vICNlbmRyZWdpb24gQXV0b2hlYWRlciBTdXBwbGVtZW50XG4gICAgICBpZiAobGVnZW5kKSB7XG4gICAgICAgIGxlZ2VuZC5yZW1vdmUoKTtcbiAgICAgIH1cblxuICAgICAgaGVhZGVyLnNldEF0dHJpYnV0ZShcInN0eWxlXCIsIHRvTG9hZC5hdXRvaGVhZGVyY3NzIGFzIHN0cmluZyk7XG4gICAgICBoZWFkZXIuY2xhc3NMaXN0LmFkZChcIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpO1xuXG4gICAgICB3cnBIZWFkZXIuYXBwZW5kQ2hpbGQoaGVhZGVyKTtcbiAgICAgIHRvUHJvY2Vzcy5pbnNlcnRCZWZvcmUod3JwSGVhZGVyLCB0b1Byb2Nlc3MuZmlyc3RDaGlsZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGhlYWRlciA9IHRvUHJvY2Vzcy5xdWVyeVNlbGVjdG9yKFwiLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpO1xuICAgIH1cblxuICAgIGlmIChoZWFkZXIgPT09IG51bGwpIHtcbiAgICAgIHRocm93IG5ldyBDb2RCaUVycm9yKFxuICAgICAgICBgVGFnZ2VkIDxkaXY+IG9yIDxmaWVsZHNldD4gXCIke3RvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLW5hbWVcIil9XCIgY29udGFpbnMgbm8gSFRNTC1FbGVtZW50IHRhZ2dlZCB3aXRoIENTUy1cIkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIuYCxcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgICh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXIgPSBoZWFkZXI7XG5cbiAgICAgIHRvUHJvY2Vzcy5jbGFzc0xpc3QuYWRkKFwiLS1IVE1MX1BhbmVsXCIpO1xuXG4gICAgICBjb25zdCBzdHlIZWFkZXI6IHN0cmluZyB8IG51bGwgPSBoZWFkZXIuZ2V0QXR0cmlidXRlKFwic3R5bGVcIik7XG4gICAgICAvLyAjcmVnaW9uIERldGVybWluZSB3aGVyZSB0byByZS1pbnNlcnQgdGhlIGhlYWRlciB3aGVuIHBhbmVsIGdldHMgdW5mb2xkZWQuXG4gICAgICBjb25zdCBjaGlsZEFycmF5ID0gQXJyYXkuZnJvbSh0b1Byb2Nlc3MuY2hpbGRyZW4pO1xuICAgICAgY29uc3QgaWR4SGVhZGVyID0gY2hpbGRBcnJheS5pbmRleE9mKGhlYWRlci5wYXJlbnRFbGVtZW50KTtcbiAgICAgIGNvbnN0IGhlYWRlckFmdGVyRWxlbWVudDogRWxlbWVudCB8IHVuZGVmaW5lZCA9XG4gICAgICAgIGlkeEhlYWRlciA9PT0gY2hpbGRBcnJheS5sZW5ndGggLSAxID8gdW5kZWZpbmVkIDogY2hpbGRBcnJheVtpZHhIZWFkZXJdO1xuXG4gICAgICBpZiAoaGVhZGVyQWZ0ZXJFbGVtZW50KSB7XG4gICAgICAgIEhUTUxfUGFuZWwubWFwSGVhZGVyQWZ0ZXJFbGVtZW50cy5zZXQodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50LCBoZWFkZXJBZnRlckVsZW1lbnQgYXMgSFRNTEVsZW1lbnQpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgd2hlcmUgdG8gcmUtaW5zZXJ0IHRoZSBoZWFkZXIgd2hlbiBwYW5lbCBnZXRzIHVuZm9sZGVkLlxuICAgICAgY29uc3QgYnVmZmVyRGlzcGxheSA9ICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmRpc3BsYXk7IC8vIFN0b3JlIGluIG9yZGVyIHRvIHJlc3RvcmUgaXQgbGF0ZXIgb24uXG4gICAgICAvLyBEZXRlcm1pbmUgd2VhdGhlciBpbml0aWFsbHkgZm9sZGVkIG9yIG5vdC5cbiAgICAgICh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQgPSBkb2N1bWVudC5ib2R5LmNsYXNzTGlzdC5jb250YWlucyhcbiAgICAgICAgXCJmYy1wcmludC1tb2RlXCIsXG4gICAgICApXG4gICAgICAgID8gZmFsc2VcbiAgICAgICAgOiB0b0xvYWQuZm9sZGVkICE9PSB1bmRlZmluZWRcbiAgICAgICAgICA/ICh0b0xvYWQuZm9sZGVkIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKS50cmltKCkgPT09IFwidHJ1ZVwiXG4gICAgICAgICAgOiBmYWxzZTtcbiAgICAgIC8vICNyZWdpb24gQ29uc2lkZXIgaW5pdGlhbCBmb2xkaW5nIHN0YXRlLlxuICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQpIHtcbiAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCkuc3R5bGUuZGlzcGxheSA9IFwibm9uZVwiO1xuICAgICAgICBoZWFkZXI/LnJlbW92ZSgpO1xuICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKHRvTG9hZC5jc3NoZWFkZXJ1bmZvbGRlZCkge1xuICAgICAgICAgIGhlYWRlcj8uc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgdG9Mb2FkLmNzc2hlYWRlcnVuZm9sZGVkIGFzIHN0cmluZyk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQpIHtcbiAgICAgICAgdG9Qcm9jZXNzLmNsYXNzTGlzdC5hZGQoXCItLWZvbGRlZFwiKTtcbiAgICAgIH1cbiAgICAgIC8vICNlbmRyZWdpb24gQ29uc2lkZXIgaW5pdGlhbCBmb2xkaW5nIHN0YXRlLlxuICAgICAgLy8gI3JlZ2lvbiBJbmplY3QgbmVjZXNzYXJ5IHN0eWxlcy5cbiAgICAgIC8vICNyZWdpb24gRGV0ZXJtaW5lIFwidG9Qcm9jZXNzXCIncyBwYXJlbnQncyBpZC1BdHRyaWJ1dGUuXG4gICAgICAvLyBUaGlzIHdpbGwgYmUgdGhlIGlkIG9mIFwidG9Qcm9jZXNzXCIsIGlmIFwidG9Qcm9jZXNzXCIgaXMgYSBmaWVsZHNldC5cbiAgICAgIGxldCBwYXJlbnRJRCA9IGhlYWRlci5wYXJlbnRFbGVtZW50Py5nZXRBdHRyaWJ1dGUoXCJpZFwiKTtcblxuICAgICAgaWYgKHBhcmVudElEID09PSBudWxsKSB7XG4gICAgICAgIHBhcmVudElEID0gdG9Qcm9jZXNzLmdldEF0dHJpYnV0ZShcImlkXCIpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBEZXRlcm1pbmUgXCJ0b1Byb2Nlc3NcIidzIHBhcmVudCdzIGlkLUF0dHJpYnV0ZS5cbiAgICAgIC8vICNyZWdpb24gR2VuZXJhdGlvbi5cbiAgICAgIGNvbnN0IHN0eWxlID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgICBzdHlsZS5pbm5lckhUTUwgPSBgXG4gICAgICBAbWVkaWEoIHByaW50ICkgeyAjJHtwYXJlbnRJRH0uQ29kQmkuLS1IVE1MX1BhbmVsIHsgZGlzcGxheSA6ICR7YnVmZmVyRGlzcGxheX0gIWltcG9ydGFudCA7fX1cblxuICAgICAgLkNvZEJpX0hUTUxfUGFuZWxfTWlzc2luZ1JlcXVpcmVkRmllbGQgeyBib3JkZXItbGVmdC1zdHlsZTogc29saWQgIWltcG9ydGFudCA7IGJvcmRlci1yaWdodC1zdHlsZTogc29saWQgIWltcG9ydGFudCA7IHBhZGRpbmc6IC41ZW0gOyBib3gtc2hhZG93OiAwIDAgLjI1ZW0gZGFya29yYW5nZSA7IGJvcmRlci1jb2xvcjogcmVkICFpbXBvcnRhbnQgO31cblxuICAgICAgQG1lZGlhKCBwcmVmZXJzLWNvbG9yLXNjaGVtZSA6IGRhcmsgKSB7XG4gICAgICAgIC5Db2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkIHsgYm9yZGVyLWxlZnQtc3R5bGU6IHNvbGlkICFpbXBvcnRhbnQgOyBib3JkZXItcmlnaHQtc3R5bGU6IHNvbGlkICFpbXBvcnRhbnQgOyBwYWRkaW5nOiAuNWVtIDsgYm94LXNoYWRvdzogMCAwIC4yNWVtIGRhcmtvcmFuZ2UgOyBib3JkZXItY29sb3I6IGRhcmtvcmFuZ2UgIWltcG9ydGFudCA7fVxuXG4gICAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXIgeyAke3RvTG9hZC5kY3NzaGVhZGVydW5mb2xkZWQgPyB0b0xvYWQuZGNzc2hlYWRlcnVuZm9sZGVkIDogXCJiYWNrZ3JvdW5kOiBsaW5lYXItZ3JhZGllbnQoMTMwZGVnLCByZ2JhKDUsIDUsIDUsIDEpIDAlLCByZ2JhKDU2LCA0NywgNDcsIDEpIDIzJSwgcmdiYSg4NCwgNjIsIDYyLCAxKSA1NSUsIHJnYmEoNTYsIDUyLCA1MiwgMSkgODklLCByZ2JhKDAsIDAsIDAsIDEpIDEwMCUpICFpbXBvcnRhbnQgO1wifX19XG5cbiAgICAgIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlciA+IHAgeyBtYXJnaW4gOiAwIDt9XG5cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6YWZ0ZXIsXG4gICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjphZnRlciB7XG4gICAgICAgIGNvbnRlbnQgOiBcIiR7dG9Mb2FkLmNzc2FmdGVyaGVhZGVyY29udGVudCA/IHRvTG9hZC5jc3NhZnRlcmhlYWRlcmNvbnRlbnQgOiBcIlwifVwiO1xuXG4gICAgICAgICR7dG9Mb2FkLmNzc2FmdGVyaGVhZGVyID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVyIDogXCJcIn1cbiAgICAgIH1cblxuICAgICAgIyR7cGFyZW50SUR9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUsXG4gICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUge1xuICAgICAgICBjb250ZW50IDogXCIke3RvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50ID8gdG9Mb2FkLmNzc2JlZm9yZWhlYWRlcmNvbnRlbnQgOiBcIlwifVwiO1xuXG4gICAgICAgICR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlciA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXIgOiBcIlwifVxuICAgICAgfVxuXG4gICAgICAjJHtwYXJlbnRJRH0gLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOmhvdmVyLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpob3ZlciAgICAgeyAke3RvTG9hZC5jc3NoZWFkZXJob3ZlciA/IHRvTG9hZC5jc3NoZWFkZXJob3ZlciA6IFwiY29sb3I6IGRhcmtvcmFuZ2UgO1wifX1cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6aG92ZXIgPiAqLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpob3ZlciA+ICogeyAke3RvTG9hZC5jc3NoZWFkZXJob3ZlciA/IFwiXCIgOiBcIm1hcmdpbi1sZWZ0OiA1JSA7IHRyYW5zaXRpb246IC41cyBhbGwgO1wifX1cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6YWN0aXZlLFxuICAgICAgLlhGaWVsZFNldFdyYXBwZXI6aGFzKCAjJHtwYXJlbnRJRH0pIC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjphY3RpdmUgICAgeyAke3RvTG9hZC5jc3NoZWFkZXJhY3RpdmUgPyB0b0xvYWQuY3NzaGVhZGVyYWN0aXZlIDogXCJzY2FsZSA6IC45IDtcIn19XG5cbiAgICAgICR7XG4gICAgICAgIHRvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxcbiAgICAgICAgICA/IGBAa2V5ZnJhbWVzIENvZEJpX0ZhZGVJTl9QYW5lbF8ke3BhcmVudElEfSB7XG4gICAgICAgICAgJHt0b0xvYWQuY3NzYW5pbWZhZGVpbnBhbmVsfX1gXG4gICAgICAgICAgOiBcIlwiXG4gICAgICB9XG5cbiAgICAgICMke3BhcmVudElEfSAuQ29kQmkuLS1IVE1MX1BhbmVsLFxuICAgICAgIyR7cGFyZW50SUR9LkNvZEJpLi0tSFRNTF9QYW5lbCAgICB7IGFuaW1hdGlvbiA6IENvZEJpX0ZhZGVJTl9QYW5lbF8ke3BhcmVudElEfSAke3RvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxkdXJhdGlvbiA/IHRvTG9hZC5jc3NhbmltZmFkZWlucGFuZWxkdXJhdGlvbiA6IFwiMHNcIn0gJHt0b0xvYWQuY3NzYW5pbWZhZGVpbnBhbmVsZWFzaW5nID8gdG9Mb2FkLmNzc2FuaW1mYWRlaW5wYW5lbGVhc2luZyA6IFwiZWFzZS1pbi1vdXRcIn0gZm9yd2FyZHMgO31gO1xuXG4gICAgICBjb25zdCBzdHlsZUFmdGVyVW5mb2xkZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgIHN0eWxlQWZ0ZXJVbmZvbGRlZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICMke3BhcmVudElEfSA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjphZnRlcixcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gKiA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjphZnRlciB7XG4gICAgICAgICAgY29udGVudCA6IFwiJHt0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgPyB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgOiB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50ID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVyY29udGVudCA6IFwiXCJ9XCI7XG5cbiAgICAgICAgICAke3RvTG9hZC5jc3NhZnRlcmhlYWRlcnVuZm9sZGVkID8gdG9Mb2FkLmNzc2FmdGVyaGVhZGVydW5mb2xkZWQgOiB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXIgPyB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXIgOiBcIlwifX1gO1xuXG4gICAgICBjb25zdCBzdHlsZUJlZm9yZVVuZm9sZGVkID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInN0eWxlXCIpO1xuXG4gICAgICBzdHlsZUJlZm9yZVVuZm9sZGVkLmlubmVySFRNTCA9IGBcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gc3R5bGUgKyAuQ29kQmlfSFRNTF9QYW5lbF9IZWFkZXI6OmJlZm9yZSxcbiAgICAgICAgIyR7cGFyZW50SUR9ID4gKiA+IHN0eWxlICsgLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOjpiZWZvcmUge1xuICAgICAgICAgIGNvbnRlbnQgOiBcIiR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlcmNvbnRlbnR1bmZvbGRlZCA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50dW5mb2xkZWQgOiB0b0xvYWQuY3NzYmVmb3JlaGVhZGVyY29udGVudCA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXJjb250ZW50IDogXCJcIn1cIjtcblxuICAgICAgICAgICR7dG9Mb2FkLmNzc2JlZm9yZWhlYWRlcnVuZm9sZGVkID8gdG9Mb2FkLmNzc2JlZm9yZWhlYWRlcnVuZm9sZGVkIDogdG9Mb2FkLmNzc2JlZm9yZWhlYWRlciA/IHRvTG9hZC5jc3NiZWZvcmVoZWFkZXIgOiBcIlwifX1gO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBHZW5lcmF0aW9uLlxuICAgICAgLy8gI3JlZ2lvbiBBY3R1YWwgaW5qZWN0aW9uLlxuICAgICAgaGVhZGVyLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShzdHlsZSwgaGVhZGVyKTtcblxuICAgICAgaWYgKHRvTG9hZC53cmFwcGVyY3NzICYmIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5jbGFzc0xpc3QuY29udGFpbnMoXCJYRmllbGRTZXRXcmFwcGVyXCIpKSB7XG4gICAgICAgIHRvUHJvY2Vzcy5wYXJlbnRFbGVtZW50Py5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCB0b0xvYWQud3JhcHBlcmNzcyBhcyBzdHJpbmcpO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBBY3R1YWwgaW5qZWN0aW9uLlxuICAgICAgLy8gI2VuZHJlZ2lvbiBJbmplY3QgbmVjZXNzYXJ5IHN0eWxlcy5cbiAgICAgIC8vICNyZWdpb24gSGFuZGxlIGNsaWNrcyBvbiB0aGUgaGVhZGVyLlxuICAgICAgaGVhZGVyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQpID0+IHtcbiAgICAgICAgaWYgKCh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQpIHtcbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0pLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkID0gIShcbiAgICAgICAgICAgIHRvUHJvY2VzcyBhcyB1bmtub3duIGFzIHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9XG4gICAgICAgICAgKS5Db2RCaV9IVE1MX1BhbmVsX0ZvbGRlZDtcbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5zdHlsZS5kaXNwbGF5ID0gYnVmZmVyRGlzcGxheTtcblxuICAgICAgICAgIGhlYWRlcj8ucmVtb3ZlKCk7XG5cbiAgICAgICAgICBpZiAodG9Mb2FkLmNzc2hlYWRlcnVuZm9sZGVkKSB7XG4gICAgICAgICAgICBoZWFkZXIuc2V0QXR0cmlidXRlKFwic3R5bGVcIiwgdG9Mb2FkLmNzc2hlYWRlcnVuZm9sZGVkIGFzIHN0cmluZyk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGhlYWRlckFmdGVyRWxlbWVudCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5hcHBlbmRDaGlsZChoZWFkZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5pbnNlcnRCZWZvcmUoaGVhZGVyLCBoZWFkZXJBZnRlckVsZW1lbnQpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJjb250ZW50dW5mb2xkZWQgfHwgdG9Mb2FkLmNzc2FmdGVyaGVhZGVydW5mb2xkZWQpIHtcbiAgICAgICAgICAgIGhlYWRlci5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUoc3R5bGVBZnRlclVuZm9sZGVkLCBoZWFkZXIpO1xuICAgICAgICAgICAgaGVhZGVyLnBhcmVudEVsZW1lbnQ/Lmluc2VydEJlZm9yZShzdHlsZUJlZm9yZVVuZm9sZGVkLCBoZWFkZXIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0b0xvYWQuc2Nyb2xsKSB7XG4gICAgICAgICAgICB0b1Byb2Nlc3Muc2Nyb2xsSW50b1ZpZXcoe1xuICAgICAgICAgICAgICBiZWhhdmlvcjogXCJzbW9vdGhcIixcbiAgICAgICAgICAgICAgYmxvY2s6IHRvTG9hZC5zY3JvbGxibG9jayBhcyBTY3JvbGxMb2dpY2FsUG9zaXRpb24sXG4gICAgICAgICAgICAgIGlubGluZTogXCJuZWFyZXN0XCIsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgYWNjb3JkaW9ucyBlbmFibGluZyBsaXZlIGNoYW5nZXMuXG4gICAgICAgICAgaWYgKHRvUHJvY2Vzcy5oYXNBdHRyaWJ1dGUoXCJkYXRhLWNiLWFjY29yZGlvblwiKSkge1xuICAgICAgICAgICAgdG9Mb2FkLmFjY29yZGlvbiA9IHRvUHJvY2Vzcy5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNiLWFjY29yZGlvblwiKTtcblxuICAgICAgICAgICAgZm9yIChjb25zdCB0b0ZvbGQgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgICAgICAgYC5Db2RCaS4tLUhUTUxfUGFuZWxbIGRhdGEtY2ItYWNjb3JkaW9uID0gXCIke3RvTG9hZC5hY2NvcmRpb24gYXMgc3RyaW5nfVwiXTpub3QoLi0tZm9sZGVkKWAsXG4gICAgICAgICAgICApKSB7XG4gICAgICAgICAgICAgIHRvRm9sZFxuICAgICAgICAgICAgICAgIC5xdWVyeVNlbGVjdG9yKFwiLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyXCIpXG4gICAgICAgICAgICAgICAgPy5kaXNwYXRjaEV2ZW50KG5ldyBNb3VzZUV2ZW50KFwiY2xpY2tcIiwgeyBidWJibGVzOiB0cnVlIH0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgYWNjb3JkaW9ucyBlbmFibGluZyBsaXZlIGNoYW5nZXMuXG4gICAgICAgICAgKHRvUHJvY2VzcyBhcyBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LnJlbW92ZShcIi0tZm9sZGVkXCIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICh0b1Byb2Nlc3MgYXMgdW5rbm93biBhcyB7IFtrZXk6IHN0cmluZ106IHVua25vd24gfSkuQ29kQmlfSFRNTF9QYW5lbF9Gb2xkZWQgPSAhKFxuICAgICAgICAgICAgdG9Qcm9jZXNzIGFzIHVua25vd24gYXMgeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH1cbiAgICAgICAgICApLkNvZEJpX0hUTUxfUGFuZWxfRm9sZGVkO1xuICAgICAgICAgICh0b1Byb2Nlc3MgYXMgSFRNTEVsZW1lbnQpLnN0eWxlLmRpc3BsYXkgPSBcIm5vbmVcIjtcblxuICAgICAgICAgIGhlYWRlci5yZW1vdmUoKTtcblxuICAgICAgICAgIGlmIChzdHlIZWFkZXIpIHtcbiAgICAgICAgICAgIGhlYWRlci5zZXRBdHRyaWJ1dGUoXCJzdHlsZVwiLCBzdHlIZWFkZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5wYXJlbnRFbGVtZW50Py5hcHBlbmRDaGlsZChoZWFkZXIpO1xuXG4gICAgICAgICAgaWYgKHRvTG9hZC5jc3NhZnRlcmhlYWRlcmNvbnRlbnR1bmZvbGRlZCB8fCB0b0xvYWQuY3NzYWZ0ZXJoZWFkZXJ1bmZvbGRlZCkge1xuICAgICAgICAgICAgc3R5bGVBZnRlclVuZm9sZGVkLnJlbW92ZSgpO1xuICAgICAgICAgICAgc3R5bGVCZWZvcmVVbmZvbGRlZC5yZW1vdmUoKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAodG9Qcm9jZXNzIGFzIEhUTUxFbGVtZW50KS5jbGFzc0xpc3QuYWRkKFwiLS1mb2xkZWRcIik7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgY2xpY2tzIG9uIHRoZSBoZWFkZXIuXG4gICAgICAvLyAjcmVnaW9uIFJlcXVpcmVkIGZpZWxkcyBoYW5kbGluZyAodmFsaWRhdGlvbiBoYW5kbGluZykuXG4gICAgICBsZXQgcmVxdWlyZWRGaWVsZHNDb250YWluZWQgPSBmYWxzZTtcblxuICAgICAgZm9yIChjb25zdCByZXF1aXJlZCBvZiB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvckFsbCgnWyBhcmlhLXJlcXVpcmVkID0gXCJ0cnVlXCJdJykpIHtcbiAgICAgICAgLy9IVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5wdXNoKHJlcXVpcmVkIGFzIEhUTUxFbGVtZW50KTtcblxuICAgICAgICByZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCkge1xuICAgICAgICAvLyAjcmVnaW9uIFN0eWxlIGdlbmVyYXRpb24gJiBpbmplY3Rpb24uXG4gICAgICAgIGNvbnN0IHN0eWxlUmVxdWlyZWRGaWVsZHNDb250YWluZWQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3R5bGVcIik7XG5cbiAgICAgICAgc3R5bGVSZXF1aXJlZEZpZWxkc0NvbnRhaW5lZC5pbm5lckhUTUwgPSBgXG4gICAgICAgICAgIyR7cGFyZW50SUR9ID4gLkNvZEJpX0hUTUxfUGFuZWxfSGVhZGVyOmJlZm9yZSxcbiAgICAgICAgICAjJHt0b1Byb2Nlc3MucGFyZW50RWxlbWVudD8ucGFyZW50RWxlbWVudD8uZ2V0QXR0cmlidXRlKFwiaWRcIil9ID4gKiA+IC5Db2RCaV9IVE1MX1BhbmVsX0hlYWRlcjpiZWZvcmUge1xuICAgICAgICAgICAgY29udGVudCA6IFwiJHt0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHNjb250ZW50ID8gdG9Mb2FkLmNzc3JlcXVpcmVkZmllbGRzY29udGVudCA6IFwiKlwifVwiO1xuXG4gICAgICAgICAgJHt0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHMgPyB0b0xvYWQuY3NzcmVxdWlyZWRmaWVsZHMgOiBcImNvbG9yIDogcmVkIDsgcG9zaXRpb24gOiByZWxhdGl2ZSA7IHRvcCA6IC41ZW0gO1wifX1gO1xuXG4gICAgICAgIGhlYWRlci5wYXJlbnRFbGVtZW50Py5pbnNlcnRCZWZvcmUoc3R5bGVSZXF1aXJlZEZpZWxkc0NvbnRhaW5lZCwgaGVhZGVyKTtcbiAgICAgICAgLy8gI3JlZ2lvbiBTdHlsZSBnZW5lcmF0aW9uICYgaW5qZWN0aW9uLlxuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBSZXF1aXJlZCBmaWVsZHMgaGFuZGxpbmcgKHZhbGlkYXRpb24gaGFuZGxpbmcpLlxuICAgICAgLy8gI3JlZ2lvbiBQcmV2ZW50IGZvcm0gc3VibWlzc2lvbiBhcyBsb25nIGFzIHRoZXJlJ3JlIGludmFsaWQgZmllbGRzLlxuICAgICAgZ2V0WFV0aWwoKS5vbihcInN1Ym1pdFwiLCAocGFyYW1zKSA9PiB7XG4gICAgICAgIC8vICNyZWdpb24gVW50YWcgbWlzc2luZyByZXF1aXJlZCBmaWVsZHMuXG4gICAgICAgIGZvciAoY29uc3QgdW50YWcgb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi5Db2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkXCIpKSB7XG4gICAgICAgICAgdW50YWcuY2xhc3NMaXN0LnJlbW92ZShcIkNvZEJpX0hUTUxfUGFuZWxfTWlzc2luZ1JlcXVpcmVkRmllbGRcIik7XG4gICAgICAgIH1cbiAgICAgICAgLy8gI2VuZHJlZ2lvbiBVbnRhZyBtaXNzaW5nIHJlcXVpcmVkIGZpZWxkcy5cbiAgICAgICAgbGV0IHJlYWxseUludmFsaWQgPSBmYWxzZTtcblxuICAgICAgICBmb3IgKGNvbnN0IGNhbmRpZGF0ZSBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdbIGFyaWEtcmVxdWlyZWQgPSBcInRydWVcIl0nKSkge1xuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgIChjYW5kaWRhdGUgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxTZWxlY3RFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPT09IFwiXCIgfHxcbiAgICAgICAgICAgIChjYW5kaWRhdGUgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxTZWxlY3RFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkudmFsdWUgPT09IHVuZGVmaW5lZFxuICAgICAgICAgICkge1xuICAgICAgICAgICAgSFRNTF9QYW5lbC51bmZvbGRQYW5lbEFuY2VzdG9ycyhjYW5kaWRhdGUgYXMgSFRNTEVsZW1lbnQpO1xuXG4gICAgICAgICAgICBpZiAoIWlzRGlzcGxheU5vbmUoY2FuZGlkYXRlIGFzIEhUTUxFbGVtZW50KSkge1xuICAgICAgICAgICAgICBsZXQgY2hlY2tlZFNlbGVjdGlvbiA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgIGlmIChjYW5kaWRhdGUuY2xhc3NMaXN0LmNvbnRhaW5zKFwiWFNlbGVjdFwiKSkge1xuICAgICAgICAgICAgICAgIGZvciAoY29uc3Qgb3B0aW9uIG9mIGNhbmRpZGF0ZS5xdWVyeVNlbGVjdG9yQWxsKFwiaW5wdXRcIikpIHtcbiAgICAgICAgICAgICAgICAgIGlmIChvcHRpb24uY2hlY2tlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBjaGVja2VkU2VsZWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBpZiAoIWNoZWNrZWRTZWxlY3Rpb24pIHtcbiAgICAgICAgICAgICAgICAvLyAjcmVnaW9uIERldGVybWluZSBhbmQgZ28gdG8gcGFnZS5cbiAgICAgICAgICAgICAgICBjb25zdCBwYWdlTmFtZSA9IEhUTUxfUGFuZWwuZGV0ZXJtaW5lUGFnZShjYW5kaWRhdGUgYXMgSFRNTEVsZW1lbnQpPy5nZXRBdHRyaWJ1dGUoXCJkYXRhLXhuXCIpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICAgICAgICBnb3RvUGFnZShwYWdlTmFtZSk7XG4gICAgICAgICAgICAgICAgICBjYW5kaWRhdGUuc2Nyb2xsSW50b1ZpZXcoeyBiZWhhdmlvcjogXCJzbW9vdGhcIiwgYmxvY2s6IHRvTG9hZC5zY3JvbGxibG9jayBhcyBTY3JvbGxMb2dpY2FsUG9zaXRpb24gfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIGFuZCBnbyB0byBwYWdlLlxuICAgICAgICAgICAgICAgIChjYW5kaWRhdGUgYXMgSFRNTElucHV0RWxlbWVudCB8IEhUTUxTZWxlY3RFbGVtZW50IHwgSFRNTFRleHRBcmVhRWxlbWVudCkuZm9jdXMoKTtcblxuICAgICAgICAgICAgICAgIChjYW5kaWRhdGUgYXMgSFRNTEVsZW1lbnQpLmNsYXNzTGlzdC5hZGQoXCJDb2RCaV9IVE1MX1BhbmVsX01pc3NpbmdSZXF1aXJlZEZpZWxkXCIpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHsgcHJldmVudFN1Ym1pc3Npb246IHRydWUgfTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICByZXR1cm4geyBwcmV2ZW50U3VibWlzc2lvbjogZmFsc2UgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGludmFsaWQgb2YgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMpIHtcbiAgICAgICAgICAgIHJlYWxseUludmFsaWQgPSB0cnVlO1xuXG4gICAgICAgICAgICBIVE1MX1BhbmVsLnVuZm9sZFBhbmVsQW5jZXN0b3JzKGludmFsaWQpO1xuICAgICAgICAgICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgYW5kIGdvIHRvIHBhZ2UuXG4gICAgICAgICAgICBjb25zdCBwYWdlTmFtZSA9IEhUTUxfUGFuZWwuZGV0ZXJtaW5lUGFnZShpbnZhbGlkKT8uZ2V0QXR0cmlidXRlKFwiZGF0YS14blwiKTtcblxuICAgICAgICAgICAgaWYgKHBhZ2VOYW1lKSB7XG4gICAgICAgICAgICAgIGdvdG9QYWdlKHBhZ2VOYW1lKTtcbiAgICAgICAgICAgICAgaW52YWxpZC5zY3JvbGxJbnRvVmlldyh7IGJlaGF2aW9yOiBcInNtb290aFwiLCBibG9jazogdG9Mb2FkLnNjcm9sbGJsb2NrIGFzIFNjcm9sbExvZ2ljYWxQb3NpdGlvbiB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIGFuZCBnbyB0byBwYWdlLlxuICAgICAgICAgICAgaW52YWxpZC5mb2N1cygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIHJldHVybiB7IHByZXZlbnRTdWJtaXNzaW9uOiByZWFsbHlJbnZhbGlkIH07XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgICAgLy8gI2VuZHJlZ2lvbiBQcmV2ZW50IGZvcm0gc3VibWlzc2lvbiBhcyBsb25nIGFzIHRoZXJlJ3JlIGludmFsaWQgZmllbGRzLlxuICAgICAgLy8gI3JlZ2lvbiBIYW5kbGUgdW5mb2xkaW5nIG9mIHBhbmVscyBjb250YWluaW5nIGludmFsaWQgZmllbGRzLlxuICAgICAgaWYgKCFIVE1MX1BhbmVsLnZhbGlkYXRvclJlZ2lzdGVyZWQpIHtcbiAgICAgICAgeG1fdmFsaWRhdG9yLm9uKFwiYmVnaW5cIiwgKGRhdGEpID0+IHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZGF0YS5pdGVtcykge1xuICAgICAgICAgICAgaWYgKCFIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5pbmNsdWRlcyhpdGVtKSAmJiBpdGVtLmdldEF0dHJpYnV0ZShcImFyaWEtaW52YWxpZFwiKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgICAgICAgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMucHVzaChpdGVtKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKEhUTUxfUGFuZWwuaW52YWxpZEVsZW1lbnRzLmluY2x1ZGVzKGl0ZW0pICYmIGl0ZW0uZ2V0QXR0cmlidXRlKFwiYXJpYS1pbnZhbGlkXCIpID09PSBcImZhbHNlXCIpIHtcbiAgICAgICAgICAgICAgSFRNTF9QYW5lbC5pbnZhbGlkRWxlbWVudHMgPSBIVE1MX1BhbmVsLmludmFsaWRFbGVtZW50cy5maWx0ZXIoKGNhbmRpZGF0ZSkgPT4gY2FuZGlkYXRlICE9PSBpdGVtKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBIYW5kbGUgdW5mb2xkaW5nIG9mIHBhbmVscyBjb250YWluaW5nIGludmFsaWQgZmllbGRzLlxuICAgIH1cbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiSFRNTC5QYW5lbFwiLCBIVE1MX1BhbmVsLmZ1bmN0aW9uYWxpdHkuYmluZChIVE1MX1BhbmVsKSk7IC8vIEluaXRpYWxpemVcbi8vICNyZWdpb24gSGVscGVyXG4vKipcbiAqIEZpbmRzIGlmIGFuIGVsZW1lbnQgd2l0aCBhIHNwZWNpZmljIGNsYXNzIGV4aXN0cyBiZXR3ZWVuIHR3byBub2Rlcy5cbiAqXG4gKiBAcGFyYW0ge3N0cmluZ30gICAgICBzdXNwZWN0IC0gVGhlIGNsYXNzIHRvIGxvb2sgZm9yLlxuICogQHBhcmFtIHtIVE1MRWxlbWVudH0gc3RhcnQgICAtIFRoZSBzdGFydGluZyBIVE1MIGVsZW1lbnQuXG4gKiBAcGFyYW0ge0hUTUxFbGVtZW50fSBlbmQgICAgIC0gVGhlIGVuZGluZyBIVE1MIGVsZW1lbnQuXG4gKlxuICogQHJldHVybnMge2Jvb2xlYW59IFRydWUgaWYgdGhlIGNsYXNzIGlzIGZvdW5kIGJldHdlZW4gdGhlIG5vZGVzIChleGNsdXNpdmUpLiAqL1xuZnVuY3Rpb24gaXNDbGFzc0luQmV0d2VlbihzdXNwZWN0OiBzdHJpbmcsIHN0YXJ0OiBIVE1MRWxlbWVudCwgZW5kOiBIVE1MRWxlbWVudCk6IGJvb2xlYW4ge1xuICB3aGlsZSAoZW5kICYmIGVuZCAhPT0gc3RhcnQpIHtcbiAgICBpZiAoXG4gICAgICBlbmQuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikuaW5kZXhPZihgICR7c3VzcGVjdH0gYCkgIT09IC0xIHx8XG4gICAgICBlbmQuZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikuaW5kZXhPZihgICR7c3VzcGVjdH1cImApICE9PSAtMSB8fFxuICAgICAgZW5kLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpLmluZGV4T2YoYFwiJHtzdXNwZWN0fSBgKSAhPT0gLTEgfHxcbiAgICAgIGVuZC5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKS5pbmRleE9mKGBcIiR7c3VzcGVjdH1cImApICE9PSAtMVxuICAgICkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIC8vIGJpb21lLWlnbm9yZSBsaW50L3N0eWxlL25vUGFyYW1ldGVyQXNzaWduOiBObyBuZWVkIGZvciBhIGxvY2FsIHZhcmlhYmxlIGZvciBzdWNoIHNob3J0IGNvZGUuXG4gICAgZW5kID0gZW5kLnBhcmVudEVsZW1lbnQ7XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgKipzdXNwZWN0Kioge0BsaW5rIEhUTUxFbGVtZW50IH0gaXMgaGlkZGVuIGNhdXNlIG9mIGl0J3Mgb3duIG9yIG9uZSBvZiBpdCdTIGFuY2VzdG9yJ3NcbiAqIENTUyAqKmRpc3BsYXkqKiBwcm9wZXJ0eSBpcyBzZXQgdG8gKipub25lKiouXG4gKlxuICogQHBhcmFtIHN1c3BlY3QgVGhlIHtAbGluayBIVE1MRWxlbWVudCB9IHRvIGNoZWNrLlxuICpcbiAqIEByZXR1cm5zICoqVFJVRSoqIGlmIHRoZSAqKnN1c3BlY3QqKiB7QGxpbmsgSFRNTEVsZW1lbnQgfSBpcyBoaWRkZW4sIG90aGVyd2lzZSAqKkZBTFNFKiouICovXG5mdW5jdGlvbiBpc0Rpc3BsYXlOb25lKHN1c3BlY3Q6IEhUTUxFbGVtZW50KSB7XG4gIHdoaWxlIChzdXNwZWN0ICE9PSBudWxsKSB7XG4gICAgaWYgKHN1c3BlY3Quc3R5bGUuZGlzcGxheSA9PT0gXCJub25lXCIpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdHlsZS9ub1BhcmFtZXRlckFzc2lnbjpcbiAgICBzdXNwZWN0ID0gc3VzcGVjdC5wYXJlbnRFbGVtZW50O1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuLy8gI2VuZHJlZ2lvbiBIZWxwZXJcbiIsICJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XHJcbi8qKlxyXG4gKiBBIHtAbGluayBEQkMgfSBkZWZpbmluZyB0aGF0IGFuIHtAbGluayBvYmplY3QgfXMgbXVzdCBiZSAqKnVuZGVmaW5lZCoqLlxyXG4gKlxyXG4gKiBAcmVtYXJrc1xyXG4gKiBNYWludGFpbmVyOiBTYWx2YXRvcmUgQ2FsbGFyaSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIFVOREVGSU5FRCBleHRlbmRzIERCQyB7XHJcblx0LyoqXHJcblx0ICogQ2hlY2tzIGlmIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBpcyB1bmRlZmluZWQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVja1x0VGhlIHtAbGluayBPYmplY3QgfSB0byBjaGVjay5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGlzIG9mIHRoZSBzcGVjaWZpZWQgKip0eXBlKiosIG90aGVyd2lzZSBGQUxTRS4gKi9cclxuXHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IE5lY2Vzc2FyeSBmb3IgZHluYW1pYyB0eXBlIGNoZWNraW5nIG9mIGFsc28gVU5ERUZJTkVELlxyXG5cdHB1YmxpYyBzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjazogYW55KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL3VzZVZhbGlkVHlwZW9mOiBOZWNlc3NhcnlcclxuXHRcdGlmICh0b0NoZWNrICE9PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0cmV0dXJuIGBWYWx1ZSBtdXN0IGJlIFVOREVGSU5FRCBidXQgaXQgaXMgJHt0eXBlb2YgdG9DaGVja31gO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgcGFyYW1ldGVyLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHBhdGhcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBoaW50XHRTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cclxuXHQgKlxyXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgUFJFKFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRtZXRob2ROYW1lOiBzdHJpbmcgfCBzeW1ib2wsXHJcblx0XHRwYXJhbWV0ZXJJbmRleDogbnVtYmVyLFxyXG5cdCkgPT4gdm9pZCB7XHJcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcclxuXHRcdFx0KFxyXG5cdFx0XHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRcdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRcdFx0bWV0aG9kTmFtZTogc3RyaW5nLFxyXG5cdFx0XHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0XHRcdCkgPT4ge1xyXG5cdFx0XHRcdHJldHVybiBVTkRFRklORUQuY2hlY2tBbGdvcml0aG0odmFsdWUpO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHRcdGhpbnRcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgVU5ERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXHJcblx0ICogYnkgdGhlIHRhZ2dlZCBtZXRob2QncyByZXR1cm52YWx1ZS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBwYXRoXHRTZWUge0BsaW5rIERCQy5Qb3N0Y29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBoaW50XHRTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBQT1NUKFxyXG5cdFx0cGF0aDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aGludDogc3RyaW5nIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0cmV0dXJuIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobSh2YWx1ZSk7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdFx0aGludFxyXG5cdFx0KTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxyXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcGF0aFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGhpbnRcdFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHR0eXBlOiBzdHJpbmcsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRoaW50OiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmM6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpIHtcclxuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFtuZXcgVU5ERUZJTkVEKCldLCBwYXRoLCBkYmMsIGhpbnQpO1xyXG5cdH1cclxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvLyAjcmVnaW9uIFJlZmVyZW5jZWQgQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vXHJcblx0Ly8gRm9yIHVzYWdlIGluIGR5bmFtaWMgc2NlbmFyaW9zIChsaWtlIHdpdGggQUUtREJDKS5cclxuXHQvL1xyXG5cdC8qKlxyXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBVTkRFRklORUQuY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiBhbmQgdGhlIHtAbGluayBVTkRFRklORUQudHlwZSB9IC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgVU5ERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobX0uICovXHJcblx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0cHVibGljIGNoZWNrKHRvQ2hlY2s6IGFueSkge1xyXG5cdFx0cmV0dXJuIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobSh0b0NoZWNrKTtcclxuXHR9XHJcblx0LyoqXHJcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIFVOREVGSU5FRC5jaGVja0FsZ29yaXRobSB9IHBhc3NpbmcgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUge0BsaW5rIFVOREVGSU5FRC50eXBlIH0gLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFNlZSB7QGxpbmsgVU5ERUZJTkVELmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGlkXHRcdEEge0BsaW5rIHN0cmluZyB9IGlkZW50aWZ5aW5nIHRoaXMge0BsaW5rIElOU1RBTkNFIH0gdmlhIHRoZSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9LU1lc3NhZ2UuXHJcblx0ICogXHJcblx0ICogQHJldHVybnMgVGhlICoqQ0FORElEQVRFKiogKip0b0NoZWNrKiogZG9lc24ndCBmdWxmaWxsIHRoaXMge0BsaW5rIFVOREVGSU5FRCB9LlxyXG5cdCAqIFxyXG5cdCAqIEB0aHJvd3MgQSB7QGxpbmsgREJDLkluZnJpbmdlbWVudCB9IGlmIHRoZSAqKkNBTkRJREFURSoqICoqdG9DaGVjayoqIGRvZXMgbm90IGZ1bGZpbGwgdGhpcyB7QGxpbmsgVU5ERUZJTkVEIH0uKi9cclxuXHRwdWJsaWMgc3RhdGljIHRzQ2hlY2s8Q0FORElEQVRFID0gdW5rbm93bj4odG9DaGVjazogQ0FORElEQVRFIHwgdW5kZWZpbmVkIHwgbnVsbCwgaWQ6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCk6IENBTkRJREFURSB7XHJcblx0XHRjb25zdCByZXN1bHQgPSBVTkRFRklORUQuY2hlY2tBbGdvcml0aG0odG9DaGVjayk7XHJcblxyXG5cdFx0aWYgKHJlc3VsdCA9PT0gdHJ1ZSkge1xyXG5cdFx0XHRyZXR1cm4gdG9DaGVjayBhcyBDQU5ESURBVEU7XHJcblx0XHR9XHJcblx0XHRlbHNlIHtcclxuXHRcdFx0dGhyb3cgbmV3IERCQy5JbmZyaW5nZW1lbnQoYCR7aWQgPyBgKCR7aWR9KSBgIDogXCJcIn0ke3Jlc3VsdCBhcyBzdHJpbmd9YCk7XHJcblx0XHR9XHJcblx0fVxyXG5cdC8qKiBDcmVhdGVzIHRoaXMge0BsaW5rIFVOREVGSU5FRCB9LiAqL1xyXG5cdHB1YmxpYyBjb25zdHJ1Y3RvcigpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG59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
