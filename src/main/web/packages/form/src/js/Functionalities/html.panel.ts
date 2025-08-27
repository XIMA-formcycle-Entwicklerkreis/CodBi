// #region Imports
// #region XIMA
import { getXUtil } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * Provides the {@link HTML_Panel.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Panel {
  /**
   * Retrieves the first ".CXPage"-{@link HTMLElement } above the given "element".
   *
   * @param element The {@link HTMLElement } to start the search from.
   *
   * @returns The ".CXPage"-{@link HTMLElement } containing the given "element". */
  public static determinePage(element: HTMLElement): HTMLElement | null {
    let currentElement: HTMLElement | null = element;

    while (currentElement !== null) {
      if (currentElement.classList.contains("CXPage")) {
        return currentElement;
      }

      currentElement = currentElement.parentElement;
    }

    return currentElement;
  }
  /** Stores all {@link HTMLElement }s that're currently invalid. */
  public static invalidElements: Array<HTMLElement> = new Array<HTMLElement>();
  /**
   * Unfolds all HTML-Panels that are ancestors of the specified {@link Element } by simulating a click on their
   * header if they're folded.
   *
   * @param from The {@link Element } to start the unfolding from. */
  public static unfoldPanelAncestors(from: HTMLElement): void {
    let currentElement: HTMLElement | null = from;

    while (currentElement !== null) {
      if ((currentElement as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
        ((currentElement as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Header as HTMLElement).click();
      }

      currentElement = currentElement.parentElement;
    }
  }
  /**
   * This functionality transforms the tagged {@link HTMLDivElement } into a Panel. The panel's header, which is used to fold/unfold
   * the panel, is an {@link HTMLElement } tagged with the CSS-Class "CodBi_HTML_Panel_Header" that is nested  at most
   * two levels within the tagged {@link HTMLElement}. Thus using a * XIMA-Text-Element as the header will provide
   * the XIMA-Text/HTML-Editor for creating the header's content.
   *
   * Config Parameter:
   *  - Folded:                         States whether this panel is folded (TRUE) or unfolded (everything else) when
   *                                    it is loaded (defaults to TRUE).
   *  - CSSHeaderHover:                 The optional header's CSS:hover (defaults to { scale : 1.1 ;}).
   *  - CSSHeaderActive:                The optional header's CSS:active (defaults to { scale : .9 ;}).
   *  - CSSHeaderUnfolded:              The optional CSS to be applied onto the header when the panel is unfolded.
   *  - CSSAnimFadeINPanel:             The optional animation to be applied onto the panel whenever the panel
   *                                    is unfolded.
   *  - CSSAnimFadeINPanelDuration:     The optional animation's duration that is applied onto the panel whenever
   *                                    the panel is unfolded (defaults to 0s).
   *  - CSSAnimFadeINPanelEasing:       The optional animation's easing function that is applied onto the panel
   *                                    whenever the panel is unfolded (defaults to "ease-in-out").
   *  - CSSAfterHeader:                 The CSS:after to be applied onto the header when the panel is folded.
   *  - CSSAfterHeaderContent:          The CSS:after content to be applied onto the header when the panel is folded.
   *  - CSSAfterHeaderContentUnfolded:  The CSS:after content to be applied onto the header when the panel is unfolded.
   *  - CSSRequiredFieldsContent:       The CSS:before content to applied onto the header if it contains a validation
   *                                    sensitive field.
   *  - CSSRequiredFields:              The CSS:before to applied onto the header if it contains a validation
   *                                    sensitive field.
   *  - AutoHeaderTitle:                The {@link string }the automatically generated header shall display.
   *  - AutoHeaderLevel:                Which level of enclosing \<h>s the "AutoHeaderTitle" shall have,
   *                                    e.g. to get a \<h1> enclosure the value has to be 1.
   *  - ScrollBlock:                    Defines the logical position to scroll to when the panel
   *                                    is unfolded (start, center, end, nearest). Defaults to "nearest".
   *  - GenerateHeader:                 States whether a header shall be automatically generated. Defaults to FALSE.
   *  - Scroll                          States whether the view shall be scrolled when the panel unfolds.
   *                                    Default is FALSE.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } if the tagged {@link Element } does not contain
   *          a child of CSS-Class "CodBi_HTML_Panel_Header".*/
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(REGEX.stdExp.keyPath, "path")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    toLoad: { [key: string]: unknown },
    @INSTANCE.PRE(HTMLDivElement)
    toProcess: Element,
  ): undefined {
    let header: HTMLElement | null;

    if (
      toLoad.generateheader &&
      toProcess.children.length > 0 &&
      (toLoad.generateheader as string).toLocaleLowerCase() === "true"
    ) {
      // #region Normalize [ toLoad.scroll ].
      if (toLoad.scroll === undefined) {
        toLoad.scroll = false;
      } else {
        if (typeof toLoad.scroll === "string") {
          toLoad.scroll = (toLoad.scroll as string).toLowerCase().trim() === "true";
        }
      }
      // #endregion Normalize [ toLoad.scroll ].
      // #region Normalize [ toLoad.scrollblock ].
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
      // #endregion Normalize [ toLoad.scrollblock ].
      const wrpHeader = document.createElement("div");

      wrpHeader.classList.add("cHeader");

      header = document.createElement("div");

      const legend = toProcess.querySelector("legend");

      header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? (toLoad.autoheadertitle as string) : toProcess.tagName === "FIELDSET" ? (legend ? toProcess.querySelector("legend")?.innerHTML : "") : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;

      if (legend) {
        legend.remove();
      }

      header.setAttribute("style", toLoad.autoheadercss as string);
      header.classList.add("CodBi_HTML_Panel_Header");

      wrpHeader.appendChild(header);
      toProcess.insertBefore(wrpHeader, toProcess.firstChild);
    } else {
      header = toProcess.querySelector(".CodBi_HTML_Panel_Header");
    }

    if (header === null) {
      throw new CodBiError(
        `Tagged <div> "${toProcess.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`,
      );
    } else {
      (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Header = header;

      toProcess.classList.add("--HTML_Panel");

      const styHeader: string | null = header.getAttribute("style");
      // #region Determine where to re-insert the header when panel gets unfolded.
      const childArray = Array.from(toProcess.children);
      const idxHeader = childArray.indexOf(header.parentElement);
      const headerAfterElement: Element | undefined =
        idxHeader === childArray.length - 1 ? undefined : childArray[idxHeader];
      // #endregion Determine where to re-insert the header when panel gets unfolded.
      const bufferDisplay = (toProcess as HTMLElement).style.display; // Store in order to restore it later on.
      // Determine weather initially folded or not.
      (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded = document.body.classList.contains(
        "fc-print-mode",
      )
        ? false
        : toLoad.folded !== undefined
          ? (toLoad.folded as string).toLowerCase().trim() === "true"
          : false;
      // #region Consider initial folding state.
      if ((toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
        (toProcess as HTMLElement).style.display = "none";
        header?.remove();
        (toProcess as HTMLElement).parentElement?.appendChild(header);
      } else {
        if (toLoad.cssheaderunfolded) {
          header?.setAttribute("style", toLoad.cssheaderunfolded as string);
        }
      }
      // #endregion Consider initial folding state.
      // #region Inject necessary styles.
      // #region Determine "toProcess"'s parent's id-Attribute.
      // This will be the id of "toProcess", if "toProcess" is a fieldset.
      let parentID = header.parentElement?.getAttribute("id");

      if (parentID === null) {
        parentID = toProcess.getAttribute("id");
      }
      // #endregion Determine "toProcess"'s parent's id-Attribute.
      // #region Generation.
      const style = document.createElement("style");
      style.innerHTML = `
      @media( prefers-color-scheme : dark ) {
        .CodBi_HTML_Panel_Header { background: linear-gradient(130deg, rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(84, 62, 62, 1) 55%, rgba(56, 52, 52, 1) 89%, rgba(0, 0, 0, 1) 100%) !important ;}}

      .CodBi_HTML_Panel_Header > p { margin : 0 ;}

      #${parentID} .CodBi_HTML_Panel_Header:after,
      #${toProcess.parentElement?.parentElement?.getAttribute("id")} .CodBi_HTML_Panel_Header:after {
        content : "${toLoad.cssafterheadercontent ? toLoad.cssafterheadercontent : ""}";

        ${toLoad.cssafterheader ? toLoad.cssafterheader : ""}
      }

      #${parentID} .CodBi_HTML_Panel_Header:hover { ${toLoad.cssheaderhover ? toLoad.cssheaderhover : "scale : 1.1 ;"}}
      #${parentID} .CodBi_HTML_Panel_Header:active { ${toLoad.cssheaderactive ? toLoad.cssheaderactive : "scale : .9 ;"}}

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
      // #endregion Generation.
      // #region Actual injection.
      header.parentElement?.insertBefore(style, header);

      if (toLoad.wrappercss && toProcess.parentElement?.classList.contains("XFieldSetWrapper")) {
        toProcess.parentElement?.setAttribute("style", toLoad.wrappercss as string);
      }
      // #endregion Actual injection.
      // #endregion Inject necessary styles.
      // #region Handle clicks on the header.
      header.addEventListener("click", (event) => {
        if ((toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
          (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded = !(
            toProcess as unknown as { [key: string]: unknown }
          ).CodBi_HTML_Panel_Folded;
          (toProcess as HTMLElement).style.display = bufferDisplay;

          header?.remove();

          if (toLoad.cssheaderunfolded) {
            header.setAttribute("style", toLoad.cssheaderunfolded as string);
          }

          if (headerAfterElement === undefined) {
            (toProcess as HTMLElement).appendChild(header);
          } else {
            (toProcess as HTMLElement).insertBefore(header, headerAfterElement);
          }

          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            header.parentElement?.insertBefore(styleAfterUnfolded, header);
          }

          if (toLoad.scroll) {
            toProcess.scrollIntoView({
              behavior: "smooth",
              block: toLoad.scrollblock as ScrollLogicalPosition,
              inline: "nearest",
            });
          }
        } else {
          (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded = !(
            toProcess as unknown as { [key: string]: unknown }
          ).CodBi_HTML_Panel_Folded;
          (toProcess as HTMLElement).style.display = "none";

          header.remove();

          if (styHeader) {
            header.setAttribute("style", styHeader);
          }
          (toProcess as HTMLElement).parentElement?.appendChild(header);

          if (toLoad.cssafterheadercontentunfolded || toLoad.cssafterheaderunfolded) {
            styleAfterUnfolded.remove();
          }
        }
      });
      // #endregion Handle clicks on the header.
      // #region Required fields handling (validation handling).
      let requiredFieldsContained = false;

      for (const required of toProcess.querySelectorAll('[ aria-required = "true"]')) {
        HTML_Panel.invalidElements.push(required as HTMLElement);

        requiredFieldsContained = true;
      }

      if (requiredFieldsContained) {
        // #region Style generation & injection.
        const styleRequiredFieldsContained = document.createElement("style");

        styleRequiredFieldsContained.innerHTML = `
          #${parentID} > .CodBi_HTML_Panel_Header:before,
          #${toProcess.parentElement?.parentElement?.getAttribute("id")} > * > .CodBi_HTML_Panel_Header:before {
            content : "${toLoad.cssrequiredfieldscontent ? toLoad.cssrequiredfieldscontent : "*"}";

          ${toLoad.cssrequiredfields ? toLoad.cssrequiredfields : "color : red ; position : relative ; top : .5em ;"}}`;

        header.parentElement?.insertBefore(styleRequiredFieldsContained, header);
        // #region Style generation & injection.
      }
      // #endregion Required fields handling (validation handling).
      // #region Prevent form submission as long as there're invalid fields.
      getXUtil().on("submit", (params) => {
        if (HTML_Panel.invalidElements.length === 0) {
          return { preventSubmission: false };
        } else {
          for (const invalid of HTML_Panel.invalidElements) {
            HTML_Panel.unfoldPanelAncestors(invalid);

            const pageName = HTML_Panel.determinePage(invalid)?.getAttribute("data-xn");

            if (pageName) {
              gotoPage(pageName);

              invalid.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock as ScrollLogicalPosition });
            }
          }

          return { preventSubmission: true };
        }
      });
      // #endregion Prevent form submission as long as there're invalid fields.
      // #region Handle unfolding of panels containing invalid fields.
      xm_validator.on("requestBegin", (data) => {
        for (const item of data.items) {
          if (item.getAttribute("aria-invalid") === "true") {
            HTML_Panel.invalidElements.push(item);
          } else {
            HTML_Panel.invalidElements = HTML_Panel.invalidElements.filter((candidate) => candidate !== item);
          }
        }
      });

      xm_validator.on("requestBegin", (data) => {
        if (
          (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded &&
          data.items[0]?.classList.contains("XPage")
        ) {
          for (const invalid of HTML_Panel.invalidElements) {
            HTML_Panel.unfoldPanelAncestors(invalid);
          }
        }
      });
      // #endregion Handle unfolding of panels containing invalid fields.
    }
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Panel } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Panel", HTML_Panel.functionality);
  })();
  // #endregion Initialization
}
