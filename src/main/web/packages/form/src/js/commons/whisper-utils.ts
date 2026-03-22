/** Shared low-level audio utilities used by both the Whisper functionality and the LLAMA Chat voice input. */

/** Returns the best supported audio MIME type for MediaRecorder. */
export function preferredMimeType(): string {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus", "audio/mp4"];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  return "";
}

/**
 * Writes a UTF-8 string into a DataView at the specified offset.
 *
 * @param view    The DataView to write into.
 * @param offset  The byte offset to start writing at.
 * @param str     The string to write. Only ASCII characters are supported in this implementation. */
function writeString(view: DataView, offset: number, str: string): void {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}

/**
 * Converts an audio Blob (WebM/Opus, etc.) to 16-bit PCM WAV using the Web Audio API.
 * This is used when the server doesn't have ffmpeg and can only accept WAV.
 *
 * @param audioBlob The input audio Blob to convert.
 *
 * @returns A Promise that resolves to a new Blob in WAV format. */
export async function convertToWav(audioBlob: Blob): Promise<Blob> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  const audioContext = new AudioContext();
  const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

  // #region Downmix to mono.
  const numFrames = audioBuffer.length;
  const sampleRate = audioBuffer.sampleRate;
  const mono = new Float32Array(numFrames);

  for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
    const channelData = audioBuffer.getChannelData(ch);

    for (let i = 0; i < numFrames; i++) {
      mono[i] += channelData[i];
    }
  }

  if (audioBuffer.numberOfChannels > 1) {
    const scale = 1 / audioBuffer.numberOfChannels;

    for (let i = 0; i < numFrames; i++) {
      mono[i] *= scale;
    }
  }
  // #endregion Downmix to mono.
  // #region Encode 16-bit PCM WAV.
  const bytesPerSample = 2;
  const dataLength = numFrames * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataLength);
  const view = new DataView(buffer);

  writeString(view, 0, "RIFF");
  view.setUint32(4, 36 + dataLength, true);
  writeString(view, 8, "WAVE");
  writeString(view, 12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 16, true); // Bits per sample.
  writeString(view, 36, "data");
  view.setUint32(40, dataLength, true);

  let offset = 44;

  for (let i = 0; i < numFrames; i++) {
    const sample = Math.max(-1, Math.min(1, mono[i]));

    view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);

    offset += 2;
  }
  // #endregion Encode 16-bit PCM WAV.
  await audioContext.close();

  return new Blob([buffer], { type: "audio/wav" });
}
