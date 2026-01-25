/// <reference path="../global-scope.ts" />
//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope";
import { TYPE } from "xdbc/src/DBC/TYPE";
//endregion XDBC
//endregion Imports

/**
 * Provides the {@link AI_OCR_CAM.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de)
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_OCR_CAM {
  /**
   * This functionality captures images from a device camera and scans them using the Tesseract AI-OCR engine.
   * The camera-captured image can be printed, extracted, or verified based on the configured mode.
   *
   * #### Config Parameter:
   *  - **Mode**:                 Either **Print**, **Verify** or **Extract Fields**.
   *  - **Pattern**:              The {@link RegEx } to use to either extract the substrings from the scanned text or to verify that
   *                              the scanned text matches the pattern.
   *  - **FieldPattern_...**:     The {@link RegEx } to use to extract the substrings from the scanned text for that field.
   *  - **Separator**:            If **Mode** is set to **Extract Fields**, this parameter defines the separator for the results.
   *                              Default is a comma.
   *  - **RegExFlags**:           Optional regex flags to apply to all patterns (e.g., "i" for case-insensitive, "m" for multiline,
   *                              "s" for dotall). Multiple flags can be combined (e.g., "im"). These flags are transmitted to the
   *                              Tesseract servlet and applied to pattern matching.
   *  - **Preprocess**:           Optional boolean flag to enable image preprocessing before OCR. When set to **true**, applies
   *                              grayscale conversion, adaptive binarization (Otsu's method), and noise reduction to improve
   *                              text recognition accuracy. Default is **false**.
   *  - **InvalidImageText**:     The text to display if the image does not comply to the specified **Pattern** in mode **Verify**.
   *  - **WrongFileMessage**:     The text to display for the manual verification checkbox label in mode **Verify**.
   *  - **ProcessingImageText**:  The text to display on the capture button while processing the image.
   *
   * ### CSS Classes:
   * - **CodBi_AI_Tesseract_Receiver**: Elements with this class are used to receive the scanned text in **Print** mode.
   * - **CodBi_AI_OCR_Receiver**: Elements with this class and **data-cb-Field** attribute are used to receive extracted fields.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(/^[0-9A-Za-z_-]{40}$/, "sitekey")
    @REGEX.PRE(REGEX.stdExp.url, "script")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): void {
    const container = toProcess as HTMLDivElement;
    const $ = getJQuery();
    const tsMode = TYPE.tsCheck<string>(toLoad.mode, "string").toLowerCase();
    const tsProcessingimagetext = toLoad.processingimagetext
      ? TYPE.tsCheck<string>(toLoad.processingimagetext, "string")
      : "Verarbeite...";
    const tsInvalidimagetext = toLoad.invalidimagetext
      ? TYPE.tsCheck<string>(toLoad.invalidimagetext, "string")
      : "One or more of the images you selected did not contain the expected text.";

    // #region Initialize camera container and controls
    const wrapper = document.createElement("div");
    wrapper.style.cssText = "display: flex; justify-content: center; align-items: center; width: 100%;";

    const cameraContainer = document.createElement("div");
    cameraContainer.id = `CodBi_AI_OCR_CAM_Container_${Math.random().toString(36).substr(2, 9)}`;
    cameraContainer.classList.add("CodBi_AI_OCR_CAM_Container");

    // #region Define CSS
    const style = document.createElement("style");
    style.textContent = `
      .CodBi_AI_OCR_CAM_Container { position: relative ; width: 100% ; max-width: 400px ; display: flex ;
        flex-direction: column ;}

      .CodBi_AI_OCR_CAM_VideoWrapper { position: relative ;}

      .CodBi_AI_OCR_CAM_VideoContainer { position: relative ;}

      .CodBi_AI_OCR_CAM_Container video { width: 100% ; border: 1px solid #ccc ; display: block ;
        box-shadow: 0 0 .5em black ; border: none ;}

      .CodBi_AI_OCR_CAM_CapturedImage { width: 100% ; border: 1px solid #ccc ; display: none ;
        box-shadow: 0 0 .5em black ; border: none ; object-fit: contain ; margin-top: 8px ;}

      .CodBi_AI_OCR_CAM_CapturedImage.visible { display: block ;}

      .CodBi_AI_OCR_CAM_Select { position: absolute ; top: 0 ; left: 0 ; width: 100% ; padding: 8px ; z-index: 10 ;
        box-shadow: 0 0 .5em black ; border-top-left-radius: .5em ; border-top-right-radius: .5em ; border: none ;
        transition: .5s all ;}

      .CodBi_AI_OCR_CAM_Select:hover { background-color: #f0f0f0 ;}

      .CodBi_AI_OCR_CAM_Select:active { background-color: #e0e0e0 ;}

      .CodBi_AI_OCR_CAM_Capture { width: 100% ; padding: 10px ; margin-top: 0 ; border: none ;
        background-color: #007bff ; color: white ; cursor: pointer ; font-size: 16px ; transition: background-color 0.3s ease ;
        box-shadow: 0 0 .5em black ; border-bottom-left-radius: .5em ; border-bottom-right-radius: .5em ;}

      .CodBi_AI_OCR_CAM_Capture:hover { background-color: #0056b3 ;}

      .CodBi_AI_OCR_CAM_Capture:active { background-color: #004085 ; transform: scale( 0.9 );}

      .CodBi_AI_OCR_CAM_Capture:disabled { background-color: #cccccc ; cursor: not-allowed ; opacity: 0.6 ;}`;

    cameraContainer.appendChild(style);
    // #endregion Define CSS

    const videoElement = document.createElement("video");
    videoElement.id = `camera-feed-${container.id}`;
    videoElement.autoplay = true;
    videoElement.playsInline = true;

    const cameraSelect = document.createElement("select");
    cameraSelect.id = `camera-select-${container.id}`;
    cameraSelect.style.display = "none";
    cameraSelect.classList.add("CodBi_AI_OCR_CAM_Select");

    const capturedImage = document.createElement("img");
    capturedImage.id = `captured-image-${container.id}`;
    capturedImage.classList.add("CodBi_AI_OCR_CAM_CapturedImage");
    capturedImage.alt = "Captured image";

    const videoWrapper = document.createElement("div");
    videoWrapper.classList.add("CodBi_AI_OCR_CAM_VideoWrapper");

    const videoContainer = document.createElement("div");
    videoContainer.classList.add("CodBi_AI_OCR_CAM_VideoContainer");
    videoContainer.appendChild(cameraSelect);
    videoContainer.appendChild(videoElement);

    videoWrapper.appendChild(videoContainer);

    const captureButton = document.createElement("button");
    captureButton.innerText = "Scannen";
    captureButton.type = "button";
    captureButton.classList.add("CodBi_AI_OCR_CAM_Capture");

    const canvas = document.createElement("canvas");
    canvas.id = `camera-canvas-${container.id}`;
    canvas.style.cssText = "display: none;";

    cameraContainer.appendChild(videoWrapper);
    cameraContainer.appendChild(captureButton);
    cameraContainer.appendChild(capturedImage);
    wrapper.appendChild(cameraContainer);
    container.appendChild(wrapper);
    container.appendChild(canvas);
    // #endregion Initialize camera container and controls

    // #region Get available cameras
    let stream: MediaStream | null = null;

    // #region Start camera stream
    const startCamera = (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({ video: { deviceId: { exact: deviceId } } })
        .then((mediaStream) => {
          stream = mediaStream;
          videoElement.srcObject = mediaStream;
          window.codbi.log("INFO", "Camera stream started successfully.", "AI / TESSERACT");
        })
        .catch((error) => {
          if (error.name === "OverconstrainedError") {
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then((mediaStream) => {
                stream = mediaStream;
                videoElement.srcObject = mediaStream;
                window.codbi.log("INFO", "Camera stream started (using default camera).", "AI / TESSERACT");
              })
              .catch((fallbackError) => {
                console.error(fallbackError);
                window.codbi.log("ERROR", `Failed to start camera stream: ${fallbackError.message}`, "AI / TESSERACT");
                captureButton.disabled = true;
              });
          } else {
            window.codbi.log("ERROR", `Failed to start camera stream: ${error.message}`, "AI / TESSERACT");
            captureButton.disabled = true;
          }
        });
    };
    // #endregion Start camera stream

    navigator.mediaDevices
      .enumerateDevices()
      .then((devices) => {
        const videoDevices = devices.filter((device) => device.kind === "videoinput");

        if (videoDevices.length === 0) {
          window.codbi.log("ERROR", "No camera devices found on this device.", "AI / TESSERACT");
          captureButton.disabled = true;
          return;
        } else {
          captureButton.disabled = false;
        }

        // Populate camera select dropdown
        for (const device of videoDevices) {
          const option = document.createElement("option");
          option.value = device.deviceId;
          option.text = device.label || `Camera ${cameraSelect.options.length + 1}`;
          cameraSelect.appendChild(option);
        }

        if (videoDevices.length > 1) {
          cameraSelect.style.display = "block";
        }
        if (cameraSelect.options.length > 0) {
          startCamera(cameraSelect.value);
        }

        cameraSelect.addEventListener("change", () => {
          if (stream) {
            for (const track of stream.getTracks()) {
              track.stop();
            }
          }
          startCamera(cameraSelect.value);
        });
      })
      .catch((error) => {
        window.codbi.log("ERROR", `Failed to enumerate camera devices: ${error.message}`, "AI / TESSERACT");
        captureButton.disabled = true;
      });
    // #endregion Get available cameras

    // #region Build X-FieldPatterns from Pattern_* fields
    const fieldPatterns: Array<{ [key: string]: string }> = [];
    if (tsMode === "extract fields") {
      const patternKeys = Object.keys(toLoad).filter((key) => key.startsWith("pattern_"));
      for (const patternKey of patternKeys) {
        const fieldName = patternKey.substring(8);
        const pattern = toLoad[patternKey] as string;
        if (fieldName && pattern) {
          const fieldObj: { [key: string]: string } = {};
          fieldObj[fieldName] = encodeURIComponent((pattern as string).replace(/°/, "^"));
          fieldPatterns.push(fieldObj);
        }
      }
    }
    const fieldPatternsJson = fieldPatterns.length > 0 ? JSON.stringify(fieldPatterns) : "";
    // #endregion Build X-FieldPatterns from Pattern_* fields

    // #region Capture image and send to plugin
    const originalButtonText = captureButton.innerText;
    captureButton.addEventListener("click", () => {
      if (!videoElement.srcObject) {
        window.codbi.log("WARNING", "Camera stream is not active.", "AI / TESSERACT");
        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        window.codbi.log("ERROR", "Failed to get canvas context.", "AI / TESSERACT");
        return;
      }

      // Clear canvas before drawing
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
      context.clearRect(0, 0, canvas.width, canvas.height);

      // Draw current video frame
      context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);

      // Display captured image
      const imageDataUrl = canvas.toDataURL("image/png");
      capturedImage.src = imageDataUrl;
      capturedImage.classList.add("visible");

      // Convert canvas to blob immediately
      canvas.toBlob((blob) => {
        if (!blob) {
          window.codbi.log("ERROR", "Failed to convert canvas to blob.", "AI / TESSERACT");
          return;
        }

        // #region Disable button and show processing text
        captureButton.disabled = true;
        captureButton.innerText = tsProcessingimagetext;
        window.codbi.injectLoadingAnim(captureButton);
        // #endregion Disable button and show processing text

        // #region Define how to restore the button
        const restoreButton = () => {
          window.codbi.removeLoaderAnim(captureButton);
          captureButton.disabled = false;
          captureButton.innerText = originalButtonText;
        };
        // #endregion Define how to restore the button

        // #region Send the request to the Tesseract AI OCR API
        const formData = new FormData();
        formData.append("camera_capture.png", blob, "camera_capture.png");

        const ajaxHeaders: { [key: string]: string } = { "X-Mode": toLoad.mode as string };
        if (tsMode !== "print") {
          ajaxHeaders["X-Pattern"] = encodeURIComponent(
            toLoad.pattern ? (toLoad.pattern as string).replace(/°/, "^") : "",
          );
          ajaxHeaders["X-FieldPatterns"] = fieldPatternsJson.length > 0 ? encodeURIComponent(fieldPatternsJson) : "";
        }

        if (toLoad.regexflags) {
          ajaxHeaders["X-RegexFlags"] = TYPE.tsCheck<string>(toLoad.regexflags, "string");
        }

        if (toLoad.preprocess) {
          const preprocessValue = TYPE.tsCheck<string>(toLoad.preprocess, "string").toLowerCase();
          ajaxHeaders["X-Preprocess"] = preprocessValue === "true" || preprocessValue === "1" ? "true" : "false";
        }

        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Tesseract`,
          type: "POST",
          data: formData,
          processData: false,
          contentType: false,
          cache: false,
          headers: ajaxHeaders,
          success: (response) => {
            console.log("OCR Success:", response);

            // #region Print mode: place result in <textarea>
            if (tsMode === "print") {
              const parent2 = toProcess.parentElement?.parentElement || null;
              if (parent2) {
                const receiverElem = parent2.querySelector(
                  ".CodBi_AI_Tesseract_Receiver",
                ) as HTMLTextAreaElement | null;
                if (receiverElem) {
                  const responseText =
                    typeof response === "string" ? response : response.text || JSON.stringify(response);
                  receiverElem.value = responseText.replace(/\\n/g, "\n");
                } else {
                  window.codbi.log(
                    "INFO",
                    `Receiver element with class 'CodBi_AI_Tesseract_Receiver' not found in #${toProcess.parentElement.parentElement.getAttribute("id")}.`,
                    "AI / TESSERACT",
                  );
                }
              }
            }

            // #region Extract fields mode: set values on CodBi_AI_OCR_Receiver elements
            if (tsMode === "extract fields" && typeof response === "object" && response !== null) {
              const parent3 = toProcess.parentElement?.parentElement?.parentElement || null;
              if (parent3) {
                const receivers = parent3.querySelectorAll(".CodBi_AI_OCR_Receiver");
                for (const elem of receivers) {
                  const field = (elem as HTMLElement).getAttribute("data-cb-Field").toLowerCase();
                  if (field) {
                    const separator = toLoad.separator ? (toLoad.separator as string) : ",";
                    const collectedValues: string[] = [];

                    // Process all filename properties in response
                    for (const fileKey in response) {
                      if (Object.prototype.hasOwnProperty.call(response, fileKey)) {
                        const fileData = response[fileKey];
                        if (
                          fileData &&
                          typeof fileData === "object" &&
                          Object.prototype.hasOwnProperty.call(fileData, field)
                        ) {
                          const fieldValue = fileData[field];
                          if (Array.isArray(fieldValue)) {
                            collectedValues.push(...fieldValue);
                          } else if (typeof fieldValue === "string") {
                            collectedValues.push(fieldValue);
                          }
                        }
                      }
                    }

                    if (collectedValues.length > 0) {
                      const joinedValue = collectedValues.join(separator);
                      if ("value" in elem) {
                        (elem as HTMLInputElement | HTMLTextAreaElement).value = joinedValue;
                      } else {
                        elem.textContent = joinedValue;
                      }
                    }
                  }
                }
              }
            }

            // #region Validate verify mode results
            if (tsMode === "verify") {
              const verifyResults = response as { [key: string]: boolean };
              const hasFailure = Object.values(verifyResults).some((result) => result === false);
              if (hasFailure) {
                $(toProcess).error(tsInvalidimagetext);

                // Add styles for manual verification checkbox
                if (!document.getElementById("CodBi_AI_OCR_ManualVerify_Styles")) {
                  const verifyStyle = document.createElement("style");
                  verifyStyle.id = "CodBi_AI_OCR_ManualVerify_Styles";
                  verifyStyle.textContent = `
                    .CodBi_AI_OCR_ManualVerify {
                      display: flex;
                      align-items: center;
                      margin-top: 8px;
                      gap: 8px;
                      flex-wrap: nowrap;
                    }
                    .CodBi_AI_OCR_ManualVerify_Checkbox {
                      cursor: pointer;
                      opacity: 1 !important;
                      position: relative !important;
                      flex-shrink: 0;
                    }
                    .CodBi_AI_OCR_ManualVerify label {
                      margin-bottom: 0;
                      position: relative !important;
                      white-space: nowrap;
                    }
                    
                    @keyframes highlight {
                      0% { opacity:1; }
                      50% { opacity:0; }
                      100% { opacity:1; }
                    }
                    
                    .CodBi_AI_OCR_ManualVerify label span {
                      font-weight: bold; color: darkorange ;animation: highlight 2s ease-in-out infinite;
                    }
                  `;
                  document.head.appendChild(verifyStyle);
                }

                // Create checkbox for manual verification
                const checkboxContainer = document.createElement("div");
                checkboxContainer.className = "CodBi_AI_OCR_ManualVerify";
                checkboxContainer.style.display = "flex";
                checkboxContainer.style.alignItems = "center";
                checkboxContainer.style.marginTop = "8px";
                checkboxContainer.style.gap = "8px";

                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.id = `manual-verify-${container.id}`;
                checkbox.className = "CodBi_AI_OCR_ManualVerify_Checkbox";

                const label = document.createElement("label");
                label.htmlFor = checkbox.id;
                label.textContent = toLoad.wrongfilemessage
                  ? (toLoad.wrongfilemessage as string)
                  : "The content is not as expected. You may manually verify that it is the correct one by clicking the checkbox.";
                label.style.marginBottom = "0";

                checkboxContainer.appendChild(checkbox);
                checkboxContainer.appendChild(label);

                // Remove any existing manual verify checkbox to prevent duplicates
                const existingManualVerify = container.parentElement.querySelectorAll(".CodBi_AI_OCR_ManualVerify");
                for (let i = 0; i < existingManualVerify.length; i++) {
                  existingManualVerify[i].remove();
                }

                // Insert checkbox after the camera container
                container.insertAdjacentElement("afterend", checkboxContainer);

                // Handle checkbox change
                checkbox.addEventListener("change", () => {
                  if (checkbox.checked) {
                    $(toProcess).error("");
                  } else {
                    $(toProcess).error(tsInvalidimagetext);
                  }
                });
              } else {
                $(toProcess).error("");
              }
            }
            // #endregion Validate verify mode results

            restoreButton();
          },
          error: (xhr, status, error) => {
            restoreButton();
            throw new CodBiError(`❌ Tesseract AI OCR request failed with status (${status}) due to: ${error}`);
          },
        });
        // #endregion Send the request to the Tesseract AI OCR API
      });
    });
    // #endregion Capture image and send to plugin
  }

  //region Initialization
  /**
   * States whether this {@link AI_OCR_CAM } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.OCR.CAM", AI_OCR_CAM.functionality);
  })();
  //endregion Initialization
}
