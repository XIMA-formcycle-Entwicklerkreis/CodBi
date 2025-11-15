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
// #endregion Helper
export function enableLocalDocInterface(): void {
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
      const baseDocURL =
        window.CodbiPluginData.docsAPI[currentLanguage] === undefined
          ? window.CodbiPluginData.docsAPI.en
          : window.CodbiPluginData.docsAPI[currentLanguage];
      // #region Define Flag for Keystroke blocking
      let keystrokeBlockingStart: Date | undefined = new Date();
      // #endregion Define Flag for Keystroke blocking
      // #region Inject <XC-EPManager> & <XC-OptionInput>.
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div  is          = "xc-epmanager"
                options     = "${JSON.parse(window.CodbiPluginData.fslFunctionalities)
                  .map((file: string) => {
                    return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                  })
                  .join(",")}"
                epoptions  = "${JSON.parse(window.CodbiPluginData.fslElementplaceholder)
                  .map((file: string) => {
                    return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                  })
                  .join(",")}"></div>
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
              insertText(optioninput.target as unknown as HTMLTextAreaElement, "window.codbi.checkAttributes();");

              break;

            case window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Start"):
              insertText(
                optioninput.target as unknown as HTMLTextAreaElement,
                `window.codbi.extendEP("${window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend_Placeholder")}",( params, formerResult ) =>  {});`,
              );

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

          const valueColumn = INSTANCE.tsCheck<HTMLElement>(
            optioninput.target.parentElement.parentElement.querySelector(".r2"),
            HTMLElement,
          );
          // #region Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          const blocker = (event: KeyboardEvent) => {
            const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

            keyboardEvent.preventDefault();
            keyboardEvent.stopImmediatePropagation();
            keyboardEvent.stopPropagation();

            setTimeout(() => {
              document.removeEventListener("keydown", blocker);
            }, 250);
          };

          document.addEventListener("keydown", blocker);
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

          const valueColumn = INSTANCE.tsCheck<HTMLElement>(
            optioninput.target.parentElement.parentElement.querySelector(".r4"),
            HTMLElement,
          );
          // #region Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          const blocker = (event: KeyboardEvent) => {
            const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

            keyboardEvent.preventDefault();
            keyboardEvent.stopImmediatePropagation();
            keyboardEvent.stopPropagation();

            setTimeout(() => {
              document.removeEventListener("keydown", blocker);
            }, 250);
          };

          document.addEventListener("keydown", blocker);
          // #endregion Prevent keystrokes for 250ms to avoid accidentally typing into the next field.
          valueColumn.click();

          return;
        }

        const r2 = INSTANCE.tsCheck<HTMLElement>(
          DEFINED.tsCheck<HTMLElement>(
            DEFINED.tsCheck<HTMLElement>(DEFINED.tsCheck<HTMLElement>(optioninput.target).parentElement).parentElement,
          ).querySelector(".r2"),
          HTMLElement,
        );
        // #region Create separate observer for the case of autocompletion necessary.
        const cellObserver = new MutationObserver((mutationsList, observer) => {
          for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
              for (const added of mutation.addedNodes) {
                let bound = false; // States whether the epManager's target is already bound to this <input>.

                if (added.nodeName === "INPUT") {
                  added.addEventListener("keydown", (event) => {
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
                      ).setAttribute(
                        "epoptions",
                        JSON.parse(window.CodbiPluginData.fslElementplaceholder)
                          .map((file: string) => {
                            return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                          })
                          .join(","),
                      );
                      // #endregion Rebuild listing.
                      // First time load of APIDoc
                      DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                        "data",
                        `${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`,
                      );
                      // #region Show interface.
                      epManager.enabled = true;
                      epManager.enteringEP = true;
                      cDetails.style.display = "block";

                      updateLayoutEPManager(added as HTMLInputElement);
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
        cellObserver.observe(r2.parentElement.parentElement, {
          childList: true,
          subtree: true,
        });

        r2.click();
      });

      optioninput.onOptionChanged.push((newOption: string) => {
        // #region Determining and setting the correct documentation of standard configurations.
        if (inTag) {
          const description = DEFINED.tsCheck<string>(
            window.CodbiPluginData.detStandards[newOption.substring(0, newOption.indexOf("/") - 1).trim()]?.Description,
          );

          if (description[0] === "/") {
            cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
          } else {
            cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description}</div>`;
          }

          return;
        }
        // #endregion Determining and setting the correct documentation of standard configurations.
        // #region Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
        const description = DEFINED.tsCheck<string>(
          window.CodbiPluginData.detFunctionalities[
            newOption
              .substring(0, newOption.indexOf("/") - 1)
              .toLowerCase()
              .trim()
          ]?.Description ??
            (newOption.indexOf("[") !== -1
              ? window.CodbiPluginData.detStandards[newOption.substring(1, newOption.indexOf("]") - 1).trim()]
                  ?.Description
              : window.CodbiPluginData.detFunctionalities[
                  newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()
                ]?.Description),
        );
        // #endregion Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
        if (description[0] === "/") {
          cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
        } else {
          cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description}</div>`;
        }
      });
      // #endregion Define handler for the <XC-OptionInput>'s changes in option.
      // #region Define handler for the <XC-OptionInput>'s selection.
      optioninput.onOptionSelected.push((selectedOption: string) => {
        if (optioninput.mode === "Code Template") {
          return;
        }

        cDetails.style.display = "none";

        INSTANCE.tsCheck<HTMLElement>(
          DEFINED.tsCheck<HTMLElement>(
            DEFINED.tsCheck<HTMLElement>(DEFINED.tsCheck<HTMLElement>(optioninput.target).parentElement).parentElement,
          ).querySelector(".r2"),
          HTMLElement,
        ).click();

        if (optioninput.target.parentElement === null) {
          return;
        }

        const parent = INSTANCE.tsCheck<HTMLElement>(
          DEFINED.tsCheck<HTMLElement>(
            DEFINED.tsCheck<HTMLElement>(DEFINED.tsCheck<HTMLElement>(optioninput.target).parentElement).parentElement,
          ).querySelector(".r2"),
          HTMLElement,
        );

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

          epManager.setAttribute(
            "epoptions",
            JSON.parse(window.CodbiPluginData.fslElementplaceholder)
              .map((file: string) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              })
              .join(","),
          );
          // #endregion Rebuild listing.
          // First time load of APIDoc
          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
            "data",
            `${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`,
          );
          // #region Show interface.
          epManager.enabled = true;
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
      let currentCDetailBlurAction: (() => void) | undefined;

      cDetails.addEventListener("mouseenter", (event) => {
        flagMouseOverCDetails = true;
      });
      cDetails.addEventListener("mouseleave", (event) => {
        flagMouseOverCDetails = false;

        if (currentCDetailBlurAction) {
          currentCDetailBlurAction();
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
      // #endregion Styling
      cDetails.classList.add("---CodBi", "--Panel", "--APIDoc");
      // #region Injection
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

        (cDetails.querySelector("object") as HTMLObjectElement).removeEventListener("load", onFirstDocLoad);
      };

      (cDetails.querySelector("object") as HTMLObjectElement).addEventListener("load", onFirstDocLoad);
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
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    (window.CodbiPluginData.detFunctionalities[functionality] as any).Code = response.result.replaceAll(
                      "<|>",
                      '"',
                    );
                  }
                }
              },
            });
          }

          if (response.fslFunctionalities) {
            window.CodbiPluginData.fslFunctionalities = `${window.CodbiPluginData.fslFunctionalities.substring(0, window.CodbiPluginData.fslFunctionalities.length - 1)},\"${response.fslFunctionalities.split(",").join('","')}\"]`;
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
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    (window.CodbiPluginData.detElementplaceholder[placeholder] as any).Code =
                      response.result.replaceAll("<|>", '"');
                  }
                }
              },
            });
          }

          if (response.fslElementplaceholder) {
            window.CodbiPluginData.fslElementplaceholder = `${window.CodbiPluginData.fslElementplaceholder.substring(0, window.CodbiPluginData.fslElementplaceholder.length - 1)},\"${response.fslElementplaceholder.split(",").join('","')}\"]`;
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
                      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                      (window.CodbiPluginData.detStandards[key] as any).Code = response.result.replaceAll("<|>", '"');
                    }
                  }
                },
              });
            }
          }

          if (response.fileListing) {
            window.CodbiPluginData.fileListing = `${window.CodbiPluginData.fileListing.substring(0, window.CodbiPluginData.fileListing.length - 1)},\"${response.fileListing.split(",").join('","')}\"]`;
          }

          setTimeout(() => {
            window.CodbiPluginData.populateStandards();
          });

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "options",
            JSON.parse(window.CodbiPluginData.fslFunctionalities)
              .map((file: string) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              })
              .join(","),
          );

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "epoptions",
            JSON.parse(window.CodbiPluginData.fslElementplaceholder)
              .map((file: string) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              })
              .join(","),
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
              if (
                document.getElementById("scriptForm:scriptTabs:xm-editor-js_editor").contains(document.activeElement)
              ) {
                if (optioninput.enabled) {
                  optioninput.enabled = false;
                } else {
                  // #region Hide options for code templates when JS-Editor gets blurred.
                  const listener = (event) => {
                    if (optioninput.enabled && optioninput.mode === "Code Template") {
                      optioninput.enabled = false;
                      document.activeElement.removeEventListener("blur", listener);
                    }
                  };

                  document.activeElement.addEventListener("blur", listener);
                  // #endregion Hide options for code templates when JS-Editor gets blurred.
                  // #region Calculate Layout
                  const clientRect = document.activeElement.getBoundingClientRect();
                  const emPixels = getEmSizeInPixels(document.activeElement) * 22;
                  const top = clientRect.top + clientRect.height;

                  optioninput.style.top = `${(top > 0 ? top : 0) + emPixels / 11}px`;
                  optioninput.style.left = `${clientRect.left + clientRect.width / 2}px`;
                  optioninput.style.maxHeight = `${emPixels}px`;
                  // #endregion Calculate Layout
                  optioninput.mode = "Code Template";
                  // #region Define Code Template Options
                  optioninput.options = [
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_OnLoaded"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Standard"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Functionality_Extend"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_EP_Extend"),
                    window.CodbiPluginData.retrieveManagerTranslatedResource("CodeTemplate_Start"),
                  ];
                  // #endregion Define Code Template Options
                  optioninput.enabled = true;
                  optioninput.target = document.activeElement as HTMLInputElement;
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
            console.log("L:", document.activeElement);
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

        cDetails.style.left = `${Math.ceil(rectToAlignTo.left + rectToAlignTo.width > window.innerWidth / 2 ? (window.innerWidth / 100) * 1 : rectToAlignTo.left + rectToAlignTo.width + (window.innerWidth / 100) * 1)}px`;
        cDetails.style.top = `${top > window.innerHeight / 2 ? window.innerHeight / 2 : top}px`;
        cDetails.style.width = `${Math.ceil(rectToAlignTo.left + rectToAlignTo.width > window.innerWidth / 2 ? rectToAlignTo.left - (window.innerWidth / 100) * 2 : window.innerWidth - rectToAlignTo.right - (window.innerWidth / 100) * 2)}px`;
        cDetails.style.height = `${(rectToAlignTo.height < window.innerHeight / 2 ? window.innerHeight / 2 : rectToAlignTo.height) - (rectToAlignTo.height / 100) * 10}px`;
      };
      // #endregion Define API-Doc layout update
      // #endregion API-Documentation-Viewer
      // #endregion Style the functionality manager
      // #region Setup Attributes-Editor Monitoring
      const availableClasses = new Array<{ standard: string; name: string; description: string }>();

      let attributesEditorProcessed = false; // Set up processing just once.
      let inTag = false;
      // #region Extend the variables tab.
      for (const globalVarsEditor of document.querySelectorAll('a[href="#scriptForm:scriptTabs:varTab"]')) {
        globalVarsEditor.addEventListener("click", (event) => {
          const cellObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  if (
                    added instanceof HTMLInputElement &&
                    DEFINED.tsCheck<HTMLElement>(added.parentElement).classList.contains("r2")
                  ) {
                    added.placeholder = "CodBi: ALT + V";

                    added.addEventListener("keydown", (event) => {
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

                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            `${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${
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

                          INSTANCE.tsCheck<HTMLElement>(
                            optioninput.target.parentElement.parentElement.querySelector(".r4"),
                            HTMLElement,
                          ).click();
                        });
                        // #endregion Insert proper global variable when <XC-OptionInput>'s current option was selected.
                        // #region Properly layout <XC-OptionInput>.
                        if (added) {
                          const rectAdded = INSTANCE.tsCheck<HTMLElement>(
                            added.parentElement,
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
                            window.CodbiPluginData.docsAPI[currentLanguage] === undefined
                              ? window.CodbiPluginData.docsAPI.en
                              : window.CodbiPluginData.docsAPI[currentLanguage];
                          // #region Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
                          const description = DEFINED.tsCheck<string>(
                            window.CodbiPluginData.detFunctionalities[
                              globalVariables[0]
                                .substring(0, globalVariables[0].indexOf("/") - 1)
                                .toLowerCase()
                                .trim()
                            ]?.Description ??
                              (globalVariables[0].indexOf("[") !== -1
                                ? window.CodbiPluginData.detStandards[
                                    globalVariables[0].substring(1, globalVariables[0].indexOf("]") - 1).trim()
                                  ]?.Description
                                : window.CodbiPluginData.detFunctionalities[
                                    globalVariables[0]
                                      .substring(0, globalVariables[0].lastIndexOf("_"))
                                      .replace(/_/g, ".")
                                      .trim()
                                  ]?.Description),
                          );
                          // #endregion Retrieve the proper description according to the new option's structure that identifies the type of dialogue we're actually in.
                          if (description[0] === "/") {
                            cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                          } else {
                            cDetails.innerHTML = `<div style = "width: 100% ; height: 100% ; overflow : auto ;">${description}</div>`;
                          }
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
          cellObserver.observe(DEFINED.tsCheck(document.querySelector("#varseditor")), {
            childList: true,
            subtree: true,
          });
          // #endregion Observe the global variables.
        });
      }
      // #endregion Extend the variables tab.
      // #region Extend the extended tab.
      for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"]')) {
        tabEditor.addEventListener("click", (event) => {
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

                          const description = DEFINED.tsCheck<string>(
                            window.CodbiPluginData.detStandards[realName]?.Description,
                          );

                          if (window.CodbiPluginData.detStandards[realName]?.Description[0] === "/") {
                            cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                          } else {
                            cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                          }
                          // #endregion First load of documentation.
                          optioninput.enabled = true;
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
                              const blocker = (event: KeyboardEvent) => {
                                const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

                                keyboardEvent.preventDefault();
                                keyboardEvent.stopImmediatePropagation();
                                keyboardEvent.stopPropagation();

                                setTimeout(() => {
                                  document.removeEventListener("keydown", blocker);
                                }, 500);
                              };

                              document.addEventListener("keydown", blocker);
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

                          const description = DEFINED.tsCheck<string>(
                            window.CodbiPluginData.detStandards[realName]?.Description,
                          );

                          if (window.CodbiPluginData.detStandards[realName]?.Description[0] === "/") {
                            DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).remove();

                            cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                          } else {
                            cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                          }
                        }
                      }
                    });
                  }
                  // #endregion Handle CSS-Class inout
                  if (added instanceof HTMLInputElement) {
                    // #region Handle sole clicks on a [data-cb-func] value field
                    if (
                      INSTANCE.tsCheck<HTMLElement>(
                        DEFINED.tsCheck<HTMLElement>(
                          DEFINED.tsCheck<HTMLElement>(added.parentElement).parentElement,
                        ).querySelector(".r1"),
                        HTMLElement,
                      ).innerHTML.toLowerCase() === "data-cb-func"
                    ) {
                      window.CodbiPluginData.updateSVManager(window.CodbiPluginData.fslFunctionalities);

                      if (!epManager.enabled) {
                        added.setSelectionRange(added.value.length, added.value.length);
                        // #region Refresh listing.
                        INSTANCE.tsCheck<HTMLElement>(
                          document.querySelector('div[is = "xc-epmanager"]'),
                          HTMLElement,
                        ).setAttribute(
                          "options",
                          JSON.parse(window.CodbiPluginData.fslFunctionalities)
                            .map((file: string) => {
                              return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                            })
                            .join(","),
                        );
                        // #endregion Refresh listing.
                        epManager.mode = "SV";
                        epManager.target = INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement);
                        epManager.enabled = true;

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
                        });
                        // #endregion Hide CodBi-Interface
                        if (cDetails.querySelector("object")) {
                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            `${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[epManager.currentOption]?.Description}`,
                          );
                        }
                      }

                      if (cDetails.style.display !== "block") {
                        cDetails.style.display = "block";

                        updateLayoutCDetails(epManager);
                      }
                    }
                    // #endregion Handle sole clicks on a [data-cb-func] value field
                    if (added.parentElement) {
                      const addedParent = added.parentElement;
                      if (added.classList.contains("editor-text") && addedParent.classList.contains("r1")) {
                        let cbFUNCs: string | undefined;

                        if (added.parentElement.parentElement) {
                          for (const possibleCBFunc of DEFINED.tsCheck<HTMLElement>(
                            DEFINED.tsCheck<HTMLElement>(addedParent.parentElement).parentElement,
                          ).querySelectorAll(".r1")) {
                            if (
                              possibleCBFunc.parentElement &&
                              possibleCBFunc.innerHTML.toLowerCase() === "data-cb-func"
                            ) {
                              cbFUNCs = INSTANCE.tsCheck<HTMLElement>(
                                DEFINED.tsCheck<HTMLElement>(possibleCBFunc.parentElement).querySelector(".r2"),
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
                                optioninput.options = functionalityParameter;
                                cDetails.style.display = "block";
                                optioninput.targetOptionTransformer = (toTransform: string): string => {
                                  return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
                                };

                                updateLayoutOptioninput(added);
                                updateLayoutCDetails(optioninput);
                                // #region Show the interface.
                                // #region Set initial documentation details.
                                if (
                                  window.CodbiPluginData.detFunctionalities[
                                    optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)
                                  ]?.Description[0] === "/"
                                ) {
                                  cDetails.innerHTML = `<object data = '${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)]?.Description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                                } else {
                                  const docLoader = cDetails.querySelector(".APIDocLoader");

                                  if (docLoader) {
                                    docLoader.remove();
                                  }

                                  cDetails.innerHTML = `
                                  <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                                    ${window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)]?.Description}</div>`;
                                }
                                // #endregion Set initial documentation details.
                                cDetails.innerHTML = cDetails.innerHTML.replace("undefined", "");
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
                          // #region If there is no data-cb-func field existent...
                          INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement).placeholder = "CodBi: ALT+F";
                          // #region Create a data-cb-func field on ALT + F.
                          added.addEventListener("keydown", (event) => {
                            if (event.altKey && event.key.toLowerCase() === "f") {
                              event.preventDefault();
                              event.stopImmediatePropagation();
                              event.stopPropagation();

                              added.value = "data-cb-func";

                              INSTANCE.tsCheck<HTMLElement>(
                                DEFINED.tsCheck<HTMLElement>(
                                  DEFINED.tsCheck<HTMLElement>(added.parentElement).parentElement,
                                ).querySelector(".r2"),
                                HTMLElement,
                              ).click();
                            }
                          });
                          // #endregion Create a data-cb-func field on ALT + F.
                          // #endregion If there is no data-cb-func field existent...
                        }
                      }
                    }

                    if (
                      added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() !==
                        "data-cb-apply" &&
                      added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() !==
                        "data-cb-func" &&
                      added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.indexOf("data-cb-") !== -1
                    ) {
                      const cell = INSTANCE.tsCheck<HTMLElement>(
                        DEFINED.tsCheck<HTMLElement>(
                          DEFINED.tsCheck<HTMLElement>(added.parentElement).parentElement,
                        ).querySelector(".r2"),
                        HTMLElement,
                      );

                      const currentFunctionalityParameterInput = cell.querySelector("input");

                      let bound = false; // States whether the epManager's target is already bound to this <input>.

                      currentFunctionalityParameterInput?.addEventListener("keydown", (event) => {
                        const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);
                        // #region If ALT + X...
                        if (keyboardEvent.altKey && (keyboardEvent.key === "x" || keyboardEvent.key === "X")) {
                          const attributePanel = INSTANCE.tsCheck<HTMLElement>(
                            document.querySelector('[ data-panel-id ="attributes"]'),
                            HTMLElement,
                          );

                          attributePanelForcedToEnlarge = attributePanel.style.position !== "fixed";

                          attributePanel.style.position =
                            attributePanel.style.position === "fixed" ? "relative" : "fixed";
                          attributePanel.style.zIndex = attributePanel.style.position === "fixed" ? "1001" : "0";
                          attributePanel.style.left = attributePanel.style.position === "fixed" ? "10vh" : "";
                          attributePanel.style.top = attributePanel.style.position === "fixed" ? "10vw" : "";
                          attributePanel.style.width = attributePanel.style.position === "fixed" ? "80vw" : "";
                          attributePanel.style.height = attributePanel.style.position === "fixed" ? "fit-content" : "";
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
                          ).setAttribute(
                            "epoptions",
                            JSON.parse(window.CodbiPluginData.fslElementplaceholder)
                              .map((file: string) => {
                                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                              })
                              .join(","),
                          );
                          // #endregion Rebuild listing.
                          // First time load of APIDoc
                          if (cDetails.querySelector("object") === null) {
                            cDetails.innerHTML = "<object style = 'width : 100% ; height: 100% ;'></object>";
                          }

                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            `${window.CodbiPluginData.docsAPI[currentLanguage] === undefined ? window.CodbiPluginData.docsAPI.en : window.CodbiPluginData.docsAPI[currentLanguage]}${window.CodbiPluginData.detElementplaceholder[epManager.currentOption]?.Description}`,
                          );

                          // #region Show interface.
                          epManager.enabled = true;
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
                      });
                      // #region Hide CodBi-Interface on leaving <input>.
                      currentFunctionalityParameterInput?.addEventListener("blur", (event) => {
                        // #region End forced enlargement of the attributes panel, if necessary.
                        if (attributePanelForcedToEnlarge) {
                          const attributePanel = INSTANCE.tsCheck<HTMLElement>(
                            document.querySelector('[ data-panel-id ="attributes"]'),
                            HTMLElement,
                          );

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
          paramCellObserver.observe(
            INSTANCE.tsCheck<HTMLElement>(
              document.querySelector('[id="tabsRight:extendedTab"] .xm-editor-panel'),
              HTMLElement,
            ),
            {
              childList: true,
              subtree: true,
            },
          );

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
                  const addedHTMLElement = INSTANCE.tsCheck<HTMLElement>(added, HTMLElement);

                  if (addedHTMLElement.classList.contains("slick-row")) {
                    // #region Register each cell of class .r2
                    const cell = INSTANCE.tsCheck<HTMLElement>(addedHTMLElement.querySelector(".r2"), HTMLElement);
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
                            // Only if the <input> is for a [data-cb-func]-attributefield...
                            if (
                              INSTANCE.tsCheck<HTMLElement>(
                                DEFINED.tsCheck<HTMLElement>(
                                  DEFINED.tsCheck<HTMLElement>(added.parentElement).parentElement,
                                ).querySelector(".r1"),
                                HTMLElement,
                              ).innerHTML.toLowerCase() === "data-cb-func"
                            ) {
                              if (addedHTMLElement.classList) {
                                if (addedHTMLElement.classList.contains("editor-text")) {
                                  if (!epManager.enabled) {
                                    epManager.enabled = true;
                                  }
                                  if (cDetails.style.display !== "block") {
                                    cDetails.style.display = "block";
                                  }
                                }
                              }
                            }
                            // #region Disable CodBi-Interface when this newly created <input> looses focus
                            addedHTMLElement.addEventListener("blur", (event) => {
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
                      INSTANCE.tsCheck<HTMLElement>(
                        DEFINED.tsCheck<HTMLElement>(cell.parentElement).querySelector(".r1"),
                        HTMLElement,
                      ).innerHTML.toLowerCase() === "data-cb-func"
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
                        ).setAttribute(
                          "options",
                          JSON.parse(window.CodbiPluginData.fslFunctionalities)
                            .map((file: string) => {
                              return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                            })
                            .join(","),
                        );
                        // #endregion Refresh listing.
                        epManager.mode = "SV";
                        epManager.target = currentFunctionalityInput;
                        epManager.enabled = true;

                        cDetails.style.display = "block";

                        updateLayoutEPManager(cell);
                        updateLayoutCDetails(epManager);
                        // #endregion Show interface.
                        // #endregion Style SVManager including dimensions and target input setting
                      }
                    }
                    // #region View corresponding API-Doc
                    epManager.onOptionChanged.push((newOption: string) => {
                      if (newOption === "") {
                        return;
                      }

                      const description = DEFINED.tsCheck<string>(
                        window.CodbiPluginData[
                          epManager.mode === "SV" ? "detFunctionalities" : "detElementplaceholder"
                        ][newOption.replace(".js", "").toLowerCase()]?.Description,
                      );

                      if (description[0] === "/") {
                        cDetails.innerHTML = `<object data = '${baseDocURL}${description}' style = 'width : 100% ; height : 100% ; opacity : .8 ;'></object>`;
                      } else {
                        cDetails.innerHTML = `
                            <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                              ${description}</div>`;
                      }

                      cDetails.style.display = "block";
                    });
                    // #endregion View corresponding API-Doc
                    // #endregion Register each cell of class .r2
                  }
                }
              }
            }
            // #endregion Process each element of class slick-row
          });

          observer.observe(
            INSTANCE.tsCheck<HTMLElement>(
              document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas'),
              HTMLElement,
            ),
            {
              childList: true,
            },
          );
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
