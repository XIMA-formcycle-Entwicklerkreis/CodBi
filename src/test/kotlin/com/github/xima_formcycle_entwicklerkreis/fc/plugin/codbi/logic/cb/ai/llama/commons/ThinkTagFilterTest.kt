package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [stripThinkTags], [filterThinkTags], and [flushThinkTagBuffer]. */
class ThinkTagFilterTest {

  @Nested
  inner class StripThinkTags {

    @Test
    fun returnsTextUnchangedWhenNoThinkTags() {
      assertEquals("Hello, world!", stripThinkTags("Hello, world!"))
    }

    @Test
    fun removesEmptyThinkBlock() {
      assertEquals("before  after", stripThinkTags("before <think></think> after"))
    }

    @Test
    fun removesSingleThinkBlock() {
      assertEquals("Answer is 42.", stripThinkTags("<think>Let me reason...</think>Answer is 42."))
    }

    @Test
    fun removesMultipleThinkBlocks() {
      val input = "<think>first</think>Hello <think>second</think>world"
      assertEquals("Hello world", stripThinkTags(input))
    }

    @Test
    fun removesNestedThinkBlocks() {
      // The non-greedy regex matches <think>outer <think>inner</think> first,
      // leaving " rest</think>visible". The second pass has no opening <think>,
      // so the remaining </think> is kept as literal text.
      val input = "<think>outer <think>inner</think> rest</think>visible"
      assertEquals("rest</think>visible", stripThinkTags(input))
    }

    @Test
    fun trimsResult() {
      assertEquals("result", stripThinkTags("  <think>thinking</think>  result  "))
    }

    @Test
    fun handlesEmptyString() {
      assertEquals("", stripThinkTags(""))
    }

    @Test
    fun handlesOnlyThinkBlock() {
      assertEquals("", stripThinkTags("<think>only thinking</think>"))
    }

    @Test
    fun handlesMultilineThinkContent() {
      val input = "<think>\nline1\nline2\nline3\n</think>Final answer."
      assertEquals("Final answer.", stripThinkTags(input))
    }

    @Test
    fun preservesSpecialCharactersOutsideThinkTags() {
      val input = "<think>ignored</think>Special chars: <>&\"'"
      assertEquals("Special chars: <>&\"'", stripThinkTags(input))
    }
  }

