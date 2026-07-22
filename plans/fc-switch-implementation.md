# FC_SWITCH Implementation Plan

## Overview

Add `FC_SWITCH` support to the workflow AI assistants (`AICodBiAssistant.kt` and `AIWorkflowAssistant.kt`). Currently, when a user describes a switch-case pattern (e.g., "if field X has value A do Y, if value B do Z"), the AI generates multiple workflow lanes with `FC_MULTIPLE_CONDITION` instead of a single lane with `FC_SWITCH`.

## Decompiled Class Structure

### `FcSwitchProps` (the switch node)
- `switchValue: String` — the form field to switch on (e.g. `[%tfKlausel%]`)
- `description: String`

### `FcSwitchCaseProps` (each case branch)
- `caseValues: List<SingleCaseValue>` — case values to match
- `combinationType: AND|OR|CUSTOM`
- `customExpression: String` — custom expression for CUSTOM mode
- `description: String`

### `FcSwitchDefaultProps` (the default branch)
- Empty marker class, no fields

### `SingleCaseValue` (a single case value)
- `value: String` — the value to match (e.g. "A")

## Workflow Structure

```
FC_SWITCH (switchValue: "[%tf1%]")
├── Case "A" (parent_order_idx=0) → SEQUENCE → FC_EMAIL(from: A@B.C) → FC_CHANGE_STATE
├── Case "B" (parent_order_idx=1) → SEQUENCE → FC_EMAIL(from: H@H.H) → FC_CHANGE_STATE
└── Default (parent_order_idx=2)  → SEQUENCE → FC_EMAIL(from: "")    → FC_CHANGE_STATE
```

Each case is a WorkflowNode child of the switch node. The `FcSwitchCaseProps` and `FcSwitchDefaultProps` are stored in the child node's CUSTOM_PARAMS. The `FcSwitchProps` is stored in the switch node's CUSTOM_PARAMS.

## AI Output Format

The AI should output a single lane with `nodeType: "FC_SWITCH"`:

```json
{
  "taskName": "Send email with different senders",
  "triggerType": "FC_FORM_SUBMIT_BUTTON",
  "triggerParams": {},
  "nodeType": "FC_SWITCH",
  "nodeParams": {
    "switchValue": "[%tfKlausel%]",
    "_cases": [
      {
        "description": "Sender A@B.C",
        "caseValues": ["A"],
        "combinationType": "OR",
        "_childNodes": [
          {"nodeType": "FC_EMAIL", "nodeParams": {"to": "A@B.C.DE", "subject": "XXX", "body": "<p>ZZZ</p>", "from": "A@B.C", "senderName": ""}}
        ]
      },
      {
        "description": "Sender H@H.H",
        "caseValues": ["B"],
        "_childNodes": [
          {"nodeType": "FC_EMAIL", "nodeParams": {"to": "A@B.C.DE", "subject": "XXX", "body": "<p>ZZZ</p>", "from": "H@H.H", "senderName": ""}}
        ]
      }
    ],
    "_defaultChildNodes": [
      {"nodeType": "FC_EMAIL", "nodeParams": {"to": "A@B.C.DE", "subject": "XXX", "body": "<p>ZZZ</p>", "from": "", "senderName": ""}}
    ]
  },
  "endpointState": "Received",
  "endpointType": "FC_CHANGE_STATE"
}
```

## Implementation Steps (both files)

### 1. `buildNodeParamsJson` — Add `FC_SWITCH` case

Generate the switch node's CUSTOM_PARAMS JSON:
```json
{"name":"...","description":"","switchValue":"[%tfKlausel%]"}
```

`_cases` and `_defaultChildNodes` are NOT included in the switch node's params — they become separate case/default child nodes.

### 2. `createWorkflowTask` — Add `FC_SWITCH` case handler

After creating the switch action node and fixing parent order, if `nodeType == "FC_SWITCH"`:
1. Extract `_cases` from `nodeParams`
2. Extract `_defaultChildNodes` from `nodeParams`  
3. For each case (indexed 0..N):
   - Create a SEQUENCE wrapper as child of the switch node (`parent_order_idx = index`)
   - Set the SEQUENCE's CUSTOM_PARAMS to `FcSwitchCaseProps` JSON with `caseValues`, `combinationType`, `customExpression`
   - Create child action nodes inside the SEQUENCE (from `_childNodes`)
   - Create endpoint (FC_CHANGE_STATE) inside the SEQUENCE
4. For the default branch (at index = cases.size):
   - Create a SEQUENCE wrapper with `FcSwitchDefaultProps` CUSTOM_PARAMS
   - Create child action nodes inside the SEQUENCE (from `_defaultChildNodes`)
   - Create endpoint inside the SEQUENCE
5. Return early (skip outer endpoint logic — endpoint is inside each case branch)

### 3. System Prompt — Add `FC_SWITCH` documentation

Add after the `FC_MULTIPLE_CONDITION` section:
- When to use: switch-case patterns ("if field X has value A do Y, if value B do Z")
- nodeParams: `switchValue` (the field reference)
- Use `_cases` array for cases, each with `caseValues`, `_childNodes`
- Use `_defaultChildNodes` for the default branch
- Example showing the pattern

## CUSTOM_PARAMS for Case Branches

For each case branch SEQUENCE, set CUSTOM_PARAMS to the `FcSwitchCaseProps` JSON:
```json
{"caseValues":[{"value":"A"}],"combinationType":"OR","customExpression":"","description":"Sender A@B.C"}
```

For the default branch SEQUENCE, set CUSTOM_PARAMS to `FcSwitchDefaultProps` JSON:
```json
{}
```

## Edge Cases

1. **No cases provided**: Treat as a no-op, skip case creation
2. **No default branch**: Just don't create the default SEQUENCE
3. **Case without `_childNodes`**: Create the case SEQUENCE but with no child actions (just the endpoint)
4. **Multiple case values**: `caseValues: ["A", "B", "C"]` with `combinationType: "OR"` 
5. **Custom expression**: `caseValues: ["A", "B"]`, `combinationType: "CUSTOM"`, `customExpression: "C1 OR C2"`
