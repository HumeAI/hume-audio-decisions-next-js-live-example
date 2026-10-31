import { type ReactNode, useEffect, useId, useRef } from "react";

interface ModalProps {
  title: string;
  /** Called when the person presses Escape. */
  onDismiss: () => void;
  children: ReactNode;
}

/** A modal dialog that opens when it mounts. */
export function Modal({ title, onDismiss, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  // Only showModal() traps focus and makes the rest of the page inert. The
  // `open` attribute shows the dialog without either.
  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onDismiss}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-2xl border border-border bg-background p-6 text-foreground backdrop:bg-black/50"
    >
      <h2 id={titleId} className="text-lg font-semibold tracking-tight">
        {title}
      </h2>
      {children}
    </dialog>
  );
}
