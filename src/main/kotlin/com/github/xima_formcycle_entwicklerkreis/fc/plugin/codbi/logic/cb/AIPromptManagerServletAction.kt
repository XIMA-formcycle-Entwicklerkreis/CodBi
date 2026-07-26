package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodbiEntities
import com.google.gson.GsonBuilder
import com.google.gson.JsonParser
import de.xima.fc.interfaces.plugin.param.servlet.IPluginServletActionParams
import de.xima.fc.interfaces.plugin.retval.servlet.IPluginServletActionRetVal
import de.xima.fc.mdl.fdv.EResponseType
import de.xima.fc.mdl.response.ServletResponse
import de.xima.fc.plugin.interfaces.servlet.IPluginServletAction
import de.xima.fc.plugin.models.retval.servlet.PluginServletActionRetVal
import javax.persistence.EntityManager
import org.slf4j.LoggerFactory

/**
 * Prompt Manager servlet — CRUD REST API for the [codbi_ai_prompt] and [codbi_compact_prompt]
 * tables. The `X-View` header selects which table to operate on:
 * - `"condensed"` → [codbi_compact_prompt] (managed by [CompactPromptLoader])
 * - `"detailed"` (default) → [codbi_ai_prompt] (managed by [PromptLoader])
 */
class AIPromptManagerServletAction : IPluginServletAction {

  private val logger = LoggerFactory.getLogger(AIPromptManagerServletAction::class.java)
  private val gson = GsonBuilder().setPrettyPrinting().create()

  override fun getName(): String = "CodBi_AIPromptManager"

  override fun execute(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val action =
        params.headerMap.entries.find { it.key.equals("X-Action", ignoreCase = true) }?.value
    return when (action) {
      "ListAll" -> handleListAll(params)
      "SaveOne" -> handleSaveOne(params)
      "RestoreOriginal" -> handleRestoreOriginal(params)
      "ToggleActive" -> handleToggleActive(params)
      "Export" -> handleExport(params)
      "Import" -> handleImport(params)
      else -> jsonResponse("""{"error":"Unknown action"}""")
    }
  }

  // region Loader routing

  /** Unified interface over both [PromptLoader] and [CompactPromptLoader]. */
  private interface LoaderApi {
    fun listAllPrompts(em: EntityManager): List<*>

    fun savePrompt(
        em: EntityManager,
        key: String,
        promptText: String?,
        prePrompt: String?,
        postPrompt: String?,
        isActive: Boolean,
        displayName: String?
    )

    fun restoreOriginal(em: EntityManager, key: String)

    fun toggleActive(em: EntityManager, key: String): Boolean

    fun importPrompt(
        em: EntityManager,
        key: String,
        displayName: String?,
        promptText: String,
        prePrompt: String?,
        postPrompt: String?
    )
  }

  private fun resolveLoader(params: IPluginServletActionParams): LoaderApi {
    val view =
        params.headerMap.entries.find { it.key.equals("X-View", ignoreCase = true) }?.value
            ?: "detailed"
    return if (view.equals("condensed", ignoreCase = true)) CompactApi else DetailedApi
  }

  private object DetailedApi : LoaderApi {
    override fun listAllPrompts(em: EntityManager) = PromptLoader.listAllPrompts(em)

    override fun savePrompt(
        em: EntityManager,
        key: String,
        promptText: String?,
        prePrompt: String?,
        postPrompt: String?,
        isActive: Boolean,
        displayName: String?
    ) = PromptLoader.savePrompt(em, key, promptText, prePrompt, postPrompt, isActive, displayName)

    override fun restoreOriginal(em: EntityManager, key: String) =
        PromptLoader.restoreOriginal(em, key)

    override fun toggleActive(em: EntityManager, key: String) = PromptLoader.toggleActive(em, key)

    override fun importPrompt(
        em: EntityManager,
        key: String,
        displayName: String?,
        promptText: String,
        prePrompt: String?,
        postPrompt: String?
    ) = PromptLoader.importPrompt(em, key, displayName, promptText, prePrompt, postPrompt)
  }

  private object CompactApi : LoaderApi {
    override fun listAllPrompts(em: EntityManager) = CompactPromptLoader.listAllPrompts(em)

    override fun savePrompt(
        em: EntityManager,
        key: String,
        promptText: String?,
        prePrompt: String?,
        postPrompt: String?,
        isActive: Boolean,
        displayName: String?
    ) =
        CompactPromptLoader.savePrompt(
            em, key, promptText, prePrompt, postPrompt, isActive, displayName)

    override fun restoreOriginal(em: EntityManager, key: String) =
        CompactPromptLoader.restoreOriginal(em, key)

    override fun toggleActive(em: EntityManager, key: String) =
        CompactPromptLoader.toggleActive(em, key)

    override fun importPrompt(
        em: EntityManager,
        key: String,
        displayName: String?,
        promptText: String,
        prePrompt: String?,
        postPrompt: String?
    ) = CompactPromptLoader.importPrompt(em, key, displayName, promptText, prePrompt, postPrompt)
  }

  // endregion

  // region Actions

