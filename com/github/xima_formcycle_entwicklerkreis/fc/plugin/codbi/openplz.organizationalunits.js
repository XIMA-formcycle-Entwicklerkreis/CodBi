import {
  OpenPLZ
} from "./chunk-Q5ESOWDF.js";
import {
  require_dist
} from "./chunk-5LC5FOZV.js";
import {
  __toESM
} from "./chunk-KWZW6WYL.js";

// src/js/EPs/openplz.organizationalunits.ts
var import_fc_form_renderer = __toESM(require_dist(), 1);
var OpenPLZ_OrganizationalUnits = class _OpenPLZ_OrganizationalUnits extends OpenPLZ {
  /**
   * Joins all {@link object }s in "params" into one.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  static retrieve(params) {
    return new Promise((resolve, reject) => {
      const $ = (0, import_fc_form_renderer.getJQuery)();
      if (params.length === 2) {
        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
          type: "GET",
          headers: {
            Accept: "application/json",
            "X-Country": params[0] ? params[0] : "",
            "X-OrgaUnit": params[1] ? params[1] : "",
            "X-OfficialKey": "",
            "X-Detail": "",
            "X-Param1": "",
            "X-Param2": "",
            "X-Param3": "",
            "X-Param4": "",
            "X-PagesToLoad": params[4] ? params[4] : ""
          }
        }).done((response) => {
          resolve(JSON.parse(response));
        });
      } else {
        if (isNumericString(params[2])) {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
            type: "GET",
            headers: {
              Accept: "application/json",
              "X-Country": params[0] ? params[0] : "",
              "X-OrgaUnit": params[1] ? params[1] : "",
              "X-OfficialKey": params[2] ? params[2] : "",
              "X-Detail": params[3] ? params[3] : "",
              "X-Param1": "",
              "X-Param2": "",
              "X-Param3": "",
              "X-Param4": "",
              "X-PagesToLoad": params[4] ? params[4] : ""
            }
          }).done((response) => {
            resolve(JSON.parse(response));
          });
        } else {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
            type: "GET",
            headers: {
              Accept: "application/json",
              "X-Country": params[0] ? params[0] : "",
              "X-OrgaUnit": params[1] ? params[1] : "",
              "X-OfficialKey": "",
              "X-Detail": "",
              "X-Param1": "",
              "X-Param2": "",
              "X-Param3": "",
              "X-Param4": ""
            }
          }).done((response) => {
            for (const candidate of JSON.parse(response)) {
              if (params[2] === candidate.name) {
                $.ajax({
                  url: `${window.codbi.baseURL}plugin?name=CodBi_OpenPLZ_Query`,
                  type: "GET",
                  headers: {
                    Accept: "application/json",
                    "X-Country": params[0] ? params[0] : "",
                    "X-OrgaUnit": params[1] ? params[1] : "",
                    "X-OfficialKey": candidate.key,
                    "X-Detail": params[3] ? params[3] : "",
                    "X-Param1": "",
                    "X-Param2": "",
                    "X-Param3": "",
                    "X-Param4": "",
                    "X-PagesToLoad": params[4] ? params[4] : ""
                  }
                }).done((response2) => {
                  resolve(JSON.parse(response2));
                });
              }
            }
          });
        }
      }
    });
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ_OrganizationalUnits } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("OpenPLZ.OrganizationalUnits", _OpenPLZ_OrganizationalUnits.retrieve);
    })();
  }
  // #region Initialization
};
function isNumericString(candidate) {
  if (candidate.trim() === "") {
    return false;
  }
  const num = +candidate;
  return !Number.isNaN(num) && Number.isFinite(num);
}
export {
  OpenPLZ_OrganizationalUnits
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9vcGVucGx6Lm9yZ2FuaXphdGlvbmFsdW5pdHMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuLy8gI3JlZ2lvbiBYSU1BXG5pbXBvcnQgeyBnZXRKUXVlcnkgfSBmcm9tIFwiQGRlLXhpbWEvZmMtZm9ybS1yZW5kZXJlclwiO1xuLy8gI2VuZHJlZ2lvbiBYSU1BXG5pbXBvcnQgeyBPcGVuUExaIH0gZnJvbSBcIi4vb3BlbnBsei5qc1wiO1xuLy8gI2VuZHJlZ2lvbiBJbXBvcnRzXG4vKipcbiAqIEFuIHtAbGluayBPcGVuUExaIH0tUmVxdWVzdCBzcGVjaWFsaXplZCBpbnRvIHJldHJpZXZpbmcgb3JnYW5pemF0aW9uYWwgdW5pdHMuXG4gKiBUaGlzIHtAbGluayBPcGVuUExaIH0gZG9lcyBub3Qgc2VhcmNoIGZvciB1bml0cyBidXQgcmF0aGVyIHJldHVybnMgYWxsIGF2YWlsYWJsZSBvbmVzLlxuICpcbiAqIENvbmZpZyBQYXJhbWV0ZXI6XG4gKiAtIDFzdDogVGhlIG9wdGlvbmFsICoqY291bnRyeSoqIHRvIHJldHJpZXZlIHRoZSBkYXRhIG9mIChpZiBub3QgcHJvdmlkZWQgZWl0aGVyIHRoZSBjb3VudHJ5IHNwZWNpZmllZCBpblxuICogICAgICAgIHRoZSBDb2RCaSdzIENvbmZpZ3VyYXRpb24gKipPcGVuUExaX0NvdW50cnkqKiB3aWxsIGJlIHVzZWQgb3IsIGlmIG5vdCBzcGVjaWZpZWQsIFwiZGVcIikuXG4gKiAtIDJuZDogVGhlICoqb3JnYVVuaXQqKiB0byByZXRyaWV2ZSAoZS5nLiAqKkZlZGVyYWxTdGF0ZXMqKiwgKipGZWRlcmFsUHJvdmluY2VzKiogb3IgKipDYW50b25zKiopLlxuICogLSAzcmQ6IFRoZSBvcHRpb25hbCBrZXkgb2YgdGhlIHN0YXRlLCBwcm92aW5jZSBvciBjYW50b24gdG8gZ2V0IGRldGFpbHMgb2YuIFRoaXMge0BsaW5rIE9wZW5QTFogfSBoYXMgdGhlIGFiaWxpdHlcbiAqICAgICAgICB0byBsb29rdXAgKipGZWRlcmFsU3RhdGVzKiosICoqRmVkZXJhbFByb3ZpbmNlcyoqICYgKipDYW50b25zKiogYnkgbmFtZSwgaWYgdGhlIGtleSBwcm92aWRlZCBpc1xuICogICAgICAgIG5vdCBhIG51bWJlciBidXQgYSBuYW1lLiBJZiB0aGlzIHBhcmFtZXRlciBpcyBzZXQgdGhlIDR0aCBtdXN0IGJlIHByb3ZpZGVkIGFsc28uXG4gKiAtIDR0aDogVGhlIG9wdGlvbmFsIGRldGFpbCB0byBmZXRjaCBhYm91dCBhIGNlcnRhaW4gc3RhdGUsIHByb3ZpbmNlIG9yIGNhbnRvbiBpZGVudGlmaWVkIGJ5IHRoZVxuICogICAgICAgICoqb2ZmaWNpYWxLZXkqKiAobm90IG9wdGlvbmFsIGlmIGFuIG9mZmljaWFsIGtleSBpcyBwcmVzZW50KS4gTWF5IGJlIE11bmljaXBhbGl0aWVzIG9yIERpc3RyaWN0cy5cbiAqIC0gNXRoOiBBbiBPcHRpb25hbCBudW1iZXIgb2YgcGFnZXMgdG8gbG9hZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuZXhwb3J0IGNsYXNzIE9wZW5QTFpfT3JnYW5pemF0aW9uYWxVbml0cyBleHRlbmRzIE9wZW5QTFoge1xuICAvKipcbiAgICogSm9pbnMgYWxsIHtAbGluayBvYmplY3QgfXMgaW4gXCJwYXJhbXNcIiBpbnRvIG9uZS5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgcmV0cmlldmUocGFyYW1zOiBBcnJheTx1bmtub3duPik6IEFycmF5PHVua25vd24+IHwgdW5rbm93biB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNvbnN0ICQgPSBnZXRKUXVlcnkoKTtcblxuICAgICAgaWYgKHBhcmFtcy5sZW5ndGggPT09IDIpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICB1cmw6IGAke3dpbmRvdy5jb2RiaS5iYXNlVVJMfXBsdWdpbj9uYW1lPUNvZEJpX09wZW5QTFpfUXVlcnlgLFxuICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgQWNjZXB0OiBcImFwcGxpY2F0aW9uL2pzb25cIixcbiAgICAgICAgICAgIFwiWC1Db3VudHJ5XCI6IHBhcmFtc1swXSA/IChwYXJhbXNbMF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICBcIlgtT3JnYVVuaXRcIjogcGFyYW1zWzFdID8gKHBhcmFtc1sxXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgIFwiWC1PZmZpY2lhbEtleVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLURldGFpbFwiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtMVwiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtMlwiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtM1wiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhcmFtNFwiOiBcIlwiLFxuICAgICAgICAgICAgXCJYLVBhZ2VzVG9Mb2FkXCI6IHBhcmFtc1s0XSA/IChwYXJhbXNbNF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSkuZG9uZSgocmVzcG9uc2U6IHN0cmluZykgPT4ge1xuICAgICAgICAgIHJlc29sdmUoSlNPTi5wYXJzZShyZXNwb25zZSkpO1xuICAgICAgICB9KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChpc051bWVyaWNTdHJpbmcocGFyYW1zWzJdIGFzIHN0cmluZykpIHtcbiAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9PcGVuUExaX1F1ZXJ5YCxcbiAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICAgIFwiWC1Db3VudHJ5XCI6IHBhcmFtc1swXSA/IChwYXJhbXNbMF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICAgIFwiWC1PcmdhVW5pdFwiOiBwYXJhbXNbMV0gPyAocGFyYW1zWzFdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtT2ZmaWNpYWxLZXlcIjogcGFyYW1zWzJdID8gKHBhcmFtc1syXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgICAgXCJYLURldGFpbFwiOiBwYXJhbXNbM10gPyAocGFyYW1zWzNdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtUGFyYW0xXCI6IFwiXCIsXG4gICAgICAgICAgICAgIFwiWC1QYXJhbTJcIjogXCJcIixcbiAgICAgICAgICAgICAgXCJYLVBhcmFtM1wiOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtUGFyYW00XCI6IFwiXCIsXG4gICAgICAgICAgICAgIFwiWC1QYWdlc1RvTG9hZFwiOiBwYXJhbXNbNF0gPyAocGFyYW1zWzRdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9KS5kb25lKChyZXNwb25zZTogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICByZXNvbHZlKEpTT04ucGFyc2UocmVzcG9uc2UpKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBgJHt3aW5kb3cuY29kYmkuYmFzZVVSTH1wbHVnaW4/bmFtZT1Db2RCaV9PcGVuUExaX1F1ZXJ5YCxcbiAgICAgICAgICAgIHR5cGU6IFwiR0VUXCIsXG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgIEFjY2VwdDogXCJhcHBsaWNhdGlvbi9qc29uXCIsXG4gICAgICAgICAgICAgIFwiWC1Db3VudHJ5XCI6IHBhcmFtc1swXSA/IChwYXJhbXNbMF0gYXMgc3RyaW5nKSA6IFwiXCIsXG4gICAgICAgICAgICAgIFwiWC1PcmdhVW5pdFwiOiBwYXJhbXNbMV0gPyAocGFyYW1zWzFdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtT2ZmaWNpYWxLZXlcIjogXCJcIixcbiAgICAgICAgICAgICAgXCJYLURldGFpbFwiOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtUGFyYW0xXCI6IFwiXCIsXG4gICAgICAgICAgICAgIFwiWC1QYXJhbTJcIjogXCJcIixcbiAgICAgICAgICAgICAgXCJYLVBhcmFtM1wiOiBcIlwiLFxuICAgICAgICAgICAgICBcIlgtUGFyYW00XCI6IFwiXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0pLmRvbmUoKHJlc3BvbnNlOiBzdHJpbmcpID0+IHtcbiAgICAgICAgICAgIGZvciAoY29uc3QgY2FuZGlkYXRlIG9mIEpTT04ucGFyc2UocmVzcG9uc2UpKSB7XG4gICAgICAgICAgICAgIGlmICgocGFyYW1zWzJdIGFzIHN0cmluZykgPT09IGNhbmRpZGF0ZS5uYW1lKSB7XG4gICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgIHVybDogYCR7d2luZG93LmNvZGJpLmJhc2VVUkx9cGx1Z2luP25hbWU9Q29kQmlfT3BlblBMWl9RdWVyeWAsXG4gICAgICAgICAgICAgICAgICB0eXBlOiBcIkdFVFwiLFxuICAgICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICBBY2NlcHQ6IFwiYXBwbGljYXRpb24vanNvblwiLFxuICAgICAgICAgICAgICAgICAgICBcIlgtQ291bnRyeVwiOiBwYXJhbXNbMF0gPyAocGFyYW1zWzBdIGFzIHN0cmluZykgOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBcIlgtT3JnYVVuaXRcIjogcGFyYW1zWzFdID8gKHBhcmFtc1sxXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJYLU9mZmljaWFsS2V5XCI6IGNhbmRpZGF0ZS5rZXksXG4gICAgICAgICAgICAgICAgICAgIFwiWC1EZXRhaWxcIjogcGFyYW1zWzNdID8gKHBhcmFtc1szXSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJYLVBhcmFtMVwiOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBcIlgtUGFyYW0yXCI6IFwiXCIsXG4gICAgICAgICAgICAgICAgICAgIFwiWC1QYXJhbTNcIjogXCJcIixcbiAgICAgICAgICAgICAgICAgICAgXCJYLVBhcmFtNFwiOiBcIlwiLFxuICAgICAgICAgICAgICAgICAgICBcIlgtUGFnZXNUb0xvYWRcIjogcGFyYW1zWzRdID8gKHBhcmFtc1s0XSBhcyBzdHJpbmcpIDogXCJcIixcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgfSkuZG9uZSgocmVzcG9uc2U6IHN0cmluZykgPT4ge1xuICAgICAgICAgICAgICAgICAgcmVzb2x2ZShKU09OLnBhcnNlKHJlc3BvbnNlKSk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIE9wZW5QTFpfT3JnYW5pemF0aW9uYWxVbml0cyB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRVAgfSB3aXRoIHRoZSBDb2RCaSBhbmQgcGVyZm9ybXMgdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLiovXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgcmVnaXN0ZXJlZDogYm9vbGVhbiA9ICgoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5jb2RiaS5yZWdpc3RlckVQKFwiT3BlblBMWi5Pcmdhbml6YXRpb25hbFVuaXRzXCIsIE9wZW5QTFpfT3JnYW5pemF0aW9uYWxVbml0cy5yZXRyaWV2ZSk7XG4gIH0pKCk7XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbi8vICNyZWdpb24gSGVscGVyXG5mdW5jdGlvbiBpc051bWVyaWNTdHJpbmcoY2FuZGlkYXRlOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgaWYgKGNhbmRpZGF0ZS50cmltKCkgPT09IFwiXCIpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBjb25zdCBudW0gPSArY2FuZGlkYXRlO1xuXG4gIHJldHVybiAhTnVtYmVyLmlzTmFOKG51bSkgJiYgTnVtYmVyLmlzRmluaXRlKG51bSk7XG59XG4vLyAjZW5kcmVnaW9uIEhlbHBlclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7Ozs7Ozs7QUFFQSw4QkFBMEI7QUFxQm5CLElBQU0sOEJBQU4sTUFBTSxxQ0FBb0MsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLdkQsT0FBdUIsU0FBUyxRQUFrRDtBQUNoRixXQUFPLElBQUksUUFBUSxDQUFDLFNBQVMsV0FBVztBQUN0QyxZQUFNLFFBQUksbUNBQVU7QUFFcEIsVUFBSSxPQUFPLFdBQVcsR0FBRztBQUN2QixVQUFFLEtBQUs7QUFBQSxVQUNMLEtBQUssR0FBRyxPQUFPLE1BQU0sT0FBTztBQUFBLFVBQzVCLE1BQU07QUFBQSxVQUNOLFNBQVM7QUFBQSxZQUNQLFFBQVE7QUFBQSxZQUNSLGFBQWEsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxZQUNqRCxjQUFjLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsWUFDbEQsaUJBQWlCO0FBQUEsWUFDakIsWUFBWTtBQUFBLFlBQ1osWUFBWTtBQUFBLFlBQ1osWUFBWTtBQUFBLFlBQ1osWUFBWTtBQUFBLFlBQ1osWUFBWTtBQUFBLFlBQ1osaUJBQWlCLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsVUFDdkQ7QUFBQSxRQUNGLENBQUMsRUFBRSxLQUFLLENBQUMsYUFBcUI7QUFDNUIsa0JBQVEsS0FBSyxNQUFNLFFBQVEsQ0FBQztBQUFBLFFBQzlCLENBQUM7QUFBQSxNQUNILE9BQU87QUFDTCxZQUFJLGdCQUFnQixPQUFPLENBQUMsQ0FBVyxHQUFHO0FBQ3hDLFlBQUUsS0FBSztBQUFBLFlBQ0wsS0FBSyxHQUFHLE9BQU8sTUFBTSxPQUFPO0FBQUEsWUFDNUIsTUFBTTtBQUFBLFlBQ04sU0FBUztBQUFBLGNBQ1AsUUFBUTtBQUFBLGNBQ1IsYUFBYSxPQUFPLENBQUMsSUFBSyxPQUFPLENBQUMsSUFBZTtBQUFBLGNBQ2pELGNBQWMsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxjQUNsRCxpQkFBaUIsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxjQUNyRCxZQUFZLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsY0FDaEQsWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osaUJBQWlCLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsWUFDdkQ7QUFBQSxVQUNGLENBQUMsRUFBRSxLQUFLLENBQUMsYUFBcUI7QUFDNUIsb0JBQVEsS0FBSyxNQUFNLFFBQVEsQ0FBQztBQUFBLFVBQzlCLENBQUM7QUFBQSxRQUNILE9BQU87QUFDTCxZQUFFLEtBQUs7QUFBQSxZQUNMLEtBQUssR0FBRyxPQUFPLE1BQU0sT0FBTztBQUFBLFlBQzVCLE1BQU07QUFBQSxZQUNOLFNBQVM7QUFBQSxjQUNQLFFBQVE7QUFBQSxjQUNSLGFBQWEsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxjQUNqRCxjQUFjLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsY0FDbEQsaUJBQWlCO0FBQUEsY0FDakIsWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLGNBQ1osWUFBWTtBQUFBLFlBQ2Q7QUFBQSxVQUNGLENBQUMsRUFBRSxLQUFLLENBQUMsYUFBcUI7QUFDNUIsdUJBQVcsYUFBYSxLQUFLLE1BQU0sUUFBUSxHQUFHO0FBQzVDLGtCQUFLLE9BQU8sQ0FBQyxNQUFpQixVQUFVLE1BQU07QUFDNUMsa0JBQUUsS0FBSztBQUFBLGtCQUNMLEtBQUssR0FBRyxPQUFPLE1BQU0sT0FBTztBQUFBLGtCQUM1QixNQUFNO0FBQUEsa0JBQ04sU0FBUztBQUFBLG9CQUNQLFFBQVE7QUFBQSxvQkFDUixhQUFhLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsb0JBQ2pELGNBQWMsT0FBTyxDQUFDLElBQUssT0FBTyxDQUFDLElBQWU7QUFBQSxvQkFDbEQsaUJBQWlCLFVBQVU7QUFBQSxvQkFDM0IsWUFBWSxPQUFPLENBQUMsSUFBSyxPQUFPLENBQUMsSUFBZTtBQUFBLG9CQUNoRCxZQUFZO0FBQUEsb0JBQ1osWUFBWTtBQUFBLG9CQUNaLFlBQVk7QUFBQSxvQkFDWixZQUFZO0FBQUEsb0JBQ1osaUJBQWlCLE9BQU8sQ0FBQyxJQUFLLE9BQU8sQ0FBQyxJQUFlO0FBQUEsa0JBQ3ZEO0FBQUEsZ0JBQ0YsQ0FBQyxFQUFFLEtBQUssQ0FBQ0EsY0FBcUI7QUFDNUIsMEJBQVEsS0FBSyxNQUFNQSxTQUFRLENBQUM7QUFBQSxnQkFDOUIsQ0FBQztBQUFBLGNBQ0g7QUFBQSxZQUNGO0FBQUEsVUFDRixDQUFDO0FBQUEsUUFDSDtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFLQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsU0FBdUIsY0FBdUIsTUFBTTtBQUNsRCxhQUFPLE9BQU8sTUFBTSxXQUFXLCtCQUErQiw2QkFBNEIsUUFBUTtBQUFBLElBQ3BHLEdBQUc7QUFBQTtBQUFBO0FBRUw7QUFFQSxTQUFTLGdCQUFnQixXQUE0QjtBQUNuRCxNQUFJLFVBQVUsS0FBSyxNQUFNLElBQUk7QUFDM0IsV0FBTztBQUFBLEVBQ1Q7QUFFQSxRQUFNLE1BQU0sQ0FBQztBQUViLFNBQU8sQ0FBQyxPQUFPLE1BQU0sR0FBRyxLQUFLLE9BQU8sU0FBUyxHQUFHO0FBQ2xEOyIsCiAgIm5hbWVzIjogWyJyZXNwb25zZSJdCn0K
