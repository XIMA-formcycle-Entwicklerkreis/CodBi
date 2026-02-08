// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { OR } from "xdbc/src/DBC/OR";
import { EQ } from "xdbc/src/DBC/EQ";
import { IF } from "xdbc/src/DBC/IF";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { HasAttribute } from "xdbc/src/DBC/HasAttribute";
// #endregion XDBC
// #region XIMA
import { allByCssAs, allByCssHtml, byCssAs, byCssHtml } from "@de-xima/xima-common-js-dom";
// #endregion XIMA
// #endregion Imports
/**
 * A {@link HTMLDivElement } that manages the **s**eparated **v**alues within an {@link HTMLInputElement }
 * of type **text**.
 * It reflects the list of values within the {@link HTMLInputElement } {@link SVManager.target }ed using a collection
 * of {@link HTMLInputElement }s of type **checkbox** and {@link HTMLParagraphElement } contained in
 * {@link HTMLDivElement }s.
 * Checking the boxes or navigating through the collection with the **up** and **down** arrow keys and using the
 * **enter** or **delete** keys, the {@link SVManager.target }ed's content can be modified. */
export class SVManager extends HTMLDivElement {
  // #region Events
  /** Holds all event listener to notify whenever the currently selected option changes. */
  public readonly onOptionChanged: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  /** Holds all event listener to notify whenever an autocomplete occurred. */
  public readonly onAutocomplete: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  /** Holds all event listener to notify whenever an option was selected. */
  public readonly onOptionSelected: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  // #endregion Events
  /** Holds the web-component definition of observed attributes. */
  static get observedAttributes(): Array<string> {
    return ["options", "separator", "cssEnabled", "cssDisabled", "enabled"];
  }
  // #region Options
  /** Holds the {@link string }s that're the actual options. */
  public options: Array<string>;
  /** Holds the {@link string } the {@link SVManager.target }ed {@link HTMLInputElement }'s content shall
   * be split into. */
  protected separator: string;
  /** Stores a ( toTransform : string ) => string to use before displaying
   * the {@link this.options }. */
  protected _optionTransformer: ((toTransform: string) => string) | undefined;
  /**
   * Sets the {@link SVManager._transformer }.
   *
   * @param toSet The {@link SVManager._transformer }. */
  public set optionTransformer(toSet: ((toTransform: string) => string) | undefined) {
    this._optionTransformer = toSet;

    this.render();
  }
  /** Sets the URL to an image that shall be used as the CSS-Background-Image for the {@link SVmanager.options } panel. */
  public set backgroundImage(toSet: string) {
    this.cssEnabled = `background-color : #FFFFFFDD ; background-size : contain ; background-position : center ; background-repeat : no-repeat ; background-blend-mode : overlay ; display : block ; background-image : url("${toSet}"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
  }
  // #endregion Options
  /**
   * Gets the name of the currently set option.
   *
   * @return The name of the currently set option. */
  public get currentOption(): string {
    return (
      byCssHtml(".---WaXCode.--SVManager.--Option.-Current", this.shadowRoot ?? undefined)?.dataset.cbOption.replace(
        ".js",
        "",
      ) ?? ""
    );
  }
  /** Stores the last {@link KeyboardEvent }'s **key** that passed through {@link SVManager.onKeydownTarget }. */
  protected lastKey: string | undefined;
  /** Holds the CSS to apply to the {@link SVManager.cOptions } when this {@link SVManager } is
   * to be {@link SVManager.show }n. */
  protected cssEnabled: string;
  /** Holds the CSS to apply to the {@link SVManager.cOptions } when this {@link SVManager } is
   * shall {@link SVManager.hide }. */
  protected cssDisabled: string;
  /** Gets a {@link boolean } stating whether the {@link SVManager.cssEnabled } or {@link SVManager.cssDisabled } is being applied on this
   * {@link HTMLDivElement }.
   *
   * @returns This {@link SVManager } 's "enabled"-attribute value. */
  @HasAttribute.cINVARIANT("enabled")
  public get enabled(): boolean {
    return this.getAttribute("enabled")?.toLowerCase() === "true";
  }
  /**
   * Sets this {@link SVManager } 's "enabled"-attribute value
   *
   * @param toSet The value This {@link SVManager } 's "enabled"-attribute shall be set to. */
  public set enabled(toSet: boolean) {
    this.setAttribute("enabled", toSet ? "true" : "false");
  }
  // #region Styling
  /** Holds the stylesheet that varies depending on whether this {@link SVManager } is currently
   * {@link SVManager.enabled } or when {@link SVManager.cssEnabled } or {@link SVManager.cssDisabled } change. */
  protected variableStyle: HTMLStyleElement;
  /** Holds the fade in animation for this {@link SVManager }. */
  public cssFadeIN: string = `
    @keyframes kfFadeIN_SVManager {
        0%    { scale : 1.1 ; opacity : 0 ;}
        100%  { scale : 1 ; opacity : .9 ;}}
    div.---WaXCode.--SVManager { animation : kfFadeIN_SVManager .25s ease-in forwards ;}`;
  // #endregion Styling
  // #region Targeting input-elements
  /** Stores the {@link HTMLInputElement } that is currently targeted.*/
  protected _target: HTMLInputElement | undefined;
  /**
   * Gets the {@link SVManager._target }.
   *
   * @returns The {@link SVManager._target }. */
  public get target(): HTMLInputElement | undefined {
    return this._target;
  }
  /**
   * Sets the {@link SVManager._target }, updates the checkboxes according to the functionalities mentioned in
   * the {@link SVManager.target } and bind {@link SVManager.onKeyupTarget } & {@link SVManager.onKeydownTarget } to
   * the {@link SVManager.target } **toSet** **keyup** & **keydown** events also removing the handler from the
   * former {@link SVManager.target }.
   *
   * @param toSet The {@link SVManager._target }.
   *
   * @throws  A {@link DBC.Infringement } if this {@link SVManager }'s {@link HTMLDivElement.shadowRoot } is not
   *          defined or a query of **.---WaXCode.--SVManager.--Option.-Current** or
   *          **.---WaXCode.--SVManager.--Option** does not return an {@link HTMLDivElement }.*/
  public set target(toSet: HTMLInputElement) {
    if (this._target && this._target !== toSet) {
      this._target.removeEventListener("focus", this.onFocusTarget);
      this._target.removeEventListener("keyup", this.onKeyupTarget);
      this._target.removeEventListener("keydown", this.onKeydownTarget);
      this._target.removeEventListener("input", this.onInputTarget);
      this._target.removeEventListener("selectionchange", this.onInputTarget);
    }

    this._target = toSet;

    this._target.addEventListener("focus", this.onFocusTarget.bind(this));
    this._target.addEventListener("keyup", this.onKeyupTarget.bind(this));
    this._target.addEventListener("keydown", this.onKeydownTarget.bind(this));
    this._target.addEventListener("input", this.onInputTarget.bind(this));
    this._target.addEventListener("selectionchange", this.onInputTarget.bind(this));

    if (document.activeElement === this._target) {
      this.onFocusTarget(new Event("focus"));
    }

    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
    // Check all options that're mentioned in the new {@link SVManager.target }.
    for (const checkbox of shadow.querySelectorAll("input")) {
      checkbox.checked =
        this._target.value.toLowerCase().indexOf(checkbox.parentElement?.dataset.cbOption?.toLowerCase() ?? "") !== -1;
    }
    // Reenable all disabled options.
    for (const option of allByCssHtml(".---WaXCode.--SVManager.--Option", shadow)) {
      option.style.display = "flex";
    }
    // #region Select first option as the current one
    const former = DEFINED.tsCheck<HTMLDivElement>(
      INSTANCE.tsCheck<HTMLDivElement>(
        shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"),
        HTMLDivElement,
      ),
    );

    const optionElements = shadow.querySelectorAll(".---WaXCode.--SVManager.--Option");

    if (optionElements[0] !== former) {
      INSTANCE.tsCheck<HTMLDivElement>(
        shadow.querySelector(".---WaXCode.--SVManager.--Option"),
        HTMLDivElement,
      ).classList.add("-Current");

      former.classList.remove("-Current");
    }
    // #endregion Select first option as the current one
  }
  // #endregion Targeting input-elements
  // #region Info
  /** Stores whether the cursor is currently within this {@link SVManager }.*/
  protected _cursorIn: boolean = false;
  /** Stores whether the {@link SVManager.target } is focused for the first time. */
  protected newFocusTarget = false;
  /**
   * Gets {@link SVManager._cursorIn }.
   *
   * @returns {@link SVManager._cursorIn }. */
  public get cursorIn(): boolean {
    return this._cursorIn;
  }
  // #endregion Info
  /**
   * Creates this {@link HTMLDivElement } by mapping it's properties to it's attributes and injecting a
   * needed stylesheet. */
  constructor() {
    super();
    // #region Prevent anything from loosing focus when the SVManager is clicked.
    this.addEventListener("mousedown", (event) => {
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
    });
    // #endregion Prevent anything from loosing focus when the SVManager is clicked.
    // #region PRECONDITIONS
    new HasAttribute("options").check(this);
    // #endregion PRECONDITIONS
    // #region Property mapping
    this.separator = this.getAttribute("separator") ?? ",";
    this.options = this.getAttribute("options")?.split(this.separator) ?? [];
    this.cssEnabled =
      this.getAttribute("cssEnabled") ??
      "display : block ; background-image : linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )";
    this.cssDisabled = this.getAttribute("cssDisabled") ?? "display : none ;";
    this.enabled = this.getAttribute("enabled")?.toLowerCase() === "true";
    // #endregion Property mapping
    // #region DOM preparations
    this.classList.add("---WaXCode", "--SVManager");

    this.variableStyle = document.createElement("style");
    this.variableStyle.innerHTML = `${this.enabled ? this.cssEnabled : this.cssDisabled}}`;

    const style = document.createElement("style");
    style.innerHTML = `
        div.---WaXCode.--SVManager.--Option             { display : flex ; transition : .25s all ;}
        div.---WaXCode.--SVManager.--Option input       { cursor : pointer ;}
        div.---WaXCode.--SVManager.--Option p           {
          cursor : pointer ; background-color : transparent ; color : black ; text-shadow : 0 0 .25em white ;}
        div.---WaXCode.--SVManager.--Option.-Current    {
          border : solid ; border-radius : .5em ; border-color : darkorange ; box-shadow : 0 0 .5em black ;
          background-color : #FF8C00BB ;}
        div.---WaXCode.--SVManager.--Option.-Current p  { color : black ;}`;

    this.attachShadow({ mode: "open" });

    this.variableStyle = this.appendChild(this.variableStyle);

    DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).appendChild(style);
    // #endregion DOM preparations
    // #region Provide Update via PluginData
    window.CodbiPluginData.updateSVManager = (options: string) => {
      this.options = JSON.parse(options).map((e: string) => e.replace(".js", ""));

      this.render();
    };
    // #endregion Provide Update via PluginData
    this.render();
  }
  /** Render's all {@link SVManager.options }. */
  protected render(): void {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

    for (const toRemove of shadow.querySelectorAll("div.---WaXCode.--SVManager.--Option")) {
      toRemove.remove();
    }
    // #region Options injection
    const fragment = document.createDocumentFragment();

    for (const option of this.options) {
      const container = document.createElement("div");
      const checkbox = document.createElement("input");
      const label = document.createElement("p");

      container.classList.add("---WaXCode", "--SVManager", "--Option");

      if (this.options[0] === option) {
        container.classList.add("-Current");
      }

      container.setAttribute("part", "Optioncontainer");
      container.dataset.cbOption = option;

      checkbox.setAttribute("part", "Optioninput");
      checkbox.type = "checkbox";

      label.setAttribute("part", "Optiontext");
      label.textContent = this._optionTransformer
        ? this._optionTransformer(option.replace(".js", ""))
        : option.replace(".js", "");

      container.appendChild(checkbox);
      container.appendChild(label);
      fragment.appendChild(container);
    }

    shadow.appendChild(fragment);
    // #endregion Options injection
    // #region Bind event handler
    const checkboxSelector = '[part="Optioninput"]';
    const optionSelector = '[part="Optiontext"]';

    if (!shadow.querySelector('[data-codbi-svmanager-listeners="true"]')) {
      const listenerMarker = document.createElement("span");

      listenerMarker.dataset.codbiSvmanagerListeners = "true";
      listenerMarker.hidden = true;
      shadow.appendChild(listenerMarker);

      shadow.addEventListener("click", (event) => {
        const target = event.target as HTMLElement | null;

        if (!target) {
          return;
        }

        if (target.matches(checkboxSelector)) {
          this.onCheckbox(event);

          return;
        }

        if (target.matches(optionSelector)) {
          this.onOption(event);
        }
      });
    }
    // #endregion Bind event handler
  }
  /**
   * Processes changes in the {@link SVManager }'s system attributes.
   *
   * @param name      The changed attribute's name.
   * @param oldValue  The changed attribute's former value.
   * @param newValue  The changed attribute's current value. */
  @DBC.ParamvalueProvider
  attributeChangedCallback(
    @OR.PRE([new EQ("options"), new EQ("separator"), new EQ("enabled"), new EQ("cssenabled"), new EQ("cssdisabled")])
    name: string,
    oldValue: string,
    @IF.PRE(new EQ("cssenabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/))
    @IF.PRE(new EQ("cssdisabled"), new REGEX(/^\s*(?:[\w-]+\s*:\s*[^;]+;?\s*)+$/))
    newValue: string,
  ): void {
    switch (name) {
      case "options":
        this.options = newValue.split(this.separator);

        this.render();

        break;
      case "separator":
        this.separator = newValue;

        this.render();

        break;
      case "enabled":
        this.variableStyle.innerHTML = `${newValue.toLowerCase() === "true" ? this.cssFadeIN : ""} div.---WaXCode.--SVManager { ${
          newValue.toLowerCase() === "true" ? this.cssEnabled : this.cssDisabled
        }}`;

        break;
      case "cssenabled":
        this.cssEnabled = newValue;

        if (this.enabled) {
          this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--SVManager { ${this.cssEnabled}}`;
        }

