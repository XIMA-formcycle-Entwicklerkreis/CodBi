// biome-ignore lint/style/useImportType: <explanation>
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";

import { routes } from "./app.routes";
import Aura from "@primeuix/themes/aura";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    providePrimeNG(),
    provideRouter(routes),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: ".p-dark" } },
    }),
  ],
};
