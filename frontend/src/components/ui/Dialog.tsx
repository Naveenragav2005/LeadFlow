"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/cn";

interface DialogProps {
  /** id of the element that names the dialog (usually its heading). */
  labelledBy: string;
  onClose: () => void;
  className?: string;
  children: ReactNode;
}

/**
 * Modal built on the native <dialog> element, which handles focus trapping,
 * Escape to close and the backdrop for us. Render it to open it; unmount it to
 * close it. Clicking the backdrop also closes it.
 */
export function Dialog({ labelledBy, onClose, className, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const pressStartedOnBackdrop = useRef(false);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      // Escape key: let the parent unmount us instead of the browser closing it.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      // Only close when both press and release happen on the backdrop, so
      // selecting text inside the dialog and releasing outside doesn't close it.
      onMouseDown={(event) => {
        pressStartedOnBackdrop.current = event.target === ref.current;
      }}
      onClick={(event) => {
        if (pressStartedOnBackdrop.current && event.target === ref.current) onClose();
      }}
      className={cn(
        "m-auto w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-xl bg-white p-0 text-slate-900 shadow-2xl",
        "backdrop:bg-slate-900/50 backdrop:backdrop-blur-[2px]",
        className,
      )}
    >
      {children}
    </dialog>
  );
}
