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
  // #endregion Options
  /** Holds the CSS to apply to the {@link SVManager.cOptions } when this {@link SVManager } is
   * to be {@link SVManager.show }n. */
  protected cssEnabled: string;
  /** Holds the CSS to apply to the {@link SVManager.cOptions } when this {@link SVManager } is
   * shall {@link SVManager.hide }. */
  protected cssDisabled: string;
  /** States whether the {@link SVManager.cssEnabled } or {@link SVManager.cssDisabled } is being applied on this
   * {@link HTMLDivElement }. */
  protected enabled: boolean;
  /** Holds the stylesheet that varies depending on whether this {@link SVManager } is currently {@link enabled } or
   * when {@link SVManager.cssEnabled } or {@link SVManager.cssDisabled } change. */
  protected variableStyle: HTMLStyleElement;
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
   * Sets the {@link SVManager._target }.
   *
   * @param toSet The {@link SVManager._target }. */
  public set target(toSet: HTMLInputElement) {
    this._target = toSet;
  }
  // #endregion Targeting input-elements
  /**
   * Creates this {@link HTMLDivElement } by mapping it's properties to it's attributes and injecting a
   * needed stylesheet. */
  constructor() {
    super();
    // #region PRECONDITIONS
    new HasAttribute("options").check(this);
    // #endregion PRECONDITIONS
    // #region Property mapping
    // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
    this.separator = this.hasAttribute("separator") ? this.getAttribute("separator")! : ",";
    // biome-ignore lint/style/noNonNullAssertion: Passed precondition check.
    this.options = this.getAttribute("options")!.split(this.separator);
    // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
    this.cssEnabled = this.hasAttribute("cssEnabled") ? this.getAttribute("cssEnabled")! : "display : flex ;";
    // biome-ignore lint/style/noNonNullAssertion: Attribute definitely set.
    this.cssDisabled = this.hasAttribute("cssDisabled") ? this.getAttribute("cssDisabled")! : "display : none ;";
    this.enabled = this.hasAttribute("enabled") ? this.getAttribute("enabled")?.toLowerCase() === "true" : false;
    // #endregion Property mapping
    // #region DOM preparations
    this.classList.add("---WaXCode", "--SVManager");

    this.variableStyle = document.createElement("style");
    this.variableStyle.innerHTML = `div.---WaXCode.--SVManager { ${this.enabled ? this.cssEnabled : this.cssDisabled}}`;

    const style = document.createElement("style");
    style.innerHTML = `
        div.---WaXCode.--SVManager.--Option           { display : flex ;}
        div.---WaXCode.--SVManager.--Option p         { background-color : transparent ; color : black ;}
        div.---WaXCode.--SVManager.--Option.-Selected { background-color : blue ; color : white ;}`;

    this.attachShadow({ mode: "open" });
    // biome-ignore lint/style/noNonNullAssertion: Shadow DOM is active.
    this.shadowRoot!.appendChild(this.variableStyle);
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
        this.variableStyle.innerHTML = `div.---WaXCode.--SVManager { ${
          // biome-ignore lint/suspicious/noAssignInExpressions: More comprehensive.
          (this.enabled = newValue.toLowerCase() === "true") ? this.cssDisabled : this.cssEnabled
        }}`;

        break;

      case "cssenabled":
        this.cssEnabled = newValue;

        if (this.enabled) {
          this.variableStyle.innerHTML = `div.---WaXCode.--SVManager { ${this.cssEnabled}}`;
        }
        break;

      case "cssdisabled":
        this.cssDisabled = newValue;
        if (this.enabled) {
          this.variableStyle.innerHTML = `div.---WaXCode.--SVManager { ${this.cssEnabled}}`;
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
}
