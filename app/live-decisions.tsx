"use client";

import { useEffect, useRef, useState } from "react";

import { AnswerView } from "./answer-view";
import { formatTime } from "./format-time";
import { type LibraryQuestion, QUESTION_LIBRARY } from "./question-library";
import { useStoredString } from "./use-stored-string";
import { encodeWav } from "./wav";

const CHUNK_SECONDS = 5;

// A recording usually ends partway through a chunk. Shorter leftovers give the
// model too little to answer from, so they are not sent.
const MIN_FINAL_CHUNK_SECONDS = 1;

// Each chunk's WAV is kept in memory for replay, about 480 KB at 48 kHz, so
// only the most recent ones stay playable.
const MAX_REPLAYABLE_CHUNKS = 20;

const DEFAULT_CONTEXT = "Live microphone audio of one person speaking.";

const DEFAULT_QUESTION_IDS = new Set(["emotion"]);

const DEFAULT_QUESTIONS = JSON.stringify(
  Object.fromEntries(
    QUESTION_LIBRARY.filter((entry) => DEFAULT_QUESTION_IDS.has(entry.id)).map(
      (entry) => [entry.id, entry.question],
    ),
  ),
  null,
  2,
);

type ChunkResult =
  | { status: "pending" }
  | { status: "answered"; response: unknown; latencyMs: number }
  | { status: "failed"; error: unknown; latencyMs: number | null };

interface Chunk {
  index: number;
  startMs: number;
  durationMs: number;
  audioUrl: string | null;
  result: ChunkResult;
}

interface ChunkerMessage {
  samples: Float32Array;
  final: boolean;
}

interface Recorder {
  audioContext: AudioContext;
  releaseSource: () => void;
}

type Status = "idle" | "starting" | "listening" | "playing";

function parseQuestions(
  text: string,
): { questions: Record<string, unknown> } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return { error: errorMessage(error) };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "Questions must be a JSON object keyed by question ID." };
  }
  return { questions: parsed as Record<string, unknown> };
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// The route responds to failures with `{ message, body }`, where `body` is the
// API's own error object when the API rejected the request.
function errorDetail(body: unknown, status: number): unknown {
  if (typeof body === "object" && body !== null) {
    if ("body" in body && body.body !== undefined) {
      return body.body;
    }
    if ("message" in body) {
      return body.message;
    }
  }
  return `HTTP ${String(status)}`;
}

function teardown({ audioContext, releaseSource }: Recorder) {
  releaseSource();
  void audioContext.close();
}

