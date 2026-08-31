import Image from "next/image";

import { DEFAULT_THUMBNAIL_IMAGE } from "@/lib/images";
import { cn } from "@/lib/utils";

export type TwitterFieldConfig = {
  hidden?: boolean;
  value?: string;
  customClass?: string;
};

export type TwitterProps = {
  className?: string;
  author?: TwitterFieldConfig;
  handle?: TwitterFieldConfig;
  followLabel?: TwitterFieldConfig;
  hashtag?: TwitterFieldConfig;
  content?: TwitterFieldConfig;
  showMoreLabel?: TwitterFieldConfig;
  watchLabel?: TwitterFieldConfig;
  time?: TwitterFieldConfig;
  date?: TwitterFieldConfig;
  likeCount?: TwitterFieldConfig;
  replyLabel?: TwitterFieldConfig;
  copyLabel?: TwitterFieldConfig;
  repliesLabel?: TwitterFieldConfig;
  avatarSrc?: string;
  avatarAlt?: string;
  mediaSrc?: string;
  mediaAlt?: string;
  priority?: boolean;
};

const DEFAULT_AVATAR =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><rect width='48' height='48' fill='#111'/><rect x='5' y='5' width='38' height='38' fill='#fff'/><rect x='9' y='9' width='30' height='30' fill='#111'/><text x='24' y='30' text-anchor='middle' font-family='Arial,sans-serif' font-size='13' font-weight='700' fill='#fff'>ANI</text></svg>",
  );

const DEFAULT_MEDIA = DEFAULT_THUMBNAIL_IMAGE;

const BLUR_PLACEHOLDER =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

