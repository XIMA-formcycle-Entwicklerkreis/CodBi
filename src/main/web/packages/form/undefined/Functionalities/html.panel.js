import { a as F } from "./chunk-HI24USOS.js";
import { a as V } from "./chunk-DCP5OS4S.js";
import "./chunk-7ZUEWSHL.js";
import { a as E } from "./chunk-PSEWTT4Z.js";
import { a as Q } from "./chunk-4JLAI42Q.js";
import { a as S } from "./chunk-KEJSWGMR.js";
import { a as k } from "./chunk-CDLTIEKC.js";
import { f as K, g as j, h as H, p as o } from "./chunk-UTJJRBTX.js";
var W = K(Q(), 1);
var v = class a extends o {
  static checkAlgorithm(e) {
    return e !== void 0 ? `Value must be UNDEFINED but it is ${typeof e}` : !0;
  }
  static PRE(e = void 0, n = void 0, t = void 0) {
    return o.decPrecondition((u, M, _, $) => a.checkAlgorithm(u), t, e, n);
  }
  static POST(e = void 0, n = void 0, t = void 0) {
    return o.decPostcondition((u, M, _) => a.checkAlgorithm(u), t, e, n);
  }
  static INVARIANT(e, n = void 0, t = void 0, u = void 0) {
    return o.decInvariant([new a()], n, u, t);
  }
  check(e) {
    return a.checkAlgorithm(e);
  }
  static tsCheck(e, n = void 0) {
    let t = a.checkAlgorithm(e);
    if (t === !0) return e;
    throw new o.Infringement(`${n ? `(${n}) ` : ""}${t}`);
  }
  constructor() {
    super();
  }
};
var i = class i {
  static determinePage(e) {
    let n = e;
    for (; n !== null; ) {
      if (n.classList.contains("CXPage")) return n;
      n = n.parentElement;
    }
    return n;
  }
  static unfoldPanelAncestors(e) {
    let n = e;
    for (; n !== null; ) n.CodBi_HTML_Panel_Folded && n.CodBi_HTML_Panel_Header.click(), (n = n.parentElement);
  }
  static functionality(e, n) {
    var u, M, _, $, I, q, L, P, D, x, N, R, X;
    if (XFC_METADATA.requestType === "print") return;
    let t;
    if (e.generateheader && n.children.length > 0 && e.generateheader.toLocaleLowerCase() === "true") {
      e.scroll === void 0
        ? (e.scroll = !1)
        : typeof e.scroll == "string" && (e.scroll = e.scroll.toLowerCase().trim() === "true"),
        e.scroll &&
          e.scrollblock &&
          typeof e.scrollblock == "string" &&
          (e.scrollblock = e.scrollblock.toLowerCase().trim()),
        e.scroll &&
          e.scrollblock !== "start" &&
          e.scrollblock !== "center" &&
          e.scrollblock !== "end" &&
          e.scrollblock !== "nearest" &&
          (e.scrollblock = "nearest");
      let h = document.createElement("div");
      h.classList.add("cHeader"), (t = document.createElement("div"));
      let f = n.querySelector("legend");
      e.autoheadertitlesuplementsspacer = e.autoheadertitlesuplementsspacer ? e.autoheadertitlesuplementsspacer : " / ";
      let s = e.autoheadertitlesuplementsspacer,
        d = n.querySelectorAll(".CodBi_HTML_Panel_AutoHeaderTitle_Supplement"),
        b = () => {
          for (let r = 0; r < d.length; r++) s += `${d[r].value === "" || r === 0 ? "" : ", "}${d[r].value}`;
        };
      for (let r = 0; r < d.length; r++)
        !U("XFieldSet", n, d[r]) &&
          !U("XContainer", n, d[r]) &&
          d[r].addEventListener("change", (A) => {
            (s = e.autoheadertitlesuplementsspacer),
              b(),
              (t.innerHTML = `${e.autoheaderlevel ? `<h${e.autoheaderlevel}>` : ""}${e.autoheadertitle ? e.autoheadertitle + (s.length !== e.autoheadertitlesuplementsspacer.length ? s : "") : n.tagName === "FIELDSET" ? f.innerHTML + (s.length === e.autoheadertitlesuplementsspacer.length ? "" : s) : ""}${e.autoheaderlevel ? `</h${e.autoheaderlevel}>` : ""}`);
          });
      b(),
        (t.innerHTML = `${e.autoheaderlevel ? `<h${e.autoheaderlevel}>` : ""}${e.autoheadertitle ? e.autoheadertitle + (s.length !== e.autoheadertitlesuplementsspacer.length ? s : "") : n.tagName === "FIELDSET" && f ? ((u = n.querySelector("legend")) == null ? void 0 : u.innerHTML) + (s.length === e.autoheadertitlesuplementsspacer.length ? "" : s) : ""}${e.autoheaderlevel ? `</h${e.autoheaderlevel}>` : ""}`),
        f && f.remove(),
        t.setAttribute("style", e.autoheadercss),
        t.classList.add("CodBi_HTML_Panel_Header"),
        h.appendChild(t),
        n.insertBefore(h, n.firstChild);
    } else t = n.querySelector(".CodBi_HTML_Panel_Header");
    if (t === null)
      throw new V(
        `Tagged <div> or <fieldset> "${n.getAttribute("data-name")}" contains no HTML-Element tagged with CSS-"CodBi_HTML_Panel_Header".`,
      );
    {
      (n.CodBi_HTML_Panel_Header = t), n.classList.add("--HTML_Panel");
      let h = t.getAttribute("style"),
        f = Array.from(n.children),
        s = f.indexOf(t.parentElement),
        d = s === f.length - 1 ? void 0 : f[s];
      d && i.mapHeaderAfterElements.set(n, d);
      let b = n.style.display;
      (n.CodBi_HTML_Panel_Folded = document.body.classList.contains("fc-print-mode")
        ? !1
        : e.folded !== void 0
          ? e.folded.toLowerCase().trim() === "true"
          : !1),
        n.CodBi_HTML_Panel_Folded
          ? ((n.style.display = "none"), t == null || t.remove(), (M = n.parentElement) == null || M.appendChild(t))
          : e.cssheaderunfolded && (t == null || t.setAttribute("style", e.cssheaderunfolded)),
        n.CodBi_HTML_Panel_Folded && n.classList.add("--folded");
      let r = (_ = t.parentElement) == null ? void 0 : _.getAttribute("id");
      r === null && (r = n.getAttribute("id"));
      let A = document.createElement("style");
      A.innerHTML = `
      @media( print ) { #${r}.CodBi.--HTML_Panel { display : ${b} !important ;}}

      .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: red !important ;}

      @media( prefers-color-scheme : dark ) {
        .CodBi_HTML_Panel_MissingRequiredField { border-left-style: solid !important ; border-right-style: solid !important ; padding: .5em ; box-shadow: 0 0 .25em darkorange ; border-color: darkorange !important ;}

        #${r} .CodBi_HTML_Panel_Header { ${e.dcssheaderunfolded ? e.dcssheaderunfolded : "background: linear-gradient(130deg, rgba(5, 5, 5, 1) 0%, rgba(56, 47, 47, 1) 23%, rgba(84, 62, 62, 1) 55%, rgba(56, 52, 52, 1) 89%, rgba(0, 0, 0, 1) 100%) !important ;"}}}

      .CodBi_HTML_Panel_Header > p { margin : 0 ;}

      #${r} .CodBi_HTML_Panel_Header:after,
      #${((I = ($ = n.parentElement) == null ? void 0 : $.parentElement)) == null ? void 0 : I.getAttribute("id")} .CodBi_HTML_Panel_Header:after {
        content : "${e.cssafterheadercontent ? e.cssafterheadercontent : ""}";

        ${e.cssafterheader ? e.cssafterheader : ""}
      }

      #${r} .CodBi_HTML_Panel_Header:before,
      #${((L = (q = n.parentElement) == null ? void 0 : q.parentElement)) == null ? void 0 : L.getAttribute("id")} .CodBi_HTML_Panel_Header:before {
        content : "${e.cssbeforeheadercontent ? e.cssbeforeheadercontent : ""}";

        ${e.cssbeforeheader ? e.cssbeforeheader : ""}
      }

      #${r} .CodBi_HTML_Panel_Header:hover,
      .XFieldSetWrapper:has( #${r}) .CodBi_HTML_Panel_Header:hover     { ${e.cssheaderhover ? e.cssheaderhover : "color: darkorange ;"}}
      #${r} .CodBi_HTML_Panel_Header:hover > *,
      .XFieldSetWrapper:has( #${r}) .CodBi_HTML_Panel_Header:hover > * { ${e.cssheaderhover ? "" : "margin-left: 5% ; transition: .5s all ;"}}
      #${r} .CodBi_HTML_Panel_Header:active,
      .XFieldSetWrapper:has( #${r}) .CodBi_HTML_Panel_Header:active    { ${e.cssheaderactive ? e.cssheaderactive : "scale : .9 ;"}}

      ${
        e.cssanimfadeinpanel
          ? `@keyframes CodBi_FadeIN_Panel_${r} {
          ${e.cssanimfadeinpanel}}`
          : ""
      }

      #${r} .CodBi.--HTML_Panel,
      #${r}.CodBi.--HTML_Panel    { animation : CodBi_FadeIN_Panel_${r} ${e.cssanimfadeinpanelduration ? e.cssanimfadeinpanelduration : "0s"} ${e.cssanimfadeinpaneleasing ? e.cssanimfadeinpaneleasing : "ease-in-out"} forwards ;}`;
      let w = document.createElement("style");
      w.innerHTML = `
        #${r} > style + .CodBi_HTML_Panel_Header::after,
        #${r} > * > style + .CodBi_HTML_Panel_Header::after {
          content : "${e.cssafterheadercontentunfolded ? e.cssafterheadercontentunfolded : e.cssafterheadercontent ? e.cssafterheadercontent : ""}";

          ${e.cssafterheaderunfolded ? e.cssafterheaderunfolded : e.cssafterheader ? e.cssafterheader : ""}}`;
      let B = document.createElement("style");
      (B.innerHTML = `
        #${r} > style + .CodBi_HTML_Panel_Header::before,
        #${r} > * > style + .CodBi_HTML_Panel_Header::before {
          content : "${e.cssbeforeheadercontentunfolded ? e.cssbeforeheadercontentunfolded : e.cssbeforeheadercontent ? e.cssbeforeheadercontent : ""}";

          ${e.cssbeforeheaderunfolded ? e.cssbeforeheaderunfolded : e.cssbeforeheader ? e.cssbeforeheader : ""}}`),
        (P = t.parentElement) == null || P.insertBefore(A, t),
        e.wrappercss &&
          (D = n.parentElement) != null &&
          D.classList.contains("XFieldSetWrapper") &&
          ((x = n.parentElement) == null || x.setAttribute("style", e.wrappercss)),
        t.addEventListener("click", (m) => {
          var c, p, T, l;
          if (n.CodBi_HTML_Panel_Folded) {
            if (
              ((n.CodBi_HTML_Panel_Folded = !n.CodBi_HTML_Panel_Folded),
              (n.style.display = b),
              t == null || t.remove(),
              e.cssheaderunfolded && t.setAttribute("style", e.cssheaderunfolded),
              d === void 0 ? n.appendChild(t) : n.insertBefore(t, d),
              (e.cssafterheadercontentunfolded || e.cssafterheaderunfolded) &&
                ((c = t.parentElement) == null || c.insertBefore(w, t),
                (p = t.parentElement) == null || p.insertBefore(B, t)),
              e.scroll && n.scrollIntoView({ behavior: "smooth", block: e.scrollblock, inline: "nearest" }),
              n.hasAttribute("data-cb-accordion"))
            ) {
              e.accordion = n.getAttribute("data-cb-accordion");
              for (let g of document.querySelectorAll(
                `.CodBi.--HTML_Panel[ data-cb-accordion = "${e.accordion}"]:not(.--folded)`,
              ))
                (T = g.querySelector(".CodBi_HTML_Panel_Header")) == null ||
                  T.dispatchEvent(new MouseEvent("click", { bubbles: !0 }));
            }
            n.classList.remove("--folded");
          } else
            (n.CodBi_HTML_Panel_Folded = !n.CodBi_HTML_Panel_Folded),
              (n.style.display = "none"),
              t.remove(),
              h && t.setAttribute("style", h),
              (l = n.parentElement) == null || l.appendChild(t),
              (e.cssafterheadercontentunfolded || e.cssafterheaderunfolded) && (w.remove(), B.remove()),
              n.classList.add("--folded");
        });
      let O = !1;
      for (let m of n.querySelectorAll('[ aria-required = "true"]')) O = !0;
      if (O) {
        let m = document.createElement("style");
        (m.innerHTML = `
          #${r} > .CodBi_HTML_Panel_Header:before,
          #${((R = (N = n.parentElement) == null ? void 0 : N.parentElement)) == null ? void 0 : R.getAttribute("id")} > * > .CodBi_HTML_Panel_Header:before {
            content : "${e.cssrequiredfieldscontent ? e.cssrequiredfieldscontent : "*"}";

          ${e.cssrequiredfields ? e.cssrequiredfields : "color : red ; position : relative ; top : .5em ;"}}`),
          (X = t.parentElement) == null || X.insertBefore(m, t);
      }
      (0, W.getXUtil)().on("submit", (m) => {
        var p, T;
        for (let l of document.querySelectorAll(".CodBi_HTML_Panel_MissingRequiredField"))
          l.classList.remove("CodBi_HTML_Panel_MissingRequiredField");
        let c = !1;
        for (let l of document.querySelectorAll('[ aria-required = "true"]'))
          if ((l.value === "" || l.value === void 0) && (i.unfoldPanelAncestors(l), !J(l))) {
            let g = !1;
            if (l.classList.contains("XSelect"))
              for (let y of l.querySelectorAll("input")) y.checked === !0 && (g = !0);
            if (!g) {
              let y = (p = i.determinePage(l)) == null ? void 0 : p.getAttribute("data-xn");
              return (
                y && (gotoPage(y), l.scrollIntoView({ behavior: "smooth", block: e.scrollblock })),
                l.focus(),
                l.classList.add("CodBi_HTML_Panel_MissingRequiredField"),
                { preventSubmission: !0 }
              );
            }
          }
        if (i.invalidElements.length === 0) return { preventSubmission: !1 };
        for (let l of i.invalidElements) {
          (c = !0), i.unfoldPanelAncestors(l);
          let g = (T = i.determinePage(l)) == null ? void 0 : T.getAttribute("data-xn");
          g && (gotoPage(g), l.scrollIntoView({ behavior: "smooth", block: e.scrollblock })), l.focus();
        }
        return { preventSubmission: c };
      }),
        i.validatorRegistered ||
          xm_validator.on("begin", (m) => {
            for (let c of m.items)
              !i.invalidElements.includes(c) && c.getAttribute("aria-invalid") === "true" && i.invalidElements.push(c),
                i.invalidElements.includes(c) &&
                  c.getAttribute("aria-invalid") === "false" &&
                  (i.invalidElements = i.invalidElements.filter((p) => p !== c));
          });
    }
  }
};
(i.mapHeaderAfterElements = new Map()),
  (i.invalidElements = new Array()),
  (i.validatorRegistered = !1),
  j(
    [
      o.ParamvalueProvider,
      H(0, k.PRE("string", "autoheadertitle :: autoheadertitlesupplementsspacer :: scrollblock")),
      H(0, k.PRE("string | boolean", "folded :: generateheader :: scroll")),
      H(0, k.PRE("string | number", "autoheaderlevel")),
      H(
        0,
        F.PRE(
          [new E("start"), new E("center"), new E("end"), new E("nearest"), new v()],
          "scrollblock",
          "Is data-cb-ScrollBlock something different than start, center, end or nearest?",
        ),
      ),
      H(
        1,
        F.PRE(
          [new S(HTMLDivElement), new S(HTMLFieldSetElement)],
          void 0,
          "Is it not a <div> that is tagged with this functionality?",
        ),
      ),
    ],
    i,
    "functionality",
    1,
  );
var C = i;
window.codbi.registerFunctionality("HTML.Panel", C.functionality.bind(C));
function U(a, e, n) {
  for (; n && n !== e; ) {
    if (
      n.getAttribute("class").indexOf(` ${a} `) !== -1 ||
      n.getAttribute("class").indexOf(` ${a}"`) !== -1 ||
      n.getAttribute("class").indexOf(`"${a} `) !== -1 ||
      n.getAttribute("class").indexOf(`"${a}"`) !== -1
    )
      return !0;
    n = n.parentElement;
  }
  return !1;
}
function J(a) {
  for (; a !== null; ) {
    if (a.style.display === "none") return !0;
    a = a.parentElement;
  }
  return !1;
}
export { C as HTML_Panel };
