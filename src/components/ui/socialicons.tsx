import * as React from "react";

import {
  EmailIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  ShareNodesIcon,
  WhatsappIcon,
  XIcon,
  YoutubeIcon,
  type SocialSvgIcon,
} from "@/components/ui/socialIconSvgs";

import { cn } from "@/lib/utils";

export type SocialPlatform =
  | "facebook"
  | "x"
  | "instagram"
  | "youtube"
  | "whatsapp"
  | "linkedin"
  | "email"
  | "share";

export type SocialIconItem = {
  platform: SocialPlatform;
  href: string;
  ariaLabel?: string;
};

type SocialIconsProps = {
  links?: SocialIconItem[];
  className?: string;
  iconClassName?: string;
  size?: "sm" | "md" | "lg";
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

const SOCIAL_ICON_SIZE = {
  sm: "h-6 w-6",
  md: "h-7 w-7",
  lg: "h-8 w-8",
};

const SOCIAL_ICONS = {
  facebook: {
    component: FacebookIcon,
    label: "Facebook",
    className: "bg-[#1877F2] text-white",
  },
  x: {
    component: XIcon,
    label: "X",
    className: "bg-[#000000] text-white",
  },
  instagram: {
    component: InstagramIcon,
    label: "Instagram",
    className: "bg-[#E4405F] text-white",
  },
  youtube: {
    component: YoutubeIcon,
    label: "YouTube",
    className: "bg-[#FF0000] text-white",
  },
  whatsapp: {
    component: WhatsappIcon,
    label: "WhatsApp",
    className: "bg-[#25D366] text-white",
  },
  linkedin: {
    component: LinkedinIcon,
    label: "LinkedIn",
    className: "bg-[#2F70B8] text-white",
  },
  email: {
    component: EmailIcon,
    label: "Email",
    className: "bg-[#E35D5B] text-white",
  },
  share: {
    component: ShareNodesIcon,
    label: "Share",
    className: "bg-E8E8E8 text-111111",
  },
} as const;

type SocialIconConfig = {
  component: SocialSvgIcon;
  label: string;
  className: string;
};

const iconByPlatform: Record<SocialPlatform, SocialIconConfig> = SOCIAL_ICONS;

const SOCIAL_ICON_SIZES = {
  sm: 12,
  md: 14,
  lg: 16,
};

const DEFAULT_LINKS: SocialIconItem[] = [
  { platform: "whatsapp", href: "#" },
  { platform: "x", href: "#" },
  { platform: "facebook", href: "#" },
  { platform: "linkedin", href: "#" },
  { platform: "email", href: "mailto:" },
  { platform: "share", href: "#" },
];

const sanitizeLinks = (links: SocialIconItem[] | undefined) => {
  if (!links || links.length === 0) {
    return DEFAULT_LINKS;
  }
  return links;
};

export default function Socialicons({
  links,
  className,
  iconClassName,
  size = "md",
  target = "_blank",
  rel = "noopener noreferrer",
}: SocialIconsProps) {
  const resolvedLinks = sanitizeLinks(links);

  return (
    <div className={cn("inline-flex items-center gap-[6px]", className)}>
      {resolvedLinks.map((link) => {
        const config = iconByPlatform[link.platform];
        const Icon = config?.component;
        if (!Icon) {
          return null;
        }

        return (
          <a
            key={link.platform}
            href={link.href}
            target={target}
            rel={rel}
            aria-label={link.ariaLabel ?? config.label}
            className={cn(
              "inline-flex items-center justify-center rounded-full border-0 transition-opacity hover:opacity-85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-000000",
              SOCIAL_ICON_SIZE[size],
              config.className,
              iconClassName,
            )}
          >
            <span className="sr-only">{config.label}</span>
            <Icon
              size={SOCIAL_ICON_SIZES[size]}
              aria-hidden="true"
              className="text-current"
            />
          </a>
        );
      })}
    </div>
  );
}
