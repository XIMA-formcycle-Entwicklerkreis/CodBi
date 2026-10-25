/**
 * Registers a standard configuration that applies the **Media.MultipleUpload** functionality onto
 * every upload field (`<input type="file">`) of the form, but allows only a **single file** to be
 * selected (`Maximum` = `1`).
 *
 * This is the single-file variant of {@link Holistic.Media.MultipleUpload}: the same drag & drop
 * area, styled upload button and maximizable preview, but the functionality rejects a selection of
 * more than one file (the configured `Maximum` is enforced by the functionality's own validation).
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_MultipleUpload_Single**).
 *
 * Upload fields that already carry a `data-cb-func` attribute are left untouched, so an explicitly
 * configured upload (e.g. a cropper or a dedicated parameterisation) is never overridden. Because
 * that marker is also set by the regular multiple-upload configuration, only ONE of the two
 * configurations should be activated per form. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '.CXUpload input[type="file"]:not(.CodBi_XCL):not(.CodBi_XCL_MultipleUpload_Single)',
    FUNC: "MEDIA.MULTIPLEUPLOAD",
    Maximum: "1",
  });
}

loadConfig();
