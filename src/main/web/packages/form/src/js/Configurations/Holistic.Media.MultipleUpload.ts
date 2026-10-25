/**
 * Registers a standard configuration that applies the **Media.MultipleUpload** functionality onto
 * every upload field (`<input type="file">`) of the form.
 *
 * This makes each upload field accept several files, renders a drag & drop area with a styled upload
 * button and shows an overlapping-card preview of the selected files (maximizable and with the
 * possibility to remove single files again).
 *
 * General excluding CSS-Class available (**CodBi_XCL**).
 * Exclusive excluding CSS-Class available (**CodBi_XCL_MultipleUpload**).
 *
 * Upload fields that already carry a `data-cb-func` attribute are left untouched, so an explicitly
 * configured upload (e.g. a cropper or a dedicated parameterisation) is never overridden. */
export function loadConfig(): void {
  window.codbi.loadConfig({
    targets: '.CXUpload input[type="file"]:not(.CodBi_XCL):not(.CodBi_XCL_MultipleUpload)',
    FUNC: "MEDIA.MULTIPLEUPLOAD",
    config: "",
  });
}

loadConfig();
