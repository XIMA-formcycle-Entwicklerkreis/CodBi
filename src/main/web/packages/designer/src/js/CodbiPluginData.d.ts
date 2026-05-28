/**
 * Augments the {@link window } in order to provide globally available
 * CodBi-Related information. */
interface Window {
  /** Stores the currently used overall language. */
  XFC_METADATA: {
    currentLanguage: string;
  };
  /** Stores data related to the CodBi. */
  CodbiPluginData: {
    /** Stores the Standard-Configurations available. */
    detStandards: {
      [key: string]: {
        /** Stores the either the URL to or the actual HTML of the documentation. */
        Description: string;
        /** Stores a boolean indicating whether this configuration is selected as to be used in the form designer. */
        Active: boolean;
        /** Stores the CSS-Classes that this configuration provides. */
        classes: { [key: string]: string };
        /** Stores the global variables that this configuration provides. */
        globals: { [key: string]: string };
      };
    };
    /** Stores the available **CodBi-Functionalities**. */
    detFunctionalities: {
      [key: string]: {
        /** Stores the either the URL to or the actual HTML of the documentation. */
        Description: string;
        /** Stores the parameter that this **CodBi-Functionality** provides. */
        Parameter: { [key: string]: string };
      };
    };
    /** Stores the available Element-Placeholder. */
    detElementplaceholder: {
      [key: string]: {
        /** Stores the either the URL to or the actual HTML of the documentation. */
        Description: string;
        /** Stores the parameter that this **Element-Placeholder** provides. */
        Parameter?: { [key: string]: string };
      };
    };
    /** Stores the URLs pointing to the root of localized API-Documentations. */
    docsAPI: {
      [key: string]: string;
    };
    /** Stores a CSV stating the actual file's names where the code for **Standard-Configurations** resides. */
    fileListing: string;
    /** Stores a CSV stating the actual file's names where the code for **Element-Placeholder** resides. */
    fslElementplaceholder: string;
    /** Stores a CSV stating the actual file's names where the code for **CodBi-Functionalities** resides. */
    fslFunctionalities: string;
    /** Re-Populates the **Standard-Configuration** listing displayed in the form designer's form properties tab.*/
    populateStandards: () => void;
    /**
     * Programmatically sets the active standard configurations CSV, updates the MultiSelect
     * checkboxes, and fires the **set-property** callback so the form designer persists the change.
     * Only available after the MultiSelect editor has been instantiated (form properties panel opened).
     *
     * @param csv Comma-separated list of active standard configuration names.
     */
    setStandardsValue?: (csv: string) => void;
    /**
     * Standards CSV computed by the AI assistant while the form properties panel was closed.
     * Consumed and cleared by MultiSelect on its next instantiation (when the panel opens).
     */
    pendingStandards?: string;
    /**
     * Updates the {@link EPManager }'s available options.
     *
     * @param options The CSV containing the entire now available options. */
    updateEPManager: (options: string) => void;
    /**
     * Updates the {@link SVManager }'s available options.
     *
     * @param options The CSV containing the entire now available options. */
    updateSVManager: (options: string) => void;
    /**
     * Called whenever the API-Doc Manager's **Close**-{@link HTMLButtonElement } is clicked. */
    managerClosed: (event: Event) => void;
    /** Gets an API-Doc Manager translation resource.*/
    retrieveManagerTranslatedResource(id: string): string;
  };
}
