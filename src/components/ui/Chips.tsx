"use client";

import type { ButtonHTMLAttributes } from "react";

type ChipItem = {
  label: string;
  value?: string;
};

type ChipsProps = {
  items?: ChipItem[];
  onSelect?: (item: ChipItem) => void;
  className?: string;
  chipClassName?: string;
  buttonProps?: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick">;
};

const DEFAULT_ITEMS: ChipItem[] = [
  { label: "ಮಂಗಳೂರು" },
  { label: "ರಾಜ್ಯದ ಆರೇಳು ಪ್ರಶ್ನೆಯನ್ನು" },
  { label: "ರಾಜ್ಯ" },
  { label: "ರಾಜ್ಯದ ಆರೇಳು ಪ್ರಶ್ನೆಯನ್ನು" },
  { label: "ಮಂಗಳೂರು" },
  { label: "ರಾಜ್ಯದ ಆರೇಳು ಪ್ರಶ್ನೆಯನ್ನು" },
  { label: "ರಾಜ್ಯ" },
  { label: "ರಾಜ್ಯದ ಆರೇಳು ಪ್ರಶ್ನೆಯನ್ನು" },
];

export default function Chips({
  items = DEFAULT_ITEMS,
  onSelect,
  className,
  chipClassName,
  buttonProps,
}: ChipsProps) {
  return (
    <div
      className={`flex flex-wrap gap-x-[18px] gap-y-[12px] ${className || ""}`}
    >
      {items.map((item, index) => (
        <button
          key={`${item.value || item.label}-${index}`}
          type="button"
          className={`inline-flex h-[40px] items-center justify-center rounded-[5px] border border-8B95A5 bg-transparent px-[15px] font-manrope text-[14px] font-medium leading-none text-333333 transition hover:border-000000 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-000000)] ${
            chipClassName || ""
          }`}
          onClick={() => onSelect?.(item)}
          {...buttonProps}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
