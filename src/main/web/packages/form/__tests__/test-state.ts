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

/**
 * Global state when running tests, for features that require global state.
 * For example, the current language of the form designer is stored here.
 */
export interface TestState {
  /**
   * The meta data provided by the server to a rendered form.
   */
  xfcMetaData: IXfcMetadata;

  /**
   * The localized messages as entered by the user in the backend menu
   * `Files & templates` -> `I18N variables`.
   */
  xmFormI18n: Record<string, string>;
  /**
   * Callbacks that were registered via {@link IXUtil.on}.
   */
  xUtilCallbacks: Map<string, Set<(...args: never[]) => unknown>>;
}

function createDefaultTestState(): TestState {
  return {
    xfcMetaData: DefaultXfcMetaData,
    xmFormI18n: {},
    xUtilCallbacks: new Map(),
  };
}

/**
 * Default client for {@link IXfcMetadata.client}.
 */
export function createDefaultXfcMetaDataClient(): IMetadataClient {
  return {
    id: 1,
    name: "[ANONYMOUS]",
  };
}

/**
 * Default client for {@link IMetadataProject.currentForm}.
 */
export function createDefaultXfcMetaDataForm(): IMetadataForm {
  return {
    id: 1,
    isActive: true,
    versionNumber: 1,
  };
}

/**
 * Default client for {@link IXfcMetadata.currentProject}.
 */
export function createDefaultXfcMetaDataProject(): IMetadataProject {
  return {
    currentForm: createDefaultXfcMetaDataForm(),
    description: "",
    id: 1,
    status: "",
    title: "New form",
  };
}

/**
 * Default client for {@link IXfcMetadata.limits}.
 */
export function createDefaultXfcMetaDataLimits(): IMetadataFormLimits {
  return {
    singleFileUpload: null,
  };
}

/**
 * Default client for {@link IXfcMetadata.urls}.
 */
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

/**
 * Default client for {@link IXfcMetadata.currentUser}.
 */
export function createDefaultXfcMetaDataCurrentUser(): IMetadataCurrentUser {
  return {};
}

/**
 * Default client for {@link IXfcMetadata.user}.
 */
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

/**
 * Default data for {@link getXfcMetaData}.
 */
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

/**
 * Global state when running tests, for features that require global state.
 * For example, the current language of the form designer is stored here.
 */
export let TestState: TestState = createDefaultTestState();

/**
 * Resets {@link TestState} to its default values.
 */
export function resetTestState(): void {
  TestState = createDefaultTestState();
}
