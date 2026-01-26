import {
  a as Ne,
  b as ue,
  c as ve,
  d as Be,
  e as re,
  i as Jt,
  j as t,
  k as J,
  l as et,
  m as z,
  n as fe,
  o as Yt,
} from "./chunk-RS4WWU7K.js";
var Se = re(() => {});
var Si = re(() => {});
var Ei = re(() => {});
var Ue = re(() => {});
var je = re(() => {});
var wi = re(() => {});
var rs = re((exports, module) => {
  (function (g, ft) {
    typeof exports == "object" && typeof module == "object"
      ? (module.exports = g.pdfjsLib = ft())
      : typeof define == "function" && define.amd
        ? define("pdfjs-dist/build/pdf", [], () => (g.pdfjsLib = ft()))
        : typeof exports == "object"
          ? (exports["pdfjs-dist/build/pdf"] = g.pdfjsLib = ft())
          : (g["pdfjs-dist/build/pdf"] = g.pdfjsLib = ft());
  })(globalThis, () =>
    (() => {
      "use strict";
      var __webpack_modules__ = [
          ,
          (xt, g) => {
            var Vt;
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.VerbosityLevel =
                g.Util =
                g.UnknownErrorException =
                g.UnexpectedResponseException =
                g.TextRenderingMode =
                g.RenderingIntentFlag =
                g.PromiseCapability =
                g.PermissionFlag =
                g.PasswordResponses =
                g.PasswordException =
                g.PageActionEventType =
                g.OPS =
                g.MissingPDFException =
                g.MAX_IMAGE_SIZE_TO_CACHE =
                g.LINE_FACTOR =
                g.LINE_DESCENT_FACTOR =
                g.InvalidPDFException =
                g.ImageKind =
                g.IDENTITY_MATRIX =
                g.FormatError =
                g.FeatureTest =
                g.FONT_IDENTITY_MATRIX =
                g.DocumentActionEventType =
                g.CMapCompressionType =
                g.BaseException =
                g.BASELINE_FACTOR =
                g.AnnotationType =
                g.AnnotationReplyType =
                g.AnnotationPrefix =
                g.AnnotationMode =
                g.AnnotationFlag =
                g.AnnotationFieldFlag =
                g.AnnotationEditorType =
                g.AnnotationEditorPrefix =
                g.AnnotationEditorParamsType =
                g.AnnotationBorderStyleType =
                g.AnnotationActionEventType =
                g.AbortException =
                  void 0),
              (g.assert = C),
              (g.bytesToString = ct),
              (g.createValidAbsoluteUrl = $),
              (g.getModificationDate = Et),
              (g.getUuid = Nt),
              (g.getVerbosityLevel = H),
              (g.info = q),
              (g.isArrayBuffer = V),
              (g.isArrayEqual = wt),
              (g.isNodeJS = void 0),
              (g.normalizeUnicode = Mt),
              (g.objectFromMap = yt),
              (g.objectSize = At),
              (g.setVerbosityLevel = it),
              (g.shadow = S),
              (g.string32 = pt),
              (g.stringToBytes = ht),
              (g.stringToPDFString = ut),
              (g.stringToUTF8String = vt),
              (g.unreachable = rt),
              (g.utf8StringToString = _t),
              (g.warn = j);
            let ft =
              typeof process == "object" &&
              process + "" == "[object process]" &&
              !process.versions.nw &&
              !(process.versions.electron && process.type && process.type !== "browser");
            g.isNodeJS = ft;
            let c = [1, 0, 0, 1, 0, 0];
            g.IDENTITY_MATRIX = c;
            let M = [0.001, 0, 0, 0.001, 0, 0];
            g.FONT_IDENTITY_MATRIX = M;
            let lt = 1e7;
            g.MAX_IMAGE_SIZE_TO_CACHE = lt;
            let Q = 1.35;
            g.LINE_FACTOR = Q;
            let gt = 0.35;
            g.LINE_DESCENT_FACTOR = gt;
            let B = gt / Q;
            g.BASELINE_FACTOR = B;
            let R = {
              ANY: 1,
              DISPLAY: 2,
              PRINT: 4,
              SAVE: 8,
              ANNOTATIONS_FORMS: 16,
              ANNOTATIONS_STORAGE: 32,
              ANNOTATIONS_DISABLE: 64,
              OPLIST: 256,
            };
            g.RenderingIntentFlag = R;
            let p = { DISABLE: 0, ENABLE: 1, ENABLE_FORMS: 2, ENABLE_STORAGE: 3 };
            g.AnnotationMode = p;
            let N = "pdfjs_internal_editor_";
            g.AnnotationEditorPrefix = N;
            let O = { DISABLE: -1, NONE: 0, FREETEXT: 3, STAMP: 13, INK: 15 };
            g.AnnotationEditorType = O;
            let A = {
              RESIZE: 1,
              CREATE: 2,
              FREETEXT_SIZE: 11,
              FREETEXT_COLOR: 12,
              FREETEXT_OPACITY: 13,
              INK_COLOR: 21,
              INK_THICKNESS: 22,
              INK_OPACITY: 23,
            };
            g.AnnotationEditorParamsType = A;
            let b = {
              PRINT: 4,
              MODIFY_CONTENTS: 8,
              COPY: 16,
              MODIFY_ANNOTATIONS: 32,
              FILL_INTERACTIVE_FORMS: 256,
              COPY_FOR_ACCESSIBILITY: 512,
              ASSEMBLE: 1024,
              PRINT_HIGH_QUALITY: 2048,
            };
            g.PermissionFlag = b;
            let E = {
              FILL: 0,
              STROKE: 1,
              FILL_STROKE: 2,
              INVISIBLE: 3,
              FILL_ADD_TO_PATH: 4,
              STROKE_ADD_TO_PATH: 5,
              FILL_STROKE_ADD_TO_PATH: 6,
              ADD_TO_PATH: 7,
              FILL_STROKE_MASK: 3,
              ADD_TO_PATH_FLAG: 4,
            };
            g.TextRenderingMode = E;
            let f = { GRAYSCALE_1BPP: 1, RGB_24BPP: 2, RGBA_32BPP: 3 };
            g.ImageKind = f;
            let h = {
              TEXT: 1,
              LINK: 2,
              FREETEXT: 3,
              LINE: 4,
              SQUARE: 5,
              CIRCLE: 6,
              POLYGON: 7,
              POLYLINE: 8,
              HIGHLIGHT: 9,
              UNDERLINE: 10,
              SQUIGGLY: 11,
              STRIKEOUT: 12,
              STAMP: 13,
              CARET: 14,
              INK: 15,
              POPUP: 16,
              FILEATTACHMENT: 17,
              SOUND: 18,
              MOVIE: 19,
              WIDGET: 20,
              SCREEN: 21,
              PRINTERMARK: 22,
              TRAPNET: 23,
              WATERMARK: 24,
              THREED: 25,
              REDACT: 26,
            };
            g.AnnotationType = h;
            let m = { GROUP: "Group", REPLY: "R" };
            g.AnnotationReplyType = m;
            let I = {
              INVISIBLE: 1,
              HIDDEN: 2,
              PRINT: 4,
              NOZOOM: 8,
              NOROTATE: 16,
              NOVIEW: 32,
              READONLY: 64,
              LOCKED: 128,
              TOGGLENOVIEW: 256,
              LOCKEDCONTENTS: 512,
            };
            g.AnnotationFlag = I;
            let y = {
              READONLY: 1,
              REQUIRED: 2,
              NOEXPORT: 4,
              MULTILINE: 4096,
              PASSWORD: 8192,
              NOTOGGLETOOFF: 16384,
              RADIO: 32768,
              PUSHBUTTON: 65536,
              COMBO: 131072,
              EDIT: 262144,
              SORT: 524288,
              FILESELECT: 1048576,
              MULTISELECT: 2097152,
              DONOTSPELLCHECK: 4194304,
              DONOTSCROLL: 8388608,
              COMB: 16777216,
              RICHTEXT: 33554432,
              RADIOSINUNISON: 33554432,
              COMMITONSELCHANGE: 67108864,
            };
            g.AnnotationFieldFlag = y;
            let r = { SOLID: 1, DASHED: 2, BEVELED: 3, INSET: 4, UNDERLINE: 5 };
            g.AnnotationBorderStyleType = r;
            let l = {
              E: "Mouse Enter",
              X: "Mouse Exit",
              D: "Mouse Down",
              U: "Mouse Up",
              Fo: "Focus",
              Bl: "Blur",
              PO: "PageOpen",
              PC: "PageClose",
              PV: "PageVisible",
              PI: "PageInvisible",
              K: "Keystroke",
              F: "Format",
              V: "Validate",
              C: "Calculate",
            };
            g.AnnotationActionEventType = l;
            let s = { WC: "WillClose", WS: "WillSave", DS: "DidSave", WP: "WillPrint", DP: "DidPrint" };
            g.DocumentActionEventType = s;
            let a = { O: "PageOpen", C: "PageClose" };
            g.PageActionEventType = a;
            let o = { ERRORS: 0, WARNINGS: 1, INFOS: 5 };
            g.VerbosityLevel = o;
            let L = { NONE: 0, BINARY: 1 };
            g.CMapCompressionType = L;
            let n = {
              dependency: 1,
              setLineWidth: 2,
              setLineCap: 3,
              setLineJoin: 4,
              setMiterLimit: 5,
              setDash: 6,
              setRenderingIntent: 7,
              setFlatness: 8,
              setGState: 9,
              save: 10,
              restore: 11,
              transform: 12,
              moveTo: 13,
              lineTo: 14,
              curveTo: 15,
              curveTo2: 16,
              curveTo3: 17,
              closePath: 18,
              rectangle: 19,
              stroke: 20,
              closeStroke: 21,
              fill: 22,
              eoFill: 23,
              fillStroke: 24,
              eoFillStroke: 25,
              closeFillStroke: 26,
              closeEOFillStroke: 27,
              endPath: 28,
              clip: 29,
              eoClip: 30,
              beginText: 31,
              endText: 32,
              setCharSpacing: 33,
              setWordSpacing: 34,
              setHScale: 35,
              setLeading: 36,
              setFont: 37,
              setTextRenderingMode: 38,
              setTextRise: 39,
              moveText: 40,
              setLeadingMoveText: 41,
              setTextMatrix: 42,
              nextLine: 43,
              showText: 44,
              showSpacedText: 45,
              nextLineShowText: 46,
              nextLineSetSpacingShowText: 47,
              setCharWidth: 48,
              setCharWidthAndBounds: 49,
              setStrokeColorSpace: 50,
              setFillColorSpace: 51,
              setStrokeColor: 52,
              setStrokeColorN: 53,
              setFillColor: 54,
              setFillColorN: 55,
              setStrokeGray: 56,
              setFillGray: 57,
              setStrokeRGBColor: 58,
              setFillRGBColor: 59,
              setStrokeCMYKColor: 60,
              setFillCMYKColor: 61,
              shadingFill: 62,
              beginInlineImage: 63,
              beginImageData: 64,
              endInlineImage: 65,
              paintXObject: 66,
              markPoint: 67,
              markPointProps: 68,
              beginMarkedContent: 69,
              beginMarkedContentProps: 70,
              endMarkedContent: 71,
              beginCompat: 72,
              endCompat: 73,
              paintFormXObjectBegin: 74,
              paintFormXObjectEnd: 75,
              beginGroup: 76,
              endGroup: 77,
              beginAnnotation: 80,
              endAnnotation: 81,
              paintImageMaskXObject: 83,
              paintImageMaskXObjectGroup: 84,
              paintImageXObject: 85,
              paintInlineImageXObject: 86,
              paintInlineImageXObjectGroup: 87,
              paintImageXObjectRepeat: 88,
              paintImageMaskXObjectRepeat: 89,
              paintSolidColorImageMask: 90,
              constructPath: 91,
            };
            g.OPS = n;
            let _ = { NEED_PASSWORD: 1, INCORRECT_PASSWORD: 2 };
            g.PasswordResponses = _;
            let k = o.WARNINGS;
            function it(bt) {
              Number.isInteger(bt) && (k = bt);
            }
            function H() {
              return k;
            }
            function q(bt) {
              k >= o.INFOS && console.log(`Info: ${bt}`);
            }
            function j(bt) {
              k >= o.WARNINGS && console.log(`Warning: ${bt}`);
            }
            function rt(bt) {
              throw new Error(bt);
            }
            function C(bt, tt) {
              bt || rt(tt);
            }
            function U(bt) {
              switch (bt == null ? void 0 : bt.protocol) {
                case "http:":
                case "https:":
                case "ftp:":
                case "mailto:":
                case "tel:":
                  return !0;
                default:
                  return !1;
              }
            }
            function $(bt, tt = null, nt = null) {
              if (!bt) return null;
              try {
                if (nt && typeof bt == "string") {
                  if (nt.addDefaultProtocol && bt.startsWith("www.")) {
                    let Xt = bt.match(/\./g);
                    (Xt == null ? void 0 : Xt.length) >= 2 && (bt = `http://${bt}`);
                  }
                  if (nt.tryConvertEncoding)
                    try {
                      bt = vt(bt);
                    } catch (Xt) {}
                }
                let kt = tt ? new URL(bt, tt) : new URL(bt);
                if (U(kt)) return kt;
              } catch (kt) {}
              return null;
            }
            function S(bt, tt, nt, kt = !1) {
              return Object.defineProperty(bt, tt, { value: nt, enumerable: !kt, configurable: !0, writable: !1 }), nt;
            }
            let e = (function () {
              function tt(nt, kt) {
                this.constructor === tt && rt("Cannot initialize BaseException."),
                  (this.message = nt),
                  (this.name = kt);
              }
              return (tt.prototype = new Error()), (tt.constructor = tt), tt;
            })();
            g.BaseException = e;
            class i extends e {
              constructor(tt, nt) {
                super(tt, "PasswordException"), (this.code = nt);
              }
            }
            g.PasswordException = i;
            class d extends e {
              constructor(tt, nt) {
                super(tt, "UnknownErrorException"), (this.details = nt);
              }
            }
            g.UnknownErrorException = d;
            class T extends e {
              constructor(tt) {
                super(tt, "InvalidPDFException");
              }
            }
            g.InvalidPDFException = T;
            class x extends e {
              constructor(tt) {
                super(tt, "MissingPDFException");
              }
            }
            g.MissingPDFException = x;
            class P extends e {
              constructor(tt, nt) {
                super(tt, "UnexpectedResponseException"), (this.status = nt);
              }
            }
            g.UnexpectedResponseException = P;
            class G extends e {
              constructor(tt) {
                super(tt, "FormatError");
              }
            }
            g.FormatError = G;
            class st extends e {
              constructor(tt) {
                super(tt, "AbortException");
              }
            }
            g.AbortException = st;
            function ct(bt) {
              (typeof bt != "object" || (bt == null ? void 0 : bt.length) === void 0) &&
                rt("Invalid argument for bytesToString");
              let tt = bt.length,
                nt = 8192;
              if (tt < nt) return String.fromCharCode.apply(null, bt);
              let kt = [];
              for (let Xt = 0; Xt < tt; Xt += nt) {
                let zt = Math.min(Xt + nt, tt),
                  D = bt.subarray(Xt, zt);
                kt.push(String.fromCharCode.apply(null, D));
              }
              return kt.join("");
            }
            function ht(bt) {
              typeof bt != "string" && rt("Invalid argument for stringToBytes");
              let tt = bt.length,
                nt = new Uint8Array(tt);
              for (let kt = 0; kt < tt; ++kt) nt[kt] = bt.charCodeAt(kt) & 255;
              return nt;
            }
            function pt(bt) {
              return String.fromCharCode((bt >> 24) & 255, (bt >> 16) & 255, (bt >> 8) & 255, bt & 255);
            }
            function At(bt) {
              return Object.keys(bt).length;
            }
            function yt(bt) {
              let tt = Object.create(null);
              for (let [nt, kt] of bt) tt[nt] = kt;
              return tt;
            }
            function Y() {
              let bt = new Uint8Array(4);
              return (bt[0] = 1), new Uint32Array(bt.buffer, 0, 1)[0] === 1;
            }
            function Z() {
              try {
                return new Function(""), !0;
              } catch (bt) {
                return !1;
              }
            }
            class u {
              static get isLittleEndian() {
                return S(this, "isLittleEndian", Y());
              }
              static get isEvalSupported() {
                return S(this, "isEvalSupported", Z());
              }
              static get isOffscreenCanvasSupported() {
                return S(this, "isOffscreenCanvasSupported", typeof OffscreenCanvas != "undefined");
              }
              static get platform() {
                return typeof navigator == "undefined"
                  ? S(this, "platform", { isWin: !1, isMac: !1 })
                  : S(this, "platform", {
                      isWin: navigator.platform.includes("Win"),
                      isMac: navigator.platform.includes("Mac"),
                    });
              }
              static get isCSSRoundSupported() {
                var tt, nt;
                return S(
                  this,
                  "isCSSRoundSupported",
                  (nt = (tt = globalThis.CSS) == null ? void 0 : tt.supports) == null
                    ? void 0
                    : nt.call(tt, "width: round(1.5px, 1px)"),
                );
              }
            }
            g.FeatureTest = u;
            let F = [...Array(256).keys()].map((bt) => bt.toString(16).padStart(2, "0"));
            class X {
              static makeHexColor(tt, nt, kt) {
                return `#${F[tt]}${F[nt]}${F[kt]}`;
              }
              static scaleMinMax(tt, nt) {
                let kt;
                tt[0]
                  ? (tt[0] < 0 && ((kt = nt[0]), (nt[0] = nt[1]), (nt[1] = kt)),
                    (nt[0] *= tt[0]),
                    (nt[1] *= tt[0]),
                    tt[3] < 0 && ((kt = nt[2]), (nt[2] = nt[3]), (nt[3] = kt)),
                    (nt[2] *= tt[3]),
                    (nt[3] *= tt[3]))
                  : ((kt = nt[0]),
                    (nt[0] = nt[2]),
                    (nt[2] = kt),
                    (kt = nt[1]),
                    (nt[1] = nt[3]),
                    (nt[3] = kt),
                    tt[1] < 0 && ((kt = nt[2]), (nt[2] = nt[3]), (nt[3] = kt)),
                    (nt[2] *= tt[1]),
                    (nt[3] *= tt[1]),
                    tt[2] < 0 && ((kt = nt[0]), (nt[0] = nt[1]), (nt[1] = kt)),
                    (nt[0] *= tt[2]),
                    (nt[1] *= tt[2])),
                  (nt[0] += tt[4]),
                  (nt[1] += tt[4]),
                  (nt[2] += tt[5]),
                  (nt[3] += tt[5]);
              }
              static transform(tt, nt) {
                return [
                  tt[0] * nt[0] + tt[2] * nt[1],
                  tt[1] * nt[0] + tt[3] * nt[1],
                  tt[0] * nt[2] + tt[2] * nt[3],
                  tt[1] * nt[2] + tt[3] * nt[3],
                  tt[0] * nt[4] + tt[2] * nt[5] + tt[4],
                  tt[1] * nt[4] + tt[3] * nt[5] + tt[5],
                ];
              }
              static applyTransform(tt, nt) {
                let kt = tt[0] * nt[0] + tt[1] * nt[2] + nt[4],
                  Xt = tt[0] * nt[1] + tt[1] * nt[3] + nt[5];
                return [kt, Xt];
              }
              static applyInverseTransform(tt, nt) {
                let kt = nt[0] * nt[3] - nt[1] * nt[2],
                  Xt = (tt[0] * nt[3] - tt[1] * nt[2] + nt[2] * nt[5] - nt[4] * nt[3]) / kt,
                  zt = (-tt[0] * nt[1] + tt[1] * nt[0] + nt[4] * nt[1] - nt[5] * nt[0]) / kt;
                return [Xt, zt];
              }
              static getAxialAlignedBoundingBox(tt, nt) {
                let kt = this.applyTransform(tt, nt),
                  Xt = this.applyTransform(tt.slice(2, 4), nt),
                  zt = this.applyTransform([tt[0], tt[3]], nt),
                  D = this.applyTransform([tt[2], tt[1]], nt);
                return [
                  Math.min(kt[0], Xt[0], zt[0], D[0]),
                  Math.min(kt[1], Xt[1], zt[1], D[1]),
                  Math.max(kt[0], Xt[0], zt[0], D[0]),
                  Math.max(kt[1], Xt[1], zt[1], D[1]),
                ];
              }
              static inverseTransform(tt) {
                let nt = tt[0] * tt[3] - tt[1] * tt[2];
                return [
                  tt[3] / nt,
                  -tt[1] / nt,
                  -tt[2] / nt,
                  tt[0] / nt,
                  (tt[2] * tt[5] - tt[4] * tt[3]) / nt,
                  (tt[4] * tt[1] - tt[5] * tt[0]) / nt,
                ];
              }
              static singularValueDecompose2dScale(tt) {
                let nt = [tt[0], tt[2], tt[1], tt[3]],
                  kt = tt[0] * nt[0] + tt[1] * nt[2],
                  Xt = tt[0] * nt[1] + tt[1] * nt[3],
                  zt = tt[2] * nt[0] + tt[3] * nt[2],
                  D = tt[2] * nt[1] + tt[3] * nt[3],
                  dt = (kt + D) / 2,
                  Ct = Math.sqrt(Ne(kt + D, 2) - 4 * (kt * D - zt * Xt)) / 2,
                  Dt = dt + Ct || 1,
                  Ot = dt - Ct || 1;
                return [Math.sqrt(Dt), Math.sqrt(Ot)];
              }
              static normalizeRect(tt) {
                let nt = tt.slice(0);
                return (
                  tt[0] > tt[2] && ((nt[0] = tt[2]), (nt[2] = tt[0])),
                  tt[1] > tt[3] && ((nt[1] = tt[3]), (nt[3] = tt[1])),
                  nt
                );
              }
              static intersect(tt, nt) {
                let kt = Math.max(Math.min(tt[0], tt[2]), Math.min(nt[0], nt[2])),
                  Xt = Math.min(Math.max(tt[0], tt[2]), Math.max(nt[0], nt[2]));
                if (kt > Xt) return null;
                let zt = Math.max(Math.min(tt[1], tt[3]), Math.min(nt[1], nt[3])),
                  D = Math.min(Math.max(tt[1], tt[3]), Math.max(nt[1], nt[3]));
                return zt > D ? null : [kt, zt, Xt, D];
              }
              static bezierBoundingBox(tt, nt, kt, Xt, zt, D, dt, Ct) {
                let Dt = [],
                  Ot = [[], []],
                  Pt,
                  w,
                  v,
                  W,
                  at,
                  ot,
                  mt,
                  St;
                for (let Ht = 0; Ht < 2; ++Ht) {
                  if (
                    (Ht === 0
                      ? ((w = 6 * tt - 12 * kt + 6 * zt),
                        (Pt = -3 * tt + 9 * kt - 9 * zt + 3 * dt),
                        (v = 3 * kt - 3 * tt))
                      : ((w = 6 * nt - 12 * Xt + 6 * D),
                        (Pt = -3 * nt + 9 * Xt - 9 * D + 3 * Ct),
                        (v = 3 * Xt - 3 * nt)),
                    Math.abs(Pt) < 1e-12)
                  ) {
                    if (Math.abs(w) < 1e-12) continue;
                    (W = -v / w), 0 < W && W < 1 && Dt.push(W);
                    continue;
                  }
                  (mt = w * w - 4 * v * Pt),
                    (St = Math.sqrt(mt)),
                    !(mt < 0) &&
                      ((at = (-w + St) / (2 * Pt)),
                      0 < at && at < 1 && Dt.push(at),
                      (ot = (-w - St) / (2 * Pt)),
                      0 < ot && ot < 1 && Dt.push(ot));
                }
                let It = Dt.length,
                  Ft,
                  Tt = It;
                for (; It--; )
                  (W = Dt[It]),
                    (Ft = 1 - W),
                    (Ot[0][It] = Ft * Ft * Ft * tt + 3 * Ft * Ft * W * kt + 3 * Ft * W * W * zt + W * W * W * dt),
                    (Ot[1][It] = Ft * Ft * Ft * nt + 3 * Ft * Ft * W * Xt + 3 * Ft * W * W * D + W * W * W * Ct);
                return (
                  (Ot[0][Tt] = tt),
                  (Ot[1][Tt] = nt),
                  (Ot[0][Tt + 1] = dt),
                  (Ot[1][Tt + 1] = Ct),
                  (Ot[0].length = Ot[1].length = Tt + 2),
                  [Math.min(...Ot[0]), Math.min(...Ot[1]), Math.max(...Ot[0]), Math.max(...Ot[1])]
                );
              }
            }
            g.Util = X;
            let K = [
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 728, 711, 710, 729, 733, 731, 730,
              732, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
              0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8226, 8224, 8225, 8230,
              8212, 8211, 402, 8260, 8249, 8250, 8722, 8240, 8222, 8220, 8221, 8216, 8217, 8218, 8482, 64257, 64258,
              321, 338, 352, 376, 381, 305, 322, 339, 353, 382, 0, 8364,
            ];
            function ut(bt) {
              if (bt[0] >= "\xEF") {
                let nt;
                if (
                  (bt[0] === "\xFE" && bt[1] === "\xFF"
                    ? (nt = "utf-16be")
                    : bt[0] === "\xFF" && bt[1] === "\xFE"
                      ? (nt = "utf-16le")
                      : bt[0] === "\xEF" && bt[1] === "\xBB" && bt[2] === "\xBF" && (nt = "utf-8"),
                  nt)
                )
                  try {
                    let kt = new TextDecoder(nt, { fatal: !0 }),
                      Xt = ht(bt);
                    return kt.decode(Xt);
                  } catch (kt) {
                    j(`stringToPDFString: "${kt}".`);
                  }
              }
              let tt = [];
              for (let nt = 0, kt = bt.length; nt < kt; nt++) {
                let Xt = K[bt.charCodeAt(nt)];
                tt.push(Xt ? String.fromCharCode(Xt) : bt.charAt(nt));
              }
              return tt.join("");
            }
            function vt(bt) {
              return decodeURIComponent(escape(bt));
            }
            function _t(bt) {
              return unescape(encodeURIComponent(bt));
            }
            function V(bt) {
              return typeof bt == "object" && (bt == null ? void 0 : bt.byteLength) !== void 0;
            }
            function wt(bt, tt) {
              if (bt.length !== tt.length) return !1;
              for (let nt = 0, kt = bt.length; nt < kt; nt++) if (bt[nt] !== tt[nt]) return !1;
              return !0;
            }
            function Et(bt = new Date()) {
              return [
                bt.getUTCFullYear().toString(),
                (bt.getUTCMonth() + 1).toString().padStart(2, "0"),
                bt.getUTCDate().toString().padStart(2, "0"),
                bt.getUTCHours().toString().padStart(2, "0"),
                bt.getUTCMinutes().toString().padStart(2, "0"),
                bt.getUTCSeconds().toString().padStart(2, "0"),
              ].join("");
            }
            class jt {
              constructor() {
                J(this, Vt, !1);
                this.promise = new Promise((tt, nt) => {
                  (this.resolve = (kt) => {
                    et(this, Vt, !0), tt(kt);
                  }),
                    (this.reject = (kt) => {
                      et(this, Vt, !0), nt(kt);
                    });
                });
              }
              get settled() {
                return t(this, Vt);
              }
            }
            (Vt = new WeakMap()), (g.PromiseCapability = jt);
            let Bt = null,
              qt = null;
            function Mt(bt) {
              return (
                Bt ||
                  ((Bt =
                    /([\u00a0\u00b5\u037e\u0eb3\u2000-\u200a\u202f\u2126\ufb00-\ufb04\ufb06\ufb20-\ufb36\ufb38-\ufb3c\ufb3e\ufb40-\ufb41\ufb43-\ufb44\ufb46-\ufba1\ufba4-\ufba9\ufbae-\ufbb1\ufbd3-\ufbdc\ufbde-\ufbe7\ufbea-\ufbf8\ufbfc-\ufbfd\ufc00-\ufc5d\ufc64-\ufcf1\ufcf5-\ufd3d\ufd88\ufdf4\ufdfa-\ufdfb\ufe71\ufe77\ufe79\ufe7b\ufe7d]+)|(\ufb05+)/gu),
                  (qt = new Map([["\uFB05", "\u017Ft"]]))),
                bt.replaceAll(Bt, (tt, nt, kt) => (nt ? nt.normalize("NFKC") : qt.get(kt)))
              );
            }
            function Nt() {
              if (typeof crypto != "undefined" && typeof (crypto == null ? void 0 : crypto.randomUUID) == "function")
                return crypto.randomUUID();
              let bt = new Uint8Array(32);
              if (
                typeof crypto != "undefined" &&
                typeof (crypto == null ? void 0 : crypto.getRandomValues) == "function"
              )
                crypto.getRandomValues(bt);
              else for (let tt = 0; tt < 32; tt++) bt[tt] = Math.floor(Math.random() * 255);
              return ct(bt);
            }
            let Wt = "pdfjs_internal_id_";
            g.AnnotationPrefix = Wt;
          },
          (__unused_webpack_module, exports, __w_pdfjs_require__) => {
            var xt, ft, c, M, oe, Ee, gt, B, R, p, N, O, A, b, E, we, h, m, He, y, r;
            Object.defineProperty(exports, "__esModule", { value: !0 }),
              (exports.RenderTask =
                exports.PDFWorkerUtil =
                exports.PDFWorker =
                exports.PDFPageProxy =
                exports.PDFDocumentProxy =
                exports.PDFDocumentLoadingTask =
                exports.PDFDataRangeTransport =
                exports.LoopbackPort =
                exports.DefaultStandardFontDataFactory =
                exports.DefaultFilterFactory =
                exports.DefaultCanvasFactory =
                exports.DefaultCMapReaderFactory =
                  void 0),
              Object.defineProperty(exports, "SVGGraphics", {
                enumerable: !0,
                get: function () {
                  return _displaySvg.SVGGraphics;
                },
              }),
              (exports.build = void 0),
              (exports.getDocument = getDocument),
              (exports.version = void 0);
            var _util = __w_pdfjs_require__(1),
              _annotation_storage = __w_pdfjs_require__(3),
              _display_utils = __w_pdfjs_require__(6),
              _font_loader = __w_pdfjs_require__(9),
              _displayNode_utils = __w_pdfjs_require__(10),
              _canvas = __w_pdfjs_require__(11),
              _worker_options = __w_pdfjs_require__(14),
              _message_handler = __w_pdfjs_require__(15),
              _metadata = __w_pdfjs_require__(16),
              _optional_content_config = __w_pdfjs_require__(17),
              _transport_stream = __w_pdfjs_require__(18),
              _displayFetch_stream = __w_pdfjs_require__(19),
              _displayNetwork = __w_pdfjs_require__(22),
              _displayNode_stream = __w_pdfjs_require__(23),
              _displaySvg = __w_pdfjs_require__(24),
              _xfa_text = __w_pdfjs_require__(25);
            let DEFAULT_RANGE_CHUNK_SIZE = 65536,
              RENDERING_CANCELLED_TIMEOUT = 100,
              DELAYED_CLEANUP_TIMEOUT = 5e3,
              DefaultCanvasFactory = _util.isNodeJS
                ? _displayNode_utils.NodeCanvasFactory
                : _display_utils.DOMCanvasFactory;
            exports.DefaultCanvasFactory = DefaultCanvasFactory;
            let DefaultCMapReaderFactory = _util.isNodeJS
              ? _displayNode_utils.NodeCMapReaderFactory
              : _display_utils.DOMCMapReaderFactory;
            exports.DefaultCMapReaderFactory = DefaultCMapReaderFactory;
            let DefaultFilterFactory = _util.isNodeJS
              ? _displayNode_utils.NodeFilterFactory
              : _display_utils.DOMFilterFactory;
            exports.DefaultFilterFactory = DefaultFilterFactory;
            let DefaultStandardFontDataFactory = _util.isNodeJS
              ? _displayNode_utils.NodeStandardFontDataFactory
              : _display_utils.DOMStandardFontDataFactory;
            exports.DefaultStandardFontDataFactory = DefaultStandardFontDataFactory;
            function getDocument(s) {
              var Et, jt;
              if (
                (typeof s == "string" || s instanceof URL
                  ? (s = { url: s })
                  : (0, _util.isArrayBuffer)(s) && (s = { data: s }),
                typeof s != "object")
              )
                throw new Error("Invalid parameter in getDocument, need parameter object.");
              if (!s.url && !s.data && !s.range)
                throw new Error("Invalid parameter object: need either .data, .range or .url");
              let a = new PDFDocumentLoadingTask(),
                { docId: o } = a,
                L = s.url ? getUrlProp(s.url) : null,
                n = s.data ? getDataProp(s.data) : null,
                _ = s.httpHeaders || null,
                k = s.withCredentials === !0,
                it = (Et = s.password) != null ? Et : null,
                H = s.range instanceof PDFDataRangeTransport ? s.range : null,
                q =
                  Number.isInteger(s.rangeChunkSize) && s.rangeChunkSize > 0
                    ? s.rangeChunkSize
                    : DEFAULT_RANGE_CHUNK_SIZE,
                j = s.worker instanceof PDFWorker ? s.worker : null,
                rt = s.verbosity,
                C =
                  typeof s.docBaseUrl == "string" && !(0, _display_utils.isDataScheme)(s.docBaseUrl)
                    ? s.docBaseUrl
                    : null,
                U = typeof s.cMapUrl == "string" ? s.cMapUrl : null,
                $ = s.cMapPacked !== !1,
                S = s.CMapReaderFactory || DefaultCMapReaderFactory,
                e = typeof s.standardFontDataUrl == "string" ? s.standardFontDataUrl : null,
                i = s.StandardFontDataFactory || DefaultStandardFontDataFactory,
                d = s.stopAtErrors !== !0,
                T = Number.isInteger(s.maxImageSize) && s.maxImageSize > -1 ? s.maxImageSize : -1,
                x = s.isEvalSupported !== !1,
                P = typeof s.isOffscreenCanvasSupported == "boolean" ? s.isOffscreenCanvasSupported : !_util.isNodeJS,
                G = Number.isInteger(s.canvasMaxAreaInBytes) ? s.canvasMaxAreaInBytes : -1,
                st = typeof s.disableFontFace == "boolean" ? s.disableFontFace : _util.isNodeJS,
                ct = s.fontExtraProperties === !0,
                ht = s.enableXfa === !0,
                pt = s.ownerDocument || globalThis.document,
                At = s.disableRange === !0,
                yt = s.disableStream === !0,
                Y = s.disableAutoFetch === !0,
                Z = s.pdfBug === !0,
                u = H ? H.length : (jt = s.length) != null ? jt : NaN,
                F = typeof s.useSystemFonts == "boolean" ? s.useSystemFonts : !_util.isNodeJS && !st,
                X =
                  typeof s.useWorkerFetch == "boolean"
                    ? s.useWorkerFetch
                    : S === _display_utils.DOMCMapReaderFactory &&
                      i === _display_utils.DOMStandardFontDataFactory &&
                      U &&
                      e &&
                      (0, _display_utils.isValidFetchUrl)(U, document.baseURI) &&
                      (0, _display_utils.isValidFetchUrl)(e, document.baseURI),
                K = s.canvasFactory || new DefaultCanvasFactory({ ownerDocument: pt }),
                ut = s.filterFactory || new DefaultFilterFactory({ docId: o, ownerDocument: pt }),
                vt = null;
              (0, _util.setVerbosityLevel)(rt);
              let _t = { canvasFactory: K, filterFactory: ut };
              if (
                (X ||
                  ((_t.cMapReaderFactory = new S({ baseUrl: U, isCompressed: $ })),
                  (_t.standardFontDataFactory = new i({ baseUrl: e }))),
                !j)
              ) {
                let Bt = { verbosity: rt, port: _worker_options.GlobalWorkerOptions.workerPort };
                (j = Bt.port ? PDFWorker.fromPort(Bt) : new PDFWorker(Bt)), (a._worker = j);
              }
              let V = {
                  docId: o,
                  apiVersion: "3.11.174",
                  data: n,
                  password: it,
                  disableAutoFetch: Y,
                  rangeChunkSize: q,
                  length: u,
                  docBaseUrl: C,
                  enableXfa: ht,
                  evaluatorOptions: {
                    maxImageSize: T,
                    disableFontFace: st,
                    ignoreErrors: d,
                    isEvalSupported: x,
                    isOffscreenCanvasSupported: P,
                    canvasMaxAreaInBytes: G,
                    fontExtraProperties: ct,
                    useSystemFonts: F,
                    cMapUrl: X ? U : null,
                    standardFontDataUrl: X ? e : null,
                  },
                },
                wt = {
                  ignoreErrors: d,
                  isEvalSupported: x,
                  disableFontFace: st,
                  fontExtraProperties: ct,
                  enableXfa: ht,
                  ownerDocument: pt,
                  disableAutoFetch: Y,
                  pdfBug: Z,
                  styleElement: vt,
                };
              return (
                j.promise
                  .then(function () {
                    if (a.destroyed) throw new Error("Loading aborted");
                    let Bt = _fetchDocument(j, V),
                      qt = new Promise(function (Mt) {
                        let Nt;
                        H
                          ? (Nt = new _transport_stream.PDFDataTransportStream(
                              {
                                length: u,
                                initialData: H.initialData,
                                progressiveDone: H.progressiveDone,
                                contentDispositionFilename: H.contentDispositionFilename,
                                disableRange: At,
                                disableStream: yt,
                              },
                              H,
                            ))
                          : n ||
                            (Nt = ((Vt) =>
                              _util.isNodeJS
                                ? new _displayNode_stream.PDFNodeStream(Vt)
                                : (0, _display_utils.isValidFetchUrl)(Vt.url)
                                  ? new _displayFetch_stream.PDFFetchStream(Vt)
                                  : new _displayNetwork.PDFNetworkStream(Vt))({
                              url: L,
                              length: u,
                              httpHeaders: _,
                              withCredentials: k,
                              rangeChunkSize: q,
                              disableRange: At,
                              disableStream: yt,
                            })),
                          Mt(Nt);
                      });
                    return Promise.all([Bt, qt]).then(function ([Mt, Nt]) {
                      if (a.destroyed) throw new Error("Loading aborted");
                      let Wt = new _message_handler.MessageHandler(o, Mt, j.port),
                        Vt = new WorkerTransport(Wt, a, Nt, wt, _t);
                      (a._transport = Vt), Wt.send("Ready", null);
                    });
                  })
                  .catch(a._capability.reject),
                a
              );
            }
            function _fetchDocument(s, a) {
              return Yt(this, null, function* () {
                if (s.destroyed) throw new Error("Worker was destroyed");
                let o = yield s.messageHandler.sendWithPromise("GetDocRequest", a, a.data ? [a.data.buffer] : null);
                if (s.destroyed) throw new Error("Worker was destroyed");
                return o;
              });
            }
            function getUrlProp(s) {
              if (s instanceof URL) return s.href;
              try {
                return new URL(s, window.location).href;
              } catch (a) {
                if (_util.isNodeJS && typeof s == "string") return s;
              }
              throw new Error("Invalid PDF url data: either string or URL-object is expected in the url property.");
            }
            function getDataProp(s) {
              if (_util.isNodeJS && typeof Buffer != "undefined" && s instanceof Buffer)
                throw new Error("Please provide binary data as `Uint8Array`, rather than `Buffer`.");
              if (s instanceof Uint8Array && s.byteLength === s.buffer.byteLength) return s;
              if (typeof s == "string") return (0, _util.stringToBytes)(s);
              if ((typeof s == "object" && !isNaN(s == null ? void 0 : s.length)) || (0, _util.isArrayBuffer)(s))
                return new Uint8Array(s);
              throw new Error(
                "Invalid PDF binary data: either TypedArray, string, or array-like object is expected in the data property.",
              );
            }
            let g = class g {
              constructor() {
                (this._capability = new _util.PromiseCapability()),
                  (this._transport = null),
                  (this._worker = null),
                  (this.docId = `d${fe(g, xt)._++}`),
                  (this.destroyed = !1),
                  (this.onPassword = null),
                  (this.onProgress = null);
              }
              get promise() {
                return this._capability.promise;
              }
              destroy() {
                return Yt(this, null, function* () {
                  var a, o, L;
                  this.destroyed = !0;
                  try {
                    (a = this._worker) != null && a.port && (this._worker._pendingDestroy = !0),
                      yield (o = this._transport) == null ? void 0 : o.destroy();
                  } catch (n) {
                    throw ((L = this._worker) != null && L.port && delete this._worker._pendingDestroy, n);
                  }
                  (this._transport = null), this._worker && (this._worker.destroy(), (this._worker = null));
                });
              }
            };
            (xt = new WeakMap()), J(g, xt, 0);
            let PDFDocumentLoadingTask = g;
            exports.PDFDocumentLoadingTask = PDFDocumentLoadingTask;
            class PDFDataRangeTransport {
              constructor(a, o, L = !1, n = null) {
                (this.length = a),
                  (this.initialData = o),
                  (this.progressiveDone = L),
                  (this.contentDispositionFilename = n),
                  (this._rangeListeners = []),
                  (this._progressListeners = []),
                  (this._progressiveReadListeners = []),
                  (this._progressiveDoneListeners = []),
                  (this._readyCapability = new _util.PromiseCapability());
              }
              addRangeListener(a) {
                this._rangeListeners.push(a);
              }
              addProgressListener(a) {
                this._progressListeners.push(a);
              }
              addProgressiveReadListener(a) {
                this._progressiveReadListeners.push(a);
              }
              addProgressiveDoneListener(a) {
                this._progressiveDoneListeners.push(a);
              }
              onDataRange(a, o) {
                for (let L of this._rangeListeners) L(a, o);
              }
              onDataProgress(a, o) {
                this._readyCapability.promise.then(() => {
                  for (let L of this._progressListeners) L(a, o);
                });
              }
              onDataProgressiveRead(a) {
                this._readyCapability.promise.then(() => {
                  for (let o of this._progressiveReadListeners) o(a);
                });
              }
              onDataProgressiveDone() {
                this._readyCapability.promise.then(() => {
                  for (let a of this._progressiveDoneListeners) a();
                });
              }
              transportReady() {
                this._readyCapability.resolve();
              }
              requestDataRange(a, o) {
                (0, _util.unreachable)("Abstract method PDFDataRangeTransport.requestDataRange");
              }
              abort() {}
            }
            exports.PDFDataRangeTransport = PDFDataRangeTransport;
            class PDFDocumentProxy {
              constructor(a, o) {
                (this._pdfInfo = a),
                  (this._transport = o),
                  Object.defineProperty(this, "getJavaScript", {
                    value: () => (
                      (0, _display_utils.deprecated)(
                        "`PDFDocumentProxy.getJavaScript`, please use `PDFDocumentProxy.getJSActions` instead.",
                      ),
                      this.getJSActions().then((L) => {
                        if (!L) return L;
                        let n = [];
                        for (let _ in L) n.push(...L[_]);
                        return n;
                      })
                    ),
                  });
              }
              get annotationStorage() {
                return this._transport.annotationStorage;
              }
              get filterFactory() {
                return this._transport.filterFactory;
              }
              get numPages() {
                return this._pdfInfo.numPages;
              }
              get fingerprints() {
                return this._pdfInfo.fingerprints;
              }
              get isPureXfa() {
                return (0, _util.shadow)(this, "isPureXfa", !!this._transport._htmlForXfa);
              }
              get allXfaHtml() {
                return this._transport._htmlForXfa;
              }
              getPage(a) {
                return this._transport.getPage(a);
              }
              getPageIndex(a) {
                return this._transport.getPageIndex(a);
              }
              getDestinations() {
                return this._transport.getDestinations();
              }
              getDestination(a) {
                return this._transport.getDestination(a);
              }
              getPageLabels() {
                return this._transport.getPageLabels();
              }
              getPageLayout() {
                return this._transport.getPageLayout();
              }
              getPageMode() {
                return this._transport.getPageMode();
              }
              getViewerPreferences() {
                return this._transport.getViewerPreferences();
              }
              getOpenAction() {
                return this._transport.getOpenAction();
              }
              getAttachments() {
                return this._transport.getAttachments();
              }
              getJSActions() {
                return this._transport.getDocJSActions();
              }
              getOutline() {
                return this._transport.getOutline();
              }
              getOptionalContentConfig() {
                return this._transport.getOptionalContentConfig();
              }
              getPermissions() {
                return this._transport.getPermissions();
              }
              getMetadata() {
                return this._transport.getMetadata();
              }
              getMarkInfo() {
                return this._transport.getMarkInfo();
              }
              getData() {
                return this._transport.getData();
              }
              saveDocument() {
                return this._transport.saveDocument();
              }
              getDownloadInfo() {
                return this._transport.downloadInfoCapability.promise;
              }
              cleanup(a = !1) {
                return this._transport.startCleanup(a || this.isPureXfa);
              }
              destroy() {
                return this.loadingTask.destroy();
              }
              get loadingParams() {
                return this._transport.loadingParams;
              }
              get loadingTask() {
                return this._transport.loadingTask;
              }
              getFieldObjects() {
                return this._transport.getFieldObjects();
              }
              hasJSActions() {
                return this._transport.hasJSActions();
              }
              getCalculationOrderIds() {
                return this._transport.getCalculationOrderIds();
              }
            }
            exports.PDFDocumentProxy = PDFDocumentProxy;
            class PDFPageProxy {
              constructor(a, o, L, n = !1) {
                J(this, M);
                J(this, ft, null);
                J(this, c, !1);
                (this._pageIndex = a),
                  (this._pageInfo = o),
                  (this._transport = L),
                  (this._stats = n ? new _display_utils.StatTimer() : null),
                  (this._pdfBug = n),
                  (this.commonObjs = L.commonObjs),
                  (this.objs = new PDFObjects()),
                  (this._maybeCleanupAfterRender = !1),
                  (this._intentStates = new Map()),
                  (this.destroyed = !1);
              }
              get pageNumber() {
                return this._pageIndex + 1;
              }
              get rotate() {
                return this._pageInfo.rotate;
              }
              get ref() {
                return this._pageInfo.ref;
              }
              get userUnit() {
                return this._pageInfo.userUnit;
              }
              get view() {
                return this._pageInfo.view;
              }
              getViewport({
                scale: a,
                rotation: o = this.rotate,
                offsetX: L = 0,
                offsetY: n = 0,
                dontFlip: _ = !1,
              } = {}) {
                return new _display_utils.PageViewport({
                  viewBox: this.view,
                  scale: a,
                  rotation: o,
                  offsetX: L,
                  offsetY: n,
                  dontFlip: _,
                });
              }
              getAnnotations({ intent: a = "display" } = {}) {
                let o = this._transport.getRenderingIntent(a);
                return this._transport.getAnnotations(this._pageIndex, o.renderingIntent);
              }
              getJSActions() {
                return this._transport.getPageJSActions(this._pageIndex);
              }
              get filterFactory() {
                return this._transport.filterFactory;
              }
              get isPureXfa() {
                return (0, _util.shadow)(this, "isPureXfa", !!this._transport._htmlForXfa);
              }
              getXfa() {
                return Yt(this, null, function* () {
                  var a;
                  return ((a = this._transport._htmlForXfa) == null ? void 0 : a.children[this._pageIndex]) || null;
                });
              }
              render({
                canvasContext: a,
                viewport: o,
                intent: L = "display",
                annotationMode: n = _util.AnnotationMode.ENABLE,
                transform: _ = null,
                background: k = null,
                optionalContentConfigPromise: it = null,
                annotationCanvasMap: H = null,
                pageColors: q = null,
                printAnnotationStorage: j = null,
              }) {
                var i, d;
                (i = this._stats) == null || i.time("Overall");
                let rt = this._transport.getRenderingIntent(L, n, j);
                et(this, c, !1), z(this, M, Ee).call(this), it || (it = this._transport.getOptionalContentConfig());
                let C = this._intentStates.get(rt.cacheKey);
                C || ((C = Object.create(null)), this._intentStates.set(rt.cacheKey, C)),
                  C.streamReaderCancelTimeout &&
                    (clearTimeout(C.streamReaderCancelTimeout), (C.streamReaderCancelTimeout = null));
                let U = !!(rt.renderingIntent & _util.RenderingIntentFlag.PRINT);
                C.displayReadyCapability ||
                  ((C.displayReadyCapability = new _util.PromiseCapability()),
                  (C.operatorList = { fnArray: [], argsArray: [], lastChunk: !1, separateAnnots: null }),
                  (d = this._stats) == null || d.time("Page Request"),
                  this._pumpOperatorList(rt));
                let $ = (T) => {
                    var x, P;
                    C.renderTasks.delete(S),
                      (this._maybeCleanupAfterRender || U) && et(this, c, !0),
                      z(this, M, oe).call(this, !U),
                      T
                        ? (S.capability.reject(T),
                          this._abortOperatorList({ intentState: C, reason: T instanceof Error ? T : new Error(T) }))
                        : S.capability.resolve(),
                      (x = this._stats) == null || x.timeEnd("Rendering"),
                      (P = this._stats) == null || P.timeEnd("Overall");
                  },
                  S = new InternalRenderTask({
                    callback: $,
                    params: { canvasContext: a, viewport: o, transform: _, background: k },
                    objs: this.objs,
                    commonObjs: this.commonObjs,
                    annotationCanvasMap: H,
                    operatorList: C.operatorList,
                    pageIndex: this._pageIndex,
                    canvasFactory: this._transport.canvasFactory,
                    filterFactory: this._transport.filterFactory,
                    useRequestAnimationFrame: !U,
                    pdfBug: this._pdfBug,
                    pageColors: q,
                  });
                (C.renderTasks || (C.renderTasks = new Set())).add(S);
                let e = S.task;
                return (
                  Promise.all([C.displayReadyCapability.promise, it])
                    .then(([T, x]) => {
                      var P;
                      if (this.destroyed) {
                        $();
                        return;
                      }
                      (P = this._stats) == null || P.time("Rendering"),
                        S.initializeGraphics({ transparency: T, optionalContentConfig: x }),
                        S.operatorListChanged();
                    })
                    .catch($),
                  e
                );
              }
              getOperatorList({
                intent: a = "display",
                annotationMode: o = _util.AnnotationMode.ENABLE,
                printAnnotationStorage: L = null,
              } = {}) {
                var H;
                function n() {
                  k.operatorList.lastChunk &&
                    (k.opListReadCapability.resolve(k.operatorList), k.renderTasks.delete(it));
                }
                let _ = this._transport.getRenderingIntent(a, o, L, !0),
                  k = this._intentStates.get(_.cacheKey);
                k || ((k = Object.create(null)), this._intentStates.set(_.cacheKey, k));
                let it;
                return (
                  k.opListReadCapability ||
                    ((it = Object.create(null)),
                    (it.operatorListChanged = n),
                    (k.opListReadCapability = new _util.PromiseCapability()),
                    (k.renderTasks || (k.renderTasks = new Set())).add(it),
                    (k.operatorList = { fnArray: [], argsArray: [], lastChunk: !1, separateAnnots: null }),
                    (H = this._stats) == null || H.time("Page Request"),
                    this._pumpOperatorList(_)),
                  k.opListReadCapability.promise
                );
              }
              streamTextContent({ includeMarkedContent: a = !1, disableNormalization: o = !1 } = {}) {
                return this._transport.messageHandler.sendWithStream(
                  "GetTextContent",
                  { pageIndex: this._pageIndex, includeMarkedContent: a === !0, disableNormalization: o === !0 },
                  {
                    highWaterMark: 100,
                    size(n) {
                      return n.items.length;
                    },
                  },
                );
              }
              getTextContent(a = {}) {
                if (this._transport._htmlForXfa) return this.getXfa().then((L) => _xfa_text.XfaText.textContent(L));
                let o = this.streamTextContent(a);
                return new Promise(function (L, n) {
                  function _() {
                    k.read().then(function ({ value: H, done: q }) {
                      if (q) {
                        L(it);
                        return;
                      }
                      Object.assign(it.styles, H.styles), it.items.push(...H.items), _();
                    }, n);
                  }
                  let k = o.getReader(),
                    it = { items: [], styles: Object.create(null) };
                  _();
                });
              }
              getStructTree() {
                return this._transport.getStructTree(this._pageIndex);
              }
              _destroy() {
                this.destroyed = !0;
                let a = [];
                for (let o of this._intentStates.values())
                  if (
                    (this._abortOperatorList({ intentState: o, reason: new Error("Page was destroyed."), force: !0 }),
                    !o.opListReadCapability)
                  )
                    for (let L of o.renderTasks) a.push(L.completed), L.cancel();
                return this.objs.clear(), et(this, c, !1), z(this, M, Ee).call(this), Promise.all(a);
              }
              cleanup(a = !1) {
                et(this, c, !0);
                let o = z(this, M, oe).call(this, !1);
                return a && o && this._stats && (this._stats = new _display_utils.StatTimer()), o;
              }
              _startRenderPage(a, o) {
                var n, _;
                let L = this._intentStates.get(o);
                L &&
                  ((n = this._stats) == null || n.timeEnd("Page Request"),
                  (_ = L.displayReadyCapability) == null || _.resolve(a));
              }
              _renderPageChunk(a, o) {
                for (let L = 0, n = a.length; L < n; L++)
                  o.operatorList.fnArray.push(a.fnArray[L]), o.operatorList.argsArray.push(a.argsArray[L]);
                (o.operatorList.lastChunk = a.lastChunk), (o.operatorList.separateAnnots = a.separateAnnots);
                for (let L of o.renderTasks) L.operatorListChanged();
                a.lastChunk && z(this, M, oe).call(this, !0);
              }
              _pumpOperatorList({ renderingIntent: a, cacheKey: o, annotationStorageSerializable: L }) {
                let { map: n, transfers: _ } = L,
                  it = this._transport.messageHandler
                    .sendWithStream(
                      "GetOperatorList",
                      { pageIndex: this._pageIndex, intent: a, cacheKey: o, annotationStorage: n },
                      _,
                    )
                    .getReader(),
                  H = this._intentStates.get(o);
                H.streamReader = it;
                let q = () => {
                  it.read().then(
                    ({ value: j, done: rt }) => {
                      if (rt) {
                        H.streamReader = null;
                        return;
                      }
                      this._transport.destroyed || (this._renderPageChunk(j, H), q());
                    },
                    (j) => {
                      if (((H.streamReader = null), !this._transport.destroyed)) {
                        if (H.operatorList) {
                          H.operatorList.lastChunk = !0;
                          for (let rt of H.renderTasks) rt.operatorListChanged();
                          z(this, M, oe).call(this, !0);
                        }
                        if (H.displayReadyCapability) H.displayReadyCapability.reject(j);
                        else if (H.opListReadCapability) H.opListReadCapability.reject(j);
                        else throw j;
                      }
                    },
                  );
                };
                q();
              }
              _abortOperatorList({ intentState: a, reason: o, force: L = !1 }) {
                if (a.streamReader) {
                  if (
                    (a.streamReaderCancelTimeout &&
                      (clearTimeout(a.streamReaderCancelTimeout), (a.streamReaderCancelTimeout = null)),
                    !L)
                  ) {
                    if (a.renderTasks.size > 0) return;
                    if (o instanceof _display_utils.RenderingCancelledException) {
                      let n = RENDERING_CANCELLED_TIMEOUT;
                      o.extraDelay > 0 && o.extraDelay < 1e3 && (n += o.extraDelay),
                        (a.streamReaderCancelTimeout = setTimeout(() => {
                          (a.streamReaderCancelTimeout = null),
                            this._abortOperatorList({ intentState: a, reason: o, force: !0 });
                        }, n));
                      return;
                    }
                  }
                  if (
                    (a.streamReader.cancel(new _util.AbortException(o.message)).catch(() => {}),
                    (a.streamReader = null),
                    !this._transport.destroyed)
                  ) {
                    for (let [n, _] of this._intentStates)
                      if (_ === a) {
                        this._intentStates.delete(n);
                        break;
                      }
                    this.cleanup();
                  }
                }
              }
              get stats() {
                return this._stats;
              }
            }
            (ft = new WeakMap()),
              (c = new WeakMap()),
              (M = new WeakSet()),
              (oe = function (a = !1) {
                if ((z(this, M, Ee).call(this), !t(this, c) || this.destroyed)) return !1;
                if (a)
                  return (
                    et(
                      this,
                      ft,
                      setTimeout(() => {
                        et(this, ft, null), z(this, M, oe).call(this, !1);
                      }, DELAYED_CLEANUP_TIMEOUT),
                    ),
                    !1
                  );
                for (let { renderTasks: o, operatorList: L } of this._intentStates.values())
                  if (o.size > 0 || !L.lastChunk) return !1;
                return this._intentStates.clear(), this.objs.clear(), et(this, c, !1), !0;
              }),
              (Ee = function () {
                t(this, ft) && (clearTimeout(t(this, ft)), et(this, ft, null));
              }),
              (exports.PDFPageProxy = PDFPageProxy);
            class LoopbackPort {
              constructor() {
                J(this, gt, new Set());
                J(this, B, Promise.resolve());
              }
              postMessage(a, o) {
                let L = { data: structuredClone(a, o ? { transfer: o } : null) };
                t(this, B).then(() => {
                  for (let n of t(this, gt)) n.call(this, L);
                });
              }
              addEventListener(a, o) {
                t(this, gt).add(o);
              }
              removeEventListener(a, o) {
                t(this, gt).delete(o);
              }
              terminate() {
                t(this, gt).clear();
              }
            }
            (gt = new WeakMap()), (B = new WeakMap()), (exports.LoopbackPort = LoopbackPort);
            let PDFWorkerUtil = { isWorkerDisabled: !1, fallbackWorkerSrc: null, fakeWorkerId: 0 };
            exports.PDFWorkerUtil = PDFWorkerUtil;
            {
              if (_util.isNodeJS && typeof Be == "function")
                (PDFWorkerUtil.isWorkerDisabled = !0), (PDFWorkerUtil.fallbackWorkerSrc = "./pdf.worker.js");
              else if (typeof document == "object") {
                let s = (R = document == null ? void 0 : document.currentScript) == null ? void 0 : R.src;
                s && (PDFWorkerUtil.fallbackWorkerSrc = s.replace(/(\.(?:min\.)?js)(\?.*)?$/i, ".worker$1$2"));
              }
              (PDFWorkerUtil.isSameOrigin = function (s, a) {
                let o;
                try {
                  if (((o = new URL(s)), !o.origin || o.origin === "null")) return !1;
                } catch (n) {
                  return !1;
                }
                let L = new URL(a, o);
                return o.origin === L.origin;
              }),
                (PDFWorkerUtil.createCDNWrapper = function (s) {
                  let a = `importScripts("${s}");`;
                  return URL.createObjectURL(new Blob([a]));
                });
            }
            let _PDFWorker = class _PDFWorker {
              constructor({ name: s = null, port: a = null, verbosity: o = (0, _util.getVerbosityLevel)() } = {}) {
                var L;
                if (
                  ((this.name = s),
                  (this.destroyed = !1),
                  (this.verbosity = o),
                  (this._readyCapability = new _util.PromiseCapability()),
                  (this._port = null),
                  (this._webWorker = null),
                  (this._messageHandler = null),
                  a)
                ) {
                  if ((L = t(_PDFWorker, p)) != null && L.has(a))
                    throw new Error("Cannot use more than one PDFWorker per port.");
                  (t(_PDFWorker, p) || et(_PDFWorker, p, new WeakMap())).set(a, this), this._initializeFromPort(a);
                  return;
                }
                this._initialize();
              }
              get promise() {
                return this._readyCapability.promise;
              }
              get port() {
                return this._port;
              }
              get messageHandler() {
                return this._messageHandler;
              }
              _initializeFromPort(s) {
                (this._port = s),
                  (this._messageHandler = new _message_handler.MessageHandler("main", "worker", s)),
                  this._messageHandler.on("ready", function () {}),
                  this._readyCapability.resolve(),
                  this._messageHandler.send("configure", { verbosity: this.verbosity });
              }
              _initialize() {
                if (!PDFWorkerUtil.isWorkerDisabled && !_PDFWorker._mainThreadWorkerMessageHandler) {
                  let { workerSrc: s } = _PDFWorker;
                  try {
                    PDFWorkerUtil.isSameOrigin(window.location.href, s) ||
                      (s = PDFWorkerUtil.createCDNWrapper(new URL(s, window.location).href));
                    let a = new Worker(s),
                      o = new _message_handler.MessageHandler("main", "worker", a),
                      L = () => {
                        a.removeEventListener("error", n),
                          o.destroy(),
                          a.terminate(),
                          this.destroyed
                            ? this._readyCapability.reject(new Error("Worker was destroyed"))
                            : this._setupFakeWorker();
                      },
                      n = () => {
                        this._webWorker || L();
                      };
                    a.addEventListener("error", n),
                      o.on("test", (k) => {
                        if ((a.removeEventListener("error", n), this.destroyed)) {
                          L();
                          return;
                        }
                        k
                          ? ((this._messageHandler = o),
                            (this._port = a),
                            (this._webWorker = a),
                            this._readyCapability.resolve(),
                            o.send("configure", { verbosity: this.verbosity }))
                          : (this._setupFakeWorker(), o.destroy(), a.terminate());
                      }),
                      o.on("ready", (k) => {
                        if ((a.removeEventListener("error", n), this.destroyed)) {
                          L();
                          return;
                        }
                        try {
                          _();
                        } catch (it) {
                          this._setupFakeWorker();
                        }
                      });
                    let _ = () => {
                      let k = new Uint8Array();
                      o.send("test", k, [k.buffer]);
                    };
                    _();
                    return;
                  } catch (a) {
                    (0, _util.info)("The worker has been disabled.");
                  }
                }
                this._setupFakeWorker();
              }
              _setupFakeWorker() {
                PDFWorkerUtil.isWorkerDisabled ||
                  ((0, _util.warn)("Setting up fake worker."), (PDFWorkerUtil.isWorkerDisabled = !0)),
                  _PDFWorker._setupFakeWorkerGlobal
                    .then((s) => {
                      if (this.destroyed) {
                        this._readyCapability.reject(new Error("Worker was destroyed"));
                        return;
                      }
                      let a = new LoopbackPort();
                      this._port = a;
                      let o = `fake${PDFWorkerUtil.fakeWorkerId++}`,
                        L = new _message_handler.MessageHandler(o + "_worker", o, a);
                      s.setup(L, a);
                      let n = new _message_handler.MessageHandler(o, o + "_worker", a);
                      (this._messageHandler = n),
                        this._readyCapability.resolve(),
                        n.send("configure", { verbosity: this.verbosity });
                    })
                    .catch((s) => {
                      this._readyCapability.reject(new Error(`Setting up fake worker failed: "${s.message}".`));
                    });
              }
              destroy() {
                var s;
                (this.destroyed = !0),
                  this._webWorker && (this._webWorker.terminate(), (this._webWorker = null)),
                  (s = t(_PDFWorker, p)) == null || s.delete(this._port),
                  (this._port = null),
                  this._messageHandler && (this._messageHandler.destroy(), (this._messageHandler = null));
              }
              static fromPort(s) {
                var o;
                if (!(s != null && s.port)) throw new Error("PDFWorker.fromPort - invalid method signature.");
                let a = (o = t(this, p)) == null ? void 0 : o.get(s.port);
                if (a) {
                  if (a._pendingDestroy)
                    throw new Error(
                      "PDFWorker.fromPort - the worker is being destroyed.\nPlease remember to await `PDFDocumentLoadingTask.destroy()`-calls.",
                    );
                  return a;
                }
                return new _PDFWorker(s);
              }
              static get workerSrc() {
                if (_worker_options.GlobalWorkerOptions.workerSrc) return _worker_options.GlobalWorkerOptions.workerSrc;
                if (PDFWorkerUtil.fallbackWorkerSrc !== null)
                  return (
                    _util.isNodeJS || (0, _display_utils.deprecated)('No "GlobalWorkerOptions.workerSrc" specified.'),
                    PDFWorkerUtil.fallbackWorkerSrc
                  );
                throw new Error('No "GlobalWorkerOptions.workerSrc" specified.');
              }
              static get _mainThreadWorkerMessageHandler() {
                var s;
                try {
                  return ((s = globalThis.pdfjsWorker) == null ? void 0 : s.WorkerMessageHandler) || null;
                } catch (a) {
                  return null;
                }
              }
              static get _setupFakeWorkerGlobal() {
                let loader = () =>
                  Yt(this, null, function* () {
                    let mainWorkerMessageHandler = this._mainThreadWorkerMessageHandler;
                    if (mainWorkerMessageHandler) return mainWorkerMessageHandler;
                    if (_util.isNodeJS && typeof Be == "function") {
                      let worker = eval("require")(this.workerSrc);
                      return worker.WorkerMessageHandler;
                    }
                    return (
                      yield (0, _display_utils.loadScript)(this.workerSrc), window.pdfjsWorker.WorkerMessageHandler
                    );
                  });
                return (0, _util.shadow)(this, "_setupFakeWorkerGlobal", loader());
              }
            };
            (p = new WeakMap()), J(_PDFWorker, p);
            let PDFWorker = _PDFWorker;
            exports.PDFWorker = PDFWorker;
            class WorkerTransport {
              constructor(a, o, L, n, _) {
                J(this, E);
                J(this, N, new Map());
                J(this, O, new Map());
                J(this, A, new Map());
                J(this, b, null);
                (this.messageHandler = a),
                  (this.loadingTask = o),
                  (this.commonObjs = new PDFObjects()),
                  (this.fontLoader = new _font_loader.FontLoader({
                    ownerDocument: n.ownerDocument,
                    styleElement: n.styleElement,
                  })),
                  (this._params = n),
                  (this.canvasFactory = _.canvasFactory),
                  (this.filterFactory = _.filterFactory),
                  (this.cMapReaderFactory = _.cMapReaderFactory),
                  (this.standardFontDataFactory = _.standardFontDataFactory),
                  (this.destroyed = !1),
                  (this.destroyCapability = null),
                  (this._networkStream = L),
                  (this._fullReader = null),
                  (this._lastProgress = null),
                  (this.downloadInfoCapability = new _util.PromiseCapability()),
                  this.setupMessageHandler();
              }
              get annotationStorage() {
                return (0, _util.shadow)(this, "annotationStorage", new _annotation_storage.AnnotationStorage());
              }
              getRenderingIntent(a, o = _util.AnnotationMode.ENABLE, L = null, n = !1) {
                let _ = _util.RenderingIntentFlag.DISPLAY,
                  k = _annotation_storage.SerializableEmpty;
                switch (a) {
                  case "any":
                    _ = _util.RenderingIntentFlag.ANY;
                    break;
                  case "display":
                    break;
                  case "print":
                    _ = _util.RenderingIntentFlag.PRINT;
                    break;
                  default:
                    (0, _util.warn)(`getRenderingIntent - invalid intent: ${a}`);
                }
                switch (o) {
                  case _util.AnnotationMode.DISABLE:
                    _ += _util.RenderingIntentFlag.ANNOTATIONS_DISABLE;
                    break;
                  case _util.AnnotationMode.ENABLE:
                    break;
                  case _util.AnnotationMode.ENABLE_FORMS:
                    _ += _util.RenderingIntentFlag.ANNOTATIONS_FORMS;
                    break;
                  case _util.AnnotationMode.ENABLE_STORAGE:
                    (_ += _util.RenderingIntentFlag.ANNOTATIONS_STORAGE),
                      (k = (
                        _ & _util.RenderingIntentFlag.PRINT && L instanceof _annotation_storage.PrintAnnotationStorage
                          ? L
                          : this.annotationStorage
                      ).serializable);
                    break;
                  default:
                    (0, _util.warn)(`getRenderingIntent - invalid annotationMode: ${o}`);
                }
                return (
                  n && (_ += _util.RenderingIntentFlag.OPLIST),
                  { renderingIntent: _, cacheKey: `${_}_${k.hash}`, annotationStorageSerializable: k }
                );
              }
              destroy() {
                var L;
                if (this.destroyCapability) return this.destroyCapability.promise;
                (this.destroyed = !0),
                  (this.destroyCapability = new _util.PromiseCapability()),
                  (L = t(this, b)) == null || L.reject(new Error("Worker was destroyed during onPassword callback"));
                let a = [];
                for (let n of t(this, O).values()) a.push(n._destroy());
                t(this, O).clear(),
                  t(this, A).clear(),
                  this.hasOwnProperty("annotationStorage") && this.annotationStorage.resetModified();
                let o = this.messageHandler.sendWithPromise("Terminate", null);
                return (
                  a.push(o),
                  Promise.all(a).then(() => {
                    var n;
                    this.commonObjs.clear(),
                      this.fontLoader.clear(),
                      t(this, N).clear(),
                      this.filterFactory.destroy(),
                      (n = this._networkStream) == null ||
                        n.cancelAllRequests(new _util.AbortException("Worker was terminated.")),
                      this.messageHandler && (this.messageHandler.destroy(), (this.messageHandler = null)),
                      this.destroyCapability.resolve();
                  }, this.destroyCapability.reject),
                  this.destroyCapability.promise
                );
              }
              setupMessageHandler() {
                let { messageHandler: a, loadingTask: o } = this;
                a.on("GetReader", (L, n) => {
                  (0, _util.assert)(this._networkStream, "GetReader - no `IPDFStream` instance available."),
                    (this._fullReader = this._networkStream.getFullReader()),
                    (this._fullReader.onProgress = (_) => {
                      this._lastProgress = { loaded: _.loaded, total: _.total };
                    }),
                    (n.onPull = () => {
                      this._fullReader
                        .read()
                        .then(function ({ value: _, done: k }) {
                          if (k) {
                            n.close();
                            return;
                          }
                          (0, _util.assert)(_ instanceof ArrayBuffer, "GetReader - expected an ArrayBuffer."),
                            n.enqueue(new Uint8Array(_), 1, [_]);
                        })
                        .catch((_) => {
                          n.error(_);
                        });
                    }),
                    (n.onCancel = (_) => {
                      this._fullReader.cancel(_),
                        n.ready.catch((k) => {
                          if (!this.destroyed) throw k;
                        });
                    });
                }),
                  a.on("ReaderHeadersReady", (L) => {
                    let n = new _util.PromiseCapability(),
                      _ = this._fullReader;
                    return (
                      _.headersReady.then(() => {
                        var k;
                        (!_.isStreamingSupported || !_.isRangeSupported) &&
                          (this._lastProgress && ((k = o.onProgress) == null || k.call(o, this._lastProgress)),
                          (_.onProgress = (it) => {
                            var H;
                            (H = o.onProgress) == null || H.call(o, { loaded: it.loaded, total: it.total });
                          })),
                          n.resolve({
                            isStreamingSupported: _.isStreamingSupported,
                            isRangeSupported: _.isRangeSupported,
                            contentLength: _.contentLength,
                          });
                      }, n.reject),
                      n.promise
                    );
                  }),
                  a.on("GetRangeReader", (L, n) => {
                    (0, _util.assert)(this._networkStream, "GetRangeReader - no `IPDFStream` instance available.");
                    let _ = this._networkStream.getRangeReader(L.begin, L.end);
                    if (!_) {
                      n.close();
                      return;
                    }
                    (n.onPull = () => {
                      _.read()
                        .then(function ({ value: k, done: it }) {
                          if (it) {
                            n.close();
                            return;
                          }
                          (0, _util.assert)(k instanceof ArrayBuffer, "GetRangeReader - expected an ArrayBuffer."),
                            n.enqueue(new Uint8Array(k), 1, [k]);
                        })
                        .catch((k) => {
                          n.error(k);
                        });
                    }),
                      (n.onCancel = (k) => {
                        _.cancel(k),
                          n.ready.catch((it) => {
                            if (!this.destroyed) throw it;
                          });
                      });
                  }),
                  a.on("GetDoc", ({ pdfInfo: L }) => {
                    (this._numPages = L.numPages),
                      (this._htmlForXfa = L.htmlForXfa),
                      delete L.htmlForXfa,
                      o._capability.resolve(new PDFDocumentProxy(L, this));
                  }),
                  a.on("DocException", function (L) {
                    let n;
                    switch (L.name) {
                      case "PasswordException":
                        n = new _util.PasswordException(L.message, L.code);
                        break;
                      case "InvalidPDFException":
                        n = new _util.InvalidPDFException(L.message);
                        break;
                      case "MissingPDFException":
                        n = new _util.MissingPDFException(L.message);
                        break;
                      case "UnexpectedResponseException":
                        n = new _util.UnexpectedResponseException(L.message, L.status);
                        break;
                      case "UnknownErrorException":
                        n = new _util.UnknownErrorException(L.message, L.details);
                        break;
                      default:
                        (0, _util.unreachable)("DocException - expected a valid Error.");
                    }
                    o._capability.reject(n);
                  }),
                  a.on("PasswordRequest", (L) => {
                    if ((et(this, b, new _util.PromiseCapability()), o.onPassword)) {
                      let n = (_) => {
                        _ instanceof Error ? t(this, b).reject(_) : t(this, b).resolve({ password: _ });
                      };
                      try {
                        o.onPassword(n, L.code);
                      } catch (_) {
                        t(this, b).reject(_);
                      }
                    } else t(this, b).reject(new _util.PasswordException(L.message, L.code));
                    return t(this, b).promise;
                  }),
                  a.on("DataLoaded", (L) => {
                    var n;
                    (n = o.onProgress) == null || n.call(o, { loaded: L.length, total: L.length }),
                      this.downloadInfoCapability.resolve(L);
                  }),
                  a.on("StartRenderPage", (L) => {
                    if (this.destroyed) return;
                    t(this, O).get(L.pageIndex)._startRenderPage(L.transparency, L.cacheKey);
                  }),
                  a.on("commonobj", ([L, n, _]) => {
                    var k;
                    if (!this.destroyed && !this.commonObjs.has(L))
                      switch (n) {
                        case "Font":
                          let it = this._params;
                          if ("error" in _) {
                            let j = _.error;
                            (0, _util.warn)(`Error during font loading: ${j}`), this.commonObjs.resolve(L, j);
                            break;
                          }
                          let H =
                              it.pdfBug && (k = globalThis.FontInspector) != null && k.enabled
                                ? (j, rt) => globalThis.FontInspector.fontAdded(j, rt)
                                : null,
                            q = new _font_loader.FontFaceObject(_, {
                              isEvalSupported: it.isEvalSupported,
                              disableFontFace: it.disableFontFace,
                              ignoreErrors: it.ignoreErrors,
                              inspectFont: H,
                            });
                          this.fontLoader
                            .bind(q)
                            .catch((j) => a.sendWithPromise("FontFallback", { id: L }))
                            .finally(() => {
                              !it.fontExtraProperties && q.data && (q.data = null), this.commonObjs.resolve(L, q);
                            });
                          break;
                        case "FontPath":
                        case "Image":
                        case "Pattern":
                          this.commonObjs.resolve(L, _);
                          break;
                        default:
                          throw new Error(`Got unknown common object type ${n}`);
                      }
                  }),
                  a.on("obj", ([L, n, _, k]) => {
                    var H;
                    if (this.destroyed) return;
                    let it = t(this, O).get(n);
                    if (!it.objs.has(L))
                      switch (_) {
                        case "Image":
                          if ((it.objs.resolve(L, k), k)) {
                            let q;
                            if (k.bitmap) {
                              let { width: j, height: rt } = k;
                              q = j * rt * 4;
                            } else q = ((H = k.data) == null ? void 0 : H.length) || 0;
                            q > _util.MAX_IMAGE_SIZE_TO_CACHE && (it._maybeCleanupAfterRender = !0);
                          }
                          break;
                        case "Pattern":
                          it.objs.resolve(L, k);
                          break;
                        default:
                          throw new Error(`Got unknown object type ${_}`);
                      }
                  }),
                  a.on("DocProgress", (L) => {
                    var n;
                    this.destroyed || (n = o.onProgress) == null || n.call(o, { loaded: L.loaded, total: L.total });
                  }),
                  a.on("FetchBuiltInCMap", (L) =>
                    this.destroyed
                      ? Promise.reject(new Error("Worker was destroyed."))
                      : this.cMapReaderFactory
                        ? this.cMapReaderFactory.fetch(L)
                        : Promise.reject(
                            new Error("CMapReaderFactory not initialized, see the `useWorkerFetch` parameter."),
                          ),
                  ),
                  a.on("FetchStandardFontData", (L) =>
                    this.destroyed
                      ? Promise.reject(new Error("Worker was destroyed."))
                      : this.standardFontDataFactory
                        ? this.standardFontDataFactory.fetch(L)
                        : Promise.reject(
                            new Error("StandardFontDataFactory not initialized, see the `useWorkerFetch` parameter."),
                          ),
                  );
              }
              getData() {
                return this.messageHandler.sendWithPromise("GetData", null);
              }
              saveDocument() {
                var L, n;
                this.annotationStorage.size <= 0 &&
                  (0, _util.warn)(
                    "saveDocument called while `annotationStorage` is empty, please use the getData-method instead.",
                  );
                let { map: a, transfers: o } = this.annotationStorage.serializable;
                return this.messageHandler
                  .sendWithPromise(
                    "SaveDocument",
                    {
                      isPureXfa: !!this._htmlForXfa,
                      numPages: this._numPages,
                      annotationStorage: a,
                      filename: (n = (L = this._fullReader) == null ? void 0 : L.filename) != null ? n : null,
                    },
                    o,
                  )
                  .finally(() => {
                    this.annotationStorage.resetModified();
                  });
              }
              getPage(a) {
                if (!Number.isInteger(a) || a <= 0 || a > this._numPages)
                  return Promise.reject(new Error("Invalid page request."));
                let o = a - 1,
                  L = t(this, A).get(o);
                if (L) return L;
                let n = this.messageHandler.sendWithPromise("GetPage", { pageIndex: o }).then((_) => {
                  if (this.destroyed) throw new Error("Transport destroyed");
                  let k = new PDFPageProxy(o, _, this, this._params.pdfBug);
                  return t(this, O).set(o, k), k;
                });
                return t(this, A).set(o, n), n;
              }
              getPageIndex(a) {
                return typeof a != "object" ||
                  a === null ||
                  !Number.isInteger(a.num) ||
                  a.num < 0 ||
                  !Number.isInteger(a.gen) ||
                  a.gen < 0
                  ? Promise.reject(new Error("Invalid pageIndex request."))
                  : this.messageHandler.sendWithPromise("GetPageIndex", { num: a.num, gen: a.gen });
              }
              getAnnotations(a, o) {
                return this.messageHandler.sendWithPromise("GetAnnotations", { pageIndex: a, intent: o });
              }
              getFieldObjects() {
                return z(this, E, we).call(this, "GetFieldObjects");
              }
              hasJSActions() {
                return z(this, E, we).call(this, "HasJSActions");
              }
              getCalculationOrderIds() {
                return this.messageHandler.sendWithPromise("GetCalculationOrderIds", null);
              }
              getDestinations() {
                return this.messageHandler.sendWithPromise("GetDestinations", null);
              }
              getDestination(a) {
                return typeof a != "string"
                  ? Promise.reject(new Error("Invalid destination request."))
                  : this.messageHandler.sendWithPromise("GetDestination", { id: a });
              }
              getPageLabels() {
                return this.messageHandler.sendWithPromise("GetPageLabels", null);
              }
              getPageLayout() {
                return this.messageHandler.sendWithPromise("GetPageLayout", null);
              }
              getPageMode() {
                return this.messageHandler.sendWithPromise("GetPageMode", null);
              }
              getViewerPreferences() {
                return this.messageHandler.sendWithPromise("GetViewerPreferences", null);
              }
              getOpenAction() {
                return this.messageHandler.sendWithPromise("GetOpenAction", null);
              }
              getAttachments() {
                return this.messageHandler.sendWithPromise("GetAttachments", null);
              }
              getDocJSActions() {
                return z(this, E, we).call(this, "GetDocJSActions");
              }
              getPageJSActions(a) {
                return this.messageHandler.sendWithPromise("GetPageJSActions", { pageIndex: a });
              }
              getStructTree(a) {
                return this.messageHandler.sendWithPromise("GetStructTree", { pageIndex: a });
              }
              getOutline() {
                return this.messageHandler.sendWithPromise("GetOutline", null);
              }
              getOptionalContentConfig() {
                return this.messageHandler
                  .sendWithPromise("GetOptionalContentConfig", null)
                  .then((a) => new _optional_content_config.OptionalContentConfig(a));
              }
              getPermissions() {
                return this.messageHandler.sendWithPromise("GetPermissions", null);
              }
              getMetadata() {
                let a = "GetMetadata",
                  o = t(this, N).get(a);
                if (o) return o;
                let L = this.messageHandler.sendWithPromise(a, null).then((n) => {
                  var _, k, it, H;
                  return {
                    info: n[0],
                    metadata: n[1] ? new _metadata.Metadata(n[1]) : null,
                    contentDispositionFilename:
                      (k = (_ = this._fullReader) == null ? void 0 : _.filename) != null ? k : null,
                    contentLength: (H = (it = this._fullReader) == null ? void 0 : it.contentLength) != null ? H : null,
                  };
                });
                return t(this, N).set(a, L), L;
              }
              getMarkInfo() {
                return this.messageHandler.sendWithPromise("GetMarkInfo", null);
              }
              startCleanup(a = !1) {
                return Yt(this, null, function* () {
                  if (!this.destroyed) {
                    yield this.messageHandler.sendWithPromise("Cleanup", null);
                    for (let o of t(this, O).values())
                      if (!o.cleanup()) throw new Error(`startCleanup: Page ${o.pageNumber} is currently rendering.`);
                    this.commonObjs.clear(),
                      a || this.fontLoader.clear(),
                      t(this, N).clear(),
                      this.filterFactory.destroy(!0);
                  }
                });
              }
              get loadingParams() {
                let { disableAutoFetch: a, enableXfa: o } = this._params;
                return (0, _util.shadow)(this, "loadingParams", { disableAutoFetch: a, enableXfa: o });
              }
            }
            (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakSet()),
              (we = function (a, o = null) {
                let L = t(this, N).get(a);
                if (L) return L;
                let n = this.messageHandler.sendWithPromise(a, o);
                return t(this, N).set(a, n), n;
              });
            class PDFObjects {
              constructor() {
                J(this, m);
                J(this, h, Object.create(null));
              }
              get(a, o = null) {
                if (o) {
                  let n = z(this, m, He).call(this, a);
                  return n.capability.promise.then(() => o(n.data)), null;
                }
                let L = t(this, h)[a];
                if (!(L != null && L.capability.settled))
                  throw new Error(`Requesting object that isn't resolved yet ${a}.`);
                return L.data;
              }
              has(a) {
                let o = t(this, h)[a];
                return (o == null ? void 0 : o.capability.settled) || !1;
              }
              resolve(a, o = null) {
                let L = z(this, m, He).call(this, a);
                (L.data = o), L.capability.resolve();
              }
              clear() {
                var a;
                for (let o in t(this, h)) {
                  let { data: L } = t(this, h)[o];
                  (a = L == null ? void 0 : L.bitmap) == null || a.close();
                }
                et(this, h, Object.create(null));
              }
            }
            (h = new WeakMap()),
              (m = new WeakSet()),
              (He = function (a) {
                var o;
                return (o = t(this, h))[a] || (o[a] = { capability: new _util.PromiseCapability(), data: null });
              });
            class RenderTask {
              constructor(a) {
                J(this, y, null);
                et(this, y, a), (this.onContinue = null);
              }
              get promise() {
                return t(this, y).capability.promise;
              }
              cancel(a = 0) {
                t(this, y).cancel(null, a);
              }
              get separateAnnots() {
                let { separateAnnots: a } = t(this, y).operatorList;
                if (!a) return !1;
                let { annotationCanvasMap: o } = t(this, y);
                return a.form || (a.canvas && (o == null ? void 0 : o.size) > 0);
              }
            }
            (y = new WeakMap()), (exports.RenderTask = RenderTask);
            let l = class l {
              constructor({
                callback: a,
                params: o,
                objs: L,
                commonObjs: n,
                annotationCanvasMap: _,
                operatorList: k,
                pageIndex: it,
                canvasFactory: H,
                filterFactory: q,
                useRequestAnimationFrame: j = !1,
                pdfBug: rt = !1,
                pageColors: C = null,
              }) {
                (this.callback = a),
                  (this.params = o),
                  (this.objs = L),
                  (this.commonObjs = n),
                  (this.annotationCanvasMap = _),
                  (this.operatorListIdx = null),
                  (this.operatorList = k),
                  (this._pageIndex = it),
                  (this.canvasFactory = H),
                  (this.filterFactory = q),
                  (this._pdfBug = rt),
                  (this.pageColors = C),
                  (this.running = !1),
                  (this.graphicsReadyCallback = null),
                  (this.graphicsReady = !1),
                  (this._useRequestAnimationFrame = j === !0 && typeof window != "undefined"),
                  (this.cancelled = !1),
                  (this.capability = new _util.PromiseCapability()),
                  (this.task = new RenderTask(this)),
                  (this._cancelBound = this.cancel.bind(this)),
                  (this._continueBound = this._continue.bind(this)),
                  (this._scheduleNextBound = this._scheduleNext.bind(this)),
                  (this._nextBound = this._next.bind(this)),
                  (this._canvas = o.canvasContext.canvas);
              }
              get completed() {
                return this.capability.promise.catch(function () {});
              }
              initializeGraphics({ transparency: a = !1, optionalContentConfig: o }) {
                var it, H;
                if (this.cancelled) return;
                if (this._canvas) {
                  if (t(l, r).has(this._canvas))
                    throw new Error(
                      "Cannot use the same canvas during multiple render() operations. Use different canvas or ensure previous operations were cancelled or completed.",
                    );
                  t(l, r).add(this._canvas);
                }
                this._pdfBug &&
                  (it = globalThis.StepperManager) != null &&
                  it.enabled &&
                  ((this.stepper = globalThis.StepperManager.create(this._pageIndex)),
                  this.stepper.init(this.operatorList),
                  (this.stepper.nextBreakPoint = this.stepper.getNextBreakPoint()));
                let { canvasContext: L, viewport: n, transform: _, background: k } = this.params;
                (this.gfx = new _canvas.CanvasGraphics(
                  L,
                  this.commonObjs,
                  this.objs,
                  this.canvasFactory,
                  this.filterFactory,
                  { optionalContentConfig: o },
                  this.annotationCanvasMap,
                  this.pageColors,
                )),
                  this.gfx.beginDrawing({ transform: _, viewport: n, transparency: a, background: k }),
                  (this.operatorListIdx = 0),
                  (this.graphicsReady = !0),
                  (H = this.graphicsReadyCallback) == null || H.call(this);
              }
              cancel(a = null, o = 0) {
                var L;
                (this.running = !1),
                  (this.cancelled = !0),
                  (L = this.gfx) == null || L.endDrawing(),
                  t(l, r).delete(this._canvas),
                  this.callback(
                    a ||
                      new _display_utils.RenderingCancelledException(
                        `Rendering cancelled, page ${this._pageIndex + 1}`,
                        o,
                      ),
                  );
              }
              operatorListChanged() {
                var a;
                if (!this.graphicsReady) {
                  this.graphicsReadyCallback || (this.graphicsReadyCallback = this._continueBound);
                  return;
                }
                (a = this.stepper) == null || a.updateOperatorList(this.operatorList),
                  !this.running && this._continue();
              }
              _continue() {
                (this.running = !0),
                  !this.cancelled &&
                    (this.task.onContinue ? this.task.onContinue(this._scheduleNextBound) : this._scheduleNext());
              }
              _scheduleNext() {
                this._useRequestAnimationFrame
                  ? window.requestAnimationFrame(() => {
                      this._nextBound().catch(this._cancelBound);
                    })
                  : Promise.resolve().then(this._nextBound).catch(this._cancelBound);
              }
              _next() {
                return Yt(this, null, function* () {
                  this.cancelled ||
                    ((this.operatorListIdx = this.gfx.executeOperatorList(
                      this.operatorList,
                      this.operatorListIdx,
                      this._continueBound,
                      this.stepper,
                    )),
                    this.operatorListIdx === this.operatorList.argsArray.length &&
                      ((this.running = !1),
                      this.operatorList.lastChunk &&
                        (this.gfx.endDrawing(), t(l, r).delete(this._canvas), this.callback())));
                });
              }
            };
            (r = new WeakMap()), J(l, r, new WeakSet());
            let InternalRenderTask = l,
              version = "3.11.174";
            exports.version = version;
            let build = "ce8716743";
            exports.build = build;
          },
          (xt, g, ft) => {
            var R, p, N, Ci, A;
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.SerializableEmpty = g.PrintAnnotationStorage = g.AnnotationStorage = void 0);
            var c = ft(1),
              M = ft(4),
              lt = ft(8);
            let Q = Object.freeze({ map: null, hash: "", transfers: void 0 });
            g.SerializableEmpty = Q;
            class gt {
              constructor() {
                J(this, N);
                J(this, R, !1);
                J(this, p, new Map());
                (this.onSetModified = null), (this.onResetModified = null), (this.onAnnotationEditor = null);
              }
              getValue(E, f) {
                let h = t(this, p).get(E);
                return h === void 0 ? f : Object.assign(f, h);
              }
              getRawValue(E) {
                return t(this, p).get(E);
              }
              remove(E) {
                if (
                  (t(this, p).delete(E),
                  t(this, p).size === 0 && this.resetModified(),
                  typeof this.onAnnotationEditor == "function")
                ) {
                  for (let f of t(this, p).values()) if (f instanceof M.AnnotationEditor) return;
                  this.onAnnotationEditor(null);
                }
              }
              setValue(E, f) {
                let h = t(this, p).get(E),
                  m = !1;
                if (h !== void 0) for (let [I, y] of Object.entries(f)) h[I] !== y && ((m = !0), (h[I] = y));
                else (m = !0), t(this, p).set(E, f);
                m && z(this, N, Ci).call(this),
                  f instanceof M.AnnotationEditor &&
                    typeof this.onAnnotationEditor == "function" &&
                    this.onAnnotationEditor(f.constructor._type);
              }
              has(E) {
                return t(this, p).has(E);
              }
              getAll() {
                return t(this, p).size > 0 ? (0, c.objectFromMap)(t(this, p)) : null;
              }
              setAll(E) {
                for (let [f, h] of Object.entries(E)) this.setValue(f, h);
              }
              get size() {
                return t(this, p).size;
              }
              resetModified() {
                t(this, R) && (et(this, R, !1), typeof this.onResetModified == "function" && this.onResetModified());
              }
              get print() {
                return new B(this);
              }
              get serializable() {
                if (t(this, p).size === 0) return Q;
                let E = new Map(),
                  f = new lt.MurmurHash3_64(),
                  h = [],
                  m = Object.create(null),
                  I = !1;
                for (let [y, r] of t(this, p)) {
                  let l = r instanceof M.AnnotationEditor ? r.serialize(!1, m) : r;
                  l && (E.set(y, l), f.update(`${y}:${JSON.stringify(l)}`), I || (I = !!l.bitmap));
                }
                if (I) for (let y of E.values()) y.bitmap && h.push(y.bitmap);
                return E.size > 0 ? { map: E, hash: f.hexdigest(), transfers: h } : Q;
              }
            }
            (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakSet()),
              (Ci = function () {
                t(this, R) || (et(this, R, !0), typeof this.onSetModified == "function" && this.onSetModified());
              }),
              (g.AnnotationStorage = gt);
            class B extends gt {
              constructor(f) {
                super();
                J(this, A);
                let { map: h, hash: m, transfers: I } = f.serializable,
                  y = structuredClone(h, I ? { transfer: I } : null);
                et(this, A, { map: y, hash: m, transfers: I });
              }
              get print() {
                (0, c.unreachable)("Should not call PrintAnnotationStorage.print");
              }
              get serializable() {
                return t(this, A);
              }
            }
            (A = new WeakMap()), (g.PrintAnnotationStorage = B);
          },
          (xt, g, ft) => {
            var B, R, p, N, O, A, b, E, f, h, m, I, y, r, l, We, Ge, o, ze, Xe, Ti, xi, Pi, Ve, ki;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.AnnotationEditor = void 0);
            var c = ft(5),
              M = ft(1),
              lt = ft(6);
            let j = class j {
              constructor(C) {
                J(this, l);
                J(this, B, "");
                J(this, R, !1);
                J(this, p, null);
                J(this, N, null);
                J(this, O, null);
                J(this, A, !1);
                J(this, b, null);
                J(this, E, this.focusin.bind(this));
                J(this, f, this.focusout.bind(this));
                J(this, h, !1);
                J(this, m, !1);
                J(this, I, !1);
                Jt(this, "_initialOptions", Object.create(null));
                Jt(this, "_uiManager", null);
                Jt(this, "_focusEventsAllowed", !0);
                Jt(this, "_l10nPromise", null);
                J(this, y, !1);
                J(this, r, j._zIndex++);
                this.constructor === j && (0, M.unreachable)("Cannot initialize AnnotationEditor."),
                  (this.parent = C.parent),
                  (this.id = C.id),
                  (this.width = this.height = null),
                  (this.pageIndex = C.parent.pageIndex),
                  (this.name = C.name),
                  (this.div = null),
                  (this._uiManager = C.uiManager),
                  (this.annotationElementId = null),
                  (this._willKeepAspectRatio = !1),
                  (this._initialOptions.isCentered = C.isCentered),
                  (this._structTreeParentId = null);
                let {
                  rotation: U,
                  rawDims: { pageWidth: $, pageHeight: S, pageX: e, pageY: i },
                } = this.parent.viewport;
                (this.rotation = U),
                  (this.pageRotation = (360 + U - this._uiManager.viewParameters.rotation) % 360),
                  (this.pageDimensions = [$, S]),
                  (this.pageTranslation = [e, i]);
                let [d, T] = this.parentDimensions;
                (this.x = C.x / d), (this.y = C.y / T), (this.isAttachedToDOM = !1), (this.deleted = !1);
              }
              get editorType() {
                return Object.getPrototypeOf(this).constructor._type;
              }
              static get _defaultLineColor() {
                return (0, M.shadow)(this, "_defaultLineColor", this._colorManager.getHexCode("CanvasText"));
              }
              static deleteAnnotationElement(C) {
                let U = new gt({ id: C.parent.getNextId(), parent: C.parent, uiManager: C._uiManager });
                (U.annotationElementId = C.annotationElementId),
                  (U.deleted = !0),
                  U._uiManager.addToAnnotationStorage(U);
              }
              static initialize(C, U = null) {
                if (
                  (j._l10nPromise ||
                    (j._l10nPromise = new Map(
                      [
                        "editor_alt_text_button_label",
                        "editor_alt_text_edit_button_label",
                        "editor_alt_text_decorative_tooltip",
                      ].map((S) => [S, C.get(S)]),
                    )),
                  U != null && U.strings)
                )
                  for (let S of U.strings) j._l10nPromise.set(S, C.get(S));
                if (j._borderLineWidth !== -1) return;
                let $ = getComputedStyle(document.documentElement);
                j._borderLineWidth = parseFloat($.getPropertyValue("--outline-width")) || 0;
              }
              static updateDefaultParams(C, U) {}
              static get defaultPropertiesToUpdate() {
                return [];
              }
              static isHandlingMimeForPasting(C) {
                return !1;
              }
              static paste(C, U) {
                (0, M.unreachable)("Not implemented");
              }
              get propertiesToUpdate() {
                return [];
              }
              get _isDraggable() {
                return t(this, y);
              }
              set _isDraggable(C) {
                var U;
                et(this, y, C), (U = this.div) == null || U.classList.toggle("draggable", C);
              }
              center() {
                let [C, U] = this.pageDimensions;
                switch (this.parentRotation) {
                  case 90:
                    (this.x -= (this.height * U) / (C * 2)), (this.y += (this.width * C) / (U * 2));
                    break;
                  case 180:
                    (this.x += this.width / 2), (this.y += this.height / 2);
                    break;
                  case 270:
                    (this.x += (this.height * U) / (C * 2)), (this.y -= (this.width * C) / (U * 2));
                    break;
                  default:
                    (this.x -= this.width / 2), (this.y -= this.height / 2);
                    break;
                }
                this.fixAndSetPosition();
              }
              addCommands(C) {
                this._uiManager.addCommands(C);
              }
              get currentLayer() {
                return this._uiManager.currentLayer;
              }
              setInBackground() {
                this.div.style.zIndex = 0;
              }
              setInForeground() {
                this.div.style.zIndex = t(this, r);
              }
              setParent(C) {
                C !== null && ((this.pageIndex = C.pageIndex), (this.pageDimensions = C.pageDimensions)),
                  (this.parent = C);
              }
              focusin(C) {
                this._focusEventsAllowed && (t(this, h) ? et(this, h, !1) : this.parent.setSelected(this));
              }
              focusout(C) {
                var $;
                if (!this._focusEventsAllowed || !this.isAttachedToDOM) return;
                let U = C.relatedTarget;
                (U != null && U.closest(`#${this.id}`)) ||
                  (C.preventDefault(), (($ = this.parent) != null && $.isMultipleSelection) || this.commitOrRemove());
              }
              commitOrRemove() {
                this.isEmpty() ? this.remove() : this.commit();
              }
              commit() {
                this.addToAnnotationStorage();
              }
              addToAnnotationStorage() {
                this._uiManager.addToAnnotationStorage(this);
              }
              setAt(C, U, $, S) {
                let [e, i] = this.parentDimensions;
                ([$, S] = this.screenToPageTranslation($, S)),
                  (this.x = (C + $) / e),
                  (this.y = (U + S) / i),
                  this.fixAndSetPosition();
              }
              translate(C, U) {
                z(this, l, We).call(this, this.parentDimensions, C, U);
              }
              translateInPage(C, U) {
                z(this, l, We).call(this, this.pageDimensions, C, U), this.div.scrollIntoView({ block: "nearest" });
              }
              drag(C, U) {
                let [$, S] = this.parentDimensions;
                if (
                  ((this.x += C / $),
                  (this.y += U / S),
                  this.parent && (this.x < 0 || this.x > 1 || this.y < 0 || this.y > 1))
                ) {
                  let { x, y: P } = this.div.getBoundingClientRect();
                  this.parent.findNewParent(this, x, P) &&
                    ((this.x -= Math.floor(this.x)), (this.y -= Math.floor(this.y)));
                }
                let { x: e, y: i } = this,
                  [d, T] = z(this, l, Ge).call(this);
                (e += d),
                  (i += T),
                  (this.div.style.left = `${(100 * e).toFixed(2)}%`),
                  (this.div.style.top = `${(100 * i).toFixed(2)}%`),
                  this.div.scrollIntoView({ block: "nearest" });
              }
              fixAndSetPosition() {
                let [C, U] = this.pageDimensions,
                  { x: $, y: S, width: e, height: i } = this;
                switch (((e *= C), (i *= U), ($ *= C), (S *= U), this.rotation)) {
                  case 0:
                    ($ = Math.max(0, Math.min(C - e, $))), (S = Math.max(0, Math.min(U - i, S)));
                    break;
                  case 90:
                    ($ = Math.max(0, Math.min(C - i, $))), (S = Math.min(U, Math.max(e, S)));
                    break;
                  case 180:
                    ($ = Math.min(C, Math.max(e, $))), (S = Math.min(U, Math.max(i, S)));
                    break;
                  case 270:
                    ($ = Math.min(C, Math.max(i, $))), (S = Math.max(0, Math.min(U - e, S)));
                    break;
                }
                (this.x = $ /= C), (this.y = S /= U);
                let [d, T] = z(this, l, Ge).call(this);
                ($ += d), (S += T);
                let { style: x } = this.div;
                (x.left = `${(100 * $).toFixed(2)}%`), (x.top = `${(100 * S).toFixed(2)}%`), this.moveInDOM();
              }
              screenToPageTranslation(C, U) {
                var $;
                return z(($ = j), o, ze).call($, C, U, this.parentRotation);
              }
              pageTranslationToScreen(C, U) {
                var $;
                return z(($ = j), o, ze).call($, C, U, 360 - this.parentRotation);
              }
              get parentScale() {
                return this._uiManager.viewParameters.realScale;
              }
              get parentRotation() {
                return (this._uiManager.viewParameters.rotation + this.pageRotation) % 360;
              }
              get parentDimensions() {
                let {
                    parentScale: C,
                    pageDimensions: [U, $],
                  } = this,
                  S = U * C,
                  e = $ * C;
                return M.FeatureTest.isCSSRoundSupported ? [Math.round(S), Math.round(e)] : [S, e];
              }
              setDims(C, U) {
                var e;
                let [$, S] = this.parentDimensions;
                (this.div.style.width = `${((100 * C) / $).toFixed(2)}%`),
                  t(this, A) || (this.div.style.height = `${((100 * U) / S).toFixed(2)}%`),
                  (e = t(this, p)) == null ||
                    e.classList.toggle("small", C < j.SMALL_EDITOR_SIZE || U < j.SMALL_EDITOR_SIZE);
              }
              fixDims() {
                let { style: C } = this.div,
                  { height: U, width: $ } = C,
                  S = $.endsWith("%"),
                  e = !t(this, A) && U.endsWith("%");
                if (S && e) return;
                let [i, d] = this.parentDimensions;
                S || (C.width = `${((100 * parseFloat($)) / i).toFixed(2)}%`),
                  !t(this, A) && !e && (C.height = `${((100 * parseFloat(U)) / d).toFixed(2)}%`);
              }
              getInitialTranslation() {
                return [0, 0];
              }
              addAltTextButton() {
                return Yt(this, null, function* () {
                  if (t(this, p)) return;
                  let C = et(this, p, document.createElement("button"));
                  C.className = "altText";
                  let U = yield j._l10nPromise.get("editor_alt_text_button_label");
                  (C.textContent = U),
                    C.setAttribute("aria-label", U),
                    (C.tabIndex = "0"),
                    C.addEventListener("contextmenu", lt.noContextMenu),
                    C.addEventListener("pointerdown", ($) => $.stopPropagation()),
                    C.addEventListener(
                      "click",
                      ($) => {
                        $.preventDefault(), this._uiManager.editAltText(this);
                      },
                      { capture: !0 },
                    ),
                    C.addEventListener("keydown", ($) => {
                      $.target === C && $.key === "Enter" && ($.preventDefault(), this._uiManager.editAltText(this));
                    }),
                    z(this, l, Ve).call(this),
                    this.div.append(C),
                    j.SMALL_EDITOR_SIZE ||
                      (j.SMALL_EDITOR_SIZE = Math.min(128, Math.round(C.getBoundingClientRect().width * 1.4)));
                });
              }
              getClientDimensions() {
                return this.div.getBoundingClientRect();
              }
              get altTextData() {
                return { altText: t(this, B), decorative: t(this, R) };
              }
              set altTextData({ altText: C, decorative: U }) {
                (t(this, B) === C && t(this, R) === U) || (et(this, B, C), et(this, R, U), z(this, l, Ve).call(this));
              }
              render() {
                (this.div = document.createElement("div")),
                  this.div.setAttribute("data-editor-rotation", (360 - this.rotation) % 360),
                  (this.div.className = this.name),
                  this.div.setAttribute("id", this.id),
                  this.div.setAttribute("tabIndex", 0),
                  this.setInForeground(),
                  this.div.addEventListener("focusin", t(this, E)),
                  this.div.addEventListener("focusout", t(this, f));
                let [C, U] = this.parentDimensions;
                this.parentRotation % 180 !== 0 &&
                  ((this.div.style.maxWidth = `${((100 * U) / C).toFixed(2)}%`),
                  (this.div.style.maxHeight = `${((100 * C) / U).toFixed(2)}%`));
                let [$, S] = this.getInitialTranslation();
                return this.translate($, S), (0, c.bindEvents)(this, this.div, ["pointerdown"]), this.div;
              }
              pointerdown(C) {
                let { isMac: U } = M.FeatureTest.platform;
                if (C.button !== 0 || (C.ctrlKey && U)) {
                  C.preventDefault();
                  return;
                }
                et(this, h, !0), z(this, l, ki).call(this, C);
              }
              moveInDOM() {
                var C;
                (C = this.parent) == null || C.moveEditorInDOM(this);
              }
              _setParentAndPosition(C, U, $) {
                C.changeParent(this), (this.x = U), (this.y = $), this.fixAndSetPosition();
              }
              getRect(C, U) {
                let $ = this.parentScale,
                  [S, e] = this.pageDimensions,
                  [i, d] = this.pageTranslation,
                  T = C / $,
                  x = U / $,
                  P = this.x * S,
                  G = this.y * e,
                  st = this.width * S,
                  ct = this.height * e;
                switch (this.rotation) {
                  case 0:
                    return [P + T + i, e - G - x - ct + d, P + T + st + i, e - G - x + d];
                  case 90:
                    return [P + x + i, e - G + T + d, P + x + ct + i, e - G + T + st + d];
                  case 180:
                    return [P - T - st + i, e - G + x + d, P - T + i, e - G + x + ct + d];
                  case 270:
                    return [P - x - ct + i, e - G - T - st + d, P - x + i, e - G - T + d];
                  default:
                    throw new Error("Invalid rotation");
                }
              }
              getRectInCurrentCoords(C, U) {
                let [$, S, e, i] = C,
                  d = e - $,
                  T = i - S;
                switch (this.rotation) {
                  case 0:
                    return [$, U - i, d, T];
                  case 90:
                    return [$, U - S, T, d];
                  case 180:
                    return [e, U - S, d, T];
                  case 270:
                    return [e, U - i, T, d];
                  default:
                    throw new Error("Invalid rotation");
                }
              }
              onceAdded() {}
              isEmpty() {
                return !1;
              }
              enableEditMode() {
                et(this, I, !0);
              }
              disableEditMode() {
                et(this, I, !1);
              }
              isInEditMode() {
                return t(this, I);
              }
              shouldGetKeyboardEvents() {
                return !1;
              }
              needsToBeRebuilt() {
                return this.div && !this.isAttachedToDOM;
              }
              rebuild() {
                var C, U;
                (C = this.div) == null || C.addEventListener("focusin", t(this, E)),
                  (U = this.div) == null || U.addEventListener("focusout", t(this, f));
              }
              serialize(C = !1, U = null) {
                (0, M.unreachable)("An editor must be serializable");
              }
              static deserialize(C, U, $) {
                let S = new this.prototype.constructor({ parent: U, id: U.getNextId(), uiManager: $ });
                S.rotation = C.rotation;
                let [e, i] = S.pageDimensions,
                  [d, T, x, P] = S.getRectInCurrentCoords(C.rect, i);
                return (S.x = d / e), (S.y = T / i), (S.width = x / e), (S.height = P / i), S;
              }
              remove() {
                var C;
                this.div.removeEventListener("focusin", t(this, E)),
                  this.div.removeEventListener("focusout", t(this, f)),
                  this.isEmpty() || this.commit(),
                  this.parent ? this.parent.remove(this) : this._uiManager.removeEditor(this),
                  (C = t(this, p)) == null || C.remove(),
                  et(this, p, null),
                  et(this, N, null);
              }
              get isResizable() {
                return !1;
              }
              makeResizable() {
                this.isResizable && (z(this, l, Ti).call(this), t(this, b).classList.remove("hidden"));
              }
              select() {
                var C;
                this.makeResizable(), (C = this.div) == null || C.classList.add("selectedEditor");
              }
              unselect() {
                var C, U, $;
                (C = t(this, b)) == null || C.classList.add("hidden"),
                  (U = this.div) == null || U.classList.remove("selectedEditor"),
                  ($ = this.div) != null &&
                    $.contains(document.activeElement) &&
                    this._uiManager.currentLayer.div.focus();
              }
              updateParams(C, U) {}
              disableEditing() {
                t(this, p) && (t(this, p).hidden = !0);
              }
              enableEditing() {
                t(this, p) && (t(this, p).hidden = !1);
              }
              enterInEditMode() {}
              get contentDiv() {
                return this.div;
              }
              get isEditing() {
                return t(this, m);
              }
              set isEditing(C) {
                et(this, m, C),
                  this.parent &&
                    (C
                      ? (this.parent.setSelected(this), this.parent.setActiveEditor(this))
                      : this.parent.setActiveEditor(null));
              }
              setAspectRatio(C, U) {
                et(this, A, !0);
                let $ = C / U,
                  { style: S } = this.div;
                (S.aspectRatio = $), (S.height = "auto");
              }
              static get MIN_SIZE() {
                return 16;
              }
            };
            (B = new WeakMap()),
              (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakMap()),
              (m = new WeakMap()),
              (I = new WeakMap()),
              (y = new WeakMap()),
              (r = new WeakMap()),
              (l = new WeakSet()),
              (We = function ([C, U], $, S) {
                ([$, S] = this.screenToPageTranslation($, S)),
                  (this.x += $ / C),
                  (this.y += S / U),
                  this.fixAndSetPosition();
              }),
              (Ge = function () {
                let [C, U] = this.parentDimensions,
                  { _borderLineWidth: $ } = j,
                  S = $ / C,
                  e = $ / U;
                switch (this.rotation) {
                  case 90:
                    return [-S, e];
                  case 180:
                    return [S, e];
                  case 270:
                    return [S, -e];
                  default:
                    return [-S, -e];
                }
              }),
              (o = new WeakSet()),
              (ze = function (C, U, $) {
                switch ($) {
                  case 90:
                    return [U, -C];
                  case 180:
                    return [-C, -U];
                  case 270:
                    return [-U, C];
                  default:
                    return [C, U];
                }
              }),
              (Xe = function (C) {
                switch (C) {
                  case 90: {
                    let [U, $] = this.pageDimensions;
                    return [0, -U / $, $ / U, 0];
                  }
                  case 180:
                    return [-1, 0, 0, -1];
                  case 270: {
                    let [U, $] = this.pageDimensions;
                    return [0, U / $, -$ / U, 0];
                  }
                  default:
                    return [1, 0, 0, 1];
                }
              }),
              (Ti = function () {
                if (t(this, b)) return;
                et(this, b, document.createElement("div")), t(this, b).classList.add("resizers");
                let C = ["topLeft", "topRight", "bottomRight", "bottomLeft"];
                this._willKeepAspectRatio || C.push("topMiddle", "middleRight", "bottomMiddle", "middleLeft");
                for (let U of C) {
                  let $ = document.createElement("div");
                  t(this, b).append($),
                    $.classList.add("resizer", U),
                    $.addEventListener("pointerdown", z(this, l, xi).bind(this, U)),
                    $.addEventListener("contextmenu", lt.noContextMenu);
                }
                this.div.prepend(t(this, b));
              }),
              (xi = function (C, U) {
                U.preventDefault();
                let { isMac: $ } = M.FeatureTest.platform;
                if (U.button !== 0 || (U.ctrlKey && $)) return;
                let S = z(this, l, Pi).bind(this, C),
                  e = this._isDraggable;
                this._isDraggable = !1;
                let i = { passive: !0, capture: !0 };
                window.addEventListener("pointermove", S, i);
                let d = this.x,
                  T = this.y,
                  x = this.width,
                  P = this.height,
                  G = this.parent.div.style.cursor,
                  st = this.div.style.cursor;
                this.div.style.cursor = this.parent.div.style.cursor = window.getComputedStyle(U.target).cursor;
                let ct = () => {
                  (this._isDraggable = e),
                    window.removeEventListener("pointerup", ct),
                    window.removeEventListener("blur", ct),
                    window.removeEventListener("pointermove", S, i),
                    (this.parent.div.style.cursor = G),
                    (this.div.style.cursor = st);
                  let ht = this.x,
                    pt = this.y,
                    At = this.width,
                    yt = this.height;
                  (ht === d && pt === T && At === x && yt === P) ||
                    this.addCommands({
                      cmd: () => {
                        (this.width = At), (this.height = yt), (this.x = ht), (this.y = pt);
                        let [Y, Z] = this.parentDimensions;
                        this.setDims(Y * At, Z * yt), this.fixAndSetPosition();
                      },
                      undo: () => {
                        (this.width = x), (this.height = P), (this.x = d), (this.y = T);
                        let [Y, Z] = this.parentDimensions;
                        this.setDims(Y * x, Z * P), this.fixAndSetPosition();
                      },
                      mustExec: !0,
                    });
                };
                window.addEventListener("pointerup", ct), window.addEventListener("blur", ct);
              }),
              (Pi = function (C, U) {
                let [$, S] = this.parentDimensions,
                  e = this.x,
                  i = this.y,
                  d = this.width,
                  T = this.height,
                  x = j.MIN_SIZE / $,
                  P = j.MIN_SIZE / S,
                  G = (Mt) => Math.round(Mt * 1e4) / 1e4,
                  st = z(this, l, Xe).call(this, this.rotation),
                  ct = (Mt, Nt) => [st[0] * Mt + st[2] * Nt, st[1] * Mt + st[3] * Nt],
                  ht = z(this, l, Xe).call(this, 360 - this.rotation),
                  pt = (Mt, Nt) => [ht[0] * Mt + ht[2] * Nt, ht[1] * Mt + ht[3] * Nt],
                  At,
                  yt,
                  Y = !1,
                  Z = !1;
                switch (C) {
                  case "topLeft":
                    (Y = !0), (At = (Mt, Nt) => [0, 0]), (yt = (Mt, Nt) => [Mt, Nt]);
                    break;
                  case "topMiddle":
                    (At = (Mt, Nt) => [Mt / 2, 0]), (yt = (Mt, Nt) => [Mt / 2, Nt]);
                    break;
                  case "topRight":
                    (Y = !0), (At = (Mt, Nt) => [Mt, 0]), (yt = (Mt, Nt) => [0, Nt]);
                    break;
                  case "middleRight":
                    (Z = !0), (At = (Mt, Nt) => [Mt, Nt / 2]), (yt = (Mt, Nt) => [0, Nt / 2]);
                    break;
                  case "bottomRight":
                    (Y = !0), (At = (Mt, Nt) => [Mt, Nt]), (yt = (Mt, Nt) => [0, 0]);
                    break;
                  case "bottomMiddle":
                    (At = (Mt, Nt) => [Mt / 2, Nt]), (yt = (Mt, Nt) => [Mt / 2, 0]);
                    break;
                  case "bottomLeft":
                    (Y = !0), (At = (Mt, Nt) => [0, Nt]), (yt = (Mt, Nt) => [Mt, 0]);
                    break;
                  case "middleLeft":
                    (Z = !0), (At = (Mt, Nt) => [0, Nt / 2]), (yt = (Mt, Nt) => [Mt, Nt / 2]);
                    break;
                }
                let u = At(d, T),
                  F = yt(d, T),
                  X = ct(...F),
                  K = G(e + X[0]),
                  ut = G(i + X[1]),
                  vt = 1,
                  _t = 1,
                  [V, wt] = this.screenToPageTranslation(U.movementX, U.movementY);
                if ((([V, wt] = pt(V / $, wt / S)), Y)) {
                  let Mt = Math.hypot(d, T);
                  vt = _t = Math.max(
                    Math.min(Math.hypot(F[0] - u[0] - V, F[1] - u[1] - wt) / Mt, 1 / d, 1 / T),
                    x / d,
                    P / T,
                  );
                } else
                  Z
                    ? (vt = Math.max(x, Math.min(1, Math.abs(F[0] - u[0] - V))) / d)
                    : (_t = Math.max(P, Math.min(1, Math.abs(F[1] - u[1] - wt))) / T);
                let Et = G(d * vt),
                  jt = G(T * _t);
                X = ct(...yt(Et, jt));
                let Bt = K - X[0],
                  qt = ut - X[1];
                (this.width = Et),
                  (this.height = jt),
                  (this.x = Bt),
                  (this.y = qt),
                  this.setDims($ * Et, S * jt),
                  this.fixAndSetPosition();
              }),
              (Ve = function () {
                return Yt(this, null, function* () {
                  var $;
                  let C = t(this, p);
                  if (!C) return;
                  if (!t(this, B) && !t(this, R)) {
                    C.classList.remove("done"), ($ = t(this, N)) == null || $.remove();
                    return;
                  }
                  j._l10nPromise.get("editor_alt_text_edit_button_label").then((S) => {
                    C.setAttribute("aria-label", S);
                  });
                  let U = t(this, N);
                  if (!U) {
                    et(this, N, (U = document.createElement("span"))),
                      (U.className = "tooltip"),
                      U.setAttribute("role", "tooltip");
                    let S = (U.id = `alt-text-tooltip-${this.id}`);
                    C.setAttribute("aria-describedby", S);
                    let e = 100;
                    C.addEventListener("mouseenter", () => {
                      et(
                        this,
                        O,
                        setTimeout(() => {
                          et(this, O, null),
                            t(this, N).classList.add("show"),
                            this._uiManager._eventBus.dispatch("reporttelemetry", {
                              source: this,
                              details: {
                                type: "editing",
                                subtype: this.editorType,
                                data: { action: "alt_text_tooltip" },
                              },
                            });
                        }, e),
                      );
                    }),
                      C.addEventListener("mouseleave", () => {
                        var i;
                        clearTimeout(t(this, O)),
                          et(this, O, null),
                          (i = t(this, N)) == null || i.classList.remove("show");
                      });
                  }
                  C.classList.add("done"),
                    (U.innerText = t(this, R)
                      ? yield j._l10nPromise.get("editor_alt_text_decorative_tooltip")
                      : t(this, B)),
                    U.parentNode || C.append(U);
                });
              }),
              (ki = function (C) {
                if (!this._isDraggable) return;
                let U = this._uiManager.isSelected(this);
                this._uiManager.setUpDragSession();
                let $, S;
                U &&
                  (($ = { passive: !0, capture: !0 }),
                  (S = (i) => {
                    let [d, T] = this.screenToPageTranslation(i.movementX, i.movementY);
                    this._uiManager.dragSelectedEditors(d, T);
                  }),
                  window.addEventListener("pointermove", S, $));
                let e = () => {
                  if (
                    (window.removeEventListener("pointerup", e),
                    window.removeEventListener("blur", e),
                    U && window.removeEventListener("pointermove", S, $),
                    et(this, h, !1),
                    !this._uiManager.endDragSession())
                  ) {
                    let { isMac: i } = M.FeatureTest.platform;
                    (C.ctrlKey && !i) || C.shiftKey || (C.metaKey && i)
                      ? this.parent.toggleSelected(this)
                      : this.parent.setSelected(this);
                  }
                };
                window.addEventListener("pointerup", e), window.addEventListener("blur", e);
              }),
              J(j, o),
              Jt(j, "_borderLineWidth", -1),
              Jt(j, "_colorManager", new c.ColorManager()),
              Jt(j, "_zIndex", 1),
              Jt(j, "SMALL_EDITOR_SIZE", 0);
            let Q = j;
            g.AnnotationEditor = Q;
            class gt extends Q {
              constructor(C) {
                super(C), (this.annotationElementId = C.annotationElementId), (this.deleted = !0);
              }
              serialize() {
                return { id: this.annotationElementId, deleted: !0, pageIndex: this.pageIndex };
              }
            }
          },
          (xt, g, ft) => {
            var A,
              b,
              E,
              f,
              h,
              qe,
              y,
              r,
              l,
              s,
              a,
              Fi,
              n,
              _,
              k,
              it,
              H,
              q,
              j,
              rt,
              C,
              U,
              $,
              S,
              e,
              i,
              d,
              T,
              x,
              P,
              G,
              st,
              ct,
              ht,
              pt,
              At,
              yt,
              Y,
              Z,
              u,
              F,
              X,
              K,
              ut,
              vt,
              _t,
              V,
              Mi,
              $e,
              Ye,
              Ce,
              Ke,
              Je,
              te,
              pe,
              Ri,
              Di,
              Qe,
              ge,
              Ze;
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.KeyboardManager = g.CommandManager = g.ColorManager = g.AnnotationEditorUIManager = void 0),
              (g.bindEvents = lt),
              (g.opacityToHex = Q);
            var c = ft(1),
              M = ft(6);
            function lt(zt, D, dt) {
              for (let Ct of dt) D.addEventListener(Ct, zt[Ct].bind(zt));
            }
            function Q(zt) {
              return Math.round(Math.min(255, Math.max(1, 255 * zt)))
                .toString(16)
                .padStart(2, "0");
            }
            class gt {
              constructor() {
                J(this, A, 0);
              }
              getId() {
                return `${c.AnnotationEditorPrefix}${fe(this, A)._++}`;
              }
            }
            A = new WeakMap();
            let I = class I {
              constructor() {
                J(this, h);
                J(this, b, (0, c.getUuid)());
                J(this, E, 0);
                J(this, f, null);
              }
              static get _isSVGFittingCanvas() {
                let D =
                    'data:image/svg+xml;charset=UTF-8,<svg viewBox="0 0 1 1" width="1" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1" style="fill:red;"/></svg>',
                  Ct = new OffscreenCanvas(1, 3).getContext("2d"),
                  Dt = new Image();
                Dt.src = D;
                let Ot = Dt.decode().then(
                  () => (
                    Ct.drawImage(Dt, 0, 0, 1, 1, 0, 0, 1, 3),
                    new Uint32Array(Ct.getImageData(0, 0, 1, 1).data.buffer)[0] === 0
                  ),
                );
                return (0, c.shadow)(this, "_isSVGFittingCanvas", Ot);
              }
              getFromFile(D) {
                return Yt(this, null, function* () {
                  let { lastModified: dt, name: Ct, size: Dt, type: Ot } = D;
                  return z(this, h, qe).call(this, `${dt}_${Ct}_${Dt}_${Ot}`, D);
                });
              }
              getFromUrl(D) {
                return Yt(this, null, function* () {
                  return z(this, h, qe).call(this, D, D);
                });
              }
              getFromId(D) {
                return Yt(this, null, function* () {
                  t(this, f) || et(this, f, new Map());
                  let dt = t(this, f).get(D);
                  return dt
                    ? dt.bitmap
                      ? ((dt.refCounter += 1), dt)
                      : dt.file
                        ? this.getFromFile(dt.file)
                        : this.getFromUrl(dt.url)
                    : null;
                });
              }
              getSvgUrl(D) {
                let dt = t(this, f).get(D);
                return dt != null && dt.isSvg ? dt.svgUrl : null;
              }
              deleteId(D) {
                t(this, f) || et(this, f, new Map());
                let dt = t(this, f).get(D);
                dt && ((dt.refCounter -= 1), dt.refCounter === 0 && (dt.bitmap = null));
              }
              isValidId(D) {
                return D.startsWith(`image_${t(this, b)}_`);
              }
            };
            (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakSet()),
              (qe = function (D, dt) {
                return Yt(this, null, function* () {
                  t(this, f) || et(this, f, new Map());
                  let Ct = t(this, f).get(D);
                  if (Ct === null) return null;
                  if (Ct != null && Ct.bitmap) return (Ct.refCounter += 1), Ct;
                  try {
                    Ct ||
                      (Ct = { bitmap: null, id: `image_${t(this, b)}_${fe(this, E)._++}`, refCounter: 0, isSvg: !1 });
                    let Dt;
                    if (typeof dt == "string") {
                      Ct.url = dt;
                      let Ot = yield fetch(dt);
                      if (!Ot.ok) throw new Error(Ot.statusText);
                      Dt = yield Ot.blob();
                    } else Dt = Ct.file = dt;
                    if (Dt.type === "image/svg+xml") {
                      let Ot = I._isSVGFittingCanvas,
                        Pt = new FileReader(),
                        w = new Image(),
                        v = new Promise((W, at) => {
                          (w.onload = () => {
                            (Ct.bitmap = w), (Ct.isSvg = !0), W();
                          }),
                            (Pt.onload = () =>
                              Yt(this, null, function* () {
                                let ot = (Ct.svgUrl = Pt.result);
                                w.src = (yield Ot) ? `${ot}#svgView(preserveAspectRatio(none))` : ot;
                              })),
                            (w.onerror = Pt.onerror = at);
                        });
                      Pt.readAsDataURL(Dt), yield v;
                    } else Ct.bitmap = yield createImageBitmap(Dt);
                    Ct.refCounter = 1;
                  } catch (Dt) {
                    console.error(Dt), (Ct = null);
                  }
                  return t(this, f).set(D, Ct), Ct && t(this, f).set(Ct.id, Ct), Ct;
                });
              });
            let B = I;
            class R {
              constructor(D = 128) {
                J(this, y, []);
                J(this, r, !1);
                J(this, l);
                J(this, s, -1);
                et(this, l, D);
              }
              add({ cmd: D, undo: dt, mustExec: Ct, type: Dt = NaN, overwriteIfSameType: Ot = !1, keepUndo: Pt = !1 }) {
                if ((Ct && D(), t(this, r))) return;
                let w = { cmd: D, undo: dt, type: Dt };
                if (t(this, s) === -1) {
                  t(this, y).length > 0 && (t(this, y).length = 0), et(this, s, 0), t(this, y).push(w);
                  return;
                }
                if (Ot && t(this, y)[t(this, s)].type === Dt) {
                  Pt && (w.undo = t(this, y)[t(this, s)].undo), (t(this, y)[t(this, s)] = w);
                  return;
                }
                let v = t(this, s) + 1;
                v === t(this, l)
                  ? t(this, y).splice(0, 1)
                  : (et(this, s, v), v < t(this, y).length && t(this, y).splice(v)),
                  t(this, y).push(w);
              }
              undo() {
                t(this, s) !== -1 &&
                  (et(this, r, !0), t(this, y)[t(this, s)].undo(), et(this, r, !1), et(this, s, t(this, s) - 1));
              }
              redo() {
                t(this, s) < t(this, y).length - 1 &&
                  (et(this, s, t(this, s) + 1), et(this, r, !0), t(this, y)[t(this, s)].cmd(), et(this, r, !1));
              }
              hasSomethingToUndo() {
                return t(this, s) !== -1;
              }
              hasSomethingToRedo() {
                return t(this, s) < t(this, y).length - 1;
              }
              destroy() {
                et(this, y, null);
              }
            }
            (y = new WeakMap()), (r = new WeakMap()), (l = new WeakMap()), (s = new WeakMap()), (g.CommandManager = R);
            class p {
              constructor(D) {
                J(this, a);
                (this.buffer = []), (this.callbacks = new Map()), (this.allKeys = new Set());
                let { isMac: dt } = c.FeatureTest.platform;
                for (let [Ct, Dt, Ot = {}] of D)
                  for (let Pt of Ct) {
                    let w = Pt.startsWith("mac+");
                    dt && w
                      ? (this.callbacks.set(Pt.slice(4), { callback: Dt, options: Ot }),
                        this.allKeys.add(Pt.split("+").at(-1)))
                      : !dt &&
                        !w &&
                        (this.callbacks.set(Pt, { callback: Dt, options: Ot }), this.allKeys.add(Pt.split("+").at(-1)));
                  }
              }
              exec(D, dt) {
                if (!this.allKeys.has(dt.key)) return;
                let Ct = this.callbacks.get(z(this, a, Fi).call(this, dt));
                if (!Ct) return;
                let {
                  callback: Dt,
                  options: { bubbles: Ot = !1, args: Pt = [], checker: w = null },
                } = Ct;
                (w && !w(D, dt)) || (Dt.bind(D, ...Pt)(), Ot || (dt.stopPropagation(), dt.preventDefault()));
              }
            }
            (a = new WeakSet()),
              (Fi = function (D) {
                D.altKey && this.buffer.push("alt"),
                  D.ctrlKey && this.buffer.push("ctrl"),
                  D.metaKey && this.buffer.push("meta"),
                  D.shiftKey && this.buffer.push("shift"),
                  this.buffer.push(D.key);
                let dt = this.buffer.join("+");
                return (this.buffer.length = 0), dt;
              }),
              (g.KeyboardManager = p);
            let L = class L {
              get _colors() {
                let D = new Map([
                  ["CanvasText", null],
                  ["Canvas", null],
                ]);
                return (0, M.getColorValues)(D), (0, c.shadow)(this, "_colors", D);
              }
              convert(D) {
                let dt = (0, M.getRGB)(D);
                if (!window.matchMedia("(forced-colors: active)").matches) return dt;
                for (let [Ct, Dt] of this._colors)
                  if (Dt.every((Ot, Pt) => Ot === dt[Pt])) return L._colorsMapping.get(Ct);
                return dt;
              }
              getHexCode(D) {
                let dt = this._colors.get(D);
                return dt ? c.Util.makeHexColor(...dt) : D;
              }
            };
            Jt(
              L,
              "_colorsMapping",
              new Map([
                ["CanvasText", [0, 0, 0]],
                ["Canvas", [255, 255, 255]],
              ]),
            );
            let N = L;
            g.ColorManager = N;
            let Xt = class Xt {
              constructor(D, dt, Ct, Dt, Ot, Pt) {
                J(this, V);
                J(this, n, null);
                J(this, _, new Map());
                J(this, k, new Map());
                J(this, it, null);
                J(this, H, null);
                J(this, q, new R());
                J(this, j, 0);
                J(this, rt, new Set());
                J(this, C, null);
                J(this, U, null);
                J(this, $, new Set());
                J(this, S, null);
                J(this, e, new gt());
                J(this, i, !1);
                J(this, d, !1);
                J(this, T, null);
                J(this, x, c.AnnotationEditorType.NONE);
                J(this, P, new Set());
                J(this, G, null);
                J(this, st, this.blur.bind(this));
                J(this, ct, this.focus.bind(this));
                J(this, ht, this.copy.bind(this));
                J(this, pt, this.cut.bind(this));
                J(this, At, this.paste.bind(this));
                J(this, yt, this.keydown.bind(this));
                J(this, Y, this.onEditingAction.bind(this));
                J(this, Z, this.onPageChanging.bind(this));
                J(this, u, this.onScaleChanging.bind(this));
                J(this, F, this.onRotationChanging.bind(this));
                J(this, X, {
                  isEditing: !1,
                  isEmpty: !0,
                  hasSomethingToUndo: !1,
                  hasSomethingToRedo: !1,
                  hasSelectedEditor: !1,
                });
                J(this, K, [0, 0]);
                J(this, ut, null);
                J(this, vt, null);
                J(this, _t, null);
                et(this, vt, D),
                  et(this, _t, dt),
                  et(this, it, Ct),
                  (this._eventBus = Dt),
                  this._eventBus._on("editingaction", t(this, Y)),
                  this._eventBus._on("pagechanging", t(this, Z)),
                  this._eventBus._on("scalechanging", t(this, u)),
                  this._eventBus._on("rotationchanging", t(this, F)),
                  et(this, H, Ot.annotationStorage),
                  et(this, S, Ot.filterFactory),
                  et(this, G, Pt),
                  (this.viewParameters = { realScale: M.PixelsPerInch.PDF_TO_CSS_UNITS, rotation: 0 });
              }
              static get _keyboardManager() {
                let D = Xt.prototype,
                  dt = (Ot) => {
                    let { activeElement: Pt } = document;
                    return Pt && t(Ot, vt).contains(Pt) && Ot.hasSomethingToControl();
                  },
                  Ct = this.TRANSLATE_SMALL,
                  Dt = this.TRANSLATE_BIG;
                return (0, c.shadow)(
                  this,
                  "_keyboardManager",
                  new p([
                    [["ctrl+a", "mac+meta+a"], D.selectAll],
                    [["ctrl+z", "mac+meta+z"], D.undo],
                    [["ctrl+y", "ctrl+shift+z", "mac+meta+shift+z", "ctrl+shift+Z", "mac+meta+shift+Z"], D.redo],
                    [
                      [
                        "Backspace",
                        "alt+Backspace",
                        "ctrl+Backspace",
                        "shift+Backspace",
                        "mac+Backspace",
                        "mac+alt+Backspace",
                        "mac+ctrl+Backspace",
                        "Delete",
                        "ctrl+Delete",
                        "shift+Delete",
                        "mac+Delete",
                      ],
                      D.delete,
                    ],
                    [["Escape", "mac+Escape"], D.unselectAll],
                    [["ArrowLeft", "mac+ArrowLeft"], D.translateSelectedEditors, { args: [-Ct, 0], checker: dt }],
                    [
                      ["ctrl+ArrowLeft", "mac+shift+ArrowLeft"],
                      D.translateSelectedEditors,
                      { args: [-Dt, 0], checker: dt },
                    ],
                    [["ArrowRight", "mac+ArrowRight"], D.translateSelectedEditors, { args: [Ct, 0], checker: dt }],
                    [
                      ["ctrl+ArrowRight", "mac+shift+ArrowRight"],
                      D.translateSelectedEditors,
                      { args: [Dt, 0], checker: dt },
                    ],
                    [["ArrowUp", "mac+ArrowUp"], D.translateSelectedEditors, { args: [0, -Ct], checker: dt }],
                    [
                      ["ctrl+ArrowUp", "mac+shift+ArrowUp"],
                      D.translateSelectedEditors,
                      { args: [0, -Dt], checker: dt },
                    ],
                    [["ArrowDown", "mac+ArrowDown"], D.translateSelectedEditors, { args: [0, Ct], checker: dt }],
                    [
                      ["ctrl+ArrowDown", "mac+shift+ArrowDown"],
                      D.translateSelectedEditors,
                      { args: [0, Dt], checker: dt },
                    ],
                  ]),
                );
              }
              destroy() {
                z(this, V, Ce).call(this),
                  z(this, V, $e).call(this),
                  this._eventBus._off("editingaction", t(this, Y)),
                  this._eventBus._off("pagechanging", t(this, Z)),
                  this._eventBus._off("scalechanging", t(this, u)),
                  this._eventBus._off("rotationchanging", t(this, F));
                for (let D of t(this, k).values()) D.destroy();
                t(this, k).clear(),
                  t(this, _).clear(),
                  t(this, $).clear(),
                  et(this, n, null),
                  t(this, P).clear(),
                  t(this, q).destroy(),
                  t(this, it).destroy();
              }
              get hcmFilter() {
                return (0, c.shadow)(
                  this,
                  "hcmFilter",
                  t(this, G) ? t(this, S).addHCMFilter(t(this, G).foreground, t(this, G).background) : "none",
                );
              }
              get direction() {
                return (0, c.shadow)(this, "direction", getComputedStyle(t(this, vt)).direction);
              }
              editAltText(D) {
                var dt;
                (dt = t(this, it)) == null || dt.editAltText(this, D);
              }
              onPageChanging({ pageNumber: D }) {
                et(this, j, D - 1);
              }
              focusMainContainer() {
                t(this, vt).focus();
              }
              findParent(D, dt) {
                for (let Ct of t(this, k).values()) {
                  let { x: Dt, y: Ot, width: Pt, height: w } = Ct.div.getBoundingClientRect();
                  if (D >= Dt && D <= Dt + Pt && dt >= Ot && dt <= Ot + w) return Ct;
                }
                return null;
              }
              disableUserSelect(D = !1) {
                t(this, _t).classList.toggle("noUserSelect", D);
              }
              addShouldRescale(D) {
                t(this, $).add(D);
              }
              removeShouldRescale(D) {
                t(this, $).delete(D);
              }
              onScaleChanging({ scale: D }) {
                this.commitOrRemove(), (this.viewParameters.realScale = D * M.PixelsPerInch.PDF_TO_CSS_UNITS);
                for (let dt of t(this, $)) dt.onScaleChanging();
              }
              onRotationChanging({ pagesRotation: D }) {
                this.commitOrRemove(), (this.viewParameters.rotation = D);
              }
              addToAnnotationStorage(D) {
                !D.isEmpty() && t(this, H) && !t(this, H).has(D.id) && t(this, H).setValue(D.id, D);
              }
              blur() {
                if (!this.hasSelection) return;
                let { activeElement: D } = document;
                for (let dt of t(this, P))
                  if (dt.div.contains(D)) {
                    et(this, T, [dt, D]), (dt._focusEventsAllowed = !1);
                    break;
                  }
              }
              focus() {
                if (!t(this, T)) return;
                let [D, dt] = t(this, T);
                et(this, T, null),
                  dt.addEventListener(
                    "focusin",
                    () => {
                      D._focusEventsAllowed = !0;
                    },
                    { once: !0 },
                  ),
                  dt.focus();
              }
              addEditListeners() {
                z(this, V, Ye).call(this), z(this, V, Ke).call(this);
              }
              removeEditListeners() {
                z(this, V, Ce).call(this), z(this, V, Je).call(this);
              }
              copy(D) {
                var Ct;
                if ((D.preventDefault(), (Ct = t(this, n)) == null || Ct.commitOrRemove(), !this.hasSelection)) return;
                let dt = [];
                for (let Dt of t(this, P)) {
                  let Ot = Dt.serialize(!0);
                  Ot && dt.push(Ot);
                }
                dt.length !== 0 && D.clipboardData.setData("application/pdfjs", JSON.stringify(dt));
              }
              cut(D) {
                this.copy(D), this.delete();
              }
              paste(D) {
                D.preventDefault();
                let { clipboardData: dt } = D;
                for (let Ot of dt.items)
                  for (let Pt of t(this, U))
                    if (Pt.isHandlingMimeForPasting(Ot.type)) {
                      Pt.paste(Ot, this.currentLayer);
                      return;
                    }
                let Ct = dt.getData("application/pdfjs");
                if (!Ct) return;
                try {
                  Ct = JSON.parse(Ct);
                } catch (Ot) {
                  (0, c.warn)(`paste: "${Ot.message}".`);
                  return;
                }
                if (!Array.isArray(Ct)) return;
                this.unselectAll();
                let Dt = this.currentLayer;
                try {
                  let Ot = [];
                  for (let v of Ct) {
                    let W = Dt.deserialize(v);
                    if (!W) return;
                    Ot.push(W);
                  }
                  let Pt = () => {
                      for (let v of Ot) z(this, V, Qe).call(this, v);
                      z(this, V, Ze).call(this, Ot);
                    },
                    w = () => {
                      for (let v of Ot) v.remove();
                    };
                  this.addCommands({ cmd: Pt, undo: w, mustExec: !0 });
                } catch (Ot) {
                  (0, c.warn)(`paste: "${Ot.message}".`);
                }
              }
              keydown(D) {
                var dt;
                ((dt = this.getActive()) != null && dt.shouldGetKeyboardEvents()) || Xt._keyboardManager.exec(this, D);
              }
              onEditingAction(D) {
                ["undo", "redo", "delete", "selectAll"].includes(D.name) && this[D.name]();
              }
              setEditingState(D) {
                D
                  ? (z(this, V, Mi).call(this),
                    z(this, V, Ye).call(this),
                    z(this, V, Ke).call(this),
                    z(this, V, te).call(this, {
                      isEditing: t(this, x) !== c.AnnotationEditorType.NONE,
                      isEmpty: z(this, V, ge).call(this),
                      hasSomethingToUndo: t(this, q).hasSomethingToUndo(),
                      hasSomethingToRedo: t(this, q).hasSomethingToRedo(),
                      hasSelectedEditor: !1,
                    }))
                  : (z(this, V, $e).call(this),
                    z(this, V, Ce).call(this),
                    z(this, V, Je).call(this),
                    z(this, V, te).call(this, { isEditing: !1 }),
                    this.disableUserSelect(!1));
              }
              registerEditorTypes(D) {
                if (!t(this, U)) {
                  et(this, U, D);
                  for (let dt of t(this, U)) z(this, V, pe).call(this, dt.defaultPropertiesToUpdate);
                }
              }
              getId() {
                return t(this, e).getId();
              }
              get currentLayer() {
                return t(this, k).get(t(this, j));
              }
              getLayer(D) {
                return t(this, k).get(D);
              }
              get currentPageIndex() {
                return t(this, j);
              }
              addLayer(D) {
                t(this, k).set(D.pageIndex, D), t(this, i) ? D.enable() : D.disable();
              }
              removeLayer(D) {
                t(this, k).delete(D.pageIndex);
              }
              updateMode(D, dt = null) {
                if (t(this, x) !== D) {
                  if ((et(this, x, D), D === c.AnnotationEditorType.NONE)) {
                    this.setEditingState(!1), z(this, V, Di).call(this);
                    return;
                  }
                  this.setEditingState(!0), z(this, V, Ri).call(this), this.unselectAll();
                  for (let Ct of t(this, k).values()) Ct.updateMode(D);
                  if (dt) {
                    for (let Ct of t(this, _).values())
                      if (Ct.annotationElementId === dt) {
                        this.setSelected(Ct), Ct.enterInEditMode();
                        break;
                      }
                  }
                }
              }
              updateToolbar(D) {
                D !== t(this, x) && this._eventBus.dispatch("switchannotationeditormode", { source: this, mode: D });
              }
              updateParams(D, dt) {
                if (t(this, U)) {
                  if (D === c.AnnotationEditorParamsType.CREATE) {
                    this.currentLayer.addNewEditor(D);
                    return;
                  }
                  for (let Ct of t(this, P)) Ct.updateParams(D, dt);
                  for (let Ct of t(this, U)) Ct.updateDefaultParams(D, dt);
                }
              }
              enableWaiting(D = !1) {
                if (t(this, d) !== D) {
                  et(this, d, D);
                  for (let dt of t(this, k).values())
                    D ? dt.disableClick() : dt.enableClick(), dt.div.classList.toggle("waiting", D);
                }
              }
              getEditors(D) {
                let dt = [];
                for (let Ct of t(this, _).values()) Ct.pageIndex === D && dt.push(Ct);
                return dt;
              }
              getEditor(D) {
                return t(this, _).get(D);
              }
              addEditor(D) {
                t(this, _).set(D.id, D);
              }
              removeEditor(D) {
                var dt;
                t(this, _).delete(D.id),
                  this.unselect(D),
                  (!D.annotationElementId || !t(this, rt).has(D.annotationElementId)) &&
                    ((dt = t(this, H)) == null || dt.remove(D.id));
              }
              addDeletedAnnotationElement(D) {
                t(this, rt).add(D.annotationElementId), (D.deleted = !0);
              }
              isDeletedAnnotationElement(D) {
                return t(this, rt).has(D);
              }
              removeDeletedAnnotationElement(D) {
                t(this, rt).delete(D.annotationElementId), (D.deleted = !1);
              }
              setActiveEditor(D) {
                t(this, n) !== D && (et(this, n, D), D && z(this, V, pe).call(this, D.propertiesToUpdate));
              }
              toggleSelected(D) {
                if (t(this, P).has(D)) {
                  t(this, P).delete(D),
                    D.unselect(),
                    z(this, V, te).call(this, { hasSelectedEditor: this.hasSelection });
                  return;
                }
                t(this, P).add(D),
                  D.select(),
                  z(this, V, pe).call(this, D.propertiesToUpdate),
                  z(this, V, te).call(this, { hasSelectedEditor: !0 });
              }
              setSelected(D) {
                for (let dt of t(this, P)) dt !== D && dt.unselect();
                t(this, P).clear(),
                  t(this, P).add(D),
                  D.select(),
                  z(this, V, pe).call(this, D.propertiesToUpdate),
                  z(this, V, te).call(this, { hasSelectedEditor: !0 });
              }
              isSelected(D) {
                return t(this, P).has(D);
              }
              unselect(D) {
                D.unselect(), t(this, P).delete(D), z(this, V, te).call(this, { hasSelectedEditor: this.hasSelection });
              }
              get hasSelection() {
                return t(this, P).size !== 0;
              }
              undo() {
                t(this, q).undo(),
                  z(this, V, te).call(this, {
                    hasSomethingToUndo: t(this, q).hasSomethingToUndo(),
                    hasSomethingToRedo: !0,
                    isEmpty: z(this, V, ge).call(this),
                  });
              }
              redo() {
                t(this, q).redo(),
                  z(this, V, te).call(this, {
                    hasSomethingToUndo: !0,
                    hasSomethingToRedo: t(this, q).hasSomethingToRedo(),
                    isEmpty: z(this, V, ge).call(this),
                  });
              }
              addCommands(D) {
                t(this, q).add(D),
                  z(this, V, te).call(this, {
                    hasSomethingToUndo: !0,
                    hasSomethingToRedo: !1,
                    isEmpty: z(this, V, ge).call(this),
                  });
              }
              delete() {
                if ((this.commitOrRemove(), !this.hasSelection)) return;
                let D = [...t(this, P)],
                  dt = () => {
                    for (let Dt of D) Dt.remove();
                  },
                  Ct = () => {
                    for (let Dt of D) z(this, V, Qe).call(this, Dt);
                  };
                this.addCommands({ cmd: dt, undo: Ct, mustExec: !0 });
              }
              commitOrRemove() {
                var D;
                (D = t(this, n)) == null || D.commitOrRemove();
              }
              hasSomethingToControl() {
                return t(this, n) || this.hasSelection;
              }
              selectAll() {
                for (let D of t(this, P)) D.commit();
                z(this, V, Ze).call(this, t(this, _).values());
              }
              unselectAll() {
                if (t(this, n)) {
                  t(this, n).commitOrRemove();
                  return;
                }
                if (this.hasSelection) {
                  for (let D of t(this, P)) D.unselect();
                  t(this, P).clear(), z(this, V, te).call(this, { hasSelectedEditor: !1 });
                }
              }
              translateSelectedEditors(D, dt, Ct = !1) {
                if ((Ct || this.commitOrRemove(), !this.hasSelection)) return;
                (t(this, K)[0] += D), (t(this, K)[1] += dt);
                let [Dt, Ot] = t(this, K),
                  Pt = [...t(this, P)],
                  w = 1e3;
                t(this, ut) && clearTimeout(t(this, ut)),
                  et(
                    this,
                    ut,
                    setTimeout(() => {
                      et(this, ut, null),
                        (t(this, K)[0] = t(this, K)[1] = 0),
                        this.addCommands({
                          cmd: () => {
                            for (let v of Pt) t(this, _).has(v.id) && v.translateInPage(Dt, Ot);
                          },
                          undo: () => {
                            for (let v of Pt) t(this, _).has(v.id) && v.translateInPage(-Dt, -Ot);
                          },
                          mustExec: !1,
                        });
                    }, w),
                  );
                for (let v of Pt) v.translateInPage(D, dt);
              }
              setUpDragSession() {
                if (this.hasSelection) {
                  this.disableUserSelect(!0), et(this, C, new Map());
                  for (let D of t(this, P))
                    t(this, C).set(D, {
                      savedX: D.x,
                      savedY: D.y,
                      savedPageIndex: D.pageIndex,
                      newX: 0,
                      newY: 0,
                      newPageIndex: -1,
                    });
                }
              }
              endDragSession() {
                if (!t(this, C)) return !1;
                this.disableUserSelect(!1);
                let D = t(this, C);
                et(this, C, null);
                let dt = !1;
                for (let [{ x: Dt, y: Ot, pageIndex: Pt }, w] of D)
                  (w.newX = Dt),
                    (w.newY = Ot),
                    (w.newPageIndex = Pt),
                    dt || (dt = Dt !== w.savedX || Ot !== w.savedY || Pt !== w.savedPageIndex);
                if (!dt) return !1;
                let Ct = (Dt, Ot, Pt, w) => {
                  if (t(this, _).has(Dt.id)) {
                    let v = t(this, k).get(w);
                    v ? Dt._setParentAndPosition(v, Ot, Pt) : ((Dt.pageIndex = w), (Dt.x = Ot), (Dt.y = Pt));
                  }
                };
                return (
                  this.addCommands({
                    cmd: () => {
                      for (let [Dt, { newX: Ot, newY: Pt, newPageIndex: w }] of D) Ct(Dt, Ot, Pt, w);
                    },
                    undo: () => {
                      for (let [Dt, { savedX: Ot, savedY: Pt, savedPageIndex: w }] of D) Ct(Dt, Ot, Pt, w);
                    },
                    mustExec: !0,
                  }),
                  !0
                );
              }
              dragSelectedEditors(D, dt) {
                if (t(this, C)) for (let Ct of t(this, C).keys()) Ct.drag(D, dt);
              }
              rebuild(D) {
                if (D.parent === null) {
                  let dt = this.getLayer(D.pageIndex);
                  dt
                    ? (dt.changeParent(D), dt.addOrRebuild(D))
                    : (this.addEditor(D), this.addToAnnotationStorage(D), D.rebuild());
                } else D.parent.addOrRebuild(D);
              }
              isActive(D) {
                return t(this, n) === D;
              }
              getActive() {
                return t(this, n);
              }
              getMode() {
                return t(this, x);
              }
              get imageManager() {
                return (0, c.shadow)(this, "imageManager", new B());
              }
            };
            (n = new WeakMap()),
              (_ = new WeakMap()),
              (k = new WeakMap()),
              (it = new WeakMap()),
              (H = new WeakMap()),
              (q = new WeakMap()),
              (j = new WeakMap()),
              (rt = new WeakMap()),
              (C = new WeakMap()),
              (U = new WeakMap()),
              ($ = new WeakMap()),
              (S = new WeakMap()),
              (e = new WeakMap()),
              (i = new WeakMap()),
              (d = new WeakMap()),
              (T = new WeakMap()),
              (x = new WeakMap()),
              (P = new WeakMap()),
              (G = new WeakMap()),
              (st = new WeakMap()),
              (ct = new WeakMap()),
              (ht = new WeakMap()),
              (pt = new WeakMap()),
              (At = new WeakMap()),
              (yt = new WeakMap()),
              (Y = new WeakMap()),
              (Z = new WeakMap()),
              (u = new WeakMap()),
              (F = new WeakMap()),
              (X = new WeakMap()),
              (K = new WeakMap()),
              (ut = new WeakMap()),
              (vt = new WeakMap()),
              (_t = new WeakMap()),
              (V = new WeakSet()),
              (Mi = function () {
                window.addEventListener("focus", t(this, ct)), window.addEventListener("blur", t(this, st));
              }),
              ($e = function () {
                window.removeEventListener("focus", t(this, ct)), window.removeEventListener("blur", t(this, st));
              }),
              (Ye = function () {
                window.addEventListener("keydown", t(this, yt), { capture: !0 });
              }),
              (Ce = function () {
                window.removeEventListener("keydown", t(this, yt), { capture: !0 });
              }),
              (Ke = function () {
                document.addEventListener("copy", t(this, ht)),
                  document.addEventListener("cut", t(this, pt)),
                  document.addEventListener("paste", t(this, At));
              }),
              (Je = function () {
                document.removeEventListener("copy", t(this, ht)),
                  document.removeEventListener("cut", t(this, pt)),
                  document.removeEventListener("paste", t(this, At));
              }),
              (te = function (D) {
                Object.entries(D).some(([Ct, Dt]) => t(this, X)[Ct] !== Dt) &&
                  this._eventBus.dispatch("annotationeditorstateschanged", {
                    source: this,
                    details: Object.assign(t(this, X), D),
                  });
              }),
              (pe = function (D) {
                this._eventBus.dispatch("annotationeditorparamschanged", { source: this, details: D });
              }),
              (Ri = function () {
                if (!t(this, i)) {
                  et(this, i, !0);
                  for (let D of t(this, k).values()) D.enable();
                }
              }),
              (Di = function () {
                if ((this.unselectAll(), t(this, i))) {
                  et(this, i, !1);
                  for (let D of t(this, k).values()) D.disable();
                }
              }),
              (Qe = function (D) {
                let dt = t(this, k).get(D.pageIndex);
                dt ? dt.addOrRebuild(D) : this.addEditor(D);
              }),
              (ge = function () {
                if (t(this, _).size === 0) return !0;
                if (t(this, _).size === 1) for (let D of t(this, _).values()) return D.isEmpty();
                return !1;
              }),
              (Ze = function (D) {
                t(this, P).clear();
                for (let dt of D) dt.isEmpty() || (t(this, P).add(dt), dt.select());
                z(this, V, te).call(this, { hasSelectedEditor: !0 });
              }),
              Jt(Xt, "TRANSLATE_SMALL", 1),
              Jt(Xt, "TRANSLATE_BIG", 10);
            let O = Xt;
            g.AnnotationEditorUIManager = O;
          },
          (xt, g, ft) => {
            var j, rt, C, U, $, S, e, i, d, T, x, P, le, ce, ti, Te, xe, me, be;
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.StatTimer =
                g.RenderingCancelledException =
                g.PixelsPerInch =
                g.PageViewport =
                g.PDFDateString =
                g.DOMStandardFontDataFactory =
                g.DOMSVGFactory =
                g.DOMFilterFactory =
                g.DOMCanvasFactory =
                g.DOMCMapReaderFactory =
                  void 0),
              (g.deprecated = s),
              (g.getColorValues = _),
              (g.getCurrentTransform = k),
              (g.getCurrentTransformInverse = it),
              (g.getFilenameFromUrl = h),
              (g.getPdfFilenameFromUrl = m),
              (g.getRGB = n),
              (g.getXfaPageViewport = L),
              (g.isDataScheme = E),
              (g.isPdfFile = f),
              (g.isValidFetchUrl = y),
              (g.loadScript = l),
              (g.noContextMenu = r),
              (g.setLayerDimensions = H);
            var c = ft(7),
              M = ft(1);
            let lt = "http://www.w3.org/2000/svg",
              q = class q {};
            Jt(q, "CSS", 96), Jt(q, "PDF", 72), Jt(q, "PDF_TO_CSS_UNITS", q.CSS / q.PDF);
            let Q = q;
            g.PixelsPerInch = Q;
            class gt extends c.BaseFilterFactory {
              constructor({ docId: u, ownerDocument: F = globalThis.document } = {}) {
                super();
                J(this, P);
                J(this, j);
                J(this, rt);
                J(this, C);
                J(this, U);
                J(this, $);
                J(this, S);
                J(this, e);
                J(this, i);
                J(this, d);
                J(this, T);
                J(this, x, 0);
                et(this, C, u), et(this, U, F);
              }
              addFilter(u) {
                if (!u) return "none";
                let F = t(this, P, le).get(u);
                if (F) return F;
                let X, K, ut, vt;
                if (u.length === 1) {
                  let Et = u[0],
                    jt = new Array(256);
                  for (let Bt = 0; Bt < 256; Bt++) jt[Bt] = Et[Bt] / 255;
                  vt = X = K = ut = jt.join(",");
                } else {
                  let [Et, jt, Bt] = u,
                    qt = new Array(256),
                    Mt = new Array(256),
                    Nt = new Array(256);
                  for (let Wt = 0; Wt < 256; Wt++)
                    (qt[Wt] = Et[Wt] / 255), (Mt[Wt] = jt[Wt] / 255), (Nt[Wt] = Bt[Wt] / 255);
                  (X = qt.join(",")), (K = Mt.join(",")), (ut = Nt.join(",")), (vt = `${X}${K}${ut}`);
                }
                if (((F = t(this, P, le).get(vt)), F)) return t(this, P, le).set(u, F), F;
                let _t = `g_${t(this, C)}_transfer_map_${fe(this, x)._++}`,
                  V = `url(#${_t})`;
                t(this, P, le).set(u, V), t(this, P, le).set(vt, V);
                let wt = z(this, P, Te).call(this, _t);
                return z(this, P, me).call(this, X, K, ut, wt), V;
              }
              addHCMFilter(u, F) {
                var jt;
                let X = `${u}-${F}`;
                if (t(this, S) === X) return t(this, e);
                if ((et(this, S, X), et(this, e, "none"), (jt = t(this, $)) == null || jt.remove(), !u || !F))
                  return t(this, e);
                let K = z(this, P, be).call(this, u);
                u = M.Util.makeHexColor(...K);
                let ut = z(this, P, be).call(this, F);
                if (
                  ((F = M.Util.makeHexColor(...ut)),
                  (t(this, P, ce).style.color = ""),
                  (u === "#000000" && F === "#ffffff") || u === F)
                )
                  return t(this, e);
                let vt = new Array(256);
                for (let Bt = 0; Bt <= 255; Bt++) {
                  let qt = Bt / 255;
                  vt[Bt] = qt <= 0.03928 ? qt / 12.92 : Ne((qt + 0.055) / 1.055, 2.4);
                }
                let _t = vt.join(","),
                  V = `g_${t(this, C)}_hcm_filter`,
                  wt = et(this, i, z(this, P, Te).call(this, V));
                z(this, P, me).call(this, _t, _t, _t, wt), z(this, P, ti).call(this, wt);
                let Et = (Bt, qt) => {
                  let Mt = K[Bt] / 255,
                    Nt = ut[Bt] / 255,
                    Wt = new Array(qt + 1);
                  for (let Vt = 0; Vt <= qt; Vt++) Wt[Vt] = Mt + (Vt / qt) * (Nt - Mt);
                  return Wt.join(",");
                };
                return (
                  z(this, P, me).call(this, Et(0, 5), Et(1, 5), Et(2, 5), wt), et(this, e, `url(#${V})`), t(this, e)
                );
              }
              addHighlightHCMFilter(u, F, X, K) {
                var Nt;
                let ut = `${u}-${F}-${X}-${K}`;
                if (t(this, d) === ut) return t(this, T);
                if ((et(this, d, ut), et(this, T, "none"), (Nt = t(this, i)) == null || Nt.remove(), !u || !F))
                  return t(this, T);
                let [vt, _t] = [u, F].map(z(this, P, be).bind(this)),
                  V = Math.round(0.2126 * vt[0] + 0.7152 * vt[1] + 0.0722 * vt[2]),
                  wt = Math.round(0.2126 * _t[0] + 0.7152 * _t[1] + 0.0722 * _t[2]),
                  [Et, jt] = [X, K].map(z(this, P, be).bind(this));
                wt < V && ([V, wt, Et, jt] = [wt, V, jt, Et]), (t(this, P, ce).style.color = "");
                let Bt = (Wt, Vt, bt) => {
                    let tt = new Array(256),
                      nt = (wt - V) / bt,
                      kt = Wt / 255,
                      Xt = (Vt - Wt) / (255 * bt),
                      zt = 0;
                    for (let D = 0; D <= bt; D++) {
                      let dt = Math.round(V + D * nt),
                        Ct = kt + D * Xt;
                      for (let Dt = zt; Dt <= dt; Dt++) tt[Dt] = Ct;
                      zt = dt + 1;
                    }
                    for (let D = zt; D < 256; D++) tt[D] = tt[zt - 1];
                    return tt.join(",");
                  },
                  qt = `g_${t(this, C)}_hcm_highlight_filter`,
                  Mt = et(this, i, z(this, P, Te).call(this, qt));
                return (
                  z(this, P, ti).call(this, Mt),
                  z(this, P, me).call(this, Bt(Et[0], jt[0], 5), Bt(Et[1], jt[1], 5), Bt(Et[2], jt[2], 5), Mt),
                  et(this, T, `url(#${qt})`),
                  t(this, T)
                );
              }
              destroy(u = !1) {
                (u && (t(this, e) || t(this, T))) ||
                  (t(this, rt) && (t(this, rt).parentNode.parentNode.remove(), et(this, rt, null)),
                  t(this, j) && (t(this, j).clear(), et(this, j, null)),
                  et(this, x, 0));
              }
            }
            (j = new WeakMap()),
              (rt = new WeakMap()),
              (C = new WeakMap()),
              (U = new WeakMap()),
              ($ = new WeakMap()),
              (S = new WeakMap()),
              (e = new WeakMap()),
              (i = new WeakMap()),
              (d = new WeakMap()),
              (T = new WeakMap()),
              (x = new WeakMap()),
              (P = new WeakSet()),
              (le = function () {
                return t(this, j) || et(this, j, new Map());
              }),
              (ce = function () {
                if (!t(this, rt)) {
                  let u = t(this, U).createElement("div"),
                    { style: F } = u;
                  (F.visibility = "hidden"),
                    (F.contain = "strict"),
                    (F.width = F.height = 0),
                    (F.position = "absolute"),
                    (F.top = F.left = 0),
                    (F.zIndex = -1);
                  let X = t(this, U).createElementNS(lt, "svg");
                  X.setAttribute("width", 0),
                    X.setAttribute("height", 0),
                    et(this, rt, t(this, U).createElementNS(lt, "defs")),
                    u.append(X),
                    X.append(t(this, rt)),
                    t(this, U).body.append(u);
                }
                return t(this, rt);
              }),
              (ti = function (u) {
                let F = t(this, U).createElementNS(lt, "feColorMatrix");
                F.setAttribute("type", "matrix"),
                  F.setAttribute(
                    "values",
                    "0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0.2126 0.7152 0.0722 0 0 0 0 0 1 0",
                  ),
                  u.append(F);
              }),
              (Te = function (u) {
                let F = t(this, U).createElementNS(lt, "filter");
                return (
                  F.setAttribute("color-interpolation-filters", "sRGB"),
                  F.setAttribute("id", u),
                  t(this, P, ce).append(F),
                  F
                );
              }),
              (xe = function (u, F, X) {
                let K = t(this, U).createElementNS(lt, F);
                K.setAttribute("type", "discrete"), K.setAttribute("tableValues", X), u.append(K);
              }),
              (me = function (u, F, X, K) {
                let ut = t(this, U).createElementNS(lt, "feComponentTransfer");
                K.append(ut),
                  z(this, P, xe).call(this, ut, "feFuncR", u),
                  z(this, P, xe).call(this, ut, "feFuncG", F),
                  z(this, P, xe).call(this, ut, "feFuncB", X);
              }),
              (be = function (u) {
                return (t(this, P, ce).style.color = u), n(getComputedStyle(t(this, P, ce)).getPropertyValue("color"));
              }),
              (g.DOMFilterFactory = gt);
            class B extends c.BaseCanvasFactory {
              constructor({ ownerDocument: Z = globalThis.document } = {}) {
                super(), (this._document = Z);
              }
              _createCanvas(Z, u) {
                let F = this._document.createElement("canvas");
                return (F.width = Z), (F.height = u), F;
              }
            }
            g.DOMCanvasFactory = B;
            function R(Y, Z = !1) {
              return Yt(this, null, function* () {
                if (y(Y, document.baseURI)) {
                  let u = yield fetch(Y);
                  if (!u.ok) throw new Error(u.statusText);
                  return Z ? new Uint8Array(yield u.arrayBuffer()) : (0, M.stringToBytes)(yield u.text());
                }
                return new Promise((u, F) => {
                  let X = new XMLHttpRequest();
                  X.open("GET", Y, !0),
                    Z && (X.responseType = "arraybuffer"),
                    (X.onreadystatechange = () => {
                      if (X.readyState === XMLHttpRequest.DONE) {
                        if (X.status === 200 || X.status === 0) {
                          let K;
                          if (
                            (Z && X.response
                              ? (K = new Uint8Array(X.response))
                              : !Z && X.responseText && (K = (0, M.stringToBytes)(X.responseText)),
                            K)
                          ) {
                            u(K);
                            return;
                          }
                        }
                        F(new Error(X.statusText));
                      }
                    }),
                    X.send(null);
                });
              });
            }
            class p extends c.BaseCMapReaderFactory {
              _fetchData(Z, u) {
                return R(Z, this.isCompressed).then((F) => ({ cMapData: F, compressionType: u }));
              }
            }
            g.DOMCMapReaderFactory = p;
            class N extends c.BaseStandardFontDataFactory {
              _fetchData(Z) {
                return R(Z, !0);
              }
            }
            g.DOMStandardFontDataFactory = N;
            class O extends c.BaseSVGFactory {
              _createSVG(Z) {
                return document.createElementNS(lt, Z);
              }
            }
            g.DOMSVGFactory = O;
            class A {
              constructor({ viewBox: Z, scale: u, rotation: F, offsetX: X = 0, offsetY: K = 0, dontFlip: ut = !1 }) {
                (this.viewBox = Z), (this.scale = u), (this.rotation = F), (this.offsetX = X), (this.offsetY = K);
                let vt = (Z[2] + Z[0]) / 2,
                  _t = (Z[3] + Z[1]) / 2,
                  V,
                  wt,
                  Et,
                  jt;
                switch (((F %= 360), F < 0 && (F += 360), F)) {
                  case 180:
                    (V = -1), (wt = 0), (Et = 0), (jt = 1);
                    break;
                  case 90:
                    (V = 0), (wt = 1), (Et = 1), (jt = 0);
                    break;
                  case 270:
                    (V = 0), (wt = -1), (Et = -1), (jt = 0);
                    break;
                  case 0:
                    (V = 1), (wt = 0), (Et = 0), (jt = -1);
                    break;
                  default:
                    throw new Error("PageViewport: Invalid rotation, must be a multiple of 90 degrees.");
                }
                ut && ((Et = -Et), (jt = -jt));
                let Bt, qt, Mt, Nt;
                V === 0
                  ? ((Bt = Math.abs(_t - Z[1]) * u + X),
                    (qt = Math.abs(vt - Z[0]) * u + K),
                    (Mt = (Z[3] - Z[1]) * u),
                    (Nt = (Z[2] - Z[0]) * u))
                  : ((Bt = Math.abs(vt - Z[0]) * u + X),
                    (qt = Math.abs(_t - Z[1]) * u + K),
                    (Mt = (Z[2] - Z[0]) * u),
                    (Nt = (Z[3] - Z[1]) * u)),
                  (this.transform = [
                    V * u,
                    wt * u,
                    Et * u,
                    jt * u,
                    Bt - V * u * vt - Et * u * _t,
                    qt - wt * u * vt - jt * u * _t,
                  ]),
                  (this.width = Mt),
                  (this.height = Nt);
              }
              get rawDims() {
                let { viewBox: Z } = this;
                return (0, M.shadow)(this, "rawDims", {
                  pageWidth: Z[2] - Z[0],
                  pageHeight: Z[3] - Z[1],
                  pageX: Z[0],
                  pageY: Z[1],
                });
              }
              clone({
                scale: Z = this.scale,
                rotation: u = this.rotation,
                offsetX: F = this.offsetX,
                offsetY: X = this.offsetY,
                dontFlip: K = !1,
              } = {}) {
                return new A({
                  viewBox: this.viewBox.slice(),
                  scale: Z,
                  rotation: u,
                  offsetX: F,
                  offsetY: X,
                  dontFlip: K,
                });
              }
              convertToViewportPoint(Z, u) {
                return M.Util.applyTransform([Z, u], this.transform);
              }
              convertToViewportRectangle(Z) {
                let u = M.Util.applyTransform([Z[0], Z[1]], this.transform),
                  F = M.Util.applyTransform([Z[2], Z[3]], this.transform);
                return [u[0], u[1], F[0], F[1]];
              }
              convertToPdfPoint(Z, u) {
                return M.Util.applyInverseTransform([Z, u], this.transform);
              }
            }
            g.PageViewport = A;
            class b extends M.BaseException {
              constructor(Z, u = 0) {
                super(Z, "RenderingCancelledException"), (this.extraDelay = u);
              }
            }
            g.RenderingCancelledException = b;
            function E(Y) {
              let Z = Y.length,
                u = 0;
              for (; u < Z && Y[u].trim() === ""; ) u++;
              return Y.substring(u, u + 5).toLowerCase() === "data:";
            }
            function f(Y) {
              return typeof Y == "string" && /\.pdf$/i.test(Y);
            }
            function h(Y, Z = !1) {
              return Z || ([Y] = Y.split(/[#?]/, 1)), Y.substring(Y.lastIndexOf("/") + 1);
            }
            function m(Y, Z = "document.pdf") {
              if (typeof Y != "string") return Z;
              if (E(Y)) return (0, M.warn)('getPdfFilenameFromUrl: ignore "data:"-URL for performance reasons.'), Z;
              let u = /^(?:(?:[^:]+:)?\/\/[^/]+)?([^?#]*)(\?[^#]*)?(#.*)?$/,
                F = /[^/?#=]+\.pdf\b(?!.*\.pdf\b)/i,
                X = u.exec(Y),
                K = F.exec(X[1]) || F.exec(X[2]) || F.exec(X[3]);
              if (K && ((K = K[0]), K.includes("%")))
                try {
                  K = F.exec(decodeURIComponent(K))[0];
                } catch (ut) {}
              return K || Z;
            }
            class I {
              constructor() {
                Jt(this, "started", Object.create(null));
                Jt(this, "times", []);
              }
              time(Z) {
                Z in this.started && (0, M.warn)(`Timer is already running for ${Z}`), (this.started[Z] = Date.now());
              }
              timeEnd(Z) {
                Z in this.started || (0, M.warn)(`Timer has not been started for ${Z}`),
                  this.times.push({ name: Z, start: this.started[Z], end: Date.now() }),
                  delete this.started[Z];
              }
              toString() {
                let Z = [],
                  u = 0;
                for (let { name: F } of this.times) u = Math.max(F.length, u);
                for (let { name: F, start: X, end: K } of this.times)
                  Z.push(`${F.padEnd(u)} ${K - X}ms
`);
                return Z.join("");
              }
            }
            g.StatTimer = I;
            function y(Y, Z) {
              try {
                let { protocol: u } = Z ? new URL(Y, Z) : new URL(Y);
                return u === "http:" || u === "https:";
              } catch (u) {
                return !1;
              }
            }
            function r(Y) {
              Y.preventDefault();
            }
            function l(Y, Z = !1) {
              return new Promise((u, F) => {
                let X = document.createElement("script");
                (X.src = Y),
                  (X.onload = function (K) {
                    Z && X.remove(), u(K);
                  }),
                  (X.onerror = function () {
                    F(new Error(`Cannot load script at: ${X.src}`));
                  }),
                  (document.head || document.documentElement).append(X);
              });
            }
            function s(Y) {
              console.log("Deprecated API usage: " + Y);
            }
            let a;
            class o {
              static toDateObject(Z) {
                if (!Z || typeof Z != "string") return null;
                a ||
                  (a = new RegExp(
                    "^D:(\\d{4})(\\d{2})?(\\d{2})?(\\d{2})?(\\d{2})?(\\d{2})?([Z|+|-])?(\\d{2})?'?(\\d{2})?'?",
                  ));
                let u = a.exec(Z);
                if (!u) return null;
                let F = parseInt(u[1], 10),
                  X = parseInt(u[2], 10);
                X = X >= 1 && X <= 12 ? X - 1 : 0;
                let K = parseInt(u[3], 10);
                K = K >= 1 && K <= 31 ? K : 1;
                let ut = parseInt(u[4], 10);
                ut = ut >= 0 && ut <= 23 ? ut : 0;
                let vt = parseInt(u[5], 10);
                vt = vt >= 0 && vt <= 59 ? vt : 0;
                let _t = parseInt(u[6], 10);
                _t = _t >= 0 && _t <= 59 ? _t : 0;
                let V = u[7] || "Z",
                  wt = parseInt(u[8], 10);
                wt = wt >= 0 && wt <= 23 ? wt : 0;
                let Et = parseInt(u[9], 10) || 0;
                return (
                  (Et = Et >= 0 && Et <= 59 ? Et : 0),
                  V === "-" ? ((ut += wt), (vt += Et)) : V === "+" && ((ut -= wt), (vt -= Et)),
                  new Date(Date.UTC(F, X, K, ut, vt, _t))
                );
              }
            }
            g.PDFDateString = o;
            function L(Y, { scale: Z = 1, rotation: u = 0 }) {
              let { width: F, height: X } = Y.attributes.style,
                K = [0, 0, parseInt(F), parseInt(X)];
              return new A({ viewBox: K, scale: Z, rotation: u });
            }
            function n(Y) {
              if (Y.startsWith("#")) {
                let Z = parseInt(Y.slice(1), 16);
                return [(Z & 16711680) >> 16, (Z & 65280) >> 8, Z & 255];
              }
              return Y.startsWith("rgb(")
                ? Y.slice(4, -1)
                    .split(",")
                    .map((Z) => parseInt(Z))
                : Y.startsWith("rgba(")
                  ? Y.slice(5, -1)
                      .split(",")
                      .map((Z) => parseInt(Z))
                      .slice(0, 3)
                  : ((0, M.warn)(`Not a valid color format: "${Y}"`), [0, 0, 0]);
            }
            function _(Y) {
              let Z = document.createElement("span");
              (Z.style.visibility = "hidden"), document.body.append(Z);
              for (let u of Y.keys()) {
                Z.style.color = u;
                let F = window.getComputedStyle(Z).color;
                Y.set(u, n(F));
              }
              Z.remove();
            }
            function k(Y) {
              let { a: Z, b: u, c: F, d: X, e: K, f: ut } = Y.getTransform();
              return [Z, u, F, X, K, ut];
            }
            function it(Y) {
              let { a: Z, b: u, c: F, d: X, e: K, f: ut } = Y.getTransform().invertSelf();
              return [Z, u, F, X, K, ut];
            }
            function H(Y, Z, u = !1, F = !0) {
              if (Z instanceof A) {
                let { pageWidth: X, pageHeight: K } = Z.rawDims,
                  { style: ut } = Y,
                  vt = M.FeatureTest.isCSSRoundSupported,
                  _t = `var(--scale-factor) * ${X}px`,
                  V = `var(--scale-factor) * ${K}px`,
                  wt = vt ? `round(${_t}, 1px)` : `calc(${_t})`,
                  Et = vt ? `round(${V}, 1px)` : `calc(${V})`;
                !u || Z.rotation % 180 === 0
                  ? ((ut.width = wt), (ut.height = Et))
                  : ((ut.width = Et), (ut.height = wt));
              }
              F && Y.setAttribute("data-main-rotation", Z.rotation);
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.BaseStandardFontDataFactory =
                g.BaseSVGFactory =
                g.BaseFilterFactory =
                g.BaseCanvasFactory =
                g.BaseCMapReaderFactory =
                  void 0);
            var c = ft(1);
            class M {
              constructor() {
                this.constructor === M && (0, c.unreachable)("Cannot initialize BaseFilterFactory.");
              }
              addFilter(p) {
                return "none";
              }
              addHCMFilter(p, N) {
                return "none";
              }
              addHighlightHCMFilter(p, N, O, A) {
                return "none";
              }
              destroy(p = !1) {}
            }
            g.BaseFilterFactory = M;
            class lt {
              constructor() {
                this.constructor === lt && (0, c.unreachable)("Cannot initialize BaseCanvasFactory.");
              }
              create(p, N) {
                if (p <= 0 || N <= 0) throw new Error("Invalid canvas size");
                let O = this._createCanvas(p, N);
                return { canvas: O, context: O.getContext("2d") };
              }
              reset(p, N, O) {
                if (!p.canvas) throw new Error("Canvas is not specified");
                if (N <= 0 || O <= 0) throw new Error("Invalid canvas size");
                (p.canvas.width = N), (p.canvas.height = O);
              }
              destroy(p) {
                if (!p.canvas) throw new Error("Canvas is not specified");
                (p.canvas.width = 0), (p.canvas.height = 0), (p.canvas = null), (p.context = null);
              }
              _createCanvas(p, N) {
                (0, c.unreachable)("Abstract method `_createCanvas` called.");
              }
            }
            g.BaseCanvasFactory = lt;
            class Q {
              constructor({ baseUrl: p = null, isCompressed: N = !0 }) {
                this.constructor === Q && (0, c.unreachable)("Cannot initialize BaseCMapReaderFactory."),
                  (this.baseUrl = p),
                  (this.isCompressed = N);
              }
              fetch(N) {
                return Yt(this, arguments, function* ({ name: p }) {
                  if (!this.baseUrl)
                    throw new Error(
                      'The CMap "baseUrl" parameter must be specified, ensure that the "cMapUrl" and "cMapPacked" API parameters are provided.',
                    );
                  if (!p) throw new Error("CMap name must be specified.");
                  let O = this.baseUrl + p + (this.isCompressed ? ".bcmap" : ""),
                    A = this.isCompressed ? c.CMapCompressionType.BINARY : c.CMapCompressionType.NONE;
                  return this._fetchData(O, A).catch((b) => {
                    throw new Error(`Unable to load ${this.isCompressed ? "binary " : ""}CMap at: ${O}`);
                  });
                });
              }
              _fetchData(p, N) {
                (0, c.unreachable)("Abstract method `_fetchData` called.");
              }
            }
            g.BaseCMapReaderFactory = Q;
            class gt {
              constructor({ baseUrl: p = null }) {
                this.constructor === gt && (0, c.unreachable)("Cannot initialize BaseStandardFontDataFactory."),
                  (this.baseUrl = p);
              }
              fetch(N) {
                return Yt(this, arguments, function* ({ filename: p }) {
                  if (!this.baseUrl)
                    throw new Error(
                      'The standard font "baseUrl" parameter must be specified, ensure that the "standardFontDataUrl" API parameter is provided.',
                    );
                  if (!p) throw new Error("Font filename must be specified.");
                  let O = `${this.baseUrl}${p}`;
                  return this._fetchData(O).catch((A) => {
                    throw new Error(`Unable to load font data at: ${O}`);
                  });
                });
              }
              _fetchData(p) {
                (0, c.unreachable)("Abstract method `_fetchData` called.");
              }
            }
            g.BaseStandardFontDataFactory = gt;
            class B {
              constructor() {
                this.constructor === B && (0, c.unreachable)("Cannot initialize BaseSVGFactory.");
              }
              create(p, N, O = !1) {
                if (p <= 0 || N <= 0) throw new Error("Invalid SVG dimensions");
                let A = this._createSVG("svg:svg");
                return (
                  A.setAttribute("version", "1.1"),
                  O || (A.setAttribute("width", `${p}px`), A.setAttribute("height", `${N}px`)),
                  A.setAttribute("preserveAspectRatio", "none"),
                  A.setAttribute("viewBox", `0 0 ${p} ${N}`),
                  A
                );
              }
              createElement(p) {
                if (typeof p != "string") throw new Error("Invalid SVG element type");
                return this._createSVG(p);
              }
              _createSVG(p) {
                (0, c.unreachable)("Abstract method `_createSVG` called.");
              }
            }
            g.BaseSVGFactory = B;
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.MurmurHash3_64 = void 0);
            var c = ft(1);
            let M = 3285377520,
              lt = 4294901760,
              Q = 65535;
            class gt {
              constructor(R) {
                (this.h1 = R ? R & 4294967295 : M), (this.h2 = R ? R & 4294967295 : M);
              }
              update(R) {
                let p, N;
                if (typeof R == "string") {
                  (p = new Uint8Array(R.length * 2)), (N = 0);
                  for (let s = 0, a = R.length; s < a; s++) {
                    let o = R.charCodeAt(s);
                    o <= 255 ? (p[N++] = o) : ((p[N++] = o >>> 8), (p[N++] = o & 255));
                  }
                } else if ((0, c.isArrayBuffer)(R)) (p = R.slice()), (N = p.byteLength);
                else throw new Error("Wrong data format in MurmurHash3_64_update. Input must be a string or array.");
                let O = N >> 2,
                  A = N - O * 4,
                  b = new Uint32Array(p.buffer, 0, O),
                  E = 0,
                  f = 0,
                  h = this.h1,
                  m = this.h2,
                  I = 3432918353,
                  y = 461845907,
                  r = I & Q,
                  l = y & Q;
                for (let s = 0; s < O; s++)
                  s & 1
                    ? ((E = b[s]),
                      (E = ((E * I) & lt) | ((E * r) & Q)),
                      (E = (E << 15) | (E >>> 17)),
                      (E = ((E * y) & lt) | ((E * l) & Q)),
                      (h ^= E),
                      (h = (h << 13) | (h >>> 19)),
                      (h = h * 5 + 3864292196))
                    : ((f = b[s]),
                      (f = ((f * I) & lt) | ((f * r) & Q)),
                      (f = (f << 15) | (f >>> 17)),
                      (f = ((f * y) & lt) | ((f * l) & Q)),
                      (m ^= f),
                      (m = (m << 13) | (m >>> 19)),
                      (m = m * 5 + 3864292196));
                switch (((E = 0), A)) {
                  case 3:
                    E ^= p[O * 4 + 2] << 16;
                  case 2:
                    E ^= p[O * 4 + 1] << 8;
                  case 1:
                    (E ^= p[O * 4]),
                      (E = ((E * I) & lt) | ((E * r) & Q)),
                      (E = (E << 15) | (E >>> 17)),
                      (E = ((E * y) & lt) | ((E * l) & Q)),
                      O & 1 ? (h ^= E) : (m ^= E);
                }
                (this.h1 = h), (this.h2 = m);
              }
              hexdigest() {
                let R = this.h1,
                  p = this.h2;
                return (
                  (R ^= p >>> 1),
                  (R = ((R * 3981806797) & lt) | ((R * 36045) & Q)),
                  (p = ((p * 4283543511) & lt) | (((((p << 16) | (R >>> 16)) * 2950163797) & lt) >>> 16)),
                  (R ^= p >>> 1),
                  (R = ((R * 444984403) & lt) | ((R * 60499) & Q)),
                  (p = ((p * 3301882366) & lt) | (((((p << 16) | (R >>> 16)) * 3120437893) & lt) >>> 16)),
                  (R ^= p >>> 1),
                  (R >>> 0).toString(16).padStart(8, "0") + (p >>> 0).toString(16).padStart(8, "0")
                );
              }
            }
            g.MurmurHash3_64 = gt;
          },
          (xt, g, ft) => {
            var Q;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.FontLoader = g.FontFaceObject = void 0);
            var c = ft(1);
            class M {
              constructor({ ownerDocument: B = globalThis.document, styleElement: R = null }) {
                J(this, Q, new Set());
                (this._document = B),
                  (this.nativeFontFaces = new Set()),
                  (this.styleElement = null),
                  (this.loadingRequests = []),
                  (this.loadTestFontId = 0);
              }
              addNativeFontFace(B) {
                this.nativeFontFaces.add(B), this._document.fonts.add(B);
              }
              removeNativeFontFace(B) {
                this.nativeFontFaces.delete(B), this._document.fonts.delete(B);
              }
              insertRule(B) {
                this.styleElement ||
                  ((this.styleElement = this._document.createElement("style")),
                  this._document.documentElement.getElementsByTagName("head")[0].append(this.styleElement));
                let R = this.styleElement.sheet;
                R.insertRule(B, R.cssRules.length);
              }
              clear() {
                for (let B of this.nativeFontFaces) this._document.fonts.delete(B);
                this.nativeFontFaces.clear(),
                  t(this, Q).clear(),
                  this.styleElement && (this.styleElement.remove(), (this.styleElement = null));
              }
              loadSystemFont(B) {
                return Yt(this, null, function* () {
                  if (!(!B || t(this, Q).has(B.loadedName))) {
                    if (
                      ((0, c.assert)(
                        !this.disableFontFace,
                        "loadSystemFont shouldn't be called when `disableFontFace` is set.",
                      ),
                      this.isFontLoadingAPISupported)
                    ) {
                      let { loadedName: R, src: p, style: N } = B,
                        O = new FontFace(R, p, N);
                      this.addNativeFontFace(O);
                      try {
                        yield O.load(), t(this, Q).add(R);
                      } catch (A) {
                        (0, c.warn)(
                          `Cannot load system font: ${B.baseFontName}, installing it could help to improve PDF rendering.`,
                        ),
                          this.removeNativeFontFace(O);
                      }
                      return;
                    }
                    (0, c.unreachable)("Not implemented: loadSystemFont without the Font Loading API.");
                  }
                });
              }
              bind(B) {
                return Yt(this, null, function* () {
                  if (B.attached || (B.missingFile && !B.systemFontInfo)) return;
                  if (((B.attached = !0), B.systemFontInfo)) {
                    yield this.loadSystemFont(B.systemFontInfo);
                    return;
                  }
                  if (this.isFontLoadingAPISupported) {
                    let p = B.createNativeFontFace();
                    if (p) {
                      this.addNativeFontFace(p);
                      try {
                        yield p.loaded;
                      } catch (N) {
                        throw ((0, c.warn)(`Failed to load font '${p.family}': '${N}'.`), (B.disableFontFace = !0), N);
                      }
                    }
                    return;
                  }
                  let R = B.createFontFaceRule();
                  if (R) {
                    if ((this.insertRule(R), this.isSyncFontLoadingSupported)) return;
                    yield new Promise((p) => {
                      let N = this._queueLoadingCallback(p);
                      this._prepareFontLoadEvent(B, N);
                    });
                  }
                });
              }
              get isFontLoadingAPISupported() {
                var R;
                let B = !!((R = this._document) != null && R.fonts);
                return (0, c.shadow)(this, "isFontLoadingAPISupported", B);
              }
              get isSyncFontLoadingSupported() {
                let B = !1;
                return (
                  (c.isNodeJS ||
                    (typeof navigator != "undefined" && /Mozilla\/5.0.*?rv:\d+.*? Gecko/.test(navigator.userAgent))) &&
                    (B = !0),
                  (0, c.shadow)(this, "isSyncFontLoadingSupported", B)
                );
              }
              _queueLoadingCallback(B) {
                function R() {
                  for (
                    (0, c.assert)(!N.done, "completeRequest() cannot be called twice."), N.done = !0;
                    p.length > 0 && p[0].done;
                  ) {
                    let O = p.shift();
                    setTimeout(O.callback, 0);
                  }
                }
                let { loadingRequests: p } = this,
                  N = { done: !1, complete: R, callback: B };
                return p.push(N), N;
              }
              get _loadTestFont() {
                let B = atob(
                  "T1RUTwALAIAAAwAwQ0ZGIDHtZg4AAAOYAAAAgUZGVE1lkzZwAAAEHAAAABxHREVGABQAFQAABDgAAAAeT1MvMlYNYwkAAAEgAAAAYGNtYXABDQLUAAACNAAAAUJoZWFk/xVFDQAAALwAAAA2aGhlYQdkA+oAAAD0AAAAJGhtdHgD6AAAAAAEWAAAAAZtYXhwAAJQAAAAARgAAAAGbmFtZVjmdH4AAAGAAAAAsXBvc3T/hgAzAAADeAAAACAAAQAAAAEAALZRFsRfDzz1AAsD6AAAAADOBOTLAAAAAM4KHDwAAAAAA+gDIQAAAAgAAgAAAAAAAAABAAADIQAAAFoD6AAAAAAD6AABAAAAAAAAAAAAAAAAAAAAAQAAUAAAAgAAAAQD6AH0AAUAAAKKArwAAACMAooCvAAAAeAAMQECAAACAAYJAAAAAAAAAAAAAQAAAAAAAAAAAAAAAFBmRWQAwAAuAC4DIP84AFoDIQAAAAAAAQAAAAAAAAAAACAAIAABAAAADgCuAAEAAAAAAAAAAQAAAAEAAAAAAAEAAQAAAAEAAAAAAAIAAQAAAAEAAAAAAAMAAQAAAAEAAAAAAAQAAQAAAAEAAAAAAAUAAQAAAAEAAAAAAAYAAQAAAAMAAQQJAAAAAgABAAMAAQQJAAEAAgABAAMAAQQJAAIAAgABAAMAAQQJAAMAAgABAAMAAQQJAAQAAgABAAMAAQQJAAUAAgABAAMAAQQJAAYAAgABWABYAAAAAAAAAwAAAAMAAAAcAAEAAAAAADwAAwABAAAAHAAEACAAAAAEAAQAAQAAAC7//wAAAC7////TAAEAAAAAAAABBgAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMAAAAAAAD/gwAyAAAAAQAAAAAAAAAAAAAAAAAAAAABAAQEAAEBAQJYAAEBASH4DwD4GwHEAvgcA/gXBIwMAYuL+nz5tQXkD5j3CBLnEQACAQEBIVhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYAAABAQAADwACAQEEE/t3Dov6fAH6fAT+fPp8+nwHDosMCvm1Cvm1DAz6fBQAAAAAAAABAAAAAMmJbzEAAAAAzgTjFQAAAADOBOQpAAEAAAAAAAAADAAUAAQAAAABAAAAAgABAAAAAAAAAAAD6AAAAAAAAA==",
                );
                return (0, c.shadow)(this, "_loadTestFont", B);
              }
              _prepareFontLoadEvent(B, R) {
                function p(n, _) {
                  return (
                    (n.charCodeAt(_) << 24) |
                    (n.charCodeAt(_ + 1) << 16) |
                    (n.charCodeAt(_ + 2) << 8) |
                    (n.charCodeAt(_ + 3) & 255)
                  );
                }
                function N(n, _, k, it) {
                  let H = n.substring(0, _),
                    q = n.substring(_ + k);
                  return H + it + q;
                }
                let O,
                  A,
                  b = this._document.createElement("canvas");
                (b.width = 1), (b.height = 1);
                let E = b.getContext("2d"),
                  f = 0;
                function h(n, _) {
                  if (++f > 30) {
                    (0, c.warn)("Load test font never loaded."), _();
                    return;
                  }
                  if (((E.font = "30px " + n), E.fillText(".", 0, 20), E.getImageData(0, 0, 1, 1).data[3] > 0)) {
                    _();
                    return;
                  }
                  setTimeout(h.bind(null, n, _));
                }
                let m = `lt${Date.now()}${this.loadTestFontId++}`,
                  I = this._loadTestFont;
                I = N(I, 976, m.length, m);
                let r = 16,
                  l = 1482184792,
                  s = p(I, r);
                for (O = 0, A = m.length - 3; O < A; O += 4) s = (s - l + p(m, O)) | 0;
                O < m.length && (s = (s - l + p(m + "XXX", O)) | 0), (I = N(I, r, 4, (0, c.string32)(s)));
                let a = `url(data:font/opentype;base64,${btoa(I)});`,
                  o = `@font-face {font-family:"${m}";src:${a}}`;
                this.insertRule(o);
                let L = this._document.createElement("div");
                (L.style.visibility = "hidden"),
                  (L.style.width = L.style.height = "10px"),
                  (L.style.position = "absolute"),
                  (L.style.top = L.style.left = "0px");
                for (let n of [B.loadedName, m]) {
                  let _ = this._document.createElement("span");
                  (_.textContent = "Hi"), (_.style.fontFamily = n), L.append(_);
                }
                this._document.body.append(L),
                  h(m, () => {
                    L.remove(), R.complete();
                  });
              }
            }
            (Q = new WeakMap()), (g.FontLoader = M);
            class lt {
              constructor(
                B,
                { isEvalSupported: R = !0, disableFontFace: p = !1, ignoreErrors: N = !1, inspectFont: O = null },
              ) {
                this.compiledGlyphs = Object.create(null);
                for (let A in B) this[A] = B[A];
                (this.isEvalSupported = R !== !1),
                  (this.disableFontFace = p === !0),
                  (this.ignoreErrors = N === !0),
                  (this._inspectFont = O);
              }
              createNativeFontFace() {
                var R;
                if (!this.data || this.disableFontFace) return null;
                let B;
                if (!this.cssFontInfo) B = new FontFace(this.loadedName, this.data, {});
                else {
                  let p = { weight: this.cssFontInfo.fontWeight };
                  this.cssFontInfo.italicAngle && (p.style = `oblique ${this.cssFontInfo.italicAngle}deg`),
                    (B = new FontFace(this.cssFontInfo.fontFamily, this.data, p));
                }
                return (R = this._inspectFont) == null || R.call(this, this), B;
              }
              createFontFaceRule() {
                var N;
                if (!this.data || this.disableFontFace) return null;
                let B = (0, c.bytesToString)(this.data),
                  R = `url(data:${this.mimetype};base64,${btoa(B)});`,
                  p;
                if (!this.cssFontInfo) p = `@font-face {font-family:"${this.loadedName}";src:${R}}`;
                else {
                  let O = `font-weight: ${this.cssFontInfo.fontWeight};`;
                  this.cssFontInfo.italicAngle && (O += `font-style: oblique ${this.cssFontInfo.italicAngle}deg;`),
                    (p = `@font-face {font-family:"${this.cssFontInfo.fontFamily}";${O}src:${R}}`);
                }
                return (N = this._inspectFont) == null || N.call(this, this, R), p;
              }
              getPathGenerator(B, R) {
                if (this.compiledGlyphs[R] !== void 0) return this.compiledGlyphs[R];
                let p;
                try {
                  p = B.get(this.loadedName + "_path_" + R);
                } catch (N) {
                  if (!this.ignoreErrors) throw N;
                  return (
                    (0, c.warn)(`getPathGenerator - ignoring character: "${N}".`),
                    (this.compiledGlyphs[R] = function (O, A) {})
                  );
                }
                if (this.isEvalSupported && c.FeatureTest.isEvalSupported) {
                  let N = [];
                  for (let O of p) {
                    let A = O.args !== void 0 ? O.args.join(",") : "";
                    N.push(
                      "c.",
                      O.cmd,
                      "(",
                      A,
                      `);
`,
                    );
                  }
                  return (this.compiledGlyphs[R] = new Function("c", "size", N.join("")));
                }
                return (this.compiledGlyphs[R] = function (N, O) {
                  for (let A of p) A.cmd === "scale" && (A.args = [O, -O]), N[A.cmd].apply(N, A.args);
                });
              }
            }
            g.FontFaceObject = lt;
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.NodeStandardFontDataFactory =
                g.NodeFilterFactory =
                g.NodeCanvasFactory =
                g.NodeCMapReaderFactory =
                  void 0);
            var c = ft(7),
              M = ft(1);
            let lt = function (p) {
              return new Promise((N, O) => {
                Se().readFile(p, (b, E) => {
                  if (b || !E) {
                    O(new Error(b));
                    return;
                  }
                  N(new Uint8Array(E));
                });
              });
            };
            class Q extends c.BaseFilterFactory {}
            g.NodeFilterFactory = Q;
            class gt extends c.BaseCanvasFactory {
              _createCanvas(N, O) {
                return Si().createCanvas(N, O);
              }
            }
            g.NodeCanvasFactory = gt;
            class B extends c.BaseCMapReaderFactory {
              _fetchData(N, O) {
                return lt(N).then((A) => ({ cMapData: A, compressionType: O }));
              }
            }
            g.NodeCMapReaderFactory = B;
            class R extends c.BaseStandardFontDataFactory {
              _fetchData(N) {
                return lt(N);
              }
            }
            g.NodeStandardFontDataFactory = R;
          },
          (xt, g, ft) => {
            var rt, ei, ii;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.CanvasGraphics = void 0);
            var c = ft(1),
              M = ft(6),
              lt = ft(12),
              Q = ft(13);
            let gt = 16,
              B = 100,
              R = 4096,
              p = 15,
              N = 10,
              O = 1e3,
              A = 16;
            function b(S, e) {
              if (S._removeMirroring) throw new Error("Context is already forwarding operations.");
              (S.__originalSave = S.save),
                (S.__originalRestore = S.restore),
                (S.__originalRotate = S.rotate),
                (S.__originalScale = S.scale),
                (S.__originalTranslate = S.translate),
                (S.__originalTransform = S.transform),
                (S.__originalSetTransform = S.setTransform),
                (S.__originalResetTransform = S.resetTransform),
                (S.__originalClip = S.clip),
                (S.__originalMoveTo = S.moveTo),
                (S.__originalLineTo = S.lineTo),
                (S.__originalBezierCurveTo = S.bezierCurveTo),
                (S.__originalRect = S.rect),
                (S.__originalClosePath = S.closePath),
                (S.__originalBeginPath = S.beginPath),
                (S._removeMirroring = () => {
                  (S.save = S.__originalSave),
                    (S.restore = S.__originalRestore),
                    (S.rotate = S.__originalRotate),
                    (S.scale = S.__originalScale),
                    (S.translate = S.__originalTranslate),
                    (S.transform = S.__originalTransform),
                    (S.setTransform = S.__originalSetTransform),
                    (S.resetTransform = S.__originalResetTransform),
                    (S.clip = S.__originalClip),
                    (S.moveTo = S.__originalMoveTo),
                    (S.lineTo = S.__originalLineTo),
                    (S.bezierCurveTo = S.__originalBezierCurveTo),
                    (S.rect = S.__originalRect),
                    (S.closePath = S.__originalClosePath),
                    (S.beginPath = S.__originalBeginPath),
                    delete S._removeMirroring;
                }),
                (S.save = function () {
                  e.save(), this.__originalSave();
                }),
                (S.restore = function () {
                  e.restore(), this.__originalRestore();
                }),
                (S.translate = function (d, T) {
                  e.translate(d, T), this.__originalTranslate(d, T);
                }),
                (S.scale = function (d, T) {
                  e.scale(d, T), this.__originalScale(d, T);
                }),
                (S.transform = function (d, T, x, P, G, st) {
                  e.transform(d, T, x, P, G, st), this.__originalTransform(d, T, x, P, G, st);
                }),
                (S.setTransform = function (d, T, x, P, G, st) {
                  e.setTransform(d, T, x, P, G, st), this.__originalSetTransform(d, T, x, P, G, st);
                }),
                (S.resetTransform = function () {
                  e.resetTransform(), this.__originalResetTransform();
                }),
                (S.rotate = function (d) {
                  e.rotate(d), this.__originalRotate(d);
                }),
                (S.clip = function (d) {
                  e.clip(d), this.__originalClip(d);
                }),
                (S.moveTo = function (i, d) {
                  e.moveTo(i, d), this.__originalMoveTo(i, d);
                }),
                (S.lineTo = function (i, d) {
                  e.lineTo(i, d), this.__originalLineTo(i, d);
                }),
                (S.bezierCurveTo = function (i, d, T, x, P, G) {
                  e.bezierCurveTo(i, d, T, x, P, G), this.__originalBezierCurveTo(i, d, T, x, P, G);
                }),
                (S.rect = function (i, d, T, x) {
                  e.rect(i, d, T, x), this.__originalRect(i, d, T, x);
                }),
                (S.closePath = function () {
                  e.closePath(), this.__originalClosePath();
                }),
                (S.beginPath = function () {
                  e.beginPath(), this.__originalBeginPath();
                });
            }
            class E {
              constructor(e) {
                (this.canvasFactory = e), (this.cache = Object.create(null));
              }
              getCanvas(e, i, d) {
                let T;
                return (
                  this.cache[e] !== void 0
                    ? ((T = this.cache[e]), this.canvasFactory.reset(T, i, d))
                    : ((T = this.canvasFactory.create(i, d)), (this.cache[e] = T)),
                  T
                );
              }
              delete(e) {
                delete this.cache[e];
              }
              clear() {
                for (let e in this.cache) {
                  let i = this.cache[e];
                  this.canvasFactory.destroy(i), delete this.cache[e];
                }
              }
            }
            function f(S, e, i, d, T, x, P, G, st, ct) {
              let [ht, pt, At, yt, Y, Z] = (0, M.getCurrentTransform)(S);
              if (pt === 0 && At === 0) {
                let X = P * ht + Y,
                  K = Math.round(X),
                  ut = G * yt + Z,
                  vt = Math.round(ut),
                  _t = (P + st) * ht + Y,
                  V = Math.abs(Math.round(_t) - K) || 1,
                  wt = (G + ct) * yt + Z,
                  Et = Math.abs(Math.round(wt) - vt) || 1;
                return (
                  S.setTransform(Math.sign(ht), 0, 0, Math.sign(yt), K, vt),
                  S.drawImage(e, i, d, T, x, 0, 0, V, Et),
                  S.setTransform(ht, pt, At, yt, Y, Z),
                  [V, Et]
                );
              }
              if (ht === 0 && yt === 0) {
                let X = G * At + Y,
                  K = Math.round(X),
                  ut = P * pt + Z,
                  vt = Math.round(ut),
                  _t = (G + ct) * At + Y,
                  V = Math.abs(Math.round(_t) - K) || 1,
                  wt = (P + st) * pt + Z,
                  Et = Math.abs(Math.round(wt) - vt) || 1;
                return (
                  S.setTransform(0, Math.sign(pt), Math.sign(At), 0, K, vt),
                  S.drawImage(e, i, d, T, x, 0, 0, Et, V),
                  S.setTransform(ht, pt, At, yt, Y, Z),
                  [Et, V]
                );
              }
              S.drawImage(e, i, d, T, x, P, G, st, ct);
              let u = Math.hypot(ht, pt),
                F = Math.hypot(At, yt);
              return [u * st, F * ct];
            }
            function h(S) {
              let { width: e, height: i } = S;
              if (e > O || i > O) return null;
              let d = 1e3,
                T = new Uint8Array([0, 2, 4, 0, 1, 0, 5, 4, 8, 10, 0, 8, 0, 2, 1, 0]),
                x = e + 1,
                P = new Uint8Array(x * (i + 1)),
                G,
                st,
                ct,
                ht = (e + 7) & -8,
                pt = new Uint8Array(ht * i),
                At = 0;
              for (let F of S.data) {
                let X = 128;
                for (; X > 0; ) (pt[At++] = F & X ? 0 : 255), (X >>= 1);
              }
              let yt = 0;
              for (At = 0, pt[At] !== 0 && ((P[0] = 1), ++yt), st = 1; st < e; st++)
                pt[At] !== pt[At + 1] && ((P[st] = pt[At] ? 2 : 1), ++yt), At++;
              for (pt[At] !== 0 && ((P[st] = 2), ++yt), G = 1; G < i; G++) {
                (At = G * ht), (ct = G * x), pt[At - ht] !== pt[At] && ((P[ct] = pt[At] ? 1 : 8), ++yt);
                let F = (pt[At] ? 4 : 0) + (pt[At - ht] ? 8 : 0);
                for (st = 1; st < e; st++)
                  (F = (F >> 2) + (pt[At + 1] ? 4 : 0) + (pt[At - ht + 1] ? 8 : 0)),
                    T[F] && ((P[ct + st] = T[F]), ++yt),
                    At++;
                if ((pt[At - ht] !== pt[At] && ((P[ct + st] = pt[At] ? 2 : 4), ++yt), yt > d)) return null;
              }
              for (At = ht * (i - 1), ct = G * x, pt[At] !== 0 && ((P[ct] = 8), ++yt), st = 1; st < e; st++)
                pt[At] !== pt[At + 1] && ((P[ct + st] = pt[At] ? 4 : 8), ++yt), At++;
              if ((pt[At] !== 0 && ((P[ct + st] = 4), ++yt), yt > d)) return null;
              let Y = new Int32Array([0, x, -1, 0, -x, 0, 0, 0, 1]),
                Z = new Path2D();
              for (G = 0; yt && G <= i; G++) {
                let F = G * x,
                  X = F + e;
                for (; F < X && !P[F]; ) F++;
                if (F === X) continue;
                Z.moveTo(F % x, G);
                let K = F,
                  ut = P[F];
                do {
                  let vt = Y[ut];
                  do F += vt;
                  while (!P[F]);
                  let _t = P[F];
                  _t !== 5 && _t !== 10
                    ? ((ut = _t), (P[F] = 0))
                    : ((ut = _t & ((51 * ut) >> 4)), (P[F] &= (ut >> 2) | (ut << 2))),
                    Z.lineTo(F % x, (F / x) | 0),
                    P[F] || --yt;
                } while (K !== F);
                --G;
              }
              return (
                (pt = null),
                (P = null),
                function (F) {
                  F.save(), F.scale(1 / e, -1 / i), F.translate(0, -i), F.fill(Z), F.beginPath(), F.restore();
                }
              );
            }
            class m {
              constructor(e, i) {
                (this.alphaIsShape = !1),
                  (this.fontSize = 0),
                  (this.fontSizeScale = 1),
                  (this.textMatrix = c.IDENTITY_MATRIX),
                  (this.textMatrixScale = 1),
                  (this.fontMatrix = c.FONT_IDENTITY_MATRIX),
                  (this.leading = 0),
                  (this.x = 0),
                  (this.y = 0),
                  (this.lineX = 0),
                  (this.lineY = 0),
                  (this.charSpacing = 0),
                  (this.wordSpacing = 0),
                  (this.textHScale = 1),
                  (this.textRenderingMode = c.TextRenderingMode.FILL),
                  (this.textRise = 0),
                  (this.fillColor = "#000000"),
                  (this.strokeColor = "#000000"),
                  (this.patternFill = !1),
                  (this.fillAlpha = 1),
                  (this.strokeAlpha = 1),
                  (this.lineWidth = 1),
                  (this.activeSMask = null),
                  (this.transferMaps = "none"),
                  this.startNewPathAndClipBox([0, 0, e, i]);
              }
              clone() {
                let e = Object.create(this);
                return (e.clipBox = this.clipBox.slice()), e;
              }
              setCurrentPoint(e, i) {
                (this.x = e), (this.y = i);
              }
              updatePathMinMax(e, i, d) {
                ([i, d] = c.Util.applyTransform([i, d], e)),
                  (this.minX = Math.min(this.minX, i)),
                  (this.minY = Math.min(this.minY, d)),
                  (this.maxX = Math.max(this.maxX, i)),
                  (this.maxY = Math.max(this.maxY, d));
              }
              updateRectMinMax(e, i) {
                let d = c.Util.applyTransform(i, e),
                  T = c.Util.applyTransform(i.slice(2), e);
                (this.minX = Math.min(this.minX, d[0], T[0])),
                  (this.minY = Math.min(this.minY, d[1], T[1])),
                  (this.maxX = Math.max(this.maxX, d[0], T[0])),
                  (this.maxY = Math.max(this.maxY, d[1], T[1]));
              }
              updateScalingPathMinMax(e, i) {
                c.Util.scaleMinMax(e, i),
                  (this.minX = Math.min(this.minX, i[0])),
                  (this.maxX = Math.max(this.maxX, i[1])),
                  (this.minY = Math.min(this.minY, i[2])),
                  (this.maxY = Math.max(this.maxY, i[3]));
              }
              updateCurvePathMinMax(e, i, d, T, x, P, G, st, ct, ht) {
                let pt = c.Util.bezierBoundingBox(i, d, T, x, P, G, st, ct);
                if (ht) {
                  (ht[0] = Math.min(ht[0], pt[0], pt[2])),
                    (ht[1] = Math.max(ht[1], pt[0], pt[2])),
                    (ht[2] = Math.min(ht[2], pt[1], pt[3])),
                    (ht[3] = Math.max(ht[3], pt[1], pt[3]));
                  return;
                }
                this.updateRectMinMax(e, pt);
              }
              getPathBoundingBox(e = lt.PathType.FILL, i = null) {
                let d = [this.minX, this.minY, this.maxX, this.maxY];
                if (e === lt.PathType.STROKE) {
                  i || (0, c.unreachable)("Stroke bounding box must include transform.");
                  let T = c.Util.singularValueDecompose2dScale(i),
                    x = (T[0] * this.lineWidth) / 2,
                    P = (T[1] * this.lineWidth) / 2;
                  (d[0] -= x), (d[1] -= P), (d[2] += x), (d[3] += P);
                }
                return d;
              }
              updateClipFromPath() {
                let e = c.Util.intersect(this.clipBox, this.getPathBoundingBox());
                this.startNewPathAndClipBox(e || [0, 0, 0, 0]);
              }
              isEmptyClip() {
                return this.minX === 1 / 0;
              }
              startNewPathAndClipBox(e) {
                (this.clipBox = e), (this.minX = 1 / 0), (this.minY = 1 / 0), (this.maxX = 0), (this.maxY = 0);
              }
              getClippedPathBoundingBox(e = lt.PathType.FILL, i = null) {
                return c.Util.intersect(this.clipBox, this.getPathBoundingBox(e, i));
              }
            }
            function I(S, e) {
              if (typeof ImageData != "undefined" && e instanceof ImageData) {
                S.putImageData(e, 0, 0);
                return;
              }
              let i = e.height,
                d = e.width,
                T = i % A,
                x = (i - T) / A,
                P = T === 0 ? x : x + 1,
                G = S.createImageData(d, A),
                st = 0,
                ct,
                ht = e.data,
                pt = G.data,
                At,
                yt,
                Y,
                Z;
              if (e.kind === c.ImageKind.GRAYSCALE_1BPP) {
                let u = ht.byteLength,
                  F = new Uint32Array(pt.buffer, 0, pt.byteLength >> 2),
                  X = F.length,
                  K = (d + 7) >> 3,
                  ut = 4294967295,
                  vt = c.FeatureTest.isLittleEndian ? 4278190080 : 255;
                for (At = 0; At < P; At++) {
                  for (Y = At < x ? A : T, ct = 0, yt = 0; yt < Y; yt++) {
                    let _t = u - st,
                      V = 0,
                      wt = _t > K ? d : _t * 8 - 7,
                      Et = wt & -8,
                      jt = 0,
                      Bt = 0;
                    for (; V < Et; V += 8)
                      (Bt = ht[st++]),
                        (F[ct++] = Bt & 128 ? ut : vt),
                        (F[ct++] = Bt & 64 ? ut : vt),
                        (F[ct++] = Bt & 32 ? ut : vt),
                        (F[ct++] = Bt & 16 ? ut : vt),
                        (F[ct++] = Bt & 8 ? ut : vt),
                        (F[ct++] = Bt & 4 ? ut : vt),
                        (F[ct++] = Bt & 2 ? ut : vt),
                        (F[ct++] = Bt & 1 ? ut : vt);
                    for (; V < wt; V++)
                      jt === 0 && ((Bt = ht[st++]), (jt = 128)), (F[ct++] = Bt & jt ? ut : vt), (jt >>= 1);
                  }
                  for (; ct < X; ) F[ct++] = 0;
                  S.putImageData(G, 0, At * A);
                }
              } else if (e.kind === c.ImageKind.RGBA_32BPP) {
                for (yt = 0, Z = d * A * 4, At = 0; At < x; At++)
                  pt.set(ht.subarray(st, st + Z)), (st += Z), S.putImageData(G, 0, yt), (yt += A);
                At < P && ((Z = d * T * 4), pt.set(ht.subarray(st, st + Z)), S.putImageData(G, 0, yt));
              } else if (e.kind === c.ImageKind.RGB_24BPP)
                for (Y = A, Z = d * Y, At = 0; At < P; At++) {
                  for (At >= x && ((Y = T), (Z = d * Y)), ct = 0, yt = Z; yt--; )
                    (pt[ct++] = ht[st++]), (pt[ct++] = ht[st++]), (pt[ct++] = ht[st++]), (pt[ct++] = 255);
                  S.putImageData(G, 0, At * A);
                }
              else throw new Error(`bad image kind: ${e.kind}`);
            }
            function y(S, e) {
              if (e.bitmap) {
                S.drawImage(e.bitmap, 0, 0);
                return;
              }
              let i = e.height,
                d = e.width,
                T = i % A,
                x = (i - T) / A,
                P = T === 0 ? x : x + 1,
                G = S.createImageData(d, A),
                st = 0,
                ct = e.data,
                ht = G.data;
              for (let pt = 0; pt < P; pt++) {
                let At = pt < x ? A : T;
                ({ srcPos: st } = (0, Q.convertBlackAndWhiteToRGBA)({
                  src: ct,
                  srcPos: st,
                  dest: ht,
                  width: d,
                  height: At,
                  nonBlackColor: 0,
                })),
                  S.putImageData(G, 0, pt * A);
              }
            }
            function r(S, e) {
              let i = [
                "strokeStyle",
                "fillStyle",
                "fillRule",
                "globalAlpha",
                "lineWidth",
                "lineCap",
                "lineJoin",
                "miterLimit",
                "globalCompositeOperation",
                "font",
                "filter",
              ];
              for (let d of i) S[d] !== void 0 && (e[d] = S[d]);
              S.setLineDash !== void 0 && (e.setLineDash(S.getLineDash()), (e.lineDashOffset = S.lineDashOffset));
            }
            function l(S) {
              if (
                ((S.strokeStyle = S.fillStyle = "#000000"),
                (S.fillRule = "nonzero"),
                (S.globalAlpha = 1),
                (S.lineWidth = 1),
                (S.lineCap = "butt"),
                (S.lineJoin = "miter"),
                (S.miterLimit = 10),
                (S.globalCompositeOperation = "source-over"),
                (S.font = "10px sans-serif"),
                S.setLineDash !== void 0 && (S.setLineDash([]), (S.lineDashOffset = 0)),
                !c.isNodeJS)
              ) {
                let { filter: e } = S;
                e !== "none" && e !== "" && (S.filter = "none");
              }
            }
            function s(S, e, i, d) {
              let T = S.length;
              for (let x = 3; x < T; x += 4) {
                let P = S[x];
                if (P === 0) (S[x - 3] = e), (S[x - 2] = i), (S[x - 1] = d);
                else if (P < 255) {
                  let G = 255 - P;
                  (S[x - 3] = (S[x - 3] * P + e * G) >> 8),
                    (S[x - 2] = (S[x - 2] * P + i * G) >> 8),
                    (S[x - 1] = (S[x - 1] * P + d * G) >> 8);
                }
              }
            }
            function a(S, e, i) {
              let d = S.length,
                T = 1 / 255;
              for (let x = 3; x < d; x += 4) {
                let P = i ? i[S[x]] : S[x];
                e[x] = (e[x] * P * T) | 0;
              }
            }
            function o(S, e, i) {
              let d = S.length;
              for (let T = 3; T < d; T += 4) {
                let x = S[T - 3] * 77 + S[T - 2] * 152 + S[T - 1] * 28;
                e[T] = i ? (e[T] * i[x >> 8]) >> 8 : (e[T] * x) >> 16;
              }
            }
            function L(S, e, i, d, T, x, P, G, st, ct, ht) {
              let pt = !!x,
                At = pt ? x[0] : 0,
                yt = pt ? x[1] : 0,
                Y = pt ? x[2] : 0,
                Z = T === "Luminosity" ? o : a,
                F = Math.min(d, Math.ceil(1048576 / i));
              for (let X = 0; X < d; X += F) {
                let K = Math.min(F, d - X),
                  ut = S.getImageData(G - ct, X + (st - ht), i, K),
                  vt = e.getImageData(G, X + st, i, K);
                pt && s(ut.data, At, yt, Y), Z(ut.data, vt.data, P), e.putImageData(vt, G, X + st);
              }
            }
            function n(S, e, i, d) {
              let T = d[0],
                x = d[1],
                P = d[2] - T,
                G = d[3] - x;
              P === 0 ||
                G === 0 ||
                (L(e.context, i, P, G, e.subtype, e.backdrop, e.transferMap, T, x, e.offsetX, e.offsetY),
                S.save(),
                (S.globalAlpha = 1),
                (S.globalCompositeOperation = "source-over"),
                S.setTransform(1, 0, 0, 1, 0, 0),
                S.drawImage(i.canvas, 0, 0),
                S.restore());
            }
            function _(S, e) {
              let i = c.Util.singularValueDecompose2dScale(S);
              (i[0] = Math.fround(i[0])), (i[1] = Math.fround(i[1]));
              let d = Math.fround((globalThis.devicePixelRatio || 1) * M.PixelsPerInch.PDF_TO_CSS_UNITS);
              return e !== void 0 ? e : i[0] <= d || i[1] <= d;
            }
            let k = ["butt", "round", "square"],
              it = ["miter", "round", "bevel"],
              H = {},
              q = {},
              $ = class $ {
                constructor(e, i, d, T, x, { optionalContentConfig: P, markedContentStack: G = null }, st, ct) {
                  J(this, rt);
                  (this.ctx = e),
                    (this.current = new m(this.ctx.canvas.width, this.ctx.canvas.height)),
                    (this.stateStack = []),
                    (this.pendingClip = null),
                    (this.pendingEOFill = !1),
                    (this.res = null),
                    (this.xobjs = null),
                    (this.commonObjs = i),
                    (this.objs = d),
                    (this.canvasFactory = T),
                    (this.filterFactory = x),
                    (this.groupStack = []),
                    (this.processingType3 = null),
                    (this.baseTransform = null),
                    (this.baseTransformStack = []),
                    (this.groupLevel = 0),
                    (this.smaskStack = []),
                    (this.smaskCounter = 0),
                    (this.tempSMask = null),
                    (this.suspendedCtx = null),
                    (this.contentVisible = !0),
                    (this.markedContentStack = G || []),
                    (this.optionalContentConfig = P),
                    (this.cachedCanvases = new E(this.canvasFactory)),
                    (this.cachedPatterns = new Map()),
                    (this.annotationCanvasMap = st),
                    (this.viewportScale = 1),
                    (this.outputScaleX = 1),
                    (this.outputScaleY = 1),
                    (this.pageColors = ct),
                    (this._cachedScaleForStroking = [-1, 0]),
                    (this._cachedGetSinglePixelWidth = null),
                    (this._cachedBitmapsMap = new Map());
                }
                getObject(e, i = null) {
                  return typeof e == "string" ? (e.startsWith("g_") ? this.commonObjs.get(e) : this.objs.get(e)) : i;
                }
                beginDrawing({ transform: e, viewport: i, transparency: d = !1, background: T = null }) {
                  let x = this.ctx.canvas.width,
                    P = this.ctx.canvas.height,
                    G = this.ctx.fillStyle;
                  if (
                    ((this.ctx.fillStyle = T || "#ffffff"), this.ctx.fillRect(0, 0, x, P), (this.ctx.fillStyle = G), d)
                  ) {
                    let st = this.cachedCanvases.getCanvas("transparent", x, P);
                    (this.compositeCtx = this.ctx),
                      (this.transparentCanvas = st.canvas),
                      (this.ctx = st.context),
                      this.ctx.save(),
                      this.ctx.transform(...(0, M.getCurrentTransform)(this.compositeCtx));
                  }
                  this.ctx.save(),
                    l(this.ctx),
                    e && (this.ctx.transform(...e), (this.outputScaleX = e[0]), (this.outputScaleY = e[0])),
                    this.ctx.transform(...i.transform),
                    (this.viewportScale = i.scale),
                    (this.baseTransform = (0, M.getCurrentTransform)(this.ctx));
                }
                executeOperatorList(e, i, d, T) {
                  let x = e.argsArray,
                    P = e.fnArray,
                    G = i || 0,
                    st = x.length;
                  if (st === G) return G;
                  let ct = st - G > N && typeof d == "function",
                    ht = ct ? Date.now() + p : 0,
                    pt = 0,
                    At = this.commonObjs,
                    yt = this.objs,
                    Y;
                  for (;;) {
                    if (T !== void 0 && G === T.nextBreakPoint) return T.breakIt(G, d), G;
                    if (((Y = P[G]), Y !== c.OPS.dependency)) this[Y].apply(this, x[G]);
                    else
                      for (let Z of x[G]) {
                        let u = Z.startsWith("g_") ? At : yt;
                        if (!u.has(Z)) return u.get(Z, d), G;
                      }
                    if ((G++, G === st)) return G;
                    if (ct && ++pt > N) {
                      if (Date.now() > ht) return d(), G;
                      pt = 0;
                    }
                  }
                }
                endDrawing() {
                  z(this, rt, ei).call(this), this.cachedCanvases.clear(), this.cachedPatterns.clear();
                  for (let e of this._cachedBitmapsMap.values()) {
                    for (let i of e.values())
                      typeof HTMLCanvasElement != "undefined" &&
                        i instanceof HTMLCanvasElement &&
                        (i.width = i.height = 0);
                    e.clear();
                  }
                  this._cachedBitmapsMap.clear(), z(this, rt, ii).call(this);
                }
                _scaleImage(e, i) {
                  let d = e.width,
                    T = e.height,
                    x = Math.max(Math.hypot(i[0], i[1]), 1),
                    P = Math.max(Math.hypot(i[2], i[3]), 1),
                    G = d,
                    st = T,
                    ct = "prescale1",
                    ht,
                    pt;
                  for (; (x > 2 && G > 1) || (P > 2 && st > 1); ) {
                    let At = G,
                      yt = st;
                    x > 2 &&
                      G > 1 &&
                      ((At = G >= 16384 ? Math.floor(G / 2) - 1 || 1 : Math.ceil(G / 2)), (x /= G / At)),
                      P > 2 &&
                        st > 1 &&
                        ((yt = st >= 16384 ? Math.floor(st / 2) - 1 || 1 : Math.ceil(st) / 2), (P /= st / yt)),
                      (ht = this.cachedCanvases.getCanvas(ct, At, yt)),
                      (pt = ht.context),
                      pt.clearRect(0, 0, At, yt),
                      pt.drawImage(e, 0, 0, G, st, 0, 0, At, yt),
                      (e = ht.canvas),
                      (G = At),
                      (st = yt),
                      (ct = ct === "prescale1" ? "prescale2" : "prescale1");
                  }
                  return { img: e, paintWidth: G, paintHeight: st };
                }
                _createMaskCanvas(e) {
                  let i = this.ctx,
                    { width: d, height: T } = e,
                    x = this.current.fillColor,
                    P = this.current.patternFill,
                    G = (0, M.getCurrentTransform)(i),
                    st,
                    ct,
                    ht,
                    pt;
                  if ((e.bitmap || e.data) && e.count > 1) {
                    let V = e.bitmap || e.data.buffer;
                    (ct = JSON.stringify(P ? G : [G.slice(0, 4), x])),
                      (st = this._cachedBitmapsMap.get(V)),
                      st || ((st = new Map()), this._cachedBitmapsMap.set(V, st));
                    let wt = st.get(ct);
                    if (wt && !P) {
                      let Et = Math.round(Math.min(G[0], G[2]) + G[4]),
                        jt = Math.round(Math.min(G[1], G[3]) + G[5]);
                      return { canvas: wt, offsetX: Et, offsetY: jt };
                    }
                    ht = wt;
                  }
                  ht || ((pt = this.cachedCanvases.getCanvas("maskCanvas", d, T)), y(pt.context, e));
                  let At = c.Util.transform(G, [1 / d, 0, 0, -1 / T, 0, 0]);
                  At = c.Util.transform(At, [1, 0, 0, 1, 0, -T]);
                  let yt = c.Util.applyTransform([0, 0], At),
                    Y = c.Util.applyTransform([d, T], At),
                    Z = c.Util.normalizeRect([yt[0], yt[1], Y[0], Y[1]]),
                    u = Math.round(Z[2] - Z[0]) || 1,
                    F = Math.round(Z[3] - Z[1]) || 1,
                    X = this.cachedCanvases.getCanvas("fillCanvas", u, F),
                    K = X.context,
                    ut = Math.min(yt[0], Y[0]),
                    vt = Math.min(yt[1], Y[1]);
                  K.translate(-ut, -vt),
                    K.transform(...At),
                    ht ||
                      ((ht = this._scaleImage(pt.canvas, (0, M.getCurrentTransformInverse)(K))),
                      (ht = ht.img),
                      st && P && st.set(ct, ht)),
                    (K.imageSmoothingEnabled = _((0, M.getCurrentTransform)(K), e.interpolate)),
                    f(K, ht, 0, 0, ht.width, ht.height, 0, 0, d, T),
                    (K.globalCompositeOperation = "source-in");
                  let _t = c.Util.transform((0, M.getCurrentTransformInverse)(K), [1, 0, 0, 1, -ut, -vt]);
                  return (
                    (K.fillStyle = P ? x.getPattern(i, this, _t, lt.PathType.FILL) : x),
                    K.fillRect(0, 0, d, T),
                    st && !P && (this.cachedCanvases.delete("fillCanvas"), st.set(ct, X.canvas)),
                    { canvas: X.canvas, offsetX: Math.round(ut), offsetY: Math.round(vt) }
                  );
                }
                setLineWidth(e) {
                  e !== this.current.lineWidth && (this._cachedScaleForStroking[0] = -1),
                    (this.current.lineWidth = e),
                    (this.ctx.lineWidth = e);
                }
                setLineCap(e) {
                  this.ctx.lineCap = k[e];
                }
                setLineJoin(e) {
                  this.ctx.lineJoin = it[e];
                }
                setMiterLimit(e) {
                  this.ctx.miterLimit = e;
                }
                setDash(e, i) {
                  let d = this.ctx;
                  d.setLineDash !== void 0 && (d.setLineDash(e), (d.lineDashOffset = i));
                }
                setRenderingIntent(e) {}
                setFlatness(e) {}
                setGState(e) {
                  for (let [i, d] of e)
                    switch (i) {
                      case "LW":
                        this.setLineWidth(d);
                        break;
                      case "LC":
                        this.setLineCap(d);
                        break;
                      case "LJ":
                        this.setLineJoin(d);
                        break;
                      case "ML":
                        this.setMiterLimit(d);
                        break;
                      case "D":
                        this.setDash(d[0], d[1]);
                        break;
                      case "RI":
                        this.setRenderingIntent(d);
                        break;
                      case "FL":
                        this.setFlatness(d);
                        break;
                      case "Font":
                        this.setFont(d[0], d[1]);
                        break;
                      case "CA":
                        this.current.strokeAlpha = d;
                        break;
                      case "ca":
                        (this.current.fillAlpha = d), (this.ctx.globalAlpha = d);
                        break;
                      case "BM":
                        this.ctx.globalCompositeOperation = d;
                        break;
                      case "SMask":
                        (this.current.activeSMask = d ? this.tempSMask : null),
                          (this.tempSMask = null),
                          this.checkSMaskState();
                        break;
                      case "TR":
                        this.ctx.filter = this.current.transferMaps = this.filterFactory.addFilter(d);
                        break;
                    }
                }
                get inSMaskMode() {
                  return !!this.suspendedCtx;
                }
                checkSMaskState() {
                  let e = this.inSMaskMode;
                  this.current.activeSMask && !e
                    ? this.beginSMaskMode()
                    : !this.current.activeSMask && e && this.endSMaskMode();
                }
                beginSMaskMode() {
                  if (this.inSMaskMode) throw new Error("beginSMaskMode called while already in smask mode");
                  let e = this.ctx.canvas.width,
                    i = this.ctx.canvas.height,
                    d = "smaskGroupAt" + this.groupLevel,
                    T = this.cachedCanvases.getCanvas(d, e, i);
                  (this.suspendedCtx = this.ctx), (this.ctx = T.context);
                  let x = this.ctx;
                  x.setTransform(...(0, M.getCurrentTransform)(this.suspendedCtx)),
                    r(this.suspendedCtx, x),
                    b(x, this.suspendedCtx),
                    this.setGState([
                      ["BM", "source-over"],
                      ["ca", 1],
                      ["CA", 1],
                    ]);
                }
                endSMaskMode() {
                  if (!this.inSMaskMode) throw new Error("endSMaskMode called while not in smask mode");
                  this.ctx._removeMirroring(),
                    r(this.ctx, this.suspendedCtx),
                    (this.ctx = this.suspendedCtx),
                    (this.suspendedCtx = null);
                }
                compose(e) {
                  if (!this.current.activeSMask) return;
                  e
                    ? ((e[0] = Math.floor(e[0])),
                      (e[1] = Math.floor(e[1])),
                      (e[2] = Math.ceil(e[2])),
                      (e[3] = Math.ceil(e[3])))
                    : (e = [0, 0, this.ctx.canvas.width, this.ctx.canvas.height]);
                  let i = this.current.activeSMask,
                    d = this.suspendedCtx;
                  n(d, i, this.ctx, e),
                    this.ctx.save(),
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0),
                    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height),
                    this.ctx.restore();
                }
                save() {
                  this.inSMaskMode ? (r(this.ctx, this.suspendedCtx), this.suspendedCtx.save()) : this.ctx.save();
                  let e = this.current;
                  this.stateStack.push(e), (this.current = e.clone());
                }
                restore() {
                  this.stateStack.length === 0 && this.inSMaskMode && this.endSMaskMode(),
                    this.stateStack.length !== 0 &&
                      ((this.current = this.stateStack.pop()),
                      this.inSMaskMode
                        ? (this.suspendedCtx.restore(), r(this.suspendedCtx, this.ctx))
                        : this.ctx.restore(),
                      this.checkSMaskState(),
                      (this.pendingClip = null),
                      (this._cachedScaleForStroking[0] = -1),
                      (this._cachedGetSinglePixelWidth = null));
                }
                transform(e, i, d, T, x, P) {
                  this.ctx.transform(e, i, d, T, x, P),
                    (this._cachedScaleForStroking[0] = -1),
                    (this._cachedGetSinglePixelWidth = null);
                }
                constructPath(e, i, d) {
                  let T = this.ctx,
                    x = this.current,
                    P = x.x,
                    G = x.y,
                    st,
                    ct,
                    ht = (0, M.getCurrentTransform)(T),
                    pt = (ht[0] === 0 && ht[3] === 0) || (ht[1] === 0 && ht[2] === 0),
                    At = pt ? d.slice(0) : null;
                  for (let yt = 0, Y = 0, Z = e.length; yt < Z; yt++)
                    switch (e[yt] | 0) {
                      case c.OPS.rectangle:
                        (P = i[Y++]), (G = i[Y++]);
                        let u = i[Y++],
                          F = i[Y++],
                          X = P + u,
                          K = G + F;
                        T.moveTo(P, G),
                          u === 0 || F === 0 ? T.lineTo(X, K) : (T.lineTo(X, G), T.lineTo(X, K), T.lineTo(P, K)),
                          pt || x.updateRectMinMax(ht, [P, G, X, K]),
                          T.closePath();
                        break;
                      case c.OPS.moveTo:
                        (P = i[Y++]), (G = i[Y++]), T.moveTo(P, G), pt || x.updatePathMinMax(ht, P, G);
                        break;
                      case c.OPS.lineTo:
                        (P = i[Y++]), (G = i[Y++]), T.lineTo(P, G), pt || x.updatePathMinMax(ht, P, G);
                        break;
                      case c.OPS.curveTo:
                        (st = P),
                          (ct = G),
                          (P = i[Y + 4]),
                          (G = i[Y + 5]),
                          T.bezierCurveTo(i[Y], i[Y + 1], i[Y + 2], i[Y + 3], P, G),
                          x.updateCurvePathMinMax(ht, st, ct, i[Y], i[Y + 1], i[Y + 2], i[Y + 3], P, G, At),
                          (Y += 6);
                        break;
                      case c.OPS.curveTo2:
                        (st = P),
                          (ct = G),
                          T.bezierCurveTo(P, G, i[Y], i[Y + 1], i[Y + 2], i[Y + 3]),
                          x.updateCurvePathMinMax(ht, st, ct, P, G, i[Y], i[Y + 1], i[Y + 2], i[Y + 3], At),
                          (P = i[Y + 2]),
                          (G = i[Y + 3]),
                          (Y += 4);
                        break;
                      case c.OPS.curveTo3:
                        (st = P),
                          (ct = G),
                          (P = i[Y + 2]),
                          (G = i[Y + 3]),
                          T.bezierCurveTo(i[Y], i[Y + 1], P, G, P, G),
                          x.updateCurvePathMinMax(ht, st, ct, i[Y], i[Y + 1], P, G, P, G, At),
                          (Y += 4);
                        break;
                      case c.OPS.closePath:
                        T.closePath();
                        break;
                    }
                  pt && x.updateScalingPathMinMax(ht, At), x.setCurrentPoint(P, G);
                }
                closePath() {
                  this.ctx.closePath();
                }
                stroke(e = !0) {
                  let i = this.ctx,
                    d = this.current.strokeColor;
                  (i.globalAlpha = this.current.strokeAlpha),
                    this.contentVisible &&
                      (typeof d == "object" && d != null && d.getPattern
                        ? (i.save(),
                          (i.strokeStyle = d.getPattern(
                            i,
                            this,
                            (0, M.getCurrentTransformInverse)(i),
                            lt.PathType.STROKE,
                          )),
                          this.rescaleAndStroke(!1),
                          i.restore())
                        : this.rescaleAndStroke(!0)),
                    e && this.consumePath(this.current.getClippedPathBoundingBox()),
                    (i.globalAlpha = this.current.fillAlpha);
                }
                closeStroke() {
                  this.closePath(), this.stroke();
                }
                fill(e = !0) {
                  let i = this.ctx,
                    d = this.current.fillColor,
                    T = this.current.patternFill,
                    x = !1;
                  T &&
                    (i.save(),
                    (i.fillStyle = d.getPattern(i, this, (0, M.getCurrentTransformInverse)(i), lt.PathType.FILL)),
                    (x = !0));
                  let P = this.current.getClippedPathBoundingBox();
                  this.contentVisible &&
                    P !== null &&
                    (this.pendingEOFill ? (i.fill("evenodd"), (this.pendingEOFill = !1)) : i.fill()),
                    x && i.restore(),
                    e && this.consumePath(P);
                }
                eoFill() {
                  (this.pendingEOFill = !0), this.fill();
                }
                fillStroke() {
                  this.fill(!1), this.stroke(!1), this.consumePath();
                }
                eoFillStroke() {
                  (this.pendingEOFill = !0), this.fillStroke();
                }
                closeFillStroke() {
                  this.closePath(), this.fillStroke();
                }
                closeEOFillStroke() {
                  (this.pendingEOFill = !0), this.closePath(), this.fillStroke();
                }
                endPath() {
                  this.consumePath();
                }
                clip() {
                  this.pendingClip = H;
                }
                eoClip() {
                  this.pendingClip = q;
                }
                beginText() {
                  (this.current.textMatrix = c.IDENTITY_MATRIX),
                    (this.current.textMatrixScale = 1),
                    (this.current.x = this.current.lineX = 0),
                    (this.current.y = this.current.lineY = 0);
                }
                endText() {
                  let e = this.pendingTextPaths,
                    i = this.ctx;
                  if (e === void 0) {
                    i.beginPath();
                    return;
                  }
                  i.save(), i.beginPath();
                  for (let d of e) i.setTransform(...d.transform), i.translate(d.x, d.y), d.addToPath(i, d.fontSize);
                  i.restore(), i.clip(), i.beginPath(), delete this.pendingTextPaths;
                }
                setCharSpacing(e) {
                  this.current.charSpacing = e;
                }
                setWordSpacing(e) {
                  this.current.wordSpacing = e;
                }
                setHScale(e) {
                  this.current.textHScale = e / 100;
                }
                setLeading(e) {
                  this.current.leading = -e;
                }
                setFont(e, i) {
                  var ht;
                  let d = this.commonObjs.get(e),
                    T = this.current;
                  if (!d) throw new Error(`Can't find font for ${e}`);
                  if (
                    ((T.fontMatrix = d.fontMatrix || c.FONT_IDENTITY_MATRIX),
                    (T.fontMatrix[0] === 0 || T.fontMatrix[3] === 0) &&
                      (0, c.warn)("Invalid font matrix for font " + e),
                    i < 0 ? ((i = -i), (T.fontDirection = -1)) : (T.fontDirection = 1),
                    (this.current.font = d),
                    (this.current.fontSize = i),
                    d.isType3Font)
                  )
                    return;
                  let x = d.loadedName || "sans-serif",
                    P = ((ht = d.systemFontInfo) == null ? void 0 : ht.css) || `"${x}", ${d.fallbackName}`,
                    G = "normal";
                  d.black ? (G = "900") : d.bold && (G = "bold");
                  let st = d.italic ? "italic" : "normal",
                    ct = i;
                  i < gt ? (ct = gt) : i > B && (ct = B),
                    (this.current.fontSizeScale = i / ct),
                    (this.ctx.font = `${st} ${G} ${ct}px ${P}`);
                }
                setTextRenderingMode(e) {
                  this.current.textRenderingMode = e;
                }
                setTextRise(e) {
                  this.current.textRise = e;
                }
                moveText(e, i) {
                  (this.current.x = this.current.lineX += e), (this.current.y = this.current.lineY += i);
                }
                setLeadingMoveText(e, i) {
                  this.setLeading(-i), this.moveText(e, i);
                }
                setTextMatrix(e, i, d, T, x, P) {
                  (this.current.textMatrix = [e, i, d, T, x, P]),
                    (this.current.textMatrixScale = Math.hypot(e, i)),
                    (this.current.x = this.current.lineX = 0),
                    (this.current.y = this.current.lineY = 0);
                }
                nextLine() {
                  this.moveText(0, this.current.leading);
                }
                paintChar(e, i, d, T) {
                  let x = this.ctx,
                    P = this.current,
                    G = P.font,
                    st = P.textRenderingMode,
                    ct = P.fontSize / P.fontSizeScale,
                    ht = st & c.TextRenderingMode.FILL_STROKE_MASK,
                    pt = !!(st & c.TextRenderingMode.ADD_TO_PATH_FLAG),
                    At = P.patternFill && !G.missingFile,
                    yt;
                  (G.disableFontFace || pt || At) && (yt = G.getPathGenerator(this.commonObjs, e)),
                    G.disableFontFace || At
                      ? (x.save(),
                        x.translate(i, d),
                        x.beginPath(),
                        yt(x, ct),
                        T && x.setTransform(...T),
                        (ht === c.TextRenderingMode.FILL || ht === c.TextRenderingMode.FILL_STROKE) && x.fill(),
                        (ht === c.TextRenderingMode.STROKE || ht === c.TextRenderingMode.FILL_STROKE) && x.stroke(),
                        x.restore())
                      : ((ht === c.TextRenderingMode.FILL || ht === c.TextRenderingMode.FILL_STROKE) &&
                          x.fillText(e, i, d),
                        (ht === c.TextRenderingMode.STROKE || ht === c.TextRenderingMode.FILL_STROKE) &&
                          x.strokeText(e, i, d)),
                    pt &&
                      (this.pendingTextPaths || (this.pendingTextPaths = [])).push({
                        transform: (0, M.getCurrentTransform)(x),
                        x: i,
                        y: d,
                        fontSize: ct,
                        addToPath: yt,
                      });
                }
                get isFontSubpixelAAEnabled() {
                  let { context: e } = this.cachedCanvases.getCanvas("isFontSubpixelAAEnabled", 10, 10);
                  e.scale(1.5, 1), e.fillText("I", 0, 10);
                  let i = e.getImageData(0, 0, 10, 10).data,
                    d = !1;
                  for (let T = 3; T < i.length; T += 4)
                    if (i[T] > 0 && i[T] < 255) {
                      d = !0;
                      break;
                    }
                  return (0, c.shadow)(this, "isFontSubpixelAAEnabled", d);
                }
                showText(e) {
                  let i = this.current,
                    d = i.font;
                  if (d.isType3Font) return this.showType3Text(e);
                  let T = i.fontSize;
                  if (T === 0) return;
                  let x = this.ctx,
                    P = i.fontSizeScale,
                    G = i.charSpacing,
                    st = i.wordSpacing,
                    ct = i.fontDirection,
                    ht = i.textHScale * ct,
                    pt = e.length,
                    At = d.vertical,
                    yt = At ? 1 : -1,
                    Y = d.defaultVMetrics,
                    Z = T * i.fontMatrix[0],
                    u = i.textRenderingMode === c.TextRenderingMode.FILL && !d.disableFontFace && !i.patternFill;
                  x.save(),
                    x.transform(...i.textMatrix),
                    x.translate(i.x, i.y + i.textRise),
                    ct > 0 ? x.scale(ht, -1) : x.scale(ht, 1);
                  let F;
                  if (i.patternFill) {
                    x.save();
                    let _t = i.fillColor.getPattern(x, this, (0, M.getCurrentTransformInverse)(x), lt.PathType.FILL);
                    (F = (0, M.getCurrentTransform)(x)), x.restore(), (x.fillStyle = _t);
                  }
                  let X = i.lineWidth,
                    K = i.textMatrixScale;
                  if (K === 0 || X === 0) {
                    let _t = i.textRenderingMode & c.TextRenderingMode.FILL_STROKE_MASK;
                    (_t === c.TextRenderingMode.STROKE || _t === c.TextRenderingMode.FILL_STROKE) &&
                      (X = this.getSinglePixelWidth());
                  } else X /= K;
                  if ((P !== 1 && (x.scale(P, P), (X /= P)), (x.lineWidth = X), d.isInvalidPDFjsFont)) {
                    let _t = [],
                      V = 0;
                    for (let wt of e) _t.push(wt.unicode), (V += wt.width);
                    x.fillText(_t.join(""), 0, 0), (i.x += V * Z * ht), x.restore(), this.compose();
                    return;
                  }
                  let ut = 0,
                    vt;
                  for (vt = 0; vt < pt; ++vt) {
                    let _t = e[vt];
                    if (typeof _t == "number") {
                      ut += (yt * _t * T) / 1e3;
                      continue;
                    }
                    let V = !1,
                      wt = (_t.isSpace ? st : 0) + G,
                      Et = _t.fontChar,
                      jt = _t.accent,
                      Bt,
                      qt,
                      Mt = _t.width;
                    if (At) {
                      let Wt = _t.vmetric || Y,
                        Vt = -(_t.vmetric ? Wt[1] : Mt * 0.5) * Z,
                        bt = Wt[2] * Z;
                      (Mt = Wt ? -Wt[0] : Mt), (Bt = Vt / P), (qt = (ut + bt) / P);
                    } else (Bt = ut / P), (qt = 0);
                    if (d.remeasure && Mt > 0) {
                      let Wt = ((x.measureText(Et).width * 1e3) / T) * P;
                      if (Mt < Wt && this.isFontSubpixelAAEnabled) {
                        let Vt = Mt / Wt;
                        (V = !0), x.save(), x.scale(Vt, 1), (Bt /= Vt);
                      } else Mt !== Wt && (Bt += (((Mt - Wt) / 2e3) * T) / P);
                    }
                    if (this.contentVisible && (_t.isInFont || d.missingFile)) {
                      if (u && !jt) x.fillText(Et, Bt, qt);
                      else if ((this.paintChar(Et, Bt, qt, F), jt)) {
                        let Wt = Bt + (T * jt.offset.x) / P,
                          Vt = qt - (T * jt.offset.y) / P;
                        this.paintChar(jt.fontChar, Wt, Vt, F);
                      }
                    }
                    let Nt = At ? Mt * Z - wt * ct : Mt * Z + wt * ct;
                    (ut += Nt), V && x.restore();
                  }
                  At ? (i.y -= ut) : (i.x += ut * ht), x.restore(), this.compose();
                }
                showType3Text(e) {
                  let i = this.ctx,
                    d = this.current,
                    T = d.font,
                    x = d.fontSize,
                    P = d.fontDirection,
                    G = T.vertical ? 1 : -1,
                    st = d.charSpacing,
                    ct = d.wordSpacing,
                    ht = d.textHScale * P,
                    pt = d.fontMatrix || c.FONT_IDENTITY_MATRIX,
                    At = e.length,
                    yt = d.textRenderingMode === c.TextRenderingMode.INVISIBLE,
                    Y,
                    Z,
                    u,
                    F;
                  if (!(yt || x === 0)) {
                    for (
                      this._cachedScaleForStroking[0] = -1,
                        this._cachedGetSinglePixelWidth = null,
                        i.save(),
                        i.transform(...d.textMatrix),
                        i.translate(d.x, d.y),
                        i.scale(ht, P),
                        Y = 0;
                      Y < At;
                      ++Y
                    ) {
                      if (((Z = e[Y]), typeof Z == "number")) {
                        (F = (G * Z * x) / 1e3), this.ctx.translate(F, 0), (d.x += F * ht);
                        continue;
                      }
                      let X = (Z.isSpace ? ct : 0) + st,
                        K = T.charProcOperatorList[Z.operatorListId];
                      if (!K) {
                        (0, c.warn)(`Type3 character "${Z.operatorListId}" is not available.`);
                        continue;
                      }
                      this.contentVisible &&
                        ((this.processingType3 = Z),
                        this.save(),
                        i.scale(x, x),
                        i.transform(...pt),
                        this.executeOperatorList(K),
                        this.restore()),
                        (u = c.Util.applyTransform([Z.width, 0], pt)[0] * x + X),
                        i.translate(u, 0),
                        (d.x += u * ht);
                    }
                    i.restore(), (this.processingType3 = null);
                  }
                }
                setCharWidth(e, i) {}
                setCharWidthAndBounds(e, i, d, T, x, P) {
                  this.ctx.rect(d, T, x - d, P - T), this.ctx.clip(), this.endPath();
                }
                getColorN_Pattern(e) {
                  let i;
                  if (e[0] === "TilingPattern") {
                    let d = e[1],
                      T = this.baseTransform || (0, M.getCurrentTransform)(this.ctx),
                      x = {
                        createCanvasGraphics: (P) =>
                          new $(P, this.commonObjs, this.objs, this.canvasFactory, this.filterFactory, {
                            optionalContentConfig: this.optionalContentConfig,
                            markedContentStack: this.markedContentStack,
                          }),
                      };
                    i = new lt.TilingPattern(e, d, this.ctx, x, T);
                  } else i = this._getPattern(e[1], e[2]);
                  return i;
                }
                setStrokeColorN() {
                  this.current.strokeColor = this.getColorN_Pattern(arguments);
                }
                setFillColorN() {
                  (this.current.fillColor = this.getColorN_Pattern(arguments)), (this.current.patternFill = !0);
                }
                setStrokeRGBColor(e, i, d) {
                  let T = c.Util.makeHexColor(e, i, d);
                  (this.ctx.strokeStyle = T), (this.current.strokeColor = T);
                }
                setFillRGBColor(e, i, d) {
                  let T = c.Util.makeHexColor(e, i, d);
                  (this.ctx.fillStyle = T), (this.current.fillColor = T), (this.current.patternFill = !1);
                }
                _getPattern(e, i = null) {
                  let d;
                  return (
                    this.cachedPatterns.has(e)
                      ? (d = this.cachedPatterns.get(e))
                      : ((d = (0, lt.getShadingPattern)(this.getObject(e))), this.cachedPatterns.set(e, d)),
                    i && (d.matrix = i),
                    d
                  );
                }
                shadingFill(e) {
                  if (!this.contentVisible) return;
                  let i = this.ctx;
                  this.save();
                  let d = this._getPattern(e);
                  i.fillStyle = d.getPattern(i, this, (0, M.getCurrentTransformInverse)(i), lt.PathType.SHADING);
                  let T = (0, M.getCurrentTransformInverse)(i);
                  if (T) {
                    let { width: x, height: P } = i.canvas,
                      [G, st, ct, ht] = c.Util.getAxialAlignedBoundingBox([0, 0, x, P], T);
                    this.ctx.fillRect(G, st, ct - G, ht - st);
                  } else this.ctx.fillRect(-1e10, -1e10, 2e10, 2e10);
                  this.compose(this.current.getClippedPathBoundingBox()), this.restore();
                }
                beginInlineImage() {
                  (0, c.unreachable)("Should not call beginInlineImage");
                }
                beginImageData() {
                  (0, c.unreachable)("Should not call beginImageData");
                }
                paintFormXObjectBegin(e, i) {
                  if (
                    this.contentVisible &&
                    (this.save(),
                    this.baseTransformStack.push(this.baseTransform),
                    Array.isArray(e) && e.length === 6 && this.transform(...e),
                    (this.baseTransform = (0, M.getCurrentTransform)(this.ctx)),
                    i)
                  ) {
                    let d = i[2] - i[0],
                      T = i[3] - i[1];
                    this.ctx.rect(i[0], i[1], d, T),
                      this.current.updateRectMinMax((0, M.getCurrentTransform)(this.ctx), i),
                      this.clip(),
                      this.endPath();
                  }
                }
                paintFormXObjectEnd() {
                  this.contentVisible && (this.restore(), (this.baseTransform = this.baseTransformStack.pop()));
                }
                beginGroup(e) {
                  if (!this.contentVisible) return;
                  this.save(), this.inSMaskMode && (this.endSMaskMode(), (this.current.activeSMask = null));
                  let i = this.ctx;
                  e.isolated || (0, c.info)("TODO: Support non-isolated groups."),
                    e.knockout && (0, c.warn)("Knockout groups not supported.");
                  let d = (0, M.getCurrentTransform)(i);
                  if ((e.matrix && i.transform(...e.matrix), !e.bbox)) throw new Error("Bounding box is required.");
                  let T = c.Util.getAxialAlignedBoundingBox(e.bbox, (0, M.getCurrentTransform)(i)),
                    x = [0, 0, i.canvas.width, i.canvas.height];
                  T = c.Util.intersect(T, x) || [0, 0, 0, 0];
                  let P = Math.floor(T[0]),
                    G = Math.floor(T[1]),
                    st = Math.max(Math.ceil(T[2]) - P, 1),
                    ct = Math.max(Math.ceil(T[3]) - G, 1),
                    ht = 1,
                    pt = 1;
                  st > R && ((ht = st / R), (st = R)),
                    ct > R && ((pt = ct / R), (ct = R)),
                    this.current.startNewPathAndClipBox([0, 0, st, ct]);
                  let At = "groupAt" + this.groupLevel;
                  e.smask && (At += "_smask_" + (this.smaskCounter++ % 2));
                  let yt = this.cachedCanvases.getCanvas(At, st, ct),
                    Y = yt.context;
                  Y.scale(1 / ht, 1 / pt),
                    Y.translate(-P, -G),
                    Y.transform(...d),
                    e.smask
                      ? this.smaskStack.push({
                          canvas: yt.canvas,
                          context: Y,
                          offsetX: P,
                          offsetY: G,
                          scaleX: ht,
                          scaleY: pt,
                          subtype: e.smask.subtype,
                          backdrop: e.smask.backdrop,
                          transferMap: e.smask.transferMap || null,
                          startTransformInverse: null,
                        })
                      : (i.setTransform(1, 0, 0, 1, 0, 0), i.translate(P, G), i.scale(ht, pt), i.save()),
                    r(i, Y),
                    (this.ctx = Y),
                    this.setGState([
                      ["BM", "source-over"],
                      ["ca", 1],
                      ["CA", 1],
                    ]),
                    this.groupStack.push(i),
                    this.groupLevel++;
                }
                endGroup(e) {
                  if (!this.contentVisible) return;
                  this.groupLevel--;
                  let i = this.ctx,
                    d = this.groupStack.pop();
                  if (((this.ctx = d), (this.ctx.imageSmoothingEnabled = !1), e.smask))
                    (this.tempSMask = this.smaskStack.pop()), this.restore();
                  else {
                    this.ctx.restore();
                    let T = (0, M.getCurrentTransform)(this.ctx);
                    this.restore(), this.ctx.save(), this.ctx.setTransform(...T);
                    let x = c.Util.getAxialAlignedBoundingBox([0, 0, i.canvas.width, i.canvas.height], T);
                    this.ctx.drawImage(i.canvas, 0, 0), this.ctx.restore(), this.compose(x);
                  }
                }
                beginAnnotation(e, i, d, T, x) {
                  if (
                    (z(this, rt, ei).call(this),
                    l(this.ctx),
                    this.ctx.save(),
                    this.save(),
                    this.baseTransform && this.ctx.setTransform(...this.baseTransform),
                    Array.isArray(i) && i.length === 4)
                  ) {
                    let P = i[2] - i[0],
                      G = i[3] - i[1];
                    if (x && this.annotationCanvasMap) {
                      (d = d.slice()),
                        (d[4] -= i[0]),
                        (d[5] -= i[1]),
                        (i = i.slice()),
                        (i[0] = i[1] = 0),
                        (i[2] = P),
                        (i[3] = G);
                      let [st, ct] = c.Util.singularValueDecompose2dScale((0, M.getCurrentTransform)(this.ctx)),
                        { viewportScale: ht } = this,
                        pt = Math.ceil(P * this.outputScaleX * ht),
                        At = Math.ceil(G * this.outputScaleY * ht);
                      this.annotationCanvas = this.canvasFactory.create(pt, At);
                      let { canvas: yt, context: Y } = this.annotationCanvas;
                      this.annotationCanvasMap.set(e, yt),
                        (this.annotationCanvas.savedCtx = this.ctx),
                        (this.ctx = Y),
                        this.ctx.save(),
                        this.ctx.setTransform(st, 0, 0, -ct, 0, G * ct),
                        l(this.ctx);
                    } else l(this.ctx), this.ctx.rect(i[0], i[1], P, G), this.ctx.clip(), this.endPath();
                  }
                  (this.current = new m(this.ctx.canvas.width, this.ctx.canvas.height)),
                    this.transform(...d),
                    this.transform(...T);
                }
                endAnnotation() {
                  this.annotationCanvas &&
                    (this.ctx.restore(),
                    z(this, rt, ii).call(this),
                    (this.ctx = this.annotationCanvas.savedCtx),
                    delete this.annotationCanvas.savedCtx,
                    delete this.annotationCanvas);
                }
                paintImageMaskXObject(e) {
                  if (!this.contentVisible) return;
                  let i = e.count;
                  (e = this.getObject(e.data, e)), (e.count = i);
                  let d = this.ctx,
                    T = this.processingType3;
                  if (T && (T.compiled === void 0 && (T.compiled = h(e)), T.compiled)) {
                    T.compiled(d);
                    return;
                  }
                  let x = this._createMaskCanvas(e),
                    P = x.canvas;
                  d.save(),
                    d.setTransform(1, 0, 0, 1, 0, 0),
                    d.drawImage(P, x.offsetX, x.offsetY),
                    d.restore(),
                    this.compose();
                }
                paintImageMaskXObjectRepeat(e, i, d = 0, T = 0, x, P) {
                  if (!this.contentVisible) return;
                  e = this.getObject(e.data, e);
                  let G = this.ctx;
                  G.save();
                  let st = (0, M.getCurrentTransform)(G);
                  G.transform(i, d, T, x, 0, 0);
                  let ct = this._createMaskCanvas(e);
                  G.setTransform(1, 0, 0, 1, ct.offsetX - st[4], ct.offsetY - st[5]);
                  for (let ht = 0, pt = P.length; ht < pt; ht += 2) {
                    let At = c.Util.transform(st, [i, d, T, x, P[ht], P[ht + 1]]),
                      [yt, Y] = c.Util.applyTransform([0, 0], At);
                    G.drawImage(ct.canvas, yt, Y);
                  }
                  G.restore(), this.compose();
                }
                paintImageMaskXObjectGroup(e) {
                  if (!this.contentVisible) return;
                  let i = this.ctx,
                    d = this.current.fillColor,
                    T = this.current.patternFill;
                  for (let x of e) {
                    let { data: P, width: G, height: st, transform: ct } = x,
                      ht = this.cachedCanvases.getCanvas("maskCanvas", G, st),
                      pt = ht.context;
                    pt.save();
                    let At = this.getObject(P, x);
                    y(pt, At),
                      (pt.globalCompositeOperation = "source-in"),
                      (pt.fillStyle = T
                        ? d.getPattern(pt, this, (0, M.getCurrentTransformInverse)(i), lt.PathType.FILL)
                        : d),
                      pt.fillRect(0, 0, G, st),
                      pt.restore(),
                      i.save(),
                      i.transform(...ct),
                      i.scale(1, -1),
                      f(i, ht.canvas, 0, 0, G, st, 0, -1, 1, 1),
                      i.restore();
                  }
                  this.compose();
                }
                paintImageXObject(e) {
                  if (!this.contentVisible) return;
                  let i = this.getObject(e);
                  if (!i) {
                    (0, c.warn)("Dependent image isn't ready yet");
                    return;
                  }
                  this.paintInlineImageXObject(i);
                }
                paintImageXObjectRepeat(e, i, d, T) {
                  if (!this.contentVisible) return;
                  let x = this.getObject(e);
                  if (!x) {
                    (0, c.warn)("Dependent image isn't ready yet");
                    return;
                  }
                  let P = x.width,
                    G = x.height,
                    st = [];
                  for (let ct = 0, ht = T.length; ct < ht; ct += 2)
                    st.push({ transform: [i, 0, 0, d, T[ct], T[ct + 1]], x: 0, y: 0, w: P, h: G });
                  this.paintInlineImageXObjectGroup(x, st);
                }
                applyTransferMapsToCanvas(e) {
                  return (
                    this.current.transferMaps !== "none" &&
                      ((e.filter = this.current.transferMaps), e.drawImage(e.canvas, 0, 0), (e.filter = "none")),
                    e.canvas
                  );
                }
                applyTransferMapsToBitmap(e) {
                  if (this.current.transferMaps === "none") return e.bitmap;
                  let { bitmap: i, width: d, height: T } = e,
                    x = this.cachedCanvases.getCanvas("inlineImage", d, T),
                    P = x.context;
                  return (P.filter = this.current.transferMaps), P.drawImage(i, 0, 0), (P.filter = "none"), x.canvas;
                }
                paintInlineImageXObject(e) {
                  if (!this.contentVisible) return;
                  let i = e.width,
                    d = e.height,
                    T = this.ctx;
                  if ((this.save(), !c.isNodeJS)) {
                    let { filter: G } = T;
                    G !== "none" && G !== "" && (T.filter = "none");
                  }
                  T.scale(1 / i, -1 / d);
                  let x;
                  if (e.bitmap) x = this.applyTransferMapsToBitmap(e);
                  else if ((typeof HTMLElement == "function" && e instanceof HTMLElement) || !e.data) x = e;
                  else {
                    let st = this.cachedCanvases.getCanvas("inlineImage", i, d).context;
                    I(st, e), (x = this.applyTransferMapsToCanvas(st));
                  }
                  let P = this._scaleImage(x, (0, M.getCurrentTransformInverse)(T));
                  (T.imageSmoothingEnabled = _((0, M.getCurrentTransform)(T), e.interpolate)),
                    f(T, P.img, 0, 0, P.paintWidth, P.paintHeight, 0, -d, i, d),
                    this.compose(),
                    this.restore();
                }
                paintInlineImageXObjectGroup(e, i) {
                  if (!this.contentVisible) return;
                  let d = this.ctx,
                    T;
                  if (e.bitmap) T = e.bitmap;
                  else {
                    let x = e.width,
                      P = e.height,
                      st = this.cachedCanvases.getCanvas("inlineImage", x, P).context;
                    I(st, e), (T = this.applyTransferMapsToCanvas(st));
                  }
                  for (let x of i)
                    d.save(),
                      d.transform(...x.transform),
                      d.scale(1, -1),
                      f(d, T, x.x, x.y, x.w, x.h, 0, -1, 1, 1),
                      d.restore();
                  this.compose();
                }
                paintSolidColorImageMask() {
                  this.contentVisible && (this.ctx.fillRect(0, 0, 1, 1), this.compose());
                }
                markPoint(e) {}
                markPointProps(e, i) {}
                beginMarkedContent(e) {
                  this.markedContentStack.push({ visible: !0 });
                }
                beginMarkedContentProps(e, i) {
                  e === "OC"
                    ? this.markedContentStack.push({ visible: this.optionalContentConfig.isVisible(i) })
                    : this.markedContentStack.push({ visible: !0 }),
                    (this.contentVisible = this.isContentVisible());
                }
                endMarkedContent() {
                  this.markedContentStack.pop(), (this.contentVisible = this.isContentVisible());
                }
                beginCompat() {}
                endCompat() {}
                consumePath(e) {
                  let i = this.current.isEmptyClip();
                  this.pendingClip && this.current.updateClipFromPath(), this.pendingClip || this.compose(e);
                  let d = this.ctx;
                  this.pendingClip &&
                    (i || (this.pendingClip === q ? d.clip("evenodd") : d.clip()), (this.pendingClip = null)),
                    this.current.startNewPathAndClipBox(this.current.clipBox),
                    d.beginPath();
                }
                getSinglePixelWidth() {
                  if (!this._cachedGetSinglePixelWidth) {
                    let e = (0, M.getCurrentTransform)(this.ctx);
                    if (e[1] === 0 && e[2] === 0)
                      this._cachedGetSinglePixelWidth = 1 / Math.min(Math.abs(e[0]), Math.abs(e[3]));
                    else {
                      let i = Math.abs(e[0] * e[3] - e[2] * e[1]),
                        d = Math.hypot(e[0], e[2]),
                        T = Math.hypot(e[1], e[3]);
                      this._cachedGetSinglePixelWidth = Math.max(d, T) / i;
                    }
                  }
                  return this._cachedGetSinglePixelWidth;
                }
                getScaleForStroking() {
                  if (this._cachedScaleForStroking[0] === -1) {
                    let { lineWidth: e } = this.current,
                      { a: i, b: d, c: T, d: x } = this.ctx.getTransform(),
                      P,
                      G;
                    if (d === 0 && T === 0) {
                      let st = Math.abs(i),
                        ct = Math.abs(x);
                      if (st === ct)
                        if (e === 0) P = G = 1 / st;
                        else {
                          let ht = st * e;
                          P = G = ht < 1 ? 1 / ht : 1;
                        }
                      else if (e === 0) (P = 1 / st), (G = 1 / ct);
                      else {
                        let ht = st * e,
                          pt = ct * e;
                        (P = ht < 1 ? 1 / ht : 1), (G = pt < 1 ? 1 / pt : 1);
                      }
                    } else {
                      let st = Math.abs(i * x - d * T),
                        ct = Math.hypot(i, d),
                        ht = Math.hypot(T, x);
                      if (e === 0) (P = ht / st), (G = ct / st);
                      else {
                        let pt = e * st;
                        (P = ht > pt ? ht / pt : 1), (G = ct > pt ? ct / pt : 1);
                      }
                    }
                    (this._cachedScaleForStroking[0] = P), (this._cachedScaleForStroking[1] = G);
                  }
                  return this._cachedScaleForStroking;
                }
                rescaleAndStroke(e) {
                  let { ctx: i } = this,
                    { lineWidth: d } = this.current,
                    [T, x] = this.getScaleForStroking();
                  if (((i.lineWidth = d || 1), T === 1 && x === 1)) {
                    i.stroke();
                    return;
                  }
                  let P = i.getLineDash();
                  if ((e && i.save(), i.scale(T, x), P.length > 0)) {
                    let G = Math.max(T, x);
                    i.setLineDash(P.map((st) => st / G)), (i.lineDashOffset /= G);
                  }
                  i.stroke(), e && i.restore();
                }
                isContentVisible() {
                  for (let e = this.markedContentStack.length - 1; e >= 0; e--)
                    if (!this.markedContentStack[e].visible) return !1;
                  return !0;
                }
              };
            (rt = new WeakSet()),
              (ei = function () {
                for (; this.stateStack.length || this.inSMaskMode; ) this.restore();
                this.ctx.restore(),
                  this.transparentCanvas &&
                    ((this.ctx = this.compositeCtx),
                    this.ctx.save(),
                    this.ctx.setTransform(1, 0, 0, 1, 0, 0),
                    this.ctx.drawImage(this.transparentCanvas, 0, 0),
                    this.ctx.restore(),
                    (this.transparentCanvas = null));
              }),
              (ii = function () {
                if (this.pageColors) {
                  let e = this.filterFactory.addHCMFilter(this.pageColors.foreground, this.pageColors.background);
                  if (e !== "none") {
                    let i = this.ctx.filter;
                    (this.ctx.filter = e), this.ctx.drawImage(this.ctx.canvas, 0, 0), (this.ctx.filter = i);
                  }
                }
              });
            let j = $;
            g.CanvasGraphics = j;
            for (let S in c.OPS) j.prototype[S] !== void 0 && (j.prototype[c.OPS[S]] = j.prototype[S]);
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.TilingPattern = g.PathType = void 0),
              (g.getShadingPattern = A);
            var c = ft(1),
              M = ft(6);
            let lt = { FILL: "Fill", STROKE: "Stroke", SHADING: "Shading" };
            g.PathType = lt;
            function Q(h, m) {
              if (!m) return;
              let I = m[2] - m[0],
                y = m[3] - m[1],
                r = new Path2D();
              r.rect(m[0], m[1], I, y), h.clip(r);
            }
            class gt {
              constructor() {
                this.constructor === gt && (0, c.unreachable)("Cannot initialize BaseShadingPattern.");
              }
              getPattern() {
                (0, c.unreachable)("Abstract method `getPattern` called.");
              }
            }
            class B extends gt {
              constructor(m) {
                super(),
                  (this._type = m[1]),
                  (this._bbox = m[2]),
                  (this._colorStops = m[3]),
                  (this._p0 = m[4]),
                  (this._p1 = m[5]),
                  (this._r0 = m[6]),
                  (this._r1 = m[7]),
                  (this.matrix = null);
              }
              _createGradient(m) {
                let I;
                this._type === "axial"
                  ? (I = m.createLinearGradient(this._p0[0], this._p0[1], this._p1[0], this._p1[1]))
                  : this._type === "radial" &&
                    (I = m.createRadialGradient(
                      this._p0[0],
                      this._p0[1],
                      this._r0,
                      this._p1[0],
                      this._p1[1],
                      this._r1,
                    ));
                for (let y of this._colorStops) I.addColorStop(y[0], y[1]);
                return I;
              }
              getPattern(m, I, y, r) {
                let l;
                if (r === lt.STROKE || r === lt.FILL) {
                  let s = I.current.getClippedPathBoundingBox(r, (0, M.getCurrentTransform)(m)) || [0, 0, 0, 0],
                    a = Math.ceil(s[2] - s[0]) || 1,
                    o = Math.ceil(s[3] - s[1]) || 1,
                    L = I.cachedCanvases.getCanvas("pattern", a, o, !0),
                    n = L.context;
                  n.clearRect(0, 0, n.canvas.width, n.canvas.height),
                    n.beginPath(),
                    n.rect(0, 0, n.canvas.width, n.canvas.height),
                    n.translate(-s[0], -s[1]),
                    (y = c.Util.transform(y, [1, 0, 0, 1, s[0], s[1]])),
                    n.transform(...I.baseTransform),
                    this.matrix && n.transform(...this.matrix),
                    Q(n, this._bbox),
                    (n.fillStyle = this._createGradient(n)),
                    n.fill(),
                    (l = m.createPattern(L.canvas, "no-repeat"));
                  let _ = new DOMMatrix(y);
                  l.setTransform(_);
                } else Q(m, this._bbox), (l = this._createGradient(m));
                return l;
              }
            }
            function R(h, m, I, y, r, l, s, a) {
              let o = m.coords,
                L = m.colors,
                n = h.data,
                _ = h.width * 4,
                k;
              o[I + 1] > o[y + 1] && ((k = I), (I = y), (y = k), (k = l), (l = s), (s = k)),
                o[y + 1] > o[r + 1] && ((k = y), (y = r), (r = k), (k = s), (s = a), (a = k)),
                o[I + 1] > o[y + 1] && ((k = I), (I = y), (y = k), (k = l), (l = s), (s = k));
              let it = (o[I] + m.offsetX) * m.scaleX,
                H = (o[I + 1] + m.offsetY) * m.scaleY,
                q = (o[y] + m.offsetX) * m.scaleX,
                j = (o[y + 1] + m.offsetY) * m.scaleY,
                rt = (o[r] + m.offsetX) * m.scaleX,
                C = (o[r + 1] + m.offsetY) * m.scaleY;
              if (H >= C) return;
              let U = L[l],
                $ = L[l + 1],
                S = L[l + 2],
                e = L[s],
                i = L[s + 1],
                d = L[s + 2],
                T = L[a],
                x = L[a + 1],
                P = L[a + 2],
                G = Math.round(H),
                st = Math.round(C),
                ct,
                ht,
                pt,
                At,
                yt,
                Y,
                Z,
                u;
              for (let F = G; F <= st; F++) {
                if (F < j) {
                  let _t = F < H ? 0 : (H - F) / (H - j);
                  (ct = it - (it - q) * _t), (ht = U - (U - e) * _t), (pt = $ - ($ - i) * _t), (At = S - (S - d) * _t);
                } else {
                  let _t;
                  F > C ? (_t = 1) : j === C ? (_t = 0) : (_t = (j - F) / (j - C)),
                    (ct = q - (q - rt) * _t),
                    (ht = e - (e - T) * _t),
                    (pt = i - (i - x) * _t),
                    (At = d - (d - P) * _t);
                }
                let X;
                F < H ? (X = 0) : F > C ? (X = 1) : (X = (H - F) / (H - C)),
                  (yt = it - (it - rt) * X),
                  (Y = U - (U - T) * X),
                  (Z = $ - ($ - x) * X),
                  (u = S - (S - P) * X);
                let K = Math.round(Math.min(ct, yt)),
                  ut = Math.round(Math.max(ct, yt)),
                  vt = _ * F + K * 4;
                for (let _t = K; _t <= ut; _t++)
                  (X = (ct - _t) / (ct - yt)),
                    X < 0 ? (X = 0) : X > 1 && (X = 1),
                    (n[vt++] = (ht - (ht - Y) * X) | 0),
                    (n[vt++] = (pt - (pt - Z) * X) | 0),
                    (n[vt++] = (At - (At - u) * X) | 0),
                    (n[vt++] = 255);
              }
            }
            function p(h, m, I) {
              let y = m.coords,
                r = m.colors,
                l,
                s;
              switch (m.type) {
                case "lattice":
                  let a = m.verticesPerRow,
                    o = Math.floor(y.length / a) - 1,
                    L = a - 1;
                  for (l = 0; l < o; l++) {
                    let n = l * a;
                    for (let _ = 0; _ < L; _++, n++)
                      R(h, I, y[n], y[n + 1], y[n + a], r[n], r[n + 1], r[n + a]),
                        R(h, I, y[n + a + 1], y[n + 1], y[n + a], r[n + a + 1], r[n + 1], r[n + a]);
                  }
                  break;
                case "triangles":
                  for (l = 0, s = y.length; l < s; l += 3) R(h, I, y[l], y[l + 1], y[l + 2], r[l], r[l + 1], r[l + 2]);
                  break;
                default:
                  throw new Error("illegal figure");
              }
            }
            class N extends gt {
              constructor(m) {
                super(),
                  (this._coords = m[2]),
                  (this._colors = m[3]),
                  (this._figures = m[4]),
                  (this._bounds = m[5]),
                  (this._bbox = m[7]),
                  (this._background = m[8]),
                  (this.matrix = null);
              }
              _createMeshCanvas(m, I, y) {
                let a = Math.floor(this._bounds[0]),
                  o = Math.floor(this._bounds[1]),
                  L = Math.ceil(this._bounds[2]) - a,
                  n = Math.ceil(this._bounds[3]) - o,
                  _ = Math.min(Math.ceil(Math.abs(L * m[0] * 1.1)), 3e3),
                  k = Math.min(Math.ceil(Math.abs(n * m[1] * 1.1)), 3e3),
                  it = L / _,
                  H = n / k,
                  q = {
                    coords: this._coords,
                    colors: this._colors,
                    offsetX: -a,
                    offsetY: -o,
                    scaleX: 1 / it,
                    scaleY: 1 / H,
                  },
                  j = _ + 2 * 2,
                  rt = k + 2 * 2,
                  C = y.getCanvas("mesh", j, rt, !1),
                  U = C.context,
                  $ = U.createImageData(_, k);
                if (I) {
                  let e = $.data;
                  for (let i = 0, d = e.length; i < d; i += 4)
                    (e[i] = I[0]), (e[i + 1] = I[1]), (e[i + 2] = I[2]), (e[i + 3] = 255);
                }
                for (let e of this._figures) p($, e, q);
                return (
                  U.putImageData($, 2, 2),
                  { canvas: C.canvas, offsetX: a - 2 * it, offsetY: o - 2 * H, scaleX: it, scaleY: H }
                );
              }
              getPattern(m, I, y, r) {
                Q(m, this._bbox);
                let l;
                if (r === lt.SHADING) l = c.Util.singularValueDecompose2dScale((0, M.getCurrentTransform)(m));
                else if (((l = c.Util.singularValueDecompose2dScale(I.baseTransform)), this.matrix)) {
                  let a = c.Util.singularValueDecompose2dScale(this.matrix);
                  l = [l[0] * a[0], l[1] * a[1]];
                }
                let s = this._createMeshCanvas(l, r === lt.SHADING ? null : this._background, I.cachedCanvases);
                return (
                  r !== lt.SHADING && (m.setTransform(...I.baseTransform), this.matrix && m.transform(...this.matrix)),
                  m.translate(s.offsetX, s.offsetY),
                  m.scale(s.scaleX, s.scaleY),
                  m.createPattern(s.canvas, "no-repeat")
                );
              }
            }
            class O extends gt {
              getPattern() {
                return "hotpink";
              }
            }
            function A(h) {
              switch (h[0]) {
                case "RadialAxial":
                  return new B(h);
                case "Mesh":
                  return new N(h);
                case "Dummy":
                  return new O();
              }
              throw new Error(`Unknown IR type: ${h[0]}`);
            }
            let b = { COLORED: 1, UNCOLORED: 2 },
              f = class f {
                constructor(m, I, y, r, l) {
                  (this.operatorList = m[2]),
                    (this.matrix = m[3] || [1, 0, 0, 1, 0, 0]),
                    (this.bbox = m[4]),
                    (this.xstep = m[5]),
                    (this.ystep = m[6]),
                    (this.paintType = m[7]),
                    (this.tilingType = m[8]),
                    (this.color = I),
                    (this.ctx = y),
                    (this.canvasGraphicsFactory = r),
                    (this.baseTransform = l);
                }
                createPatternCanvas(m) {
                  let I = this.operatorList,
                    y = this.bbox,
                    r = this.xstep,
                    l = this.ystep,
                    s = this.paintType,
                    a = this.tilingType,
                    o = this.color,
                    L = this.canvasGraphicsFactory;
                  (0, c.info)("TilingType: " + a);
                  let n = y[0],
                    _ = y[1],
                    k = y[2],
                    it = y[3],
                    H = c.Util.singularValueDecompose2dScale(this.matrix),
                    q = c.Util.singularValueDecompose2dScale(this.baseTransform),
                    j = [H[0] * q[0], H[1] * q[1]],
                    rt = this.getSizeAndScale(r, this.ctx.canvas.width, j[0]),
                    C = this.getSizeAndScale(l, this.ctx.canvas.height, j[1]),
                    U = m.cachedCanvases.getCanvas("pattern", rt.size, C.size, !0),
                    $ = U.context,
                    S = L.createCanvasGraphics($);
                  (S.groupLevel = m.groupLevel), this.setFillAndStrokeStyleToContext(S, s, o);
                  let e = n,
                    i = _,
                    d = k,
                    T = it;
                  return (
                    n < 0 && ((e = 0), (d += Math.abs(n))),
                    _ < 0 && ((i = 0), (T += Math.abs(_))),
                    $.translate(-(rt.scale * e), -(C.scale * i)),
                    S.transform(rt.scale, 0, 0, C.scale, 0, 0),
                    $.save(),
                    this.clipBbox(S, e, i, d, T),
                    (S.baseTransform = (0, M.getCurrentTransform)(S.ctx)),
                    S.executeOperatorList(I),
                    S.endDrawing(),
                    { canvas: U.canvas, scaleX: rt.scale, scaleY: C.scale, offsetX: e, offsetY: i }
                  );
                }
                getSizeAndScale(m, I, y) {
                  m = Math.abs(m);
                  let r = Math.max(f.MAX_PATTERN_SIZE, I),
                    l = Math.ceil(m * y);
                  return l >= r ? (l = r) : (y = l / m), { scale: y, size: l };
                }
                clipBbox(m, I, y, r, l) {
                  let s = r - I,
                    a = l - y;
                  m.ctx.rect(I, y, s, a),
                    m.current.updateRectMinMax((0, M.getCurrentTransform)(m.ctx), [I, y, r, l]),
                    m.clip(),
                    m.endPath();
                }
                setFillAndStrokeStyleToContext(m, I, y) {
                  let r = m.ctx,
                    l = m.current;
                  switch (I) {
                    case b.COLORED:
                      let s = this.ctx;
                      (r.fillStyle = s.fillStyle),
                        (r.strokeStyle = s.strokeStyle),
                        (l.fillColor = s.fillStyle),
                        (l.strokeColor = s.strokeStyle);
                      break;
                    case b.UNCOLORED:
                      let a = c.Util.makeHexColor(y[0], y[1], y[2]);
                      (r.fillStyle = a), (r.strokeStyle = a), (l.fillColor = a), (l.strokeColor = a);
                      break;
                    default:
                      throw new c.FormatError(`Unsupported paint type: ${I}`);
                  }
                }
                getPattern(m, I, y, r) {
                  let l = y;
                  r !== lt.SHADING &&
                    ((l = c.Util.transform(l, I.baseTransform)), this.matrix && (l = c.Util.transform(l, this.matrix)));
                  let s = this.createPatternCanvas(I),
                    a = new DOMMatrix(l);
                  (a = a.translate(s.offsetX, s.offsetY)), (a = a.scale(1 / s.scaleX, 1 / s.scaleY));
                  let o = m.createPattern(s.canvas, "repeat");
                  return o.setTransform(a), o;
                }
              };
            Jt(f, "MAX_PATTERN_SIZE", 3e3);
            let E = f;
            g.TilingPattern = E;
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.convertBlackAndWhiteToRGBA = lt),
              (g.convertToRGBA = M),
              (g.grayToRGBA = gt);
            var c = ft(1);
            function M(B) {
              switch (B.kind) {
                case c.ImageKind.GRAYSCALE_1BPP:
                  return lt(B);
                case c.ImageKind.RGB_24BPP:
                  return Q(B);
              }
              return null;
            }
            function lt({
              src: B,
              srcPos: R = 0,
              dest: p,
              width: N,
              height: O,
              nonBlackColor: A = 4294967295,
              inverseDecode: b = !1,
            }) {
              let E = c.FeatureTest.isLittleEndian ? 4278190080 : 255,
                [f, h] = b ? [A, E] : [E, A],
                m = N >> 3,
                I = N & 7,
                y = B.length;
              p = new Uint32Array(p.buffer);
              let r = 0;
              for (let l = 0; l < O; l++) {
                for (let a = R + m; R < a; R++) {
                  let o = R < y ? B[R] : 255;
                  (p[r++] = o & 128 ? h : f),
                    (p[r++] = o & 64 ? h : f),
                    (p[r++] = o & 32 ? h : f),
                    (p[r++] = o & 16 ? h : f),
                    (p[r++] = o & 8 ? h : f),
                    (p[r++] = o & 4 ? h : f),
                    (p[r++] = o & 2 ? h : f),
                    (p[r++] = o & 1 ? h : f);
                }
                if (I === 0) continue;
                let s = R < y ? B[R++] : 255;
                for (let a = 0; a < I; a++) p[r++] = s & (1 << (7 - a)) ? h : f;
              }
              return { srcPos: R, destPos: r };
            }
            function Q({ src: B, srcPos: R = 0, dest: p, destPos: N = 0, width: O, height: A }) {
              let b = 0,
                E = B.length >> 2,
                f = new Uint32Array(B.buffer, R, E);
              if (c.FeatureTest.isLittleEndian) {
                for (; b < E - 2; b += 3, N += 4) {
                  let h = f[b],
                    m = f[b + 1],
                    I = f[b + 2];
                  (p[N] = h | 4278190080),
                    (p[N + 1] = (h >>> 24) | (m << 8) | 4278190080),
                    (p[N + 2] = (m >>> 16) | (I << 16) | 4278190080),
                    (p[N + 3] = (I >>> 8) | 4278190080);
                }
                for (let h = b * 4, m = B.length; h < m; h += 3)
                  p[N++] = B[h] | (B[h + 1] << 8) | (B[h + 2] << 16) | 4278190080;
              } else {
                for (; b < E - 2; b += 3, N += 4) {
                  let h = f[b],
                    m = f[b + 1],
                    I = f[b + 2];
                  (p[N] = h | 255),
                    (p[N + 1] = (h << 24) | (m >>> 8) | 255),
                    (p[N + 2] = (m << 16) | (I >>> 16) | 255),
                    (p[N + 3] = (I << 8) | 255);
                }
                for (let h = b * 4, m = B.length; h < m; h += 3)
                  p[N++] = (B[h] << 24) | (B[h + 1] << 16) | (B[h + 2] << 8) | 255;
              }
              return { srcPos: R, destPos: N };
            }
            function gt(B, R) {
              if (c.FeatureTest.isLittleEndian)
                for (let p = 0, N = B.length; p < N; p++) R[p] = (B[p] * 65793) | 4278190080;
              else for (let p = 0, N = B.length; p < N; p++) R[p] = (B[p] * 16843008) | 255;
            }
          },
          (xt, g) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.GlobalWorkerOptions = void 0);
            let ft = Object.create(null);
            (g.GlobalWorkerOptions = ft), (ft.workerPort = null), (ft.workerSrc = "");
          },
          (xt, g, ft) => {
            var B, Ii, Li, Pe;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.MessageHandler = void 0);
            var c = ft(1);
            let M = { UNKNOWN: 0, DATA: 1, ERROR: 2 },
              lt = {
                UNKNOWN: 0,
                CANCEL: 1,
                CANCEL_COMPLETE: 2,
                CLOSE: 3,
                ENQUEUE: 4,
                ERROR: 5,
                PULL: 6,
                PULL_COMPLETE: 7,
                START_COMPLETE: 8,
              };
            function Q(O) {
              switch (
                (O instanceof Error ||
                  (typeof O == "object" && O !== null) ||
                  (0, c.unreachable)('wrapReason: Expected "reason" to be a (possibly cloned) Error.'),
                O.name)
              ) {
                case "AbortException":
                  return new c.AbortException(O.message);
                case "MissingPDFException":
                  return new c.MissingPDFException(O.message);
                case "PasswordException":
                  return new c.PasswordException(O.message, O.code);
                case "UnexpectedResponseException":
                  return new c.UnexpectedResponseException(O.message, O.status);
                case "UnknownErrorException":
                  return new c.UnknownErrorException(O.message, O.details);
                default:
                  return new c.UnknownErrorException(O.message, O.toString());
              }
            }
            class gt {
              constructor(A, b, E) {
                J(this, B);
                (this.sourceName = A),
                  (this.targetName = b),
                  (this.comObj = E),
                  (this.callbackId = 1),
                  (this.streamId = 1),
                  (this.streamSinks = Object.create(null)),
                  (this.streamControllers = Object.create(null)),
                  (this.callbackCapabilities = Object.create(null)),
                  (this.actionHandler = Object.create(null)),
                  (this._onComObjOnMessage = (f) => {
                    let h = f.data;
                    if (h.targetName !== this.sourceName) return;
                    if (h.stream) {
                      z(this, B, Li).call(this, h);
                      return;
                    }
                    if (h.callback) {
                      let I = h.callbackId,
                        y = this.callbackCapabilities[I];
                      if (!y) throw new Error(`Cannot resolve callback ${I}`);
                      if ((delete this.callbackCapabilities[I], h.callback === M.DATA)) y.resolve(h.data);
                      else if (h.callback === M.ERROR) y.reject(Q(h.reason));
                      else throw new Error("Unexpected callback case");
                      return;
                    }
                    let m = this.actionHandler[h.action];
                    if (!m) throw new Error(`Unknown action from worker: ${h.action}`);
                    if (h.callbackId) {
                      let I = this.sourceName,
                        y = h.sourceName;
                      new Promise(function (r) {
                        r(m(h.data));
                      }).then(
                        function (r) {
                          E.postMessage({
                            sourceName: I,
                            targetName: y,
                            callback: M.DATA,
                            callbackId: h.callbackId,
                            data: r,
                          });
                        },
                        function (r) {
                          E.postMessage({
                            sourceName: I,
                            targetName: y,
                            callback: M.ERROR,
                            callbackId: h.callbackId,
                            reason: Q(r),
                          });
                        },
                      );
                      return;
                    }
                    if (h.streamId) {
                      z(this, B, Ii).call(this, h);
                      return;
                    }
                    m(h.data);
                  }),
                  E.addEventListener("message", this._onComObjOnMessage);
              }
              on(A, b) {
                let E = this.actionHandler;
                if (E[A]) throw new Error(`There is already an actionName called "${A}"`);
                E[A] = b;
              }
              send(A, b, E) {
                this.comObj.postMessage(
                  { sourceName: this.sourceName, targetName: this.targetName, action: A, data: b },
                  E,
                );
              }
              sendWithPromise(A, b, E) {
                let f = this.callbackId++,
                  h = new c.PromiseCapability();
                this.callbackCapabilities[f] = h;
                try {
                  this.comObj.postMessage(
                    { sourceName: this.sourceName, targetName: this.targetName, action: A, callbackId: f, data: b },
                    E,
                  );
                } catch (m) {
                  h.reject(m);
                }
                return h.promise;
              }
              sendWithStream(A, b, E, f) {
                let h = this.streamId++,
                  m = this.sourceName,
                  I = this.targetName,
                  y = this.comObj;
                return new ReadableStream(
                  {
                    start: (r) => {
                      let l = new c.PromiseCapability();
                      return (
                        (this.streamControllers[h] = {
                          controller: r,
                          startCall: l,
                          pullCall: null,
                          cancelCall: null,
                          isClosed: !1,
                        }),
                        y.postMessage(
                          { sourceName: m, targetName: I, action: A, streamId: h, data: b, desiredSize: r.desiredSize },
                          f,
                        ),
                        l.promise
                      );
                    },
                    pull: (r) => {
                      let l = new c.PromiseCapability();
                      return (
                        (this.streamControllers[h].pullCall = l),
                        y.postMessage({
                          sourceName: m,
                          targetName: I,
                          stream: lt.PULL,
                          streamId: h,
                          desiredSize: r.desiredSize,
                        }),
                        l.promise
                      );
                    },
                    cancel: (r) => {
                      (0, c.assert)(r instanceof Error, "cancel must have a valid reason");
                      let l = new c.PromiseCapability();
                      return (
                        (this.streamControllers[h].cancelCall = l),
                        (this.streamControllers[h].isClosed = !0),
                        y.postMessage({ sourceName: m, targetName: I, stream: lt.CANCEL, streamId: h, reason: Q(r) }),
                        l.promise
                      );
                    },
                  },
                  E,
                );
              }
              destroy() {
                this.comObj.removeEventListener("message", this._onComObjOnMessage);
              }
            }
            (B = new WeakSet()),
              (Ii = function (A) {
                let b = A.streamId,
                  E = this.sourceName,
                  f = A.sourceName,
                  h = this.comObj,
                  m = this,
                  I = this.actionHandler[A.action],
                  y = {
                    enqueue(r, l = 1, s) {
                      if (this.isCancelled) return;
                      let a = this.desiredSize;
                      (this.desiredSize -= l),
                        a > 0 &&
                          this.desiredSize <= 0 &&
                          ((this.sinkCapability = new c.PromiseCapability()),
                          (this.ready = this.sinkCapability.promise)),
                        h.postMessage({ sourceName: E, targetName: f, stream: lt.ENQUEUE, streamId: b, chunk: r }, s);
                    },
                    close() {
                      this.isCancelled ||
                        ((this.isCancelled = !0),
                        h.postMessage({ sourceName: E, targetName: f, stream: lt.CLOSE, streamId: b }),
                        delete m.streamSinks[b]);
                    },
                    error(r) {
                      (0, c.assert)(r instanceof Error, "error must have a valid reason"),
                        !this.isCancelled &&
                          ((this.isCancelled = !0),
                          h.postMessage({ sourceName: E, targetName: f, stream: lt.ERROR, streamId: b, reason: Q(r) }));
                    },
                    sinkCapability: new c.PromiseCapability(),
                    onPull: null,
                    onCancel: null,
                    isCancelled: !1,
                    desiredSize: A.desiredSize,
                    ready: null,
                  };
                y.sinkCapability.resolve(),
                  (y.ready = y.sinkCapability.promise),
                  (this.streamSinks[b] = y),
                  new Promise(function (r) {
                    r(I(A.data, y));
                  }).then(
                    function () {
                      h.postMessage({
                        sourceName: E,
                        targetName: f,
                        stream: lt.START_COMPLETE,
                        streamId: b,
                        success: !0,
                      });
                    },
                    function (r) {
                      h.postMessage({
                        sourceName: E,
                        targetName: f,
                        stream: lt.START_COMPLETE,
                        streamId: b,
                        reason: Q(r),
                      });
                    },
                  );
              }),
              (Li = function (A) {
                let b = A.streamId,
                  E = this.sourceName,
                  f = A.sourceName,
                  h = this.comObj,
                  m = this.streamControllers[b],
                  I = this.streamSinks[b];
                switch (A.stream) {
                  case lt.START_COMPLETE:
                    A.success ? m.startCall.resolve() : m.startCall.reject(Q(A.reason));
                    break;
                  case lt.PULL_COMPLETE:
                    A.success ? m.pullCall.resolve() : m.pullCall.reject(Q(A.reason));
                    break;
                  case lt.PULL:
                    if (!I) {
                      h.postMessage({
                        sourceName: E,
                        targetName: f,
                        stream: lt.PULL_COMPLETE,
                        streamId: b,
                        success: !0,
                      });
                      break;
                    }
                    I.desiredSize <= 0 && A.desiredSize > 0 && I.sinkCapability.resolve(),
                      (I.desiredSize = A.desiredSize),
                      new Promise(function (y) {
                        var r;
                        y((r = I.onPull) == null ? void 0 : r.call(I));
                      }).then(
                        function () {
                          h.postMessage({
                            sourceName: E,
                            targetName: f,
                            stream: lt.PULL_COMPLETE,
                            streamId: b,
                            success: !0,
                          });
                        },
                        function (y) {
                          h.postMessage({
                            sourceName: E,
                            targetName: f,
                            stream: lt.PULL_COMPLETE,
                            streamId: b,
                            reason: Q(y),
                          });
                        },
                      );
                    break;
                  case lt.ENQUEUE:
                    if (((0, c.assert)(m, "enqueue should have stream controller"), m.isClosed)) break;
                    m.controller.enqueue(A.chunk);
                    break;
                  case lt.CLOSE:
                    if (((0, c.assert)(m, "close should have stream controller"), m.isClosed)) break;
                    (m.isClosed = !0), m.controller.close(), z(this, B, Pe).call(this, m, b);
                    break;
                  case lt.ERROR:
                    (0, c.assert)(m, "error should have stream controller"),
                      m.controller.error(Q(A.reason)),
                      z(this, B, Pe).call(this, m, b);
                    break;
                  case lt.CANCEL_COMPLETE:
                    A.success ? m.cancelCall.resolve() : m.cancelCall.reject(Q(A.reason)),
                      z(this, B, Pe).call(this, m, b);
                    break;
                  case lt.CANCEL:
                    if (!I) break;
                    new Promise(function (y) {
                      var r;
                      y((r = I.onCancel) == null ? void 0 : r.call(I, Q(A.reason)));
                    }).then(
                      function () {
                        h.postMessage({
                          sourceName: E,
                          targetName: f,
                          stream: lt.CANCEL_COMPLETE,
                          streamId: b,
                          success: !0,
                        });
                      },
                      function (y) {
                        h.postMessage({
                          sourceName: E,
                          targetName: f,
                          stream: lt.CANCEL_COMPLETE,
                          streamId: b,
                          reason: Q(y),
                        });
                      },
                    ),
                      I.sinkCapability.reject(Q(A.reason)),
                      (I.isCancelled = !0),
                      delete this.streamSinks[b];
                    break;
                  default:
                    throw new Error("Unexpected stream case");
                }
              }),
              (Pe = function (A, b) {
                return Yt(this, null, function* () {
                  var E, f, h;
                  yield Promise.allSettled([
                    (E = A.startCall) == null ? void 0 : E.promise,
                    (f = A.pullCall) == null ? void 0 : f.promise,
                    (h = A.cancelCall) == null ? void 0 : h.promise,
                  ]),
                    delete this.streamControllers[b];
                });
              }),
              (g.MessageHandler = gt);
          },
          (xt, g, ft) => {
            var lt, Q;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.Metadata = void 0);
            var c = ft(1);
            class M {
              constructor({ parsedData: B, rawData: R }) {
                J(this, lt);
                J(this, Q);
                et(this, lt, B), et(this, Q, R);
              }
              getRaw() {
                return t(this, Q);
              }
              get(B) {
                var R;
                return (R = t(this, lt).get(B)) != null ? R : null;
              }
              getAll() {
                return (0, c.objectFromMap)(t(this, lt));
              }
              has(B) {
                return t(this, lt).has(B);
              }
            }
            (lt = new WeakMap()), (Q = new WeakMap()), (g.Metadata = M);
          },
          (xt, g, ft) => {
            var B, R, p, N, O, A, si;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.OptionalContentConfig = void 0);
            var c = ft(1),
              M = ft(8);
            let lt = Symbol("INTERNAL");
            class Q {
              constructor(f, h) {
                J(this, B, !0);
                (this.name = f), (this.intent = h);
              }
              get visible() {
                return t(this, B);
              }
              _setVisible(f, h) {
                f !== lt && (0, c.unreachable)("Internal method `_setVisible` called."), et(this, B, h);
              }
            }
            B = new WeakMap();
            class gt {
              constructor(f) {
                J(this, A);
                J(this, R, null);
                J(this, p, new Map());
                J(this, N, null);
                J(this, O, null);
                if (((this.name = null), (this.creator = null), f !== null)) {
                  (this.name = f.name), (this.creator = f.creator), et(this, O, f.order);
                  for (let h of f.groups) t(this, p).set(h.id, new Q(h.name, h.intent));
                  if (f.baseState === "OFF") for (let h of t(this, p).values()) h._setVisible(lt, !1);
                  for (let h of f.on) t(this, p).get(h)._setVisible(lt, !0);
                  for (let h of f.off) t(this, p).get(h)._setVisible(lt, !1);
                  et(this, N, this.getHash());
                }
              }
              isVisible(f) {
                if (t(this, p).size === 0) return !0;
                if (!f) return (0, c.warn)("Optional content group not defined."), !0;
                if (f.type === "OCG")
                  return t(this, p).has(f.id)
                    ? t(this, p).get(f.id).visible
                    : ((0, c.warn)(`Optional content group not found: ${f.id}`), !0);
                if (f.type === "OCMD") {
                  if (f.expression) return z(this, A, si).call(this, f.expression);
                  if (!f.policy || f.policy === "AnyOn") {
                    for (let h of f.ids) {
                      if (!t(this, p).has(h)) return (0, c.warn)(`Optional content group not found: ${h}`), !0;
                      if (t(this, p).get(h).visible) return !0;
                    }
                    return !1;
                  } else if (f.policy === "AllOn") {
                    for (let h of f.ids) {
                      if (!t(this, p).has(h)) return (0, c.warn)(`Optional content group not found: ${h}`), !0;
                      if (!t(this, p).get(h).visible) return !1;
                    }
                    return !0;
                  } else if (f.policy === "AnyOff") {
                    for (let h of f.ids) {
                      if (!t(this, p).has(h)) return (0, c.warn)(`Optional content group not found: ${h}`), !0;
                      if (!t(this, p).get(h).visible) return !0;
                    }
                    return !1;
                  } else if (f.policy === "AllOff") {
                    for (let h of f.ids) {
                      if (!t(this, p).has(h)) return (0, c.warn)(`Optional content group not found: ${h}`), !0;
                      if (t(this, p).get(h).visible) return !1;
                    }
                    return !0;
                  }
                  return (0, c.warn)(`Unknown optional content policy ${f.policy}.`), !0;
                }
                return (0, c.warn)(`Unknown group type ${f.type}.`), !0;
              }
              setVisibility(f, h = !0) {
                if (!t(this, p).has(f)) {
                  (0, c.warn)(`Optional content group not found: ${f}`);
                  return;
                }
                t(this, p).get(f)._setVisible(lt, !!h), et(this, R, null);
              }
              get hasInitialVisibility() {
                return t(this, N) === null || this.getHash() === t(this, N);
              }
              getOrder() {
                return t(this, p).size ? (t(this, O) ? t(this, O).slice() : [...t(this, p).keys()]) : null;
              }
              getGroups() {
                return t(this, p).size > 0 ? (0, c.objectFromMap)(t(this, p)) : null;
              }
              getGroup(f) {
                return t(this, p).get(f) || null;
              }
              getHash() {
                if (t(this, R) !== null) return t(this, R);
                let f = new M.MurmurHash3_64();
                for (let [h, m] of t(this, p)) f.update(`${h}:${m.visible}`);
                return et(this, R, f.hexdigest());
              }
            }
            (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakSet()),
              (si = function (f) {
                let h = f.length;
                if (h < 2) return !0;
                let m = f[0];
                for (let I = 1; I < h; I++) {
                  let y = f[I],
                    r;
                  if (Array.isArray(y)) r = z(this, A, si).call(this, y);
                  else if (t(this, p).has(y)) r = t(this, p).get(y).visible;
                  else return (0, c.warn)(`Optional content group not found: ${y}`), !0;
                  switch (m) {
                    case "And":
                      if (!r) return !1;
                      break;
                    case "Or":
                      if (r) return !0;
                      break;
                    case "Not":
                      return !r;
                    default:
                      return !0;
                  }
                }
                return m === "And";
              }),
              (g.OptionalContentConfig = gt);
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.PDFDataTransportStream = void 0);
            var c = ft(1),
              M = ft(6);
            class lt {
              constructor(
                {
                  length: R,
                  initialData: p,
                  progressiveDone: N = !1,
                  contentDispositionFilename: O = null,
                  disableRange: A = !1,
                  disableStream: b = !1,
                },
                E,
              ) {
                if (
                  ((0, c.assert)(E, 'PDFDataTransportStream - missing required "pdfDataRangeTransport" argument.'),
                  (this._queuedChunks = []),
                  (this._progressiveDone = N),
                  (this._contentDispositionFilename = O),
                  (p == null ? void 0 : p.length) > 0)
                ) {
                  let f =
                    p instanceof Uint8Array && p.byteLength === p.buffer.byteLength
                      ? p.buffer
                      : new Uint8Array(p).buffer;
                  this._queuedChunks.push(f);
                }
                (this._pdfDataRangeTransport = E),
                  (this._isStreamingSupported = !b),
                  (this._isRangeSupported = !A),
                  (this._contentLength = R),
                  (this._fullRequestReader = null),
                  (this._rangeReaders = []),
                  this._pdfDataRangeTransport.addRangeListener((f, h) => {
                    this._onReceiveData({ begin: f, chunk: h });
                  }),
                  this._pdfDataRangeTransport.addProgressListener((f, h) => {
                    this._onProgress({ loaded: f, total: h });
                  }),
                  this._pdfDataRangeTransport.addProgressiveReadListener((f) => {
                    this._onReceiveData({ chunk: f });
                  }),
                  this._pdfDataRangeTransport.addProgressiveDoneListener(() => {
                    this._onProgressiveDone();
                  }),
                  this._pdfDataRangeTransport.transportReady();
              }
              _onReceiveData({ begin: R, chunk: p }) {
                let N =
                  p instanceof Uint8Array && p.byteLength === p.buffer.byteLength ? p.buffer : new Uint8Array(p).buffer;
                if (R === void 0)
                  this._fullRequestReader ? this._fullRequestReader._enqueue(N) : this._queuedChunks.push(N);
                else {
                  let O = this._rangeReaders.some(function (A) {
                    return A._begin !== R ? !1 : (A._enqueue(N), !0);
                  });
                  (0, c.assert)(O, "_onReceiveData - no `PDFDataTransportStreamRangeReader` instance found.");
                }
              }
              get _progressiveDataLength() {
                var R, p;
                return (p = (R = this._fullRequestReader) == null ? void 0 : R._loaded) != null ? p : 0;
              }
              _onProgress(R) {
                var p, N, O, A;
                R.total === void 0
                  ? (N = (p = this._rangeReaders[0]) == null ? void 0 : p.onProgress) == null ||
                    N.call(p, { loaded: R.loaded })
                  : (A = (O = this._fullRequestReader) == null ? void 0 : O.onProgress) == null ||
                    A.call(O, { loaded: R.loaded, total: R.total });
              }
              _onProgressiveDone() {
                var R;
                (R = this._fullRequestReader) == null || R.progressiveDone(), (this._progressiveDone = !0);
              }
              _removeRangeReader(R) {
                let p = this._rangeReaders.indexOf(R);
                p >= 0 && this._rangeReaders.splice(p, 1);
              }
              getFullReader() {
                (0, c.assert)(
                  !this._fullRequestReader,
                  "PDFDataTransportStream.getFullReader can only be called once.",
                );
                let R = this._queuedChunks;
                return (
                  (this._queuedChunks = null), new Q(this, R, this._progressiveDone, this._contentDispositionFilename)
                );
              }
              getRangeReader(R, p) {
                if (p <= this._progressiveDataLength) return null;
                let N = new gt(this, R, p);
                return this._pdfDataRangeTransport.requestDataRange(R, p), this._rangeReaders.push(N), N;
              }
              cancelAllRequests(R) {
                var p;
                (p = this._fullRequestReader) == null || p.cancel(R);
                for (let N of this._rangeReaders.slice(0)) N.cancel(R);
                this._pdfDataRangeTransport.abort();
              }
            }
            g.PDFDataTransportStream = lt;
            class Q {
              constructor(R, p, N = !1, O = null) {
                (this._stream = R),
                  (this._done = N || !1),
                  (this._filename = (0, M.isPdfFile)(O) ? O : null),
                  (this._queuedChunks = p || []),
                  (this._loaded = 0);
                for (let A of this._queuedChunks) this._loaded += A.byteLength;
                (this._requests = []),
                  (this._headersReady = Promise.resolve()),
                  (R._fullRequestReader = this),
                  (this.onProgress = null);
              }
              _enqueue(R) {
                this._done ||
                  (this._requests.length > 0
                    ? this._requests.shift().resolve({ value: R, done: !1 })
                    : this._queuedChunks.push(R),
                  (this._loaded += R.byteLength));
              }
              get headersReady() {
                return this._headersReady;
              }
              get filename() {
                return this._filename;
              }
              get isRangeSupported() {
                return this._stream._isRangeSupported;
              }
              get isStreamingSupported() {
                return this._stream._isStreamingSupported;
              }
              get contentLength() {
                return this._stream._contentLength;
              }
              read() {
                return Yt(this, null, function* () {
                  if (this._queuedChunks.length > 0) return { value: this._queuedChunks.shift(), done: !1 };
                  if (this._done) return { value: void 0, done: !0 };
                  let R = new c.PromiseCapability();
                  return this._requests.push(R), R.promise;
                });
              }
              cancel(R) {
                this._done = !0;
                for (let p of this._requests) p.resolve({ value: void 0, done: !0 });
                this._requests.length = 0;
              }
              progressiveDone() {
                this._done || (this._done = !0);
              }
            }
            class gt {
              constructor(R, p, N) {
                (this._stream = R),
                  (this._begin = p),
                  (this._end = N),
                  (this._queuedChunk = null),
                  (this._requests = []),
                  (this._done = !1),
                  (this.onProgress = null);
              }
              _enqueue(R) {
                if (!this._done) {
                  if (this._requests.length === 0) this._queuedChunk = R;
                  else {
                    this._requests.shift().resolve({ value: R, done: !1 });
                    for (let N of this._requests) N.resolve({ value: void 0, done: !0 });
                    this._requests.length = 0;
                  }
                  (this._done = !0), this._stream._removeRangeReader(this);
                }
              }
              get isStreamingSupported() {
                return !1;
              }
              read() {
                return Yt(this, null, function* () {
                  if (this._queuedChunk) {
                    let p = this._queuedChunk;
                    return (this._queuedChunk = null), { value: p, done: !1 };
                  }
                  if (this._done) return { value: void 0, done: !0 };
                  let R = new c.PromiseCapability();
                  return this._requests.push(R), R.promise;
                });
              }
              cancel(R) {
                this._done = !0;
                for (let p of this._requests) p.resolve({ value: void 0, done: !0 });
                (this._requests.length = 0), this._stream._removeRangeReader(this);
              }
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.PDFFetchStream = void 0);
            var c = ft(1),
              M = ft(20);
            function lt(N, O, A) {
              return {
                method: "GET",
                headers: N,
                signal: A.signal,
                mode: "cors",
                credentials: O ? "include" : "same-origin",
                redirect: "follow",
              };
            }
            function Q(N) {
              let O = new Headers();
              for (let A in N) {
                let b = N[A];
                b !== void 0 && O.append(A, b);
              }
              return O;
            }
            function gt(N) {
              return N instanceof Uint8Array
                ? N.buffer
                : N instanceof ArrayBuffer
                  ? N
                  : ((0, c.warn)(`getArrayBuffer - unexpected data format: ${N}`), new Uint8Array(N).buffer);
            }
            class B {
              constructor(O) {
                (this.source = O),
                  (this.isHttp = /^https?:/i.test(O.url)),
                  (this.httpHeaders = (this.isHttp && O.httpHeaders) || {}),
                  (this._fullRequestReader = null),
                  (this._rangeRequestReaders = []);
              }
              get _progressiveDataLength() {
                var O, A;
                return (A = (O = this._fullRequestReader) == null ? void 0 : O._loaded) != null ? A : 0;
              }
              getFullReader() {
                return (
                  (0, c.assert)(!this._fullRequestReader, "PDFFetchStream.getFullReader can only be called once."),
                  (this._fullRequestReader = new R(this)),
                  this._fullRequestReader
                );
              }
              getRangeReader(O, A) {
                if (A <= this._progressiveDataLength) return null;
                let b = new p(this, O, A);
                return this._rangeRequestReaders.push(b), b;
              }
              cancelAllRequests(O) {
                var A;
                (A = this._fullRequestReader) == null || A.cancel(O);
                for (let b of this._rangeRequestReaders.slice(0)) b.cancel(O);
              }
            }
            g.PDFFetchStream = B;
            class R {
              constructor(O) {
                (this._stream = O), (this._reader = null), (this._loaded = 0), (this._filename = null);
                let A = O.source;
                (this._withCredentials = A.withCredentials || !1),
                  (this._contentLength = A.length),
                  (this._headersCapability = new c.PromiseCapability()),
                  (this._disableRange = A.disableRange || !1),
                  (this._rangeChunkSize = A.rangeChunkSize),
                  !this._rangeChunkSize && !this._disableRange && (this._disableRange = !0),
                  (this._abortController = new AbortController()),
                  (this._isStreamingSupported = !A.disableStream),
                  (this._isRangeSupported = !A.disableRange),
                  (this._headers = Q(this._stream.httpHeaders));
                let b = A.url;
                fetch(b, lt(this._headers, this._withCredentials, this._abortController))
                  .then((E) => {
                    if (!(0, M.validateResponseStatus)(E.status)) throw (0, M.createResponseStatusError)(E.status, b);
                    (this._reader = E.body.getReader()), this._headersCapability.resolve();
                    let f = (I) => E.headers.get(I),
                      { allowRangeRequests: h, suggestedLength: m } = (0, M.validateRangeRequestCapabilities)({
                        getResponseHeader: f,
                        isHttp: this._stream.isHttp,
                        rangeChunkSize: this._rangeChunkSize,
                        disableRange: this._disableRange,
                      });
                    (this._isRangeSupported = h),
                      (this._contentLength = m || this._contentLength),
                      (this._filename = (0, M.extractFilenameFromHeader)(f)),
                      !this._isStreamingSupported &&
                        this._isRangeSupported &&
                        this.cancel(new c.AbortException("Streaming is disabled."));
                  })
                  .catch(this._headersCapability.reject),
                  (this.onProgress = null);
              }
              get headersReady() {
                return this._headersCapability.promise;
              }
              get filename() {
                return this._filename;
              }
              get contentLength() {
                return this._contentLength;
              }
              get isRangeSupported() {
                return this._isRangeSupported;
              }
              get isStreamingSupported() {
                return this._isStreamingSupported;
              }
              read() {
                return Yt(this, null, function* () {
                  var b;
                  yield this._headersCapability.promise;
                  let { value: O, done: A } = yield this._reader.read();
                  return A
                    ? { value: O, done: A }
                    : ((this._loaded += O.byteLength),
                      (b = this.onProgress) == null ||
                        b.call(this, { loaded: this._loaded, total: this._contentLength }),
                      { value: gt(O), done: !1 });
                });
              }
              cancel(O) {
                var A;
                (A = this._reader) == null || A.cancel(O), this._abortController.abort();
              }
            }
            class p {
              constructor(O, A, b) {
                (this._stream = O), (this._reader = null), (this._loaded = 0);
                let E = O.source;
                (this._withCredentials = E.withCredentials || !1),
                  (this._readCapability = new c.PromiseCapability()),
                  (this._isStreamingSupported = !E.disableStream),
                  (this._abortController = new AbortController()),
                  (this._headers = Q(this._stream.httpHeaders)),
                  this._headers.append("Range", `bytes=${A}-${b - 1}`);
                let f = E.url;
                fetch(f, lt(this._headers, this._withCredentials, this._abortController))
                  .then((h) => {
                    if (!(0, M.validateResponseStatus)(h.status)) throw (0, M.createResponseStatusError)(h.status, f);
                    this._readCapability.resolve(), (this._reader = h.body.getReader());
                  })
                  .catch(this._readCapability.reject),
                  (this.onProgress = null);
              }
              get isStreamingSupported() {
                return this._isStreamingSupported;
              }
              read() {
                return Yt(this, null, function* () {
                  var b;
                  yield this._readCapability.promise;
                  let { value: O, done: A } = yield this._reader.read();
                  return A
                    ? { value: O, done: A }
                    : ((this._loaded += O.byteLength),
                      (b = this.onProgress) == null || b.call(this, { loaded: this._loaded }),
                      { value: gt(O), done: !1 });
                });
              }
              cancel(O) {
                var A;
                (A = this._reader) == null || A.cancel(O), this._abortController.abort();
              }
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.createResponseStatusError = B),
              (g.extractFilenameFromHeader = gt),
              (g.validateRangeRequestCapabilities = Q),
              (g.validateResponseStatus = R);
            var c = ft(1),
              M = ft(21),
              lt = ft(6);
            function Q({ getResponseHeader: p, isHttp: N, rangeChunkSize: O, disableRange: A }) {
              let b = { allowRangeRequests: !1, suggestedLength: void 0 },
                E = parseInt(p("Content-Length"), 10);
              return (
                !Number.isInteger(E) ||
                  ((b.suggestedLength = E), E <= 2 * O) ||
                  A ||
                  !N ||
                  p("Accept-Ranges") !== "bytes" ||
                  (p("Content-Encoding") || "identity") !== "identity" ||
                  (b.allowRangeRequests = !0),
                b
              );
            }
            function gt(p) {
              let N = p("Content-Disposition");
              if (N) {
                let O = (0, M.getFilenameFromContentDispositionHeader)(N);
                if (O.includes("%"))
                  try {
                    O = decodeURIComponent(O);
                  } catch (A) {}
                if ((0, lt.isPdfFile)(O)) return O;
              }
              return null;
            }
            function B(p, N) {
              return p === 404 || (p === 0 && N.startsWith("file:"))
                ? new c.MissingPDFException('Missing PDF "' + N + '".')
                : new c.UnexpectedResponseException(
                    `Unexpected server response (${p}) while retrieving PDF "${N}".`,
                    p,
                  );
            }
            function R(p) {
              return p === 200 || p === 206;
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.getFilenameFromContentDispositionHeader = M);
            var c = ft(1);
            function M(lt) {
              let Q = !0,
                gt = B("filename\\*", "i").exec(lt);
              if (gt) {
                gt = gt[1];
                let E = O(gt);
                return (E = unescape(E)), (E = A(E)), (E = b(E)), p(E);
              }
              if (((gt = N(lt)), gt)) {
                let E = b(gt);
                return p(E);
              }
              if (((gt = B("filename", "i").exec(lt)), gt)) {
                gt = gt[1];
                let E = O(gt);
                return (E = b(E)), p(E);
              }
              function B(E, f) {
                return new RegExp("(?:^|;)\\s*" + E + '\\s*=\\s*([^";\\s][^;\\s]*|"(?:[^"\\\\]|\\\\"?)+"?)', f);
              }
              function R(E, f) {
                if (E) {
                  if (!/^[\x00-\xFF]+$/.test(f)) return f;
                  try {
                    let h = new TextDecoder(E, { fatal: !0 }),
                      m = (0, c.stringToBytes)(f);
                    (f = h.decode(m)), (Q = !1);
                  } catch (h) {}
                }
                return f;
              }
              function p(E) {
                return Q && /[\x80-\xff]/.test(E) && ((E = R("utf-8", E)), Q && (E = R("iso-8859-1", E))), E;
              }
              function N(E) {
                let f = [],
                  h,
                  m = B("filename\\*((?!0\\d)\\d+)(\\*?)", "ig");
                for (; (h = m.exec(E)) !== null; ) {
                  let [, y, r, l] = h;
                  if (((y = parseInt(y, 10)), y in f)) {
                    if (y === 0) break;
                    continue;
                  }
                  f[y] = [r, l];
                }
                let I = [];
                for (let y = 0; y < f.length && y in f; ++y) {
                  let [r, l] = f[y];
                  (l = O(l)), r && ((l = unescape(l)), y === 0 && (l = A(l))), I.push(l);
                }
                return I.join("");
              }
              function O(E) {
                if (E.startsWith('"')) {
                  let f = E.slice(1).split('\\"');
                  for (let h = 0; h < f.length; ++h) {
                    let m = f[h].indexOf('"');
                    m !== -1 && ((f[h] = f[h].slice(0, m)), (f.length = h + 1)),
                      (f[h] = f[h].replaceAll(/\\(.)/g, "$1"));
                  }
                  E = f.join('"');
                }
                return E;
              }
              function A(E) {
                let f = E.indexOf("'");
                if (f === -1) return E;
                let h = E.slice(0, f),
                  I = E.slice(f + 1).replace(/^[^']*'/, "");
                return R(h, I);
              }
              function b(E) {
                return !E.startsWith("=?") || /[\x00-\x19\x80-\xff]/.test(E)
                  ? E
                  : E.replaceAll(/=\?([\w-]*)\?([QqBb])\?((?:[^?]|\?(?!=))*)\?=/g, function (f, h, m, I) {
                      if (m === "q" || m === "Q")
                        return (
                          (I = I.replaceAll("_", " ")),
                          (I = I.replaceAll(/=([0-9a-fA-F]{2})/g, function (y, r) {
                            return String.fromCharCode(parseInt(r, 16));
                          })),
                          R(h, I)
                        );
                      try {
                        I = atob(I);
                      } catch (y) {}
                      return R(h, I);
                    });
              }
              return "";
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.PDFNetworkStream = void 0);
            var c = ft(1),
              M = ft(20);
            let lt = 200,
              Q = 206;
            function gt(O) {
              let A = O.response;
              return typeof A != "string" ? A : (0, c.stringToBytes)(A).buffer;
            }
            class B {
              constructor(A, b = {}) {
                (this.url = A),
                  (this.isHttp = /^https?:/i.test(A)),
                  (this.httpHeaders = (this.isHttp && b.httpHeaders) || Object.create(null)),
                  (this.withCredentials = b.withCredentials || !1),
                  (this.currXhrId = 0),
                  (this.pendingRequests = Object.create(null));
              }
              requestRange(A, b, E) {
                let f = { begin: A, end: b };
                for (let h in E) f[h] = E[h];
                return this.request(f);
              }
              requestFull(A) {
                return this.request(A);
              }
              request(A) {
                let b = new XMLHttpRequest(),
                  E = this.currXhrId++,
                  f = (this.pendingRequests[E] = { xhr: b });
                b.open("GET", this.url), (b.withCredentials = this.withCredentials);
                for (let h in this.httpHeaders) {
                  let m = this.httpHeaders[h];
                  m !== void 0 && b.setRequestHeader(h, m);
                }
                return (
                  this.isHttp && "begin" in A && "end" in A
                    ? (b.setRequestHeader("Range", `bytes=${A.begin}-${A.end - 1}`), (f.expectedStatus = Q))
                    : (f.expectedStatus = lt),
                  (b.responseType = "arraybuffer"),
                  A.onError &&
                    (b.onerror = function (h) {
                      A.onError(b.status);
                    }),
                  (b.onreadystatechange = this.onStateChange.bind(this, E)),
                  (b.onprogress = this.onProgress.bind(this, E)),
                  (f.onHeadersReceived = A.onHeadersReceived),
                  (f.onDone = A.onDone),
                  (f.onError = A.onError),
                  (f.onProgress = A.onProgress),
                  b.send(null),
                  E
                );
              }
              onProgress(A, b) {
                var f;
                let E = this.pendingRequests[A];
                E && ((f = E.onProgress) == null || f.call(E, b));
              }
              onStateChange(A, b) {
                var y, r, l;
                let E = this.pendingRequests[A];
                if (!E) return;
                let f = E.xhr;
                if (
                  (f.readyState >= 2 && E.onHeadersReceived && (E.onHeadersReceived(), delete E.onHeadersReceived),
                  f.readyState !== 4 || !(A in this.pendingRequests))
                )
                  return;
                if ((delete this.pendingRequests[A], f.status === 0 && this.isHttp)) {
                  (y = E.onError) == null || y.call(E, f.status);
                  return;
                }
                let h = f.status || lt;
                if (!(h === lt && E.expectedStatus === Q) && h !== E.expectedStatus) {
                  (r = E.onError) == null || r.call(E, f.status);
                  return;
                }
                let I = gt(f);
                if (h === Q) {
                  let s = f.getResponseHeader("Content-Range"),
                    a = /bytes (\d+)-(\d+)\/(\d+)/.exec(s);
                  E.onDone({ begin: parseInt(a[1], 10), chunk: I });
                } else I ? E.onDone({ begin: 0, chunk: I }) : (l = E.onError) == null || l.call(E, f.status);
              }
              getRequestXhr(A) {
                return this.pendingRequests[A].xhr;
              }
              isPendingRequest(A) {
                return A in this.pendingRequests;
              }
              abortRequest(A) {
                let b = this.pendingRequests[A].xhr;
                delete this.pendingRequests[A], b.abort();
              }
            }
            class R {
              constructor(A) {
                (this._source = A),
                  (this._manager = new B(A.url, { httpHeaders: A.httpHeaders, withCredentials: A.withCredentials })),
                  (this._rangeChunkSize = A.rangeChunkSize),
                  (this._fullRequestReader = null),
                  (this._rangeRequestReaders = []);
              }
              _onRangeRequestReaderClosed(A) {
                let b = this._rangeRequestReaders.indexOf(A);
                b >= 0 && this._rangeRequestReaders.splice(b, 1);
              }
              getFullReader() {
                return (
                  (0, c.assert)(!this._fullRequestReader, "PDFNetworkStream.getFullReader can only be called once."),
                  (this._fullRequestReader = new p(this._manager, this._source)),
                  this._fullRequestReader
                );
              }
              getRangeReader(A, b) {
                let E = new N(this._manager, A, b);
                return (E.onClosed = this._onRangeRequestReaderClosed.bind(this)), this._rangeRequestReaders.push(E), E;
              }
              cancelAllRequests(A) {
                var b;
                (b = this._fullRequestReader) == null || b.cancel(A);
                for (let E of this._rangeRequestReaders.slice(0)) E.cancel(A);
              }
            }
            g.PDFNetworkStream = R;
            class p {
              constructor(A, b) {
                this._manager = A;
                let E = {
                  onHeadersReceived: this._onHeadersReceived.bind(this),
                  onDone: this._onDone.bind(this),
                  onError: this._onError.bind(this),
                  onProgress: this._onProgress.bind(this),
                };
                (this._url = b.url),
                  (this._fullRequestId = A.requestFull(E)),
                  (this._headersReceivedCapability = new c.PromiseCapability()),
                  (this._disableRange = b.disableRange || !1),
                  (this._contentLength = b.length),
                  (this._rangeChunkSize = b.rangeChunkSize),
                  !this._rangeChunkSize && !this._disableRange && (this._disableRange = !0),
                  (this._isStreamingSupported = !1),
                  (this._isRangeSupported = !1),
                  (this._cachedChunks = []),
                  (this._requests = []),
                  (this._done = !1),
                  (this._storedError = void 0),
                  (this._filename = null),
                  (this.onProgress = null);
              }
              _onHeadersReceived() {
                let A = this._fullRequestId,
                  b = this._manager.getRequestXhr(A),
                  E = (m) => b.getResponseHeader(m),
                  { allowRangeRequests: f, suggestedLength: h } = (0, M.validateRangeRequestCapabilities)({
                    getResponseHeader: E,
                    isHttp: this._manager.isHttp,
                    rangeChunkSize: this._rangeChunkSize,
                    disableRange: this._disableRange,
                  });
                f && (this._isRangeSupported = !0),
                  (this._contentLength = h || this._contentLength),
                  (this._filename = (0, M.extractFilenameFromHeader)(E)),
                  this._isRangeSupported && this._manager.abortRequest(A),
                  this._headersReceivedCapability.resolve();
              }
              _onDone(A) {
                if (
                  (A &&
                    (this._requests.length > 0
                      ? this._requests.shift().resolve({ value: A.chunk, done: !1 })
                      : this._cachedChunks.push(A.chunk)),
                  (this._done = !0),
                  !(this._cachedChunks.length > 0))
                ) {
                  for (let b of this._requests) b.resolve({ value: void 0, done: !0 });
                  this._requests.length = 0;
                }
              }
              _onError(A) {
                (this._storedError = (0, M.createResponseStatusError)(A, this._url)),
                  this._headersReceivedCapability.reject(this._storedError);
                for (let b of this._requests) b.reject(this._storedError);
                (this._requests.length = 0), (this._cachedChunks.length = 0);
              }
              _onProgress(A) {
                var b;
                (b = this.onProgress) == null ||
                  b.call(this, { loaded: A.loaded, total: A.lengthComputable ? A.total : this._contentLength });
              }
              get filename() {
                return this._filename;
              }
              get isRangeSupported() {
                return this._isRangeSupported;
              }
              get isStreamingSupported() {
                return this._isStreamingSupported;
              }
              get contentLength() {
                return this._contentLength;
              }
              get headersReady() {
                return this._headersReceivedCapability.promise;
              }
              read() {
                return Yt(this, null, function* () {
                  if (this._storedError) throw this._storedError;
                  if (this._cachedChunks.length > 0) return { value: this._cachedChunks.shift(), done: !1 };
                  if (this._done) return { value: void 0, done: !0 };
                  let A = new c.PromiseCapability();
                  return this._requests.push(A), A.promise;
                });
              }
              cancel(A) {
                (this._done = !0), this._headersReceivedCapability.reject(A);
                for (let b of this._requests) b.resolve({ value: void 0, done: !0 });
                (this._requests.length = 0),
                  this._manager.isPendingRequest(this._fullRequestId) &&
                    this._manager.abortRequest(this._fullRequestId),
                  (this._fullRequestReader = null);
              }
            }
            class N {
              constructor(A, b, E) {
                this._manager = A;
                let f = {
                  onDone: this._onDone.bind(this),
                  onError: this._onError.bind(this),
                  onProgress: this._onProgress.bind(this),
                };
                (this._url = A.url),
                  (this._requestId = A.requestRange(b, E, f)),
                  (this._requests = []),
                  (this._queuedChunk = null),
                  (this._done = !1),
                  (this._storedError = void 0),
                  (this.onProgress = null),
                  (this.onClosed = null);
              }
              _close() {
                var A;
                (A = this.onClosed) == null || A.call(this, this);
              }
              _onDone(A) {
                let b = A.chunk;
                this._requests.length > 0
                  ? this._requests.shift().resolve({ value: b, done: !1 })
                  : (this._queuedChunk = b),
                  (this._done = !0);
                for (let E of this._requests) E.resolve({ value: void 0, done: !0 });
                (this._requests.length = 0), this._close();
              }
              _onError(A) {
                this._storedError = (0, M.createResponseStatusError)(A, this._url);
                for (let b of this._requests) b.reject(this._storedError);
                (this._requests.length = 0), (this._queuedChunk = null);
              }
              _onProgress(A) {
                var b;
                this.isStreamingSupported || (b = this.onProgress) == null || b.call(this, { loaded: A.loaded });
              }
              get isStreamingSupported() {
                return !1;
              }
              read() {
                return Yt(this, null, function* () {
                  if (this._storedError) throw this._storedError;
                  if (this._queuedChunk !== null) {
                    let b = this._queuedChunk;
                    return (this._queuedChunk = null), { value: b, done: !1 };
                  }
                  if (this._done) return { value: void 0, done: !0 };
                  let A = new c.PromiseCapability();
                  return this._requests.push(A), A.promise;
                });
              }
              cancel(A) {
                this._done = !0;
                for (let b of this._requests) b.resolve({ value: void 0, done: !0 });
                (this._requests.length = 0),
                  this._manager.isPendingRequest(this._requestId) && this._manager.abortRequest(this._requestId),
                  this._close();
              }
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.PDFNodeStream = void 0);
            var c = ft(1),
              M = ft(20);
            let lt = /^file:\/\/\/[a-zA-Z]:\//;
            function Q(E) {
              let f = Ei(),
                h = f.parse(E);
              return h.protocol === "file:" || h.host
                ? h
                : /^[a-z]:[/\\]/i.test(E)
                  ? f.parse(`file:///${E}`)
                  : (h.host || (h.protocol = "file:"), h);
            }
            class gt {
              constructor(f) {
                (this.source = f),
                  (this.url = Q(f.url)),
                  (this.isHttp = this.url.protocol === "http:" || this.url.protocol === "https:"),
                  (this.isFsUrl = this.url.protocol === "file:"),
                  (this.httpHeaders = (this.isHttp && f.httpHeaders) || {}),
                  (this._fullRequestReader = null),
                  (this._rangeRequestReaders = []);
              }
              get _progressiveDataLength() {
                var f, h;
                return (h = (f = this._fullRequestReader) == null ? void 0 : f._loaded) != null ? h : 0;
              }
              getFullReader() {
                return (
                  (0, c.assert)(!this._fullRequestReader, "PDFNodeStream.getFullReader can only be called once."),
                  (this._fullRequestReader = this.isFsUrl ? new A(this) : new N(this)),
                  this._fullRequestReader
                );
              }
              getRangeReader(f, h) {
                if (h <= this._progressiveDataLength) return null;
                let m = this.isFsUrl ? new b(this, f, h) : new O(this, f, h);
                return this._rangeRequestReaders.push(m), m;
              }
              cancelAllRequests(f) {
                var h;
                (h = this._fullRequestReader) == null || h.cancel(f);
                for (let m of this._rangeRequestReaders.slice(0)) m.cancel(f);
              }
            }
            g.PDFNodeStream = gt;
            class B {
              constructor(f) {
                (this._url = f.url), (this._done = !1), (this._storedError = null), (this.onProgress = null);
                let h = f.source;
                (this._contentLength = h.length),
                  (this._loaded = 0),
                  (this._filename = null),
                  (this._disableRange = h.disableRange || !1),
                  (this._rangeChunkSize = h.rangeChunkSize),
                  !this._rangeChunkSize && !this._disableRange && (this._disableRange = !0),
                  (this._isStreamingSupported = !h.disableStream),
                  (this._isRangeSupported = !h.disableRange),
                  (this._readableStream = null),
                  (this._readCapability = new c.PromiseCapability()),
                  (this._headersCapability = new c.PromiseCapability());
              }
              get headersReady() {
                return this._headersCapability.promise;
              }
              get filename() {
                return this._filename;
              }
              get contentLength() {
                return this._contentLength;
              }
              get isRangeSupported() {
                return this._isRangeSupported;
              }
              get isStreamingSupported() {
                return this._isStreamingSupported;
              }
              read() {
                return Yt(this, null, function* () {
                  var m;
                  if ((yield this._readCapability.promise, this._done)) return { value: void 0, done: !0 };
                  if (this._storedError) throw this._storedError;
                  let f = this._readableStream.read();
                  return f === null
                    ? ((this._readCapability = new c.PromiseCapability()), this.read())
                    : ((this._loaded += f.length),
                      (m = this.onProgress) == null ||
                        m.call(this, { loaded: this._loaded, total: this._contentLength }),
                      { value: new Uint8Array(f).buffer, done: !1 });
                });
              }
              cancel(f) {
                if (!this._readableStream) {
                  this._error(f);
                  return;
                }
                this._readableStream.destroy(f);
              }
              _error(f) {
                (this._storedError = f), this._readCapability.resolve();
              }
              _setReadableStream(f) {
                (this._readableStream = f),
                  f.on("readable", () => {
                    this._readCapability.resolve();
                  }),
                  f.on("end", () => {
                    f.destroy(), (this._done = !0), this._readCapability.resolve();
                  }),
                  f.on("error", (h) => {
                    this._error(h);
                  }),
                  !this._isStreamingSupported &&
                    this._isRangeSupported &&
                    this._error(new c.AbortException("streaming is disabled")),
                  this._storedError && this._readableStream.destroy(this._storedError);
              }
            }
            class R {
              constructor(f) {
                (this._url = f.url),
                  (this._done = !1),
                  (this._storedError = null),
                  (this.onProgress = null),
                  (this._loaded = 0),
                  (this._readableStream = null),
                  (this._readCapability = new c.PromiseCapability());
                let h = f.source;
                this._isStreamingSupported = !h.disableStream;
              }
              get isStreamingSupported() {
                return this._isStreamingSupported;
              }
              read() {
                return Yt(this, null, function* () {
                  var m;
                  if ((yield this._readCapability.promise, this._done)) return { value: void 0, done: !0 };
                  if (this._storedError) throw this._storedError;
                  let f = this._readableStream.read();
                  return f === null
                    ? ((this._readCapability = new c.PromiseCapability()), this.read())
                    : ((this._loaded += f.length),
                      (m = this.onProgress) == null || m.call(this, { loaded: this._loaded }),
                      { value: new Uint8Array(f).buffer, done: !1 });
                });
              }
              cancel(f) {
                if (!this._readableStream) {
                  this._error(f);
                  return;
                }
                this._readableStream.destroy(f);
              }
              _error(f) {
                (this._storedError = f), this._readCapability.resolve();
              }
              _setReadableStream(f) {
                (this._readableStream = f),
                  f.on("readable", () => {
                    this._readCapability.resolve();
                  }),
                  f.on("end", () => {
                    f.destroy(), (this._done = !0), this._readCapability.resolve();
                  }),
                  f.on("error", (h) => {
                    this._error(h);
                  }),
                  this._storedError && this._readableStream.destroy(this._storedError);
              }
            }
            function p(E, f) {
              return {
                protocol: E.protocol,
                auth: E.auth,
                host: E.hostname,
                port: E.port,
                path: E.path,
                method: "GET",
                headers: f,
              };
            }
            class N extends B {
              constructor(f) {
                super(f);
                let h = (m) => {
                  if (m.statusCode === 404) {
                    let l = new c.MissingPDFException(`Missing PDF "${this._url}".`);
                    (this._storedError = l), this._headersCapability.reject(l);
                    return;
                  }
                  this._headersCapability.resolve(), this._setReadableStream(m);
                  let I = (l) => this._readableStream.headers[l.toLowerCase()],
                    { allowRangeRequests: y, suggestedLength: r } = (0, M.validateRangeRequestCapabilities)({
                      getResponseHeader: I,
                      isHttp: f.isHttp,
                      rangeChunkSize: this._rangeChunkSize,
                      disableRange: this._disableRange,
                    });
                  (this._isRangeSupported = y),
                    (this._contentLength = r || this._contentLength),
                    (this._filename = (0, M.extractFilenameFromHeader)(I));
                };
                if (((this._request = null), this._url.protocol === "http:")) {
                  let m = Ue();
                  this._request = m.request(p(this._url, f.httpHeaders), h);
                } else {
                  let m = je();
                  this._request = m.request(p(this._url, f.httpHeaders), h);
                }
                this._request.on("error", (m) => {
                  (this._storedError = m), this._headersCapability.reject(m);
                }),
                  this._request.end();
              }
            }
            class O extends R {
              constructor(f, h, m) {
                super(f), (this._httpHeaders = {});
                for (let y in f.httpHeaders) {
                  let r = f.httpHeaders[y];
                  r !== void 0 && (this._httpHeaders[y] = r);
                }
                this._httpHeaders.Range = `bytes=${h}-${m - 1}`;
                let I = (y) => {
                  if (y.statusCode === 404) {
                    let r = new c.MissingPDFException(`Missing PDF "${this._url}".`);
                    this._storedError = r;
                    return;
                  }
                  this._setReadableStream(y);
                };
                if (((this._request = null), this._url.protocol === "http:")) {
                  let y = Ue();
                  this._request = y.request(p(this._url, this._httpHeaders), I);
                } else {
                  let y = je();
                  this._request = y.request(p(this._url, this._httpHeaders), I);
                }
                this._request.on("error", (y) => {
                  this._storedError = y;
                }),
                  this._request.end();
              }
            }
            class A extends B {
              constructor(f) {
                super(f);
                let h = decodeURIComponent(this._url.path);
                lt.test(this._url.href) && (h = h.replace(/^\//, ""));
                let m = Se();
                m.lstat(h, (I, y) => {
                  if (I) {
                    I.code === "ENOENT" && (I = new c.MissingPDFException(`Missing PDF "${h}".`)),
                      (this._storedError = I),
                      this._headersCapability.reject(I);
                    return;
                  }
                  (this._contentLength = y.size),
                    this._setReadableStream(m.createReadStream(h)),
                    this._headersCapability.resolve();
                });
              }
            }
            class b extends R {
              constructor(f, h, m) {
                super(f);
                let I = decodeURIComponent(this._url.path);
                lt.test(this._url.href) && (I = I.replace(/^\//, ""));
                let y = Se();
                this._setReadableStream(y.createReadStream(I, { start: h, end: m - 1 }));
              }
            }
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.SVGGraphics = void 0);
            var c = ft(6),
              M = ft(1);
            let lt = { fontStyle: "normal", fontWeight: "normal", fillColor: "#000000" },
              Q = "http://www.w3.org/XML/1998/namespace",
              gt = "http://www.w3.org/1999/xlink",
              B = ["butt", "round", "square"],
              R = ["miter", "round", "bevel"],
              p = function (y, r = "", l = !1) {
                if (URL.createObjectURL && typeof Blob != "undefined" && !l)
                  return URL.createObjectURL(new Blob([y], { type: r }));
                let s = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
                  a = `data:${r};base64,`;
                for (let o = 0, L = y.length; o < L; o += 3) {
                  let n = y[o] & 255,
                    _ = y[o + 1] & 255,
                    k = y[o + 2] & 255,
                    it = n >> 2,
                    H = ((n & 3) << 4) | (_ >> 4),
                    q = o + 1 < L ? ((_ & 15) << 2) | (k >> 6) : 64,
                    j = o + 2 < L ? k & 63 : 64;
                  a += s[it] + s[H] + s[q] + s[j];
                }
                return a;
              },
              N = (function () {
                let y = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
                  r = 12,
                  l = new Int32Array(256);
                for (let k = 0; k < 256; k++) {
                  let it = k;
                  for (let H = 0; H < 8; H++)
                    it = it & 1 ? 3988292384 ^ ((it >> 1) & 2147483647) : (it >> 1) & 2147483647;
                  l[k] = it;
                }
                function s(k, it, H) {
                  let q = -1;
                  for (let j = it; j < H; j++) {
                    let rt = (q ^ k[j]) & 255,
                      C = l[rt];
                    q = (q >>> 8) ^ C;
                  }
                  return q ^ -1;
                }
                function a(k, it, H, q) {
                  let j = q,
                    rt = it.length;
                  (H[j] = (rt >> 24) & 255),
                    (H[j + 1] = (rt >> 16) & 255),
                    (H[j + 2] = (rt >> 8) & 255),
                    (H[j + 3] = rt & 255),
                    (j += 4),
                    (H[j] = k.charCodeAt(0) & 255),
                    (H[j + 1] = k.charCodeAt(1) & 255),
                    (H[j + 2] = k.charCodeAt(2) & 255),
                    (H[j + 3] = k.charCodeAt(3) & 255),
                    (j += 4),
                    H.set(it, j),
                    (j += it.length);
                  let C = s(H, q + 4, j);
                  (H[j] = (C >> 24) & 255),
                    (H[j + 1] = (C >> 16) & 255),
                    (H[j + 2] = (C >> 8) & 255),
                    (H[j + 3] = C & 255);
                }
                function o(k, it, H) {
                  let q = 1,
                    j = 0;
                  for (let rt = it; rt < H; ++rt) (q = (q + (k[rt] & 255)) % 65521), (j = (j + q) % 65521);
                  return (j << 16) | q;
                }
                function L(k) {
                  if (!M.isNodeJS) return n(k);
                  try {
                    let it = parseInt(process.versions.node) >= 8 ? k : Buffer.from(k),
                      H = wi().deflateSync(it, { level: 9 });
                    return H instanceof Uint8Array ? H : new Uint8Array(H);
                  } catch (it) {
                    (0, M.warn)("Not compressing PNG because zlib.deflateSync is unavailable: " + it);
                  }
                  return n(k);
                }
                function n(k) {
                  let it = k.length,
                    H = 65535,
                    q = Math.ceil(it / H),
                    j = new Uint8Array(2 + it + q * 5 + 4),
                    rt = 0;
                  (j[rt++] = 120), (j[rt++] = 156);
                  let C = 0;
                  for (; it > H; )
                    (j[rt++] = 0),
                      (j[rt++] = 255),
                      (j[rt++] = 255),
                      (j[rt++] = 0),
                      (j[rt++] = 0),
                      j.set(k.subarray(C, C + H), rt),
                      (rt += H),
                      (C += H),
                      (it -= H);
                  (j[rt++] = 1),
                    (j[rt++] = it & 255),
                    (j[rt++] = (it >> 8) & 255),
                    (j[rt++] = ~it & 65535 & 255),
                    (j[rt++] = ((~it & 65535) >> 8) & 255),
                    j.set(k.subarray(C), rt),
                    (rt += k.length - C);
                  let U = o(k, 0, k.length);
                  return (
                    (j[rt++] = (U >> 24) & 255),
                    (j[rt++] = (U >> 16) & 255),
                    (j[rt++] = (U >> 8) & 255),
                    (j[rt++] = U & 255),
                    j
                  );
                }
                function _(k, it, H, q) {
                  let j = k.width,
                    rt = k.height,
                    C,
                    U,
                    $,
                    S = k.data;
                  switch (it) {
                    case M.ImageKind.GRAYSCALE_1BPP:
                      (U = 0), (C = 1), ($ = (j + 7) >> 3);
                      break;
                    case M.ImageKind.RGB_24BPP:
                      (U = 2), (C = 8), ($ = j * 3);
                      break;
                    case M.ImageKind.RGBA_32BPP:
                      (U = 6), (C = 8), ($ = j * 4);
                      break;
                    default:
                      throw new Error("invalid format");
                  }
                  let e = new Uint8Array((1 + $) * rt),
                    i = 0,
                    d = 0;
                  for (let ct = 0; ct < rt; ++ct) (e[i++] = 0), e.set(S.subarray(d, d + $), i), (d += $), (i += $);
                  if (it === M.ImageKind.GRAYSCALE_1BPP && q) {
                    i = 0;
                    for (let ct = 0; ct < rt; ct++) {
                      i++;
                      for (let ht = 0; ht < $; ht++) e[i++] ^= 255;
                    }
                  }
                  let T = new Uint8Array([
                      (j >> 24) & 255,
                      (j >> 16) & 255,
                      (j >> 8) & 255,
                      j & 255,
                      (rt >> 24) & 255,
                      (rt >> 16) & 255,
                      (rt >> 8) & 255,
                      rt & 255,
                      C,
                      U,
                      0,
                      0,
                      0,
                    ]),
                    x = L(e),
                    P = y.length + r * 3 + T.length + x.length,
                    G = new Uint8Array(P),
                    st = 0;
                  return (
                    G.set(y, st),
                    (st += y.length),
                    a("IHDR", T, G, st),
                    (st += r + T.length),
                    a("IDATA", x, G, st),
                    (st += r + x.length),
                    a("IEND", new Uint8Array(0), G, st),
                    p(G, "image/png", H)
                  );
                }
                return function (it, H, q) {
                  let j = it.kind === void 0 ? M.ImageKind.GRAYSCALE_1BPP : it.kind;
                  return _(it, j, H, q);
                };
              })();
            class O {
              constructor() {
                (this.fontSizeScale = 1),
                  (this.fontWeight = lt.fontWeight),
                  (this.fontSize = 0),
                  (this.textMatrix = M.IDENTITY_MATRIX),
                  (this.fontMatrix = M.FONT_IDENTITY_MATRIX),
                  (this.leading = 0),
                  (this.textRenderingMode = M.TextRenderingMode.FILL),
                  (this.textMatrixScale = 1),
                  (this.x = 0),
                  (this.y = 0),
                  (this.lineX = 0),
                  (this.lineY = 0),
                  (this.charSpacing = 0),
                  (this.wordSpacing = 0),
                  (this.textHScale = 1),
                  (this.textRise = 0),
                  (this.fillColor = lt.fillColor),
                  (this.strokeColor = "#000000"),
                  (this.fillAlpha = 1),
                  (this.strokeAlpha = 1),
                  (this.lineWidth = 1),
                  (this.lineJoin = ""),
                  (this.lineCap = ""),
                  (this.miterLimit = 0),
                  (this.dashArray = []),
                  (this.dashPhase = 0),
                  (this.dependencies = []),
                  (this.activeClipUrl = null),
                  (this.clipGroup = null),
                  (this.maskId = "");
              }
              clone() {
                return Object.create(this);
              }
              setCurrentPoint(r, l) {
                (this.x = r), (this.y = l);
              }
            }
            function A(y) {
              let r = [],
                l = [];
              for (let s of y) {
                if (s.fn === "save") {
                  r.push({ fnId: 92, fn: "group", items: [] }), l.push(r), (r = r.at(-1).items);
                  continue;
                }
                s.fn === "restore" ? (r = l.pop()) : r.push(s);
              }
              return r;
            }
            function b(y) {
              if (Number.isInteger(y)) return y.toString();
              let r = y.toFixed(10),
                l = r.length - 1;
              if (r[l] !== "0") return r;
              do l--;
              while (r[l] === "0");
              return r.substring(0, r[l] === "." ? l : l + 1);
            }
            function E(y) {
              if (y[4] === 0 && y[5] === 0) {
                if (y[1] === 0 && y[2] === 0) return y[0] === 1 && y[3] === 1 ? "" : `scale(${b(y[0])} ${b(y[3])})`;
                if (y[0] === y[3] && y[1] === -y[2]) {
                  let r = (Math.acos(y[0]) * 180) / Math.PI;
                  return `rotate(${b(r)})`;
                }
              } else if (y[0] === 1 && y[1] === 0 && y[2] === 0 && y[3] === 1)
                return `translate(${b(y[4])} ${b(y[5])})`;
              return `matrix(${b(y[0])} ${b(y[1])} ${b(y[2])} ${b(y[3])} ${b(y[4])} ${b(y[5])})`;
            }
            let f = 0,
              h = 0,
              m = 0;
            class I {
              constructor(r, l, s = !1) {
                (0, c.deprecated)("The SVG back-end is no longer maintained and *may* be removed in the future."),
                  (this.svgFactory = new c.DOMSVGFactory()),
                  (this.current = new O()),
                  (this.transformMatrix = M.IDENTITY_MATRIX),
                  (this.transformStack = []),
                  (this.extraStack = []),
                  (this.commonObjs = r),
                  (this.objs = l),
                  (this.pendingClip = null),
                  (this.pendingEOFill = !1),
                  (this.embedFonts = !1),
                  (this.embeddedFonts = Object.create(null)),
                  (this.cssStyle = null),
                  (this.forceDataSchema = !!s),
                  (this._operatorIdMapping = []);
                for (let a in M.OPS) this._operatorIdMapping[M.OPS[a]] = a;
              }
              getObject(r, l = null) {
                return typeof r == "string" ? (r.startsWith("g_") ? this.commonObjs.get(r) : this.objs.get(r)) : l;
              }
              save() {
                this.transformStack.push(this.transformMatrix);
                let r = this.current;
                this.extraStack.push(r), (this.current = r.clone());
              }
              restore() {
                (this.transformMatrix = this.transformStack.pop()),
                  (this.current = this.extraStack.pop()),
                  (this.pendingClip = null),
                  (this.tgrp = null);
              }
              group(r) {
                this.save(), this.executeOpTree(r), this.restore();
              }
              loadDependencies(r) {
                let l = r.fnArray,
                  s = r.argsArray;
                for (let a = 0, o = l.length; a < o; a++)
                  if (l[a] === M.OPS.dependency)
                    for (let L of s[a]) {
                      let n = L.startsWith("g_") ? this.commonObjs : this.objs,
                        _ = new Promise((k) => {
                          n.get(L, k);
                        });
                      this.current.dependencies.push(_);
                    }
                return Promise.all(this.current.dependencies);
              }
              transform(r, l, s, a, o, L) {
                let n = [r, l, s, a, o, L];
                (this.transformMatrix = M.Util.transform(this.transformMatrix, n)), (this.tgrp = null);
              }
              getSVG(r, l) {
                this.viewport = l;
                let s = this._initialize(l);
                return this.loadDependencies(r).then(
                  () => ((this.transformMatrix = M.IDENTITY_MATRIX), this.executeOpTree(this.convertOpList(r)), s),
                );
              }
              convertOpList(r) {
                let l = this._operatorIdMapping,
                  s = r.argsArray,
                  a = r.fnArray,
                  o = [];
                for (let L = 0, n = a.length; L < n; L++) {
                  let _ = a[L];
                  o.push({ fnId: _, fn: l[_], args: s[L] });
                }
                return A(o);
              }
              executeOpTree(r) {
                for (let l of r) {
                  let s = l.fn,
                    a = l.fnId,
                    o = l.args;
                  switch (a | 0) {
                    case M.OPS.beginText:
                      this.beginText();
                      break;
                    case M.OPS.dependency:
                      break;
                    case M.OPS.setLeading:
                      this.setLeading(o);
                      break;
                    case M.OPS.setLeadingMoveText:
                      this.setLeadingMoveText(o[0], o[1]);
                      break;
                    case M.OPS.setFont:
                      this.setFont(o);
                      break;
                    case M.OPS.showText:
                      this.showText(o[0]);
                      break;
                    case M.OPS.showSpacedText:
                      this.showText(o[0]);
                      break;
                    case M.OPS.endText:
                      this.endText();
                      break;
                    case M.OPS.moveText:
                      this.moveText(o[0], o[1]);
                      break;
                    case M.OPS.setCharSpacing:
                      this.setCharSpacing(o[0]);
                      break;
                    case M.OPS.setWordSpacing:
                      this.setWordSpacing(o[0]);
                      break;
                    case M.OPS.setHScale:
                      this.setHScale(o[0]);
                      break;
                    case M.OPS.setTextMatrix:
                      this.setTextMatrix(o[0], o[1], o[2], o[3], o[4], o[5]);
                      break;
                    case M.OPS.setTextRise:
                      this.setTextRise(o[0]);
                      break;
                    case M.OPS.setTextRenderingMode:
                      this.setTextRenderingMode(o[0]);
                      break;
                    case M.OPS.setLineWidth:
                      this.setLineWidth(o[0]);
                      break;
                    case M.OPS.setLineJoin:
                      this.setLineJoin(o[0]);
                      break;
                    case M.OPS.setLineCap:
                      this.setLineCap(o[0]);
                      break;
                    case M.OPS.setMiterLimit:
                      this.setMiterLimit(o[0]);
                      break;
                    case M.OPS.setFillRGBColor:
                      this.setFillRGBColor(o[0], o[1], o[2]);
                      break;
                    case M.OPS.setStrokeRGBColor:
                      this.setStrokeRGBColor(o[0], o[1], o[2]);
                      break;
                    case M.OPS.setStrokeColorN:
                      this.setStrokeColorN(o);
                      break;
                    case M.OPS.setFillColorN:
                      this.setFillColorN(o);
                      break;
                    case M.OPS.shadingFill:
                      this.shadingFill(o[0]);
                      break;
                    case M.OPS.setDash:
                      this.setDash(o[0], o[1]);
                      break;
                    case M.OPS.setRenderingIntent:
                      this.setRenderingIntent(o[0]);
                      break;
                    case M.OPS.setFlatness:
                      this.setFlatness(o[0]);
                      break;
                    case M.OPS.setGState:
                      this.setGState(o[0]);
                      break;
                    case M.OPS.fill:
                      this.fill();
                      break;
                    case M.OPS.eoFill:
                      this.eoFill();
                      break;
                    case M.OPS.stroke:
                      this.stroke();
                      break;
                    case M.OPS.fillStroke:
                      this.fillStroke();
                      break;
                    case M.OPS.eoFillStroke:
                      this.eoFillStroke();
                      break;
                    case M.OPS.clip:
                      this.clip("nonzero");
                      break;
                    case M.OPS.eoClip:
                      this.clip("evenodd");
                      break;
                    case M.OPS.paintSolidColorImageMask:
                      this.paintSolidColorImageMask();
                      break;
                    case M.OPS.paintImageXObject:
                      this.paintImageXObject(o[0]);
                      break;
                    case M.OPS.paintInlineImageXObject:
                      this.paintInlineImageXObject(o[0]);
                      break;
                    case M.OPS.paintImageMaskXObject:
                      this.paintImageMaskXObject(o[0]);
                      break;
                    case M.OPS.paintFormXObjectBegin:
                      this.paintFormXObjectBegin(o[0], o[1]);
                      break;
                    case M.OPS.paintFormXObjectEnd:
                      this.paintFormXObjectEnd();
                      break;
                    case M.OPS.closePath:
                      this.closePath();
                      break;
                    case M.OPS.closeStroke:
                      this.closeStroke();
                      break;
                    case M.OPS.closeFillStroke:
                      this.closeFillStroke();
                      break;
                    case M.OPS.closeEOFillStroke:
                      this.closeEOFillStroke();
                      break;
                    case M.OPS.nextLine:
                      this.nextLine();
                      break;
                    case M.OPS.transform:
                      this.transform(o[0], o[1], o[2], o[3], o[4], o[5]);
                      break;
                    case M.OPS.constructPath:
                      this.constructPath(o[0], o[1]);
                      break;
                    case M.OPS.endPath:
                      this.endPath();
                      break;
                    case 92:
                      this.group(l.items);
                      break;
                    default:
                      (0, M.warn)(`Unimplemented operator ${s}`);
                      break;
                  }
                }
              }
              setWordSpacing(r) {
                this.current.wordSpacing = r;
              }
              setCharSpacing(r) {
                this.current.charSpacing = r;
              }
              nextLine() {
                this.moveText(0, this.current.leading);
              }
              setTextMatrix(r, l, s, a, o, L) {
                let n = this.current;
                (n.textMatrix = n.lineMatrix = [r, l, s, a, o, L]),
                  (n.textMatrixScale = Math.hypot(r, l)),
                  (n.x = n.lineX = 0),
                  (n.y = n.lineY = 0),
                  (n.xcoords = []),
                  (n.ycoords = []),
                  (n.tspan = this.svgFactory.createElement("svg:tspan")),
                  n.tspan.setAttributeNS(null, "font-family", n.fontFamily),
                  n.tspan.setAttributeNS(null, "font-size", `${b(n.fontSize)}px`),
                  n.tspan.setAttributeNS(null, "y", b(-n.y)),
                  (n.txtElement = this.svgFactory.createElement("svg:text")),
                  n.txtElement.append(n.tspan);
              }
              beginText() {
                let r = this.current;
                (r.x = r.lineX = 0),
                  (r.y = r.lineY = 0),
                  (r.textMatrix = M.IDENTITY_MATRIX),
                  (r.lineMatrix = M.IDENTITY_MATRIX),
                  (r.textMatrixScale = 1),
                  (r.tspan = this.svgFactory.createElement("svg:tspan")),
                  (r.txtElement = this.svgFactory.createElement("svg:text")),
                  (r.txtgrp = this.svgFactory.createElement("svg:g")),
                  (r.xcoords = []),
                  (r.ycoords = []);
              }
              moveText(r, l) {
                let s = this.current;
                (s.x = s.lineX += r),
                  (s.y = s.lineY += l),
                  (s.xcoords = []),
                  (s.ycoords = []),
                  (s.tspan = this.svgFactory.createElement("svg:tspan")),
                  s.tspan.setAttributeNS(null, "font-family", s.fontFamily),
                  s.tspan.setAttributeNS(null, "font-size", `${b(s.fontSize)}px`),
                  s.tspan.setAttributeNS(null, "y", b(-s.y));
              }
              showText(r) {
                let l = this.current,
                  s = l.font,
                  a = l.fontSize;
                if (a === 0) return;
                let o = l.fontSizeScale,
                  L = l.charSpacing,
                  n = l.wordSpacing,
                  _ = l.fontDirection,
                  k = l.textHScale * _,
                  it = s.vertical,
                  H = it ? 1 : -1,
                  q = s.defaultVMetrics,
                  j = a * l.fontMatrix[0],
                  rt = 0;
                for (let $ of r) {
                  if ($ === null) {
                    rt += _ * n;
                    continue;
                  } else if (typeof $ == "number") {
                    rt += (H * $ * a) / 1e3;
                    continue;
                  }
                  let S = ($.isSpace ? n : 0) + L,
                    e = $.fontChar,
                    i,
                    d,
                    T = $.width;
                  if (it) {
                    let P,
                      G = $.vmetric || q;
                    (P = $.vmetric ? G[1] : T * 0.5), (P = -P * j);
                    let st = G[2] * j;
                    (T = G ? -G[0] : T), (i = P / o), (d = (rt + st) / o);
                  } else (i = rt / o), (d = 0);
                  ($.isInFont || s.missingFile) &&
                    (l.xcoords.push(l.x + i), it && l.ycoords.push(-l.y + d), (l.tspan.textContent += e));
                  let x = it ? T * j - S * _ : T * j + S * _;
                  rt += x;
                }
                l.tspan.setAttributeNS(null, "x", l.xcoords.map(b).join(" ")),
                  it
                    ? l.tspan.setAttributeNS(null, "y", l.ycoords.map(b).join(" "))
                    : l.tspan.setAttributeNS(null, "y", b(-l.y)),
                  it ? (l.y -= rt) : (l.x += rt * k),
                  l.tspan.setAttributeNS(null, "font-family", l.fontFamily),
                  l.tspan.setAttributeNS(null, "font-size", `${b(l.fontSize)}px`),
                  l.fontStyle !== lt.fontStyle && l.tspan.setAttributeNS(null, "font-style", l.fontStyle),
                  l.fontWeight !== lt.fontWeight && l.tspan.setAttributeNS(null, "font-weight", l.fontWeight);
                let C = l.textRenderingMode & M.TextRenderingMode.FILL_STROKE_MASK;
                if (
                  (C === M.TextRenderingMode.FILL || C === M.TextRenderingMode.FILL_STROKE
                    ? (l.fillColor !== lt.fillColor && l.tspan.setAttributeNS(null, "fill", l.fillColor),
                      l.fillAlpha < 1 && l.tspan.setAttributeNS(null, "fill-opacity", l.fillAlpha))
                    : l.textRenderingMode === M.TextRenderingMode.ADD_TO_PATH
                      ? l.tspan.setAttributeNS(null, "fill", "transparent")
                      : l.tspan.setAttributeNS(null, "fill", "none"),
                  C === M.TextRenderingMode.STROKE || C === M.TextRenderingMode.FILL_STROKE)
                ) {
                  let $ = 1 / (l.textMatrixScale || 1);
                  this._setStrokeAttributes(l.tspan, $);
                }
                let U = l.textMatrix;
                l.textRise !== 0 && ((U = U.slice()), (U[5] += l.textRise)),
                  l.txtElement.setAttributeNS(null, "transform", `${E(U)} scale(${b(k)}, -1)`),
                  l.txtElement.setAttributeNS(Q, "xml:space", "preserve"),
                  l.txtElement.append(l.tspan),
                  l.txtgrp.append(l.txtElement),
                  this._ensureTransformGroup().append(l.txtElement);
              }
              setLeadingMoveText(r, l) {
                this.setLeading(-l), this.moveText(r, l);
              }
              addFontStyle(r) {
                if (!r.data)
                  throw new Error(
                    'addFontStyle: No font data available, ensure that the "fontExtraProperties" API parameter is set.',
                  );
                this.cssStyle ||
                  ((this.cssStyle = this.svgFactory.createElement("svg:style")),
                  this.cssStyle.setAttributeNS(null, "type", "text/css"),
                  this.defs.append(this.cssStyle));
                let l = p(r.data, r.mimetype, this.forceDataSchema);
                this.cssStyle.textContent += `@font-face { font-family: "${r.loadedName}"; src: url(${l}); }
`;
              }
              setFont(r) {
                let l = this.current,
                  s = this.commonObjs.get(r[0]),
                  a = r[1];
                (l.font = s),
                  this.embedFonts &&
                    !s.missingFile &&
                    !this.embeddedFonts[s.loadedName] &&
                    (this.addFontStyle(s), (this.embeddedFonts[s.loadedName] = s)),
                  (l.fontMatrix = s.fontMatrix || M.FONT_IDENTITY_MATRIX);
                let o = "normal";
                s.black ? (o = "900") : s.bold && (o = "bold");
                let L = s.italic ? "italic" : "normal";
                a < 0 ? ((a = -a), (l.fontDirection = -1)) : (l.fontDirection = 1),
                  (l.fontSize = a),
                  (l.fontFamily = s.loadedName),
                  (l.fontWeight = o),
                  (l.fontStyle = L),
                  (l.tspan = this.svgFactory.createElement("svg:tspan")),
                  l.tspan.setAttributeNS(null, "y", b(-l.y)),
                  (l.xcoords = []),
                  (l.ycoords = []);
              }
              endText() {
                var l;
                let r = this.current;
                r.textRenderingMode & M.TextRenderingMode.ADD_TO_PATH_FLAG &&
                  (l = r.txtElement) != null &&
                  l.hasChildNodes() &&
                  ((r.element = r.txtElement), this.clip("nonzero"), this.endPath());
              }
              setLineWidth(r) {
                r > 0 && (this.current.lineWidth = r);
              }
              setLineCap(r) {
                this.current.lineCap = B[r];
              }
              setLineJoin(r) {
                this.current.lineJoin = R[r];
              }
              setMiterLimit(r) {
                this.current.miterLimit = r;
              }
              setStrokeAlpha(r) {
                this.current.strokeAlpha = r;
              }
              setStrokeRGBColor(r, l, s) {
                this.current.strokeColor = M.Util.makeHexColor(r, l, s);
              }
              setFillAlpha(r) {
                this.current.fillAlpha = r;
              }
              setFillRGBColor(r, l, s) {
                (this.current.fillColor = M.Util.makeHexColor(r, l, s)),
                  (this.current.tspan = this.svgFactory.createElement("svg:tspan")),
                  (this.current.xcoords = []),
                  (this.current.ycoords = []);
              }
              setStrokeColorN(r) {
                this.current.strokeColor = this._makeColorN_Pattern(r);
              }
              setFillColorN(r) {
                this.current.fillColor = this._makeColorN_Pattern(r);
              }
              shadingFill(r) {
                let { width: l, height: s } = this.viewport,
                  a = M.Util.inverseTransform(this.transformMatrix),
                  [o, L, n, _] = M.Util.getAxialAlignedBoundingBox([0, 0, l, s], a),
                  k = this.svgFactory.createElement("svg:rect");
                k.setAttributeNS(null, "x", o),
                  k.setAttributeNS(null, "y", L),
                  k.setAttributeNS(null, "width", n - o),
                  k.setAttributeNS(null, "height", _ - L),
                  k.setAttributeNS(null, "fill", this._makeShadingPattern(r)),
                  this.current.fillAlpha < 1 && k.setAttributeNS(null, "fill-opacity", this.current.fillAlpha),
                  this._ensureTransformGroup().append(k);
              }
              _makeColorN_Pattern(r) {
                return r[0] === "TilingPattern" ? this._makeTilingPattern(r) : this._makeShadingPattern(r);
              }
              _makeTilingPattern(r) {
                let l = r[1],
                  s = r[2],
                  a = r[3] || M.IDENTITY_MATRIX,
                  [o, L, n, _] = r[4],
                  k = r[5],
                  it = r[6],
                  H = r[7],
                  q = `shading${m++}`,
                  [j, rt, C, U] = M.Util.normalizeRect([
                    ...M.Util.applyTransform([o, L], a),
                    ...M.Util.applyTransform([n, _], a),
                  ]),
                  [$, S] = M.Util.singularValueDecompose2dScale(a),
                  e = k * $,
                  i = it * S,
                  d = this.svgFactory.createElement("svg:pattern");
                d.setAttributeNS(null, "id", q),
                  d.setAttributeNS(null, "patternUnits", "userSpaceOnUse"),
                  d.setAttributeNS(null, "width", e),
                  d.setAttributeNS(null, "height", i),
                  d.setAttributeNS(null, "x", `${j}`),
                  d.setAttributeNS(null, "y", `${rt}`);
                let T = this.svg,
                  x = this.transformMatrix,
                  P = this.current.fillColor,
                  G = this.current.strokeColor,
                  st = this.svgFactory.create(C - j, U - rt);
                if (((this.svg = st), (this.transformMatrix = a), H === 2)) {
                  let ct = M.Util.makeHexColor(...l);
                  (this.current.fillColor = ct), (this.current.strokeColor = ct);
                }
                return (
                  this.executeOpTree(this.convertOpList(s)),
                  (this.svg = T),
                  (this.transformMatrix = x),
                  (this.current.fillColor = P),
                  (this.current.strokeColor = G),
                  d.append(st.childNodes[0]),
                  this.defs.append(d),
                  `url(#${q})`
                );
              }
              _makeShadingPattern(r) {
                switch ((typeof r == "string" && (r = this.objs.get(r)), r[0])) {
                  case "RadialAxial":
                    let l = `shading${m++}`,
                      s = r[3],
                      a;
                    switch (r[1]) {
                      case "axial":
                        let o = r[4],
                          L = r[5];
                        (a = this.svgFactory.createElement("svg:linearGradient")),
                          a.setAttributeNS(null, "id", l),
                          a.setAttributeNS(null, "gradientUnits", "userSpaceOnUse"),
                          a.setAttributeNS(null, "x1", o[0]),
                          a.setAttributeNS(null, "y1", o[1]),
                          a.setAttributeNS(null, "x2", L[0]),
                          a.setAttributeNS(null, "y2", L[1]);
                        break;
                      case "radial":
                        let n = r[4],
                          _ = r[5],
                          k = r[6],
                          it = r[7];
                        (a = this.svgFactory.createElement("svg:radialGradient")),
                          a.setAttributeNS(null, "id", l),
                          a.setAttributeNS(null, "gradientUnits", "userSpaceOnUse"),
                          a.setAttributeNS(null, "cx", _[0]),
                          a.setAttributeNS(null, "cy", _[1]),
                          a.setAttributeNS(null, "r", it),
                          a.setAttributeNS(null, "fx", n[0]),
                          a.setAttributeNS(null, "fy", n[1]),
                          a.setAttributeNS(null, "fr", k);
                        break;
                      default:
                        throw new Error(`Unknown RadialAxial type: ${r[1]}`);
                    }
                    for (let o of s) {
                      let L = this.svgFactory.createElement("svg:stop");
                      L.setAttributeNS(null, "offset", o[0]), L.setAttributeNS(null, "stop-color", o[1]), a.append(L);
                    }
                    return this.defs.append(a), `url(#${l})`;
                  case "Mesh":
                    return (0, M.warn)("Unimplemented pattern Mesh"), null;
                  case "Dummy":
                    return "hotpink";
                  default:
                    throw new Error(`Unknown IR type: ${r[0]}`);
                }
              }
              setDash(r, l) {
                (this.current.dashArray = r), (this.current.dashPhase = l);
              }
              constructPath(r, l) {
                let s = this.current,
                  a = s.x,
                  o = s.y,
                  L = [],
                  n = 0;
                for (let _ of r)
                  switch (_ | 0) {
                    case M.OPS.rectangle:
                      (a = l[n++]), (o = l[n++]);
                      let k = l[n++],
                        it = l[n++],
                        H = a + k,
                        q = o + it;
                      L.push("M", b(a), b(o), "L", b(H), b(o), "L", b(H), b(q), "L", b(a), b(q), "Z");
                      break;
                    case M.OPS.moveTo:
                      (a = l[n++]), (o = l[n++]), L.push("M", b(a), b(o));
                      break;
                    case M.OPS.lineTo:
                      (a = l[n++]), (o = l[n++]), L.push("L", b(a), b(o));
                      break;
                    case M.OPS.curveTo:
                      (a = l[n + 4]),
                        (o = l[n + 5]),
                        L.push("C", b(l[n]), b(l[n + 1]), b(l[n + 2]), b(l[n + 3]), b(a), b(o)),
                        (n += 6);
                      break;
                    case M.OPS.curveTo2:
                      L.push("C", b(a), b(o), b(l[n]), b(l[n + 1]), b(l[n + 2]), b(l[n + 3])),
                        (a = l[n + 2]),
                        (o = l[n + 3]),
                        (n += 4);
                      break;
                    case M.OPS.curveTo3:
                      (a = l[n + 2]),
                        (o = l[n + 3]),
                        L.push("C", b(l[n]), b(l[n + 1]), b(a), b(o), b(a), b(o)),
                        (n += 4);
                      break;
                    case M.OPS.closePath:
                      L.push("Z");
                      break;
                  }
                (L = L.join(" ")),
                  s.path && r.length > 0 && r[0] !== M.OPS.rectangle && r[0] !== M.OPS.moveTo
                    ? (L = s.path.getAttributeNS(null, "d") + L)
                    : ((s.path = this.svgFactory.createElement("svg:path")),
                      this._ensureTransformGroup().append(s.path)),
                  s.path.setAttributeNS(null, "d", L),
                  s.path.setAttributeNS(null, "fill", "none"),
                  (s.element = s.path),
                  s.setCurrentPoint(a, o);
              }
              endPath() {
                let r = this.current;
                if (((r.path = null), !this.pendingClip)) return;
                if (!r.element) {
                  this.pendingClip = null;
                  return;
                }
                let l = `clippath${f++}`,
                  s = this.svgFactory.createElement("svg:clipPath");
                s.setAttributeNS(null, "id", l), s.setAttributeNS(null, "transform", E(this.transformMatrix));
                let a = r.element.cloneNode(!0);
                if (
                  (this.pendingClip === "evenodd"
                    ? a.setAttributeNS(null, "clip-rule", "evenodd")
                    : a.setAttributeNS(null, "clip-rule", "nonzero"),
                  (this.pendingClip = null),
                  s.append(a),
                  this.defs.append(s),
                  r.activeClipUrl)
                ) {
                  r.clipGroup = null;
                  for (let o of this.extraStack) o.clipGroup = null;
                  s.setAttributeNS(null, "clip-path", r.activeClipUrl);
                }
                (r.activeClipUrl = `url(#${l})`), (this.tgrp = null);
              }
              clip(r) {
                this.pendingClip = r;
              }
              closePath() {
                let r = this.current;
                if (r.path) {
                  let l = `${r.path.getAttributeNS(null, "d")}Z`;
                  r.path.setAttributeNS(null, "d", l);
                }
              }
              setLeading(r) {
                this.current.leading = -r;
              }
              setTextRise(r) {
                this.current.textRise = r;
              }
              setTextRenderingMode(r) {
                this.current.textRenderingMode = r;
              }
              setHScale(r) {
                this.current.textHScale = r / 100;
              }
              setRenderingIntent(r) {}
              setFlatness(r) {}
              setGState(r) {
                for (let [l, s] of r)
                  switch (l) {
                    case "LW":
                      this.setLineWidth(s);
                      break;
                    case "LC":
                      this.setLineCap(s);
                      break;
                    case "LJ":
                      this.setLineJoin(s);
                      break;
                    case "ML":
                      this.setMiterLimit(s);
                      break;
                    case "D":
                      this.setDash(s[0], s[1]);
                      break;
                    case "RI":
                      this.setRenderingIntent(s);
                      break;
                    case "FL":
                      this.setFlatness(s);
                      break;
                    case "Font":
                      this.setFont(s);
                      break;
                    case "CA":
                      this.setStrokeAlpha(s);
                      break;
                    case "ca":
                      this.setFillAlpha(s);
                      break;
                    default:
                      (0, M.warn)(`Unimplemented graphic state operator ${l}`);
                      break;
                  }
              }
              fill() {
                let r = this.current;
                r.element &&
                  (r.element.setAttributeNS(null, "fill", r.fillColor),
                  r.element.setAttributeNS(null, "fill-opacity", r.fillAlpha),
                  this.endPath());
              }
              stroke() {
                let r = this.current;
                r.element &&
                  (this._setStrokeAttributes(r.element),
                  r.element.setAttributeNS(null, "fill", "none"),
                  this.endPath());
              }
              _setStrokeAttributes(r, l = 1) {
                let s = this.current,
                  a = s.dashArray;
                l !== 1 &&
                  a.length > 0 &&
                  (a = a.map(function (o) {
                    return l * o;
                  })),
                  r.setAttributeNS(null, "stroke", s.strokeColor),
                  r.setAttributeNS(null, "stroke-opacity", s.strokeAlpha),
                  r.setAttributeNS(null, "stroke-miterlimit", b(s.miterLimit)),
                  r.setAttributeNS(null, "stroke-linecap", s.lineCap),
                  r.setAttributeNS(null, "stroke-linejoin", s.lineJoin),
                  r.setAttributeNS(null, "stroke-width", b(l * s.lineWidth) + "px"),
                  r.setAttributeNS(null, "stroke-dasharray", a.map(b).join(" ")),
                  r.setAttributeNS(null, "stroke-dashoffset", b(l * s.dashPhase) + "px");
              }
              eoFill() {
                var r;
                (r = this.current.element) == null || r.setAttributeNS(null, "fill-rule", "evenodd"), this.fill();
              }
              fillStroke() {
                this.stroke(), this.fill();
              }
              eoFillStroke() {
                var r;
                (r = this.current.element) == null || r.setAttributeNS(null, "fill-rule", "evenodd"), this.fillStroke();
              }
              closeStroke() {
                this.closePath(), this.stroke();
              }
              closeFillStroke() {
                this.closePath(), this.fillStroke();
              }
              closeEOFillStroke() {
                this.closePath(), this.eoFillStroke();
              }
              paintSolidColorImageMask() {
                let r = this.svgFactory.createElement("svg:rect");
                r.setAttributeNS(null, "x", "0"),
                  r.setAttributeNS(null, "y", "0"),
                  r.setAttributeNS(null, "width", "1px"),
                  r.setAttributeNS(null, "height", "1px"),
                  r.setAttributeNS(null, "fill", this.current.fillColor),
                  this._ensureTransformGroup().append(r);
              }
              paintImageXObject(r) {
                let l = this.getObject(r);
                if (!l) {
                  (0, M.warn)(`Dependent image with object ID ${r} is not ready yet`);
                  return;
                }
                this.paintInlineImageXObject(l);
              }
              paintInlineImageXObject(r, l) {
                let s = r.width,
                  a = r.height,
                  o = N(r, this.forceDataSchema, !!l),
                  L = this.svgFactory.createElement("svg:rect");
                L.setAttributeNS(null, "x", "0"),
                  L.setAttributeNS(null, "y", "0"),
                  L.setAttributeNS(null, "width", b(s)),
                  L.setAttributeNS(null, "height", b(a)),
                  (this.current.element = L),
                  this.clip("nonzero");
                let n = this.svgFactory.createElement("svg:image");
                n.setAttributeNS(gt, "xlink:href", o),
                  n.setAttributeNS(null, "x", "0"),
                  n.setAttributeNS(null, "y", b(-a)),
                  n.setAttributeNS(null, "width", b(s) + "px"),
                  n.setAttributeNS(null, "height", b(a) + "px"),
                  n.setAttributeNS(null, "transform", `scale(${b(1 / s)} ${b(-1 / a)})`),
                  l ? l.append(n) : this._ensureTransformGroup().append(n);
              }
              paintImageMaskXObject(r) {
                let l = this.getObject(r.data, r);
                if (l.bitmap) {
                  (0, M.warn)(
                    "paintImageMaskXObject: ImageBitmap support is not implemented, ensure that the `isOffscreenCanvasSupported` API parameter is disabled.",
                  );
                  return;
                }
                let s = this.current,
                  a = l.width,
                  o = l.height,
                  L = s.fillColor;
                s.maskId = `mask${h++}`;
                let n = this.svgFactory.createElement("svg:mask");
                n.setAttributeNS(null, "id", s.maskId);
                let _ = this.svgFactory.createElement("svg:rect");
                _.setAttributeNS(null, "x", "0"),
                  _.setAttributeNS(null, "y", "0"),
                  _.setAttributeNS(null, "width", b(a)),
                  _.setAttributeNS(null, "height", b(o)),
                  _.setAttributeNS(null, "fill", L),
                  _.setAttributeNS(null, "mask", `url(#${s.maskId})`),
                  this.defs.append(n),
                  this._ensureTransformGroup().append(_),
                  this.paintInlineImageXObject(l, n);
              }
              paintFormXObjectBegin(r, l) {
                if ((Array.isArray(r) && r.length === 6 && this.transform(r[0], r[1], r[2], r[3], r[4], r[5]), l)) {
                  let s = l[2] - l[0],
                    a = l[3] - l[1],
                    o = this.svgFactory.createElement("svg:rect");
                  o.setAttributeNS(null, "x", l[0]),
                    o.setAttributeNS(null, "y", l[1]),
                    o.setAttributeNS(null, "width", b(s)),
                    o.setAttributeNS(null, "height", b(a)),
                    (this.current.element = o),
                    this.clip("nonzero"),
                    this.endPath();
                }
              }
              paintFormXObjectEnd() {}
              _initialize(r) {
                let l = this.svgFactory.create(r.width, r.height),
                  s = this.svgFactory.createElement("svg:defs");
                l.append(s), (this.defs = s);
                let a = this.svgFactory.createElement("svg:g");
                return a.setAttributeNS(null, "transform", E(r.transform)), l.append(a), (this.svg = a), l;
              }
              _ensureClipGroup() {
                if (!this.current.clipGroup) {
                  let r = this.svgFactory.createElement("svg:g");
                  r.setAttributeNS(null, "clip-path", this.current.activeClipUrl),
                    this.svg.append(r),
                    (this.current.clipGroup = r);
                }
                return this.current.clipGroup;
              }
              _ensureTransformGroup() {
                return (
                  this.tgrp ||
                    ((this.tgrp = this.svgFactory.createElement("svg:g")),
                    this.tgrp.setAttributeNS(null, "transform", E(this.transformMatrix)),
                    this.current.activeClipUrl
                      ? this._ensureClipGroup().append(this.tgrp)
                      : this.svg.append(this.tgrp)),
                  this.tgrp
                );
              }
            }
            g.SVGGraphics = I;
          },
          (xt, g) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.XfaText = void 0);
            class ft {
              static textContent(M) {
                let lt = [],
                  Q = { items: lt, styles: Object.create(null) };
                function gt(B) {
                  var N;
                  if (!B) return;
                  let R = null,
                    p = B.name;
                  if (p === "#text") R = B.value;
                  else if (ft.shouldBuildText(p))
                    (N = B == null ? void 0 : B.attributes) != null && N.textContent
                      ? (R = B.attributes.textContent)
                      : B.value && (R = B.value);
                  else return;
                  if ((R !== null && lt.push({ str: R }), !!B.children)) for (let O of B.children) gt(O);
                }
                return gt(M), Q;
              }
              static shouldBuildText(M) {
                return !(M === "textarea" || M === "input" || M === "option" || M === "select");
              }
            }
            g.XfaText = ft;
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.TextLayerRenderTask = void 0),
              (g.renderTextLayer = E),
              (g.updateTextLayer = f);
            var c = ft(1),
              M = ft(6);
            let lt = 1e5,
              Q = 30,
              gt = 0.8,
              B = new Map();
            function R(h, m) {
              let I;
              if (m && c.FeatureTest.isOffscreenCanvasSupported)
                I = new OffscreenCanvas(h, h).getContext("2d", { alpha: !1 });
              else {
                let y = document.createElement("canvas");
                (y.width = y.height = h), (I = y.getContext("2d", { alpha: !1 }));
              }
              return I;
            }
            function p(h, m) {
              let I = B.get(h);
              if (I) return I;
              let y = R(Q, m);
              y.font = `${Q}px ${h}`;
              let r = y.measureText(""),
                l = r.fontBoundingBoxAscent,
                s = Math.abs(r.fontBoundingBoxDescent);
              if (l) {
                let o = l / (l + s);
                return B.set(h, o), (y.canvas.width = y.canvas.height = 0), o;
              }
              (y.strokeStyle = "red"), y.clearRect(0, 0, Q, Q), y.strokeText("g", 0, 0);
              let a = y.getImageData(0, 0, Q, Q).data;
              s = 0;
              for (let o = a.length - 1 - 3; o >= 0; o -= 4)
                if (a[o] > 0) {
                  s = Math.ceil(o / 4 / Q);
                  break;
                }
              y.clearRect(0, 0, Q, Q), y.strokeText("A", 0, Q), (a = y.getImageData(0, 0, Q, Q).data), (l = 0);
              for (let o = 0, L = a.length; o < L; o += 4)
                if (a[o] > 0) {
                  l = Q - Math.floor(o / 4 / Q);
                  break;
                }
              if (((y.canvas.width = y.canvas.height = 0), l)) {
                let o = l / (l + s);
                return B.set(h, o), o;
              }
              return B.set(h, gt), gt;
            }
            function N(h, m, I) {
              let y = document.createElement("span"),
                r = { angle: 0, canvasWidth: 0, hasText: m.str !== "", hasEOL: m.hasEOL, fontSize: 0 };
              h._textDivs.push(y);
              let l = c.Util.transform(h._transform, m.transform),
                s = Math.atan2(l[1], l[0]),
                a = I[m.fontName];
              a.vertical && (s += Math.PI / 2);
              let o = Math.hypot(l[2], l[3]),
                L = o * p(a.fontFamily, h._isOffscreenCanvasSupported),
                n,
                _;
              s === 0 ? ((n = l[4]), (_ = l[5] - L)) : ((n = l[4] + L * Math.sin(s)), (_ = l[5] - L * Math.cos(s)));
              let k = "calc(var(--scale-factor)*",
                it = y.style;
              h._container === h._rootContainer
                ? ((it.left = `${((100 * n) / h._pageWidth).toFixed(2)}%`),
                  (it.top = `${((100 * _) / h._pageHeight).toFixed(2)}%`))
                : ((it.left = `${k}${n.toFixed(2)}px)`), (it.top = `${k}${_.toFixed(2)}px)`)),
                (it.fontSize = `${k}${o.toFixed(2)}px)`),
                (it.fontFamily = a.fontFamily),
                (r.fontSize = o),
                y.setAttribute("role", "presentation"),
                (y.textContent = m.str),
                (y.dir = m.dir),
                h._fontInspectorEnabled && (y.dataset.fontName = m.fontName),
                s !== 0 && (r.angle = s * (180 / Math.PI));
              let H = !1;
              if (m.str.length > 1) H = !0;
              else if (m.str !== " " && m.transform[0] !== m.transform[3]) {
                let q = Math.abs(m.transform[0]),
                  j = Math.abs(m.transform[3]);
                q !== j && Math.max(q, j) / Math.min(q, j) > 1.5 && (H = !0);
              }
              H && (r.canvasWidth = a.vertical ? m.height : m.width),
                h._textDivProperties.set(y, r),
                h._isReadableStream && h._layoutText(y);
            }
            function O(h) {
              let { div: m, scale: I, properties: y, ctx: r, prevFontSize: l, prevFontFamily: s } = h,
                { style: a } = m,
                o = "";
              if (y.canvasWidth !== 0 && y.hasText) {
                let { fontFamily: L } = a,
                  { canvasWidth: n, fontSize: _ } = y;
                (l !== _ || s !== L) && ((r.font = `${_ * I}px ${L}`), (h.prevFontSize = _), (h.prevFontFamily = L));
                let { width: k } = r.measureText(m.textContent);
                k > 0 && (o = `scaleX(${(n * I) / k})`);
              }
              y.angle !== 0 && (o = `rotate(${y.angle}deg) ${o}`), o.length > 0 && (a.transform = o);
            }
            function A(h) {
              if (h._canceled) return;
              let m = h._textDivs,
                I = h._capability;
              if (m.length > lt) {
                I.resolve();
                return;
              }
              if (!h._isReadableStream) for (let r of m) h._layoutText(r);
              I.resolve();
            }
            class b {
              constructor({
                textContentSource: m,
                container: I,
                viewport: y,
                textDivs: r,
                textDivProperties: l,
                textContentItemsStr: s,
                isOffscreenCanvasSupported: a,
              }) {
                var k;
                (this._textContentSource = m),
                  (this._isReadableStream = m instanceof ReadableStream),
                  (this._container = this._rootContainer = I),
                  (this._textDivs = r || []),
                  (this._textContentItemsStr = s || []),
                  (this._isOffscreenCanvasSupported = a),
                  (this._fontInspectorEnabled = !!((k = globalThis.FontInspector) != null && k.enabled)),
                  (this._reader = null),
                  (this._textDivProperties = l || new WeakMap()),
                  (this._canceled = !1),
                  (this._capability = new c.PromiseCapability()),
                  (this._layoutTextParams = {
                    prevFontSize: null,
                    prevFontFamily: null,
                    div: null,
                    scale: y.scale * (globalThis.devicePixelRatio || 1),
                    properties: null,
                    ctx: R(0, a),
                  });
                let { pageWidth: o, pageHeight: L, pageX: n, pageY: _ } = y.rawDims;
                (this._transform = [1, 0, 0, -1, -n, _ + L]),
                  (this._pageWidth = o),
                  (this._pageHeight = L),
                  (0, M.setLayerDimensions)(I, y),
                  this._capability.promise
                    .finally(() => {
                      this._layoutTextParams = null;
                    })
                    .catch(() => {});
              }
              get promise() {
                return this._capability.promise;
              }
              cancel() {
                (this._canceled = !0),
                  this._reader &&
                    (this._reader.cancel(new c.AbortException("TextLayer task cancelled.")).catch(() => {}),
                    (this._reader = null)),
                  this._capability.reject(new c.AbortException("TextLayer task cancelled."));
              }
              _processItems(m, I) {
                for (let y of m) {
                  if (y.str === void 0) {
                    if (y.type === "beginMarkedContentProps" || y.type === "beginMarkedContent") {
                      let r = this._container;
                      (this._container = document.createElement("span")),
                        this._container.classList.add("markedContent"),
                        y.id !== null && this._container.setAttribute("id", `${y.id}`),
                        r.append(this._container);
                    } else y.type === "endMarkedContent" && (this._container = this._container.parentNode);
                    continue;
                  }
                  this._textContentItemsStr.push(y.str), N(this, y, I);
                }
              }
              _layoutText(m) {
                let I = (this._layoutTextParams.properties = this._textDivProperties.get(m));
                if (
                  ((this._layoutTextParams.div = m),
                  O(this._layoutTextParams),
                  I.hasText && this._container.append(m),
                  I.hasEOL)
                ) {
                  let y = document.createElement("br");
                  y.setAttribute("role", "presentation"), this._container.append(y);
                }
              }
              _render() {
                let m = new c.PromiseCapability(),
                  I = Object.create(null);
                if (this._isReadableStream) {
                  let y = () => {
                    this._reader.read().then(({ value: r, done: l }) => {
                      if (l) {
                        m.resolve();
                        return;
                      }
                      Object.assign(I, r.styles), this._processItems(r.items, I), y();
                    }, m.reject);
                  };
                  (this._reader = this._textContentSource.getReader()), y();
                } else if (this._textContentSource) {
                  let { items: y, styles: r } = this._textContentSource;
                  this._processItems(y, r), m.resolve();
                } else throw new Error('No "textContentSource" parameter specified.');
                m.promise.then(() => {
                  (I = null), A(this);
                }, this._capability.reject);
              }
            }
            g.TextLayerRenderTask = b;
            function E(h) {
              !h.textContentSource &&
                (h.textContent || h.textContentStream) &&
                ((0, M.deprecated)(
                  "The TextLayerRender `textContent`/`textContentStream` parameters will be removed in the future, please use `textContentSource` instead.",
                ),
                (h.textContentSource = h.textContent || h.textContentStream));
              let { container: m, viewport: I } = h,
                y = getComputedStyle(m),
                r = y.getPropertyValue("visibility"),
                l = parseFloat(y.getPropertyValue("--scale-factor"));
              r === "visible" &&
                (!l || Math.abs(l - I.scale) > 1e-5) &&
                console.error(
                  "The `--scale-factor` CSS-variable must be set, to the same value as `viewport.scale`, either on the `container`-element itself or higher up in the DOM.",
                );
              let s = new b(h);
              return s._render(), s;
            }
            function f({
              container: h,
              viewport: m,
              textDivs: I,
              textDivProperties: y,
              isOffscreenCanvasSupported: r,
              mustRotate: l = !0,
              mustRescale: s = !0,
            }) {
              if ((l && (0, M.setLayerDimensions)(h, { rotation: m.rotation }), s)) {
                let a = R(0, r),
                  L = {
                    prevFontSize: null,
                    prevFontFamily: null,
                    div: null,
                    scale: m.scale * (globalThis.devicePixelRatio || 1),
                    properties: null,
                    ctx: a,
                  };
                for (let n of I) (L.properties = y.get(n)), (L.div = n), O(L);
              }
            }
          },
          (xt, g, ft) => {
            var p, N, O, A, b, E, f, h, m, I, y, ni, ke, ri, ai;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.AnnotationEditorLayer = void 0);
            var c = ft(1),
              M = ft(4),
              lt = ft(28),
              Q = ft(33),
              gt = ft(6),
              B = ft(34);
            let o = class o {
              constructor({
                uiManager: n,
                pageIndex: _,
                div: k,
                accessibilityManager: it,
                annotationLayer: H,
                viewport: q,
                l10n: j,
              }) {
                J(this, y);
                J(this, p);
                J(this, N, !1);
                J(this, O, null);
                J(this, A, this.pointerup.bind(this));
                J(this, b, this.pointerdown.bind(this));
                J(this, E, new Map());
                J(this, f, !1);
                J(this, h, !1);
                J(this, m, !1);
                J(this, I);
                let rt = [lt.FreeTextEditor, Q.InkEditor, B.StampEditor];
                if (!o._initialized) {
                  o._initialized = !0;
                  for (let C of rt) C.initialize(j);
                }
                n.registerEditorTypes(rt),
                  et(this, I, n),
                  (this.pageIndex = _),
                  (this.div = k),
                  et(this, p, it),
                  et(this, O, H),
                  (this.viewport = q),
                  t(this, I).addLayer(this);
              }
              get isEmpty() {
                return t(this, E).size === 0;
              }
              updateToolbar(n) {
                t(this, I).updateToolbar(n);
              }
              updateMode(n = t(this, I).getMode()) {
                z(this, y, ai).call(this),
                  n === c.AnnotationEditorType.INK
                    ? (this.addInkEditorIfNeeded(!1), this.disableClick())
                    : this.enableClick(),
                  n !== c.AnnotationEditorType.NONE &&
                    (this.div.classList.toggle("freeTextEditing", n === c.AnnotationEditorType.FREETEXT),
                    this.div.classList.toggle("inkEditing", n === c.AnnotationEditorType.INK),
                    this.div.classList.toggle("stampEditing", n === c.AnnotationEditorType.STAMP),
                    (this.div.hidden = !1));
              }
              addInkEditorIfNeeded(n) {
                if (!n && t(this, I).getMode() !== c.AnnotationEditorType.INK) return;
                if (!n) {
                  for (let k of t(this, E).values())
                    if (k.isEmpty()) {
                      k.setInBackground();
                      return;
                    }
                }
                z(this, y, ke).call(this, { offsetX: 0, offsetY: 0 }, !1).setInBackground();
              }
              setEditingState(n) {
                t(this, I).setEditingState(n);
              }
              addCommands(n) {
                t(this, I).addCommands(n);
              }
              enable() {
                this.div.style.pointerEvents = "auto";
                let n = new Set();
                for (let k of t(this, E).values())
                  k.enableEditing(), k.annotationElementId && n.add(k.annotationElementId);
                if (!t(this, O)) return;
                let _ = t(this, O).getEditableAnnotations();
                for (let k of _) {
                  if ((k.hide(), t(this, I).isDeletedAnnotationElement(k.data.id) || n.has(k.data.id))) continue;
                  let it = this.deserialize(k);
                  it && (this.addOrRebuild(it), it.enableEditing());
                }
              }
              disable() {
                var _;
                et(this, m, !0), (this.div.style.pointerEvents = "none");
                let n = new Set();
                for (let k of t(this, E).values()) {
                  if ((k.disableEditing(), !k.annotationElementId || k.serialize() !== null)) {
                    n.add(k.annotationElementId);
                    continue;
                  }
                  (_ = this.getEditableAnnotation(k.annotationElementId)) == null || _.show(), k.remove();
                }
                if (t(this, O)) {
                  let k = t(this, O).getEditableAnnotations();
                  for (let it of k) {
                    let { id: H } = it.data;
                    n.has(H) || t(this, I).isDeletedAnnotationElement(H) || it.show();
                  }
                }
                z(this, y, ai).call(this), this.isEmpty && (this.div.hidden = !0), et(this, m, !1);
              }
              getEditableAnnotation(n) {
                var _;
                return ((_ = t(this, O)) == null ? void 0 : _.getEditableAnnotation(n)) || null;
              }
              setActiveEditor(n) {
                t(this, I).getActive() !== n && t(this, I).setActiveEditor(n);
              }
              enableClick() {
                this.div.addEventListener("pointerdown", t(this, b)),
                  this.div.addEventListener("pointerup", t(this, A));
              }
              disableClick() {
                this.div.removeEventListener("pointerdown", t(this, b)),
                  this.div.removeEventListener("pointerup", t(this, A));
              }
              attach(n) {
                t(this, E).set(n.id, n);
                let { annotationElementId: _ } = n;
                _ && t(this, I).isDeletedAnnotationElement(_) && t(this, I).removeDeletedAnnotationElement(n);
              }
              detach(n) {
                var _;
                t(this, E).delete(n.id),
                  (_ = t(this, p)) == null || _.removePointerInTextLayer(n.contentDiv),
                  !t(this, m) && n.annotationElementId && t(this, I).addDeletedAnnotationElement(n);
              }
              remove(n) {
                this.detach(n),
                  t(this, I).removeEditor(n),
                  n.div.contains(document.activeElement) &&
                    setTimeout(() => {
                      t(this, I).focusMainContainer();
                    }, 0),
                  n.div.remove(),
                  (n.isAttachedToDOM = !1),
                  t(this, h) || this.addInkEditorIfNeeded(!1);
              }
              changeParent(n) {
                var _;
                n.parent !== this &&
                  (n.annotationElementId &&
                    (t(this, I).addDeletedAnnotationElement(n.annotationElementId),
                    M.AnnotationEditor.deleteAnnotationElement(n),
                    (n.annotationElementId = null)),
                  this.attach(n),
                  (_ = n.parent) == null || _.detach(n),
                  n.setParent(this),
                  n.div && n.isAttachedToDOM && (n.div.remove(), this.div.append(n.div)));
              }
              add(n) {
                if ((this.changeParent(n), t(this, I).addEditor(n), this.attach(n), !n.isAttachedToDOM)) {
                  let _ = n.render();
                  this.div.append(_), (n.isAttachedToDOM = !0);
                }
                n.fixAndSetPosition(), n.onceAdded(), t(this, I).addToAnnotationStorage(n);
              }
              moveEditorInDOM(n) {
                var k;
                if (!n.isAttachedToDOM) return;
                let { activeElement: _ } = document;
                n.div.contains(_) &&
                  ((n._focusEventsAllowed = !1),
                  setTimeout(() => {
                    n.div.contains(document.activeElement)
                      ? (n._focusEventsAllowed = !0)
                      : (n.div.addEventListener(
                          "focusin",
                          () => {
                            n._focusEventsAllowed = !0;
                          },
                          { once: !0 },
                        ),
                        _.focus());
                  }, 0)),
                  (n._structTreeParentId =
                    (k = t(this, p)) == null ? void 0 : k.moveElementInDOM(this.div, n.div, n.contentDiv, !0));
              }
              addOrRebuild(n) {
                n.needsToBeRebuilt() ? n.rebuild() : this.add(n);
              }
              addUndoableEditor(n) {
                let _ = () => n._uiManager.rebuild(n),
                  k = () => {
                    n.remove();
                  };
                this.addCommands({ cmd: _, undo: k, mustExec: !1 });
              }
              getNextId() {
                return t(this, I).getId();
              }
              pasteEditor(n, _) {
                t(this, I).updateToolbar(n), t(this, I).updateMode(n);
                let { offsetX: k, offsetY: it } = z(this, y, ri).call(this),
                  H = this.getNextId(),
                  q = z(this, y, ni).call(
                    this,
                    ue({ parent: this, id: H, x: k, y: it, uiManager: t(this, I), isCentered: !0 }, _),
                  );
                q && this.add(q);
              }
              deserialize(n) {
                var _;
                switch ((_ = n.annotationType) != null ? _ : n.annotationEditorType) {
                  case c.AnnotationEditorType.FREETEXT:
                    return lt.FreeTextEditor.deserialize(n, this, t(this, I));
                  case c.AnnotationEditorType.INK:
                    return Q.InkEditor.deserialize(n, this, t(this, I));
                  case c.AnnotationEditorType.STAMP:
                    return B.StampEditor.deserialize(n, this, t(this, I));
                }
                return null;
              }
              addNewEditor() {
                z(this, y, ke).call(this, z(this, y, ri).call(this), !0);
              }
              setSelected(n) {
                t(this, I).setSelected(n);
              }
              toggleSelected(n) {
                t(this, I).toggleSelected(n);
              }
              isSelected(n) {
                return t(this, I).isSelected(n);
              }
              unselect(n) {
                t(this, I).unselect(n);
              }
              pointerup(n) {
                let { isMac: _ } = c.FeatureTest.platform;
                if (!(n.button !== 0 || (n.ctrlKey && _)) && n.target === this.div && t(this, f)) {
                  if ((et(this, f, !1), !t(this, N))) {
                    et(this, N, !0);
                    return;
                  }
                  if (t(this, I).getMode() === c.AnnotationEditorType.STAMP) {
                    t(this, I).unselectAll();
                    return;
                  }
                  z(this, y, ke).call(this, n, !1);
                }
              }
              pointerdown(n) {
                if (t(this, f)) {
                  et(this, f, !1);
                  return;
                }
                let { isMac: _ } = c.FeatureTest.platform;
                if (n.button !== 0 || (n.ctrlKey && _) || n.target !== this.div) return;
                et(this, f, !0);
                let k = t(this, I).getActive();
                et(this, N, !k || k.isEmpty());
              }
              findNewParent(n, _, k) {
                let it = t(this, I).findParent(_, k);
                return it === null || it === this ? !1 : (it.changeParent(n), !0);
              }
              destroy() {
                var n, _;
                ((n = t(this, I).getActive()) == null ? void 0 : n.parent) === this &&
                  (t(this, I).commitOrRemove(), t(this, I).setActiveEditor(null));
                for (let k of t(this, E).values())
                  (_ = t(this, p)) == null || _.removePointerInTextLayer(k.contentDiv),
                    k.setParent(null),
                    (k.isAttachedToDOM = !1),
                    k.div.remove();
                (this.div = null), t(this, E).clear(), t(this, I).removeLayer(this);
              }
              render({ viewport: n }) {
                (this.viewport = n), (0, gt.setLayerDimensions)(this.div, n);
                for (let _ of t(this, I).getEditors(this.pageIndex)) this.add(_);
                this.updateMode();
              }
              update({ viewport: n }) {
                t(this, I).commitOrRemove(),
                  (this.viewport = n),
                  (0, gt.setLayerDimensions)(this.div, { rotation: n.rotation }),
                  this.updateMode();
              }
              get pageDimensions() {
                let { pageWidth: n, pageHeight: _ } = this.viewport.rawDims;
                return [n, _];
              }
            };
            (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakMap()),
              (m = new WeakMap()),
              (I = new WeakMap()),
              (y = new WeakSet()),
              (ni = function (n) {
                switch (t(this, I).getMode()) {
                  case c.AnnotationEditorType.FREETEXT:
                    return new lt.FreeTextEditor(n);
                  case c.AnnotationEditorType.INK:
                    return new Q.InkEditor(n);
                  case c.AnnotationEditorType.STAMP:
                    return new B.StampEditor(n);
                }
                return null;
              }),
              (ke = function (n, _) {
                let k = this.getNextId(),
                  it = z(this, y, ni).call(this, {
                    parent: this,
                    id: k,
                    x: n.offsetX,
                    y: n.offsetY,
                    uiManager: t(this, I),
                    isCentered: _,
                  });
                return it && this.add(it), it;
              }),
              (ri = function () {
                let { x: n, y: _, width: k, height: it } = this.div.getBoundingClientRect(),
                  H = Math.max(0, n),
                  q = Math.max(0, _),
                  j = Math.min(window.innerWidth, n + k),
                  rt = Math.min(window.innerHeight, _ + it),
                  C = (H + j) / 2 - n,
                  U = (q + rt) / 2 - _,
                  [$, S] = this.viewport.rotation % 180 === 0 ? [C, U] : [U, C];
                return { offsetX: $, offsetY: S };
              }),
              (ai = function () {
                et(this, h, !0);
                for (let n of t(this, E).values()) n.isEmpty() && n.remove();
                et(this, h, !1);
              }),
              Jt(o, "_initialized", !1);
            let R = o;
            g.AnnotationEditorLayer = R;
          },
          (xt, g, ft) => {
            var B, R, p, N, O, A, b, E, f, h, Oi, Ni, Bi, _e, oi, Ui, li;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.FreeTextEditor = void 0);
            var c = ft(1),
              M = ft(5),
              lt = ft(4),
              Q = ft(29);
            let o = class o extends lt.AnnotationEditor {
              constructor(_) {
                super(ve(ue({}, _), { name: "freeTextEditor" }));
                J(this, h);
                J(this, B, this.editorDivBlur.bind(this));
                J(this, R, this.editorDivFocus.bind(this));
                J(this, p, this.editorDivInput.bind(this));
                J(this, N, this.editorDivKeydown.bind(this));
                J(this, O);
                J(this, A, "");
                J(this, b, `${this.id}-editor`);
                J(this, E);
                J(this, f, null);
                et(this, O, _.color || o._defaultColor || lt.AnnotationEditor._defaultLineColor),
                  et(this, E, _.fontSize || o._defaultFontSize);
              }
              static get _keyboardManager() {
                let _ = o.prototype,
                  k = (q) => q.isEmpty(),
                  it = M.AnnotationEditorUIManager.TRANSLATE_SMALL,
                  H = M.AnnotationEditorUIManager.TRANSLATE_BIG;
                return (0, c.shadow)(
                  this,
                  "_keyboardManager",
                  new M.KeyboardManager([
                    [["ctrl+s", "mac+meta+s", "ctrl+p", "mac+meta+p"], _.commitOrRemove, { bubbles: !0 }],
                    [["ctrl+Enter", "mac+meta+Enter", "Escape", "mac+Escape"], _.commitOrRemove],
                    [["ArrowLeft", "mac+ArrowLeft"], _._translateEmpty, { args: [-it, 0], checker: k }],
                    [["ctrl+ArrowLeft", "mac+shift+ArrowLeft"], _._translateEmpty, { args: [-H, 0], checker: k }],
                    [["ArrowRight", "mac+ArrowRight"], _._translateEmpty, { args: [it, 0], checker: k }],
                    [["ctrl+ArrowRight", "mac+shift+ArrowRight"], _._translateEmpty, { args: [H, 0], checker: k }],
                    [["ArrowUp", "mac+ArrowUp"], _._translateEmpty, { args: [0, -it], checker: k }],
                    [["ctrl+ArrowUp", "mac+shift+ArrowUp"], _._translateEmpty, { args: [0, -H], checker: k }],
                    [["ArrowDown", "mac+ArrowDown"], _._translateEmpty, { args: [0, it], checker: k }],
                    [["ctrl+ArrowDown", "mac+shift+ArrowDown"], _._translateEmpty, { args: [0, H], checker: k }],
                  ]),
                );
              }
              static initialize(_) {
                lt.AnnotationEditor.initialize(_, {
                  strings: ["free_text2_default_content", "editor_free_text2_aria_label"],
                });
                let k = getComputedStyle(document.documentElement);
                this._internalPadding = parseFloat(k.getPropertyValue("--freetext-padding"));
              }
              static updateDefaultParams(_, k) {
                switch (_) {
                  case c.AnnotationEditorParamsType.FREETEXT_SIZE:
                    o._defaultFontSize = k;
                    break;
                  case c.AnnotationEditorParamsType.FREETEXT_COLOR:
                    o._defaultColor = k;
                    break;
                }
              }
              updateParams(_, k) {
                switch (_) {
                  case c.AnnotationEditorParamsType.FREETEXT_SIZE:
                    z(this, h, Oi).call(this, k);
                    break;
                  case c.AnnotationEditorParamsType.FREETEXT_COLOR:
                    z(this, h, Ni).call(this, k);
                    break;
                }
              }
              static get defaultPropertiesToUpdate() {
                return [
                  [c.AnnotationEditorParamsType.FREETEXT_SIZE, o._defaultFontSize],
                  [
                    c.AnnotationEditorParamsType.FREETEXT_COLOR,
                    o._defaultColor || lt.AnnotationEditor._defaultLineColor,
                  ],
                ];
              }
              get propertiesToUpdate() {
                return [
                  [c.AnnotationEditorParamsType.FREETEXT_SIZE, t(this, E)],
                  [c.AnnotationEditorParamsType.FREETEXT_COLOR, t(this, O)],
                ];
              }
              _translateEmpty(_, k) {
                this._uiManager.translateSelectedEditors(_, k, !0);
              }
              getInitialTranslation() {
                let _ = this.parentScale;
                return [-o._internalPadding * _, -(o._internalPadding + t(this, E)) * _];
              }
              rebuild() {
                this.parent && (super.rebuild(), this.div !== null && (this.isAttachedToDOM || this.parent.add(this)));
              }
              enableEditMode() {
                this.isInEditMode() ||
                  (this.parent.setEditingState(!1),
                  this.parent.updateToolbar(c.AnnotationEditorType.FREETEXT),
                  super.enableEditMode(),
                  this.overlayDiv.classList.remove("enabled"),
                  (this.editorDiv.contentEditable = !0),
                  (this._isDraggable = !1),
                  this.div.removeAttribute("aria-activedescendant"),
                  this.editorDiv.addEventListener("keydown", t(this, N)),
                  this.editorDiv.addEventListener("focus", t(this, R)),
                  this.editorDiv.addEventListener("blur", t(this, B)),
                  this.editorDiv.addEventListener("input", t(this, p)));
              }
              disableEditMode() {
                this.isInEditMode() &&
                  (this.parent.setEditingState(!0),
                  super.disableEditMode(),
                  this.overlayDiv.classList.add("enabled"),
                  (this.editorDiv.contentEditable = !1),
                  this.div.setAttribute("aria-activedescendant", t(this, b)),
                  (this._isDraggable = !0),
                  this.editorDiv.removeEventListener("keydown", t(this, N)),
                  this.editorDiv.removeEventListener("focus", t(this, R)),
                  this.editorDiv.removeEventListener("blur", t(this, B)),
                  this.editorDiv.removeEventListener("input", t(this, p)),
                  this.div.focus({ preventScroll: !0 }),
                  (this.isEditing = !1),
                  this.parent.div.classList.add("freeTextEditing"));
              }
              focusin(_) {
                this._focusEventsAllowed && (super.focusin(_), _.target !== this.editorDiv && this.editorDiv.focus());
              }
              onceAdded() {
                var _;
                if (this.width) {
                  z(this, h, li).call(this);
                  return;
                }
                this.enableEditMode(),
                  this.editorDiv.focus(),
                  (_ = this._initialOptions) != null && _.isCentered && this.center(),
                  (this._initialOptions = null);
              }
              isEmpty() {
                return !this.editorDiv || this.editorDiv.innerText.trim() === "";
              }
              remove() {
                (this.isEditing = !1),
                  this.parent && (this.parent.setEditingState(!0), this.parent.div.classList.add("freeTextEditing")),
                  super.remove();
              }
              commit() {
                if (!this.isInEditMode()) return;
                super.commit(), this.disableEditMode();
                let _ = t(this, A),
                  k = et(this, A, z(this, h, Bi).call(this).trimEnd());
                if (_ === k) return;
                let it = (H) => {
                  if ((et(this, A, H), !H)) {
                    this.remove();
                    return;
                  }
                  z(this, h, oi).call(this), this._uiManager.rebuild(this), z(this, h, _e).call(this);
                };
                this.addCommands({
                  cmd: () => {
                    it(k);
                  },
                  undo: () => {
                    it(_);
                  },
                  mustExec: !1,
                }),
                  z(this, h, _e).call(this);
              }
              shouldGetKeyboardEvents() {
                return this.isInEditMode();
              }
              enterInEditMode() {
                this.enableEditMode(), this.editorDiv.focus();
              }
              dblclick(_) {
                this.enterInEditMode();
              }
              keydown(_) {
                _.target === this.div && _.key === "Enter" && (this.enterInEditMode(), _.preventDefault());
              }
              editorDivKeydown(_) {
                o._keyboardManager.exec(this, _);
              }
              editorDivFocus(_) {
                this.isEditing = !0;
              }
              editorDivBlur(_) {
                this.isEditing = !1;
              }
              editorDivInput(_) {
                this.parent.div.classList.toggle("freeTextEditing", this.isEmpty());
              }
              disableEditing() {
                this.editorDiv.setAttribute("role", "comment"), this.editorDiv.removeAttribute("aria-multiline");
              }
              enableEditing() {
                this.editorDiv.setAttribute("role", "textbox"), this.editorDiv.setAttribute("aria-multiline", !0);
              }
              render() {
                if (this.div) return this.div;
                let _, k;
                this.width && ((_ = this.x), (k = this.y)),
                  super.render(),
                  (this.editorDiv = document.createElement("div")),
                  (this.editorDiv.className = "internal"),
                  this.editorDiv.setAttribute("id", t(this, b)),
                  this.enableEditing(),
                  lt.AnnotationEditor._l10nPromise.get("editor_free_text2_aria_label").then((H) => {
                    var q;
                    return (q = this.editorDiv) == null ? void 0 : q.setAttribute("aria-label", H);
                  }),
                  lt.AnnotationEditor._l10nPromise.get("free_text2_default_content").then((H) => {
                    var q;
                    return (q = this.editorDiv) == null ? void 0 : q.setAttribute("default-content", H);
                  }),
                  (this.editorDiv.contentEditable = !0);
                let { style: it } = this.editorDiv;
                if (
                  ((it.fontSize = `calc(${t(this, E)}px * var(--scale-factor))`),
                  (it.color = t(this, O)),
                  this.div.append(this.editorDiv),
                  (this.overlayDiv = document.createElement("div")),
                  this.overlayDiv.classList.add("overlay", "enabled"),
                  this.div.append(this.overlayDiv),
                  (0, M.bindEvents)(this, this.div, ["dblclick", "keydown"]),
                  this.width)
                ) {
                  let [H, q] = this.parentDimensions;
                  if (this.annotationElementId) {
                    let { position: j } = t(this, f),
                      [rt, C] = this.getInitialTranslation();
                    [rt, C] = this.pageTranslationToScreen(rt, C);
                    let [U, $] = this.pageDimensions,
                      [S, e] = this.pageTranslation,
                      i,
                      d;
                    switch (this.rotation) {
                      case 0:
                        (i = _ + (j[0] - S) / U), (d = k + this.height - (j[1] - e) / $);
                        break;
                      case 90:
                        (i = _ + (j[0] - S) / U), (d = k - (j[1] - e) / $), ([rt, C] = [C, -rt]);
                        break;
                      case 180:
                        (i = _ - this.width + (j[0] - S) / U), (d = k - (j[1] - e) / $), ([rt, C] = [-rt, -C]);
                        break;
                      case 270:
                        (i = _ + (j[0] - S - this.height * $) / U),
                          (d = k + (j[1] - e - this.width * U) / $),
                          ([rt, C] = [-C, rt]);
                        break;
                    }
                    this.setAt(i * H, d * q, rt, C);
                  } else this.setAt(_ * H, k * q, this.width * H, this.height * q);
                  z(this, h, oi).call(this), (this._isDraggable = !0), (this.editorDiv.contentEditable = !1);
                } else (this._isDraggable = !1), (this.editorDiv.contentEditable = !0);
                return this.div;
              }
              get contentDiv() {
                return this.editorDiv;
              }
              static deserialize(_, k, it) {
                let H = null;
                if (_ instanceof Q.FreeTextAnnotationElement) {
                  let {
                    data: {
                      defaultAppearanceData: { fontSize: j, fontColor: rt },
                      rect: C,
                      rotation: U,
                      id: $,
                    },
                    textContent: S,
                    textPosition: e,
                    parent: {
                      page: { pageNumber: i },
                    },
                  } = _;
                  if (!S || S.length === 0) return null;
                  H = _ = {
                    annotationType: c.AnnotationEditorType.FREETEXT,
                    color: Array.from(rt),
                    fontSize: j,
                    value: S.join(`
`),
                    position: e,
                    pageIndex: i - 1,
                    rect: C,
                    rotation: U,
                    id: $,
                    deleted: !1,
                  };
                }
                let q = super.deserialize(_, k, it);
                return (
                  et(q, E, _.fontSize),
                  et(q, O, c.Util.makeHexColor(..._.color)),
                  et(q, A, _.value),
                  (q.annotationElementId = _.id || null),
                  et(q, f, H),
                  q
                );
              }
              serialize(_ = !1) {
                if (this.isEmpty()) return null;
                if (this.deleted) return { pageIndex: this.pageIndex, id: this.annotationElementId, deleted: !0 };
                let k = o._internalPadding * this.parentScale,
                  it = this.getRect(k, k),
                  H = lt.AnnotationEditor._colorManager.convert(
                    this.isAttachedToDOM ? getComputedStyle(this.editorDiv).color : t(this, O),
                  ),
                  q = {
                    annotationType: c.AnnotationEditorType.FREETEXT,
                    color: H,
                    fontSize: t(this, E),
                    value: t(this, A),
                    pageIndex: this.pageIndex,
                    rect: it,
                    rotation: this.rotation,
                    structTreeParentId: this._structTreeParentId,
                  };
                return _
                  ? q
                  : this.annotationElementId && !z(this, h, Ui).call(this, q)
                    ? null
                    : ((q.id = this.annotationElementId), q);
              }
            };
            (B = new WeakMap()),
              (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakSet()),
              (Oi = function (_) {
                let k = (H) => {
                    (this.editorDiv.style.fontSize = `calc(${H}px * var(--scale-factor))`),
                      this.translate(0, -(H - t(this, E)) * this.parentScale),
                      et(this, E, H),
                      z(this, h, _e).call(this);
                  },
                  it = t(this, E);
                this.addCommands({
                  cmd: () => {
                    k(_);
                  },
                  undo: () => {
                    k(it);
                  },
                  mustExec: !0,
                  type: c.AnnotationEditorParamsType.FREETEXT_SIZE,
                  overwriteIfSameType: !0,
                  keepUndo: !0,
                });
              }),
              (Ni = function (_) {
                let k = t(this, O);
                this.addCommands({
                  cmd: () => {
                    et(this, O, (this.editorDiv.style.color = _));
                  },
                  undo: () => {
                    et(this, O, (this.editorDiv.style.color = k));
                  },
                  mustExec: !0,
                  type: c.AnnotationEditorParamsType.FREETEXT_COLOR,
                  overwriteIfSameType: !0,
                  keepUndo: !0,
                });
              }),
              (Bi = function () {
                let _ = this.editorDiv.getElementsByTagName("div");
                if (_.length === 0) return this.editorDiv.innerText;
                let k = [];
                for (let it of _) k.push(it.innerText.replace(/\r\n?|\n/, ""));
                return k.join(`
`);
              }),
              (_e = function () {
                let [_, k] = this.parentDimensions,
                  it;
                if (this.isAttachedToDOM) it = this.div.getBoundingClientRect();
                else {
                  let { currentLayer: H, div: q } = this,
                    j = q.style.display;
                  (q.style.display = "hidden"),
                    H.div.append(this.div),
                    (it = q.getBoundingClientRect()),
                    q.remove(),
                    (q.style.display = j);
                }
                this.rotation % 180 === this.parentRotation % 180
                  ? ((this.width = it.width / _), (this.height = it.height / k))
                  : ((this.width = it.height / _), (this.height = it.width / k)),
                  this.fixAndSetPosition();
              }),
              (oi = function () {
                if ((this.editorDiv.replaceChildren(), !!t(this, A)))
                  for (let _ of t(this, A).split(`
`)) {
                    let k = document.createElement("div");
                    k.append(_ ? document.createTextNode(_) : document.createElement("br")), this.editorDiv.append(k);
                  }
              }),
              (Ui = function (_) {
                let { value: k, fontSize: it, color: H, rect: q, pageIndex: j } = t(this, f);
                return (
                  _.value !== k ||
                  _.fontSize !== it ||
                  _.rect.some((rt, C) => Math.abs(rt - q[C]) >= 1) ||
                  _.color.some((rt, C) => rt !== H[C]) ||
                  _.pageIndex !== j
                );
              }),
              (li = function (_ = !1) {
                if (!this.annotationElementId) return;
                if ((z(this, h, _e).call(this), !_ && (this.width === 0 || this.height === 0))) {
                  setTimeout(() => z(this, h, li).call(this, !0), 0);
                  return;
                }
                let k = o._internalPadding * this.parentScale;
                t(this, f).rect = this.getRect(k, k);
              }),
              Jt(o, "_freeTextDefaultContent", ""),
              Jt(o, "_internalPadding", 0),
              Jt(o, "_defaultColor", null),
              Jt(o, "_defaultFontSize", 10),
              Jt(o, "_type", "freetext");
            let gt = o;
            g.FreeTextEditor = gt;
          },
          (xt, g, ft) => {
            var d,
              x,
              ae,
              ji,
              st,
              ct,
              ht,
              pt,
              At,
              yt,
              Y,
              Z,
              u,
              F,
              X,
              K,
              ut,
              vt,
              _t,
              V,
              wt,
              Et,
              Hi,
              Fe,
              ci,
              hi,
              Nt,
              Wt,
              Vt,
              bt,
              tt,
              nt,
              kt,
              di,
              zt,
              D,
              dt,
              Ct,
              Wi,
              ui;
            Object.defineProperty(g, "__esModule", { value: !0 }),
              (g.StampAnnotationElement =
                g.InkAnnotationElement =
                g.FreeTextAnnotationElement =
                g.AnnotationLayer =
                  void 0);
            var c = ft(1),
              M = ft(6),
              lt = ft(3),
              Q = ft(30),
              gt = ft(31),
              B = ft(32);
            let R = 1e3,
              p = 9,
              N = new WeakSet();
            function O(Pt) {
              return { width: Pt[2] - Pt[0], height: Pt[3] - Pt[1] };
            }
            class A {
              static create(w) {
                switch (w.data.annotationType) {
                  case c.AnnotationType.LINK:
                    return new E(w);
                  case c.AnnotationType.TEXT:
                    return new f(w);
                  case c.AnnotationType.WIDGET:
                    switch (w.data.fieldType) {
                      case "Tx":
                        return new m(w);
                      case "Btn":
                        return w.data.radioButton ? new r(w) : w.data.checkBox ? new y(w) : new l(w);
                      case "Ch":
                        return new s(w);
                      case "Sig":
                        return new I(w);
                    }
                    return new h(w);
                  case c.AnnotationType.POPUP:
                    return new a(w);
                  case c.AnnotationType.FREETEXT:
                    return new L(w);
                  case c.AnnotationType.LINE:
                    return new n(w);
                  case c.AnnotationType.SQUARE:
                    return new _(w);
                  case c.AnnotationType.CIRCLE:
                    return new k(w);
                  case c.AnnotationType.POLYLINE:
                    return new it(w);
                  case c.AnnotationType.CARET:
                    return new q(w);
                  case c.AnnotationType.INK:
                    return new j(w);
                  case c.AnnotationType.POLYGON:
                    return new H(w);
                  case c.AnnotationType.HIGHLIGHT:
                    return new rt(w);
                  case c.AnnotationType.UNDERLINE:
                    return new C(w);
                  case c.AnnotationType.SQUIGGLY:
                    return new U(w);
                  case c.AnnotationType.STRIKEOUT:
                    return new $(w);
                  case c.AnnotationType.STAMP:
                    return new S(w);
                  case c.AnnotationType.FILEATTACHMENT:
                    return new e(w);
                  default:
                    return new b(w);
                }
              }
            }
            let T = class T {
              constructor(w, { isRenderable: v = !1, ignoreBorder: W = !1, createQuadrilaterals: at = !1 } = {}) {
                J(this, d, !1);
                (this.isRenderable = v),
                  (this.data = w.data),
                  (this.layer = w.layer),
                  (this.linkService = w.linkService),
                  (this.downloadManager = w.downloadManager),
                  (this.imageResourcesPath = w.imageResourcesPath),
                  (this.renderForms = w.renderForms),
                  (this.svgFactory = w.svgFactory),
                  (this.annotationStorage = w.annotationStorage),
                  (this.enableScripting = w.enableScripting),
                  (this.hasJSActions = w.hasJSActions),
                  (this._fieldObjects = w.fieldObjects),
                  (this.parent = w.parent),
                  v && (this.container = this._createContainer(W)),
                  at && this._createQuadrilaterals();
              }
              static _hasPopupData({ titleObj: w, contentsObj: v, richText: W }) {
                return !!((w != null && w.str) || (v != null && v.str) || (W != null && W.str));
              }
              get hasPopupData() {
                return T._hasPopupData(this.data);
              }
              _createContainer(w) {
                let {
                    data: v,
                    parent: { page: W, viewport: at },
                  } = this,
                  ot = document.createElement("section");
                ot.setAttribute("data-annotation-id", v.id),
                  this instanceof h || (ot.tabIndex = R),
                  (ot.style.zIndex = this.parent.zIndex++),
                  this.data.popupRef && ot.setAttribute("aria-haspopup", "dialog"),
                  v.noRotate && ot.classList.add("norotate");
                let { pageWidth: mt, pageHeight: St, pageX: It, pageY: Ft } = at.rawDims;
                if (!v.rect || this instanceof a) {
                  let { rotation: Ut } = v;
                  return !v.hasOwnCanvas && Ut !== 0 && this.setRotation(Ut, ot), ot;
                }
                let { width: Tt, height: Ht } = O(v.rect),
                  Rt = c.Util.normalizeRect([
                    v.rect[0],
                    W.view[3] - v.rect[1] + W.view[1],
                    v.rect[2],
                    W.view[3] - v.rect[3] + W.view[1],
                  ]);
                if (!w && v.borderStyle.width > 0) {
                  ot.style.borderWidth = `${v.borderStyle.width}px`;
                  let Ut = v.borderStyle.horizontalCornerRadius,
                    Gt = v.borderStyle.verticalCornerRadius;
                  if (Ut > 0 || Gt > 0) {
                    let Kt = `calc(${Ut}px * var(--scale-factor)) / calc(${Gt}px * var(--scale-factor))`;
                    ot.style.borderRadius = Kt;
                  } else if (this instanceof r) {
                    let Kt = `calc(${Tt}px * var(--scale-factor)) / calc(${Ht}px * var(--scale-factor))`;
                    ot.style.borderRadius = Kt;
                  }
                  switch (v.borderStyle.style) {
                    case c.AnnotationBorderStyleType.SOLID:
                      ot.style.borderStyle = "solid";
                      break;
                    case c.AnnotationBorderStyleType.DASHED:
                      ot.style.borderStyle = "dashed";
                      break;
                    case c.AnnotationBorderStyleType.BEVELED:
                      (0, c.warn)("Unimplemented border style: beveled");
                      break;
                    case c.AnnotationBorderStyleType.INSET:
                      (0, c.warn)("Unimplemented border style: inset");
                      break;
                    case c.AnnotationBorderStyleType.UNDERLINE:
                      ot.style.borderBottomStyle = "solid";
                      break;
                    default:
                      break;
                  }
                  let $t = v.borderColor || null;
                  $t
                    ? (et(this, d, !0), (ot.style.borderColor = c.Util.makeHexColor($t[0] | 0, $t[1] | 0, $t[2] | 0)))
                    : (ot.style.borderWidth = 0);
                }
                (ot.style.left = `${(100 * (Rt[0] - It)) / mt}%`), (ot.style.top = `${(100 * (Rt[1] - Ft)) / St}%`);
                let { rotation: Lt } = v;
                return (
                  v.hasOwnCanvas || Lt === 0
                    ? ((ot.style.width = `${(100 * Tt) / mt}%`), (ot.style.height = `${(100 * Ht) / St}%`))
                    : this.setRotation(Lt, ot),
                  ot
                );
              }
              setRotation(w, v = this.container) {
                if (!this.data.rect) return;
                let { pageWidth: W, pageHeight: at } = this.parent.viewport.rawDims,
                  { width: ot, height: mt } = O(this.data.rect),
                  St,
                  It;
                w % 180 === 0
                  ? ((St = (100 * ot) / W), (It = (100 * mt) / at))
                  : ((St = (100 * mt) / W), (It = (100 * ot) / at)),
                  (v.style.width = `${St}%`),
                  (v.style.height = `${It}%`),
                  v.setAttribute("data-main-rotation", (360 - w) % 360);
              }
              get _commonActions() {
                let w = (v, W, at) => {
                  let ot = at.detail[v],
                    mt = ot[0],
                    St = ot.slice(1);
                  (at.target.style[W] = Q.ColorConverters[`${mt}_HTML`](St)),
                    this.annotationStorage.setValue(this.data.id, { [W]: Q.ColorConverters[`${mt}_rgb`](St) });
                };
                return (0, c.shadow)(this, "_commonActions", {
                  display: (v) => {
                    let { display: W } = v.detail,
                      at = W % 2 === 1;
                    (this.container.style.visibility = at ? "hidden" : "visible"),
                      this.annotationStorage.setValue(this.data.id, { noView: at, noPrint: W === 1 || W === 2 });
                  },
                  print: (v) => {
                    this.annotationStorage.setValue(this.data.id, { noPrint: !v.detail.print });
                  },
                  hidden: (v) => {
                    let { hidden: W } = v.detail;
                    (this.container.style.visibility = W ? "hidden" : "visible"),
                      this.annotationStorage.setValue(this.data.id, { noPrint: W, noView: W });
                  },
                  focus: (v) => {
                    setTimeout(() => v.target.focus({ preventScroll: !1 }), 0);
                  },
                  userName: (v) => {
                    v.target.title = v.detail.userName;
                  },
                  readonly: (v) => {
                    v.target.disabled = v.detail.readonly;
                  },
                  required: (v) => {
                    this._setRequired(v.target, v.detail.required);
                  },
                  bgColor: (v) => {
                    w("bgColor", "backgroundColor", v);
                  },
                  fillColor: (v) => {
                    w("fillColor", "backgroundColor", v);
                  },
                  fgColor: (v) => {
                    w("fgColor", "color", v);
                  },
                  textColor: (v) => {
                    w("textColor", "color", v);
                  },
                  borderColor: (v) => {
                    w("borderColor", "borderColor", v);
                  },
                  strokeColor: (v) => {
                    w("strokeColor", "borderColor", v);
                  },
                  rotation: (v) => {
                    let W = v.detail.rotation;
                    this.setRotation(W), this.annotationStorage.setValue(this.data.id, { rotation: W });
                  },
                });
              }
              _dispatchEventFromSandbox(w, v) {
                let W = this._commonActions;
                for (let at of Object.keys(v.detail)) {
                  let ot = w[at] || W[at];
                  ot == null || ot(v);
                }
              }
              _setDefaultPropertiesFromJS(w) {
                if (!this.enableScripting) return;
                let v = this.annotationStorage.getRawValue(this.data.id);
                if (!v) return;
                let W = this._commonActions;
                for (let [at, ot] of Object.entries(v)) {
                  let mt = W[at];
                  if (mt) {
                    let St = { detail: { [at]: ot }, target: w };
                    mt(St), delete v[at];
                  }
                }
              }
              _createQuadrilaterals() {
                if (!this.container) return;
                let { quadPoints: w } = this.data;
                if (!w) return;
                let [v, W, at, ot] = this.data.rect;
                if (w.length === 1) {
                  let [, { x: Gt, y: $t }, { x: Kt, y: Zt }] = w[0];
                  if (at === Gt && ot === $t && v === Kt && W === Zt) return;
                }
                let { style: mt } = this.container,
                  St;
                if (t(this, d)) {
                  let { borderColor: Gt, borderWidth: $t } = mt;
                  (mt.borderWidth = 0),
                    (St = [
                      "url('data:image/svg+xml;utf8,",
                      '<svg xmlns="http://www.w3.org/2000/svg"',
                      ' preserveAspectRatio="none" viewBox="0 0 1 1">',
                      `<g fill="transparent" stroke="${Gt}" stroke-width="${$t}">`,
                    ]),
                    this.container.classList.add("hasBorder");
                }
                let It = at - v,
                  Ft = ot - W,
                  { svgFactory: Tt } = this,
                  Ht = Tt.createElement("svg");
                Ht.classList.add("quadrilateralsContainer"), Ht.setAttribute("width", 0), Ht.setAttribute("height", 0);
                let Rt = Tt.createElement("defs");
                Ht.append(Rt);
                let Lt = Tt.createElement("clipPath"),
                  Ut = `clippath_${this.data.id}`;
                Lt.setAttribute("id", Ut), Lt.setAttribute("clipPathUnits", "objectBoundingBox"), Rt.append(Lt);
                for (let [, { x: Gt, y: $t }, { x: Kt, y: Zt }] of w) {
                  let Qt = Tt.createElement("rect"),
                    ee = (Kt - v) / It,
                    se = (ot - $t) / Ft,
                    ne = (Gt - Kt) / It,
                    vi = ($t - Zt) / Ft;
                  Qt.setAttribute("x", ee),
                    Qt.setAttribute("y", se),
                    Qt.setAttribute("width", ne),
                    Qt.setAttribute("height", vi),
                    Lt.append(Qt),
                    St == null ||
                      St.push(
                        `<rect vector-effect="non-scaling-stroke" x="${ee}" y="${se}" width="${ne}" height="${vi}"/>`,
                      );
                }
                t(this, d) && (St.push("</g></svg>')"), (mt.backgroundImage = St.join(""))),
                  this.container.append(Ht),
                  (this.container.style.clipPath = `url(#${Ut})`);
              }
              _createPopup() {
                let { container: w, data: v } = this;
                w.setAttribute("aria-haspopup", "dialog");
                let W = new a({
                  data: {
                    color: v.color,
                    titleObj: v.titleObj,
                    modificationDate: v.modificationDate,
                    contentsObj: v.contentsObj,
                    richText: v.richText,
                    parentRect: v.rect,
                    borderStyle: 0,
                    id: `popup_${v.id}`,
                    rotation: v.rotation,
                  },
                  parent: this.parent,
                  elements: [this],
                });
                this.parent.div.append(W.render());
              }
              render() {
                (0, c.unreachable)("Abstract method `AnnotationElement.render` called");
              }
              _getElementsByName(w, v = null) {
                let W = [];
                if (this._fieldObjects) {
                  let at = this._fieldObjects[w];
                  if (at)
                    for (let { page: ot, id: mt, exportValues: St } of at) {
                      if (ot === -1 || mt === v) continue;
                      let It = typeof St == "string" ? St : null,
                        Ft = document.querySelector(`[data-element-id="${mt}"]`);
                      if (Ft && !N.has(Ft)) {
                        (0, c.warn)(`_getElementsByName - element not allowed: ${mt}`);
                        continue;
                      }
                      W.push({ id: mt, exportValue: It, domElement: Ft });
                    }
                  return W;
                }
                for (let at of document.getElementsByName(w)) {
                  let { exportValue: ot } = at,
                    mt = at.getAttribute("data-element-id");
                  mt !== v && N.has(at) && W.push({ id: mt, exportValue: ot, domElement: at });
                }
                return W;
              }
              show() {
                var w;
                this.container && (this.container.hidden = !1), (w = this.popup) == null || w.maybeShow();
              }
              hide() {
                var w;
                this.container && (this.container.hidden = !0), (w = this.popup) == null || w.forceHide();
              }
              getElementsToTriggerPopup() {
                return this.container;
              }
              addHighlightArea() {
                let w = this.getElementsToTriggerPopup();
                if (Array.isArray(w)) for (let v of w) v.classList.add("highlightArea");
                else w.classList.add("highlightArea");
              }
              _editOnDoubleClick() {
                let {
                  annotationEditorType: w,
                  data: { id: v },
                } = this;
                this.container.addEventListener("dblclick", () => {
                  var W;
                  (W = this.linkService.eventBus) == null ||
                    W.dispatch("switchannotationeditormode", { source: this, mode: w, editId: v });
                });
              }
            };
            d = new WeakMap();
            let b = T;
            class E extends b {
              constructor(v, W = null) {
                super(v, { isRenderable: !0, ignoreBorder: !!(W != null && W.ignoreBorder), createQuadrilaterals: !0 });
                J(this, x);
                this.isTooltipOnly = v.data.isTooltipOnly;
              }
              render() {
                let { data: v, linkService: W } = this,
                  at = document.createElement("a");
                at.setAttribute("data-element-id", v.id);
                let ot = !1;
                return (
                  v.url
                    ? (W.addLinkAttributes(at, v.url, v.newWindow), (ot = !0))
                    : v.action
                      ? (this._bindNamedAction(at, v.action), (ot = !0))
                      : v.attachment
                        ? (this._bindAttachment(at, v.attachment), (ot = !0))
                        : v.setOCGState
                          ? (z(this, x, ji).call(this, at, v.setOCGState), (ot = !0))
                          : v.dest
                            ? (this._bindLink(at, v.dest), (ot = !0))
                            : (v.actions &&
                                (v.actions.Action || v.actions["Mouse Up"] || v.actions["Mouse Down"]) &&
                                this.enableScripting &&
                                this.hasJSActions &&
                                (this._bindJSAction(at, v), (ot = !0)),
                              v.resetForm
                                ? (this._bindResetFormAction(at, v.resetForm), (ot = !0))
                                : this.isTooltipOnly && !ot && (this._bindLink(at, ""), (ot = !0))),
                  this.container.classList.add("linkAnnotation"),
                  ot && this.container.append(at),
                  this.container
                );
              }
              _bindLink(v, W) {
                (v.href = this.linkService.getDestinationHash(W)),
                  (v.onclick = () => (W && this.linkService.goToDestination(W), !1)),
                  (W || W === "") && z(this, x, ae).call(this);
              }
              _bindNamedAction(v, W) {
                (v.href = this.linkService.getAnchorUrl("")),
                  (v.onclick = () => (this.linkService.executeNamedAction(W), !1)),
                  z(this, x, ae).call(this);
              }
              _bindAttachment(v, W) {
                (v.href = this.linkService.getAnchorUrl("")),
                  (v.onclick = () => {
                    var at;
                    return (
                      (at = this.downloadManager) == null ||
                        at.openOrDownloadData(this.container, W.content, W.filename),
                      !1
                    );
                  }),
                  z(this, x, ae).call(this);
              }
              _bindJSAction(v, W) {
                v.href = this.linkService.getAnchorUrl("");
                let at = new Map([
                  ["Action", "onclick"],
                  ["Mouse Up", "onmouseup"],
                  ["Mouse Down", "onmousedown"],
                ]);
                for (let ot of Object.keys(W.actions)) {
                  let mt = at.get(ot);
                  mt &&
                    (v[mt] = () => {
                      var St;
                      return (
                        (St = this.linkService.eventBus) == null ||
                          St.dispatch("dispatcheventinsandbox", { source: this, detail: { id: W.id, name: ot } }),
                        !1
                      );
                    });
                }
                v.onclick || (v.onclick = () => !1), z(this, x, ae).call(this);
              }
              _bindResetFormAction(v, W) {
                let at = v.onclick;
                if (
                  (at || (v.href = this.linkService.getAnchorUrl("")), z(this, x, ae).call(this), !this._fieldObjects)
                ) {
                  (0, c.warn)(
                    '_bindResetFormAction - "resetForm" action not supported, ensure that the `fieldObjects` parameter is provided.',
                  ),
                    at || (v.onclick = () => !1);
                  return;
                }
                v.onclick = () => {
                  var Ht;
                  at == null || at();
                  let { fields: ot, refs: mt, include: St } = W,
                    It = [];
                  if (ot.length !== 0 || mt.length !== 0) {
                    let Rt = new Set(mt);
                    for (let Lt of ot) {
                      let Ut = this._fieldObjects[Lt] || [];
                      for (let { id: Gt } of Ut) Rt.add(Gt);
                    }
                    for (let Lt of Object.values(this._fieldObjects))
                      for (let Ut of Lt) Rt.has(Ut.id) === St && It.push(Ut);
                  } else for (let Rt of Object.values(this._fieldObjects)) It.push(...Rt);
                  let Ft = this.annotationStorage,
                    Tt = [];
                  for (let Rt of It) {
                    let { id: Lt } = Rt;
                    switch ((Tt.push(Lt), Rt.type)) {
                      case "text": {
                        let Gt = Rt.defaultValue || "";
                        Ft.setValue(Lt, { value: Gt });
                        break;
                      }
                      case "checkbox":
                      case "radiobutton": {
                        let Gt = Rt.defaultValue === Rt.exportValues;
                        Ft.setValue(Lt, { value: Gt });
                        break;
                      }
                      case "combobox":
                      case "listbox": {
                        let Gt = Rt.defaultValue || "";
                        Ft.setValue(Lt, { value: Gt });
                        break;
                      }
                      default:
                        continue;
                    }
                    let Ut = document.querySelector(`[data-element-id="${Lt}"]`);
                    if (Ut) {
                      if (!N.has(Ut)) {
                        (0, c.warn)(`_bindResetFormAction - element not allowed: ${Lt}`);
                        continue;
                      }
                    } else continue;
                    Ut.dispatchEvent(new Event("resetform"));
                  }
                  return (
                    this.enableScripting &&
                      ((Ht = this.linkService.eventBus) == null ||
                        Ht.dispatch("dispatcheventinsandbox", {
                          source: this,
                          detail: { id: "app", ids: Tt, name: "ResetForm" },
                        })),
                    !1
                  );
                };
              }
            }
            (x = new WeakSet()),
              (ae = function () {
                this.container.setAttribute("data-internal-link", "");
              }),
              (ji = function (v, W) {
                (v.href = this.linkService.getAnchorUrl("")),
                  (v.onclick = () => (this.linkService.executeSetOCGState(W), !1)),
                  z(this, x, ae).call(this);
              });
            class f extends b {
              constructor(w) {
                super(w, { isRenderable: !0 });
              }
              render() {
                this.container.classList.add("textAnnotation");
                let w = document.createElement("img");
                return (
                  (w.src = this.imageResourcesPath + "annotation-" + this.data.name.toLowerCase() + ".svg"),
                  (w.alt = "[{{type}} Annotation]"),
                  (w.dataset.l10nId = "text_annotation_type"),
                  (w.dataset.l10nArgs = JSON.stringify({ type: this.data.name })),
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container.append(w),
                  this.container
                );
              }
            }
            class h extends b {
              render() {
                return this.data.alternativeText && (this.container.title = this.data.alternativeText), this.container;
              }
              showElementAndHideCanvas(w) {
                var v;
                this.data.hasOwnCanvas &&
                  (((v = w.previousSibling) == null ? void 0 : v.nodeName) === "CANVAS" &&
                    (w.previousSibling.hidden = !0),
                  (w.hidden = !1));
              }
              _getKeyModifier(w) {
                let { isWin: v, isMac: W } = c.FeatureTest.platform;
                return (v && w.ctrlKey) || (W && w.metaKey);
              }
              _setEventListener(w, v, W, at, ot) {
                W.includes("mouse")
                  ? w.addEventListener(W, (mt) => {
                      var St;
                      (St = this.linkService.eventBus) == null ||
                        St.dispatch("dispatcheventinsandbox", {
                          source: this,
                          detail: {
                            id: this.data.id,
                            name: at,
                            value: ot(mt),
                            shift: mt.shiftKey,
                            modifier: this._getKeyModifier(mt),
                          },
                        });
                    })
                  : w.addEventListener(W, (mt) => {
                      var St;
                      if (W === "blur") {
                        if (!v.focused || !mt.relatedTarget) return;
                        v.focused = !1;
                      } else if (W === "focus") {
                        if (v.focused) return;
                        v.focused = !0;
                      }
                      ot &&
                        ((St = this.linkService.eventBus) == null ||
                          St.dispatch("dispatcheventinsandbox", {
                            source: this,
                            detail: { id: this.data.id, name: at, value: ot(mt) },
                          }));
                    });
              }
              _setEventListeners(w, v, W, at) {
                var ot, mt, St;
                for (let [It, Ft] of W)
                  (Ft === "Action" || ((ot = this.data.actions) != null && ot[Ft])) &&
                    ((Ft === "Focus" || Ft === "Blur") && (v || (v = { focused: !1 })),
                    this._setEventListener(w, v, It, Ft, at),
                    Ft === "Focus" && !((mt = this.data.actions) != null && mt.Blur)
                      ? this._setEventListener(w, v, "blur", "Blur", null)
                      : Ft === "Blur" &&
                        !((St = this.data.actions) != null && St.Focus) &&
                        this._setEventListener(w, v, "focus", "Focus", null));
              }
              _setBackgroundColor(w) {
                let v = this.data.backgroundColor || null;
                w.style.backgroundColor = v === null ? "transparent" : c.Util.makeHexColor(v[0], v[1], v[2]);
              }
              _setTextStyle(w) {
                let v = ["left", "center", "right"],
                  { fontColor: W } = this.data.defaultAppearanceData,
                  at = this.data.defaultAppearanceData.fontSize || p,
                  ot = w.style,
                  mt,
                  St = 2,
                  It = (Ft) => Math.round(10 * Ft) / 10;
                if (this.data.multiLine) {
                  let Ft = Math.abs(this.data.rect[3] - this.data.rect[1] - St),
                    Tt = Math.round(Ft / (c.LINE_FACTOR * at)) || 1,
                    Ht = Ft / Tt;
                  mt = Math.min(at, It(Ht / c.LINE_FACTOR));
                } else {
                  let Ft = Math.abs(this.data.rect[3] - this.data.rect[1] - St);
                  mt = Math.min(at, It(Ft / c.LINE_FACTOR));
                }
                (ot.fontSize = `calc(${mt}px * var(--scale-factor))`),
                  (ot.color = c.Util.makeHexColor(W[0], W[1], W[2])),
                  this.data.textAlignment !== null && (ot.textAlign = v[this.data.textAlignment]);
              }
              _setRequired(w, v) {
                v ? w.setAttribute("required", !0) : w.removeAttribute("required"), w.setAttribute("aria-required", v);
              }
            }
            class m extends h {
              constructor(w) {
                let v = w.renderForms || (!w.data.hasAppearance && !!w.data.fieldValue);
                super(w, { isRenderable: v });
              }
              setPropertyOnSiblings(w, v, W, at) {
                let ot = this.annotationStorage;
                for (let mt of this._getElementsByName(w.name, w.id))
                  mt.domElement && (mt.domElement[v] = W), ot.setValue(mt.id, { [at]: W });
              }
              render() {
                var at, ot;
                let w = this.annotationStorage,
                  v = this.data.id;
                this.container.classList.add("textWidgetAnnotation");
                let W = null;
                if (this.renderForms) {
                  let mt = w.getValue(v, { value: this.data.fieldValue }),
                    St = mt.value || "",
                    It = w.getValue(v, { charLimit: this.data.maxLen }).charLimit;
                  It && St.length > It && (St = St.slice(0, It));
                  let Ft =
                    mt.formattedValue ||
                    ((at = this.data.textContent) == null
                      ? void 0
                      : at.join(`
`)) ||
                    null;
                  Ft && this.data.comb && (Ft = Ft.replaceAll(/\s+/g, ""));
                  let Tt = { userValue: St, formattedValue: Ft, lastCommittedValue: null, commitKey: 1, focused: !1 };
                  this.data.multiLine
                    ? ((W = document.createElement("textarea")),
                      (W.textContent = Ft != null ? Ft : St),
                      this.data.doNotScroll && (W.style.overflowY = "hidden"))
                    : ((W = document.createElement("input")),
                      (W.type = "text"),
                      W.setAttribute("value", Ft != null ? Ft : St),
                      this.data.doNotScroll && (W.style.overflowX = "hidden")),
                    this.data.hasOwnCanvas && (W.hidden = !0),
                    N.add(W),
                    W.setAttribute("data-element-id", v),
                    (W.disabled = this.data.readOnly),
                    (W.name = this.data.fieldName),
                    (W.tabIndex = R),
                    this._setRequired(W, this.data.required),
                    It && (W.maxLength = It),
                    W.addEventListener("input", (Rt) => {
                      w.setValue(v, { value: Rt.target.value }),
                        this.setPropertyOnSiblings(W, "value", Rt.target.value, "value"),
                        (Tt.formattedValue = null);
                    }),
                    W.addEventListener("resetform", (Rt) => {
                      var Ut;
                      let Lt = (Ut = this.data.defaultFieldValue) != null ? Ut : "";
                      (W.value = Tt.userValue = Lt), (Tt.formattedValue = null);
                    });
                  let Ht = (Rt) => {
                    let { formattedValue: Lt } = Tt;
                    Lt != null && (Rt.target.value = Lt), (Rt.target.scrollLeft = 0);
                  };
                  if (this.enableScripting && this.hasJSActions) {
                    W.addEventListener("focus", (Lt) => {
                      if (Tt.focused) return;
                      let { target: Ut } = Lt;
                      Tt.userValue && (Ut.value = Tt.userValue),
                        (Tt.lastCommittedValue = Ut.value),
                        (Tt.commitKey = 1),
                        (Tt.focused = !0);
                    }),
                      W.addEventListener("updatefromsandbox", (Lt) => {
                        this.showElementAndHideCanvas(Lt.target);
                        let Ut = {
                          value(Gt) {
                            var $t;
                            (Tt.userValue = ($t = Gt.detail.value) != null ? $t : ""),
                              w.setValue(v, { value: Tt.userValue.toString() }),
                              (Gt.target.value = Tt.userValue);
                          },
                          formattedValue(Gt) {
                            let { formattedValue: $t } = Gt.detail;
                            (Tt.formattedValue = $t),
                              $t != null && Gt.target !== document.activeElement && (Gt.target.value = $t),
                              w.setValue(v, { formattedValue: $t });
                          },
                          selRange(Gt) {
                            Gt.target.setSelectionRange(...Gt.detail.selRange);
                          },
                          charLimit: (Gt) => {
                            var Qt;
                            let { charLimit: $t } = Gt.detail,
                              { target: Kt } = Gt;
                            if ($t === 0) {
                              Kt.removeAttribute("maxLength");
                              return;
                            }
                            Kt.setAttribute("maxLength", $t);
                            let Zt = Tt.userValue;
                            !Zt ||
                              Zt.length <= $t ||
                              ((Zt = Zt.slice(0, $t)),
                              (Kt.value = Tt.userValue = Zt),
                              w.setValue(v, { value: Zt }),
                              (Qt = this.linkService.eventBus) == null ||
                                Qt.dispatch("dispatcheventinsandbox", {
                                  source: this,
                                  detail: {
                                    id: v,
                                    name: "Keystroke",
                                    value: Zt,
                                    willCommit: !0,
                                    commitKey: 1,
                                    selStart: Kt.selectionStart,
                                    selEnd: Kt.selectionEnd,
                                  },
                                }));
                          },
                        };
                        this._dispatchEventFromSandbox(Ut, Lt);
                      }),
                      W.addEventListener("keydown", (Lt) => {
                        var $t;
                        Tt.commitKey = 1;
                        let Ut = -1;
                        if (
                          (Lt.key === "Escape"
                            ? (Ut = 0)
                            : Lt.key === "Enter" && !this.data.multiLine
                              ? (Ut = 2)
                              : Lt.key === "Tab" && (Tt.commitKey = 3),
                          Ut === -1)
                        )
                          return;
                        let { value: Gt } = Lt.target;
                        Tt.lastCommittedValue !== Gt &&
                          ((Tt.lastCommittedValue = Gt),
                          (Tt.userValue = Gt),
                          ($t = this.linkService.eventBus) == null ||
                            $t.dispatch("dispatcheventinsandbox", {
                              source: this,
                              detail: {
                                id: v,
                                name: "Keystroke",
                                value: Gt,
                                willCommit: !0,
                                commitKey: Ut,
                                selStart: Lt.target.selectionStart,
                                selEnd: Lt.target.selectionEnd,
                              },
                            }));
                      });
                    let Rt = Ht;
                    (Ht = null),
                      W.addEventListener("blur", (Lt) => {
                        var Gt;
                        if (!Tt.focused || !Lt.relatedTarget) return;
                        Tt.focused = !1;
                        let { value: Ut } = Lt.target;
                        (Tt.userValue = Ut),
                          Tt.lastCommittedValue !== Ut &&
                            ((Gt = this.linkService.eventBus) == null ||
                              Gt.dispatch("dispatcheventinsandbox", {
                                source: this,
                                detail: {
                                  id: v,
                                  name: "Keystroke",
                                  value: Ut,
                                  willCommit: !0,
                                  commitKey: Tt.commitKey,
                                  selStart: Lt.target.selectionStart,
                                  selEnd: Lt.target.selectionEnd,
                                },
                              })),
                          Rt(Lt);
                      }),
                      (ot = this.data.actions) != null &&
                        ot.Keystroke &&
                        W.addEventListener("beforeinput", (Lt) => {
                          var se;
                          Tt.lastCommittedValue = null;
                          let { data: Ut, target: Gt } = Lt,
                            { value: $t, selectionStart: Kt, selectionEnd: Zt } = Gt,
                            Qt = Kt,
                            ee = Zt;
                          switch (Lt.inputType) {
                            case "deleteWordBackward": {
                              let ne = $t.substring(0, Kt).match(/\w*[^\w]*$/);
                              ne && (Qt -= ne[0].length);
                              break;
                            }
                            case "deleteWordForward": {
                              let ne = $t.substring(Kt).match(/^[^\w]*\w*/);
                              ne && (ee += ne[0].length);
                              break;
                            }
                            case "deleteContentBackward":
                              Kt === Zt && (Qt -= 1);
                              break;
                            case "deleteContentForward":
                              Kt === Zt && (ee += 1);
                              break;
                          }
                          Lt.preventDefault(),
                            (se = this.linkService.eventBus) == null ||
                              se.dispatch("dispatcheventinsandbox", {
                                source: this,
                                detail: {
                                  id: v,
                                  name: "Keystroke",
                                  value: $t,
                                  change: Ut || "",
                                  willCommit: !1,
                                  selStart: Qt,
                                  selEnd: ee,
                                },
                              });
                        }),
                      this._setEventListeners(
                        W,
                        Tt,
                        [
                          ["focus", "Focus"],
                          ["blur", "Blur"],
                          ["mousedown", "Mouse Down"],
                          ["mouseenter", "Mouse Enter"],
                          ["mouseleave", "Mouse Exit"],
                          ["mouseup", "Mouse Up"],
                        ],
                        (Lt) => Lt.target.value,
                      );
                  }
                  if ((Ht && W.addEventListener("blur", Ht), this.data.comb)) {
                    let Lt = (this.data.rect[2] - this.data.rect[0]) / It;
                    W.classList.add("comb"), (W.style.letterSpacing = `calc(${Lt}px * var(--scale-factor) - 1ch)`);
                  }
                } else
                  (W = document.createElement("div")),
                    (W.textContent = this.data.fieldValue),
                    (W.style.verticalAlign = "middle"),
                    (W.style.display = "table-cell");
                return (
                  this._setTextStyle(W),
                  this._setBackgroundColor(W),
                  this._setDefaultPropertiesFromJS(W),
                  this.container.append(W),
                  this.container
                );
              }
            }
            class I extends h {
              constructor(w) {
                super(w, { isRenderable: !!w.data.hasOwnCanvas });
              }
            }
            class y extends h {
              constructor(w) {
                super(w, { isRenderable: w.renderForms });
              }
              render() {
                let w = this.annotationStorage,
                  v = this.data,
                  W = v.id,
                  at = w.getValue(W, { value: v.exportValue === v.fieldValue }).value;
                typeof at == "string" && ((at = at !== "Off"), w.setValue(W, { value: at })),
                  this.container.classList.add("buttonWidgetAnnotation", "checkBox");
                let ot = document.createElement("input");
                return (
                  N.add(ot),
                  ot.setAttribute("data-element-id", W),
                  (ot.disabled = v.readOnly),
                  this._setRequired(ot, this.data.required),
                  (ot.type = "checkbox"),
                  (ot.name = v.fieldName),
                  at && ot.setAttribute("checked", !0),
                  ot.setAttribute("exportValue", v.exportValue),
                  (ot.tabIndex = R),
                  ot.addEventListener("change", (mt) => {
                    let { name: St, checked: It } = mt.target;
                    for (let Ft of this._getElementsByName(St, W)) {
                      let Tt = It && Ft.exportValue === v.exportValue;
                      Ft.domElement && (Ft.domElement.checked = Tt), w.setValue(Ft.id, { value: Tt });
                    }
                    w.setValue(W, { value: It });
                  }),
                  ot.addEventListener("resetform", (mt) => {
                    let St = v.defaultFieldValue || "Off";
                    mt.target.checked = St === v.exportValue;
                  }),
                  this.enableScripting &&
                    this.hasJSActions &&
                    (ot.addEventListener("updatefromsandbox", (mt) => {
                      let St = {
                        value(It) {
                          (It.target.checked = It.detail.value !== "Off"), w.setValue(W, { value: It.target.checked });
                        },
                      };
                      this._dispatchEventFromSandbox(St, mt);
                    }),
                    this._setEventListeners(
                      ot,
                      null,
                      [
                        ["change", "Validate"],
                        ["change", "Action"],
                        ["focus", "Focus"],
                        ["blur", "Blur"],
                        ["mousedown", "Mouse Down"],
                        ["mouseenter", "Mouse Enter"],
                        ["mouseleave", "Mouse Exit"],
                        ["mouseup", "Mouse Up"],
                      ],
                      (mt) => mt.target.checked,
                    )),
                  this._setBackgroundColor(ot),
                  this._setDefaultPropertiesFromJS(ot),
                  this.container.append(ot),
                  this.container
                );
              }
            }
            class r extends h {
              constructor(w) {
                super(w, { isRenderable: w.renderForms });
              }
              render() {
                this.container.classList.add("buttonWidgetAnnotation", "radioButton");
                let w = this.annotationStorage,
                  v = this.data,
                  W = v.id,
                  at = w.getValue(W, { value: v.fieldValue === v.buttonValue }).value;
                typeof at == "string" && ((at = at !== v.buttonValue), w.setValue(W, { value: at }));
                let ot = document.createElement("input");
                if (
                  (N.add(ot),
                  ot.setAttribute("data-element-id", W),
                  (ot.disabled = v.readOnly),
                  this._setRequired(ot, this.data.required),
                  (ot.type = "radio"),
                  (ot.name = v.fieldName),
                  at && ot.setAttribute("checked", !0),
                  (ot.tabIndex = R),
                  ot.addEventListener("change", (mt) => {
                    let { name: St, checked: It } = mt.target;
                    for (let Ft of this._getElementsByName(St, W)) w.setValue(Ft.id, { value: !1 });
                    w.setValue(W, { value: It });
                  }),
                  ot.addEventListener("resetform", (mt) => {
                    let St = v.defaultFieldValue;
                    mt.target.checked = St != null && St === v.buttonValue;
                  }),
                  this.enableScripting && this.hasJSActions)
                ) {
                  let mt = v.buttonValue;
                  ot.addEventListener("updatefromsandbox", (St) => {
                    let It = {
                      value: (Ft) => {
                        let Tt = mt === Ft.detail.value;
                        for (let Ht of this._getElementsByName(Ft.target.name)) {
                          let Rt = Tt && Ht.id === W;
                          Ht.domElement && (Ht.domElement.checked = Rt), w.setValue(Ht.id, { value: Rt });
                        }
                      },
                    };
                    this._dispatchEventFromSandbox(It, St);
                  }),
                    this._setEventListeners(
                      ot,
                      null,
                      [
                        ["change", "Validate"],
                        ["change", "Action"],
                        ["focus", "Focus"],
                        ["blur", "Blur"],
                        ["mousedown", "Mouse Down"],
                        ["mouseenter", "Mouse Enter"],
                        ["mouseleave", "Mouse Exit"],
                        ["mouseup", "Mouse Up"],
                      ],
                      (St) => St.target.checked,
                    );
                }
                return (
                  this._setBackgroundColor(ot),
                  this._setDefaultPropertiesFromJS(ot),
                  this.container.append(ot),
                  this.container
                );
              }
            }
            class l extends E {
              constructor(w) {
                super(w, { ignoreBorder: w.data.hasAppearance });
              }
              render() {
                let w = super.render();
                w.classList.add("buttonWidgetAnnotation", "pushButton"),
                  this.data.alternativeText && (w.title = this.data.alternativeText);
                let v = w.lastChild;
                return (
                  this.enableScripting &&
                    this.hasJSActions &&
                    v &&
                    (this._setDefaultPropertiesFromJS(v),
                    v.addEventListener("updatefromsandbox", (W) => {
                      this._dispatchEventFromSandbox({}, W);
                    })),
                  w
                );
              }
            }
            class s extends h {
              constructor(w) {
                super(w, { isRenderable: w.renderForms });
              }
              render() {
                this.container.classList.add("choiceWidgetAnnotation");
                let w = this.annotationStorage,
                  v = this.data.id,
                  W = w.getValue(v, { value: this.data.fieldValue }),
                  at = document.createElement("select");
                N.add(at),
                  at.setAttribute("data-element-id", v),
                  (at.disabled = this.data.readOnly),
                  this._setRequired(at, this.data.required),
                  (at.name = this.data.fieldName),
                  (at.tabIndex = R);
                let ot = this.data.combo && this.data.options.length > 0;
                this.data.combo || ((at.size = this.data.options.length), this.data.multiSelect && (at.multiple = !0)),
                  at.addEventListener("resetform", (Tt) => {
                    let Ht = this.data.defaultFieldValue;
                    for (let Rt of at.options) Rt.selected = Rt.value === Ht;
                  });
                for (let Tt of this.data.options) {
                  let Ht = document.createElement("option");
                  (Ht.textContent = Tt.displayValue),
                    (Ht.value = Tt.exportValue),
                    W.value.includes(Tt.exportValue) && (Ht.setAttribute("selected", !0), (ot = !1)),
                    at.append(Ht);
                }
                let mt = null;
                if (ot) {
                  let Tt = document.createElement("option");
                  (Tt.value = " "),
                    Tt.setAttribute("hidden", !0),
                    Tt.setAttribute("selected", !0),
                    at.prepend(Tt),
                    (mt = () => {
                      Tt.remove(), at.removeEventListener("input", mt), (mt = null);
                    }),
                    at.addEventListener("input", mt);
                }
                let St = (Tt) => {
                    let Ht = Tt ? "value" : "textContent",
                      { options: Rt, multiple: Lt } = at;
                    return Lt
                      ? Array.prototype.filter.call(Rt, (Ut) => Ut.selected).map((Ut) => Ut[Ht])
                      : Rt.selectedIndex === -1
                        ? null
                        : Rt[Rt.selectedIndex][Ht];
                  },
                  It = St(!1),
                  Ft = (Tt) => {
                    let Ht = Tt.target.options;
                    return Array.prototype.map.call(Ht, (Rt) => ({
                      displayValue: Rt.textContent,
                      exportValue: Rt.value,
                    }));
                  };
                return (
                  this.enableScripting && this.hasJSActions
                    ? (at.addEventListener("updatefromsandbox", (Tt) => {
                        let Ht = {
                          value(Rt) {
                            mt == null || mt();
                            let Lt = Rt.detail.value,
                              Ut = new Set(Array.isArray(Lt) ? Lt : [Lt]);
                            for (let Gt of at.options) Gt.selected = Ut.has(Gt.value);
                            w.setValue(v, { value: St(!0) }), (It = St(!1));
                          },
                          multipleSelection(Rt) {
                            at.multiple = !0;
                          },
                          remove(Rt) {
                            let Lt = at.options,
                              Ut = Rt.detail.remove;
                            (Lt[Ut].selected = !1),
                              at.remove(Ut),
                              Lt.length > 0 &&
                                Array.prototype.findIndex.call(Lt, ($t) => $t.selected) === -1 &&
                                (Lt[0].selected = !0),
                              w.setValue(v, { value: St(!0), items: Ft(Rt) }),
                              (It = St(!1));
                          },
                          clear(Rt) {
                            for (; at.length !== 0; ) at.remove(0);
                            w.setValue(v, { value: null, items: [] }), (It = St(!1));
                          },
                          insert(Rt) {
                            let { index: Lt, displayValue: Ut, exportValue: Gt } = Rt.detail.insert,
                              $t = at.children[Lt],
                              Kt = document.createElement("option");
                            (Kt.textContent = Ut),
                              (Kt.value = Gt),
                              $t ? $t.before(Kt) : at.append(Kt),
                              w.setValue(v, { value: St(!0), items: Ft(Rt) }),
                              (It = St(!1));
                          },
                          items(Rt) {
                            let { items: Lt } = Rt.detail;
                            for (; at.length !== 0; ) at.remove(0);
                            for (let Ut of Lt) {
                              let { displayValue: Gt, exportValue: $t } = Ut,
                                Kt = document.createElement("option");
                              (Kt.textContent = Gt), (Kt.value = $t), at.append(Kt);
                            }
                            at.options.length > 0 && (at.options[0].selected = !0),
                              w.setValue(v, { value: St(!0), items: Ft(Rt) }),
                              (It = St(!1));
                          },
                          indices(Rt) {
                            let Lt = new Set(Rt.detail.indices);
                            for (let Ut of Rt.target.options) Ut.selected = Lt.has(Ut.index);
                            w.setValue(v, { value: St(!0) }), (It = St(!1));
                          },
                          editable(Rt) {
                            Rt.target.disabled = !Rt.detail.editable;
                          },
                        };
                        this._dispatchEventFromSandbox(Ht, Tt);
                      }),
                      at.addEventListener("input", (Tt) => {
                        var Rt;
                        let Ht = St(!0);
                        w.setValue(v, { value: Ht }),
                          Tt.preventDefault(),
                          (Rt = this.linkService.eventBus) == null ||
                            Rt.dispatch("dispatcheventinsandbox", {
                              source: this,
                              detail: {
                                id: v,
                                name: "Keystroke",
                                value: It,
                                changeEx: Ht,
                                willCommit: !1,
                                commitKey: 1,
                                keyDown: !1,
                              },
                            });
                      }),
                      this._setEventListeners(
                        at,
                        null,
                        [
                          ["focus", "Focus"],
                          ["blur", "Blur"],
                          ["mousedown", "Mouse Down"],
                          ["mouseenter", "Mouse Enter"],
                          ["mouseleave", "Mouse Exit"],
                          ["mouseup", "Mouse Up"],
                          ["input", "Action"],
                          ["input", "Validate"],
                        ],
                        (Tt) => Tt.target.value,
                      ))
                    : at.addEventListener("input", function (Tt) {
                        w.setValue(v, { value: St(!0) });
                      }),
                  this.data.combo && this._setTextStyle(at),
                  this._setBackgroundColor(at),
                  this._setDefaultPropertiesFromJS(at),
                  this.container.append(at),
                  this.container
                );
              }
            }
            class a extends b {
              constructor(w) {
                let { data: v, elements: W } = w;
                super(w, { isRenderable: b._hasPopupData(v) }), (this.elements = W);
              }
              render() {
                this.container.classList.add("popupAnnotation");
                let w = new o({
                    container: this.container,
                    color: this.data.color,
                    titleObj: this.data.titleObj,
                    modificationDate: this.data.modificationDate,
                    contentsObj: this.data.contentsObj,
                    richText: this.data.richText,
                    rect: this.data.rect,
                    parentRect: this.data.parentRect || null,
                    parent: this.parent,
                    elements: this.elements,
                    open: this.data.open,
                  }),
                  v = [];
                for (let W of this.elements) (W.popup = w), v.push(W.data.id), W.addHighlightArea();
                return (
                  this.container.setAttribute("aria-controls", v.map((W) => `${c.AnnotationPrefix}${W}`).join(",")),
                  this.container
                );
              }
            }
            class o {
              constructor({
                container: w,
                color: v,
                elements: W,
                titleObj: at,
                modificationDate: ot,
                contentsObj: mt,
                richText: St,
                parent: It,
                rect: Ft,
                parentRect: Tt,
                open: Ht,
              }) {
                J(this, Et);
                J(this, st, null);
                J(this, ct, z(this, Et, Hi).bind(this));
                J(this, ht, z(this, Et, hi).bind(this));
                J(this, pt, z(this, Et, ci).bind(this));
                J(this, At, z(this, Et, Fe).bind(this));
                J(this, yt, null);
                J(this, Y, null);
                J(this, Z, null);
                J(this, u, null);
                J(this, F, null);
                J(this, X, null);
                J(this, K, !1);
                J(this, ut, null);
                J(this, vt, null);
                J(this, _t, null);
                J(this, V, null);
                J(this, wt, !1);
                var Lt;
                et(this, Y, w),
                  et(this, V, at),
                  et(this, Z, mt),
                  et(this, _t, St),
                  et(this, F, It),
                  et(this, yt, v),
                  et(this, vt, Ft),
                  et(this, X, Tt),
                  et(this, u, W);
                let Rt = M.PDFDateString.toDateObject(ot);
                Rt &&
                  et(
                    this,
                    st,
                    It.l10n.get("annotation_date_string", {
                      date: Rt.toLocaleDateString(),
                      time: Rt.toLocaleTimeString(),
                    }),
                  ),
                  (this.trigger = W.flatMap((Ut) => Ut.getElementsToTriggerPopup()));
                for (let Ut of this.trigger)
                  Ut.addEventListener("click", t(this, At)),
                    Ut.addEventListener("mouseenter", t(this, pt)),
                    Ut.addEventListener("mouseleave", t(this, ht)),
                    Ut.classList.add("popupTriggerArea");
                for (let Ut of W) (Lt = Ut.container) == null || Lt.addEventListener("keydown", t(this, ct));
                (t(this, Y).hidden = !0), Ht && z(this, Et, Fe).call(this);
              }
              render() {
                if (t(this, ut)) return;
                let {
                    page: { view: w },
                    viewport: {
                      rawDims: { pageWidth: v, pageHeight: W, pageX: at, pageY: ot },
                    },
                  } = t(this, F),
                  mt = et(this, ut, document.createElement("div"));
                if (((mt.className = "popup"), t(this, yt))) {
                  let Qt = (mt.style.outlineColor = c.Util.makeHexColor(...t(this, yt)));
                  CSS.supports("background-color", "color-mix(in srgb, red 30%, white)")
                    ? (mt.style.backgroundColor = `color-mix(in srgb, ${Qt} 30%, white)`)
                    : (mt.style.backgroundColor = c.Util.makeHexColor(
                        ...t(this, yt).map((se) => Math.floor(0.7 * (255 - se) + se)),
                      ));
                }
                let St = document.createElement("span");
                St.className = "header";
                let It = document.createElement("h1");
                if ((St.append(It), ({ dir: It.dir, str: It.textContent } = t(this, V)), mt.append(St), t(this, st))) {
                  let Qt = document.createElement("span");
                  Qt.classList.add("popupDate"),
                    t(this, st).then((ee) => {
                      Qt.textContent = ee;
                    }),
                    St.append(Qt);
                }
                let Ft = t(this, Z),
                  Tt = t(this, _t);
                if (Tt != null && Tt.str && (!(Ft != null && Ft.str) || Ft.str === Tt.str))
                  B.XfaLayer.render({ xfaHtml: Tt.html, intent: "richText", div: mt }),
                    mt.lastChild.classList.add("richText", "popupContent");
                else {
                  let Qt = this._formatContents(Ft);
                  mt.append(Qt);
                }
                let Ht = !!t(this, X),
                  Rt = Ht ? t(this, X) : t(this, vt);
                for (let Qt of t(this, u))
                  if (!Rt || c.Util.intersect(Qt.data.rect, Rt) !== null) {
                    (Rt = Qt.data.rect), (Ht = !0);
                    break;
                  }
                let Lt = c.Util.normalizeRect([Rt[0], w[3] - Rt[1] + w[1], Rt[2], w[3] - Rt[3] + w[1]]),
                  Gt = Ht ? Rt[2] - Rt[0] + 5 : 0,
                  $t = Lt[0] + Gt,
                  Kt = Lt[1],
                  { style: Zt } = t(this, Y);
                (Zt.left = `${(100 * ($t - at)) / v}%`), (Zt.top = `${(100 * (Kt - ot)) / W}%`), t(this, Y).append(mt);
              }
              _formatContents({ str: w, dir: v }) {
                let W = document.createElement("p");
                W.classList.add("popupContent"), (W.dir = v);
                let at = w.split(/(?:\r\n?|\n)/);
                for (let ot = 0, mt = at.length; ot < mt; ++ot) {
                  let St = at[ot];
                  W.append(document.createTextNode(St)), ot < mt - 1 && W.append(document.createElement("br"));
                }
                return W;
              }
              forceHide() {
                et(this, wt, this.isVisible), t(this, wt) && (t(this, Y).hidden = !0);
              }
              maybeShow() {
                t(this, wt) && (et(this, wt, !1), (t(this, Y).hidden = !1));
              }
              get isVisible() {
                return t(this, Y).hidden === !1;
              }
            }
            (st = new WeakMap()),
              (ct = new WeakMap()),
              (ht = new WeakMap()),
              (pt = new WeakMap()),
              (At = new WeakMap()),
              (yt = new WeakMap()),
              (Y = new WeakMap()),
              (Z = new WeakMap()),
              (u = new WeakMap()),
              (F = new WeakMap()),
              (X = new WeakMap()),
              (K = new WeakMap()),
              (ut = new WeakMap()),
              (vt = new WeakMap()),
              (_t = new WeakMap()),
              (V = new WeakMap()),
              (wt = new WeakMap()),
              (Et = new WeakSet()),
              (Hi = function (w) {
                w.altKey ||
                  w.shiftKey ||
                  w.ctrlKey ||
                  w.metaKey ||
                  ((w.key === "Enter" || (w.key === "Escape" && t(this, K))) && z(this, Et, Fe).call(this));
              }),
              (Fe = function () {
                et(this, K, !t(this, K)),
                  t(this, K)
                    ? (z(this, Et, ci).call(this),
                      t(this, Y).addEventListener("click", t(this, At)),
                      t(this, Y).addEventListener("keydown", t(this, ct)))
                    : (z(this, Et, hi).call(this),
                      t(this, Y).removeEventListener("click", t(this, At)),
                      t(this, Y).removeEventListener("keydown", t(this, ct)));
              }),
              (ci = function () {
                t(this, ut) || this.render(),
                  this.isVisible
                    ? t(this, K) && t(this, Y).classList.add("focused")
                    : ((t(this, Y).hidden = !1), (t(this, Y).style.zIndex = parseInt(t(this, Y).style.zIndex) + 1e3));
              }),
              (hi = function () {
                t(this, Y).classList.remove("focused"),
                  !(t(this, K) || !this.isVisible) &&
                    ((t(this, Y).hidden = !0), (t(this, Y).style.zIndex = parseInt(t(this, Y).style.zIndex) - 1e3));
              });
            class L extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0 }),
                  (this.textContent = w.data.textContent),
                  (this.textPosition = w.data.textPosition),
                  (this.annotationEditorType = c.AnnotationEditorType.FREETEXT);
              }
              render() {
                if ((this.container.classList.add("freeTextAnnotation"), this.textContent)) {
                  let w = document.createElement("div");
                  w.classList.add("annotationTextContent"), w.setAttribute("role", "comment");
                  for (let v of this.textContent) {
                    let W = document.createElement("span");
                    (W.textContent = v), w.append(W);
                  }
                  this.container.append(w);
                }
                return (
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this._editOnDoubleClick(),
                  this.container
                );
              }
            }
            g.FreeTextAnnotationElement = L;
            class n extends b {
              constructor(v) {
                super(v, { isRenderable: !0, ignoreBorder: !0 });
                J(this, Nt, null);
              }
              render() {
                this.container.classList.add("lineAnnotation");
                let v = this.data,
                  { width: W, height: at } = O(v.rect),
                  ot = this.svgFactory.create(W, at, !0),
                  mt = et(this, Nt, this.svgFactory.createElement("svg:line"));
                return (
                  mt.setAttribute("x1", v.rect[2] - v.lineCoordinates[0]),
                  mt.setAttribute("y1", v.rect[3] - v.lineCoordinates[1]),
                  mt.setAttribute("x2", v.rect[2] - v.lineCoordinates[2]),
                  mt.setAttribute("y2", v.rect[3] - v.lineCoordinates[3]),
                  mt.setAttribute("stroke-width", v.borderStyle.width || 1),
                  mt.setAttribute("stroke", "transparent"),
                  mt.setAttribute("fill", "transparent"),
                  ot.append(mt),
                  this.container.append(ot),
                  !v.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
              getElementsToTriggerPopup() {
                return t(this, Nt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            Nt = new WeakMap();
            class _ extends b {
              constructor(v) {
                super(v, { isRenderable: !0, ignoreBorder: !0 });
                J(this, Wt, null);
              }
              render() {
                this.container.classList.add("squareAnnotation");
                let v = this.data,
                  { width: W, height: at } = O(v.rect),
                  ot = this.svgFactory.create(W, at, !0),
                  mt = v.borderStyle.width,
                  St = et(this, Wt, this.svgFactory.createElement("svg:rect"));
                return (
                  St.setAttribute("x", mt / 2),
                  St.setAttribute("y", mt / 2),
                  St.setAttribute("width", W - mt),
                  St.setAttribute("height", at - mt),
                  St.setAttribute("stroke-width", mt || 1),
                  St.setAttribute("stroke", "transparent"),
                  St.setAttribute("fill", "transparent"),
                  ot.append(St),
                  this.container.append(ot),
                  !v.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
              getElementsToTriggerPopup() {
                return t(this, Wt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            Wt = new WeakMap();
            class k extends b {
              constructor(v) {
                super(v, { isRenderable: !0, ignoreBorder: !0 });
                J(this, Vt, null);
              }
              render() {
                this.container.classList.add("circleAnnotation");
                let v = this.data,
                  { width: W, height: at } = O(v.rect),
                  ot = this.svgFactory.create(W, at, !0),
                  mt = v.borderStyle.width,
                  St = et(this, Vt, this.svgFactory.createElement("svg:ellipse"));
                return (
                  St.setAttribute("cx", W / 2),
                  St.setAttribute("cy", at / 2),
                  St.setAttribute("rx", W / 2 - mt / 2),
                  St.setAttribute("ry", at / 2 - mt / 2),
                  St.setAttribute("stroke-width", mt || 1),
                  St.setAttribute("stroke", "transparent"),
                  St.setAttribute("fill", "transparent"),
                  ot.append(St),
                  this.container.append(ot),
                  !v.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
              getElementsToTriggerPopup() {
                return t(this, Vt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            Vt = new WeakMap();
            class it extends b {
              constructor(v) {
                super(v, { isRenderable: !0, ignoreBorder: !0 });
                J(this, bt, null);
                (this.containerClassName = "polylineAnnotation"), (this.svgElementName = "svg:polyline");
              }
              render() {
                this.container.classList.add(this.containerClassName);
                let v = this.data,
                  { width: W, height: at } = O(v.rect),
                  ot = this.svgFactory.create(W, at, !0),
                  mt = [];
                for (let It of v.vertices) {
                  let Ft = It.x - v.rect[0],
                    Tt = v.rect[3] - It.y;
                  mt.push(Ft + "," + Tt);
                }
                mt = mt.join(" ");
                let St = et(this, bt, this.svgFactory.createElement(this.svgElementName));
                return (
                  St.setAttribute("points", mt),
                  St.setAttribute("stroke-width", v.borderStyle.width || 1),
                  St.setAttribute("stroke", "transparent"),
                  St.setAttribute("fill", "transparent"),
                  ot.append(St),
                  this.container.append(ot),
                  !v.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
              getElementsToTriggerPopup() {
                return t(this, bt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            bt = new WeakMap();
            class H extends it {
              constructor(w) {
                super(w), (this.containerClassName = "polygonAnnotation"), (this.svgElementName = "svg:polygon");
              }
            }
            class q extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0 });
              }
              render() {
                return (
                  this.container.classList.add("caretAnnotation"),
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
            }
            class j extends b {
              constructor(v) {
                super(v, { isRenderable: !0, ignoreBorder: !0 });
                J(this, tt, []);
                (this.containerClassName = "inkAnnotation"),
                  (this.svgElementName = "svg:polyline"),
                  (this.annotationEditorType = c.AnnotationEditorType.INK);
              }
              render() {
                this.container.classList.add(this.containerClassName);
                let v = this.data,
                  { width: W, height: at } = O(v.rect),
                  ot = this.svgFactory.create(W, at, !0);
                for (let mt of v.inkLists) {
                  let St = [];
                  for (let Ft of mt) {
                    let Tt = Ft.x - v.rect[0],
                      Ht = v.rect[3] - Ft.y;
                    St.push(`${Tt},${Ht}`);
                  }
                  St = St.join(" ");
                  let It = this.svgFactory.createElement(this.svgElementName);
                  t(this, tt).push(It),
                    It.setAttribute("points", St),
                    It.setAttribute("stroke-width", v.borderStyle.width || 1),
                    It.setAttribute("stroke", "transparent"),
                    It.setAttribute("fill", "transparent"),
                    !v.popupRef && this.hasPopupData && this._createPopup(),
                    ot.append(It);
                }
                return this.container.append(ot), this.container;
              }
              getElementsToTriggerPopup() {
                return t(this, tt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            (tt = new WeakMap()), (g.InkAnnotationElement = j);
            class rt extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0, createQuadrilaterals: !0 });
              }
              render() {
                return (
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container.classList.add("highlightAnnotation"),
                  this.container
                );
              }
            }
            class C extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0, createQuadrilaterals: !0 });
              }
              render() {
                return (
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container.classList.add("underlineAnnotation"),
                  this.container
                );
              }
            }
            class U extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0, createQuadrilaterals: !0 });
              }
              render() {
                return (
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container.classList.add("squigglyAnnotation"),
                  this.container
                );
              }
            }
            class $ extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0, createQuadrilaterals: !0 });
              }
              render() {
                return (
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container.classList.add("strikeoutAnnotation"),
                  this.container
                );
              }
            }
            class S extends b {
              constructor(w) {
                super(w, { isRenderable: !0, ignoreBorder: !0 });
              }
              render() {
                return (
                  this.container.classList.add("stampAnnotation"),
                  !this.data.popupRef && this.hasPopupData && this._createPopup(),
                  this.container
                );
              }
            }
            g.StampAnnotationElement = S;
            class e extends b {
              constructor(v) {
                var ot;
                super(v, { isRenderable: !0 });
                J(this, kt);
                J(this, nt, null);
                let { filename: W, content: at } = this.data.file;
                (this.filename = (0, M.getFilenameFromUrl)(W, !0)),
                  (this.content = at),
                  (ot = this.linkService.eventBus) == null ||
                    ot.dispatch("fileattachmentannotation", { source: this, filename: W, content: at });
              }
              render() {
                this.container.classList.add("fileAttachmentAnnotation");
                let { container: v, data: W } = this,
                  at;
                W.hasAppearance || W.fillAlpha === 0
                  ? (at = document.createElement("div"))
                  : ((at = document.createElement("img")),
                    (at.src = `${this.imageResourcesPath}annotation-${/paperclip/i.test(W.name) ? "paperclip" : "pushpin"}.svg`),
                    W.fillAlpha &&
                      W.fillAlpha < 1 &&
                      (at.style = `filter: opacity(${Math.round(W.fillAlpha * 100)}%);`)),
                  at.addEventListener("dblclick", z(this, kt, di).bind(this)),
                  et(this, nt, at);
                let { isMac: ot } = c.FeatureTest.platform;
                return (
                  v.addEventListener("keydown", (mt) => {
                    mt.key === "Enter" && (ot ? mt.metaKey : mt.ctrlKey) && z(this, kt, di).call(this);
                  }),
                  !W.popupRef && this.hasPopupData ? this._createPopup() : at.classList.add("popupTriggerArea"),
                  v.append(at),
                  v
                );
              }
              getElementsToTriggerPopup() {
                return t(this, nt);
              }
              addHighlightArea() {
                this.container.classList.add("highlightArea");
              }
            }
            (nt = new WeakMap()),
              (kt = new WeakSet()),
              (di = function () {
                var v;
                (v = this.downloadManager) == null || v.openOrDownloadData(this.container, this.content, this.filename);
              });
            class i {
              constructor({
                div: w,
                accessibilityManager: v,
                annotationCanvasMap: W,
                l10n: at,
                page: ot,
                viewport: mt,
              }) {
                J(this, Ct);
                J(this, zt, null);
                J(this, D, null);
                J(this, dt, new Map());
                (this.div = w),
                  et(this, zt, v),
                  et(this, D, W),
                  (this.l10n = at),
                  (this.page = ot),
                  (this.viewport = mt),
                  (this.zIndex = 0),
                  this.l10n || (this.l10n = gt.NullL10n);
              }
              render(w) {
                return Yt(this, null, function* () {
                  let { annotations: v } = w,
                    W = this.div;
                  (0, M.setLayerDimensions)(W, this.viewport);
                  let at = new Map(),
                    ot = {
                      data: null,
                      layer: W,
                      linkService: w.linkService,
                      downloadManager: w.downloadManager,
                      imageResourcesPath: w.imageResourcesPath || "",
                      renderForms: w.renderForms !== !1,
                      svgFactory: new M.DOMSVGFactory(),
                      annotationStorage: w.annotationStorage || new lt.AnnotationStorage(),
                      enableScripting: w.enableScripting === !0,
                      hasJSActions: w.hasJSActions,
                      fieldObjects: w.fieldObjects,
                      parent: this,
                      elements: null,
                    };
                  for (let mt of v) {
                    if (mt.noHTML) continue;
                    let St = mt.annotationType === c.AnnotationType.POPUP;
                    if (St) {
                      let Tt = at.get(mt.id);
                      if (!Tt) continue;
                      ot.elements = Tt;
                    } else {
                      let { width: Tt, height: Ht } = O(mt.rect);
                      if (Tt <= 0 || Ht <= 0) continue;
                    }
                    ot.data = mt;
                    let It = A.create(ot);
                    if (!It.isRenderable) continue;
                    if (!St && mt.popupRef) {
                      let Tt = at.get(mt.popupRef);
                      Tt ? Tt.push(It) : at.set(mt.popupRef, [It]);
                    }
                    It.annotationEditorType > 0 && t(this, dt).set(It.data.id, It);
                    let Ft = It.render();
                    mt.hidden && (Ft.style.visibility = "hidden"), z(this, Ct, Wi).call(this, Ft, mt.id);
                  }
                  z(this, Ct, ui).call(this), yield this.l10n.translate(W);
                });
              }
              update({ viewport: w }) {
                let v = this.div;
                (this.viewport = w),
                  (0, M.setLayerDimensions)(v, { rotation: w.rotation }),
                  z(this, Ct, ui).call(this),
                  (v.hidden = !1);
              }
              getEditableAnnotations() {
                return Array.from(t(this, dt).values());
              }
              getEditableAnnotation(w) {
                return t(this, dt).get(w);
              }
            }
            (zt = new WeakMap()),
              (D = new WeakMap()),
              (dt = new WeakMap()),
              (Ct = new WeakSet()),
              (Wi = function (w, v) {
                var at;
                let W = w.firstChild || w;
                (W.id = `${c.AnnotationPrefix}${v}`),
                  this.div.append(w),
                  (at = t(this, zt)) == null || at.moveElementInDOM(this.div, w, W, !1);
              }),
              (ui = function () {
                if (!t(this, D)) return;
                let w = this.div;
                for (let [v, W] of t(this, D)) {
                  let at = w.querySelector(`[data-annotation-id="${v}"]`);
                  if (!at) continue;
                  let { firstChild: ot } = at;
                  ot ? (ot.nodeName === "CANVAS" ? ot.replaceWith(W) : ot.before(W)) : at.append(W);
                }
                t(this, D).clear();
              }),
              (g.AnnotationLayer = i);
          },
          (xt, g) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.ColorConverters = void 0);
            function ft(lt) {
              return Math.floor(Math.max(0, Math.min(1, lt)) * 255)
                .toString(16)
                .padStart(2, "0");
            }
            function c(lt) {
              return Math.max(0, Math.min(255, 255 * lt));
            }
            class M {
              static CMYK_G([Q, gt, B, R]) {
                return ["G", 1 - Math.min(1, 0.3 * Q + 0.59 * B + 0.11 * gt + R)];
              }
              static G_CMYK([Q]) {
                return ["CMYK", 0, 0, 0, 1 - Q];
              }
              static G_RGB([Q]) {
                return ["RGB", Q, Q, Q];
              }
              static G_rgb([Q]) {
                return (Q = c(Q)), [Q, Q, Q];
              }
              static G_HTML([Q]) {
                let gt = ft(Q);
                return `#${gt}${gt}${gt}`;
              }
              static RGB_G([Q, gt, B]) {
                return ["G", 0.3 * Q + 0.59 * gt + 0.11 * B];
              }
              static RGB_rgb(Q) {
                return Q.map(c);
              }
              static RGB_HTML(Q) {
                return `#${Q.map(ft).join("")}`;
              }
              static T_HTML() {
                return "#00000000";
              }
              static T_rgb() {
                return [null];
              }
              static CMYK_RGB([Q, gt, B, R]) {
                return ["RGB", 1 - Math.min(1, Q + R), 1 - Math.min(1, B + R), 1 - Math.min(1, gt + R)];
              }
              static CMYK_rgb([Q, gt, B, R]) {
                return [c(1 - Math.min(1, Q + R)), c(1 - Math.min(1, B + R)), c(1 - Math.min(1, gt + R))];
              }
              static CMYK_HTML(Q) {
                let gt = this.CMYK_RGB(Q).slice(1);
                return this.RGB_HTML(gt);
              }
              static RGB_CMYK([Q, gt, B]) {
                let R = 1 - Q,
                  p = 1 - gt,
                  N = 1 - B,
                  O = Math.min(R, p, N);
                return ["CMYK", R, p, N, O];
              }
            }
            g.ColorConverters = M;
          },
          (xt, g) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.NullL10n = void 0), (g.getL10nFallback = c);
            let ft = {
              of_pages: "of {{pagesCount}}",
              page_of_pages: "({{pageNumber}} of {{pagesCount}})",
              document_properties_kb: "{{size_kb}} KB ({{size_b}} bytes)",
              document_properties_mb: "{{size_mb}} MB ({{size_b}} bytes)",
              document_properties_date_string: "{{date}}, {{time}}",
              document_properties_page_size_unit_inches: "in",
              document_properties_page_size_unit_millimeters: "mm",
              document_properties_page_size_orientation_portrait: "portrait",
              document_properties_page_size_orientation_landscape: "landscape",
              document_properties_page_size_name_a3: "A3",
              document_properties_page_size_name_a4: "A4",
              document_properties_page_size_name_letter: "Letter",
              document_properties_page_size_name_legal: "Legal",
              document_properties_page_size_dimension_string: "{{width}} \xD7 {{height}} {{unit}} ({{orientation}})",
              document_properties_page_size_dimension_name_string:
                "{{width}} \xD7 {{height}} {{unit}} ({{name}}, {{orientation}})",
              document_properties_linearized_yes: "Yes",
              document_properties_linearized_no: "No",
              additional_layers: "Additional Layers",
              page_landmark: "Page {{page}}",
              thumb_page_title: "Page {{page}}",
              thumb_page_canvas: "Thumbnail of Page {{page}}",
              find_reached_top: "Reached top of document, continued from bottom",
              find_reached_bottom: "Reached end of document, continued from top",
              "find_match_count[one]": "{{current}} of {{total}} match",
              "find_match_count[other]": "{{current}} of {{total}} matches",
              "find_match_count_limit[one]": "More than {{limit}} match",
              "find_match_count_limit[other]": "More than {{limit}} matches",
              find_not_found: "Phrase not found",
              page_scale_width: "Page Width",
              page_scale_fit: "Page Fit",
              page_scale_auto: "Automatic Zoom",
              page_scale_actual: "Actual Size",
              page_scale_percent: "{{scale}}%",
              loading_error: "An error occurred while loading the PDF.",
              invalid_file_error: "Invalid or corrupted PDF file.",
              missing_file_error: "Missing PDF file.",
              unexpected_response_error: "Unexpected server response.",
              rendering_error: "An error occurred while rendering the page.",
              annotation_date_string: "{{date}}, {{time}}",
              printing_not_supported: "Warning: Printing is not fully supported by this browser.",
              printing_not_ready: "Warning: The PDF is not fully loaded for printing.",
              web_fonts_disabled: "Web fonts are disabled: unable to use embedded PDF fonts.",
              free_text2_default_content: "Start typing\u2026",
              editor_free_text2_aria_label: "Text Editor",
              editor_ink2_aria_label: "Draw Editor",
              editor_ink_canvas_aria_label: "User-created image",
              editor_alt_text_button_label: "Alt text",
              editor_alt_text_edit_button_label: "Edit alt text",
              editor_alt_text_decorative_tooltip: "Marked as decorative",
            };
            ft.print_progress_percent = "{{progress}}%";
            function c(gt, B) {
              switch (gt) {
                case "find_match_count":
                  gt = `find_match_count[${B.total === 1 ? "one" : "other"}]`;
                  break;
                case "find_match_count_limit":
                  gt = `find_match_count_limit[${B.limit === 1 ? "one" : "other"}]`;
                  break;
              }
              return ft[gt] || "";
            }
            function M(gt, B) {
              return B ? gt.replaceAll(/\{\{\s*(\w+)\s*\}\}/g, (R, p) => (p in B ? B[p] : "{{" + p + "}}")) : gt;
            }
            let lt = {
              getLanguage() {
                return Yt(this, null, function* () {
                  return "en-us";
                });
              },
              getDirection() {
                return Yt(this, null, function* () {
                  return "ltr";
                });
              },
              get(p) {
                return Yt(this, arguments, function* (gt, B = null, R = c(gt, B)) {
                  return M(R, B);
                });
              },
              translate(gt) {
                return Yt(this, null, function* () {});
              },
            };
            g.NullL10n = lt;
          },
          (xt, g, ft) => {
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.XfaLayer = void 0);
            var c = ft(25);
            class M {
              static setupStorage(Q, gt, B, R, p) {
                let N = R.getValue(gt, { value: null });
                switch (B.name) {
                  case "textarea":
                    if ((N.value !== null && (Q.textContent = N.value), p === "print")) break;
                    Q.addEventListener("input", (O) => {
                      R.setValue(gt, { value: O.target.value });
                    });
                    break;
                  case "input":
                    if (B.attributes.type === "radio" || B.attributes.type === "checkbox") {
                      if (
                        (N.value === B.attributes.xfaOn
                          ? Q.setAttribute("checked", !0)
                          : N.value === B.attributes.xfaOff && Q.removeAttribute("checked"),
                        p === "print")
                      )
                        break;
                      Q.addEventListener("change", (O) => {
                        R.setValue(gt, {
                          value: O.target.checked ? O.target.getAttribute("xfaOn") : O.target.getAttribute("xfaOff"),
                        });
                      });
                    } else {
                      if ((N.value !== null && Q.setAttribute("value", N.value), p === "print")) break;
                      Q.addEventListener("input", (O) => {
                        R.setValue(gt, { value: O.target.value });
                      });
                    }
                    break;
                  case "select":
                    if (N.value !== null) {
                      Q.setAttribute("value", N.value);
                      for (let O of B.children)
                        O.attributes.value === N.value
                          ? (O.attributes.selected = !0)
                          : O.attributes.hasOwnProperty("selected") && delete O.attributes.selected;
                    }
                    Q.addEventListener("input", (O) => {
                      let A = O.target.options,
                        b = A.selectedIndex === -1 ? "" : A[A.selectedIndex].value;
                      R.setValue(gt, { value: b });
                    });
                    break;
                }
              }
              static setAttributes({ html: Q, element: gt, storage: B = null, intent: R, linkService: p }) {
                let { attributes: N } = gt,
                  O = Q instanceof HTMLAnchorElement;
                N.type === "radio" && (N.name = `${N.name}-${R}`);
                for (let [A, b] of Object.entries(N))
                  if (b != null)
                    switch (A) {
                      case "class":
                        b.length && Q.setAttribute(A, b.join(" "));
                        break;
                      case "dataId":
                        break;
                      case "id":
                        Q.setAttribute("data-element-id", b);
                        break;
                      case "style":
                        Object.assign(Q.style, b);
                        break;
                      case "textContent":
                        Q.textContent = b;
                        break;
                      default:
                        (!O || (A !== "href" && A !== "newWindow")) && Q.setAttribute(A, b);
                    }
                O && p.addLinkAttributes(Q, N.href, N.newWindow),
                  B && N.dataId && this.setupStorage(Q, N.dataId, gt, B);
              }
              static render(Q) {
                var E;
                let gt = Q.annotationStorage,
                  B = Q.linkService,
                  R = Q.xfaHtml,
                  p = Q.intent || "display",
                  N = document.createElement(R.name);
                R.attributes && this.setAttributes({ html: N, element: R, intent: p, linkService: B });
                let O = [[R, -1, N]],
                  A = Q.div;
                if ((A.append(N), Q.viewport)) {
                  let f = `matrix(${Q.viewport.transform.join(",")})`;
                  A.style.transform = f;
                }
                p !== "richText" && A.setAttribute("class", "xfaLayer xfaFont");
                let b = [];
                for (; O.length > 0; ) {
                  let [f, h, m] = O.at(-1);
                  if (h + 1 === f.children.length) {
                    O.pop();
                    continue;
                  }
                  let I = f.children[++O.at(-1)[1]];
                  if (I === null) continue;
                  let { name: y } = I;
                  if (y === "#text") {
                    let l = document.createTextNode(I.value);
                    b.push(l), m.append(l);
                    continue;
                  }
                  let r =
                    (E = I == null ? void 0 : I.attributes) != null && E.xmlns
                      ? document.createElementNS(I.attributes.xmlns, y)
                      : document.createElement(y);
                  if (
                    (m.append(r),
                    I.attributes && this.setAttributes({ html: r, element: I, storage: gt, intent: p, linkService: B }),
                    I.children && I.children.length > 0)
                  )
                    O.push([I, -1, r]);
                  else if (I.value) {
                    let l = document.createTextNode(I.value);
                    c.XfaText.shouldBuildText(y) && b.push(l), r.append(l);
                  }
                }
                for (let f of A.querySelectorAll(".xfaNonInteractive input, .xfaNonInteractive textarea"))
                  f.setAttribute("readOnly", !0);
                return { textDivs: b };
              }
              static update(Q) {
                let gt = `matrix(${Q.viewport.transform.join(",")})`;
                (Q.div.style.transform = gt), (Q.div.hidden = !1);
              }
            }
            g.XfaLayer = M;
          },
          (xt, g, ft) => {
            var R,
              p,
              N,
              O,
              A,
              b,
              E,
              f,
              h,
              m,
              I,
              y,
              r,
              l,
              s,
              Gi,
              zi,
              Xi,
              Vi,
              fi,
              qi,
              pi,
              $i,
              Yi,
              Ki,
              Ji,
              Qi,
              ie,
              gi,
              Me,
              Re,
              he,
              mi,
              De,
              x,
              Zi,
              bi,
              ts,
              es,
              _i,
              Ie,
              de;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.InkEditor = void 0);
            var c = ft(1),
              M = ft(4),
              lt = ft(29),
              Q = ft(6),
              gt = ft(5);
            let yt = class yt extends M.AnnotationEditor {
              constructor(u) {
                super(ve(ue({}, u), { name: "inkEditor" }));
                J(this, s);
                J(this, R, 0);
                J(this, p, 0);
                J(this, N, this.canvasPointermove.bind(this));
                J(this, O, this.canvasPointerleave.bind(this));
                J(this, A, this.canvasPointerup.bind(this));
                J(this, b, this.canvasPointerdown.bind(this));
                J(this, E, new Path2D());
                J(this, f, !1);
                J(this, h, !1);
                J(this, m, !1);
                J(this, I, null);
                J(this, y, 0);
                J(this, r, 0);
                J(this, l, null);
                (this.color = u.color || null),
                  (this.thickness = u.thickness || null),
                  (this.opacity = u.opacity || null),
                  (this.paths = []),
                  (this.bezierPath2D = []),
                  (this.allRawPaths = []),
                  (this.currentPath = []),
                  (this.scaleFactor = 1),
                  (this.translationX = this.translationY = 0),
                  (this.x = 0),
                  (this.y = 0),
                  (this._willKeepAspectRatio = !0);
              }
              static initialize(u) {
                M.AnnotationEditor.initialize(u, {
                  strings: ["editor_ink_canvas_aria_label", "editor_ink2_aria_label"],
                });
              }
              static updateDefaultParams(u, F) {
                switch (u) {
                  case c.AnnotationEditorParamsType.INK_THICKNESS:
                    yt._defaultThickness = F;
                    break;
                  case c.AnnotationEditorParamsType.INK_COLOR:
                    yt._defaultColor = F;
                    break;
                  case c.AnnotationEditorParamsType.INK_OPACITY:
                    yt._defaultOpacity = F / 100;
                    break;
                }
              }
              updateParams(u, F) {
                switch (u) {
                  case c.AnnotationEditorParamsType.INK_THICKNESS:
                    z(this, s, Gi).call(this, F);
                    break;
                  case c.AnnotationEditorParamsType.INK_COLOR:
                    z(this, s, zi).call(this, F);
                    break;
                  case c.AnnotationEditorParamsType.INK_OPACITY:
                    z(this, s, Xi).call(this, F);
                    break;
                }
              }
              static get defaultPropertiesToUpdate() {
                return [
                  [c.AnnotationEditorParamsType.INK_THICKNESS, yt._defaultThickness],
                  [c.AnnotationEditorParamsType.INK_COLOR, yt._defaultColor || M.AnnotationEditor._defaultLineColor],
                  [c.AnnotationEditorParamsType.INK_OPACITY, Math.round(yt._defaultOpacity * 100)],
                ];
              }
              get propertiesToUpdate() {
                var u;
                return [
                  [c.AnnotationEditorParamsType.INK_THICKNESS, this.thickness || yt._defaultThickness],
                  [
                    c.AnnotationEditorParamsType.INK_COLOR,
                    this.color || yt._defaultColor || M.AnnotationEditor._defaultLineColor,
                  ],
                  [
                    c.AnnotationEditorParamsType.INK_OPACITY,
                    Math.round(100 * ((u = this.opacity) != null ? u : yt._defaultOpacity)),
                  ],
                ];
              }
              rebuild() {
                this.parent &&
                  (super.rebuild(),
                  this.div !== null &&
                    (this.canvas || (z(this, s, Me).call(this), z(this, s, Re).call(this)),
                    this.isAttachedToDOM || (this.parent.add(this), z(this, s, he).call(this)),
                    z(this, s, de).call(this)));
              }
              remove() {
                this.canvas !== null &&
                  (this.isEmpty() || this.commit(),
                  (this.canvas.width = this.canvas.height = 0),
                  this.canvas.remove(),
                  (this.canvas = null),
                  t(this, I).disconnect(),
                  et(this, I, null),
                  super.remove());
              }
              setParent(u) {
                !this.parent && u
                  ? this._uiManager.removeShouldRescale(this)
                  : this.parent && u === null && this._uiManager.addShouldRescale(this),
                  super.setParent(u);
              }
              onScaleChanging() {
                let [u, F] = this.parentDimensions,
                  X = this.width * u,
                  K = this.height * F;
                this.setDimensions(X, K);
              }
              enableEditMode() {
                t(this, f) ||
                  this.canvas === null ||
                  (super.enableEditMode(),
                  (this._isDraggable = !1),
                  this.canvas.addEventListener("pointerdown", t(this, b)));
              }
              disableEditMode() {
                !this.isInEditMode() ||
                  this.canvas === null ||
                  (super.disableEditMode(),
                  (this._isDraggable = !this.isEmpty()),
                  this.div.classList.remove("editing"),
                  this.canvas.removeEventListener("pointerdown", t(this, b)));
              }
              onceAdded() {
                this._isDraggable = !this.isEmpty();
              }
              isEmpty() {
                return this.paths.length === 0 || (this.paths.length === 1 && this.paths[0].length === 0);
              }
              commit() {
                t(this, f) ||
                  (super.commit(),
                  (this.isEditing = !1),
                  this.disableEditMode(),
                  this.setInForeground(),
                  et(this, f, !0),
                  this.div.classList.add("disabled"),
                  z(this, s, de).call(this, !0),
                  this.makeResizable(),
                  this.parent.addInkEditorIfNeeded(!0),
                  this.moveInDOM(),
                  this.div.focus({ preventScroll: !0 }));
              }
              focusin(u) {
                this._focusEventsAllowed && (super.focusin(u), this.enableEditMode());
              }
              canvasPointerdown(u) {
                u.button !== 0 ||
                  !this.isInEditMode() ||
                  t(this, f) ||
                  (this.setInForeground(),
                  u.preventDefault(),
                  u.type !== "mouse" && this.div.focus(),
                  z(this, s, qi).call(this, u.offsetX, u.offsetY));
              }
              canvasPointermove(u) {
                u.preventDefault(), z(this, s, pi).call(this, u.offsetX, u.offsetY);
              }
              canvasPointerup(u) {
                u.preventDefault(), z(this, s, gi).call(this, u);
              }
              canvasPointerleave(u) {
                z(this, s, gi).call(this, u);
              }
              get isResizable() {
                return !this.isEmpty() && t(this, f);
              }
              render() {
                if (this.div) return this.div;
                let u, F;
                this.width && ((u = this.x), (F = this.y)),
                  super.render(),
                  M.AnnotationEditor._l10nPromise.get("editor_ink2_aria_label").then((_t) => {
                    var V;
                    return (V = this.div) == null ? void 0 : V.setAttribute("aria-label", _t);
                  });
                let [X, K, ut, vt] = z(this, s, Vi).call(this);
                if ((this.setAt(X, K, 0, 0), this.setDims(ut, vt), z(this, s, Me).call(this), this.width)) {
                  let [_t, V] = this.parentDimensions;
                  this.setAspectRatio(this.width * _t, this.height * V),
                    this.setAt(u * _t, F * V, this.width * _t, this.height * V),
                    et(this, m, !0),
                    z(this, s, he).call(this),
                    this.setDims(this.width * _t, this.height * V),
                    z(this, s, ie).call(this),
                    this.div.classList.add("disabled");
                } else this.div.classList.add("editing"), this.enableEditMode();
                return z(this, s, Re).call(this), this.div;
              }
              setDimensions(u, F) {
                let X = Math.round(u),
                  K = Math.round(F);
                if (t(this, y) === X && t(this, r) === K) return;
                et(this, y, X), et(this, r, K), (this.canvas.style.visibility = "hidden");
                let [ut, vt] = this.parentDimensions;
                (this.width = u / ut),
                  (this.height = F / vt),
                  this.fixAndSetPosition(),
                  t(this, f) && z(this, s, mi).call(this, u, F),
                  z(this, s, he).call(this),
                  z(this, s, ie).call(this),
                  (this.canvas.style.visibility = "visible"),
                  this.fixDims();
              }
              static deserialize(u, F, X) {
                var Nt, Wt, Vt;
                if (u instanceof lt.InkAnnotationElement) return null;
                let K = super.deserialize(u, F, X);
                (K.thickness = u.thickness), (K.color = c.Util.makeHexColor(...u.color)), (K.opacity = u.opacity);
                let [ut, vt] = K.pageDimensions,
                  _t = K.width * ut,
                  V = K.height * vt,
                  wt = K.parentScale,
                  Et = u.thickness / 2;
                et(K, f, !0), et(K, y, Math.round(_t)), et(K, r, Math.round(V));
                let { paths: jt, rect: Bt, rotation: qt } = u;
                for (let { bezier: bt } of jt) {
                  bt = z((Nt = yt), x, ts).call(Nt, bt, Bt, qt);
                  let tt = [];
                  K.paths.push(tt);
                  let nt = wt * (bt[0] - Et),
                    kt = wt * (bt[1] - Et);
                  for (let zt = 2, D = bt.length; zt < D; zt += 6) {
                    let dt = wt * (bt[zt] - Et),
                      Ct = wt * (bt[zt + 1] - Et),
                      Dt = wt * (bt[zt + 2] - Et),
                      Ot = wt * (bt[zt + 3] - Et),
                      Pt = wt * (bt[zt + 4] - Et),
                      w = wt * (bt[zt + 5] - Et);
                    tt.push([
                      [nt, kt],
                      [dt, Ct],
                      [Dt, Ot],
                      [Pt, w],
                    ]),
                      (nt = Pt),
                      (kt = w);
                  }
                  let Xt = z(this, x, Zi).call(this, tt);
                  K.bezierPath2D.push(Xt);
                }
                let Mt = z((Wt = K), s, _i).call(Wt);
                return (
                  et(K, p, Math.max(M.AnnotationEditor.MIN_SIZE, Mt[2] - Mt[0])),
                  et(K, R, Math.max(M.AnnotationEditor.MIN_SIZE, Mt[3] - Mt[1])),
                  z((Vt = K), s, mi).call(Vt, _t, V),
                  K
                );
              }
              serialize() {
                if (this.isEmpty()) return null;
                let u = this.getRect(0, 0),
                  F = M.AnnotationEditor._colorManager.convert(this.ctx.strokeStyle);
                return {
                  annotationType: c.AnnotationEditorType.INK,
                  color: F,
                  thickness: this.thickness,
                  opacity: this.opacity,
                  paths: z(this, s, es).call(
                    this,
                    this.scaleFactor / this.parentScale,
                    this.translationX,
                    this.translationY,
                    u,
                  ),
                  pageIndex: this.pageIndex,
                  rect: u,
                  rotation: this.rotation,
                  structTreeParentId: this._structTreeParentId,
                };
              }
            };
            (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakMap()),
              (m = new WeakMap()),
              (I = new WeakMap()),
              (y = new WeakMap()),
              (r = new WeakMap()),
              (l = new WeakMap()),
              (s = new WeakSet()),
              (Gi = function (u) {
                let F = this.thickness;
                this.addCommands({
                  cmd: () => {
                    (this.thickness = u), z(this, s, de).call(this);
                  },
                  undo: () => {
                    (this.thickness = F), z(this, s, de).call(this);
                  },
                  mustExec: !0,
                  type: c.AnnotationEditorParamsType.INK_THICKNESS,
                  overwriteIfSameType: !0,
                  keepUndo: !0,
                });
              }),
              (zi = function (u) {
                let F = this.color;
                this.addCommands({
                  cmd: () => {
                    (this.color = u), z(this, s, ie).call(this);
                  },
                  undo: () => {
                    (this.color = F), z(this, s, ie).call(this);
                  },
                  mustExec: !0,
                  type: c.AnnotationEditorParamsType.INK_COLOR,
                  overwriteIfSameType: !0,
                  keepUndo: !0,
                });
              }),
              (Xi = function (u) {
                u /= 100;
                let F = this.opacity;
                this.addCommands({
                  cmd: () => {
                    (this.opacity = u), z(this, s, ie).call(this);
                  },
                  undo: () => {
                    (this.opacity = F), z(this, s, ie).call(this);
                  },
                  mustExec: !0,
                  type: c.AnnotationEditorParamsType.INK_OPACITY,
                  overwriteIfSameType: !0,
                  keepUndo: !0,
                });
              }),
              (Vi = function () {
                let {
                  parentRotation: u,
                  parentDimensions: [F, X],
                } = this;
                switch (u) {
                  case 90:
                    return [0, X, X, F];
                  case 180:
                    return [F, X, F, X];
                  case 270:
                    return [F, 0, X, F];
                  default:
                    return [0, 0, F, X];
                }
              }),
              (fi = function () {
                let { ctx: u, color: F, opacity: X, thickness: K, parentScale: ut, scaleFactor: vt } = this;
                (u.lineWidth = (K * ut) / vt),
                  (u.lineCap = "round"),
                  (u.lineJoin = "round"),
                  (u.miterLimit = 10),
                  (u.strokeStyle = `${F}${(0, gt.opacityToHex)(X)}`);
              }),
              (qi = function (u, F) {
                var X;
                this.canvas.addEventListener("contextmenu", Q.noContextMenu),
                  this.canvas.addEventListener("pointerleave", t(this, O)),
                  this.canvas.addEventListener("pointermove", t(this, N)),
                  this.canvas.addEventListener("pointerup", t(this, A)),
                  this.canvas.removeEventListener("pointerdown", t(this, b)),
                  (this.isEditing = !0),
                  t(this, m) ||
                    (et(this, m, !0),
                    z(this, s, he).call(this),
                    this.thickness || (this.thickness = yt._defaultThickness),
                    this.color || (this.color = yt._defaultColor || M.AnnotationEditor._defaultLineColor),
                    (X = this.opacity) != null || (this.opacity = yt._defaultOpacity)),
                  this.currentPath.push([u, F]),
                  et(this, h, !1),
                  z(this, s, fi).call(this),
                  et(this, l, () => {
                    z(this, s, Ki).call(this), t(this, l) && window.requestAnimationFrame(t(this, l));
                  }),
                  window.requestAnimationFrame(t(this, l));
              }),
              (pi = function (u, F) {
                let [X, K] = this.currentPath.at(-1);
                if (this.currentPath.length > 1 && u === X && F === K) return;
                let ut = this.currentPath,
                  vt = t(this, E);
                if ((ut.push([u, F]), et(this, h, !0), ut.length <= 2)) {
                  vt.moveTo(...ut[0]), vt.lineTo(u, F);
                  return;
                }
                ut.length === 3 && (et(this, E, (vt = new Path2D())), vt.moveTo(...ut[0])),
                  z(this, s, Ji).call(this, vt, ...ut.at(-3), ...ut.at(-2), u, F);
              }),
              ($i = function () {
                if (this.currentPath.length === 0) return;
                let u = this.currentPath.at(-1);
                t(this, E).lineTo(...u);
              }),
              (Yi = function (u, F) {
                et(this, l, null),
                  (u = Math.min(Math.max(u, 0), this.canvas.width)),
                  (F = Math.min(Math.max(F, 0), this.canvas.height)),
                  z(this, s, pi).call(this, u, F),
                  z(this, s, $i).call(this);
                let X;
                if (this.currentPath.length !== 1) X = z(this, s, Qi).call(this);
                else {
                  let V = [u, F];
                  X = [[V, V.slice(), V.slice(), V]];
                }
                let K = t(this, E),
                  ut = this.currentPath;
                (this.currentPath = []), et(this, E, new Path2D());
                let vt = () => {
                    this.allRawPaths.push(ut), this.paths.push(X), this.bezierPath2D.push(K), this.rebuild();
                  },
                  _t = () => {
                    this.allRawPaths.pop(),
                      this.paths.pop(),
                      this.bezierPath2D.pop(),
                      this.paths.length === 0
                        ? this.remove()
                        : (this.canvas || (z(this, s, Me).call(this), z(this, s, Re).call(this)),
                          z(this, s, de).call(this));
                  };
                this.addCommands({ cmd: vt, undo: _t, mustExec: !0 });
              }),
              (Ki = function () {
                if (!t(this, h)) return;
                et(this, h, !1);
                let u = Math.ceil(this.thickness * this.parentScale),
                  F = this.currentPath.slice(-3),
                  X = F.map((Et) => Et[0]),
                  K = F.map((Et) => Et[1]),
                  ut = Math.min(...X) - u,
                  vt = Math.max(...X) + u,
                  _t = Math.min(...K) - u,
                  V = Math.max(...K) + u,
                  { ctx: wt } = this;
                wt.save(), wt.clearRect(0, 0, this.canvas.width, this.canvas.height);
                for (let Et of this.bezierPath2D) wt.stroke(Et);
                wt.stroke(t(this, E)), wt.restore();
              }),
              (Ji = function (u, F, X, K, ut, vt, _t) {
                let V = (F + K) / 2,
                  wt = (X + ut) / 2,
                  Et = (K + vt) / 2,
                  jt = (ut + _t) / 2;
                u.bezierCurveTo(
                  V + (2 * (K - V)) / 3,
                  wt + (2 * (ut - wt)) / 3,
                  Et + (2 * (K - Et)) / 3,
                  jt + (2 * (ut - jt)) / 3,
                  Et,
                  jt,
                );
              }),
              (Qi = function () {
                let u = this.currentPath;
                if (u.length <= 2) return [[u[0], u[0], u.at(-1), u.at(-1)]];
                let F = [],
                  X,
                  [K, ut] = u[0];
                for (X = 1; X < u.length - 2; X++) {
                  let [Bt, qt] = u[X],
                    [Mt, Nt] = u[X + 1],
                    Wt = (Bt + Mt) / 2,
                    Vt = (qt + Nt) / 2,
                    bt = [K + (2 * (Bt - K)) / 3, ut + (2 * (qt - ut)) / 3],
                    tt = [Wt + (2 * (Bt - Wt)) / 3, Vt + (2 * (qt - Vt)) / 3];
                  F.push([[K, ut], bt, tt, [Wt, Vt]]), ([K, ut] = [Wt, Vt]);
                }
                let [vt, _t] = u[X],
                  [V, wt] = u[X + 1],
                  Et = [K + (2 * (vt - K)) / 3, ut + (2 * (_t - ut)) / 3],
                  jt = [V + (2 * (vt - V)) / 3, wt + (2 * (_t - wt)) / 3];
                return F.push([[K, ut], Et, jt, [V, wt]]), F;
              }),
              (ie = function () {
                if (this.isEmpty()) {
                  z(this, s, De).call(this);
                  return;
                }
                z(this, s, fi).call(this);
                let { canvas: u, ctx: F } = this;
                F.setTransform(1, 0, 0, 1, 0, 0), F.clearRect(0, 0, u.width, u.height), z(this, s, De).call(this);
                for (let X of this.bezierPath2D) F.stroke(X);
              }),
              (gi = function (u) {
                this.canvas.removeEventListener("pointerleave", t(this, O)),
                  this.canvas.removeEventListener("pointermove", t(this, N)),
                  this.canvas.removeEventListener("pointerup", t(this, A)),
                  this.canvas.addEventListener("pointerdown", t(this, b)),
                  setTimeout(() => {
                    this.canvas.removeEventListener("contextmenu", Q.noContextMenu);
                  }, 10),
                  z(this, s, Yi).call(this, u.offsetX, u.offsetY),
                  this.addToAnnotationStorage(),
                  this.setInBackground();
              }),
              (Me = function () {
                (this.canvas = document.createElement("canvas")),
                  (this.canvas.width = this.canvas.height = 0),
                  (this.canvas.className = "inkEditorCanvas"),
                  M.AnnotationEditor._l10nPromise.get("editor_ink_canvas_aria_label").then((u) => {
                    var F;
                    return (F = this.canvas) == null ? void 0 : F.setAttribute("aria-label", u);
                  }),
                  this.div.append(this.canvas),
                  (this.ctx = this.canvas.getContext("2d"));
              }),
              (Re = function () {
                et(
                  this,
                  I,
                  new ResizeObserver((u) => {
                    let F = u[0].contentRect;
                    F.width && F.height && this.setDimensions(F.width, F.height);
                  }),
                ),
                  t(this, I).observe(this.div);
              }),
              (he = function () {
                if (!t(this, m)) return;
                let [u, F] = this.parentDimensions;
                (this.canvas.width = Math.ceil(this.width * u)),
                  (this.canvas.height = Math.ceil(this.height * F)),
                  z(this, s, De).call(this);
              }),
              (mi = function (u, F) {
                let X = z(this, s, Ie).call(this),
                  K = (u - X) / t(this, p),
                  ut = (F - X) / t(this, R);
                this.scaleFactor = Math.min(K, ut);
              }),
              (De = function () {
                let u = z(this, s, Ie).call(this) / 2;
                this.ctx.setTransform(
                  this.scaleFactor,
                  0,
                  0,
                  this.scaleFactor,
                  this.translationX * this.scaleFactor + u,
                  this.translationY * this.scaleFactor + u,
                );
              }),
              (x = new WeakSet()),
              (Zi = function (u) {
                let F = new Path2D();
                for (let X = 0, K = u.length; X < K; X++) {
                  let [ut, vt, _t, V] = u[X];
                  X === 0 && F.moveTo(...ut), F.bezierCurveTo(vt[0], vt[1], _t[0], _t[1], V[0], V[1]);
                }
                return F;
              }),
              (bi = function (u, F, X) {
                let [K, ut, vt, _t] = F;
                switch (X) {
                  case 0:
                    for (let V = 0, wt = u.length; V < wt; V += 2) (u[V] += K), (u[V + 1] = _t - u[V + 1]);
                    break;
                  case 90:
                    for (let V = 0, wt = u.length; V < wt; V += 2) {
                      let Et = u[V];
                      (u[V] = u[V + 1] + K), (u[V + 1] = Et + ut);
                    }
                    break;
                  case 180:
                    for (let V = 0, wt = u.length; V < wt; V += 2) (u[V] = vt - u[V]), (u[V + 1] += ut);
                    break;
                  case 270:
                    for (let V = 0, wt = u.length; V < wt; V += 2) {
                      let Et = u[V];
                      (u[V] = vt - u[V + 1]), (u[V + 1] = _t - Et);
                    }
                    break;
                  default:
                    throw new Error("Invalid rotation");
                }
                return u;
              }),
              (ts = function (u, F, X) {
                let [K, ut, vt, _t] = F;
                switch (X) {
                  case 0:
                    for (let V = 0, wt = u.length; V < wt; V += 2) (u[V] -= K), (u[V + 1] = _t - u[V + 1]);
                    break;
                  case 90:
                    for (let V = 0, wt = u.length; V < wt; V += 2) {
                      let Et = u[V];
                      (u[V] = u[V + 1] - ut), (u[V + 1] = Et - K);
                    }
                    break;
                  case 180:
                    for (let V = 0, wt = u.length; V < wt; V += 2) (u[V] = vt - u[V]), (u[V + 1] -= ut);
                    break;
                  case 270:
                    for (let V = 0, wt = u.length; V < wt; V += 2) {
                      let Et = u[V];
                      (u[V] = _t - u[V + 1]), (u[V + 1] = vt - Et);
                    }
                    break;
                  default:
                    throw new Error("Invalid rotation");
                }
                return u;
              }),
              (es = function (u, F, X, K) {
                var wt, Et;
                let ut = [],
                  vt = this.thickness / 2,
                  _t = u * F + vt,
                  V = u * X + vt;
                for (let jt of this.paths) {
                  let Bt = [],
                    qt = [];
                  for (let Mt = 0, Nt = jt.length; Mt < Nt; Mt++) {
                    let [Wt, Vt, bt, tt] = jt[Mt],
                      nt = u * Wt[0] + _t,
                      kt = u * Wt[1] + V,
                      Xt = u * Vt[0] + _t,
                      zt = u * Vt[1] + V,
                      D = u * bt[0] + _t,
                      dt = u * bt[1] + V,
                      Ct = u * tt[0] + _t,
                      Dt = u * tt[1] + V;
                    Mt === 0 && (Bt.push(nt, kt), qt.push(nt, kt)),
                      Bt.push(Xt, zt, D, dt, Ct, Dt),
                      qt.push(Xt, zt),
                      Mt === Nt - 1 && qt.push(Ct, Dt);
                  }
                  ut.push({
                    bezier: z((wt = yt), x, bi).call(wt, Bt, K, this.rotation),
                    points: z((Et = yt), x, bi).call(Et, qt, K, this.rotation),
                  });
                }
                return ut;
              }),
              (_i = function () {
                let u = 1 / 0,
                  F = -1 / 0,
                  X = 1 / 0,
                  K = -1 / 0;
                for (let ut of this.paths)
                  for (let [vt, _t, V, wt] of ut) {
                    let Et = c.Util.bezierBoundingBox(...vt, ..._t, ...V, ...wt);
                    (u = Math.min(u, Et[0])),
                      (X = Math.min(X, Et[1])),
                      (F = Math.max(F, Et[2])),
                      (K = Math.max(K, Et[3]));
                  }
                return [u, X, F, K];
              }),
              (Ie = function () {
                return t(this, f) ? Math.ceil(this.thickness * this.parentScale) : 0;
              }),
              (de = function (u = !1) {
                if (this.isEmpty()) return;
                if (!t(this, f)) {
                  z(this, s, ie).call(this);
                  return;
                }
                let F = z(this, s, _i).call(this),
                  X = z(this, s, Ie).call(this);
                et(this, p, Math.max(M.AnnotationEditor.MIN_SIZE, F[2] - F[0])),
                  et(this, R, Math.max(M.AnnotationEditor.MIN_SIZE, F[3] - F[1]));
                let K = Math.ceil(X + t(this, p) * this.scaleFactor),
                  ut = Math.ceil(X + t(this, R) * this.scaleFactor),
                  [vt, _t] = this.parentDimensions;
                (this.width = K / vt), (this.height = ut / _t), this.setAspectRatio(K, ut);
                let V = this.translationX,
                  wt = this.translationY;
                (this.translationX = -F[0]),
                  (this.translationY = -F[1]),
                  z(this, s, he).call(this),
                  z(this, s, ie).call(this),
                  et(this, y, K),
                  et(this, r, ut),
                  this.setDims(K, ut);
                let Et = u ? X / this.scaleFactor / 2 : 0;
                this.translate(V - this.translationX - Et, wt - this.translationY - Et);
              }),
              J(yt, x),
              Jt(yt, "_defaultColor", null),
              Jt(yt, "_defaultOpacity", 1),
              Jt(yt, "_defaultThickness", 1),
              Jt(yt, "_type", "ink");
            let B = yt;
            g.InkEditor = B;
          },
          (xt, g, ft) => {
            var B, R, p, N, O, A, b, E, f, h, m, Ae, ye, Le, Ai, is, ss, yi, Oe, ns;
            Object.defineProperty(g, "__esModule", { value: !0 }), (g.StampEditor = void 0);
            var c = ft(1),
              M = ft(4),
              lt = ft(6),
              Q = ft(29);
            let _ = class _ extends M.AnnotationEditor {
              constructor(H) {
                super(ve(ue({}, H), { name: "stampEditor" }));
                J(this, m);
                J(this, B, null);
                J(this, R, null);
                J(this, p, null);
                J(this, N, null);
                J(this, O, null);
                J(this, A, null);
                J(this, b, null);
                J(this, E, null);
                J(this, f, !1);
                J(this, h, !1);
                et(this, N, H.bitmapUrl), et(this, O, H.bitmapFile);
              }
              static initialize(H) {
                M.AnnotationEditor.initialize(H);
              }
              static get supportedTypes() {
                let H = ["apng", "avif", "bmp", "gif", "jpeg", "png", "svg+xml", "webp", "x-icon"];
                return (0, c.shadow)(
                  this,
                  "supportedTypes",
                  H.map((q) => `image/${q}`),
                );
              }
              static get supportedTypesStr() {
                return (0, c.shadow)(this, "supportedTypesStr", this.supportedTypes.join(","));
              }
              static isHandlingMimeForPasting(H) {
                return this.supportedTypes.includes(H);
              }
              static paste(H, q) {
                q.pasteEditor(c.AnnotationEditorType.STAMP, { bitmapFile: H.getAsFile() });
              }
              remove() {
                var H, q;
                t(this, R) &&
                  (et(this, B, null),
                  this._uiManager.imageManager.deleteId(t(this, R)),
                  (H = t(this, A)) == null || H.remove(),
                  et(this, A, null),
                  (q = t(this, b)) == null || q.disconnect(),
                  et(this, b, null)),
                  super.remove();
              }
              rebuild() {
                if (!this.parent) {
                  t(this, R) && z(this, m, Le).call(this);
                  return;
                }
                super.rebuild(),
                  this.div !== null &&
                    (t(this, R) && z(this, m, Le).call(this), this.isAttachedToDOM || this.parent.add(this));
              }
              onceAdded() {
                (this._isDraggable = !0), this.div.focus();
              }
              isEmpty() {
                return !(t(this, p) || t(this, B) || t(this, N) || t(this, O));
              }
              get isResizable() {
                return !0;
              }
              render() {
                if (this.div) return this.div;
                let H, q;
                if (
                  (this.width && ((H = this.x), (q = this.y)),
                  super.render(),
                  (this.div.hidden = !0),
                  t(this, B) ? z(this, m, Ai).call(this) : z(this, m, Le).call(this),
                  this.width)
                ) {
                  let [j, rt] = this.parentDimensions;
                  this.setAt(H * j, q * rt, this.width * j, this.height * rt);
                }
                return this.div;
              }
              static deserialize(H, q, j) {
                if (H instanceof Q.StampAnnotationElement) return null;
                let rt = super.deserialize(H, q, j),
                  { rect: C, bitmapUrl: U, bitmapId: $, isSvg: S, accessibilityData: e } = H;
                $ && j.imageManager.isValidId($) ? et(rt, R, $) : et(rt, N, U), et(rt, f, S);
                let [i, d] = rt.pageDimensions;
                return (rt.width = (C[2] - C[0]) / i), (rt.height = (C[3] - C[1]) / d), e && (rt.altTextData = e), rt;
              }
              serialize(H = !1, q = null) {
                if (this.isEmpty()) return null;
                let j = {
                  annotationType: c.AnnotationEditorType.STAMP,
                  bitmapId: t(this, R),
                  pageIndex: this.pageIndex,
                  rect: this.getRect(0, 0),
                  rotation: this.rotation,
                  isSvg: t(this, f),
                  structTreeParentId: this._structTreeParentId,
                };
                if (H)
                  return (j.bitmapUrl = z(this, m, Oe).call(this, !0)), (j.accessibilityData = this.altTextData), j;
                let { decorative: rt, altText: C } = this.altTextData;
                if ((!rt && C && (j.accessibilityData = { type: "Figure", alt: C }), q === null)) return j;
                q.stamps || (q.stamps = new Map());
                let U = t(this, f) ? (j.rect[2] - j.rect[0]) * (j.rect[3] - j.rect[1]) : null;
                if (!q.stamps.has(t(this, R)))
                  q.stamps.set(t(this, R), { area: U, serialized: j }), (j.bitmap = z(this, m, Oe).call(this, !1));
                else if (t(this, f)) {
                  let $ = q.stamps.get(t(this, R));
                  U > $.area &&
                    (($.area = U), $.serialized.bitmap.close(), ($.serialized.bitmap = z(this, m, Oe).call(this, !1)));
                }
                return j;
              }
            };
            (B = new WeakMap()),
              (R = new WeakMap()),
              (p = new WeakMap()),
              (N = new WeakMap()),
              (O = new WeakMap()),
              (A = new WeakMap()),
              (b = new WeakMap()),
              (E = new WeakMap()),
              (f = new WeakMap()),
              (h = new WeakMap()),
              (m = new WeakSet()),
              (Ae = function (H, q = !1) {
                if (!H) {
                  this.remove();
                  return;
                }
                et(this, B, H.bitmap), q || (et(this, R, H.id), et(this, f, H.isSvg)), z(this, m, Ai).call(this);
              }),
              (ye = function () {
                et(this, p, null), this._uiManager.enableWaiting(!1), t(this, A) && this.div.focus();
              }),
              (Le = function () {
                if (t(this, R)) {
                  this._uiManager.enableWaiting(!0),
                    this._uiManager.imageManager
                      .getFromId(t(this, R))
                      .then((q) => z(this, m, Ae).call(this, q, !0))
                      .finally(() => z(this, m, ye).call(this));
                  return;
                }
                if (t(this, N)) {
                  let q = t(this, N);
                  et(this, N, null),
                    this._uiManager.enableWaiting(!0),
                    et(
                      this,
                      p,
                      this._uiManager.imageManager
                        .getFromUrl(q)
                        .then((j) => z(this, m, Ae).call(this, j))
                        .finally(() => z(this, m, ye).call(this)),
                    );
                  return;
                }
                if (t(this, O)) {
                  let q = t(this, O);
                  et(this, O, null),
                    this._uiManager.enableWaiting(!0),
                    et(
                      this,
                      p,
                      this._uiManager.imageManager
                        .getFromFile(q)
                        .then((j) => z(this, m, Ae).call(this, j))
                        .finally(() => z(this, m, ye).call(this)),
                    );
                  return;
                }
                let H = document.createElement("input");
                (H.type = "file"),
                  (H.accept = _.supportedTypesStr),
                  et(
                    this,
                    p,
                    new Promise((q) => {
                      H.addEventListener("change", () =>
                        Yt(this, null, function* () {
                          if (!H.files || H.files.length === 0) this.remove();
                          else {
                            this._uiManager.enableWaiting(!0);
                            let j = yield this._uiManager.imageManager.getFromFile(H.files[0]);
                            z(this, m, Ae).call(this, j);
                          }
                          q();
                        }),
                      ),
                        H.addEventListener("cancel", () => {
                          this.remove(), q();
                        });
                    }).finally(() => z(this, m, ye).call(this)),
                  ),
                  H.click();
              }),
              (Ai = function () {
                let { div: H } = this,
                  { width: q, height: j } = t(this, B),
                  [rt, C] = this.pageDimensions,
                  U = 0.75;
                if (this.width) (q = this.width * rt), (j = this.height * C);
                else if (q > U * rt || j > U * C) {
                  let i = Math.min((U * rt) / q, (U * C) / j);
                  (q *= i), (j *= i);
                }
                let [$, S] = this.parentDimensions;
                this.setDims((q * $) / rt, (j * S) / C), this._uiManager.enableWaiting(!1);
                let e = et(this, A, document.createElement("canvas"));
                H.append(e),
                  (H.hidden = !1),
                  z(this, m, yi).call(this, q, j),
                  z(this, m, ns).call(this),
                  t(this, h) || (this.parent.addUndoableEditor(this), et(this, h, !0)),
                  this._uiManager._eventBus.dispatch("reporttelemetry", {
                    source: this,
                    details: { type: "editing", subtype: this.editorType, data: { action: "inserted_image" } },
                  }),
                  this.addAltTextButton();
              }),
              (is = function (H, q) {
                var U;
                let [j, rt] = this.parentDimensions;
                (this.width = H / j),
                  (this.height = q / rt),
                  this.setDims(H, q),
                  (U = this._initialOptions) != null && U.isCentered ? this.center() : this.fixAndSetPosition(),
                  (this._initialOptions = null),
                  t(this, E) !== null && clearTimeout(t(this, E)),
                  et(
                    this,
                    E,
                    setTimeout(() => {
                      et(this, E, null), z(this, m, yi).call(this, H, q);
                    }, 200),
                  );
              }),
              (ss = function (H, q) {
                let { width: j, height: rt } = t(this, B),
                  C = j,
                  U = rt,
                  $ = t(this, B);
                for (; C > 2 * H || U > 2 * q; ) {
                  let S = C,
                    e = U;
                  C > 2 * H && (C = C >= 16384 ? Math.floor(C / 2) - 1 : Math.ceil(C / 2)),
                    U > 2 * q && (U = U >= 16384 ? Math.floor(U / 2) - 1 : Math.ceil(U / 2));
                  let i = new OffscreenCanvas(C, U);
                  i.getContext("2d").drawImage($, 0, 0, S, e, 0, 0, C, U), ($ = i.transferToImageBitmap());
                }
                return $;
              }),
              (yi = function (H, q) {
                (H = Math.ceil(H)), (q = Math.ceil(q));
                let j = t(this, A);
                if (!j || (j.width === H && j.height === q)) return;
                (j.width = H), (j.height = q);
                let rt = t(this, f) ? t(this, B) : z(this, m, ss).call(this, H, q),
                  C = j.getContext("2d");
                (C.filter = this._uiManager.hcmFilter), C.drawImage(rt, 0, 0, rt.width, rt.height, 0, 0, H, q);
              }),
              (Oe = function (H) {
                if (H) {
                  if (t(this, f)) {
                    let rt = this._uiManager.imageManager.getSvgUrl(t(this, R));
                    if (rt) return rt;
                  }
                  let q = document.createElement("canvas");
                  return (
                    ({ width: q.width, height: q.height } = t(this, B)),
                    q.getContext("2d").drawImage(t(this, B), 0, 0),
                    q.toDataURL()
                  );
                }
                if (t(this, f)) {
                  let [q, j] = this.pageDimensions,
                    rt = Math.round(this.width * q * lt.PixelsPerInch.PDF_TO_CSS_UNITS),
                    C = Math.round(this.height * j * lt.PixelsPerInch.PDF_TO_CSS_UNITS),
                    U = new OffscreenCanvas(rt, C);
                  return (
                    U.getContext("2d").drawImage(t(this, B), 0, 0, t(this, B).width, t(this, B).height, 0, 0, rt, C),
                    U.transferToImageBitmap()
                  );
                }
                return structuredClone(t(this, B));
              }),
              (ns = function () {
                et(
                  this,
                  b,
                  new ResizeObserver((H) => {
                    let q = H[0].contentRect;
                    q.width && q.height && z(this, m, is).call(this, q.width, q.height);
                  }),
                ),
                  t(this, b).observe(this.div);
              }),
              Jt(_, "_type", "stamp");
            let gt = _;
            g.StampEditor = gt;
          },
        ],
        __webpack_module_cache__ = {};
      function __w_pdfjs_require__(xt) {
        var g = __webpack_module_cache__[xt];
        if (g !== void 0) return g.exports;
        var ft = (__webpack_module_cache__[xt] = { exports: {} });
        return __webpack_modules__[xt](ft, ft.exports, __w_pdfjs_require__), ft.exports;
      }
      var __webpack_exports__ = {};
      return (
        (() => {
          var xt = __webpack_exports__;
          Object.defineProperty(xt, "__esModule", { value: !0 }),
            Object.defineProperty(xt, "AbortException", {
              enumerable: !0,
              get: function () {
                return g.AbortException;
              },
            }),
            Object.defineProperty(xt, "AnnotationEditorLayer", {
              enumerable: !0,
              get: function () {
                return lt.AnnotationEditorLayer;
              },
            }),
            Object.defineProperty(xt, "AnnotationEditorParamsType", {
              enumerable: !0,
              get: function () {
                return g.AnnotationEditorParamsType;
              },
            }),
            Object.defineProperty(xt, "AnnotationEditorType", {
              enumerable: !0,
              get: function () {
                return g.AnnotationEditorType;
              },
            }),
            Object.defineProperty(xt, "AnnotationEditorUIManager", {
              enumerable: !0,
              get: function () {
                return Q.AnnotationEditorUIManager;
              },
            }),
            Object.defineProperty(xt, "AnnotationLayer", {
              enumerable: !0,
              get: function () {
                return gt.AnnotationLayer;
              },
            }),
            Object.defineProperty(xt, "AnnotationMode", {
              enumerable: !0,
              get: function () {
                return g.AnnotationMode;
              },
            }),
            Object.defineProperty(xt, "CMapCompressionType", {
              enumerable: !0,
              get: function () {
                return g.CMapCompressionType;
              },
            }),
            Object.defineProperty(xt, "DOMSVGFactory", {
              enumerable: !0,
              get: function () {
                return c.DOMSVGFactory;
              },
            }),
            Object.defineProperty(xt, "FeatureTest", {
              enumerable: !0,
              get: function () {
                return g.FeatureTest;
              },
            }),
            Object.defineProperty(xt, "GlobalWorkerOptions", {
              enumerable: !0,
              get: function () {
                return B.GlobalWorkerOptions;
              },
            }),
            Object.defineProperty(xt, "ImageKind", {
              enumerable: !0,
              get: function () {
                return g.ImageKind;
              },
            }),
            Object.defineProperty(xt, "InvalidPDFException", {
              enumerable: !0,
              get: function () {
                return g.InvalidPDFException;
              },
            }),
            Object.defineProperty(xt, "MissingPDFException", {
              enumerable: !0,
              get: function () {
                return g.MissingPDFException;
              },
            }),
            Object.defineProperty(xt, "OPS", {
              enumerable: !0,
              get: function () {
                return g.OPS;
              },
            }),
            Object.defineProperty(xt, "PDFDataRangeTransport", {
              enumerable: !0,
              get: function () {
                return ft.PDFDataRangeTransport;
              },
            }),
            Object.defineProperty(xt, "PDFDateString", {
              enumerable: !0,
              get: function () {
                return c.PDFDateString;
              },
            }),
            Object.defineProperty(xt, "PDFWorker", {
              enumerable: !0,
              get: function () {
                return ft.PDFWorker;
              },
            }),
            Object.defineProperty(xt, "PasswordResponses", {
              enumerable: !0,
              get: function () {
                return g.PasswordResponses;
              },
            }),
            Object.defineProperty(xt, "PermissionFlag", {
              enumerable: !0,
              get: function () {
                return g.PermissionFlag;
              },
            }),
            Object.defineProperty(xt, "PixelsPerInch", {
              enumerable: !0,
              get: function () {
                return c.PixelsPerInch;
              },
            }),
            Object.defineProperty(xt, "PromiseCapability", {
              enumerable: !0,
              get: function () {
                return g.PromiseCapability;
              },
            }),
            Object.defineProperty(xt, "RenderingCancelledException", {
              enumerable: !0,
              get: function () {
                return c.RenderingCancelledException;
              },
            }),
            Object.defineProperty(xt, "SVGGraphics", {
              enumerable: !0,
              get: function () {
                return ft.SVGGraphics;
              },
            }),
            Object.defineProperty(xt, "UnexpectedResponseException", {
              enumerable: !0,
              get: function () {
                return g.UnexpectedResponseException;
              },
            }),
            Object.defineProperty(xt, "Util", {
              enumerable: !0,
              get: function () {
                return g.Util;
              },
            }),
            Object.defineProperty(xt, "VerbosityLevel", {
              enumerable: !0,
              get: function () {
                return g.VerbosityLevel;
              },
            }),
            Object.defineProperty(xt, "XfaLayer", {
              enumerable: !0,
              get: function () {
                return R.XfaLayer;
              },
            }),
            Object.defineProperty(xt, "build", {
              enumerable: !0,
              get: function () {
                return ft.build;
              },
            }),
            Object.defineProperty(xt, "createValidAbsoluteUrl", {
              enumerable: !0,
              get: function () {
                return g.createValidAbsoluteUrl;
              },
            }),
            Object.defineProperty(xt, "getDocument", {
              enumerable: !0,
              get: function () {
                return ft.getDocument;
              },
            }),
            Object.defineProperty(xt, "getFilenameFromUrl", {
              enumerable: !0,
              get: function () {
                return c.getFilenameFromUrl;
              },
            }),
            Object.defineProperty(xt, "getPdfFilenameFromUrl", {
              enumerable: !0,
              get: function () {
                return c.getPdfFilenameFromUrl;
              },
            }),
            Object.defineProperty(xt, "getXfaPageViewport", {
              enumerable: !0,
              get: function () {
                return c.getXfaPageViewport;
              },
            }),
            Object.defineProperty(xt, "isDataScheme", {
              enumerable: !0,
              get: function () {
                return c.isDataScheme;
              },
            }),
            Object.defineProperty(xt, "isPdfFile", {
              enumerable: !0,
              get: function () {
                return c.isPdfFile;
              },
            }),
            Object.defineProperty(xt, "loadScript", {
              enumerable: !0,
              get: function () {
                return c.loadScript;
              },
            }),
            Object.defineProperty(xt, "noContextMenu", {
              enumerable: !0,
              get: function () {
                return c.noContextMenu;
              },
            }),
            Object.defineProperty(xt, "normalizeUnicode", {
              enumerable: !0,
              get: function () {
                return g.normalizeUnicode;
              },
            }),
            Object.defineProperty(xt, "renderTextLayer", {
              enumerable: !0,
              get: function () {
                return M.renderTextLayer;
              },
            }),
            Object.defineProperty(xt, "setLayerDimensions", {
              enumerable: !0,
              get: function () {
                return c.setLayerDimensions;
              },
            }),
            Object.defineProperty(xt, "shadow", {
              enumerable: !0,
              get: function () {
                return g.shadow;
              },
            }),
            Object.defineProperty(xt, "updateTextLayer", {
              enumerable: !0,
              get: function () {
                return M.updateTextLayer;
              },
            }),
            Object.defineProperty(xt, "version", {
              enumerable: !0,
              get: function () {
                return ft.version;
              },
            });
          var g = __w_pdfjs_require__(1),
            ft = __w_pdfjs_require__(2),
            c = __w_pdfjs_require__(6),
            M = __w_pdfjs_require__(26),
            lt = __w_pdfjs_require__(27),
            Q = __w_pdfjs_require__(5),
            gt = __w_pdfjs_require__(29),
            B = __w_pdfjs_require__(14),
            R = __w_pdfjs_require__(32);
          let p = "3.11.174",
            N = "ce8716743";
        })(),
        __webpack_exports__
      );
    })(),
  );
});
export { rs as a };
