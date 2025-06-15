import { registerCustomEditor } from "@de-xima/fc-form-designer";
import { MultiSelect, MultiSelectType } from "./MultiSelect";
import { SVManager } from "./SVManager.js";
import { CodBiSymbol } from "../Symbol";
/** Registers the {@link MultiSelect }-Editor via {@link registerCustomEditor }. */
export function registerCustomElements(): void {
  registerCustomEditor(MultiSelectType, MultiSelect);
  // biome-ignore lint/suspicious/noExplicitAny: Checking if CodbiPluginData exists.
  const codbiPluginData = (window as any).CodbiPluginData;

  if (codbiPluginData === undefined) {
    return;
  }
  // #region Register Attributehelper
  window.addEventListener("load", () => {
    if (SVManager.registered) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div  is        = "xc-svmanager"
              options   = "${JSON.parse(codbiPluginData.fslFunctionalities)
                .map((file: string) => {
                  return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                })
                .join(",")}"></div>`,
      );
      const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;
      // biome-ignore lint/style/noNonNullAssertion: Must be in DOM 'cause if insertAdjacentHTML.
      const svmanager = document.querySelector('div[is="xc-svmanager"]')! as SVManager;
      // #region Style the functionality manager
      svmanager.optionTransformer = (toTransform: string): string => {
        return toTransform.toUpperCase();
      };

      svmanager.style.position = "absolute";
      svmanager.style.border = "solid";
      svmanager.style.padding = ".5em";
      svmanager.style.zIndex = "100";
      svmanager.style.borderRadius = ".5em";
      svmanager.style.boxShadow = "0 0 .5em black";
      svmanager.style.overflowY = "auto";
      svmanager.style.opacity = ".9";
      svmanager.backgroundImage = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;
      // #region Define SVManager layout update
      const updateLayoutSVManager = (cell: HTMLElement) => {
        const rectCell = cell.getBoundingClientRect();

        svmanager.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
        svmanager.style.top = `${Math.ceil(rectCell.bottom)}px`;
        svmanager.style.left = `${Math.ceil(rectCell.right - svmanager.getBoundingClientRect().width)}px`;
        svmanager.style.maxHeight = `${Math.ceil(window.innerHeight - rectCell.bottom - (window.innerHeight / 100) * 2)}px`;
      };
      // #endregion Define SVManager layout update
      // #region API-Documentation-Viewer
      // #region Generation
      const cDetails = document.createElement("div");
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
      // #endregion Styling
      cDetails.classList.add("---CodBi", "--Panel", "--APIDoc");

      cDetails.innerHTML = `
        <div class = "APIDocLoader"></div>

        <object id = "CodBi_APIDocViewer"></object>`;

      const cssDetails = document.createElement("style");

      cssDetails.innerHTML = `
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
          100% { scale : 1 ; opacity : 1 ;}}
        .---CodBi.--Panel.--APIDoc  { animation : kfFadeIN_APIDoc .25s ease-in forwards ;}
        object#CodBi_APIDocViewer   { opacity : .8 ; width : 100% !important ; height : 100% !important ; border-radius : .5em ;}`;

      cDetails.prepend(cssDetails);
      document.body?.appendChild(cDetails);
      // #region Remove loader when having loaded for the first time in session
      const onFirstDocLoad = (event: Event) => {
        (cDetails.querySelector(".APIDocLoader") as HTMLDivElement).remove();

        (cDetails.querySelector("object") as HTMLObjectElement).removeEventListener("load", onFirstDocLoad);
      };

      (cDetails.querySelector("object") as HTMLObjectElement).addEventListener("load", onFirstDocLoad);
      // #endregion Remove loader when having loaded for the first time in session
      // #endregion Generation
      // #region Define API-Doc layout update
      const updateLayoutCDetails = () => {
        const rectSVManager = svmanager.getBoundingClientRect();
        const top = rectSVManager.top + (rectSVManager.height / 100) * 4.5;

        cDetails.style.left = `${Math.ceil(rectSVManager.left + rectSVManager.width > window.innerWidth / 2 ? (window.innerWidth / 100) * 1 : rectSVManager.left + rectSVManager.width + (window.innerWidth / 100) * 1)}px`;
        cDetails.style.top = `${top > window.innerHeight / 2 ? window.innerHeight / 2 : top}px`;
        cDetails.style.width = `${Math.ceil(rectSVManager.left + rectSVManager.width > window.innerWidth / 2 ? rectSVManager.left - (window.innerWidth / 100) * 2 : window.innerWidth - rectSVManager.right - (window.innerWidth / 100) * 2)}px`;
        cDetails.style.height = `${(rectSVManager.height < window.innerHeight / 2 ? window.innerHeight / 2 : rectSVManager.height) - (rectSVManager.height / 100) * 10}px`;
      };
      // #endregion Define API-Doc layout update
      // #endregion API-Documentation-Viewer
      // #endregion Style the functionality manager
      // #region Setup Attributes-Editor Monitoring
      let attributesEditorProcessed = false; // Set up processing just once.

      for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"]')) {
        tabEditor.addEventListener("click", (event) => {
          if (attributesEditorProcessed) {
            return;
          }

          attributesEditorProcessed = true;

          const registeredCells = new Array<HTMLElement>();

          const observer = new MutationObserver((mutationsList, observer) => {
            // #region Process each element of class slick-row
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  if ((added as HTMLElement).classList.contains("slick-row")) {
                    // #region Register each cell of class .r2
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    const cell = (added as HTMLElement).querySelector(".r2")! as HTMLElement;
                    // #region  Blends in the CodBi-Interface even when not clicked on another cell before.
                    //          A new <input> is then created when the current one looses focus without another cell
                    //          having been clicked.
                    const cellObserver = new MutationObserver((mutationsList, observer) => {
                      for (const mutation of mutationsList) {
                        if (mutation.type === "childList") {
                          for (const added of mutation.addedNodes) {
                            // Only if the <input> is for a [data-cb-func]-attributefield...
                            if (
                              added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() ===
                              "data-cb-func"
                            ) {
                              if ((added as HTMLElement).classList) {
                                if ((added as HTMLElement).classList.contains("editor-text")) {
                                  if (!svmanager.enabled) {
                                    svmanager.enabled = true;
                                  }
                                  if (cDetails.style.display !== "block") {
                                    cDetails.style.display = "block";
                                  }
                                }
                              }
                            }
                            // #region Disable CodBi-Interface when this newly created <input> looses focus
                            (added as HTMLElement).addEventListener("blur", (event) => {
                              svmanager.enabled = false;
                              cDetails.style.display = "none";
                            });
                            // #endregion Disable CodBi-Interface when this newly created <input> looses focus
                          }
                        }
                      }
                    });
                    cellObserver.observe(cell, {
                      childList: true, // Observe additions/removals of child nodes
                    });
                    // #endregion Blends in the CodBi-Interface even when not clicked on another cell before.

                    if (registeredCells.includes(cell)) {
                      continue;
                    }

                    registeredCells.push(cell);
                    // Check if the corresponding cell of class .r1 has "data-cb-func" (case insensitive)...
                    if (cell.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() === "data-cb-func") {
                      const currentFunctionalityInput = cell.querySelector("input");
                      // If a new <input> was generated by clicking into a cell of class .r2
                      if (currentFunctionalityInput !== null) {
                        // #region Define hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("blur", () => {
                          svmanager.enabled = false;
                          cDetails.style.display = "none";
                          currentFunctionalityInput.addEventListener("focus", (event) => {
                            console.log("incoming input focused.");
                          });
                        });
                        // #endregion Define hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("keydown", (event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();

                            svmanager.enabled = false;
                            cDetails.style.display = "none";

                            return;
                          }
                        });

                        svmanager.target = currentFunctionalityInput;
                        svmanager.enabled = true;

                        cDetails.style.display = "block";

                        updateLayoutSVManager(cell);
                        updateLayoutCDetails();
                        // #region View corresponding API-Doc
                        svmanager.onOptionChanged.push((newOption: string) => {
                          (cDetails.querySelector("object") as HTMLObjectElement).setAttribute(
                            "data",
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            `${(window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detFunctionalities[newOption.toLowerCase()].Description}`,
                          );
                        });
                        // #endregion View corresponding API-Doc
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
          // biome-ignore lint/style/noNonNullAssertion: Tab definitely exists.
          observer.observe(document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas')!, {
            childList: true, // Observe additions/removals of child nodes
          });
        });
      }
      // #endregion Setup Attributes-Editor Monitoring
    } else {
      console.info("Unable to register Functionality-Inputmanager. Functionalities have to be specified manually.");
    }
  });

  // #endregion Register Attributehelper
}
