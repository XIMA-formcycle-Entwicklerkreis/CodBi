import { a as k } from "./chunk-HI24USOS.js";
import { a as h } from "./chunk-7ZUEWSHL.js";
import { a as g } from "./chunk-M2SNI3IN.js";
import { a as R } from "./chunk-KEJSWGMR.js";
import { a } from "./chunk-SEUS6MHP.js";
import { a as f } from "./chunk-CDLTIEKC.js";
import { g as T, h as m, p as b } from "./chunk-UTJJRBTX.js";
var c = {
  TRACK_EVENT: "trackEvent",
  TRACK_LINK: "trackLink",
  TRACK_SEARCH: "trackSiteSearch",
  TRACK_VIEW: "trackPageView",
  TRACK_ECOMMERCE_ORDER: "trackEcommerceOrder",
  TRACK_ECOMMERCE_CART_UPDATE: "trackEcommerceCartUpdate",
};
var A = function (o, t) {
    var i = {};
    for (var e in o) Object.prototype.hasOwnProperty.call(o, e) && t.indexOf(e) < 0 && (i[e] = o[e]);
    if (o != null && typeof Object.getOwnPropertySymbols == "function")
      for (var r = 0, e = Object.getOwnPropertySymbols(o); r < e.length; r++)
        t.indexOf(e[r]) < 0 && Object.prototype.propertyIsEnumerable.call(o, e[r]) && (i[e[r]] = o[e[r]]);
    return i;
  },
  y = class {
    constructor(t) {
      if (!t.urlBase) throw new Error("Matomo urlBase is required.");
      if (!t.siteId) throw new Error("Matomo siteId is required.");
      this.initialize(t);
    }
    initialize({
      urlBase: t,
      siteId: i,
      userId: e,
      trackerUrl: r,
      srcUrl: n,
      disabled: s,
      heartBeat: u,
      linkTracking: P = !0,
      configurations: S = {},
    }) {
      var p;
      let C = t[t.length - 1] !== "/" ? `${t}/` : t;
      if (typeof window == "undefined" || ((window._paq = window._paq || []), window._paq.length !== 0) || s) return;
      this.pushInstruction("setTrackerUrl", r != null ? r : `${C}matomo.php`),
        this.pushInstruction("setSiteId", i),
        e && this.pushInstruction("setUserId", e),
        Object.entries(S).forEach(([v, w]) => {
          w instanceof Array ? this.pushInstruction(v, ...w) : this.pushInstruction(v, w);
        }),
        (!u || (u && u.active)) && this.enableHeartBeatTimer((p = u && u.seconds) !== null && p !== void 0 ? p : 15),
        this.enableLinkTracking(P);
      let I = document,
        l = I.createElement("script"),
        E = I.getElementsByTagName("script")[0];
      (l.type = "text/javascript"),
        (l.async = !0),
        (l.defer = !0),
        (l.src = n || `${C}matomo.js`),
        E && E.parentNode && E.parentNode.insertBefore(l, E);
    }
    enableHeartBeatTimer(t) {
      this.pushInstruction("enableHeartBeatTimer", t);
    }
    enableLinkTracking(t) {
      this.pushInstruction("enableLinkTracking", t);
    }
    trackEventsForElements(t) {
      t.length &&
        t.forEach((i) => {
          i.addEventListener("click", () => {
            let { matomoCategory: e, matomoAction: r, matomoName: n, matomoValue: s } = i.dataset;
            if (e && r) this.trackEvent({ category: e, action: r, name: n, value: Number(s) });
            else throw new Error("Error: data-matomo-category and data-matomo-action are required.");
          });
        });
    }
    trackEvents() {
      let t = '[data-matomo-event="click"]',
        i = !1;
      if (
        (this.mutationObserver ||
          ((i = !0),
          (this.mutationObserver = new MutationObserver((e) => {
            e.forEach((r) => {
              r.addedNodes.forEach((n) => {
                if (!(n instanceof HTMLElement)) return;
                n.matches(t) && this.trackEventsForElements([n]);
                let s = Array.from(n.querySelectorAll(t));
                this.trackEventsForElements(s);
              });
            });
          }))),
        this.mutationObserver.observe(document, { childList: !0, subtree: !0 }),
        i)
      ) {
        let e = Array.from(document.querySelectorAll(t));
        this.trackEventsForElements(e);
      }
    }
    stopObserving() {
      this.mutationObserver && this.mutationObserver.disconnect();
    }
    trackEvent(t) {
      var { category: i, action: e, name: r, value: n } = t,
        s = A(t, ["category", "action", "name", "value"]);
      if (i && e) this.track(Object.assign({ data: [c.TRACK_EVENT, i, e, r, n] }, s));
      else throw new Error("Error: category and action are required.");
    }
    trackSiteSearch(t) {
      var { keyword: i, category: e, count: r } = t,
        n = A(t, ["keyword", "category", "count"]);
      if (i) this.track(Object.assign({ data: [c.TRACK_SEARCH, i, e, r] }, n));
      else throw new Error("Error: keyword is required.");
    }
    trackLink({ href: t, linkType: i = "link" }) {
      this.pushInstruction(c.TRACK_LINK, t, i);
    }
    trackPageView(t) {
      this.track(Object.assign({ data: [c.TRACK_VIEW] }, t));
    }
    addEcommerceItem({ sku: t, productName: i, productCategory: e, productPrice: r = 0, productQuantity: n = 1 }) {
      this.pushInstruction("addEcommerceItem", t, i, e, r, n);
    }
    removeEcommerceItem({ sku: t }) {
      this.pushInstruction("removeEcommerceItem", t);
    }
    clearEcommerceCart() {
      this.pushInstruction("clearEcommerceCart");
    }
    trackEcommerceOrder({
      orderId: t,
      orderRevenue: i,
      orderSubTotal: e,
      taxAmount: r,
      shippingAmount: n,
      discountOffered: s = !1,
    }) {
      this.track({ data: [c.TRACK_ECOMMERCE_ORDER, t, i, e, r, n, s] });
    }
    trackEcommerceCartUpdate(t) {
      this.pushInstruction(c.TRACK_ECOMMERCE_CART_UPDATE, t);
    }
    setEcommerceView({ sku: t, productName: i, productCategory: e, productPrice: r }) {
      this.pushInstruction("setEcommerceView", t, i, e, r);
    }
    setEcommerceCategoryView(t) {
      this.setEcommerceView({ productCategory: t, productName: !1, sku: !1 });
    }
    track({ data: t = [], documentTitle: i = window.document.title, href: e, customDimensions: r = !1 }) {
      t.length &&
        (r && Array.isArray(r) && r.length && r.map((n) => this.pushInstruction("setCustomDimension", n.id, n.value)),
        this.pushInstruction("setCustomUrl", e != null ? e : window.location.href),
        this.pushInstruction("setDocumentTitle", i),
        this.pushInstruction(...t));
    }
    pushInstruction(t, ...i) {
      return typeof window != "undefined" && window._paq.push([t, ...i]), this;
    }
  },
  O = y;
