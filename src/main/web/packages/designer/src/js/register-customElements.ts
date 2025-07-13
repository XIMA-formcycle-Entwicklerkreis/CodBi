import { getJQuery, registerCustomEditor } from "@de-xima/fc-form-designer";
import { MultiSelect, MultiSelectType } from "./MultiSelect";
import { Optioninput } from "./OptionInput.js";
import { SVManager } from "./SVManager.js";
import { EPManager } from "./EPManager.js";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
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
    const baseURL: string = `${window.location.href.split("/").slice(0, 4).join("/")}/`;

    if (SVManager.registered && EPManager.registered) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
        <div  is          = "xc-epmanager"
              options     = "${JSON.parse(codbiPluginData.fslFunctionalities)
                .map((file: string) => {
                  return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                })
                .join(",")}"
              epoptions  = "${JSON.parse(codbiPluginData.fslElementplaceholder)
                .map((file: string) => {
                  return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
                })
                .join(",")}"></div>
        <div  is = "xc-optioninput"></div>`,
      );

      const epManager = INSTANCE.tsCheck<EPManager>(document.querySelector('div[is="xc-epmanager"]'), EPManager);
      const optioninput = INSTANCE.tsCheck<Optioninput>(
        document.querySelector('div[is="xc-optioninput"]'),
        Optioninput,
      );

      optioninput.onOptionChanged.push((newOption: string) => {
        if (inTag) {
          return;
        }

        const cDetailsObject = DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object"));
        const functionality = newOption.substring(0, newOption.indexOf("/") - 1);

        if (cDetailsObject.getAttribute("data")?.indexOf(functionality) === -1) {
          cDetailsObject.setAttribute(
            "data",
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detFunctionalities[functionality].Description}`,
          );
        }
      });

      optioninput.onOptionSelected.push((selectedOption: string) => {
        cDetails.style.display = "none";

        INSTANCE.tsCheck<HTMLElement>(
          DEFINED.tsCheck<HTMLElement>(
            DEFINED.tsCheck<HTMLElement>(DEFINED.tsCheck<HTMLElement>(optioninput.target).parentElement).parentElement,
          ).querySelector(".r2"),
          HTMLElement,
        ).click();
      });

      epManager.onOptionSelected.push((selectedOption: string) => {
        cDetails.style.display = "none";
      });

      optioninput.targetOptionTransformer = (toTransform: string) => {
        return `data-cb-${toTransform.substring(toTransform.indexOf("/") + 1).trim()}`;
      };
      // #region Style the functionality manager
      optioninput.optionTransformer = epManager.optionTransformer = (toTransform: string): string => {
        return toTransform.toUpperCase();
      };

      optioninput.style.position = epManager.style.position = "absolute";
      optioninput.style.border = epManager.style.border = "solid";
      optioninput.style.padding = epManager.style.padding = ".5em";
      optioninput.style.zIndex = epManager.style.zIndex = "100";
      optioninput.style.borderRadius = epManager.style.borderRadius = ".5em";
      optioninput.style.boxShadow = epManager.style.boxShadow = "0 0 .5em black";
      optioninput.style.overflowY = epManager.style.overflowY = "auto";
      optioninput.backgroundImage =
        epManager.backgroundImage = `${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/Symbol_CodBi.svg`;
      // #region Define EPManager layout update
      const updateLayoutEPManager = (cell: HTMLElement) => {
        const rectCell = cell.getBoundingClientRect();

        epManager.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
        epManager.style.top = `${Math.ceil(rectCell.bottom)}px`;
        epManager.style.left = `${Math.ceil(rectCell.right - epManager.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
        epManager.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectCell.bottom)}px`;
      };
      // #endregion Define EPManager layout update
      // #region Define Optioninput layout update
      const updateLayoutOptioninput = (cell: HTMLElement) => {
        const rectCell = cell.getBoundingClientRect();

        optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectCell.bottom)}px`;
        optioninput.style.top = `${Math.ceil(rectCell.bottom)}px`;
        optioninput.style.left = `${Math.ceil(rectCell.right - optioninput.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
        optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectCell.bottom)}px`;
      };
      // #endregion Define Optioninput layout update
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
          100% { scale : 1 ; opacity : .9 ;}}
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
      // #region Retrieve Local API Doc
      const $ = getJQuery();

      $.ajax({
        url: `${baseURL}plugin?name=CodBi_LocalAPIDoc`,
        type: "GET",
        headers: {
          "X-Action": "Retrieve",
        },
        success: (response) => {
          for (const functionality in response.detFunctionalities) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (window.CodbiPluginData.detFunctionalities as any)[functionality] =
              response.detFunctionalities[functionality];
          }

          if (response.fslFunctionalities) {
            console.log("RS", window.CodbiPluginData);
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (window.CodbiPluginData.fslFunctionalities as any as string) =
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              `${(window.CodbiPluginData.fslFunctionalities as any as string).substring(0, window.CodbiPluginData.fslFunctionalities.length - 1)},\"${response.fslFunctionalities}\"]`;
          }

          for (const placeholder in response.detElementplaceholder) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (window.CodbiPluginData.detElementplaceholder as any)[placeholder] =
              response.detElementplaceholder[placeholder];
          }

          if (response.fslElementplaceholder) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (window.CodbiPluginData.fslElementplaceholder as any as string) =
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              `${(window.CodbiPluginData.fslElementplaceholder as any as string).substring(0, window.CodbiPluginData.fslElementplaceholder.length - 1)},\"${response.fslElementplaceholder}\"]`;
          }

          if (response.detStandards) {
            for (const key in response.detStandards) {
              window.CodbiPluginData.detStandards[key] = response.detStandards[key];
            }
          }

          if (response.fileListing) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            (window.CodbiPluginData.fileListing as any as string) =
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              `${(window.CodbiPluginData.fileListing as any as string).substring(0, window.CodbiPluginData.fileListing.length - 1)},\"${response.fileListing}\"]`;
          }
          console.log("Q", window.CodbiPluginData);
          setTimeout(() => {
            window.CodbiPluginData.populateStandards();
          });

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "options",
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            JSON.parse(window.CodbiPluginData.fslFunctionalities as any as string)
              .map((file: string) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              })
              .join(","),
          );

          INSTANCE.tsCheck<HTMLElement>(document.querySelector('div[is = "xc-epmanager"]'), HTMLElement).setAttribute(
            "epoptions",
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            JSON.parse(window.CodbiPluginData.fslElementplaceholder as any as string)
              .map((file: string) => {
                return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
              })
              .join(","),
          );

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
          @keyframes kfFadeIN_cCodBi_LocalAPIDoc {
            0% { left : -100vw ; opacity : 0 ; filter : blur( 1 );}
            100% { left : 0vw ; opacity : .9 ; filter : blur( 0 );}}
          #cCodBi_LocalAPIDoc { animation : kfFadeIN_cCodBi_LocalAPIDoc .5s ease-in forwards ; position : absolute ; left : 0vw ; top : 20vh ; width : 70vw ; height : 50vh ;}
          #cCodBi_LocalAPIDoc cb-manager { display : block ; height : 100% ;}</style>
        <div id = "cCodBi_LocalAPIDoc">
          <cb-manager apidoc  = '${JSON.stringify(response)}'
                      segment = "detFunctionalities"
                      baseURL = "${baseURL}"
                      resourceURL = "${baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/tinymce"
                      docPath = "CodbiPluginData"
                      ></cb-manager></div>`,
          );
          // #endregion Load and inject Angular local API-Documentation-Manager web component
        },
      });
      // #endregion Retrieve Local API Doc
      // #endregion Generation
      // #region Define API-Doc layout update
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
      let attributesEditorProcessed = false; // Set up processing just once.
      const availableClasses = new Array<{ standard: string; name: string; description: string }>();
      let inTag = false;

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
                      if (event.altKey && event.key === "v") {
                        // #region Global variables listing
                        const globalVariables = new Array<string>();

                        for (const standard in window.CodbiPluginData.detStandards) {
                          if (window.CodbiPluginData.detStandards[standard]?.globals) {
                            console.log("N1", standard);
                            for (const global in window.CodbiPluginData.detStandards[standard].globals) {
                              globalVariables.push(`[ ${standard} ] ${global}`);
                            }
                          }
                        }

                        for (const functionality in window.CodbiPluginData.detFunctionalities) {
                          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                          for (const parameter in (window.CodbiPluginData.detFunctionalities as any)[functionality]
                            .Parameter) {
                            globalVariables.push(`${functionality.replace(/\./g, "_")}_${parameter}`);
                          }
                        }
                        // #endregion Global variables listing
                        optioninput.options = globalVariables;
                        optioninput.enabled = true;
                        optioninput.target = added;
                        optioninput.optionTransformer = undefined;

                        optioninput.onOptionChanged.push((newOption) => {
                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detFunctionalities[newOption.substring(0, newOption.lastIndexOf("_")).replace(/_/g, ".").trim()].Description}`,
                          );
                        });

                        optioninput.onOptionSelected.push((newOption) => {
                          if (added.value.indexOf("[") !== -1) {
                            added.value = added.value.substring(added.value.indexOf("]") + 2);
                          } else {
                            added.value = added.value.replace("data-cb-", "");
                          }
                        });

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
                      }
                    });

                    added.addEventListener("blur", (event) => {
                      cDetails.style.display = "none";
                      optioninput.enabled = false;
                    });
                  }
                }
              }
            }
          });

          cellObserver.observe(DEFINED.tsCheck(document.querySelector("#varseditor")), {
            childList: true,
            subtree: true,
          });
        });
      }

      for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"]')) {
        tabEditor.addEventListener("click", (event) => {
          // #region Parametercells
          const paramCellObserver = new MutationObserver((mutationsList, observer) => {
            for (const mutation of mutationsList) {
              if (mutation.type === "childList") {
                for (const added of mutation.addedNodes) {
                  // #region Handle CSS-Class inout
                  console.log("N", added.parentElement);
                  const possibleTagify = DEFINED.tsCheck<HTMLElement>(added.parentElement);
                  if (possibleTagify.classList.contains("tagify__input")) {
                    let input: string | undefined;
                    // #region Hide Interface
                    possibleTagify.addEventListener("blur", (event) => {
                      inTag = false;
                      cDetails.style.display = "none";
                      optioninput.enabled = false;
                    });
                    // #endregion Hide Interface
                    possibleTagify.addEventListener("keyup", (event) => {
                      if (input === undefined) {
                        if (event.key === ".") {
                          inTag = true;
                          input = "";

                          availableClasses.length = 0;

                          for (const standard in window.CodbiPluginData.detStandards) {
                            if (window.CodbiPluginData.detStandards[standard]?.Active) {
                              console.log("O", standard, window.CodbiPluginData.detStandards[standard].classes);
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

                          optioninput.options = availableClasses.map(
                            (cssClass) => `${cssClass.standard} / ${cssClass.name}`,
                          );
                          optioninput.enabled = true;
                          optioninput.optionTransformer = undefined;

                          const rectAdded = INSTANCE.tsCheck<HTMLElement>(
                            added.parentElement,
                            HTMLElement,
                          ).getBoundingClientRect();

                          optioninput.style.maxHeight = `${window.innerHeight - Math.ceil(rectAdded.bottom)}px`;
                          optioninput.style.top = `${Math.ceil(rectAdded.bottom)}px`;
                          optioninput.style.left = `${Math.ceil(rectAdded.right - optioninput.getBoundingClientRect().width - (window.innerWidth / 100) * 2)}px`;
                          optioninput.style.maxHeight = `${Math.ceil(window.innerHeight - (window.innerHeight / 100) * 2 - rectAdded.bottom)}px`;

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

                        if (inTag && /^[a-zA-Z0-9_ ]$/.test(event.key)) {
                          if (event.key === " ") {
                            possibleTagify.innerHTML = optioninput.currentOption.substring(
                              optioninput.currentOption.indexOf("/") + 1,
                            );

                            inTag = false;
                            cDetails.style.display = "none";
                            optioninput.enabled = false;

                            return;
                          }

                          input += event.key;

                          console.log("filter", input);
                          optioninput.filter(input);
                        }

                        if (inTag) {
                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detStandards[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1).trim()].Description}`,
                          );
                        }
                      }

                      console.log("XX:", input);
                    });
                  }

                  if (DEFINED.tsCheck(added.parentElement).classList.contains("tagify__input")) {
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
                      if (!epManager.enabled) {
                        added.setSelectionRange(added.value.length, added.value.length);

                        epManager.mode = "SV";
                        epManager.target = INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement);
                        epManager.enabled = true;

                        updateLayoutEPManager(added);

                        added.addEventListener("blur", (event) => {
                          epManager.enabled = false;
                          cDetails.style.display = "none";
                        });

                        DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                          "data",
                          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                          `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detFunctionalities[epManager.currentOption].Description}`,
                        );
                      }
                      if (cDetails.style.display !== "block") {
                        cDetails.style.display = "block";

                        updateLayoutCDetails(epManager);
                      }
                    }
                    // #endregion Handle sole clicks on a [data-cb-func] value field
                    const addedParent = DEFINED.tsCheck<HTMLElement>(added.parentElement);

                    if (added.classList.contains("editor-text") && addedParent.classList.contains("r1")) {
                      let cbFUNCs: string | undefined;

                      for (const possibleCBFunc of DEFINED.tsCheck<HTMLElement>(
                        DEFINED.tsCheck<HTMLElement>(addedParent.parentElement).parentElement,
                      ).querySelectorAll(".r1")) {
                        if (possibleCBFunc.innerHTML.toLowerCase() === "data-cb-func") {
                          cbFUNCs = INSTANCE.tsCheck<HTMLElement>(
                            DEFINED.tsCheck<HTMLElement>(possibleCBFunc.parentElement).querySelector(".r2"),
                            HTMLElement,
                          ).innerHTML;

                          break;
                        }
                      }

                      if (cbFUNCs) {
                        INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement).placeholder = "CodBi: ALT+P";

                        added.addEventListener("keydown", (event) => {
                          if (event.altKey && event.key === "p") {
                            // #region Build Parameter-listing according to selected functionalities
                            const parameterListing: { [key: string]: Array<string> } = {};

                            for (let functionality of cbFUNCs.trim().split(",")) {
                              // Process functionality only if it is not an empty string...
                              if (/^(?!\s*$).*?\S.*$/.test(functionality)) {
                                functionality = functionality.toLowerCase();

                                parameterListing[functionality] = new Array<string>();
                                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                for (const parameter in (window.CodbiPluginData.detFunctionalities as any)[
                                  functionality
                                ].Parameter) {
                                  DEFINED.tsCheck<Array<string>>(parameterListing[functionality]).push(parameter);
                                }
                              }

                              const functionalityParameter = new Array<string>();

                              for (const functionality in parameterListing) {
                                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                                for (const parameter of parameterListing[functionality]!) {
                                  functionalityParameter.push(`${functionality} / ${parameter}`);
                                }
                              }
                              // #endregion Build Parameter-listing according to selected functionalities
                              optioninput.optionTransformer = (toTransform: string): string => {
                                return toTransform.toUpperCase();
                              };
                              optioninput.target = added;
                              optioninput.enabled = true;
                              optioninput.options = functionalityParameter;
                              cDetails.style.display = "block";

                              updateLayoutOptioninput(added);
                              updateLayoutCDetails(optioninput);

                              DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                                "data",
                                // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                                `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detFunctionalities[optioninput.currentOption.substring(0, optioninput.currentOption.indexOf("/") - 1)].Description}`,
                              );
                            }
                          }

                          if (event.key === "Escape") {
                            optioninput.enabled = false;
                            cDetails.style.display = "none";
                          }
                        });

                        added.addEventListener("blur", (event) => {
                          optioninput.enabled = false;
                          cDetails.style.display = "none";
                        });
                      } else {
                        INSTANCE.tsCheck<HTMLInputElement>(added, HTMLInputElement).placeholder = "CodBi: ALT+F";

                        added.addEventListener("keydown", (event) => {
                          if (event.altKey && event.key === "f") {
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
                      }
                    }
                    // biome-ignore lint/style/noNonNullAssertion: <explanation>
                    // biome-ignore lint/style/useSingleVarDeclarator: <explanation>
                    const cell = added.parentElement!.parentElement!.querySelector(".r2")! as HTMLElement;
                    if (
                      added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() !==
                        "data-cb-apply" &&
                      added.parentElement?.parentElement?.querySelector(".r1")?.innerHTML.indexOf("data-cb-") !== -1
                    ) {
                      const currentFunctionalityParameterInput = cell.querySelector("input");
                      let bound = false;
                      console.log("adding keydown handler");
                      currentFunctionalityParameterInput?.addEventListener("keydown", (event) => {
                        console.log("keydown");
                        const keyboardEvent = INSTANCE.tsCheck<KeyboardEvent>(event, KeyboardEvent);

                        if (keyboardEvent.altKey && keyboardEvent.key === "e") {
                          console.log("ALTe");
                          keyboardEvent.preventDefault();
                          keyboardEvent.stopImmediatePropagation();
                          keyboardEvent.stopPropagation();

                          epManager.mode = "EP";
                          // First time load of APIDoc
                          DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                            "data",
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            `${window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] === undefined ? (window as any).CodbiPluginData.docsAPI.en : (window as any).CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage]}${(window as any).CodbiPluginData.detElementplaceholder[epManager.currentOption].Description}`,
                          );

                          epManager.enabled = true;
                          epManager.enteringEP = true;
                          cDetails.style.display = "block";

                          updateLayoutEPManager(cell);
                          updateLayoutCDetails(epManager);

                          if (!bound) {
                            bound = true;

                            epManager.target = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
                          }
                        }
                      });

                      currentFunctionalityParameterInput?.addEventListener("blur", (event) => {
                        epManager.enabled = false;
                        cDetails.style.display = "none";
                      });
                    }
                  }
                }
              }
            }
          });
          // biome-ignore lint/style/noNonNullAssertion: Tab definitely exists.
          paramCellObserver.observe(document.querySelector('[id="tabsRight:extendedTab"] .xm-editor-panel')!, {
            childList: true,
            subtree: true,
          });
          // #endregion Parametercells
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
                              if (document.activeElement !== cDetails) {
                                epManager.enabled = false;
                                cDetails.style.display = "none";
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
                        // #region Define hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("blur", () => {
                          if (document.activeElement !== cDetails) {
                            epManager.enabled = false;
                            cDetails.style.display = "none";
                          }
                        });
                        // #endregion Define hide SVManager and API-Docs on blur
                        currentFunctionalityInput.addEventListener("keydown", (event) => {
                          if (event.key === "Escape") {
                            event.preventDefault();
                            event.stopPropagation();
                            event.stopImmediatePropagation();

                            epManager.enabled = false;
                            cDetails.style.display = "none";

                            return;
                          }
                        });

                        epManager.mode = "SV";
                        epManager.target = currentFunctionalityInput;
                        epManager.enabled = true;

                        cDetails.style.display = "block";

                        updateLayoutEPManager(cell);
                        updateLayoutCDetails(epManager);
                        // #endregion Style SVManager including dimensions and target input setting
                      }
                    } else {
                    }
                    // #region View corresponding API-Doc
                    epManager.onOptionChanged.push((newOption: string) => {
                      const baseDocURL =
                        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                        window.CodbiPluginData.docsAPI[(window.parent as any)[0].XFC_METADATA.currentLanguage] ===
                        undefined
                          ? // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            (window as any).CodbiPluginData.docsAPI.en
                          : // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            (window as any).CodbiPluginData.docsAPI[
                              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                              (window.parent as any)[0].XFC_METADATA.currentLanguage
                            ];
                      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                      const description = (window as any).CodbiPluginData[
                        epManager.mode === "SV" ? "detFunctionalities" : "detElementplaceholder"
                      ][newOption.toLowerCase()].Description;

                      if (description[0] === "/") {
                        DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute(
                          "data",
                          `${baseDocURL}${description}`,
                        );
                      } else {
                        DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).innerHTML = `
                          <div style = "width: 100% ; height: 100% ; overflow : auto ;">
                            ${description}</div>`;
                        DEFINED.tsCheck<HTMLObjectElement>(cDetails.querySelector("object")).setAttribute("data", "");
                      }
                    });
                    // #endregion View corresponding API-Doc
                    // #endregion Register each cell of class .r2
                  }
                }
              }
            }
            // #endregion Process each element of class slick-row
          });
          // biome-ignore lint/style/noNonNullAssertion: Tab definitely exists.
          observer.observe(document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas')!, {
            childList: true,
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
