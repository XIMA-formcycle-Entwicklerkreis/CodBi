package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.LocalAPIDoc

import java.sql.Timestamp
import javax.persistence.Column
import javax.persistence.Entity
import javax.persistence.GeneratedValue
import javax.persistence.GenerationType
import javax.persistence.Id
import javax.persistence.Lob
import javax.persistence.Table

/**
 * JPA entity for the `codbi_local_apidoc` key-value storage table.
 *
 * @see Access
 * @see com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
 */
@Entity
@Table(name = "codbi_local_apidoc")
class CodbiLocalApidoc(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    var id: Long? = null,
    @Column(name = "data_key", nullable = false, unique = true, length = 500)
    var dataKey: String = "",
    @Lob @Column(name = "content") var content: String? = null,
    @Column(name = "updated_at", nullable = false)
    var updatedAt: Timestamp = Timestamp(System.currentTimeMillis())
)
