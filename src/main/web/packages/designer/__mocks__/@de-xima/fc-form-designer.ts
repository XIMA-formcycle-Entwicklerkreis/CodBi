import { TestState } from "../../__tests__/test-state.js";

type Module = typeof import("@de-xima/fc-form-designer");

export const getLanguage: Module["getLanguage"] = () => TestState.language;

export const registerCustomFormProperty: Module["registerCustomFormProperty"] = (propertyDescriptor, location) =>
  TestState.customFormProperties.push([propertyDescriptor, location]);

export const registerCustomFormCategory: Module["registerCustomFormCategory"] = (category, location) =>
  TestState.customFormCategories.push([category, location]);
