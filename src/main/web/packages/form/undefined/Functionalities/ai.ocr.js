import { a as _ } from "./chunk-BGFHKOW7.js";
import { a as H } from "./chunk-SGIEOVFR.js";
import { a as B } from "./chunk-K6ISRTTP.js";
import { a as v } from "./chunk-K3A632J4.js";
import { a as N } from "./chunk-W23DHSE2.js";
import { a as M } from "./chunk-MUWAMKOD.js";
import { b as R, f as S, g as I, o as O } from "./chunk-RS4WWU7K.js";
var V = S(N(), 1);
var A = S(H(), 1);
var C = class C {
  static functionality(e, o) {
    o.addEventListener("change", (y) =>
      O(this, null, function* () {
        let n = v.tsCheck(e.mode, "string").toLowerCase(),
          h = document.querySelector(`div .CXUpload:has( #${o.getAttribute("id")})`).parentElement;
        if (n === "extract fields") {
          let c = h.querySelectorAll(".AI_TESSERACT_Name");
          for (let f of c) {
            let x = f.id,
              E = f.getAttribute("data-cb-Name");
          }
          if (n === "extract fields" && c.length === 0) return;
        }
        let l = (0, V.getJQuery)(),
          d = _.tsCheck(o, HTMLInputElement).files;
        C.ensurePdfJsWorkerConfigured();
        let g = new FormData(),
          a = e.maxpages ? Number(e.maxpages) : 5,
          u = e.processingimagetext ? v.tsCheck(e.processingimagetext, "string") : void 0,
          r = e.invalidimagetext
            ? v.tsCheck(e.invalidimagetext, "string")
            : "At least one of the images you selected did not contain the expected content.",
          i = {};
        for (let c of Array.from(d))
          if (c.type === "application/pdf") {
            let f = yield C.processPdfFile(c, a);
            if (f.hasText) i[c.name] = f.text;
            else
              for (let x = 0; x < f.images.length; x++) {
                let E = `${c.name.replace(".pdf", "")}_page_${x + 1}.png`;
                g.append(E, f.images[x], E);
              }
          } else g.append(c.name, c);
        let t = [];
        if (n === "extract fields") {
          let c = Object.keys(e).filter((f) => f.startsWith("pattern_"));
          for (let f of c) {
            let x = f.substring(8),
              E = e[f];
            if (x && E) {
              let j = {};
              (j[x] = encodeURIComponent(E.replace(/°/, "^"))), t.push(j);
            }
          }
        }
        let p = t.length > 0 ? JSON.stringify(t) : "",
          s = _.tsCheck(o, HTMLElement);
        (s.style.pointerEvents = "none"), (s.style.opacity = "0.5"), window.codbi.injectLoadingAnim(o);
        let m = _.tsCheck(s.parentElement.querySelector("label"), HTMLElement),
          b = m ? m.innerHTML : "";
        u &&
          (m.innerHTML = `${b}
        <style>
          @keyframes highlight {
            0%    { opacity:1; }
            50%   { opacity:0; }
            100%  { opacity:1; }}
                  
          .OCR_Verification { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

        <span class = "OCR_Verification">${u}</span>`);
        let w = () => {
            window.codbi.removeLoaderAnim(o),
              (s.style.pointerEvents = "all"),
              (s.style.opacity = "1"),
              (m.innerHTML = b);
          },
          k = {};
        if (
          (Object.keys(i).length > 0 && (k = C.processTextClientSide(i, n, e.pattern, t, e.regexflags)),
          !g.has(g.keys().next().value))
        ) {
          C.handleResponse(k, n, e, o, r, l), w();
          return;
        }
        let T = { "X-Mode": e.mode };
        if (
          (n !== "print" &&
            ((T["X-Pattern"] = encodeURIComponent(e.pattern ? e.pattern.replace(/°/, "^") : "")),
            (T["X-FieldPatterns"] = p.length > 0 ? encodeURIComponent(p) : "")),
          e.regexflags && (T["X-RegexFlags"] = v.tsCheck(e.regexflags, "string")),
          e.preprocess)
        ) {
          let c = v.tsCheck(e.preprocess, "string").toLowerCase();
          T["X-Preprocess"] = c === "true" || c === "1" ? "true" : "false";
        }
        l.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
          type: "POST",
          data: g,
          processData: !1,
          contentType: !1,
          cache: !1,
          headers: T,
          success: (c) => {
            let f = R(R({}, k), c);
            C.handleResponse(f, n, e, o, r, l), w();
          },
          error: (c, f, x) => {
            throw (w(), new B(`\u274C Tesseract AI OCR request failed with status (${f}) due to: ${x}`));
          },
        });
      }),
    );
  }
  static ensurePdfJsWorkerConfigured() {
    A.GlobalWorkerOptions.workerSrc ||
      (A.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}js/pdf.worker.min.mjs`);
  }
  static processPdfFile(e, o) {
    return O(this, null, function* () {
      let y = yield e.arrayBuffer(),
        n = yield A.getDocument({ data: y }).promise,
        h = Math.min(n.numPages, o),
        l = "",
        d = [];
      for (let a = 1; a <= h; a++) {
        let i = (yield (yield n.getPage(a)).getTextContent()).items.map((t) => ("str" in t ? t.str : "")).join(" ");
        l += `${i}
`;
      }
      let g = l.trim().length > 0;
      if (!g)
        for (let a = 1; a <= h; a++) {
          let u = yield n.getPage(a),
            r = u.getViewport({ scale: 2 }),
            i = document.createElement("canvas"),
            t = i.getContext("2d");
          (i.height = r.height), (i.width = r.width), yield u.render({ canvasContext: t, viewport: r }).promise;
          let p = yield new Promise((s) => {
            i.toBlob((m) => s(m), "image/png");
          });
          d.push(p);
        }
      return { hasText: g, text: l, images: d };
    });
  }
  static processTextClientSide(e, o, y, n, h) {
    let l = {};
    for (let [d, g] of Object.entries(e))
      if (o === "print") l[d] = g;
      else if (o === "verify" && y) {
        let a = new RegExp(y, h || "");
        l[d] = a.test(g);
      } else if (o === "extract fields" && n) {
        let a = {};
        for (let u of n)
          for (let [r, i] of Object.entries(u)) {
            let t = decodeURIComponent(i),
              p = new RegExp(t, h || ""),
              s = g.match(p);
            s && (a[r] || (a[r] = []), a[r].push(...s.slice(1).filter(Boolean)));
          }
        l[d] = a;
      }
    return l;
  }
  static handleResponse(e, o, y, n, h, l) {
    var d, g, a, u;
    if (o === "print") {
      let r =
        ((g = (d = n.parentElement) == null ? void 0 : d.parentElement) == null ? void 0 : g.parentElement) || null;
      if (r) {
        let i = r.querySelector(".CodBi_AI_Tesseract_Receiver");
        if (i) {
          let t = "";
          typeof e == "string"
            ? (t = e)
            : e && typeof e == "object"
              ? (t = Object.values(e)
                  .map((m) => (typeof m == "string" ? m : JSON.stringify(m)))
                  .join(`

`))
              : (t = JSON.stringify(e)),
            (i.value = t.replace(
              /\\n/g,
              `
`,
            ));
        } else
          window.codbi.log(
            "INFO",
            `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${n.parentElement.parentElement.getAttribute("id")}.`,
            "AI / TESSERACT",
          );
      }
    }
    if (o === "extract fields" && typeof e == "object" && e !== null) {
      let r =
        ((u = (a = n.parentElement) == null ? void 0 : a.parentElement) == null ? void 0 : u.parentElement) || null;
      if (r) {
        let i = r.querySelectorAll(".CodBi_AI_OCR_Receiver");
        for (let t of i) {
          let p = t.getAttribute("data-cb-Field").toLowerCase();
          if (p) {
            let s = y.separator ? y.separator : ",",
              m = [];
            for (let b in e)
              if (Object.prototype.hasOwnProperty.call(e, b)) {
                let w = e[b];
                if (w && typeof w == "object" && Object.prototype.hasOwnProperty.call(w, p)) {
                  let k = w[p];
                  Array.isArray(k) ? m.push(...k) : typeof k == "string" && m.push(k);
                }
              }
            if (m.length > 0) {
              let b = m.join(s);
              "value" in t ? (t.value = b) : (t.textContent = b);
            }
          }
        }
      }
    }
    if (o === "verify")
      if (Object.values(e).some((r) => r === !1)) {
        if ((l(n).error(h), !n.querySelector("#CodBi_AI_OCR_ManualVerify_Styles"))) {
          let s = document.createElement("style");
          (s.textContent = `
            .CodBi_AI_OCR_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
              flex-wrap: nowrap ;}

            .CodBi_AI_OCR_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
              flex-shrink: 0 ;}

            .CodBi_AI_OCR_ManualVerify label { margin-bottom: 0 ; position: relative !important ; white-space: nowrap ;}
            
            @keyframes highlight {
              0%    { opacity:1; }
              50%   { opacity:0; }
              100%  { opacity:1; }}
            
            .CodBi_AI_OCR_ManualVerify label span { font-weight: bold ; color: darkorange ;
              animation: highlight 2s ease-in-out infinite ;}`),
            n.appendChild(s);
        }
        let r = n.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let s = 0; s < r.length; s++) r[s].remove();
        let i = document.createElement("div");
        (i.className = "CodBi_AI_OCR_ManualVerify"),
          (i.style.display = "flex"),
          (i.style.alignItems = "center"),
          (i.style.marginTop = "8px"),
          (i.style.gap = "8px");
        let t = document.createElement("input");
        (t.type = "checkbox"), (t.id = `manual-verify-${n.id}`), (t.className = "CodBi_AI_OCR_ManualVerify_Checkbox");
        let p = document.createElement("label");
        (p.htmlFor = t.id),
          (p.textContent = y.wrongfilemessage
            ? y.wrongfilemessage
            : "The content is not as expected. You may manually verify that it is the correct one by clicking the checkbox."),
          (p.style.marginBottom = "0"),
          i.appendChild(t),
          i.appendChild(p),
          n.parentElement.insertAdjacentElement("afterend", i),
          t.addEventListener("change", () => {
            t.checked ? l(n).error("") : l(n).error(h);
          });
      } else l(n).error("");
  }
};
(C.registered = window.codbi.registerFunctionality("AI.OCR", C.functionality)),
  I([M.ParamvalueProvider], C, "functionality", 1);
var P = C;
export { P as AI_OCR };
