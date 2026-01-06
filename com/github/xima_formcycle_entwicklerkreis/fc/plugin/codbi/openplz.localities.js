import {
  OpenPLZ
} from "./chunk-Q5ESOWDF.js";
import "./chunk-5LC5FOZV.js";
import "./chunk-KWZW6WYL.js";

// src/js/EPs/openplz.localities.ts
var OpenPLZ_Localities = class _OpenPLZ_Localities extends OpenPLZ {
  /**
   * Retrieves the localities found according to the provided **params**.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  static retrieve(params) {
    return OpenPLZ.retrieve([
      params[0],
      "Localities",
      "",
      "",
      `name-${params[1].replace(/^/, "\xB0")}`,
      params.length >= 3 ? `postalCode-${params[2].replace(/^/, "\xB0")}` : "",
      "",
      "",
      "",
      params[3] ? params[3] : "",
      params[3] ? params[3] : ""
    ]);
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link OpenPLZ_Localities } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("OpenPLZ.Localities", _OpenPLZ_Localities.retrieve);
    })();
  }
  // #region Initialization
};
export {
  OpenPLZ_Localities
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9vcGVucGx6LmxvY2FsaXRpZXMudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8vICNyZWdpb24gSW1wb3J0c1xuaW1wb3J0IHsgT3BlblBMWiB9IGZyb20gXCIuL29wZW5wbHouanNcIjtcbi8vICNlbmRyZWdpb24gSW1wb3J0c1xuLyoqXG4gKiBBbiB7QGxpbmsgT3BlblBMWiB9LVJlcXVlc3Qgc3BlY2lhbGl6ZWQgaW50byBzZWFyY2hpbmcgZm9yIGxvY2FsaXRpZXMuXG4gKlxuICogQ29uZmlnIFBhcmFtZXRlcjpcbiAqIC0gMXN0OiBUaGUgb3B0aW9uYWwgKipjb3VudHJ5KiogdG8gcmV0cmlldmUgdGhlIGRhdGEgb2YgKGlmIG5vdCBwcm92aWRlZCBlaXRoZXIgdGhlIGNvdW50cnkgc3BlY2lmaWVkIGluXG4gKiAgICAgICAgdGhlIENvZEJpJ3MgQ29uZmlndXJhdGlvbiAqKk9wZW5QTFpfQ291bnRyeSoqIHdpbGwgYmUgdXNlZCBvciwgaWYgbm90IHNwZWNpZmllZCwgXCJkZVwiKS5cbiAqIC0gMm5kOiBUaGUgWyBQT1NJWCBSZWdFeCBdKGh0dHBzOi8vd3d3Lm9wZW5wbHphcGkub3JnL2RlL3JlZ2V4LykgZm9yIHRoZSBsb2NhbGl0eSdzIG5hbWUuXG4gKiAtIDNyZDogVGhlIFsgUE9TSVggUmVnRXggXShodHRwczovL3d3dy5vcGVucGx6YXBpLm9yZy9kZS9yZWdleC8pIGZvciB0aGUgbG9jYWxpdHkncyBwb3N0YWwgY29kZS5cbiAqIC0gNHRoOiBBbiBPcHRpb25hbCBudW1iZXIgb2YgcGFnZXMgdG8gbG9hZC5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuZXhwb3J0IGNsYXNzIE9wZW5QTFpfTG9jYWxpdGllcyBleHRlbmRzIE9wZW5QTFoge1xuICAvKipcbiAgICogUmV0cmlldmVzIHRoZSBsb2NhbGl0aWVzIGZvdW5kIGFjY29yZGluZyB0byB0aGUgcHJvdmlkZWQgKipwYXJhbXMqKi5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgcmV0cmlldmUocGFyYW1zOiBBcnJheTx1bmtub3duPik6IEFycmF5PHVua25vd24+IHwgdW5rbm93biB7XG4gICAgcmV0dXJuIE9wZW5QTFoucmV0cmlldmUoW1xuICAgICAgcGFyYW1zWzBdLFxuICAgICAgXCJMb2NhbGl0aWVzXCIsXG4gICAgICBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIGBuYW1lLSR7KHBhcmFtc1sxXSBhcyBzdHJpbmcpLnJlcGxhY2UoL14vLCBcIlx1MDBCMFwiKX1gLFxuICAgICAgcGFyYW1zLmxlbmd0aCA+PSAzID8gYHBvc3RhbENvZGUtJHsocGFyYW1zWzJdIGFzIHN0cmluZykucmVwbGFjZSgvXi8sIFwiXHUwMEIwXCIpfWAgOiBcIlwiLFxuICAgICAgXCJcIixcbiAgICAgIFwiXCIsXG4gICAgICBcIlwiLFxuICAgICAgcGFyYW1zWzNdID8gcGFyYW1zWzNdIDogXCJcIixcbiAgICAgIHBhcmFtc1szXSA/IHBhcmFtc1szXSA6IFwiXCIsXG4gICAgXSk7XG4gIH1cbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxuICAvKipcbiAgICogU3RhdGVzIHdoZXRoZXIgdGhpcyB7QGxpbmsgT3BlblBMWl9Mb2NhbGl0aWVzIH0gd2FzIHN1Y2Nlc3NmdWxseSByZWdpc3RlcmVkXG4gICAqIHZpYSB7QGxpbmsgQ29kYmlHbG9iYWwucmVnaXN0ZXJFUCB9IHdpdGggdGhlIENvZEJpIGFuZCBwZXJmb3JtcyB0aGUgcmVnaXN0cmF0aW9uIHVwb24gY2xhc3MgdXNhZ2UuKi9cbiAgcHVibGljIHN0YXRpYyBvdmVycmlkZSByZWdpc3RlcmVkOiBib29sZWFuID0gKCgpID0+IHtcbiAgICByZXR1cm4gd2luZG93LmNvZGJpLnJlZ2lzdGVyRVAoXCJPcGVuUExaLkxvY2FsaXRpZXNcIiwgT3BlblBMWl9Mb2NhbGl0aWVzLnJldHJpZXZlKTtcbiAgfSkoKTtcbiAgLy8gI3JlZ2lvbiBJbml0aWFsaXphdGlvblxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7OztBQWVPLElBQU0scUJBQU4sTUFBTSw0QkFBMkIsUUFBUTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFLOUMsT0FBdUIsU0FBUyxRQUFrRDtBQUNoRixXQUFPLFFBQVEsU0FBUztBQUFBLE1BQ3RCLE9BQU8sQ0FBQztBQUFBLE1BQ1I7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0EsUUFBUyxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssTUFBRyxDQUFDO0FBQUEsTUFDL0MsT0FBTyxVQUFVLElBQUksY0FBZSxPQUFPLENBQUMsRUFBYSxRQUFRLEtBQUssTUFBRyxDQUFDLEtBQUs7QUFBQSxNQUMvRTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsTUFDQSxPQUFPLENBQUMsSUFBSSxPQUFPLENBQUMsSUFBSTtBQUFBLE1BQ3hCLE9BQU8sQ0FBQyxJQUFJLE9BQU8sQ0FBQyxJQUFJO0FBQUEsSUFDMUIsQ0FBQztBQUFBLEVBQ0g7QUFBQSxFQUtBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUF1QixjQUF1QixNQUFNO0FBQ2xELGFBQU8sT0FBTyxNQUFNLFdBQVcsc0JBQXNCLG9CQUFtQixRQUFRO0FBQUEsSUFDbEYsR0FBRztBQUFBO0FBQUE7QUFFTDsiLAogICJuYW1lcyI6IFtdCn0K
