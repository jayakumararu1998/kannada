"use client";

import { useState } from "react";

type PillMenuItem = {
  label: string;
  value?: string;
};

type TabPillMenuProps = {
  items?: PillMenuItem[];
  activeValue?: string;
  onChange?: (item: PillMenuItem) => void;
  className?: string;
};

const DEFAULT_ITEMS: PillMenuItem[] = [
  { label: "ಹೊಸೊಬಿಸಿ ಬ್ರೇಕಿಂಗ್", value: "breaking" },
  { label: "ಹೊಸೊಬಿಸಿ ಬ್ರೇಕಿಂಗ್ ಅಲರ್ಟ್ ಸಮಾಚಾರಗಳು ತಾಜಾತಾಜಿ", value: "alert-1" },
  { label: "ಹೊಸೊಬಿಸಿ ಬ್ರೇಕಿಂಗ್ ಅಲರ್ಟ್ ಸಮಾಚಾರಗಳು ತಾಜಾತಾಜಿ", value: "alert-2" },
  {
    label: "ಹೊಸೊಬಿಸಿ ಬ್ರೇಕಿಂಗ್ ಅಲರ್ಟ್ ಸಮಾಚಾರಗಳು ತಾಜಾತಾಜಿ, ವಿಶ್ಲೇಷಣೆ ಮತ್ತಷ್ಟು",
    value: "alert-3",
  },
];

export default function TabPillMenu({
  items = DEFAULT_ITEMS,
  activeValue,
  onChange,
  className,
}: TabPillMenuProps) {
  const firstValue = items[0]?.value || items[0]?.label || "";
  const [internalActiveValue, setInternalActiveValue] = useState(firstValue);
  const selectedValue = activeValue ?? internalActiveValue;

  return (
    <div
      className={`flex w-full items-center gap-[10px] overflow-x-auto bg-transparent font-manrope text-[14px] font-semibold leading-none ${
        className || ""
      }`}
    >
      {items.map((item) => {
        const value = item.value || item.label;
        const isActive = value === selectedValue;

        return (
          <button
            key={value}
            type="button"
            aria-pressed={isActive}
            onClick={() => {
              setInternalActiveValue(value);
              onChange?.(item);
            }}
            className={`inline-flex h-[36px] shrink-0 items-center whitespace-nowrap rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009EF9] ${
              isActive
                ? "bg-[#009EF9] px-[14px] text-white"
                : "bg-transparent px-0 text-4A4A4A hover:text-000000"
            }`}
          >
            <span>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
