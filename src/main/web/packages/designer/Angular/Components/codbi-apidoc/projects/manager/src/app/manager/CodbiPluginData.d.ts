/** One positional parameter of an **E**lement **P**laceholder (mirrors the form package's EPParamSpec). */
interface CodbiEPParamSpec {
  /** The 1-based position of this parameter. */
  index: number;
  /** An optional human readable label. */
  name?: string;
  /** The datatype hint (defaults to "any"). */
  type: string;
  /** Whether the parameter may be omitted. */
  optional?: boolean;
  /** Whether further trailing parameters may follow. */
  variadic?: boolean;
  /** A short human readable description. */
  description?: string;
}
/** A resolved **E**lement **P**laceholder signature (mirrors the form package's EPSignature). */
interface CodbiEPSignature {
  /** The ordered parameter specifications. */
  params: Array<CodbiEPParamSpec>;
  /** The datatype hint for the EP's result. */
  returnType?: string;
  /** Where the signature originated from. */
  source: string;
}
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
        /** Stores a {@link boolean } stating whether this entry is a local or a native one. */
        local: boolean;
        /** Stores the JS-Code for that CodBi-Element. */
        Code: string | undefined;
      };
    };
    /** Stores the available **CodBi-Functionalities**. */
    detFunctionalities: {
      [key: string]: {
        /** Stores the either the URL to or the actual HTML of the documentation. */
        Description: string;
        /**
         * The short (one-sentence) description of the functionality, shown as the tooltip of the
         * parameter functionality group header in the config panel (string or per-language map). */
        Summary?: string | { [lang: string]: string };
        /** Stores the parameter that this **CodBi-Functionality** provides. */
        Parameter: { [key: string]: string };
        /**
         * The FORMCYCLE widget class names this functionality is intended for (e.g. `XFieldSet`).
         * An empty/absent list means "any element" (fail-open). Populated by the build-time
         * generator (Tier A) or the local API-doc manager (Tier B). */
        formElements?: Array<string>;
        /** The `@SupportedFormelementtype` spec (widget classes + per-type property constraints). */
        supportedFormelementtypes?:
          | string
          | Array<string>
          | { [type: string]: { [property: string]: string | Array<string> } | undefined };
        /** The rich requirements (widget classes + per-type property constraints); absent = any. */
        requirements?: Array<{ type: string; properties?: { [property: string]: Array<string> } }>;
        /** Stores a {@link boolean } stating whether this entry is a local or a native one. */
        local: boolean;
        /** Stores the JS-Code for that CodBi-Element. */
        Code: string | undefined;
      };
    };
    /**
     * Stores the **form-element-type** metadata of the CodBi functionalities, keyed by (lowercase)
     * functionality id. Published by the build-time generator or the local API-doc manager. */
    funcMeta?: {
      [key: string]: {
        /** The widget class names the functionality applies to (empty = any). */
        formElements: Array<string>;
        /** The rich requirements (widget classes + per-type property constraints); absent = any. */
        requirements?: Array<{ type: string; properties?: { [property: string]: Array<string> } }>;
        /** The tier that produced this entry. */
        source?: string;
      };
    };
    /** Stores the available Element-Placeholder. */
    detElementplaceholder: {
      [key: string]: {
        /** Stores the either the URL to or the actual HTML of the documentation. */
        Description: string;
        /** Stores the parameter that this **Element-Placeholder** provides. */
        Parameter?: { [key: string]: string };
        /** Stores the typed signature resolved by the build-time generator (Tier A) or the manager (Tier B). */
        Signature?: CodbiEPSignature;
        /** A very short (one-sentence) description of the **E**lement **P**laceholder. */
        Summary?: string;
        /** Stores a {@link boolean } stating whether this entry is a local or a native one. */
        local: boolean;
        /** Stores the JS-Code for that CodBi-Element. */
        Code: string | undefined;
      };
    };
    /** Stores the resolved **E**lement **P**laceholder signatures keyed by (lowercase) EP id. */
    epSignatures?: { [key: string]: CodbiEPSignature };
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
    /** Stores a list of CodBi-Elements that're currently available in the Plugin's local code repository. */
    localCode: string;
    /** Re-Populates the **Standard-Configuration** listing displayed in the form designer's form properties tab.*/
    populateStandards: () => void;
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
    managerClosed: () => void;
    /**
     * Called whenever the API-Doc Manager's **Maximize**-{@link HTMLButtonElement } is clicked.
     * Toggles the manager host container's fullscreen (`--maximized`) state. */
    managerMaximize: () => void;
    /** Gets an API-Doc Manager translation resource.*/
    retrieveManagerTranslatedResource(id: string): string;
    /**
     * Sets the selected standard configurations in the MultiSelect editor and fires the
     * `set-property` callback to update the designer's form property model.
     * Only present after the form properties panel has been opened and MultiSelect instantiated. */
    setStandardsValue?: (csv: string) => void;
    /**
     * Queued standards CSV to apply when the MultiSelect editor is next instantiated
     * (i.e. when the form properties panel opens). */
    pendingStandards?: string;
  };
}
