"use client";

import { useEffect, useRef, useState } from "react";

export interface SectionItem {
  id: number;
  name: string;
}

export interface FilterData {
  sections: SectionItem[];
  authors: string[];
  storyTypes: string[];
}

export interface ActiveFilters {
  sectionNames: string[];
  authors: string[];
  storyTypes: string[];
  dateFrom: string;
  dateTo: string;
}

interface Props {
  filterData?: FilterData;
  onChange?: (filters: ActiveFilters) => void;
}

type PanelKey = "Section" | "Author" | "Story Type" | "Date";

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-5 w-5 shrink-0 text-8B95A5 transition-transform ${open ? "rotate-180" : ""}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 7.5L10 12.5L15 7.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Search filter accordion (ported from dinamani's `SearchFilter`) — Section /
 * Author / Story Type / Date. Emits the current selection up on every change;
 * the parent fetches filtered results. Only one panel is open at a time.
 */
export default function SearchFilters({ filterData, onChange }: Props) {
  const [open, setOpen] = useState<Record<PanelKey, boolean>>({
    Section: true,
    Author: false,
    "Story Type": false,
    Date: false,
  });
  const [sectionNames, setSectionNames] = useState<string[]>([]);
  const [authors, setAuthors] = useState<string[]>([]);
  const [storyTypes, setStoryTypes] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [moreSection, setMoreSection] = useState(false);
  const [moreAuthor, setMoreAuthor] = useState(false);
  const firstMount = useRef(true);

  useEffect(() => {
    if (firstMount.current) {
      firstMount.current = false;
      return;
    }
    onChange?.({ sectionNames, authors, storyTypes, dateFrom, dateTo });
  }, [sectionNames, authors, storyTypes, dateFrom, dateTo, onChange]);

  const togglePanel = (key: PanelKey) =>
    setOpen({
      Section: false,
      Author: false,
      "Story Type": false,
      Date: false,
      [key]: !open[key],
    });

  const toggleIn = (
    list: string[],
    set: (v: string[]) => void,
    value: string,
  ) =>
    set(
      list.includes(value)
        ? list.filter((v) => v !== value)
        : [...list, value],
    );

  const sections = filterData?.sections ?? [];
  const authorList = filterData?.authors ?? [];
  const typeList = filterData?.storyTypes ?? [];

  const checkboxClass =
    "h-4 w-4 shrink-0 accent-[#3046EB] cursor-pointer";
  const optionRow =
    "flex items-center gap-3 rounded px-2 py-2 cursor-pointer text-14-inter-400 text-333333 hover:bg-F9F9F9";

  const hasSelection =
    sectionNames.length > 0 ||
    authors.length > 0 ||
    storyTypes.length > 0 ||
    !!dateFrom ||
    !!dateTo;

  const clearAll = () => {
    setSectionNames([]);
    setAuthors([]);
    setStoryTypes([]);
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-18-balootamma2-700 text-111111">Filter</h2>
        {hasSelection && (
          <button
            type="button"
            onClick={clearAll}
            className="text-14-inter-500 text-3046EB hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Section */}
      <div className="border-b border-DFDFDF">
        <button
          type="button"
          onClick={() => togglePanel("Section")}
          className="flex w-full items-center justify-between py-3 text-left text-16-manrope-600 text-111111"
        >
          <span>Section</span>
          <Chevron open={open.Section} />
        </button>
        {open.Section &&
          (sections.length > 0 ? (
            <div className="pb-3">
              {sections
                .slice(0, moreSection ? sections.length : 7)
                .map((s) => (
                  <label key={s.id} className={optionRow}>
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={sectionNames.includes(s.name)}
                      onChange={() =>
                        toggleIn(sectionNames, setSectionNames, s.name)
                      }
                    />
                    <span>{s.name}</span>
                  </label>
                ))}
              {sections.length > 7 && (
                <button
                  type="button"
                  onClick={() => setMoreSection(!moreSection)}
                  className="mt-2 text-14-inter-500 text-3046EB hover:underline"
                >
                  {moreSection ? "Show Less" : `${sections.length - 7} More`}
                </button>
              )}
            </div>
          ) : (
            <div className="px-2 pb-3 text-14-inter-400 text-8B95A5">
              No options available
            </div>
          ))}
      </div>

      {/* Author */}
      <div className="border-b border-DFDFDF">
        <button
          type="button"
          onClick={() => togglePanel("Author")}
          className="flex w-full items-center justify-between py-3 text-left text-16-manrope-600 text-111111"
        >
          <span>Author</span>
          <Chevron open={open.Author} />
        </button>
        {open.Author &&
          (authorList.length > 0 ? (
            <div className="pb-3">
              {authorList
                .slice(0, moreAuthor ? authorList.length : 7)
                .map((a) => (
                  <label key={a} className={optionRow}>
                    <input
                      type="checkbox"
                      className={checkboxClass}
                      checked={authors.includes(a)}
                      onChange={() => toggleIn(authors, setAuthors, a)}
                    />
                    <span>{a}</span>
                  </label>
                ))}
              {authorList.length > 7 && (
                <button
                  type="button"
                  onClick={() => setMoreAuthor(!moreAuthor)}
                  className="mt-2 text-14-inter-500 text-3046EB hover:underline"
                >
                  {moreAuthor ? "Show Less" : `${authorList.length - 7} More`}
                </button>
              )}
            </div>
          ) : (
            <div className="px-2 pb-3 text-14-inter-400 text-8B95A5">
              No options available
            </div>
          ))}
      </div>

      {/* Story Type */}
      <div className="border-b border-DFDFDF">
        <button
          type="button"
          onClick={() => togglePanel("Story Type")}
          className="flex w-full items-center justify-between py-3 text-left text-16-manrope-600 text-111111"
        >
          <span>Story Type</span>
          <Chevron open={open["Story Type"]} />
        </button>
        {open["Story Type"] &&
          (typeList.length > 0 ? (
            <div className="pb-3">
              {typeList.map((t) => (
                <label key={t} className={optionRow}>
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={storyTypes.includes(t)}
                    onChange={() => toggleIn(storyTypes, setStoryTypes, t)}
                  />
                  <span className="capitalize">{t}</span>
                </label>
              ))}
            </div>
          ) : (
            <div className="px-2 pb-3 text-14-inter-400 text-8B95A5">
              No options available
            </div>
          ))}
      </div>

      {/* Date */}
      <div className="border-b border-DFDFDF">
        <button
          type="button"
          onClick={() => togglePanel("Date")}
          className="flex w-full items-center justify-between py-3 text-left text-16-manrope-600 text-111111"
        >
          <span>Date</span>
          <Chevron open={open.Date} />
        </button>
        {open.Date && (
          <div className="flex flex-col gap-3 px-2 pb-4">
            <div>
              <label className="mb-1 block text-14-inter-400 text-8B95A5">
                From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded border border-DFDFDF bg-FFFFFF px-3 py-2 text-14-inter-400 text-333333 outline-none focus:border-3046EB"
              />
            </div>
            <div>
              <label className="mb-1 block text-14-inter-400 text-8B95A5">
                To
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded border border-DFDFDF bg-FFFFFF px-3 py-2 text-14-inter-400 text-333333 outline-none focus:border-3046EB"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
