// app.config.ts
// biome-ignore lint/style/useImportType: <explanation>
import {
  ApplicationConfig,
  Inject,
  Injectable,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideZonelessChangeDetection } from "@angular/core";
import { provideRouter } from "@angular/router";
import { providePrimeNG } from "primeng/config";

import { HttpClientModule, provideHttpClient, withInterceptorsFromDi } from "@angular/common/http";

// biome-ignore lint/style/useImportType: <explanation>
import {
  TranslocoModule,
  TranslocoPipe,
  TRANSLOCO_CONFIG,
  TranslocoConfig,
  TRANSLOCO_LOADER,
  TRANSLOCO_TRANSPILER,
  DefaultTranspiler,
  // NEW IMPORTS:
  TRANSLOCO_MISSING_HANDLER, // <--- Import the missing handler token
  TranslocoMissingHandler,
  Translation,
  TranslocoInterceptor,
  TRANSLOCO_INTERCEPTOR,
  TranslocoFallbackStrategy,
  TRANSLOCO_FALLBACK_STRATEGY,
  translocoConfig,
  provideTransloco, // <--- Import the default missing handler class
} from "@ngneat/transloco";

import { TranslocoHttpLoader } from "./manager/manager";

import { routes } from "./app.routes";
import Aura from "@primeuix/themes/aura";

@Injectable()
class MyCustomTranslocoMissingHandler implements TranslocoMissingHandler {
  /**
   * This method is called when a translation key is not found.
   * You can implement your own logic here.
   * For now, we'll just return the key itself.
   */
  handle(key: string, config: Translation | null | undefined): string {
    return key; // Default behavior: return the missing key
  }
}

@Injectable()
export class MyCustomTranslocoInterceptor implements TranslocoInterceptor {
  preSaveTranslationKey(key: string, value: string, lang: string): string {
    return key;
  }
  /**
   * This method is called after a translation is loaded.
   * We'll just return it as-is, performing no transformations.
   */
  preSaveTranslation(translation: Translation, lang: string): Translation {
    // You could add logic here to modify the translation,
    // e.g., for specific formatting or fallbacks.
    // console.log(`Intercepting translation for ${lang}:`, translation);
    return translation; // Return the translation without changes
  }
}

@Injectable() // Mark as injectable because it has dependencies (TRANSLOCO_CONFIG)
export class MyCustomTranslocoFallbackStrategy implements TranslocoFallbackStrategy {
  // biome-ignore lint/style/noParameterProperties: <explanation>
  constructor(@Inject(TRANSLOCO_CONFIG) private config: TranslocoConfig) {}
  getNextLangs(failedLang: string): string[] {
    return ["de"];
  }

  /**
   * Resolves the fallback language.
   * @param activeLang The language currently active (or being requested).
   * @param availableLangs The list of languages configured as available.
   * @returns The fallback language (e.g., 'en') or null if no fallback is needed/possible.
   */
  resolveFallback(activeLang: string, availableLangs: TranslocoConfig["availableLangs"]): string | null {
    // If the active language is actually available, no fallback is needed for the language itself.
    // This strategy specifically handles falling back on the language level.
    return "de";
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(), // Or provideZoneChangeDetection if you prefer Zone.js
    providePrimeNG(),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: ".p-dark" } },
    }),
    // provideRouter(routes), // Keep only if used

    provideHttpClient(withInterceptorsFromDi()), // Or provideHttpClient()
    TranslocoHttpLoader, // Assuming providedIn: 'root' is NOT set for the loader

    provideTransloco({
      config: translocoConfig({
        // <-- Ensure translocoConfig is used
        availableLangs: ["en", "de"], // Your available languages
        defaultLang: "de",
        reRenderOnLangChange: true,
        // Make sure missingHandler is an object, and useFallbackTranslation is defined
        missingHandler: {
          logMissingKey: true, // Optional: logs a warning if a key is missing
          useFallbackTranslation: true, // Set to true if you want to use fallback language
          allowEmpty: false, // Optional: allows empty string for missing keys
        },
        // ... other configurations like fallbackLang, flatten, etc.
      }),
      loader: TranslocoHttpLoader, // Your loader
    }),
    { provide: TRANSLOCO_LOADER, useClass: TranslocoHttpLoader },
    {
      provide: TRANSLOCO_TRANSPILER,
      useFactory: () => {
        return new DefaultTranspiler();
      },
    },
    // --- NEW PROVIDER FOR MISSING HANDLER ---

    {
      provide: TRANSLOCO_MISSING_HANDLER,
      useClass: MyCustomTranslocoMissingHandler, // <--- Use your custom class here!
    }, // Use the default handler provided by Transloco
    {
      provide: TRANSLOCO_INTERCEPTOR,
      useClass: MyCustomTranslocoInterceptor, // <--- Provide your new custom interceptor here
    },
    {
      provide: TRANSLOCO_FALLBACK_STRATEGY,
      useClass: MyCustomTranslocoFallbackStrategy, // <--- Provide your new custom fallback strategy here
    },
  ],
};
