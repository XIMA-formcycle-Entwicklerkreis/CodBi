import type { ConfigTemplate } from "./js/global-scope.js";

export function createConfigTemplate(): ConfigTemplate {
  return {
    name: "default",
  };
}

console.log("Using config template -- default");
window.codbi.configTemplate = createConfigTemplate();
