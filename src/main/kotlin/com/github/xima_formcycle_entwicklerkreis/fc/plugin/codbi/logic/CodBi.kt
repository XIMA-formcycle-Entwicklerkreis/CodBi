package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic

import org.slf4j.LoggerFactory

/**
 * # Root base class for all CodBi components.
 *
 * Provides a shared [log]ger that posts messages to the console in the format **[[ CodBi /
 * [idLogMessages] ] ...message... ]**.
 *
 * Subclasses set [idLogMessages] to their own subsystem name (e.g. "AI", "Tesseract", "LLAMA") to
 * identify log output.
 */
abstract class CodBi {

  /**
   * The predicate used to [log] messages related to this CodBi component to the console (defaults
   * to an empty string).
   */
  protected var idLogMessages = ""

  /** Defines the various importance-states that can be passed to the [log]ger. */
  enum class LogLevel {
    INFO,
    WARNING,
    ERROR
  }

  /** The [org.slf4j.Logger] for this CodBi component. */
  protected val logger = LoggerFactory.getLogger(this::class.java)

  /**
   * Posts log message to the console signed with **[[ CodBi / [idLogMessages] ] **...message...**
   * ]** of a specified importance (info or error).
   *
   * @param importance The [LogLevel] for this message.
   * @param toLog The message itself.
   * @param adjenct A message to append to the message.
   * @param exception The [Throwable] [Object] this message is about.
   */
  protected open fun log(
      importance: LogLevel,
      toLog: String,
      adjenct: String = "",
      exception: Throwable? = null
  ) {
    val message =
        "[[ CodBi${ if( idLogMessages.isEmpty()) "" else " / $idLogMessages$adjenct"} ] $toLog ]"

    when (importance) {
      LogLevel.INFO -> logger.info(message)
      LogLevel.WARNING -> logger.warn(message)
      LogLevel.ERROR -> {
        if (exception != null) {
          logger.error(message, exception)
        } else {
          logger.error(message)
        }
      }
    }
  }
}
