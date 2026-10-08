package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror.XMirror
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.MIRROR_PROPERTY_ELEMENT
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.MIRROR_PROPERTY_FORM
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.Constants.PLUGIN_FORM_ELEMENT_CATALOGUE_ID
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.DESIGNER_CATEGORY_CODBI_PANEL
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_CATALOGUE_DESC
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.model.EMessageKey.PLUGIN_FORM_ELEMENT_CATALOGUE_NAME
import de.xima.fc.plugin.interfaces.form.IPluginFormElementCatalogue
import java.util.Locale

/**
 * Plugin that contributes the CodBi catalogue to the form designer's left drawer panel.
 *
 * A catalogue adds its own slider/tab (“CodBi”) offering pre-configured form elements provided by
 * the plugin. Here it exposes the [XMirror] widget so a user can drop a ready-to-configure mirror
 * onto a form.
 *
 * @since 1.0.0
 */
class CodbiFormElementCataloguePlugin : IPluginFormElementCatalogue {

  private companion object {
    /** Technical id of the (single) catalogue this plugin provides. */
    const val CATALOGUE_ID = "codbi-mirror"
  }

  override fun getName(): String = PLUGIN_FORM_ELEMENT_CATALOGUE_ID

  /** Stable, globally unique id of this catalogue plugin (required by the catalogue API). */
  override fun getId(): String = PLUGIN_FORM_ELEMENT_CATALOGUE_ID

  override fun getDisplayName(locale: Locale?): String =
      localize(PLUGIN_FORM_ELEMENT_CATALOGUE_NAME, locale ?: Locale.ENGLISH)

  override fun getDescription(locale: Locale?): String =
      localize(PLUGIN_FORM_ELEMENT_CATALOGUE_DESC, locale ?: Locale.ENGLISH)

  /**
   * Name of the catalogue shown as the drawer-panel tab. This is the branded "CodBi" label (the
   * same one used for the CodBi form-properties category), not the technical plugin name.
   */
  override fun getCatalogueName(locale: Locale): String =
      localize(DESIGNER_CATEGORY_CODBI_PANEL, locale)

  /** The list of catalogues this plugin offers (`{"id","name"}` entries). */
  override fun getCatalogueList(locale: Locale): JSONArray =
      JSONArray().apply {
        add(JSONObject().fluentPut("id", CATALOGUE_ID).fluentPut("name", getCatalogueName(locale)))
      }

  /**
   * The element templates of one catalogue. Each entry is a pre-configured form element the user
   * can drag onto the form (`{"className","properties"}`).
   */
  override fun getCatalogueData(catalogueId: String, locale: Locale): JSONArray {
    if (catalogueId != CATALOGUE_ID) return JSONArray()
    return JSONArray().apply {
      add(
          JSONObject()
              .fluentPut("className", XMirror::class.java.simpleName)
              .fluentPut(
                  "properties",
                  JSONObject()
                      .fluentPut("name", "mirFormElement")
                      .fluentPut("id", "xi-mir-form-element")
                      .fluentPut(MIRROR_PROPERTY_FORM, "")
                      .fluentPut(MIRROR_PROPERTY_ELEMENT, "")))
    }
  }
}