export default function Twitter({
  className,
  author = { hidden: false, value: "ANI" },
  handle = { hidden: false, value: "@ANI" },
  followLabel = { hidden: false, value: "Follow" },
  hashtag = { hidden: false, value: "#WATCH" },
  content = {
    hidden: false,
    value:
      ' | Delhi: Karnataka CM-designate DK Shivakumar says, "The faith and the confidence the people of this country have shown me, I am very much obliged, and I have to do a lot of hard work and deliver. I know roads will not be so easy. It will be difficult times, but still I',
  },
  showMoreLabel = { hidden: false, value: "Show more" },
  watchLabel = { hidden: false, value: "Watch on X" },
  time = { hidden: false, value: "6:39 PM" },
  date = { hidden: false, value: "Jun 2, 2026" },
  likeCount = { hidden: false, value: "44" },
  replyLabel = { hidden: false, value: "Reply" },
  copyLabel = { hidden: false, value: "Copy link" },
  repliesLabel = { hidden: false, value: "Read 5 replies" },
  avatarSrc = DEFAULT_AVATAR,
  avatarAlt = "ANI avatar",
  mediaSrc = DEFAULT_MEDIA,
  mediaAlt = "Tweet video thumbnail",
  priority = false,
}: TwitterProps) {
  return (
    <article
      className={cn(
        "w-full overflow-hidden border border-D2D2D2 bg-[var(--color-FFFFFF)] px-4 pb-4 pt-3 font-inter text-111111",
        className,
      )}
    >
      <header className="flex items-start gap-2">
        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-[4px] bg-[var(--color-E8E8E8)]">
          <Image
            src={avatarSrc}
            alt={avatarAlt}
            fill
            priority={priority}
            sizes="48px"
            className="object-cover object-center"
            unoptimized={avatarSrc.startsWith("data:")}
          />
        </div>

        <div className="min-w-0 flex-1 pt-1">
          <div className="flex items-center gap-1">
            {!author.hidden && author.value && (
              <span
                className={cn(
                  "text-15-inter-700 leading-100 text-000000",
                  author.customClass,
                )}
              >
                {author.value}
              </span>
            )}
            <span
              className="inline-flex h-[15px] w-[15px] items-center justify-center rounded-full bg-[#ffd43b]"
              aria-label="Verified"
              role="img"
            >
              <svg
                className="h-2.5 w-2.5 text-black"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M4.8 8.8L2.4 6.4L3.3 5.5L4.8 7L8.7 3.1L9.6 4L4.8 8.8Z"
                  fill="currentColor"
                />
              </svg>
            </span>
          </div>

          <div className="mt-1 flex items-center gap-1">
            {!handle.hidden && handle.value && (
              <span
                className={cn(
                  "text-15-inter-400 leading-100 text-6F6F6F",
                  handle.customClass,
                )}
              >
                {handle.value}
              </span>
            )}
            {!followLabel.hidden && followLabel.value && (
              <span
                className={cn(
                  "text-15-inter-700 leading-100 text-009EF9",
                  followLabel.customClass,
                )}
              >
                - {followLabel.value}
              </span>
            )}
          </div>
        </div>

        <svg
          className="mt-1 h-6 w-6 shrink-0 text-000000"
          viewBox="0 0 24 24"
          fill="none"
          aria-label="X"
          role="img"
        >
          <path
            d="M14.6 10.2L22.5 1H20.6L13.8 8.9L8.3 1H2L10.3 13L2 22.6H3.9L11.1 14.3L16.8 22.6H23.1L14.6 10.2ZM12.1 13.1L11.2 11.9L4.6 2.4H7.4L12.8 10.1L13.6 11.3L20.6 21.3H17.8L12.1 13.1Z"
            fill="currentColor"
          />
        </svg>
      </header>

      {(!hashtag.hidden || !content.hidden || !showMoreLabel.hidden) && (
        <p className="mt-3 text-20-inter-400 leading-128 text-333333">
          {!hashtag.hidden && hashtag.value && (
            <span className={cn("text-009EF9", hashtag.customClass)}>
              {hashtag.value}
            </span>
          )}
          {!content.hidden && content.value && (
            <span className={content.customClass}>{content.value} </span>
          )}
          {!showMoreLabel.hidden && showMoreLabel.value && (
            <span className={cn("text-009EF9", showMoreLabel.customClass)}>
              {showMoreLabel.value}
            </span>
          )}
        </p>
      )}

      <div className="relative mt-[11px] aspect-[514/291] w-full overflow-hidden bg-[var(--color-E8E8E8)]">
        <Image
          src={mediaSrc}
          alt={mediaAlt}
          fill
          priority={priority}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          sizes="(max-width: 1025px) 100vw, 1025px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-cover object-center"
          unoptimized={mediaSrc.startsWith("data:")}
        />

        {!watchLabel.hidden && watchLabel.value && (
          <span
            className={cn(
              "absolute right-2 top-3 rounded-full bg-[rgba(0,0,0,0.72)] px-4 py-2 text-13-inter-700 leading-100 text-FFFFFF",
              watchLabel.customClass,
            )}
          >
            {watchLabel.value}
          </span>
        )}

        <span
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[3px] border-white/90 bg-[#1d9bf0] text-FFFFFF"
          aria-label="Play video"
          role="img"
        >
          <svg
            className="ml-1 h-8 w-8"
            viewBox="0 0 16 18"
            fill="none"
            aria-hidden="true"
          >
            <path d="M16 9L0 18V0L16 9Z" fill="currentColor" />
          </svg>
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between border-b border-D2D2D2 pb-[9px] text-14-inter-400 leading-100 text-6F6F6F">
        <div className="flex items-center gap-1">
          {!time.hidden && time.value && (
            <span className={time.customClass}>{time.value}</span>
          )}
          {!time.hidden && !date.hidden && <span>-</span>}
          {!date.hidden && date.value && (
            <span className={date.customClass}>{date.value}</span>
          )}
        </div>

        <span
          className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-6F6F6F text-13-inter-700 leading-100"
          aria-label="Info"
          role="img"
        >
          i
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-3 text-14-inter-700 leading-100 text-6F6F6F">
        <div className="flex items-center gap-2">
          <svg
            className="h-5 w-5"
            style={{ color: "#f91880" }}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M10 17.4L8.8 16.3C4.6 12.5 1.8 10 1.8 6.9C1.8 4.4 3.8 2.4 6.3 2.4C7.7 2.4 9.1 3.1 10 4.2C10.9 3.1 12.3 2.4 13.7 2.4C16.2 2.4 18.2 4.4 18.2 6.9C18.2 10 15.4 12.5 11.2 16.3L10 17.4Z"
              fill="currentColor"
            />
          </svg>
          {!likeCount.hidden && likeCount.value && (
            <span className={likeCount.customClass}>{likeCount.value}</span>
          )}
        </div>

        {!replyLabel.hidden && replyLabel.value && (
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-009EF9"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 3C5.6 3 2 5.8 2 9.3C2 11.2 3.1 12.9 4.8 14.1L4.1 17.2L7.6 15.4C8.4 15.5 9.2 15.7 10 15.7C14.4 15.7 18 12.9 18 9.3C18 5.8 14.4 3 10 3Z"
                fill="currentColor"
              />
            </svg>
            <span className={replyLabel.customClass}>{replyLabel.value}</span>
          </div>
        )}

        {!copyLabel.hidden && copyLabel.value && (
          <div className="flex items-center gap-2">
            <svg
              className="h-5 w-5 text-6F6F6F"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M7.5 12.5L12.5 7.5M8.4 5.1L9.7 3.8C11.1 2.4 13.4 2.4 14.8 3.8C16.2 5.2 16.2 7.5 14.8 8.9L13.5 10.2M6.5 9.8L5.2 11.1C3.8 12.5 3.8 14.8 5.2 16.2C6.6 17.6 8.9 17.6 10.3 16.2L11.6 14.9"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              />
            </svg>
            <span className={copyLabel.customClass}>{copyLabel.value}</span>
          </div>
        )}
      </div>

      {!repliesLabel.hidden && repliesLabel.value && (
        <div className="mt-4 rounded-full border border-D2D2D2 py-2 text-center text-14-inter-700 leading-100 text-009EF9">
          <span className={repliesLabel.customClass}>{repliesLabel.value}</span>
        </div>
      )}
    </article>
  );
}