export function LiveDecisions() {
  const [context, setContext] = useStoredString(
    "decisions.context",
    DEFAULT_CONTEXT,
  );
  const [questionsText, setQuestionsText] = useStoredString(
    "decisions.questions",
    DEFAULT_QUESTIONS,
  );
  const [status, setStatus] = useState<Status>("idle");
  const [startError, setStartError] = useState<string | null>(null);
  const [chunks, setChunks] = useState<Chunk[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const recorderRef = useRef<Recorder | null>(null);
  // Responses from an earlier session can arrive after a new one starts and
  // must not land in the new list, whose chunk numbers start over.
  const sessionRef = useRef(0);
  const audioUrlsRef = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parsedQuestions = parseQuestions(questionsText);

  useEffect(
    () => () => {
      if (recorderRef.current) {
        teardown(recorderRef.current);
      }
      audioUrlsRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
    },
    [],
  );

  function keepAudioUrl(url: string) {
    audioUrlsRef.current.push(url);
    const expired = audioUrlsRef.current.splice(
      0,
      Math.max(0, audioUrlsRef.current.length - MAX_REPLAYABLE_CHUNKS),
    );
    if (expired.length > 0) {
      expired.forEach((expiredUrl) => {
        URL.revokeObjectURL(expiredUrl);
      });
      setChunks((current) =>
        current.map((chunk) =>
          chunk.audioUrl !== null && expired.includes(chunk.audioUrl)
            ? { ...chunk, audioUrl: null }
            : chunk,
        ),
      );
    }
  }

  function clearChunks() {
    audioUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });
    audioUrlsRef.current = [];
    setChunks([]);
  }

  async function sendChunk(
    session: number,
    chunk: Omit<Chunk, "result" | "audioUrl">,
    wav: Blob,
    request: string,
  ) {
    const audioUrl = URL.createObjectURL(wav);
    setChunks((current) => [
      { ...chunk, audioUrl, result: { status: "pending" } },
      ...current,
    ]);
    keepAudioUrl(audioUrl);

    const form = new FormData();
    form.append("file", wav, `chunk-${String(chunk.index)}.wav`);
    form.append("request", request);

    const sentAt = performance.now();
    let result: ChunkResult;
    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        body: form,
      });
      const body: unknown = await response.json().catch(() => null);
      const latencyMs = performance.now() - sentAt;
      result = response.ok
        ? { status: "answered", response: body, latencyMs }
        : {
            status: "failed",
            error: errorDetail(body, response.status),
            latencyMs,
          };
    } catch (error) {
      result = {
        status: "failed",
        error: errorMessage(error),
        latencyMs: null,
      };
    }

    if (sessionRef.current === session) {
      setChunks((current) =>
        current.map((existing) =>
          existing.index === chunk.index ? { ...existing, result } : existing,
        ),
      );
    }
  }

  function stop() {
    if (recorderRef.current) {
      teardown(recorderRef.current);
      recorderRef.current = null;
    }
    setStatus("idle");
  }

  async function start(source: "microphone" | File) {
    if (!("questions" in parsedQuestions)) {
      return;
    }
    const trimmedContext = context.trim();
    const request = JSON.stringify({
      ...(trimmedContext ? { context: trimmedContext } : {}),
      questions: parsedQuestions.questions,
    });

    setStatus("starting");
    setStartError(null);
    clearChunks();
    const session = ++sessionRef.current;

    // Created before any await, while the click still counts as a user
    // gesture. Otherwise the autoplay policy can start it suspended.
    const audioContext = new AudioContext();
    const fail = (message: string, releaseSource: () => void) => {
      teardown({ audioContext, releaseSource });
      setStartError(message);
      setStatus("idle");
    };

    let input: AudioNode;
    let releaseSource: () => void;
    let element: HTMLAudioElement | null = null;
    if (source === "microphone") {
      let stream: MediaStream;
      try {
        // Browser voice processing alters the qualities the questions are
        // asking about, so the raw signal is requested instead.
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false,
          },
        });
      } catch (error) {
        fail(`Could not open the microphone: ${errorMessage(error)}`, () => {
          // Nothing was opened.
        });
        return;
      }
      input = audioContext.createMediaStreamSource(stream);
      releaseSource = () => {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
      };
      stream.getAudioTracks().forEach((track) => {
        track.addEventListener("ended", stop);
      });
    } else {
      const fileUrl = URL.createObjectURL(source);
      const audio = new Audio(fileUrl);
      element = audio;
      input = audioContext.createMediaElementSource(audio);
      // Unlike the microphone, the recording is played aloud as it is sent.
      input.connect(audioContext.destination);
      releaseSource = () => {
        audio.pause();
        URL.revokeObjectURL(fileUrl);
      };
    }

    try {
      await audioContext.audioWorklet.addModule("/pcm-chunker-worklet.js");
    } catch (error) {
      fail(
        `Could not load the audio processor: ${errorMessage(error)}`,
        releaseSource,
      );
      return;
    }

    const { sampleRate } = audioContext;
    const chunker = new AudioWorkletNode(audioContext, "pcm-chunker", {
      channelCount: 1,
      channelCountMode: "explicit",
      processorOptions: { chunkFrames: sampleRate * CHUNK_SECONDS },
    });
    let nextIndex = 0;
    let framesSent = 0;
    chunker.port.onmessage = ({ data }: MessageEvent<ChunkerMessage>) => {
      if (
        !data.final ||
        data.samples.length >= sampleRate * MIN_FINAL_CHUNK_SECONDS
      ) {
        void sendChunk(
          session,
          {
            index: nextIndex++,
            startMs: (framesSent / sampleRate) * 1000,
            durationMs: (data.samples.length / sampleRate) * 1000,
          },
          encodeWav(data.samples, sampleRate),
          request,
        );
        framesSent += data.samples.length;
      }
      if (data.final) {
        stop();
      }
    };

    // The worklet only runs while connected to the destination. It writes no
    // output, so it adds nothing to what is heard.
    input.connect(chunker).connect(audioContext.destination);

    if (element) {
      element.addEventListener("ended", () => {
        chunker.port.postMessage("flush");
      });
      try {
        await element.play();
      } catch (error) {
        fail(`Could not play the file: ${errorMessage(error)}`, releaseSource);
        return;
      }
    }

    recorderRef.current = { audioContext, releaseSource };
    setStatus(source === "microphone" ? "listening" : "playing");
  }

  function resetToDefaults() {
    setContext(null);
    setQuestionsText(null);
  }

  // Questions are appended at the end. The API answers all questions in one
  // inference, so adding one can shift the answers to the others.
  function toggleLibraryQuestion(entry: LibraryQuestion) {
    if (!("questions" in parsedQuestions)) {
      return;
    }
    const { [entry.id]: existing, ...rest } = parsedQuestions.questions;
    const next =
      existing === undefined
        ? { ...parsedQuestions.questions, [entry.id]: entry.question }
        : rest;
    setQuestionsText(JSON.stringify(next, null, 2));
  }

  const locked = status !== "idle";
  const canStart = !locked && "questions" in parsedQuestions;
  const atDefaults =
    context === DEFAULT_CONTEXT && questionsText === DEFAULT_QUESTIONS;

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="space-y-1">
          <label htmlFor="context" className="block text-sm font-medium">
            Context
          </label>
          <p id="context-hint" className="text-sm text-gray-600">
            Optional description of the setting. It can change the results.
          </p>
          <textarea
            id="context"
            aria-describedby="context-hint"
            className="w-full rounded border border-gray-300 p-2 disabled:bg-gray-100"
            rows={2}
            value={context}
            disabled={locked}
            onChange={(event) => {
              setContext(event.target.value);
            }}
          />
        </div>

        <fieldset className="space-y-1">
          <legend className="text-sm font-medium">Question library</legend>
          <div className="grid grid-cols-1 gap-1 text-sm sm:grid-cols-2">
            {QUESTION_LIBRARY.map((entry) => (
              <label
                key={entry.id}
                className="flex items-center gap-2"
                title={entry.question.instructions}
              >
                <input
                  type="checkbox"
                  checked={
                    "questions" in parsedQuestions &&
                    entry.id in parsedQuestions.questions
                  }
                  disabled={locked || !("questions" in parsedQuestions)}
                  onChange={() => {
                    toggleLibraryQuestion(entry);
                  }}
                />
                {entry.label}
                <span className="text-gray-500">{entry.question.type}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block space-y-1">
          <span className="text-sm font-medium">Questions (JSON)</span>
          <textarea
            className="w-full rounded border border-gray-300 p-2 font-mono text-sm disabled:bg-gray-100"
            rows={18}
            spellCheck={false}
            value={questionsText}
            disabled={locked}
            onChange={(event) => {
              setQuestionsText(event.target.value);
            }}
          />
        </label>
        {"error" in parsedQuestions && (
          <p className="text-sm text-red-700">{parsedQuestions.error}</p>
        )}

        <button
          type="button"
          className="rounded border border-gray-300 px-4 py-2 disabled:opacity-40"
          disabled={locked || atDefaults}
          onClick={resetToDefaults}
        >
          Reset to defaults
        </button>

        <div className="space-y-3 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-sm font-medium">Microphone</span>
            {status === "listening" ? (
              <>
                <button
                  type="button"
                  className="rounded bg-red-700 px-4 py-2 text-white"
                  onClick={stop}
                >
                  Stop
                </button>
                <span className="text-sm text-gray-600">
                  Listening. A chunk is sent every {CHUNK_SECONDS} seconds.
                </span>
              </>
            ) : (
              <button
                type="button"
                className="rounded bg-black px-4 py-2 text-white disabled:opacity-40"
                disabled={!canStart}
                onClick={() => {
                  void start("microphone");
                }}
              >
                Start microphone
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-sm font-medium">Recording</span>
            <button
              type="button"
              className="rounded border border-gray-300 px-4 py-2 disabled:opacity-40"
              disabled={locked}
              onClick={() => {
                fileInputRef.current?.click();
              }}
            >
              Choose file
            </button>
            <span className="text-sm text-gray-600">
              {file?.name ?? "No file chosen"}
            </span>
            {status === "playing" ? (
              <>
                <button
                  type="button"
                  className="rounded bg-red-700 px-4 py-2 text-white"
                  onClick={stop}
                >
                  Stop
                </button>
                <span className="text-sm text-gray-600">
                  Playing. A chunk is sent every {CHUNK_SECONDS} seconds.
                </span>
              </>
            ) : (
              <button
                type="button"
                className={`rounded px-4 py-2 disabled:opacity-40 ${file ? "bg-black text-white" : "border border-gray-300"}`}
                disabled={!canStart || file === null}
                onClick={() => {
                  if (file) {
                    void start(file);
                  }
                }}
              >
                Play recording
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(event) => {
                setFile(event.target.files?.[0] ?? null);
              }}
            />
          </div>

          {startError && <p className="text-sm text-red-700">{startError}</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Responses</h2>
        {chunks.length === 0 ? (
          <p className="text-sm text-gray-600">
            Responses appear here, newest first.
          </p>
        ) : (
          <ol className="space-y-4">
            {chunks.map((chunk) => (
              <li
                key={chunk.index}
                className="space-y-2 rounded border border-gray-200 p-3"
              >
                <h3 className="text-sm font-medium">
                  Chunk {chunk.index + 1} ({formatTime(chunk.startMs)} to{" "}
                  {formatTime(chunk.startMs + chunk.durationMs)})
                  <span className="font-normal text-gray-500">
                    {chunk.result.status === "pending" && " pending"}
                    {chunk.result.status !== "pending" &&
                      chunk.result.latencyMs !== null &&
                      ` ${chunk.result.status} in ${String(Math.round(chunk.result.latencyMs))} ms`}
                    {chunk.result.status === "failed" &&
                      chunk.result.latencyMs === null &&
                      " failed"}
                  </span>
                </h3>
                {chunk.audioUrl && (
                  <audio
                    controls
                    src={chunk.audioUrl}
                    className="h-8 w-full max-w-sm"
                  />
                )}
                {chunk.result.status === "answered" && (
                  <>
                    <AnswerView
                      response={chunk.result.response}
                      chunkStartMs={chunk.startMs}
                    />
                    <details>
                      <summary className="cursor-pointer text-xs text-gray-600">
                        JSON
                      </summary>
                      <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs">
                        {JSON.stringify(chunk.result.response, null, 2)}
                      </pre>
                    </details>
                  </>
                )}
                {chunk.result.status === "failed" && (
                  <pre className="overflow-x-auto rounded bg-gray-50 p-2 text-xs text-red-700">
                    {JSON.stringify(chunk.result.error, null, 2)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
