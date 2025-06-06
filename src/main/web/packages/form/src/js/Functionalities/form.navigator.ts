import { getJQuery, getXUtil } from "@de-xima/fc-form-renderer";
/**
 * Registers the {@link Form_Navigator.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
export class Form_Navigator {
  /**
   * The tagged {@link HTMLDivElement } will get navigation buttons that can be used to navigate the form.
   * Multiple {@link HTMLDivElement } can implement the navigator (e.g. header & footer) with it's <button>s being synchronized when
   * clicking the ones of one of the implemented navigators.
   *
   * CSS Selectors:
   * .---CodBi.--Form_Navigator.-Container.-NavButton             Any navigational <button>.
   * .---CodBi.--Form_Navigator.-Container.-NavButton:first-child The first <button>.
   * .---CodBi.--Form_Navigator.-Container.-NavButton:last-child  The last <button>.
   * .---CodBi.--Form_Navigator.-Container.-NavButton.-current    The <button> showing corresponding to the current page.
   * .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked    The <button>s that do not correspond to the current page.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    const $ = getJQuery();
    const pages: Array<Element> = $(".XPage").toArray();
    const pageNames: Array<string> = pages.map((page) => page.getAttribute("data-name")) as Array<string>;
    // biome-ignore lint/style/noNonNullAssertion: At least one page is definitely existent.
    let currentPage: string = pageNames[0]!;
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
        .---CodBi.--Form_Navigator.-Container.-NavButton              { font-weight : bold ; cursor : pointer ; margin-left : .25em ; margin-right : .25em ; padding : .5em ; box-shadow : 0 0 .25em black ; background : linear-gradient( 122deg, rgba( 255, 255, 255, 1 ) 0%, rgba( 235, 235, 200, 1 ) 10%, rgba( 235, 235, 230, 1 ) 60%, rgba( 255, 255, 255, 1 ) 100% ); transition : .5s all ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton:hover        { scale : 1.1 ; box-shadow : 0 0 5em darkorange ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton:first-child  { border-top-left-radius : .5em ; border-bottom-left-radius : .5em ; margin-right : .25em ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton:last-child   { border-top-right-radius : .5em ; border-bottom-right-radius : .5em ; margin-right : .25em ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton.-current     { scale : 1.1 ; box-shadow : 0 0 .25em green ; cursor : default ;}
        .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked     { opacity : .5 ; cursor : default ;}</style>
      <div class = "---CodBi --Form_Navigator -Container">${content}</div>`;
    // #endregion Inject <button>s, <style>s and containing <div>.
    // #region Setup validation check tracking.
    const validations: Map<string, boolean> = new Map<string, boolean>();

    xm_validator.on("progress", (data) => {
      // biome-ignore lint/complexity/useOptionalChain: ???
      if (data.item[0] && data.item[0].hasAttribute("data-name")) {
        // biome-ignore lint/style/noNonNullAssertion: <explanation>
        validations.set(data.item[0].getAttribute("data-name")!, data.valid);
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
        // biome-ignore lint/style/noNonNullAssertion: When there is a click event there is also an event.target.
        if (!(event.target! as HTMLElement).hasAttribute("page")) {
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
          for (const currentButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`)) {
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
          for (const formerButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[page = "${currentPage}"]`)) {
            formerButton.style.pointerEvents = "all";
            formerButton.classList.remove("-current");
          }
          // biome-ignore lint/style/noNonNullAssertion: When there is a click event there is also an event.target.
          currentPage = (event.target! as HTMLElement).getAttribute("data-target-page") as string;
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
