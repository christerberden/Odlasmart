"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

type AppModalProps = {
  actions: ReactNode;
  children?: ReactNode;
  onClose: () => void;
  open: boolean;
  title: string;
};

export function AppModal({ actions, children, onClose, open, title }: AppModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    if (!open) {
      dialogRef.current?.close();
      return undefined;
    }

    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <dialog className="app-modal" ref={dialogRef} aria-label={title} onCancel={(event) => {
      event.preventDefault();
      onClose();
    }}>
      <button className="app-modal__backdrop" type="button" aria-label="Stäng dialog" onClick={onClose} />
      <div className="app-modal__card">
        <div className="app-modal__head">
          <h3>{title}</h3>
          <button className="icon-button app-modal__close" type="button" aria-label="Stäng dialog" onClick={onClose}>
            ×
          </button>
        </div>
        {children ? <div className="app-modal__body">{children}</div> : null}
        <div className="app-modal__actions">{actions}</div>
      </div>
    </dialog>
  );
}
