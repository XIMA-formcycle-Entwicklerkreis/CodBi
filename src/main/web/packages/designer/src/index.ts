import { registerCustomElements } from "./js/register-customElements.js";

import { registerButtonActionTranslations } from "./js/register-custom-translations.js";
import { registerCustomFormCategories } from "./js/register-custom-form-categories.js";
import { registerCustomFormProperties } from "./js/register-custom-form-properties.js";
import { registerCustomMirrorProperties } from "./js/register-custom-mirror-properties.js";

registerButtonActionTranslations();
registerCustomFormCategories();
registerCustomFormProperties();
registerCustomMirrorProperties();
registerCustomElements();
