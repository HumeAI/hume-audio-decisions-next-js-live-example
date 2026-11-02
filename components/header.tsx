import { BookIcon, MarkGithubIcon } from "@primer/octicons-react";
import type { ReactNode } from "react";

import { ICON_BUTTON_CLASS_NAME } from "./button";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  return (
    <header className="flex h-13 shrink-0 items-center justify-between gap-4 border-b px-4">
      <h1 className="text-xl font-semibold tracking-tight">
        Live Audio Decisions
      </h1>
      <div className="flex items-center gap-1">
        <nav aria-label="Project links">
          <ul className="flex gap-1">
            <li>
              <IconLink
                href="https://github.com/HumeAI/hume-audio-decisions-next-js-live-example"
                label="Source code on GitHub"
              >
                <MarkGithubIcon size={20} />
              </IconLink>
            </li>
            <li>
              <IconLink
                href="https://dev.hume.ai/audio-decisions/cookbooks/answering-live-audio"
                label="Cookbook guide"
              >
                <BookIcon size={20} />
              </IconLink>
            </li>
          </ul>
        </nav>
        <ThemeToggle />
      </div>
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
      className={`flex items-center justify-center transition-colors ${ICON_BUTTON_CLASS_NAME}`}
    >
      {children}
    </a>
  );
}
