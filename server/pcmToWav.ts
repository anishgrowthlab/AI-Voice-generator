/**
 * Helper to ensure audio buffers are properly wrapped in standard RIFF WAV container.
 * Gemini TTS often returns raw 24kHz 16-bit Mono PCM data (audio/pcm;rate=24000).
 * Standard browsers require a standard RIFF WAV header to play in <audio> elements and download as .wav.
 */

export function ensureWav(buffer: Buffer, sampleRate: number = 24000): Buffer {
  // Check if buffer is already a valid RIFF WAV
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    return buffer;
  }

  const numChannels = 1;
  const bitDepth = 16;
  const byteRate = sampleRate * numChannels * (bitDepth / 8);
  const blockAlign = numChannels * (bitDepth / 8);
  const dataSize = buffer.length;
  const header = Buffer.alloc(44);

  // Chunk ID
  header.write('RIFF', 0);
  // Chunk Size: 36 + SubChunk2Size
  header.writeUInt32LE(36 + dataSize, 4);
  // Format
  header.write('WAVE', 8);

  // Subchunk1 ID
  header.write('fmt ', 12);
  // Subchunk1 Size (16 for PCM)
  header.writeUInt32LE(16, 16);
  // Audio Format (1 for PCM)
  header.writeUInt16LE(1, 20);
  // Number of Channels (1 = Mono)
  header.writeUInt16LE(numChannels, 22);
  // Sample Rate (e.g. 24000 Hz)
  header.writeUInt32LE(sampleRate, 24);
  // Byte Rate
  header.writeUInt32LE(byteRate, 28);
  // Block Align
  header.writeUInt16LE(blockAlign, 32);
  // Bits Per Sample
  header.writeUInt16LE(bitDepth, 34);

  // Subchunk2 ID
  header.write('data', 36);
  // Subchunk2 Size
  header.writeUInt32LE(dataSize, 40);

  return Buffer.concat([header, buffer]);
}
