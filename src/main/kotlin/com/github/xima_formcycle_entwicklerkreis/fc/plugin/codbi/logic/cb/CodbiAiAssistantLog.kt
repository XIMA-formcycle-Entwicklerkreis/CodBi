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
    @Column(name = "username", length = 200) var username: String? = null,
    @Column(name = "prompt", length = 4000) var prompt: String? = null,
    @Column(name = "intent", length = 20) var intent: String? = null,
    @Column(name = "model_id", length = 100) var modelId: String? = null,
    @Column(name = "tokens") var tokens: Long? = null,
    @Column(name = "tokens_in") var tokensIn: Long? = null,
    @Column(name = "tokens_out") var tokensOut: Long? = null,
    @Column(name = "cost") var cost: Double? = null,
    @Column(name = "currency", length = 10) var currency: String? = null,
    @Column(name = "workflow_version_id") var workflowVersionId: Long? = null,
    @Lob @Column(name = "form_changes") var formChanges: String? = null,
    @Lob @Column(name = "workflow_changes") var workflowChanges: String? = null,
    @Lob @Column(name = "clarification") var clarification: String? = null,
    @Lob @Column(name = "chat_reply") var chatReply: String? = null,
    /**
     * JSON holding the FULL resolved form items / workflow node specs this run created or changed,
     * each with the container it lives in:
     * `{"form":{"items":[{item,parent,index}],"removed":[{item,parent}]},"workflow":{"nodes":[{spec,trigger}]}}`.
     *
     * [formChanges]/[workflowChanges] only carry SUMMARIES (names, changed attributes), which is
     * not enough to rebuild anything — this column is what lets the change log re-apply an entry to
     * the CURRENT form/workflow **without another inference** (see
     * `AiAssistantLog.computeAppliedItems` and `AICodBiAssistant.handleApplyLogEntry`). `null` for
     * entries recorded before the column existed (those can only be re-applied with AI support).
     */
    @Lob @Column(name = "items") var items: String? = null,
    /**
     * The id of the log entry this row was re-applied FROM when the re-apply happened without an
     * inference (the `applyLogEntry` action) — `null` for every ordinary run. Lets the change log
     * tell an AI run apart from a deterministic re-apply of an earlier entry.
     */
    @Column(name = "applied_from") var appliedFrom: Long? = null,
    /**
     * JSON array holding one entry per AI inference ("trip") of the run — `{ "phase", "modelId",
     * "tokensIn", "tokensOut", "cost", "currency" }` — so the change log can break the run's total
     * token usage and cost down per call (e.g. two clarification rounds + pass-1 + pass-2).
     */
    @Lob @Column(name = "trips") var trips: String? = null
)
