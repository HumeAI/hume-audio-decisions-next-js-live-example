import { Header } from "@/components/header";
import { LiveDecisions } from "@/components/live-decisions";

export default function Home() {
  return (
    <div className="flex h-dvh flex-col">
      <Header />
      <LiveDecisions />
    </div>
  );
}
