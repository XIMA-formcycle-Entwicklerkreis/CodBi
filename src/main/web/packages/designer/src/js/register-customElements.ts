import { registerCustomEditor } from "@de-xima/fc-form-designer";
import { MultiSelect, MultiSelectType } from "./MultiSelect";
import { SVManager } from "./SVManager.js";
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
      // biome-ignore lint/style/noNonNullAssertion: Must be in DOM 'cause if insertAdjacentHTML.
      const svmanager = document.querySelector('div[is="xc-svmanager"]')! as SVManager;
      // #region Style the functionality manager
      svmanager.optionTransformer = (toTransform: string): string => {
        return toTransform.toUpperCase();
      };

      svmanager.style.position = "absolute";
      svmanager.style.display = "none";
      svmanager.style.border = "solid";
      svmanager.style.padding = ".5em";
      svmanager.style.zIndex = "100";
      svmanager.style.backgroundColor = "white";
      svmanager.style.borderRadius = ".5em";
      svmanager.style.boxShadow = "0 0 .5em black";
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

                    if (registeredCells.includes(cell)) {
                      continue;
                    }

                    registeredCells.push(cell);
                    // Check if the corresponding cell of class .r1 has "data-cb-func" (case insensitive)...
                    if (cell.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() === "data-cb-func") {
                      currentFunctionalityInput = cell.querySelector("input");
                      cCurrentFunctionalityInput = cell as HTMLDivElement;
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
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const functionalities = JSON.parse((window as any).CodbiPluginData.fslFunctionalities).map((file: string) => {
      return file.lastIndexOf(".") !== -1 ? file.substring(0, file.lastIndexOf(".")) : file;
    });

    const cDetails = document.createElement("div");

    cDetails.style.position = "absolute";
    cDetails.style.display = "none";
    cDetails.style.border = "solid";
    cDetails.style.padding = ".5em";
    cDetails.style.zIndex = "100";
    cDetails.style.backgroundColor = "white";
    cDetails.style.borderRadius = ".5em";
    cDetails.style.boxShadow = "0 0 .5em black";
    cDetails.style.left = "10vw";
    cDetails.style.top = "10vh";
    cDetails.style.width = "60vw";
    cDetails.style.height = "80vh";
    cDetails.style.display = "none";
    cDetails.style.padding = "0";

    cDetails.classList.add("CodBi", "Panel", "Functionalitydetails");

    cDetails.innerHTML = `<object id = "CodBi_APIDocViewer"></object>`;

    const cssDetails = document.createElement("style");

    cssDetails.innerHTML =
      "object#CodBi_APIDocViewer { width : 100% !important ; height : 100% !important ; border-radius : .5em ;}</style>";

    cDetails.prepend(cssDetails);
    document.body?.appendChild(cDetails);

    const cFunctionalities = document.createElement("div");

    cFunctionalities.style.position = "absolute";
    cFunctionalities.style.display = "none";
    cFunctionalities.style.border = "solid";
    cFunctionalities.style.padding = ".5em";
    cFunctionalities.style.zIndex = "100";
    cFunctionalities.style.backgroundColor = "white";
    cFunctionalities.style.borderRadius = ".5em";
    cFunctionalities.style.boxShadow = "0 0 .5em black";

    cFunctionalities.classList.add("CodBi", "Panel", "Functionalities");

    for (const functionality of functionalities) {
      cFunctionalities.innerHTML += `<div class = "-CodBi-Autocomplete-cFunctionality">
        <input type="checkbox" data-cb-functionality = "${functionality.toUpperCase()}"></input>
        <p>${functionality.toUpperCase()}</p></div>`;
    }

    const styleFunctionalities = document.createElement("style");

    styleFunctionalities.innerHTML = `
        div.-CodBi-Autocomplete-cFunctionality { display : flex ;}
        p { background-color : transparent ; color : black ;}
        p.--CodBi_Autocomplete-SelectedFunctionality { background-color : blue ; color : white ;}`;

    cFunctionalities.appendChild(styleFunctionalities);
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    cFunctionalities.querySelector("p")!.classList.add("--CodBi_Autocomplete-SelectedFunctionality");

    for (const container of cFunctionalities.querySelectorAll("div.-CodBi-Autocomplete-cFunctionality")) {
      container.addEventListener("click", (event) => {
        console.log(
          "VVVVVVVVVVVVV",
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          (event.target! as HTMLElement).parentElement!.parentElement!.querySelector(
            ".--CodBi_Autocomplete-SelectedFunctionality",
          ),
        );
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        (event.target! as HTMLElement)
          .parentElement!.parentElement!.querySelector(".--CodBi_Autocomplete-SelectedFunctionality")
          ?.classList.remove("--CodBi_Autocomplete-SelectedFunctionality");
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        (event.target! as HTMLElement)
          .parentElement!.querySelector("p")
          ?.classList.add("--CodBi_Autocomplete-SelectedFunctionality");

        (cDetails.querySelector("object") as HTMLObjectElement).setAttribute(
          "data",
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          `https://waxcode.net/x/CodBi${(window as any).CodbiPluginData.detFunctionalities[selectedFunctionality()!.toLowerCase()].Description}`,
        );
        cDetails.style.display = "block";
      });
    }

    console.log("H0:", functionalities);
    document.body?.appendChild(cFunctionalities);
    let inFunctionalitiesPanel = false;
    cFunctionalities.addEventListener("mouseenter", (event) => {
      inFunctionalitiesPanel = true;
    });
    cFunctionalities.addEventListener("mouseleave", (event) => {
      inFunctionalitiesPanel = false;
    });
    let currentFunctionalityInput: HTMLInputElement | null;
    let cCurrentFunctionalityInput: HTMLDivElement | null;

    for (const checkbox of cFunctionalities.querySelectorAll("input")) {
      checkbox.addEventListener("click", (event) => {
        console.log("U", currentFunctionalityInput);
        if (cCurrentFunctionalityInput) {
          cCurrentFunctionalityInput.click();
          if ((event.target as HTMLInputElement).checked) {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            cCurrentFunctionalityInput.querySelector("input")!.value +=
              `,${checkbox.getAttribute("data-cb-functionality")}`;
          } else {
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            cCurrentFunctionalityInput.querySelector("input")!.value = cCurrentFunctionalityInput
              .querySelector("input")!
              .value.toUpperCase()
              .replace(
                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                (cCurrentFunctionalityInput
                  .querySelector("input")!
                  .value.indexOf(`,${checkbox.getAttribute("data-cb-functionality")}`) === -1
                  ? ""
                  : ",") +
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  checkbox.getAttribute("data-cb-functionality")! +
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  (cCurrentFunctionalityInput
                    .querySelector("input")!
                    .value.indexOf(`${checkbox.getAttribute("data-cb-functionality")}`) === 0
                    ? ","
                    : ""),
                "",
              );
          }
        }
      });
    }
    const filterFunctionalities = (filter: string) => {
      let counter = 0;
      let lastHit = "";

      for (const paragraph of cFunctionalities.querySelectorAll("p")) {
        if (paragraph.innerHTML.indexOf(filter.toUpperCase()) === -1) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          paragraph.parentElement!.style.display = "none";
        } else {
          counter++;
          lastHit = paragraph.innerHTML;
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          paragraph.parentElement!.style.display = "flex";
        }
      }

      setSelectedFunctionality(0);
      return counter > 1 ? null : lastHit;
    };

    const filterFunctionalitiesHits = (filter: string) => {
      let counter = 0;

      for (const paragraph of cFunctionalities.querySelectorAll("p")) {
        if (paragraph.innerHTML.indexOf(filter.toUpperCase()) === -1) {
        } else {
          counter++;
        }
      }

      return counter;
    };

    const selectedFunctionality = () => {
      for (let i = 0; i < cFunctionalities.querySelectorAll("p").length; i++) {
        if (
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          cFunctionalities
            .querySelectorAll("p")
            [i]!.classList.contains("--CodBi_Autocomplete-SelectedFunctionality")
        ) {
          return cFunctionalities.querySelectorAll("p")[i]?.innerHTML;
        }
      }

      return null;
    };

    const setSelectedFunctionality = (index: number) => {
      let correctIndex = index;
      if (index >= cFunctionalities.querySelectorAll("p").length) {
        correctIndex = 0;
      }
      for (let i = 0; i < cFunctionalities.querySelectorAll("p").length; i++) {
        if (i === correctIndex) {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          cFunctionalities.querySelectorAll("p")[i]!.classList.add("--CodBi_Autocomplete-SelectedFunctionality");
        } else {
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          cFunctionalities.querySelectorAll("p")[i]!.classList.remove("--CodBi_Autocomplete-SelectedFunctionality");
        }
      }
    };

    const getIndexFunctionality = (functionality: string) => {
      for (let i = 0; i < cFunctionalities.querySelectorAll("p").length; i++) {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        if (cFunctionalities.querySelectorAll("p")[i]!.innerHTML.indexOf(functionality.toUpperCase()) !== -1) {
          return i;
        }
      }

      return -1;
    };

    const prevFunctionality = () => {
      console.log("next");
      const candidates = cFunctionalities.querySelectorAll("p");
      let idxSelected = -1;
      let current = candidates.length - 1;

      while (true) {
        console.log("processing", current);
        if (current === 0) {
          current = candidates.length - 1;
        }
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        if (candidates[current]!.classList.contains("--CodBi_Autocomplete-SelectedFunctionality")) {
          console.log("found at", current);
          idxSelected = current--;

          continue;
        }

        if (
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          (candidates[current]!.parentElement!.style.display === "flex" ||
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            candidates[current]!.parentElement!.style.display === "") &&
          idxSelected !== -1
        ) {
          console.log("new found at", current);
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          candidates[current]!.classList.add("--CodBi_Autocomplete-SelectedFunctionality");
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          candidates[idxSelected]!.classList.remove("--CodBi_Autocomplete-SelectedFunctionality");
          break;
        }
        current--;
      }
    };

    const updateFunctionalityCheckboxes = (value: string) => {
      for (const checkbox of cFunctionalities.querySelectorAll("input")) {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        if (value.toUpperCase().indexOf(checkbox.getAttribute("data-cb-functionality")!) !== -1) {
          checkbox.checked = true;
        } else {
          checkbox.checked = false;
        }
      }
    };

    const nextFunctionality = () => {
      console.log("next");
      const candidates = cFunctionalities.querySelectorAll("p");
      let idxSelected = -1;
      let current = 0;

      while (true) {
        console.log("processing", current);
        if (current === candidates.length) {
          current = 0;
        }
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        if (candidates[current]!.classList.contains("--CodBi_Autocomplete-SelectedFunctionality")) {
          console.log("found at", current);
          idxSelected = current++;

          continue;
        }

        if (
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          (candidates[current]!.parentElement!.style.display === "flex" ||
            // biome-ignore lint/style/noNonNullAssertion: <explanation>
            candidates[current]!.parentElement!.style.display === "") &&
          idxSelected !== -1
        ) {
          console.log("new found at", current);
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          candidates[current]!.classList.add("--CodBi_Autocomplete-SelectedFunctionality");
          // biome-ignore lint/style/noNonNullAssertion: <explanation>
          candidates[idxSelected]!.classList.remove("--CodBi_Autocomplete-SelectedFunctionality");
          break;
        }
        current++;
      }
    };
    const registeredCells = new Array<HTMLElement>();

    for (const tabEditor of document.querySelectorAll('a[href="#tabsRight:extendedTab"]')) {
      tabEditor.addEventListener("click", (event) => {
        console.log(document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas'));

        const observer = new MutationObserver((mutationsList, observer) => {
          // Callback function to execute when mutations are observed
          for (const mutation of mutationsList) {
            if (mutation.type === "childList") {
              for (const added of mutation.addedNodes) {
                console.log((added as HTMLElement).getAttribute("class"));
                if ((added as HTMLElement).classList.contains("slick-row")) {
                  // biome-ignore lint/style/noNonNullAssertion: <explanation>
                  const cell = (added as HTMLElement).querySelector(".r2")! as HTMLElement;

                  if (registeredCells.includes(cell)) {
                    continue;
                  }

                  registeredCells.push(cell);
                  if (cell.parentElement?.querySelector(".r1")?.innerHTML.toLowerCase() === "data-cb-func") {
                    currentFunctionalityInput = cell.querySelector("input");
                    cCurrentFunctionalityInput = cell as HTMLDivElement;

                    if (currentFunctionalityInput !== null) {
                      cFunctionalities.style.maxHeight = `${window.innerHeight - Math.ceil(cell.getBoundingClientRect().bottom)}px`;
                      cFunctionalities.style.top = `${Math.ceil(cell.getBoundingClientRect().bottom)}px`;
                      cFunctionalities.style.left = `${Math.ceil(cell.getBoundingClientRect().left) - Math.ceil(cell.getBoundingClientRect().width - Math.ceil(cFunctionalities.getBoundingClientRect().width))}px`;
                      cFunctionalities.style.display = "block";
                      updateFunctionalityCheckboxes(currentFunctionalityInput.value);
                    }
                    cell.querySelector("input")?.addEventListener("keyup", (event) => {
                      console.log("GG:", event.key);
                      if (
                        event.key === "ArrowDown" ||
                        event.key === "ArrowUp" ||
                        event.key === "Enter" ||
                        event.key === "Enter"
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();
                      }
                    });
                    cell.querySelector("input")?.addEventListener("keydown", (event) => {
                      console.log("GGD:", event.key);
                      if (
                        event.key === "ArrowDown" ||
                        event.key === "ArrowUp" ||
                        event.key === "Enter" ||
                        event.key === "Delete"
                      ) {
                        event.preventDefault();
                        event.stopPropagation();
                        event.stopImmediatePropagation();

                        if (event.key === "ArrowDown") {
                          nextFunctionality();
                          console.log(
                            "V:",
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            (window as any).CodbiPluginData.detFunctionalities[selectedFunctionality()!.toLowerCase()],
                          );
                          cDetails.style.display = "block";
                          (cDetails.querySelector("object") as HTMLObjectElement).setAttribute(
                            "data",
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            `https://waxcode.net/x/CodBi${(window as any).CodbiPluginData.detFunctionalities[selectedFunctionality()!.toLowerCase()].Description}`,
                          );
                        }

                        if (event.key === "ArrowUp") {
                          prevFunctionality();
                          console.log(
                            "V:",
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                            (window as any).CodbiPluginData.detFunctionalities[selectedFunctionality()!.toLowerCase()],
                          );
                        }

                        if (event.key === "Enter") {
                          if (determineFunctionalityInSegment(event.target as HTMLInputElement) === "") {
                            (event.target as HTMLInputElement).value += cFunctionalities.querySelector(
                              "p.--CodBi_Autocomplete-SelectedFunctionality",
                            )?.innerHTML;
                          }
                          (event.target as HTMLInputElement).value = (event.target as HTMLInputElement).value.replace(
                            determineFunctionalityInSegment(event.target as HTMLInputElement),
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            cFunctionalities.querySelector("p.--CodBi_Autocomplete-SelectedFunctionality")?.innerHTML!,
                          );

                          // biome-ignore lint/style/noNonNullAssertion: <explanation>
                          (event.target! as HTMLInputElement).setSelectionRange(
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            (event.target! as HTMLInputElement).value.indexOf(
                              determineFunctionalityInSegment(event.target as HTMLInputElement),
                            ) + determineFunctionalityInSegment(event.target as HTMLInputElement).length,
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            (event.target! as HTMLInputElement).value.indexOf(
                              determineFunctionalityInSegment(event.target as HTMLInputElement),
                            ) + determineFunctionalityInSegment(event.target as HTMLInputElement).length,
                          );
                          updateFunctionalityCheckboxes((event.target as HTMLInputElement).value);
                        }

                        if (event.key === "Delete") {
                          // biome-ignore lint/style/noNonNullAssertion: <explanation>
                          (event.target! as HTMLInputElement).value = (event.target! as HTMLInputElement).value.replace(
                            // biome-ignore lint/style/noNonNullAssertion: <explanation>
                            cFunctionalities.querySelector("p.--CodBi_Autocomplete-SelectedFunctionality")?.innerHTML! +
                              // biome-ignore lint/style/noNonNullAssertion: <explanation>
                              ((event.target! as HTMLInputElement).value.indexOf(
                                // biome-ignore lint/style/noNonNullAssertion: <explanation>
                                `${cFunctionalities.querySelector("p.--CodBi_Autocomplete-SelectedFunctionality")?.innerHTML!},`,
                              ) === -1
                                ? ""
                                : ","),
                            "",
                          );
                          updateFunctionalityCheckboxes((event.target as HTMLInputElement).value);
                        }
                      }
                    });

                    cell.querySelector("input")?.addEventListener("input", (event) => {
                      cFunctionalities.style.display = "block";
                      updateFunctionalityCheckboxes((event.target as HTMLInputElement).value);
                      if ((event as InputEvent).inputType === "deleteContentBackward") {
                        cFunctionalities.style.display = "none";
                        return;
                      }
                      const result = filterFunctionalities(
                        determineFunctionalityInSegment(event.target as HTMLInputElement),
                      );
                      console.log("X:", result);
                      if (result) {
                        // biome-ignore lint/style/noNonNullAssertion: <explanation>
                        const bfCaret = (event.target! as HTMLInputElement).selectionStart || 0;
                        // biome-ignore lint/style/noNonNullAssertion: <explanation>
                        (event.target! as HTMLInputElement).value = (event.target! as HTMLInputElement).value.replace(
                          determineFunctionalityInSegment(event.target as HTMLInputElement),
                          result,
                        );
                        // biome-ignore lint/style/noNonNullAssertion: <explanation>
                        (event.target! as HTMLInputElement).setSelectionRange(
                          // biome-ignore lint/style/noNonNullAssertion: <explanation>
                          (event.target! as HTMLInputElement).value.indexOf(result) + result.length,
                          // biome-ignore lint/style/noNonNullAssertion: <explanation>
                          (event.target! as HTMLInputElement).value.indexOf(result) + result.length,
                        );
                        cFunctionalities.style.display = "none";
                      }

                      if (
                        filterFunctionalitiesHits(determineFunctionalityInSegment(event.target as HTMLInputElement)) ===
                        0
                      ) {
                        cFunctionalities.style.display = "none";
                      }
                    });
                    cell.querySelector("input")?.addEventListener("blur", (event) => {
                      if (!inFunctionalitiesPanel) {
                        cFunctionalities.style.display = "none";
                      }
                    });
                  }
                }
              }
            } else if (mutation.type === "attributes") {
              // biome-ignore lint/style/useTemplate: <explanation>
              console.log("The " + mutation.attributeName + " attribute was modified.");
            } else if (mutation.type === "characterData") {
              console.log("The text content of a node was modified.");
            }
          }
        });

        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        observer.observe(document.querySelector('[id="tabsRight:extendedTab"] .grid-canvas')!, {
          childList: true, // Observe additions/removals of child nodes
        });
      });
    }
  });

  // #endregion Register Attributehelper
}
// #region Tools
/**
 * Determines the segment within a {@link string } that lies either within two commas or after one based on the caret's
 * current position in order to support the input of **data-cb-FUNC** values.
 *
 * @param inputElement
 *
 * @returns
 */
