// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-designer";
// #endregion XIMA
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
import { Optioninput } from "./OptionInput.js";
import { SVManager } from "./SVManager.js";
import { EPManager } from "./EPManager.js";
// #endregion Imports
// #region Helper
/**
 * Determines the size in pixels of one EM within the context of the specified **element**.
 *
 * @param element The {@link HTMLElement } which's  corresponding EM shall be calculated.
 *
 * @returns The requested EM in pixels. */
function getEmSizeInPixels(element: Element) {
  const computedStyles = window.getComputedStyle(element);
  const fontSizeString = computedStyles.getPropertyValue("font-size");
  const result = Number.parseFloat(fontSizeString);

  return result;
}
/**
 * Inserts the {@link string } **toInsert** into the specified {@link HTMLTextAreaElement }.
 *
 * @param into      The {@link HTMLTextAreaElement } to insert the {@link string } **toInsert** to.
 * @param toInsert  The {@link string } to insert into the specified {@link HTMLTextAreaElement }. */
function insertText(into: HTMLTextAreaElement, toInsert: string) {
  const start = into.selectionStart;
  const end = into.selectionEnd;
  const value = into.value;

  into.value = value.substring(0, start) + toInsert + value.substring(end);

  into.dispatchEvent(new Event("input", { bubbles: true }));
}
/** Builds a comma-separated list from a JSON-encoded array of file names.
 *
 * @param serializedFiles The JSON-encoded array string.
 *
 * @returns The normalized comma-separated list. */
function buildFileList(serializedFiles: string): string {
  return JSON.parse(serializedFiles)
    .map((file: string) => {
      return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
    })
    .join(",");
}
/** Parses a file-list value from a server response, handling both JSON array strings and legacy CSV.
 *
 * @param raw The raw value from the response (may be a JSON array string or a CSV string).
 *
 * @returns The parsed file names as an array. */
function parseFileListResponse(raw: string): string[] {
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);

      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      // Not valid JSON — fall through to CSV split.
    }

    return raw
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  if (Array.isArray(raw)) {
    return raw;
  }

  return [];
}
/** Blocks keystrokes for a short duration to avoid accidental input.
 *
 * @param durationMs The blocking duration in milliseconds. */
function addTemporaryKeyblocker(durationMs: number): void {
  const blocker = (event: KeyboardEvent) => {
    const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

    keyboardEvent.preventDefault();
    keyboardEvent.stopImmediatePropagation();
    keyboardEvent.stopPropagation();

    setTimeout(() => {
      document.removeEventListener("keydown", blocker);
    }, durationMs);
  };

  document.addEventListener("keydown", blocker);
}
/** Finds the first element that matches any of the given selectors.
 *
 * @param selectors CSS selectors to try in order.
 *
 * @returns The first matching element or null. */
function queryFirst<T extends Element>(selectors: Array<string>): T | null {
  for (const selector of selectors) {
    const found = document.querySelector(selector);

    if (found) {
      return found as T;
    }
  }

  return null;
}
/** Finds the first element that matches any of the given selectors within a root.
 *
 * @param root Root element to search in.
 * @param selectors CSS selectors to try in order.
 *
 * @returns The first matching element or null. */
function queryFirstWithin<T extends Element>(root: Element, selectors: Array<string>): T | null {
  for (const selector of selectors) {
    const found = root.querySelector(selector);

    if (found) {
      return found as T;
    }
  }

  return null;
}
/** Attempts to resolve a grid cell by class with fallbacks for grid renderers.
 *
 * @param root Root element to search in.
 * @param cellClass Grid cell class name (e.g., "r1").
 *
 * @returns The matching grid cell or null. */
function queryGridCell(root: Element, cellClass: "r1" | "r2" | "r4"): HTMLElement | null {
  return queryFirstWithin<HTMLElement>(root, [`.${cellClass}`, `.slick-cell.${cellClass}`, `[class~="${cellClass}"]`]);
}
/** Returns all grid cells matching a class with fallbacks for grid renderers.
 *
 * @param root Root element to search in.
 * @param cellClass Grid cell class name (e.g., "r1").
 *
 * @returns Array of matching grid cells. */
function queryGridCells(root: Element, cellClass: "r1" | "r2" | "r4"): Array<HTMLElement> {
  const selectors = [`.${cellClass}`, `.slick-cell.${cellClass}`, `[class~="${cellClass}"]`];
  const results = new Set<HTMLElement>();

  for (const selector of selectors) {
    for (const element of root.querySelectorAll(selector)) {
      results.add(element as HTMLElement);
    }
  }

  return Array.from(results);
}
/** Checks if an element matches a grid cell class with fallbacks.
 *
 * @param element Element to test.
 * @param cellClass Grid cell class name (e.g., "r1").
 *
 * @returns True if the element matches. */
function matchesGridCellClass(element: Element, cellClass: "r1" | "r2" | "r4"): boolean {
  return element.matches(`.${cellClass}, .slick-cell.${cellClass}, [class~="${cellClass}"]`);
}
/** Safely walks up the DOM tree.
 *
 * @param element Starting element.
 * @param levels Number of parent levels to climb.
 *
 * @returns The ancestor element or null. */
function getAncestor(element: Element | null | undefined, levels: number): HTMLElement | null {
  let current: Element | null | undefined = element;

  for (let i = 0; i < levels; i += 1) {
    if (!current?.parentElement) {
      return null;
    }

    current = current.parentElement;
  }

  return (current as HTMLElement) ?? null;
}
/** Finds the attributes panel using fallback selectors.
 *
 * @returns The attributes panel element or null. */
function getAttributesPanel(): HTMLElement | null {
  return queryFirst<HTMLElement>([
    '[data-panel-id="attributes"]',
    '[data-panel-id*="attributes"]',
    '[id$="attributes"]',
    '[id*="attributes"]',
  ]);
}
/** Safely retrieves the <object> element inside the details container.
 *
 * @param container The details container.
 *
 * @returns The object element or null. */
function getDetailsObject(container: Element): HTMLObjectElement | null {
  const obj = container.querySelector("object");

  return obj instanceof HTMLObjectElement ? obj : null;
}
/** Normalizes an element's text content to lower case.
 *
 * @param element The element to read.
 *
 * @returns Lower-case trimmed text. */
function getLowerText(element: Element | null | undefined): string {
  return (element?.textContent ?? "").trim().toLowerCase();
}
/** Safely extracts a description string.
 *
 * @param value Object containing optional Description.
 *
 * @returns Description or empty string. */
function getDescription(value: { Description?: string } | null | undefined): string {
  return value?.Description ?? "";
}
/** Renders API documentation into the details container safely.
 *
 * @param container Target element.
 * @param baseDocURL Base URL for API docs.
 * @param description Description or doc path.
 */
function renderDetails(container: HTMLElement, baseDocURL: string, description: string): void {
  container.replaceChildren();

  if (description.startsWith("/")) {
    const detailsObject = document.createElement("object");

    detailsObject.style.cssText = "width: 100%; height: 100%; opacity: .8;";
    detailsObject.setAttribute("data", `${baseDocURL}${description}`);
    container.appendChild(detailsObject);

    return;
  }

  const wrapper = document.createElement("div");

  wrapper.style.cssText = "width: 100%; height: 100%; overflow: auto;";
  wrapper.innerHTML = description;
  container.appendChild(wrapper);
}
/** Ensures the details container has a placeholder object element.
 *
 * @param container Target element.
 * @returns The object element.
 */
function ensureDetailsObject(container: HTMLElement): HTMLObjectElement {
  const existing = getDetailsObject(container);

  if (existing) {
    return existing;
  }

  const detailsObject = document.createElement("object");

  detailsObject.style.cssText = "width: 100%; height: 100%;";
  container.appendChild(detailsObject);

  return detailsObject;
}
// #endregion Helper
/* Creates and manages the CodBi interface for the local API documentation within the XIMA Form Cycle Designer.
 * This interface includes components for browsing functionalities and element placeholders, viewing corresponding
 * documentation, and inserting code templates. It also handles the retrieval of local API documentation and integrates
 * it into the interface. */
