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
  public set backgroundImage(toSet: HTMLElement) {
    toSet.style.position = "absolute";
    toSet.style.width = "80%";
    toSet.style.height = "100%";
    toSet.style.opacity = ".1";
    toSet.style.alignSelf = "anchor-center";
    toSet.style.justifySelf = "anchor-center";
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    this.shadowRoot!.prepend(toSet);
  }
  // #endregion Options
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
   * Sets the {@link SVManager._target } and updates the checkboxes according to the functionalities mentioned in
   * the {@link SVManager.target }.
   *
   * @param toSet The {@link SVManager._target }. */
  public set target(toSet: HTMLInputElement) {
    this._target = toSet;
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    for (const checkbox of this.shadowRoot!.querySelectorAll("input")) {
      checkbox.checked =
        this.target?.value
          .toLowerCase()
          // biome-ignore lint/style/noNonNullAssertion: Checkbox definitely has a parent and an Attribute "data-cb-option".
          .indexOf(checkbox.parentElement!.getAttribute("data-cb-option")?.toLowerCase()!) !== -1;
    }
  }
  // #endregion Targeting input-elements
  // #region Info
  /** Stores whether the cursor is currently within this {@link SVManager }.*/
  protected _cursorIn: boolean = false;
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
        div.---WaXCode.--SVManager.--Option           { display : flex ;}
        div.---WaXCode.--SVManager.--Option p         { background-color : transparent ; color : black ; text-shadow : 0 0 .25em white ;}
        div.---WaXCode.--SVManager.--Option.-Selected { background-color : blue ; color : white ;}`;

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
        <div  class           = "---WaXCode --SVManager --Option"
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
        this.variableStyle.innerHTML = `${this.cssFadeIN} div.---WaXCode.--SVManager { ${
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
  protected onCheckbox(event: Event): void {
    // biome-ignore lint/style/noNonNullAssertion: Checkbox surely has a parent element.
    const option = (event.target as HTMLElement).parentElement!.getAttribute("data-cb-option")!.toUpperCase();

    if ((event.target as HTMLInputElement).checked) {
      (this.target as HTMLInputElement).value += `,${option}`;
    } else {
      const targetValue = (this.target as HTMLInputElement).value;

      (this.target as HTMLInputElement).value = targetValue
        .toUpperCase()
        .replace(
          (targetValue.indexOf(`,${option}`) === -1 ? "" : ",") +
            option +
            (targetValue.indexOf(`,${option}`) === -1 ? "," : ""),
          "",
        );
    }
  }
  // #endregion Checkbox handling
}
