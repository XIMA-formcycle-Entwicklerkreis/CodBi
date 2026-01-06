import {
  DBC
} from "./chunk-O7G7SG2W.js";

// ../../node_modules/xdbc/src/DBC/COMPARISON.ts
var COMPARISON = class _COMPARISON extends DBC {
  /**
   * Creates this {@link COMPARISON } by setting the protected property {@link COMPARISON.equivalent }, {@link COMPARISON.equalityPermitted } and {@link COMPARISON.invert } used by {@link COMPARISON.check }.
   *
   * @param equivalent        See {@link COMPARISON.check }.
   * @param equalityPermitted See {@link COMPARISON.check }.
   * @param invert            See {@link COMPARISON.check }. */
  constructor(equivalent, equalityPermitted = false, invert = false) {
    super();
    this.equivalent = equivalent;
    this.equalityPermitted = equalityPermitted;
    this.invert = invert;
  }
  // #region Condition checking.
  /**
   * Does a comparison between the {@link object } **toCheck** and the **equivalent**.
   *
   * @param toCheck		The value that has to be equal to it's possible **equivalent** for this {@link DBC } to be fulfilled.
   * @param equivalent	The {@link object } the one **toCheck** has to be equal to in order for this {@link DBC } to be
   * 						fulfilled.
   *
   * @returns TRUE if the value **toCheck** and the **equivalent** are equal to each other, otherwise FALSE. */
  static checkAlgorithm(toCheck, equivalent, equalityPermitted, invert) {
    if (equalityPermitted && !invert && toCheck < equivalent) {
      return `Value has to to be greater than or equal to "${equivalent}"`;
    }
    if (equalityPermitted && invert && toCheck > equivalent) {
      return `Value has to be less than or equal to "${equivalent}"`;
    }
    if (!equalityPermitted && !invert && toCheck <= equivalent) {
      return `Value has to to be greater than "${equivalent}"`;
    }
    if (!equalityPermitted && invert && toCheck >= equivalent) {
      return `Value has to be less than "${equivalent}"`;
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged parameter.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.decPrecondition }.
   * @param dbc			    See {@link DBC.decPrecondition }.
   *
   * @returns See {@link DBC.decPrecondition }. */
  static PRE(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        return _COMPARISON.checkAlgorithm(
          value,
          equivalent,
          equalityPermitted,
          invert
        );
      },
      dbc,
      path
    );
  }
  /**
   * A method-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged method's returnvalue.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.Postcondition }.
   * @param dbc			    See {@link DBC.decPostcondition }.
   *
   * @returns See {@link DBC.decPostcondition }. */
  static POST(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        return _COMPARISON.checkAlgorithm(
          value,
          equalityPermitted,
          equivalent,
          invert
        );
      },
      dbc,
      path
    );
  }
  /**
   * A field-decorator factory using the {@link COMPARISON.checkAlgorithm } to determine whether this {@link DBC } is fulfilled
   * by the tagged field.
   *
   * @param equivalent	    See {@link COMPARISON.checkAlgorithm }.
   * @param equalityPermitted See {@link COMPARISON.checkAlgorithm }.
   * @param path			    See {@link DBC.decInvariant }.
   * @param dbc			    See {@link DBC.decInvariant }.
   *
   * @returns See {@link DBC.decInvariant }. */
  static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant(
      [new _COMPARISON(equivalent, equalityPermitted, invert)],
      path,
      dbc
    );
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  // #region Dynamic usage.
  /**
   * Invokes the {@link COMPARISON.checkAlgorithm } passing the value **toCheck**, {@link COMPARISON.equivalent } and {@link COMPARISON.invert }.
   *
   * @param toCheck See {@link COMPARISON.checkAlgorithm }.
   *
   * @returns See {@link COMPARISON.checkAlgorithm}. */
  check(toCheck) {
    return _COMPARISON.checkAlgorithm(
      toCheck,
      this.equivalent,
      this.equalityPermitted,
      this.invert
    );
  }
  // #endregion Dynamic usage.
};

