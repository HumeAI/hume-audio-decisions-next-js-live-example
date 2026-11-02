import { useState } from "react";

import { Button } from "./button";
import { Modal } from "./modal";

interface NewRecordingDialogProps {
  onConfirm: (dontShowAgain: boolean) => void;
  onCancel: () => void;
}

export function NewRecordingDialog({
  onConfirm,
  onCancel,
}: NewRecordingDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  return (
    <Modal title="Start a new recording?" onDismiss={onCancel}>
      <p className="mt-2 text-sm text-muted">
        This clears the current audio and answers.
      </p>
      <label className="mt-5 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={dontShowAgain}
          onChange={(event) => {
            setDontShowAgain(event.target.checked);
          }}
          className="size-4 accent-foreground"
        />
        Don’t show this message again
      </label>
      <div className="mt-6 flex justify-end gap-3">
        <Button onClick={onCancel}>Cancel</Button>
        <Button
          variant="primary"
          onClick={() => {
            onConfirm(dontShowAgain);
          }}
        >
          Clear and record
        </Button>
      </div>
    </Modal>
  );
}
