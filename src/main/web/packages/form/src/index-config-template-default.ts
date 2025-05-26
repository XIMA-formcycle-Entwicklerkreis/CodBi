import type { ConfigTemplate } from "./js/global-scope";
/**
 * Gets the {@link ConfigTemplate }'s name.
 *
 * @returns The {@link ConfigTemplate }'s name. */
export function createConfigTemplate(): ConfigTemplate {
  return { name: "default" };
}

window.codbi.configTemplate = createConfigTemplate();

window.codbi.checkAttributes();
