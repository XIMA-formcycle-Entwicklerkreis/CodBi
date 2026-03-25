import { OR } from "./chunk-YYG42PYR.js";
import { DEFINED } from "./chunk-JP4GUAZX.js";
import { IF } from "./chunk-2VQP2CFN.js";
import { REGEX } from "./chunk-F3IDEOQS.js";
import { TYPE } from "./chunk-O5T7YW22.js";
import { INSTANCE } from "./chunk-53TEMTGA.js";
import { DBC } from "./chunk-LFRFVRJV.js";
import { __decorateClass, __decorateParam } from "./chunk-AOJQKO6T.js";

// ../../../../../node_modules/@jonkoops/matomo-tracker/es/constants.js
var TRACK_TYPES = {
  TRACK_EVENT: "trackEvent",
  TRACK_LINK: "trackLink",
  TRACK_SEARCH: "trackSiteSearch",
  TRACK_VIEW: "trackPageView",
  TRACK_ECOMMERCE_ORDER: "trackEcommerceOrder",
  TRACK_ECOMMERCE_CART_UPDATE: "trackEcommerceCartUpdate",
};

// ../../../../../node_modules/@jonkoops/matomo-tracker/es/MatomoTracker.js
var __rest = function (s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
    for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
      if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
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
  initialize({
    urlBase,
    siteId,
    userId,
    trackerUrl,
    srcUrl,
    disabled,
    heartBeat,
    linkTracking = true,
    configurations = {},
  }) {
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
    this.pushInstruction(
      "setTrackerUrl",
      trackerUrl !== null && trackerUrl !== void 0 ? trackerUrl : `${normalizedUrlBase}matomo.php`,
    );
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
    if (!heartBeat || (heartBeat && heartBeat.active)) {
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
              value: Number(matomoValue),
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
            if (!(node instanceof HTMLElement)) return;
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
    var { category, action, name, value } = _a,
      otherParams = __rest(_a, ["category", "action", "name", "value"]);
    if (category && action) {
      this.track(Object.assign({ data: [TRACK_TYPES.TRACK_EVENT, category, action, name, value] }, otherParams));
    } else {
      throw new Error(`Error: category and action are required.`);
    }
  }
  // Tracks site search
  // https://developer.matomo.org/guides/tracking-javascript-guide#internal-search-tracking
  trackSiteSearch(_a) {
    var { keyword, category, count } = _a,
      otherParams = __rest(_a, ["keyword", "category", "count"]);
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
        discountOffered,
      ],
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
        customDimensions.map((customDimension) =>
          this.pushInstruction("setCustomDimension", customDimension.id, customDimension.value),
        );
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
var Matomo_Tracking = class {
  static functionality(toLoad, toProcess) {
    let siteID;
    let url;
    if (toLoad.siteID === void 0 || toLoad.siteID === "") {
      siteID = Number.parseInt(
        OR.tsCheck(
          window.codbiSettings.Matomo.SiteID,
          [new DEFINED(), new REGEX(/^\d+$/)],
          "SiteID was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
        ),
      );
    } else {
      siteID = Number.parseInt(toLoad.siteid);
    }
    if (toLoad.url === void 0 || toLoad.url === "") {
      url = OR.tsCheck(
        window.codbiSettings.Matomo.URL,
        [new DEFINED(), new REGEX(REGEX.stdExp.url)],
        "URL was not specified in the functionality parameter and is also not specified in the Plugin-Config.",
      );
    } else {
      url = toLoad.url;
    }
    try {
      new es_default({ siteId: siteID, urlBase: url }).trackPageView();
    } catch (X) {
      window.codbi.log("WARNING", `Matomo Tracking failed due to: ${X.message}`);
    }
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, TYPE.PRE("string", "url")),
    __decorateParam(0, TYPE.PRE("string", "siteid")),
    __decorateParam(0, IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "siteid")),
    __decorateParam(0, IF.PRE(new DEFINED(), new REGEX(REGEX.stdExp.url), "url")),
    __decorateParam(1, INSTANCE.PRE(HTMLElement)),
  ],
  Matomo_Tracking,
  "functionality",
  1,
);
window.codbi.registerFunctionality("Matomo.Tracking", Matomo_Tracking.functionality.bind(Matomo_Tracking));
export { Matomo_Tracking };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bqb25rb29wcy9tYXRvbW8tdHJhY2tlci9zcmMvY29uc3RhbnRzLnRzIiwgIi4uLy4uLy4uLy4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy9Aam9ua29vcHMvbWF0b21vLXRyYWNrZXIvc3JjL01hdG9tb1RyYWNrZXIudHMiLCAiLi4vLi4vLi4vLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL0Bqb25rb29wcy9tYXRvbW8tdHJhY2tlci9zcmMvaW5kZXgudHMiLCAiLi4vLi4vc3JjL2pzL0Z1bmN0aW9uYWxpdGllcy9tYXRvbW8udHJhY2tpbmcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBpbXBvcnQvcHJlZmVyLWRlZmF1bHQtZXhwb3J0XG5leHBvcnQgY29uc3QgVFJBQ0tfVFlQRVMgPSB7XG4gIFRSQUNLX0VWRU5UOiAndHJhY2tFdmVudCcsXG4gIFRSQUNLX0xJTks6ICd0cmFja0xpbmsnLFxuICBUUkFDS19TRUFSQ0g6ICd0cmFja1NpdGVTZWFyY2gnLFxuICBUUkFDS19WSUVXOiAndHJhY2tQYWdlVmlldycsXG4gIFRSQUNLX0VDT01NRVJDRV9PUkRFUjogJ3RyYWNrRWNvbW1lcmNlT3JkZXInLFxuICBUUkFDS19FQ09NTUVSQ0VfQ0FSVF9VUERBVEU6ICd0cmFja0Vjb21tZXJjZUNhcnRVcGRhdGUnLFxufVxuIiwgImltcG9ydCB7IFRSQUNLX1RZUEVTIH0gZnJvbSAnLi9jb25zdGFudHMnXG5pbXBvcnQge1xuICBBZGRFY29tbWVyY2VJdGVtUGFyYW1zLFxuICBSZW1vdmVFY29tbWVyY2VJdGVtUGFyYW1zLFxuICBDdXN0b21EaW1lbnNpb24sXG4gIFNldEVjb21tZXJjZVZpZXdQYXJhbXMsXG4gIFRyYWNrRWNvbW1lcmNlT3JkZXJQYXJhbXMsXG4gIFRyYWNrRXZlbnRQYXJhbXMsXG4gIFRyYWNrTGlua1BhcmFtcyxcbiAgVHJhY2tQYWdlVmlld1BhcmFtcyxcbiAgVHJhY2tQYXJhbXMsXG4gIFRyYWNrU2l0ZVNlYXJjaFBhcmFtcyxcbiAgVXNlck9wdGlvbnMsXG59IGZyb20gJy4vdHlwZXMnXG5cbmNsYXNzIE1hdG9tb1RyYWNrZXIge1xuICBtdXRhdGlvbk9ic2VydmVyPzogTXV0YXRpb25PYnNlcnZlclxuXG4gIGNvbnN0cnVjdG9yKHVzZXJPcHRpb25zOiBVc2VyT3B0aW9ucykge1xuICAgIGlmICghdXNlck9wdGlvbnMudXJsQmFzZSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXRvbW8gdXJsQmFzZSBpcyByZXF1aXJlZC4nKVxuICAgIH1cbiAgICBpZiAoIXVzZXJPcHRpb25zLnNpdGVJZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdNYXRvbW8gc2l0ZUlkIGlzIHJlcXVpcmVkLicpXG4gICAgfVxuXG4gICAgdGhpcy5pbml0aWFsaXplKHVzZXJPcHRpb25zKVxuICB9XG5cbiAgcHJpdmF0ZSBpbml0aWFsaXplKHtcbiAgICB1cmxCYXNlLFxuICAgIHNpdGVJZCxcbiAgICB1c2VySWQsXG4gICAgdHJhY2tlclVybCxcbiAgICBzcmNVcmwsXG4gICAgZGlzYWJsZWQsXG4gICAgaGVhcnRCZWF0LFxuICAgIGxpbmtUcmFja2luZyA9IHRydWUsXG4gICAgY29uZmlndXJhdGlvbnMgPSB7fSxcbiAgfTogVXNlck9wdGlvbnMpIHtcbiAgICBjb25zdCBub3JtYWxpemVkVXJsQmFzZSA9XG4gICAgICB1cmxCYXNlW3VybEJhc2UubGVuZ3RoIC0gMV0gIT09ICcvJyA/IGAke3VybEJhc2V9L2AgOiB1cmxCYXNlXG5cbiAgICBpZiAodHlwZW9mIHdpbmRvdyA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIHdpbmRvdy5fcGFxID0gd2luZG93Ll9wYXEgfHwgW11cblxuICAgIGlmICh3aW5kb3cuX3BhcS5sZW5ndGggIT09IDApIHtcbiAgICAgIHJldHVyblxuICAgIH1cblxuICAgIGlmIChkaXNhYmxlZCkge1xuICAgICAgcmV0dXJuXG4gICAgfVxuXG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oXG4gICAgICAnc2V0VHJhY2tlclVybCcsXG4gICAgICB0cmFja2VyVXJsID8/IGAke25vcm1hbGl6ZWRVcmxCYXNlfW1hdG9tby5waHBgLFxuICAgIClcblxuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdzZXRTaXRlSWQnLCBzaXRlSWQpXG5cbiAgICBpZiAodXNlcklkKSB7XG4gICAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbignc2V0VXNlcklkJywgdXNlcklkKVxuICAgIH1cblxuICAgIE9iamVjdC5lbnRyaWVzKGNvbmZpZ3VyYXRpb25zKS5mb3JFYWNoKChbbmFtZSwgaW5zdHJ1Y3Rpb25zXSkgPT4ge1xuICAgICAgaWYgKGluc3RydWN0aW9ucyBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW5zYWZlLWFyZ3VtZW50XG4gICAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKG5hbWUsIC4uLmluc3RydWN0aW9ucylcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKG5hbWUsIGluc3RydWN0aW9ucylcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gYWNjdXJhdGVseSBtZWFzdXJlIHRoZSB0aW1lIHNwZW50IG9uIHRoZSBsYXN0IHBhZ2V2aWV3IG9mIGEgdmlzaXRcbiAgICBpZiAoIWhlYXJ0QmVhdCB8fCAoaGVhcnRCZWF0ICYmIGhlYXJ0QmVhdC5hY3RpdmUpKSB7XG4gICAgICB0aGlzLmVuYWJsZUhlYXJ0QmVhdFRpbWVyKChoZWFydEJlYXQgJiYgaGVhcnRCZWF0LnNlY29uZHMpID8/IDE1KVxuICAgIH1cblxuICAgIC8vIC8vIG1lYXN1cmUgb3V0Ym91bmQgbGlua3MgYW5kIGRvd25sb2Fkc1xuICAgIC8vIC8vIG1pZ2h0IG5vdCB3b3JrIGFjY3VyYXRlbHkgb24gU1BBcyBiZWNhdXNlIG5ldyBsaW5rcyAoZG9tIGVsZW1lbnRzKSBhcmUgY3JlYXRlZCBkeW5hbWljYWxseSB3aXRob3V0IGEgc2VydmVyLXNpZGUgcGFnZSByZWxvYWQuXG4gICAgdGhpcy5lbmFibGVMaW5rVHJhY2tpbmcobGlua1RyYWNraW5nKVxuXG4gICAgY29uc3QgZG9jID0gZG9jdW1lbnRcbiAgICBjb25zdCBzY3JpcHRFbGVtZW50ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3NjcmlwdCcpXG4gICAgY29uc3Qgc2NyaXB0cyA9IGRvYy5nZXRFbGVtZW50c0J5VGFnTmFtZSgnc2NyaXB0JylbMF1cblxuICAgIHNjcmlwdEVsZW1lbnQudHlwZSA9ICd0ZXh0L2phdmFzY3JpcHQnXG4gICAgc2NyaXB0RWxlbWVudC5hc3luYyA9IHRydWVcbiAgICBzY3JpcHRFbGVtZW50LmRlZmVyID0gdHJ1ZVxuICAgIHNjcmlwdEVsZW1lbnQuc3JjID0gc3JjVXJsIHx8IGAke25vcm1hbGl6ZWRVcmxCYXNlfW1hdG9tby5qc2BcblxuICAgIGlmIChzY3JpcHRzICYmIHNjcmlwdHMucGFyZW50Tm9kZSkge1xuICAgICAgc2NyaXB0cy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShzY3JpcHRFbGVtZW50LCBzY3JpcHRzKVxuICAgIH1cbiAgfVxuXG4gIGVuYWJsZUhlYXJ0QmVhdFRpbWVyKHNlY29uZHM6IG51bWJlcik6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdlbmFibGVIZWFydEJlYXRUaW1lcicsIHNlY29uZHMpXG4gIH1cblxuICBlbmFibGVMaW5rVHJhY2tpbmcoYWN0aXZlOiBib29sZWFuKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oJ2VuYWJsZUxpbmtUcmFja2luZycsIGFjdGl2ZSlcbiAgfVxuXG4gIHByaXZhdGUgdHJhY2tFdmVudHNGb3JFbGVtZW50cyhlbGVtZW50czogSFRNTEVsZW1lbnRbXSkge1xuICAgIGlmIChlbGVtZW50cy5sZW5ndGgpIHtcbiAgICAgIGVsZW1lbnRzLmZvckVhY2goKGVsZW1lbnQpID0+IHtcbiAgICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgICBjb25zdCB7IG1hdG9tb0NhdGVnb3J5LCBtYXRvbW9BY3Rpb24sIG1hdG9tb05hbWUsIG1hdG9tb1ZhbHVlIH0gPVxuICAgICAgICAgICAgZWxlbWVudC5kYXRhc2V0XG4gICAgICAgICAgaWYgKG1hdG9tb0NhdGVnb3J5ICYmIG1hdG9tb0FjdGlvbikge1xuICAgICAgICAgICAgdGhpcy50cmFja0V2ZW50KHtcbiAgICAgICAgICAgICAgY2F0ZWdvcnk6IG1hdG9tb0NhdGVnb3J5LFxuICAgICAgICAgICAgICBhY3Rpb246IG1hdG9tb0FjdGlvbixcbiAgICAgICAgICAgICAgbmFtZTogbWF0b21vTmFtZSxcbiAgICAgICAgICAgICAgdmFsdWU6IE51bWJlcihtYXRvbW9WYWx1ZSksXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgICAgIGBFcnJvcjogZGF0YS1tYXRvbW8tY2F0ZWdvcnkgYW5kIGRhdGEtbWF0b21vLWFjdGlvbiBhcmUgcmVxdWlyZWQuYCxcbiAgICAgICAgICAgIClcbiAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyYWNrcyBldmVudHMgYmFzZWQgb24gZGF0YSBhdHRyaWJ1dGVzXG4gIHRyYWNrRXZlbnRzKCk6IHZvaWQge1xuICAgIGNvbnN0IG1hdGNoU3RyaW5nID0gJ1tkYXRhLW1hdG9tby1ldmVudD1cImNsaWNrXCJdJ1xuICAgIGxldCBmaXJzdFRpbWUgPSBmYWxzZVxuICAgIGlmICghdGhpcy5tdXRhdGlvbk9ic2VydmVyKSB7XG4gICAgICBmaXJzdFRpbWUgPSB0cnVlXG4gICAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIgPSBuZXcgTXV0YXRpb25PYnNlcnZlcigobXV0YXRpb25zKSA9PiB7XG4gICAgICAgIG11dGF0aW9ucy5mb3JFYWNoKChtdXRhdGlvbikgPT4ge1xuICAgICAgICAgIG11dGF0aW9uLmFkZGVkTm9kZXMuZm9yRWFjaCgobm9kZSkgPT4ge1xuICAgICAgICAgICAgLy8gb25seSB0cmFjayBIVE1MIGVsZW1lbnRzXG4gICAgICAgICAgICBpZiAoIShub2RlIGluc3RhbmNlb2YgSFRNTEVsZW1lbnQpKSByZXR1cm5cblxuICAgICAgICAgICAgLy8gY2hlY2sgdGhlIGluc2VydGVkIGVsZW1lbnQgZm9yIGJlaW5nIGEgY29kZSBzbmlwcGV0XG4gICAgICAgICAgICBpZiAobm9kZS5tYXRjaGVzKG1hdGNoU3RyaW5nKSkge1xuICAgICAgICAgICAgICB0aGlzLnRyYWNrRXZlbnRzRm9yRWxlbWVudHMoW25vZGVdKVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IEFycmF5LmZyb20oXG4gICAgICAgICAgICAgIG5vZGUucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4obWF0Y2hTdHJpbmcpLFxuICAgICAgICAgICAgKVxuICAgICAgICAgICAgdGhpcy50cmFja0V2ZW50c0ZvckVsZW1lbnRzKGVsZW1lbnRzKVxuICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgICB9KVxuICAgIH1cbiAgICB0aGlzLm11dGF0aW9uT2JzZXJ2ZXIub2JzZXJ2ZShkb2N1bWVudCwgeyBjaGlsZExpc3Q6IHRydWUsIHN1YnRyZWU6IHRydWUgfSlcblxuICAgIC8vIE5vdyB0cmFjayBhbGwgYWxyZWFkeSBleGlzdGluZyBlbGVtZW50c1xuICAgIGlmIChmaXJzdFRpbWUpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnRzID0gQXJyYXkuZnJvbShcbiAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbDxIVE1MRWxlbWVudD4obWF0Y2hTdHJpbmcpLFxuICAgICAgKVxuICAgICAgdGhpcy50cmFja0V2ZW50c0ZvckVsZW1lbnRzKGVsZW1lbnRzKVxuICAgIH1cbiAgfVxuXG4gIHN0b3BPYnNlcnZpbmcoKTogdm9pZCB7XG4gICAgaWYgKHRoaXMubXV0YXRpb25PYnNlcnZlcikge1xuICAgICAgdGhpcy5tdXRhdGlvbk9ic2VydmVyLmRpc2Nvbm5lY3QoKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyYWNrcyBldmVudHNcbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZXZlbnQtdHJhY2tpbmcvI3RyYWNraW5nLWV2ZW50c1xuICB0cmFja0V2ZW50KHtcbiAgICBjYXRlZ29yeSxcbiAgICBhY3Rpb24sXG4gICAgbmFtZSxcbiAgICB2YWx1ZSxcbiAgICAuLi5vdGhlclBhcmFtc1xuICB9OiBUcmFja0V2ZW50UGFyYW1zKTogdm9pZCB7XG4gICAgaWYgKGNhdGVnb3J5ICYmIGFjdGlvbikge1xuICAgICAgdGhpcy50cmFjayh7XG4gICAgICAgIGRhdGE6IFtUUkFDS19UWVBFUy5UUkFDS19FVkVOVCwgY2F0ZWdvcnksIGFjdGlvbiwgbmFtZSwgdmFsdWVdLFxuICAgICAgICAuLi5vdGhlclBhcmFtcyxcbiAgICAgIH0pXG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgRXJyb3I6IGNhdGVnb3J5IGFuZCBhY3Rpb24gYXJlIHJlcXVpcmVkLmApXG4gICAgfVxuICB9XG5cbiAgLy8gVHJhY2tzIHNpdGUgc2VhcmNoXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1hdG9tby5vcmcvZ3VpZGVzL3RyYWNraW5nLWphdmFzY3JpcHQtZ3VpZGUjaW50ZXJuYWwtc2VhcmNoLXRyYWNraW5nXG4gIHRyYWNrU2l0ZVNlYXJjaCh7XG4gICAga2V5d29yZCxcbiAgICBjYXRlZ29yeSxcbiAgICBjb3VudCxcbiAgICAuLi5vdGhlclBhcmFtc1xuICB9OiBUcmFja1NpdGVTZWFyY2hQYXJhbXMpOiB2b2lkIHtcbiAgICBpZiAoa2V5d29yZCkge1xuICAgICAgdGhpcy50cmFjayh7XG4gICAgICAgIGRhdGE6IFtUUkFDS19UWVBFUy5UUkFDS19TRUFSQ0gsIGtleXdvcmQsIGNhdGVnb3J5LCBjb3VudF0sXG4gICAgICAgIC4uLm90aGVyUGFyYW1zLFxuICAgICAgfSlcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBFcnJvcjoga2V5d29yZCBpcyByZXF1aXJlZC5gKVxuICAgIH1cbiAgfVxuXG4gIC8vIFRyYWNrcyBvdXRnb2luZyBsaW5rcyB0byBvdGhlciBzaXRlcyBhbmQgZG93bmxvYWRzXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1hdG9tby5vcmcvZ3VpZGVzL3RyYWNraW5nLWphdmFzY3JpcHQtZ3VpZGUjZW5hYmxpbmctZG93bmxvYWQtb3V0bGluay10cmFja2luZ1xuICB0cmFja0xpbmsoeyBocmVmLCBsaW5rVHlwZSA9ICdsaW5rJyB9OiBUcmFja0xpbmtQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLnB1c2hJbnN0cnVjdGlvbihUUkFDS19UWVBFUy5UUkFDS19MSU5LLCBocmVmLCBsaW5rVHlwZSlcbiAgfVxuXG4gIC8vIFRyYWNrcyBwYWdlIHZpZXdzXG4gIC8vIGh0dHBzOi8vZGV2ZWxvcGVyLm1hdG9tby5vcmcvZ3VpZGVzL3NwYS10cmFja2luZyN0cmFja2luZy1hLW5ldy1wYWdlLXZpZXdcbiAgdHJhY2tQYWdlVmlldyhwYXJhbXM/OiBUcmFja1BhZ2VWaWV3UGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy50cmFjayh7IGRhdGE6IFtUUkFDS19UWVBFUy5UUkFDS19WSUVXXSwgLi4ucGFyYW1zIH0pXG4gIH1cblxuICAvLyBBZGRzIGEgcHJvZHVjdCB0byBhbiBFY29tbWVyY2Ugb3JkZXIgdG8gYmUgdHJhY2tlZCB2aWEgdHJhY2tFY29tbWVyY2VPcmRlci5cbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljc1xuICAvLyBodHRwczovL21hdG9tby5vcmcvZG9jcy9lY29tbWVyY2UtYW5hbHl0aWNzLyMxLWFkZGVjb21tZXJjZWl0ZW1wcm9kdWN0c2t1LXByb2R1Y3RuYW1lLXByb2R1Y3RjYXRlZ29yeS1wcmljZS1xdWFudGl0eVxuICBhZGRFY29tbWVyY2VJdGVtKHtcbiAgICBza3UsXG4gICAgcHJvZHVjdE5hbWUsXG4gICAgcHJvZHVjdENhdGVnb3J5LFxuICAgIHByb2R1Y3RQcmljZSA9IDAuMCxcbiAgICBwcm9kdWN0UXVhbnRpdHkgPSAxLFxuICB9OiBBZGRFY29tbWVyY2VJdGVtUGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oXG4gICAgICAnYWRkRWNvbW1lcmNlSXRlbScsXG4gICAgICBza3UsXG4gICAgICBwcm9kdWN0TmFtZSxcbiAgICAgIHByb2R1Y3RDYXRlZ29yeSxcbiAgICAgIHByb2R1Y3RQcmljZSxcbiAgICAgIHByb2R1Y3RRdWFudGl0eSxcbiAgICApXG4gIH1cblxuICAvLyBSZW1vdmVzIGEgcHJvZHVjdCBmcm9tIGFuIEVjb21tZXJjZSBvcmRlciB0byBiZSB0cmFja2VkIHZpYSB0cmFja0Vjb21tZXJjZU9yZGVyLlxuICAvLyBodHRwczovL21hdG9tby5vcmcvZG9jcy9lY29tbWVyY2UtYW5hbHl0aWNzXG4gIHJlbW92ZUVjb21tZXJjZUl0ZW0oeyBza3UgfTogUmVtb3ZlRWNvbW1lcmNlSXRlbVBhcmFtcyk6IHZvaWQge1xuICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdyZW1vdmVFY29tbWVyY2VJdGVtJywgc2t1KVxuICB9XG5cbiAgLy8gUmVtb3ZlcyBhbGwgcHJvZHVjdHMgZnJvbSBhbiBFY29tbWVyY2Ugb3JkZXIgdG8gYmUgdHJhY2tlZCB2aWEgdHJhY2tFY29tbWVyY2VPcmRlci5cbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljc1xuICBjbGVhckVjb21tZXJjZUNhcnQoKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oJ2NsZWFyRWNvbW1lcmNlQ2FydCcpXG4gIH1cblxuICAvLyBUcmFja3MgYW4gRWNvbW1lcmNlIG9yZGVyIGNvbnRhaW5pbmcgaXRlbXMgYWRkZWQgdmlhIGFkZEVjb21tZXJjZUl0ZW0uXG4gIC8vIGh0dHBzOi8vbWF0b21vLm9yZy9kb2NzL2Vjb21tZXJjZS1hbmFseXRpY3MvIzItdHJhY2tlY29tbWVyY2VvcmRlcm9yZGVyaWQtcmV2ZW51ZS1zdWJ0b3RhbC10YXgtc2hpcHBpbmctZGlzY291bnRcbiAgdHJhY2tFY29tbWVyY2VPcmRlcih7XG4gICAgb3JkZXJJZCxcbiAgICBvcmRlclJldmVudWUsXG4gICAgb3JkZXJTdWJUb3RhbCxcbiAgICB0YXhBbW91bnQsXG4gICAgc2hpcHBpbmdBbW91bnQsXG4gICAgZGlzY291bnRPZmZlcmVkID0gZmFsc2UsXG4gIH06IFRyYWNrRWNvbW1lcmNlT3JkZXJQYXJhbXMpOiB2b2lkIHtcbiAgICB0aGlzLnRyYWNrKHtcbiAgICAgIGRhdGE6IFtcbiAgICAgICAgVFJBQ0tfVFlQRVMuVFJBQ0tfRUNPTU1FUkNFX09SREVSLFxuICAgICAgICBvcmRlcklkLFxuICAgICAgICBvcmRlclJldmVudWUsXG4gICAgICAgIG9yZGVyU3ViVG90YWwsXG4gICAgICAgIHRheEFtb3VudCxcbiAgICAgICAgc2hpcHBpbmdBbW91bnQsXG4gICAgICAgIGRpc2NvdW50T2ZmZXJlZCxcbiAgICAgIF0sXG4gICAgfSlcbiAgfVxuXG4gIC8vIFRyYWNrcyB1cGRhdGVzIHRvIGFuIEVjb21tZXJjZSBDYXJ0IGJlZm9yZSBhbiBhY3R1YWwgcHVyY2hhc2UuXG4gIC8vIFRoaXMgd2lsbCByZXBsYWNlIGN1cnJlbnRseSB0cmFja2VkIGluZm9ybWF0aW9uIG9mIHRoZSBjYXJ0LiBBbHdheXMgaW5jbHVkZSBhbGwgaXRlbXMgb2YgdGhlIHVwZGF0ZWQgY2FydCFcbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljcy8jZXhhbXBsZS10cmFja2luZy1hbi1lY29tbWVyY2UtY2FydC11cGRhdGUtY29udGFpbmluZy10d28tcHJvZHVjdHNcbiAgdHJhY2tFY29tbWVyY2VDYXJ0VXBkYXRlKGFtb3VudDogbnVtYmVyKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oVFJBQ0tfVFlQRVMuVFJBQ0tfRUNPTU1FUkNFX0NBUlRfVVBEQVRFLCBhbW91bnQpXG4gIH1cblxuICAvLyBNYXJrcyB0aGUgbmV4dCBwYWdlIHZpZXcgYXMgYW4gRWNvbW1lcmNlIHByb2R1Y3QgcGFnZS5cbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljcy8jZXhhbXBsZS10cmFja2luZy1hLXByb2R1Y3QtcGFnZS12aWV3XG4gIHNldEVjb21tZXJjZVZpZXcoe1xuICAgIHNrdSxcbiAgICBwcm9kdWN0TmFtZSxcbiAgICBwcm9kdWN0Q2F0ZWdvcnksXG4gICAgcHJvZHVjdFByaWNlLFxuICB9OiBTZXRFY29tbWVyY2VWaWV3UGFyYW1zKTogdm9pZCB7XG4gICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oXG4gICAgICAnc2V0RWNvbW1lcmNlVmlldycsXG4gICAgICBza3UsXG4gICAgICBwcm9kdWN0TmFtZSxcbiAgICAgIHByb2R1Y3RDYXRlZ29yeSxcbiAgICAgIHByb2R1Y3RQcmljZSxcbiAgICApXG4gIH1cblxuICAvLyBNYXJrcyB0aGUgbmV4dCB0cmFja2VkIHBhZ2UgdmlldyBhcyBhbiBFY29tbWVyY2UgY2F0ZWdvcnkgcGFnZS5cbiAgLy8gaHR0cHM6Ly9tYXRvbW8ub3JnL2RvY3MvZWNvbW1lcmNlLWFuYWx5dGljcy8jZXhhbXBsZS10cmFja2luZy1hLWNhdGVnb3J5LXBhZ2Utdmlld1xuICBzZXRFY29tbWVyY2VDYXRlZ29yeVZpZXcocHJvZHVjdENhdGVnb3J5OiBzdHJpbmcpOiB2b2lkIHtcbiAgICB0aGlzLnNldEVjb21tZXJjZVZpZXcoeyBwcm9kdWN0Q2F0ZWdvcnksIHByb2R1Y3ROYW1lOiBmYWxzZSwgc2t1OiBmYWxzZSB9KVxuICB9XG5cbiAgLy8gU2VuZHMgdGhlIHRyYWNrZWQgcGFnZS92aWV3L3NlYXJjaCB0byBNYXRvbW9cbiAgdHJhY2soe1xuICAgIGRhdGEgPSBbXSxcbiAgICBkb2N1bWVudFRpdGxlID0gd2luZG93LmRvY3VtZW50LnRpdGxlLFxuICAgIGhyZWYsXG4gICAgY3VzdG9tRGltZW5zaW9ucyA9IGZhbHNlLFxuICB9OiBUcmFja1BhcmFtcyk6IHZvaWQge1xuICAgIGlmIChkYXRhLmxlbmd0aCkge1xuICAgICAgaWYgKFxuICAgICAgICBjdXN0b21EaW1lbnNpb25zICYmXG4gICAgICAgIEFycmF5LmlzQXJyYXkoY3VzdG9tRGltZW5zaW9ucykgJiZcbiAgICAgICAgY3VzdG9tRGltZW5zaW9ucy5sZW5ndGhcbiAgICAgICkge1xuICAgICAgICBjdXN0b21EaW1lbnNpb25zLm1hcCgoY3VzdG9tRGltZW5zaW9uOiBDdXN0b21EaW1lbnNpb24pID0+XG4gICAgICAgICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oXG4gICAgICAgICAgICAnc2V0Q3VzdG9tRGltZW5zaW9uJyxcbiAgICAgICAgICAgIGN1c3RvbURpbWVuc2lvbi5pZCxcbiAgICAgICAgICAgIGN1c3RvbURpbWVuc2lvbi52YWx1ZSxcbiAgICAgICAgICApLFxuICAgICAgICApXG4gICAgICB9XG5cbiAgICAgIHRoaXMucHVzaEluc3RydWN0aW9uKCdzZXRDdXN0b21VcmwnLCBocmVmID8/IHdpbmRvdy5sb2NhdGlvbi5ocmVmKVxuICAgICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oJ3NldERvY3VtZW50VGl0bGUnLCBkb2N1bWVudFRpdGxlKVxuICAgICAgdGhpcy5wdXNoSW5zdHJ1Y3Rpb24oLi4uKGRhdGEgYXMgW3N0cmluZywgLi4uYW55W11dKSlcbiAgICB9XG4gIH1cblxuICAvKipcbiAgICogUHVzaGVzIGFuIGluc3RydWN0aW9uIHRvIE1hdG9tbyBmb3IgZXhlY3V0aW9uLCB0aGlzIGlzIGVxdWl2YWxlbnQgdG8gcHVzaGluZyBlbnRyaWVzIGludG8gdGhlIGBfcGFxYCBhcnJheS5cbiAgICpcbiAgICogRm9yIGV4YW1wbGU6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIHB1c2hJbnN0cnVjdGlvbignc2V0RG9jdW1lbnRUaXRsZScsIGRvY3VtZW50LnRpdGxlKVxuICAgKiBgYGBcbiAgICogSXMgdGhlIGVxdWl2YWxlbnQgb2Y6XG4gICAqXG4gICAqIGBgYHRzXG4gICAqIF9wYXEucHVzaChbJ3NldERvY3VtZW50VGl0bGUnLCBkb2N1bWVudC50aXRsZV0pO1xuICAgKiBgYGBcbiAgICpcbiAgICogQHBhcmFtIG5hbWUgVGhlIG5hbWUgb2YgdGhlIGluc3RydWN0aW9uIHRvIGJlIGV4ZWN1dGVkLlxuICAgKiBAcGFyYW0gYXJncyBUaGUgYXJndW1lbnRzIHRvIHBhc3MgYWxvbmcgd2l0aCB0aGUgaW5zdHJ1Y3Rpb24uXG4gICAqL1xuICBwdXNoSW5zdHJ1Y3Rpb24obmFtZTogc3RyaW5nLCAuLi5hcmdzOiBhbnlbXSk6IE1hdG9tb1RyYWNrZXIge1xuICAgIGlmICh0eXBlb2Ygd2luZG93ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lXG4gICAgICB3aW5kb3cuX3BhcS5wdXNoKFtuYW1lLCAuLi5hcmdzXSlcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpc1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IE1hdG9tb1RyYWNrZXJcbiIsICJpbXBvcnQgTWF0b21vVHJhY2tlciBmcm9tICcuL01hdG9tb1RyYWNrZXInXG5pbXBvcnQgKiBhcyB0eXBlcyBmcm9tICcuL3R5cGVzJ1xuXG5kZWNsYXJlIGdsb2JhbCB7XG4gIGludGVyZmFjZSBXaW5kb3cge1xuICAgIF9wYXE6IFtzdHJpbmcsIC4uLmFueVtdXVtdXG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTWF0b21vVHJhY2tlclxuXG5leHBvcnQgeyB0eXBlcyB9XG4iLCAiLy8gI3JlZ2lvbiBJbXBvcnRzXG4vLyAjcmVnaW9uIFhJTUFcbmltcG9ydCB7IGdldEpRdWVyeSB9IGZyb20gXCJAZGUteGltYS9mYy1mb3JtLXJlbmRlcmVyXCI7XG4vLyAjZW5kcmVnaW9uIFhJTUFcbi8vICNyZWdpb24gTWF0b21vXG5pbXBvcnQgTWF0b21vVHJhY2tlciBmcm9tIFwiQGpvbmtvb3BzL21hdG9tby10cmFja2VyXCI7XG4vLyAjZW5kcmVnaW9uIE1hdG9tb1xuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBJRiB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvSUZcIjtcbmltcG9ydCB7IFRZUEUgfSBmcm9tIFwieGRiYy9zcmMvREJDL1RZUEVcIjtcbmltcG9ydCB7IFJFR0VYIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9SRUdFWFwiO1xuaW1wb3J0IHsgSU5TVEFOQ0UgfSBmcm9tIFwieGRiYy9zcmMvREJDL0lOU1RBTkNFXCI7XG5pbXBvcnQgeyBERUZJTkVEIH0gZnJvbSBcInhkYmMvc3JjL0RCQy9ERUZJTkVEXCI7XG4vLyAjZW5kcmVnaW9uIFhEQkNcbmltcG9ydCB7IENvZEJpLCBDb2RCaUVycm9yIH0gZnJvbSBcIi4uL2dsb2JhbC1zY29wZVwiO1xuaW1wb3J0IHsgT1IgfSBmcm9tIFwieGRiYy9zcmMvREJDL09SXCI7XG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKlxuICogUHJvdmlkZXMgdGhlIHtAbGluayBIVE1MX1NlbGVjdF9JbmplY3Rpb24uZnVuY3Rpb25hbGl0eSB9LlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduLlxuZXhwb3J0IGNsYXNzIE1hdG9tb19UcmFja2luZyB7XG4gIC8qKlxuICAgKiBSZWdpc3RlcnMgdGhlIFwiTWF0b21vLlRyYWNraW5nXCItRnVuY3Rpb25hbGl0eS5cbiAgICpcbiAgICogVGhpcyBmdW5jdGlvbmFsaXR5IGNvbm5lY3RzIHRvIGEgKipNYXRvbW8tU2VydmVyKiosIHRoYXQgaXMgZWl0aGVyIHNwZWNpZmllZCBpbiB0aGUgUGx1Z2luLUNvbmZpZyAoKipNYXRvbW9fVVJMKiopXG4gICAqIG9yIGluIHRoaXMgZnVuY3Rpb25hbGl0eSdzIHBhcmFtZXRlciAoKipVUkwqKikgd2hpbGUgdGhlIGZ1bmN0aW9uYWxpdHkgcGFyYW1ldGVyIHRha2VzIHByZWNlZGVuY2UsIGFuZCBpbml0aWF0ZXNcbiAgICogdHJhY2tpbmcgdG8gYSBzcGVjaWZpZWQgKipTaXRlLUlEKiouIFRoZSAqKlNpdGUtSUQqKiBpcyBlaXRoZXIgc3BlY2lmaWVkIG8gbiB0aGUgUEx1Z2luLUNvbmZpZyAoKipNYXRvbW9fU2l0ZUlEKiopXG4gICAqIG9yIGluIHRoZSBmdW5jdGlvbmFsaXR5J3MgcGFyYW1ldGVyICgqKlNpdGVJRCoqKSB3aGlsZSB0aGUgZnVuY3Rpb25hbGl0eSBwYXJhbWV0ZXIgdGFrZXMgcHJlY2VkZW5jZS5cbiAgICpcbiAgICogQ29uZmlnIFBhcmFtZXRlcjpcbiAgICogIC0gVVJMOiAgICBUaGUgVVJMIG9mIHRoZSBNYXRvbW8tU2VydmVyIHRoYXQgc2hhbGwgdHJhY2sgdGhlIHRhZ2dlZCBmb3JtLlxuICAgKiAgLSBTaXRlSUQ6IFRoZSBJRCBvZiB0aGUgTWF0b21vLVByb2plY3QtU2l0ZSB0aGF0IHNoYWxsIGJlIHVzZWQgZm9yIHRyYWNraW5nLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIGZ1bmN0aW9uYWxpdHkoXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwidXJsXCIpXG4gICAgQFRZUEUuUFJFKFwic3RyaW5nXCIsIFwic2l0ZWlkXCIpXG4gICAgQElGLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSwgbmV3IFJFR0VYKC9eXFxkKyQvKSwgXCJzaXRlaWRcIilcbiAgICBASUYuUFJFKG5ldyBERUZJTkVEKCksIG5ldyBSRUdFWChSRUdFWC5zdGRFeHAudXJsKSwgXCJ1cmxcIilcbiAgICB0b0xvYWQ6IHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0sXG5cbiAgICBASU5TVEFOQ0UuUFJFKEhUTUxFbGVtZW50KVxuICAgIHRvUHJvY2VzczogRWxlbWVudCxcbiAgKTogdm9pZCB7XG4gICAgbGV0IHNpdGVJRDogbnVtYmVyIHwgdW5kZWZpbmVkO1xuICAgIGxldCB1cmw6IHN0cmluZyB8IHVuZGVmaW5lZDtcblxuICAgIGlmICh0b0xvYWQuc2l0ZUlEID09PSB1bmRlZmluZWQgfHwgdG9Mb2FkLnNpdGVJRCA9PT0gXCJcIikge1xuICAgICAgc2l0ZUlEID0gTnVtYmVyLnBhcnNlSW50KFxuICAgICAgICBPUi50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgICAgd2luZG93LmNvZGJpU2V0dGluZ3MuTWF0b21vLlNpdGVJRCxcbiAgICAgICAgICBbbmV3IERFRklORUQoKSwgbmV3IFJFR0VYKC9eXFxkKyQvKV0sXG4gICAgICAgICAgXCJTaXRlSUQgd2FzIG5vdCBzcGVjaWZpZWQgaW4gdGhlIGZ1bmN0aW9uYWxpdHkgcGFyYW1ldGVyIGFuZCBpcyBhbHNvIG5vdCBzcGVjaWZpZWQgaW4gdGhlIFBsdWdpbi1Db25maWcuXCIsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzaXRlSUQgPSBOdW1iZXIucGFyc2VJbnQodG9Mb2FkLnNpdGVpZCk7XG4gICAgfVxuXG4gICAgaWYgKHRvTG9hZC51cmwgPT09IHVuZGVmaW5lZCB8fCB0b0xvYWQudXJsID09PSBcIlwiKSB7XG4gICAgICB1cmwgPSBPUi50c0NoZWNrPHN0cmluZz4oXG4gICAgICAgIHdpbmRvdy5jb2RiaVNldHRpbmdzLk1hdG9tby5VUkwsXG4gICAgICAgIFtuZXcgREVGSU5FRCgpLCBuZXcgUkVHRVgoUkVHRVguc3RkRXhwLnVybCldLFxuICAgICAgICBcIlVSTCB3YXMgbm90IHNwZWNpZmllZCBpbiB0aGUgZnVuY3Rpb25hbGl0eSBwYXJhbWV0ZXIgYW5kIGlzIGFsc28gbm90IHNwZWNpZmllZCBpbiB0aGUgUGx1Z2luLUNvbmZpZy5cIixcbiAgICAgICk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IHRvTG9hZC51cmw7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIG5ldyBNYXRvbW9UcmFja2VyKHsgc2l0ZUlkOiBzaXRlSUQsIHVybEJhc2U6IHVybCB9KS50cmFja1BhZ2VWaWV3KCk7XG4gICAgfSBjYXRjaCAoWCkge1xuICAgICAgd2luZG93LmNvZGJpLmxvZyhcIldBUk5JTkdcIiwgYE1hdG9tbyBUcmFja2luZyBmYWlsZWQgZHVlIHRvOiAkeyhYIGFzIEVycm9yKS5tZXNzYWdlfWApO1xuICAgIH1cbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJGdW5jdGlvbmFsaXR5KFwiTWF0b21vLlRyYWNraW5nXCIsIE1hdG9tb19UcmFja2luZy5mdW5jdGlvbmFsaXR5LmJpbmQoTWF0b21vX1RyYWNraW5nKSk7IC8vIFJlZ2lzdGVyIEZ1bmN0aW9uYWxpdHlcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNPLElBQU0sY0FBYztFQUN6QixhQUFhO0VBQ2IsWUFBWTtFQUNaLGNBQWM7RUFDZCxZQUFZO0VBQ1osdUJBQXVCO0VBQ3ZCLDZCQUE2Qjs7Ozs7Ozs7Ozs7Ozs7O0FDUS9CLElBQU0sZ0JBQU4sTUFBbUI7RUFHakIsWUFBWSxhQUF3QjtBQUNsQyxRQUFJLENBQUMsWUFBWSxTQUFTO0FBQ3hCLFlBQU0sSUFBSSxNQUFNLDZCQUE2Qjs7QUFFL0MsUUFBSSxDQUFDLFlBQVksUUFBUTtBQUN2QixZQUFNLElBQUksTUFBTSw0QkFBNEI7O0FBRzlDLFNBQUssV0FBVyxXQUFXO0VBQzdCO0VBRVEsV0FBVyxFQUNqQixTQUNBLFFBQ0EsUUFDQSxZQUNBLFFBQ0EsVUFDQSxXQUNBLGVBQWUsTUFDZixpQkFBaUIsQ0FBQSxFQUFFLEdBQ1A7O0FBQ1osVUFBTSxvQkFDSixRQUFRLFFBQVEsU0FB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
