"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogClose,
} from "@/components/motion-primitives/dialog";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        className="modal-container fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 m-0 p-0 border border-border bg-bg shadow-lg rounded-lg max-w-lg w-full animate-none"
      >
        <div className="modal-header">
          <DialogTitle className="modal-title m-0 p-0 text-[22px] font-semibold text-primary font-heading">
            {title}
          </DialogTitle>
          <DialogClose className="modal-close-btn relative top-auto right-auto opacity-100 hover:opacity-100 bg-transparent flex items-center justify-center p-1 rounded-sm text-secondary hover:text-accent hover:bg-surface transition-all">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="icon-sm"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </DialogClose>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </DialogContent>
    </Dialog>
  );
};
