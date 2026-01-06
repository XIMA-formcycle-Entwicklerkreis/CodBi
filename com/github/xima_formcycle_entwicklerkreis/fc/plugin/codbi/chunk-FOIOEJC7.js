import {
  DBC
} from "./chunk-O7G7SG2W.js";

// ../../node_modules/xdbc/src/DBC/AE.ts
var AE = class _AE extends DBC {
  /**
   * Creates this {@link AE } by setting the protected property {@link AE.conditions }, {@link AE.index } and {@link AE.idxEnd } used by {@link AE.check }.
   *
   * @param equivalent See {@link EQ.check }. */
  constructor(conditions, index = void 0, idxEnd = void 0) {
    super();
    this.conditions = conditions;
    this.index = index;
    this.idxEnd = idxEnd;
  }
  // #region Condition checking.
  /**
   * Checks each element of the **value**-{@link Array < any >} against the given **condition**, if it is one. If it is not
   * the **value** itself will be checked.
   *
   * @param condition	The { check: (toCheck: any) => boolean | string } to check the **value** against.
   * @param value		Either **value**-{@link Array < any >}, which's elements will be checked, or the value to be
   * 					checked itself.
   * @param index		If specified with **idxEnd** being undefined, this {@link Number } will be seen as the index of
   * 					the value-{@link Array }'s element to check. If value isn't an {@link Array } this parameter
   * 					will not have any effect.
   * 					With **idxEnd** not undefined this parameter indicates the beginning of the span of elements to
   * 					check within the value-{@link Array }.
   * @param idxEnd	Indicates the last element's index (including) of the span of value-{@link Array } elements to check.
   * 					Setting this parameter to -1 specifies that all value-{@link Array }'s elements beginning from the
   * 					specified **index** shall be checked.
   *
   * @returns As soon as the **condition** returns a {@link string }, instead of TRUE, the returned string. TRUE if the
   * 			**condition** never returns a {@link string}. */
  static checkAlgorithm(condition, value, index, idxEnd) {
    if (Array.isArray(value)) {
      if (index !== void 0 && idxEnd === void 0) {
        if (index > -1 && index < value.length) {
          const result = condition.check(value[index]);
          if (typeof result === "string") {
            return `Violating-Arrayelement at index "${index}" with value "${value[index]}". ${result}`;
          }
        }
        return true;
      }
      const ending = idxEnd !== void 0 ? idxEnd !== -1 ? idxEnd + 1 : value.length : value.length;
      for (let i = index ? index : 0; i < ending; i++) {
        const result = condition.check(value[i]);
        if (result !== true) {
          return `Violating-Arrayelement at index ${i}. ${result}`;
        }
      }
    } else {
      return condition.check(value);
    }
    return true;
  }
  /**
   * A parameter-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged parameter-value against with.
   * When specifying an **index** and the tagged parameter's **value** is an {@link Array }, the **realConditions** apply to the
   * element at the specified **index**.
   * If the {@link Array } is too short the currently processed { check: (toCheck: any) => boolean | string } of
   * **realConditions** will be verified to TRUE automatically, considering optional parameters.
   * If an **index** is specified but the tagged parameter's value isn't an array, the **index** is treated as being undefined.
   * If **index** is undefined and the tagged parameter's value is an {@link Array } each element of it will be checked
   * against the **realConditions**.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** returns one.
   * 			Otherwise TRUE. */
  static PRE(realConditions, index = void 0, idxEnd = void 0, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPrecondition(
      (value, target, methodName, parameterIndex) => {
        if (Array.isArray(realConditions)) {
          for (const currentCondition of realConditions) {
            const result = _AE.checkAlgorithm(
              currentCondition,
              value,
              index,
              idxEnd
            );
            if (typeof result !== "boolean") return result;
          }
        } else {
          return _AE.checkAlgorithm(
            realConditions,
            value,
            index,
            idxEnd
          );
        }
        return true;
      },
      dbc,
      path
    );
  }
  /**
   * A method-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged method's return-value against with.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decPrecondition }.
   * @param dbc				See {@link DBC.decPrecondition }.
   *
   * @returns	A {@link string } as soon as one { check: (toCheck: any) => boolean | string } of **realConditions** return one.
   * 			Otherwise TRUE. */
  static POST(realConditions, index = void 0, idxEnd = void 0, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decPostcondition(
      (value, target, propertyKey) => {
        if (Array.isArray(realConditions)) {
          for (const currentCondition of realConditions) {
            const result = _AE.checkAlgorithm(
              currentCondition,
              value,
              index,
              idxEnd
            );
            if (typeof result !== "boolean") return result;
          }
        } else {
          return _AE.checkAlgorithm(
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            realConditions,
            value,
            index,
            idxEnd
          );
        }
        return true;
      },
      dbc,
      path
    );
  }
  /**
   * A field-decorator factory using the {@link AE.checkAlgorithm } with either multiple or a single one
   * of the **realConditions** to check the tagged field.
   *
   * @param realConditions	Either one or more { check: (toCheck: any) => boolean | string } to check the tagged parameter-value
   * 							against with.
   * @param index				See the {@link AE.checkAlgorithm }.
   * @param idxEnd			See the {@link AE.checkAlgorithm }.
   * @param path				See {@link DBC.decInvariant }.
   * @param dbc				See {@link DBC.decInvariant }.
   *
   * @returns	See {@link DBC.decInvariant }. */
  static INVARIANT(realConditions, index = void 0, idxEnd = void 0, path = void 0, dbc = "WaXCode.DBC") {
    return DBC.decInvariant([new _AE(realConditions, index, idxEnd)], path, dbc);
  }
  // #endregion Condition checking.
  // #region Referenced Condition checking.
  //
  // For usage in dynamic scenarios (like global functions).
  //
  /**
   * Invokes the {@link AE.checkAlgorithm } with all {@link AE.conditions } and the {@link object } {@link toCheck },
   * {@link AE.index } & {@link AE.idxEnd }.
   *
   * @param toCheck See {@link AE.checkAlgorithm }.
   *
   * @returns See {@link EQ.checkAlgorithm}. */
  check(toCheck) {
    if (Array.isArray(this.conditions)) {
      for (const currentCondition of this.conditions) {
        const result = _AE.checkAlgorithm(
          currentCondition,
          toCheck,
          this.index,
          this.idxEnd
        );
        if (typeof result !== "boolean") return result;
      }
    } else {
      return _AE.checkAlgorithm(
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        this.conditions,
        toCheck,
        this.index,
        this.idxEnd
      );
    }
    return true;
  }
  // #endregion Referenced Condition checking.
};

