// #region Imports
// #region XIMA
import { getJQuery, getXUtil } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #endregion Imports
/**
 * Registers the {@link Form_Navigator.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Form_Navigator {
  /**
   * The tagged {@link HTMLDivElement } will get navigation buttons that can be used to navigate the form.
   * Multiple {@link HTMLDivElement } can implement the navigator (e.g. header & footer) with it's
   * {@link HTMLButtonElement}s being synchronized when clicking the ones of one of the implemented navigators.
   *
   * CSS Selectors:
   * | Selector | Element Type | Description |
   * | :--- | :--- | :--- |
   * | .---CodBi.--Form_Navigator.-Container.-NavButton | Any `HTMLButtonElement` | Targets **any** navigational button within the form navigator. |
   * | .---CodBi.--Form_Navigator.-Container.-NavButton:first-child | The first `HTMLButtonElement` | Targets the **first** button in the sequence. |
   * | .---CodBi.--Form_Navigator.-Container.-NavButton:last-child | The last `HTMLButtonElement` | Targets the **last** button in the sequence. |
   * | .---CodBi.--Form_Navigator.-Container.-NavButton.-current | `HTMLButtonElement` | The button corresponding to the **currently active page** or step. |
   * | .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked | `HTMLButtonElement`
   *
   * Config Parameter:
   *  - Preview:              Defines whether the navigator permits switching to every page even it wasn't visited before (**TRUE**)
   *                          or not (**FALSE**).
   *  - cssNavButtons:        A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s.
   *  - cssHoverNavButtons:   A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s when hovering them.
   *  - cssBlockedNavButtons: A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s that are blocked for any reason.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    // #region Normalize Arrayed-Parameter.
    toLoad.ccsnavbuttons =
      toLoad.cssnavbuttons && Array.isArray(toLoad.cssnavbuttons) ? toLoad.cssnavbuttons[0] : toLoad.cssnavbuttons;
    toLoad.csshovernavbuttons =
      toLoad.csshovernavbuttons && Array.isArray(toLoad.csshovernavbuttons)
        ? toLoad.csshovernavbuttons[0]
        : toLoad.csshovernavbuttons;
    toLoad.cssblockednavbuttons =
      toLoad.cssblockednavbuttons && Array.isArray(toLoad.cssblockednavbuttons)
        ? toLoad.cssblockednavbuttons[0]
        : toLoad.cssblockednavbuttons;
    // #endregion Normalize Arrayed-Parameter.
    const $ = getJQuery();
    const pages: Array<Element> = $(".XPage").toArray();
    const pageNames: Array<string> = pages.map((page) => page.getAttribute("data-name")) as Array<string>;
    const navBarWidth = Math.floor(
      (pageNames.reduce((accumulator, current) => accumulator + current.length, 0) *
        Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)) /
        1.2,
    );
    // #region Determine Navbar-Mode on every row addition.
    getJQuery()("FORM.xm-form").on("addRow", (c) => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });
    // #endregion Determine Navbar-Mode on every row addition.
    // #region Provoke a resize-event when document has loaded in order for the Navbar-Type to be determined correctly.
    new MutationObserver((mutationsList, observer) => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }).observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
      childList: true,
    });
    // #endregion Provoke a resize-event when document has loaded in order for the Navbar-Type to be determined correctly.
    // #region Handle Navigator-Type on resize.
    window.addEventListener("resize", () => {
      const containerWidth = toProcess.getBoundingClientRect().width;

      if (navBarWidth > containerWidth) {
        toProcess.classList.add("-BurgerMode");
      } else {
        toProcess.classList.remove("-BurgerMode");
      }
    });
    // #endregion Handle Navigator-Type on resize.
    let currentPage: string = pageNames[0];
    let content: string = "";
    // #region Inject <button>s, <style>s and containing <div>.
    for (const name of pageNames) {
      content += `
        <button ${(toLoad.preview && (toLoad.preview as string).trim().toLowerCase() !== "true") || toLoad.preview === undefined ? 'style = "pointer-events : none ;"' : ""}
                class = "---CodBi --Form_Navigator -Container -NavButton ${name === currentPage ? "-current" : "blocked"}"
                page  = "${name}"
                type  = "button">${name}</button>`;
    }

    toProcess.innerHTML = `
      <style>
        .---CodBi.--Form_Navigator.-Container.-NavButton          { ${toLoad.cssnavbuttons ? toLoad.cssnavbuttons : "scale: 1 ; font-weight : bold ; cursor : pointer ; margin-left : .25em ; margin-right : .25em ; padding : .5em ; box-shadow : 0 0 .25em black ; background : linear-gradient( 122deg, rgba( 255, 255, 255, 1 ) 0%, rgba( 235, 235, 200, 1 ) 10%, rgba( 235, 235, 230, 1 ) 60%, rgba( 255, 255, 255, 1 ) 100% ); transition : .5s all ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton:hover    { ${toLoad.csshovernavbuttons ? toLoad.csshovernavbuttons : "scale : 1.1 ; box-shadow : 0 0 5em darkorange ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked { ${toLoad.cssBlockedNavButtons ? toLoad.cssBlockedNavButtons : "opacity : .5 ; cursor : not-allowed ;"}}


        .---CodBi.--Form_Navigator.-Container.-NavButton.-current     { border-radius: .5em ; scale : 1.2 ; border-color: green ; box-shadow : 0 0 .25em green ; cursor : default ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton:first-child  { border-top-left-radius : .5em ; border-bottom-left-radius : .5em ; margin-right : .25em ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton:last-child   { border-top-right-radius : .5em ; border-bottom-right-radius : .5em ; margin-right : .25em ;}

        .-BurgerMode .---CodBi.--Form_Navigator.-Container                         { border-style: none !important ;}
        .-BurgerMode .---CodBi.--Form_Navigator.-Container.-NavButton              { line-height: .5em ; padding: .5em ; margin: auto ; width: 100% ;}
        .-BurgerMode .---CodBi.--Form_Navigator.-Container.-NavButton              { margin-top: 1em ; margin-bottom: 1em ;}
        .-BurgerMode .---CodBi.--Form_Navigator.-Container.-NavButton:first-child  { border-bottom-left-radius: 0 ; border-bottom-right-radius: 0 ; border-top-left-radius: .5em !important ; border-top-right-radius: .5em !important ; margin-right .25em ;}
        .-BurgerMode .---CodBi.--Form_Navigator.-Container.-NavButton:last-child   { border-top-left-radius: 0 ; border-top-right-radius: 0 ; border-bottom-right-radius: .5em !important ; border-bottom-left-radius: .5em !important ;}
        .-BurgerMode .---CodBi.--Form_Navigator.-Container.-NavButton.-current     { border-radius: .5em ; scale: 1.2 ; border-color: green ; box-shadow : 0 0 .25em green ; cursor : default ;}

        .-BurgerMode .---CodBi.--Form_Navigator.-Container { margin: auto ; width: fit-content ; display: table ; text-align: center ; border-style: solid ; border-width: .02em ; filter: drop-shadow( 0 0 .2em black ); height: 1.5em ;}</style>
      <div class = "---CodBi --Form_Navigator -Container">${content}</div>`;
    // #endregion Inject <button>s, <style>s and containing <div>.
    // #region Setup validation check tracking.
    const validations: Map<string, boolean> = new Map<string, boolean>();

    xm_validator.on("progress", (data) => {
      // biome-ignore lint/complexity/useOptionalChain: ???
      if (data.item[0] && data.item[0].hasAttribute("data-name")) {
        validations.set(data.item[0].getAttribute("data-name"), data.valid);
      }
    });
    // #endregion Setup validation check tracking.
    // #region Intercept "window.gotoPage"s.
    const formerGotoPage = window.gotoPage;

    window.gotoPage = (pageName: string, validate?: boolean, updateNavbar?: boolean) => {
      for (const item of document.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
        item.classList.remove("-current");
      }

      for (const navButton of document.querySelectorAll(
        `.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`,
      )) {
        if (navButton) {
          (navButton as HTMLElement).classList.add("-current");
          (navButton as HTMLElement).style.pointerEvents = "all";
        }
      }
      formerGotoPage(pageName, validate);
    };
    // #endregion Intercept "window.gotoPage"s.
    // Setup the Navigator's <button>s logic.
    for (const button of toProcess.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton")) {
      button.addEventListener("click", (event: Event) => {
        if (!(event.target as HTMLElement).hasAttribute("page")) {
          return;
        }
        // biome-ignore lint/style/noNonNullAssertion: When there is a click event there is also an event.target.
        const targetPage: string = (event.target! as HTMLElement).getAttribute("page")!;

        if (
          pageNames.filter(
            (candidate) =>
              pageNames.indexOf(candidate) < pageNames.indexOf(targetPage) && validations.get(candidate) === false,
          ).length === 0
        ) {
          const goForward: boolean = pageNames.indexOf(currentPage) < pageNames.indexOf(targetPage);

          if (
            (toLoad.preview && (toLoad.preview as string).trim().toLowerCase() !== "true") ||
            toLoad.preview === undefined
          ) {
            gotoPage(currentPage, true);
            gotoPage(targetPage, goForward);
          } else {
            gotoPage(currentPage, false);
            gotoPage(targetPage, false);
          }
          // #region Prevent moving forward to a page that wasn't validated yet.
          if (
            ((toLoad.preview && (toLoad.preview as string).trim().toLowerCase() !== "true") ||
              toLoad.preview === undefined) &&
            goForward &&
            !validations.get(currentPage)
          ) {
            return;
          }
          // #endregion Prevent moving forward to a page that wasn't validated yet.
          // #region Switch the active buttons classes.
          for (const currentButton of $(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
            currentButton.classList.remove("-current");

            currentButton.style.pointerEvents = "all";
          }

          currentPage = targetPage;

          for (const newButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`)) {
            newButton.style.pointerEvents = "none";

            newButton.classList.add("-current");
          }
          // #endregion Switch the active buttons classes.
        }
      });
    }
    // Setup the <button>s that lead to another page.
    for (const pageChanger of document.querySelectorAll(".XButton[data-target-page]")) {
      if (pageChanger.getAttribute("data-check-page") === "true") {
        pageChanger.addEventListener("click", (event: Event) => {
          if (!validations.get(currentPage)) {
            return; // Do nothing if the "currentPage" hasn't been validated.
          }
          // Activate the navigation <button> leading to the former page and remove the tag marking it as the current one.
          for (const formerButton of $(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
            formerButton.style.pointerEvents = "all";
            formerButton.classList.remove("-current");
          }
          currentPage = (event.target as HTMLElement).getAttribute("data-target-page") as string;
          // DeActivate the navigation <button> leading to the new current page and tag it as the current one.
          for (const newButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`)) {
            newButton.classList.add("-current");
            newButton.classList.remove("-blocked");
          }
        });
      }
    }
  }
  // #region Initialization
  /**
   * States whether this {@link Form_Navigator } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Form.Navigator", Form_Navigator.functionality);
  })();
  // #endregion Initialization
}
