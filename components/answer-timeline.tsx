import { summarizeAnswer } from "@/lib/answers";
import { formatTime } from "@/lib/format-time";
import type { NamedQuestion } from "@/lib/questions";
import type { Chunk } from "@/lib/recording";

import { LABEL_COLUMN_CLASS_NAME, Playhead, toPixels } from "./timeline-layout";

// The question labels and the chunk columns are separate stacks that line up
// only because they share these row heights.
const TIME_ROW_CLASS_NAME = "h-7 leading-7";
const ANSWER_ROW_CLASS_NAME = "h-9 leading-9";

interface AnswerTimelineProps {
  /** The questions the chunks were asked with, one row each. */
  questions: NamedQuestion[];
  chunks: Chunk[];
  durationMs: number;
  /** The chunk whose answers are shown below the timeline. */
  currentChunk: Chunk | undefined;
  playheadMs: number | null;
  /** Moves the playhead to a chunk. Leave it out to turn choosing off. */
  onSelectChunk?: (chunk: Chunk) => void;
}

export function AnswerTimeline({
  questions,
  chunks,
  durationMs,
  currentChunk,
  playheadMs,
  onSelectChunk,
}: AnswerTimelineProps) {
  return (
    <div className="flex">
      <div className={LABEL_COLUMN_CLASS_NAME}>
        <div className={TIME_ROW_CLASS_NAME} />
        {questions.map(({ id }) => (
          <div
            key={id}
            title={id}
            className={`${ANSWER_ROW_CLASS_NAME} truncate px-3 text-sm font-medium`}
          >
            {id}
          </div>
        ))}
      </div>

      <div
        className="relative shrink-0"
        style={{ width: toPixels(durationMs) }}
      >
        <ol className="flex h-full">
          {chunks.map((chunk) => (
            <li
              key={chunk.index}
              className="shrink-0"
              style={{ width: toPixels(chunk.endMs - chunk.startMs) }}
            >
              <button
                type="button"
                disabled={!onSelectChunk}
                onClick={() => {
                  onSelectChunk?.(chunk);
                }}
                aria-current={chunk === currentChunk ? "time" : undefined}
                className="flex h-full w-full flex-col border-r border-border text-left transition-colors enabled:hover:bg-subtle focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-foreground aria-[current=time]:bg-subtle"
              >
                <span
                  className={`${TIME_ROW_CLASS_NAME} px-2 text-xs text-muted tabular-nums`}
                >
                  {formatTime(chunk.startMs)}
                </span>
                <ChunkAnswers chunk={chunk} questions={questions} />
              </button>
            </li>
          ))}
        </ol>
        {playheadMs !== null && <Playhead ms={playheadMs} />}
      </div>
    </div>
  );
}

function ChunkAnswers({
  chunk,
  questions,
}: {
  chunk: Chunk;
  questions: NamedQuestion[];
}) {
  switch (chunk.result.status) {
    case "pending":
      return null;
    case "failed":
      return (
        <span
          className={`${ANSWER_ROW_CLASS_NAME} px-2 text-sm text-red-600 dark:text-red-400`}
        >
          Failed
        </span>
      );
    case "answered": {
      const { answers } = chunk.result.response;
      return questions.map(({ id }) => {
        const answer = answers[id];
        return (
          <span
            key={id}
            className={`${ANSWER_ROW_CLASS_NAME} truncate px-2 text-sm`}
          >
            <span className="sr-only">{id}: </span>
            {answer ? summarizeAnswer(answer) : ""}
          </span>
        );
      });
    }
  }
}
