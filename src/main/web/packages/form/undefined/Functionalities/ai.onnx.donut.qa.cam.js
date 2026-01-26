import { a as I } from "./chunk-W23DHSE2.js";
import { a as f } from "./chunk-MUWAMKOD.js";
import { f as D, g as w } from "./chunk-RS4WWU7K.js";
var C = D(I(), 1);
var y = window.LogLevel || { ERROR: "ERROR", WARNING: "WARN", INFO: "INFO" },
  m = class m {
    static functionality(T, p) {
      let s = p,
        h = (0, C.getJQuery)(),
        _ = document.createElement("div");
      _.style.cssText = "display: flex; justify-content: center; align-items: center; width: 100%;";
      let l = document.createElement("div");
      (l.id = `CodBi_AI_ONNX_DONUT_QA_CAM_Container_${Math.random().toString(36).substr(2, 9)}`),
        l.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Container");
      let b = document.createElement("style");
      (b.textContent = `
      .CodBi_AI_ONNX_DONUT_QA_CAM_Container { position: relative ; width: 100% ; max-width: 400px ; display: flex ;
        flex-direction: column ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Container video { width: 100% ; border: 1px solid #ccc ; display: block ;
        box-shadow: 0 0 .5em black ; border: none ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select { position: absolute ; top: 0 ; left: 0 ; width: 100% ; padding: 8px ; z-index: 10 ;
        box-shadow: 0 0 .5em black ; border-top-left-radius: .5em ; border-top-right-radius: .5em ; border: none ;
        transition: .5s all ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select:hover { background-color: #f0f0f0 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select:active { background-color: #e0e0e0 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture { width: 100% ; padding: 10px ; margin-top: 0 ; border: none ;
        background-color: #007bff ; color: white ; cursor: pointer ; font-size: 16px ; transition: background-color 0.3s ease ;
        box-shadow: 0 0 .5em black ; border-bottom-left-radius: .5em ; border-bottom-right-radius: .5em ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:hover { background-color: #0056b3 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:active { background-color: #004085 ; transform: scale( 0.9 );}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:disabled { background-color: #cccccc ; cursor: not-allowed ; opacity: 0.6 ;}`),
        l.appendChild(b);
      let a = document.createElement("video");
      (a.id = `camera-feed-${s.id}`), (a.autoplay = !0), (a.playsInline = !0);
      let n = document.createElement("select");
      (n.id = `camera-select-${s.id}`),
        (n.style.display = "none"),
        n.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Select");
      let d = document.createElement("button");
      (d.innerText = "Scannen"), (d.type = "button"), d.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Capture");
      let N = document.createElement("canvas");
      (N.id = `camera-canvas-${s.id}`),
        (N.style.cssText = "display: none;"),
        l.appendChild(n),
        l.appendChild(a),
        l.appendChild(d),
        _.appendChild(l),
        s.appendChild(_),
        s.appendChild(N);
      let O = null,
        g = (r) => {
          navigator.mediaDevices
            .getUserMedia({ video: { deviceId: { exact: r } } })
            .then((o) => {
              (O = o),
                (a.srcObject = o),
                window.codbi.log("INFO", "Camera stream started successfully.", "AI / ONNX / DONUT");
            })
            .catch((o) => {
              o.name === "OverconstrainedError"
                ? navigator.mediaDevices
                    .getUserMedia({ video: !0 })
                    .then((e) => {
                      (O = e),
                        (a.srcObject = e),
                        window.codbi.log("INFO", "Camera stream started (using default camera).", "AI / ONNX / DONUT");
                    })
                    .catch((e) => {
                      console.error(e),
                        window.codbi.log("ERROR", `Failed to start camera stream: ${e.message}`, "AI / ONNX / DONUT"),
                        (d.disabled = !0);
                    })
                : (window.codbi.log("ERROR", `Failed to start camera stream: ${o.message}`, "AI / ONNX / DONUT"),
                  (d.disabled = !0));
            });
        };
      navigator.mediaDevices
        .enumerateDevices()
        .then((r) => {
          let o = r.filter((e) => e.kind === "videoinput");
          if (o.length === 0) {
            window.codbi.log("ERROR", "No camera devices found on this device.", "AI / ONNX / DONUT"),
              (d.disabled = !0);
            return;
          } else d.disabled = !1;
          for (let e of o) {
            let u = document.createElement("option");
            (u.value = e.deviceId), (u.text = e.label || `Camera ${n.options.length + 1}`), n.appendChild(u);
          }
          o.length > 1 && (n.style.display = "block"),
            n.options.length > 0 && g(n.value),
            n.addEventListener("change", () => {
              if (O) for (let e of O.getTracks()) e.stop();
              g(n.value);
            });
        })
        .catch((r) => {
          window.codbi.log("ERROR", `Failed to enumerate camera devices: ${r.message}`, "AI / ONNX / DONUT"),
            (d.disabled = !0);
        }),
        d.addEventListener("click", () => {
          if (!a.srcObject) {
            window.codbi.log("WARNING", "Camera stream is not active.", "AI / ONNX / DONUT");
            return;
          }
          let r = N.getContext("2d");
          if (!r) {
            window.codbi.log("ERROR", "Failed to get canvas context.", "AI / ONNX / DONUT");
            return;
          }
          (N.width = a.videoWidth),
            (N.height = a.videoHeight),
            r.drawImage(a, 0, 0),
            N.toBlob((o) => {
              if (!o) {
                window.codbi.log("ERROR", "Failed to convert canvas to blob.", "AI / ONNX / DONUT");
                return;
              }
              let e = {},
                u = s.parentElement.parentElement.parentElement.querySelectorAll(".AI_ONNX_DONUT_QA_Question");
              for (let t of u) {
                let i = t.id,
                  c = t.getAttribute("data-cb-DonutQuestion");
                i && c
                  ? (e[`X-Question-${i}`] = c)
                  : (i ||
                      window.codbi.log(
                        "WARNING",
                        `Question element missing id attribute in: ${t.outerHTML}`,
                        "AI / ONNX / DONUT",
                      ),
                    c ||
                      window.codbi.log(
                        "WARNING",
                        `Question element with id "${i}" missing data-cb-DonutQuestion attribute in: ${t.outerHTML}`,
                        "AI / ONNX / DONUT",
                      ));
              }
              Object.keys(e).length === 0 &&
                window.codbi.log(
                  "WARNING",
                  `No question elements found with class AI_ONNX_DONUT_QA_Question in container "${s.id}".`,
                  "AI / ONNX / DONUT",
                );
              let A = new FormData();
              A.append("camera_capture.png", o, "camera_capture.png"),
                h.ajax({
                  url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_vQA`,
                  type: "POST",
                  data: A,
                  dataType: "json",
                  processData: !1,
                  contentType: !1,
                  cache: !1,
                  beforeSend: (t) => {
                    for (let i of Object.keys(e)) t.setRequestHeader(i, e[i]);
                  },
                  success: (t) => {
                    if (t.error) {
                      window.codbi.log("ERROR", `ONNX DONUT Error: ${t.error}`, "AI / ONNX / DONUT");
                      return;
                    }
                    for (let i in t)
                      for (let c in t[i])
                        p.parentElement.parentElement.parentElement.querySelector(`#${c}`).value = t[i][c];
                    window.codbi.log(
                      "INFO",
                      `ONNX DONUT Request successful with response: "${JSON.stringify(t)}"`,
                      "AI / ONNX / DONUT",
                    );
                  },
                  error: (t, i, c) => {
                    window.codbi.log(
                      "ERROR",
                      `ONNX DONUT Request failed with status "${i}" cause "${c}"`,
                      "AI / ONNX / DONUT",
                    );
                  },
                });
            });
        });
    }
  };
(m.registered = window.codbi.registerFunctionality("AI.ONNX.DONUT.QA.CAM", m.functionality)),
  w([f.ParamvalueProvider], m, "functionality", 1);
var v = m;
export { v as AI_ONNX_DONUT_QA_CAM };
