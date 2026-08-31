import type { AuthorSocialLink } from "@/lib/api/stories";

/** Brand colour + SVG path for each supported platform. */
const PLATFORMS: Record<
  string,
  { label: string; bg: string; viewBox?: string; path: string }
> = {
  facebook: {
    label: "Facebook",
    bg: "bg-[#1877F2]",
    path: "M13.5 22v-8h2.7l.4-3h-3v-2c0-.9.3-1.5 1.6-1.5H17V4.1c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.1V11H8v3h2.6v8h2.9Z",
  },
  twitter: {
    label: "X",
    bg: "bg-black",
    path: "M18.9 2H22l-7 8 8.3 12h-6.5l-5-7.4L5.5 22H2.4l7.5-8.6L2 2h6.6l4.6 6.8L18.9 2Zm-2.3 18h1.8L7.5 3.9H5.6L16.6 20Z",
  },
  x: {
    label: "X",
    bg: "bg-black",
    path: "M18.9 2H22l-7 8 8.3 12h-6.5l-5-7.4L5.5 22H2.4l7.5-8.6L2 2h6.6l4.6 6.8L18.9 2Zm-2.3 18h1.8L7.5 3.9H5.6L16.6 20Z",
  },
  instagram: {
    label: "Instagram",
    bg: "bg-[#E1306C]",
    path: "M12 2.2c3.2 0 3.6 0 4.9.1 1.2 0 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.1.4.4 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c0 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.1-1 .4-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2 0-1.8-.3-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.1-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c0-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.1 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 1.8c-3.1 0-3.5 0-4.7.1-1.1 0-1.7.3-2.1.4-.5.2-.9.4-1.3.8-.4.4-.6.8-.8 1.3-.1.4-.4 1-.4 2.1-.1 1.2-.1 1.6-.1 4.7s0 3.5.1 4.7c0 1.1.3 1.7.4 2.1.2.5.4.9.8 1.3.4.4.8.6 1.3.8.4.1 1 .4 2.1.4 1.2.1 1.6.1 4.7.1s3.5 0 4.7-.1c1.1 0 1.7-.3 2.1-.4.5-.2.9-.4 1.3-.8.4-.4.6-.8.8-1.3.1-.4.4-1 .4-2.1.1-1.2.1-1.6.1-4.7s0-3.5-.1-4.7c0-1.1-.3-1.7-.4-2.1-.2-.5-.4-.9-.8-1.3-.4-.4-.8-.6-1.3-.8-.4-.1-1-.4-2.1-.4-1.2-.1-1.6-.1-4.7-.1Zm0 3.1a4.9 4.9 0 1 1 0 9.8 4.9 4.9 0 0 1 0-9.8Zm0 8.1a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0Z",
  },
  linkedin: {
    label: "LinkedIn",
    bg: "bg-[#0A66C2]",
    path: "M6.9 8.8H3.6V21h3.3V8.8ZM5.2 3.5a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8ZM21 21h-3.3v-6c0-1.4-.5-2.4-1.8-2.4-1 0-1.5.7-1.8 1.3-.1.2-.1.5-.1.9V21H10.7s.1-11.1 0-12.2H14v1.7c.4-.7 1.2-1.7 3-1.7 2.2 0 3.9 1.4 3.9 4.5V21Z",
  },
  youtube: {
    label: "YouTube",
    bg: "bg-[#FF0000]",
    path: "M23 7.5a3 3 0 0 0-2.1-2.1C19 4.9 12 4.9 12 4.9s-7 0-8.9.5A3 3 0 0 0 1 7.5C.5 9.4.5 12 .5 12s0 2.6.5 4.5a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-4.5.5-4.5s0-2.6-.5-4.5ZM9.8 15.3V8.7l5.7 3.3-5.7 3.3Z",
  },
  website: {
    label: "Website",
    bg: "bg-6D6D6D",
    path: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm6.9 6h-3a15.7 15.7 0 0 0-1.3-3.4A8 8 0 0 1 18.9 8ZM12 4c.8 1.1 1.4 2.5 1.8 4h-3.6c.4-1.5 1-2.9 1.8-4ZM4.3 14a8 8 0 0 1 0-4h3.4a16.6 16.6 0 0 0 0 4H4.3Zm.8 2h3a15.7 15.7 0 0 0 1.3 3.4A8 8 0 0 1 5.1 16Zm3-8h-3a8 8 0 0 1 4.3-3.4A15.7 15.7 0 0 0 8.1 8ZM12 20c-.8-1.1-1.4-2.5-1.8-4h3.6c-.4 1.5-1 2.9-1.8 4Zm2.2-6H9.8a14.4 14.4 0 0 1 0-4h4.4a14.4 14.4 0 0 1 0 4Zm.5 5.4a15.7 15.7 0 0 0 1.3-3.4h3a8 8 0 0 1-4.3 3.4Zm1.6-5.4a16.6 16.6 0 0 0 0-4h3.4a8 8 0 0 1 0 4h-3.4Z",
  },
};

function iconFor(link: AuthorSocialLink) {
  if (PLATFORMS[link.platform]) return PLATFORMS[link.platform];
  // Fall back to detecting the platform from the URL host.
  const host = (() => {
    try {
      return new URL(link.url).hostname.replace(/^www\./, "");
    } catch {
      return "";
    }
  })();
  if (host.includes("facebook")) return PLATFORMS.facebook;
  if (host.includes("twitter") || host === "x.com") return PLATFORMS.twitter;
  if (host.includes("instagram")) return PLATFORMS.instagram;
  if (host.includes("linkedin")) return PLATFORMS.linkedin;
  if (host.includes("youtube") || host.includes("youtu.be"))
    return PLATFORMS.youtube;
  return PLATFORMS.website;
}

/**
 * The author's own social profile links (from the profile API's `social`
 * object), rendered as brand-coloured icon buttons. Renders nothing when the
 * author has no linked accounts. This is NOT a share widget — each icon opens
 * the author's page on that platform.
 */
export default function AuthorSocialLinks({
  links,
}: {
  links?: AuthorSocialLink[];
}) {
  if (!links || links.length === 0) return null;
  return (
    <div className="flex items-center gap-2">
      {links.map((link) => {
        const p = iconFor(link);
        return (
          <a
            key={link.url}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={p.label}
            title={p.label}
            className={`grid h-8 w-8 place-items-center rounded-full text-white transition-transform hover:scale-110 ${p.bg}`}
          >
            <svg viewBox={p.viewBox || "0 0 24 24"} className="h-4 w-4 fill-current">
              <path d={p.path} />
            </svg>
          </a>
        );
      })}
    </div>
  );
}
