/**
 * Decodes a base64 string into a Uint8Array of bytes.
 */
export function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (from Gemini TTS) into an AudioBuffer.
 * Gemini TTS typically returns raw PCM 16-bit mono at 24kHz.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  // Convert Uint8Array (bytes) to Int16Array
  const dataInt16 = new Int16Array(data.buffer);
  
  // Create an AudioBuffer
  const buffer = ctx.createBuffer(numChannels, dataInt16.length, sampleRate);
  
  // Fill the buffer with float data converted from Int16
  const channelData = buffer.getChannelData(0); // Mono
  for (let i = 0; i < dataInt16.length; i++) {
    // Convert 16-bit integer (-32768 to 32767) to float (-1.0 to 1.0)
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}

/**
 * Converts a Blob to a Base64 string.
 */
export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      // Remove the Data URL prefix (e.g., "data:audio/wav;base64,")
      const base64 = base64String.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Converts an AudioBuffer to a WAV Blob.
 * Useful for downloading the generated audio.
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // write RIFF chunk descriptor
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + buffer.length * 2, true);
  writeString(view, 8, 'WAVE');

  // write fmt sub-chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numOfChan, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * 2 * numOfChan, true);
  view.setUint16(32, numOfChan * 2, true);
  view.setUint16(34, 16, true);

  // write data sub-chunk
  writeString(view, 36, 'data');
  view.setUint32(40, buffer.length * numOfChan * 2, true);

  // write interleaved data
  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  offset = 44;
  while (pos < buffer.length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][pos])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([view], { type: 'audio/wav' });
}

export async function audioBufferToMp3(buffer: AudioBuffer): Promise<Blob> {
  // @ts-ignore
  const lamejs = (await import('lamejs')).default || (await import('lamejs'));
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  
  // Mp3Encoder(channels, sampleRate, kbps)
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, 128);
  const mp3Data: Int8Array[] = [];

  const samples = buffer.getChannelData(0);
  const sampleBlockSize = 1152;
  const int16Samples = new Int16Array(samples.length);
  
  for (let i = 0; i < samples.length; i++) {
    let sample = Math.max(-1, Math.min(1, samples[i]));
    int16Samples[i] = (sample < 0 ? sample * 32768 : sample * 32767) | 0;
  }

  for (let i = 0; i < int16Samples.length; i += sampleBlockSize) {
    const chunk = int16Samples.subarray(i, i + sampleBlockSize);
    const mp3buf = mp3encoder.encodeBuffer(chunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Int8Array(mp3buf));
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Int8Array(mp3buf));
  }

  return new Blob(mp3Data, { type: 'audio/mp3' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}