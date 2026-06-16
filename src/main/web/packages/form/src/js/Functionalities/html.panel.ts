// #region Imports
// #region XIMA
import { getXUtil, getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { OR } from "xdbc/src/DBC/OR";
import { EQ } from "xdbc/src/DBC/EQ";
import { UNDEFINED } from "xdbc/src/DBC/UNDEFINED";
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
  static mapHeaderAfterElements: Map<HTMLElement, HTMLElement> = new Map<HTMLElement, HTMLElement>();
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
  /** States whether the validator algorithm has already been registered. */
  public static validatorRegistered = false;
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
   * ### Config Parameter:
   *  - Folded:                           States whether this panel is folded (TRUE) or unfolded (everything else) when
   *                                      it is loaded (defaults to TRUE).
   *  - CSSHeaderHover:                   The optional header's CSS:hover (defaults to { scale : 1.1 ;}).
   *  - CSSHeaderActive:                  The optional header's CSS:active (defaults to { scale : .9 ;}).
   *  - CSSHeaderUnfolded:                The optional CSS to be applied onto the header when the panel is unfolded.
   *  - DCSSHeaderUnfolded:               The optional Darkmode CSS to be applied onto the header when the panel is unfolded.
   *  - CSSAnimFadeINPanel:               The optional animation to be applied onto the panel whenever the panel
   *                                      is unfolded.
   *  - CSSAnimFadeINPanelDuration:       The optional animation's duration that is applied onto the panel whenever
   *                                      the panel is unfolded (defaults to 0s).
   *  - CSSAnimFadeINPanelEasing:         The optional animation's easing function that is applied onto the panel
   *                                      whenever the panel is unfolded (defaults to "ease-in-out").
   *  - CSSAfterHeader:                   The CSS:after to be applied onto the header when the panel is folded.
   *  - CSSBeforeHeader:                  The CSS:before to be applied onto the header when the panel is folded
   *                                      (will be overwritten when required fields are contained by the panel).
   *  - CSSAfterHeaderContent:            The CSS:after content to be applied onto the header when the panel is folded.
   *  - CSSBeforeHeaderContent:           The CSS:before content to be applied onto the header when the panel is folded.
   *                                      (will be overwritten when required fields are contained by the panel).
   *  - CSSAfterHeaderContentUnfolded:    The CSS:after content to be applied onto the header when the panel is unfolded.
   *  - CSSBeforeHeaderContentUnfolded:   The CSS:after content to be applied onto the header when the panel is unfolded.
   *                                      (will be overwritten when required fields are contained by the panel).
   *  - CSSRequiredFieldsContent:         The CSS:before content to applied onto the header if it contains a validation
   *                                      sensitive field.
   *  - CSSRequiredFields:                The CSS:before to applied onto the header if it contains a validation
   *                                      sensitive field.
   *  - AutoHeaderTitle:                  The {@link string }the automatically generated header shall display.
   *  - AutoHeaderTitleSupplementsSpacer  The {@link string } separating the actual title form all {@link string }s
   *                                      that're supplemented 'cause they're {@link HTMLInputElement.value }s of
   *                                      {@link HTMLInputElement }s tagged with the
   *                                      CSS-Class **CodBi_HTML_Panel_AutoHeaderTitle_Supplement** without any
   *                                      **XFieldSet**s or **XContainer** in between.
   *  - AutoHeaderLevel:                  Which level of enclosing \<h>s the "AutoHeaderTitle" shall have,
   *                                      e.g. to get a \<h1> enclosure the value has to be 1.
   *  - ScrollBlock:                      Defines the logical position to scroll to when the panel
   *                                      is unfolded (start, center, end, nearest). Defaults to "nearest".
   *  - GenerateHeader:                   States whether a header shall be automatically generated. Defaults to FALSE.
   *  - Scroll                            States whether the view shall be scrolled when the panel unfolds.
   *                                      Default is FALSE.
   *  - Accordion                         If set, this panel becomes part of an accordion. All panels sharing the same
   *                                      accordion name will be folded when one of them is unfolded.
   *  - ScrollToTop                        States whether a round scroll-to-top button shall be displayed at the
   *                                      bottom-right of the unfolded panel. Possible values: **"true"** (always
   *                                      visible), **"auto"** (visible only when the panel's content is taller
   *                                      than 1.5× the viewport height), or **"false"** (hidden). Defaults to AUTO.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } if the tagged {@link Element } does not contain
   *          a child of CSS-Class "CodBi_HTML_Panel_Header".*/
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "autoheadertitle :: autoheadertitlesupplementsspacer :: scrollblock")
    @TYPE.PRE("string | boolean", "folded :: generateheader :: scroll :: scrolltotop")
    @TYPE.PRE("string | number", "autoheaderlevel")
    @OR.PRE(
      [new EQ("start"), new EQ("center"), new EQ("end"), new EQ("nearest"), new UNDEFINED()],
      "scrollblock",
      "Is data-cb-ScrollBlock something different than start, center, end or nearest?",
    )
    toLoad: { [key: string]: unknown },

    @OR.PRE(
      [new INSTANCE(HTMLDivElement), new INSTANCE(HTMLFieldSetElement)],
      undefined,
      "Is it not a <div> or a <fieldset> that is tagged with this functionality?",
    )
    toProcess: Element,
  ): undefined {
    if (XFC_METADATA.requestType === "print") {
      return;
    }

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
      // #region Autoheader Supplement
      toLoad.autoheadertitlesuplementsspacer = toLoad.autoheadertitlesuplementsspacer
        ? (toLoad.autoheadertitlesuplementsspacer as string)
        : " / ";

      let autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer as string;

      const supplements = toProcess.querySelectorAll(".CodBi_HTML_Panel_AutoHeaderTitle_Supplement");
      const constructHeaderSupplements = () => {
        for (let i = 0; i < supplements.length; i++) {
          autoHeaderTitleSupplement += `${(supplements[i] as HTMLInputElement).value === "" || i === 0 ? "" : ", "}${(supplements[i] as HTMLInputElement).value}`;
        }
      };

      for (let i = 0; i < supplements.length; i++) {
        if (
          !isClassInBetween("XFieldSet", toProcess as HTMLElement, supplements[i] as HTMLElement) &&
          !isClassInBetween("XContainer", toProcess as HTMLElement, supplements[i] as HTMLElement)
        ) {
          supplements[i].addEventListener("change", (event) => {
            autoHeaderTitleSupplement = toLoad.autoheadertitlesuplementsspacer as string;

            constructHeaderSupplements();

            header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? (toLoad.autoheadertitle as string) + (autoHeaderTitleSupplement.length !== (toLoad.autoheadertitlesuplementsspacer as string).length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? (legend.innerHTML + (autoHeaderTitleSupplement.length === (toLoad.autoheadertitlesuplementsspacer as string).length ? "" : autoHeaderTitleSupplement)) : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
          });
        }
      }

      constructHeaderSupplements();

      header.innerHTML = `${toLoad.autoheaderlevel ? `<h${toLoad.autoheaderlevel}>` : ""}${toLoad.autoheadertitle ? (toLoad.autoheadertitle as string) + (autoHeaderTitleSupplement.length !== (toLoad.autoheadertitlesuplementsspacer as string).length ? autoHeaderTitleSupplement : "") : toProcess.tagName === "FIELDSET" ? (legend ? toProcess.querySelector("legend")?.innerHTML + (autoHeaderTitleSupplement.length === (toLoad.autoheadertitlesuplementsspacer as string).length ? "" : autoHeaderTitleSupplement) : "") : ""}${toLoad.autoheaderlevel ? `</h${toLoad.autoheaderlevel}>` : ""}`;
      // #endregion Autoheader Supplement
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
        `Tagged <div> or <fieldset> "${toProcess.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`,
      );
    } else {
      (toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Header = header;

      toProcess.classList.add("--HTML_Panel");

      // Self-assign accordion group from ancestor container if not already set.
      if (!toProcess.hasAttribute("data-cb-accordion") && !toProcess.classList.contains("CodBi_HTML_Panel_NoCordion")) {
        const accordionContainer = toProcess.parentElement?.closest("[data-cb-accordion-group]");

        if (accordionContainer) {
          toProcess.setAttribute("data-cb-accordion", accordionContainer.getAttribute("data-cb-accordion-group"));
        }
      }

      const styHeader: string | null = header.getAttribute("style");
      // #region Determine where to re-insert the header when panel gets unfolded.
      const childArray = Array.from(toProcess.children);
      const idxHeader = childArray.indexOf(header.parentElement);
      const headerAfterElement: Element | undefined =
        idxHeader === childArray.length - 1 ? undefined : childArray[idxHeader];

      if (headerAfterElement) {
        HTML_Panel.mapHeaderAfterElements.set(toProcess as HTMLElement, headerAfterElement as HTMLElement);
      }
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

      if ((toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
        toProcess.classList.add("--folded");
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
        event.stopPropagation();
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
            header.parentElement?.insertBefore(styleBeforeUnfolded, header);
          }

          if (toLoad.scroll) {
            toProcess.scrollIntoView({
              behavior: "smooth",
              block: toLoad.scrollblock as ScrollLogicalPosition,
              inline: "nearest",
            });
          }
          // #region Handle accordions enabling live changes.
          if (toProcess.hasAttribute("data-cb-accordion")) {
            toLoad.accordion = toProcess.getAttribute("data-cb-accordion");
            // Only fold panels at the same nesting level (same parent panel).
            const myParentPanel = toProcess.parentElement?.closest(".CodBi.--HTML_Panel") ?? null;

            for (const toFold of document.querySelectorAll(
              `.CodBi.--HTML_Panel[ data-cb-accordion = "${toLoad.accordion as string}"]:not(.--folded)`,
            )) {
              if (toFold === toProcess) {
                continue;
              }

              const itsParentPanel = toFold.parentElement?.closest(".CodBi.--HTML_Panel") ?? null;

              if (itsParentPanel !== myParentPanel) {
                continue;
              }

              const ownHeader = (toFold as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Header as
                | HTMLElement
                | undefined;

              ownHeader?.dispatchEvent(new MouseEvent("click", { bubbles: false }));
            }
          }
          // #endregion Handle accordions enabling live changes.
          (toProcess as HTMLElement).classList.remove("--folded");

          if (btnScrollToTop) {
            if (scrollToTopAuto) {
              requestAnimationFrame(() => {
                showBtn((toProcess as HTMLElement).scrollHeight > window.innerHeight * 1.5);
              });
            } else {
              showBtn(true);
            }
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
            styleBeforeUnfolded.remove();
          }

          (toProcess as HTMLElement).classList.add("--folded");

          if (btnScrollToTop) {
            showBtn(false);
          }
        }
      });
      // #endregion Handle clicks on the header.
      // #region ScrollToTop button.
      const scrollToTopRaw =
        typeof toLoad.scrolltotop === "string"
          ? (toLoad.scrolltotop as string).toLowerCase().trim()
          : toLoad.scrolltotop === true
            ? "true"
            : toLoad.scrolltotop === false
              ? "false"
              : "";
      const scrollToTopValue = scrollToTopRaw === "" ? "auto" : scrollToTopRaw;
      const showScrollToTop = scrollToTopValue === "true" || scrollToTopValue === "auto";
      const scrollToTopAuto = scrollToTopValue === "auto";

      let btnScrollToTop: HTMLButtonElement | null = null;
      let showBtn = (_visible: boolean) => {};

      if (showScrollToTop) {
        btnScrollToTop = document.createElement("button");
        btnScrollToTop.type = "button";
        btnScrollToTop.className = "CodBi_HTML_Panel_ScrollToTop";
        btnScrollToTop.innerHTML = "&#x25B2;";
        btnScrollToTop.title = "Scroll to top";
        Object.assign(btnScrollToTop.style, {
          position: "sticky",
          bottom: ".5em",
          float: "right",
          marginRight: ".5em",
          width: "2.25em",
          height: "2.25em",
          borderRadius: "50%",
          border: "2px solid currentColor",
          background: "rgba(255,255,255,.85)",
          color: "inherit",
          fontSize: "1em",
          lineHeight: "1",
          cursor: "pointer",
          zIndex: "10",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 2px .4em rgba(0,0,0,.25)",
          transition: "opacity .3s, scale .15s",
          opacity: "0",
          pointerEvents: "none",
        });

        showBtn = (visible: boolean) => {
          if (visible) {
            // Don't show if another scroll-to-top button is already visible.
            for (const btn of document.querySelectorAll(".CodBi_HTML_Panel_ScrollToTop")) {
              if (btn !== btnScrollToTop && (btn as HTMLElement).style.opacity !== "0") {
                return;
              }
            }
          }
          if (btnScrollToTop) {
            btnScrollToTop.style.opacity = visible ? "1" : "0";
            btnScrollToTop.style.pointerEvents = visible ? "auto" : "none";
          }
        };

        btnScrollToTop.addEventListener("mouseenter", () => {
          btnScrollToTop.style.scale = "1.15";
        });
        btnScrollToTop.addEventListener("mouseleave", () => {
          btnScrollToTop.style.scale = "1";
        });

        btnScrollToTop.addEventListener("click", (e) => {
          e.stopPropagation();
          header.scrollIntoView({ behavior: "smooth", block: "start" });
        });

        toProcess.appendChild(btnScrollToTop);

        // Show the button immediately if the panel starts unfolded.
        if (!(toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
          if (scrollToTopAuto) {
            requestAnimationFrame(() => {
              showBtn((toProcess as HTMLElement).scrollHeight > window.innerHeight * 1.5);
            });
          } else {
            showBtn(true);
          }
        }

        // Re-evaluate auto visibility when panel content size changes.
        if (scrollToTopAuto) {
          let lastScrollHeight = 0;
          const reevaluate = () => {
            if ((toProcess as unknown as { [key: string]: unknown }).CodBi_HTML_Panel_Folded) {
              return;
            }
            const h = (toProcess as HTMLElement).scrollHeight;
            if (h === lastScrollHeight) {
              return;
            }
            lastScrollHeight = h;
            showBtn(h > window.innerHeight * 1.5);
          };
          setInterval(reevaluate, 500);
        }
      }
      // #endregion ScrollToTop button.
      // #region Required fields handling (validation handling).
      let requiredFieldsContained = false;

      for (const required of toProcess.querySelectorAll('[ aria-required = "true"]')) {
        //HTML_Panel.invalidElements.push(required as HTMLElement);

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
        // #region Untag missing required fields.
        for (const untag of document.querySelectorAll(".CodBi_HTML_Panel_MissingRequiredField")) {
          untag.classList.remove("CodBi_HTML_Panel_MissingRequiredField");
        }
        // #endregion Untag missing required fields.
        // #region Build required group lookup from XM_FORM_MODEL at submit time.
        // XM_FORM_MODEL is set by the Formcycle renderer and contains validation group definitions.
        // Groups are arrays of element IDs. Fields with a "vgr" property belong to that group.
        // If any group member has a value/file, all members of that group are considered valid.
        const xmFormModel = (
          window as unknown as {
            XM_FORM_MODEL?: {
              validation?: {
                revids?: { groups?: Record<string, string[]> };
                fields?: Record<string, { vgr?: string }>;
              };
            };
          }
        ).XM_FORM_MODEL;
        const validationGroups: Record<string, string[]> = xmFormModel?.validation?.revids?.groups ?? {};
        /** Maps element ID → group ID for quick lookup. */
        const elementToGroup: Record<string, string> = {};
        if (xmFormModel?.validation?.fields) {
          for (const [elId, fieldInfo] of Object.entries(xmFormModel.validation.fields)) {
            if (fieldInfo.vgr) {
              elementToGroup[elId] = fieldInfo.vgr;
            }
          }
        }
        /**
         * Checks if any member of a required group has a non-empty value or file selected.
         *
         * @param groupId The required group ID.
         *
         * @returns TRUE if at least one element in the group is filled. */
        const groupHasFilledMember = (groupId: string): boolean => {
          const members = validationGroups[groupId];
          if (!members || members.length === 0) {
            return false;
          }
          return members.some((memberId) => {
            const el = document.getElementById(memberId) as
              | (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)
              | null;
            if (!el) {
              return false;
            }
            // Check standard value (text inputs, textareas, selects).
            const val = el.value;
            if (val !== "" && val !== undefined && val !== null) {
              return true;
            }
            // Check native file input (HTML5 File API).
            if ((el as HTMLInputElement).files?.length > 0) {
              return true;
            }
            // Check Formcycle's internal upload tracking on the element's jQuery data.
            // The renderer stores uploaded file info as "xfc-uploaded-files" data attribute.
            try {
              const $ = getJQuery();
              const $el = $(el);
              // xfc-uploaded-files is set by Formcycle's XUpload component when files are uploaded.
              if (
                $el.data &&
                Array.isArray($el.data("xfc-uploaded-files")) &&
                ($el.data("xfc-uploaded-files") as unknown[]).length > 0
              ) {
                return true;
              }
              // xfc-file-list tracks pending uploads.
              if (
                $el.data &&
                Array.isArray($el.data("xfc-file-list")) &&
                ($el.data("xfc-file-list") as unknown[]).length > 0
              ) {
                return true;
              }
            } catch (_ignored) {
              // jQuery not available or data API fails — skip.
            }
            return false;
          });
        };
        /** Set of group IDs that already have a filled member (computed once per submit). */
        const satisfiedGroups = new Set<string>();
        for (const [groupId, members] of Object.entries(validationGroups)) {
          if (groupHasFilledMember(groupId)) {
            satisfiedGroups.add(groupId);
          }
        }
        // #endregion Build required group lookup from XM_FORM_MODEL at submit time.

        let reallyInvalid = false;

        for (const candidate of document.querySelectorAll('[ aria-required = "true"]')) {
          if (
            (candidate as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value === "" ||
            (candidate as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value === undefined
          ) {
            // #region Check if the field belongs to a required group that is already satisfied.
            const candidateId = candidate.getAttribute("id");
            if (candidateId && elementToGroup[candidateId]) {
              const groupId = elementToGroup[candidateId];
              if (satisfiedGroups.has(groupId)) {
                // Another member of this required group has a value — skip this field.
                continue;
              }
            }
            // #endregion Check if the field belongs to a required group that is already satisfied.
            HTML_Panel.unfoldPanelAncestors(candidate as HTMLElement);

            if (!isDisplayNone(candidate as HTMLElement)) {
              let checkedSelection = false;

              if (candidate.classList.contains("XSelect")) {
                for (const option of candidate.querySelectorAll("input")) {
                  if (option.checked === true) {
                    checkedSelection = true;
                  }
                }
              }

              if (!checkedSelection) {
                // #region Determine and go to page.
                const pageName = HTML_Panel.determinePage(candidate as HTMLElement)?.getAttribute("data-xn");

                if (pageName) {
                  gotoPage(pageName);
                  candidate.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock as ScrollLogicalPosition });
                }
                // #endregion Determine and go to page.
                (candidate as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).focus();

                (candidate as HTMLElement).classList.add("CodBi_HTML_Panel_MissingRequiredField");

                return { preventSubmission: true };
              }
            }
          }
        }

        // Purge elements that have been corrected since the last validation pass.
        HTML_Panel.invalidElements = HTML_Panel.invalidElements.filter(
          (el) => el.isConnected && el.getAttribute("aria-invalid") === "true",
        );

        if (HTML_Panel.invalidElements.length === 0) {
          return { preventSubmission: false };
        } else {
          for (const invalid of HTML_Panel.invalidElements) {
            reallyInvalid = true;

            HTML_Panel.unfoldPanelAncestors(invalid);
            // #region Determine and go to page.
            const pageName = HTML_Panel.determinePage(invalid)?.getAttribute("data-xn");

            if (pageName) {
              gotoPage(pageName);
              invalid.scrollIntoView({ behavior: "smooth", block: toLoad.scrollblock as ScrollLogicalPosition });
            }
            // #endregion Determine and go to page.
            invalid.focus();
          }

          return { preventSubmission: reallyInvalid };
        }
      });
      // #endregion Prevent form submission as long as there're invalid fields.
      // #region Handle unfolding of panels containing invalid fields.
      if (!HTML_Panel.validatorRegistered) {
        xm_validator.on("begin", (data) => {
          for (const item of data.items) {
            if (!HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "true") {
              HTML_Panel.invalidElements.push(item);
            }

            if (HTML_Panel.invalidElements.includes(item) && item.getAttribute("aria-invalid") === "false") {
              HTML_Panel.invalidElements = HTML_Panel.invalidElements.filter((candidate) => candidate !== item);
            }
          }
        });
      }
      // #endregion Handle unfolding of panels containing invalid fields.
    }
  }
}

