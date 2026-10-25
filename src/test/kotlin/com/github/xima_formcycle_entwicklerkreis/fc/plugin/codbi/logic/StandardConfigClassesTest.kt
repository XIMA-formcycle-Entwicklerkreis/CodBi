package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.Test

/**
 * Tests for [StandardConfigClasses], i.e. the class → owning standard configuration index read from the
 * shipped configuration metadata.
 */
class StandardConfigClassesTest {

  @Test
  fun `resolves CodBi_NoFutureDate to Appointments applying Date_Min`() {
    val providers = StandardConfigClasses.providersOf(listOf("CodBi_NoFutureDate"))

    val provider = providers.single { it.configId == "Appointments" }
    assertEquals(listOf("Date.Min"), provider.funcs)
  }

  @Test
  fun `keeps ALL functionalities of a class that applies more than one`() {
    // `CodBi_DateFrame_*_Begin` applies both the Cleave formatting and the date-range check — the
    // END class only applies Cleave. Resolving both must not collapse them onto a single FUNC list.
    val providers = StandardConfigClasses.providersOf(
        listOf("CodBi_DateFrame_1_Begin", "CodBi_DateFrame_1_End"))

    val funcs = providers.filter { it.configId == "Appointments" }.flatMap { it.funcs }

    assertTrue(funcs.contains("Date.Frame"), "Date.Frame was lost: $funcs")
    assertTrue(funcs.contains("HTML.Input.Cleave"), "HTML.Input.Cleave was lost: $funcs")
  }

  @Test
  fun `returns every owning configuration at most once per functionality list`() {
    val providers =
        StandardConfigClasses.providersOf(listOf("CodBi_NoFutureDate", "CodBi_NoFutureDate"))

    assertEquals(1, providers.count { it.configId == "Appointments" })
  }

  @Test
  fun `ignores Holistic exclusion markers and unrelated classes`() {
    // `Holistic.*` classes are EXCLUSION markers (`CodBi_XCL_*`): a field carrying one opts OUT of a
    // form-wide configuration, so they must never auto-activate it.
    val providers =
        StandardConfigClasses.providersOf(
            listOf("CodBi_XCL_Cleave_Date", "MyOwnClass", "XItem", "XTextField"))

    assertTrue(providers.isEmpty(), "Unexpected providers: $providers")
  }
}
