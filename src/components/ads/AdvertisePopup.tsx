"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import AdvertiseForm from "./AdvertiseForm";

/**
 * "Advertise with us" trigger + modal (ported from dinamani). Renders a small
 * muted text link (placed under ad slots); clicking it opens the inquiry form
 * in a portal over the page.
 */
export default function AdvertisePopup({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={
          className ||
          "text-12-inter-400 text-808080 transition-colors hover:text-1E1E1E hover:underline"
        }
      >
        {children || "Advertise with us"}
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-FFFFFF shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <AdvertiseForm onClose={() => setIsOpen(false)} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
