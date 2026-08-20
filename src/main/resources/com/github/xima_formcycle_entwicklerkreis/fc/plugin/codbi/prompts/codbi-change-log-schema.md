"ts"        - ISO timestamp of when the earlier run happened (match "yesterday", "20:49", "last week", ...)
"username"  - the user who triggered that run (match a named user, or "I" = the current user)
"intent"    - "form" | "workflow" | "both" — what that run changed
"modelId"   - the AI model used (informational)
"prompt"    - the ORIGINAL natural-language request the user typed for that run; the most
              important field to understand what was done
"form"      - object describing the form changes of that run:
    "widgetsCreated" - [ { "name", "className" } ] widgets added to the form
    "widgetsRemoved" - [ { "name", "className" } ] widgets removed
    "classesSet"     - [ { "widget", "className", "classes": [...] } ] CSS classes (e.g.
                       CodBi_*) added to widgets
    "attributesSet"  - [ { "widget", "className", "attributes": [ { "name", "value",
                       "kind" (attr|func|param), "codbi" (bool), "params": [...] } ] } ]
                       properties/functions set on widgets ("kind":"func" = a data-cb-func
                       functionality; "kind":"param" = a data-cb-* parameter of it)
"workflow"  - array describing the workflow changes of that run (e.g. nodes created, their
              type and parameters)
"clarification" - array of { "question", "answer" } turns if the user was asked and
                  answered clarifying questions during that run
