import { a as E } from "./chunk-SGIEOVFR.js";
import { a as v } from "./chunk-W23DHSE2.js";
import { a as $ } from "./chunk-MUWAMKOD.js";
import { f as x, g as A, o as b } from "./chunk-RS4WWU7K.js";
var F = x(v(), 1);
var f = x(E(), 1);
var d = class d {
  static functionality(m, o) {
    o.addEventListener("change", (s) =>
      b(this, null, function* () {
        var T, D;
        let a = (0, F.getJQuery)(),
          c = o.files;
        if (!c || c.length === 0) return;
        d.ensurePdfJsWorkerConfigured();
        let l = new FormData(),
          t = m.maxpages ? Number(m.maxpages) : 5;
        for (let e of Array.from(c))
          if (e.type === "application/pdf") {
            let n = yield d.processPdfFile(e, t);
            for (let i = 0; i < n.length; i++) {
              let I = `${e.name.replace(".pdf", "")}_page_${i + 1}.png`;
              l.append(I, n[i], I);
            }
          } else l.append(e.name, e);
        let r = {},
          O = new Map(),
          u = document.querySelector(`div .CXUpload:has(#${o.getAttribute("id")})`);
        if (!u || !u.parentElement) {
          window.codbi.log(
            "ERROR",
            `Could not find upload container for element #${o.getAttribute("id")}. Make sure the input is inside a CXUpload container.`,
            "AI / ONNX / DONUT",
          );
          return;
        }
        let g = u.parentElement,
          N = g.querySelectorAll(".AI_ONNX_DONUT_QA_Question");
        for (let e of N) {
          let n = e.id,
            i = e.getAttribute("data-cb-DonutQuestion");
          n && i
            ? (r[`X-Question-${n}`] = i)
            : (n ||
                window.codbi.log(
                  "WARNING",
                  `Question element missing id attribute in: ${e.outerHTML}`,
                  "AI / ONNX / DONUT",
                ),
              i ||
                window.codbi.log(
                  "WARNING",
                  `Question element with id "${n}" missing data-cb-DonutQuestion attribute in: ${e.outerHTML}`,
                  "AI / ONNX / DONUT",
                ));
        }
        if (Object.keys(r).length === 0) {
          window.codbi.log(
            "ERROR",
            `No question elements found with class AI_ONNX_DONUT_QA_Question in container "${g.getAttribute("id") || "unknown"}". Cannot proceed without questions. Add elements with class "AI_ONNX_DONUT_QA_Question" and attribute "data-cb-DonutQuestion" to ask questions.`,
            "AI / ONNX / DONUT",
          );
          return;
        }
        let w = o;
        (w.style.pointerEvents = "none"), (w.style.opacity = "0.5"), window.codbi.injectLoadingAnim(o);
        let p = (T = w.parentElement) == null ? void 0 : T.querySelector("label"),
          h = p ? p.innerHTML : "";
        p &&
          (p.innerHTML = `${h}
        <style>
          @keyframes highlight {
            0%    { opacity:1; }
            50%   { opacity:0; }
            100%  { opacity:1; }}
                  
          .DONUT_Processing { font-weight: bold ; color: darkorange ; animation: highlight 2s ease-in-out infinite ;}</style>

        <span class = "DONUT_Processing">Processing...</span>`);
        let y = new Map();
        for (let e of N) {
          let n = (D = e.parentElement) == null ? void 0 : D.querySelector("label");
          if (n) {
            let i = n.innerHTML;
            y.set(n, i),
              (n.innerHTML = `${i}
          <span class = "DONUT_Processing">Processing...</span>`);
          }
        }
        let P = () => {
          window.codbi.removeLoaderAnim(o),
            (w.style.pointerEvents = "all"),
            (w.style.opacity = "1"),
            p && (p.innerHTML = h);
          for (let [e, n] of y.entries()) e.innerHTML = n;
        };
        a.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_vQA`,
          type: "POST",
          data: l,
          dataType: "json",
          processData: !1,
          contentType: !1,
          cache: !1,
          beforeSend: (e) => {
            for (let n of Object.keys(r)) e.setRequestHeader(n, r[n]);
          },
          success: (e) => {
            if ((P(), e.error)) {
              window.codbi.log("ERROR", `ONNX DONUT Error: ${e.error}`, "AI / ONNX / DONUT");
              return;
            }
            for (let n in e) for (let i in e[n]) document.querySelector(`#${i}`).value = e[n][i];
            window.codbi.log(
              "INFO",
              `ONNX DONUT Request successful with response: "${JSON.stringify(e)}".`,
              "AI / ONNX / DONUT",
            );
          },
          error: (e, n, i) => {
            P(),
              window.codbi.log(
                "ERROR",
                `ONNX DONUT Request failed with status "${n}" cause "${i}"`,
                "AI / ONNX / DONUT",
              );
          },
        });
      }),
    );
  }
  static ensurePdfJsWorkerConfigured() {
    d.pdfJsWorkerConfigured ||
      ((f.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`),
      (d.pdfJsWorkerConfigured = !0),
      window.codbi.log("INFO", `PDF.js worker configured: ${f.GlobalWorkerOptions.workerSrc}`, "AI / ONNX / DONUT"));
  }
  static processPdfFile(m, o = 0) {
    return b(this, null, function* () {
      let s = yield m.arrayBuffer(),
        a = yield f.getDocument({ data: s }).promise,
        c = [],
        l = o > 0 ? Math.min(o, a.numPages) : a.numPages;
      window.codbi.log(
        "INFO",
        `Processing PDF with ${a.numPages} page(s), limiting to ${l} page(s): ${m.name}`,
        "AI / ONNX / DONUT",
      );
      for (let t = 1; t <= l; t++) {
        let r = yield a.getPage(t),
          u = (yield r.getTextContent()).items
            .map((g) => g.str)
            .join("")
            .trim().length;
        if (u > 100) {
          window.codbi.log(
            "INFO",
            `PDF page ${t} contains ${u} characters of text - rendering to image`,
            "AI / ONNX / DONUT",
          );
          let g = yield d.renderPdfPageToImage(r);
          c.push(g);
        } else {
          window.codbi.log(
            "INFO",
            `PDF page ${t} has minimal text (${u} chars) - attempting image extraction`,
            "AI / ONNX / DONUT",
          );
          let g = yield d.extractImagesFromPdfPage(r);
          if (g.length > 0)
            c.push(...g),
              window.codbi.log("INFO", `Extracted ${g.length} image(s) from PDF page ${t}`, "AI / ONNX / DONUT");
          else {
            window.codbi.log(
              "INFO",
              `No extractable images found on page ${t} - rendering page to image`,
              "AI / ONNX / DONUT",
            );
            let N = yield d.renderPdfPageToImage(r);
            c.push(N);
          }
        }
      }
      return c;
    });
  }
  static renderPdfPageToImage(m) {
    return b(this, null, function* () {
      let o = m.getViewport({ scale: 2 }),
        s = document.createElement("canvas"),
        a = s.getContext("2d");
      if (!a) throw new Error("Failed to get canvas 2D context");
      return (
        (s.width = o.width),
        (s.height = o.height),
        yield m.render({ canvasContext: a, viewport: o }).promise,
        new Promise((c, l) => {
          s.toBlob((t) => {
            t ? c(t) : l(new Error("Failed to convert canvas to blob"));
          }, "image/png");
        })
      );
    });
  }
  static extractImagesFromPdfPage(m) {
    return b(this, null, function* () {
      let o = [];
      try {
        let s = yield m.getOperatorList();
        for (let a = 0; a < s.fnArray.length; a++) {
          let c = s.fnArray[a];
          if (c === f.OPS.paintImageXObject || c === f.OPS.paintInlineImageXObject)
            try {
              let l = s.argsArray[a][0];
              if (typeof l == "string") {
                let t = yield m.objs.get(l);
                if (t != null && t.data) {
                  let r = document.createElement("canvas"),
                    O = r.getContext("2d");
                  if (O && t.width && t.height) {
                    (r.width = t.width), (r.height = t.height);
                    let u = new ImageData(new Uint8ClampedArray(t.data), t.width, t.height);
                    O.putImageData(u, 0, 0);
                    let g = yield new Promise((N, w) => {
                      r.toBlob((p) => {
                        p ? N(p) : w(new Error("Failed to create blob from image"));
                      }, "image/png");
                    });
                    o.push(g);
                  }
                }
              }
            } catch (l) {
              window.codbi.log("WARNING", `Failed to extract individual image: ${l}`, "AI / ONNX / DONUT");
            }
        }
      } catch (s) {
        window.codbi.log("WARNING", `Image extraction failed: ${s}`, "AI / ONNX / DONUT");
      }
      return o;
    });
  }
};
(d.pdfJsWorkerConfigured = !1),
  (d.registered = window.codbi.registerFunctionality("AI.ONNX.DONUT.QA", d.functionality)),
  A([$.ParamvalueProvider], d, "functionality", 1);
var L = d;
export { L as AI_ONNX_DONUT_QA };
