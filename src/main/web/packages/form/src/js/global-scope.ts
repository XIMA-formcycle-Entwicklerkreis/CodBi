/**
 * The global codbi object, available via `window.codbi`. Should only be used
 * when it is absolutely necessary to expose symbols externally. Use ESM imports
 * otherwise.
 */
export interface CodbiGlobal {
  /**
   * The configuration template for the form, as configured by the user in the
   * form designer.
   */
  configTemplate: ConfigTemplate | undefined;
}

/**
 * The configuration template for the form, as configured by the user in the
 * form designer.
 */
export interface ConfigTemplate {
  /**
   * The technical name of this template.
   */
  readonly name: string;
}

declare global {
  interface Window {
    /**
     * The global codbi object, available via `window.codbi`. Should only be used
     * when it is absolutely necessary to expose symbols externally. Use ESM imports
     * otherwise.
     */
    codbi: CodbiGlobal;
  }
}

export function createCodbiGlobal(): CodbiGlobal {
  return {
    configTemplate: undefined,
  };
}
