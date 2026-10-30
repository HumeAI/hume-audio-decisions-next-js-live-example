import { LiveDecisions } from "./live-decisions";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
      <h1 className="text-2xl font-semibold">
        Hume Audio Decisions API: Next.js Example
      </h1>
      <LiveDecisions />
    </main>
  );
}
