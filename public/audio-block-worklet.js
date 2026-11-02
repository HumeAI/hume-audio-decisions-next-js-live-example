// Runs on the audio rendering thread, which delivers input 128 frames at a
// time. The frames are gathered into blocks of `processorOptions.blockFrames`
// so the main thread receives a few messages a second rather than hundreds.
class AudioBlockProcessor extends AudioWorkletProcessor {
  constructor(options) {
    super();
    this.blockFrames = options.processorOptions.blockFrames;
    this.block = new Float32Array(this.blockFrames);
    this.filled = 0;
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel) {
      return true;
    }

    let offset = 0;
    while (offset < channel.length) {
      const count = Math.min(
        channel.length - offset,
        this.blockFrames - this.filled,
      );
      this.block.set(channel.subarray(offset, offset + count), this.filled);
      this.filled += count;
      offset += count;

      if (this.filled === this.blockFrames) {
        // Transferring the buffer hands it over without a copy, which leaves
        // this.block unusable, so a new one is started.
        this.port.postMessage(this.block, [this.block.buffer]);
        this.block = new Float32Array(this.blockFrames);
        this.filled = 0;
      }
    }
    return true;
  }
}

registerProcessor("audio-block", AudioBlockProcessor);
