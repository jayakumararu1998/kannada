"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ContinueButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children?: ReactNode;
};

export default function ContinueButton({
  children = "Continue",
  className,
  type = "submit",
  ...props
}: ContinueButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-[3px] border-0 bg-183354 px-5 py-3.5 font-manrope text-14-manrope-700 leading-none text-FFFFFF transition-opacity hover:opacity-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-183354)]",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