// ../../node_modules/xdbc/src/DBC/COMPARISON/GREATER.ts
var GREATER = class extends COMPARISON {
  /** See {@link COMPARISON.constructor }. */
  constructor(equivalent) {
    super(equivalent, false, false);
    this.equivalent = equivalent;
  }
  /** See {@link COMPARISON.PRE }. */
  static PRE(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return COMPARISON.PRE(equivalent, false, false, path, dbc);
  }
  /** See {@link COMPARISON.POST }. */
  static POST(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return COMPARISON.POST(equivalent, false, false, path, dbc);
  }
  /** See {@link COMPARISON.INVARIANT }. */
  static INVARIANT(equivalent, equalityPermitted = false, invert = false, path = void 0, dbc = "WaXCode.DBC") {
    return COMPARISON.INVARIANT(equivalent, false, false, path, dbc);
  }
};

export {
  GREATER
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi50cyIsICIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9zcmMvbWFpbi93ZWIvbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9DT01QQVJJU09OL0dSRUFURVIudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcbi8qKlxuICogQSB7QGxpbmsgREJDIH0gZGVmaW5pbmcgYSBjb21wYXJpc29uIGJldHdlZW4gdHdvIHtAbGluayBvYmplY3QgfXMuXG4gKlxuICogQHJlbWFya3NcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cbmV4cG9ydCBjbGFzcyBDT01QQVJJU09OIGV4dGVuZHMgREJDIHtcblx0Ly8gI3JlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG5cdC8qKlxuXHQgKiBEb2VzIGEgY29tcGFyaXNvbiBiZXR3ZWVuIHRoZSB7QGxpbmsgb2JqZWN0IH0gKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKi5cblx0ICpcblx0ICogQHBhcmFtIHRvQ2hlY2tcdFx0VGhlIHZhbHVlIHRoYXQgaGFzIHRvIGJlIGVxdWFsIHRvIGl0J3MgcG9zc2libGUgKiplcXVpdmFsZW50KiogZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlIGZ1bGZpbGxlZC5cblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdFRoZSB7QGxpbmsgb2JqZWN0IH0gdGhlIG9uZSAqKnRvQ2hlY2sqKiBoYXMgdG8gYmUgZXF1YWwgdG8gaW4gb3JkZXIgZm9yIHRoaXMge0BsaW5rIERCQyB9IHRvIGJlXG5cdCAqIFx0XHRcdFx0XHRcdGZ1bGZpbGxlZC5cblx0ICpcblx0ICogQHJldHVybnMgVFJVRSBpZiB0aGUgdmFsdWUgKip0b0NoZWNrKiogYW5kIHRoZSAqKmVxdWl2YWxlbnQqKiBhcmUgZXF1YWwgdG8gZWFjaCBvdGhlciwgb3RoZXJ3aXNlIEZBTFNFLiAqL1xuXHRzdGF0aWMgY2hlY2tBbGdvcml0aG0odG9DaGVjaywgZXF1aXZhbGVudCwgZXF1YWxpdHlQZXJtaXR0ZWQsIGludmVydCkge1xuXHRcdGlmIChlcXVhbGl0eVBlcm1pdHRlZCAmJiAhaW52ZXJ0ICYmIHRvQ2hlY2sgPCBlcXVpdmFsZW50KSB7XG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byB0byBiZSBncmVhdGVyIHRoYW4gb3IgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuXHRcdH1cblxuXHRcdGlmIChlcXVhbGl0eVBlcm1pdHRlZCAmJiBpbnZlcnQgJiYgdG9DaGVjayA+IGVxdWl2YWxlbnQpIHtcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGJlIGxlc3MgdGhhbiBvciBlcXVhbCB0byBcIiR7ZXF1aXZhbGVudH1cImA7XG5cdFx0fVxuXG5cdFx0aWYgKCFlcXVhbGl0eVBlcm1pdHRlZCAmJiAhaW52ZXJ0ICYmIHRvQ2hlY2sgPD0gZXF1aXZhbGVudCkge1xuXHRcdFx0cmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZ3JlYXRlciB0aGFuIFwiJHtlcXVpdmFsZW50fVwiYDtcblx0XHR9XG5cblx0XHRpZiAoIWVxdWFsaXR5UGVybWl0dGVkICYmIGludmVydCAmJiB0b0NoZWNrID49IGVxdWl2YWxlbnQpIHtcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIGJlIGxlc3MgdGhhbiBcIiR7ZXF1aXZhbGVudH1cImA7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIHRydWU7XG5cdH1cblx0LyoqXG5cdCAqIEEgcGFyYW1ldGVyLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuXHQgKiBieSB0aGUgdGFnZ2VkIHBhcmFtZXRlci5cblx0ICpcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdCAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cblx0ICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQcmVjb25kaXRpb24gfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uICovXG5cdHN0YXRpYyBQUkUoXG5cdFx0ZXF1aXZhbGVudCxcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxuXHRcdGludmVydCA9IGZhbHNlLFxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXG5cdCkge1xuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxuXHRcdFx0KHZhbHVlLCB0YXJnZXQsIG1ldGhvZE5hbWUsIHBhcmFtZXRlckluZGV4KSA9PiB7XG5cdFx0XHRcdHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKFxuXHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdGVxdWl2YWxlbnQsXG5cdFx0XHRcdFx0ZXF1YWxpdHlQZXJtaXR0ZWQsXG5cdFx0XHRcdFx0aW52ZXJ0LFxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdGRiYyxcblx0XHRcdHBhdGgsXG5cdFx0KTtcblx0fVxuXHQvKipcblx0ICogQSBtZXRob2QtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG5cdCAqIGJ5IHRoZSB0YWdnZWQgbWV0aG9kJ3MgcmV0dXJudmFsdWUuXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuUG9zdGNvbmRpdGlvbiB9LlxuXHQgKiBAcGFyYW0gZGJjXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjUG9zdGNvbmRpdGlvbiB9LiAqL1xuXHRzdGF0aWMgUE9TVChcblx0XHRlcXVpdmFsZW50LFxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcblx0KSB7XG5cdFx0cmV0dXJuIERCQy5kZWNQb3N0Y29uZGl0aW9uKFxuXHRcdFx0KHZhbHVlLCB0YXJnZXQsIHByb3BlcnR5S2V5KSA9PiB7XG5cdFx0XHRcdHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKFxuXHRcdFx0XHRcdHZhbHVlLFxuXHRcdFx0XHRcdGVxdWFsaXR5UGVybWl0dGVkLFxuXHRcdFx0XHRcdGVxdWl2YWxlbnQsXG5cdFx0XHRcdFx0aW52ZXJ0LFxuXHRcdFx0XHQpO1xuXHRcdFx0fSxcblx0XHRcdGRiYyxcblx0XHRcdHBhdGgsXG5cdFx0KTtcblx0fVxuXHQvKipcblx0ICogQSBmaWVsZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcblx0ICogYnkgdGhlIHRhZ2dlZCBmaWVsZC5cblx0ICpcblx0ICogQHBhcmFtIGVxdWl2YWxlbnRcdCAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cblx0ICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNJbnZhcmlhbnQgfS5cblx0ICpcblx0ICogQHJldHVybnMgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXG5cdHN0YXRpYyBJTlZBUklBTlQoXG5cdFx0ZXF1aXZhbGVudCxcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxuXHRcdGludmVydCA9IGZhbHNlLFxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXG5cdCkge1xuXHRcdHJldHVybiBEQkMuZGVjSW52YXJpYW50KFxuXHRcdFx0W25ldyBDT01QQVJJU09OKGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkLCBpbnZlcnQpXSxcblx0XHRcdHBhdGgsXG5cdFx0XHRkYmMsXG5cdFx0KTtcblx0fVxuXHQvLyAjZW5kcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cblx0Ly8gI3JlZ2lvbiBSZWZlcmVuY2VkIENvbmRpdGlvbiBjaGVja2luZy5cblx0Ly8gI3JlZ2lvbiBEeW5hbWljIHVzYWdlLlxuXHQvKipcblx0ICogSW52b2tlcyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSBwYXNzaW5nIHRoZSB2YWx1ZSAqKnRvQ2hlY2sqKiwge0BsaW5rIENPTVBBUklTT04uZXF1aXZhbGVudCB9IGFuZCB7QGxpbmsgQ09NUEFSSVNPTi5pbnZlcnQgfS5cblx0ICpcblx0ICogQHBhcmFtIHRvQ2hlY2sgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobX0uICovXG5cdHB1YmxpYyBjaGVjayh0b0NoZWNrKSB7XG5cdFx0cmV0dXJuIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0oXG5cdFx0XHR0b0NoZWNrLFxuXHRcdFx0dGhpcy5lcXVpdmFsZW50LFxuXHRcdFx0dGhpcy5lcXVhbGl0eVBlcm1pdHRlZCxcblx0XHRcdHRoaXMuaW52ZXJ0LFxuXHRcdCk7XG5cdH1cblx0LyoqXG5cdCAqIENyZWF0ZXMgdGhpcyB7QGxpbmsgQ09NUEFSSVNPTiB9IGJ5IHNldHRpbmcgdGhlIHByb3RlY3RlZCBwcm9wZXJ0eSB7QGxpbmsgQ09NUEFSSVNPTi5lcXVpdmFsZW50IH0sIHtAbGluayBDT01QQVJJU09OLmVxdWFsaXR5UGVybWl0dGVkIH0gYW5kIHtAbGluayBDT01QQVJJU09OLmludmVydCB9IHVzZWQgYnkge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cblx0ICpcblx0ICogQHBhcmFtIGVxdWl2YWxlbnQgICAgICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LlxuXHQgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG5cdCAqIEBwYXJhbSBpbnZlcnQgICAgICAgICAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS4gKi9cblx0Y29uc3RydWN0b3IoXG5cdFx0cHVibGljIGVxdWl2YWxlbnQsXG5cdFx0cHVibGljIGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXG5cdFx0cHVibGljIGludmVydCA9IGZhbHNlLFxuXHQpIHtcblx0XHRzdXBlcigpO1xuXHR9XG5cdC8vICNlbmRyZWdpb24gRHluYW1pYyB1c2FnZS5cbn1cbiIsICJpbXBvcnQgeyBDT01QQVJJU09OIH0gZnJvbSBcIi4uL0NPTVBBUklTT05cIjtcclxuLyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTiB9LiAqL1xyXG5leHBvcnQgY2xhc3MgR1JFQVRFUiBleHRlbmRzIENPTVBBUklTT04ge1xyXG5cdC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUFJFIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBvdmVycmlkZSBQUkUoXHJcblx0XHRlcXVpdmFsZW50LFxyXG5cdFx0ZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSxcclxuXHRcdGludmVydCA9IGZhbHNlLFxyXG5cdFx0cGF0aDogc3RyaW5nID0gdW5kZWZpbmVkLFxyXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxyXG5cdCkge1xyXG5cdFx0cmV0dXJuIENPTVBBUklTT04uUFJFKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0LyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5QT1NUIH0uICovXHJcblx0cHVibGljIHN0YXRpYyBvdmVycmlkZSBQT1NUKFxyXG5cdFx0ZXF1aXZhbGVudCxcclxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBDT01QQVJJU09OLlBPU1QoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLklOVkFSSUFOVCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgSU5WQVJJQU5UKFxyXG5cdFx0ZXF1aXZhbGVudCxcclxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBDT01QQVJJU09OLklOVkFSSUFOVChlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uY29uc3RydWN0b3IgfS4gKi9cclxuXHRjb25zdHJ1Y3RvcihwdWJsaWMgZXF1aXZhbGVudCkge1xyXG5cdFx0c3VwZXIoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlKTtcclxuXHR9XHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFNTyxJQUFNLGFBQU4sTUFBTSxvQkFBbUIsSUFBSTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBdUluQyxZQUNRLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDZjtBQUNELFVBQU07QUFKQztBQUNBO0FBQ0E7QUFBQSxFQUdSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFuSUEsT0FBTyxlQUFlLFNBQVMsWUFBWSxtQkFBbUIsUUFBUTtBQUNyRSxRQUFJLHFCQUFxQixDQUFDLFVBQVUsVUFBVSxZQUFZO0FBQ3pELGFBQU8sZ0RBQWdELFVBQVU7QUFBQSxJQUNsRTtBQUVBLFFBQUkscUJBQXFCLFVBQVUsVUFBVSxZQUFZO0FBQ3hELGFBQU8sMENBQTBDLFVBQVU7QUFBQSxJQUM1RDtBQUVBLFFBQUksQ0FBQyxxQkFBcUIsQ0FBQyxVQUFVLFdBQVcsWUFBWTtBQUMzRCxhQUFPLG9DQUFvQyxVQUFVO0FBQUEsSUFDdEQ7QUFFQSxRQUFJLENBQUMscUJBQXFCLFVBQVUsV0FBVyxZQUFZO0FBQzFELGFBQU8sOEJBQThCLFVBQVU7QUFBQSxJQUNoRDtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQU8sSUFDTixZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ1QsT0FBZSxRQUNmLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFPLFFBQVEsWUFBWSxtQkFBbUI7QUFDOUMsZUFBTyxZQUFXO0FBQUEsVUFDakI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBTyxLQUNOLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDVCxPQUFlLFFBQ2YsTUFBTSxlQUNMO0FBQ0QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQU8sUUFBUSxnQkFBZ0I7QUFDL0IsZUFBTyxZQUFXO0FBQUEsVUFDakI7QUFBQSxVQUNBO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxRQUNEO0FBQUEsTUFDRDtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBV0EsT0FBTyxVQUNOLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDVCxPQUFlLFFBQ2YsTUFBTSxlQUNMO0FBQ0QsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLElBQUksWUFBVyxZQUFZLG1CQUFtQixNQUFNLENBQUM7QUFBQSxNQUN0RDtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBVU8sTUFBTSxTQUFTO0FBQ3JCLFdBQU8sWUFBVztBQUFBLE1BQ2pCO0FBQUEsTUFDQSxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsTUFDTCxLQUFLO0FBQUEsSUFDTjtBQUFBLEVBQ0Q7QUFBQTtBQWVEOzs7QUNuSk8sSUFBTSxVQUFOLGNBQXNCLFdBQVc7QUFBQTtBQUFBLEVBZ0N2QyxZQUFtQixZQUFZO0FBQzlCLFVBQU0sWUFBWSxPQUFPLEtBQUs7QUFEWjtBQUFBLEVBRW5CO0FBQUE7QUFBQSxFQWhDQSxPQUF1QixJQUN0QixZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ1QsT0FBZSxRQUNmLE1BQU0sZUFDTDtBQUNELFdBQU8sV0FBVyxJQUFJLFlBQVksT0FBTyxPQUFPLE1BQU0sR0FBRztBQUFBLEVBQzFEO0FBQUE7QUFBQSxFQUVBLE9BQXVCLEtBQ3RCLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDVCxPQUFlLFFBQ2YsTUFBTSxlQUNMO0FBQ0QsV0FBTyxXQUFXLEtBQUssWUFBWSxPQUFPLE9BQU8sTUFBTSxHQUFHO0FBQUEsRUFDM0Q7QUFBQTtBQUFBLEVBRUEsT0FBYyxVQUNiLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDVCxPQUFlLFFBQ2YsTUFBTSxlQUNMO0FBQ0QsV0FBTyxXQUFXLFVBQVUsWUFBWSxPQUFPLE9BQU8sTUFBTSxHQUFHO0FBQUEsRUFDaEU7QUFLRDsiLAogICJuYW1lcyI6IFtdCn0K
