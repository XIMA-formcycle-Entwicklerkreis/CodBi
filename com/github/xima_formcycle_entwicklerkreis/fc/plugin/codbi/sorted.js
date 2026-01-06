import "./chunk-KWZW6WYL.js";

// src/js/EPs/sorted.ts
var Sorted = class _Sorted {
  /**
   * Implements the **Sorted** - Element-Placeholder.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  static retrieve(params) {
    if (params.length > 1) {
      params[0].sort((a, b) => {
        const nameA = a[params[1]].toUpperCase();
        const nameB = b[params[1]].toUpperCase();
        if (nameA < nameB) {
          return -1;
        }
        if (nameA > nameB) {
          return 1;
        }
        return 0;
      });
      return params[0];
    }
    return params.sort();
  }
  static {
    // #region Initialization
    /**
     * States whether this {@link Sorted } was successfully registered
     * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
    this.registered = (() => {
      return window.codbi.registerEP("Sorted", _Sorted.retrieve);
    })();
  }
  // #region Initialization
};
export {
  Sorted
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL3BhY2thZ2VzL2Zvcm0vc3JjL2pzL0VQcy9zb3J0ZWQudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbIi8qKlxuICogQW4gRWxlbWVudHBsYWNlaG9sZGVyIHNvcnRzIHRoZSB7QGxpbmsgQXJyYXkgfSBwYXNzZWQgYXMgdGhlICoqMXN0KiogcGFyYW1ldGVyIGluXG4gKiBhbHBoYWJldGljYWwgKGxleGljb2dyYXBoaWNhbCkgb3JkZXIuXG4gKlxuICogQ29uZmlnIFBhcmFtZXRlcjpcbiAqIC0gMXN0OiBUaGUge0BsaW5rIEFycmF5IH0gdG8gc29ydC5cbiAqIC0gMm5kOiBUaGUgb3B0aW9uYWwgbmFtZSBvZiBhIHByb3BlcnR5IHRvIHVzZSB0byBzb3J0IGVsZW1lbnRzIG9mIHRoZSBnaXZlbiB7QGxpbmsgQXJyYXkgfS5cbiAqXG4gKiBAcmVtYXJrc1xuICogTWFpbnRhaW5lcjogQ2FsbGFyaSwgU2FsdmF0b3JlIChTYWx2YXRvcmUuQ2FsbGFyaUBBbnNiYWNoLmRlKSAqL1xuLy8gYmlvbWUtaWdub3JlIGxpbnQvY29tcGxleGl0eS9ub1N0YXRpY09ubHlDbGFzczogPGV4cGxhbmF0aW9uPlxuZXhwb3J0IGNsYXNzIFNvcnRlZCB7XG4gIC8qKlxuICAgKiBJbXBsZW1lbnRzIHRoZSAqKlNvcnRlZCoqIC0gRWxlbWVudC1QbGFjZWhvbGRlci5cbiAgICpcbiAgICogQHBhcmFtIHBhcmFtcyBUaGUgcGFyYW1ldGVycyBmb3IgdGhhdCBFbGVtZW50LVBsYWNlaG9sZGVyIChwcm92aWRlZCBieSBDb2RCaSkuICovXG4gIHB1YmxpYyBzdGF0aWMgcmV0cmlldmUocGFyYW1zOiBBcnJheTx1bmtub3duPik6IEFycmF5PHVua25vd24+IHtcbiAgICBpZiAocGFyYW1zLmxlbmd0aCA+IDEpIHtcbiAgICAgIChwYXJhbXNbMF0gYXMgW10pLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgY29uc3QgbmFtZUEgPSAoYVtwYXJhbXNbMV0gYXMgc3RyaW5nXSBhcyBzdHJpbmcpLnRvVXBwZXJDYXNlKCk7XG4gICAgICAgIGNvbnN0IG5hbWVCID0gKGJbcGFyYW1zWzFdIGFzIHN0cmluZ10gYXMgc3RyaW5nKS50b1VwcGVyQ2FzZSgpO1xuXG4gICAgICAgIGlmIChuYW1lQSA8IG5hbWVCKSB7XG4gICAgICAgICAgcmV0dXJuIC0xO1xuICAgICAgICB9XG4gICAgICAgIGlmIChuYW1lQSA+IG5hbWVCKSB7XG4gICAgICAgICAgcmV0dXJuIDE7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHBhcmFtc1swXSBhcyBBcnJheTx1bmtub3duPjtcbiAgICB9XG5cbiAgICByZXR1cm4gKHBhcmFtcyBhcyBzdHJpbmdbXSkuc29ydCgpO1xuICB9XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbiAgLyoqXG4gICAqIFN0YXRlcyB3aGV0aGVyIHRoaXMge0BsaW5rIFNvcnRlZCB9IHdhcyBzdWNjZXNzZnVsbHkgcmVnaXN0ZXJlZFxuICAgKiB2aWEge0BsaW5rIENvZGJpR2xvYmFsLnJlZ2lzdGVyRVAgfSB3aXRoIHRoZSBDb2RCaSBhbmQgcGVyZm9ybXMgdGhlIHJlZ2lzdHJhdGlvbiB1cG9uIGNsYXNzIHVzYWdlLiovXG4gIHB1YmxpYyBzdGF0aWMgcmVnaXN0ZXJlZDogYm9vbGVhbiA9ICgoKSA9PiB7XG4gICAgcmV0dXJuIHdpbmRvdy5jb2RiaS5yZWdpc3RlckVQKFwiU29ydGVkXCIsIFNvcnRlZC5yZXRyaWV2ZSk7XG4gIH0pKCk7XG4gIC8vICNyZWdpb24gSW5pdGlhbGl6YXRpb25cbn1cbiJdLAogICJtYXBwaW5ncyI6ICI7OztBQVdPLElBQU0sU0FBTixNQUFNLFFBQU87QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBS2xCLE9BQWMsU0FBUyxRQUF3QztBQUM3RCxRQUFJLE9BQU8sU0FBUyxHQUFHO0FBQ3JCLE1BQUMsT0FBTyxDQUFDLEVBQVMsS0FBSyxDQUFDLEdBQUcsTUFBTTtBQUMvQixjQUFNLFFBQVMsRUFBRSxPQUFPLENBQUMsQ0FBVyxFQUFhLFlBQVk7QUFDN0QsY0FBTSxRQUFTLEVBQUUsT0FBTyxDQUFDLENBQVcsRUFBYSxZQUFZO0FBRTdELFlBQUksUUFBUSxPQUFPO0FBQ2pCLGlCQUFPO0FBQUEsUUFDVDtBQUNBLFlBQUksUUFBUSxPQUFPO0FBQ2pCLGlCQUFPO0FBQUEsUUFDVDtBQUNBLGVBQU87QUFBQSxNQUNULENBQUM7QUFFRCxhQUFPLE9BQU8sQ0FBQztBQUFBLElBQ2pCO0FBRUEsV0FBUSxPQUFvQixLQUFLO0FBQUEsRUFDbkM7QUFBQSxFQUtBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxTQUFjLGNBQXVCLE1BQU07QUFDekMsYUFBTyxPQUFPLE1BQU0sV0FBVyxVQUFVLFFBQU8sUUFBUTtBQUFBLElBQzFELEdBQUc7QUFBQTtBQUFBO0FBRUw7IiwKICAibmFtZXMiOiBbXQp9Cg==