        break;
      case "cssdisabled":
        this.cssDisabled = newValue;
        if (!this.enabled) {
          this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--SVManager { ${this.cssDisabled}}`;
        }

        break;
    }
  }
  // #region Registration as custom element
  /**
   * States whether this {@link SVManager } was successfully registered as a custom element and performs
   * the registration upon class usage.
   *
   * @throws See {@link window.customElements }'s **define** method. */
  public static registered: boolean = (() => {
    customElements.define("xc-svmanager", SVManager, { extends: "div" });

    return true;
  })();
  // #endregion Registration as custom element
  // #region Checkbox handling
  /**
   * If the {@link SVManager.target } is defined, clicking a checkbox will either result in the corresponding
   * functionality to be removed or added to the {@link SVManager.target }'s value.
   *
   * @param event The {@link Event }. */
  protected onCheckbox(event: Event): void {
    const target = INSTANCE.tsCheck<HTMLInputElement>(this.target, HTMLInputElement);
    const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    target.focus();

    const option = eventTarget.parentElement?.getAttribute("data-cb-option")?.toUpperCase() ?? "";

    if (eventTarget.checked) {
      // #region Add functionality
      // If caret is at the end of the <input>...
      if (target.selectionStart === 0) {
        target.value = `${option.toLowerCase()}${target.value.length === 0 ? "" : ","}`;
      } else {
        if (target.selectionStart !== null) {
          // #region Determine indices for replacement
          let segmentStart = target.selectionStart;

          while (target.value[--segmentStart] !== this.separator && segmentStart !== 0) {}
          let segmentEnd = target.selectionStart - 1;

          while (target.value[++segmentEnd] !== this.separator && segmentEnd !== target.value.length) {}
          // #endregion Determine indices for replacement
          // #region Replace properly leaving the [separator] untouched
          target.value = target.value.replace(
            target.value.substring(segmentStart + (target.value[segmentStart] === this.separator ? +1 : 0), segmentEnd),
            `${option.toLowerCase()},`,
          );
          // #endregion Replace properly leaving the [separator] untouched
          const newPosition = segmentStart + option.length + 2; // Including the [separator].

          target.setSelectionRange(newPosition, newPosition);
        }
      }
      // #endregion Add functionality
    } else {
      // #region Remove functionality
      const targetValue = target.value;

      target.value = targetValue
        .toLowerCase()
        .replace(
          (targetValue.indexOf(`,${option.toLowerCase()}`) === -1 ? "" : ",") +
            option.toLowerCase() +
            (targetValue.indexOf(`,${option.toLowerCase()}`) === -1 ? "," : ""),
          "",
        );
      // #endregion Remove functionality
    }
  }
  // #endregion Checkbox handling
  // #region Checkbox handling
  /**
   * Selects the clicked option and fires the {@link SVManager.onOptionChanged } handlers.
   *
   * @param event The {@link Event }. */
  protected onOption(event: Event): void {
    const eventTarget = INSTANCE.tsCheck<HTMLElement>(event.target, HTMLElement);
    const currentOption = INSTANCE.tsCheck<HTMLElement>(
      DEFINED.tsCheck<Element>(
        DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current"),
      ),
      HTMLElement,
    );

    currentOption.classList.remove("-Current");

    const newCurrentContainer = eventTarget.parentElement;

    if (newCurrentContainer) {
      newCurrentContainer.classList.add("-Current");
      newCurrentContainer.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
    }

    for (const handler of this.onOptionChanged) {
      const newOption = eventTarget.parentElement?.dataset.cbOption;

      if (newOption) {
        handler(newOption);
      }
    }
  }
  // #endregion Checkbox handling
  // #region Keyboard handling
  /**
   * Prevents the {@link this.target } from loosing focus on hitting keys that're used to control
   * this {@link SVManager }.
   *
   * @param event The {@link KeyboardEvent }. */
  protected onKeyupTarget(event: KeyboardEvent): void {
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }
  /**
   * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
   *
   * @returns The first visible option. */
  protected get previousVisibleOption(): HTMLElement | null | undefined {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
    let current = previousElementSibling(shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"));

    while (current != null && current.style.display === "none") {
      current = previousElementSibling(current.previousElementSibling);
    }

    if (current === null || !current.hasAttribute("part")) {
      const options = allByCssHtml(".---WaXCode.--SVManager.--Option", shadow);

      current = options[options.length - 1] ?? null;

      while (current !== null && current.style.display === "none") {
        current = previousElementSibling(current);
      }
    }

    return current;
  }
  /**
   * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
   *
   * @returns The first visible option. */
  protected get nextVisibleOption(): HTMLElement | null | undefined {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

    let current = nextElementSibling(shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"));

    while (current != null && current.style.display === "none") {
      current = nextElementSibling(current.nextElementSibling);
    }

    if (current === null) {
      current = shadow.querySelector(".---WaXCode.--SVManager.--Option");

      while (current != null && current.style.display === "none") {
        current = nextElementSibling(current.nextElementSibling);
      }
    }

    return current;
  }
  /**
   * Selects the next option.
   *
   * @param event The {@link KeyboardEvent }. */
  protected onKeydownTarget(event: KeyboardEvent): void {
    this.lastKey = event.key;

    if (event.key === "Delete") {
      this.onInputTarget(event);

      return;
    }
    // #region Prevent target from loosing focus
    if (event.key === "ArrowDown" || event.key === "ArrowUp" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
    // #endregion Prevent target from loosing focus
    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
        {
          const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
          const former = DEFINED.tsCheck<HTMLElement>(
            INSTANCE.tsCheck<HTMLDivElement>(
              shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current"),
              HTMLDivElement,
            ),
          );
          const targetOption = DEFINED.tsCheck<HTMLElement>(
            event.key === "ArrowDown" ? this.nextVisibleOption : this.previousVisibleOption,
          );

          targetOption.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
          targetOption.classList.add("-Current");
          former.classList.remove("-Current");

          for (const handler of this.onOptionChanged) {
            const cbOption = byCssHtml(".---WaXCode.--SVManager.--Option.-Current", shadow)?.dataset.cbOption;

            handler(cbOption ?? "");
          }
        }

        break;
      // Select / Unselect
      case " ":
        {
          const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

          byCssHtml('.---WaXCode.--SVManager.--Option.-Current [ part = "Optioninput"]', shadow)?.click();
        }

        for (const handler of this.onOptionSelected) {
          const cbOption = byCssHtml(
            ".---WaXCode.--SVManager.--Option.-Current",
            DEFINED.tsCheck<ShadowRoot>(this.shadowRoot),
          )?.dataset.cbOption;

          handler(cbOption ?? "");
        }

        break;
    }
  }
  /**
   * Sets {@link SVManager.newFocusTarget } to **true** in order for other methods to be able to recognize when
   * the {@link SVManager.target } was focused prior to their invocation.
   *
   * @param event The {@link Event }. */
  protected onFocusTarget(event: Event): void {
    this.newFocusTarget = true;
  }
  /**
   * Handles input on the {@link SVManager.target } filtering the available {@link SVManager.options } and
   * completing the option within the {@link SVManager.target } when one of the {@link SVManager.options } gets
   * definite.
   *
   * @param event The {@link Event }. */
  protected onInputTarget(event: Event): void {
    const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
    // #region If the [target] just received focus, show all available functionalities
    if (this.newFocusTarget) {
      this.newFocusTarget = false;

      for (const handler of this.onOptionChanged) {
        handler(this.options[0] ?? "");
      }

      return;
    }
    // #endregion If the [target] just received focus, show all available functionalities
    let segmentContent: string | undefined;

    if (eventTarget.value.toLowerCase().trim() === "data-cb-func") {
      eventTarget.value = "";
    }

    segmentContent = this.determineSegmentcontent(eventTarget.value, this.separator, eventTarget.selectionStart ?? 0);

    const remainingOptions = this.filter(segmentContent);

    if (remainingOptions.length === 0) {
      this.enabled = false;

      return;
    }

    if (
      event.type !== "selectionchange" &&
      this.lastKey !== "Backspace" &&
      this.lastKey !== "Delete" &&
      remainingOptions.length === 1
    ) {
      eventTarget.value = eventTarget.value.replace(segmentContent, remainingOptions[0] ?? "");

      for (const handler of this.onAutocomplete) {
        handler(remainingOptions[0] ?? "");
      }

      for (const handler of this.onOptionChanged) {
        handler(remainingOptions[0] ?? "");
      }
    }

    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

    shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.classList.remove("-Current");
    DEFINED.tsCheck<HTMLElement>(
      INSTANCE.tsCheck<HTMLDivElement>(
        shadow.querySelector(`.---WaXCode.--SVManager.--Option[ data-cb-option = "${remainingOptions[0]}"]`),
        HTMLDivElement,
      ),
    ).classList.add("-Current");
  }
  // #endregion Keyboard handling
  // #region Filtering
  /**thi
   * Filters the view of options.
   *
   * @param filter  The {@link string } to apply as a filter.
   * @param options The {@link HTMLDivElement }s to filter. If not specified, all children tagged with the CSS-Classes
   *                "---WaXCode --SVManager --Option" will be used.
   *
   * @returns The remaining options. */
  public filter(
    filter: string,
    options: HTMLDivElement[] = allByCssAs(
      ".---WaXCode.--SVManager.--Option",
      HTMLDivElement,
      this.shadowRoot ?? undefined,
    ),
  ): Array<string> {
    const hits = new Array<string>();

    let firstVisible: HTMLDivElement | undefined;

    for (const option of options) {
      const cbOption = option.dataset.cbOption ?? "";
      if (cbOption.toLowerCase().indexOf(filter.toLowerCase()) === -1) {
        option.style.display = "none";
      } else {
        if (firstVisible === undefined) {
          firstVisible = option;
        }
        hits.push(cbOption);

        option.style.display = "flex";
      }

      const part = byCssAs('[ part = "Optioninput"]', HTMLInputElement, option);

      if (part !== undefined) {
        part.checked = false;

        for (const candidate of this.target.value.split(",")) {
          if (candidate === cbOption) {
            part.checked = true;
          }
        }
      }
    }

    firstVisible?.click();

    return hits;
  }
  // #endregion Filtering
  /**
   * Determines the segment-content within a separated values {@link string } out of the specified **position**.
   *
   * @param separatedValues The {@link string } containing the separated values.
   * @param delimiter       The {@link string } delimiting each segment.
   * @param position        The current position within the segment.
   *
   * @returns The segment-content where the **position** is pointing at. */
  protected determineSegmentcontent(separatedValues: string, delimiter: string, position: number = 0): string {
    const caretPos: number = position;

    if (separatedValues.length === 0 || caretPos < 0 || caretPos > separatedValues.length) {
      return "";
    }

    const lastCommaBeforeCaret: number = separatedValues.lastIndexOf(delimiter, caretPos - 1);
    const firstCommaAfterCaret: number = separatedValues.indexOf(delimiter, caretPos);

    if (lastCommaBeforeCaret === -1 && firstCommaAfterCaret !== -1) {
      return separatedValues.split(delimiter)[0]?.trim() ?? "";
    }

    if (lastCommaBeforeCaret !== -1 && firstCommaAfterCaret === -1) {
      return separatedValues.substring(lastCommaBeforeCaret + 1).trim();
    }

    if (lastCommaBeforeCaret === -1 || firstCommaAfterCaret === -1 || lastCommaBeforeCaret >= firstCommaAfterCaret) {
      return separatedValues.trim();
    }

    return separatedValues.substring(lastCommaBeforeCaret + 1, firstCommaAfterCaret).trim();
  }
}
// #region Tools
/**
 * Gets the {@link HTMLElement.nextElementSibling next element sibling} of the given element when it is an HTMLElement.
 * If not, returns null.
 * @param element The element to get the next sibling of.
 * @returns The next element sibling if it is an HTMLElement, otherwise null.
 */
function nextElementSibling(element: Element | null | undefined): HTMLElement | null {
  const sibling = element?.nextElementSibling;
  return sibling instanceof HTMLElement ? sibling : null;
}
/**
 * Gets the {@link HTMLElement.previousElementSibling previous element sibling} of the given element when it is an HTMLElement.
 * If not, returns null.
 * @param element The element to get the previous sibling of.
 * @returns The previous element sibling if it is an HTMLElement, otherwise null.
 */
function previousElementSibling(element: Element | null | undefined): HTMLElement | null {
  const sibling = element?.previousElementSibling;
  return sibling instanceof HTMLElement ? sibling : null;
}
// #endregion Tools