var _ = O;
var d = class {
  static functionality(t, i) {
    let e, r;
    t.siteID === void 0 || t.siteID === ""
      ? (e = Number.parseInt(
          k.tsCheck(
            window.codbiSettings.Matomo.SiteID,
            [new h(), new a(/^\d+$/)],
            "SiteID was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
          ),
        ))
      : (e = Number.parseInt(t.siteid)),
      t.url === void 0 || t.url === ""
        ? (r = k.tsCheck(
            window.codbiSettings.Matomo.URL,
            [new h(), new a(a.stdExp.url)],
            "URL was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
          ))
        : (r = t.url);
    try {
      new _({ siteId: e, urlBase: r }).trackPageView();
    } catch (n) {
      window.codbi.log("WARNING", `Matomo Tracking failed due to: ${n.message}`);
    }
  }
};
T(
  [
    b.ParamvalueProvider,
    m(0, f.PRE("string", "url")),
    m(0, f.PRE("string", "siteid")),
    m(0, g.PRE(new f("string"), new a(/^\d+$/), "siteid")),
    m(0, g.PRE(new h(), new a(a.stdExp.url), "url")),
    m(1, R.PRE(HTMLElement)),
  ],
  d,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Matomo.Tracking", d.functionality.bind(d));
export { d as Matomo_Tracking };