  @Nested
  inner class FilterThinkTagsTest {

    @Test
    fun passesPlainTextThrough() {
      val result = filterThinkTags("Hello world", "", false)
      assertEquals("Hello world", result.output)
      assertFalse(result.insideThinkBlock)
      assertEquals("", result.thinkingText)
      assertEquals("", result.tagBuffer)
    }

    @Test
    fun filtersCompleteThinkBlockInSingleChunk() {
      val result = filterThinkTags("<think>reasoning</think>visible", "", false)
      assertEquals("visible", result.output)
      assertFalse(result.insideThinkBlock)
      assertEquals("reasoning", result.thinkingText)
      assertEquals("", result.tagBuffer)
    }

    @Test
    fun handlesOpenTagSplitAcrossChunks() {
      // First chunk ends with partial "<thi"
      val r1 = filterThinkTags("Hello <thi", "", false)
      assertEquals("Hello ", r1.output)
      assertEquals("<thi", r1.tagBuffer)
      assertFalse(r1.insideThinkBlock)

      // Second chunk completes the tag
      val r2 = filterThinkTags("nk>reasoning</think>done", r1.tagBuffer, r1.insideThinkBlock)
      assertEquals("done", r2.output)
      assertFalse(r2.insideThinkBlock)
      assertEquals("reasoning", r2.thinkingText)
      assertEquals("", r2.tagBuffer)
    }

    @Test
    fun handlesCloseTagSplitAcrossChunks() {
      // When inside a think block and only the partial tag is the chunk,
      // the code buffers it if remaining.length < 8 and it prefixes </think>
      val r1 = filterThinkTags("</thi", "", true)
      assertTrue(r1.insideThinkBlock)
      assertEquals("</thi", r1.tagBuffer)
      assertEquals("", r1.output)

      // Next chunk completes the close tag
      val r2 = filterThinkTags("nk>visible text", r1.tagBuffer, r1.insideThinkBlock)
      assertFalse(r2.insideThinkBlock)
      assertEquals("visible text", r2.output)
    }

    @Test
    fun handlesThinkBlockSpanningMultipleChunks() {
      val r1 = filterThinkTags("<think>start of", "", false)
      assertTrue(r1.insideThinkBlock)
      assertEquals("", r1.output)

      val r2 = filterThinkTags(" reasoning", r1.tagBuffer, r1.insideThinkBlock)
      assertTrue(r2.insideThinkBlock)
      assertEquals("", r2.output)

      val r3 = filterThinkTags(" end</think>answer", r2.tagBuffer, r2.insideThinkBlock)
      assertFalse(r3.insideThinkBlock)
      assertEquals("answer", r3.output)
    }

    @Test
    fun capturesThinkingTextFromInsideBlock() {
      val result = filterThinkTags("<think>deep thought</think>", "", false)
      assertEquals("deep thought", result.thinkingText)
    }

    @Test
    fun handlesEmptyChunk() {
      val result = filterThinkTags("", "", false)
      assertEquals("", result.output)
      assertFalse(result.insideThinkBlock)
      assertEquals("", result.thinkingText)
      assertEquals("", result.tagBuffer)
    }

    @Test
    fun handlesEmptyChunkInsideThinkBlock() {
      val result = filterThinkTags("", "", true)
      assertEquals("", result.output)
      assertTrue(result.insideThinkBlock)
    }

    @Test
    fun handlesMultipleThinkBlocksInOneChunk() {
      val result = filterThinkTags("<think>a</think>text1<think>b</think>text2", "", false)
      assertEquals("text1text2", result.output)
      assertFalse(result.insideThinkBlock)
    }

    @Test
    fun buffersPartialOpenTagAtEndOfChunk() {
      val result = filterThinkTags("text<", "", false)
      assertEquals("text", result.output)
      assertEquals("<", result.tagBuffer)
    }

    @Test
    fun buffersLongerPartialOpenTag() {
      val result = filterThinkTags("text<thin", "", false)
      assertEquals("text", result.output)
      assertEquals("<thin", result.tagBuffer)
    }

    @Test
    fun correctlyCarriesPreviousTagBuffer() {
      val r1 = filterThinkTags("data<", "", false)
      assertEquals("data", r1.output)
      assertEquals("<", r1.tagBuffer)

      // If next chunk doesn't continue the tag, buffer should be flushed as output
      val r2 = filterThinkTags("b normal text", r1.tagBuffer, r1.insideThinkBlock)
      assertTrue(r2.output.contains("normal text"))
    }
  }

  @Nested
  inner class FlushThinkTagBufferTest {

    @Test
    fun flushesBufferAsOutputWhenOutsideThinkBlock() {
      val result = flushThinkTagBuffer("<thi", false)
      assertEquals("<thi", result.output)
      assertFalse(result.insideThinkBlock)
      assertEquals("", result.thinkingText)
      assertEquals("", result.tagBuffer)
    }

    @Test
    fun flushesBufferAsThinkingTextWhenInsideThinkBlock() {
      val result = flushThinkTagBuffer("remaining", true)
      assertEquals("", result.output)
      assertTrue(result.insideThinkBlock)
      assertEquals("remaining", result.thinkingText)
      assertEquals("", result.tagBuffer)
    }

    @Test
    fun handlesEmptyBufferOutsideBlock() {
      val result = flushThinkTagBuffer("", false)
      assertEquals("", result.output)
      assertFalse(result.insideThinkBlock)
      assertEquals("", result.thinkingText)
    }

    @Test
    fun handlesEmptyBufferInsideBlock() {
      val result = flushThinkTagBuffer("", true)
      assertEquals("", result.output)
      assertTrue(result.insideThinkBlock)
      assertEquals("", result.thinkingText)
    }
  }
}
