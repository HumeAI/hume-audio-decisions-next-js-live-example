import { BookIcon, MarkGithubIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";

export function Header() {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border px-4">
      <h1 className="font-semibold tracking-tight">Audio Decisions Live</h1>
      <nav aria-label="Project links">
        <ul className="flex gap-1">
          <li>
            <IconLink
              href="https://github.com/HumeAI/hume-decisions-next-js-live-example"
              label="Source code on GitHub"
            >
              <MarkGithubIcon size={20} />
            </IconLink>
          </li>
          <li>
            <IconLink
              href="https://dev.hume.ai/decisions/cookbooks/answering-live-audio"
              label="Cookbook guide"
            >
              <BookIcon size={20} />
            </IconLink>
          </li>
        </ul>
      </nav>
    </header>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-subtle hover:text-foreground"
    >
      {children}
    </a>
  );
}
