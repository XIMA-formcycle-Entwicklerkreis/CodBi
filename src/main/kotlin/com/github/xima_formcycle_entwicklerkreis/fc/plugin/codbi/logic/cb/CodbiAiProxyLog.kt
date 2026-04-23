package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import java.sql.Timestamp
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.Table

/**
 * JPA entity for the `codbi_ai_proxy` audit log table.
 *
 * Contains no personal data: the [requestId] is a random UUID generated per request and is also
 * returned as the `X-CodBi-Request-Id` response header, allowing correlation with the Tomcat access
 * log without storing IP addresses or usernames.
 *
 * @see AiProxy
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
 */
@Entity
@Table(name = "codbi_ai_proxy")
class CodbiAiProxyLog(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    var id: Long? = null,
    @Column(name = "ts", nullable = false, insertable = false, updatable = false)
    var ts: Timestamp? = null,
    @Column(name = "request_id", length = 36) var requestId: String? = null,
    @Column(name = "endpoint", length = 100) var endpoint: String? = null,
    @Column(name = "status") var status: Int? = null,
    @Column(name = "detail", length = 500) var detail: String? = null,
    @Column(name = "elapsed_ms") var elapsedMs: Long? = null
)
