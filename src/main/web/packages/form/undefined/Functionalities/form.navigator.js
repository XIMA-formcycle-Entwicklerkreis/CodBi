import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import "./chunk-LFRFVRJV.js";
import { require_dist } from "./chunk-ZTMSSRTV.js";
import { __decorateClass, __decorateParam, __toESM } from "./chunk-AOJQKO6T.js";

// src/js/Functionalities/form.navigator.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var Form_Navigator = class {
  /**
   * The tagged {@link HTMLDivElement } will get navigation buttons that can be used to navigate the form.
   * Multiple {@link HTMLDivElement } can implement the navigator (e.g. header & footer) with it's
   * {@link HTMLButtonElement}s being synchronized when clicking one of the implemented navigators.
   *
   * ### CSS Selectors:
   *
   * | Selector | Element Type | Description |
   * | --- | --- | --- |
   * | `.---CodBi.--Form_Navigator.-Container.-NavButton` | Any `HTMLButtonElement` | Targets **any** navigational button within the form navigator. |
   * | `.---CodBi.--Form_Navigator.-Container.-NavButton:first-child` | The first `HTMLButtonElement` | Targets the **first** button in the sequence. |
   * | `.---CodBi.--Form_Navigator.-Container.-NavButton:last-child` | The last `HTMLButtonElement` | Targets the **last** button in the sequence. |
   * | `.---CodBi.--Form_Navigator.-Container.-NavButton.-current` | `HTMLButtonElement` | The button corresponding to the **currently active page** or step. |
   * | `.---CodBi.--Form_Navigator.-Container.-NavButton.-blocked` | `HTMLButtonElement` | Targets buttons blocked for any reason. |
   *
   * Config Parameter:
   *  - **Preview**:              Defines whether the navigator permits switching to every page even it wasn't visited before (**TRUE**)
   *                              or not (**FALSE**). Defaults to: **FALSE**.
   *  - **cssNavButtons**:        A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s.
   *  - **cssHoverNavButtons**:   A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s when hovering them.
   *  - **cssBlockedNavButtons**: A {@link string } containing additional CSS to be applied to the navigator's {@link HTMLButtonElement}s that are blocked for any reason.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  static functionality(toLoad, toProcess) {
    const $ = (0, import_fc_form_renderer.getJQuery)();
    const pages = $(".XPage").toArray();
    const pageNames = pages.map((page) => page.getAttribute("data-name"));
    const navBarWidth = Math.floor(
      (pageNames.reduce((accumulator, current) => accumulator + current.length, 0) *
        Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)) /
        1.2,
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
      childList: true,
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
    toLoad.preview = toLoad.preview
      ? typeof toLoad.preview === "boolean"
        ? toLoad.preview
        : toLoad.preview.toLowerCase() === "true"
      : false;
    for (const name of pageNames) {
      content += `
        <button ${!toLoad.preview ? 'style = "pointer-events : none ;"' : ""}
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
      if (data.item[0]?.hasAttribute("data-name")) {
        validations.set(data.item[0].getAttribute("data-name"), data.valid);
      }
    });
    const formerGotoPage = window.gotoPage;
    window.gotoPage = (pageName, validate, updateNavbar) => {
      for (const item of document.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton.-current")) {
        item.classList.remove("-current");
      }
      for (const navButton of document.querySelectorAll(
        `.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${currentPage}"]`,
      )) {
        if (navButton) {
          INSTANCE.tsCheck(navButton, HTMLElement).classList.add("-current");
          navButton.style.pointerEvents = "all";
        }
      }
      formerGotoPage(pageName, validate);
    };
    for (const button of toProcess.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton")) {
      button.addEventListener("click", (event) => {
        if (!INSTANCE.tsCheck(event.target, HTMLElement).hasAttribute("page")) {
          return;
        }
        const targetPage = TYPE.tsCheck(INSTANCE.tsCheck(event.target, HTMLElement).getAttribute("page"), "string");
        if (
          pageNames.filter(
            (candidate) =>
              pageNames.indexOf(candidate) < pageNames.indexOf(targetPage) && validations.get(candidate) === false,
          ).length === 0
        ) {
          const goForward = pageNames.indexOf(currentPage) < pageNames.indexOf(targetPage);
          if (toLoad.preview) {
            gotoPage(currentPage, true);
            gotoPage(targetPage, goForward);
          } else {
            gotoPage(currentPage, false);
            gotoPage(targetPage, false);
          }
          if (toLoad.preview && goForward && !validations.get(currentPage)) {
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
};
__decorateClass(
  [
    __decorateParam(0, TYPE.PRE("string", "cssnavbuttons :: csshovernavbuttons :: cssblockednavbuttons")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "preview")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new TYPE("boolean"), "preview", true)),
    __decorateParam(
      1,
      INSTANCE.PRE(HTMLDivElement, void 0, "Is it not a <div> that is tagged with this functionality?"),
    ),
  ],
  Form_Navigator,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Form.Navigator", Form_Navigator.functionality.bind(Form_Navigator));
export { Form_Navigator };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9mb3JtLm5hdmlnYXRvci50cyJdLAogICJzb3VyY2VzQ29udGVudCI6IFsiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSwgZ2V0WFV0aWwgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIFhEQkNcbmltcG9ydCB7IElGIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9JRlwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBSRUdFWCB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvUkVHRVhcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbi8vICNlbmRyZWdpb24gWERCQ1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIFJlZ2lzdGVycyB0aGUge0BsaW5rIEZvcm1fTmF2aWdhdG9yLmZ1bmN0aW9uYWxpdHkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogUHJvYWN0aXZlIERlc2lnbi5cbmV4cG9ydCBjbGFzcyBGb3JtX05hdmlnYXRvciB7XG4gIC8qKlxuICAgKiBUaGUgdGFnZ2VkIHtAbGluayBIVE1MRGl2RWxlbWVudCB9IHdpbGwgZ2V0IG5hdmlnYXRpb24gYnV0dG9ucyB0aGF0IGNhbiBiZSB1c2VkIHRvIG5hdmlnYXRlIHRoZSBmb3JtLlxuICAgKiBNdWx0aXBsZSB7QGxpbmsgSFRNTERpdkVsZW1lbnQgfSBjYW4gaW1wbGVtZW50IHRoZSBuYXZpZ2F0b3IgKGUuZy4gaGVhZGVyICYgZm9vdGVyKSB3aXRoIGl0J3NcbiAgICoge0BsaW5rIEhUTUxCdXR0b25FbGVtZW50fXMgYmVpbmcgc3luY2hyb25pemVkIHdoZW4gY2xpY2tpbmcgb25lIG9mIHRoZSBpbXBsZW1lbnRlZCBuYXZpZ2F0b3JzLlxuICAgKlxuICAgKiAjIyMgQ1NTIFNlbGVjdG9yczpcbiAgICpcbiAgICogfCBTZWxlY3RvciB8IEVsZW1lbnQgVHlwZSB8IERlc2NyaXB0aW9uIHxcbiAgICogfCAtLS0gfCAtLS0gfCAtLS0gfFxuICAgKiB8IGAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b25gIHwgQW55IGBIVE1MQnV0dG9uRWxlbWVudGAgfCBUYXJnZXRzICoqYW55KiogbmF2aWdhdGlvbmFsIGJ1dHRvbiB3aXRoaW4gdGhlIGZvcm0gbmF2aWdhdG9yLiB8XG4gICAqIHwgYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbjpmaXJzdC1jaGlsZGAgfCBUaGUgZmlyc3QgYEhUTUxCdXR0b25FbGVtZW50YCB8IFRhcmdldHMgdGhlICoqZmlyc3QqKiBidXR0b24gaW4gdGhlIHNlcXVlbmNlLiB8XG4gICAqIHwgYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbjpsYXN0LWNoaWxkYCB8IFRoZSBsYXN0IGBIVE1MQnV0dG9uRWxlbWVudGAgfCBUYXJnZXRzIHRoZSAqKmxhc3QqKiBidXR0b24gaW4gdGhlIHNlcXVlbmNlLiB8XG4gICAqIHwgYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudGAgfCBgSFRNTEJ1dHRvbkVsZW1lbnRgIHwgVGhlIGJ1dHRvbiBjb3JyZXNwb25kaW5nIHRvIHRoZSAqKmN1cnJlbnRseSBhY3RpdmUgcGFnZSoqIG9yIHN0ZXAuIHxcbiAgICogfCBgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uLi1ibG9ja2VkYCB8IGBIVE1MQnV0dG9uRWxlbWVudGAgfCBUYXJnZXRzIGJ1dHRvbnMgYmxvY2tlZCBmb3IgYW55IHJlYXNvbi4gfFxuICAgKlxuICAgKiBDb25maWcgUGFyYW1ldGVyOlxuICAgKiAgLSAqKlByZXZpZXcqKjogICAgICAgICAgICAgIERlZmluZXMgd2hldGhlciB0aGUgbmF2aWdhdG9yIHBlcm1pdHMgc3dpdGNoaW5nIHRvIGV2ZXJ5IHBhZ2UgZXZlbiBpdCB3YXNuJ3QgdmlzaXRlZCBiZWZvcmUgKCoqVFJVRSoqKVxuICAgKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9yIG5vdCAoKipGQUxTRSoqKS4gRGVmYXVsdHMgdG86ICoqRkFMU0UqKi5cbiAgICogIC0gKipjc3NOYXZCdXR0b25zKio6ICAgICAgICBBIHtAbGluayBzdHJpbmcgfSBjb250YWluaW5nIGFkZGl0aW9uYWwgQ1NTIHRvIGJlIGFwcGxpZWQgdG8gdGhlIG5hdmlnYXRvcidzIHtAbGluayBIVE1MQnV0dG9uRWxlbWVudH1zLlxuICAgKiAgLSAqKmNzc0hvdmVyTmF2QnV0dG9ucyoqOiAgIEEge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBDU1MgdG8gYmUgYXBwbGllZCB0byB0aGUgbmF2aWdhdG9yJ3Mge0BsaW5rIEhUTUxCdXR0b25FbGVtZW50fXMgd2hlbiBob3ZlcmluZyB0aGVtLlxuICAgKiAgLSAqKmNzc0Jsb2NrZWROYXZCdXR0b25zKio6IEEge0BsaW5rIHN0cmluZyB9IGNvbnRhaW5pbmcgYWRkaXRpb25hbCBDU1MgdG8gYmUgYXBwbGllZCB0byB0aGUgbmF2aWdhdG9yJ3Mge0BsaW5rIEhUTUxCdXR0b25FbGVtZW50fXMgdGhhdCBhcmUgYmxvY2tlZCBmb3IgYW55IHJlYXNvbi5cbiAgICpcbiAgICogQHBhcmFtIHRvTG9hZCAgICBQcm92aWRlZCBieSB0aGUgQ29kQmkuXG4gICAqIEBwYXJhbSB0b1Byb2Nlc3MgUHJvdmlkZWQgYnkgdGhlIENvZEJpLiAqL1xuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwiY3NzbmF2YnV0dG9ucyA6OiBjc3Nob3Zlcm5hdmJ1dHRvbnMgOjogY3NzYmxvY2tlZG5hdmJ1dHRvbnNcIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgUkVHRVgoUkVHRVguc3RkRXhwLmJvb2xlYW4pLCBcInByZXZpZXdcIilcbiAgICBASUYuUFJFKG5ldyBUWVBFKFwic3RyaW5nXCIpLCBuZXcgVFlQRShcImJvb2xlYW5cIiksIFwicHJldmlld1wiLCB0cnVlKVxuICAgIHRvTG9hZDogeyBba2V5OiBzdHJpbmddOiB1bmtub3duIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKEhUTUxEaXZFbGVtZW50LCB1bmRlZmluZWQsIFwiSXMgaXQgbm90IGEgPGRpdj4gdGhhdCBpcyB0YWdnZWQgd2l0aCB0aGlzIGZ1bmN0aW9uYWxpdHk/XCIpXG4gICAgdG9Qcm9jZXNzOiBFbGVtZW50LFxuICApOiB2b2lkIHtcbiAgICBjb25zdCAkID0gZ2V0SlF1ZXJ5KCk7XG4gICAgY29uc3QgcGFnZXM6IEFycmF5PEVsZW1lbnQ+ID0gJChcIi5YUGFnZVwiKS50b0FycmF5KCk7XG4gICAgY29uc3QgcGFnZU5hbWVzOiBBcnJheTxzdHJpbmc+ID0gcGFnZXMubWFwKChwYWdlKSA9PiBwYWdlLmdldEF0dHJpYnV0ZShcImRhdGEtbmFtZVwiKSkgYXMgQXJyYXk8c3RyaW5nPjtcbiAgICBjb25zdCBuYXZCYXJXaWR0aCA9IE1hdGguZmxvb3IoXG4gICAgICAocGFnZU5hbWVzLnJlZHVjZSgoYWNjdW11bGF0b3IsIGN1cnJlbnQpID0+IGFjY3VtdWxhdG9yICsgY3VycmVudC5sZW5ndGgsIDApICpcbiAgICAgICAgTnVtYmVyLnBhcnNlRmxvYXQod2luZG93LmdldENvbXB1dGVkU3R5bGUoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50KS5mb250U2l6ZSkpIC9cbiAgICAgICAgMS4yLFxuICAgICk7XG4gICAgLy8gI3JlZ2lvbiBEZXRlcm1pbmUgTmF2YmFyLU1vZGUgb24gZXZlcnkgcm93IGFkZGl0aW9uLlxuICAgIGdldEpRdWVyeSgpKFwiRk9STS54bS1mb3JtXCIpLm9uKFwiYWRkUm93XCIsIChjKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVzaXplXCIpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIE5hdmJhci1Nb2RlIG9uIGV2ZXJ5IHJvdyBhZGRpdGlvbi5cbiAgICAvLyAjcmVnaW9uIFByb3Zva2UgYSByZXNpemUtZXZlbnQgd2hlbiBkb2N1bWVudCBoYXMgbG9hZGVkIGluIG9yZGVyIGZvciB0aGUgTmF2YmFyLVR5cGUgdG8gYmUgZGV0ZXJtaW5lZCBjb3JyZWN0bHkuXG4gICAgbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9uc0xpc3QsIG9ic2VydmVyKSA9PiB7XG4gICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgd2luZG93LmRpc3BhdGNoRXZlbnQobmV3IEV2ZW50KFwicmVzaXplXCIpKTtcbiAgICAgIH0pO1xuICAgIH0pLm9ic2VydmUoZG9jdW1lbnQuYm9keSwge1xuICAgICAgYXR0cmlidXRlczogdHJ1ZSxcbiAgICAgIGF0dHJpYnV0ZUZpbHRlcjogW1wic3R5bGVcIl0sXG4gICAgICBzdWJ0cmVlOiB0cnVlLFxuICAgICAgY2hpbGRMaXN0OiB0cnVlLFxuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gUHJvdm9rZSBhIHJlc2l6ZS1ldmVudCB3aGVuIGRvY3VtZW50IGhhcyBsb2FkZWQgaW4gb3JkZXIgZm9yIHRoZSBOYXZiYXItVHlwZSB0byBiZSBkZXRlcm1pbmVkIGNvcnJlY3RseS5cbiAgICAvLyAjcmVnaW9uIEhhbmRsZSBOYXZpZ2F0b3ItVHlwZSBvbiByZXNpemUuXG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJyZXNpemVcIiwgKCkgPT4ge1xuICAgICAgY29uc3QgY29udGFpbmVyV2lkdGggPSB0b1Byb2Nlc3MuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCkud2lkdGg7XG5cbiAgICAgIGlmIChuYXZCYXJXaWR0aCA+IGNvbnRhaW5lcldpZHRoKSB7XG4gICAgICAgIHRvUHJvY2Vzcy5jbGFzc0xpc3QuYWRkKFwiLUJ1cmdlck1vZGVcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0b1Byb2Nlc3MuY2xhc3NMaXN0LnJlbW92ZShcIi1CdXJnZXJNb2RlXCIpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIC8vICNlbmRyZWdpb24gSGFuZGxlIE5hdmlnYXRvci1UeXBlIG9uIHJlc2l6ZS5cbiAgICBsZXQgY3VycmVudFBhZ2U6IHN0cmluZyA9IHBhZ2VOYW1lc1swXTtcbiAgICBsZXQgY29udGVudDogc3RyaW5nID0gXCJcIjtcblxuICAgIHRvTG9hZC5wcmV2aWV3ID0gdG9Mb2FkLnByZXZpZXdcbiAgICAgID8gdHlwZW9mIHRvTG9hZC5wcmV2aWV3ID09PSBcImJvb2xlYW5cIlxuICAgICAgICA/ICh0b0xvYWQucHJldmlldyBhcyBib29sZWFuKVxuICAgICAgICA6ICh0b0xvYWQucHJldmlldyBhcyBzdHJpbmcpLnRvTG93ZXJDYXNlKCkgPT09IFwidHJ1ZVwiXG4gICAgICA6IGZhbHNlO1xuICAgIC8vICNyZWdpb24gSW5qZWN0IDxidXR0b24+cywgPHN0eWxlPnMgYW5kIGNvbnRhaW5pbmcgPGRpdj4uXG4gICAgZm9yIChjb25zdCBuYW1lIG9mIHBhZ2VOYW1lcykge1xuICAgICAgY29udGVudCArPSBgXG4gICAgICAgIDxidXR0b24gJHshdG9Mb2FkLnByZXZpZXcgPyAnc3R5bGUgPSBcInBvaW50ZXItZXZlbnRzIDogbm9uZSA7XCInIDogXCJcIn1cbiAgICAgICAgICAgICAgICBjbGFzcyA9IFwiLS0tQ29kQmkgLS1Gb3JtX05hdmlnYXRvciAtQ29udGFpbmVyIC1OYXZCdXR0b24gJHtuYW1lID09PSBjdXJyZW50UGFnZSA/IFwiLWN1cnJlbnRcIiA6IFwiYmxvY2tlZFwifVwiXG4gICAgICAgICAgICAgICAgcGFnZSAgPSBcIiR7bmFtZX1cIlxuICAgICAgICAgICAgICAgIHR5cGUgID0gXCJidXR0b25cIj4ke25hbWV9PC9idXR0b24+YDtcbiAgICB9XG5cbiAgICB0b1Byb2Nlc3MuaW5uZXJIVE1MID0gYFxuICAgICAgPHN0eWxlPlxuICAgICAgICAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24gICAgICAgICAgeyAke3RvTG9hZC5jc3NuYXZidXR0b25zID8gdG9Mb2FkLmNzc25hdmJ1dHRvbnMgOiBcInNjYWxlOiAxIDsgZm9udC13ZWlnaHQgOiBib2xkIDsgY3Vyc29yIDogcG9pbnRlciA7IG1hcmdpbi1sZWZ0IDogLjI1ZW0gOyBtYXJnaW4tcmlnaHQgOiAuMjVlbSA7IHBhZGRpbmcgOiAuNWVtIDsgYm94LXNoYWRvdyA6IDAgMCAuMjVlbSBibGFjayA7IGJhY2tncm91bmQgOiBsaW5lYXItZ3JhZGllbnQoIDEyMmRlZywgcmdiYSggMjU1LCAyNTUsIDI1NSwgMSApIDAlLCByZ2JhKCAyMzUsIDIzNSwgMjAwLCAxICkgMTAlLCByZ2JhKCAyMzUsIDIzNSwgMjMwLCAxICkgNjAlLCByZ2JhKCAyNTUsIDI1NSwgMjU1LCAxICkgMTAwJSApOyB0cmFuc2l0aW9uIDogLjVzIGFsbCA7XCJ9fVxuICAgICAgICAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b246aG92ZXIgICAgeyAke3RvTG9hZC5jc3Nob3Zlcm5hdmJ1dHRvbnMgPyB0b0xvYWQuY3NzaG92ZXJuYXZidXR0b25zIDogXCJzY2FsZSA6IDEuMSA7IGJveC1zaGFkb3cgOiAwIDAgNWVtIGRhcmtvcmFuZ2UgO1wifX1cbiAgICAgICAgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uLi1ibG9ja2VkIHsgJHt0b0xvYWQuY3NzQmxvY2tlZE5hdkJ1dHRvbnMgPyB0b0xvYWQuY3NzQmxvY2tlZE5hdkJ1dHRvbnMgOiBcIm9wYWNpdHkgOiAuNSA7IGN1cnNvciA6IG5vdC1hbGxvd2VkIDtcIn19XG5cblxuICAgICAgICAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24uLWN1cnJlbnQgICAgIHsgYm9yZGVyLXJhZGl1czogLjVlbSA7IHNjYWxlIDogMS4yIDsgYm9yZGVyLWNvbG9yOiBncmVlbiA7IGJveC1zaGFkb3cgOiAwIDAgLjI1ZW0gZ3JlZW4gOyBjdXJzb3IgOiBkZWZhdWx0IDt9XG4gICAgICAgIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbjpmaXJzdC1jaGlsZCAgeyBib3JkZXItdG9wLWxlZnQtcmFkaXVzIDogLjVlbSA7IGJvcmRlci1ib3R0b20tbGVmdC1yYWRpdXMgOiAuNWVtIDsgbWFyZ2luLXJpZ2h0IDogLjI1ZW0gO31cbiAgICAgICAgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uOmxhc3QtY2hpbGQgICB7IGJvcmRlci10b3AtcmlnaHQtcmFkaXVzIDogLjVlbSA7IGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzIDogLjVlbSA7IG1hcmdpbi1yaWdodCA6IC4yNWVtIDt9XG5cbiAgICAgICAgLi1CdXJnZXJNb2RlIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIgICAgICAgICAgICAgICAgICAgICAgICAgeyBib3JkZXItc3R5bGU6IG5vbmUgIWltcG9ydGFudCA7fVxuICAgICAgICAuLUJ1cmdlck1vZGUgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uICAgICAgICAgICAgICB7IGxpbmUtaGVpZ2h0OiAuNWVtIDsgcGFkZGluZzogLjVlbSA7IG1hcmdpbjogYXV0byA7IHdpZHRoOiAxMDAlIDt9XG4gICAgICAgIC4tQnVyZ2VyTW9kZSAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24gICAgICAgICAgICAgIHsgbWFyZ2luLXRvcDogMWVtIDsgbWFyZ2luLWJvdHRvbTogMWVtIDt9XG4gICAgICAgIC4tQnVyZ2VyTW9kZSAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b246Zmlyc3QtY2hpbGQgIHsgYm9yZGVyLWJvdHRvbS1sZWZ0LXJhZGl1czogMCA7IGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOiAwIDsgYm9yZGVyLXRvcC1sZWZ0LXJhZGl1czogLjVlbSAhaW1wb3J0YW50IDsgYm9yZGVyLXRvcC1yaWdodC1yYWRpdXM6IC41ZW0gIWltcG9ydGFudCA7IG1hcmdpbi1yaWdodCAuMjVlbSA7fVxuICAgICAgICAuLUJ1cmdlck1vZGUgLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uOmxhc3QtY2hpbGQgICB7IGJvcmRlci10b3AtbGVmdC1yYWRpdXM6IDAgOyBib3JkZXItdG9wLXJpZ2h0LXJhZGl1czogMCA7IGJvcmRlci1ib3R0b20tcmlnaHQtcmFkaXVzOiAuNWVtICFpbXBvcnRhbnQgOyBib3JkZXItYm90dG9tLWxlZnQtcmFkaXVzOiAuNWVtICFpbXBvcnRhbnQgO31cbiAgICAgICAgLi1CdXJnZXJNb2RlIC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudCAgICAgeyBib3JkZXItcmFkaXVzOiAuNWVtIDsgc2NhbGU6IDEuMiA7IGJvcmRlci1jb2xvcjogZ3JlZW4gOyBib3gtc2hhZG93IDogMCAwIC4yNWVtIGdyZWVuIDsgY3Vyc29yIDogZGVmYXVsdCA7fVxuXG4gICAgICAgIC4tQnVyZ2VyTW9kZSAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyIHsgbWFyZ2luOiBhdXRvIDsgd2lkdGg6IGZpdC1jb250ZW50IDsgZGlzcGxheTogdGFibGUgOyB0ZXh0LWFsaWduOiBjZW50ZXIgOyBib3JkZXItc3R5bGU6IHNvbGlkIDsgYm9yZGVyLXdpZHRoOiAuMDJlbSA7IGZpbHRlcjogZHJvcC1zaGFkb3coIDAgMCAuMmVtIGJsYWNrICk7IGhlaWdodDogMS41ZW0gO308L3N0eWxlPlxuICAgICAgPGRpdiBjbGFzcyA9IFwiLS0tQ29kQmkgLS1Gb3JtX05hdmlnYXRvciAtQ29udGFpbmVyXCI+JHtjb250ZW50fTwvZGl2PmA7XG4gICAgLy8gI2VuZHJlZ2lvbiBJbmplY3QgPGJ1dHRvbj5zLCA8c3R5bGU+cyBhbmQgY29udGFpbmluZyA8ZGl2Pi5cbiAgICAvLyAjcmVnaW9uIFNldHVwIHZhbGlkYXRpb24gY2hlY2sgdHJhY2tpbmcuXG4gICAgY29uc3QgdmFsaWRhdGlvbnM6IE1hcDxzdHJpbmcsIGJvb2xlYW4+ID0gbmV3IE1hcDxzdHJpbmcsIGJvb2xlYW4+KCk7XG5cbiAgICB4bV92YWxpZGF0b3Iub24oXCJwcm9ncmVzc1wiLCAoZGF0YSkgPT4ge1xuICAgICAgaWYgKGRhdGEuaXRlbVswXT8uaGFzQXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpKSB7XG4gICAgICAgIHZhbGlkYXRpb25zLnNldChkYXRhLml0ZW1bMF0uZ2V0QXR0cmlidXRlKFwiZGF0YS1uYW1lXCIpLCBkYXRhLnZhbGlkKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgICAvLyAjZW5kcmVnaW9uIFNldHVwIHZhbGlkYXRpb24gY2hlY2sgdHJhY2tpbmcuXG4gICAgLy8gI3JlZ2lvbiBJbnRlcmNlcHQgXCJ3aW5kb3cuZ290b1BhZ2VcInMuXG4gICAgY29uc3QgZm9ybWVyR290b1BhZ2UgPSB3aW5kb3cuZ290b1BhZ2U7XG5cbiAgICB3aW5kb3cuZ290b1BhZ2UgPSAocGFnZU5hbWU6IHN0cmluZywgdmFsaWRhdGU/OiBib29sZWFuLCB1cGRhdGVOYXZiYXI/OiBib29sZWFuKSA9PiB7XG4gICAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcIi4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvbi4tY3VycmVudFwiKSkge1xuICAgICAgICBpdGVtLmNsYXNzTGlzdC5yZW1vdmUoXCItY3VycmVudFwiKTtcbiAgICAgIH1cblxuICAgICAgZm9yIChjb25zdCBuYXZCdXR0b24gb2YgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbChcbiAgICAgICAgYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvblsgcGFnZSA9IFwiJHtjdXJyZW50UGFnZX1cIl1gLFxuICAgICAgKSkge1xuICAgICAgICBpZiAobmF2QnV0dG9uKSB7XG4gICAgICAgICAgSU5TVEFOQ0UudHNDaGVjazxIVE1MRWxlbWVudD4obmF2QnV0dG9uLCBIVE1MRWxlbWVudCkuY2xhc3NMaXN0LmFkZChcIi1jdXJyZW50XCIpO1xuXG4gICAgICAgICAgKG5hdkJ1dHRvbiBhcyBIVE1MRWxlbWVudCkuc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYWxsXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgZm9ybWVyR290b1BhZ2UocGFnZU5hbWUsIHZhbGlkYXRlKTtcbiAgICB9O1xuICAgIC8vICNlbmRyZWdpb24gSW50ZXJjZXB0IFwid2luZG93LmdvdG9QYWdlXCJzLlxuICAgIC8vIFNldHVwIHRoZSBOYXZpZ2F0b3IncyA8YnV0dG9uPnMgbG9naWMuXG4gICAgZm9yIChjb25zdCBidXR0b24gb2YgdG9Qcm9jZXNzLnF1ZXJ5U2VsZWN0b3JBbGwoXCIuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b25cIikpIHtcbiAgICAgIGJ1dHRvbi5hZGRFdmVudExpc3RlbmVyKFwiY2xpY2tcIiwgKGV2ZW50OiBFdmVudCkgPT4ge1xuICAgICAgICBpZiAoIUlOU1RBTkNFLnRzQ2hlY2s8SFRNTEVsZW1lbnQ+KGV2ZW50LnRhcmdldCwgSFRNTEVsZW1lbnQpLmhhc0F0dHJpYnV0ZShcInBhZ2VcIikpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBjb25zdCB0YXJnZXRQYWdlOiBzdHJpbmcgPSBUWVBFLnRzQ2hlY2s8c3RyaW5nPihcbiAgICAgICAgICBJTlNUQU5DRS50c0NoZWNrPEhUTUxFbGVtZW50PihldmVudC50YXJnZXQsIEhUTUxFbGVtZW50KS5nZXRBdHRyaWJ1dGUoXCJwYWdlXCIpLFxuICAgICAgICAgIFwic3RyaW5nXCIsXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKFxuICAgICAgICAgIHBhZ2VOYW1lcy5maWx0ZXIoXG4gICAgICAgICAgICAoY2FuZGlkYXRlKSA9PlxuICAgICAgICAgICAgICBwYWdlTmFtZXMuaW5kZXhPZihjYW5kaWRhdGUpIDwgcGFnZU5hbWVzLmluZGV4T2YodGFyZ2V0UGFnZSkgJiYgdmFsaWRhdGlvbnMuZ2V0KGNhbmRpZGF0ZSkgPT09IGZhbHNlLFxuICAgICAgICAgICkubGVuZ3RoID09PSAwXG4gICAgICAgICkge1xuICAgICAgICAgIGNvbnN0IGdvRm9yd2FyZDogYm9vbGVhbiA9IHBhZ2VOYW1lcy5pbmRleE9mKGN1cnJlbnRQYWdlKSA8IHBhZ2VOYW1lcy5pbmRleE9mKHRhcmdldFBhZ2UpO1xuXG4gICAgICAgICAgaWYgKHRvTG9hZC5wcmV2aWV3KSB7XG4gICAgICAgICAgICBnb3RvUGFnZShjdXJyZW50UGFnZSwgdHJ1ZSk7XG4gICAgICAgICAgICBnb3RvUGFnZSh0YXJnZXRQYWdlLCBnb0ZvcndhcmQpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBnb3RvUGFnZShjdXJyZW50UGFnZSwgZmFsc2UpO1xuICAgICAgICAgICAgZ290b1BhZ2UodGFyZ2V0UGFnZSwgZmFsc2UpO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjcmVnaW9uIFByZXZlbnQgbW92aW5nIGZvcndhcmQgdG8gYSBwYWdlIHRoYXQgd2Fzbid0IHZhbGlkYXRlZCB5ZXQuXG4gICAgICAgICAgaWYgKHRvTG9hZC5wcmV2aWV3ICYmIGdvRm9yd2FyZCAmJiAhdmFsaWRhdGlvbnMuZ2V0KGN1cnJlbnRQYWdlKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgIH1cbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIFByZXZlbnQgbW92aW5nIGZvcndhcmQgdG8gYSBwYWdlIHRoYXQgd2Fzbid0IHZhbGlkYXRlZCB5ZXQuXG4gICAgICAgICAgLy8gI3JlZ2lvbiBTd2l0Y2ggdGhlIGFjdGl2ZSBidXR0b25zIGNsYXNzZXMuXG4gICAgICAgICAgZm9yIChjb25zdCBjdXJyZW50QnV0dG9uIG9mICQoXCIuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b24uLWN1cnJlbnRcIikpIHtcbiAgICAgICAgICAgIGN1cnJlbnRCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcIi1jdXJyZW50XCIpO1xuXG4gICAgICAgICAgICBjdXJyZW50QnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcImFsbFwiO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGN1cnJlbnRQYWdlID0gdGFyZ2V0UGFnZTtcblxuICAgICAgICAgIGZvciAoY29uc3QgbmV3QnV0dG9uIG9mICQoYC4tLS1Db2RCaS4tLUZvcm1fTmF2aWdhdG9yLi1Db250YWluZXIuLU5hdkJ1dHRvblsgcGFnZSA9IFwiJHtjdXJyZW50UGFnZX1cIl1gKSkge1xuICAgICAgICAgICAgbmV3QnV0dG9uLnN0eWxlLnBvaW50ZXJFdmVudHMgPSBcIm5vbmVcIjtcblxuICAgICAgICAgICAgbmV3QnV0dG9uLmNsYXNzTGlzdC5hZGQoXCItY3VycmVudFwiKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gI2VuZHJlZ2lvbiBTd2l0Y2ggdGhlIGFjdGl2ZSBidXR0b25zIGNsYXNzZXMuXG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgICAvLyBTZXR1cCB0aGUgPGJ1dHRvbj5zIHRoYXQgbGVhZCB0byBhbm90aGVyIHBhZ2UuXG4gICAgZm9yIChjb25zdCBwYWdlQ2hhbmdlciBvZiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKFwiLlhCdXR0b25bZGF0YS10YXJnZXQtcGFnZV1cIikpIHtcbiAgICAgIGlmIChwYWdlQ2hhbmdlci5nZXRBdHRyaWJ1dGUoXCJkYXRhLWNoZWNrLXBhZ2VcIikgPT09IFwidHJ1ZVwiKSB7XG4gICAgICAgIHBhZ2VDaGFuZ2VyLmFkZEV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCAoZXZlbnQ6IEV2ZW50KSA9PiB7XG4gICAgICAgICAgaWYgKCF2YWxpZGF0aW9ucy5nZXQoY3VycmVudFBhZ2UpKSB7XG4gICAgICAgICAgICByZXR1cm47IC8vIERvIG5vdGhpbmcgaWYgdGhlIFwiY3VycmVudFBhZ2VcIiBoYXNuJ3QgYmVlbiB2YWxpZGF0ZWQuXG4gICAgICAgICAgfVxuICAgICAgICAgIC8vIEFjdGl2YXRlIHRoZSBuYXZpZ2F0aW9uIDxidXR0b24+IGxlYWRpbmcgdG8gdGhlIGZvcm1lciBwYWdlIGFuZCByZW1vdmUgdGhlIHRhZyBtYXJraW5nIGl0IGFzIHRoZSBjdXJyZW50IG9uZS5cbiAgICAgICAgICBmb3IgKGNvbnN0IGZvcm1lckJ1dHRvbiBvZiAkKFwiLi0tLUNvZEJpLi0tRm9ybV9OYXZpZ2F0b3IuLUNvbnRhaW5lci4tTmF2QnV0dG9uLi1jdXJyZW50XCIpKSB7XG4gICAgICAgICAgICBmb3JtZXJCdXR0b24uc3R5bGUucG9pbnRlckV2ZW50cyA9IFwiYWxsXCI7XG4gICAgICAgICAgICBmb3JtZXJCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcIi1jdXJyZW50XCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjdXJyZW50UGFnZSA9IChldmVudC50YXJnZXQgYXMgSFRNTEVsZW1lbnQpLmdldEF0dHJpYnV0ZShcImRhdGEtdGFyZ2V0LXBhZ2VcIikgYXMgc3RyaW5nO1xuICAgICAgICAgIC8vIERlQWN0aXZhdGUgdGhlIG5hdmlnYXRpb24gPGJ1dHRvbj4gbGVhZGluZyB0byB0aGUgbmV3IGN1cnJlbnQgcGFnZSBhbmQgdGFnIGl0IGFzIHRoZSBjdXJyZW50IG9uZS5cbiAgICAgICAgICBmb3IgKGNvbnN0IG5ld0J1dHRvbiBvZiAkKGAuLS0tQ29kQmkuLS1Gb3JtX05hdmlnYXRvci4tQ29udGFpbmVyLi1OYXZCdXR0b25bIHBhZ2UgPSBcIiR7Y3VycmVudFBhZ2V9XCJdYCkpIHtcbiAgICAgICAgICAgIG5ld0J1dHRvbi5jbGFzc0xpc3QuYWRkKFwiLWN1cnJlbnRcIik7XG4gICAgICAgICAgICBuZXdCdXR0b24uY2xhc3NMaXN0LnJlbW92ZShcIi1ibG9ja2VkXCIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbndpbmRvdy5jb2RiaS5yZWdpc3RlckZ1bmN0aW9uYWxpdHkoXCJGb3JtLk5hdmlnYXRvclwiLCBGb3JtX05hdmlnYXRvci5mdW5jdGlvbmFsaXR5LmJpbmQoRm9ybV9OYXZpZ2F0b3IpKTsgLy8gSW5pdGlhbGl6YXRpb25cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsOEJBQW9DO0FBZTdCLElBQU0saUJBQU4sTUFBcUI7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXlCMUIsT0FBYyxjQUlaLFFBR0EsV0FDTTtBQUNOLFVBQU0sUUFBSSxtQ0FBVTtBQUNwQixVQUFNLFFBQXdCLEVBQUUsUUFBUSxFQUFFLFFBQVE7QUFDbEQsVUFBTSxZQUEyQixNQUFNLElBQUksQ0FBQyxTQUFTLEtBQUssYUFBYSxXQUFXLENBQUM7QUFDbkYsVUFBTSxjQUFjLEtBQUs7QUFBQSxNQUN0QixVQUFVLE9BQU8sQ0FBQyxhQUFhLFlBQVksY0FB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
