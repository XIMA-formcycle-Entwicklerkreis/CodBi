package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.sql.Timestamp
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.Table

/**
 * JPA entity for the `codbi_ai_log_sensitive_check` table.
 *
 * One row is stored whenever a user ticks the dismiss checkbox on a sensitive element occurrence in
 * the AI change log, so the check is attributable and survives page reloads / other designer
 * sessions. A row is keyed by (log entry id, element name, user login) — deleting the row un-checks
 * it again.
 *
 * @see AiAssistantLog
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
 */
@Entity
@Table(name = "codbi_ai_log_sensitive_check")
// JPA/Hibernate requires a no-arg constructor on every entity (it instantiates the class to build
// the persistence context). Giving every constructor parameter a default makes Kotlin emit the
// public no-arg constructor automatically. Without it, persisting a check failed with
// "No default constructor for entity ... CodbiAiLogSensitiveCheck".
class CodbiAiLogSensitiveCheck(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    var id: Long? = null,
    @Column(name = "log_entry_id", nullable = false) var logEntryId: Long = 0,
    @Column(name = "element_name", length = 200, nullable = false) var elementName: String = "",
    @Column(name = "username", length = 200, nullable = false) var username: String = "",
    @Column(name = "checked_at", nullable = false, insertable = false, updatable = false)
    var checkedAt: Timestamp? = null
)
