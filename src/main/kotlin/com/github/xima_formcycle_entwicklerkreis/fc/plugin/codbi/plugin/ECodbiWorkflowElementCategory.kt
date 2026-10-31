package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.plugin

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.localize
import de.xima.fc.beans.interfaces.IGuiIcon
import de.xima.fc.interfaces.workflow.mixin.IElementCategory
import de.xima.fc.mdl.ui.GuiIcon
import java.util.Locale

/**
 * Categories used by the CodBi workflow nodes in the workflow designer.
 *
 * The main category creates a dedicated "CodBi" section; the sub-category groups the data-access
 * related nodes below it.
 */
enum class ECodbiWorkflowElementCategory(
    private val sortKey: String,
    private val icon: IGuiIcon,
    private val labelKey: String,
) : IElementCategory {
  MAIN_CODBI("fc-element-cat-40-10", GuiIcon.valueOf("fa-magic"), "workflow.category.codbi"),
  SUB_CODBI_ACCESS(
      "fc-element-cat-40-20",
      GuiIcon.valueOf("fa-external-link"),
      "workflow.category.extended_access",
  ),
  SUB_CODBI_MIRROR(
      "fc-element-cat-40-30",
      GuiIcon.valueOf("fa-clone"),
      "workflow.category.mirror",
  );

  override fun getName(locale: Locale): String = localize(labelKey, locale, name)

  override fun getSortKey(): String = sortKey

  override fun getIcon(): IGuiIcon = icon
}
