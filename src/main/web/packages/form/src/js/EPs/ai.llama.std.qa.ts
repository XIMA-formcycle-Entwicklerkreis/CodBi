// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
import { generateUUID } from "../global-scope";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { IF } from "xdbc/src/DBC/IF";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires the AI response to a question.
 *
 * ### Indexed Parameters:
 *  - 1st                         — The question to ask the AI.
 *  - 2nd **UseInternet**         — `"true"` to enable Brave Search internet access. Default: `"false"`.
 *  - 3rd **Location**            — `"true"` to enable geolocation access. Default: `"false"`.
 *  - 4th **Language**            — Language for the AI response (e.g. `"German"`, `"English"`). Appends
 *                                `"Answer in {language}."` to the question.
 *  - 5th **ResponseLanguage**    — Two-letter ISO 639-1 code (e.g. `"de"`, `"fr"`). Forces the AI
 *                                  to respond in this language, skipping auto-detection.
 *  - 6th **Specialist**          — Name of a specialist model registered via `AI_LLAMA_STD_SPECIALIST_XXX`
 *                                  plugin property.
 *  - 7th **FilterResults**       — `"true"` to enable PII filtering on Brave Search queries.
 *  - 8th **JsonParse**           — `"true"` to parse the AI response as JSON. Default: `"false"`.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class AI_LLAMA_STD_QA {
  /** Unique session ID generated on page load — ensures each session gets its own llama-server slot. */
  private static readonly PAGE_SESSION_ID: string = generateUUID();
  /**
   * Sends the question to the AI backend and resolves with the answer.
   *
   * @param params The indexed parameters for this Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't the question been specified?")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "1")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "2")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "6")
    @IF.PRE(new TYPE("string"), new REGEX(/^(true|false)$/i), "7")
    params: Array<string>,
  ): Promise<string | object> {
    const $ = getJQuery();
    // #region Extract indexed parameters
    let question = params[0] as string;
    const useInternet = (params[1] ?? "").toLowerCase() === "true";
    const useLocation = (params[2] ?? "").toLowerCase() === "true";
    const language = (params[3] ?? "").trim();
    const responseLanguage = (params[4] ?? "").trim();
    const specialist = (params[5] ?? "").trim();
    const filterResults = (params[6] ?? "").trim();
    const jsonParse = (params[7] ?? "").toLowerCase() === "true";
    // #endregion Extract indexed parameters
    // #region Append language instruction if configured
    if (language) {
      question = `${question} Answer in ${language}.`;
    }
    // #endregion Append language instruction if configured
    // #region Append JSON instruction if jsonparse is enabled
    if (jsonParse) {
      question = `${question} Respond with valid JSON only. No markdown, no explanation, no code fences — just the raw JSON object or array.`;
    }
    // #endregion Append JSON instruction if jsonparse is enabled
    // #region Build request headers
    const questionId = generateUUID();
    const headers: { [key: string]: string } = {};

    headers["X-Session-Id"] = AI_LLAMA_STD_QA.PAGE_SESSION_ID;
    headers["X-Search"] = useInternet ? "true" : "false";

    if (filterResults) {
      headers["X-Filter-Results"] = filterResults.toLowerCase() === "true" ? "true" : "false";
    }
    if (responseLanguage) {
      headers["X-Forced-Language"] = responseLanguage;
    }
    if (specialist) {
      headers["X-Specialist"] = specialist;
    }
    // #endregion Build request headers
    // #region Send AJAX request with queue polling (geolocation resolved inline)
    return new Promise((resolve) => {
      const prepareAndSend = async () => {
        // #region Geolocation
        if (useLocation && navigator.geolocation) {
          headers["X-Location"] = "true";

          try {
            const pos = await new Promise<GeolocationPosition>((geoResolve, geoReject) => {
              navigator.geolocation.getCurrentPosition(geoResolve, geoReject, {
                enableHighAccuracy: false,
                timeout: 5000,
                maximumAge: 300_000,
              });
            });

            headers["X-Latitude"] = pos.coords.latitude.toFixed(4);
            headers["X-Longitude"] = pos.coords.longitude.toFixed(4);
          } catch (geoErr) {
            window.codbi.log("WARNING", `Geolocation unavailable: ${geoErr}`, "AI / Ask EP");
          }
        }
        // #endregion Geolocation
        headers[`X-Question-${questionId}`] = btoa(unescape(encodeURIComponent(question)));

        let queueTicket: string | null = null;

        const sendRequest = () => {
          $.ajax({
            url: `${window.codbi.baseURL}plugin?name=CodBi_AI_LLAMA_STD`,
            type: "POST",
            data: new FormData(),
            dataType: "json",
            processData: false,
            contentType: false,
            cache: false,
            beforeSend: (xhr) => {
              for (const headerName of Object.keys(headers)) {
                xhr.setRequestHeader(headerName, headers[headerName]);
              }
              if (queueTicket) {
                xhr.setRequestHeader("X-Queue-Ticket", queueTicket);
              }
            },
            success: (response) => {
              if (response.queued) {
                queueTicket = response.queueTicket ?? queueTicket;
                setTimeout(sendRequest, 1000);

                return;
              }

              const answerText = response[questionId]?.answer;

              if (jsonParse && answerText) {
                try {
                  resolve(JSON.parse(answerText));
                } catch (parseErr) {
                  window.codbi.log("WARNING", `JSON parse failed, returning raw string: ${parseErr}`, "AI / QA EP");
                  resolve(answerText);
                }
              } else {
                resolve(answerText ?? "");
              }

              if (response.error) {
                window.codbi.log("ERROR", `AI request failed: ${response.error}`, "AI / Ask EP");
              }
            },
            error: (_xhr, status, error) => {
              window.codbi.log("ERROR", `AI request failed with status "${status}" cause: "${error}"`, "AI / Ask EP");
              resolve("");
            },
          });
        };

        sendRequest();
      };

      prepareAndSend();
    });
    // #endregion Send AJAX request with queue polling (geolocation resolved inline)
  }
}

window.codbi.registerEP("AI.LLAMA.STD.QA", AI_LLAMA_STD_QA.retrieve.bind(AI_LLAMA_STD_QA)); // Initialization
