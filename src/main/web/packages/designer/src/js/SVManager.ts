import { DBC } from "xdbc/src/DBC";
import { OR } from "xdbc/src/DBC/OR";
import { EQ } from "xdbc/src/DBC/EQ";
import { IF } from "xdbc/src/DBC/IF";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { HasAttribute } from "xdbc/src/DBC/HasAttribute";
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
  // #endregion Events
  /** Holds the web-component definition of observed attributes. */
  static get observedAttributes(): Array<string> {
    return ["options", "separator", "cssEnabled", "cssDisabled", "enabled"];
  }
  // #region Options
  /** Holds the {@link string }s that're the actual options. */
  protected options: Array<string>;
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
  public set backgroundImage(toSet: string) {
    this.cssEnabled = `background-color : #FFFFFFCC ; background-size : contain ; background-position : center ; background-repeat : no-repeat ; background-blend-mode : overlay ; display : block ; background-image : url("${toSet}"), linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )`;
  }
  // #endregion Options
  public get currentOption(): string {
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active and there is always a data-cb-option and current option.
    return this.shadowRoot!.querySelector(".---WaXCode.--SVManager.--Option.-Current")!.getAttribute("data-cb-option")!;
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
    // biome-ignore lint/style/noNonNullAssertion: Checked by precondition.
    return this.getAttribute("enabled")!.toLowerCase() === "true";
  }
  /**
   * Sets this {@link SVManager } 's "enabled"-attribute value
   *
   * @param toSet The value This {@link SVManager } 's "enabled"-attribute shall be set to. */
  public set enabled(toSet: boolean) {
    this.setAttribute("enabled", toSet ? "true" : "false");
  }
  // #region Styling
  /** Holds the stylesheet that varies depending on whether this {@link SVManager } is currently {@link enabled } or
   * when {@link SVManager.cssEnabled } or {@link SVManager.cssDisabled } change. */
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
   * @param toSet The {@link SVManager._target }. */
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

    const shadow = this.shadowRoot;

    if (shadow) {
      // Check all options that're mentioned in the new {@link SVManager.target }.
      for (const checkbox of shadow.querySelectorAll("input")) {
        checkbox.checked =
          this.target?.value
            .toLowerCase()
            // biome-ignore lint/style/noNonNullAssertion: Checkbox definitely has a parent and an Attribute "data-cb-option".
            .indexOf(checkbox.parentElement!.getAttribute("data-cb-option")?.toLowerCase()!) !== -1;
      }
      // Reenable all disabled options.
      for (const option of shadow.querySelectorAll(".---WaXCode.--SVManager.--Option")) {
        (option as HTMLElement).style.display = "flex";
      }
      // #region Select first option as the current one
      const former = shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current");
      const optionElements = shadow.querySelectorAll(".---WaXCode.--SVManager.--Option");

      if (optionElements[0] !== former) {
        shadow.querySelectorAll(".---WaXCode.--SVManager.--Option")[0]?.classList.add("-Current");

        former?.classList.remove("-Current");
      }
      // #endregion Select first option as the current one
    }
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
    // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
    this.separator = this.hasAttribute("separator") ? this.getAttribute("separator")! : ",";
    // biome-ignore lint/style/noNonNullAssertion: Passed precondition check.
    this.options = this.getAttribute("options")!.split(this.separator);
    this.cssEnabled = this.hasAttribute("cssEnabled")
      ? // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
        this.getAttribute("cssEnabled")!
      : "display : block ; background-image : linear-gradient( 130deg,rgba( 42, 123, 155, 1 ) 0%, rgba( 216, 216, 235, 1 ) 50%, rgba( 42, 123, 155, 1 ) 100% )";
    // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
    this.cssDisabled = this.hasAttribute("cssDisabled") ? this.getAttribute("cssDisabled")! : "display : none ;";
    this.enabled = this.hasAttribute("enabled") ? this.getAttribute("enabled")?.toLowerCase() === "true" : false;
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
        div.---WaXCode.--SVManager.--Option.-Current p  { color : white ;}`;

    this.attachShadow({ mode: "open" });

    this.variableStyle = this.appendChild(this.variableStyle);
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    this.shadowRoot!.appendChild(style);
    // #endregion DOM preparations

    this.render();
  }
  /** Render's all {@link SVManager.options }. */
  protected render(): void {
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    for (const toRemove of this.shadowRoot!.querySelectorAll("div.---WaXCode.--SVManager.--Option")) {
      toRemove.remove();
    }
    // #region Options injection
    for (const option of this.options) {
      // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
      this.shadowRoot!.innerHTML += `
        <div  class           = "---WaXCode --SVManager --Option ${this.options[0] === option ? "-Current" : ""}"
              part            = "Optioncontainer"
              data-cb-option  = "${option}">
          <input  part  = "Optioninput"
                  type  = "checkbox"></input>

          <p part = "Optiontext">${this._optionTransformer ? this._optionTransformer(option) : option}</p></div>`;
    }
    // #endregion Options injection
    // #region Bind event handler
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    for (const checkbox of this.shadowRoot!.querySelectorAll('[part="Optioninput"]')) {
      checkbox.addEventListener("click", this.onCheckbox.bind(this));
    }
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    for (const option of this.shadowRoot!.querySelectorAll('[part="Optiontext"]')) {
      option.addEventListener("click", this.onOption.bind(this));
    }
    // #endregion Bind event handler
  }
  /**
   * Processes changes in {@link SVManager }'s system attributes.
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
    if (this.target === undefined) {
      return;
    }

    this.target.focus();
    // biome-ignore lint/style/noNonNullAssertion: Checkbox surely has a parent element.
    const option = (event.target as HTMLElement).parentElement!.getAttribute("data-cb-option")!.toUpperCase();

    if ((event.target as HTMLInputElement).checked) {
      // #region Add functionality
      // If caret is at the end of the <input>...
      if ((this.target as HTMLInputElement).selectionStart === 0) {
        (this.target as HTMLInputElement).value =
          `${option}${(this.target as HTMLInputElement).value.length === 0 ? "" : ","}`;
      } else {
        if ((this.target as HTMLInputElement).selectionStart !== null) {
          // #region Determine indices for replacement
          // biome-ignore lint/style/noNonNullAssertion: Already checked.
          let segmentStart = (this.target as HTMLInputElement).selectionStart!;

          while ((this.target as HTMLInputElement).value[--segmentStart] !== this.separator && segmentStart !== 0) {}
          // biome-ignore lint/style/noNonNullAssertion: Already checked.
          let segmentEnd = (this.target as HTMLInputElement).selectionStart! - 1;

          while (
            (this.target as HTMLInputElement).value[++segmentEnd] !== this.separator &&
            segmentEnd !== (this.target as HTMLInputElement).value.length
          ) {}
          // #endregion Determine indices for replacement
          // #region Replace properly leaving the [separator] untouched
          (this.target as HTMLInputElement).value = (this.target as HTMLInputElement).value.replace(
            (this.target as HTMLInputElement).value.substring(
              segmentStart + ((this.target as HTMLInputElement).value[segmentStart] === this.separator ? +1 : 0),
              segmentEnd,
            ),
            `${option},`,
          );
          // #endregion Replace properly leaving the [separator] untouched
          (this.target as HTMLInputElement).setSelectionRange(segmentEnd, segmentEnd);
        }
      }

      // #endregion Add functionality
    } else {
      // #region Remove functionality
      const targetValue = (this.target as HTMLInputElement).value;

      (this.target as HTMLInputElement).value = targetValue
        .toUpperCase()
        .replace(
          (targetValue.indexOf(`,${option}`) === -1 ? "" : ",") +
            option +
            (targetValue.indexOf(`,${option}`) === -1 ? "," : ""),
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
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    const currentOption = this.shadowRoot!.querySelector(".---WaXCode.--SVManager.--Option.-Current");

    if (currentOption !== null) {
      currentOption.classList.remove("-Current");

      const newCurrentContainer = (event.target as HTMLElement).parentElement;

      if (newCurrentContainer) {
        newCurrentContainer.classList.add("-Current");
        newCurrentContainer.scrollIntoView({ behavior: "smooth", inline: "center", block: "center" });
      }

      for (const handler of this.onOptionChanged) {
        // biome-ignore lint/style/noNonNullAssertion: Paragraph surely has a parent element.
        const newOption = (event.target as HTMLElement).parentElement!.getAttribute("data-cb-option");

        if (newOption) {
          handler(newOption);
        }
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
    const shadow = this.shadowRoot;

    if (shadow) {
      let current: HTMLElement | null = shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")
        ?.previousElementSibling as HTMLElement;

      while (current != null && current.style.display === "none") {
        current = current.previousElementSibling as HTMLElement;
      }

      if (current === null || !current.hasAttribute("part")) {
        console.log("fC!", current);
        const options = shadow.querySelectorAll(".---WaXCode.--SVManager.--Option");

        // biome-ignore lint/style/noNonNullAssertion: Can't be undefined when .length - 1 .
        current = options[options.length - 1]! as HTMLElement;

        while (current !== null && current.style.display === "none") {
          current = current.previousElementSibling as HTMLElement;
        }
      }

      return current;
    }

    return null;
  }
  /**
   * Traverses the options from the current on returning the first one which's **style.display** is not **none**.
   *
   * @returns The first visible option. */
  protected get nextVisibleOption(): HTMLElement | null | undefined {
    const shadow = this.shadowRoot;

    if (shadow) {
      let current: HTMLElement | null = shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")
        ?.nextElementSibling as HTMLElement;

      while (current != null && current.style.display === "none") {
        current = current.nextElementSibling as HTMLElement;
      }

      if (current === null) {
        current = shadow.querySelector(".---WaXCode.--SVManager.--Option");

        while (current != null && current.style.display === "none") {
          current = current.nextElementSibling as HTMLElement;
        }
      }

      return current;
    }

    return null;
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
          const shadow = this.shadowRoot;

          if (shadow) {
            const former = shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current");

            // biome-ignore lint/style/noNonNullAssertion: There's always a next or previous visible option.
            (event.key === "ArrowDown" ? this.nextVisibleOption! : this.previousVisibleOption!).classList.add(
              "-Current",
            );

            former?.classList.remove("-Current");

            for (const handler of this.onOptionChanged) {
              handler(
                // biome-ignore lint/style/noNonNullAssertion: An option always has a data-cb-attribute.
                shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.getAttribute("data-cb-option")!,
              );
            }
          }
        }
        break;
      // Select / Unselect
      case " ":
        {
          const shadow = this.shadowRoot;

          if (shadow) {
            (
              shadow.querySelector(
                '.---WaXCode.--SVManager.--Option.-Current [ part = "Optioninput"]',
              ) as HTMLInputElement
            ).click();
          }
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
    // #region If the [target] just received focus, show all available functionalities
    if (this.newFocusTarget) {
      this.newFocusTarget = false;

      for (const handler of this.onOptionChanged) {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        handler(this.options[0]!);
      }

      return;
    }
    // #endregion If the [target] just received focus, show all available functionalities
    let segmentContent: string | undefined;

    if ((event.target as HTMLInputElement).value.toLowerCase().trim() === "data-cb-func") {
      (event.target as HTMLInputElement).value = "";
    }

    const remainingOptions = this.filter(
      // biome-ignore lint/suspicious/noAssignInExpressions: More concise.
      (segmentContent = determineSegmentcontent(
        (event.target as HTMLInputElement).value,
        this.separator,
        (event.target as HTMLInputElement).selectionStart || 0,
      )),
    );

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
      (event.target as HTMLInputElement).value = (event.target as HTMLInputElement).value.replace(
        segmentContent,
        // biome-ignore lint/style/noNonNullAssertion: There is just one of the remainingOptions.
        remainingOptions[0]!,
      );

      for (const handler of this.onOptionChanged) {
        // biome-ignore lint/style/noNonNullAssertion: There is just one of the remainingOptions.
        handler(remainingOptions[0]!);
      }
    }

    const shadow = this.shadowRoot;

    if (shadow) {
      shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.classList.remove("-Current");

      shadow
        .querySelector(`.---WaXCode.--SVManager.--Option[ data-cb-option = "${remainingOptions[0]}"]`)
        ?.classList.add("-Current");
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
    const hits = new Array<string>();
    let firstVisible: HTMLDivElement | undefined;
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    for (const option of this.shadowRoot!.querySelectorAll(".---WaXCode.--SVManager.--Option")) {
      // biome-ignore lint/style/noNonNullAssertion: The data-cb-option attribute is definitely present.
      if (option.getAttribute("data-cb-option")!.indexOf(filter.toLowerCase()) === -1) {
        (option as HTMLDivElement).style.display = "none";
      } else {
        if (firstVisible === undefined) {
          firstVisible = option as HTMLDivElement;
        }
        // biome-ignore lint/style/noNonNullAssertion: The data-cb-option attribute is definitely present.
        hits.push(option.getAttribute("data-cb-option")!);
        (option as HTMLDivElement).style.display = "flex";
      }

      (option.querySelector('[ part = "Optioninput"]') as HTMLInputElement).checked =
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        this.target?.value.toLowerCase().indexOf(option.getAttribute("data-cb-option")!) !== -1;
    }

    firstVisible?.click();

    return hits;
  }
  // #endregion Filtering
}
// #region Tools
/**
 * Determines the segment-content within a separated values {@link string } out of the specified **position**.
 *
 * @param separatedValues The {@link string } containing the separated values.
 * @param delimiter       The {@link string } delimiting each segment.
 * @param position        The current position within the segment.
 *
 * @returns The segment-content where the **position** is pointing at. */
export function determineSegmentcontent(separatedValues: string, delimiter: string, position: number = 0): string {
  const caretPos: number = position;

  if (separatedValues.length === 0 || caretPos < 0 || caretPos > separatedValues.length) {
    return "";
  }

  const lastCommaBeforeCaret: number = separatedValues.lastIndexOf(delimiter, caretPos - 1);
  const firstCommaAfterCaret: number = separatedValues.indexOf(delimiter, caretPos);

  if (lastCommaBeforeCaret === -1 && firstCommaAfterCaret !== -1) {
    // biome-ignore lint/style/noNonNullAssertion: There is at least one string.
    return separatedValues.split(delimiter)[0]!.trim();
  }

  if (lastCommaBeforeCaret !== -1 && firstCommaAfterCaret === -1) {
    return separatedValues.substring(lastCommaBeforeCaret + 1).trim();
  }

  if (lastCommaBeforeCaret === -1 || firstCommaAfterCaret === -1 || lastCommaBeforeCaret >= firstCommaAfterCaret) {
    return separatedValues.trim();
  }

  return separatedValues.substring(lastCommaBeforeCaret + 1, firstCommaAfterCaret).trim();
}
// #endregion Tools
