import { a as ie } from "./chunk-HI24USOS.js";
import { a as Ce } from "./chunk-N3EQ4ZW6.js";
import { a as oe } from "./chunk-7ZUEWSHL.js";
import { a as te } from "./chunk-PSEWTT4Z.js";
import { a as W } from "./chunk-M2SNI3IN.js";
import { a as Me } from "./chunk-4JLAI42Q.js";
import { a as E } from "./chunk-KEJSWGMR.js";
import { a as ee } from "./chunk-SEUS6MHP.js";
import { a as Q } from "./chunk-CDLTIEKC.js";
import { f as pe, g as me, h as j, o as q, p as Ae } from "./chunk-UTJJRBTX.js";
var Le = pe(Me(), 1);
var $ = pe(Ce(), 1);
var p = class p {
  static functionality(a, A) {
    var ue;
    let h = (0, Le.getJQuery)(),
      d = A;
    (d.readOnly = !0), (d.style.display = "none");
    let l = a.aihint != null ? String(a.aihint) : "\u2728 AI-Generated";
    p.ensureChatBubbleStyles();
    let i = document.createElement("div");
    (i.className = "LLAMA_Chat_Container"),
      a.llamabubble != null && i.style.setProperty("--llama-bubble-bg", String(a.llamabubble)),
      a.userbubble != null && i.style.setProperty("--user-bubble-bg", String(a.userbubble)),
      a.maxchatwindowheight != null && (i.style.maxHeight = `${String(a.maxchatwindowheight)}px`),
      (ue = d.parentElement) == null || ue.insertBefore(i, d.nextSibling);
    let r = A.parentElement;
    for (
      ;
      r &&
      r !== document.body &&
      !(r.querySelector(".AI_ONNX_LLAMA_Chat_Input") && r.querySelector(".AI_ONNX_LLAMA_Chat_Send"));
    )
      r = r.parentElement;
    if (!r || r === document.body) {
      window.codbi.log(
        "ERROR",
        "Could not find a container with .AI_ONNX_LLAMA_Chat_Input and .AI_ONNX_LLAMA_Chat_Send elements. Ensure these elements exist within a common ancestor of the chat display textarea.",
        "AI / LLAMA / CHAT",
      );
      return;
    }
    let g = ie.tsCheck(
        oe.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Input")),
        [new E(HTMLInputElement), new E(HTMLTextAreaElement)],
        'Did you forget to tag the chat input element with CSS-Class "AI_ONNX_LLAMA_Chat_Input"?',
      ),
      C = E.tsCheck(oe.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Send")), HTMLButtonElement),
      b = E.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Stop"), HTMLButtonElement),
      f = E.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Upload"), HTMLInputElement),
      K = E.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Thinking"), HTMLInputElement),
      H = E.tsCheck(r.querySelector(".AI_ONNX_LLAMA_Chat_Internet"), HTMLInputElement),
      J = !1,
      D = [],
      m = null,
      G = null,
      be = crypto.randomUUID(),
      y = [],
      ae = (n) => {
        let e = n.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1");
        return (
          (e = e.replace(/https?:\/\/[^\s)]+/g, "")),
          (e = e.replace(/ {2,}/g, " ").trim()),
          e.length > 150 && (e = `${e.substring(0, 147)}...`),
          e
        );
      },
      se = 6,
      fe = () => {
        var v, X, s, o;
        if (y.length <= se) return y;
        let n = y.length - se,
          e = y.slice(0, n),
          _ = y.slice(n),
          M = [];
        for (let t = 0; t < e.length; t += 2) {
          let w = (X = (v = e[t]) == null ? void 0 : v.content) != null ? X : "",
            u = (o = (s = e[t + 1]) == null ? void 0 : s.content) != null ? o : "",
            L = w.length > 120 ? `${w.substring(0, 117)}...` : w,
            x = u.length > 120 ? `${u.substring(0, 117)}...` : u;
          M.push(`- User: ${L}  Assistant: ${x}`);
        }
        return [
          {
            role: "system",
            content: `Summary of earlier conversation:
${M.join(`
`)}`,
          },
          ..._,
        ];
      },
      R = null,
      B = null,
      we = () => {
        if (B) return B;
        let n = document.createElement("div");
        n.style.cssText =
          "position:absolute;top:6px;right:6px;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.72);color:#fff;font-size:12px;font-weight:600;padding:6px 14px;text-align:center;pointer-events:none;z-index:1000;border-radius:6px;backdrop-filter:blur(2px);transition:opacity 0.3s ease;max-width:60%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;";
        let e = i.parentElement;
        return (
          e && (window.getComputedStyle(e).position === "static" && (e.style.position = "relative"), e.appendChild(n)),
          (B = n),
          n
        );
      },
      ye = (n) => {
        R && (clearTimeout(R), (R = null));
        let e = we();
        (e.textContent = n), (e.style.display = "flex"), (e.style.opacity = "1");
      },
      le = () => {
        B &&
          ((B.style.opacity = "0"),
          (R = setTimeout(() => {
            B && (B.style.display = "none"), (R = null);
          }, 400)));
      },
      _e = (n) => {
        n && (ye(n), (n.includes("\u25B6") || n.includes("\u26A0")) && (R = setTimeout(le, 2500)));
      },
      V = (n) => {
        let e = [],
          _ = (s) => `\0LINK${s}\0`;
        return n
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi, (s, o, t) => {
            let w = e.length;
            return e.push(`<a href="${t}" target="_blank" rel="noopener noreferrer">${o}</a>`), _(w);
          })
          .replace(/https?:\/\/[^\s<>&"'\x00)\]]+/gi, (s) => {
            let o = s;
            try {
              o = new URL(s).hostname.replace(/^www\./, "");
            } catch (w) {}
            let t = e.length;
            return e.push(`<a href="${s}" target="_blank" rel="noopener noreferrer">${o}</a>`), _(t);
          })
          .replace(/\x00LINK(\d+)\x00/g, (s, o) => `<span class="LLAMA_Chat_SourceBadge">${e[Number(o)]}</span>`);
      },
      I = (n, e) => {
        let _ = document.createElement("div");
        _.className = `LLAMA_Chat_Row LLAMA_Chat_Row--${e}`;
        let M = document.createElement("div");
        return (
          (M.className = `LLAMA_Chat_Bubble LLAMA_Chat_Bubble--${e}`),
          (M.innerHTML = V(n)),
          _.appendChild(M),
          i.appendChild(_),
          (i.scrollTop = i.scrollHeight),
          M
        );
      },
      ce = (n) => {
        n.startsWith("You: ")
          ? I(n.substring(5), "user")
          : n.startsWith("Qwen3: ")
            ? I(n.substring(7), "llama")
            : I(n, "system");
      },
      N = (n) => {
        var e;
        m && ((e = m.parentElement) == null || e.remove(), (m = null)), ce(n);
      };
    f &&
      f.addEventListener("change", () => {
        let n = f.files;
        if (n && n.length > 0) {
          (D = Array.from(n)), (y.length = 0);
          let e = D.map((_) => _.name).join(", ");
          ce(`\u{1F4CE} ${D.length} file(s) attached: ${e}`),
            window.codbi.log("INFO", `Chat files attached: ${e}`, "AI / LLAMA / CHAT");
        } else D = [];
      });
    let de = () =>
      q(this, null, function* () {
        let n = g.value.trim();
        if (!(!n || J)) {
          I(n, "user"),
            (g.value = ""),
            y.push({ role: "user", content: n }),
            (J = !0),
            (C.disabled = !0),
            "disabled" in g && (g.disabled = !0),
            (m = I("", "llama")),
            (m.innerHTML =
              '<div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span class="LLAMA_ThinkingLabel">Thinking...</span>'),
            m.classList.add("LLAMA_Chat_Bubble--thinking");
          try {
            p.ensurePdfJsWorkerConfigured();
            let e = new FormData(),
              _ = a.maxpages ? Number(a.maxpages) : 5,
              M = a.maxpixelsize != null ? Number(a.maxpixelsize) : p.DEFAULT_MAX_PIXELS;
            for (let s of D)
              if (s.type === "application/pdf") {
                let o = yield p.processPdfFile(s, _);
                for (let t = 0; t < o.length; t++) {
                  let w = `${s.name.replace(".pdf", "")}_page_${t + 1}.png`,
                    u = new File([o[t]], w, { type: "image/png" });
                  if (M > 0) {
                    let x = yield p.downscaleImageIfNeeded(u, M);
                    u = x instanceof File ? x : new File([x], w, { type: x.type || "image/png" });
                  }
                  let L = yield p.blobToDataUrl(u);
                  e.append(`codbi-base64:${w}`, L);
                }
              } else if (M > 0) {
                let o = yield p.downscaleImageIfNeeded(s, M),
                  t = yield p.blobToDataUrl(o);
                window.codbi.log(
                  "INFO",
                  `Appending '${s.name}' as base64 param: ${Math.round(t.length / 1024)} KB`,
                  "AI / LLAMA / CHAT",
                ),
                  e.append(`codbi-base64:${s.name}`, t);
              } else {
                let o = yield p.blobToDataUrl(s);
                window.codbi.log(
                  "INFO",
                  `Appending '${s.name}' as base64 param (no client downscale): ${Math.round(o.length / 1024)} KB`,
                  "AI / LLAMA / CHAT",
                ),
                  e.append(`codbi-base64:${s.name}`, o);
              }
            (D = []), f && (f.value = "");
            let T = {};
            a.rotate && a.rotate !== "0" && a.rotate !== 0 && (T["X-Rotate"] = a.rotate.toString()),
              (T["X-Question-chat"] = btoa(unescape(encodeURIComponent(n.replace(/[\r\n]+/g, " ").trim())))),
              (T["X-Stream"] = "true"),
              (T["X-Session-Id"] = be),
              (T["X-Chat-History"] = btoa(unescape(encodeURIComponent(JSON.stringify(fe()))))),
              K && (T["X-Thinking"] = K.checked ? "true" : "false"),
              H && (T["X-Search"] = H.checked ? "true" : "false");
            let v = () => {
                (G = null),
                  (J = !1),
                  (C.disabled = !1),
                  b && (b.disabled = !0),
                  "disabled" in g && (g.disabled = !1),
                  le(),
                  g.focus();
              },
              X = (s) => {
                let o = "",
                  t = null,
                  w = setInterval(() => {
                    h.ajax({
                      url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
                      type: "POST",
                      dataType: "json",
                      processData: !1,
                      contentType: !1,
                      cache: !1,
                      beforeSend: (u) => {
                        u.setRequestHeader("X-Stream-Poll", s);
                      },
                      success: (u) => {
                        var S, F, O, P, z, Y, he;
                        if ((_e(u.resourceStatus), u.error && u.done === void 0)) {
                          clearInterval(w), N(`Qwen3: \u26A0 ${u.error}`), v();
                          return;
                        }
                        let L = (S = u.text) != null ? S : "";
                        if (/CALL:/.test(L) && !u.done) {
                          let c = L.match(/CALL:search\((?:\s*)query(?:\s*)=(?:\s*)['"]([^'"]*)['"]\s*\)/);
                          if (
                            (t && ((F = t.parentElement) == null || F.remove(), (t = null)),
                            m && ((O = m.parentElement) == null || O.remove(), (m = null)),
                            c && !i.querySelector(".LLAMA_SearchIndicator"))
                          ) {
                            let k = c[1],
                              U = document.createElement("div");
                            (U.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama"),
                              (U.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">Searching the internet for \u201C${k}\u201D\u2026</span></div>`),
                              i.appendChild(U),
                              (i.scrollTop = i.scrollHeight);
                          }
                          o = "";
                          return;
                        }
                        if (u.searching && L.length === 0) {
                          if (!i.querySelector(".LLAMA_SearchIndicator")) {
                            t && ((P = t.parentElement) == null || P.remove(), (t = null)),
                              m && ((z = m.parentElement) == null || z.remove(), (m = null));
                            let c = (Y = u.searchQuery) != null ? Y : "",
                              k = document.createElement("div");
                            (k.className = "LLAMA_Chat_Row LLAMA_Chat_Row--llama"),
                              (k.innerHTML = `<div class="LLAMA_Chat_Bubble LLAMA_Chat_Bubble--llama LLAMA_SearchIndicator"><div class="CodBiLoader_Spinner LLAMA_SearchSpinner"></div><span class="LLAMA_SearchLabel">Searching the internet${c ? ` for \u201C${c}\u201D` : ""}\u2026</span></div>`),
                              i.appendChild(k),
                              (i.scrollTop = i.scrollHeight);
                          }
                          o = "";
                          return;
                        }
                        if (L.length > 0 && L.length < o.length) {
                          let c = i.querySelector(".LLAMA_SearchIndicator");
                          c != null && c.parentElement && c.parentElement.remove(), (o = ""), (t = I(L, "llama"));
                          return;
                        }
                        let x = u.thinking;
                        if (x && L.length === 0 && !u.done && m) {
                          let c = m.querySelector(".LLAMA_LiveReasoningContent");
                          if (
                            (c ||
                              (m.classList.remove("LLAMA_Chat_Bubble--thinking"),
                              (m.innerHTML =
                                '<details class="LLAMA_Chat_Thinking" open><summary style="display:flex;align-items:center;gap:6px"><div class="CodBiLoader_Spinner LLAMA_ThinkingSpinner"></div><span>Reasoning\u2026</span></summary><div class="LLAMA_Chat_ThinkingContent LLAMA_LiveReasoningContent"></div></details>'),
                              (c = m.querySelector(".LLAMA_LiveReasoningContent"))),
                            c)
                          ) {
                            let k = c.scrollHeight - c.scrollTop - c.clientHeight < 40;
                            (c.innerHTML = V(x)), k && ((c.scrollTop = c.scrollHeight), (i.scrollTop = i.scrollHeight));
                          }
                          return;
                        }
                        if (L.length > o.length)
                          if (((o = L), m))
                            (he = m.parentElement) == null || he.remove(), (m = null), (t = I(L, "llama"));
                          else if (t) (t.innerHTML = V(L)), (i.scrollTop = i.scrollHeight);
                          else {
                            let c = i.querySelector(".LLAMA_SearchIndicator");
                            c != null && c.parentElement && c.parentElement.remove(), (t = I(L, "llama"));
                          }
                        if (u.done) {
                          clearInterval(w);
                          let c = i.querySelector(".LLAMA_SearchIndicator");
                          if ((c != null && c.parentElement && c.parentElement.remove(), u.error))
                            t
                              ? ((t.textContent = `\u26A0 ${u.error}`), t.classList.add("LLAMA_Chat_Bubble--error"))
                              : N(`Qwen3: \u26A0 ${u.error}`),
                              y.pop();
                          else if (o) {
                            let k = H ? H.checked : !0;
                            y.push({ role: "assistant", content: k ? ae(o) : o });
                            let U = u.thinking;
                            if (U && t) {
                              let Z = document.createElement("details");
                              Z.className = "LLAMA_Chat_Thinking";
                              let ge = document.createElement("summary");
                              (ge.textContent = "Show reasoning"), Z.appendChild(ge);
                              let re = document.createElement("div");
                              (re.className = "LLAMA_Chat_ThinkingContent"),
                                (re.innerHTML = V(U)),
                                Z.appendChild(re),
                                t.appendChild(Z);
                            }
                            l && t && p.attachAiHintToBubble(t, l);
                          }
                          v();
                        }
                      },
                      error: () => {
                        clearInterval(w), N("Qwen3: \u26A0 Stream polling failed."), v();
                      },
                    });
                  }, 250);
              };
            h.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
              type: "POST",
              data: e,
              dataType: "json",
              processData: !1,
              contentType: !1,
              cache: !1,
              beforeSend: (s) => {
                for (let o of Object.keys(T)) s.setRequestHeader(o, T[o]);
              },
              success: (s) => {
                var u, L, x;
                if (s.error) {
                  N(`Qwen3: \u26A0 ${s.error}`), y.pop(), v();
                  return;
                }
                if (s.streamId) {
                  (G = s.streamId),
                    b && (b.disabled = !1),
                    window.codbi.log("INFO", `Stream started: ${s.streamId}`, "AI / LLAMA / CHAT"),
                    X(s.streamId);
                  return;
                }
                let o = Object.keys(s);
                if (o.length === 0) {
                  N("Qwen3: (no response received)"), v();
                  return;
                }
                let t;
                if (o.length === 1) {
                  let S = s[o[0]],
                    F = Object.keys(S || {});
                  t = (u = S == null ? void 0 : S.chat) != null ? u : F.length > 0 ? String(S[F[0]]) : "(no answer)";
                  let O = H ? H.checked : !0;
                  y.push({ role: "assistant", content: O ? ae(t) : t });
                } else {
                  let S = [];
                  for (let O of o) {
                    let P = s[O],
                      z = Object.keys(P || {}),
                      Y =
                        (L = P == null ? void 0 : P.chat) != null ? L : z.length > 0 ? String(P[z[0]]) : "(no answer)";
                    S.push(`\u{1F4C4} ${O}:
${Y}`);
                  }
                  t = S.join(`

`);
                  let F = H ? H.checked : !0;
                  y.push({ role: "assistant", content: F ? ae(t) : t });
                }
                m && ((x = m.parentElement) == null || x.remove(), (m = null));
                let w = I(t, "llama");
                l && p.attachAiHintToBubble(w, l), v();
              },
              error: (s, o, t) => {
                N(`Qwen3: \u26A0 Request failed (${o}): ${t}`),
                  window.codbi.log("ERROR", `Chat request failed: ${o} \u2014 ${t}`, "AI / LLAMA / CHAT"),
                  y.pop(),
                  v();
              },
            });
          } catch (e) {
            N(`Qwen3: \u26A0 Error: ${e}`), y.pop(), (J = !1), (C.disabled = !1), "disabled" in g && (g.disabled = !1);
          }
        }
      });
    C.addEventListener("click", () => {
      de();
    }),
      b &&
        ((b.disabled = !0),
        b.addEventListener("click", () => {
          if (!G) return;
          let n = G;
          window.codbi.log("INFO", `Stop requested for stream: ${n}`, "AI / LLAMA / CHAT"),
            h.ajax({
              url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
              type: "POST",
              dataType: "json",
              processData: !1,
              contentType: !1,
              cache: !1,
              beforeSend: (e) => {
                e.setRequestHeader("X-Stream-Poll", n), e.setRequestHeader("X-Stream-Stop", "true");
              },
            });
        })),
      g.addEventListener("keydown", (n) => {
        let e = g instanceof HTMLTextAreaElement;
        n.key === "Enter" && (e ? n.ctrlKey : !n.shiftKey) && (n.preventDefault(), de());
      }),
      I("\u{1F4AC} Qwen3 Chat ready. Attach file(s) and type your question.", "system"),
      window.codbi.log("INFO", "Llama Chat functionality initialized", "AI / LLAMA / CHAT");
  }
  static ensurePdfJsWorkerConfigured() {
    p.pdfJsWorkerConfigured ||
      (($.GlobalWorkerOptions.workerSrc = `${window.codbi.baseURL}plugin?name=Resource&Path=/com/github/xima_formcycle_entwicklerkreis/fc/plugin/codbi/pdf.worker.min.js`),
      (p.pdfJsWorkerConfigured = !0),
      window.codbi.log("INFO", `PDF.js worker configured: ${$.GlobalWorkerOptions.workerSrc}`, "AI / LLAMA / CHAT"));
  }
  static ensureChatBubbleStyles() {
    if (document.querySelector("#LLAMA_Chat_Bubble_Styles")) return;
    let a = document.createElement("style");
    (a.id = "LLAMA_Chat_Bubble_Styles"),
      (a.textContent = `
      .LLAMA_Chat_Container {
        --user-bubble-bg: #0b93f6 ;
        --llama-bubble-bg: #e5e5ea ;
        display: flex ; flex-direction: column ; gap: 10px ; padding: 12px ;
        overflow-y: auto ; min-height: 120px ; max-height: 500px ;
        border: 1px solid #d0d0d0 ; border-radius: 8px ; background: #f5f5f5 ;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif ;
        font-size: 14px ; line-height: 1.45 ;
      }
      .LLAMA_Chat_Row { display: flex ; }
      .LLAMA_Chat_Row--user  { justify-content: flex-end ; }
      .LLAMA_Chat_Row--llama { justify-content: flex-start ; }
      .LLAMA_Chat_Row--system { justify-content: center ; }
      .LLAMA_Chat_Bubble {
        max-width: 75% ; padding: 10px 14px ; border-radius: 16px ;
        word-wrap: break-word ; white-space: pre-wrap ; position: relative ;
        box-shadow: 0 0 .25em black ;
      }
      .LLAMA_Chat_Bubble--user {
        background: var(--user-bubble-bg) ; color: #fff ;
        border-bottom-right-radius: 4px ;
      }
      .LLAMA_Chat_Bubble--llama {
        background: var(--llama-bubble-bg) ; color: #1c1c1e ;
        border-bottom-left-radius: 4px ;
      }
      .LLAMA_Chat_Bubble--system {
        background: transparent ; color: #8e8e93 ;
        font-size: 12px ; font-style: italic ; text-align: center ;
      }
      .LLAMA_Chat_Bubble--thinking {
        opacity: 0.7 ; font-style: italic ;
        display: flex ; align-items: center ; gap: 8px ;
      }
      .LLAMA_ThinkingSpinner {
        width: 20px ; height: 20px ; flex-shrink: 0 ;
      }
      .LLAMA_ThinkingSpinner::before {
        display: none ;
      }
      .LLAMA_ThinkingLabel {
        line-height: 20px ;
      }
      .LLAMA_Chat_Bubble--error {
        background: #ffe0e0 ; color: #c00 ;
      }
      .LLAMA_SearchIndicator {
        display: flex ; align-items: center ; gap: 8px ;
        opacity: 0.85 ; font-style: italic ; font-size: 13px ;
        background: #f0f4ff ; border: 1px dashed #b0c4de ;
      }
      .LLAMA_SearchLabel { color: #3a6ea5 ; }
      .LLAMA_SearchSpinner {
        width: 20px ; height: 20px ; flex-shrink: 0 ;
      }
      .LLAMA_SearchSpinner::before {
        display: none ;
      }
      .LLAMA_Chat_Thinking {
        margin-top: 10px ; border-top: 1px solid rgba(0,0,0,0.1) ;
        padding-top: 6px ; font-size: 12px ;
      }
      .LLAMA_Chat_Thinking summary {
        cursor: pointer ; color: #666 ; font-style: italic ;
        user-select: none ; font-size: 11px ;
      }
      .LLAMA_Chat_Thinking summary:hover { color: #333 ; }
      .LLAMA_Chat_ThinkingContent {
        margin-top: 6px ; padding: 8px ; background: rgba(0,0,0,0.04) ;
        border-radius: 6px ; white-space: pre-wrap ; word-break: break-word ;
        color: #555 ; font-size: 12px ; line-height: 1.5 ;
        max-height: 300px ; overflow-y: auto ;
      }
      .LLAMA_Chat_AiHint {
        display: block ; margin-top: 4px ; font-size: 10px ;
        color: rgba(0,0,0,0.35) ; text-align: right ; user-select: none ;
      }
      .LLAMA_Chat_Bubble a {
        color: inherit ; text-decoration: underline ;
        word-break: break-all ;
      }
      .LLAMA_Chat_Bubble--user a {
        color: #fff ;
      }
      .LLAMA_Chat_Bubble--llama a {
        color: #0b6abf ;
      }
      .LLAMA_Chat_Bubble a:hover {
        text-decoration-thickness: 2px ;
      }
      .LLAMA_Chat_SourceBadge {
        display: inline-flex ; align-items: center ;
        padding: 2px 10px ; border-radius: 12px ;
        background: rgba(11,106,191,0.1) ; font-size: 12px ;
        transition: background 0.15s ;
      }
      .LLAMA_Chat_SourceBadge:hover {
        background: rgba(11,106,191,0.2) ;
      }
      .LLAMA_Chat_SourceBadge a {
        color: #0b6abf ; text-decoration: none ; word-break: normal ;
      }
      .LLAMA_Chat_SourceBadge a:hover {
        text-decoration: underline ;
      }`),
      document.head.appendChild(a);
  }
  static attachAiHintToBubble(a, A) {
    let h = a.querySelector(".LLAMA_Chat_AiHint");
    h && h.remove();
    let d = document.createElement("span");
    (d.className = "LLAMA_Chat_AiHint"), (d.textContent = A), a.appendChild(d);
  }
  static canvasToFile(a, A) {
    let d = a.toDataURL("image/png").split(",")[1],
      l = atob(d),
      i = new Uint8Array(l.length);
    for (let r = 0; r < l.length; r++) i[r] = l.charCodeAt(r);
    return new File([i.buffer], A, { type: "image/png" });
  }
  static blobToDataUrl(a) {
    return new Promise((A, h) => {
      let d = new FileReader();
      (d.onload = () => A(d.result)), (d.onerror = h), d.readAsDataURL(a);
    });
  }
  static downscaleImageIfNeeded(a, A) {
    return q(this, null, function* () {
      return new Promise((h, d) => {
        let l = new Image();
        (l.onload = () => {
          let i = l.width * l.height;
          if (i <= A) {
            URL.revokeObjectURL(l.src), h(a);
            return;
          }
          let r = Math.sqrt(A / i),
            g = Math.max(28, Math.round(l.width * r)),
            C = Math.max(28, Math.round(l.height * r));
          window.codbi.log(
            "INFO",
            `Downscaling ${a.name}: ${l.width}\xD7${l.height} \u2192 ${g}\xD7${C}`,
            "AI / LLAMA / CHAT",
          );
          let b = document.createElement("canvas");
          (b.width = g), (b.height = C);
          let f = b.getContext("2d");
          if (!f) {
            URL.revokeObjectURL(l.src), h(a);
            return;
          }
          f.drawImage(l, 0, 0, g, C), URL.revokeObjectURL(l.src), h(p.canvasToFile(b, a.name));
        }),
          (l.onerror = () => {
            URL.revokeObjectURL(l.src), h(a);
          }),
          (l.src = URL.createObjectURL(a));
      });
    });
  }
  static processPdfFile(a, A = 0) {
    return q(this, null, function* () {
      let h = yield a.arrayBuffer(),
        d = yield $.getDocument({ data: h }).promise,
        l = [],
        i = A > 0 ? Math.min(A, d.numPages) : d.numPages;
      window.codbi.log(
        "INFO",
        `Processing PDF with ${d.numPages} page(s), limiting to ${i} page(s): ${a.name}`,
        "AI / LLAMA / CHAT",
      );
      for (let r = 1; r <= i; r++) {
        let g = yield d.getPage(r),
          b = (yield g.getTextContent()).items
            .map((f) => ("str" in f ? f.str : ""))
            .join("")
            .trim().length;
        if (b > 100) {
          window.codbi.log(
            "INFO",
            `PDF page ${r} contains ${b} characters of text \u2014 rendering to image`,
            "AI / LLAMA / CHAT",
          );
          let f = yield p.renderPdfPageToImage(g);
          l.push(f);
        } else {
          window.codbi.log(
            "INFO",
            `PDF page ${r} has minimal text (${b} chars) \u2014 attempting image extraction`,
            "AI / LLAMA / CHAT",
          );
          let f = yield p.extractImagesFromPdfPage(g);
          if (f.length > 0)
            l.push(...f),
              window.codbi.log("INFO", `Extracted ${f.length} image(s) from PDF page ${r}`, "AI / LLAMA / CHAT");
          else {
            window.codbi.log(
              "INFO",
              `No extractable images found on page ${r} \u2014 rendering page to image`,
              "AI / LLAMA / CHAT",
            );
            let K = yield p.renderPdfPageToImage(g);
            l.push(K);
          }
        }
      }
      return l;
    });
  }
  static renderPdfPageToImage(a) {
    return q(this, null, function* () {
      let A = a.getViewport({ scale: 2 }),
        h = document.createElement("canvas"),
        d = h.getContext("2d");
      if (!d) throw new Error("Failed to get canvas 2D context");
      return (
        (h.width = A.width),
        (h.height = A.height),
        yield a.render({ canvasContext: d, viewport: A }).promise,
        p.canvasToFile(h, "page.png")
      );
    });
  }
  static extractImagesFromPdfPage(a) {
    return q(this, null, function* () {
      let A = [];
      try {
        let h = yield a.getOperatorList();
        for (let d = 0; d < h.fnArray.length; d++) {
          let l = h.fnArray[d];
          if (l === $.OPS.paintImageXObject || l === $.OPS.paintInlineImageXObject)
            try {
              let i = h.argsArray[d][0];
              if (typeof i == "string") {
                let r = yield a.objs.get(i);
                if (r != null && r.data) {
                  let g = document.createElement("canvas"),
                    C = g.getContext("2d");
                  if (C && r.width && r.height) {
                    (g.width = r.width), (g.height = r.height);
                    let b = new ImageData(new Uint8ClampedArray(r.data), r.width, r.height);
                    C.putImageData(b, 0, 0), A.push(p.canvasToFile(g, `${i}.png`));
                  }
                }
              }
            } catch (i) {
              window.codbi.log("WARNING", `Failed to extract individual image: ${i}`, "AI / LLAMA / CHAT");
            }
        }
      } catch (h) {
        window.codbi.log("WARNING", `Image extraction failed: ${h}`, "AI / LLAMA / CHAT");
      }
      return A;
    });
  }
};
(p.pdfJsWorkerConfigured = !1),
  (p.DEFAULT_MAX_PIXELS = 3211264),
  me(
    [
      Ae.ParamvalueProvider,
      j(0, W.PRE(new Q("string"), new ee(/^\d+$/), "maxpages")),
      j(0, W.PRE(new Q("string"), new ee(/^(90|180|270)$/), "rotate")),
      j(0, W.PRE(new Q("number"), new ie([new te(90), new te(180), new te(270)]), "rotate")),
      j(0, W.PRE(new Q("string"), new ee(/^\d+$/), "maxPixelSize")),
      j(1, E.PRE(HTMLTextAreaElement, void 0, "Must be a <textarea> element tagged with this functionality.")),
    ],
    p,
    "functionality",
    1,
  );
var ne = p;
window.codbi.registerFunctionality("AI.ONNX.LLAMA.CHAT", ne.functionality.bind(ne));
export { ne as AI_ONNX_LLAMA_CHAT };
