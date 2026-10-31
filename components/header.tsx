const LINKS = [
  {
    label: "Source",
    href: "https://github.com/HumeAI/hume-decisions-next-js-live-example",
  },
  {
    label: "TypeScript SDK",
    href: "https://github.com/HumeAI/hume-audio-decisions-typescript-sdk",
  },
  {
    label: "Cookbook",
    href: "https://dev.hume.ai/decisions/cookbooks/answering-live-audio",
  },
];

export function Header() {
  return (
    <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border px-4 py-2 whitespace-nowrap">
      <h1 className="font-semibold tracking-tight">Audio Decisions Live</h1>
      <nav aria-label="Project links">
        <ul className="flex gap-4 text-sm">
          {LINKS.map(({ label, href }) => (
            <li key={href}>
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors hover:text-foreground"
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
