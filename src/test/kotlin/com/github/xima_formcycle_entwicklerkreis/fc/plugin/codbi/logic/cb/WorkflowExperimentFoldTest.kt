package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb

import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertNull
import org.junit.jupiter.api.Test

/** Tests for [findExperimentHandlerSequenceId]. */
class WorkflowExperimentFoldTest {

  // The exact existing-workflow-nodes payload from the production log: node 1680 is the
  // FC_EXPERIMENT's error-handler SEQUENCE (contains the error Abschlussseite 1681).
  private val productionNodes =
      """[{"id":"1675","type":"SEQUENCE","name":"SEQUENCE","parentId":""},""" +
          """{"id":"1676","type":"FC_EXPERIMENT","name":"HTTP-Request mit Header-Parametern und HTML-Body","parentId":"1675"},""" +
          """{"id":"1677","type":"SEQUENCE","name":"FcExperimentBodyHandler","parentId":"1676"},""" +
          """{"id":"1678","type":"FC_POST_REQUEST","name":"POST to httpsintranetstadtverwaltungloc444","parentId":"1677"},""" +
          """{"id":"1679","type":"FC_SHOW_TEMPLATE","name":"Show CodBi  Testing  Senden erfolgreich","parentId":"1677"},""" +
          """{"id":"1680","type":"SEQUENCE","name":"FcExperimentHandlerHandler","parentId":"1676"},""" +
          """{"id":"1681","type":"FC_SHOW_TEMPLATE","name":"Show Allgemeiner Fehler 2","parentId":"1680"},""" +
          """{"id":"1682","type":"FC_CHANGE_STATE","name":"FC_CHANGE_STATE","parentId":"1675"}]"""

  @Test
  fun findsHandlerSequenceInProductionNodes() {
    assertEquals(1680L, findExperimentHandlerSequenceId(productionNodes))
  }

  @Test
  fun returnsNullForBlankInput() {
    assertNull(findExperimentHandlerSequenceId(null))
    assertNull(findExperimentHandlerSequenceId(""))
    assertNull(findExperimentHandlerSequenceId("   "))
  }

  @Test
  fun returnsNullForMalformedInput() {
    assertNull(findExperimentHandlerSequenceId("not json at all"))
  }

  @Test
  fun returnsNullWhenNoExperimentExists() {
    val nodes =
        """[{"id":"1","type":"SEQUENCE","name":"SEQUENCE","parentId":""},""" +
            """{"id":"2","type":"FC_EMAIL","name":"Mail","parentId":"1"}]"""
    assertNull(findExperimentHandlerSequenceId(nodes))
  }

  @Test
  fun returnsNullWhenExperimentDoesNotWrapHttpNode() {
    val nodes =
        """[{"id":"1","type":"SEQUENCE","name":"SEQUENCE","parentId":""},""" +
            """{"id":"2","type":"FC_EXPERIMENT","name":"Exp","parentId":"1"},""" +
            """{"id":"3","type":"SEQUENCE","name":"FcExperimentBodyHandler","parentId":"2"},""" +
            """{"id":"4","type":"FC_EMAIL","name":"Mail","parentId":"3"},""" +
            """{"id":"5","type":"SEQUENCE","name":"FcExperimentHandlerHandler","parentId":"2"},""" +
            """{"id":"6","type":"FC_SHOW_TEMPLATE","name":"ErrorPage","parentId":"5"}]"""
    assertNull(findExperimentHandlerSequenceId(nodes))
  }

  @Test
  fun fallsBackToBranchWithoutHttpNodeWhenHandlerNameIsGeneric() {
    // The handler SEQUENCE does not contain "handler" in its name — the detector must fall back to
    // the FC_EXPERIMENT branch that does NOT contain the HTTP request.
    val nodes =
        """[{"id":"1","type":"SEQUENCE","name":"SEQUENCE","parentId":""},""" +
            """{"id":"2","type":"FC_EXPERIMENT","name":"Exp","parentId":"1"},""" +
            """{"id":"3","type":"SEQUENCE","name":"Normal","parentId":"2"},""" +
            """{"id":"4","type":"FC_POST_REQUEST","name":"Http","parentId":"3"},""" +
            """{"id":"5","type":"SEQUENCE","name":"Errors","parentId":"2"},""" +
            """{"id":"6","type":"FC_SHOW_TEMPLATE","name":"ErrorPage","parentId":"5"}]"""
    assertEquals(5L, findExperimentHandlerSequenceId(nodes))
  }

  @Test
  fun picksExperimentThatWrapsHttpAmongSeveral() {
    val nodes =
        """[{"id":"1","type":"SEQUENCE","name":"SEQUENCE","parentId":""},""" +
            """{"id":"2","type":"FC_EXPERIMENT","name":"ExpA","parentId":"1"},""" +
            """{"id":"3","type":"SEQUENCE","name":"A1","parentId":"2"},""" +
            """{"id":"4","type":"FC_EMAIL","name":"MailA","parentId":"3"},""" +
            """{"id":"5","type":"FC_EXPERIMENT","name":"ExpB","parentId":"1"},""" +
            """{"id":"6","type":"SEQUENCE","name":"FcExperimentBodyHandler","parentId":"5"},""" +
            """{"id":"7","type":"FC_HTTP_REQUEST","name":"Http","parentId":"6"},""" +
            """{"id":"8","type":"SEQUENCE","name":"FcExperimentHandlerHandler","parentId":"5"},""" +
            """{"id":"9","type":"FC_SHOW_TEMPLATE","name":"ErrorPage","parentId":"8"}]"""
    assertEquals(8L, findExperimentHandlerSequenceId(nodes))
  }

  @Test
  fun findsHandlerWhenBothExperimentBranchesShareGenericName() {
    // Production structure after the experiment was rebuilt: both SEQUENCE children are named
    // "FcSequenceHandler" — only the branch that does NOT contain the HTTP request is the handler.
    val nodes =
        """[{"id":"1675","type":"SEQUENCE","name":"FcSequenceHandler","parentId":""},""" +
            """{"id":"1676","type":"FC_EXPERIMENT","name":"FcExperimentHandler","parentId":"1675"},""" +
            """{"id":"1677","type":"SEQUENCE","name":"FcSequenceHandler","parentId":"1676"},""" +
            """{"id":"1678","type":"FC_POST_REQUEST","name":"POST to httpsintranetstadtverwaltungloc444","parentId":"1677"},""" +
            """{"id":"1679","type":"FC_SHOW_TEMPLATE","name":"Show CodBi  Testing  Senden erfolgreich","parentId":"1677"},""" +
            """{"id":"1680","type":"SEQUENCE","name":"FcSequenceHandler","parentId":"1676"},""" +
            """{"id":"1681","type":"FC_SHOW_TEMPLATE","name":"Show Allgemeiner Fehler 2","parentId":"1680"},""" +
            """{"id":"1682","type":"FC_CHANGE_STATE","name":"New action","parentId":"1675"}]"""
    assertEquals(1680L, findExperimentHandlerSequenceId(nodes))
  }
}
