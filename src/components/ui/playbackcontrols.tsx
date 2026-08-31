"use client";

import { cn } from "@/lib/utils";

type PlaybackControlsProps = {
  isPlaying?: boolean;
  onPrevious?: () => void;
  onTogglePlay?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  playLabel?: string;
  pauseLabel?: string;
  nextLabel?: string;
  className?: string;
};

function PreviousIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
    >
      <path d="M7 5.75C7 5.34 6.66 5 6.25 5S5.5 5.34 5.5 5.75v12.5c0 .41.34.75.75.75S7 18.66 7 18.25V5.75Z" />
      <path d="M18.2 6.38c.5-.34 1.18.02 1.18.62v10c0 .6-.68.96-1.18.62l-7.35-5a.75.75 0 0 1 0-1.24l7.35-5Z" />
    </svg>
  );
}

function NextIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[18px] w-[18px]"
      fill="currentColor"
    >
      <path d="M5.8 6.38C5.3 6.04 4.63 6.4 4.63 7v10c0 .6.67.96 1.17.62l7.35-5a.75.75 0 0 0 0-1.24l-7.35-5Z" />
      <path d="M18.5 5.75c0-.41-.34-.75-.75-.75s-.75.34-.75.75v12.5c0 .41.34.75.75.75s.75-.34.75-.75V5.75Z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="ml-1 h-[28px] w-[28px]"
      fill="currentColor"
    >
      <path d="M8 5.83c0-.65.73-1.03 1.27-.67l9.15 6.17c.48.32.48 1.02 0 1.34l-9.15 6.17A.8.8 0 0 1 8 18.17V5.83Z" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-[28px] w-[28px]"
      fill="currentColor"
    >
      <path d="M8.25 5.25c0-.41.34-.75.75-.75h1.25c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75H9a.75.75 0 0 1-.75-.75V5.25Z" />
      <path d="M13 5.25c0-.41.34-.75.75-.75H15c.41 0 .75.34.75.75v13.5c0 .41-.34.75-.75.75h-1.25a.75.75 0 0 1-.75-.75V5.25Z" />
    </svg>
  );
}

export default function PlaybackControls({
  isPlaying = true,
  onPrevious,
  onTogglePlay,
  onNext,
  previousLabel = "Previous",
  playLabel = "Play",
  pauseLabel = "Pause",
  nextLabel = "Next",
  className,
}: PlaybackControlsProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center gap-[7px]",
        className,
      )}
    >
      <button
        type="button"
        aria-label={previousLabel}
        onClick={onPrevious}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black/35 text-white/90 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-[1px] transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <PreviousIcon />
      </button>

      <button
        type="button"
        aria-label={isPlaying ? pauseLabel : playLabel}
        aria-pressed={isPlaying}
        onClick={onTogglePlay}
        className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-black/45 text-white shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-[1px] transition hover:bg-black/55 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </button>

      <button
        type="button"
        aria-label={nextLabel}
        onClick={onNext}
        className="flex h-[42px] w-[42px] items-center justify-center rounded-full bg-black/35 text-white/90 shadow-[0_6px_18px_rgba(0,0,0,0.18)] backdrop-blur-[1px] transition hover:bg-black/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <NextIcon />
      </button>
    </div>
  );
}
