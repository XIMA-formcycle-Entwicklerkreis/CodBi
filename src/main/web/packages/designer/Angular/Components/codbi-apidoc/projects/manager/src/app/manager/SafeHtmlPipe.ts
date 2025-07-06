// src/app/safe-html.pipe.ts
// biome-ignore lint/style/useImportType: <explanation>
import { Pipe, PipeTransform } from "@angular/core";
// biome-ignore lint/style/useImportType: <explanation>
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Pipe({
  name: "safeHtml",
})
export class SafeHtmlPipe implements PipeTransform {
  // biome-ignore lint/style/noParameterProperties: <explanation>
  constructor(private sanitizer: DomSanitizer) {}

  /**
   * Transforms a string into a SafeHtml object, bypassing Angular's HTML sanitization.
   * WARNING: Use this pipe ONLY when you are absolutely certain the input HTML is trusted
   * and cannot contain malicious code (e.g., from a secure backend API that sanitizes input,
   * or static, hardcoded content).
   * Bypassing sanitization opens your application to Cross-Site Scripting (XSS) vulnerabilities.
   *
   * @param value The HTML string to bypass sanitization for.
   * @returns A SafeHtml object.
   */
  transform(value: string | null | undefined): SafeHtml {
    if (value === null || value === undefined) {
      return this.sanitizer.bypassSecurityTrustHtml(""); // Return empty safe HTML for null/undefined
    }
    return this.sanitizer.bypassSecurityTrustHtml(value);
  }
}
