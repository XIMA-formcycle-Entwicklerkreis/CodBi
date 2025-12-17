import type {
  IMetadataClient,
  IMetadataCurrentUser,
  IMetadataForm,
  IMetadataFormLimits,
  IMetadataProject,
  IMetadataUrls,
  IMetadataUser,
  IXfcMetadata,
  IXUtil,
  getXfcMetaData,
} from "@de-xima/fc-form-renderer";

export interface TestState {
  xfcMetaData: IXfcMetadata;

  xmFormI18n: Record<string, string>;
  xUtilCallbacks: Map<string, Set<(...args: never[]) => unknown>>;
}

function createDefaultTestState(): TestState {
  return {
    xfcMetaData: DefaultXfcMetaData,
    xmFormI18n: {},
    xUtilCallbacks: new Map(),
  };
}

export function createDefaultXfcMetaDataClient(): IMetadataClient {
  return {
    id: 1,
    name: "[ANONYMOUS]",
  };
}

export function createDefaultXfcMetaDataForm(): IMetadataForm {
  return {
    id: 1,
    isActive: true,
    versionNumber: 1,
  };
}

export function createDefaultXfcMetaDataProject(): IMetadataProject {
  return {
    currentForm: createDefaultXfcMetaDataForm(),
    description: "",
    id: 1,
    status: "",
    title: "New form",
  };
}

export function createDefaultXfcMetaDataLimits(): IMetadataFormLimits {
  return {
    singleFileUpload: null,
  };
}

export function createDefaultXfcMetaDataUrls(): IMetadataUrls {
  return {
    ajax_upload: "",
    appointment_freeslots: "",
    attachment: "",
    authLoginBase: "",
    authLogout: "",
    authLogoutBase: "",
    context: "",
    counter_client: "",
    datasource_db: "",
    dataquery_db: "",
    dataquery_ldap: "",
    datasource_csv: "",
    datasource_json: "",
    datasource_xml: "",
    keepalive: "",
    plugin: "",
    previewAction: "",
    request: "",
    requestBase: "",
    submitAction: "",
    template: "",
  };
}

export function createDefaultXfcMetaDataCurrentUser(): IMetadataCurrentUser {
  return {};
}

export function createDefaultXfcMetaDataUser(): IMetadataUser {
  return {
    displayName: null,
    familyName: null,
    firstName: null,
    gender: "UNSPECIFIED",
    groups: [],
    hasProfile: false,
    mail: null,
    roles: [],
    title: "KEINE_ANGABE",
    universalReferenceId: "ANONYMOUS",
    userName: null,
  };
}

export const DefaultXfcMetaData: IXfcMetadata = {
  attachments: [],
  currentClient: createDefaultXfcMetaDataClient(),
  currentLanguage: "en",
  currentLanguageTag: "en",
  currentProcess: {},
  currentProject: createDefaultXfcMetaDataProject(),
  currentSessionFRID: "0",
  currentSessionID: "0",
  currentUser: createDefaultXfcMetaDataCurrentUser(),
  limits: createDefaultXfcMetaDataLimits(),
  pluginResults: {},
  renderStatus: "",
  requestType: "provide",
  serverTime: new Date(0),
  sessionTimeout: 1800,
  urlParams: {},
  urls: createDefaultXfcMetaDataUrls(),
  user: createDefaultXfcMetaDataUser(),
  currentSessionSID: "0",
  serverValidationErrors: {},
};

export let TestState: TestState = createDefaultTestState();

export function resetTestState(): void {
  TestState = createDefaultTestState();
}
