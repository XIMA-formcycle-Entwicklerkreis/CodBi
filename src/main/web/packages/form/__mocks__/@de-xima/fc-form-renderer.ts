import type { IXUtil } from "@de-xima/fc-form-renderer";
import $ from "jquery";

import { TestState } from "../../__tests__/test-state.js";
import { computeIfAbsent } from "@de-xima/xima-common-js-lang";

type Module = typeof import("@de-xima/fc-form-renderer");

export const getXfcMetaData: Module["getXfcMetaData"] = () => TestState.xfcMetaData;

export const getXmFormI18n: Module["getXmFormI18n"] = () => TestState.xmFormI18n;

export const getJQuery: Module["getJQuery"] = () => $;

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
