import { DBC } from "./chunk-WDRNTVZG.js";

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
        return _COMPARISON.checkAlgorithm(value, equivalent, equalityPermitted, invert);
      },
      dbc,
      path,
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
        return _COMPARISON.checkAlgorithm(value, equalityPermitted, equivalent, invert);
      },
      dbc,
      path,
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
    return DBC.decInvariant([new _COMPARISON(equivalent, equalityPermitted, invert)], path, dbc);
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
    return _COMPARISON.checkAlgorithm(toCheck, this.equivalent, this.equalityPermitted, this.invert);
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

export { GREATER };
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vbm9kZV9tb2R1bGVzL3hkYmMvc3JjL0RCQy9DT01QQVJJU09OLnRzIiwgIi4uLy4uLy4uLy4uL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvQ09NUEFSSVNPTi9HUkVBVEVSLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJpbXBvcnQgeyBEQkMgfSBmcm9tIFwiLi4vREJDXCI7XG4vKipcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIGEgY29tcGFyaXNvbiBiZXR3ZWVuIHR3byB7QGxpbmsgb2JqZWN0IH1zLlxuICpcbiAqIEByZW1hcmtzXG4gKiBNYWludGFpbmVyOiBDYWxsYXJpLCBTYWx2YXRvcmUgKFhEQkNAV2FYQ29kZS5uZXQpICovXG5leHBvcnQgY2xhc3MgQ09NUEFSSVNPTiBleHRlbmRzIERCQyB7XG5cdC8vICNyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxuXHQvKipcblx0ICogRG9lcyBhIGNvbXBhcmlzb24gYmV0d2VlbiB0aGUge0BsaW5rIG9iamVjdCB9ICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiouXG5cdCAqXG5cdCAqIEBwYXJhbSB0b0NoZWNrXHRcdFRoZSB2YWx1ZSB0aGF0IGhhcyB0byBiZSBlcXVhbCB0byBpdCdzIHBvc3NpYmxlICoqZXF1aXZhbGVudCoqIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZSBmdWxmaWxsZWQuXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHRUaGUge0BsaW5rIG9iamVjdCB9IHRoZSBvbmUgKip0b0NoZWNrKiogaGFzIHRvIGJlIGVxdWFsIHRvIGluIG9yZGVyIGZvciB0aGlzIHtAbGluayBEQkMgfSB0byBiZVxuXHQgKiBcdFx0XHRcdFx0XHRmdWxmaWxsZWQuXG5cdCAqXG5cdCAqIEByZXR1cm5zIFRSVUUgaWYgdGhlIHZhbHVlICoqdG9DaGVjayoqIGFuZCB0aGUgKiplcXVpdmFsZW50KiogYXJlIGVxdWFsIHRvIGVhY2ggb3RoZXIsIG90aGVyd2lzZSBGQUxTRS4gKi9cblx0c3RhdGljIGNoZWNrQWxnb3JpdGhtKHRvQ2hlY2ssIGVxdWl2YWxlbnQsIGVxdWFsaXR5UGVybWl0dGVkLCBpbnZlcnQpIHtcblx0XHRpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDwgZXF1aXZhbGVudCkge1xuXHRcdFx0cmV0dXJuIGBWYWx1ZSBoYXMgdG8gdG8gYmUgZ3JlYXRlciB0aGFuIG9yIGVxdWFsIHRvIFwiJHtlcXVpdmFsZW50fVwiYDtcblx0XHR9XG5cblx0XHRpZiAoZXF1YWxpdHlQZXJtaXR0ZWQgJiYgaW52ZXJ0ICYmIHRvQ2hlY2sgPiBlcXVpdmFsZW50KSB7XG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gb3IgZXF1YWwgdG8gXCIke2VxdWl2YWxlbnR9XCJgO1xuXHRcdH1cblxuXHRcdGlmICghZXF1YWxpdHlQZXJtaXR0ZWQgJiYgIWludmVydCAmJiB0b0NoZWNrIDw9IGVxdWl2YWxlbnQpIHtcblx0XHRcdHJldHVybiBgVmFsdWUgaGFzIHRvIHRvIGJlIGdyZWF0ZXIgdGhhbiBcIiR7ZXF1aXZhbGVudH1cImA7XG5cdFx0fVxuXG5cdFx0aWYgKCFlcXVhbGl0eVBlcm1pdHRlZCAmJiBpbnZlcnQgJiYgdG9DaGVjayA+PSBlcXVpdmFsZW50KSB7XG5cdFx0XHRyZXR1cm4gYFZhbHVlIGhhcyB0byBiZSBsZXNzIHRoYW4gXCIke2VxdWl2YWxlbnR9XCJgO1xuXHRcdH1cblxuXHRcdHJldHVybiB0cnVlO1xuXHR9XG5cdC8qKlxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfSB0byBkZXRlcm1pbmUgd2hldGhlciB0aGlzIHtAbGluayBEQkMgfSBpcyBmdWxmaWxsZWRcblx0ICogYnkgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIuXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXG5cdCAqXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LiAqL1xuXHRzdGF0aWMgUFJFKFxuXHRcdGVxdWl2YWxlbnQsXG5cdFx0ZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSxcblx0XHRpbnZlcnQgPSBmYWxzZSxcblx0XHRwYXRoOiBzdHJpbmcgPSB1bmRlZmluZWQsXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxuXHQpIHtcblx0XHRyZXR1cm4gREJDLmRlY1ByZWNvbmRpdGlvbihcblx0XHRcdCh2YWx1ZSwgdGFyZ2V0LCBtZXRob2ROYW1lLCBwYXJhbWV0ZXJJbmRleCkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobShcblx0XHRcdFx0XHR2YWx1ZSxcblx0XHRcdFx0XHRlcXVpdmFsZW50LFxuXHRcdFx0XHRcdGVxdWFsaXR5UGVybWl0dGVkLFxuXHRcdFx0XHRcdGludmVydCxcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRkYmMsXG5cdFx0XHRwYXRoLFxuXHRcdCk7XG5cdH1cblx0LyoqXG5cdCAqIEEgbWV0aG9kLWRlY29yYXRvciBmYWN0b3J5IHVzaW5nIHRoZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9IHRvIGRldGVybWluZSB3aGV0aGVyIHRoaXMge0BsaW5rIERCQyB9IGlzIGZ1bGZpbGxlZFxuXHQgKiBieSB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybnZhbHVlLlxuXHQgKlxuXHQgKiBAcGFyYW0gZXF1aXZhbGVudFx0ICAgIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuXHQgKiBAcGFyYW0gZXF1YWxpdHlQZXJtaXR0ZWQgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBwYXRoXHRcdFx0ICAgIFNlZSB7QGxpbmsgREJDLlBvc3Rjb25kaXRpb24gfS5cblx0ICogQHBhcmFtIGRiY1x0XHRcdCAgICBTZWUge0BsaW5rIERCQy5kZWNQb3N0Y29uZGl0aW9uIH0uXG5cdCAqXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY1Bvc3Rjb25kaXRpb24gfS4gKi9cblx0c3RhdGljIFBPU1QoXG5cdFx0ZXF1aXZhbGVudCxcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxuXHRcdGludmVydCA9IGZhbHNlLFxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXG5cdCkge1xuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcblx0XHRcdCh2YWx1ZSwgdGFyZ2V0LCBwcm9wZXJ0eUtleSkgPT4ge1xuXHRcdFx0XHRyZXR1cm4gQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobShcblx0XHRcdFx0XHR2YWx1ZSxcblx0XHRcdFx0XHRlcXVhbGl0eVBlcm1pdHRlZCxcblx0XHRcdFx0XHRlcXVpdmFsZW50LFxuXHRcdFx0XHRcdGludmVydCxcblx0XHRcdFx0KTtcblx0XHRcdH0sXG5cdFx0XHRkYmMsXG5cdFx0XHRwYXRoLFxuXHRcdCk7XG5cdH1cblx0LyoqXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gdG8gZGV0ZXJtaW5lIHdoZXRoZXIgdGhpcyB7QGxpbmsgREJDIH0gaXMgZnVsZmlsbGVkXG5cdCAqIGJ5IHRoZSB0YWdnZWQgZmllbGQuXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50XHQgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0uXG5cdCAqIEBwYXJhbSBlcXVhbGl0eVBlcm1pdHRlZCBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG0gfS5cblx0ICogQHBhcmFtIHBhdGhcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHQgICAgU2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXG5cdCAqXG5cdCAqIEByZXR1cm5zIFNlZSB7QGxpbmsgREJDLmRlY0ludmFyaWFudCB9LiAqL1xuXHRzdGF0aWMgSU5WQVJJQU5UKFxuXHRcdGVxdWl2YWxlbnQsXG5cdFx0ZXF1YWxpdHlQZXJtaXR0ZWQgPSBmYWxzZSxcblx0XHRpbnZlcnQgPSBmYWxzZSxcblx0XHRwYXRoOiBzdHJpbmcgPSB1bmRlZmluZWQsXG5cdFx0ZGJjID0gXCJXYVhDb2RlLkRCQ1wiLFxuXHQpIHtcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChcblx0XHRcdFtuZXcgQ09NUEFSSVNPTihlcXVpdmFsZW50LCBlcXVhbGl0eVBlcm1pdHRlZCwgaW52ZXJ0KV0sXG5cdFx0XHRwYXRoLFxuXHRcdFx0ZGJjLFxuXHRcdCk7XG5cdH1cblx0Ly8gI2VuZHJlZ2lvbiBDb25kaXRpb24gY2hlY2tpbmcuXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXG5cdC8vICNyZWdpb24gRHluYW1pYyB1c2FnZS5cblx0LyoqXG5cdCAqIEludm9rZXMgdGhlIHtAbGluayBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtIH0gcGFzc2luZyB0aGUgdmFsdWUgKip0b0NoZWNrKiosIHtAbGluayBDT01QQVJJU09OLmVxdWl2YWxlbnQgfSBhbmQge0BsaW5rIENPTVBBUklTT04uaW52ZXJ0IH0uXG5cdCAqXG5cdCAqIEBwYXJhbSB0b0NoZWNrIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVja0FsZ29yaXRobSB9LlxuXHQgKlxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2tBbGdvcml0aG19LiAqL1xuXHRwdWJsaWMgY2hlY2sodG9DaGVjaykge1xuXHRcdHJldHVybiBDT01QQVJJU09OLmNoZWNrQWxnb3JpdGhtKFxuXHRcdFx0dG9DaGVjayxcblx0XHRcdHRoaXMuZXF1aXZhbGVudCxcblx0XHRcdHRoaXMuZXF1YWxpdHlQZXJtaXR0ZWQsXG5cdFx0XHR0aGlzLmludmVydCxcblx0XHQpO1xuXHR9XG5cdC8qKlxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIENPTVBBUklTT04gfSBieSBzZXR0aW5nIHRoZSBwcm90ZWN0ZWQgcHJvcGVydHkge0BsaW5rIENPTVBBUklTT04uZXF1aXZhbGVudCB9LCB7QGxpbmsgQ09NUEFSSVNPTi5lcXVhbGl0eVBlcm1pdHRlZCB9IGFuZCB7QGxpbmsgQ09NUEFSSVNPTi5pbnZlcnQgfSB1c2VkIGJ5IHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uXG5cdCAqXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50ICAgICAgICBTZWUge0BsaW5rIENPTVBBUklTT04uY2hlY2sgfS5cblx0ICogQHBhcmFtIGVxdWFsaXR5UGVybWl0dGVkIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5jaGVjayB9LlxuXHQgKiBAcGFyYW0gaW52ZXJ0ICAgICAgICAgICAgU2VlIHtAbGluayBDT01QQVJJU09OLmNoZWNrIH0uICovXG5cdGNvbnN0cnVjdG9yKFxuXHRcdHB1YmxpYyBlcXVpdmFsZW50LFxuXHRcdHB1YmxpYyBlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxuXHRcdHB1YmxpYyBpbnZlcnQgPSBmYWxzZSxcblx0KSB7XG5cdFx0c3VwZXIoKTtcblx0fVxuXHQvLyAjZW5kcmVnaW9uIER5bmFtaWMgdXNhZ2UuXG59XG4iLCAiaW1wb3J0IHsgQ09NUEFSSVNPTiB9IGZyb20gXCIuLi9DT01QQVJJU09OXCI7XHJcbi8qKiBTZWUge0BsaW5rIENPTVBBUklTT04gfS4gKi9cclxuZXhwb3J0IGNsYXNzIEdSRUFURVIgZXh0ZW5kcyBDT01QQVJJU09OIHtcclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLlBSRSB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgUFJFKFxyXG5cdFx0ZXF1aXZhbGVudCxcclxuXHRcdGVxdWFsaXR5UGVybWl0dGVkID0gZmFsc2UsXHJcblx0XHRpbnZlcnQgPSBmYWxzZSxcclxuXHRcdHBhdGg6IHN0cmluZyA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpIHtcclxuXHRcdHJldHVybiBDT01QQVJJU09OLlBSRShlcXVpdmFsZW50LCBmYWxzZSwgZmFsc2UsIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8qKiBTZWUge0BsaW5rIENPTVBBUklTT04uUE9TVCB9LiAqL1xyXG5cdHB1YmxpYyBzdGF0aWMgb3ZlcnJpZGUgUE9TVChcclxuXHRcdGVxdWl2YWxlbnQsXHJcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gQ09NUEFSSVNPTi5QT1NUKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSwgcGF0aCwgZGJjKTtcclxuXHR9XHJcblx0LyoqIFNlZSB7QGxpbmsgQ09NUEFSSVNPTi5JTlZBUklBTlQgfS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIG92ZXJyaWRlIElOVkFSSUFOVChcclxuXHRcdGVxdWl2YWxlbnQsXHJcblx0XHRlcXVhbGl0eVBlcm1pdHRlZCA9IGZhbHNlLFxyXG5cdFx0aW52ZXJ0ID0gZmFsc2UsXHJcblx0XHRwYXRoOiBzdHJpbmcgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gQ09NUEFSSVNPTi5JTlZBUklBTlQoZXF1aXZhbGVudCwgZmFsc2UsIGZhbHNlLCBwYXRoLCBkYmMpO1xyXG5cdH1cclxuXHQvKiogU2VlIHtAbGluayBDT01QQVJJU09OLmNvbnN0cnVjdG9yIH0uICovXHJcblx0Y29uc3RydWN0b3IocHVibGljIG92ZXJyaWRlIGVxdWl2YWxlbnQpIHtcclxuXHRcdHN1cGVyKGVxdWl2YWxlbnQsIGZhbHNlLCBmYWxzZSk7XHJcblx0fVxyXG59XHJcbiJdLAogICJtYXBwaW5ncyI6ICI7Ozs7O0FBTU8sSUFBTSxhQUFOLE1BQU0sb0JBQW1CLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQXVJbkMsWUFDUSxZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ2Y7QUFDRCxVQUFNO0FBSkM7QUFDQTtBQUNBO0FBQUEsRUFHUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBbklBLE9BQU8sZUFBZSxTQUFTLFlBQVksbUJBQW1CLFFBQVE7QUFDckUsUUFBSSxxQkFBcUIsQ0FBQyxVQUFVLFVBQVUsWUFBWTtBQUN6RCxhQUFPLGdEQUFnRCxVQUFVO0FBQUEsSUFDbEU7QUFFQSxRQUFJLHFCQUFxQixVQUFVLFVBQVUsWUFBWTtBQUN4RCxhQUFPLDBDQUEwQyxVQUFVO0FBQUEsSUFDNUQ7QUFFQSxRQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxXQUFXLFlBQVk7QUFDM0QsYUFBTyxvQ0FBb0MsVUFBVTtBQUFBLElBQ3REO0FBRUEsUUFBSSxDQUFDLHFCQUFxQixVQUFVLFdBQVcsWUFBWTtBQUMxRCxhQUFPLDhCQUE4QixVQUFVO0FBQUEsSUFDaEQ7QUFFQSxXQUFPO0FBQUEsRUFDUjtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFXQSxPQUFPLElBQ04sWUFDQSxvQkFBb0IsT0FDcEIsU0FBUyxPQUNULE9BQWUsUUFDZixNQUFNLGVBQ0w7QUFDRCxXQUFPLElBQUk7QUFBQSxNQUNWLENBQUMsT0FBTyxRQUFRLFlBQVksbUJBQW1CO0FBQzlDLGVBQU8sWUFBVztBQUFBLFVBQ2pCO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRDtBQUFBLE1BQ0Q7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQU8sS0FDTixZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ1QsT0FBZSxRQUNmLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxPQUFPLFFBQVEsZ0JBQWdCO0FBQy9CLGVBQU8sWUFBVztBQUFBLFVBQ2pCO0FBQUEsVUFDQTtBQUFBLFVBQ0E7QUFBQSxVQUNBO0FBQUEsUUFDRDtBQUFBLE1BQ0Q7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLElBQ0Q7QUFBQSxFQUNEO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVdBLE9BQU8sVUFDTixZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ1QsT0FBZSxRQUNmLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FBQyxJQUFJLFlBQVcsWUFBWSxtQkFBbUIsTUFBTSxDQUFDO0FBQUEsTUFDdEQ7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxFQVVPLE1BQU0sU0FBUztBQUNyQixXQUFPLFlBQVc7QUFBQSxNQUNqQjtBQUFBLE1BQ0EsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLE1BQ0wsS0FBSztBQUFBLElBQ047QUFBQSxFQUNEO0FBQUE7QUFlRDs7O0FDbkpPLElBQU0sVUFBTixjQUFzQixXQUFXO0FBQUE7QUFBQSxFQWdDdkMsWUFBNEIsWUFBWTtBQUN2QyxVQUFNLFlBQVksT0FBTyxLQUFLO0FBREg7QUFBQSxFQUU1QjtBQUFBO0FBQUEsRUFoQ0EsT0FBdUIsSUFDdEIsWUFDQSxvQkFBb0IsT0FDcEIsU0FBUyxPQUNULE9BQWUsUUFDZixNQUFNLGVBQ0w7QUFDRCxXQUFPLFdBQVcsSUFBSSxZQUFZLE9BQU8sT0FBTyxNQUFNLEdBQUc7QUFBQSxFQUMxRDtBQUFBO0FBQUEsRUFFQSxPQUF1QixLQUN0QixZQUNBLG9CQUFvQixPQUNwQixTQUFTLE9BQ1QsT0FBZSxRQUNmLE1BQU0sZUFDTDtBQUNELFdBQU8sV0FBVyxLQUFLLFlBQVksT0FBTyxPQUFPLE1BQU0sR0FBRztBQUFBLEVBQzNEO0FBQUE7QUFBQSxFQUVBLE9BQXVCLFVBQ3RCLFlBQ0Esb0JBQW9CLE9BQ3BCLFNBQVMsT0FDVCxPQUFlLFFBQ2YsTUFBTSxlQUNMO0FBQ0QsV0FBTyxXQUFXLFVBQVUsWUFBWSxPQUFPLE9BQU8sTUFBTSxHQUFHO0FBQUEsRUFDaEU7QUFLRDsiLAogICJuYW1lcyI6IFtdCn0K
