// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { OR } from "xdbc/src/DBC/OR";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { SVManager } from "./SVManager.js";
// #endregion Imports
/**
 * A {@link HTMLDivElement } that manages the **e**lement **p**laceholder within an {@link HTMLInputElement }
 * of type **text** backed by the {@link SVManager }'s functionality. */
export class EPManager extends SVManager {
  /** Holds the web-component definition of observed attributes. */
  static override get observedAttributes(): Array<string> {
    return [...SVManager.observedAttributes, "mode", "epoptions"];
  }
  /** Holds the {@link SVManager.options } when in "**SV**"-{@link mode }.*/
  protected _bufferOptions: Array<string> | undefined;
  /** Holds the {@link string }s that constitute the available **e**lement **p**laceholder. */
  protected _epOptions: Array<string> | undefined;
  /**
   * Gets the {@link EPManager._epOptions }.
   *
   * @returns The {@link EPManager._epOptions }. */
  public get epOptions(): Array<string> | undefined {
    return this._epOptions;
  }
  /**
   * Sets the {@link EPManager._epOptions }.
   *
   * @param toSet The {@link EPMan._epOptions }. */
  public set epOptions(toSet: Array<string>) {
    this._epOptions = toSet;
  }
  /** States the current mode this {@link EPManager } is in ("**SV**" is the original **s**eparated **v**alue manager
   * one while "**EP**" is the **e**lement **p**laceholder mode). */
  protected _mode: "SV" | "EP" = "SV";
  /** Store the position of the {@link SVManager.target }'s caret when the input of
   * an **e**lement **p**laceholder started. */
  protected currentStartCaret: number | undefined | null;
  /**
   * Gets the current {@link EPManager._mode }.
   *
   * @returns The current {@link EPManager._mode }. */
  public get mode(): "SV" | "EP" {
    return this._mode;
  }
  /**
   * Sets the current {@link EPManager.mode } switching the {@link SVManager.options } with the
   * {@link EPManager.epOptions} when set to "**EP**" and vice versa. */
  public set mode(toSet: "SV" | "EP") {
    if (this._mode === toSet) {
      return;
    }

    this._mode = toSet;

    if (this._mode === "SV" && this._bufferOptions !== undefined) {
      this.options = this._bufferOptions;

      this.render();

      for (const checkbox of DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelectorAll('[ part = "Optioninput"]')) {
        INSTANCE.tsCheck<HTMLElement>(checkbox, HTMLElement).style.display = "inline-block";
      }
    } else {
      if (this._epOptions !== undefined) {
        this.currentStartCaret = this.target?.selectionStart;

        this.options = this._epOptions;

        this.render();

        for (const checkbox of DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelectorAll(
          '[ part = "Optioninput"]',
        )) {
          const cb = INSTANCE.tsCheck<HTMLElement>(checkbox, HTMLElement);

          cb.style.display = "none";

          const text = INSTANCE.tsCheck<HTMLElement>(
            DEFINED.tsCheck<HTMLElement>(cb.parentElement).querySelector('[ part = "Optiontext"]'),
            HTMLElement,
          );

          text.style.marginLeft = "auto";
          text.style.marginRight = "auto";
        }
      }
    }
  }
  /**
   * Creates this {@link EPManager } by assigning the {@link SVManager.options } to the
   * {@link EPManager._bufferOptions } for later use. */
  constructor() {
    super();

    this._bufferOptions = this.options;
    // #region Provide Update via PluginData
    window.CodbiPluginData.updateEPManager = (options: string) => {
      this.epOptions = JSON.parse(options).map((e: string) => e.replace(".ts", ""));
      // #region Invalidate mode so that on setting to EP it will rerender.
      this.mode = "SV";
      this.mode = "EP";
      // #endregion Invalidate mode so that on setting to EP it will rerender.
      this.render();
    };
    // #endregion Provide Update via PluginData
  }
  /**
   * States whether this {@link EPManager } was successfully registered as a custom element and performs
   * the registration upon class usage.
   *
   * @throws See {@link window.customElements }'s **define** method. */
  public static override registered: boolean = (() => {
    customElements.define("xc-epmanager", EPManager, { extends: "div" });

    return true;
  })();
  /**
   * Processes changes in the {@link EPManager }'s system attributes.
   *
   * @param name      The changed attribute's name.
   * @param oldValue  The changed attribute's former value.
   * @param newValue  The changed attribute's current value. */
  @DBC.ParamvalueProvider
  override attributeChangedCallback(
    @OR.PRE([
      new EQ("options"),
      new EQ("separator"),
      new EQ("enabled"),
      new EQ("cssenabled"),
      new EQ("cssdisabled"),
      new EQ("epoptions"),
      new EQ("mode"),
    ])
    name: string,
    oldValue: string,
    newValue: string,
  ): void {
    if (name !== "epoptions" && name !== "mode") {
      super.attributeChangedCallback(name, oldValue, newValue);
    }

    switch (name) {
      case "epoptions":
        this.epOptions = newValue.split(this.separator);

        break;
      case "mode":
        this.mode = OR.tsCheck<"SV" | "EP">(newValue, [new EQ("SV"), new EQ("EP")]);

        break;
    }
  }
  // #region Filtering
  /** Stores the {@link string } the {@link SVManager.options } in **EP**-{@link EPManager.mode } shall be
   *  filtered by. */
  protected currentFilter = "";
  /** Stores the amount of digits and letters entered into the {@link SVManager.target } after
   *  **ALT**+**E** was pressed. */
  protected countStrokes = 0;
  /** States whether the {@link EPManager } is currently into the process of entering an **e**lement **p**laceholder. */
  public enteringEP = false;
  /**
   * When in **EP**-{@link EPManager.mode } this method filters the {@link SVManager.options } by {@link EPManager.currentFilter }.
   * Otherwise {@link SVManager.filter } is invoked.
   *
   * @param event The {@link Event } received. */
  protected override onInputTarget(event: Event): void {
    if (this.mode === "EP") {
      const remainingOptions = this.filter(this.currentFilter);

      const shadow = DEFINED.tsCheck<ShadowRoot>(this.shadowRoot);

      shadow.querySelector(".---WaXCode.--SVManager.--Option.-Current")?.classList.remove("-Current");
      DEFINED.tsCheck<HTMLElement>(
        INSTANCE.tsCheck<HTMLDivElement>(
          shadow.querySelector(`.---WaXCode.--SVManager.--Option[ data-cb-option = "${remainingOptions[0]}"]`),
          HTMLDivElement,
        ),
      ).classList.add("-Current");

      if (this.lastKey !== "Backspace" && this.lastKey !== "Delete" && remainingOptions.length === 1) {
        const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);
        const inputElement = INSTANCE.tsCheck<HTMLInputElement>(this.target, HTMLInputElement);

        let selectionStart = DEFINED.tsCheck<number>(eventTarget.selectionStart);

        const remainingOne = inputElement.value.substring(0, selectionStart - this.currentFilter.length);
        const remainingTwo = inputElement.value.substring(selectionStart);

        inputElement.value = remainingOne + remainingTwo;

        selectionStart = selectionStart - this.currentFilter.length;
        // #endregion Remove the characters that were typed during filtering.
        const selectedOption = DEFINED.tsCheck<string>(
          INSTANCE.tsCheck<HTMLElement>(
            DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current"),
            HTMLElement,
          ).dataset.cbOption,
        );

        eventTarget.value = `${eventTarget.value.substring(0, selectionStart - 1)}{ ${selectedOption} >  } ${eventTarget.value.substring(selectionStart)}`;

        eventTarget.setSelectionRange(
          selectionStart + selectedOption.length + 5,
          selectionStart + selectedOption.length + 5,
        );

        this.currentStartCaret = undefined;
        this.currentFilter = "";
        this.countStrokes = 0;
        this.enteringEP = false;
        this.enabled = false;

        for (const handler of this.onAutocomplete) {
          handler(remainingOptions[0]);
        }
      }
    } else {
      super.onInputTarget(event);
    }
  }
  /**
   * When in **EP**-{@link EPManager.mode } keeps track if the entered digits and letters to filter
   * the {@link SVManager.options } invoking {@link SVManager.onKeydownTarget } when appropriate or
   * not in **EP**-{@link EPManager.mode }.
   *
   * @param event The {@link KeyboardEvent }. */
  protected override onKeydownTarget(event: KeyboardEvent): void {
    if (this.mode === "EP") {
      const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(event.target, HTMLInputElement);

      let selectionStart = DEFINED.tsCheck<number>(eventTarget.selectionStart);

      if (event.key !== " " && event.key !== "Enter") {
        super.onKeydownTarget(event);
        // #region Keep track of digits and letter input
        if (this.enteringEP && /^[a-zA-Z0-9]$/.test(event.key)) {
          if (this.currentStartCaret === undefined) {
            this.currentStartCaret = eventTarget.selectionStart;
          }

          this.countStrokes++;
          this.currentFilter += event.key;
          this.enabled = true;
        }
        // #endregion Keep track of digits and letter input
      } else {
        // #region Inject selected option into the {@link SVManager.target } and close [enteringEP]-mode
        if (this.enteringEP) {
          // #region Remove the characters that were typed during filtering.
          const inputElement = INSTANCE.tsCheck<HTMLInputElement>(this.target, HTMLInputElement);

          const remainingOne = inputElement.value.substring(0, selectionStart - this.currentFilter.length);
          const remainingTwo = inputElement.value.substring(selectionStart);

          inputElement.value = remainingOne + remainingTwo;

          selectionStart = selectionStart - this.currentFilter.length;
          // #endregion Remove the characters that were typed during filtering.
          const selectedOption = DEFINED.tsCheck<string>(
            INSTANCE.tsCheck<HTMLElement>(
              DEFINED.tsCheck<ShadowRoot>(this.shadowRoot).querySelector(".---WaXCode.--SVManager.--Option.-Current"),
              HTMLElement,
            ).dataset.cbOption,
          );

          eventTarget.value = `${eventTarget.value.substring(0, selectionStart - 1)} { ${selectedOption} > } ${eventTarget.value.substring(selectionStart)}`;

          eventTarget.setSelectionRange(
            selectionStart + selectedOption.length + 5,
            selectionStart + selectedOption.length + 5,
          );

          this.currentStartCaret = undefined;
          this.currentFilter = "";
          this.countStrokes = 0;
          this.enteringEP = false;
          this.enabled = false;

          for (const handler of this.onOptionSelected) {
            handler(selectedOption ?? "");
          }
        }
        // #endregion Inject selected option into the {@link SVManager.target } and close [enteringEP]-mode
      }
      // #region Handle character deletion
      if (this.enteringEP && event.key === "Delete") {
        this.countStrokes--;
        const startCaret = DEFINED.tsCheck<number>(this.currentStartCaret);

        this.currentFilter =
          this.currentFilter.substring(0, selectionStart - startCaret) +
          this.currentFilter.substring(selectionStart - startCaret + 1);
      }

      if (this.enteringEP && event.key === "Backspace") {
        this.countStrokes--;
        this.currentFilter = this.currentFilter.substring(0, this.currentFilter.length - 1);
      }
      // #endregion Handle character deletion
    } else {
      super.onKeydownTarget(event);
    }
  }
  /**
   * Appropriately determines the {@link EPManager.currentFilter } when in **EP**-Mode.
   *
   * @param separatedValues The {@link string } containing the separated values.
   * @param delimiter       The {@link string } delimiting each segment.
   * @param position        The current position within the segment.
   *
   * @returns When in **EP**-mode this method returns the {@link EPManager.currentFilter }
   *          otherwise it the {@link SVManager.determineSegmentcontent }'s result. */
  protected override determineSegmentcontent(separatedValues: string, delimiter: string, position: number = 0): string {
    if (this.mode === "EP") {
      const eventTarget = INSTANCE.tsCheck<HTMLInputElement>(this.target, HTMLInputElement);

      if (this.currentStartCaret) {
        return eventTarget.value.substring(this.currentStartCaret, this.currentStartCaret + this.countStrokes);
      } else {
        return "";
      }
    } else {
      return super.determineSegmentcontent(separatedValues, delimiter, position);
    }
  }
  // #endregion Filtering
}
