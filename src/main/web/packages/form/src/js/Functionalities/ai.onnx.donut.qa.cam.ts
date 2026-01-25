/// <reference path="../global-scope.ts" />
//region Imports
//region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
//endregion XIMA
//region XDBC
import { DBC } from "xdbc/src/DBC";
//endregion XDBC
//endregion Imports

// Get LogLevel from window if not available globally
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
const LogLevel = (window as any).LogLevel || { ERROR: "ERROR", WARNING: "WARN", INFO: "INFO" };
/**
 * Provides the {@link AI_ONNX_DONUT_QA_CAM.functionality } for
 * DJL ONNX Document Visual Question Answering via device camera.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_ONNX_DONUT_QA_CAM {
  /**
   * This functionality captures images from a device camera using the DJL ONNX Donut model to
   * answer questions about documents. A camera selection dropdown is provided if multiple cameras
   * are available. The captured image is sent via AJAX to the plugin and questions are answered.
   *
   * Questions are acquired from DOM elements within the container of the
   * {@link HTMLDivElement } toProcess that have the class `AI_ONNX_DONUT_QA_Question`. Each such element should have:
   *  - An **id** attribute (used as the question key)
   *  - A **data-cb-DonutQuestion** attribute (contains the question text)
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    const container = toProcess as HTMLDivElement;
    const $ = getJQuery();
    // #region Initialize camera container and controls
    // Main wrapper to center content
    const wrapper = document.createElement("div");

    wrapper.style.cssText = "display: flex; justify-content: center; align-items: center; width: 100%;";

    const cameraContainer = document.createElement("div");
    cameraContainer.id = `CodBi_AI_ONNX_DONUT_QA_CAM_Container_${Math.random().toString(36).substr(2, 9)}`;

    cameraContainer.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Container");
    // #region Define CSS
    const style = document.createElement("style");

    style.textContent = `
      .CodBi_AI_ONNX_DONUT_QA_CAM_Container { position: relative ; width: 100% ; max-width: 400px ; display: flex ;
        flex-direction: column ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Container video { width: 100% ; border: 1px solid #ccc ; display: block ;
        box-shadow: 0 0 .5em black ; border: none ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select { position: absolute ; top: 0 ; left: 0 ; width: 100% ; padding: 8px ; z-index: 10 ;
        box-shadow: 0 0 .5em black ; border-top-left-radius: .5em ; border-top-right-radius: .5em ; border: none ;
        transition: .5s all ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select:hover { background-color: #f0f0f0 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Select:active { background-color: #e0e0e0 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture { width: 100% ; padding: 10px ; margin-top: 0 ; border: none ;
        background-color: #007bff ; color: white ; cursor: pointer ; font-size: 16px ; transition: background-color 0.3s ease ;
        box-shadow: 0 0 .5em black ; border-bottom-left-radius: .5em ; border-bottom-right-radius: .5em ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:hover { background-color: #0056b3 ;}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:active { background-color: #004085 ; transform: scale( 0.9 );}

      .CodBi_AI_ONNX_DONUT_QA_CAM_Capture:disabled { background-color: #cccccc ; cursor: not-allowed ; opacity: 0.6 ;}`;

    cameraContainer.appendChild(style);
    // #endregion Define CSS
    const videoElement = document.createElement("video");

    videoElement.id = `camera-feed-${container.id}`;
    videoElement.autoplay = true;
    videoElement.playsInline = true;

    const cameraSelect = document.createElement("select");

    cameraSelect.id = `camera-select-${container.id}`;
    cameraSelect.style.display = "none";

    cameraSelect.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Select");

    const captureButton = document.createElement("button");

    captureButton.innerText = "Scannen";
    captureButton.type = "button";

    captureButton.classList.add("CodBi_AI_ONNX_DONUT_QA_CAM_Capture");

    const canvas = document.createElement("canvas");

    canvas.id = `camera-canvas-${container.id}`;
    canvas.style.cssText = "display: none;";

    cameraContainer.appendChild(cameraSelect);
    cameraContainer.appendChild(videoElement);
    cameraContainer.appendChild(captureButton);
    wrapper.appendChild(cameraContainer);
    container.appendChild(wrapper);
    container.appendChild(canvas);
    // #endregion Initialize camera container and controls
    // #region Get available cameras
    let stream: MediaStream | null = null;
    // #region Start camera stream (defined early so it's available in enumerateDevices callback)
    const startCamera = (deviceId: string) => {
      navigator.mediaDevices
        .getUserMedia({ video: { deviceId: { exact: deviceId } } })
        .then((mediaStream) => {
          stream = mediaStream;
          videoElement.srcObject = mediaStream;

          window.codbi.log("INFO", "Camera stream started successfully.", "AI / ONNX / DONUT");
        })
        .catch((error) => {
          if (error.name === "OverconstrainedError") {
            navigator.mediaDevices
              .getUserMedia({ video: true })
              .then((mediaStream) => {
                stream = mediaStream;
                videoElement.srcObject = mediaStream;

                window.codbi.log("INFO", "Camera stream started (using default camera).", "AI / ONNX / DONUT");
              })
              .catch((fallbackError) => {
                console.error(fallbackError);
                window.codbi.log(
                  "ERROR",
                  `Failed to start camera stream: ${fallbackError.message}`,
                  "AI / ONNX / DONUT",
                );

                captureButton.disabled = true;
              });
          } else {
            window.codbi.log("ERROR", `Failed to start camera stream: ${error.message}`, "AI / ONNX / DONUT");

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
          window.codbi.log("ERROR", "No camera devices found on this device.", "AI / ONNX / DONUT");

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
        window.codbi.log("ERROR", `Failed to enumerate camera devices: ${error.message}`, "AI / ONNX / DONUT");

        captureButton.disabled = true;
      });
    // #endregion Get available cameras

    // #region Capture image and send to plugin
    captureButton.addEventListener("click", () => {
      if (!videoElement.srcObject) {
        window.codbi.log("WARNING", "Camera stream is not active.", "AI / ONNX / DONUT");

        return;
      }

      const context = canvas.getContext("2d");
      if (!context) {
        window.codbi.log("ERROR", "Failed to get canvas context.", "AI / ONNX / DONUT");

        return;
      }

      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      context.drawImage(videoElement, 0, 0);

      canvas.toBlob((blob) => {
        if (!blob) {
          window.codbi.log("ERROR", "Failed to convert canvas to blob.", "AI / ONNX / DONUT");

          return;
        }

        // #region Acquire Questions
        const headers: { [key: string]: string } = {};
        const questionElements =
          container.parentElement.parentElement.parentElement.querySelectorAll(".AI_ONNX_DONUT_QA_Question");

        for (const element of questionElements) {
          const id = element.id;
          const question = element.getAttribute("data-cb-DonutQuestion");

          if (id && question) {
            headers[`X-Question-${id}`] = question;
          } else {
            if (!id) {
              window.codbi.log(
                "WARNING",
                `Question element missing id attribute in: ${element.outerHTML}`,
                "AI / ONNX / DONUT",
              );
            }
            if (!question) {
              window.codbi.log(
                "WARNING",
                `Question element with id "${id}" missing data-cb-DonutQuestion attribute in: ${element.outerHTML}`,
                "AI / ONNX / DONUT",
              );
            }
          }
        }

        if (Object.keys(headers).length === 0) {
          window.codbi.log(
            "WARNING",
            `No question elements found with class AI_ONNX_DONUT_QA_Question in container "${container.id}".`,
            "AI / ONNX / DONUT",
          );
        }
        // #endregion Acquire Questions

        // #region Contact ONNX Donut vQA Plugin via AJAX
        const formData = new FormData();
        formData.append("camera_capture.png", blob, "camera_capture.png");

        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_AI_Donut_vQA`,
          type: "POST",
          data: formData,
          dataType: "json",
          processData: false,
          contentType: false,
          cache: false,
          beforeSend: (xhr) => {
            for (const headerName of Object.keys(headers)) {
              xhr.setRequestHeader(headerName, headers[headerName]);
            }
          },
          success: (response) => {
            // #region AI error handling
            if (response.error) {
              window.codbi.log("ERROR", `ONNX DONUT Error: ${response.error}`, "AI / ONNX / DONUT");
              return;
            }
            // #endregion AI error handling
            for (const key in response) {
              for (const key2 in response[key]) {
                (
                  toProcess.parentElement.parentElement.parentElement.querySelector(`#${key2}`) as HTMLInputElement
                ).value = response[key][key2];
              }
            }

            window.codbi.log(
              "INFO",
              `ONNX DONUT Request successful with response: "${JSON.stringify(response)}"`,
              "AI / ONNX / DONUT",
            );
          },
          error: (xhr, status, error) => {
            window.codbi.log(
              "ERROR",
              `ONNX DONUT Request failed with status "${status}" cause "${error}"`,
              "AI / ONNX / DONUT",
            );
          },
        });
        // #endregion Contact ONNX Donut vQA Plugin via AJAX
      });
    });
    // #endregion Capture image and send to plugin
  }

  //region Initialization
  /**
   * States whether this {@link AI } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("AI.ONNX.DONUT.QA.CAM", AI_ONNX_DONUT_QA_CAM.functionality);
  })();
  //endregion Initialization
}
