package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import de.xima.fc.fastjson.DefaultFastJsonConverter
import de.xima.fc.interfaces.plugin.retval.workflow.IFastJsonConverter
import java.lang.reflect.Type
import org.slf4j.LoggerFactory

/**
 * Diagnostic wrapper around FORMCYCLE's default FastJSON converter.
 *
 * It delegates every operation unchanged but logs the `fieldName` value that is written to and read
 * from the workflow node's custom-parameter JSON. This makes it possible to distinguish between:
 * - the value never reaching the node model (no `object -> json` entry with fieldName),
 * - the value being written correctly but not restored (no matching `json -> object` entry),
 * - the value being restored correctly but lost later (getter/execute logs).
 *
 * The converter contains no behaviour of its own and can be removed once the persistence issue is
 * resolved.
 */
class CodbiExtendedAccessorJsonConverter : IFastJsonConverter {
  private val delegate: IFastJsonConverter = DefaultFastJsonConverter.INSTANCE

  override fun <T> parseJavaArray(json: JSONArray, type: Type): List<T> =
      delegate.parseJavaArray(json, type)

  override fun <T> parseJavaArray(json: String, type: Type): List<T> =
      delegate.parseJavaArray(json, type)

  override fun <T> parseJavaObject(json: JSONObject, type: Type): T {
    logger.info(
        "[CodBi][ExtendedAccessor] json -> object type={} jsonName='{}' jsonFieldName='{}' keys={}",
        type.typeName,
        json.getString("name"),
        json.getString("fieldName"),
        json.keys,
    )
    val result = delegate.parseJavaObject<T>(json, type)
    if (result is CodbiExtendedAccessorNodeProps) {
      logger.info(
          "[CodBi][ExtendedAccessor] json -> object restored name='{}' fieldName='{}' repetitionMode='{}'",
          result.name,
          result.fieldName,
          result.repetitionMode,
      )
    }
    return result
  }

  override fun <T> parseJavaObject(json: String, type: Type): T {
    logger.info(
        "[CodBi][ExtendedAccessor] json-string -> object type={} length={}",
        type.typeName,
        json.length,
    )
    return delegate.parseJavaObject(json, type)
  }

  override fun parseJsonArray(json: String): JSONArray = delegate.parseJsonArray(json)

  override fun parseJsonObject(json: String): JSONObject = delegate.parseJsonObject(json)

  override fun toJsonObject(data: Any?): JSONObject {
    val json = delegate.toJsonObject(data)
    val fieldName = (data as? CodbiExtendedAccessorNodeProps)?.fieldName
    logger.info(
        "[CodBi][ExtendedAccessor] object -> json dataName='{}' dataFieldName='{}' jsonName='{}' jsonFieldName='{}' keys={}",
        (data as? CodbiExtendedAccessorNodeProps)?.name,
        fieldName,
        json.getString("name"),
        json.getString("fieldName"),
        json.keys,
    )
    if (fieldName.isNullOrBlank()) {
      logger.info(
          "[CodBi][ExtendedAccessor] WARNING serializing node props with an EMPTY fieldName; stack:",
          Throwable("empty-fieldName-serialization"),
      )
    }
    return json
  }

  override fun toJsonString(data: Any?): String {
    val json = delegate.toJsonString(data)
    val fieldName = (data as? CodbiExtendedAccessorNodeProps)?.fieldName
    logger.info(
        "[CodBi][ExtendedAccessor] object -> json-string dataFieldName='{}' length={}",
        fieldName,
        json.length,
    )
    if (fieldName.isNullOrBlank()) {
      logger.info(
          "[CodBi][ExtendedAccessor] WARNING serializing node props string with an EMPTY fieldName; stack:",
          Throwable("empty-fieldName-json-string"),
      )
    }
    return json
  }

  private companion object {
    private val logger = LoggerFactory.getLogger(CodbiExtendedAccessorJsonConverter::class.java)
  }
}
