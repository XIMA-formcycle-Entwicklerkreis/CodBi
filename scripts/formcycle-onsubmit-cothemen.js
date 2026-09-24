/**
 * formcycle-onsubmit-cothemen.js
 *
 * Formcycle client-side submit handler for the repeatable container `coThemen`.
 *
 * On submit it collects the content of the two fields
 *   - tfThemaUeberschrift (heading)
 *   - taSachverhalt       (body / facts)
 * from EVERY repetition of the container `coThemen` and builds a JSON array
 * of objects with the properties "Ueberschrift" and "Sachverhalt".
 *
 * The resulting JSON is written into the form field `tfJSON` (make it a hidden
 * field if it shouldn't be visible) so it is serialized and sent with the form.
 *
 * SUBMISSION BLOCKING (matches the pattern used in src/.../html.panel.ts):
 * The submit handler is registered via `getXUtil().on("submit", (params) => {...})`.
 * To PREVENT the submission, return `{ preventSubmission: true }`. To allow it,
 * return `{ preventSubmission: false }`. `params.submissionBlocked` tells you
 * whether another handler already blocked the submission.
 *
 * `getXUtil` is imported from "@de-xima/fc-form-renderer".
 * Import it at the top of your module:
 *   import { getXUtil, getJQuery } from "@de-xima/fc-form-renderer";
 */

getXUtil().on("submit", (params) => {
  const { submissionBlocked } = params as { submissionBlocked?: boolean };

  // If another handler already decided to block the submission, bail out early.
  if (submissionBlocked) {
    return { preventSubmission: true };
  }

  // Find every repetition of the container `coThemen`.
  // Adjust the selector if your markup uses a different tag/class.
  const $ = getJQuery();
  const themen: Array<{ Ueberschrift: string; Sachverhalt: string }> = [];

  $(".coThemen").each(function () {
    const $container = $(this);

    // Read the heading field inside this container repetition.
    const ueberschrift: string = $container
      .find('input[name="tfThemaUeberschrift"]')
      .first()
      .val() || "";

    // Read the body field inside this container repetition.
    const sachverhalt: string = $container
      .find('textarea[name="taSachverhalt"]')
      .first()
      .val() || "";

    themen.push({
      Ueberschrift: ueberschrift,
      Sachverhalt: sachverhalt,
    });
  });

  // Write the resulting JSON array into the form field `tfJSON`.
  const json = JSON.stringify(themen);
  $('input[name="tfJSON"], textarea[name="tfJSON"]').first().val(json);

  // Allow the submission to proceed (we are only collecting data, not blocking).
  return { preventSubmission: false };
});
