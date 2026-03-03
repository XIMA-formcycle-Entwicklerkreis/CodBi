import { a as V } from "./chunk-N3EQ4ZW6.js";
import { a as H } from "./chunk-DCP5OS4S.js";
import "./chunk-7ZUEWSHL.js";
import { a as B } from "./chunk-PSEWTT4Z.js";
import { a as A } from "./chunk-M2SNI3IN.js";
import { a as D } from "./chunk-4JLAI42Q.js";
import { a as T } from "./chunk-KEJSWGMR.js";
import { a as R } from "./chunk-SEUS6MHP.js";
import { a as k } from "./chunk-CDLTIEKC.js";
import { b as j, f as P, g as S, h as E, o as I, p as N } from "./chunk-UTJJRBTX.js";
var F = P(D(), 1);
var M = P(V(), 1);
var x = class x {
  static functionality(e, r) {
    r.addEventListener("change", (s) =>
      I(this, null, function* () {
        let m = document.querySelector(`div .CXUpload:has( #${r.getAttribute("id")})`).parentElement;
        typeof e.pattern == "string" &&
          (e.pattern = e.pattern.replace(/<\[([^\]]+)\]>/g, (a, p) => {
            let h = p.trim(),
              C = m.querySelector(`.${h}`);
            return C && "value" in C ? C.value : a;
          })),
          Object.keys(e).forEach((a) => {
            a.startsWith("pattern_") &&
              typeof e[a] == "string" &&
              (e[a] = e[a].replace(/<\[([^\]]+)\]>/g, (p, h) => {
                let C = h.trim(),
                  v = m.querySelector(`.${C}`);
                return v && "value" in v ? v.value : p;
              }));
          });
        let g = (0, F.getJQuery)(),
          f = r.files;
        x.ensurePdfJsWorkerConfigured();
        let y = e.maximum ? Number(e.maximum) : 2;
        if (y && f.length > y) {
          window.codbi.log(
            "WARNING",
            `Maximum file limit exceeded. Number of selected files(${f.length}) exceeds > ${y}, thus processing will occur.`,
            "AI / OCR",
          );
          return;
        }
        let u = new FormData(),
          o = e.maxpages ? Number(e.maxpages) : 5;
        (e.processingimagetext = e.processingimagetext ? e.processingimagetext : "Processing..."),
          (e.invalidimagetext = e.invalidimagetext
            ? e.invalidimagetext
            : "At least one of the images you selected did not contain the expected content.");
        let i = {};
        for (let a of Array.from(f))
          if (a.type === "application/pdf") {
            let p = yield x.processPdfFile(a, o);
            if (p.hasText) i[a.name] = p.text;
            else
              for (let h = 0; h < p.images.length; h++) {
                let C = `${a.name.replace(".pdf", "")}_page_${h + 1}.png`;
                u.append(C, p.images[h], C);
              }
          } else {
            let p = yield x.downscaleImageForOCR(a);
            u.append(a.name, p, a.name);
          }
        let n = [];
        if (e.mode.toLowerCase() === "extract fields") {
          let a = Object.keys(e).filter((p) => p.startsWith("pattern_"));
          for (let p of a) {
            let h = p.substring(8),
              C = k.tsCheck(e[p], "string", `Does the attribute "${p}" contain a regular expression pattern?`);
            if (h && C) {
              let v = {};
              (v[h] = encodeURIComponent(C.replace(/°/, "^"))), n.push(v);
            }
          }
        }
        let t = n.length > 0 ? JSON.stringify(n) : "";
        (r.style.pointerEvents = "none"), (r.style.opacity = "0.5"), window.codbi.injectLoadingAnim(r);
        let l = T.tsCheck(
            r.parentElement.querySelector("label"),
            HTMLLabelElement,
            "Does the tagged <input> not have a label?.",
          ),
          c = l ? l.innerHTML : "";
        e.processingimagetext &&
          (l.innerHTML = `${c}
        <style>
          @keyframes highlight {
            0%    { opacity:1; }
            50%   { opacity:0; }
            100%  { opacity:1; }}
                  
          .OCR_Verification { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

        <span class = "OCR_Verification">${e.processingimagetext}</span>`);
        let d = () => {
            window.codbi.removeLoaderAnim(r),
              (r.style.pointerEvents = "all"),
              (r.style.opacity = "1"),
              (l.innerHTML = c);
          },
          w = {};
        if (
          (Object.keys(i).length > 0 && (w = x.processTextClientSide(i, e.mode, e.pattern, n, e.regexflags)),
          !u.has(u.keys().next().value))
        ) {
          x.handleResponse(w, e, r, e.invalidimagetext, g), d();
          return;
        }
        let b = { "X-Mode": e.mode };
        if (
          (e.mode.toLowerCase() !== "print" &&
            (b["X-Pattern"] = encodeURIComponent(e.pattern ? e.pattern.replace(/°/, "^") : "")),
          e.mode.toLowerCase() === "extract fields" && t.length > 0 && (b["X-FieldPatterns"] = encodeURIComponent(t)),
          e.regexflags && (b["X-RegexFlags"] = e.regexflags),
          e.preprocess && e.preprocess.toLowerCase() === "true")
        )
          if (typeof e.preprocess == "string") {
            let a = e.preprocess.toLowerCase();
            b["X-Preprocess"] = a === "true" || a === "t" ? "true" : "false";
          } else b["X-Preprocess"] = e.preprocess ? "true" : "false";
        g.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
          type: "POST",
          data: u,
          processData: !1,
          contentType: !1,
          cache: !1,
          headers: b,
          success: (a) => {
            let p = typeof a == "string" ? JSON.parse(a) : a,
              h = j(j({}, w), p);
            x.handleResponse(h, e, r, e.invalidimagetext, g), d();
          },
          error: (a, p, h) => {
            throw (d(), new H(`\u274C Tesseract AI OCR request failed with status (${p}) due to: ${h}`));
          },
        });
      }),
    );
  }
  static downscaleImageForOCR(e) {
    return I(this, null, function* () {
      return new Promise((s) => {
        let m = new Image(),
          g = URL.createObjectURL(e);
        (m.onload = () => {
          URL.revokeObjectURL(g);
          let { width: f, height: y } = m,
            u = Math.max(f, y);
          if (u <= 2048) {
            s(e);
            return;
          }
          let o = 2048 / u,
            i = Math.round(f * o),
            n = Math.round(y * o),
            t = document.createElement("canvas");
          (t.width = i),
            (t.height = n),
            t.getContext("2d").drawImage(m, 0, 0, i, n),
            t.toBlob(
              (c) => {
                s(c || e);
              },
              e.type.startsWith("image/png") ? "image/png" : "image/jpeg",
              0.92,
            );
        }),
          (m.onerror = () => {
            URL.revokeObjectURL(g), s(e);
          }),
          (m.src = g);
      });
    });
  }
  static ensurePdfJsWorkerConfigured() {
    x.pdfJsWorkerConfigured ||
      ((M.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`),
      (x.pdfJsWorkerConfigured = !0),
      window.codbi.log("INFO", `PDF.js worker configured: ${M.GlobalWorkerOptions.workerSrc}`, "AI / OCR"));
  }
  static processPdfFile(e, r) {
    return I(this, null, function* () {
      let s = yield e.arrayBuffer(),
        m = yield M.getDocument({ data: s }).promise,
        g = Math.min(m.numPages, r),
        f = "",
        y = [];
      for (let o = 1; o <= g; o++) {
        let t = (yield (yield m.getPage(o)).getTextContent()).items.map((l) => ("str" in l ? l.str : "")).join(" ");
        f += `${t}
`;
      }
      let u = f.trim().length > 0;
      if (!u)
        for (let o = 1; o <= g; o++) {
          let i = yield m.getPage(o),
            n = i.getViewport({ scale: 2 }),
            t = document.createElement("canvas"),
            l = t.getContext("2d");
          (t.height = n.height), (t.width = n.width), yield i.render({ canvasContext: l, viewport: n }).promise;
          let c = yield new Promise((d) => {
            t.toBlob((w) => d(w), "image/png");
          });
          y.push(c);
        }
      return { hasText: u, text: f, images: y };
    });
  }
  static processTextClientSide(e, r, s, m, g) {
    let f = {};
    for (let [y, u] of Object.entries(e))
      switch (r.toLowerCase()) {
        case "print":
          f[y] = u;
          break;
        case "verify":
          if (s) {
            let o = new RegExp(s, g || "");
            f[y] = o.test(u);
          }
          break;
        case "extract fields":
          if (m) {
            let o = {};
            for (let i of m)
              for (let [n, t] of Object.entries(i)) {
                let l = decodeURIComponent(t),
                  c = new RegExp(l, g || ""),
                  d = u.match(c);
                d && (o[n] || (o[n] = []), o[n].push(...d.slice(1).filter(Boolean)));
              }
            f[y] = o;
          }
          break;
      }
    return f;
  }
  static handleResponse(e, r, s, m, g) {
    var f, y, u, o;
    if (r.mode.toLowerCase() === "print") {
      let i =
        ((y = (f = s.parentElement) == null ? void 0 : f.parentElement) == null ? void 0 : y.parentElement) || null;
      if (i) {
        let n = T.tsCheck(
          i.querySelector(".CodBi_AI_OCR_Receiver"),
          HTMLTextAreaElement,
          "The receiver element for the OCR results in Print-Mode has to be a <textarea>.",
        );
        if (n) {
          let t = "",
            l = [],
            c = [];
          switch (typeof e) {
            case "string":
              t = e;
              break;
            case "object":
              e !== null
                ? ((l = Object.keys(e)),
                  (c = Object.values(e).map((d) => (typeof d == "string" ? d : JSON.stringify(d)))),
                  (t = c.join(`

`)))
                : (t = JSON.stringify(e));
              break;
            default:
              t = JSON.stringify(e);
              break;
          }
          n.value = t;
        } else
          window.codbi.log(
            "INFO",
            `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${s.parentElement.parentElement.getAttribute("id")}.`,
            "AI / OCR",
          );
      }
    }
    if (r.mode.toLowerCase() === "extract fields" && typeof e == "object" && e !== null) {
      let i =
        ((o = (u = s.parentElement) == null ? void 0 : u.parentElement) == null ? void 0 : o.parentElement) || null;
      if (i) {
        let n = i.querySelectorAll(".CodBi_AI_OCR_Receiver");
        for (let t of n) {
          let l = t.getAttribute("data-cb-Field").toLowerCase();
          if (l) {
            let c = r.separator ? r.separator : ",",
              d = [];
            for (let w in e)
              if (Object.prototype.hasOwnProperty.call(e, w)) {
                let O = e[w];
                if (O && typeof O == "object" && Object.prototype.hasOwnProperty.call(O, l)) {
                  let b = O[l];
                  Array.isArray(b) ? d.push(...b) : typeof b == "string" && d.push(b);
                }
              }
            if (d.length > 0) {
              let w = d.join(c);
              "value" in t
                ? (T.tsCheckMulti(
                    t,
                    [HTMLInputElement, HTMLTextAreaElement],
                    "The OCR receiver element has to be an <input> or <textarea> when in Extract Fields mode.",
                  ).value = w)
                : (t.textContent = w);
            }
          }
        }
      }
    }
    if (r.mode.toLowerCase() === "verify")
      if (Object.values(e).some((i) => i === !1)) {
        if ((g(s).error(m), !s.querySelector("#CodBi_AI_OCR_ManualVerify_Styles"))) {
          let c = document.createElement("style");
          (c.textContent = `
            .CodBi_AI_OCR_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
              flex-wrap: nowrap ;}
            .CodBi_AI_OCR_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
              flex-shrink: 0 ;}
            .CodBi_AI_OCR_ManualVerify label { margin-bottom: 0 ; position: relative !important ;}
            @keyframes highlight {
              0%    { opacity:1; }
              50%   { opacity:0; }
              100%  { opacity:1; }}
            .CodBi_AI_OCR_ManualVerify label span { font-weight: bold ; color: darkorange ;
              animation: highlight 2s ease-in-out infinite ;}`),
            s.appendChild(c);
        }
        let i = s.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let c = 0; c < i.length; c++) i[c].remove();
        let n = document.createElement("div");
        (n.className = "CodBi_AI_OCR_ManualVerify"),
          (n.style.display = "flex"),
          (n.style.alignItems = "center"),
          (n.style.marginTop = "8px"),
          (n.style.gap = "8px");
        let t = document.createElement("input");
        (t.type = "checkbox"), (t.id = `manual-verify-${s.id}`), (t.className = "CodBi_AI_OCR_ManualVerify_Checkbox");
        let l = document.createElement("label");
        (l.htmlFor = t.id),
          (l.textContent = r.wrongfilemessage
            ? r.wrongfilemessage
            : "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox."),
          (l.style.marginBottom = "0"),
          n.appendChild(t),
          n.appendChild(l),
          s.parentElement.insertAdjacentElement("afterend", n),
          t.addEventListener("change", () => {
            t.checked ? g(s).error("") : g(s).error(m);
          });
      } else {
        g(s).error("");
        let i = s.parentElement.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
        for (let n = 0; n < i.length; n++) i[n].remove();
      }
  }
};
(x.pdfJsWorkerConfigured = !1),
  S(
    [
      N.ParamvalueProvider,
      E(
        0,
        k.PRE(
          "string",
          "mode :: pattern :: invalidimagetext :: wrongfilemessage :: processingimagetext :: separator :: regexflags",
        ),
      ),
      E(0, R.PRE(/^(Print|Verify|Extract Fields)$/i, "mode")),
      E(0, R.PRE(/^\S+$/, "separator")),
      E(0, R.PRE(/^\d+$/, "maxpages")),
      E(0, A.PRE(new k("string"), new R(/^\d+$/), "maxpages")),
      E(0, A.PRE(new k("string"), new R(R.stdExp.boolean), "preprocess")),
      E(0, A.PRE(new k("string"), new k("boolean"), "preprocess", !0)),
      E(
        1,
        T.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "file"/> that is tagged with this functionality?'),
      ),
      E(1, B.PRE("file", !1, "type")),
    ],
    x,
    "functionality",
    1,
  );
var _ = x;
window.codbi.registerFunctionality("AI.OCR", _.functionality.bind(_));
export { _ as AI_OCR };
