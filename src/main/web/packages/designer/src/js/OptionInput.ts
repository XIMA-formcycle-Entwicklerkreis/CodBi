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
 *  A {@link HTMLDivElement } that bound to an {@link HTMLInputElement } only allows one of a
 *  certain set of {@link options }. */
export class Optioninput extends HTMLDivElement {
  // #region Info
  /** Holds a string that can be used to provide contextual information. */
  public mode: string | undefined;
  // #endregion Info
  // #region Events
  /** Holds all event listener to notify whenever the currently selected option changes. */
  public readonly onOptionChanged: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  /** Holds all event listener to notify whenever an autocomplete occurred. */
  public readonly onAutocomplete: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  /** Holds all event listener to notify whenever an option was selected. */
  public readonly onOptionSelected: Array<(newOption: string) => void> = new Array<(newOption: string) => void>();
  // #endregion Events
  /** Holds the web-component definition of observed attributes. */
  static readonly observedAttributes: Array<string> = ["options", "separator", "cssEnabled", "cssDisabled", "enabled"];
  // #region Options
  /** Holds the {@link string }s that're the actual options. */
  protected _options: Array<string> = new Array<string>();
  /** Caches the concatenated options key to optimize render performance by detecting changes. */
  private _renderCacheKey: string | null = null;
  /** Caches the current option transformer function to detect when re-rendering is needed. */
  private _renderCacheTransformer: ((toTransform: string) => string) | undefined;
  /**
   * Gets the {@link Optioninput._options }.
   *
   * @returns The {@link Optioninput._options }. */
  public get options(): Array<string> {
    return this._options;
  }
  /**
   * Sets the {@link OptionInput.options }.
   *
   * @param toSet The {@link optioninput.options }. */
  public set options(toSet: Array<string>) {
    this._options = toSet.map((option) => this.normalizeOptionToken(option));

    if (this._options.length !== 0) {
      this.render();
    }
  }
  /** Holds the {@link string } the {@link SVManager.target }ed {@link HTMLInputElement }'s content shall
   * be split into. */
  protected separator: string;
  /** Stores a ( toTransform : string ) => string to use before displaying
   * the {@link this.options }. */
  protected _optionTransformer: ((toTransform: string) => string) | undefined;
  /**
   * Sets the {@link Optioninput._transformer }.
   *
   * @param toSet The {@link Optioninput._transformer }. */
  public set optionTransformer(toSet: ((toTransform: string) => string) | undefined) {
    this._optionTransformer = toSet;

    this.render();
  }
  /** Stores a ( toTransform : string ) => string to use before setting the {@link Optioninput.target }'s value. */
  protected _targetOptionTransformer: ((toTransform: string) => string) | undefined;
  /**
   * Sets the {@link Optioninput._targetOptionTransformer }.
   *
   * @param toSet The {@link Optioninput._targetOptionTransformer }. */
  public set targetOptionTransformer(toSet: ((toTransform: string) => string) | undefined) {
    this._targetOptionTransformer = toSet;
  }
  /**
   *  Sets the URL to an image that shall be used as the CSS-Background-Image for the {@link Optioninput.options } panel.
   */
  public set backgroundImage(toSet: string) {
    this.cssEnabled = `background-color : #FFFFFFDD ; background-size : contain ; background-position : center ; background-repeat : no-repeat ; background-blend-mode : overlay ; display : block ; background-image : url("${toSet}"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
  }
  // #endregion Options
  /**
   * Gets the {@link HTMLElement } representing the currently set option.
   *
   * @return The {@link HTMLElement } representing the currently set option. */
  public get currentOptionElement(): HTMLElement {
    return INSTANCE.tsCheck<HTMLElement>(
      DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
      HTMLElement,
    );
  }
  /**
   * Gets the name of the currently set option.
   *
   * @return The name of the currently set option. */
  public get currentOption(): string {
    return (
      byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", this.shadowRoot ?? undefined)?.dataset.cbOption ?? ""
    );
  }
  /** Stores the last {@link KeyboardEvent }'s **key** that passed through {@link Optioninput.onKeydownTarget }. */
  protected lastKey: string | undefined;
  /** Holds the CSS to apply to the {@link Optioninput.cOptions } when this {@link Optioninput } is
   * to be {@link Optioninput.show }n. */
  protected cssEnabled: string;
  /** Holds the CSS to apply to the {@link Optioninput.cOptions } when this {@link Optioninput } is
   * shall {@link Optioninput.hide }. */
  protected cssDisabled: string;
  /** Gets a {@link boolean } stating whether the {@link Optioninput.cssEnabled } or {@link Optioninput.cssDisabled } is being applied on this
   * {@link HTMLDivElement }.
   *
   * @returns This {@link Optioninput } 's "enabled"-attribute value. */
  @HasAttribute.cINVARIANT("enabled")
  public get enabled(): boolean {
    return this.getAttribute("enabled")?.toLowerCase() === "true";
  }
  /**
   * Sets this {@link Optioninput } 's "enabled"-attribute value
   *
   * @param toSet The value This {@link Optioninput } 's "enabled"-attribute shall be set to. */
  public set enabled(toSet: boolean) {
    this.setAttribute("enabled", toSet ? "true" : "false");
  }
  // #region Styling
  /** Holds the stylesheet that varies depending on whether this {@link Optioninput } is currently
   * {@link Optioninput.enabled } or {@link Optioninput.cssEnabled } or {@link Optioninput.cssDisabled } change. */
  protected variableStyle: HTMLStyleElement;
  /** Holds the fade in animation for this {@link Optioninput }. */
  public cssFadeIN: string = `
    @keyframes kfFadeIN_Optioninput {
        0%    { scale : 1.1 ; opacity : 0 ;}
        100%  { scale : 1 ; opacity : .9 ;}}
    div.---WaXCode.--Optioninput { animation : kfFadeIN_Optioninput .25s ease-in forwards ;}`;
  // #endregion Styling
  // #region Targeting input-elements
  /** Stores the {@link HTMLInputElement } that is currently targeted.*/
  protected _target: HTMLInputElement | undefined;
  /**
   * Gets the {@link Optioninput._target }.
   *
   * @returns The {@link Optioninput._target }. */
  public get target(): HTMLInputElement | undefined {
    return this._target;
  }
  /**
   * Sets the {@link Optioninput._target }, updates the checkboxes according to the functionalities mentioned in
   * the {@link Optioninput.target } and bind {@link Optioninput.onKeyupTarget } & {@link Optioninput.onKeydownTarget }
   * to the {@link Optioninput.target } **toSet** **keyup** & **keydown** events also removing the handler from the
   * former {@link Optioninput.target }.
   *
   * @param toSet The {@link Optioninput._target }.
   *
   * @throws  A {@link DBC.Infringement } if this {@link Optioninput }'s {@link HTMLDivElement.shadowRoot } is not
   *          defined or a query of **.---WaXCode.--Optioninput.--Option.-Current** or
   *          **.---WaXCode.--Optioninput.--Option**does not return an {@link HTMLDivElement }.*/
  public set target(toSet: HTMLInputElement) {
    if (this._target && this._target !== toSet) {
      this._target.removeEventListener("focus", this.boundOnFocusTarget);
      this._target.removeEventListener("keyup", this.boundOnKeyupTarget);
      this._target.removeEventListener("keydown", this.boundOnKeydownTarget);
      this._target.removeEventListener("input", this.boundOnInputTarget);
      this._target.removeEventListener("selectionchange", this.boundOnInputTarget);
    }

    this._target = toSet;

    this._target.addEventListener("focus", this.boundOnFocusTarget);
    this._target.addEventListener("keyup", this.boundOnKeyupTarget);
    this._target.addEventListener("keydown", this.boundOnKeydownTarget);
    this._target.addEventListener("input", this.boundOnInputTarget);
    this._target.addEventListener("selectionchange", this.boundOnInputTarget);

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
    for (const option of allByCssHtml(".---WaXCode.--Optioninput.--Option", shadow)) {
      option.style.display = "flex";
    }
    // #region Select first option as the current one
    const former = shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current");

    if (former !== null) {
      const former = INSTANCE.tsCheck<HTMLDivElement>(
        shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
        HTMLDivElement,
      );

      const optionElements = shadow.querySelectorAll(".---WaXCode.--Optioninput.--Option");

      if (optionElements[0] !== former) {
        INSTANCE.tsCheck<HTMLDivElement>(
          shadow.querySelector(".---WaXCode.--Optioninput.--Option"),
          HTMLDivElement,
        ).classList.add("-Current");

        former.classList.remove("-Current");
      }
    }
    // #endregion Select first option as the current one
  }
  // #endregion Targeting input-elements
  // #region Info
  /** Stores whether the {@link Optioninput.target } is focused for the first time. */
  protected newFocusTarget = false;
  /** Bound {@link Optioninput.onFocusTarget } event handler for the {@link Optioninput.target }. */
  private readonly boundOnFocusTarget = this.onFocusTarget.bind(this);
  /** Bound {@link Optioninput.onKeyupTarget } event handler for the {@link Optioninput.target }. */
  private readonly boundOnKeyupTarget = this.onKeyupTarget.bind(this);
  /** Bound {@link Optioninput.onKeydownTarget } event handler for the {@link Optioninput.target }. */
  private readonly boundOnKeydownTarget = this.onKeydownTarget.bind(this);
  /** Bound {@link Optioninput.onInputTarget } event handler for the {@link Optioninput.target }. */
  private readonly boundOnInputTarget = this.onInputTarget.bind(this);
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
    this.attachShadow({ mode: "open" });

    this.separator = this.getAttribute("separator") ?? ",";
    this.options = this.getAttribute("options")?.split(this.separator) ?? [];
    this.cssEnabled =
      this.getAttribute("cssEnabled") ??
      "display : block ; background-image : linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )";
    this.cssDisabled = this.getAttribute("cssDisabled") ?? "display : none ;";
    this.enabled = this.getAttribute("enabled")?.toLowerCase() === "true";
    // #endregion Property mapping
    // #region DOM preparations
    this.classList.add("---WaXCode", "--Optioninput");

    this.variableStyle = document.createElement("style");
    this.variableStyle.innerHTML = `${this.enabled ? this.cssEnabled : this.cssDisabled}}`;

    const style = document.createElement("style");
    style.innerHTML = `
        div.---WaXCode.--Optioninput.--Option             { display : flex ; transition : .25s all ;}
        div.---WaXCode.--Optioninput.--Option p           {
          cursor : pointer ; background-color : transparent ; color : black ; text-shadow : 0 0 .25em white ;}
        div.---WaXCode.--Optioninput.--Option.-Current    {
          border : solid ; border-radius : .5em ; border-color : darkorange ; box-shadow : 0 0 .5em black ;
          background-color : #FF8C00BB ;}
        div.---WaXCode.--Optioninput.--Option.-Current p  { color : black ;}`;

    this.variableStyle = this.appendChild(this.variableStyle);

    DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).appendChild(style);
    // #endregion DOM preparations
    this.render();
  }
  /** Render's all {@link Optioninput.options }. */
  protected render(): void {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
    const optionsKey = this.options.join("\u0000");
    const existingCount = shadow.querySelectorAll("div.---WaXCode.--Optioninput.--Option").length;

    if (
      optionsKey === this._renderCacheKey &&
      this._optionTransformer === this._renderCacheTransformer &&
      existingCount === this.options.length
    ) {
      return;
    }

    const existingOptions = Array.from(
      shadow.querySelectorAll("div.---WaXCode.--Optioninput.--Option"),
    ) as HTMLDivElement[];
    const currentValue = this.currentOption;
    let currentFound = false;

    for (let index = 0; index < this.options.length; index += 1) {
      const option = this.options[index];
      let container = existingOptions[index];

      if (!container) {
        container = document.createElement("div");
        container.classList.add("---WaXCode", "--Optioninput", "--Option");
        container.setAttribute("part", "Optioncontainer");
        shadow.appendChild(container);
      }

      container.dataset.cbOption = option;
      container.classList.remove("-Current");

      if (currentValue && currentValue === option) {
        container.classList.add("-Current");
        currentFound = true;
      }

      let label = container.querySelector('[part="Optiontext"]') as HTMLParagraphElement | null;

      if (!label) {
        label = document.createElement("p");
        label.setAttribute("part", "Optiontext");
        container.appendChild(label);
      }

      label.textContent = this._optionTransformer ? this._optionTransformer(option) : option;
    }

    for (let index = this.options.length; index < existingOptions.length; index += 1) {
      existingOptions[index]?.remove();
    }

    this.ensureCurrentOption(shadow);

    this._renderCacheKey = optionsKey;
    this._renderCacheTransformer = this._optionTransformer;
    // #endregion Options injection
    // #region Bind event handler
    const checkboxSelector = '[part="Optioninput"]';
    const optionSelector = '[part="Optiontext"]';

    if (!shadow.querySelector('[data-codbi-optioninput-listeners="true"]')) {
      const listenerMarker = document.createElement("span");

      listenerMarker.dataset.codbiOptioninputListeners = "true";
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
   * Processes changes in the {@link Optioninput }'s system attributes.
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
        this.variableStyle.innerHTML = `${newValue.toLowerCase() === "true" ? this.cssFadeIN : ""} div.---WaXCode.--Optioninput { ${
          newValue.toLowerCase() === "true" ? this.cssEnabled : this.cssDisabled
        }}`;

        break;
      case "cssenabled":
        this.cssEnabled = newValue;

        if (this.enabled) {
          this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--Optioninput { ${this.cssEnabled}}`;
        }

