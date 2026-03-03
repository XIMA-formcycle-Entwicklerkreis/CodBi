import { a as ne } from "./chunk-HI24USOS.js";
import { a as oe } from "./chunk-N3EQ4ZW6.js";
import { a as O } from "./chunk-PSEWTT4Z.js";
import { a as k } from "./chunk-M2SNI3IN.js";
import { a as ae } from "./chunk-4JLAI42Q.js";
import { a as te } from "./chunk-KEJSWGMR.js";
import { a as D } from "./chunk-SEUS6MHP.js";
import { a as _ } from "./chunk-CDLTIEKC.js";
import { f as K, g as Z, h as F, o as C, p as ee } from "./chunk-UTJJRBTX.js";
var ie = K(ae(), 1);
var v = K(oe(), 1);
var s = class s {
  static functionality(e, i) {
    i.addEventListener("change", (c) =>
      C(this, null, function* () {
        var B, X, W, G;
        let a = (e.mode || "").toString().toLowerCase(),
          t = (0, ie.getJQuery)(),
          m = i.files;
        if (!m || m.length === 0) return;
        s.ensurePdfJsWorkerConfigured();
        let n = new FormData(),
          g = e.maxpages ? Number(e.maxpages) : 5,
          w = e.maxpixelsize != null ? Number(e.maxpixelsize) : s.DEFAULT_MAX_PIXELS,
          A = e.aihint != null ? String(e.aihint) : "\u2728 AI-Generated";
        for (let o of Array.from(m))
          if (o.type === "application/pdf") {
            let r = yield s.processPdfFile(o, g);
            for (let l = 0; l < r.length; l++) {
              let p = `${o.name.replace(".pdf", "")}_page_${l + 1}.png`,
                L = new File([r[l]], p, { type: "image/png" });
              if (w > 0) {
                let d = yield s.downscaleImageIfNeeded(L, w);
                L = d instanceof File ? d : new File([d], p, { type: d.type || "image/png" });
              }
              let f = yield s.blobToDataUrl(L);
              n.append(`codbi-base64:${p}`, f);
            }
          } else if (w > 0) {
            let r = yield s.downscaleImageIfNeeded(o, w),
              l = yield s.blobToDataUrl(r);
            window.codbi.log(
              "INFO",
              `Appending '${o.name}' as base64 param: ${Math.round(l.length / 1024)} KB`,
              "AI / LLAMA / QA",
            ),
              n.append(`codbi-base64:${o.name}`, l);
          } else {
            let r = yield s.blobToDataUrl(o);
            window.codbi.log(
              "INFO",
              `Appending '${o.name}' as base64 param (no client downscale): ${Math.round(r.length / 1024)} KB`,
              "AI / LLAMA / QA",
            ),
              n.append(`codbi-base64:${o.name}`, r);
          }
        let u = {};
        (u["X-Session-Id"] = s.PAGE_SESSION_ID),
          e.rotate &&
            e.rotate !== "0" &&
            e.rotate !== 0 &&
            ((u["X-Rotate"] = e.rotate.toString()),
            window.codbi.log(
              "INFO",
              `Setting image rotation to ${e.rotate}\xB0 via X-Rotate header`,
              "AI / LLAMA / QA",
            ));
        let b = i.closest(".CXContainer"),
          x;
        if (
          (b != null && b.classList.contains("AI_LLAMA_QA_Exclude")
            ? (x = b)
            : (x =
                (X = (B = b == null ? void 0 : b.parentElement) == null ? void 0 : B.closest(".CXContainer")) != null
                  ? X
                  : b),
          !x)
        ) {
          window.codbi.log(
            "ERROR",
            `Could not find ancestor .CXContainer for element #${i.getAttribute("id")}. Make sure the input is inside a CXContainer.`,
            "AI / LLAMA / QA",
          );
          return;
        }
        let N = x.querySelectorAll(".AI_LLAMA_STANDARD_QA_Question"),
          U = [];
        for (let o of N) {
          let r = o.closest(".CXContainer");
          (r && r !== x && r.classList.contains("AI_LLAMA_QA_Exclude")) || U.push(o);
        }
        let q = [],
          R = {};
        R["X-Session-Id"] = s.PAGE_SESSION_ID;
        let E = null,
          M = null;
        if (
          (a === "verify" &&
            ((E = i.getAttribute("id")),
            (M = i.getAttribute("data-cb-Question")),
            E &&
              M &&
              ((M = M.replace(/<\[([^\]]+)\]>/g, (o, r) => {
                let l = r.trim(),
                  p = document.querySelector(`.${l}`);
                return p && "value" in p ? p.value : o;
              })),
              (R[`X-Question-${E}`] = M))),
          !(a === "verify" && E && M))
        )
          for (let o of U) {
            let r = o.id,
              l = o.getAttribute("data-cb-Question");
            r && l
              ? ((l = l.replace(/<\[([^\]]+)\]>/g, (p, L) => {
                  let f = L.trim(),
                    d = document.querySelector(`.${f}`);
                  return d && "value" in d ? d.value : p;
                })),
                (R[`X-Question-${r}`] = l))
              : (r ||
                  window.codbi.log(
                    "WARNING",
                    `Question element missing id attribute in: ${o.outerHTML}`,
                    "AI / LLAMA / QA",
                  ),
                l ||
                  window.codbi.log(
                    "WARNING",
                    `Question element with id "${r}" missing data-cb-Question attribute in: ${o.outerHTML}`,
                    "AI / LLAMA / QA",
                  ));
          }
        if (q.length > 0)
          for (let { id: o, element: r } of q)
            t.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
              type: "POST",
              data: n,
              dataType: "json",
              processData: !1,
              contentType: !1,
              cache: !1,
              beforeSend: (l) => {
                l.setRequestHeader("X-Session-Id", s.PAGE_SESSION_ID);
              },
              success: (l) => {
                let p = document.querySelector(`#${o}`);
                if (p) {
                  p.value = typeof l == "string" ? l : JSON.stringify(l);
                  let L = new Event("change", { bubbles: !0 });
                  p.dispatchEvent(L);
                }
              },
              error: (l, p, L) => {
                window.codbi.log("ERROR", `CORD REST failed with status "${p}" cause: "${L}"`, "AI / LLAMA / QA");
              },
            });
        if (Object.keys(R).length > 0) {
          let o = i;
          (o.style.pointerEvents = "none"), (o.style.opacity = "0.5"), window.codbi.injectLoadingAnim(i);
          let r = (W = o.parentElement) == null ? void 0 : W.querySelector("label"),
            l = r ? r.innerHTML : "";
          r &&
            (r.innerHTML = `${l}
            <style>
              @keyframes highlight {
                0%    { opacity:1; }
                50%   { opacity:0; }
                100%  { opacity:1; }}
                    
              .LLAMA_Processing { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

            <span class = "LLAMA_Processing">Processing...</span>`);
          let p = new Map();
          if (!(a === "verify" && E && M))
            for (let f of U) {
              let d = (G = f.parentElement) == null ? void 0 : G.querySelector("label");
              if (d) {
                let P = d.innerHTML;
                p.set(d, P),
                  (d.innerHTML = `${P}
                <span class = "LLAMA_Processing">Processing...</span>`);
              }
            }
          let L = () => {
            window.codbi.removeLoaderAnim(i),
              (o.style.pointerEvents = "all"),
              (o.style.opacity = "1"),
              r && (r.innerHTML = l);
            for (let [f, d] of p.entries()) f.innerHTML = d;
          };
          t.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
            type: "POST",
            data: n,
            dataType: "json",
            processData: !1,
            contentType: !1,
            cache: !1,
            beforeSend: (f) => {
              for (let d of Object.keys(R)) f.setRequestHeader(d, R[d]);
            },
            success: (f) => {
              var d, P, V, J, z, Y;
              if ((L(), f.error)) {
                window.codbi.log("ERROR", `REST failed with: ${f.error}`, "AI / LLAMA / QA");
                return;
              }
              if (a === "verify" && E && M) {
                let T,
                  H = f[E];
                H && typeof H.answer == "string" && (T = H.answer);
                let y = document.querySelector(`#${E}`);
                if (typeof T == "string" && T.trim().toLowerCase() === "yes") {
                  if (y) {
                    (y.value = T), A && s.attachAiHint(y, A);
                    let h = new Event("change", { bubbles: !0 });
                    y.dispatchEvent(h);
                  }
                  t(i).error("");
                  let I =
                    (P = (d = i.parentElement) == null ? void 0 : d.parentElement) == null
                      ? void 0
                      : P.querySelectorAll(".LLAMA_AI_ManualVerify");
                  if (I) for (let h = 0; h < I.length; h++) I[h].remove();
                } else {
                  if (
                    (t(i).error("The file does not meet the verification criteria."),
                    !document.querySelector("#LLAMA_AI_ManualVerify_Styles"))
                  ) {
                    let $ = document.createElement("style");
                    ($.id = "LLAMA_AI_ManualVerify_Styles"),
                      ($.textContent = `
                    .LLAMA_AI_ManualVerify { display: flex ; align-items: center ; margin-top: 8px ; gap: 8px ;
                      flex-wrap: nowrap ;}
                    .LLAMA_AI_ManualVerify_Checkbox { cursor: pointer ; opacity: 1 !important ; position: relative !important ;
                      flex-shrink: 0 ;}
                    .LLAMA_AI_ManualVerify label { margin-bottom: 0 ; position: relative !important ;}`),
                      document.head.appendChild($);
                  }
                  let I =
                    (J = (V = i.parentElement) == null ? void 0 : V.parentElement) == null
                      ? void 0
                      : J.querySelectorAll(".LLAMA_AI_ManualVerify");
                  if (I) for (let $ = 0; $ < I.length; $++) I[$].remove();
                  let h = document.createElement("div");
                  h.className = "LLAMA_AI_ManualVerify";
                  let S = document.createElement("input");
                  (S.type = "checkbox"),
                    (S.id = `manual-verify-${i.id}`),
                    (S.className = "LLAMA_AI_ManualVerify_Checkbox");
                  let j = document.createElement("label");
                  (j.htmlFor = S.id),
                    (j.textContent =
                      "The content is not as expected. Please check if you selected the correct file(s). You may manually verify that it is the correct one by clicking the checkbox."),
                    h.appendChild(S),
                    h.appendChild(j),
                    (z = i.parentElement) == null || z.insertAdjacentElement("afterend", h),
                    S.addEventListener("change", () => {
                      S.checked ? t(i).error("") : t(i).error("The file does not meet the verification criteria.");
                    });
                }
              } else
                for (let T in f) {
                  let H = (Y = f[T]) == null ? void 0 : Y.answer;
                  if (H == null) continue;
                  let y = document.querySelector(`#${T}`);
                  if (y) {
                    (y.value = H), A && s.attachAiHint(y, A);
                    let I = new Event("change", { bubbles: !0 });
                    y.dispatchEvent(I);
                  }
                }
            },
            error: (f, d, P) => {
              L(), window.codbi.log("ERROR", `REST failed with status "${d}" cause: "${P}"`, "AI / LLAMA / QA");
            },
          });
        }
      }),
    );
  }
  static ensurePdfJsWorkerConfigured() {
    s.pdfJsWorkerConfigured ||
      ((v.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`),
      (s.pdfJsWorkerConfigured = !0),
      window.codbi.log("INFO", `PDF.js worker configured: ${v.GlobalWorkerOptions.workerSrc}`, "AI / LLAMA / QA"));
  }
  static ensureAiHintStyles() {
    if (document.querySelector("#LLAMA_AI_Hint_Styles")) return;
    let e = document.createElement("style");
    (e.id = "LLAMA_AI_Hint_Styles"),
      (e.textContent = `
      .LLAMA_AI_Hint_Wrapper { position: relative ; display: inline-block ; width: 100% ;}
      .LLAMA_AI_Hint { position: absolute ; pointer-events: none ; color: rgba(0,0,0,0.38) ;
        font-size: 11px ; line-height: 1 ; white-space: nowrap ; user-select: none ;}
      input  + .LLAMA_AI_Hint { right: 8px ; top: 50% ; transform: translateY(-50%) ;}
      textarea + .LLAMA_AI_Hint { right: 8px ; bottom: 6px ;}`),
      document.head.appendChild(e);
  }
  static attachAiHint(e, i) {
    var n, g;
    s.ensureAiHintStyles();
    let c = (n = e.parentElement) == null ? void 0 : n.querySelector(".LLAMA_AI_Hint");
    c && c.remove();
    let a = e.parentElement;
    (a != null && a.classList.contains("LLAMA_AI_Hint_Wrapper")) ||
      ((a = document.createElement("span")),
      (a.className = "LLAMA_AI_Hint_Wrapper"),
      (g = e.parentElement) == null || g.insertBefore(a, e),
      a.appendChild(e));
    let t = document.createElement("span");
    (t.className = "LLAMA_AI_Hint"), (t.textContent = i), a.appendChild(t);
    let m = () => {
      t.remove(), e.removeEventListener("input", m);
    };
    e.addEventListener("input", m);
  }
  static blobToDataUrl(e) {
    return new Promise((i, c) => {
      let a = new FileReader();
      (a.onload = () => i(a.result)), (a.onerror = c), a.readAsDataURL(e);
    });
  }
  static canvasToFile(e, i) {
    let a = e.toDataURL("image/png").split(",")[1],
      t = atob(a),
      m = new Uint8Array(t.length);
    for (let n = 0; n < t.length; n++) m[n] = t.charCodeAt(n);
    return new File([m.buffer], i, { type: "image/png" });
  }
  static downscaleImageIfNeeded(e, i) {
    return C(this, null, function* () {
      return new Promise((c, a) => {
        let t = new Image();
        (t.onload = () => {
          let m = t.width * t.height;
          if (m <= i) {
            URL.revokeObjectURL(t.src), c(e);
            return;
          }
          let n = Math.sqrt(i / m),
            g = Math.max(28, Math.round(t.width * n)),
            w = Math.max(28, Math.round(t.height * n));
          window.codbi.log(
            "INFO",
            `Downscaling ${e.name}: ${t.width}\xD7${t.height} \u2192 ${g}\xD7${w}`,
            "AI / LLAMA / QA",
          );
          let A = document.createElement("canvas");
          (A.width = g), (A.height = w);
          let u = A.getContext("2d");
          if (!u) {
            URL.revokeObjectURL(t.src), c(e);
            return;
          }
          u.drawImage(t, 0, 0, g, w), URL.revokeObjectURL(t.src), c(s.canvasToFile(A, e.name));
        }),
          (t.onerror = () => {
            URL.revokeObjectURL(t.src), c(e);
          }),
          (t.src = URL.createObjectURL(e));
      });
    });
  }
  static processPdfFile(e, i = 0) {
    return C(this, null, function* () {
      let c = yield e.arrayBuffer(),
        a = yield v.getDocument({ data: c }).promise,
        t = [],
        m = i > 0 ? Math.min(i, a.numPages) : a.numPages;
      window.codbi.log(
        "INFO",
        `Processing PDF with ${a.numPages} page(s), limiting to ${m} page(s): ${e.name}`,
        "AI / LLAMA / QA",
      );
      for (let n = 1; n <= m; n++) {
        let g = yield a.getPage(n),
          A = (yield g.getTextContent()).items
            .map((u) => ("str" in u ? u.str : ""))
            .join("")
            .trim().length;
        if (A > 100) {
          window.codbi.log(
            "INFO",
            `PDF page ${n} contains ${A} characters of text - rendering to image`,
            "AI / LLAMA / QA",
          );
          let u = yield s.renderPdfPageToImage(g);
          t.push(u);
        } else {
          window.codbi.log(
            "INFO",
            `PDF page ${n} has minimal text (${A} chars) - attempting image extraction`,
            "AI / LLAMA / QA",
          );
          let u = yield s.extractImagesFromPdfPage(g);
          if (u.length > 0)
            t.push(...u),
              window.codbi.log("INFO", `Extracted ${u.length} image(s) from PDF page ${n}`, "AI / LLAMA / QA");
          else {
            window.codbi.log(
              "INFO",
              `No extractable images found on page ${n} - rendering page to image`,
              "AI / LLAMA / QA",
            );
            let b = yield s.renderPdfPageToImage(g);
            t.push(b);
          }
        }
      }
      return t;
    });
  }
  static renderPdfPageToImage(e) {
    return C(this, null, function* () {
      let i = e.getViewport({ scale: 2 }),
        c = document.createElement("canvas"),
        a = c.getContext("2d");
      if (!a) throw new Error("Failed to get canvas 2D context");
      return (
        (c.width = i.width),
        (c.height = i.height),
        yield e.render({ canvasContext: a, viewport: i }).promise,
        new Promise((t, m) => {
          c.toBlob((n) => {
            n ? t(n) : m(new Error("Failed to convert canvas to blob"));
          }, "image/png");
        })
      );
    });
  }
  static extractImagesFromPdfPage(e) {
    return C(this, null, function* () {
      let i = [];
      try {
        let c = yield e.getOperatorList();
        for (let a = 0; a < c.fnArray.length; a++) {
          let t = c.fnArray[a];
          if (t === v.OPS.paintImageXObject || t === v.OPS.paintInlineImageXObject)
            try {
              let m = c.argsArray[a][0];
              if (typeof m == "string") {
                let n = yield e.objs.get(m);
                if (n != null && n.data) {
                  let g = document.createElement("canvas"),
                    w = g.getContext("2d");
                  if (w && n.width && n.height) {
                    (g.width = n.width), (g.height = n.height);
                    let A = new ImageData(new Uint8ClampedArray(n.data), n.width, n.height);
                    w.putImageData(A, 0, 0);
                    let u = yield new Promise((b, x) => {
                      g.toBlob((N) => {
                        N ? b(N) : x(new Error("Failed to create blob from image"));
                      }, "image/png");
                    });
                    i.push(u);
                  }
                }
              }
            } catch (m) {
              window.codbi.log("WARNING", `Failed to extract individual image: ${m}`, "AI / LLAMA / QA");
            }
        }
      } catch (c) {
        window.codbi.log("WARNING", `Image extraction failed: ${c}`, "AI / LLAMA / QA");
      }
      return i;
    });
  }
};
(s.PAGE_SESSION_ID = crypto.randomUUID()),
  (s.pdfJsWorkerConfigured = !1),
  (s.DEFAULT_MAX_PIXELS = 3211264),
  Z(
    [
      ee.ParamvalueProvider,
      F(0, k.PRE(new _("string"), new D(/^\d+$/), "maxpages")),
      F(0, k.PRE(new _("string"), new D(/^(90|180|270)$/), "rotate")),
      F(0, k.PRE(new _("number"), new ne([new O(90), new O(180), new O(270)]), "rotate")),
      F(0, k.PRE(new _("string"), new D(/^\d+$/), "maxPixelSize")),
      F(
        1,
        te.PRE(HTMLInputElement, void 0, 'Is it not an <input type = "file"/> that is tagged with this functionality?'),
      ),
      F(1, O.PRE("file", !1, "type")),
    ],
    s,
    "functionality",
    1,
  );
var Q = s;
window.codbi.registerFunctionality("AI.LLAMA.STANDARD.QA", Q.functionality.bind(Q));
export { Q as AI_LLAMA_STANDARD_QA };
