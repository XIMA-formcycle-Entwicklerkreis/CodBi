/** Minimal CodBi runtime type declarations for standalone element compilation. */
interface CodbiGlobal {
    registerFunctionality(id: string, init: (toLoad: any, toProcess: Element) => any): boolean;
    extendFunctionality(id: string, init: (toLoad: any, toProcess: Element) => any): boolean;
    registerEP(
        id: string,
        generator: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>,
    ): boolean;
    extendEP(
        id: string,
        generator: (params: Array<string>) => Array<unknown> | Promise<Array<unknown>> | unknown | Promise<unknown>,
    ): boolean;
    loadConfig(toLoad: { targets: string;[key: string]: unknown }): void;
    loadConfigs(toLoad: Array<{ targets: string;[key: string]: unknown }>): void;
    log(level: string, message: string): void;
}

interface Window {
    codbi: CodbiGlobal;
}
