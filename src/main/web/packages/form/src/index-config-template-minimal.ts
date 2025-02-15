import type { ConfigTemplate } from "./js/global-scope.js";

export function createConfigTemplate(): ConfigTemplate {
  return {
    name: "minimal",
  };
}

console.log("Using config template -- minimal");
window.codbi.configTemplate = createConfigTemplate();
