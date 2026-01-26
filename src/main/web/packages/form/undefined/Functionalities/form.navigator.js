import { a as p } from "./chunk-W23DHSE2.js";
import { f } from "./chunk-RS4WWU7K.js";
var c = f(p(), 1),
  l = class l {
    static functionality(t, s) {
      (t.ccsnavbuttons = t.cssnavbuttons && Array.isArray(t.cssnavbuttons) ? t.cssnavbuttons[0] : t.cssnavbuttons),
        (t.csshovernavbuttons =
          t.csshovernavbuttons && Array.isArray(t.csshovernavbuttons) ? t.csshovernavbuttons[0] : t.csshovernavbuttons),
        (t.cssblockednavbuttons =
          t.cssblockednavbuttons && Array.isArray(t.cssblockednavbuttons)
            ? t.cssblockednavbuttons[0]
            : t.cssblockednavbuttons);
      let u = (0, c.getJQuery)(),
        i = u(".XPage")
          .toArray()
          .map((e) => e.getAttribute("data-name")),
        b = Math.floor(
          (i.reduce((e, a) => e + a.length, 0) *
            Number.parseFloat(window.getComputedStyle(document.documentElement).fontSize)) /
            1.2,
        );
      (0, c.getJQuery)()("FORM.xm-form").on("addRow", (e) => {
        setTimeout(() => {
          window.dispatchEvent(new Event("resize"));
        });
      }),
        new MutationObserver((e, a) => {
          setTimeout(() => {
            window.dispatchEvent(new Event("resize"));
          });
        }).observe(document.body, { attributes: !0, attributeFilter: ["style"], subtree: !0, childList: !0 }),
        window.addEventListener("resize", () => {
          let e = s.getBoundingClientRect().width;
          b > e ? s.classList.add("-BurgerMode") : s.classList.remove("-BurgerMode");
        });
      let o = i[0],
        m = "";
      for (let e of i)
        m += `
        <button ${(t.preview && t.preview.trim().toLowerCase() !== "true") || t.preview === void 0 ? 'style = "pointer-events : none ;"' : ""}
                class = "---CodBi --Form_Navigator -Container -NavButton ${e === o ? "-current" : "blocked"}"
                page  = "${e}"
                type  = "button">${e}</button>`;
      s.innerHTML = `
      <style>
        .---CodBi.--Form_Navigator.-Container.-NavButton          { ${t.cssnavbuttons ? t.cssnavbuttons : "scale: 1 ; font-weight : bold ; cursor : pointer ; margin-left : .25em ; margin-right : .25em ; padding : .5em ; box-shadow : 0 0 .25em black ; background : linear-gradient( 122deg, rgba( 255, 255, 255, 1 ) 0%, rgba( 235, 235, 200, 1 ) 10%, rgba( 235, 235, 230, 1 ) 60%, rgba( 255, 255, 255, 1 ) 100% ); transition : .5s all ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton:hover    { ${t.csshovernavbuttons ? t.csshovernavbuttons : "scale : 1.1 ; box-shadow : 0 0 5em darkorange ;"}}
        .---CodBi.--Form_Navigator.-Container.-NavButton.-blocked { ${t.cssBlockedNavButtons ? t.cssBlockedNavButtons : "opacity : .5 ; cursor : not-allowed ;"}}


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
      <div class = "---CodBi --Form_Navigator -Container">${m}</div>`;
      let d = new Map();
      xm_validator.on("progress", (e) => {
        e.item[0] && e.item[0].hasAttribute("data-name") && d.set(e.item[0].getAttribute("data-name"), e.valid);
      });
      let B = window.gotoPage;
      window.gotoPage = (e, a, r) => {
        for (let n of document.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
          n.classList.remove("-current");
        for (let n of document.querySelectorAll(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${o}"]`))
          n && (n.classList.add("-current"), (n.style.pointerEvents = "all"));
        B(e, a);
      };
      for (let e of s.querySelectorAll(".---CodBi.--Form_Navigator.-Container.-NavButton"))
        e.addEventListener("click", (a) => {
          if (!a.target.hasAttribute("page")) return;
          let r = a.target.getAttribute("page");
          if (i.filter((n) => i.indexOf(n) < i.indexOf(r) && d.get(n) === !1).length === 0) {
            let n = i.indexOf(o) < i.indexOf(r);
            if (
              ((t.preview && t.preview.trim().toLowerCase() !== "true") || t.preview === void 0
                ? (gotoPage(o, !0), gotoPage(r, n))
                : (gotoPage(o, !1), gotoPage(r, !1)),
              ((t.preview && t.preview.trim().toLowerCase() !== "true") || t.preview === void 0) && n && !d.get(o))
            )
              return;
            for (let g of u(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
              g.classList.remove("-current"), (g.style.pointerEvents = "all");
            o = r;
            for (let g of u(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${o}"]`))
              (g.style.pointerEvents = "none"), g.classList.add("-current");
          }
        });
      for (let e of document.querySelectorAll(".XButton[data-target-page]"))
        e.getAttribute("data-check-page") === "true" &&
          e.addEventListener("click", (a) => {
            if (d.get(o)) {
              for (let r of u(".---CodBi.--Form_Navigator.-Container.-NavButton.-current"))
                (r.style.pointerEvents = "all"), r.classList.remove("-current");
              o = a.target.getAttribute("data-target-page");
              for (let r of u(`.---CodBi.--Form_Navigator.-Container.-NavButton[ page = "${o}"]`))
                r.classList.add("-current"), r.classList.remove("-blocked");
            }
          });
    }
  };
l.registered = window.codbi.registerFunctionality("Form.Navigator", l.functionality);
var v = l;
export { v as Form_Navigator };
