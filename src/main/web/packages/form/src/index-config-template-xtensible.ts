import type { ConfigTemplate } from "./js/global-scope.js";

export function createConfigTemplate(): ConfigTemplate {
  return {
    name: "xtensible",
  };
}

window.codbi.configTemplate = createConfigTemplate();
