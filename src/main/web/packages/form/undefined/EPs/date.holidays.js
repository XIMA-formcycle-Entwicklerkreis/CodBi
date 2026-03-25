import { AE } from "./chunk-P4ZK5MPU.js";
import { require_dist } from "./chunk-R7QUH33K.js";
import { GREATER } from "./chunk-HUHG5RHG.js";
import { TYPE } from "./chunk-3WCL6BYZ.js";
import { DBC, __decorateClass, __decorateParam, __toESM } from "./chunk-YNACB2OL.js";

// src/js/EPs/date.holidays.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var _Date_Holidays = class _Date_Holidays {
  static {
    /** Stores the requests already made. */
    this.buffer = /* @__PURE__ */ new Map();
  }
  /**
   * Generates a key-{@link string } that may be used to compare to {@link ApiRequest }s with each other.
   *
   * @param from The {@link ApiRequest } to generate the key from.
   *
   * @returns The requested key. */
  static genComparableKey(from) {
    const sortedYears = [...from.years].sort().join("-");
    const sortedStates = [...from.states].sort().join("-");
    return `${sortedYears}_${sortedStates}_${from.augsburg ? "T" : "F"}_${from.catholic ? "T" : "F"}`;
  }
  static retrieve(params) {
    const result = new Array();
    const years = new Array();
    const states = new Array();
    const augsburg = params.some((toCheck) => toCheck.toLowerCase() === "friedensfest");
    const katholic = params.some((toCheck) => toCheck.toLowerCase() === "katholisch");
    for (const parameter of params) {
      if (Number.isNaN(parameter)) {
        years.push(parameter);
      } else {
        if (parameter.toLowerCase().indexOf("this_year") !== -1) {
          let idxOperand = parameter.indexOf("+");
          if (idxOperand === -1) {
            idxOperand = parameter.indexOf("-");
          }
          if (idxOperand !== -1) {
            years.push(
              /* @__PURE__ */ (
                new Date().getFullYear() +
                Number.parseInt(parameter.substring(idxOperand + 1)) *
                  (parameter.substring(idxOperand, idxOperand + 1) === "+" ? 1 : -1)
              ).toString(),
            );
          } else {
            years.push(
              /* @__PURE__ */ new Date()
                .getFullYear()
                .toString(),
            );
          }
        } else if (
          parameter.toLowerCase().indexOf("friedensfest") === -1 &&
          parameter.toLowerCase().indexOf("katholisch") === -1
        ) {
          states.push(parameter.toLowerCase());
        }
      }
    }
    const promise = new Promise((resolve) => {
      if (
        _Date_Holidays.buffer.has(
          _Date_Holidays.genComparableKey({
            years,
            states,
            augsburg,
            catholic: katholic,
          }),
        )
      ) {
        if (
          Array.isArray(
            _Date_Holidays.buffer.get(
              _Date_Holidays.genComparableKey({
                years,
                states,
                augsburg,
                catholic: katholic,
              }),
            ),
          )
        ) {
          resolve(
            _Date_Holidays.buffer.get(
              _Date_Holidays.genComparableKey({
                years,
                states,
                augsburg,
                catholic: katholic,
              }),
            ),
          );
          return;
        } else {
          _Date_Holidays.buffer
            .get(
              _Date_Holidays.genComparableKey({
                years,
                states,
                augsburg,
                catholic: katholic,
              }),
            )
            .then((result2) => {
              resolve(result2);
            });
        }
        return;
      }
      const $ = (0, import_fc_form_renderer.getJQuery)();
      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_Holidays_FeiertageDE`,
        type: "GET",
        headers: {
          years: years.join(","),
          states: states.join(",").replace(/ /g, ""),
          augsburg: augsburg ? "true" : "false  ",
          catholic: katholic ? "true" : "false",
        },
      }).done((data) => {
        const incoming = JSON.parse(data);
        if (incoming.status !== "error") {
          for (const entry of incoming.feiertage) {
            result.push(
              new Date(entry.date.replace(/\./g, "/").replace(/-/g, "/")).toLocaleDateString("de-DE", {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              }),
            );
          }
          _Date_Holidays.buffer.set(
            _Date_Holidays.genComparableKey({
              years,
              states,
              augsburg,
              catholic: katholic,
            }),
            result,
          );
          resolve(result);
        }
      });
    });
    _Date_Holidays.buffer.set(
      _Date_Holidays.genComparableKey({
        years,
        states,
        augsburg,
        catholic: katholic,
      }),
      promise,
    );
    return promise;
  }
};
__decorateClass(
  [
    DBC.ParamvalueProvider,
    __decorateParam(0, GREATER.PRE(1, true, false, "length", "Hasn't at least the year been specified?")),
    __decorateParam(0, AE.PRE(new TYPE("string"))),
  ],
  _Date_Holidays,
  "retrieve",
  1,
);
var Date_Holidays = _Date_Holidays;
window.codbi.registerEP("Date.Holidays", Date_Holidays.retrieve.bind(Date_Holidays));
export { Date_Holidays };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vc3JjL2pzL0VQcy9kYXRlLmhvbGlkYXlzLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyIvLyAjcmVnaW9uIEltcG9ydHNcbi8vICNyZWdpb24gWElNQVxuaW1wb3J0IHsgZ2V0SlF1ZXJ5IH0gZnJvbSBcIkBkZS14aW1hL2ZjLWZvcm0tcmVuZGVyZXJcIjtcbi8vICNlbmRyZWdpb24gWElNQVxuLy8gI3JlZ2lvbiBYREJDXG5pbXBvcnQgeyBEQkMgfSBmcm9tIFwieGRiYy9zcmMvREJDXCI7XG5pbXBvcnQgeyBBRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvQUVcIjtcbmltcG9ydCB7IEdSRUFURVIgfSBmcm9tIFwieGRiYy9zcmMvREJDL0NPTVBBUklTT04vR1JFQVRFUlwiO1xuaW1wb3J0IHsgVFlQRSB9IGZyb20gXCJ4ZGJjL3NyYy9EQkMvVFlQRVwiO1xuLy8gI2VuZHJlZ2lvbiBYREJDXG4vLyAjZW5kcmVnaW9uIEltcG9ydHNcbi8qKiBUaGUgdHlwZSBvZiByZXF1ZXN0cyBuZWVkZWQgdG8gaWRlbnRpZnkgaWRlbnRpY2FsIHJlcXVlc3RzLiAqL1xudHlwZSBBcGlSZXF1ZXN0ID0ge1xuICAvKiogVGhlIHJlcXVlc3RlZCB5ZWFycy4gKi9cbiAgeWVhcnM6IHN0cmluZ1tdO1xuICAvKiogVGhlIHJlcXVlc3RlZCBzdGF0ZXMuICovXG4gIHN0YXRlczogc3RyaW5nW107XG4gIC8qKiBXaGV0aGVyIHRoZSBBdWdzYnVyZ2VyIEZyaWVkZW5zZmVzdCBzaGFsbCBiZSBpbmNsdWRlZC4gKi9cbiAgYXVnc2J1cmc6IGJvb2xlYW47XG4gIC8qKiBXaGV0aGVyIGNhdGhvbGljIGhvbGlkYXlzIHNoYWxsIGJlIGluY2x1ZGVkLiAqL1xuICBjYXRob2xpYzogYm9vbGVhbjtcbn07XG4vKipcbiAqIFRoaXMgKipFKipsZW1lbnQgKipQKipsYWNlaG9sZGVyIHJlZ2lzdGVycyB0aGUgXCJEYXRlLkhvbGlkYXlzXCItRVAgdGhhdCBtYWtlcyByZXF1ZXN0cyB0byBcIkFQSS1GZWllcnRhZ2UuZGVcIiBpbiBvcmRlciB0b1xuICogcmV0cmlldmUgZ2VybWFuIGhvbGlkYXlzIG9mIGFsbCBzdGF0ZXMuXG4gKlxuICogQ29uZmlnIFBhcmFtZXRlciAob3JkZXIgZG9lc24ndCBtYXR0ZXIsIGNhc2UtaW5zZW5zaXRpdmUpOlxuICogIC0gU3RhdGVzOiAgICAgICAgIGJ3LGJ5LGJlLGJiLGhiLGhoLGhlLG12LG5pLG53LHJwLHNsLHNuLHN0LHNoLHRoXG4gKiAgLSBcIlRISVNfWUVBUlwiOiAgICBSZXByZXNlbnRzIHRoZSBjdXJyZW50IHllYXIgYW5kIHN1cHBvcnRzIGFyaXRobWV0aWNhbFxuICogICAgICAgICAgICAgICAgICAgIG9wZXJhdGlvbnMgKCArLy0gZS5nLiBUSElTX1lFQVIgKyAxID0gbmV4dCB5ZWFyKVxuICogIC0gXCJGcmllZGVuc2Zlc3RcIjogVGhlIEF1Z3NidXJnJ3MgZmVzdGl2YWwgb2YgcGVhY2UuXG4gKiAgLSBcIktBVEhPTElTQ0hcIjogICBLYXRob2xpYyBob2xpZGF5c1xuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFNhbHZhdG9yZS5DYWxsYXJpQEFuc2JhY2guZGUpICovXG4vLyBiaW9tZS1pZ25vcmUgbGludC9jb21wbGV4aXR5L25vU3RhdGljT25seUNsYXNzOiBQcm9hY3RpdmUgRGVzaWduXG5leHBvcnQgY2xhc3MgRGF0ZV9Ib2xpZGF5cyB7XG4gIC8qKiBTdG9yZXMgdGhlIHJlcXVlc3RzIGFscmVhZHkgbWFkZS4gKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBidWZmZXI6IE1hcDxzdHJpbmcsIEFycmF5PHN0cmluZz4gfCBQcm9taXNlPEFycmF5PHN0cmluZz4+PiA9IG5ldyBNYXA8XG4gICAgc3RyaW5nLFxuICAgIEFycmF5PHN0cmluZz4gfCBQcm9taXNlPEFycmF5PHN0cmluZz4+XG4gID4oKTtcbiAgLyoqXG4gICAqIEdlbmVyYXRlcyBhIGtleS17QGxpbmsgc3RyaW5nIH0gdGhhdCBtYXkgYmUgdXNlZCB0byBjb21wYXJlIHRvIHtAbGluayBBcGlSZXF1ZXN0IH1zIHdpdGggZWFjaCBvdGhlci5cbiAgICpcbiAgICogQHBhcmFtIGZyb20gVGhlIHtAbGluayBBcGlSZXF1ZXN0IH0gdG8gZ2VuZXJhdGUgdGhlIGtleSBmcm9tLlxuICAgKlxuICAgKiBAcmV0dXJucyBUaGUgcmVxdWVzdGVkIGtleS4gKi9cbiAgcHJvdGVjdGVkIHN0YXRpYyBnZW5Db21wYXJhYmxlS2V5KGZyb206IEFwaVJlcXVlc3QpOiBzdHJpbmcge1xuICAgIGNvbnN0IHNvcnRlZFllYXJzID0gWy4uLmZyb20ueWVhcnNdLnNvcnQoKS5qb2luKFwiLVwiKTtcbiAgICBjb25zdCBzb3J0ZWRTdGF0ZXMgPSBbLi4uZnJvbS5zdGF0ZXNdLnNvcnQoKS5qb2luKFwiLVwiKTtcblxuICAgIHJldHVybiBgJHtzb3J0ZWRZZWFyc31fJHtzb3J0ZWRTdGF0ZXN9XyR7ZnJvbS5hdWdzYnVyZyA/IFwiVFwiIDogXCJGXCJ9XyR7ZnJvbS5jYXRob2xpYyA/IFwiVFwiIDogXCJGXCJ9YDtcbiAgfVxuICAvKipcbiAgICogU2VlIHtAbGluayBEYXRlX0hvbGlkYXlzIH0uXG4gICAqXG4gICAqIEBwYXJhbSBwYXJhbXMgVGhlIHBhcmFtZXRlcnMgZm9yIHRoYXQgRWxlbWVudC1QbGFjZWhvbGRlciAocHJvdmlkZWQgYnkgQ29kQmkpLiAqL1xuICBAREJDLlBhcmFtdmFsdWVQcm92aWRlclxuICBwdWJsaWMgc3RhdGljIHJldHJpZXZlKFxuICAgIEBHUkVBVEVSLlBSRSgxLCB0cnVlLCBmYWxzZSwgXCJsZW5ndGhcIiwgXCJIYXNuJ3QgYXQgbGVhc3QgdGhlIHllYXIgYmVlbiBzcGVjaWZpZWQ/XCIpXG4gICAgQEFFLlBSRShuZXcgVFlQRShcInN0cmluZ1wiKSlcbiAgICBwYXJhbXM6IEFycmF5PHN0cmluZz4sXG4gICk6IFByb21pc2U8QXJyYXk8c3RyaW5nPj4ge1xuICAgIC8vICNyZWdpb24gRGV0ZXJtaW5lIHBhcmFtZXRlci5cbiAgICBjb25zdCByZXN1bHQ6IEFycmF5PHN0cmluZz4gPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAgIGNvbnN0IHllYXJzOiBBcnJheTxzdHJpbmc+ID0gbmV3IEFycmF5PHN0cmluZz4oKTtcbiAgICBjb25zdCBzdGF0ZXM6IEFycmF5PHN0cmluZz4gPSBuZXcgQXJyYXk8c3RyaW5nPigpO1xuICAgIGNvbnN0IGF1Z3NidXJnID0gcGFyYW1zLnNvbWUoKHRvQ2hlY2spID0+ICh0b0NoZWNrIGFzIHN0cmluZykudG9Mb3dlckNhc2UoKSA9PT0gXCJmcmllZGVuc2Zlc3RcIik7XG4gICAgY29uc3Qga2F0aG9saWMgPSBwYXJhbXMuc29tZSgodG9DaGVjaykgPT4gKHRvQ2hlY2sgYXMgc3RyaW5nKS50b0xvd2VyQ2FzZSgpID09PSBcImthdGhvbGlzY2hcIik7XG5cbiAgICBmb3IgKGNvbnN0IHBhcmFtZXRlciBvZiBwYXJhbXMpIHtcbiAgICAgIGlmIChOdW1iZXIuaXNOYU4ocGFyYW1ldGVyKSkge1xuICAgICAgICB5ZWFycy5wdXNoKHBhcmFtZXRlcik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpZiAocGFyYW1ldGVyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcInRoaXNfeWVhclwiKSAhPT0gLTEpIHtcbiAgICAgICAgICBsZXQgaWR4T3BlcmFuZDogbnVtYmVyID0gcGFyYW1ldGVyLmluZGV4T2YoXCIrXCIpO1xuXG4gICAgICAgICAgaWYgKGlkeE9wZXJhbmQgPT09IC0xKSB7XG4gICAgICAgICAgICBpZHhPcGVyYW5kID0gcGFyYW1ldGVyLmluZGV4T2YoXCItXCIpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChpZHhPcGVyYW5kICE9PSAtMSkge1xuICAgICAgICAgICAgeWVhcnMucHVzaChcbiAgICAgICAgICAgICAgKFxuICAgICAgICAgICAgICAgIG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKSArXG4gICAgICAgICAgICAgICAgTnVtYmVyLnBhcnNlSW50KHBhcmFtZXRlci5zdWJzdHJpbmcoaWR4T3BlcmFuZCArIDEpKSAqXG4gICAgICAgICAgICAgICAgICAocGFyYW1ldGVyLnN1YnN0cmluZyhpZHhPcGVyYW5kLCBpZHhPcGVyYW5kICsgMSkgPT09IFwiK1wiID8gMSA6IC0xKVxuICAgICAgICAgICAgICApLnRvU3RyaW5nKCksXG4gICAgICAgICAgICApO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB5ZWFycy5wdXNoKG5ldyBEYXRlKCkuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgcGFyYW1ldGVyLnRvTG93ZXJDYXNlKCkuaW5kZXhPZihcImZyaWVkZW5zZmVzdFwiKSA9PT0gLTEgJiZcbiAgICAgICAgICBwYXJhbWV0ZXIudG9Mb3dlckNhc2UoKS5pbmRleE9mKFwia2F0aG9saXNjaFwiKSA9PT0gLTFcbiAgICAgICAgKSB7XG4gICAgICAgICAgc3RhdGVzLnB1c2gocGFyYW1ldGVyLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIC8vICNlbmRyZWdpb24gRGV0ZXJtaW5lIHBhcmFtZXRlci5cbiAgICBjb25zdCBwcm9taXNlID0gbmV3IFByb21pc2U8QXJyYXk8c3RyaW5nPj4oKHJlc29sdmUpID0+IHtcbiAgICAgIC8vICNyZWdpb24gUmVzb2x2ZSBmcm9tIEJ1ZmZlciBpZiBhdmFpbGFibGUuXG4gICAgICBpZiAoXG4gICAgICAgIERhdGVfSG9saWRheXMuYnVmZmVyLmhhcyhcbiAgICAgICAgICBEYXRlX0hvbGlkYXlzLmdlbkNvbXBhcmFibGVLZXkoe1xuICAgICAgICAgICAgeWVhcnM6IHllYXJzLFxuICAgICAgICAgICAgc3RhdGVzOiBzdGF0ZXMsXG4gICAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcsXG4gICAgICAgICAgICBjYXRob2xpYzoga2F0aG9saWMsXG4gICAgICAgICAgfSBhcyBBcGlSZXF1ZXN0KSxcbiAgICAgICAgKVxuICAgICAgKSB7XG4gICAgICAgIGlmIChcbiAgICAgICAgICBBcnJheS5pc0FycmF5KFxuICAgICAgICAgICAgRGF0ZV9Ib2xpZGF5cy5idWZmZXIuZ2V0KFxuICAgICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmdlbkNvbXBhcmFibGVLZXkoe1xuICAgICAgICAgICAgICAgIHllYXJzOiB5ZWFycyxcbiAgICAgICAgICAgICAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICAgICAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcsXG4gICAgICAgICAgICAgICAgY2F0aG9saWM6IGthdGhvbGljLFxuICAgICAgICAgICAgICB9IGFzIEFwaVJlcXVlc3QpLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgICApXG4gICAgICAgICkge1xuICAgICAgICAgIHJlc29sdmUoXG4gICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmJ1ZmZlci5nZXQoXG4gICAgICAgICAgICAgIERhdGVfSG9saWRheXMuZ2VuQ29tcGFyYWJsZUtleSh7XG4gICAgICAgICAgICAgICAgeWVhcnM6IHllYXJzLFxuICAgICAgICAgICAgICAgIHN0YXRlczogc3RhdGVzLFxuICAgICAgICAgICAgICAgIGF1Z3NidXJnOiBhdWdzYnVyZyxcbiAgICAgICAgICAgICAgICBjYXRob2xpYzoga2F0aG9saWMsXG4gICAgICAgICAgICAgIH0gYXMgQXBpUmVxdWVzdCksXG4gICAgICAgICAgICApIGFzIEFycmF5PHN0cmluZz4sXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAoXG4gICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmJ1ZmZlci5nZXQoXG4gICAgICAgICAgICAgIERhdGVfSG9saWRheXMuZ2VuQ29tcGFyYWJsZUtleSh7XG4gICAgICAgICAgICAgICAgeWVhcnM6IHllYXJzLFxuICAgICAgICAgICAgICAgIHN0YXRlczogc3RhdGVzLFxuICAgICAgICAgICAgICAgIGF1Z3NidXJnOiBhdWdzYnVyZyxcbiAgICAgICAgICAgICAgICBjYXRob2xpYzoga2F0aG9saWMsXG4gICAgICAgICAgICAgIH0gYXMgQXBpUmVxdWVzdCksXG4gICAgICAgICAgICApIGFzIFByb21pc2U8QXJyYXk8c3RyaW5nPj5cbiAgICAgICAgICApLnRoZW4oKHJlc3VsdDogQXJyYXk8c3RyaW5nPikgPT4ge1xuICAgICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgLy8gI2VuZHJlZ2lvbiBSZXNvbHZlIGZyb20gQnVmZmVyIGlmIGF2YWlsYWJsZS5cbiAgICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcbiAgICAgIC8vICNlbmRyZWdpb24gUGFyc2UgcGFyYW1ldGVyLlxuICAgICAgJC5hamF4KHtcbiAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9Ib2xpZGF5c19GZWllcnRhZ2VERWAsXG4gICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICB5ZWFyczogeWVhcnMuam9pbihcIixcIiksXG4gICAgICAgICAgc3RhdGVzOiBzdGF0ZXMuam9pbihcIixcIikucmVwbGFjZSgvIC9nLCBcIlwiKSxcbiAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcgPyBcInRydWVcIiA6IFwiZmFsc2UgIFwiLFxuICAgICAgICAgIGNhdGhvbGljOiBrYXRob2xpYyA/IFwidHJ1ZVwiIDogXCJmYWxzZVwiLFxuICAgICAgICB9LFxuICAgICAgfSkuZG9uZSgoZGF0YTogc3RyaW5nKSA9PiB7XG4gICAgICAgIGNvbnN0IGluY29taW5nID0gSlNPTi5wYXJzZShkYXRhKTtcblxuICAgICAgICBpZiAoaW5jb21pbmcuc3RhdHVzICE9PSBcImVycm9yXCIpIHtcbiAgICAgICAgICBmb3IgKGNvbnN0IGVudHJ5IG9mIGluY29taW5nLmZlaWVydGFnZSBhcyBBcnJheTx7IGRhdGU6IHN0cmluZyB9Pikge1xuICAgICAgICAgICAgcmVzdWx0LnB1c2goXG4gICAgICAgICAgICAgIG5ldyBEYXRlKGVudHJ5LmRhdGUucmVwbGFjZSgvXFwuL2csIFwiL1wiKS5yZXBsYWNlKC8tL2csIFwiL1wiKSkudG9Mb2NhbGVEYXRlU3RyaW5nKFwiZGUtREVcIiwge1xuICAgICAgICAgICAgICAgIHllYXI6IFwibnVtZXJpY1wiLFxuICAgICAgICAgICAgICAgIG1vbnRoOiBcIjItZGlnaXRcIixcbiAgICAgICAgICAgICAgICBkYXk6IFwiMi1kaWdpdFwiLFxuICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuICAgICAgICAgIC8vICNyZWdpb24gQnVmZmVyIHJlcXVlc3RcbiAgICAgICAgICBEYXRlX0hvbGlkYXlzLmJ1ZmZlci5zZXQoXG4gICAgICAgICAgICBEYXRlX0hvbGlkYXlzLmdlbkNvbXBhcmFibGVLZXkoe1xuICAgICAgICAgICAgICB5ZWFyczogeWVhcnMsXG4gICAgICAgICAgICAgIHN0YXRlczogc3RhdGVzLFxuICAgICAgICAgICAgICBhdWdzYnVyZzogYXVnc2J1cmcsXG4gICAgICAgICAgICAgIGNhdGhvbGljOiBrYXRob2xpYyxcbiAgICAgICAgICAgIH0gYXMgQXBpUmVxdWVzdCksXG4gICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgKTtcbiAgICAgICAgICAvLyAjZW5kcmVnaW9uIEJ1ZmZlciByZXF1ZXN0XG4gICAgICAgICAgcmVzb2x2ZShyZXN1bHQpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9KTtcbiAgICAvLyAjcmVnaW9uIEJ1ZmZlciByZXF1ZXN0IHByb21pc2UuXG4gICAgRGF0ZV9Ib2xpZGF5cy5idWZmZXIuc2V0KFxuICAgICAgRGF0ZV9Ib2xpZGF5cy5nZW5Db21wYXJhYmxlS2V5KHtcbiAgICAgICAgeWVhcnM6IHllYXJzLFxuICAgICAgICBzdGF0ZXM6IHN0YXRlcyxcbiAgICAgICAgYXVnc2J1cmc6IGF1Z3NidXJnLFxuICAgICAgICBjYXRob2xpYzoga2F0aG9saWMsXG4gICAgICB9IGFzIEFwaVJlcXVlc3QpLFxuICAgICAgcHJvbWlzZSxcbiAgICApO1xuICAgIC8vICNlbmRyZWdpb24gQnVmZmVyIHJlcXVlc3QgcHJvbWlzZS5cbiAgICByZXR1cm4gcHJvbWlzZTtcbiAgfVxufVxuXG53aW5kb3cuY29kYmkucmVnaXN0ZXJFUChcIkRhdGUuSG9saWRheXNcIiwgRGF0ZV9Ib2xpZGF5cy5yZXRyaWV2ZS5iaW5kKERhdGVfSG9saWRheXMpKTsgLy8gSW5pdGlhbGl6YXRpb25cbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUEsOEJBQTBCO0FBa0NuQixJQUFNLGlCQUFOLE1BQU0sZUFBYztBQUFBLEVBRXpCO0FBQUE7QUFBQSxTQUFpQixTQUE4RCxvQkFBSSxJQUdqRjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFPRixPQUFpQixpQkFBaUIsTUFBMEI7QUFDMUQsVUFBTSxjQUFjLENBQUMsR0FBRyxLQUFLLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxHQUFHO0FBQ25ELFVBQU0sZUFBZSxDQUFDLEdBQUcsS0FBSyxNQUFNLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRztBQUVyRCxXQUFPLEdBQUcsV0FBVyxJQUFJLFlBQVksSUFBSSxLQUFLLFdBQVcsTUFBTSxHQUFHLElBQUksS0FBSyxXQUFXLE1BQU0sR0FBRztBQUFBLEVBQ2pHO0FBQUEsRUFNQSxPQUFjLFNBR1osUUFDd0I7QUFFeEIsVUFBTSxTQUF3QixJQUFJLE1BQWM7QUFDaEQsVUFBTSxRQUF1QixJQUFJLE1BQWM7QUFDL0MsVUFBTSxTQUF3QixJQUFJLE1BQWM7QUFDaEQsVUFBTSxXQUFXLE9BQU8sS0FBSyxDQUFDLFlBQWEsUUFBbUIsWUFBWSxNQUFNLGNBQWM7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
