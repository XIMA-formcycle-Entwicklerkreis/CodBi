interface Window {
  XFC_METADATA: {
    currentLanguage: string;
  };
  // Declare properties you're adding to window
  CodbiPluginData: {
    detStandards: {
      [key: string]: {
        Description: string;
        Active: boolean;
        classes: { [key: string]: string };
        globals: { [key: string]: string };
      };
    };
    detFunctionalities: { [key: string]: { Description: string } };
    detElementplaceholder: { [key: string]: { Description: string } };
    docsAPI: { [key: string]: string };
    fileListing: string;
    fslElementplaceholder: string;
    fslFunctionalities: string;
    populateStandards: () => void;
    updateEPManager: (options: string) => void;
    updateSVManager: (options: string) => void;
  };
}
