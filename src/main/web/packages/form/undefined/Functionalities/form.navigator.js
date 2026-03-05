import { a as f } from "./chunk-M2SNI3IN.js";
import { a as E } from "./chunk-4JLAI42Q.js";
import { a as m } from "./chunk-KEJSWGMR.js";
import { a as b } from "./chunk-SEUS6MHP.js";
import { a as s } from "./chunk-CDLTIEKC.js";
import { f as N, g as C, h as l } from "./chunk-UTJJRBTX.js";
var p = N(E(), 1);
var c = class {
  static functionality(e, d) {
    let g = (0, p.getJQuery)(),
      i = g(".XPage")
        .toArray()
        .map((t) => t.getAttribute("data-name")),
      h = Math.floor(
        (i.reduce((t, r) => t + r.length, 0) *
          Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)) /
          1.2,
      );
    (0, p.getJQuery)()("FORM.xm-form").on("addRow", (t) => {
      setTimeout(() => {
        window.dispatchEvent(new Event("resize"));
      });
    }),
      new MutationObserver((t, r) => {
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        });
      }).observe(document.body, { attributes: !0, attributeFilter: ["style"], subtree: !0, childList: !0 }),
      window.addEventListener("resize", () => {
        let t = d.getBoundingClientRect().width;
        h > t ? d.classList.add("-BurgerMode") : d.classList.remove("-BurgerMode");
      });
    let n = i[0],
      B = "";
    e.preview = e.preview ? (typeof e.preview == "boolean" ? e.preview : e.preview.toLowerCase() === "true") : !1;
    for (let t of i)
      B += `
        <button ${e.preview ? "" : 'style = "pointer-events : none ;"'}
                class = "---CodBi --Form_Navigator -Container -NavButton ${t === n ? "-current" : "blocked"}"
                page  = "${t}"
                type  = "button">${t}</button>`;
    d.innerHTML = `
      <style>
        .---CodBi.--Form_Navigator.-Container.-NavButton          { ${e.cssnavbuttons ? e.cssnavbuttons : "scale: 1 ; font-weight : bold ; cursor : pointer ; margin-left : .25em ; margin-right : .25em ; padding : .5em ; box-shadow : 0 0 .25em black ; background : linear-gradient( 122deg, rgba( 255, 255, 255, 1 ) 0%, rgba( 235, 235, 200, 1 ) 10%, rgba( 235, 235, 230, 1 ) 60%, rgba( 255, 255, 255, 1 ) 100% ); transition : .5s all ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton:hover    { ${e.csshovernavbuttons ? e.csshovernavbuttons : "scale : 1.1 ; box-shadow : 0 0 5em darkorange ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked { ${e.cssBlockedNavButtons ? e.cssBlockedNavButtons : "opacity : .5 ; cursor : not-allowed ;"}}


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
      <div class = "---CodBi --Form_Navigator -Container">${B}</div>`;
    let v = new Map();
    xm_validator.on("progress", (t) => {
      var r;
      (r = t.item[0]) != null && r.hasAttribute("data-name") && v.set(t.item[0].getAttribute("data-name"), t.valid);
    });
    let w = window.gotoPage;
    window.gotoPage = (t, r, o) => {
      for (let a of document.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
        a.classList.remove("-current");
      for (let a of document.querySelectorAll(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${n}"]`))
        a && (m.tsCheck(a, HTMLElement).classList.add("-current"), (a.style.pointerEvents = "all"));
      w(t, r);
    };
    for (let t of d.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton"))
      t.addEventListener("click", (r) => {
        if (!m.tsCheck(r.target, HTMLElement).hasAttribute("page")) return;
        let o = s.tsCheck(m.tsCheck(r.target, HTMLElement).getAttribute("page"), "string");
        if (i.filter((a) => i.indexOf(a) < i.indexOf(o) && v.get(a) === !1).length === 0) {
          let a = i.indexOf(n) < i.indexOf(o);
          if (
            (e.preview ? (gotoPage(n, !0), gotoPage(o, a)) : (gotoPage(n, !1), gotoPage(o, !1)),
            e.preview && a && !v.get(n))
          )
            return;
          for (let u of g(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
            u.classList.remove("-current"), (u.style.pointerEvents = "all");
          n = o;
          for (let u of g(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${n}"]`))
            (u.style.pointerEvents = "none"), u.classList.add("-current");
        }
      });
    for (let t of document.querySelectorAll(".XButton[data-target-page]"))
      t.getAttribute("data-check-page") === "true" &&
        t.addEventListener("click", (r) => {
          if (v.get(n)) {
            for (let o of g(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
              (o.style.pointerEvents = "all"), o.classList.remove("-current");
            n = r.target.getAttribute("data-target-page");
            for (let o of g(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${n}"]`))
              o.classList.add("-current"), o.classList.remove("-blocked");
          }
        });
  }
};
C(
  [
    l(0, s.PRE("string", "cssnavbuttons :: csshovernavbuttons :: cssblockednavbuttons")),
    l(0, f.PRE(new s("string"), new b(b.stdExp.boolean), "preview")),
    l(0, f.PRE(new s("string"), new s("boolean"), "preview", !0)),
    l(1, m.PRE(HTMLDivElement, void 0, "Is it not a <div> that is tagged with this functionality?")),
  ],
  c,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Form.Navigator", c.functionality.bind(c));
export { c as Form_Navigator };
