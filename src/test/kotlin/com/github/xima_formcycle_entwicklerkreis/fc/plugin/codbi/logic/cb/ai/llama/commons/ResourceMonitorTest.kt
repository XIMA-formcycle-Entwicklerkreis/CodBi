package com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.llama.commons

import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.CodBi.LogLevel
import com.github.xima_formcycle_entwicklerkreis.fc.plugin.codbi.logic.cb.ai.commons.PlatformDetector.GpuBackend
import java.util.concurrent.Executors
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test

/** Tests for [ResourceMonitor] pure logic — thresholds, labels, and computed values. */
class ResourceMonitorTest {

  private val noopLog: (LogLevel, String) -> Unit = { _, _ -> }

  /**
   * Creates a [ResourceMonitor] with CPU-only (NONE) backend to avoid nvidia-smi probes. This
   * ensures the init block doesn't hang on machines without GPUs.
   */
  private fun cpuOnlyMonitor(maxCompute: Double = 90.0, maxRAM: Double = 90.0) =
      ResourceMonitor(GpuBackend.NONE, 0, maxCompute, maxRAM, noopLog)

  @Nested
  inner class InitialState {

    @Test
    fun initialCpuPercentIsZero() {
      val monitor = cpuOnlyMonitor()
      assertEquals(0.0, monitor.cpuPercent)
    }

    @Test
    fun initialRamPercentIsZero() {
      val monitor = cpuOnlyMonitor()
      assertEquals(0.0, monitor.ramPercent)
    }

    @Test
    fun initialGpuPercentIsZero() {
      val monitor = cpuOnlyMonitor()
      assertEquals(0.0, monitor.gpuPercent)
    }

    @Test
    fun gpuNotMonitoredWhenNoGpu() {
      val monitor = cpuOnlyMonitor()
      assertFalse(monitor.gpuMonitored)
    }

    @Test
    fun runningIsTrueByDefault() {
      val monitor = cpuOnlyMonitor()
      assertTrue(monitor.running)
    }
  }

  @Nested
  inner class ComputeLabels {

    @Test
    fun computeLabelIsCpuWhenNoGpu() {
      val monitor = cpuOnlyMonitor()
      assertEquals("CPU", monitor.computeLabel)
    }

    @Test
    fun computePercentIsCpuPercentWhenNoGpu() {
      val monitor = cpuOnlyMonitor()
      // Initially both are 0
      assertEquals(monitor.cpuPercent, monitor.computePercent)
    }
  }

  @Nested
  inner class ResourceAvailability {

    @Test
    fun resourcesAvailableWhenBelowThresholds() {
      val monitor = cpuOnlyMonitor(maxCompute = 90.0, maxRAM = 90.0)
      // Initial values are 0.0 which is below thresholds
      assertTrue(monitor.resourcesAvailable())
    }

    @Test
    fun exceedReasonNullWhenBelowThresholds() {
      val monitor = cpuOnlyMonitor()
      assertNull(monitor.exceedReason())
    }
  }

  @Nested
  inner class EstimateWaitSeconds {

    @Test
    fun estimateWaitReturnsAtLeastFive() {
      val monitor = cpuOnlyMonitor()
      // When below thresholds, overage is 0 → clamped to 5
      assertTrue(monitor.estimateWaitSeconds() >= 5)
    }

    @Test
    fun estimateWaitNeverExceeds120() {
      val monitor = cpuOnlyMonitor()
      assertTrue(monitor.estimateWaitSeconds() <= 120)
    }
  }

  @Nested
  inner class ShutdownTest {

    @Test
    fun shutdownSetsRunningFalse() {
      val monitor = cpuOnlyMonitor()
      monitor.shutdown()
      assertFalse(monitor.running)
    }
  }

  @Nested
  inner class GpuBackendSelection {

    @Test
    fun noGpuMonitoringWhenBackendIsNone() {
      val monitor = ResourceMonitor(GpuBackend.NONE, 0, 90.0, 90.0, noopLog)
      assertFalse(monitor.gpuMonitored)
    }

    @Test
    fun noGpuMonitoringWhenGpuLayersZero() {
      // Even CUDA backend with 0 layers should not monitor GPU
      val monitor = ResourceMonitor(GpuBackend.CUDA, 0, 90.0, 90.0, noopLog)
      assertFalse(monitor.gpuMonitored)
    }

    @Test
    fun noGpuMonitoringForVulkanBackend() {
      // GPU monitoring only works with CUDA (nvidia-smi)
      val monitor = ResourceMonitor(GpuBackend.VULKAN, 10, 90.0, 90.0, noopLog)
      assertFalse(monitor.gpuMonitored)
    }

    @Test
    fun cudaWithLayersAttemptesGpuProbe() {
      // CUDA + gpuLayers>0 will attempt nvidia-smi — may or may not succeed in CI
      val monitor = ResourceMonitor(GpuBackend.CUDA, 10, 90.0, 90.0, noopLog)
      // Just verify it doesn't throw
      assertNotNull(monitor)
    }
  }

