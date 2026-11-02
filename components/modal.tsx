import { type ReactNode, useId, useRef } from "react";

// Only showModal() traps focus and makes the rest of the page inert. The
// `open` attribute shows the dialog without either. This ref callback lives
// outside the component because React calls an inline one again on every
// render.
function showModal(dialog: HTMLDialogElement | null) {
  dialog?.showModal();
}

interface ModalProps {
  title: string;
  /** Called when the person presses Escape or clicks outside the dialog. */
  onDismiss: () => void;
  children: ReactNode;
}

/** A modal dialog that opens when it mounts. */
export function Modal({ title, onDismiss, children }: ModalProps) {
  const pressedBackdropRef = useRef(false);
  const titleId = useId();

  // The content fills the dialog, so a press on the dialog element itself is
  // a press on the backdrop. A press that starts inside, such as selecting
  // text, and ends outside does not count.
  return (
    <dialog
      ref={showModal}
      aria-labelledby={titleId}
      onClose={onDismiss}
      onPointerDown={(event) => {
        pressedBackdropRef.current = event.target === event.currentTarget;
      }}
      onClick={(event) => {
        if (
          pressedBackdropRef.current &&
          event.target === event.currentTarget
        ) {
          event.currentTarget.close();
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border bg-background text-foreground backdrop:bg-black/50"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto p-6">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