window.codbi.registerFunctionality("HTML.Panel", HTML_Panel.functionality.bind(HTML_Panel)); // Initialize
// #region Helper
/**
 * Finds if an element with a specific class exists between two nodes.
 *
 * @param {string}      suspect - The class to look for.
 * @param {HTMLElement} start   - The starting HTML element.
 * @param {HTMLElement} end     - The ending HTML element.
 *
 * @returns {boolean} True if the class is found between the nodes (exclusive). */
function isClassInBetween(suspect: string, start: HTMLElement, end: HTMLElement): boolean {
  while (end && end !== start) {
    if (
      end.getAttribute("class").indexOf(` ${suspect} `) !== -1 ||
      end.getAttribute("class").indexOf(` ${suspect}"`) !== -1 ||
      end.getAttribute("class").indexOf(`"${suspect} `) !== -1 ||
      end.getAttribute("class").indexOf(`"${suspect}"`) !== -1
    ) {
      return true;
    }
    // biome-ignore lint/style/noParameterAssign: No need for a local variable for such short code.
    end = end.parentElement;
  }

  return false;
}
/**
 * Determines whether the **suspect** {@link HTMLElement } is hidden cause of it's own or one of it'S ancestor's
 * CSS **display** property is set to **none**.
 *
 * @param suspect The {@link HTMLElement } to check.
 *
 * @returns **TRUE** if the **suspect** {@link HTMLElement } is hidden, otherwise **FALSE**. */
function isDisplayNone(suspect: HTMLElement) {
  while (suspect !== null) {
    if (suspect.style.display === "none") {
      return true;
    }
    // biome-ignore lint/style/noParameterAssign:
    suspect = suspect.parentElement;
  }

  return false;
}
// #endregion Helper