function determineFunctionalityInSegment(inputElement: HTMLInputElement): string {
  // Get the full text content from the input element
  const fullText: string = inputElement.value;

  // Get the current caret position (selectionStart returns the caret position if no text is selected)
  const caretPos: number = inputElement.selectionStart || 0; // Default to 0 if null/undefined

  // Edge case: if the input is empty or caret is out of bounds
  if (fullText.length === 0 || caretPos < 0 || caretPos > fullText.length) {
    return fullText;
  }

  // 1. Find the index of the last comma BEFORE the caret position.
  // We search up to `caretPos - 1` to ensure the comma is strictly before the caret.
  const lastCommaBeforeCaret: number = fullText.lastIndexOf(",", caretPos - 1);

  // 2. Find the index of the first comma AFTER the caret position.
  // We search from `caretPos` to ensure the comma is strictly at or after the caret.
  const firstCommaAfterCaret: number = fullText.indexOf(",", caretPos);

  if (lastCommaBeforeCaret !== -1 && firstCommaAfterCaret === -1) {
    return fullText.substring(lastCommaBeforeCaret + 1);
  }
  // Validate the found comma positions:
  // - Both a preceding and a succeeding comma must exist.
  // - The preceding comma must be at an index less than the succeeding comma.
  // - The caret must be strictly between these two commas.
  if (
    lastCommaBeforeCaret === -1 || // No comma found before the caret
    firstCommaAfterCaret === -1 || // No comma found after the caret
    lastCommaBeforeCaret >= firstCommaAfterCaret // Commas are out of order or same
  ) {
    return fullText; // Not within a valid comma-delimited segment
  }

  // Extract the substring between the found commas.
  // We add 1 to `lastCommaBeforeCaret` to start *after* that comma.
  // The `firstCommaAfterCaret` index is exclusive for substring, so it works as is.
  const extractedSegment: string = fullText.substring(lastCommaBeforeCaret + 1, firstCommaAfterCaret);

  // Trim any leading or trailing whitespace from the extracted segment
  return extractedSegment.trim();
}
// #endregion Tools
// #endregion Tools
// #endregion Tools
// #endregion Tools
