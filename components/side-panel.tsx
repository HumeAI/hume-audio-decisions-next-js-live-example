import { ChevronDownIcon, ChevronUpIcon } from "@primer/octicons-react";
import { type ReactNode, useId, useState } from "react";

interface SidePanelProps {
  /** Labels the button that opens the panel on narrow screens. */
  title: string;
  children: ReactNode;
  /** Stays at the bottom of the panel while the rest scrolls. */
  footer: ReactNode;
}

/**
 * A column beside the recording on wide screens. On narrow screens it starts
 * closed, so the timeline and the answers keep most of the height.
 */
export function SidePanel({ title, children, footer }: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const contentId = useId();

  return (
    <aside className="flex shrink-0 flex-col border-b border-border md:w-80 md:border-r md:border-b-0">
      <button
        type="button"
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="flex h-12 items-center justify-between px-4 text-base font-semibold md:hidden"
      >
        {title}
        {isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      </button>
      <div
        id={contentId}
        className={`${isOpen ? "flex" : "hidden"} max-h-[40dvh] min-h-0 flex-1 flex-col border-t border-border md:flex md:max-h-none md:border-t-0`}
      >
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        <div className="shrink-0 border-t border-border p-4 md:pb-12">
          {footer}
        </div>
      </div>
    </aside>
  );
}
