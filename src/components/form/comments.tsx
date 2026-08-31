"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

export type CommentsFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export type CommentsProps = {
  className?: string;
  title?: CommentsFieldConfig;
  placeholder?: CommentsFieldConfig;
  signIn?: CommentsFieldConfig;
  notificationLabel?: string;
  onSignIn?: () => void;
};

export default function Comments({
  className,
  title = { hidden: false, value: "Comments" },
  placeholder = { hidden: false, value: "Write a comment" },
  signIn = { hidden: false, value: "Sign in" },
  notificationLabel = "Comment notifications",
  onSignIn,
}: CommentsProps) {
  const commentId = useId();

  return (
    <section
      className={cn(
        "w-full bg-[var(--color-FFFFFF)] font-manrope text-111111",
        className,
      )}
      aria-label="Comments"
    >
      <header className="flex items-center justify-between border-b border-[var(--color-808080)] px-5 py-5">
        {!title.hidden && (
          <h2
            className={cn(
              "text-18-manrope-400 font-normal leading-none text-808080",
              title.customClass,
            )}
          >
            {title.value}
          </h2>
        )}

        <button
          type="button"
          className="inline-flex shrink-0 items-center justify-center rounded-full border-0 bg-transparent p-2 text-8B95A5 transition-colors hover:text-111111 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-009EF9)]"
          aria-label={notificationLabel}
        >
          <svg
            className="text-19-manrope-700"
            viewBox="0 0 24 24"
            width="1em"
            height="1em"
            aria-hidden="true"
          >
            <path
              d="M18 9.5V15L20 18H4L6 15V9.5C6 6.2 8.2 3.7 11 3.1V2H13V3.1C15.8 3.7 18 6.2 18 9.5Z"
              fill="currentColor"
            />
            <path
              d="M9.5 19C9.9 20.2 10.8 21 12 21C13.2 21 14.1 20.2 14.5 19H9.5Z"
              fill="currentColor"
            />
          </svg>
        </button>
      </header>

      <form className="px-[22px] pb-[17px] pt-[67px]">
        {!placeholder.hidden && (
          <>
            <label className="sr-only" htmlFor={commentId}>
              {placeholder.value}
            </label>
            <textarea
              id={commentId}
              rows={1}
              className={cn(
                "block w-full resize-none border-0 border-b border-DFDFDF bg-transparent pb-[19px] text-14-manrope-400 leading-none text-111111 outline-none placeholder:text-111111",
                placeholder.customClass,
              )}
              placeholder={placeholder.value}
            />
          </>
        )}

        {!signIn.hidden && (
          <div className="mt-[15px] flex justify-end">
            <button
              type="button"
              className={cn(
                "inline-flex items-center justify-center rounded-[7px] bg-[#0d8df7] px-5 py-3.5 text-14-manrope-600 leading-none text-white transition-colors hover:bg-[#087ee0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0d8df7]",
                signIn.customClass,
              )}
              onClick={onSignIn}
            >
              {signIn.value}
            </button>
          </div>
        )}
      </form>
    </section>
  );
}
