import { createApplication } from "@angular/platform-browser"; // For creating application ref
import { createCustomElement } from "@angular/elements"; // To create the custom element definition
import { appConfig } from "./app/app.config"; // Your application's config (e.g., providers)
import { Manager } from "./app/manager/manager"; // Your main component to be converted to a web component

(async () => {
  // 1. Create the Angular application environment
  // This replaces bootstrapApplication and gives you an ApplicationRef
  const appRef = await createApplication(appConfig);

  // 2. Create the custom element class from your Angular component
  // Use 'App' (your component) here, not 'appConfig'
  const CustomElement = createCustomElement(Manager, { injector: appRef.injector });

  // 3. Define the custom element with the browser
  // This registers the <cb-manager> tag
  customElements.define("cb-manager", CustomElement);

  console.log("cb-manager custom element registered successfully!");
})().catch((err) => console.error("Error defining custom element:", err));