        break;
      case "cssdisabled":
        this.cssDisabled = newValue;
        if (!this.enabled) {
          this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--Optioninput { ${this.cssDisabled}}`;
        }

        break;
    }
  }
  // #region Registration as custom element
  /**
   * States whether this {@link Optioninput } was successfully registered as a custom element and performs
   * the registration upon class usage.
   *
   * @throws See {@link window.customElements }'s **define** method. */
  public static registered: boolean = (() => {
    customElements.define("xc-optioninput", Optioninput, { extends: "div" });

    return true;
  })();
  // #endregion Registration as custom element
  // #region Checkbox handling
  /**
   * Normalizes an option token by trimming whitespace from the input string.
   *
   * @param value The option token to normalize.
   *
   * @returns The normalized option token with leading and trailing whitespace removed.
   */
  private normalizeOptionToken(value: string): string {
    return value.trim();
  }
  /**
   * Ensures that there is a current option selected in the shadow DOM.
   *
   * If no option is currently marked as <code>-Current</code>, selects the first available option.
   *
   * @param shadow The {@link ShadowRoot} containing the option elements.
   *
   * @returns void
   */
  private ensureCurrentOption(shadow: ShadowRoot): void {
    if (shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current")) {
      return;
    }

    const firstOption = shadow.querySelector("div.---WaXCode.--Optioninput.--Option");

    firstOption?.classList.add("-Current");
  }
  /**
   * Formats an option token by normalizing it and adding quotes if necessary.
   *
   * If the normalized token contains the separator or double quotes, it will be wrapped in double quotes
   * and any internal double quotes will be escaped by doubling them.
   *
   * @param value The option token to format.
   *
   * @returns The formatted option token, with quotes added if the token contains special characters.
   */
  private formatOptionToken(value: string): string {
    const normalized = this.normalizeOptionToken(value);
    const needsQuotes = normalized.includes(this.separator) || normalized.includes('"');

    if (!needsQuotes) {
      return normalized;
    }

    return `"${normalized.replace(/"/g, '""')}"`;
  }
  /**
   * Parses option tokens from a string, handling quoted values and separators.
   *
   * Processes a delimited string into individual option tokens. Supports quoted tokens that may contain
   * the separator character. Double quotes within quoted strings are escaped by doubling them.
   *
   * @param value The delimited string containing option tokens to parse.
   *
   * @returns An array of parsed and normalized option tokens, with empty tokens filtered out.
   */
  private parseOptionTokens(value: string): Array<string> {
    const tokens: Array<string> = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < value.length; index += 1) {
      const ch = value[index];

      if (ch === '"') {
        if (inQuotes && value[index + 1] === '"') {
          current += '"';
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }

        continue;
      }

      if (!inQuotes && value.startsWith(this.separator, index)) {
        tokens.push(current.trim());
        current = "";
        index += this.separator.length - 1;

        continue;
      }

      current += ch;
    }

    if (current.length > 0 || value.endsWith(this.separator)) {
      tokens.push(current.trim());
    }

    return tokens.map((entry) => this.normalizeOptionToken(entry)).filter((entry) => entry.length > 0);
  }
  /**
   * Determines the start and end positions of the segment containing the given position.
   *
   * Finds the boundaries of a delimited segment at the specified position in the input string.
   * Handles quoted values that may contain the separator character.
   *
   * @param input The input string to search within.
   * @param position The position within the input string to find the segment for.
   *
   * @returns An object with `start` and `end` properties indicating the segment boundaries.
   */
  private getSegmentRangeForValue(input: string, position: number): { start: number; end: number } {
    let inQuotes = false;
    let start = 0;
    let end = input.length;

    for (let index = 0; index < input.length; index += 1) {
      const ch = input[index];

      if (ch === '"') {
        if (inQuotes && input[index + 1] === '"') {
          index += 1;
        } else {
          inQuotes = !inQuotes;
        }

        continue;
      }

      if (!inQuotes && input.startsWith(this.separator, index)) {
        if (index < position) {
          start = index + this.separator.length;
          index += this.separator.length - 1;
        } else {
          end = index;

          break;
        }
      }
    }

    return { start, end };
  }
  /**
   * If the {@link Optioninput.target } is defined, clicking a checkbox will either result in the corresponding
   * functionality to be removed or added to the {@link Optioninput.target }'s value.
   *
   * @param event The {@link Event }. */
  protected onCheckbox(event: Event): void {
    const target = INSTANCE.tsCheck<HTMLInputElement>(this.target, HTMLInputElement);
    const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

    target.focus();

    const option = eventTarget.parentElement?.getAttribute("data-cb-option")?.toUpperCase() ?? "";

    const normalizedOption = this.normalizeOptionToken(option);
    const formattedOption = this.formatOptionToken(normalizedOption);
    const value = target.value;
    const selectionStart = target.selectionStart ?? value.length;
    const selectionEnd = target.selectionEnd ?? selectionStart;
    const separator = this.separator;

    if (eventTarget.checked) {
      // #region Add functionality
      const replacement = `${formattedOption}${separator}`;

      if (value.length === 0) {
        target.value = formattedOption;
        target.setSelectionRange(target.value.length, target.value.length);
      } else if (selectionEnd > selectionStart) {
        target.setRangeText(replacement, selectionStart, selectionEnd, "end");
      } else {
        const range = this.getSegmentRangeForValue(value, selectionStart);

        target.setRangeText(replacement, range.start, range.end, "end");
      }
      // #endregion Add functionality
    } else {
      // #region Remove functionality
      const updated = this.parseOptionTokens(value)
        .filter((entry) => entry.toUpperCase() !== normalizedOption.toUpperCase())
        .map((entry) => this.formatOptionToken(entry))
        .join(separator);

      target.value = updated;
      target.setSelectionRange(target.value.length, target.value.length);
      // #endregion Remove functionality
    }
  }
  // #endregion Checkbox handling
  // #region Checkbox handling
  /**
   * Selects the clicked option and fires the {@link Optioninput.onOptionChanged } handlers.
   *
   * @param event The {@link Event }. */
  protected onOption(event: Event): void {
    const eventTarget = INSTANCE.tsCheck<HTMLElement>(event.target, HTMLElement);
    const currentOption = INSTANCE.tsCheck<HTMLElement>(
      DEFINED.tsCheck<Element>(
        DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
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
   * this {@link Optioninput }.
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
  public get previousVisibleOption(): HTMLElement | null | undefined {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
    let current = previousElementSibling(shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"));

    while (current != null && current.style.display === "none") {
      current = previousElementSibling(current);
    }

    if (current === null || !current.hasAttribute("part")) {
      const options = allByCssHtml(".---WaXCode.--Optioninput.--Option", shadow);

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
  public get nextVisibleOption(): HTMLElement | null | undefined {
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

    let current = nextElementSibling(shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"));

    while (current !== null && current.style.display === "none") {
      current = nextElementSibling(current);
    }

    if (current === null) {
      current = shadow.querySelector(".---WaXCode.--Optioninput.--Option");

      while (current !== null && current.style.display === "none") {
        current = nextElementSibling(current);
      }
    }

    return current;
  }
  /**
   * Selects the next option.
   *
   * @param event The {@link KeyboardEvent }.
   *
   * @throws A {@link DBC.Infringement } if a query for **.---WaXCode.--Optioninput.--Option.-Current** from this
   * {@link Optioninput }'s {@link HTMLDivElement.shadowRoot } acquires **null**. */
  public onKeydownTarget(event: KeyboardEvent): void {
    if (!this.enabled) {
      return;
    }

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
    const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

    switch (event.key) {
      case "ArrowUp":
      case "ArrowDown":
        {
          const former = DEFINED.tsCheck<HTMLElement>(
            INSTANCE.tsCheck<HTMLDivElement>(
              shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current"),
              HTMLDivElement,
            ),
          );

          const targetOption = DEFINED.tsCheck<HTMLElement>(
            event.key === "ArrowDown" ? this.nextVisibleOption : this.previousVisibleOption,
          );

          targetOption.classList.add("-Current");
          former.classList.remove("-Current");

          const cbOption = DEFINED.tsCheck<string>(
            DEFINED.tsCheck<HTMLDivElement>(
              INSTANCE.tsCheck<HTMLDivElement>(
                byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                HTMLDivElement,
              ),
            ).dataset.cbOption,
          );

          targetOption.scrollIntoView({
            behavior: "smooth",
            block: "center",
            inline: "center",
          });

          for (const handler of this.onOptionChanged) {
            handler(cbOption);
          }
        }

        break;
      case " ":
        {
          const currentOption = DEFINED.tsCheck<string>(
            DEFINED.tsCheck<HTMLDivElement>(
              INSTANCE.tsCheck<HTMLDivElement>(
                byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                HTMLDivElement,
              ),
            ).dataset.cbOption,
          );

          DEFINED.tsCheck<HTMLInputElement>(this.target).value = this._targetOptionTransformer
            ? this._targetOptionTransformer(currentOption).trim()
            : DEFINED.tsCheck<string>(
                DEFINED.tsCheck<HTMLDivElement>(
                  INSTANCE.tsCheck<HTMLDivElement>(
                    byCssHtml(".---WaXCode.--Optioninput.--Option.-Current", shadow),
                    HTMLDivElement,
                  ),
                ).dataset.cbOption?.trim(),
              );

          for (const handler of this.onOptionSelected) {
            handler(currentOption);
          }
        }

        break;
    }
  }
  /**
   * Sets {@link Optioninput.newFocusTarget } to **true** in order for other methods to be able to recognize when
   * the {@link Optioninput.target } was focused prior to their invocation.
   *
   * @param event The {@link Event }. */
  protected onFocusTarget(event: Event): void {
    this.newFocusTarget = true;
  }
  /**
   * Handles input on the {@link Optioninput.target } filtering the available {@link Optioninput.options } and
   * completing the option within the {@link Optioninput.target } when one of the {@link Optioninput.options } gets
   * definite.
   *
   * @param event The {@link Event }. */
  public onInputTarget(event: Event): void {
    // #region If the [target] just received focus, show all available functionalities
    if (this.newFocusTarget) {
      this.newFocusTarget = false;

      for (const handler of this.onOptionChanged) {
        handler(this.options[0] ?? "");
      }

      return;
    }
    // #endregion If the [target] just received focus, show all available functionalities
    if (!(this.target instanceof HTMLInputElement) && !(this.target instanceof HTMLTextAreaElement)) {
      throw new INSTANCE.Infringement(
        `The this.target has to be either of type HTMLInputElement or HTMLTextAreaElement but isn't. It is of type ${typeof this.target}.`,
      );
    }

    const eventTarget = this.target;

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
      eventTarget.value = remainingOptions[0].trim() ?? "";

      for (const handler of this.onOptionChanged) {
        handler(remainingOptions[0] ?? "");
      }

      for (const handler of this.onAutocomplete) {
        handler(remainingOptions[0] ?? "");
      }
    }
  }
  // #endregion Keyboard handling
  // #region Filtering
  /**
   * Filters the view of options.
   *
   * @param filter The {@link string } to apply as a filter.
   *
   * @returns The remaining options. */
  public filter(filter: string): Array<string> {
    const cleanFilter = filter.replace("<br>", "");
    const hits = new Array<string>();
    const options = allByCssAs(".---WaXCode.--Optioninput.--Option", HTMLDivElement, this.shadowRoot ?? undefined);

    let firstVisible: HTMLDivElement | undefined;

    for (const option of options) {
      const cbOption = option.dataset.cbOption ?? "";
      if (cbOption.toLowerCase().indexOf(cleanFilter.toLowerCase()) === -1) {
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
        part.checked = DEFINED.tsCheck<HTMLInputElement>(this.target).value.toLowerCase().indexOf(cbOption) !== -1;
      }
    }

    if (hits.length !== 0) {
      firstVisible?.click();

      const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);
      shadow.querySelector(".---WaXCode.--Optioninput.--Option.-Current")?.classList.remove("-Current");
      DEFINED.tsCheck<HTMLElement>(
        INSTANCE.tsCheck<HTMLDivElement>(
          shadow.querySelector(`.---WaXCode.--Optioninput.--Option[ data-cb-option = "${hits[0]}"]`),
          HTMLDivElement,
        ),
      ).classList.add("-Current");
    }
    return hits;
  }
  // #endregion Filtering
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
