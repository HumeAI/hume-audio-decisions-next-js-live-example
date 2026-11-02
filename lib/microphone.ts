import { BLOCKS_PER_SECOND } from "./recording";

export interface Microphone {
  sampleRate: number;
  close: () => void;
}

interface MicrophoneCallbacks {
  /** Receives each block of mono samples, `1 / BLOCKS_PER_SECOND` seconds long. */
  onAudio: (samples: Float32Array, sampleRate: number) => void;
  /** Called when the browser ends the stream, such as when the device is unplugged. */
  onEnded: () => void;
}

export async function openMicrophone({
  onAudio,
  onEnded,
}: MicrophoneCallbacks): Promise<Microphone> {
  // Created before the first await, while the click still counts as a user
  // gesture. Otherwise the autoplay policy can start the context suspended.
  const context = new AudioContext();
  let stream: MediaStream | undefined;

  try {
    // Browser voice processing alters the qualities the questions ask about,
    // so the raw signal is requested instead.
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    });
    await context.audioWorklet.addModule("/audio-block-worklet.js");
  } catch (error) {
    stream?.getTracks().forEach((track) => {
      track.stop();
    });
    void context.close();
    throw error;
  }

  const blocks = new AudioWorkletNode(context, "audio-block", {
    channelCount: 1,
    channelCountMode: "explicit",
    processorOptions: {
      blockFrames: Math.round(context.sampleRate / BLOCKS_PER_SECOND),
    },
  });
  blocks.port.onmessage = ({ data }: MessageEvent<Float32Array>) => {
    onAudio(data, context.sampleRate);
  };
  // The worklet only runs while connected to the destination. It writes no
  // output, so nothing is played back.
  context
    .createMediaStreamSource(stream)
    .connect(blocks)
    .connect(context.destination);

  const tracks = stream.getTracks();
  tracks.forEach((track) => {
    track.addEventListener("ended", onEnded);
  });

  return {
    sampleRate: context.sampleRate,
    close: () => {
      tracks.forEach((track) => {
        track.removeEventListener("ended", onEnded);
        track.stop();
      });
      void context.close();
    },
  };
}

export function microphoneErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return "Microphone access is blocked. Allow it in your browser’s site settings, then press Record again.";
  }
  if (error instanceof DOMException && error.name === "NotFoundError") {
    return "No microphone was found. Connect one, then press Record again.";
  }
  return `The microphone could not be opened: ${error instanceof Error ? error.message : String(error)}`;
}
