import type { IXUtil } from "@de-xima/fc-form-renderer";
import $ from "jquery";

import { TestState } from "../../__tests__/test-state.js";
import { computeIfAbsent } from "@de-xima/xima-common-js-lang";

type Module = typeof import("@de-xima/fc-form-renderer");

// Extend jQuery with xima form renderer methods used by Functionalities.
($.fn as any).error = function (msg?: string) {
  if (msg === undefined) return this.data("error-msg") || "";
  this.data("error-msg", msg);
  if (msg === "") {
    this.removeAttr("aria-invalid");
  } else {
    this.attr("aria-invalid", "true");
  }
  return this;
};

($.fn as any).datepicker = function (option?: string | object, ...args: any[]) {
  if (option === undefined) {
    this.data("datepicker", 1);
    return this;
  }
  if (option === "option") {
    // jQuery UI datepicker "option" method
    if (args.length === 0) return this.data("dp-options") || {};
    if (args.length === 1 && typeof args[0] === "string") {
      // getter: $(el).datepicker("option", key)
      return (this.first().data("dp-options") || {})[args[0]];
    }
    if (args.length === 1 && typeof args[0] === "object") {
      // setter with object: $(el).datepicker("option", { key: value })
      this.each(function (this: any) {
        const opts = $(this).data("dp-options") || {};
        Object.assign(opts, args[0]);
        $(this).data("dp-options", opts);
      });
    } else if (args.length >= 2) {
      // setter: $(el).datepicker("option", key, value)
      this.each(function (this: any) {
        const opts = $(this).data("dp-options") || {};
        opts[args[0]] = args[1];
        $(this).data("dp-options", opts);
      });
    }
  } else if (typeof option === "string") {
    if (args.length === 0) return this.data(`dp-${option}`);
    this.data(`dp-${option}`, args[0]);
  } else if (typeof option === "object") {
    this.each(function (this: any) {
      const opts = $(this).data("dp-options") || {};
      Object.assign(opts, option);
      $(this).data("dp-options", opts);
    });
  }
  return this;
};

($ as any).datepicker = {
  noWeekends: (date: Date) => [date.getDay() !== 0 && date.getDay() !== 6],
};

export const getXfcMetaData: Module["getXfcMetaData"] = () => TestState.xfcMetaData;

export const getXmFormI18n: Module["getXmFormI18n"] = () => TestState.xmFormI18n;

export const getJQuery: Module["getJQuery"] = () => {
  const jq = $ as ReturnType<Module["getJQuery"]>;
  jq.xutil = getXUtil();
  return jq;
};

export const getXUtil: Module["getXUtil"] = () =>
  ({
    on: (key, callback) => {
      computeIfAbsent(TestState.xUtilCallbacks, key, () => new Set()).add(callback);
      return {
        dispose: () => {
          computeIfAbsent(TestState.xUtilCallbacks, key, () => new Set()).delete(callback);
          if (TestState.xUtilCallbacks.get(key)?.size === 0) {
            TestState.xUtilCallbacks.delete(key);
          }
        },
      };
    },
    off: (key, callback) => {
      TestState.xUtilCallbacks.get(key)?.delete(callback);
      if (TestState.xUtilCallbacks.get(key)?.size === 0) {
        TestState.xUtilCallbacks.delete(key);
      }
    },
    trigger: (key, params) =>
      [...(TestState.xUtilCallbacks.get(key) ?? [])].map((c) => c.apply(null, params as unknown as never[])),
  }) as IXUtil;
