"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { ModalPortal } from "./ModalPortal";

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "primary";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  description,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  variant = "danger",
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isVisible, setIsVisible] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const frame = window.requestAnimationFrame(() => setIsVisible(true));
      return () => window.cancelAnimationFrame(frame);
    }

    setIsVisible(false);
    const timeout = window.setTimeout(() => setShouldRender(false), 300);
    return () => window.clearTimeout(timeout);
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape" && !isLoading) {
        onCancel();
      }
      if (e.key === "Tab") {
        const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (!focusableElements?.length) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLoading, isOpen, onCancel]);

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const timeout = window.setTimeout(() => cancelButtonRef.current?.focus(), 50);

    return () => {
      window.clearTimeout(timeout);
      previouslyFocused?.focus();
    };
  }, [isOpen]);

  if (!shouldRender) return null;

  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  return (
    <ModalPortal>
      <div
        className={`fixed inset-0 z-[200] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div 
          ref={dialogRef}
          className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full relative transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isVisible ? "translate-y-0 opacity-100 scale-100" : "translate-y-8 opacity-0 scale-95"
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
        >
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                isDanger
                  ? "bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/20"
                  : isWarning
                  ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20"
                  : "bg-primary/10 text-primary border-primary/20"
              }`}
            >
              {isDanger ? (
                <Trash2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
            </div>

            <div className="flex-1 pr-4">
              <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                {title}
              </h3>
              <p id={descriptionId} className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6">
            <button
              ref={cancelButtonRef}
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 ${
                isDanger
                  ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25 active:scale-[0.98]"
                  : isWarning
                  ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25 active:scale-[0.98]"
                  : "bg-primary hover:bg-primary/90 shadow-primary/25 active:scale-[0.98]"
              }`}
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}
              <span>{confirmText}</span>
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