export function enableLocalDocInterface(): void {
  let codbiToggle: HTMLElement | undefined;

  if (window.CodbiPluginData === undefined) {
    return;
  }

  window.addEventListener("load", () => {
    const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`; // URL we're coming from.
    const parentWindows: Window[] = window.parent as unknown as Window[];
    // Specifies whether the attribute panel is currently being forced to be enlarged or not.
    let attributePanelForcedToEnlarge = false;
    // #region Determine current language.
    let currentLanguage: string = "de";

    if (parentWindows.length > 0) {
      currentLanguage = parentWindows[0]?.XFC_METADATA.currentLanguage || "de";
    }
    // #endregion Determine current language.
    // Initiate if every needed component is fine only...
    if (SVManager.registered && EPManager.registered) {
      const docsApi = window.CodbiPluginData.docsAPI ?? {};
      const baseDocURL = docsApi[currentLanguage] ?? docsApi.en ?? "";
      // #region Define Flag for Keystroke blocking
      let keystrokeBlockingStart: Date | undefined = new Date();
      // #endregion Define Flag for Keystroke blocking
      // #region Inject <XC-EPManager> & <XC-OptionInput>.
      document.body.insertAdjacentHTML(
        "beforeend",
        `<style>
                        .CodBi_Print_Remove_PrintOnly:after {
                          content: "x";
                          padding-left: .5em;
                          color: white;
                          border:solid;
                          background-color: black;
                          border-radius: .5em;
                          position: absolute;
                          opacity: 0.6;}
                        </style>
          <div  is          = "xc-epmanager"
                options     = "${buildFileList(window.CodbiPluginData.fslFunctionalities)}"
                epoptions  = "${buildFileList(window.CodbiPluginData.fslElementplaceholder)}"></div>
          <div  is = "xc-optioninput"></div>`,
      );
      // #endregion Inject <XC-EPManager> & <XC-OptionInput>.
      // #region Acquire references to <XC-EPManager> & <XC-OptionInput>.
      const epManager = INSTANCE.tsCheck<EPManager>(document.querySelector('div[is="xc-epmanager"]'), EPManager);
      const optioninput = INSTANCE.tsCheck<Optioninput>(
        document.querySelector('div[is="xc-optioninput"]'),
        Optioninput,
      );
      // #endregion Acquire references to <XC-EPManager> & <XC-OptionInput>.
      // #region View corresponding API-Doc
      epManager.onOptionChanged.push((newOption: string) => {
        if (newOption === "") {
          return;
        }

        const description = getDescription(
          window.CodbiPluginData[epManager.mode === "SV" ? "detFunctionalities" : "detElementplaceholder"][
            newOption.replace(".js", "").toLowerCase()
          ],
        );

        renderDetails(cDetails, baseDocURL, description);

        cDetails.style.display = "block";
      });
      // #endregion View corresponding API-Doc
      // #region Attach event to set keystroke blocker.
      epManager.onAutocomplete.push((completedOption: string) => {
        keystrokeBlockingStart = new Date();
      });
      // #endregion Attach event to set keystroke blocker.
      // #region Register Template-Selected Handler
      optioninput.onOptionSelected.push((selectedOption: string) => {
        if (optioninput.mode === "Code Template") {
          switch (selectedOption) {
            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_OnLoaded"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                'window.addEventListener("load", (event) => {});',
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.registerFunctionality("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Placeholder")}",( toLoad, toProcess ) =>  {});`,
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.registerEP("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Placeholder")}",( params ) =>  {});`,
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.loadConfig({ targets: "${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard_Placeholder_Targets")}", FUNC: "${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard_Placeholder_FUNC")}"});`,
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.extendFunctionality("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend_Placeholder")}",( toLoad, toProcess ) =>  {});`,
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.extendEP("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend_Placeholder")}",( params, formerResult ) => {});`,
              );

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Start"):
              insertText(optioninput.target as unknown as HTMLTextAreaElement, "window.codbi.checkAttributes();");

              break;

            default:
              insertText(optioninput.target as unknown as HTMLTextAreaElement, "!! UNKNOWN SELECTION !!");
          }

          optioninput.enabled = false;
        }
      });
      // #endregion Register Template-Selected Handler
      // #region Define handler for the <XC-OptionInput>'s changes in option.
      optioninput.onAutocomplete.push((completedOption: string) => {
        if (optioninput.mode === "Functionality Parameter") {
          if (completedOption.indexOf("/") !== -1) {
            optioninput.target.value = `data-cb-${completedOption.substring(completedOption.indexOf("/") + 1).trim()}`;
          } else {
            optioninput.target.value = completedOption;
          }

          cDetails.style.display = "none";
          optioninput.enabled = false;

          const optionTargetRow = getAncestor(optioninput.target, 2);

          if (!optionTargetRow) {
            return;
          }

          const valueColumn = INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r2"), HTMLElement);
          // #region Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          addTemporaryKeyblocker(250);
          // #endregion Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          valueColumn.click();

          return;
        }

        if (optioninput.mode === "Global Variable") {
          if (completedOption.indexOf("[") !== -1) {
            optioninput.target.value = completedOption.substring(completedOption.indexOf("]") + 1).trim();
          } else {
            optioninput.target.value = completedOption;
          }

          cDetails.style.display = "none";
          optioninput.enabled = false;

          const optionTargetRow = getAncestor(optioninput.target, 2);

          if (!optionTargetRow) {
            return;
          }

          const valueColumn = INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r4"), HTMLElement);
          // #region Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          addTemporaryKeyblocker(250);
          // #endregion Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          valueColumn.click();

          return;
        }

        const optionTargetRow = getAncestor(optioninput.target, 2);

        if (!optionTargetRow) {
          return;
        }

        const r2 = INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r2"), HTMLElement);
        // #region Create separate observer for the case of autocompletion necessary.
        const cellObserver = new MutationObserver((mutationsList, observer) => {
          for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
              for (const added of mutation.addedNodes) {
                let bound = false; // States whether the epManager's target is already bound to this <input>.

                const addedElement = added instanceof HTMLElement ? added : null;
                const inputs = addedElement
                  ? addedElement instanceof HTMLInputElement
                    ? [addedElement]
                    : Array.from(addedElement.querySelectorAll("input"))
                  : [];

                for (const input of inputs) {
                  input.addEventListener("keydown", (event) => {
                    const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

                    if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "e") {
                      // #region Prevent default actions & bubbling.
                      keyboardEvent.preventDefault();
                      keyboardEvent.stopImmediatePropagation();
                      keyboardEvent.stopPropagation();
                      // #endregion Prevent default actions & bubbling.
                      epManager.mode = "SV";
                      epManager.mode = "EP";
                      // #region Rebuild listing.
                      INSTANCE.tsCheck<HTMLElement>(
                        document.querySelector('div[is = "xc-epmanager"]'),
                        HTMLElement,
                      ).setAttribute("epoptions", buildFileList(window.CodbiPluginData.fslElementplaceholder));
                      // #endregion Rebuild listing.
                      // First time load of APIDoc
                      const detailsObject = getDetailsObject(cDetails);

                      if (detailsObject) {
                        detailsObject.setAttribute(
                          "data",
                          `${window.CodbiPluginData.docsAPI?.[currentLanguage] ?? window.CodbiPluginData.docsAPI?.en ?? ""}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`,
                        );
                      }
                      // #region Show interface.
                      epManager.enabled = true;
                      lastPanelShownAt = Date.now();
                      epManager.enteringEP = true;
                      cDetails.style.display = "block";

                      updateLayoutEPManager(input);
                      updateLayoutCDetails(epManager);
                      // #endregion Show interface.
                      // #region Bind epManager's target to this <input> evading unnecessary multiple binding.
                      if (!bound) {
                        bound = true;

                        epManager.target = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
                      }
                      // #endregion Bind epManager's target to this <input> evading unnecessary multiple binding.
                    }
                  });
                }
              }
            }
          }
        });
        // #region Create separate observer for the case of autocompletion necessary.
        const r2Container = getAncestor(r2, 2);

        if (!r2Container) {
          return;
        }

        cellObserver.observe(r2Container, {
          childList: true,
          subtree: true,
        });

        r2.click();
      });

      optioninput.onOptionChanged.push((newOption: string) => {
        // #region Determining and setting the correct documentation of standard configurations.
        if (inTag) {
          const description = getDescription(
            window.CodbiPluginData.detStandards[newOption.substring(0, newOption.indexOf("/") - 1).trim()],
          );

          renderDetails(cDetails, baseDocURL, description);

          return;
        }
        // #endregion Determining and setting the correct documentation of standard configurations.
        // #region Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
        const description =
          getDescription(
            window.CodbiPluginData.detFunctionalities[
              newOption
                .substring(0, newOption.indexOf("/") - 1)
                .toLowerCase()
                .trim()
            ],
          ) ||
          (newOption.indexOf("[") !== -1
            ? getDescription(
                window.CodbiPluginData.detStandards[newOption.substring(1, newOption.indexOf("]") - 1).trim()],
              )
            : getDescription(
                window.CodbiPluginData.detFunctionalities[
                  newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()
                ],
              ));
        // #endregion Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
        renderDetails(cDetails, baseDocURL, description);
      });
      // #endregion Define handler for the <XC-OptionInput>'s changes in option.
      // #region Define handler for the <XC-OptionInput>'s selection.
      optioninput.onOptionSelected.push((selectedOption: string) => {
        if (optioninput.mode === "Code Template") {
          return;
        }

        cDetails.style.display = "none";

        const optionTargetRow = getAncestor(optioninput.target, 2);

        if (!optionTargetRow) {
          return;
        }

        INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r2"), HTMLElement).click();

        const parent = INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r2"), HTMLElement);

        const cell = parent.querySelector("input");

        if (cell === null) {
          return;
        }

        let bound = false;

        cell.addEventListener("keydown", (keyboardEvent: KeyboardEvent) => {
          // #region Prevent default actions & bubbling.
          keyboardEvent.preventDefault();
          keyboardEvent.stopImmediatePropagation();
          keyboardEvent.stopPropagation();
          // #endregion Prevent default actions & bubbling.
          epManager.mode = "EP";
          // #region Rebuild listing.

          epManager.setAttribute("epoptions", buildFileList(window.CodbiPluginData.fslElementplaceholder));
          // #endregion Rebuild listing.
          // First time load of APIDoc
          renderDetails(
            cDetails,
            baseDocURL,
            window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description ?? "",
          );
          // #region Show interface.
          epManager.enabled = true;
          lastPanelShownAt = Date.now();
          epManager.enteringEP = true;
          cDetails.style.display = "block";

          updateLayoutEPManager(cell);
          updateLayoutCDetails(epManager);
          // #endregion Show interface.
          // #region Bind epManager's target to this <input> evading unnecessary multiple binding.
          if (!bound) {
            bound = true;

            epManager.target = INSTANCE.tsCheck<HTMLInputElement>(keyboardEvent.target, HTMLInputElement);
          }
          // #endregion Bind epManager's target to this <input> evading unnecessary multiple binding.
        });
      });
      // #endregion Define handler for the <XC-OptionInput>'s selection.
      // #region Define handler for the <XC-EPManager>'s selection.
      epManager.onOptionSelected.push((selectedOption: string) => {
        cDetails.style.display = "none";
      });
      // #endregion Define handler for the <XC-EPManager>'s selection.
      // #region Define transformer for <XC-EPManager> & <XC-OptionInput>.
      /**
       * Prefixes **"data-cb-"** to the string **toTransform** adding just the {@link string } after the slash to
       * the prefix to generate the resulting {@link string }.
       *
       * @param toTransform The {@link string } to transform.
       *
       * @returns The transformed {@link string }. */
      optioninput.targetOptionTransformer = (toTransform: string) => {
        return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
      };
      /**
       * Changes the {@link string } **toTransform** into an uppercase one.
       *
       * @param toTransform The {@link string } to transform.
       *
       * @returns The transformed {@string }. */
      optioninput.optionTransformer = epManager.optionTransformer = (toTransform: string): string => {
        return toTransform.toUpperCase();
      };
      // #endregion Define transformer for <XC-EPManager> & <XC-OptionInput>.
      // #region Style <XC-EPManager> & <XC-OptionInput>.
      optioninput.style.position = epManager.style.position = "absolute";
      optioninput.style.border = epManager.style.border = "solid";
      optioninput.style.padding = epManager.style.padding = ".5em";
      optioninput.style.zIndex = epManager.style.zIndex = "100";
      optioninput.style.borderRadius = epManager.style.borderRadius = ".5em";
      optioninput.style.boxShadow = epManager.style.boxShadow = "0 0 .5em black";
      optioninput.style.overflowY = epManager.style.overflowY = "auto";
      optioninput.backgroundImage =
        epManager.backgroundImage = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;
      // #region Define methods for layout updates for <XC-EPManager> & <XC-OptionInput>.
      /**
       * Update the {@link epManager }'s layout according to the specified {@link HTMLElement }.
       *
       * @param cell The {@link HTMLElement } the {@link epManager } shall align to. */
      const updateLayoutEPManager = (cell: HTMLElement) => {
        const rectCell = cell.getBoundingClientRect();

        epManager.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
        epManager.style.top = `${Math.ceil(rectCell.bottom)}px`;
        epManager.style.left = `${Math.ceil(rectCell.right - epManager.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
        epManager.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectCell.bottom)}px`;
      };
      /**
       * Update the {@link optioninput }'s layout according to the specified {@link HTMLElement }.
       *
       * @param cell The {@link HTMLElement } the {@link optioninput } shall align to. */
      const updateLayoutOptioninput = (cell: HTMLElement) => {
        const rectCell = cell.getBoundingClientRect();

        optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
        optioninput.style.top = `${Math.ceil(rectCell.bottom)}px`;
        optioninput.style.left = `${Math.ceil(rectCell.right - optioninput.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
        optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectCell.bottom)}px`;
      };
      // #region Define methods for  layout updates for <XC-EPManager> & <XC-OptionInput>.
      // #endregion Style <XC-EPManager> & <XC-OptionInput>.
      // #region Documentation Details Viewer
      const cDetails = document.createElement("div");
      // #region Set up Focus & Mouseover-Flag
      let flagMouseOverCDetails = false;
      let flagMouseOverList = false;
      let dismissTimeoutId: ReturnType<typeof setTimeout> | undefined;
      let currentCDetailBlurAction: (() => void) | undefined;
      // #region Grace period to prevent animation-triggered mouseleave from dismissing panels.
      let lastPanelShownAt = 0;
      const PANEL_GRACE_MS = 350;
      // #endregion Grace period to prevent animation-triggered mouseleave from dismissing panels.

      const cancelDismiss = () => {
        if (dismissTimeoutId !== undefined) {
          clearTimeout(dismissTimeoutId);
          dismissTimeoutId = undefined;
        }
      };

      const scheduleDismiss = () => {
        // #region Skip dismiss during animation grace period.
        if (Date.now() - lastPanelShownAt < PANEL_GRACE_MS) {
          return;
        }
        // #endregion Skip dismiss during animation grace period.
        cancelDismiss();
        dismissTimeoutId = setTimeout(() => {
          dismissTimeoutId = undefined;

          if (!flagMouseOverCDetails && !flagMouseOverList && currentCDetailBlurAction) {
            currentCDetailBlurAction();
            currentCDetailBlurAction = undefined;
          }
        }, 250);
      };

      // #region Prevent cDetails clicks from blurring the active input (same pattern as SVManager).
      cDetails.addEventListener("mousedown", (event) => {
        event.preventDefault();
      });
      // #endregion Prevent cDetails clicks from blurring the active input (same pattern as SVManager).
      cDetails.addEventListener("mouseenter", (event) => {
        flagMouseOverCDetails = true;
        cancelDismiss();
      });
      cDetails.addEventListener("mouseleave", (event) => {
        flagMouseOverCDetails = false;

        if (currentCDetailBlurAction) {
          scheduleDismiss();
        }
      });

      epManager.addEventListener("mouseenter", () => {
        flagMouseOverList = true;
        cancelDismiss();
      });
      epManager.addEventListener("mouseleave", () => {
        flagMouseOverList = false;

        if (currentCDetailBlurAction) {
          scheduleDismiss();
        }
      });

      optioninput.addEventListener("mouseenter", () => {
        flagMouseOverList = true;
        cancelDismiss();
      });
      optioninput.addEventListener("mouseleave", () => {
        flagMouseOverList = false;

        if (currentCDetailBlurAction) {
          scheduleDismiss();
        }
      });
      // #endregion Set up Focus & Mouseover-Flag
      // #region Styling
      cDetails.style.position = "absolute";
      cDetails.style.display = "none";
      cDetails.style.border = "solid";
      cDetails.style.padding = ".5em";
      cDetails.style.zIndex = "100";
      cDetails.style.borderColor = "darkorange";
      cDetails.style.backgroundImage = `url("${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
      cDetails.style.backgroundSize = "contain";
      cDetails.style.backgroundPosition = "center";
      cDetails.style.backgroundRepeat = "no-repeat";
      cDetails.style.backgroundBlendMode = "overlay";
      cDetails.style.backgroundColor = "#FFFFFFCC";
      cDetails.style.borderRadius = ".5em";
      cDetails.style.boxShadow = "0 0 .5em black";
      cDetails.style.opacity = ".9";
      cDetails.style.display = "none";
      cDetails.style.padding = "0";

      // #region Keyboard Navigation List Forwarding
      document.addEventListener("keydown", (event) => {
        if (
          (event.key === "ArrowUp" || event.key === "ArrowDown") &&
          flagMouseOverCDetails &&
          cDetails.style.display !== "none"
        ) {
          event.preventDefault();

          if (epManager.enabled && epManager.target) {
            epManager.onKeydownTarget(event);
          } else if (optioninput.enabled && optioninput.target) {
            optioninput.onKeydownTarget(event);
          }
        }
      });
      // #endregion Keyboard Navigation List Forwarding
      // #region Global dismiss: hide cDetails when focus moves to an iframe or clicking outside.
      const dismissAll = () => {
        cDetails.style.display = "none";
        epManager.enabled = false;
        optioninput.enabled = false;
        cancelDismiss();
        currentCDetailBlurAction = undefined;
      };

      // #region Dismiss on focus leaving to iframe (designer canvas).
      document.addEventListener("focusout", () => {
        if (cDetails.style.display === "none") {
          return;
        }

        requestAnimationFrame(() => {
          const active = document.activeElement;
          // #region Determine whether focus has left the CodBi controls.
          const focusInCodbi =
            (active !== null && cDetails.contains(active)) ||
            (active !== null && epManager.contains(active)) ||
            (active !== null && optioninput.contains(active)) ||
            active === epManager.target ||
            active === optioninput.target;
          // #endregion Determine whether focus has left the CodBi controls.
          if (!focusInCodbi && !flagMouseOverCDetails) {
            dismissAll();
          }
        });
      });
      // #endregion Dismiss on focus leaving to iframe (designer canvas).

      // #region Dismiss on clicking outside CodBi controls.
      document.addEventListener("pointerdown", (event) => {
        if (cDetails.style.display === "none") {
          return;
        }

        const target = event.target as Node;

        if (
          cDetails.contains(target) ||
          epManager.contains(target) ||
          optioninput.contains(target) ||
          epManager.target?.contains(target) ||
          optioninput.target?.contains(target)
        ) {
          return;
        }

        dismissAll();
      });
      // #endregion Dismiss on clicking outside CodBi controls.
      // #endregion Global dismiss: hide cDetails when focus moves to an iframe or clicking outside.

      // #endregion Styling
      cDetails.classList.add("---CodBi", "--Panel", "--APIDoc");
      // #region Injection
      const loader = document.createElement("div");

      loader.classList.add("APIDocLoader");

      const docViewer = document.createElement("object");

      docViewer.id = "CodBi_APIDocViewer";

      cDetails.appendChild(loader);
      cDetails.appendChild(docViewer);

      const cssDetails = document.createElement("style");

      cssDetails.textContent = `
          @keyframes kfSpinner { 100% { transform : rotate( 1turn )}}
          .APIDocLoader          { align-self : anchor-center ; justify-self : anchor-center ; width : 10% ; position : absolute ; text-align : center ; margin : auto ; aspect-ratio : 1 ;
                                   display : grid ; border : 2px solid #0000 ; border-radius : 50% ;
                                   border-right-color :  #1e79ee ; animation : kfSpinner 1s infinite linear ;}
          .APIDocLoader::before,
          .APIDocLoader::after   { content : ""; grid-area : 1/1 ; margin : 2px ; border : inherit ;
                                   border-radius : 50% ; animation : kfSpinner 2s infinite ;}
          .APIDocLoader::after   { margin : 8px ;
                                   animation-duration : 1.5s ;}

          @keyframes kfFadeIN_APIDoc {
            0% { scale : 1.1 ; opacity : 0 ;}
            100% { scale : 1 ; opacity : .9 ;}}
          .---CodBi.--Panel.--APIDoc  { animation : kfFadeIN_APIDoc .25s ease-in forwards ;}
          object#CodBi_APIDocViewer   { opacity : .8 ; width : 100% !important ; height : 100% !important ; border-radius : .5em ;}`;

      cDetails.prepend(cssDetails);
      document.body?.appendChild(cDetails);
      // #endregion Injection
      // #region Remove loader when having loaded for the first time in session
      /**
       * Handles the {@link cDetails } **load** event.
       *
       * @param event The {@link Event } received. */
      const onFirstDocLoad = (event: Event) => {
        (cDetails.querySelector(".APIDocLoader") as HTMLDivElement).remove();

        getDetailsObject(cDetails)?.removeEventListener("load", onFirstDocLoad);
      };

      getDetailsObject(cDetails)?.addEventListener("load", onFirstDocLoad);

      // #endregion Remove loader when having loaded for the first time in session
      // #region Retrieve Local API Doc
      const $ = getJQuery();

      $.ajax({
        url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
        type: "GET",
        headers: {
          "X-Action": "Retrieve",
        },
        success: (response) => {
          // #region Load into global structures and components
          for (const functionality in response.detFunctionalities) {
            window.CodbiPluginData.detFunctionalities[functionality] = response.detFunctionalities[functionality];

            getJQuery().ajax({
              url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
              type: "GET",
              headers: {
                "X-Action": "Code",
                "X-ActionDetail": "Functionality",
                "X-Element": functionality,
              },
              success: (response) => {
                if (response.result !== "NONE") {
                  if (document.readyState === "complete") {
                    (window.CodbiPluginData.detFunctionalities[functionality] as unknown as { Code: string }).Code =
                      response.result.replaceAll("<|>", '"');
                  }
                }
              },
            });
          }

          if (response.fslFunctionalities) {
            const existingFsl: string[] = JSON.parse(window.CodbiPluginData.fslFunctionalities);
            const newFsl = parseFileListResponse(response.fslFunctionalities);
            const merged = [...new Set([...existingFsl, ...newFsl])];
            window.CodbiPluginData.fslFunctionalities = JSON.stringify(merged);
          }

          for (const placeholder in response.detElementplaceholder) {
            window.CodbiPluginData.detElementplaceholder[placeholder] = response.detElementplaceholder[placeholder];

            getJQuery().ajax({
              url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
              type: "GET",
              headers: {
                "X-Action": "Code",
                "X-ActionDetail": "Elementplaceholder",
                "X-Element": placeholder,
              },
              success: (response) => {
                if (response.result !== "NONE") {
                  if (document.readyState === "complete") {
                    (window.CodbiPluginData.detElementplaceholder[placeholder] as unknown as { Code: string }).Code =
                      response.result.replaceAll("<|>", '"');
                  }
                }
              },
            });
          }

          if (response.fslElementplaceholder) {
            const existingEp: string[] = JSON.parse(window.CodbiPluginData.fslElementplaceholder);
            const newEp = parseFileListResponse(response.fslElementplaceholder);
            const merged = [...new Set([...existingEp, ...newEp])];
            window.CodbiPluginData.fslElementplaceholder = JSON.stringify(merged);
          }

          if (response.detStandards) {
            for (const key in response.detStandards) {
              window.CodbiPluginData.detStandards[key] = response.detStandards[key];

              getJQuery().ajax({
                url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
                type: "GET",
                headers: {
                  "X-Action": "Code",
                  "X-ActionDetail": "Standard",
                  "X-Element": key,
                },
                success: (response) => {
                  if (response.result !== "NONE") {
                    if (document.readyState === "complete") {
                      (window.CodbiPluginData.detStandards[key] as unknown as { Code: string }).Code =
                        response.result.replaceAll("<|>", '"');
                    }
                  }
                },
              });
            }
          }

          if (response.fileListing) {
            const existingFl: string[] = JSON.parse(window.CodbiPluginData.fileListing);
            const newFl = parseFileListResponse(response.fileListing);
            const merged = [...new Set([...existingFl, ...newFl])];
            window.CodbiPluginData.fileListing = JSON.stringify(merged);
          }

          setTimeout(() => {
            window.CodbiPluginData.populateStandards();
          });

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "options",
            buildFileList(window.CodbiPluginData.fslFunctionalities),
          );

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "epoptions",
            buildFileList(window.CodbiPluginData.fslElementplaceholder),
          );
          // #endregion Load into global structures and components
          // #region Load and inject Angular local API-Documentation-Manager web component
          const scriptAPIManager = document.createElement("script");

          scriptAPIManager.src = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/cb-manager.js`;

          document.head.appendChild(scriptAPIManager);

          const cssAPIManager = document.createElement("link");
          cssAPIManager.rel = "stylesheet";
          cssAPIManager.type = "text/css";
          cssAPIManager.href = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/cb-manager.css`;

          document.head.appendChild(cssAPIManager);
          document.body.insertAdjacentHTML(
            "beforeend",
            `
          <style>
            #cCodBi_LocalAPIDoc { z-index: 100 ; position : absolute ; left : -100vw ; top : 20vh ; width : 70vw ; height : 50vh ; pointer-events : none ; opacity : 0 ; transition : 1s all ;}
            #cCodBi_LocalAPIDoc.--opened { left : 0vw ; opacity : .9 ; pointer-events : all !important ;}}
            #cCodBi_LocalAPIDoc cb-manager { display : block ; height : 100% ;}</style>
          <div id = "cCodBi_LocalAPIDoc">
            <cb-manager apidoc      = '${JSON.stringify(response)}'
                        baseURL     = "${baseURL}"
                        language    = "${currentLanguage}"
                        resourceURL = "${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce"
                        docPath     = "CodbiPluginData"
                        watermark   = "${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg"></cb-manager></div>`,
          );
          // #region Register Hotkey ALT+C for displaying the manager and handle the manager's close button.
          const manager = document.querySelector("#cCodBi_LocalAPIDoc") as HTMLElement;

          manager.style.pointerEvents = "none";

          document.addEventListener("keyup", (event) => {
            if (event.altKey && event.key.toLowerCase() === "c") {
              // #region Do nothing if CodBi-Toggle is not checked.
              codbiToggle = document.querySelector("#form-codbi-prop-enable-input");

              if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                return;
              }
              // #region Do nothing if CodBi-Toggle is not checked.
              const scriptEditor = queryFirst<HTMLElement>([
                "#scriptForm\\:scriptTabs\\:xm-editor-js_editor",
                '[id$=":xm-editor-js_editor"]',
                '[id*="xm-editor-js_editor"]',
              ]);

              const activeElement = document.activeElement;

              if (scriptEditor?.contains(activeElement)) {
                if (!(activeElement instanceof HTMLElement)) {
                  return;
                }

                if (optioninput.enabled) {
                  optioninput.enabled = false;
                } else {
                  // #region Hide options for code templates when JS-Editor gets blurred.
                  const listener = (event) => {
                    if (optioninput.enabled && optioninput.mode === "Code Template") {
                      optioninput.enabled = false;
                      activeElement.removeEventListener("blur", listener);
                    }
                  };

                  activeElement.addEventListener("blur", listener);
                  // #endregion Hide options for code templates when JS-Editor gets blurred.
                  // #region Calculate Layout
                  const clientRect = activeElement.getBoundingClientRect();
                  const emPixels = getEmSizeInPixels(activeElement) * 22;
                  const top = clientRect.top + clientRect.height;

                  optioninput.style.top = `${(top > 0 ? top : 0) + emPixels / 11}px`;
                  optioninput.style.left = `${clientRect.left + clientRect.width / 2}px`;
                  optioninput.style.maxHeight = `${emPixels}px`;
                  // #endregion Calculate Layout
                  optioninput.mode = "Code Template";
                  // #region Define Code Template Options
                  optioninput.options = [
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend"),
                  ];
                  // #endregion Define Code Template Options
                  optioninput.enabled = true;
                  lastPanelShownAt = Date.now();
                  const target =
                    activeElement instanceof HTMLInputElement
                      ? activeElement
                      : activeElement instanceof HTMLTextAreaElement
                        ? (activeElement as unknown as HTMLInputElement)
                        : null;

                  if (!target) {
                    optioninput.enabled = false;
                    return;
                  }

                  optioninput.target = target;
                  optioninput.targetOptionTransformer = (toTransform: string): string => {
                    return "";
                  };
                  // #region Close the API Doc-Manager if it is opened.
                  if (manager.classList.contains("--opened")) {
                    manager.classList.remove("--opened");
                  }
                  // #endregion Close the API Doc-Manager if it is opened.
                }
              } else {
                manager.classList.toggle("--opened");
              }
            }
          });

          window.CodbiPluginData.managerClosed = () => {
            manager.classList.toggle("--opened");
          };
          // #endregion Register Hotkey ALT+C for displaying the manager and handle the manager's close button.
          // #endregion Load and inject Angular local API-Documentation-Manager web component
        },
      });
      // #endregion Retrieve Local API Doc
      // #endregion Documentation Details Viewer
      // #region Define API-Doc layout update
      /**
       * Updates the {@link cDetails } layout according to the specified {@link HTMLElement } to **alignTo**.
       *
       * @param alignTo The {@link HTMLElement } to **alignTo**.*/
      const updateLayoutCDetails = (alignTo: HTMLElement) => {
        const rectToAlignTo = alignTo.getBoundingClientRect();
        const top = rectToAlignTo.top + (rectToAlignTo.height / 100) * 4.5;
        const margin = (window.innerWidth / 100) * 1;
        const leftSpace = rectToAlignTo.left;
        const rightSpace = window.innerWidth - rectToAlignTo.right;
        const useRightSide = rightSpace >= leftSpace;
        const availableWidth = Math.max(0, (useRightSide ? rightSpace : leftSpace) - margin * 2);

        cDetails.style.left = `${Math.ceil(
          useRightSide ? rectToAlignTo.right + margin : rectToAlignTo.left - availableWidth - margin,
        )}px`;
        cDetails.style.top = `${top > window.innerHeight / 2 ? window.innerHeight / 2 : top}px`;
        cDetails.style.width = `${Math.ceil(availableWidth)}px`;
        cDetails.style.height = `${(rectToAlignTo.height < window.innerHeight / 2 ? window.innerHeight / 2 : rectToAlignTo.height) - (rectToAlignTo.height / 100) * 10}px`;
      };
      // #endregion Define API-Doc layout update
      // #endregion API-Documentation-Viewer
      // #endregion Style the functionality manager
      // #region Setup Attributes-Editor Monitoring
      const availableClasses = new Array<{ standard: string; name: string; description: string }>();

      let attributesEditorProcessed = false; // Set up dprocessing just once.
      let inTag = false;
      // #region Extend the variables tab.
      for (const globalVarsEditor of document.querySelectorAll(
        'a[href="#scriptForm:scriptTabs:varTab"], a[href$=":varTab"]',
      )) {
        globalVarsEditor.addEventListener("click", (event) => {
          const cellObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  const addedParent = added instanceof HTMLElement ? added.parentElement : null;

                  if (added instanceof HTMLInputElement && addedParent && matchesGridCellClass(addedParent, "r2")) {
                    // #region Do nothing if CodBi-Toggle is not checked.
                    codbiToggle = document.querySelector("#form-codbi-prop-enable-input");

                    if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                      return;
                    }
                    // #region Do nothing if CodBi-Toggle is not checked.
                    added.placeholder = "CodBi: ALT + V";

                    added.addEventListener("keydown", (event) => {
                      // #region Do nothing if CodBi-Toggle is not checked.
                      codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                      if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                        return;
                      }
                      // #region Do nothing if CodBi-Toggle is not checked.
                      if (event.altKey && (event.key === "v" || event.key === "V")) {
                        // #region Global variables listing
                        const globalVariables = new Array<string>();

                        for (const standard in window.CodbiPluginData.detStandards) {
                          if (window.CodbiPluginData.detStandards[standard]?.globals) {
                            for (const global in window.CodbiPluginData.detStandards[standard].globals) {
                              globalVariables.push(`[ ${standard} ] ${global}`);
                            }
                          }
                        }

                        for (const functionality in window.CodbiPluginData.detFunctionalities) {
                          for (const parameter in window.CodbiPluginData.detFunctionalities[functionality]?.Parameter) {
                            globalVariables.push(`${functionality.replace(/\./g, "_")}_${parameter}`);
                          }
                        }
                        // #endregion Global variables listing
                        // #region Configure <XC-OptionInput> to show the globally available variables.
                        optioninput.mode = "Global Variable";
                        optioninput.options = globalVariables;
                        optioninput.enabled = true;
                        lastPanelShownAt = Date.now();
                        optioninput.target = added;
                        optioninput.targetOptionTransformer = (toTransform: string): string => {
                          if (toTransform.indexOf("[") !== -1) {
                            return toTransform.substring(toTransform.indexOf("]") + 1).trim();
                          }

                          return toTransform;
                        };
                        // #endregion Configure <XC-OptionInput> to show the globally available variables.
                        // #region Show corresponding documentation when <XC-OptionInput>'s current option changed.
                        optioninput.onOptionChanged.push((newOption) => {
                          if (newOption.indexOf("_")) {
                            return;
                          }

                          const detailsObject = getDetailsObject(cDetails);

                          if (detailsObject) {
                            detailsObject.setAttribute(
                              "data",
                              `${window.CodbiPluginData.docsAPI?.[currentLanguage] ?? window.CodbiPluginData.docsAPI?.en ?? ""}${
                                newOption.indexOf("[") !== -1
                                  ? window.CodbiPluginData.detStandards[
                                      newOption
                                        .substring(newOption.indexOf("[") + 1, newOption.lastIndexOf("]") - 1)
                                        .trim()
                                    ]?.Description
                                  : window.CodbiPluginData.detFunctionalities[
                                      newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()
                                    ]?.Description
                              }`,
                            );
                          }
                        });
                        // #endregion Show corresponding documentation when <XC-OptionInput>'s current option changed.
                        // #region Insert proper global variable when <XC-OptionInput>'s current option was selected.
                        optioninput.onOptionSelected.push((newOption) => {
                          if (optioninput.mode === "Code Template") {
                            return;
                          }

                          if (added.value.indexOf("[") !== -1) {
                            added.value = added.value.substring(added.value.indexOf("]") + 2).trim();
                          } else {
                            added.value = added.value.replace("data-cb-", "");
                          }

                          const optionTargetRow = getAncestor(optioninput.target, 2);

                          if (!optionTargetRow) {
                            return;
                          }

                          INSTANCE.tsCheck<HTMLElement>(queryGridCell(optionTargetRow, "r4"), HTMLElement).click();
                        });
                        // #endregion Insert proper global variable when <XC-OptionInput>'s current option was selected.
                        // #region Properly layout <XC-OptionInput>.
                        const addedContainer = added.parentElement;

                        if (addedContainer) {
                          const rectAdded = INSTANCE.tsCheck<HTMLElement>(
                            addedContainer,
                            HTMLElement,
                          ).getBoundingClientRect();

                          optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectAdded.bottom)}px`;
                          optioninput.style.top = "5vh";
                          optioninput.style.left = `${Math.ceil(rectAdded.left)}px`;
                          optioninput.style.maxHeight = `${Math.ceil(rectAdded.top - (window.innerHeight / 100) * 7)}px`;

                          cDetails.style.display = "block";

                          updateLayoutCDetails(optioninput);
                          // #endregion Properly layout <XC-OptionInput>.
                          // #region Initial API Doc loading
                          const baseDocURL =
                            window.CodbiPluginData.docsAPI?.[currentLanguage] ??
                            window.CodbiPluginData.docsAPI?.en ??
                            "";
                          // #region Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
                          const description =
                            getDescription(
                              window.CodbiPluginData.detFunctionalities[
                                globalVariables[0]
                                  .substring(0, globalVariables[0].indexOf("/") - 1)
                                  .toLowerCase()
                                  .trim()
                              ],
                            ) ||
                            (globalVariables[0].indexOf("[") !== -1
                              ? getDescription(
                                  window.CodbiPluginData.detStandards[
                                    globalVariables[0].substring(1, globalVariables[0].indexOf("]") - 1).trim()
                                  ],
                                )
                              : getDescription(
                                  window.CodbiPluginData.detFunctionalities[
                                    globalVariables[0]
                                      .substring(0, globalVariables[0].lastIndexOf("_"))
                                      .replace(/_/g, ".")
                                      .trim()
                                  ],
                                ));
                          // #endregion Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
                          renderDetails(cDetails, baseDocURL, description);
                          // #endregion Initial API Doc loading
                        }
                      }
                    });
                    // #region Blend out CodBi-Interface when leaving a global variable input field.
                    added.addEventListener("blur", (event) => {
                      if (!flagMouseOverCDetails) {
                        cDetails.style.display = "none";
                        optioninput.enabled = false;
                      } else {
                        currentCDetailBlurAction = () => {
                          cDetails.style.display = "none";
                          optioninput.enabled = false;
                        };
                      }
                    });
                    // #endregion Blend out CodBi-Interface when leaving a global variable input field.
                  }
                }
              }
            }
          });
          // #region Observe the global variables.
          const varsEditor = queryFirst<HTMLElement>(["#varseditor", '[id$="varseditor"]']);

          if (!varsEditor) {
            return;
          }

          cellObserver.observe(DEFINED.tsCheck(varsEditor), {
            childList: true,
            subtree: true,
          });
          // #endregion Observe the global variables.
        });
      }
      // #endregion Extend the variables tab.
      // #region Extend the extended tab.
      for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"], a[href$=":extendedTab"]')) {
        tabEditor.addEventListener("click", (event) => {
          // #region Prevent duplicate observer creation on repeated tab clicks.
          if (attributesEditorProcessed) {
            return;
          }
          // #endregion Prevent duplicate observer creation on repeated tab clicks.
          // #region Parametercells
          const paramCellObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  // #region Handle CSS-Class inout
                  const possibleTagify = DEFINED.tsCheck<HTMLElement>(added.parentElement);

                  if (possibleTagify.classList.contains("tagify__input")) {
                    let input: string | undefined;
                    // #region Hide Interface
                    possibleTagify.addEventListener("blur", (event) => {
                      if (!flagMouseOverCDetails) {
                        inTag = false;
                        cDetails.style.display = "none";
                        optioninput.enabled = false;
                      } else {
                        currentCDetailBlurAction = () => {
                          inTag = false;
                          cDetails.style.display = "none";
                          optioninput.enabled = false;
                        };
                      }
                    });
                    // #endregion Hide Interface
                    possibleTagify.addEventListener("keyup", (event) => {
                      const eventTarget = INSTANCE.tsCheck<HTMLElement>(event.target, HTMLElement);

                      if (input === undefined) {
                        if (event.key === ".") {
                          inTag = true;
                          input = "";
                          // #region Build available classes list
                          availableClasses.length = 0;

                          for (const standard in window.CodbiPluginData.detStandards) {
                            if (window.CodbiPluginData.detStandards[standard]?.Active) {
                              for (const cssClass in window.CodbiPluginData.detStandards[standard].classes) {
                                availableClasses.push({
                                  standard: standard,
                                  name: cssClass,
                                  description: DEFINED.tsCheck(
                                    window.CodbiPluginData.detStandards[standard].classes[cssClass],
                                  ),
                                });
                              }
                            }
                          }

                          optioninput.mode = "CSS-Class";
                          optioninput.options = availableClasses.map(
                            (cssClass) => `${cssClass.standard} / ${cssClass.name}`,
                          );
                          // #endregion Build available classes list
                          // #region First load of documentation.
                          const realName = DEFINED.tsCheck<string>(
                            optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1).trim(),
                          );

                          const description = getDescription(window.CodbiPluginData.detStandards[realName]);

                          renderDetails(cDetails, baseDocURL, description);
                          // #endregion First load of documentation.
                          optioninput.enabled = true;
                          lastPanelShownAt = Date.now();
                          optioninput.optionTransformer = undefined;

                          if (added.parentElement !== null && added.parentElement !== undefined) {
                            const rectAdded = INSTANCE.tsCheck<HTMLElement>(
                              added.parentElement,
                              HTMLElement,
                            ).getBoundingClientRect();

                            optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectAdded.bottom)}px`;
                            optioninput.style.top = `${Math.ceil(rectAdded.bottom)}px`;
                            optioninput.style.left = `${Math.ceil(rectAdded.right - optioninput.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
                            optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectAdded.bottom)}px`;
                          }

                          cDetails.style.display = "block";

                          updateLayoutCDetails(optioninput);
                        }
                      } else {
                        if (event.key !== " ") {
                          optioninput.onKeydownTarget(event);
                          optioninput.currentOptionElement.scrollIntoView({
                            behavior: "smooth",
                            block: "center",
                            inline: "center",
                          });
                        }

                        if (inTag) {
                          currentCDetailBlurAction = () => {};

                          if (
                            /^[a-zA-Z0-9_ ]$/.test(event.key) ||
                            event.key === "Backspace" ||
                            event.key === "Delete"
                          ) {
                            if (event.key === " ") {
                              possibleTagify.innerHTML = optioninput.currentOption.substring(
                                optioninput.currentOption.indexOf("/") + 1,
                              );

                              inTag = false;
                              cDetails.style.display = "none";
                              optioninput.enabled = false;

                              event.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));

                              return;
                            }

                            if (eventTarget.innerHTML.indexOf(".") === -1) {
                              // #region Do nothing if CodBi-Toggle is not checked.
                              codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                              if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                                return;
                              }
                              // #region Do nothing if CodBi-Toggle is not checked.
                              inTag = false;
                              cDetails.style.display = "none";
                              optioninput.enabled = false;

                              return;
                            }
                            // #region Filter the options and end input if only one option is left.
                            if (optioninput.filter(eventTarget.innerHTML.substring(1)).length === 1) {
                              possibleTagify.innerHTML = optioninput.currentOption.substring(
                                optioninput.currentOption.indexOf("/") + 1,
                              );

                              inTag = false;
                              cDetails.style.display = "none";
                              optioninput.enabled = false;

                              event.target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
                              // #region Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
                              addTemporaryKeyblocker(500);
                              // #endregion Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
                              return;
                            }
                            // #endregion Filter the options and end input if only one option is left.
                          }
                        } else {
                          currentCDetailBlurAction = () => {
                            inTag = false;
                            cDetails.style.display = "none";
                            optioninput.enabled = false;
                          };
                        }

                        if (inTag) {
                          const realName = DEFINED.tsCheck<string>(
                            optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1).trim(),
                          );

                          const description = getDescription(window.CodbiPluginData.detStandards[realName]);

                          renderDetails(cDetails, baseDocURL, description);
                        }
                      }
                    });
                  }
                  // #endregion Handle CSS-Class inout
                  if (added instanceof HTMLInputElement) {
                    const addedRow = getAncestor(added, 2);

                    if (!addedRow) {
                      continue;
                    }
                    // #region Handle sole clicks on a [data-cb-func] value field
                    const dataFuncRowHeader = queryGridCell(addedRow, "r1");

                    if (getLowerText(dataFuncRowHeader) === "data-cb-func") {
                      window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities);

                      if (!epManager.enabled) {
                        added.setSelectionRange(added.value.length, added.value.length);
                        // #region Refresh listing.
                        INSTANCE.tsCheck<HTMLElement>(
                          document.querySelector('div[is = "xc-epmanager"]'),
                          HTMLElement,
                        ).setAttribute("options", buildFileList(window.CodbiPluginData.fslFunctionalities));
                        // #endregion Refresh listing.
                        epManager.mode = "SV";
                        epManager.target = INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement);
                        epManager.activeOptions = added.value.split(",").map((o) => o.trim());
                        epManager.enabled = true;
                        lastPanelShownAt = Date.now();

                        updateLayoutEPManager(added);
                        // #region Hide CodBi-Interface
                        added.addEventListener("blur", (event) => {
                          if (!flagMouseOverCDetails) {
                            epManager.enabled = false;
                            cDetails.style.display = "none";
                          } else {
                            currentCDetailBlurAction = () => {
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                            };
                          }

                          return;
                        });
                        // #endregion Hide CodBi-Interface
                      }

                      if (cDetails.style.display !== "block") {
                        cDetails.style.display = "block";

                        const description = getDescription(
                          window.CodbiPluginData[
                            epManager.mode === "SV" ? "detFunctionalities" : "detElementplaceholder"
                          ][epManager.currentOption.replace(".js", "").toLowerCase()],
                        );

                        renderDetails(cDetails, baseDocURL, description);

                        updateLayoutCDetails(epManager);
                      }
                    }
                    // #endregion Handle sole clicks on a [data-cb-func] value field
                    if (added.parentElement) {
                      const addedParent = added.parentElement;
                      if (added.classList.contains("editor-text") && matchesGridCellClass(addedParent, "r1")) {
                        let cbFUNCs: string | undefined;

                        const addedRow = getAncestor(addedParent, 2);

                        if (addedRow) {
                          for (const possibleCBFunc of queryGridCells(addedRow, "r1")) {
                            if (possibleCBFunc.parentElement && getLowerText(possibleCBFunc) === "data-cb-func") {
                              cbFUNCs = INSTANCE.tsCheck<HTMLElement>(
                                queryGridCell(DEFINED.tsCheck<HTMLElement>(possibleCBFunc.parentElement), "r2"),
                                HTMLElement,
                              ).innerHTML;

                              break;
                            }
                          }
                        }

                        if (cbFUNCs) {
                          // #region If a data-cb-func field is existent...
                          INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement).placeholder = "CodBi: ALT+P";

                          added.addEventListener("keydown", (event) => {
                            // #region Show listing of available functionality parameter.
                            if (event.altKey && (event.key === "p" || event.key === "P")) {
                              // #region Build Parameter-listing according to selected functionalities
                              const parameterListing: { [key: string]: Array<string> } = {};

                              for (let functionality of cbFUNCs.trim().split(",")) {
                                // Process functionality only if it is not an empty string...
                                if (!/^\s*$/.test(functionality)) {
                                  functionality = functionality.toLowerCase();

                                  parameterListing[functionality] = new Array<string>();

                                  for (const parameter in window.CodbiPluginData.detFunctionalities[functionality]
                                    ?.Parameter) {
                                    DEFINED.tsCheck<Array<string>>(parameterListing[functionality]).push(parameter);
                                  }
                                }

                                const functionalityParameter = new Array<string>();

                                for (const functionality in parameterListing) {
                                  for (const parameter of DEFINED.tsCheck<Array<string>>(
                                    parameterListing[functionality],
                                  )) {
                                    functionalityParameter.push(`${functionality} / ${parameter}`);
                                  }
                                }
                                // If there is no parameter for the selected functionalities, abort showing the interface.
                                if (functionalityParameter.length === 0) {
                                  return;
                                }
                                // #endregion Build Parameter-listing according to selected functionalities
                                // #region Reset the <XC-OptionInput>'s option-transformer.
                                optioninput.optionTransformer = (toTransform: string): string => {
                                  return toTransform.toUpperCase();
                                };
                                // #endregion Reset the <XC-OptionInput>'s option-transformer.
                                // #region Show the interface.
                                optioninput.mode = "Functionality Parameter";
                                optioninput.target = added;
                                optioninput.enabled = true;
                                lastPanelShownAt = Date.now();
                                optioninput.options = functionalityParameter;
                                cDetails.style.display = "block";
                                optioninput.targetOptionTransformer = (toTransform: string): string => {
                                  return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
                                };

                                updateLayoutOptioninput(added);
                                updateLayoutCDetails(optioninput);
                                // #region Show the interface.
                                // #region Set initial documentation details.
                                const description = getDescription(
                                  window.CodbiPluginData.detFunctionalities[
                                    optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)
                                  ],
                                );

                                renderDetails(cDetails, baseDocURL, description);
                                // #endregion Set initial documentation details.
                              }
                            }
                            // #endregion Show listing of available functionality parameter.
                            // #region Hide Interface on ESC.
                            if (event.key === "Escape") {
                              optioninput.enabled = false;
                              cDetails.style.display = "none";
                              // #endregion Hide Interface on ESC.
                            }
                          });
                          // #region Hide interface on blur.
                          added.addEventListener("blur", (event) => {
                            if (!flagMouseOverCDetails) {
                              optioninput.enabled = false;
                              cDetails.style.display = "none";
                            } else {
                              currentCDetailBlurAction = () => {
                                optioninput.enabled = false;
                                cDetails.style.display = "none";
                              };
                            }
                          });
                          // #endregion Hide interface on blur.
                          // #endregion If a data-cb-func field is existent...
                        } else {
                          // #region Do nothing if CodBi-Toggle is not checked.
                          codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                          if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                            return;
                          }
                          // #region Do nothing if CodBi-Toggle is not checked.
                          // #region If there is no data-cb-func field existent...
                          INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement).placeholder = "CodBi: ALT+F";
                          // #region Create a data-cb-func field on ALT + F.
                          added.addEventListener("keydown", (event) => {
                            if (event.altKey && event.key.toLowerCase() === "f") {
                              // #region Do nothing if CodBi-Toggle is not checked.
                              codbiToggle = document.querySelector("#form-codbi-prop-enable-input");
                              if (codbiToggle && !(codbiToggle as HTMLInputElement).checked) {
                                return;
                              }
                              // #region Do nothing if CodBi-Toggle is not checked.
                              event.preventDefault();
                              event.stopImmediatePropagation();
                              event.stopPropagation();

                              added.value = "data-cb-func";

                              INSTANCE.tsCheck<HTMLElement>(queryGridCell(addedRow, "r2"), HTMLElement).click();
                            }
                          });
                          // #endregion Create a data-cb-func field on ALT + F.
                          // #endregion If there is no data-cb-func field existent...
                        }
                      }
                    }

                    const rowHeader = queryGridCell(addedRow, "r1");

                    const rowHeaderText = getLowerText(rowHeader);

                    if (
                      rowHeaderText !== "data-cb-apply" &&
                      rowHeaderText !== "data-cb-func" &&
                      rowHeaderText.includes("data-cb-")
                    ) {
                      const cell = INSTANCE.tsCheck<HTMLElement>(queryGridCell(addedRow, "r2"), HTMLElement);

                      const currentFunctionalityParameterInput = cell.querySelector("input");

                      let bound = false; // States whether the epManager's target is already bound to this <input>.

                      cell.addEventListener(
                        "keydown",
                        (event) => {
                          if (!(event.target instanceof HTMLInputElement)) {
                            return;
                          }

                          const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);
                          // #region If ALT + X...
                          if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "x") {
                            // #region Prevent default actions & bubbling.
                            keyboardEvent.preventDefault();
                            keyboardEvent.stopImmediatePropagation();
                            keyboardEvent.stopPropagation();
                            // #endregion Prevent default actions & bubbling.
                            const attributePanel = getAttributesPanel();

                            if (!attributePanel) {
                              return;
                            }

                            attributePanelForcedToEnlarge = attributePanel.style.position !== "fixed";

                            attributePanel.style.position =
                              attributePanel.style.position === "fixed" ? "relative" : "fixed";
                            attributePanel.style.zIndex = attributePanel.style.position === "fixed" ? "1001" : "0";
                            attributePanel.style.left = attributePanel.style.position === "fixed" ? "10vw" : "";
                            attributePanel.style.top = attributePanel.style.position === "fixed" ? "10vh" : "";
                            attributePanel.style.width = attributePanel.style.position === "fixed" ? "80vw" : "";
                            attributePanel.style.height =
                              attributePanel.style.position === "fixed" ? "fit-content" : "";
                            attributePanel.style.boxShadow =
                              attributePanel.style.position === "fixed" ? "0 0 1em darkorange" : "";
                            attributePanel.style.borderRadius = attributePanel.style.position === "fixed" ? ".5em" : "";
                            attributePanel.style.borderColor = attributePanel.style.position === "fixed" ? "black" : "";
                            attributePanel.style.transition = attributePanel.style.position === "fixed" ? "1s all" : "";
                            attributePanel.style.border = attributePanel.style.position === "fixed" ? "solid" : "";
                          }
                          // #endregion If ALT + X...
                          // #region If ALT + E...
                          if (keyboardEvent.altKey && keyboardEvent.key.toLowerCase() === "e") {
                            // #region Prevent default actions & bubbling.
                            keyboardEvent.preventDefault();
                            keyboardEvent.stopImmediatePropagation();
                            keyboardEvent.stopPropagation();
                            // #endregion Prevent default actions & bubbling.
                            epManager.mode = "SV";
                            epManager.mode = "EP";
                            // #region Rebuild listing.
                            INSTANCE.tsCheck<HTMLElement>(
                              document.querySelector('div[is = "xc-epmanager"]'),
                              HTMLElement,
                            ).setAttribute("epoptions", buildFileList(window.CodbiPluginData.fslElementplaceholder));
                            // #endregion Rebuild listing.
                            // First time load of APIDoc
                            renderDetails(
                              cDetails,
                              baseDocURL,
                              window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description ?? "",
                            );

                            // #region Show interface.
                            epManager.enabled = true;
                            lastPanelShownAt = Date.now();
                            epManager.enteringEP = true;
                            cDetails.style.display = "block";

                            updateLayoutEPManager(cell);
                            updateLayoutCDetails(epManager);
                            // #endregion Show interface.
                            // #region Bind epManager's target to this <input> evading unnecessary multiple binding.
                            if (!bound && event.target !== null) {
                              bound = true;

                              epManager.target = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
                            }
                            // #endregion Bind epManager's target to this <input> evading unnecessary multiple binding.
                          }
                          // #endregion If ALT + E...
                        },
                        { capture: true },
                      );
                      // #region Hide CodBi-Interface on leaving <input>.
                      currentFunctionalityParameterInput?.addEventListener("blur", (event) => {
                        // #region End forced enlargement of the attributes panel, if necessary.
                        if (attributePanelForcedToEnlarge) {
                          const attributePanel = getAttributesPanel();

                          if (!attributePanel) {
                            return;
                          }

                          attributePanelForcedToEnlarge = false;
                          attributePanel.style.position = "relative";
                          attributePanel.style.zIndex = "0";
                          attributePanel.style.left = "";
                          attributePanel.style.top = "";
                          attributePanel.style.width = "";
                          attributePanel.style.height = "";
                          attributePanel.style.boxShadow = "";
                          attributePanel.style.borderRadius = "";
                          attributePanel.style.borderColor = "";
                          attributePanel.style.border = "";
                          attributePanel.style.transition = "";
                        }
                        // #endregion End forced enlargement of the attributes panel, if necessary.
                        if (!flagMouseOverCDetails) {
                          epManager.enabled = false;
                          cDetails.style.display = "none";
                        } else {
                          currentCDetailBlurAction = () => {
                            epManager.enabled = false;
                            cDetails.style.display = "none";
                          };
                        }
                      });
                      // #endregion Hide CodBi-Interface on leaving <input>.
                    }
                  }
                }
              }
            }
          });
          // #endregion Parametercells
          const extendedPanel = queryFirst<HTMLElement>([
            "#tabsRight\\:extendedTab .xm-editor-panel",
            '[id$=":extendedTab"] .xm-editor-panel',
            '[id*="extendedTab"] .xm-editor-panel',
          ]);

          if (!extendedPanel) {
            return;
          }

          attributesEditorProcessed = true;

          paramCellObserver.observe(extendedPanel, {
            childList: true,
            subtree: true,
          });

          const registeredCells = new Array<HTMLElement>();

          const observer = new MutationObserver((mutationsList, observer) => {
            // #region Process each element of class slick-row
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  if (!(added instanceof HTMLElement)) {
                    continue;
                  }

                  const rowCandidates: Array<HTMLElement> = [];

                  if (added.classList.contains("slick-row")) {
                    rowCandidates.push(added);
                  }

                  rowCandidates.push(...Array.from(added.querySelectorAll<HTMLElement>(".slick-row")));

                  for (const rowElement of rowCandidates) {
                    // #region Register each cell of class .r2
                    const cell = INSTANCE.tsCheck<HTMLElement>(queryGridCell(rowElement, "r2"), HTMLElement);
                    // #region Register Keyblocker to block keystrokes for a certain amount of time after a CodBi-Option was selected
                    cell.addEventListener("keydown", (event) => {
                      if (event.key !== ",") {
                        if (
                          event.key !== "Tab" &&
                          keystrokeBlockingStart &&
                          keystrokeBlockingStart.getTime() + 1000 >= new Date().getTime()
                        ) {
                          event.preventDefault();
                          event.stopImmediatePropagation();
                          event.stopPropagation();
                        }
                      } else {
                        keystrokeBlockingStart = undefined;
                      }
                    });
                    // #endregion Register Keyblocker to block keystrokes for a certain amount of time after a CodBi-Option was selected
                    // #region  Blends in the CodBi-Interface even when not clicked on another cell before.
                    //          A new <input> is then created when the current one looses focus without another cell
                    //          having been clicked.
                    const cellObserver = new MutationObserver((mutationsList, observer) => {
                      for (const mutation of mutationsList) {
                        if (mutation.type === "childList") {
                          for (const added of mutation.addedNodes) {
                            const addedElement = added instanceof HTMLElement ? added : null;
                            const inputs = addedElement
                              ? addedElement instanceof HTMLInputElement
                                ? [addedElement]
                                : Array.from(addedElement.querySelectorAll("input"))
                              : [];

                            for (const input of inputs) {
                              const addedRow = getAncestor(input, 2);

                              if (!addedRow) {
                                continue;
                              }
                              // Only if the <input> is for a [data-cb-func]-attributefield...
                              if (getLowerText(queryGridCell(addedRow, "r1")) === "data-cb-func") {
                                if (input.classList.contains("editor-text")) {
                                  if (!epManager.enabled) {
                                    epManager.enabled = true;
                                    lastPanelShownAt = Date.now();
                                  }
                                  if (cDetails.style.display !== "block") {
                                    cDetails.style.display = "block";
                                  }
                                }
                              }
                              // #region Disable CodBi-Interface when this newly created <input> looses focus
                              input.addEventListener("blur", (event) => {
                                if (!flagMouseOverCDetails) {
                                  epManager.enabled = false;
                                  cDetails.style.display = "none";
                                } else {
                                  currentCDetailBlurAction = () => {
                                    epManager.enabled = false;
                                    cDetails.style.display = "none";
                                  };
                                }
                              });
                              // #endregion Disable CodBi-Interface when this newly created <input> looses focus
                            }
                          }
                        }
                      }
                    });
                    cellObserver.observe(cell, {
                      childList: true,
                    });
                    // #endregion Blends in the CodBi-Interface even when not clicked on another cell before.
                    if (registeredCells.includes(cell)) {
                      continue;
                    }

                    registeredCells.push(cell);
                    // Check if the corresponding cell of class .r1 has "data-cb-func" (case insensitive)...
                    if (
                      getLowerText(queryGridCell(DEFINED.tsCheck<HTMLElement>(cell.parentElement), "r1")) ===
                      "data-cb-func"
                    ) {
                      const currentFunctionalityInput = cell.querySelector("input");
                      // If a new <input> was generated by clicking into a cell of class .r2
                      if (currentFunctionalityInput !== null) {
                        // #region Hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("blur", () => {
                          if (!flagMouseOverCDetails) {
                            epManager.enabled = false;
                            cDetails.style.display = "none";
                          } else {
                            currentCDetailBlurAction = () => {
                              epManager.enabled = false;
                              cDetails.style.display = "none";
                            };
                          }
                        });
                        // #endregion Hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("keydown", (event) => {
                          // #region Hide SVManager and API-Docs on ESC
                          if (event.key === "Escape") {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();

                            epManager.enabled = false;
                            cDetails.style.display = "none";

                            return;
                          }
                          // #endregion Hide SVManager and API-Docs on ESC
                        });
                        // #region Show interface.
                        // #region Refresh listing.
                        INSTANCE.tsCheck<HTMLElement>(
                          document.querySelector('div[is = "xc-epmanager"]'),
                          HTMLElement,
                        ).setAttribute("options", buildFileList(window.CodbiPluginData.fslFunctionalities));
                        // #endregion Refresh listing.
                        epManager.mode = "SV";
                        epManager.target = currentFunctionalityInput;
                        epManager.enabled = true;
                        lastPanelShownAt = Date.now();

                        cDetails.style.display = "block";

                        updateLayoutEPManager(cell);
                        updateLayoutCDetails(epManager);
                        // #endregion Show interface.
                        // #endregion Style SVManager including dimensions and target input setting
                      }
                    }
                    // #endregion Register each cell of class .r2
                  }
                }
              }
            }
            // #endregion Process each element of class slick-row
          });

          const extendedGrid = queryFirst<HTMLElement>([
            "#tabsRight\\:extendedTab .grid-canvas",
            '[id$=":extendedTab"] .grid-canvas',
            '[id*="extendedTab"] .grid-canvas',
          ]);

          if (!extendedGrid) {
            return;
          }

          observer.observe(extendedGrid, {
            childList: true,
          });
        });
      }
      // #endregion Extend the extended tab.
      // #endregion Setup Attributes-Editor Monitoring
    } else {
      console.info(
        "Unable to register <XC-EPManager> & <XC-OptionInput>. Functionalities have to be specified manually.",
      );
    }
  });
}
