# Audio Decisions Live

A Next.js example that answers questions about live microphone audio with the [Hume Audio Decisions API](https://dev.hume.ai/decisions/docs/overview). The app sends every 5 seconds of audio with your questions and shows each set of answers on a timeline under the waveform. The [cookbook guide](https://dev.hume.ai/decisions/cookbooks/answering-live-audio) walks through the code.

## Prerequisites

1. Node.js 24 (the version in `.nvmrc`). With nvm, run `nvm use` in the project directory.
2. An API key from the [Hume platform](https://platform.hume.ai).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and add your API key:

   ```bash
   cp .env.example .env.local
   ```

   Then set `HUME_API_KEY` in `.env.local`. A `HUME_API_KEY` exported in your shell takes precedence over the file.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Using the app

1. Press **Record** and speak. The three default questions are enough to see the app work.
2. Every 5 seconds of audio is sent with the questions. Answers appear on the timeline as they arrive, and the cards below show the newest answers in full. Audio after the last full 5 seconds is not sent.
3. Press **Stop**, then click a chunk or the waveform to see that chunk's answers. **Play** replays the recording from the playhead.
4. Add, edit or remove questions and edit the optional **Context** between recordings. They are kept for the browser tab, so a refresh keeps them.

All questions in a request are answered together, so adding, removing or rewording one question can change the answers to the others.

## How it works

1. `hooks/use-recorder.ts` opens the microphone with `lib/microphone.ts`. An [AudioWorklet](https://developer.mozilla.org/docs/Web/API/AudioWorklet) in `public/audio-block-worklet.js` delivers the audio in blocks of 125 ms, which also draw the waveform.
2. Every 5 seconds of audio becomes a chunk. `lib/decisions.ts` resamples it to 16 kHz, encodes it as a WAV file with `lib/wav.ts`, and posts it with the questions and context to the `app/api/decisions` route. Chunks are sent as soon as they are ready, without waiting for earlier answers.
3. The route calls `client.decisions.create` from the `@humeai/audio-decisions` SDK, which reads `HUME_API_KEY` on the server, so the key never reaches the browser.
4. Each answer lands on its chunk in `components/answer-timeline.tsx`, and `components/answer-card.tsx` shows the full answer. `hooks/use-playback.ts` replays the recording.

## License

[MIT](LICENSE)
