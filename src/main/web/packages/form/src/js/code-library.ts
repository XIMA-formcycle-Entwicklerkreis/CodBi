import { getJQuery, getXUtil } from "@de-xima/fc-form-renderer";

/**
 * When the form finished loading. Prepares the form, registering all event
 * listeners etc.
 */
export function onDocumentReady(): void {
  const $ = getJQuery();

  const itemCount = $(".XItem").length;
  console.log(`Form contains ${itemCount} items`);

  getXUtil().on("submit", (params) => {
    console.log(`Form about to be submitted has ID ${params.form.id}`);
    console.log(`Submission is blocked: ${params.submissionBlocked}`);
    return { preventSubmission: false };
  });
}
