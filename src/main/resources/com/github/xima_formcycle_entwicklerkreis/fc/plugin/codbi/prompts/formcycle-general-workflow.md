# Formcycle General — WORKFLOW BUILD DECISION CORE

Cross-cutting Formcycle rules for the WORKFLOW build step. This pass emits ONLY workflow task / delta-operation JSON (trigger + nodes + endpointState) — NEVER form JSON: the form has already been handled separately, so do NOT emit form fields, form elements or an "items" array.

The build annex is de-duplicated — the exact rules these workflow steps act on live in the single authoritative homes that are always composed in the SAME prompt, and are NOT repeated here:
- TECHNICAL IDENTIFIER RULES (technicalId vs displayText, triggerParams.buttonName, NO-MATCH `triggerParams:{}` rule) → see the FORMCYCLE WORKFLOW REFERENCE ({{WORKFLOW_REFERENCE}}) below.
- SERVER VARIABLES / PLACEHOLDER CATALOG (the [%\$NAME%] placeholder pattern — process/record/state/project/client/user/link/error/appointment placeholders, incl. the process-link variable for "link to the form / current state" and the LATEST_ error placeholders) → see the FORMCYCLE WORKFLOW REFERENCE ({{WORKFLOW_REFERENCE}}) below.
- NODE / TRIGGER SPECIFICS (required nodeParams, chainedNodes vs _childNodes placement, loop child-node placement, repeatable-container → JSON → storage pattern, endpointType rules) → see the FORMCYCLE WORKFLOW REFERENCE and the OUTPUT CONTRACT + REPEATABLE_CONTAINERS sections of this task instruction.
- APPROVAL / REJECTION lanes, the DECISION-BUTTON GATING FIELD "buttonStatus", and the FORM_PROCESS_LINK mail rule → see the APPROVAL / REJECTION OUTPUT CONTRACT bullets of this task instruction.
- EP PARAMETERS & V → see the CRITICAL — EP PARAMETERS & V bullet earlier in this task instruction.

WORKFLOW BUILD — one lane per trigger/button. Reference form elements by their EXACT technicalId (from the FORM ELEMENTS list), gate decision buttons on the workflow state name, and end each lane with exactly ONE endpoint (endpointType/endpointState, or an FC_CHANGE_STATE/FC_RETURN as the final node). Follow the OUTPUT CONTRACT strictly: SANITIZED names, ONE endpoint per lane, sequential actions in TOP-LEVEL "chainedNodes" (never "_childNodes" for a plain follow-up), and the "buttonStatus" gating field on every approve/reject lane.
