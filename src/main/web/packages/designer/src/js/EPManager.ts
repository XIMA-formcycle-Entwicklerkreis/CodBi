import { SVManager } from "./SVManager.js";
/**
 * A {@link HTMLDivElement } that manages the **e**lement **p**laceholder within an {@link HTMLInputElement }
 * of type **text** backed by the {@link SVManager }'s functionality. */
export class EPManager extends SVManager {
  /**
   *
   */
  constructor() {
    super();

    console.log("epmanager");
  }
  /**
   * States whether this {@link EPManager } was successfully registered as a custom element and performs
   * the registration upon class usage.
   *
   * @throws See {@link window.customElements }'s **define** method. */
  public static override registered: boolean = (() => {
    customElements.define("ep-svmanager", EPManager, { extends: "div" });

    return true;
  })();
}
