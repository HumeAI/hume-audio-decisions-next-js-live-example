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

## License

[MIT](LICENSE)
