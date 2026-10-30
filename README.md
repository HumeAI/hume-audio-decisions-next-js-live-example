# Hume Decisions: Answering live audio

A Next.js example app that uses the [Hume Decisions API](https://dev.hume.ai) to answer questions about audio while it is still playing. Pick the microphone or a recording, and the app shows answers about what was just heard as the audio goes on.

## Prerequisites

1. Node.js 24 (the version in `.nvmrc`). With nvm, run `nvm use` in the project directory.
2. A Hume API key, available from the [Hume platform](https://platform.hume.ai).

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy the example environment file and add your API key:

   ```bash
   cp .env.example .env.local
   ```

   Then set `HUME_API_KEY` in `.env.local`.

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000).

## Using the app

1. Pick questions from the question library, or edit the questions JSON directly. Your questions and context are saved in the browser.
2. Optionally describe the setting in **Context**. The model reads it alongside the audio, so it can change the answers.
3. Click **Start microphone**, or choose an audio file and click **Play recording**. A recording plays aloud in real time. Any format your browser can play works.
4. Every 5 seconds the app sends the audio just heard to the API. Each response shows a readable summary of every answer, the raw JSON, how long the request took, and a player for the audio that was sent.

## How it works

1. An [AudioWorklet](https://developer.mozilla.org/docs/Web/API/AudioWorklet) in `public/pcm-chunker-worklet.js` collects the audio into 5-second chunks.
2. The browser encodes each chunk as a WAV file and posts it, with the questions and context, to the `app/api/decisions` route.
3. The route calls `client.decisions.create` from the `@humeai/decisions` SDK, which reads `HUME_API_KEY` on the server, and returns the response.

Chunks are sent as soon as they are ready, without waiting for earlier responses. All questions in a request are answered together, so adding, removing, or reordering questions can change the other answers. The questions are locked while audio is being sent so that answers within one session stay comparable.

## License

[MIT](LICENSE)
