// The rendering thread delivers input in blocks of 128 frames, so samples are
// gathered here and posted as `{ samples, final }` once a chunk of
// `processorOptions.chunkFrames` fills. A "flush" message posts whatever is
// buffered, possibly nothing, with `final: true`, and is always the last
// message. Whatever is buffered when the AudioContext closes is discarded.
class PcmChunker extends AudioWorkletProcessor {
  constructor(options) {
    super();
    // Transferring a chunk detaches its buffer, after which its length reads
    // as 0, so the size is kept separately.
    this.chunkFrames = options.processorOptions.chunkFrames;
    this.chunk = new Float32Array(this.chunkFrames);
    this.filled = 0;
    this.flushed = false;
    this.port.onmessage = (event) => {
      if (event.data === "flush" && !this.flushed) {
        this.flushed = true;
        const samples = this.chunk.slice(0, this.filled);
        this.port.postMessage({ samples, final: true }, [samples.buffer]);
      }
    };
  }

  process(inputs) {
    const channel = inputs[0]?.[0];
    if (!channel || this.flushed) {
      return true;
    }

    let offset = 0;
    while (offset < channel.length) {
      const count = Math.min(
        channel.length - offset,
        this.chunkFrames - this.filled,
      );
      this.chunk.set(channel.subarray(offset, offset + count), this.filled);
      this.filled += count;
      offset += count;

      if (this.filled === this.chunkFrames) {
        this.port.postMessage({ samples: this.chunk, final: false }, [
          this.chunk.buffer,
        ]);
        this.chunk = new Float32Array(this.chunkFrames);
        this.filled = 0;
      }
    }
    return true;
  }
}

registerProcessor("pcm-chunker", PcmChunker);
