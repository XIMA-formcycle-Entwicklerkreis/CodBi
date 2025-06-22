interface Window {
  // Declare properties you're adding to window
  CodbiPluginData: {
    detFunctionalities: [{ Description: string }];
    detElementplaceholder: [{ Description: string }];
    docsAPI: [{ [key: string]: string }];
    fileListing: Array<string>;
    fslElementplaceholder: Array<string>;
    fslFunctionalities: Array<string>;
  };
}
