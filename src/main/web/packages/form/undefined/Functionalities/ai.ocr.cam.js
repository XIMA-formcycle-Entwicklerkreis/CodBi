import { a as X } from "./chunk-BGFHKOW7.js";
import { a as q } from "./chunk-K6ISRTTP.js";
import { a as S } from "./chunk-JL2EL352.js";
import { a as y } from "./chunk-K3A632J4.js";
import { a as Q } from "./chunk-W23DHSE2.js";
import { a as W } from "./chunk-MUWAMKOD.js";
import { f as Y, g as L, h as $ } from "./chunk-RS4WWU7K.js";
var z = Y(Q(), 1);
var w = class w {
  static functionality(e, g) {
    let m = g,
      A = (0, z.getJQuery)(),
      v = y.tsCheck(e.mode, "string").toLowerCase(),
      K = e.processingimagetext ? y.tsCheck(e.processingimagetext, "string") : "Processing...",
      D = e.invalidimagetext
        ? y.tsCheck(e.invalidimagetext, "string")
        : "One or more of the images you selected did not contain the expected text",
      j = document.createElement("div");
    j.style.cssText = "display: flex; justify-content: center; align-items: center; width: 100%;";
    let u = document.createElement("div");
    (u.id = `CodBi_AI_OCR_CAM_Container_${Math.random().toString(36).substr(2, 9)}`),
      u.classList.add("CodBi_AI_OCR_CAM_Container");
    let N = document.createElement("style");
    (N.textContent = `
      .CodBi_AI_OCR_CAM_Container { position: relative ; width: 100% ; max-width: 400px ; display: flex ;
        flex-direction: column ;}

      .CodBi_AI_OCR_CAM_VideoWrapper { position: relative ;}

      .CodBi_AI_OCR_CAM_VideoContainer { position: relative ;}

      .CodBi_AI_OCR_CAM_Container video { width: 100% ; border: 1px solid #ccc ; display: block ;
        box-shadow: 0 0 .5em black ; border: none ;}

      .CodBi_AI_OCR_CAM_CapturedImage { width: 100% ; border: 1px solid #ccc ; display: none ;
        box-shadow: 0 0 .5em black ; border: none ; object-fit: contain ; margin-top: 8px ;}

      .CodBi_AI_OCR_CAM_CapturedImage.visible { display: block ;}

      .CodBi_AI_OCR_CAM_Select { position: absolute ; top: 0 ; left: 0 ; width: 100% ; padding: 8px ; z-index: 10 ;
        box-shadow: 0 0 .5em black ; border-top-left-radius: .5em ; border-top-right-radius: .5em ; border: none ;
        transition: .5s all ;}

      .CodBi_AI_OCR_CAM_Select:hover { background-color: #f0f0f0 ;}

      .CodBi_AI_OCR_CAM_Select:active { background-color: #e0e0e0 ;}

      .CodBi_AI_OCR_CAM_Capture { width: 100% ; padding: 10px ; margin-top: 0 ; border: none ;
        background-color: #007bff ; color: white ; cursor: pointer ; font-size: 16px ; transition: background-color 0.3s ease ;
        box-shadow: 0 0 .5em black ; border-bottom-left-radius: .5em ; border-bottom-right-radius: .5em ;}

      .CodBi_AI_OCR_CAM_Capture:hover { background-color: #0056b3 ;}

      .CodBi_AI_OCR_CAM_Capture:active { background-color: #004085 ; transform: scale( 0.9 );}

      .CodBi_AI_OCR_CAM_Capture:disabled { background-color: #cccccc ; cursor: not-allowed ; opacity: 0.6 ;}`),
      u.appendChild(N);
    let p = document.createElement("video");
    (p.id = `camera-feed-${m.id}`), (p.autoplay = !0), (p.playsInline = !0);
    let c = document.createElement("select");
    (c.id = `camera-select-${m.id}`), (c.style.display = "none"), c.classList.add("CodBi_AI_OCR_CAM_Select");
    let _ = document.createElement("img");
    (_.id = `captured-image-${m.id}`), _.classList.add("CodBi_AI_OCR_CAM_CapturedImage"), (_.alt = "Captured image");
    let V = document.createElement("div");
    V.classList.add("CodBi_AI_OCR_CAM_VideoWrapper");
    let I = document.createElement("div");
    I.classList.add("CodBi_AI_OCR_CAM_VideoContainer"), I.appendChild(c), I.appendChild(p), V.appendChild(I);
    let t = document.createElement("button");
    (t.innerText = "Scannen"), (t.type = "button"), t.classList.add("CodBi_AI_OCR_CAM_Capture");
    let s = document.createElement("canvas");
    (s.id = `camera-canvas-${m.id}`),
      (s.style.cssText = "display: none;"),
      u.appendChild(V),
      u.appendChild(t),
      u.appendChild(_),
      j.appendChild(u),
      m.appendChild(j),
      m.appendChild(s);
    let O = null,
      H = (l) => {
        navigator.mediaDevices
          .getUserMedia({ video: { deviceId: { exact: l } } })
          .then((a) => {
            (O = a),
              (p.srcObject = a),
              window.codbi.log("INFO", "Camera stream started successfully", "AI / TESSERACT");
          })
          .catch((a) => {
            a.name === "OverconstrainedError"
              ? navigator.mediaDevices
                  .getUserMedia({ video: !0 })
                  .then((i) => {
                    (O = i),
                      (p.srcObject = i),
                      window.codbi.log("INFO", "Camera stream started (using default camera)", "AI / TESSERACT");
                  })
                  .catch((i) => {
                    window.codbi.log("ERROR", `Failed to start camera stream: ${i.message}`, "AI / TESSERACT"),
                      (t.disabled = !0);
                  })
              : (window.codbi.log("ERROR", `Failed to start camera stream: ${a.message}`, "AI / TESSERACT"),
                (t.disabled = !0));
          });
      };
    navigator.mediaDevices
      .enumerateDevices()
      .then((l) => {
        let a = l.filter((i) => i.kind === "videoinput");
        if (a.length === 0) {
          window.codbi.log("ERROR", "No camera devices found on this device", "AI / TESSERACT"), (t.disabled = !0);
          return;
        } else t.disabled = !1;
        for (let i of a) {
          let C = document.createElement("option");
          (C.value = i.deviceId), (C.text = i.label || `Camera ${c.options.length + 1}`), c.appendChild(C);
        }
        a.length > 1 && (c.style.display = "block"),
          c.options.length > 0 && H(c.value),
          c.addEventListener("change", () => {
            if (O) for (let i of O.getTracks()) i.stop();
            H(c.value);
          });
      })
      .catch((l) => {
        window.codbi.log("ERROR", `Failed to enumerate camera devices: ${l.message}`, "AI / TESSERACT"),
          (t.disabled = !0);
      });
    let F = [];
    if (v === "extract fields") {
      let l = Object.keys(e).filter((a) => a.startsWith("pattern_"));
      for (let a of l) {
        let i = a.substring(8),
          C = e[a];
        if (i && C) {
          let R = {};
          (R[i] = encodeURIComponent(C.replace(/°/, "^"))), F.push(R);
        }
      }
    }
    let P = F.length > 0 ? JSON.stringify(F) : "",
      G = t.innerText;
    t.addEventListener("click", () => {
      if (!p.srcObject) {
        window.codbi.log("WARNING", "Camera stream is not active", "AI / TESSERACT");
        return;
      }
      let l = s.getContext("2d");
      if (!l) {
        window.codbi.log("ERROR", "Failed to get canvas context", "AI / TESSERACT");
        return;
      }
      (s.width = p.videoWidth),
        (s.height = p.videoHeight),
        l.clearRect(0, 0, s.width, s.height),
        l.drawImage(p, 0, 0, s.width, s.height);
      let a = s.toDataURL("image/png");
      (_.src = a),
        _.classList.add("visible"),
        s.toBlob((i) => {
          if (!i) {
            window.codbi.log("ERROR", "Failed to convert canvas to blob", "AI / TESSERACT");
            return;
          }
          (t.disabled = !0), (t.innerText = K), window.codbi.injectLoadingAnim(t);
          let C = () => {
              window.codbi.removeLoaderAnim(t), (t.disabled = !1), (t.innerText = G);
            },
            R = new FormData();
          R.append("camera_capture.png", i, "camera_capture.png");
          let E = { "X-Mode": e.mode };
          if (
            (v !== "print" &&
              ((E["X-Pattern"] = encodeURIComponent(e.pattern ? e.pattern.replace(/°/, "^") : "")),
              (E["X-FieldPatterns"] = P.length > 0 ? encodeURIComponent(P) : "")),
            e.regexflags && (E["X-RegexFlags"] = y.tsCheck(e.regexflags, "string")),
            e.preprocess)
          ) {
            let r = y.tsCheck(e.preprocess, "string").toLowerCase();
            E["X-Preprocess"] = r === "true" || r === "1" ? "true" : "false";
          }
          A.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
            type: "POST",
            data: R,
            processData: !1,
            contentType: !1,
            cache: !1,
            headers: E,
            success: (r) => {
              var T, k, U;
              if (v === "print") {
                let h = ((T = g.parentElement) == null ? void 0 : T.parentElement) || null;
                if (h) {
                  let x = X.tsCheck(h.querySelector(".CodBi_AI_Tesseract_Receiver"), HTMLTextAreaElement);
                  if (x) {
                    let n = typeof r == "string" ? r : r.text || JSON.stringify(r);
                    x.value = n.replace(
                      /\\n/g,
                      `
`,
                    );
                  } else
                    window.codbi.log(
                      "INFO",
                      `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${g.parentElement.parentElement.getAttribute("id")}.`,
                      "AI / TESSERACT",
                    );
                }
              }
              if (v === "extract fields" && typeof r == "object" && r !== null) {
                let h =
                  ((U = (k = g.parentElement) == null ? void 0 : k.parentElement) == null ? void 0 : U.parentElement) ||
                  null;
                if (h) {
                  let x = h.querySelectorAll(".CodBi_AI_OCR_Receiver");
                  for (let n of x) {
                    let d = n.getAttribute("data-cb-Field").toLowerCase();
                    if (d) {
                      let b = e.separator ? e.separator : ",",
                        f = [];
                      for (let o in r)
                        if (Object.prototype.hasOwnProperty.call(r, o)) {
                          let B = r[o];
                          if (B && typeof B == "object" && Object.prototype.hasOwnProperty.call(B, d)) {
                            let M = B[d];
                            Array.isArray(M) ? f.push(...M) : typeof M == "string" && f.push(M);
                          }
                        }
                      if (f.length > 0) {
                        let o = f.join(b);
                        "value" in n ? (n.value = o) : (n.textContent = o);
                      }
                    }
                  }
                }
              }
              if (v === "verify")
                if (Object.values(r).some((n) => n === !1)) {
                  if ((A(g).error(D), !document.getElementById("CodBi_AI_OCR_ManualVerify_Styles"))) {
                    let o = document.createElement("style");
                    (o.id = "CodBi_AI_OCR_ManualVerify_Styles"),
                      (o.textContent = `
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
                      document.head.appendChild(o);
                  }
                  let n = document.createElement("div");
                  (n.className = "CodBi_AI_OCR_ManualVerify"),
                    (n.style.display = "flex"),
                    (n.style.alignItems = "center"),
                    (n.style.marginTop = "8px"),
                    (n.style.gap = "8px");
                  let d = document.createElement("input");
                  (d.type = "checkbox"),
                    (d.id = `manual-verify-${m.id}`),
                    (d.className = "CodBi_AI_OCR_ManualVerify_Checkbox");
                  let b = document.createElement("label");
                  (b.htmlFor = d.id),
                    (b.textContent = e.wrongfilemessage
                      ? e.wrongfilemessage
                      : "The content is not as expected. You may manually verify that it is the correct one by clicking the checkbox"),
                    (b.style.marginBottom = "0"),
                    n.appendChild(d),
                    n.appendChild(b);
                  let f = m.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
                  for (let o = 0; o < f.length; o++) f[o].remove();
                  m.insertAdjacentElement("afterend", n),
                    d.addEventListener("change", () => {
                      d.checked ? A(g).error("") : A(g).error(D);
                    });
                } else A(g).error("");
              C();
            },
            error: (r, T, k) => {
              throw (C(), new q(`\u274C Tesseract AI OCR request failed with status (${T}) due to: ${k}`));
            },
          });
        });
    });
  }
};
(w.registered = window.codbi.registerFunctionality("AI.OCR.CAM", w.functionality)),
  L(
    [W.ParamvalueProvider, $(0, S.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")), $(0, S.PRE(S.stdExp.url, "script"))],
    w,
    "functionality",
    1,
  );
var J = w;
export { J as AI_OCR_CAM };
