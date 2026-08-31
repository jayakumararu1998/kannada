"use client";

import { useState } from "react";

/** Web-share + copy-link + direct social intents. Client-only (needs window). */
export default function ShareButtons({
  url,
  title,
}: {
  url: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const nativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* user cancelled — fall through to copy */
      }
    }
    copy();
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked */
    }
  };

  const enc = encodeURIComponent;
  const circle =
    "grid h-8 w-8 place-items-center rounded-full text-white transition-transform hover:scale-110";

  return (
    <div className="flex items-center gap-2">
      <a
        className={`${circle} bg-[#25D366]`}
        aria-label="Share on WhatsApp"
        href={`https://wa.me/?text=${enc(`${title} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M12 2a10 10 0 0 0-8.6 15l-1.4 5 5.1-1.3A10 10 0 1 0 12 2Zm5.3 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.8-1.2-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.8s.7-2 .9-2.2c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.3.6-.6.8-.8 1-.2.2-.3.3-.1.6.5.9 1.1 1.5 1.9 2 .3.2.5.1.7-.1.2-.2.6-.7.8-.9.2-.3.3-.2.6-.1.2.1 1.5.7 1.7.8.3.2.4.2.5.3.1.2.1.6-.1 1.1Z"/></svg>
      </a>
      <a
        className={`${circle} bg-black`}
        aria-label="Share on X"
        href={`https://twitter.com/intent/tweet?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current"><path d="M18.9 2H22l-7 8 8.3 12h-6.5l-5-7.4L5.5 22H2.4l7.5-8.6L2 2h6.6l4.6 6.8L18.9 2Zm-2.3 18h1.8L7.5 3.9H5.6L16.6 20Z"/></svg>
      </a>
      <a
        className={`${circle} bg-[#1877F2]`}
        aria-label="Share on Facebook"
        href={`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M13.5 22v-8h2.7l.4-3h-3v-2c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H8v3h2.6v8h2.9Z"/></svg>
      </a>
      <a
        className={`${circle} bg-[#0088cc]`}
        aria-label="Share on Telegram"
        href={`https://t.me/share/url?url=${enc(url)}&text=${enc(title)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M21.9 4.3 18.7 19c-.2 1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 8.9-8c.4-.3-.1-.5-.6-.2L6.4 13 1.7 11.5c-1-.3-1-1 .2-1.5l18.7-7.2c.9-.3 1.6.2 1.3 1.5Z"/></svg>
      </a>
      <button
        type="button"
        onClick={nativeShare}
        className={`${circle} bg-6D6D6D`}
        aria-label="Share"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M18 16a3 3 0 0 0-2.2 1l-6-3.4a3 3 0 0 0 0-1.2l6-3.4a3 3 0 1 0-1-1.7l-6 3.4a3 3 0 1 0 0 4.6l6 3.4A3 3 0 1 0 18 16Z"/></svg>
      </button>
      <button
        type="button"
        onClick={copy}
        className={`${circle} bg-183354`}
        aria-label={copied ? "Link copied" : "Copy link"}
        title={copied ? "Link copied" : "Copy link"}
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current"><path d="M3.9 12a2.1 2.1 0 0 1 2.1-2.1h3V8H6a4 4 0 0 0 0 8h3v-1.9H6A2.1 2.1 0 0 1 3.9 12ZM8 13h8v-2H8v2Zm10-5h-3v1.9h3A2.1 2.1 0 0 1 20.1 12 2.1 2.1 0 0 1 18 14.1h-3V16h3a4 4 0 0 0 0-8Z"/></svg>
        )}
      </button>
    </div>
  );
}
