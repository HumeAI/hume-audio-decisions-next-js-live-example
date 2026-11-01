// The API converts all audio to 16 kHz mono, so sending a higher rate only
// makes each upload larger.
export const API_SAMPLE_RATE = 16_000;

// Loudness is perceived on a logarithmic scale. On a linear one, quiet speech
// would barely show next to loud speech.
const LEVEL_RANGE_DB = 60;

/** The loudness of a block on a 0 to 1 scale, for drawing the waveform. */
export function loudness(samples: Float32Array): number {
  let sumOfSquares = 0;
  for (const sample of samples) {
    sumOfSquares += sample * sample;
  }
  const rms = Math.sqrt(sumOfSquares / samples.length);
  const decibels = 20 * Math.log10(rms);
  return Math.min(1, Math.max(0, 1 + decibels / LEVEL_RANGE_DB));
}

export function concatenate(blocks: Float32Array[]): Float32Array<ArrayBuffer> {
  const result = new Float32Array(
    blocks.reduce((frames, block) => frames + block.length, 0),
  );
  let offset = 0;
  for (const block of blocks) {
    result.set(block, offset);
    offset += block.length;
  }
  return result;
}

export function toAudioBuffer(
  samples: Float32Array<ArrayBuffer>,
  sampleRate: number,
): AudioBuffer {
  const buffer = new AudioBuffer({
    length: samples.length,
    numberOfChannels: 1,
    sampleRate,
  });
  buffer.copyToChannel(samples, 0);
  return buffer;
}

/** Converts mono samples to another rate with the browser's own resampler. */
export async function resample(
  samples: Float32Array<ArrayBuffer>,
  fromRate: number,
  toRate: number,
): Promise<Float32Array> {
  const context = new OfflineAudioContext(
    1,
    Math.round((samples.length * toRate) / fromRate),
    toRate,
  );
  const source = new AudioBufferSourceNode(context, {
    buffer: toAudioBuffer(samples, fromRate),
  });
  source.connect(context.destination);
  source.start();
  const rendered = await context.startRendering();
  return rendered.getChannelData(0);
}
