import { describe, expect, it } from "vitest";

import { encodeWav } from "./wav";

async function read(wav: Blob): Promise<DataView> {
  return new DataView(await wav.arrayBuffer());
}

function ascii(view: DataView, offset: number): string {
  return String.fromCharCode(...new Uint8Array(view.buffer, offset, 4));
}

describe("encodeWav", () => {
  it("writes a 16-bit mono PCM header for the sample rate", async () => {
    const view = await read(encodeWav(new Float32Array(160), 16_000));

    expect({
      riff: ascii(view, 0),
      wave: ascii(view, 8),
      format: view.getUint16(20, true),
      channels: view.getUint16(22, true),
      sampleRate: view.getUint32(24, true),
      bitsPerSample: view.getUint16(34, true),
      dataBytes: view.getUint32(40, true),
      fileBytes: view.byteLength,
    }).toEqual({
      riff: "RIFF",
      wave: "WAVE",
      format: 1,
      channels: 1,
      sampleRate: 16_000,
      bitsPerSample: 16,
      dataBytes: 320,
      fileBytes: 364,
    });
  });

  it("clamps samples outside -1 to 1 to full scale", async () => {
    const view = await read(
      encodeWav(new Float32Array([-2, -1, 0, 1, 2]), 16_000),
    );

    const samples = [0, 1, 2, 3, 4].map((i) => view.getInt16(44 + i * 2, true));
    expect(samples).toEqual([-32768, -32768, 0, 32767, 32767]);
  });
});
