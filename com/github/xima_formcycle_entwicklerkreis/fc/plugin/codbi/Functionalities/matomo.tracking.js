import {
  CodBiError
} from "./chunk-QGX5JPGQ.js";
import "./chunk-QZ34KSY4.js";
import {
  require_dist
} from "./chunk-2R3WETV4.js";
import "./chunk-MQ6BYLTP.js";
import {
  DBC
} from "./chunk-7Z6CEUOW.js";
import {
  __decorateClass,
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/Functionalities/matomo.tracking.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);

// ../../../../../node_modules/@jonkoops/matomo-tracker/es/constants.js
var TRACK_TYPES = {
  TRACK_EVENT: "trackEvent",
  TRACK_LINK: "trackLink",
  TRACK_SEARCH: "trackSiteSearch",
  TRACK_VIEW: "trackPageView",
  TRACK_ECOMMERCE_ORDER: "trackEcommerceOrder",
  TRACK_ECOMMERCE_CART_UPDATE: "trackEcommerceCartUpdate"
};

// ../../../../../node_modules/@jonkoops/matomo-tracker/es/MatomoTracker.js
var __rest = function(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
    t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
        t[p[i]] = s[p[i]];
    }
  return t;
};
var MatomoTracker = class {
  constructor(userOptions) {
    if (!userOptions.urlBase) {
      throw new Error("Matomo urlBase is required.");
    }
    if (!userOptions.siteId) {
      throw new Error("Matomo siteId is required.");
    }
    this.initialize(userOptions);
  }
  initialize({ urlBase, siteId, userId, trackerUrl, srcUrl, disabled, heartBeat, linkTracking = true, configurations = {} }) {
    var _a;
    const normalizedUrlBase = urlBase[urlBase.length - 1] !== "/" ? `${urlBase}/` : urlBase;
    if (typeof window === "undefined") {
      return;
    }
    window._paq = window._paq || [];
    if (window._paq.length !== 0) {
      return;
    }
    if (disabled) {
      return;
    }
    this.pushInstruction("setTrackerUrl", trackerUrl !== null && trackerUrl !== void 0 ? trackerUrl : `${normalizedUrlBase}matomo.php`);
    this.pushInstruction("setSiteId", siteId);
    if (userId) {
      this.pushInstruction("setUserId", userId);
    }
    Object.entries(configurations).forEach(([name, instructions]) => {
      if (instructions instanceof Array) {
        this.pushInstruction(name, ...instructions);
      } else {
        this.pushInstruction(name, instructions);
      }
    });
    if (!heartBeat || heartBeat && heartBeat.active) {
      this.enableHeartBeatTimer((_a = heartBeat && heartBeat.seconds) !== null && _a !== void 0 ? _a : 15);
    }
    this.enableLinkTracking(linkTracking);
    const doc = document;
    const scriptElement = doc.createElement("script");
    const scripts = doc.getElementsByTagName("script")[0];
    scriptElement.type = "text/javascript";
    scriptElement.async = true;
    scriptElement.defer = true;
    scriptElement.src = srcUrl || `${normalizedUrlBase}matomo.js`;
    if (scripts && scripts.parentNode) {
      scripts.parentNode.insertBefore(scriptElement, scripts);
    }
  }
  enableHeartBeatTimer(seconds) {
    this.pushInstruction("enableHeartBeatTimer", seconds);
  }
  enableLinkTracking(active) {
    this.pushInstruction("enableLinkTracking", active);
  }
  trackEventsForElements(elements) {
    if (elements.length) {
      elements.forEach((element) => {
        element.addEventListener("click", () => {
          const { matomoCategory, matomoAction, matomoName, matomoValue } = element.dataset;
          if (matomoCategory && matomoAction) {
            this.trackEvent({
              category: matomoCategory,
              action: matomoAction,
              name: matomoName,
              value: Number(matomoValue)
            });
          } else {
            throw new Error(`Error: data-matomo-category and data-matomo-action are required.`);
          }
        });
      });
    }
  }
  // Tracks events based on data attributes
  trackEvents() {
    const matchString = '[data-matomo-event="click"]';
    let firstTime = false;
    if (!this.mutationObserver) {
      firstTime = true;
      this.mutationObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (!(node instanceof HTMLElement))
              return;
            if (node.matches(matchString)) {
              this.trackEventsForElements([node]);
            }
            const elements = Array.from(node.querySelectorAll(matchString));
            this.trackEventsForElements(elements);
          });
        });
      });
    }
    this.mutationObserver.observe(document, { childList: true, subtree: true });
    if (firstTime) {
      const elements = Array.from(document.querySelectorAll(matchString));
      this.trackEventsForElements(elements);
    }
  }
  stopObserving() {
    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }
  }
  // Tracks events
  // https://matomo.org/docs/event-tracking/#tracking-events
  trackEvent(_a) {
    var { category, action, name, value } = _a, otherParams = __rest(_a, ["category", "action", "name", "value"]);
    if (category && action) {
      this.track(Object.assign({ data: [TRACK_TYPES.TRACK_EVENT, category, action, name, value] }, otherParams));
    } else {
      throw new Error(`Error: category and action are required.`);
    }
  }
  // Tracks site search
  // https://developer.matomo.org/guides/tracking-javascript-guide#internal-search-tracking
  trackSiteSearch(_a) {
    var { keyword, category, count } = _a, otherParams = __rest(_a, ["keyword", "category", "count"]);
    if (keyword) {
      this.track(Object.assign({ data: [TRACK_TYPES.TRACK_SEARCH, keyword, category, count] }, otherParams));
    } else {
      throw new Error(`Error: keyword is required.`);
    }
  }
  // Tracks outgoing links to other sites and downloads
  // https://developer.matomo.org/guides/tracking-javascript-guide#enabling-download-outlink-tracking
  trackLink({ href, linkType = "link" }) {
    this.pushInstruction(TRACK_TYPES.TRACK_LINK, href, linkType);
  }
  // Tracks page views
  // https://developer.matomo.org/guides/spa-tracking#tracking-a-new-page-view
  trackPageView(params) {
    this.track(Object.assign({ data: [TRACK_TYPES.TRACK_VIEW] }, params));
  }
  // Adds a product to an Ecommerce order to be tracked via trackEcommerceOrder.
  // https://matomo.org/docs/ecommerce-analytics
  // https://matomo.org/docs/ecommerce-analytics/#1-addecommerceitemproductsku-productname-productcategory-price-quantity
  addEcommerceItem({ sku, productName, productCategory, productPrice = 0, productQuantity = 1 }) {
    this.pushInstruction("addEcommerceItem", sku, productName, productCategory, productPrice, productQuantity);
  }
  // Removes a product from an Ecommerce order to be tracked via trackEcommerceOrder.
  // https://matomo.org/docs/ecommerce-analytics
  removeEcommerceItem({ sku }) {
    this.pushInstruction("removeEcommerceItem", sku);
  }
  // Removes all products from an Ecommerce order to be tracked via trackEcommerceOrder.
  // https://matomo.org/docs/ecommerce-analytics
  clearEcommerceCart() {
    this.pushInstruction("clearEcommerceCart");
  }
  // Tracks an Ecommerce order containing items added via addEcommerceItem.
  // https://matomo.org/docs/ecommerce-analytics/#2-trackecommerceorderorderid-revenue-subtotal-tax-shipping-discount
  trackEcommerceOrder({ orderId, orderRevenue, orderSubTotal, taxAmount, shippingAmount, discountOffered = false }) {
    this.track({
      data: [
        TRACK_TYPES.TRACK_ECOMMERCE_ORDER,
        orderId,
        orderRevenue,
        orderSubTotal,
        taxAmount,
        shippingAmount,
        discountOffered
      ]
    });
  }
  // Tracks updates to an Ecommerce Cart before an actual purchase.
  // This will replace currently tracked information of the cart. Always include all items of the updated cart!
  // https://matomo.org/docs/ecommerce-analytics/#example-tracking-an-ecommerce-cart-update-containing-two-products
  trackEcommerceCartUpdate(amount) {
    this.pushInstruction(TRACK_TYPES.TRACK_ECOMMERCE_CART_UPDATE, amount);
  }
  // Marks the next page view as an Ecommerce product page.
  // https://matomo.org/docs/ecommerce-analytics/#example-tracking-a-product-page-view
  setEcommerceView({ sku, productName, productCategory, productPrice }) {
    this.pushInstruction("setEcommerceView", sku, productName, productCategory, productPrice);
  }
  // Marks the next tracked page view as an Ecommerce category page.
  // https://matomo.org/docs/ecommerce-analytics/#example-tracking-a-category-page-view
  setEcommerceCategoryView(productCategory) {
    this.setEcommerceView({ productCategory, productName: false, sku: false });
  }
  // Sends the tracked page/view/search to Matomo
  track({ data = [], documentTitle = window.document.title, href, customDimensions = false }) {
    if (data.length) {
      if (customDimensions && Array.isArray(customDimensions) && customDimensions.length) {
        customDimensions.map((customDimension) => this.pushInstruction("setCustomDimension", customDimension.id, customDimension.value));
      }
      this.pushInstruction("setCustomUrl", href !== null && href !== void 0 ? href : window.location.href);
      this.pushInstruction("setDocumentTitle", documentTitle);
      this.pushInstruction(...data);
    }
  }
  /**
   * Pushes an instruction to Matomo for execution, this is equivalent to pushing entries into the `_paq` array.
   *
   * For example:
   *
   * ```ts
   * pushInstruction('setDocumentTitle', document.title)
   * ```
   * Is the equivalent of:
   *
   * ```ts
   * _paq.push(['setDocumentTitle', document.title]);
   * ```
   *
   * @param name The name of the instruction to be executed.
   * @param args The arguments to pass along with the instruction.
   */
  pushInstruction(name, ...args) {
    if (typeof window !== "undefined") {
      window._paq.push([name, ...args]);
    }
    return this;
  }
};
var MatomoTracker_default = MatomoTracker;

