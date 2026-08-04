package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.sql.Timestamp
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.Lob
import javax.persistence.Table

/**
 * JPA entity for the `codbi_ai_assistant_log` change-log table.
 *
 * One row is inserted after every successful [AICodBiAssistant] Run action. [formChanges] and
 * [workflowChanges] hold the structured JSON description of the changes applied to the form and/or
 * the workflow (see [AiAssistantLog]).
 *
 * @see AiAssistantLog
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
 */
@Entity
@Table(name = "codbi_ai_assistant_log")
class CodbiAiAssistantLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    var id: Long? = null,
    @Column(name = "ts", nullable = false, insertable = false, updatable = false)
    var ts: Timestamp? = null,
    @Column(name = "form_key", length = 200) var formKey: String? = null,
    @Column(name = "prompt", length = 1000) var prompt: String? = null,
    @Column(name = "intent", length = 20) var intent: String? = null,
    @Column(name = "model_id", length = 100) var modelId: String? = null,
    @Column(name = "tokens") var tokens: Long? = null,
    @Column(name = "workflow_version_id") var workflowVersionId: Long? = null,
    @Lob @Column(name = "form_changes") var formChanges: String? = null,
    @Lob @Column(name = "workflow_changes") var workflowChanges: String? = null
)
