package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import com.hp.gagawa.java.elements.Body
import com.hp.gagawa.java.elements.Form
import com.hp.gagawa.java.elements.Head
import com.hp.gagawa.java.elements.Html
import de.xima.fc.common.dom.Gagawa.appendChild

internal data class HtmlDocument(
    val html: Html = Html(),
    val head: Head = Head(),
    val body: Body = Body(),
    val form: Form = Form("/submit")
) {
  init {
    appendChild(html, head, body)
    appendChild(body, form)
  }
}
