// biome-ignore lint/style/useImportType: <explanation>
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";

import { routes } from "./app.routes";
import Lara from "@primeng/themes/lara";
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    providePrimeNG(),
    provideRouter(routes),
    providePrimeNG({
      theme: {
        preset: Lara, // Apply the Lara theme preset
      },
    }),
  ],
};
