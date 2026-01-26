import { a as k } from "./chunk-K6ISRTTP.js";
import "./chunk-JL2EL352.js";
import "./chunk-K3A632J4.js";
import { a as O } from "./chunk-W23DHSE2.js";
import { a as y } from "./chunk-MUWAMKOD.js";
import { f as A, g as v } from "./chunk-RS4WWU7K.js";
var N = A(O(), 1);
var s = {
  TRACK_EVENT: "trackEvent",
  TRACK_LINK: "trackLink",
  TRACK_SEARCH: "trackSiteSearch",
  TRACK_VIEW: "trackPageView",
  TRACK_ECOMMERCE_ORDER: "trackEcommerceOrder",
  TRACK_ECOMMERCE_CART_UPDATE: "trackEcommerceCartUpdate",
};
var I = function (a, t) {
    var i = {};
    for (var e in a) Object.prototype.hasOwnProperty.call(a, e) && t.indexOf(e) < 0 && (i[e] = a[e]);
    if (a != null && typeof Object.getOwnPropertySymbols == "function")
      for (var r = 0, e = Object.getOwnPropertySymbols(a); r < e.length; r++)
        t.indexOf(e[r]) < 0 && Object.prototype.propertyIsEnumerable.call(a, e[r]) && (i[e[r]] = a[e[r]]);
    return i;
  },
  E = class {
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
      srcUrl: o,
      disabled: n,
      heartBeat: c,
      linkTracking: T = !0,
      configurations: R = {},
    }) {
      var l;
      let f = t[t.length - 1] !== "/" ? `${t}/` : t;
      if (typeof window == "undefined" || ((window._paq = window._paq || []), window._paq.length !== 0) || n) return;
      this.pushInstruction("setTrackerUrl", r != null ? r : `${f}matomo.php`),
        this.pushInstruction("setSiteId", i),
        e && this.pushInstruction("setUserId", e),
        Object.entries(R).forEach(([w, h]) => {
          h instanceof Array ? this.pushInstruction(w, ...h) : this.pushInstruction(w, h);
        }),
        (!c || (c && c.active)) && this.enableHeartBeatTimer((l = c && c.seconds) !== null && l !== void 0 ? l : 15),
        this.enableLinkTracking(T);
      let p = document,
        m = p.createElement("script"),
        d = p.getElementsByTagName("script")[0];
      (m.type = "text/javascript"),
        (m.async = !0),
        (m.defer = !0),
        (m.src = o || `${f}matomo.js`),
        d && d.parentNode && d.parentNode.insertBefore(m, d);
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
            let { matomoCategory: e, matomoAction: r, matomoName: o, matomoValue: n } = i.dataset;
            if (e && r) this.trackEvent({ category: e, action: r, name: o, value: Number(n) });
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
              r.addedNodes.forEach((o) => {
                if (!(o instanceof HTMLElement)) return;
                o.matches(t) && this.trackEventsForElements([o]);
                let n = Array.from(o.querySelectorAll(t));
                this.trackEventsForElements(n);
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
      var { category: i, action: e, name: r, value: o } = t,
        n = I(t, ["category", "action", "name", "value"]);
      if (i && e) this.track(Object.assign({ data: [s.TRACK_EVENT, i, e, r, o] }, n));
      else throw new Error("Error: category and action are required.");
    }
    trackSiteSearch(t) {
      var { keyword: i, category: e, count: r } = t,
        o = I(t, ["keyword", "category", "count"]);
      if (i) this.track(Object.assign({ data: [s.TRACK_SEARCH, i, e, r] }, o));
      else throw new Error("Error: keyword is required.");
    }
    trackLink({ href: t, linkType: i = "link" }) {
      this.pushInstruction(s.TRACK_LINK, t, i);
    }
    trackPageView(t) {
      this.track(Object.assign({ data: [s.TRACK_VIEW] }, t));
    }
    addEcommerceItem({ sku: t, productName: i, productCategory: e, productPrice: r = 0, productQuantity: o = 1 }) {
      this.pushInstruction("addEcommerceItem", t, i, e, r, o);
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
      shippingAmount: o,
      discountOffered: n = !1,
    }) {
      this.track({ data: [s.TRACK_ECOMMERCE_ORDER, t, i, e, r, o, n] });
    }
    trackEcommerceCartUpdate(t) {
      this.pushInstruction(s.TRACK_ECOMMERCE_CART_UPDATE, t);
    }
    setEcommerceView({ sku: t, productName: i, productCategory: e, productPrice: r }) {
      this.pushInstruction("setEcommerceView", t, i, e, r);
    }
    setEcommerceCategoryView(t) {
      this.setEcommerceView({ productCategory: t, productName: !1, sku: !1 });
    }
    track({ data: t = [], documentTitle: i = window.document.title, href: e, customDimensions: r = !1 }) {
      t.length &&
        (r && Array.isArray(r) && r.length && r.map((o) => this.pushInstruction("setCustomDimension", o.id, o.value)),
        this.pushInstruction("setCustomUrl", e != null ? e : window.location.href),
        this.pushInstruction("setDocumentTitle", i),
        this.pushInstruction(...t));
    }
    pushInstruction(t, ...i) {
      return typeof window != "undefined" && window._paq.push([t, ...i]), this;
    }
  },
  b = E;
var g = b;
var u = class u {
  static functionality(t, i) {
    let e = Number.parseInt(t.siteid || window.codbiSettings.Matomo.SiteID),
      r = t.url || window.codbiSettings.Matomo.URL;
    if (e === void 0 || r === void 0)
      throw new k(
        `Functionality / Matomo.Tracking was activated but ${e === void 0 ? (r === void 0 ? "no SiteID and no Matomo-Server-URL" : "no SiteID") : "no Matomo-Server-URL"} was specified.`,
      );
    new g({ siteId: Number.parseInt(t.siteid), urlBase: t.url }).trackPageView();
  }
};
(u.registered = window.codbi.registerFunctionality("Matomo.Tracking", u.functionality)),
  v([y.ParamvalueProvider], u, "functionality", 1);
var C = u;
export { C as Matomo_Tracking };