// ../../../../../node_modules/@jonkoops/matomo-tracker/es/index.js
var es_default = MatomoTracker_default;

// src/js/Functionalities/matomo.tracking.ts
var _Matomo_Tracking = class _Matomo_Tracking {
  static functionality(toLoad, toProcess) {
    const siteID = Number.parseInt(toLoad.siteid || window.codbiSettings.Matomo.SiteID);
    const url = toLoad.url || window.codbiSettings.Matomo.URL;
    if (siteID === void 0 || url === void 0) {
      throw new CodBiError(
        `Functionality / Matomo.Tracking was activated but ${siteID === void 0 ? url === void 0 ? "no SiteID and no Matomo-Server-URL" : "no SiteID" : "no Matomo-Server-URL"} was specified.`
      );
    }
    new es_default({ siteId: Number.parseInt(toLoad.siteid), urlBase: toLoad.url }).trackPageView();
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link Matomo_Tracking } was successfully registered
     * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerFunctionality("Matomo.Tracking", _Matomo_Tracking.functionality);
    })();
  }
  // #endregion Initialization
};
__decorateClass([
  DBC.ParamvalueProvider
], _Matomo_Tracking, "functionality", 1);
var Matomo_Tracking = _Matomo_Tracking;
export {
  Matomo_Tracking
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tYXRvbW8udHJhY2tpbmcudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bqb25rb29wcy9tYXRvbW8tdHJhY2tlci9zcmMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Aam9ua29vcHMvbWF0b21vLXRyYWNrZXIvc3JjL01hdG9tb1RyYWNrZXIudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bqb25rb29wcy9tYXRvbW8tdHJhY2tlci9zcmMvaW5kZXgudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG4vLyAjcmVnaW9uIE1hdG9tb1xuaW1wb3J0IE1hdG9tb1RyYWNrZXIgZnJvbSBcIkBqb25rb29wcy9tYXRvbW8tdHJhY2tlclwiO1xuLy8gI2VuZHJlZ2lvbiBNYXRvbW9cbi8vICNyZWdpb24gWERCQ1xuaW1wb3J0IHsgREJDIH0gZnJvbSBcInhkYmMvc3JjL0RCQ1wiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuaW1wb3J0IHsgUkVHRVggfSBmcm9tIFwieGRiYy9zcmMvREJDL1JFR0VYXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbmltcG9ydCB7IENvZEJpRXJyb3IgfSBmcm9tIFwiLi4vZ2xvYmFsLXNjb3BlLmpzXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBIVE1MX1NlbGVjdF9JbmplY3Rpb24uZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIE1hdG9tb19UcmFja2luZyB7XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiTWF0b21vLlRyYWNraW5nXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IGNvbm5lY3RzIHRvIGEgKipNYXRvbW8tU2VydmVyKiosIHRoYXQgaXMgZWl0aGVyIHNwZWNpZmllZCBpbiB0aGUgUGx1Z2luLUNvbmZpZyAoKipNYXRvbW9fVVJMKiopXG4gICAqIG9yIGluIHRoaXMgZnVuY3Rpb25hbGl0aWUncyBwYXJhbWV0ZXIgKCoqVVJMKiopIHdoaWxlIHRoZSBmdW5jdGlvbmFsaXR5IHBhcmFtZXRlciB0YWtlcyBwcmVjZWRlbmNlLCBhbmQgaW5pdGlhdGVzXG4gICAqIHRyYWNraW5nIHRvIGEgc3BlY2lmaWVkICoqU2l0ZS1JRCoqLiBUaGUgKipTaXRlLUlEKiogaXMgZWl0aGVyIHNwZWNpZmllZCBvIG4gdGhlIFBMdWdpbi1Db25maWcgKCoqTWF0b21vX1NpdGVJRCoqKVxuICAgKiBvciBpbiB0aGUgZnVuY3Rpb25hbGl0aWUncyBwYXJhbWV0ZXIgKCoqU2l0ZUlEKiopIHdoaWxlIHRoZSBmdW5jdGlvbmFsaXR5IHBhcmFtZXRlciB0YWtlcyBwcmVjZWRlbmNlLlxuICAgKlxuICAgKiBDb25maWcgUGFyYW1ldGVyOlxuICAgKiAgLSBVUkw6ICAgIFRoZSBVUkwgb2YgdGhlIE1hdG9tby1TZXJ2ZXIgdGhhdCBzaGFsbCB0cmFjayB0aGUgdGFnZ2VkIGZvcm0uXG4gICAqICAtIFNpdGVJRDogVGhlIElEIG9mIHRoZSBNYXRvbW8tUHJvamVjdC1TaXRlIHRoYXQgc2hhbGwgYmUgdXNlZCBmb3IgdHJhY2tpbmcuICovXG4gIEBEQkMuUGFyYW12YWx1ZVByb3ZpZGVyXG4gIHB1YmxpYyBzdGF0aWMgZnVuY3Rpb25hbGl0eSh0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sIHRvUHJvY2VzczogRWxlbWVudCk6IHZvaWQge1xuICAgIGNvbnN0IHNpdGVJRCA9IE51bWJlci5wYXJzZUludCh0b0xvYWQuc2l0ZWlkIHx8IHdpbmRvdy5jb2RiaVNldHRpbmdzLk1hdG9tby5TaXRlSUQpO1xuICAgIGNvbnN0IHVybCA9IHRvTG9hZC51cmwgfHwgd2luZG93LmNvZGJpU2V0dGluZ3MuTWF0b21vLlVSTDtcblxuICAgIGlmIChzaXRlSUQgPT09IHVuZGVmaW5lZCB8fCB1cmwgPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IENvZEJpRXJyb3IoXG4gICAgICAgIGBGdW5jdGlvbmFsaXR5IC8gTWF0b21vLlRyYWNraW5nIHdhcyBhY3RpdmF0ZWQgYnV0ICR7c2l0ZUlEID09PSB1bmRlZmluZWQgPyAodXJsID09PSB1bmRlZmluZWQgPyBcIm5vIFNpdGVJRCBhbmQgbm8gTWF0b21vLVNlcnZlci1VUkxcIiA6IFwibm8gU2l0ZUlEXCIpIDogXCJubyBNYXRvbW8tU2VydmVyLVVSTFwifSB3YXMgc3BlY2lmaWVkLmAsXG4gICAgICApO1xuICAgIH1cblxuICAgIG5ldyBNYXRvbW9UcmFja2VyKHsgc2l0ZUlkOiBOdW1iZXIucGFyc2VJbnQodG9Mb2FkLnNpdGVpZCksIHVybEJhc2U6IHRvTG9hZC51cmwgfSkudHJhY2tQYWdlVmlldygpO1xuICB9XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIE1hdG9tb19UcmFja2luZyB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eSB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRnVuY3Rpb25hbGl0eShcIk1hdG9tby5UcmFja2luZ1wiLCBNYXRvbW9fVHJhY2tpbmcuZnVuY3Rpb25hbGl0eSk7XG4gIH0pKCk7XG4gIC8vICNlbmRyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbiIsICIvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgaW1wb3J0L3ByZWZlci1kZWZhdWx0LWV4cG9ydFxuZXhwb3J0IGNvbnN0IFRSQUNLX1RZUEVTID0ge1xuICBUUkFDS19FVkVOVDogJ3RyYWNrRXZlbnQnLFxuICBUUkFDS19MSU5LOiAndHJhY2tMaW5rJyxcbiAgVFJBQ0tfU0VBUkNIOiAndHJhY2tTaXRlU2VhcmNoJyxcbiAgVFJBQ0tfVklFVzogJ3RyYWNrUGFnZVZpZXcnLFxuICBUUkFDS19FQ09NTUVSQ0VfT1JERVI6ICd0cmFja0Vjb21tZXJjZU9yZGVyJyxcbiAgVFJBQ0tfRUNPTU1FUkNFX0NBUlRfVVBEQVRFOiAndHJhY2tFY29tbWVyY2VDYXJ0VXBkYXRlJyxcbn1cbiIsICJpbXBvcnQgeyBUUkFDS19UWVBFUyB9IGZyb20gJy4vY29uc3RhbnRzJ1xuaW1wb3J0IHtcbiAgQWRkRWNvbW1lcmNlSXRlbVBhcmFtcyxcbiAgUmVtb3ZlRWNvbW1lcmNlSXRlbVBhcmFtcyxcbiAgQ3VzdG9tRGltZW5zaW9uLFxuICBTZXRFY29tbWVyY2VWaWV3UGFyYW1zLFxuICBUcmFja0Vjb21tZXJjZU9yZGVyUGFyYW1zLFxuICBUcmFja0V2ZW50UGFyYW1zLFxuICBUcmFja0xpbmtQYXJhbXMsXG4gIFRyYWNrUGFnZVZpZXdQYXJhbXMsXG4gIFRyYWNrUGFyYW1zLFxuICBUcmFja1NpdGVTZWFyY2hQYXJhbXMsXG4gIFVzZXJPcHRpb25zLFxufSBmcm9tICcuL3R5cGVzJ1xuXG5jbGFzcyBNYXRvbW9UcmFja2VyIHtcbiAgbXV0YXRpb25PYnNlcnZlcj86IE11dGF0aW9uT2JzZXJ2ZXJcblxuICBjb25zdHJ1Y3Rvcih1c2VyT3B0aW9uczogVXNlck9wdGlvbnMpIHtcbiAgICBpZiAoIXVzZXJPcHRpb25zLnVybEJhc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWF0b21vIHVybEJhc2UgaXMgcmVxdWlyZWQuJylcbiAgICB9XG4gICAgaWYgKCF1c2VyT3B0aW9ucy5zaXRlSWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTWF0b21vIHNpdGVJZCBpcyByZXF1aXJlZC4nKVxuICAgIH1cblxuICAgIHRoaXMuaW5pdGlhbGl6ZSh1c2VyT3B0aW9ucylcbiAgfVxuXG4gIHByaXZhdGUgaW5pdGlhbGl6ZSh7XG4gICAgdXJsQmFzZSxcbiAgICBzaXRlSWQsXG4gICAgdXNlcklkLFxuICAgIHRyYWNrZXJVcmwsXG4gICAgc3JjVXJsLFxuICAgIGRpc2FibGVkLFxuICAgIGhlYXJ0QmVhdCxcbiAgICBsaW5rVHJhY2tpbmcgPSB0cnVlLFxuICAgIGNvbmZpZ3VyYXRpb25zID0ge30sXG4gIH06IFVzZXJPcHRpb25zKSB7XG4gICAgY29uc3Qgbm9ybWFsaXplZFVybEJhc2UgPVxuICAgICAgdXJsQmFzZVt1cmxCYXNlLmxlbmd0aCAtIDFdICE9PSAnLycgPyBgJHt1cmxCYXNlfS9gIDogdXJsQmFzZVxuXG4gICAgaWYgKHR5cGVvZiB3aW5kb3cgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICB3aW5kb3cuX3BhcSA9IHdpbmRvdy5fcGFxIHx8IFtdXG5cbiAgICBpZiAod2luZG93Ll9wYXEubGVuZ3RoICE9PSAwKSB7XG4gICAgICByZXR1cm5cbiAgICB9XG5cbiAgICBpZiAoZGlzYWJsZWQpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKFxuICAgICAgJ3NldFRyYWNrZXJVcmwnLFxuICAgICAgdHJhY2tlclVybCA/PyBgJHtub3JtYWxpemVkVXJsQmFzZX1tYXRvbW8ucGhwYCxcbiAgICApXG5cbiAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbignc2V0U2l0ZUlkJywgc2l0ZUlkKVxuXG4gICAgaWYgKHVzZXJJZCkge1xuICAgICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oJ3NldFVzZXJJZCcsIHVzZXJJZClcbiAgICB9XG5cbiAgICBPYmplY3QuZW50cmllcyhjb25maWd1cmF0aW9ucykuZm9yRWFjaCgoW25hbWUsIGluc3RydWN0aW9uc10pID0+IHtcbiAgICAgIGlmIChpbnN0cnVjdGlvbnMgaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVuc2FmZS1hcmd1bWVudFxuICAgICAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbihuYW1lLCAuLi5pbnN0cnVjdGlvbnMpXG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbihuYW1lLCBpbnN0cnVjdGlvbnMpXG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIGFjY3VyYXRlbHkgbWVhc3VyZSB0aGUgdGltZSBzcGVudCBvbiB0aGUgbGFzdCBwYWdldmlldyBvZiBhIHZpc2l0XG4gICAgaWYgKCFoZWFydEJlYXQgfHwgKGhlYXJ0QmVhdCAmJiBoZWFydEJlYXQuYWN0aXZlKSkge1xuICAgICAgdGhpcy5lbmFibGVIZWFydEJlYXRUaW1lcigoaGVhcnRCZWF0ICYmIGhlYXJ0QmVhdC5zZWNvbmRzKSA/PyAxNSlcbiAgICB9XG5cbiAgICAvLyAvLyBtZWFzdXJlIG91dGJvdW5kIGxpbmtzIGFuZCBkb3dubG9hZHNcbiAgICAvLyAvLyBtaWdodCBub3Qgd29yayBhY2N1cmF0ZWx5IG9uIFNQQXMgYmVjYXVzZSBuZXcgbGlua3MgKGRvbSBlbGVtZW50cykgYXJlIGNyZWF0ZWQgZHluYW1pY2FsbHkgd2l0aG91dCBhIHNlcnZlci1zaWRlIHBhZ2UgcmVsb2FkLlxuICAgIHRoaXMuZW5hYmxlTGlua1RyYWNraW5nKGxpbmtUcmFja2luZylcblxuICAgIGNvbnN0IGRvYyA9IGRvY3VtZW50XG4gICAgY29uc3Qgc2NyaXB0RWxlbWVudCA9IGRvYy5jcmVhdGVFbGVtZW50KCdzY3JpcHQnKVxuICAgIGNvbnN0IHNjcmlwdHMgPSBkb2MuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ3NjcmlwdCcpWzBdXG5cbiAgICBzY3JpcHRFbGVtZW50LnR5cGUgPSAndGV4dC9qYXZhc2NyaXB0J1xuICAgIHNjcmlwdEVsZW1lbnQuYXN5bmMgPSB0cnVlXG4gICAgc2NyaXB0RWxlbWVudC5kZWZlciA9IHRydWVcbiAgICBzY3JpcHRFbGVtZW50LnNyYyA9IHNyY1VybCB8fCBgJHtub3JtYWxpemVkVXJsQmFzZX1tYXRvbW8uanNgXG5cbiAgICBpZiAoc2NyaXB0cyAmJiBzY3JpcHRzLnBhcmVudE5vZGUpIHtcbiAgICAgIHNjcmlwdHMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc2NyaXB0RWxlbWVudCwgc2NyaXB0cylcbiAgICB9XG4gIH1cblxuICBlbmFibGVIZWFydEJlYXRUaW1lcihzZWNvbmRzOiBudW1iZXIpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbignZW5hYmxlSGVhcnRCZWF0VGltZXInLCBzZWNvbmRzKVxuICB9XG5cbiAgZW5hYmxlTGlua1RyYWNraW5nKGFjdGl2ZTogYm9vbGVhbik6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdlbmFibGVMaW5rVHJhY2tpbmcnLCBhY3RpdmUpXG4gIH1cblxuICBwcml2YXRlIHRyYWNrRXZlbnRzRm9yRWxlbWVudHMoZWxlbWVudHM6IEhUTUxFbGVtZW50W10pIHtcbiAgICBpZiAoZWxlbWVudHMubGVuZ3RoKSB7XG4gICAgICBlbGVtZW50cy5mb3JFYWNoKChlbGVtZW50KSA9PiB7XG4gICAgICAgIGVsZW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgICAgY29uc3QgeyBtYXRvbW9DYXRlZ29yeSwgbWF0b21vQWN0aW9uLCBtYXRvbW9OYW1lLCBtYXRvbW9WYWx1ZSB9ID1cbiAgICAgICAgICAgIGVsZW1lbnQuZGF0YXNldFxuICAgICAgICAgIGlmIChtYXRvbW9DYXRlZ29yeSAmJiBtYXRvbW9BY3Rpb24pIHtcbiAgICAgICAgICAgIHRoaXMudHJhY2tFdmVudCh7XG4gICAgICAgICAgICAgIGNhdGVnb3J5OiBtYXRvbW9DYXRlZ29yeSxcbiAgICAgICAgICAgICAgYWN0aW9uOiBtYXRvbW9BY3Rpb24sXG4gICAgICAgICAgICAgIG5hbWU6IG1hdG9tb05hbWUsXG4gICAgICAgICAgICAgIHZhbHVlOiBOdW1iZXIobWF0b21vVmFsdWUpLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgICAgICBgRXJyb3I6IGRhdGEtbWF0b21vLWNhdGVnb3J5IGFuZCBkYXRhLW1hdG9tby1hY3Rpb24gYXJlIHJlcXVpcmVkLmAsXG4gICAgICAgICAgICApXG4gICAgICAgICAgfVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gIH1cblxuICAvLyBUcmFja3MgZXZlbnRzIGJhc2VkIG9uIGRhdGEgYXR0cmlidXRlc1xuICB0cmFja0V2ZW50cygpOiB2b2lkIHtcbiAgICBjb25zdCBtYXRjaFN0cmluZyA9ICdbZGF0YS1tYXRvbW8tZXZlbnQ9XCJjbGlja1wiXSdcbiAgICBsZXQgZmlyc3RUaW1lID0gZmFsc2VcbiAgICBpZiAoIXRoaXMubXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgZmlyc3RUaW1lID0gdHJ1ZVxuICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyID0gbmV3IE11dGF0aW9uT2JzZXJ2ZXIoKG11dGF0aW9ucykgPT4ge1xuICAgICAgICBtdXRhdGlvbnMuZm9yRWFjaCgobXV0YXRpb24pID0+IHtcbiAgICAgICAgICBtdXRhdGlvbi5hZGRlZE5vZGVzLmZvckVhY2goKG5vZGUpID0+IHtcbiAgICAgICAgICAgIC8vIG9ubHkgdHJhY2sgSFRNTCBlbGVtZW50c1xuICAgICAgICAgICAgaWYgKCEobm9kZSBpbnN0YW5jZW9mIEhUTUxFbGVtZW50KSkgcmV0dXJuXG5cbiAgICAgICAgICAgIC8vIGNoZWNrIHRoZSBpbnNlcnRlZCBlbGVtZW50IGZvciBiZWluZyBhIGNvZGUgc25pcHBldFxuICAgICAgICAgICAgaWYgKG5vZGUubWF0Y2hlcyhtYXRjaFN0cmluZykpIHtcbiAgICAgICAgICAgICAgdGhpcy50cmFja0V2ZW50c0ZvckVsZW1lbnRzKFtub2RlXSlcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBBcnJheS5mcm9tKFxuICAgICAgICAgICAgICBub2RlLnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KG1hdGNoU3RyaW5nKSxcbiAgICAgICAgICAgIClcbiAgICAgICAgICAgIHRoaXMudHJhY2tFdmVudHNGb3JFbGVtZW50cyhlbGVtZW50cylcbiAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgICAgfSlcbiAgICB9XG4gICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyLm9ic2VydmUoZG9jdW1lbnQsIHsgY2hpbGRMaXN0OiB0cnVlLCBzdWJ0cmVlOiB0cnVlIH0pXG5cbiAgICAvLyBOb3cgdHJhY2sgYWxsIGFscmVhZHkgZXhpc3RpbmcgZWxlbWVudHNcbiAgICBpZiAoZmlyc3RUaW1lKSB7XG4gICAgICBjb25zdCBlbGVtZW50cyA9IEFycmF5LmZyb20oXG4gICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGw8SFRNTEVsZW1lbnQ+KG1hdGNoU3RyaW5nKSxcbiAgICAgIClcbiAgICAgIHRoaXMudHJhY2tFdmVudHNGb3JFbGVtZW50cyhlbGVtZW50cylcbiAgICB9XG4gIH1cblxuICBzdG9wT2JzZXJ2aW5nKCk6IHZvaWQge1xuICAgIGlmICh0aGlzLm11dGF0aW9uT2JzZXJ2ZXIpIHtcbiAgICAgIHRoaXMubXV0YXRpb25PYnNlcnZlci5kaXNjb25uZWN0KClcbiAgICB9XG4gIH1cblxuICAvLyBUcmFja3MgZXZlbnRzXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2V2ZW50LXRyYWNraW5nLyN0cmFja2luZy1ldmVudHNcbiAgdHJhY2tFdmVudCh7XG4gICAgY2F0ZWdvcnksXG4gICAgYWN0aW9uLFxuICAgIG5hbWUsXG4gICAgdmFsdWUsXG4gICAgLi4ub3RoZXJQYXJhbXNcbiAgfTogVHJhY2tFdmVudFBhcmFtcyk6IHZvaWQge1xuICAgIGlmIChjYXRlZ29yeSAmJiBhY3Rpb24pIHtcbiAgICAgIHRoaXMudHJhY2soe1xuICAgICAgICBkYXRhOiBbVFJBQ0tfVFlQRVMuVFJBQ0tfRVZFTlQsIGNhdGVnb3J5LCBhY3Rpb24sIG5hbWUsIHZhbHVlXSxcbiAgICAgICAgLi4ub3RoZXJQYXJhbXMsXG4gICAgICB9KVxuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoYEVycm9yOiBjYXRlZ29yeSBhbmQgYWN0aW9uIGFyZSByZXF1aXJlZC5gKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyYWNrcyBzaXRlIHNlYXJjaFxuICAvLyBodHRwczovL2RldmVsb3Blci5tYXRvbW8ub3JnL2d1aWRlcy90cmFja2luZy1qYXZhc2NyaXB0LWd1aWRlI2ludGVybmFsLXNlYXJjaC10cmFja2luZ1xuICB0cmFja1NpdGVTZWFyY2goe1xuICAgIGtleXdvcmQsXG4gICAgY2F0ZWdvcnksXG4gICAgY291bnQsXG4gICAgLi4ub3RoZXJQYXJhbXNcbiAgfTogVHJhY2tTaXRlU2VhcmNoUGFyYW1zKTogdm9pZCB7XG4gICAgaWYgKGtleXdvcmQpIHtcbiAgICAgIHRoaXMudHJhY2soe1xuICAgICAgICBkYXRhOiBbVFJBQ0tfVFlQRVMuVFJBQ0tfU0VBUkNILCBrZXl3b3JkLCBjYXRlZ29yeSwgY291bnRdLFxuICAgICAgICAuLi5vdGhlclBhcmFtcyxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3I6IGtleXdvcmQgaXMgcmVxdWlyZWQuYClcbiAgICB9XG4gIH1cblxuICAvLyBUcmFja3Mgb3V0Z29pbmcgbGlua3MgdG8gb3RoZXIgc2l0ZXMgYW5kIGRvd25sb2Fkc1xuICAvLyBodHRwczovL2RldmVsb3Blci5tYXRvbW8ub3JnL2d1aWRlcy90cmFja2luZy1qYXZhc2NyaXB0LWd1aWRlI2VuYWJsaW5nLWRvd25sb2FkLW91dGxpbmstdHJhY2tpbmdcbiAgdHJhY2tMaW5rKHsgaHJlZiwgbGlua1R5cGUgPSAnbGluaycgfTogVHJhY2tMaW5rUGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oVFJBQ0tfVFlQRVMuVFJBQ0tfTElOSywgaHJlZiwgbGlua1R5cGUpXG4gIH1cblxuICAvLyBUcmFja3MgcGFnZSB2aWV3c1xuICAvLyBodHRwczovL2RldmVsb3Blci5tYXRvbW8ub3JnL2d1aWRlcy9zcGEtdHJhY2tpbmcjdHJhY2tpbmctYS1uZXctcGFnZS12aWV3XG4gIHRyYWNrUGFnZVZpZXcocGFyYW1zPzogVHJhY2tQYWdlVmlld1BhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMudHJhY2soeyBkYXRhOiBbVFJBQ0tfVFlQRVMuVFJBQ0tfVklFV10sIC4uLnBhcmFtcyB9KVxuICB9XG5cbiAgLy8gQWRkcyBhIHByb2R1Y3QgdG8gYW4gRWNvbW1lcmNlIG9yZGVyIHRvIGJlIHRyYWNrZWQgdmlhIHRyYWNrRWNvbW1lcmNlT3JkZXIuXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3NcbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljcy8jMS1hZGRlY29tbWVyY2VpdGVtcHJvZHVjdHNrdS1wcm9kdWN0bmFtZS1wcm9kdWN0Y2F0ZWdvcnktcHJpY2UtcXVhbnRpdHlcbiAgYWRkRWNvbW1lcmNlSXRlbSh7XG4gICAgc2t1LFxuICAgIHByb2R1Y3ROYW1lLFxuICAgIHByb2R1Y3RDYXRlZ29yeSxcbiAgICBwcm9kdWN0UHJpY2UgPSAwLjAsXG4gICAgcHJvZHVjdFF1YW50aXR5ID0gMSxcbiAgfTogQWRkRWNvbW1lcmNlSXRlbVBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKFxuICAgICAgJ2FkZEVjb21tZXJjZUl0ZW0nLFxuICAgICAgc2t1LFxuICAgICAgcHJvZHVjdE5hbWUsXG4gICAgICBwcm9kdWN0Q2F0ZWdvcnksXG4gICAgICBwcm9kdWN0UHJpY2UsXG4gICAgICBwcm9kdWN0UXVhbnRpdHksXG4gICAgKVxuICB9XG5cbiAgLy8gUmVtb3ZlcyBhIHByb2R1Y3QgZnJvbSBhbiBFY29tbWVyY2Ugb3JkZXIgdG8gYmUgdHJhY2tlZCB2aWEgdHJhY2tFY29tbWVyY2VPcmRlci5cbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljc1xuICByZW1vdmVFY29tbWVyY2VJdGVtKHsgc2t1IH06IFJlbW92ZUVjb21tZXJjZUl0ZW1QYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbigncmVtb3ZlRWNvbW1lcmNlSXRlbScsIHNrdSlcbiAgfVxuXG4gIC8vIFJlbW92ZXMgYWxsIHByb2R1Y3RzIGZyb20gYW4gRWNvbW1lcmNlIG9yZGVyIHRvIGJlIHRyYWNrZWQgdmlhIHRyYWNrRWNvbW1lcmNlT3JkZXIuXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3NcbiAgY2xlYXJFY29tbWVyY2VDYXJ0KCk6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdjbGVhckVjb21tZXJjZUNhcnQnKVxuICB9XG5cbiAgLy8gVHJhY2tzIGFuIEVjb21tZXJjZSBvcmRlciBjb250YWluaW5nIGl0ZW1zIGFkZGVkIHZpYSBhZGRFY29tbWVyY2VJdGVtLlxuICAvLyBodHRwczovL21hdG9tby5vcmcvZG9jcy9lY29tbWVyY2UtYW5hbHl0aWNzLyMyLXRyYWNrZWNvbW1lcmNlb3JkZXJvcmRlcmlkLXJldmVudWUtc3VidG90YWwtdGF4LXNoaXBwaW5nLWRpc2NvdW50XG4gIHRyYWNrRWNvbW1lcmNlT3JkZXIoe1xuICAgIG9yZGVySWQsXG4gICAgb3JkZXJSZXZlbnVlLFxuICAgIG9yZGVyU3ViVG90YWwsXG4gICAgdGF4QW1vdW50LFxuICAgIHNoaXBwaW5nQW1vdW50LFxuICAgIGRpc2NvdW50T2ZmZXJlZCA9IGZhbHNlLFxuICB9OiBUcmFja0Vjb21tZXJjZU9yZGVyUGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy50cmFjayh7XG4gICAgICBkYXRhOiBbXG4gICAgICAgIFRSQUNLX1RZUEVTLlRSQUNLX0VDT01NRVJDRV9PUkRFUixcbiAgICAgICAgb3JkZXJJZCxcbiAgICAgICAgb3JkZXJSZXZlbnVlLFxuICAgICAgICBvcmRlclN1YlRvdGFsLFxuICAgICAgICB0YXhBbW91bnQsXG4gICAgICAgIHNoaXBwaW5nQW1vdW50LFxuICAgICAgICBkaXNjb3VudE9mZmVyZWQsXG4gICAgICBdLFxuICAgIH0pXG4gIH1cblxuICAvLyBUcmFja3MgdXBkYXRlcyB0byBhbiBFY29tbWVyY2UgQ2FydCBiZWZvcmUgYW4gYWN0dWFsIHB1cmNoYXNlLlxuICAvLyBUaGlzIHdpbGwgcmVwbGFjZSBjdXJyZW50bHkgdHJhY2tlZCBpbmZvcm1hdGlvbiBvZiB0aGUgY2FydC4gQWx3YXlzIGluY2x1ZGUgYWxsIGl0ZW1zIG9mIHRoZSB1cGRhdGVkIGNhcnQhXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3MvI2V4YW1wbGUtdHJhY2tpbmctYW4tZWNvbW1lcmNlLWNhcnQtdXBkYXRlLWNvbnRhaW5pbmctdHdvLXByb2R1Y3RzXG4gIHRyYWNrRWNvbW1lcmNlQ2FydFVwZGF0ZShhbW91bnQ6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKFRSQUNLX1RZUEVTLlRSQUNLX0VDT01NRVJDRV9DQVJUX1VQREFURSwgYW1vdW50KVxuICB9XG5cbiAgLy8gTWFya3MgdGhlIG5leHQgcGFnZSB2aWV3IGFzIGFuIEVjb21tZXJjZSBwcm9kdWN0IHBhZ2UuXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3MvI2V4YW1wbGUtdHJhY2tpbmctYS1wcm9kdWN0LXBhZ2Utdmlld1xuICBzZXRFY29tbWVyY2VWaWV3KHtcbiAgICBza3UsXG4gICAgcHJvZHVjdE5hbWUsXG4gICAgcHJvZHVjdENhdGVnb3J5LFxuICAgIHByb2R1Y3RQcmljZSxcbiAgfTogU2V0RWNvbW1lcmNlVmlld1BhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKFxuICAgICAgJ3NldEVjb21tZXJjZVZpZXcnLFxuICAgICAgc2t1LFxuICAgICAgcHJvZHVjdE5hbWUsXG4gICAgICBwcm9kdWN0Q2F0ZWdvcnksXG4gICAgICBwcm9kdWN0UHJpY2UsXG4gICAgKVxuICB9XG5cbiAgLy8gTWFya3MgdGhlIG5leHQgdHJhY2tlZCBwYWdlIHZpZXcgYXMgYW4gRWNvbW1lcmNlIGNhdGVnb3J5IHBhZ2UuXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3MvI2V4YW1wbGUtdHJhY2tpbmctYS1jYXRlZ29yeS1wYWdlLXZpZXdcbiAgc2V0RWNvbW1lcmNlQ2F0ZWdvcnlWaWV3KHByb2R1Y3RDYXRlZ29yeTogc3RyaW5nKTogdm9pZCB7XG4gICAgdGhpcy5zZXRFY29tbWVyY2VWaWV3KHsgcHJvZHVjdENhdGVnb3J5LCBwcm9kdWN0TmFtZTogZmFsc2UsIHNrdTogZmFsc2UgfSlcbiAgfVxuXG4gIC8vIFNlbmRzIHRoZSB0cmFja2VkIHBhZ2Uvdmlldy9zZWFyY2ggdG8gTWF0b21vXG4gIHRyYWNrKHtcbiAgICBkYXRhID0gW10sXG4gICAgZG9jdW1lbnRUaXRsZSA9IHdpbmRvdy5kb2N1bWVudC50aXRsZSxcbiAgICBocmVmLFxuICAgIGN1c3RvbURpbWVuc2lvbnMgPSBmYWxzZSxcbiAgfTogVHJhY2tQYXJhbXMpOiB2b2lkIHtcbiAgICBpZiAoZGF0YS5sZW5ndGgpIHtcbiAgICAgIGlmIChcbiAgICAgICAgY3VzdG9tRGltZW5zaW9ucyAmJlxuICAgICAgICBBcnJheS5pc0FycmF5KGN1c3RvbURpbWVuc2lvbnMpICYmXG4gICAgICAgIGN1c3RvbURpbWVuc2lvbnMubGVuZ3RoXG4gICAgICApIHtcbiAgICAgICAgY3VzdG9tRGltZW5zaW9ucy5tYXAoKGN1c3RvbURpbWVuc2lvbjogQ3VzdG9tRGltZW5zaW9uKSA9PlxuICAgICAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKFxuICAgICAgICAgICAgJ3NldEN1c3RvbURpbWVuc2lvbicsXG4gICAgICAgICAgICBjdXN0b21EaW1lbnNpb24uaWQsXG4gICAgICAgICAgICBjdXN0b21EaW1lbnNpb24udmFsdWUsXG4gICAgICAgICAgKSxcbiAgICAgICAgKVxuICAgICAgfVxuXG4gICAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbignc2V0Q3VzdG9tVXJsJywgaHJlZiA/PyB3aW5kb3cubG9jYXRpb24uaHJlZilcbiAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdzZXREb2N1bWVudFRpdGxlJywgZG9jdW1lbnRUaXRsZSlcbiAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKC4uLihkYXRhIGFzIFtzdHJpbmcsIC4uLmFueVtdXSkpXG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICAqIFB1c2hlcyBhbiBpbnN0cnVjdGlvbiB0byBNYXRvbW8gZm9yIGV4ZWN1dGlvbiwgdGhpcyBpcyBlcXVpdmFsZW50IHRvIHB1c2hpbmcgZW50cmllcyBpbnRvIHRoZSBgX3BhcWAgYXJyYXkuXG4gICAqXG4gICAqIEZvciBleGFtcGxlOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBwdXNoSW5zdHJ1Y3Rpb24oJ3NldERvY3VtZW50VGl0bGUnLCBkb2N1bWVudC50aXRsZSlcbiAgICogYGBgXG4gICAqIElzIHRoZSBlcXVpdmFsZW50IG9mOlxuICAgKlxuICAgKiBgYGB0c1xuICAgKiBfcGFxLnB1c2goWydzZXREb2N1bWVudFRpdGxlJywgZG9jdW1lbnQudGl0bGVdKTtcbiAgICogYGBgXG4gICAqXG4gICAqIEBwYXJhbSBuYW1lIFRoZSBuYW1lIG9mIHRoZSBpbnN0cnVjdGlvbiB0byBiZSBleGVjdXRlZC5cbiAgICogQHBhcmFtIGFyZ3MgVGhlIGFyZ3VtZW50cyB0byBwYXNzIGFsb25nIHdpdGggdGhlIGluc3RydWN0aW9uLlxuICAgKi9cbiAgcHVzaEluc3RydWN0aW9uKG5hbWU6IHN0cmluZywgLi4uYXJnczogYW55W10pOiBNYXRvbW9UcmFja2VyIHtcbiAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuICAgICAgd2luZG93Ll9wYXEucHVzaChbbmFtZSwgLi4uYXJnc10pXG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXNcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBNYXRvbW9UcmFja2VyXG4iLCAiaW1wb3J0IE1hdG9tb1RyYWNrZXIgZnJvbSAnLi9NYXRvbW9UcmFja2VyJ1xuaW1wb3J0ICogYXMgdHlwZXMgZnJvbSAnLi90eXBlcydcblxuZGVjbGFyZSBnbG9iYWwge1xuICBpbnRlcmZhY2UgV2luZG93IHtcbiAgICBfcGFxOiBbc3RyaW5nLCAuLi5hbnlbXV1bXVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1hdG9tb1RyYWNrZXJcblxuZXhwb3J0IHsgdHlwZXMgfVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7OztBQ0RuQixJQUFNLGNBQWM7RUFDekIsYUFBYTtFQUNiLFlBQVk7RUFDWixjQUFjO0VBQ2QsWUFBWTtFQUNaLHVCQUF1QjtFQUN2Qiw2QkFBNkI7Ozs7Ozs7Ozs7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