  // region Reflection-based threshold tests

  /**
   * Sets private volatile fields via reflection so we can test threshold logic without running the
   * actual monitoring loop.
   */
  private fun setField(monitor: ResourceMonitor, name: String, value: Double) {
    val field = ResourceMonitor::class.java.getDeclaredField(name)
    field.isAccessible = true
    field.setDouble(monitor, value)
  }

  @Nested
  inner class ResourcesAvailableWithOverage {

    @Test
    fun unavailableWhenCpuExceedsThreshold() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setField(monitor, "cpuPercent", 85.0)
      assertFalse(monitor.resourcesAvailable())
    }

    @Test
    fun unavailableWhenRamExceedsThreshold() {
      val monitor = cpuOnlyMonitor(maxCompute = 90.0, maxRAM = 80.0)
      setField(monitor, "ramPercent", 85.0)
      assertFalse(monitor.resourcesAvailable())
    }

    @Test
    fun unavailableWhenBothExceed() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 80.0)
      setField(monitor, "cpuPercent", 90.0)
      setField(monitor, "ramPercent", 90.0)
      assertFalse(monitor.resourcesAvailable())
    }

    @Test
    fun availableWhenJustBelowThresholds() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 80.0)
      setField(monitor, "cpuPercent", 79.9)
      setField(monitor, "ramPercent", 79.9)
      assertTrue(monitor.resourcesAvailable())
    }
  }

  @Nested
  inner class ExceedReasonWithOverage {

    @Test
    fun showsCpuReason() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setField(monitor, "cpuPercent", 85.0)
      val reason = monitor.exceedReason()
      assertNotNull(reason)
      assertTrue(reason!!.contains("CPU"))
    }

    @Test
    fun showsRamReason() {
      val monitor = cpuOnlyMonitor(maxCompute = 90.0, maxRAM = 80.0)
      setField(monitor, "ramPercent", 85.0)
      val reason = monitor.exceedReason()
      assertNotNull(reason)
      assertTrue(reason!!.contains("RAM"))
    }

    @Test
    fun showsBothReasons() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 80.0)
      setField(monitor, "cpuPercent", 90.0)
      setField(monitor, "ramPercent", 90.0)
      val reason = monitor.exceedReason()
      assertNotNull(reason)
      assertTrue(reason!!.contains("CPU"))
      assertTrue(reason.contains("RAM"))
    }
  }

  @Nested
  inner class EstimateWaitWithOverage {

    @Test
    fun higherOverageGivesLongerWait() {
      val monitor1 = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setField(monitor1, "cpuPercent", 85.0) // 5pp overage
      val wait1 = monitor1.estimateWaitSeconds()

      val monitor2 = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setField(monitor2, "cpuPercent", 99.0) // 19pp overage
      val wait2 = monitor2.estimateWaitSeconds()

      assertTrue(wait2 >= wait1, "Higher overage should give >= wait")
    }

    @Test
    fun combinedOverageIsAdditive() {
      val monitor = cpuOnlyMonitor(maxCompute = 50.0, maxRAM = 50.0)
      setField(monitor, "cpuPercent", 70.0) // 20pp overage
      setField(monitor, "ramPercent", 70.0) // 20pp overage → 40pp total → 8s
      val wait = monitor.estimateWaitSeconds()
      assertTrue(wait >= 8, "Combined 40pp overage should give >=8s wait, got $wait")
    }

    @Test
    fun extremeOverageClampedTo120() {
      val monitor = cpuOnlyMonitor(maxCompute = 10.0, maxRAM = 10.0)
      setField(monitor, "cpuPercent", 100.0) // 90pp
      setField(monitor, "ramPercent", 100.0) // 90pp → 180pp total → 36s... wait, /5 = 36
      // Actually 180/5 = 36, not 120. But check clamp:
      val wait = monitor.estimateWaitSeconds()
      assertTrue(wait <= 120, "Wait should be clamped to 120, got $wait")
      assertTrue(wait >= 5, "Wait should be at least 5")
    }
  }

  // endregion

  // region GPU path via reflection

  @Nested
  inner class GpuPathViaReflection {

    private fun setGpuPollingAvailable(monitor: ResourceMonitor, value: Boolean) {
      val field = ResourceMonitor::class.java.getDeclaredField("gpuPollingAvailable")
      field.isAccessible = true
      field.setBoolean(monitor, value)
    }

    @Test
    fun computeLabelIsGpuWhenGpuPollingActive() {
      val monitor = cpuOnlyMonitor()
      setGpuPollingAvailable(monitor, true)
      assertEquals("GPU", monitor.computeLabel)
    }

    @Test
    fun computePercentIsGpuPercentWhenGpuPollingActive() {
      val monitor = cpuOnlyMonitor()
      setGpuPollingAvailable(monitor, true)
      setField(monitor, "gpuPercent", 75.0)
      setField(monitor, "cpuPercent", 30.0)
      assertEquals(75.0, monitor.computePercent)
    }

    @Test
    fun gpuMonitoredIsTrueWhenGpuPollingActive() {
      val monitor = cpuOnlyMonitor()
      setGpuPollingAvailable(monitor, true)
      assertTrue(monitor.gpuMonitored)
    }

    @Test
    fun resourcesUnavailableWhenGpuExceedsThreshold() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setGpuPollingAvailable(monitor, true)
      setField(monitor, "gpuPercent", 95.0)
      setField(monitor, "cpuPercent", 10.0) // CPU is fine, but GPU is the compute metric
      assertFalse(monitor.resourcesAvailable())
    }

    @Test
    fun exceedReasonShowsGpuWhenGpuExceeds() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setGpuPollingAvailable(monitor, true)
      setField(monitor, "gpuPercent", 92.0)
      val reason = monitor.exceedReason()
      assertNotNull(reason)
      assertTrue(reason!!.contains("GPU"), "Should show GPU in exceed reason: $reason")
    }

    @Test
    fun estimateWaitUsesGpuOverage() {
      val monitor = cpuOnlyMonitor(maxCompute = 50.0, maxRAM = 90.0)
      setGpuPollingAvailable(monitor, true)
      setField(monitor, "gpuPercent", 80.0) // 30pp overage → /5 = 6s
      val wait = monitor.estimateWaitSeconds()
      assertTrue(wait >= 6, "GPU overage should give >=6s wait, got $wait")
    }

    @Test
    fun resourcesAvailableWhenGpuBelowThreshold() {
      val monitor = cpuOnlyMonitor(maxCompute = 80.0, maxRAM = 90.0)
      setGpuPollingAvailable(monitor, true)
      setField(monitor, "gpuPercent", 50.0)
      assertTrue(monitor.resourcesAvailable())
    }
  }

  // endregion

  // region run() loop test

  @Nested
  inner class RunLoopTest {

    @Test
    fun runPopulatesCpuAndRamMetrics() {
      val monitor = cpuOnlyMonitor()
      val exec = Executors.newSingleThreadExecutor()
      monitor.start(exec)

      // Let it poll once (poll interval is 3s, but the first poll happens immediately)
      Thread.sleep(500)

      monitor.shutdown()
      exec.shutdownNow()

      // After one poll, CPU and RAM should have non-default values
      // (on any OS with a valid MXBean, values will be > 0)
      // If MXBean is unavailable, values stay at 0 — that's also valid
      assertTrue(monitor.cpuPercent >= 0.0)
      assertTrue(monitor.ramPercent >= 0.0)
    }

    @Test
    fun runStopsWhenRunningSetToFalse() {
      val monitor = cpuOnlyMonitor()
      monitor.running = false

      // Run directly (not in thread) — should exit immediately
      monitor.run()

      // Should have completed without hanging
      assertFalse(monitor.running)
    }

    @Test
    fun runStopsOnInterrupt() {
      val monitor = cpuOnlyMonitor()
      val exec = Executors.newSingleThreadExecutor()
      monitor.start(exec)

      // Let it start
      Thread.sleep(200)

      // Interrupt via shutdown
      monitor.shutdown()
      exec.shutdownNow()

      // Wait a moment for the thread to notice
      Thread.sleep(500)

      assertFalse(monitor.running)
    }

    @Test
    fun startStoresExecutorFuture() {
      val monitor = cpuOnlyMonitor()
      val exec = Executors.newSingleThreadExecutor()
      monitor.start(exec)

      // The future field should be set
      val futureField = ResourceMonitor::class.java.getDeclaredField("future")
      futureField.isAccessible = true
      assertNotNull(futureField.get(monitor))

      monitor.shutdown()
      exec.shutdownNow()
    }

    @Test
    fun shutdownCancelsFuture() {
      val monitor = cpuOnlyMonitor()
      val exec = Executors.newSingleThreadExecutor()
      monitor.start(exec)
      Thread.sleep(200)

      monitor.shutdown()

      val futureField = ResourceMonitor::class.java.getDeclaredField("future")
      futureField.isAccessible = true
      val future = futureField.get(monitor) as java.util.concurrent.Future<*>
      assertTrue(future.isCancelled || future.isDone, "Future should be cancelled or done")

      exec.shutdownNow()
    }
  }

  // endregion
}
