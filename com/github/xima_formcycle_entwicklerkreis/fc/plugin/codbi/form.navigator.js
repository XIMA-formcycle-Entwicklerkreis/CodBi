import {
  require_dist
} from "./chunk-5LC5FOZV.js";
import {
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/form.navigator.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var Form_Navigator = class _Form_Navigator {
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
  static functionality(toLoad, toProcess) {
    toLoad.ccsnavbuttons = toLoad.cssnavbuttons && Array.isArray(toLoad.cssnavbuttons) ? toLoad.cssnavbuttons[0] : toLoad.cssnavbuttons;
    toLoad.csshovernavbuttons = toLoad.csshovernavbuttons && Array.isArray(toLoad.csshovernavbuttons) ? toLoad.csshovernavbuttons[0] : toLoad.csshovernavbuttons;
    toLoad.cssblockednavbuttons = toLoad.cssblockednavbuttons && Array.isArray(toLoad.cssblockednavbuttons) ? toLoad.cssblockednavbuttons[0] : toLoad.cssblockednavbuttons;
    const $ = (0, import_fc_form_renderer.getJQuery)();
    const pages = $(".XPage").toArray();
    const pageNames = pages.map((page) => page.getAttribute("data-name"));
    const navBarWidth = Math.floor(
      pageNames.reduce((accumulator, current) => accumulator + current.length, 0) * Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize) / 1.2
    );
    (0, import_fc_form_renderer.getJQuery)()("FORM.xm-form").on("addRow", (c) => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      });
    });
    new MutationObserver((mutationsList, observer) => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }).observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
      subtree: true,
      childList: true
    });
    window.addEventListener("resize", () => {
      const containerWidth = toProcess.getBoundingClientRect().width;
      if (navBarWidth > containerWidth) {
        toProcess.classList.add("-BurgerMode");
      } else {
        toProcess.classList.remove("-BurgerMode");
      }
    });
    let currentPage = pageNames[0];
    let content = "";
    for (const name of pageNames) {
      content += `
        <button ${toLoad.preview && toLoad.preview.trim().toLowerCase() !== "true" || toLoad.preview === void 0 ? 'style = "pointer-events : none ;"' : ""}
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
    const validations = /* @__PURE__ */ new Map();
    xm_validator.on("progress", (data) => {
      if (data.item[0] && data.item[0].hasAttribute("data-name")) {
        validations.set(data.item[0].getAttribute("data-name"), data.valid);
      }
    });
    const formerGotoPage = window.gotoPage;
    window.gotoPage = (pageName, validate, updateNavbar) => {
      for (const item of document.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
        item.classList.remove("-current");
      }
      for (const navButton of document.querySelectorAll(
        `.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`
      )) {
        if (navButton) {
          navButton.classList.add("-current");
          navButton.style.pointerEvents = "all";
        }
      }
      formerGotoPage(pageName, validate);
    };
    for (const button of toProcess.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton")) {
      button.addEventListener("click", (event) => {
        if (!event.target.hasAttribute("page")) {
          return;
        }
        const targetPage = event.target.getAttribute("page");
        if (pageNames.filter(
          (candidate) => pageNames.indexOf(candidate) < pageNames.indexOf(targetPage) && validations.get(candidate) === false
        ).length === 0) {
          const goForward = pageNames.indexOf(currentPage) < pageNames.indexOf(targetPage);
          if (toLoad.preview && toLoad.preview.trim().toLowerCase() !== "true" || toLoad.preview === void 0) {
            gotoPage(currentPage, true);
            gotoPage(targetPage, goForward);
          } else {
            gotoPage(currentPage, false);
            gotoPage(targetPage, false);
          }
          if ((toLoad.preview && toLoad.preview.trim().toLowerCase() !== "true" || toLoad.preview === void 0) && goForward && !validations.get(currentPage)) {
            return;
          }
          for (const currentButton of $(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
            currentButton.classList.remove("-current");
            currentButton.style.pointerEvents = "all";
          }
          currentPage = targetPage;
          for (const newButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`)) {
            newButton.style.pointerEvents = "none";
            newButton.classList.add("-current");
          }
        }
      });
    }
    for (const pageChanger of document.querySelectorAll(".XButton[data-target-page]")) {
      if (pageChanger.getAttribute("data-check-page") === "true") {
        pageChanger.addEventListener("click", (event) => {
          if (!validations.get(currentPage)) {
            return;
          }
          for (const formerButton of $(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
            formerButton.style.pointerEvents = "all";
            formerButton.classList.remove("-current");
          }
          currentPage = event.target.getAttribute("data-target-page");
          for (const newButton of $(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`)) {
            newButton.classList.add("-current");
            newButton.classList.remove("-blocked");
          }
        });
      }
    }
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link Form_Navigator } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("Form.Navigator", _Form_Navigator.functionality);
    })();
  }
  // #endregion Initialization
};
export {
  Form_Navigator
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9mb3JtLm5hdmlnYXRvci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSwgZ2V0WFV0aWwgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUmVnaXN0ZXJzIHRoZSB7QGxpbmsgRm9ybV9OYXZpZ2F0b3IuZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIEZvcm1fTmF2aWdhdG9yIHtcbiAgLyoqXG4gICAqIFRoZSB0YWdnZWQge0BsaW5rIEhUTUxEaXZFbGVtZW50IH0gd2lsbCBnZXQgbmF2aWdhdGlvbiBidXR0b25zIHRoYXQgY2FuIGJlIHVzZWQgdG8gbmF2aWdhdGUgdGhlIGZvcm0uXG4gICAqIE11bHRpcGxlIHtAbGluayBIVE1MRGl2RWxlbWVudCB9IGNhbiBpbXBsZW1lbnQgdGhlIG5hdmlnYXRvciAoZS5nLiBoZWFkZXIgJiBmb290ZXIpIHdpdGggaXQnc1xuICAgKiB7QGxpbmsgSFRNTEJ1dHRvbkVsZW1lbnR9cyBiZWluZyBzeW5jaHJvbml6ZWQgd2hlbiBjbGlja2luZyB0aGUgb25lcyBvZiBvbmUgb2YgdGhlIGltcGxlbWVudGVkIG5hdmlnYXRvcnMuXG4gICAqXG4gICAqIENTUyBTZWxlY3RvcnM6XG4gICAqIHwgU2VsZWN0b3IgfCBFbGVtZW50IFR5cGUgfCBEZXNjcmlwdGlvbiB8XG4gICAqIHwgOi0tLSB8IDotLS0gfCA6LS0tIHxcbiAgICogfCAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24gfCBBbnkgYEhUTUxCdXR0b25FbGVtZW50YCB8IFRhcmdldHMgKiphbnkqKiBuYXZpZ2F0aW9uYWwgYnV0dG9uIHdpdGhpbiB0aGUgZm9ybSBuYXZpZ2F0b3IuIHxcbiAgICogfCAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b246Zmlyc3QtY2hpbGQgfCBUaGUgZmlyc3QgYEhUTUxCdXR0b25FbGVtZW50YCB8IFRhcmdldHMgdGhlICoqZmlyc3QqKiBidXR0b24gaW4gdGhlIHNlcXVlbmNlLiB8XG4gICAqIHwgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uOmxhc3QtY2hpbGQgfCBUaGUgbGFzdCBgSFRNTEJ1dHRvbkVsZW1lbnRgIHwgVGFyZ2V0cyB0aGUgKipsYXN0KiogYnV0dG9uIGluIHRoZSBzZXF1ZW5jZS4gfFxuICAgKiB8IC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudCB8IGBIVE1MQnV0dG9uRWxlbWVudGAgfCBUaGUgYnV0dG9uIGNvcnJlc3BvbmRpbmcgdG8gdGhlICoqY3VycmVudGx5IGFjdGl2ZSBwYWdlKiogb3Igc3RlcC4gfFxuICAgKiB8IC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tYmxvY2tlZCB8IGBIVE1MQnV0dG9uRWxlbWVudGBcbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gUHJldmlldzogICAgICAgICAgICAgIERlZmluZXMgd2hldGhlciB0aGUgbmF2aWdhdG9yIHBlcm1pdHMgc3dpdGNoaW5nIHRvIGV2ZXJ5IHBhZ2UgZXZlbiBpdCB3YXNuJ3QgdmlzaXRlZCBiZWZvcmUgKCoqVFJVRSoqKVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgb3Igbm90ICgqKkZBTFNFKiopLlxuICAgKiAgLSBjc3NOYXZCdXR0b25zOiAgICAgICAgQSB7QGxpbmsgc3RyaW5nIH0gY29udGFpbmluZyBhZGRpdGlvbmFsIENTUyB0byBiZSBhcHBsaWVkIHRvIHRoZSBuYXZpZ2F0b3IncyB7QGxpbmsgSFRNTEJ1dHRvbkVsZW1lbnR9cy5cbiAgICogIC0gY3NzSG92ZXJOYXZCdXR0b25zOiAgIEEge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBDU1MgdG8gYmUgYXBwbGllZCB0byB0aGUgbmF2aWdhdG9yJ3Mge0BsaW5rIEhUTUxCdXR0b25FbGVtZW50fXMgd2hlbiBob3ZlcmluZyB0aGVtLlxuICAgKiAgLSBjc3NCbG9ja2VkTmF2QnV0dG9uczogQSB7QGxpbmsgc3RyaW5nIH0gY29udGFpbmluZyBhZGRpdGlvbmFsIENTUyB0byBiZSBhcHBsaWVkIHRvIHRoZSBuYXZpZ2F0b3IncyB7QGxpbmsgSFRNTEJ1dHRvbkVsZW1lbnR9cyB0aGF0IGFyZSBibG9ja2VkIGZvciBhbnkgcmVhc29uLlxuICAgKlxuICAgKiBAcGFyYW0gdG9Mb2FkICAgIFByb3ZpZGVkIGJ5IHRoZSBDb2RCaS5cbiAgICogQHBhcmFtIHRvUHJvY2VzcyBQcm92aWRlZCBieSB0aGUgQ29kQmkuICovXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eSh0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogdW5rbm93biB9LCB0b1Byb2Nlc3M6IEVsZW1lbnQpOiB2b2lkIHtcbiAgICAvLyAjcmVnaW9uIE5vcm1hbGl6ZSBBcnJheWVkLVBhcmFtZXRlci5cbiAgICB0b0xvYWQuY2NzbmF2YnV0dG9ucyA9XG4gICAgICB0b0xvYWQuY3NzbmF2YnV0dG9ucyAmJiBBcnJheS5pc0FycmF5KHRvTG9hZC5jc3NuYXZidXR0b25zKSA/IHRvTG9hZC5jc3NuYXZidXR0b25zWzBdIDogdG9Mb2FkLmNzc25hdmJ1dHRvbnM7XG4gICAgdG9Mb2FkLmNzc2hvdmVybmF2YnV0dG9ucyA9XG4gICAgICB0b0xvYWQuY3NzaG92ZXJuYXZidXR0b25zICYmIEFycmF5LmlzQXJyYXkodG9Mb2FkLmNzc2hvdmVybmF2YnV0dG9ucylcbiAgICAgICAgPyB0b0xvYWQuY3NzaG92ZXJuYXZidXR0b25zWzBdXG4gICAgICAgIDogdG9Mb2FkLmNzc2hvdmVybmF2YnV0dG9ucztcbiAgICB0b0xvYWQuY3NzYmxvY2tlZG5hdmJ1dHRvbnMgPVxuICAgICAgdG9Mb2FkLmNzc2Jsb2NrZWRuYXZidXR0b25zICYmIEFycmF5LmlzQXJyYXkodG9Mb2FkLmNzc2Jsb2NrZWRuYXZidXR0b25zKVxuICAgICAgICA/IHRvTG9hZC5jc3NibG9ja2VkbmF2YnV0dG9uc1swXVxuICAgICAgICA6IHRvTG9hZC5jc3NibG9ja2VkbmF2YnV0dG9ucztcbiAgICAvLyAjZW5kcmVnaW9uIE5vcm1hbGl6ZSBBcnJheWVkLVBhcmFtZXRlci5cbiAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgY29uc3QgcGFnZXM6IEFycmF5PEVsZW1lbnQ+ID0gJChcIi5YUGFnZVwiKS50b0FycmF5KCk7XG4gICAgY29uc3QgcGFnZU5hbWVzOiBBcnJheTxzdHJpbmc+ID0gcGFnZXMubWFwKChwYWdlKSA9PiBwYWdlLmdldEF0dHJpYnV0ZShcImRhdGEtbmFtZVwiKSkgYXMgQXJyYXk8c3RyaW5nPjtcbiAgICBjb25zdCBuYXZCYXJXaWR0aCA9IE1hdGguZmxvb3IoXG4gICAgICAocGFnZU5hbWVzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yICsgY3VycmVudC5sZW5ndGgsIDApICpcbiAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5mb250U2l6ZSkpIC9cbiAgICAgICAgMS4yLFxuICAgICk7XG4gICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgTmF2YmFyLU1vZGUgb24gZXZlcnkgcm93IGFkZGl0aW9uLlxuICAgIGdldEpRdWVyeSgpKFwiRk9STS54bS1mb3JtXCIpLm9uKFwiYWRkUm93XCIsIChjKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVzaXplXCIpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIE5hdmJhci1Nb2RlIG9uIGV2ZXJ5IHJvdyBhZGRpdGlvbi5cbiAgICAvLyAjcmVnaW9uIFByb3Zva2UgYSByZXNpemUtZXZlbnQgd2hlbiBkb2N1bWVudCBoYXMgbG9hZGVkIGluIG9yZGVyIGZvciB0aGUgTmF2YmFyLVR5cGUgdG8gYmUgZGV0ZXJtaW5lZCBjb3JyZWN0bHkuXG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uc0xpc3QsIG9ic2VydmVyKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVzaXplXCIpKTtcbiAgICAgIH0pO1xuICAgIH0pLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZUZpbHRlcjogW1wic3R5bGVcIl0sXG4gICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gUHJvdm9rZSBhIHJlc2l6ZS1ldmVudCB3aGVuIGRvY3VtZW50IGhhcyBsb2FkZWQgaW4gb3JkZXIgZm9yIHRoZSBOYXZiYXItVHlwZSB0byBiZSBkZXRlcm1pbmVkIGNvcnJlY3RseS5cbiAgICAvLyAjcmVnaW9uIEhhbmRsZSBOYXZpZ2F0b3ItVHlwZSBvbiByZXNpemUuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGFpbmVyV2lkdGggPSB0b1Byb2Nlc3MuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XG5cbiAgICAgIGlmIChuYXZCYXJXaWR0aCA+IGNvbnRhaW5lcldpZHRoKSB7XG4gICAgICAgIHRvUHJvY2Vzcy5jbGFzc0xpc3QuYWRkKFwiLUJ1cmdlck1vZGVcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b1Byb2Nlc3MuY2xhc3NMaXN0LnJlbW92ZShcIi1CdXJnZXJNb2RlXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gSGFuZGxlIE5hdmlnYXRvci1UeXBlIG9uIHJlc2l6ZS5cbiAgICBsZXQgY3VycmVudFBhZ2U6IHN0cmluZyA9IHBhZ2VOYW1lc1swXTtcbiAgICBsZXQgY29udGVudDogc3RyaW5nID0gXCJcIjtcbiAgICAvLyAjcmVnaW9uIEluamVjdCA8YnV0dG9uPnMsIDxzdHlsZT5zIGFuZCBjb250YWluaW5nIDxkaXY+LlxuICAgIGZvciAoY29uc3QgbmFtZSBvZiBwYWdlTmFtZXMpIHtcbiAgICAgIGNvbnRlbnQgKz0gYFxuICAgICAgICA8YnV0dG9uICR7KHRvTG9hZC5wcmV2aWV3ICYmICh0b0xvYWQucHJldmlldyBhcyBzdHJpbmcpLnRyaW0oKS50b0xvd2VyQ2FzZSgpICE9PSBcInRydWVcIikgfHwgdG9Mb2FkLnByZXZpZXcgPT09IHVuZGVmaW5lZCA/ICdzdHlsZSA9IFwicG9pbnRlci1ldmVudHMgOiBub25lIDtcIicgOiBcIlwifVxuICAgICAgICAgICAgICAgIGNsYXNzID0gXCItLS1Db2RCaSAtLUZvcm1fTmF2aWdhdG9yIC1Db250YWluZXIgLU5hdkJ1dHRvbiAke25hbWUgPT09IGN1cnJlbnRQYWdlID8gXCItY3VycmVudFwiIDogXCJibG9ja2VkXCJ9XCJcbiAgICAgICAgICAgICAgICBwYWdlICA9IFwiJHtuYW1lfVwiXG4gICAgICAgICAgICAgICAgdHlwZSAgPSBcImJ1dHRvblwiPiR7bmFtZX08L2J1dHRvbj5gO1xuICAgIH1cblxuICAgIHRvUHJvY2Vzcy5pbm5lckhUTUwgPSBgXG4gICAgICA8c3R5bGU+XG4gICAgICAgIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbiAgICAgICAgICB7ICR7dG9Mb2FkLmNzc25hdmJ1dHRvbnMgPyB0b0xvYWQuY3NzbmF2YnV0dG9ucyA6IFwic2NhbGU6IDEgOyBmb250LXdlaWdodCA6IGJvbGQgOyBjdXJzb3IgOiBwb2ludGVyIDsgbWFyZ2luLWxlZnQgOiAuMjVlbSA7IG1hcmdpbi1yaWdodCA6IC4yNWVtIDsgcGFkZGluZyA6IC41ZW0gOyBib3gtc2hhZG93IDogMCAwIC4yNWVtIGJsYWNrIDsgYmFja2dyb3VuZCA6IGxpbmVhci1ncmFkaWVudCggMTIyZGVnLCByZ2JhKCAyNTUsIDI1NSwgMjU1LCAxICkgMCUsIHJnYmEoIDIzNSwgMjM1LCAyMDAsIDEgKSAxMCUsIHJnYmEoIDIzNSwgMjM1LCAyMzAsIDEgKSA2MCUsIHJnYmEoIDI1NSwgMjU1LCAyNTUsIDEgKSAxMDAlICk7IHRyYW5zaXRpb24gOiAuNXMgYWxsIDtcIn19XG4gICAgICAgIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbjpob3ZlciAgICB7ICR7dG9Mb2FkLmNzc2hvdmVybmF2YnV0dG9ucyA/IHRvTG9hZC5jc3Nob3Zlcm5hdmJ1dHRvbnMgOiBcInNjYWxlIDogMS4xIDsgYm94LXNoYWRvdyA6IDAgMCA1ZW0gZGFya29yYW5nZSA7XCJ9fVxuICAgICAgICAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24uLWJsb2NrZWQgeyAke3RvTG9hZC5jc3NCbG9ja2VkTmF2QnV0dG9ucyA/IHRvTG9hZC5jc3NCbG9ja2VkTmF2QnV0dG9ucyA6IFwib3BhY2l0eSA6IC41IDsgY3Vyc29yIDogbm90LWFsbG93ZWQgO1wifX1cblxuXG4gICAgICAgIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudCAgICAgeyBib3JkZXItcmFkaXVzOiAuNWVtIDsgc2NhbGUgOiAxLjIgOyBib3JkZXItY29sb3I6IGdyZWVuIDsgYm94LXNoYWRvdyA6IDAgMCAuMjVlbSBncmVlbiA7IGN1cnNvciA6IGRlZmF1bHQgO31cbiAgICAgICAgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uOmZpcnN0LWNoaWxkICB7IGJvcmRlci10b3AtbGVmdC1yYWRpdXMgOiAuNWVtIDsgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1cyA6IC41ZW0gOyBtYXJnaW4tcmlnaHQgOiAuMjVlbSA7fVxuICAgICAgICAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b246bGFzdC1jaGlsZCAgIHsgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXMgOiAuNWVtIDsgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXMgOiAuNWVtIDsgbWFyZ2luLXJpZ2h0IDogLjI1ZW0gO31cblxuICAgICAgICAuLUJ1cmdlck1vZGUgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lciAgICAgICAgICAgICAgICAgICAgICAgICB7IGJvcmRlci1zdHlsZTogbm9uZSAhaW1wb3J0YW50IDt9XG4gICAgICAgIC4tQnVyZ2VyTW9kZSAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24gICAgICAgICAgICAgIHsgbGluZS1oZWlnaHQ6IC41ZW0gOyBwYWRkaW5nOiAuNWVtIDsgbWFyZ2luOiBhdXRvIDsgd2lkdGg6IDEwMCUgO31cbiAgICAgICAgLi1CdXJnZXJNb2RlIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbiAgICAgICAgICAgICAgeyBtYXJnaW4tdG9wOiAxZW0gOyBtYXJnaW4tYm90dG9tOiAxZW0gO31cbiAgICAgICAgLi1CdXJnZXJNb2RlIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbjpmaXJzdC1jaGlsZCAgeyBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiAwIDsgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IDAgOyBib3JkZXItdG9wLWxlZnQtcmFkaXVzOiAuNWVtICFpbXBvcnRhbnQgOyBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogLjVlbSAhaW1wb3J0YW50IDsgbWFyZ2luLXJpZ2h0IC4yNWVtIDt9XG4gICAgICAgIC4tQnVyZ2VyTW9kZSAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b246bGFzdC1jaGlsZCAgIHsgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogMCA7IGJvcmRlci10b3AtcmlnaHQtcmFkaXVzOiAwIDsgYm9yZGVyLWJvdHRvbS1yaWdodC1yYWRpdXM6IC41ZW0gIWltcG9ydGFudCA7IGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXM6IC41ZW0gIWltcG9ydGFudCA7fVxuICAgICAgICAuLUJ1cmdlck1vZGUgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uLi1jdXJyZW50ICAgICB7IGJvcmRlci1yYWRpdXM6IC41ZW0gOyBzY2FsZTogMS4yIDsgYm9yZGVyLWNvbG9yOiBncmVlbiA7IGJveC1zaGFkb3cgOiAwIDAgLjI1ZW0gZ3JlZW4gOyBjdXJzb3IgOiBkZWZhdWx0IDt9XG5cbiAgICAgICAgLi1CdXJnZXJNb2RlIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIgeyBtYXJnaW46IGF1dG8gOyB3aWR0aDogZml0LWNvbnRlbnQgOyBkaXNwbGF5OiB0YWJsZSA7IHRleHQtYWxpZ246IGNlbnRlciA7IGJvcmRlci1zdHlsZTogc29saWQgOyBib3JkZXItd2lkdGg6IC4wMmVtIDsgZmlsdGVyOiBkcm9wLXNoYWRvdyggMCAwIC4yZW0gYmxhY2sgKTsgaGVpZ2h0OiAxLjVlbSA7fTwvc3R5bGU+XG4gICAgICA8ZGl2IGNsYXNzID0gXCItLS1Db2RCaSAtLUZvcm1fTmF2aWdhdG9yIC1Db250YWluZXJcIj4ke2NvbnRlbnR9PC9kaXY+YDtcbiAgICAvLyAjZW5kcmVnaW9uIEluamVjdCA8YnV0dG9uPnMsIDxzdHlsZT5zIGFuZCBjb250YWluaW5nIDxkaXY+LlxuICAgIC8vICNyZWdpb24gU2V0dXAgdmFsaWRhdGlvbiBjaGVjayB0cmFja2luZy5cbiAgICBjb25zdCB2YWxpZGF0aW9uczogTWFwPHN0cmluZywgYm9vbGVhbj4gPSBuZXcgTWFwPHN0cmluZywgYm9vbGVhbj4oKTtcblxuICAgIHhtX3ZhbGlkYXRvci5vbihcInByb2dyZXNzXCIsIChkYXRhKSA9PiB7XG4gICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L3VzZU9wdGlvbmFsQ2hhaW46ID8/P1xuICAgICAgaWYgKGRhdGEuaXRlbVswXSAmJiBkYXRhLml0ZW1bMF0uaGFzQXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpKSB7XG4gICAgICAgIHZhbGlkYXRpb25zLnNldChkYXRhLml0ZW1bMF0uZ2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpLCBkYXRhLnZhbGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFNldHVwIHZhbGlkYXRpb24gY2hlY2sgdHJhY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBJbnRlcmNlcHQgXCJ3aW5kb3cuZ290b1BhZ2VcInMuXG4gICAgY29uc3QgZm9ybWVyR290b1BhZ2UgPSB3aW5kb3cuZ290b1BhZ2U7XG5cbiAgICB3aW5kb3cuZ290b1BhZ2UgPSAocGFnZU5hbWU6IHN0cmluZywgdmFsaWRhdGU/OiBib29sZWFuLCB1cGRhdGVOYXZiYXI/OiBib29sZWFuKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudFwiKSkge1xuICAgICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoXCItY3VycmVudFwiKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBuYXZCdXR0b24gb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvblsgcGFnZSA9IFwiJHtjdXJyZW50UGFnZX1cIl1gLFxuICAgICAgKSkge1xuICAgICAgICBpZiAobmF2QnV0dG9uKSB7XG4gICAgICAgICAgKG5hdkJ1dHRvbiBhcyBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LmFkZChcIi1jdXJyZW50XCIpO1xuICAgICAgICAgIChuYXZCdXR0b24gYXMgSFRNTEVsZW1lbnQpLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImFsbFwiO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBmb3JtZXJHb3RvUGFnZShwYWdlTmFtZSwgdmFsaWRhdGUpO1xuICAgIH07XG4gICAgLy8gI2VuZHJlZ2lvbiBJbnRlcmNlcHQgXCJ3aW5kb3cuZ290b1BhZ2VcInMuXG4gICAgLy8gU2V0dXAgdGhlIE5hdmlnYXRvcidzIDxidXR0b24+cyBsb2dpYy5cbiAgICBmb3IgKGNvbnN0IGJ1dHRvbiBvZiB0b1Byb2Nlc3MucXVlcnlTZWxlY3RvckFsbChcIi4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvblwiKSkge1xuICAgICAgYnV0dG9uLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgIGlmICghKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuaGFzQXR0cmlidXRlKFwicGFnZVwiKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvLyBiaW9tZS1pZ25vcmUgbGludC9zdHlsZS9ub05vbk51bGxBc3NlcnRpb246IFdoZW4gdGhlcmUgaXMgYSBjbGljayBldmVudCB0aGVyZSBpcyBhbHNvIGFuIGV2ZW50LnRhcmdldC5cbiAgICAgICAgY29uc3QgdGFyZ2V0UGFnZTogc3RyaW5nID0gKGV2ZW50LnRhcmdldCEgYXMgSFRNTEVsZW1lbnQpLmdldEF0dHJpYnV0ZShcInBhZ2VcIikhO1xuXG4gICAgICAgIGlmIChcbiAgICAgICAgICBwYWdlTmFtZXMuZmlsdGVyKFxuICAgICAgICAgICAgKGNhbmRpZGF0ZSkgPT5cbiAgICAgICAgICAgICAgcGFnZU5hbWVzLmluZGV4T2YoY2FuZGlkYXRlKSA8IHBhZ2VOYW1lcy5pbmRleE9mKHRhcmdldFBhZ2UpICYmIHZhbGlkYXRpb25zLmdldChjYW5kaWRhdGUpID09PSBmYWxzZSxcbiAgICAgICAgICApLmxlbmd0aCA9PT0gMFxuICAgICAgICApIHtcbiAgICAgICAgICBjb25zdCBnb0ZvcndhcmQ6IGJvb2xlYW4gPSBwYWdlTmFtZXMuaW5kZXhPZihjdXJyZW50UGFnZSkgPCBwYWdlTmFtZXMuaW5kZXhPZih0YXJnZXRQYWdlKTtcblxuICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICh0b0xvYWQucHJldmlldyAmJiAodG9Mb2FkLnByZXZpZXcgYXMgc3RyaW5nKS50cmltKCkudG9Mb3dlckNhc2UoKSAhPT0gXCJ0cnVlXCIpIHx8XG4gICAgICAgICAgICB0b0xvYWQucHJldmlldyA9PT0gdW5kZWZpbmVkXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICBnb3RvUGFnZShjdXJyZW50UGFnZSwgdHJ1ZSk7XG4gICAgICAgICAgICBnb3RvUGFnZSh0YXJnZXRQYWdlLCBnb0ZvcndhcmQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnb3RvUGFnZShjdXJyZW50UGFnZSwgZmFsc2UpO1xuICAgICAgICAgICAgZ290b1BhZ2UodGFyZ2V0UGFnZSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQgbW92aW5nIGZvcndhcmQgdG8gYSBwYWdlIHRoYXQgd2Fzbid0IHZhbGlkYXRlZCB5ZXQuXG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgKCh0b0xvYWQucHJldmlldyAmJiAodG9Mb2FkLnByZXZpZXcgYXMgc3RyaW5nKS50cmltKCkudG9Mb3dlckNhc2UoKSAhPT0gXCJ0cnVlXCIpIHx8XG4gICAgICAgICAgICAgIHRvTG9hZC5wcmV2aWV3ID09PSB1bmRlZmluZWQpICYmXG4gICAgICAgICAgICBnb0ZvcndhcmQgJiZcbiAgICAgICAgICAgICF2YWxpZGF0aW9ucy5nZXQoY3VycmVudFBhZ2UpXG4gICAgICAgICAgKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vICNlbmRyZWdpb24gUHJldmVudCBtb3ZpbmcgZm9yd2FyZCB0byBhIHBhZ2UgdGhhdCB3YXNuJ3QgdmFsaWRhdGVkIHlldC5cbiAgICAgICAgICAvLyAjcmVnaW9uIFN3aXRjaCB0aGUgYWN0aXZlIGJ1dHRvbnMgY2xhc3Nlcy5cbiAgICAgICAgICBmb3IgKGNvbnN0IGN1cnJlbnRCdXR0b24gb2YgJChcIi4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudFwiKSkge1xuICAgICAgICAgICAgY3VycmVudEJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiLWN1cnJlbnRcIik7XG5cbiAgICAgICAgICAgIGN1cnJlbnRCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYWxsXCI7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgY3VycmVudFBhZ2UgPSB0YXJnZXRQYWdlO1xuXG4gICAgICAgICAgZm9yIChjb25zdCBuZXdCdXR0b24gb2YgJChgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uWyBwYWdlID0gXCIke2N1cnJlbnRQYWdlfVwiXWApKSB7XG4gICAgICAgICAgICBuZXdCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9IFwibm9uZVwiO1xuXG4gICAgICAgICAgICBuZXdCdXR0b24uY2xhc3NMaXN0LmFkZChcIi1jdXJyZW50XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFN3aXRjaCB0aGUgYWN0aXZlIGJ1dHRvbnMgY2xhc3Nlcy5cbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICAgIC8vIFNldHVwIHRoZSA8YnV0dG9uPnMgdGhhdCBsZWFkIHRvIGFub3RoZXIgcGFnZS5cbiAgICBmb3IgKGNvbnN0IHBhZ2VDaGFuZ2VyIG9mIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoXCIuWEJ1dHRvbltkYXRhLXRhcmdldC1wYWdlXVwiKSkge1xuICAgICAgaWYgKHBhZ2VDaGFuZ2VyLmdldEF0dHJpYnV0ZShcImRhdGEtY2hlY2stcGFnZVwiKSA9PT0gXCJ0cnVlXCIpIHtcbiAgICAgICAgcGFnZUNoYW5nZXIuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIChldmVudDogRXZlbnQpID0+IHtcbiAgICAgICAgICBpZiAoIXZhbGlkYXRpb25zLmdldChjdXJyZW50UGFnZSkpIHtcbiAgICAgICAgICAgIHJldHVybjsgLy8gRG8gbm90aGluZyBpZiB0aGUgXCJjdXJyZW50UGFnZVwiIGhhc24ndCBiZWVuIHZhbGlkYXRlZC5cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gQWN0aXZhdGUgdGhlIG5hdmlnYXRpb24gPGJ1dHRvbj4gbGVhZGluZyB0byB0aGUgZm9ybWVyIHBhZ2UgYW5kIHJlbW92ZSB0aGUgdGFnIG1hcmtpbmcgaXQgYXMgdGhlIGN1cnJlbnQgb25lLlxuICAgICAgICAgIGZvciAoY29uc3QgZm9ybWVyQnV0dG9uIG9mICQoXCIuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24uLWN1cnJlbnRcIikpIHtcbiAgICAgICAgICAgIGZvcm1lckJ1dHRvbi5zdHlsZS5wb2ludGVyRXZlbnRzID0gXCJhbGxcIjtcbiAgICAgICAgICAgIGZvcm1lckJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiLWN1cnJlbnRcIik7XG4gICAgICAgICAgfVxuICAgICAgICAgIGN1cnJlbnRQYWdlID0gKGV2ZW50LnRhcmdldCBhcyBIVE1MRWxlbWVudCkuZ2V0QXR0cmlidXRlKFwiZGF0YS10YXJnZXQtcGFnZVwiKSBhcyBzdHJpbmc7XG4gICAgICAgICAgLy8gRGVBY3RpdmF0ZSB0aGUgbmF2aWdhdGlvbiA8YnV0dG9uPiBsZWFkaW5nIHRvIHRoZSBuZXcgY3VycmVudCBwYWdlIGFuZCB0YWcgaXQgYXMgdGhlIGN1cnJlbnQgb25lLlxuICAgICAgICAgIGZvciAoY29uc3QgbmV3QnV0dG9uIG9mICQoYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvblsgcGFnZSA9IFwiJHtjdXJyZW50UGFnZX1cIl1gKSkge1xuICAgICAgICAgICAgbmV3QnV0dG9uLmNsYXNzTGlzdC5hZGQoXCItY3VycmVudFwiKTtcbiAgICAgICAgICAgIG5ld0J1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwiLWJsb2NrZWRcIik7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgRm9ybV9OYXZpZ2F0b3IgfSB3YXMgc3VjY2Vzc2Z1bGx5IHJlZ2lzdGVyZWRcbiAgICogdmlhIHtAbGluayBDb2RiaUdsb2JhbC5yZWdpc3RlckZ1bmN0aW9uYWxpdHkgfSB3aXRoIHRoZSBDb2RCaSBhbmQgcGVyZm9ybXMgdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLiovXG4gIHB1YmxpYyBzdGF0aWMgcmVnaXN0ZXJlZDogYm9vbGVhbiA9ICgoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXCJGb3JtLk5hdmlnYXRvclwiLCBGb3JtX05hdmlnYXRvci5mdW5jdGlvbmFsaXR5KTtcbiAgfSkoKTtcbiAgLy8gI2VuZHJlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7QUFFQSw4QkFBb0M7QUFTN0IsSUFBTSxpQkFBTixNQUFNLGdCQUFlO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBd0IxQixPQUFjLGNBQWMsUUFBb0MsV0FBMEI7QUFFeEYsV0FBTyxnQkFDTCxPQUFPLGlCQUFpQixNQUFNLFFBQVEsT0FBTyxhQUFhLElBQUksT0FBTyxjQUFjLENBQUMsSUFBSSxPQUFPO0FBQ2pHLFdBQU8scUJBQ0wsT0FBTyxzQkFBc0IsTUFBTSxRQUFRLE9BQU8sa0JBQWtCLElBQ2hFLE9BQU8sbUJBQW1CLENBQUMsSUFDM0IsT0FBTztBQUNiLFdBQU8sdUJBQ0wsT0FBTyx3QkFBd0IsTUFBTSxRQUFRLE9BQU8sb0JBQW9CLElBQ3BFLE9BQU8scUJBQXFCLENBQUMsSUFDN0IsT0FBTztBQUViLFVBQU0sUUFBSSxtQ0FBVTtBQUNwQixVQUFNLFFBQXdCLEVBQUUsUUFBUSxFQUFFLFFBQVE7QUFDbEQsVUFBTSxZQUEyQixNQUFNLElBQUksQ0FBQyxTQUFTLEtBQUssYUFBYSxXQUFXLENBQUM7QUFDbkYsVUFBTSxjQUFjLEtBQUs7QUFBQSxNQUN0QixVQUFVLE9BQU8sQ0FBQyxhQUFhLFlBQVksY0FBYyxRQUFRLFFBQVEsQ0FBQyxJQUN6RSxPQUFPLFdBQVcsT0FBTyxpQkFBaUIsU0FBUyxlQUFlLEVBQUUsUUFBUSxJQUM1RTtBQUFBLElBQ0o7QUFFQSwyQ0FBVSxFQUFFLGNBQWMsRUFBRSxHQUFHLFVBQVUsQ0FBQyxNQUFNO0FBQzlDLGlCQUFXLE1BQU07QUFDZixlQUFPLGNBQWMsSUFBSSxNQUFNLFFBQVEsQ0FBQztBQUFBLE1BQzFDLENBQUM7QUFBQSxJQUNILENBQUM7QUFHRCxRQUFJLGlCQUFpQixDQUFDLGVBQWUsYUFBYTtBQUNoRCxpQkFBVyxNQUFNO0FBQ2YsZUFBTyxjQUFjLElBQUksTUFBTSxRQUFRLENBQUM7QUFBQSxNQUMxQyxDQUFDO0FBQUEsSUFDSCxDQUFDLEVBQUUsUUFBUSxTQUFTLE1BQU07QUFBQSxNQUN4QixZQUFZO0FBQUEsTUFDWixpQkFBaUIsQ0FBQyxPQUFPO0FBQUEsTUFDekIsU0FBUztBQUFBLE1BQ1QsV0FBVztBQUFBLElBQ2IsQ0FBQztBQUdELFdBQU8saUJBQWlCLFVBQVUsTUFBTTtBQUN0QyxZQUFNLGlCQUFpQixVQUFVLHNCQUFzQixFQUFFO0FBRXpELFVBQUksY0FBYyxnQkFBZ0I7QUFDaEMsa0JBQVUsVUFBVSxJQUFJLGFBQWE7QUFBQSxNQUN2QyxPQUFPO0FBQ0wsa0JBQVUsVUFBVSxPQUFPLGFBQWE7QUFBQSxNQUMxQztBQUFBLElBQ0YsQ0FBQztBQUVELFFBQUksY0FBc0IsVUFBVSxDQUFDO0FBQ3JDLFFBQUksVUFBa0I7QUFFdEIsZUFBVyxRQUFRLFdBQVc7QUFDNUIsaUJBQVc7QUFBQSxrQkFDRSxPQUFPLFdBQVksT0FBTyxRQUFtQixLQUFLLEVBQUUsWUFBWSxNQUFNLFVBQVcsT0FBTyxZQUFZLFNBQVksc0NBQXNDLEVBQUU7QUFBQSwyRUFDaEcsU0FBUyxjQUFjLGFBQWEsU0FBUztBQUFBLDJCQUM3RixJQUFJO0FBQUEsbUNBQ0ksSUFBSTtBQUFBLElBQ25DO0FBRUEsY0FBVSxZQUFZO0FBQUE7QUFBQSxzRUFFNEMsT0FBTyxnQkFBZ0IsT0FBTyxnQkFBZ0Isd1VBQXdVO0FBQUEsc0VBQ3RYLE9BQU8scUJBQXFCLE9BQU8scUJBQXFCLGlEQUFpRDtBQUFBLHNFQUN6RyxPQUFPLHVCQUF1QixPQUFPLHVCQUF1Qix1Q0FBdUM7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsNERBZTdHLE9BQU87QUFHL0QsVUFBTSxjQUFvQyxvQkFBSSxJQUFxQjtBQUVuRSxpQkFBYSxHQUFHLFlBQVksQ0FBQyxTQUFTO0FBRXBDLFVBQUksS0FBSyxLQUFLLENBQUMsS0FBSyxLQUFLLEtBQUssQ0FBQyxFQUFFLGFBQWEsV0FBVyxHQUFHO0FBQzFELG9CQUFZLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxhQUFhLFdBQVcsR0FBRyxLQUFLLEtBQUs7QUFBQSxNQUNwRTtBQUFBLElBQ0YsQ0FBQztBQUdELFVBQU0saUJBQWlCLE9BQU87QUFFOUIsV0FBTyxXQUFXLENBQUMsVUFBa0IsVUFBb0IsaUJBQTJCO0FBQ2xGLGlCQUFXLFFBQVEsU0FBUyxpQkFBaUIsMkRBQTJELEdBQUc7QUFDekcsYUFBSyxVQUFVLE9BQU8sVUFBVTtBQUFBLE1BQ2xDO0FBRUEsaUJBQVcsYUFBYSxTQUFTO0FBQUEsUUFDL0IsNkRBQTZELFdBQVc7QUFBQSxNQUMxRSxHQUFHO0FBQ0QsWUFBSSxXQUFXO0FBQ2IsVUFBQyxVQUEwQixVQUFVLElBQUksVUFBVTtBQUNuRCxVQUFDLFVBQTBCLE1BQU0sZ0JBQWdCO0FBQUEsUUFDbkQ7QUFBQSxNQUNGO0FBQ0EscUJBQWUsVUFBVSxRQUFRO0FBQUEsSUFDbkM7QUFHQSxlQUFXLFVBQVUsVUFBVSxpQkFBaUIsa0RBQWtELEdBQUc7QUFDbkcsYUFBTyxpQkFBaUIsU0FBUyxDQUFDLFVBQWlCO0FBQ2pELFlBQUksQ0FBRSxNQUFNLE9BQXVCLGFBQWEsTUFBTSxHQUFHO0FBQ3ZEO0FBQUEsUUFDRjtBQUVBLGNBQU0sYUFBc0IsTUFBTSxPQUF3QixhQUFhLE1BQU07QUFFN0UsWUFDRSxVQUFVO0FBQUEsVUFDUixDQUFDLGNBQ0MsVUFBVSxRQUFRLFNBQVMsSUFBSSxVQUFVLFFBQVEsVUFBVSxLQUFLLFlBQVksSUFBSSxTQUFTLE1BQU07QUFBQSxRQUNuRyxFQUFFLFdBQVcsR0FDYjtBQUNBLGdCQUFNLFlBQXFCLFVBQVUsUUFBUSxXQUFXLElBQUksVUFBVSxRQUFRLFVBQVU7QUFFeEYsY0FDRyxPQUFPLFdBQVksT0FBTyxRQUFtQixLQUFLLEVBQUUsWUFBWSxNQUFNLFVBQ3ZFLE9BQU8sWUFBWSxRQUNuQjtBQUNBLHFCQUFTLGFBQWEsSUFBSTtBQUMxQixxQkFBUyxZQUFZLFNBQVM7QUFBQSxVQUNoQyxPQUFPO0FBQ0wscUJBQVMsYUFBYSxLQUFLO0FBQzNCLHFCQUFTLFlBQVksS0FBSztBQUFBLFVBQzVCO0FBRUEsZUFDSSxPQUFPLFdBQVksT0FBTyxRQUFtQixLQUFLLEVBQUUsWUFBWSxNQUFNLFVBQ3RFLE9BQU8sWUFBWSxXQUNyQixhQUNBLENBQUMsWUFBWSxJQUFJLFdBQVcsR0FDNUI7QUFDQTtBQUFBLFVBQ0Y7QUFHQSxxQkFBVyxpQkFBaUIsRUFBRSwyREFBMkQsR0FBRztBQUMxRiwwQkFBYyxVQUFVLE9BQU8sVUFBVTtBQUV6QywwQkFBYyxNQUFNLGdCQUFnQjtBQUFBLFVBQ3RDO0FBRUEsd0JBQWM7QUFFZCxxQkFBVyxhQUFhLEVBQUUsNkRBQTZELFdBQVcsSUFBSSxHQUFHO0FBQ3ZHLHNCQUFVLE1BQU0sZ0JBQWdCO0FBRWhDLHNCQUFVLFVBQVUsSUFBSSxVQUFVO0FBQUEsVUFDcEM7QUFBQSxRQUVGO0FBQUEsTUFDRixDQUFDO0FBQUEsSUFDSDtBQUVBLGVBQVcsZUFBZSxTQUFTLGlCQUFpQiw0QkFBNEIsR0FBRztBQUNqRixVQUFJLFlBQVksYUFBYSxpQkFBaUIsTUFBTSxRQUFRO0FBQzFELG9CQUFZLGlCQUFpQixTQUFTLENBQUMsVUFBaUI7QUFDdEQsY0FBSSxDQUFDLFlBQVksSUFBSSxXQUFXLEdBQUc7QUFDakM7QUFBQSxVQUNGO0FBRUEscUJBQVcsZ0JBQWdCLEVBQUUsMkRBQTJELEdBQUc7QUFDekYseUJBQWEsTUFBTSxnQkFBZ0I7QUFDbkMseUJBQWEsVUFBVSxPQUFPLFVBQVU7QUFBQSxVQUMxQztBQUNBLHdCQUFlLE1BQU0sT0FBdUIsYUFBYSxrQkFBa0I7QUFFM0UscUJBQVcsYUFBYSxFQUFFLDZEQUE2RCxXQUFXLElBQUksR0FBRztBQUN2RyxzQkFBVSxVQUFVLElBQUksVUFBVTtBQUNsQyxzQkFBVSxVQUFVLE9BQU8sVUFBVTtBQUFBLFVBQ3ZDO0FBQUEsUUFDRixDQUFDO0FBQUEsTUFDSDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFLQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBYyxjQUF1QixNQUFNO0FBQ3pDLGFBQU8sT0FBTyxNQUFNLHNCQUFzQixrQkFBa0IsZ0JBQWUsYUFBYTtBQUFBLElBQzFGLEdBQUc7QUFBQTtBQUFBO0FBRUw7IiwKICAibmFtZXMiOiBbXQp9Cg==
