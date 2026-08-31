"use client";

import { useState } from "react";

type TabItem = {
  label: string;
  value?: string;
};

type HorizontalTabProps = {
  tabs?: TabItem[];
  activeValue?: string;
  onTabChange?: (tab: TabItem) => void;
  showMore?: boolean;
  moreLabel?: string;
  onMore?: () => void;
  className?: string;
  tabClassName?: string;
};

const DEFAULT_TABS: TabItem[] = [
  { label: "ಸೇಡಿಗಾಗಿ ಹಾಗಗಿ ಫೋಟೋ", value: "photos" },
  { label: "ಸೇಡಿಗಾಗಿ ಹಾಗಗಿ", value: "news-1" },
  { label: "ಸೇಡಿಗಾಗಿ ಹಾಗಗಿ", value: "news-2" },
  { label: "ಸೇಡಿಗಾಗಿ ಹಾಗಗಿ", value: "news-3" },
  { label: "ಸೇಡಿಗಾಗಿ ಹಾಗಗಿ", value: "news-4" },
];

export default function HorizontalTab({
  tabs = DEFAULT_TABS,
  activeValue,
  onTabChange,
  showMore = true,
  moreLabel = "More tabs",
  onMore,
  className,
  tabClassName,
}: HorizontalTabProps) {
  const firstValue = tabs[0]?.value || tabs[0]?.label || "";
  const [internalActiveValue, setInternalActiveValue] = useState(firstValue);
  const selectedValue = activeValue ?? internalActiveValue;

  return (
    <div
      className={`flex w-full items-end border-b-[0.75px] border-DFDFDF bg-transparent ${
        className || ""
      }`}
    >
      <div className="flex min-w-0 flex-1 items-end gap-[22px] overflow-x-auto">
        {tabs.map((tab) => {
          const value = tab.value || tab.label;
          const isActive = value === selectedValue;

          return (
            <button
              key={value}
              type="button"
              aria-selected={isActive}
              onClick={() => {
                setInternalActiveValue(value);
                onTabChange?.(tab);
              }}
              className={`relative shrink-0 pb-[19px] font-manrope text-[15px] font-medium leading-none ${
                isActive ? "text-000000" : "text-808080"
              } ${tabClassName || ""}`}
            >
              {tab.label}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute right-0 bottom-[-1px] left-0 h-1 bg-[#009EF9]"
                />
              )}
            </button>
          );
        })}
      </div>

      {showMore && (
        <button
          type="button"
          aria-label={moreLabel}
          onClick={onMore}
          className="flex h-[35px] w-10 shrink-0 items-start justify-end font-manrope text-[24px] font-medium leading-none text-757575 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#009EF9]"
        >
          ...
        </button>
      )}
    </div>
  );
}