  private fun handleListAll(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val prompts = loader.listAllPrompts(em)
      val json = gson.toJson(mapOf("status" to "ok", "prompts" to prompts))
      return jsonResponse(json)
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] ListAll failed", e)
      return jsonResponse("""{"error":"ListAll failed"}""")
    } finally {
      em.close()
    }
  }

  private fun readBody(params: IPluginServletActionParams): String? =
      params.requestParameters["body"]?.firstOrNull()

  private fun handleSaveOne(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val body = readBody(params) ?: return jsonResponse("""{"error":"No body"}""")
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val obj = JsonParser.parseString(body).asJsonObject
      val key =
          obj.get("prompt_key")?.asString
              ?: return jsonResponse("""{"error":"Missing prompt_key"}""")
      val promptText = obj.get("prompt_text")?.asString
      val prePrompt = obj.get("pre_prompt")?.asString?.ifBlank { null }
      val postPrompt = obj.get("post_prompt")?.asString?.ifBlank { null }
      val isActive = obj.get("is_active")?.asBoolean ?: true
      val displayName = obj.get("display_name")?.asString
      loader.savePrompt(em, key, promptText, prePrompt, postPrompt, isActive, displayName)
      return jsonResponse("""{"status":"ok"}""")
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] SaveOne failed", e)
      return jsonResponse("""{"error":"SaveOne failed"}""")
    } finally {
      em.close()
    }
  }

  private fun handleRestoreOriginal(
      params: IPluginServletActionParams
  ): IPluginServletActionRetVal {
    val body = readBody(params) ?: return jsonResponse("""{"error":"No body"}""")
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val obj = JsonParser.parseString(body).asJsonObject
      val key =
          obj.get("prompt_key")?.asString
              ?: return jsonResponse("""{"error":"Missing prompt_key"}""")
      loader.restoreOriginal(em, key)
      return jsonResponse("""{"status":"ok"}""")
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] RestoreOriginal failed", e)
      return jsonResponse("""{"error":"RestoreOriginal failed"}""")
    } finally {
      em.close()
    }
  }

  private fun handleToggleActive(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val body = readBody(params) ?: return jsonResponse("""{"error":"No body"}""")
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val obj = JsonParser.parseString(body).asJsonObject
      val key =
          obj.get("prompt_key")?.asString
              ?: return jsonResponse("""{"error":"Missing prompt_key"}""")
      val newValue = loader.toggleActive(em, key)
      return jsonResponse("""{"status":"ok","is_active":$newValue}""")
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] ToggleActive failed", e)
      return jsonResponse("""{"error":"ToggleActive failed"}""")
    } finally {
      em.close()
    }
  }

  private fun handleExport(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val key =
        params.requestParameters["prompt_key"]?.firstOrNull()
            ?: return jsonResponse("""{"error":"Missing prompt_key"}""")
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val all = loader.listAllPrompts(em)
      val records = all as? List<*>
      val record =
          records?.find { it is PromptLoader.PromptRecord && it.promptKey == key }
              ?: records?.find { it is CompactPromptLoader.CompactRecord && it.promptKey == key }
              ?: return jsonResponse("""{"error":"Prompt not found"}""")
      val promptKey = key
      val displayName =
          when (record) {
            is PromptLoader.PromptRecord -> record.displayName
            is CompactPromptLoader.CompactRecord -> record.displayName
            else -> ""
          }
      val promptText =
          when (record) {
            is PromptLoader.PromptRecord -> record.promptText
            is CompactPromptLoader.CompactRecord -> record.promptText
            else -> ""
          }
      val prePrompt =
          when (record) {
            is PromptLoader.PromptRecord -> record.prePrompt
            is CompactPromptLoader.CompactRecord -> record.prePrompt
            else -> ""
          }
      val postPrompt =
          when (record) {
            is PromptLoader.PromptRecord -> record.postPrompt
            is CompactPromptLoader.CompactRecord -> record.postPrompt
            else -> ""
          }
      val category =
          when (record) {
            is PromptLoader.PromptRecord -> record.category
            is CompactPromptLoader.CompactRecord -> record.category
            else -> ""
          }
      val exportObj =
          mapOf(
              "prompt_key" to promptKey,
              "display_name" to (displayName ?: ""),
              "prompt_text" to (promptText ?: ""),
              "pre_prompt" to (prePrompt ?: ""),
              "post_prompt" to (postPrompt ?: ""),
              "category" to (category ?: ""))
      val json = gson.toJson(exportObj)
      return jsonResponse(json)
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] Export failed", e)
      return jsonResponse("""{"error":"Export failed"}""")
    } finally {
      em.close()
    }
  }

  private fun handleImport(params: IPluginServletActionParams): IPluginServletActionRetVal {
    val body = readBody(params) ?: return jsonResponse("""{"error":"No body"}""")
    val emf =
        CodbiEntities.entityManagerFactory ?: return jsonResponse("""{"error":"DB not ready"}""")
    val em = emf.createEntityManager()
    val loader = resolveLoader(params)
    try {
      val obj = JsonParser.parseString(body).asJsonObject
      val key =
          obj.get("prompt_key")?.asString
              ?: return jsonResponse("""{"error":"Missing prompt_key"}""")
      val promptText =
          obj.get("prompt_text")?.asString
              ?: return jsonResponse("""{"error":"Missing prompt_text"}""")
      val prePrompt = obj.get("pre_prompt")?.asString?.ifBlank { null }
      val postPrompt = obj.get("post_prompt")?.asString?.ifBlank { null }
      val displayName = obj.get("display_name")?.asString
      loader.importPrompt(em, key, displayName, promptText, prePrompt, postPrompt)
      return jsonResponse("""{"status":"ok"}""")
    } catch (e: Exception) {
      logger.warn("[AIPromptManager] Import failed", e)
      return jsonResponse("""{"error":"Import failed"}""")
    } finally {
      em.close()
    }
  }

  // endregion

  private fun jsonResponse(json: String): IPluginServletActionRetVal =
      PluginServletActionRetVal(ServletResponse(EResponseType.JSON, json))
}
