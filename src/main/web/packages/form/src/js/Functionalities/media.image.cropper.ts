// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Cropper
import Cropper from "cropperjs";
// #endregion Cropper
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF.js";
import { TYPE } from "xdbc/src/DBC/TYPE.js";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
import { OR } from "xdbc/src/DBC/OR.js";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link Media_Image_Cropper.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Media_Image_Cropper {
  /** Stores often used {@link RegExp }s. */
  public static stdExp: { [key: string]: RegExp } = {
    aspectRatio: /^\d+\s*\/\s*\d+$/,
  };
  /**
   * This functionality provides an image-cropper (https://fengyuanchen.github.io/cropperjs/).
   * In order for it to work also in repetitive Containers "data-cb-func" gotta be set on the first outermost container
   * that is not repetitive itself but lies with the repetitive one.
   *
   * Config Parameter:
   *  - Container:        The CSS-Selector of the {@link HTMLDivElement } that shall contain the Cropper-UI.
   *  - Target:           The CSS-Selector of the {@link HTMLImageElement } that will contain the cropped image after
   *                      clicking the "Updater".
   *  - File:             The CSS-Selector of the {@link HTMLInputElement } of type = "file" where to select the image to crop.
   *  - Updater:          The CSS-Selector specifying the {@link HTMLButtonElement } that, on click, will cause an update of the "Target".
   *  - ImageURL          The CSS-Selector specifying the {@link HTMLInputElement } that shall receive the image data.
   *  - AspectRatio:      The optional cropper's aspect-ratio to retain (e.g. 16 / 9 or 4 / 3 ).
   *                      Setting this value will make the cropper non-resizable.
   *  - OutputWidth       The width in pixel for canvas where the cropped area shall be reflected.
   *                      If provided as a string the minimum value is 100. Defaults to 1000px.
   *  - CSSCropperHandle  The CSS that shall be applied on each <cropper-handle> (defaults to background-color: darkorange ;).
   *
   * @param toLoad Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "container :: target :: file :: updater :: imageurl :: csscropperhandle")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "container")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "target")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "file")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "updater")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "imageurl")
    @TYPE.PRE("string | number", "aspectratio :: outputwidth")
    @IF.PRE(new TYPE("string"), new REGEX(Media_Image_Cropper.stdExp.aspectRatio), "aspectratio")
    @IF.PRE(new TYPE("string"), new REGEX(/[0-9][0-9][0-9]+/), "outputwidth")
    toLoad: { [key: string]: unknown },

    @OR.PRE(
      [new INSTANCE(HTMLDivElement), new INSTANCE(HTMLFieldSetElement)],
      undefined,
      "Is it not a <div> or <fieldset> that is tagged with this functionality?",
    )
    toProcess: Element,
  ): void {
    const container: HTMLElement | undefined = toProcess.querySelector(toLoad.container as string);
    // Do nothing if there's no image container.
    if (container === undefined) {
      new CodBiError(`The container "${toLoad.container}" is not available`);
    }

    const fileInput: HTMLElement | undefined = toProcess.querySelector(toLoad.file as string);
    // Do nothing if "file"-CodBi-Parameter doesn't select a "HTMLInputElement".
    if (
      fileInput === undefined ||
      fileInput === null ||
      fileInput.tagName.toLowerCase() !== "input" ||
      fileInput.getAttribute("type") !== "file"
    ) {
      new CodBiError(`The file picker "${toLoad.file}" is either not available or not a file picker`);

      return;
    }

    let cropper: Cropper | undefined;
    // #region Register event to properly react on file changes.
    fileInput.addEventListener("change", (event: Event): undefined => {
      if ((fileInput as HTMLInputElement).files && (fileInput as HTMLInputElement).files.length > 0) {
        const file: File | undefined = (fileInput as HTMLInputElement).files[0];

        if (file) {
          container.innerHTML = ""; // Clear previous cropper, if existent.

          const newImage: HTMLImageElement = document.createElement("img");
          newImage.src = window.URL.createObjectURL(file);

          newImage.setAttribute(
            "style",
            `width : ${toLoad.maxwidth ? toLoad.maxwidth : 500}px ; height : ${toLoad.maxheight ? toLoad.maxheight : 500}px ;`,
          );
          newImage.setAttribute("data-name", "CodBi_Media_Imagecropper_Bild");
          container.appendChild(newImage);
          // #region Calculate aspect ration, if provided
          const aspectRatio: number | undefined =
            toLoad.aspectratio && typeof toLoad.aspectratio === "string" && toLoad.aspectratio.indexOf("/") !== -1
              ? divide(toLoad.aspectratio as string)
              : undefined;
          // #endregion Calculate aspect ration, if provided
          const rectContainer = newImage.getBoundingClientRect();

          toLoad.csscropperhandle = toLoad.csscropperhandle
            ? toLoad.csscropperhandle
            : "background-color: darkorange ;";
          cropper = new Cropper(newImage, {
            template: `
                <cropper-canvas style = "height : 100% ; width : 100% ;" background >
                  <cropper-image  initial-center-size = "contain" rotatable scalable skewable translatable
                                  @transform          = "onCropperImageTransform">
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle></cropper-image>
                  <cropper-shade hidden></cropper-shade>
                  <cropper-selection
                    width = "100"
                    height = "100"
                    movable ${aspectRatio ? "" : "resizable zoomable"}>
                    <cropper-grid role = "grid" bordered covered></cropper-grid>
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle>
                    ${
                      aspectRatio
                        ? ""
                        : `
                        <cropper-crosshair centered></cropper-crosshair>
                        <cropper-handle action = "n-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "e-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "s-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "w-resize"   style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "ne-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "nw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "se-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>
                        <cropper-handle action = "sw-resize"  style = "${toLoad.csscropperhandle}"></cropper-handle>`
                    }
                    </cropper-handle></cropper-selection></cropper-canvas>`,
          });
        }
      }
    });
    // #endregion Register event to properly react on file changes.
    // #region Register proper event to update the "target".
    for (const updater of toProcess.parentElement.querySelectorAll(toLoad.updater as string)) {
      updater.addEventListener("click", (event: Event): undefined => {
        if (cropper && toLoad.target && typeof (toLoad.target === "string")) {
          const target = toProcess.parentElement.querySelector(toLoad.target as string);
          const canvas = cropper.getCropperSelection();

          if (canvas) {
            const targetBoundingClientRect = target.getBoundingClientRect();

            canvas
              .$toCanvas({
                width: toLoad.outputwidth ? (toLoad.outputwidth as number) : 1000,
              })
              .then((canvas: HTMLCanvasElement) => {
                target.setAttribute(
                  "width",
                  (Number.parseInt(canvas?.getAttribute("width")) * window.devicePixelRatio * 4 || 1).toString(),
                );
                target.setAttribute(
                  "width",
                  (Number.parseInt(canvas?.getAttribute("height")) * window.devicePixelRatio * 4 || 1).toString(),
                );
                const urlImage = canvas.toDataURL("image/jpeg", 1.0);

                if (toLoad.imageurl) {
                  const imageURLReceiver = toProcess.querySelector(toLoad.imageurl as string);

                  if (imageURLReceiver) {
                    (imageURLReceiver as HTMLInputElement).value = urlImage;
                  }
                }

                target?.setAttribute("src", urlImage);
              });
          }
        }
      });
    }
    // #endregion Register proper event to update the "target".
  }
}

window.codbi.registerFunctionality("Media.Image.Cropper", Media_Image_Cropper.functionality.bind(Media_Image_Cropper)); // Initialization
// #region Helper
const divide = (divisionString): number => {
  try {
    const parts = divisionString.split(/\s*\/\s*/);

    if (parts.length !== 2) {
      throw new Error("Input format is incorrect. Expected 'number / number'.");
    }

    const numerator = Number.parseFloat(parts[0]);
    const denominator = Number.parseFloat(parts[1]);

    if (
      Number.isNaN(numerator) ||
      Number.isNaN(denominator) ||
      !Number.isFinite(numerator) ||
      !Number.isFinite(denominator)
    ) {
      throw new Error("The numerator or denominator is not a valid number.");
    }

    if (denominator === 0) {
      throw new Error("Cannot divide by zero.");
    }

    return numerator / denominator;
  } catch (X) {
    throw new CodBiError(`Error: ${(X as Error).message}`);
  }
};
// #endregion Helper