export {
  AE
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vc3JjL21haW4vd2ViL25vZGVfbW9kdWxlcy94ZGJjL3NyYy9EQkMvQUUudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImltcG9ydCB7IERCQyB9IGZyb20gXCIuLi9EQkNcIjtcclxuLyoqXHJcbiAqIEEge0BsaW5rIERCQyB9IGRlZmluaW5nIHRoYXQgYWxsIGVsZW1lbnRzIG9mIGFuIHtAbGluayBvYmplY3QgfXMgaGF2ZSB0byBmdWxmaWxsXHJcbiAqIGEgZ2l2ZW4ge0BsaW5rIG9iamVjdCB9J3MgY2hlY2stbWV0aG9kICgqKiggdG9DaGVjayA6IGFueSApID0+IGJvb2xlYW4gfCBzdHJpbmcqKikuXHJcbiAqXHJcbiAqIEByZW1hcmtzXHJcbiAqIE1haW50YWluZXI6IENhbGxhcmksIFNhbHZhdG9yZSAoWERCQ0BXYVhDb2RlLm5ldCkgKi9cclxuZXhwb3J0IGNsYXNzIEFFIGV4dGVuZHMgREJDIHtcclxuXHQvLyAjcmVnaW9uIENvbmRpdGlvbiBjaGVja2luZy5cclxuXHQvKipcclxuXHQgKiBDaGVja3MgZWFjaCBlbGVtZW50IG9mIHRoZSAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59IGFnYWluc3QgdGhlIGdpdmVuICoqY29uZGl0aW9uKiosIGlmIGl0IGlzIG9uZS4gSWYgaXQgaXMgbm90XHJcblx0ICogdGhlICoqdmFsdWUqKiBpdHNlbGYgd2lsbCBiZSBjaGVja2VkLlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIGNvbmRpdGlvblx0VGhlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgKip2YWx1ZSoqIGFnYWluc3QuXHJcblx0ICogQHBhcmFtIHZhbHVlXHRcdEVpdGhlciAqKnZhbHVlKiote0BsaW5rIEFycmF5IDwgYW55ID59LCB3aGljaCdzIGVsZW1lbnRzIHdpbGwgYmUgY2hlY2tlZCwgb3IgdGhlIHZhbHVlIHRvIGJlXHJcblx0ICogXHRcdFx0XHRcdGNoZWNrZWQgaXRzZWxmLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRJZiBzcGVjaWZpZWQgd2l0aCAqKmlkeEVuZCoqIGJlaW5nIHVuZGVmaW5lZCwgdGhpcyB7QGxpbmsgTnVtYmVyIH0gd2lsbCBiZSBzZWVuIGFzIHRoZSBpbmRleCBvZlxyXG5cdCAqIFx0XHRcdFx0XHR0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50IHRvIGNoZWNrLiBJZiB2YWx1ZSBpc24ndCBhbiB7QGxpbmsgQXJyYXkgfSB0aGlzIHBhcmFtZXRlclxyXG5cdCAqIFx0XHRcdFx0XHR3aWxsIG5vdCBoYXZlIGFueSBlZmZlY3QuXHJcblx0ICogXHRcdFx0XHRcdFdpdGggKippZHhFbmQqKiBub3QgdW5kZWZpbmVkIHRoaXMgcGFyYW1ldGVyIGluZGljYXRlcyB0aGUgYmVnaW5uaW5nIG9mIHRoZSBzcGFuIG9mIGVsZW1lbnRzIHRvXHJcblx0ICogXHRcdFx0XHRcdGNoZWNrIHdpdGhpbiB0aGUgdmFsdWUte0BsaW5rIEFycmF5IH0uXHJcblx0ICogQHBhcmFtIGlkeEVuZFx0SW5kaWNhdGVzIHRoZSBsYXN0IGVsZW1lbnQncyBpbmRleCAoaW5jbHVkaW5nKSBvZiB0aGUgc3BhbiBvZiB2YWx1ZS17QGxpbmsgQXJyYXkgfSBlbGVtZW50cyB0byBjaGVjay5cclxuXHQgKiBcdFx0XHRcdFx0U2V0dGluZyB0aGlzIHBhcmFtZXRlciB0byAtMSBzcGVjaWZpZXMgdGhhdCBhbGwgdmFsdWUte0BsaW5rIEFycmF5IH0ncyBlbGVtZW50cyBiZWdpbm5pbmcgZnJvbSB0aGVcclxuXHQgKiBcdFx0XHRcdFx0c3BlY2lmaWVkICoqaW5kZXgqKiBzaGFsbCBiZSBjaGVja2VkLlxyXG5cdCAqXHJcblx0ICogQHJldHVybnMgQXMgc29vbiBhcyB0aGUgKipjb25kaXRpb24qKiByZXR1cm5zIGEge0BsaW5rIHN0cmluZyB9LCBpbnN0ZWFkIG9mIFRSVUUsIHRoZSByZXR1cm5lZCBzdHJpbmcuIFRSVUUgaWYgdGhlXHJcblx0ICogXHRcdFx0Kipjb25kaXRpb24qKiBuZXZlciByZXR1cm5zIGEge0BsaW5rIHN0cmluZ30uICovXHJcblx0cHVibGljIHN0YXRpYyBjaGVja0FsZ29yaXRobShcclxuXHRcdGNvbmRpdGlvbjoge1xyXG5cdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCBudWxsIHwgdW5kZWZpbmVkKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0fSxcclxuXHRcdHZhbHVlOiBvYmplY3QsXHJcblx0XHRpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkLFxyXG5cdFx0aWR4RW5kOiBudW1iZXIgfCB1bmRlZmluZWQsXHJcblx0KTogYm9vbGVhbiB8IHN0cmluZyB7XHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0aWYgKGluZGV4ICE9PSB1bmRlZmluZWQgJiYgaWR4RW5kID09PSB1bmRlZmluZWQpIHtcclxuXHRcdFx0XHRpZiAoaW5kZXggPiAtMSAmJiBpbmRleCA8IHZhbHVlLmxlbmd0aCkge1xyXG5cdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gY29uZGl0aW9uLmNoZWNrKHZhbHVlW2luZGV4XSk7XHJcblxyXG5cdFx0XHRcdFx0aWYgKHR5cGVvZiByZXN1bHQgPT09IFwic3RyaW5nXCIpIHtcclxuXHRcdFx0XHRcdFx0cmV0dXJuIGBWaW9sYXRpbmctQXJyYXllbGVtZW50IGF0IGluZGV4IFwiJHtpbmRleH1cIiB3aXRoIHZhbHVlIFwiJHt2YWx1ZVtpbmRleF19XCIuICR7cmVzdWx0fWA7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRyZXR1cm4gdHJ1ZTsgLy8gSW4gb3JkZXIgZm9yIG9wdGlvbmFsIHBhcmFtZXRlciB0byBub3QgY2F1c2UgYW4gZXJyb3IgaWYgdGhleSBhcmUgb21pdHRlZC5cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0Y29uc3QgZW5kaW5nID1cclxuXHRcdFx0XHRpZHhFbmQgIT09IHVuZGVmaW5lZFxyXG5cdFx0XHRcdFx0PyBpZHhFbmQgIT09IC0xXHJcblx0XHRcdFx0XHRcdD8gaWR4RW5kICsgMVxyXG5cdFx0XHRcdFx0XHQ6ICh2YWx1ZSBhcyBbXSkubGVuZ3RoXHJcblx0XHRcdFx0XHQ6ICh2YWx1ZSBhcyBbXSkubGVuZ3RoO1xyXG5cclxuXHRcdFx0Zm9yIChsZXQgaSA9IGluZGV4ID8gaW5kZXggOiAwOyBpIDwgZW5kaW5nOyBpKyspIHtcclxuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBjb25kaXRpb24uY2hlY2sodmFsdWVbaV0pO1xyXG5cclxuXHRcdFx0XHRpZiAocmVzdWx0ICE9PSB0cnVlKSB7XHJcblx0XHRcdFx0XHRyZXR1cm4gYFZpb2xhdGluZy1BcnJheWVsZW1lbnQgYXQgaW5kZXggJHtpfS4gJHtyZXN1bHR9YDtcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiBjb25kaXRpb24uY2hlY2sodmFsdWUpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIHBhcmFtZXRlci1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXHJcblx0ICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZSBhZ2FpbnN0IHdpdGguXHJcblx0ICogV2hlbiBzcGVjaWZ5aW5nIGFuICoqaW5kZXgqKiBhbmQgdGhlIHRhZ2dlZCBwYXJhbWV0ZXIncyAqKnZhbHVlKiogaXMgYW4ge0BsaW5rIEFycmF5IH0sIHRoZSAqKnJlYWxDb25kaXRpb25zKiogYXBwbHkgdG8gdGhlXHJcblx0ICogZWxlbWVudCBhdCB0aGUgc3BlY2lmaWVkICoqaW5kZXgqKi5cclxuXHQgKiBJZiB0aGUge0BsaW5rIEFycmF5IH0gaXMgdG9vIHNob3J0IHRoZSBjdXJyZW50bHkgcHJvY2Vzc2VkIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZlxyXG5cdCAqICoqcmVhbENvbmRpdGlvbnMqKiB3aWxsIGJlIHZlcmlmaWVkIHRvIFRSVUUgYXV0b21hdGljYWxseSwgY29uc2lkZXJpbmcgb3B0aW9uYWwgcGFyYW1ldGVycy5cclxuXHQgKiBJZiBhbiAqKmluZGV4KiogaXMgc3BlY2lmaWVkIGJ1dCB0aGUgdGFnZ2VkIHBhcmFtZXRlcidzIHZhbHVlIGlzbid0IGFuIGFycmF5LCB0aGUgKippbmRleCoqIGlzIHRyZWF0ZWQgYXMgYmVpbmcgdW5kZWZpbmVkLlxyXG5cdCAqIElmICoqaW5kZXgqKiBpcyB1bmRlZmluZWQgYW5kIHRoZSB0YWdnZWQgcGFyYW1ldGVyJ3MgdmFsdWUgaXMgYW4ge0BsaW5rIEFycmF5IH0gZWFjaCBlbGVtZW50IG9mIGl0IHdpbGwgYmUgY2hlY2tlZFxyXG5cdCAqIGFnYWluc3QgdGhlICoqcmVhbENvbmRpdGlvbnMqKi5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gaWR4RW5kXHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjUHJlY29uZGl0aW9uIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJuc1x0QSB7QGxpbmsgc3RyaW5nIH0gYXMgc29vbiBhcyBvbmUgeyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9IG9mICoqcmVhbENvbmRpdGlvbnMqKiByZXR1cm5zIG9uZS5cclxuXHQgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBSRShcclxuXHRcdHJlYWxDb25kaXRpb25zOlxyXG5cdFx0XHR8IEFycmF5PHtcclxuXHRcdFx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHRcdCAgfT5cclxuXHRcdFx0fCB7IGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSxcclxuXHRcdGluZGV4OiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRpZHhFbmQ6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdHBhdGg6IHN0cmluZyB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdGRiYyA9IFwiV2FYQ29kZS5EQkNcIixcclxuXHQpOiAoXHJcblx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdG1ldGhvZE5hbWU6IHN0cmluZyB8IHN5bWJvbCxcclxuXHRcdHBhcmFtZXRlckluZGV4OiBudW1iZXIsXHJcblx0KSA9PiB2b2lkIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUHJlY29uZGl0aW9uKFxyXG5cdFx0XHQoXHJcblx0XHRcdFx0dmFsdWU6IG9iamVjdCxcclxuXHRcdFx0XHR0YXJnZXQ6IG9iamVjdCxcclxuXHRcdFx0XHRtZXRob2ROYW1lOiBzdHJpbmcsXHJcblx0XHRcdFx0cGFyYW1ldGVySW5kZXg6IG51bWJlcixcclxuXHRcdFx0KSA9PiB7XHJcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgcmVhbENvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oXHJcblx0XHRcdFx0XHRcdFx0Y3VycmVudENvbmRpdGlvbixcclxuXHRcdFx0XHRcdFx0XHR2YWx1ZSxcclxuXHRcdFx0XHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRcdFx0XHRpZHhFbmQsXHJcblx0XHRcdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpIHJldHVybiByZXN1bHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBBRS5jaGVja0FsZ29yaXRobShcclxuXHRcdFx0XHRcdFx0cmVhbENvbmRpdGlvbnMgYXMge1xyXG5cdFx0XHRcdFx0XHRcdGNoZWNrOiAodG9DaGVjazogdW5rbm93biB8IHVuZGVmaW5lZCB8IG51bGwpID0+IGJvb2xlYW4gfCBzdHJpbmc7XHJcblx0XHRcdFx0XHRcdH0sXHJcblx0XHRcdFx0XHRcdHZhbHVlLFxyXG5cdFx0XHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRcdFx0aWR4RW5kLFxyXG5cdFx0XHRcdFx0KTtcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHJldHVybiB0cnVlO1xyXG5cdFx0XHR9LFxyXG5cdFx0XHRkYmMsXHJcblx0XHRcdHBhdGgsXHJcblx0XHQpO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBBIG1ldGhvZC1kZWNvcmF0b3IgZmFjdG9yeSB1c2luZyB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0gd2l0aCBlaXRoZXIgbXVsdGlwbGUgb3IgYSBzaW5nbGUgb25lXHJcblx0ICogb2YgdGhlICoqcmVhbENvbmRpdGlvbnMqKiB0byBjaGVjayB0aGUgdGFnZ2VkIG1ldGhvZCdzIHJldHVybi12YWx1ZSBhZ2FpbnN0IHdpdGguXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gcmVhbENvbmRpdGlvbnNcdEVpdGhlciBvbmUgb3IgbW9yZSB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0gdG8gY2hlY2sgdGhlIHRhZ2dlZCBwYXJhbWV0ZXItdmFsdWVcclxuXHQgKiBcdFx0XHRcdFx0XHRcdGFnYWluc3Qgd2l0aC5cclxuXHQgKiBAcGFyYW0gaW5kZXhcdFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIGlkeEVuZFx0XHRcdFNlZSB0aGUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICogQHBhcmFtIHBhdGhcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqIEBwYXJhbSBkYmNcdFx0XHRcdFNlZSB7QGxpbmsgREJDLmRlY1ByZWNvbmRpdGlvbiB9LlxyXG5cdCAqXHJcblx0ICogQHJldHVybnNcdEEge0BsaW5rIHN0cmluZyB9IGFzIHNvb24gYXMgb25lIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSBvZiAqKnJlYWxDb25kaXRpb25zKiogcmV0dXJuIG9uZS5cclxuXHQgKiBcdFx0XHRPdGhlcndpc2UgVFJVRS4gKi9cclxuXHRwdWJsaWMgc3RhdGljIFBPU1QoXHJcblx0XHRyZWFsQ29uZGl0aW9uczogLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdHwgQXJyYXk8eyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9PlxyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdFx0fCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0sXHJcblx0XHRpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aWR4RW5kOiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KTogKFxyXG5cdFx0dGFyZ2V0OiBvYmplY3QsXHJcblx0XHRwcm9wZXJ0eUtleTogc3RyaW5nLFxyXG5cdFx0ZGVzY3JpcHRvcjogUHJvcGVydHlEZXNjcmlwdG9yLFxyXG5cdCkgPT4gUHJvcGVydHlEZXNjcmlwdG9yIHtcclxuXHRcdHJldHVybiBEQkMuZGVjUG9zdGNvbmRpdGlvbihcclxuXHRcdFx0KHZhbHVlOiBvYmplY3QsIHRhcmdldDogb2JqZWN0LCBwcm9wZXJ0eUtleTogc3RyaW5nKSA9PiB7XHJcblx0XHRcdFx0aWYgKEFycmF5LmlzQXJyYXkocmVhbENvbmRpdGlvbnMpKSB7XHJcblx0XHRcdFx0XHRmb3IgKGNvbnN0IGN1cnJlbnRDb25kaXRpb24gb2YgcmVhbENvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRcdFx0Y29uc3QgcmVzdWx0ID0gQUUuY2hlY2tBbGdvcml0aG0oXHJcblx0XHRcdFx0XHRcdFx0Y3VycmVudENvbmRpdGlvbixcclxuXHRcdFx0XHRcdFx0XHR2YWx1ZSxcclxuXHRcdFx0XHRcdFx0XHRpbmRleCxcclxuXHRcdFx0XHRcdFx0XHRpZHhFbmQsXHJcblx0XHRcdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdFx0XHRpZiAodHlwZW9mIHJlc3VsdCAhPT0gXCJib29sZWFuXCIpIHJldHVybiByZXN1bHQ7XHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRcdHJldHVybiBBRS5jaGVja0FsZ29yaXRobShcclxuXHRcdFx0XHRcdFx0Ly8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdFx0XHRcdHJlYWxDb25kaXRpb25zIGFzIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSxcclxuXHRcdFx0XHRcdFx0dmFsdWUsXHJcblx0XHRcdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdFx0XHRpZHhFbmQsXHJcblx0XHRcdFx0XHQpO1xyXG5cdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0cmV0dXJuIHRydWU7XHJcblx0XHRcdH0sXHJcblx0XHRcdGRiYyxcclxuXHRcdFx0cGF0aCxcclxuXHRcdCk7XHJcblx0fVxyXG5cdC8qKlxyXG5cdCAqIEEgZmllbGQtZGVjb3JhdG9yIGZhY3RvcnkgdXNpbmcgdGhlIHtAbGluayBBRS5jaGVja0FsZ29yaXRobSB9IHdpdGggZWl0aGVyIG11bHRpcGxlIG9yIGEgc2luZ2xlIG9uZVxyXG5cdCAqIG9mIHRoZSAqKnJlYWxDb25kaXRpb25zKiogdG8gY2hlY2sgdGhlIHRhZ2dlZCBmaWVsZC5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSByZWFsQ29uZGl0aW9uc1x0RWl0aGVyIG9uZSBvciBtb3JlIHsgY2hlY2s6ICh0b0NoZWNrOiBhbnkpID0+IGJvb2xlYW4gfCBzdHJpbmcgfSB0byBjaGVjayB0aGUgdGFnZ2VkIHBhcmFtZXRlci12YWx1ZVxyXG5cdCAqIFx0XHRcdFx0XHRcdFx0YWdhaW5zdCB3aXRoLlxyXG5cdCAqIEBwYXJhbSBpbmRleFx0XHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gaWR4RW5kXHRcdFx0U2VlIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfS5cclxuXHQgKiBAcGFyYW0gcGF0aFx0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICogQHBhcmFtIGRiY1x0XHRcdFx0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJuc1x0U2VlIHtAbGluayBEQkMuZGVjSW52YXJpYW50IH0uICovXHJcblx0cHVibGljIHN0YXRpYyBJTlZBUklBTlQoXHJcblx0XHRyZWFsQ29uZGl0aW9uczogLy8gYmlvbWUtaWdub3JlIGxpbnQvc3VzcGljaW91cy9ub0V4cGxpY2l0QW55OiA8ZXhwbGFuYXRpb24+XHJcblx0XHRcdHwgQXJyYXk8eyBjaGVjazogKHRvQ2hlY2s6IGFueSkgPT4gYm9vbGVhbiB8IHN0cmluZyB9PlxyXG5cdFx0XHQvLyBiaW9tZS1pZ25vcmUgbGludC9zdXNwaWNpb3VzL25vRXhwbGljaXRBbnk6IDxleHBsYW5hdGlvbj5cclxuXHRcdFx0fCB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0sXHJcblx0XHRpbmRleDogbnVtYmVyIHwgdW5kZWZpbmVkID0gdW5kZWZpbmVkLFxyXG5cdFx0aWR4RW5kOiBudW1iZXIgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRwYXRoOiBzdHJpbmcgfCB1bmRlZmluZWQgPSB1bmRlZmluZWQsXHJcblx0XHRkYmMgPSBcIldhWENvZGUuREJDXCIsXHJcblx0KSB7XHJcblx0XHRyZXR1cm4gREJDLmRlY0ludmFyaWFudChbbmV3IEFFKHJlYWxDb25kaXRpb25zLCBpbmRleCwgaWR4RW5kKV0sIHBhdGgsIGRiYyk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gQ29uZGl0aW9uIGNoZWNraW5nLlxyXG5cdC8vICNyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcblx0Ly9cclxuXHQvLyBGb3IgdXNhZ2UgaW4gZHluYW1pYyBzY2VuYXJpb3MgKGxpa2UgZ2xvYmFsIGZ1bmN0aW9ucykuXHJcblx0Ly9cclxuXHQvKipcclxuXHQgKiBJbnZva2VzIHRoZSB7QGxpbmsgQUUuY2hlY2tBbGdvcml0aG0gfSB3aXRoIGFsbCB7QGxpbmsgQUUuY29uZGl0aW9ucyB9IGFuZCB0aGUge0BsaW5rIG9iamVjdCB9IHtAbGluayB0b0NoZWNrIH0sXHJcblx0ICoge0BsaW5rIEFFLmluZGV4IH0gJiB7QGxpbmsgQUUuaWR4RW5kIH0uXHJcblx0ICpcclxuXHQgKiBAcGFyYW0gdG9DaGVjayBTZWUge0BsaW5rIEFFLmNoZWNrQWxnb3JpdGhtIH0uXHJcblx0ICpcclxuXHQgKiBAcmV0dXJucyBTZWUge0BsaW5rIEVRLmNoZWNrQWxnb3JpdGhtfS4gKi9cclxuXHRwdWJsaWMgY2hlY2sodG9DaGVjazogb2JqZWN0KSB7XHJcblx0XHRpZiAoQXJyYXkuaXNBcnJheSh0aGlzLmNvbmRpdGlvbnMpKSB7XHJcblx0XHRcdGZvciAoY29uc3QgY3VycmVudENvbmRpdGlvbiBvZiB0aGlzLmNvbmRpdGlvbnMpIHtcclxuXHRcdFx0XHRjb25zdCByZXN1bHQgPSBBRS5jaGVja0FsZ29yaXRobShcclxuXHRcdFx0XHRcdGN1cnJlbnRDb25kaXRpb24sXHJcblx0XHRcdFx0XHR0b0NoZWNrLFxyXG5cdFx0XHRcdFx0dGhpcy5pbmRleCxcclxuXHRcdFx0XHRcdHRoaXMuaWR4RW5kLFxyXG5cdFx0XHRcdCk7XHJcblxyXG5cdFx0XHRcdGlmICh0eXBlb2YgcmVzdWx0ICE9PSBcImJvb2xlYW5cIikgcmV0dXJuIHJlc3VsdDtcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIEFFLmNoZWNrQWxnb3JpdGhtKFxyXG5cdFx0XHRcdC8vIGJpb21lLWlnbm9yZSBsaW50L3N1c3BpY2lvdXMvbm9FeHBsaWNpdEFueTogPGV4cGxhbmF0aW9uPlxyXG5cdFx0XHRcdHRoaXMuY29uZGl0aW9ucyBhcyB7IGNoZWNrOiAodG9DaGVjazogYW55KSA9PiBib29sZWFuIHwgc3RyaW5nIH0sXHJcblx0XHRcdFx0dG9DaGVjayxcclxuXHRcdFx0XHR0aGlzLmluZGV4LFxyXG5cdFx0XHRcdHRoaXMuaWR4RW5kLFxyXG5cdFx0XHQpO1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiB0cnVlO1xyXG5cdH1cclxuXHQvKipcclxuXHQgKiBDcmVhdGVzIHRoaXMge0BsaW5rIEFFIH0gYnkgc2V0dGluZyB0aGUgcHJvdGVjdGVkIHByb3BlcnR5IHtAbGluayBBRS5jb25kaXRpb25zIH0sIHtAbGluayBBRS5pbmRleCB9IGFuZCB7QGxpbmsgQUUuaWR4RW5kIH0gdXNlZCBieSB7QGxpbmsgQUUuY2hlY2sgfS5cclxuXHQgKlxyXG5cdCAqIEBwYXJhbSBlcXVpdmFsZW50IFNlZSB7QGxpbmsgRVEuY2hlY2sgfS4gKi9cclxuXHRwdWJsaWMgY29uc3RydWN0b3IoXHJcblx0XHRwcm90ZWN0ZWQgY29uZGl0aW9uczpcclxuXHRcdFx0fCBBcnJheTx7XHJcblx0XHRcdFx0XHRjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsKSA9PiBib29sZWFuIHwgc3RyaW5nO1xyXG5cdFx0XHQgIH0+XHJcblx0XHRcdHwgeyBjaGVjazogKHRvQ2hlY2s6IHVua25vd24gfCB1bmRlZmluZWQgfCBudWxsKSA9PiBib29sZWFuIHwgc3RyaW5nIH0sXHJcblx0XHRwcm90ZWN0ZWQgaW5kZXg6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHRcdHByb3RlY3RlZCBpZHhFbmQ6IG51bWJlciB8IHVuZGVmaW5lZCA9IHVuZGVmaW5lZCxcclxuXHQpIHtcclxuXHRcdHN1cGVyKCk7XHJcblx0fVxyXG5cdC8vICNlbmRyZWdpb24gUmVmZXJlbmNlZCBDb25kaXRpb24gY2hlY2tpbmcuXHJcbn1cclxuIl0sCiAgIm1hcHBpbmdzIjogIjs7Ozs7QUFPTyxJQUFNLEtBQU4sTUFBTSxZQUFXLElBQUk7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBMlBwQixZQUNJLFlBS0EsUUFBNEIsUUFDNUIsU0FBNkIsUUFDdEM7QUFDRCxVQUFNO0FBUkk7QUFLQTtBQUNBO0FBQUEsRUFHWDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFqUEEsT0FBYyxlQUNiLFdBR0EsT0FDQSxPQUNBLFFBQ21CO0FBQ25CLFFBQUksTUFBTSxRQUFRLEtBQUssR0FBRztBQUN6QixVQUFJLFVBQVUsVUFBYSxXQUFXLFFBQVc7QUFDaEQsWUFBSSxRQUFRLE1BQU0sUUFBUSxNQUFNLFFBQVE7QUFDdkMsZ0JBQU0sU0FBUyxVQUFVLE1BQU0sTUFBTSxLQUFLLENBQUM7QUFFM0MsY0FBSSxPQUFPLFdBQVcsVUFBVTtBQUMvQixtQkFBTyxvQ0FBb0MsS0FBSyxpQkFBaUIsTUFBTSxLQUFLLENBQUMsTUFBTSxNQUFNO0FBQUEsVUFDMUY7QUFBQSxRQUNEO0FBRUEsZUFBTztBQUFBLE1BQ1I7QUFFQSxZQUFNLFNBQ0wsV0FBVyxTQUNSLFdBQVcsS0FDVixTQUFTLElBQ1IsTUFBYSxTQUNkLE1BQWE7QUFFbEIsZUFBUyxJQUFJLFFBQVEsUUFBUSxHQUFHLElBQUksUUFBUSxLQUFLO0FBQ2hELGNBQU0sU0FBUyxVQUFVLE1BQU0sTUFBTSxDQUFDLENBQUM7QUFFdkMsWUFBSSxXQUFXLE1BQU07QUFDcEIsaUJBQU8sbUNBQW1DLENBQUMsS0FBSyxNQUFNO0FBQUEsUUFDdkQ7QUFBQSxNQUNEO0FBQUEsSUFDRCxPQUFPO0FBQ04sYUFBTyxVQUFVLE1BQU0sS0FBSztBQUFBLElBQzdCO0FBRUEsV0FBTztBQUFBLEVBQ1I7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFxQkEsT0FBYyxJQUNiLGdCQUtBLFFBQTRCLFFBQzVCLFNBQTZCLFFBQzdCLE9BQTJCLFFBQzNCLE1BQU0sZUFLRztBQUNULFdBQU8sSUFBSTtBQUFBLE1BQ1YsQ0FDQyxPQUNBLFFBQ0EsWUFDQSxtQkFDSTtBQUNKLFlBQUksTUFBTSxRQUFRLGNBQWMsR0FBRztBQUNsQyxxQkFBVyxvQkFBb0IsZ0JBQWdCO0FBQzlDLGtCQUFNLFNBQVMsSUFBRztBQUFBLGNBQ2pCO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDRDtBQUVBLGdCQUFJLE9BQU8sV0FBVyxVQUFXLFFBQU87QUFBQSxVQUN6QztBQUFBLFFBQ0QsT0FBTztBQUNOLGlCQUFPLElBQUc7QUFBQSxZQUNUO0FBQUEsWUFHQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRDtBQUFBLFFBQ0Q7QUFFQSxlQUFPO0FBQUEsTUFDUjtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRDtBQUFBLEVBQ0Q7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBY0EsT0FBYyxLQUNiLGdCQUlBLFFBQTRCLFFBQzVCLFNBQTZCLFFBQzdCLE9BQTJCLFFBQzNCLE1BQU0sZUFLaUI7QUFDdkIsV0FBTyxJQUFJO0FBQUEsTUFDVixDQUFDLE9BQWUsUUFBZ0IsZ0JBQXdCO0FBQ3ZELFlBQUksTUFBTSxRQUFRLGNBQWMsR0FBRztBQUNsQyxxQkFBVyxvQkFBb0IsZ0JBQWdCO0FBQzlDLGtCQUFNLFNBQVMsSUFBRztBQUFBLGNBQ2pCO0FBQUEsY0FDQTtBQUFBLGNBQ0E7QUFBQSxjQUNBO0FBQUEsWUFDRDtBQUVBLGdCQUFJLE9BQU8sV0FBVyxVQUFXLFFBQU87QUFBQSxVQUN6QztBQUFBLFFBQ0QsT0FBTztBQUNOLGlCQUFPLElBQUc7QUFBQTtBQUFBLFlBRVQ7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNEO0FBQUEsUUFDRDtBQUVBLGVBQU87QUFBQSxNQUNSO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxJQUNEO0FBQUEsRUFDRDtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBLEVBYUEsT0FBYyxVQUNiLGdCQUlBLFFBQTRCLFFBQzVCLFNBQTZCLFFBQzdCLE9BQTJCLFFBQzNCLE1BQU0sZUFDTDtBQUNELFdBQU8sSUFBSSxhQUFhLENBQUMsSUFBSSxJQUFHLGdCQUFnQixPQUFPLE1BQU0sQ0FBQyxHQUFHLE1BQU0sR0FBRztBQUFBLEVBQzNFO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUEsRUFhTyxNQUFNLFNBQWlCO0FBQzdCLFFBQUksTUFBTSxRQUFRLEtBQUssVUFBVSxHQUFHO0FBQ25DLGlCQUFXLG9CQUFvQixLQUFLLFlBQVk7QUFDL0MsY0FBTSxTQUFTLElBQUc7QUFBQSxVQUNqQjtBQUFBLFVBQ0E7QUFBQSxVQUNBLEtBQUs7QUFBQSxVQUNMLEtBQUs7QUFBQSxRQUNOO0FBRUEsWUFBSSxPQUFPLFdBQVcsVUFBVyxRQUFPO0FBQUEsTUFDekM7QUFBQSxJQUNELE9BQU87QUFDTixhQUFPLElBQUc7QUFBQTtBQUFBLFFBRVQsS0FBSztBQUFBLFFBQ0w7QUFBQSxRQUNBLEtBQUs7QUFBQSxRQUNMLEtBQUs7QUFBQSxNQUNOO0FBQUEsSUFDRDtBQUVBLFdBQU87QUFBQSxFQUNSO0FBQUE7QUFpQkQ7IiwKICAibmFtZXMiOiBbXQp9Cg==
