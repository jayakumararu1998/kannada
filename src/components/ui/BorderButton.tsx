"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type BorderButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "children"
> & {
  label?: ReactNode;
};

export default function BorderButton({
  label = "ಪರಮಖ ಅಶಗಳ",
  className,
  type = "button",
  ...props
}: BorderButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex h-[44px] w-[236px] items-center justify-center rounded-[5px] border border-000000 bg-FFFFFF px-4 font-manrope text-[14px] font-semibold leading-none text-000000 transition hover:bg-F9F9F9 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-000000)] ${
        className || ""
      }`}
      {...props}
    >
      {label}
    </button>
  );
}
