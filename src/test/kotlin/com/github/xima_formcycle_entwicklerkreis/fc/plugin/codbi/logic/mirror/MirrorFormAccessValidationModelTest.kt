package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.mirror

import com.alibaba.fastjson.JSONArray
import com.alibaba.fastjson.JSONObject
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotNull
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for the mirrored subtree's FORMCYCLE **validation model**: collecting it while the source
 * element renders, reducing it to the condition parts, and namespacing every element id so the
 * client-side condition engine resolves the mirrored elements.
 */
class MirrorFormAccessValidationModelTest {

  /** Builds the model FORMCYCLE would produce for a `XSelect` + a conditional `XSpan`. */
  private fun sampleModel(): JSONObject {
    val model = MirrorFormAccess.newValidationModel()
    val validation = model.getJSONObject("validation")
    val fields = validation.getJSONObject("fields")

    // The controlling XSelect.
    fields.put(
        "xi-sel-1",
        JSONObject().apply {
          put("hif_c", "9")
          put("hif_v", "")
          put("hif_cl", "0")
        })
    // The XSpan that is hidden depending on the select, plus value-validation rules.
    fields.put(
        "xi-span-1",
        JSONObject().apply {
          put("hif", "xi-sel-1")
          put("hif_c", "1")
          put("hif_v", "hide")
          put("hif_cl", "0")
          put("vdt", "text")
          put("vr", "true")
        })
    // A field that references an element OUTSIDE the mirrored subtree.
    fields.put(
        "xi-span-2",
        JSONObject().apply {
          put("hif", "xi-outside")
          put("hif_c", "1")
          put("hif_v", "x")
        })

    val revids = validation.getJSONObject("revids")
    revids
        .getJSONObject("hidden")
        .put("xi-sel-1", JSONArray().apply { add("xi-span-1"); add("xi-span-2") })
    revids.getJSONObject("formula").getJSONArray("hidden").add("xi-span-1")
    return model
  }

  @Test
  fun newValidationModel_hasAllBucketsForcycleRegistersInto() {
    val validation = MirrorFormAccess.newValidationModel().getJSONObject("validation")
    assertNotNull(validation)
    assertNotNull(validation.getJSONObject("fields"))
    val revids = validation.getJSONObject("revids")
    assertNotNull(revids)
    for (bucket in listOf("groups", "equal", "required", "hidden", "readonly", "trigger")) {
      assertNotNull(revids.getJSONObject(bucket), "missing revids bucket '$bucket'")
    }
    val formula = revids.getJSONObject("formula")
    assertNotNull(formula)
    for (kind in listOf("hidden", "readonly", "required")) {
      assertNotNull(formula.getJSONArray(kind), "missing formula list '$kind'")
    }
  }

  @Test
  fun conditionsOnly_keepsConditionsButDropsValueValidation() {
    val conditions = MirrorFormAccess.conditionsOnly(sampleModel())
    val fields = conditions.getJSONObject("validation").getJSONObject("fields")

    val span = fields.getJSONObject("xi-span-1")
    assertNotNull(span)
    assertEquals("xi-sel-1", span.getString("hif"))
    assertEquals("1", span.getString("hif_c"))
    assertEquals("hide", span.getString("hif_v"))
    assertEquals("0", span.getString("hif_cl"))
    // Value validation must NOT be activated for a mirrored field.
    assertNull(span.get("vdt"))
    assertNull(span.get("vr"))

    // The controlling element keeps its own (empty) descriptor so the runtime can resolve it.
    assertTrue(fields.containsKey("xi-sel-1"))
  }

  @Test
  fun namespaceValidationModel_prefixesIdsAndTheirReferences() {
    val conditions = MirrorFormAccess.conditionsOnly(sampleModel())
    val namespaced = MirrorFormAccess.namespaceValidationModel(conditions, "mir-1_")
    val validation = namespaced.getJSONObject("validation")
    val fields = validation.getJSONObject("fields")

    // Keys are the ids used in the rendered markup …
    assertTrue(fields.containsKey("mir-1_xi-sel-1"))
    assertTrue(fields.containsKey("mir-1_xi-span-1"))
    // … and the condition references point at the namespaced controller.
    assertEquals(
        "mir-1_xi-sel-1", fields.getJSONObject("mir-1_xi-span-1").getString("hif"))
    // `hif_c`/`hif_v` are NOT ids and must survive unchanged.
    assertEquals("1", fields.getJSONObject("mir-1_xi-span-1").getString("hif_c"))
    assertEquals("hide", fields.getJSONObject("mir-1_xi-span-1").getString("hif_v"))

    // A reference to an element outside the mirrored subtree stays untouched.
    assertEquals("xi-outside", fields.getJSONObject("mir-1_xi-span-2").getString("hif"))

    // revids: controller key and dependent ids are namespaced alike.
    val hidden = validation.getJSONObject("revids").getJSONObject("hidden")
    val dependents = hidden.getJSONArray("mir-1_xi-sel-1")
    assertNotNull(dependents, "the controlling id was not namespaced")
    assertEquals(listOf("mir-1_xi-span-1", "mir-1_xi-span-2"), dependents.map { it.toString() })

    // Formula conditions carry id lists (no controlling element).
    val formula = validation.getJSONObject("revids").getJSONObject("formula")
    assertEquals(listOf("mir-1_xi-span-1"), formula.getJSONArray("hidden").map { it.toString() })
  }

  @Test
  fun namespaceValidationModel_leavesModelsWithoutConditionsAlone() {
    val model = MirrorFormAccess.newValidationModel()
    val namespaced = MirrorFormAccess.namespaceValidationModel(model, "mir-1_")
    assertTrue(namespaced.getJSONObject("validation").getJSONObject("fields").isEmpty())
    assertFalse(namespaced.getJSONObject("validation").getJSONObject("revids").isEmpty())
  }

  @Test
  fun conditionModelPayload_isTheInnerValidationObjectExpectedByTheMergeScript() {
    val namespaced =
        MirrorFormAccess.namespaceValidationModel(
            MirrorFormAccess.conditionsOnly(sampleModel()), "mir-1_")

    val payload = MirrorFormAccess.conditionModelPayload(namespaced)
    assertNotNull(payload)
    val parsed = JSONObject.parseObject(payload)
    // The merge script reads `data.fields` / `data.revids` — i.e. the payload must NOT wrap them in
    // another `validation` object (that mistake made the whole merge a silent no-op).
    assertNull(parsed.get("validation"))
    assertNotNull(parsed.getJSONObject("fields"))
    assertNotNull(parsed.getJSONObject("revids"))
    assertTrue(parsed.getJSONObject("fields").containsKey("mir-1_xi-span-1"))
  }

  @Test
  fun conditionModelPayload_isNullWithoutAnyConditions() {
    assertNull(
        MirrorFormAccess.conditionModelPayload(
            MirrorFormAccess.conditionsOnly(MirrorFormAccess.newValidationModel())))
  }
}
