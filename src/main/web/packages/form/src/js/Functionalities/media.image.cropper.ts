// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Cropper
import Cropper from "cropperjs";
// #endregion Cropper
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link Media_Image_Cropper.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Media_Image_Cropper {
  /**
   * This functionality provides an imagecropper (https://fengyuanchen.github.io/cropperjs/).
   * In order for it to work also in repetitive Containers "data-cb-func" gotta be set on the first outermost container
   * that is not repetitive itself but lies with the repetitive one.
   *
   * Config Parameter:
   *  - Container:    The {@link HTMLDivElement } that shall contain the Cropper-UI.
   *  - Target:       The {@link HTMLImageElement } that will contain the cropped image when
   *                  clicking the "Updater".
   *  - File:         The {@link HTMLInputElement } of type = "file" where to select the image to crop.
   *  - Updater:      The CSS-Selector specifying the {@link HTMLButtonElement } that, on click, will cause an update of the "Target".
   *  - AspectRatio:  The optional cropper's aspectratio to retain (e.g. 16 / 9 or 4 / 3 ).
   *                  Setting this value will make the cropper non-resizable.
   *
   * @param toLoad    Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(REGEX.stdExp.cssSelector, "container")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "target")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "file")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "updater")
    toLoad: { [key: string]: unknown },
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
    // biome-ignore lint/style/noNonNullAssertion: Was checked on line 47.
    fileInput!.addEventListener("change", (event: Event): undefined => {
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

          const aspectRatio: number | undefined =
            toLoad.aspectratio &&
            typeof toLoad.aspectratio === "string" &&
            toLoad.aspectratio.indexOf("/") !== -1 &&
            toLoad.aspectratio.indexOf("/") !== toLoad.aspectratio.length - 1 &&
            toLoad.aspectratio.length >= 3
              ? // biome-ignore lint/security/noGlobalEval: <explanation>
                eval(toLoad.aspectratio as string)
              : undefined;
          const rectContainer = newImage.getBoundingClientRect();

          cropper = new Cropper(newImage, {
            template: `
                <cropper-canvas style = "height : 100% ; width : 100% ;" background >
                  <cropper-image  initial-center-size = "contain" rotatable scalable skewable translatable
                                  @transform          = "onCropperImageTransform">
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle></cropper-image>
                  <cropper-shade hidden></cropper-shade>
                  <cropper-selection
                    width = "${
                      aspectRatio
                        ? rectContainer.width / rectContainer.height > aspectRatio
                          ? rectContainer.height * aspectRatio
                          : rectContainer.width
                        : 400
                    }"
                     height = "${
                       aspectRatio
                         ? rectContainer.width / rectContainer.height <= aspectRatio
                           ? rectContainer.width / aspectRatio
                           : rectContainer.width
                         : 300
                     }" movable ${aspectRatio ? "" : "resizable zoomable"}>
                    <cropper-grid role = "grid" bordered covered></cropper-grid>
                    <cropper-handle action      = "move"
                                    theme-color = "rgba( 255, 255, 255, 0.35 )"></cropper-handle>
                    ${
                      aspectRatio
                        ? ""
                        : `
                        <cropper-crosshair centered></cropper-crosshair>
                        <cropper-handle action = "n-resize"></cropper-handle>
                        <cropper-handle action = "e-resize"></cropper-handle>
                        <cropper-handle action = "s-resize"></cropper-handle>
                        <cropper-handle action = "w-resize"></cropper-handle>
                        <cropper-handle action = "ne-resize"></cropper-handle>
                        <cropper-handle action = "nw-resize"></cropper-handle>
                        <cropper-handle action = "se-resize"></cropper-handle>
                        <cropper-handle action = "sw-resize">`
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
          const canvas = cropper.getCropperCanvas();
          console.log("V:", target, updater, container);
          if (canvas) {
            canvas
              .$toCanvas({
                width: canvas?.clientWidth,
                height: canvas?.clientHeight,
              })
              .then((canvas: HTMLCanvasElement) => {
                target?.setAttribute("src", canvas.toDataURL());
              });
          }
        }
      });
    }
    // #endregion Register proper event to update the "target".
  }
  // #region Initialization
  /**
   * States whether this {@link Media_Image_Cropper } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Media.Image.Cropper", Media_Image_Cropper.functionality);
  })();
  // #endregion Initialization
}
