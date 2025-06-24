interface Window {
  // Declare properties you're adding to window
  CodbiPluginData: {
    detStandards: { [key: string]: { Description: string; Active: boolean } };
    detFunctionalities: [{ Description: string }];
    detElementplaceholder: [{ Description: string }];
    docsAPI: [{ [key: string]: string }];
    fileListing: Array<string>;
    fslElementplaceholder: Array<string>;
    fslFunctionalities: Array<string>;
  };
}
