import { createApplication } from "@angular/platform-browser"; // For creating application ref
import { createCustomElement } from "@angular/elements"; // To create the custom element definition
import { appConfig } from "./app/app.config"; // Your application's config (e.g., providers)
import { Manager } from "./app/manager/manager"; // Your main component to be converted to a web component

(async () => {
  const appRef = await createApplication(appConfig);
  const CustomElement = createCustomElement(Manager, { injector: appRef.injector });

  customElements.define("cb-manager", CustomElement);
})().catch((err) => console.error("Error defining custom element:", err));
